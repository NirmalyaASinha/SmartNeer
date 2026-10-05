// Web Audio API sound synthesizer for critical alert beeps

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playCriticalAlertBeep() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Two-tone warning beep (880Hz -> 659Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(660, now + 0.15);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      // Repeat second pulse
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(880, now + 0.4);
      osc2.frequency.setValueAtTime(660, now + 0.55);

      gain2.gain.setValueAtTime(0.2, now + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc2.start(now + 0.4);
      osc2.stop(now + 0.75);
    } catch {
      // Browser autoplay policy might block if no user interaction yet
    }
  }

  public playAcknowledgeChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio failure
    }
  }
}

export const soundManager = new SoundService();
