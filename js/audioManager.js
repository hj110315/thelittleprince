import { store } from './store.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;

    this.bindEvents();
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  bindEvents() {
    // Resume Audio Context on first user interaction
    const unlockAudio = () => {
      this.initContext();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // Subscribe to app events for sound cues
    store.subscribe('task:updated', (data) => {
      if (data.completed === 1) {
        this.playTaskChime();
      }
    });

    store.subscribe('flight:completed', () => {
      this.playFlightSuccessFanfare();
    });

    store.subscribe('planet:selected', () => {
      this.playSoftClick();
    });
  }

  // Soft Parchment/Wood Click
  playSoftClick() {
    if (this.muted) return;
    this.initContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Starlight Task Completion Chime (Ascending Harmonics)
  playTaskChime() {
    if (this.muted) return;
    this.initContext();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.35);
    });
  }

  // Flight Completion Celestial Fanfare
  playFlightSuccessFanfare() {
    if (this.muted) return;
    this.initContext();

    const chords = [440, 554.37, 659.25]; // A major celestial pad
    chords.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    });
  }
}
