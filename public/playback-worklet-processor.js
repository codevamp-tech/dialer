/**
 * playback-worklet-processor.js
 * AudioWorklet processor for low-latency, jitter-robust playback of incoming
 * 8kHz μ-law audio from the SIP call.
 *
 * Design:
 *  - Ring buffer (4 seconds at 8kHz = 32000 samples) absorbs network jitter
 *  - Linear interpolation upsamples 8kHz → native AudioContext rate (48kHz)
 *  - Adaptive clock: if buffer runs critically low, we slow output slightly
 *    to stretch without glitching (instead of hard underrun silence)
 *  - Overflow protection: if buffer > 2s ahead, drops oldest samples
 *
 * The main thread pushes decoded Float32 PCM (at 8kHz) via port.postMessage().
 */

const RING_SIZE  = 32000; // 4 seconds at 8kHz — generous jitter absorption
const MAX_FILL   = 24000; // 3 seconds max — beyond this, we're very late


class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.ring      = new Float32Array(RING_SIZE);
    this.writePos  = 0;
    this.readPos   = 0;
    this.available = 0;
    this.fadeGain  = 0;     // Smooth fade in/out — starts at 0, ramps to 1
    this.lastSample = 0;    // Held for underrun fade-out

    // Upsampling ratio: for each output sample, advance this many source samples
    // e.g. 8000/48000 = 0.16667 — meaning ~6 output samples per 1 source sample
    this.step  = 8000 / sampleRate;
    this.phase = 0;

    this.port.onmessage = (e) => {
      const samples = e.data; // Float32Array at 8kHz
      if (!samples || !samples.length) return;

      const len = samples.length;

      // Overflow protection: if we're already > MAX_FILL ahead, drop oldest
      if (this.available + len > MAX_FILL) {
        const drop = (this.available + len) - MAX_FILL;
        this.readPos  = (this.readPos + drop) % RING_SIZE;
        this.available = Math.max(0, this.available - drop);
      }

      for (let i = 0; i < len; i++) {
        this.ring[this.writePos] = samples[i];
        this.writePos = (this.writePos + 1) % RING_SIZE;
      }
      this.available += len;
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const out = output[0]; // mono, 128 samples at native rate

    for (let i = 0; i < out.length; i++) {
      if (this.available < 2) {
        // Buffer underrun: fade out smoothly instead of hard-cut to 0.
        // Hard-cut caused a click every time the ring buffer briefly ran dry.
        this.fadeGain = Math.max(0, (this.fadeGain || 0) - 0.01);
        out[i] = (this.lastSample || 0) * this.fadeGain;
        continue;
      }

      // Fade back in after underrun
      if (this.fadeGain < 1.0) {
        this.fadeGain = Math.min(1.0, (this.fadeGain || 0) + 0.05);
      }

      // ── Linear interpolation between two nearest source samples ──
      const curr = this.ring[this.readPos];
      const next = this.ring[(this.readPos + 1) % RING_SIZE];
      const sample = curr + (next - curr) * this.phase;
      out[i] = sample * this.fadeGain;
      this.lastSample = sample;

      // ── Adaptive rate: slow down slightly when buffer critically low ──
      const slowFactor = this.available < 320 ? 0.98 : 1.0;
      this.phase += this.step * slowFactor;

      // Consume source samples when we've passed them
      while (this.phase >= 1.0) {
        this.phase -= 1.0;
        this.readPos = (this.readPos + 1) % RING_SIZE;
        this.available = Math.max(0, this.available - 1);
        if (this.available < 2) {
          this.phase = 0;
          break;
        }
      }
    }

    return true;
  }
}

registerProcessor('playback-processor', PlaybackProcessor);
