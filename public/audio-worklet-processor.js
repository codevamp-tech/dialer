/**
 * audio-worklet-processor.js
 * AudioWorklet processor for real-time mic capture → 8kHz μ-law encoding.
 *
 * Runs on a dedicated high-priority audio thread, NOT the main UI thread.
 * Receives 128-sample Float32 frames at the AudioContext's native sample rate,
 * downsamples to 8kHz, encodes to ITU-T G.711 μ-law, and posts 160-byte
 * (20ms) frames to the main thread for WebSocket transmission.
 */

// ── ITU-T G.711 μ-law encoder ───────────────────────────────────────────────
const MULAW_BIAS = 33;
const MULAW_MAX = 32767;

function linearToMuLaw(sample) {
  // Clamp to 16-bit signed range
  if (sample > MULAW_MAX)  sample = MULAW_MAX;
  if (sample < -MULAW_MAX) sample = -MULAW_MAX;

  const sign = sample < 0 ? 0x80 : 0;
  const magnitude = Math.abs(sample) + MULAW_BIAS;

  // Segment lookup using binary search (ITU-T standard)
  let exponent = 7;
  let mask = 0x4000;
  for (; exponent > 0; exponent--, mask >>= 1) {
    if (magnitude & mask) break;
  }
  const mantissa = (magnitude >> (exponent + 3)) & 0x0F;
  const mulaw = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  return mulaw;
}

// ── Processor ───────────────────────────────────────────────────────────────
class MicCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    // The AudioContext's actual sample rate (48000, 44100, etc.)
    this.srcRate = sampleRate; // global in AudioWorkletGlobalScope
    this.ratio = this.srcRate / 8000;

    // Resampling state — fractional index accumulator for smooth downsampling
    this.resampleIndex = 0;

    // Output buffer — accumulate until we have a full 160-byte (20ms) frame
    this.frameBuffer = new Uint8Array(160);
    this.frameOffset = 0;

    // Mute flag — controlled via port messages from the main thread
    this.muted = false;

    // --- Noise Gate State ---
    // Lower threshold: 0.008 catches more speech without too much bleed
    this.threshold = 0.008;
    this.attack  = 0.1;    // Attack rate: opens fast (10 samples = 1.25ms)
    this.release = 0.005;  // Release rate: closes slowly (200 samples = 25ms)
    this.currentGain = 0;  // Current multiplier (0..1)

    // Hold: keep gate OPEN for 300ms after speech drops below threshold.
    // CRITICAL: use `sampleRate` (the native AudioContext rate = 48000Hz),
    // NOT 8000 — because process() blocks arrive at the native rate.
    // Previous bug: 8000*0.3=2400, decremented by 128/block → only 50ms hold!
    // Correct:   48000*0.3=14400, decremented by 128/block → proper 300ms hold.
    this.holdSamples = Math.round(sampleRate * 0.30); // 300ms @ native rate
    this.holdCounter = 0; // counts down from holdSamples


    this.port.onmessage = (e) => {
      if (e.data.type === 'mute')   this.muted = true;
      if (e.data.type === 'unmute') this.muted = false;
      if (e.data.type === 'setThreshold') this.threshold = e.data.value;
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // Float32Array, 128 samples at srcRate

    if (this.muted) {
      // When muted, fill with μ-law silence (0xFF) at the correct rate
      const silenceSamples = Math.floor(samples.length / this.ratio);
      for (let i = 0; i < silenceSamples; i++) {
        this.frameBuffer[this.frameOffset++] = 0xFF; // μ-law digital silence
        if (this.frameOffset === 160) {
          this.port.postMessage(this.frameBuffer);
          this.frameBuffer = new Uint8Array(160);
          this.frameOffset = 0;
        }
      }
      return true;
    }

    // --- Noise Gate Logic ---
    // 1. Calculate RMS of this block
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);

    // 2. Determine target gain with hold logic:
    //    - If speech is above threshold: open gate + reset hold counter
    //    - If speech below threshold but hold counter > 0: keep gate open
    //    - If hold counter reached 0: let gain fall (targetGain = 0)
    const aboveThreshold = rms > this.threshold;
    if (aboveThreshold) {
      this.holdCounter = this.holdSamples; // reset hold
    } else if (this.holdCounter > 0) {
      this.holdCounter -= samples.length; // decrement hold
    }
    const gateOpen = aboveThreshold || this.holdCounter > 0;
    const targetGain = gateOpen ? 1.0 : 0.0;

    // Downsample from srcRate to 8kHz and encode to μ-law
    for (let i = 0; i < samples.length; i++) {
      // 3. Smoothly interpolate gain to prevent "clicking"
      if (this.currentGain < targetGain) {
        this.currentGain = Math.min(1.0, this.currentGain + this.attack);
      } else if (this.currentGain > targetGain) {
        this.currentGain = Math.max(0.0, this.currentGain - this.release);
      }

      this.resampleIndex++;
      if (this.resampleIndex >= this.ratio) {
        this.resampleIndex -= this.ratio;

        // Apply noise gate gain
        const s = samples[i] * this.currentGain;

        // Convert float32 (-1..1) to int16 (-32768..32767)
        const pcm16 = Math.max(-32768, Math.min(32767, Math.round(s * 32767)));

        // Encode to μ-law
        this.frameBuffer[this.frameOffset++] = linearToMuLaw(pcm16);

        // When we have a full 20ms frame (160 bytes at 8kHz), send it
        if (this.frameOffset === 160) {
          this.port.postMessage(this.frameBuffer);
          this.frameBuffer = new Uint8Array(160);
          this.frameOffset = 0;
        }
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('mic-capture-processor', MicCaptureProcessor);
