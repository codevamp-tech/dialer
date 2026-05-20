// src/hooks/useManualCall.js
// ═══════════════════════════════════════════════════════════════════════════
// Professional-grade manual call hook for the Dialer application.
//
// Audio pipeline:
//   MIC → AudioWorklet (off-thread) → 8kHz μ-law 160-byte frames → WebSocket
//   WebSocket → μ-law decode → AudioBufferSource scheduling → speakers
//
// Key design choices for low latency:
//   • AudioWorklet for mic capture — runs on dedicated audio thread (~3ms)
//   • No batching on playback — each 20ms packet plays immediately
//   • 20ms jitter buffer lead (not 80ms)
//   • WebRTC constraints: echoCancellation + noiseSuppression + autoGainControl
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ── μ-law decode (ITU-T G.711) ─────────────────────────────────────────────
function decodeMuLaw(byte) {
  byte = ~byte & 0xFF;
  const sign = byte & 0x80 ? -1 : 1;
  const exponent = (byte >> 4) & 0x07;
  const mantissa = byte & 0x0F;
  const magnitude = ((mantissa << 1) | 1) << (exponent + 2);
  return sign * (magnitude - 33);
}

function decodeMuLawToFloat32(ulaw) {
  const out = new Float32Array(ulaw.length);
  for (let i = 0; i < ulaw.length; i++) {
    out[i] = decodeMuLaw(ulaw[i]) / 32768;
  }
  return out;
}

// ── A-law decode (ITU-T G.711) ─────────────────────────────────────────────────
// Eliminates the double-conversion path that caused the 'bharbhara' crackling:
//   Before: A-law → PCM16 → μ-law (server) → Float32 (browser) ─ 2 quantisation steps
//   After:  A-law → Float32 (browser only) ─────────────── 1 quantisation step
function decodeAlaw(byte) {
  byte ^= 0x55; // A-law XOR mask
  const sign  = (byte & 0x80) ? 1 : -1;
  byte &= 0x7F;
  let magnitude;
  if (byte >= 0x10) {
    const exponent = (byte >> 4) & 0x07;
    const mantissa = byte & 0x0F;
    magnitude = ((mantissa << 1) | 1) << (exponent + 2);
  } else {
    magnitude = (byte << 1) | 1;
  }
  return sign * magnitude;
}

function decodeAlawToFloat32(alaw) {
  const out = new Float32Array(alaw.length);
  for (let i = 0; i < alaw.length; i++) {
    out[i] = decodeAlaw(alaw[i]) / 32768;
  }
  return out;
}

// ── Derive WS URL from HTTP API base ───────────────────────────────────────
function getWsUrl(path) {
  const base = API_BASE.replace(/\/$/, '');
  return base.replace(/^http/, 'ws') + path;
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useManualCall() {
  const [state, setState] = useState({
    status: 'idle',      // idle | connecting | ringing | live | ending | ended
    internalCallId: null,
    toNumber: null,
    duration: 0,
    isMuted: false,
    error: null,
  });

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const micWorkletRef = useRef(null);
  const micSourceRef = useRef(null);
  const playbackWorkletRef = useRef(null); // AudioWorklet for incoming SIP audio
  const playbackNodeRef = useRef(null);    // AudioWorkletNode for incoming playback
  const sipCodecRef = useRef(0);          // 0=PCMU(μ-law), 8=PCMA(A-law) — from call_answered
  const timerRef = useRef(null);
  const isMutedRef = useRef(false);
  const statusRef = useRef('idle');
  const nextPlayTimeRef = useRef(0);

  // ── Cleanup helpers ────────────────────────────────────────────────────
  const cleanupAudio = useCallback(() => {
    if (micWorkletRef.current) {
      try { micWorkletRef.current.disconnect(); } catch {}
      micWorkletRef.current = null;
    }
    if (micSourceRef.current) {
      try { micSourceRef.current.disconnect(); } catch {}
      micSourceRef.current = null;
    }
    if (playbackNodeRef.current) {
      try { playbackNodeRef.current.disconnect(); } catch {}
      playbackNodeRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    nextPlayTimeRef.current = 0;
  }, []);

  const cleanupWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  const teardown = useCallback((reason) => {
    cleanupAudio();
    cleanupWs();
    setState(prev => ({
      ...prev,
      status: 'ended',
      error: reason || null,
    }));
    statusRef.current = 'ended';
  }, [cleanupAudio, cleanupWs]);

  // ── Play incoming audio via AudioWorklet ring buffer ───────────────────────
  // Codec-aware: uses the codec from call_answered to decode directly.
  // A-law path: A-law → Float32 (1 step, clean)
  // μ-law path: μ-law → Float32 (1 step, clean)
  const playAudioBuffer = useCallback((rawBytes) => {
    if (!playbackNodeRef.current) return;
    if (rawBytes.length === 0) return;

    // Decode using the SIP codec negotiated at call answer time
    const pcm = sipCodecRef.current === 8
      ? decodeAlawToFloat32(rawBytes)   // PCMA → Float32 (direct, no re-encoding)
      : decodeMuLawToFloat32(rawBytes); // PCMU → Float32

    // Transfer buffer ownership to AudioWorklet thread (zero-copy)
    playbackNodeRef.current.port.postMessage(pcm, [pcm.buffer]);
  }, []);

  // ── Start Call ─────────────────────────────────────────────────────────
  const startCall = useCallback(async (to, phoneNumberId, opts = {}) => {
    if (state.status !== 'idle' && state.status !== 'ended') return;

    setState(prev => ({ ...prev, status: 'connecting', error: null, toNumber: to, duration: 0 }));
    statusRef.current = 'connecting';

    try {
      // 1. Start call on server
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/api/manual-calls/start`, {
        to,
        phoneNumberId,
        campaignId: opts.campaignId || null,
        leadId: opts.leadId || null,
        customerName: opts.customerName || '',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to start call');
      }

      const { internalCallId } = response.data;

      // 2. Get mic with professional audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Legacy Google-specific constraints (often more aggressive)
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googAudioMirroring: false,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression2: true,
          latency: { ideal: 0.005 },
          channelCount: 1,
          sampleRate: 48000,
        },
        video: false,
      });
      micStreamRef.current = stream;

      // 3. Create AudioContext at native rate
      const ctx = new AudioContext({ sampleRate: 48000 });
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      // 4. Load BOTH AudioWorklets — mic capture + incoming playback
      await ctx.audioWorklet.addModule('/audio-worklet-processor.js');
      await ctx.audioWorklet.addModule('/playback-worklet-processor.js');

      const micSource = ctx.createMediaStreamSource(stream);
      micSourceRef.current = micSource;

      // 5. Add a High-Pass filter to remove low-end background rumble (below 150Hz)
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 150;
      hpf.Q.value = 1;

      // 6. Set up mic capture worklet
      const micWorklet = new AudioWorkletNode(ctx, 'mic-capture-processor');
      micWorkletRef.current = micWorklet;

      // 7. Set up playback worklet (ring buffer for incoming SIP audio)
      const playbackNode = new AudioWorkletNode(ctx, 'playback-processor');
      playbackNodeRef.current = playbackNode;
      playbackNode.connect(ctx.destination);

      // Pipeline: Mic -> HPF -> Worklet
      micSource.connect(hpf);
      hpf.connect(micWorklet);

      // 6. Open WebSocket
      const wsUrl = getWsUrl('/ws/manual-call');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      // 7. WS handshake and audio loop
      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          ws.send(JSON.stringify({ event: 'init', internalCallId, token }));
        };

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);

              if (msg.event === 'initialized') {
                // WS authenticated — wire mic to WS now
                micWorklet.port.onmessage = (e) => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(e.data.buffer);
                  }
                };
                // Show "ringing" state
                setState(prev => ({ ...prev, status: 'ringing', internalCallId }));
                statusRef.current = 'ringing';
                resolve();
                return;
              }

              if (msg.event === 'call_answered') {
                // Save the SIP codec for codec-aware decoding
                // 0 = PCMU (μ-law), 8 = PCMA (A-law)
                sipCodecRef.current = msg.codec ?? 0;
                // SIP call answered — transition to live
                setState(prev => ({ ...prev, status: 'live', internalCallId }));
                statusRef.current = 'live';
                if (!timerRef.current) {
                  timerRef.current = setInterval(() => {
                    setState(prev => ({ ...prev, duration: prev.duration + 1 }));
                  }, 1000);
                }
                return;
              }

              if (msg.event === 'call_ended') {
                teardown();
                return;
              }

              if (msg.event === 'error') {
                reject(new Error(msg.error || 'WebSocket error'));
                return;
              }
            } catch {
              // not JSON
            }
          } else {
            // Binary: incoming μ-law audio from remote party — play immediately
            const muLawBytes = new Uint8Array(event.data);
            if (muLawBytes.length > 0) {
              playAudioBuffer(muLawBytes);
            }
          }
        };

        ws.onerror = () => reject(new Error('WebSocket connection failed'));

        ws.onclose = () => {
          if (statusRef.current === 'live' || statusRef.current === 'connecting' || statusRef.current === 'ringing') {
            teardown('Connection lost');
          }
        };

        setTimeout(() => reject(new Error('Call setup timed out after 60s')), 60000);
      });

    } catch (err) {
      cleanupAudio();
      cleanupWs();
      setState(prev => ({
        ...prev,
        status: 'ended',
        error: err.response?.data?.error || err.message || 'Failed to start call',
      }));
      statusRef.current = 'ended';
    }
  }, [state.status, cleanupAudio, cleanupWs, playAudioBuffer, teardown]);

  // ── End Call ───────────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    if (state.status === 'idle' || state.status === 'ending' || state.status === 'ended') return;

    setState(prev => ({ ...prev, status: 'ending' }));
    statusRef.current = 'ending';

    const { internalCallId } = state;

    // Signal server via WS
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify({ event: 'end' })); } catch {}
    }

    // Also HTTP hangup
    if (internalCallId) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_BASE}/api/manual-calls/end`, { internalCallId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }

    teardown();
  }, [state, teardown]);

  // ── Toggle Mute ───────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    // Mute at the worklet level
    if (micWorkletRef.current) {
      micWorkletRef.current.port.postMessage({
        type: isMutedRef.current ? 'mute' : 'unmute'
      });
    }
    // Also mute the underlying media tracks
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !isMutedRef.current;
      });
    }
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // ── Clear Error ───────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanupAudio();
      cleanupWs();
    };
  }, [cleanupAudio, cleanupWs]);

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
    clearError,
  };
}
