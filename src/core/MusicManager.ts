import { MusicTrack, PlaybackMode } from '../types/game';

export interface MusicManagerState {
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  isPlaying: boolean;
  playbackMode: PlaybackMode;
  volume: number;
  currentTime: number;
  duration: number;
  needsLocalReselection: boolean;
  autoplayBlocked: boolean;
}

type Listener = (state: MusicManagerState) => void;

class MusicManager {
  private audioElement: HTMLAudioElement;
  private playlist: MusicTrack[] = [];
  private currentTrackIndex: number = 0;
  private isPlayingAudio: boolean = false;
  private playbackMode: PlaybackMode = 'normal';
  private volume: number = 0.7;
  private masterVolume: number = 0.9;
  private needsLocalReselection: boolean = false;
  private autoplayBlocked: boolean = false;
  private listeners: Set<Listener> = new Set();
  private objectUrls: Map<string, string> = new Map(); // trackId -> objectUrl
  private lastTimeUpdate: number = 0;

  // Procedural Web Audio synthesizer for the bundled default track
  private synthCtx: AudioContext | null = null;
  private isSynthPlaying: boolean = false;
  private synthIntervalId: number | null = null;
  private synthStep: number = 0;

  // Exactly ONE bundled default track as required:
  // "Cyber Highway Run" by "Neon Wave"
  private readonly defaultTrack: MusicTrack = {
    id: 'default-cyber-highway-run',
    title: 'Cyber Highway Run',
    artist: 'Neon Wave',
    url: '', // Web Audio Procedural Synthwave
    duration: 14,
    isCustom: false,
  };

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';

    // Auto next when a custom audio track completes
    this.audioElement.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    // Throttled timeupdate for smooth progress without excessive UI re-renders
    this.audioElement.addEventListener('timeupdate', () => {
      const now = performance.now();
      if (now - this.lastTimeUpdate > 250) {
        this.lastTimeUpdate = now;
        this.notify();
      }
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      const current = this.playlist[this.currentTrackIndex];
      if (current && current.isCustom && this.audioElement.duration && isFinite(this.audioElement.duration)) {
        current.duration = this.audioElement.duration;
      }
      this.notify();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error, falling back safely:', e);
      if (this.currentTrackIndex > 0 && this.playlist.length > 1) {
        this.next();
      } else {
        this.playDefaultSynth();
      }
    });

    // Load persisted settings from localStorage
    this.loadPersistedState();
  }

  private loadPersistedState() {
    try {
      const savedMode = localStorage.getItem('neon_music_playback_mode') as PlaybackMode | null;
      if (savedMode && ['normal', 'shuffle', 'repeat_one', 'repeat_all'].includes(savedMode)) {
        this.playbackMode = savedMode;
      }

      const savedVol = localStorage.getItem('neon_music_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol);
      }

      // Check if user had local tracks previously saved in metadata
      const savedMetadata = localStorage.getItem('neon_local_tracks_meta');
      if (savedMetadata) {
        const parsed = JSON.parse(savedMetadata) as { id: string; title: string; artist: string; duration?: number }[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ephemeral object URLs cannot survive browser session reloads without user re-selection:
          this.needsLocalReselection = true;
          this.playlist = [
            this.defaultTrack,
            ...parsed.map((p) => ({
              id: p.id,
              title: p.title,
              artist: p.artist,
              url: '',
              duration: p.duration,
              isCustom: true,
            })),
          ];
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read saved music state', e);
    }

    // Default start
    this.playlist = [this.defaultTrack];
    this.currentTrackIndex = 0;
  }

  private saveState() {
    try {
      localStorage.setItem('neon_music_playback_mode', this.playbackMode);
      localStorage.setItem('neon_music_volume', this.volume.toString());

      // Save user tracks metadata (excluding ephemeral object URLs)
      const customTracks = this.playlist
        .filter((t) => t.isCustom)
        .map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration,
        }));
      localStorage.setItem('neon_local_tracks_meta', JSON.stringify(customTracks));
    } catch (e) {
      console.warn('Could not save music state', e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public getState(): MusicManagerState {
    const current = this.playlist[this.currentTrackIndex] || this.defaultTrack;
    let currentTime = 0;
    let duration = current.duration || 0;

    if (current.isCustom && current.url) {
      currentTime = this.audioElement.currentTime || 0;
      duration = (this.audioElement.duration && isFinite(this.audioElement.duration))
        ? this.audioElement.duration
        : current.duration || 0;
    } else {
      // Default procedural track
      duration = this.defaultTrack.duration || 14;
      currentTime = (this.synthStep / 64) * duration;
    }

    return {
      currentTrack: current,
      playlist: [...this.playlist],
      isPlaying: this.isPlayingAudio,
      playbackMode: this.playbackMode,
      volume: this.volume,
      currentTime,
      duration,
      needsLocalReselection: this.needsLocalReselection,
      autoplayBlocked: this.autoplayBlocked,
    };
  }

  public setVolumes(master: number, music: number) {
    this.masterVolume = Math.max(0, Math.min(1, master));
    this.volume = Math.max(0, Math.min(1, music));
    this.audioElement.volume = this.volume * this.masterVolume;
    this.saveState();
    this.notify();
  }

  public setPlaybackMode(mode: PlaybackMode) {
    this.playbackMode = mode;
    this.saveState();
    this.notify();
  }

  public cyclePlaybackMode() {
    const modes: PlaybackMode[] = ['normal', 'repeat_all', 'repeat_one', 'shuffle'];
    const currentIdx = modes.indexOf(this.playbackMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.setPlaybackMode(nextMode);
  }

  public toggleShuffle() {
    if (this.playbackMode === 'shuffle') {
      this.setPlaybackMode('normal');
    } else {
      this.setPlaybackMode('shuffle');
    }
  }

  /**
   * Start or Resume audio playback
   * Respects browser autoplay policies and reports block status.
   */
  public play() {
    const track = this.playlist[this.currentTrackIndex];
    if (!track) return;

    if (track.isCustom && track.url) {
      this.stopSynth();
      if (this.audioElement.src !== track.url) {
        this.audioElement.src = track.url;
      }
      this.audioElement.volume = this.volume * this.masterVolume;

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlayingAudio = true;
            this.autoplayBlocked = false;
            this.notify();
          })
          .catch((err) => {
            console.warn('Autoplay blocked by browser policy:', err);
            this.isPlayingAudio = false;
            this.autoplayBlocked = true;
            this.notify();
          });
      }
    } else {
      // Default Cyber Highway Run procedural synthwave
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.playDefaultSynth();
    }
  }

  /**
   * Called when user interacts with "CLICK TO START MUSIC" banner
   */
  public resumeAutoplay() {
    this.autoplayBlocked = false;
    if (this.synthCtx && this.synthCtx.state === 'suspended') {
      this.synthCtx.resume().catch(() => {});
    }
    this.play();
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopSynth();
    this.isPlayingAudio = false;
    this.notify();
  }

  public togglePlay() {
    if (this.isPlayingAudio) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek current track to time in seconds
   */
  public seek(timeInSeconds: number) {
    const track = this.playlist[this.currentTrackIndex];
    if (track?.isCustom && track.url) {
      if (this.audioElement && isFinite(timeInSeconds)) {
        const clamped = Math.max(0, Math.min(timeInSeconds, this.audioElement.duration || 0));
        this.audioElement.currentTime = clamped;
        this.notify();
      }
    } else {
      const total = this.defaultTrack.duration || 14;
      const clamped = Math.max(0, Math.min(timeInSeconds, total));
      this.synthStep = Math.floor((clamped / total) * 64);
      this.notify();
    }
  }

  /**
   * Track completion handler adhering to playback modes:
   * NORMAL: -> next track (or stop if reached end of playlist)
   * SHUFFLE: -> random track
   * REPEAT ONE: -> replay current track
   * REPEAT ALL: -> next track and wrap around
   */
  public handleTrackEnded() {
    if (this.playlist.length === 0) {
      this.playDefaultSynth();
      return;
    }

    if (this.playbackMode === 'repeat_one') {
      this.seek(0);
      this.play();
      return;
    }

    if (this.playbackMode === 'shuffle') {
      if (this.playlist.length > 1) {
        let nextIdx = this.currentTrackIndex;
        while (nextIdx === this.currentTrackIndex) {
          nextIdx = Math.floor(Math.random() * this.playlist.length);
        }
        this.currentTrackIndex = nextIdx;
      }
      this.seek(0);
      this.play();
      return;
    }

    if (this.playbackMode === 'repeat_all') {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
      this.seek(0);
      this.play();
      return;
    }

    // Normal mode: advance to next track; if at end, stop
    if (this.currentTrackIndex < this.playlist.length - 1) {
      this.currentTrackIndex++;
      this.seek(0);
      this.play();
    } else {
      this.pause();
      this.seek(0);
    }
  }

  public next() {
    if (this.playlist.length <= 1) {
      this.handleTrackEnded();
      return;
    }

    if (this.playbackMode === 'shuffle') {
      let nextIdx = this.currentTrackIndex;
      while (nextIdx === this.currentTrackIndex) {
        nextIdx = Math.floor(Math.random() * this.playlist.length);
      }
      this.currentTrackIndex = nextIdx;
    } else {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    }

    this.seek(0);
    this.play();
  }

  public prev() {
    if (this.playlist.length <= 1) {
      this.seek(0);
      this.play();
      return;
    }

    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.seek(0);
    this.play();
  }

  public selectTrack(index: number) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentTrackIndex = index;
      this.seek(0);
      this.play();
    }
  }

  /**
   * Import local audio files (.mp3, .wav, .ogg).
   * Supports single or multiple file selection.
   * Does NOT upload files to a server.
   * Uses browser File API and Object URLs.
   */
  public addLocalFiles(files: FileList | File[]) {
    const newTracks: MusicTrack[] = [];

    // Filter out stale placeholders with empty URLs
    this.playlist = this.playlist.filter((t) => !t.isCustom || t.url !== '');
    this.needsLocalReselection = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validExtensions = ['mp3', 'wav', 'ogg'];
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const isExtensionValid = validExtensions.includes(extension);
      const isMimeValid = file.type.startsWith('audio/');

      if (!isExtensionValid && !isMimeValid) {
        // Skip invalid/unsupported formats gracefully
        continue;
      }

      const trackId = `local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      const url = URL.createObjectURL(file);
      this.objectUrls.set(trackId, url);

      const track: MusicTrack = {
        id: trackId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        url,
        duration: 0,
        isCustom: true,
        file,
      };

      // Probe duration asynchronously via temporary audio element
      const probeAudio = new Audio();
      probeAudio.preload = 'metadata';
      probeAudio.src = url;
      probeAudio.onloadedmetadata = () => {
        if (probeAudio.duration && isFinite(probeAudio.duration)) {
          track.duration = probeAudio.duration;
          this.notify();
        }
      };

      newTracks.push(track);
    }

    if (newTracks.length > 0) {
      this.playlist.push(...newTracks);
      this.saveState();
      this.notify();
    }
  }

  /**
   * Safely remove a custom track and revoke its object URL to prevent memory leaks.
   * If the track is currently playing, switches to another track before revocation.
   */
  public removeTrack(id: string) {
    const trackToRemove = this.playlist.find((t) => t.id === id);
    if (!trackToRemove || !trackToRemove.isCustom) return; // Cannot delete default BGM

    const wasPlaying = this.isPlayingAudio && this.playlist[this.currentTrackIndex]?.id === id;
    const url = this.objectUrls.get(id) || trackToRemove.url;

    // Filter out from playlist
    this.playlist = this.playlist.filter((t) => t.id !== id);
    this.objectUrls.delete(id);

    if (wasPlaying) {
      // Pause active audio before revoking URL
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
      this.currentTrackIndex = Math.max(0, this.currentTrackIndex - 1);
      this.play();
    } else if (this.currentTrackIndex >= this.playlist.length) {
      this.currentTrackIndex = Math.max(0, this.playlist.length - 1);
    }

    // Revoke object URL safely
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Error revoking Object URL:', err);
      }
    }

    this.saveState();
    this.notify();
  }

  // --- PROCEDURAL DEFAULT SYNTHWAVE ("Cyber Highway Run" by Neon Wave) ---
  private initSynthContext() {
    if (this.synthCtx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.synthCtx = new AudioCtx();
    } catch (e) {
      console.warn('Web Audio synth not supported', e);
    }
  }

  private playDefaultSynth() {
    if (this.isSynthPlaying) return;
    this.initSynthContext();
    if (!this.synthCtx) return;

    if (this.synthCtx.state === 'suspended') {
      this.synthCtx.resume().catch((err) => {
        console.warn('AudioContext suspended, waiting for user interaction:', err);
        this.autoplayBlocked = true;
        this.isPlayingAudio = false;
        this.notify();
      });
    }

    this.isSynthPlaying = true;
    this.isPlayingAudio = true;
    this.autoplayBlocked = false;
    this.notify();

    // Cyber Highway Run harmonic progression
    const chords = [
      [164.81, 196.0, 246.94], // Em (E3, G3, B3)
      [130.81, 164.81, 196.0], // C (C3, E3, G3)
      [146.83, 185.0, 220.0],  // D (D3, F#3, A3)
      [123.47, 146.83, 185.0], // Bm (B2, D3, F#3)
    ];

    const playBeat = () => {
      if (!this.isSynthPlaying || !this.synthCtx || this.synthCtx.state !== 'running') return;
      const now = this.synthCtx.currentTime;
      const currentChord = chords[Math.floor((this.synthStep / 4) % chords.length)];
      const arpeggioNote = currentChord[this.synthStep % currentChord.length] * 2;

      // Heavy punchy kick on beats 0 and 2
      if (this.synthStep % 2 === 0) {
        const kickOsc = this.synthCtx.createOscillator();
        const kickGain = this.synthCtx.createGain();
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.12);
        kickGain.gain.setValueAtTime(0.24 * this.volume * this.masterVolume, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        kickOsc.connect(kickGain);
        kickGain.connect(this.synthCtx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.14);
      }

      // Neon synth arpeggio lead
      const arpOsc = this.synthCtx.createOscillator();
      const arpGain = this.synthCtx.createGain();
      arpOsc.type = 'sawtooth';
      arpOsc.frequency.setValueAtTime(arpeggioNote, now);
      arpGain.gain.setValueAtTime(0.045 * this.volume * this.masterVolume, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      const filter = this.synthCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);

      arpOsc.connect(filter);
      filter.connect(arpGain);
      arpGain.connect(this.synthCtx.destination);
      arpOsc.start(now);
      arpOsc.stop(now + 0.19);

      this.synthStep++;

      // When reaching 64 steps (approx 14 seconds), cycle or advance
      if (this.synthStep >= 64) {
        this.synthStep = 0;
        if (this.playlist.length > 1 && this.playbackMode !== 'repeat_one') {
          this.handleTrackEnded();
        }
      }
    };

    this.synthIntervalId = window.setInterval(playBeat, 220);
  }

  private stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthIntervalId !== null) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
  }

  public destroy() {
    this.stopSynth();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    // Revoke all remaining object URLs safely
    this.objectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    this.objectUrls.clear();
  }
}

// Global persistent singleton instance
export const musicManager = new MusicManager();
