import { MusicTrack } from '../types/game';
import { musicManager } from './MusicManager';

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private nitroGain: GainNode | null = null;
  private nitroNoise: AudioBufferSourceNode | null = null;
  private isEngineRunning: boolean = false;
  private sfxVolume: number = 0.8;
  private masterVolume: number = 0.9;
  private musicVolume: number = 0.7;

  constructor() {
    // SoundManager delegates music playback to persistent MusicManager
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  public setVolumes(master: number, sfx: number, music: number) {
    this.masterVolume = Math.max(0, Math.min(1, master));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
    musicManager.setVolumes(this.masterVolume, this.musicVolume);
  }

  public setMusicVolume(music: number) {
    this.musicVolume = Math.max(0, Math.min(1, music));
    musicManager.setVolumes(this.masterVolume, this.musicVolume);
  }

  // --- ENGINE PROCEDURAL AUDIO ---
  public startEngine() {
    this.init();
    if (!this.ctx || this.isEngineRunning) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      // Main sawtooth oscillator for engine cylinders
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      // Sub oscillator for bass body
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      // Lowpass filter to simulate car cabin / exhaust dampening
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.06 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      this.engineSubOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.engineSubOsc.start();
      this.isEngineRunning = true;
    } catch {
      // Audio context might need user gesture
    }
  }

  public updateEngineSound(rpmRatio: number, speedKmh: number, isAccelerating: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc || !this.engineGain || !this.engineSubOsc) return;

    // Realistic RPM pitch shift with gear simulation
    const baseFreq = 40 + rpmRatio * 110 + (speedKmh / 350) * 80;
    const targetFreq = Math.min(320, Math.max(35, baseFreq));

    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, this.ctx.currentTime, 0.05);

    const loadGain = isAccelerating ? 0.12 : 0.04;
    const targetGain = loadGain * this.sfxVolume * this.masterVolume;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc?.stop();
      this.engineSubOsc?.stop();
      this.engineOsc?.disconnect();
      this.engineSubOsc?.disconnect();
      this.engineGain?.disconnect();
    } catch {
      // Ignore cleanup error
    }
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  // --- NITRO SOUND ---
  public playNitroSound(active: boolean) {
    this.init();
    if (!this.ctx) return;

    if (active) {
      if (this.nitroGain) return; // already active
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(800, this.ctx.currentTime);
        bandpass.Q.setValueAtTime(1.5, this.ctx.currentTime);

        this.nitroGain = this.ctx.createGain();
        this.nitroGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.nitroGain.gain.exponentialRampToValueAtTime(0.18 * this.sfxVolume * this.masterVolume, this.ctx.currentTime + 0.2);

        whiteNoise.connect(bandpass);
        bandpass.connect(this.nitroGain);
        this.nitroGain.connect(this.ctx.destination);

        whiteNoise.start();
        this.nitroNoise = whiteNoise;
      } catch {
        // Fallback
      }
    } else {
      if (this.nitroGain && this.ctx) {
        try {
          this.nitroGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.1);
          setTimeout(() => {
            this.nitroNoise?.stop();
            this.nitroNoise?.disconnect();
            this.nitroGain?.disconnect();
            this.nitroNoise = null;
            this.nitroGain = null;
          }, 150);
        } catch {
          this.nitroNoise = null;
          this.nitroGain = null;
        }
      }
    }
  }

  // --- BOOST PAD SOUND ---
  public playBoostSound() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.35);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  // --- NEAR MISS SOUND ---
  public playNearMissSound() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // Doppler effect frequency curve
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.3);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  // --- COLLISION SOUND ---
  public playCollisionSound() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy low thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // ignore
    }
  }

  // --- UI CLICK / HOVER SOUND ---
  public playUIClick(type: 'click' | 'hover' = 'click') {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (type === 'click') {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      } else {
        osc.frequency.setValueAtTime(540, now);
      }

      const vol = (type === 'click' ? 0.12 : 0.04) * this.sfxVolume * this.masterVolume;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'click' ? 0.09 : 0.04));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }

  // --- MUSIC & SYNTHWAVE PLAYER DELEGATION ---
  public startMusic() {
    musicManager.play();
  }

  public toggleMusic() {
    musicManager.togglePlay();
  }

  public pauseMusic() {
    musicManager.pause();
  }

  public nextTrack() {
    musicManager.next();
  }

  public prevTrack() {
    musicManager.prev();
  }

  public addCustomTrack(file: File) {
    musicManager.addLocalFiles([file]);
  }

  public getPlaylist(): MusicTrack[] {
    return musicManager.getState().playlist;
  }

  public getCurrentTrack(): MusicTrack | null {
    return musicManager.getState().currentTrack;
  }

  public isPlaying(): boolean {
    return musicManager.getState().isPlaying;
  }

  public onMusicChange(cb: (track: MusicTrack | null, isPlaying: boolean) => void) {
    return musicManager.subscribe((state) => {
      cb(state.currentTrack, state.isPlaying);
    });
  }
}

export const soundManager = new SoundManager();
