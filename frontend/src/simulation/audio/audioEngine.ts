/**
 * Web Audio API Engine for Active Buzzer, Passive Buzzer, and MAX98357A I2S Audio
 */

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private masterVolume: number = 0.3;

  // Active buzzer oscillator
  private activeBuzzerOsc: OscillatorNode | null = null;
  private activeBuzzerGain: GainNode | null = null;

  // Passive buzzer oscillator
  private passiveBuzzerOsc: OscillatorNode | null = null;
  private passiveBuzzerGain: GainNode | null = null;

  // MAX98357A I2S Synthesizer
  private i2sOsc: OscillatorNode | null = null;
  private i2sGain: GainNode | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private initContext(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  // Active Buzzer: 2.3 kHz fixed tone
  public setActiveBuzzer(sounding: boolean): void {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (sounding) {
      if (!this.activeBuzzerOsc) {
        this.activeBuzzerOsc = this.ctx.createOscillator();
        this.activeBuzzerGain = this.ctx.createGain();
        this.activeBuzzerOsc.type = 'square';
        this.activeBuzzerOsc.frequency.setValueAtTime(2300, this.ctx.currentTime);
        this.activeBuzzerGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.activeBuzzerOsc.connect(this.activeBuzzerGain);
        this.activeBuzzerGain.connect(this.masterGain);
        this.activeBuzzerOsc.start();
      }
    } else {
      if (this.activeBuzzerOsc) {
        try {
          this.activeBuzzerOsc.stop();
          this.activeBuzzerOsc.disconnect();
        } catch (_) {}
        this.activeBuzzerOsc = null;
        this.activeBuzzerGain = null;
      }
    }
  }

  // Passive Buzzer: Variable frequency
  public setPassiveBuzzer(freqHz: number, dutyCycle: number = 0.5): void {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (freqHz > 20 && freqHz < 20000 && dutyCycle > 0) {
      if (!this.passiveBuzzerOsc) {
        this.passiveBuzzerOsc = this.ctx.createOscillator();
        this.passiveBuzzerGain = this.ctx.createGain();
        this.passiveBuzzerOsc.type = 'triangle';
        this.passiveBuzzerOsc.frequency.setValueAtTime(freqHz, this.ctx.currentTime);
        this.passiveBuzzerGain.gain.setValueAtTime(dutyCycle * 0.5, this.ctx.currentTime);
        this.passiveBuzzerOsc.connect(this.passiveBuzzerGain);
        this.passiveBuzzerGain.connect(this.masterGain);
        this.passiveBuzzerOsc.start();
      } else {
        this.passiveBuzzerOsc.frequency.setValueAtTime(freqHz, this.ctx.currentTime);
        if (this.passiveBuzzerGain) {
          this.passiveBuzzerGain.gain.setValueAtTime(dutyCycle * 0.5, this.ctx.currentTime);
        }
      }
    } else {
      if (this.passiveBuzzerOsc) {
        try {
          this.passiveBuzzerOsc.stop();
          this.passiveBuzzerOsc.disconnect();
        } catch (_) {}
        this.passiveBuzzerOsc = null;
        this.passiveBuzzerGain = null;
      }
    }
  }

  // MAX98357A I2S Audio
  public setI2SAudio(active: boolean, toneHz: number = 440): void {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (active) {
      if (!this.i2sOsc) {
        this.i2sOsc = this.ctx.createOscillator();
        this.i2sGain = this.ctx.createGain();
        this.i2sOsc.type = 'sine';
        this.i2sOsc.frequency.setValueAtTime(toneHz, this.ctx.currentTime);
        this.i2sGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        this.i2sOsc.connect(this.i2sGain);
        this.i2sGain.connect(this.masterGain);
        this.i2sOsc.start();
      } else {
        this.i2sOsc.frequency.setValueAtTime(toneHz, this.ctx.currentTime);
      }
    } else {
      if (this.i2sOsc) {
        try {
          this.i2sOsc.stop();
          this.i2sOsc.disconnect();
        } catch (_) {}
        this.i2sOsc = null;
        this.i2sGain = null;
      }
    }
  }

  public stopAll(): void {
    this.setActiveBuzzer(false);
    this.setPassiveBuzzer(0, 0);
    this.setI2SAudio(false);
  }
}
