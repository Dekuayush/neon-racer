import { PerformanceStats } from '../types/game';

export type QualityProfileName = 'high' | 'medium' | 'low';

export interface AdaptiveSettings {
  profile: QualityProfileName;
  renderScale: number;
  pixelRatio: number;
  shadowMapSize: number;
  shadowsEnabled: boolean;
  maxTraffic: number;
  trafficUpdateInterval: number; // in frames or ms
  particleMultiplier: number;
  speedStreaksCount: number;
  postProcessingQuality: 'high' | 'medium' | 'low';
}

export class PerformanceMonitor {
  private fps: number = 60;
  private frameTimeMs: number = 16.67;
  private frameTimes: number[] = [];
  private lastFrameTimestamp: number = 0;
  private sampleCount: number = 0;

  // Hysteresis & cooldown (avoid rapid switching)
  private cooldownTimer: number = 0;
  private cooldownPeriodSec: number = 4.0; // Wait 4 seconds between adaptive transitions
  private lowFpsStreakSec: number = 0;
  private highFpsStreakSec: number = 0;

  // Auto quality settings
  private isAuto: boolean = true;
  private currentProfile: QualityProfileName = 'high';
  private renderScale: number = 1.0;
  private maxPixelRatio: number = 2.0;
  private activePixelRatio: number = 1.0;

  // Stats tracking
  public drawCalls: number = 0;
  public triangles: number = 0;
  public activeTraffic: number = 0;
  public activeParticles: number = 0;
  public rendererBackend: string = 'WebGL2';

  constructor(userPreference: 'auto' | 'low' | 'medium' | 'high' | 'ultra' = 'auto') {
    this.detectHardwareProfile();
    this.setPreference(userPreference);
  }

  private detectHardwareProfile() {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

    // Detect WebGL2 or fallback
    try {
      const testCanvas = document.createElement('canvas');
      const gl2 = testCanvas.getContext('webgl2');
      if (gl2) {
        this.rendererBackend = 'WebGL2';
      } else {
        this.rendererBackend = 'WebGL1 (Fallback)';
      }
    } catch {
      this.rendererBackend = 'WebGL';
    }

    // Set smart max pixel ratio: Cap high-DPI (2K, 4K, Retina) displays to save millions of shaded fragments
    if (isMobile) {
      this.maxPixelRatio = Math.min(dpr, 1.5);
      this.currentProfile = cores <= 4 ? 'medium' : 'high';
      this.renderScale = 0.92;
    } else {
      this.maxPixelRatio = Math.min(dpr, 1.85);
      this.currentProfile = 'high';
      this.renderScale = 1.0;
    }

    this.activePixelRatio = this.maxPixelRatio;
  }

  public setPreference(pref: 'auto' | 'low' | 'medium' | 'high' | 'ultra') {
    if (pref === 'auto') {
      this.isAuto = true;
    } else {
      this.isAuto = false;
      if (pref === 'low') {
        this.currentProfile = 'low';
        this.renderScale = 0.78;
      } else if (pref === 'medium') {
        this.currentProfile = 'medium';
        this.renderScale = 0.88;
      } else if (pref === 'high' || pref === 'ultra') {
        this.currentProfile = 'high';
        this.renderScale = 1.0;
      }
    }
  }

  /**
   * Called on every frame tick with performance.now() or delta
   */
  public update(now: number, delta: number): boolean {
    if (this.lastFrameTimestamp > 0) {
      const dt = now - this.lastFrameTimestamp;
      this.frameTimeMs = dt;
      this.frameTimes.push(dt);
      if (this.frameTimes.length > 40) {
        this.frameTimes.shift();
      }

      // Compute average smoothed FPS
      const avgDt = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.fps = Math.round(1000 / Math.max(1, avgDt));
    }
    this.lastFrameTimestamp = now;

    let settingsChanged = false;

    // Cooldown management
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
      return false;
    }

    if (!this.isAuto) return false;

    // Evaluate adaptive adjustments with hysteresis
    if (this.fps < 42) {
      this.lowFpsStreakSec += delta;
      this.highFpsStreakSec = 0;
    } else if (this.fps >= 56) {
      this.highFpsStreakSec += delta;
      this.lowFpsStreakSec = 0;
    } else {
      this.lowFpsStreakSec = Math.max(0, this.lowFpsStreakSec - delta);
      this.highFpsStreakSec = Math.max(0, this.highFpsStreakSec - delta);
    }

    // Degrade gracefully if struggling for more than 2.5 seconds
    if (this.lowFpsStreakSec > 2.5) {
      if (this.currentProfile === 'high') {
        this.currentProfile = 'medium';
        this.renderScale = Math.max(0.85, this.renderScale - 0.1);
        settingsChanged = true;
      } else if (this.currentProfile === 'medium') {
        this.currentProfile = 'low';
        this.renderScale = Math.max(0.72, this.renderScale - 0.1);
        settingsChanged = true;
      }
      this.lowFpsStreakSec = 0;
      this.cooldownTimer = this.cooldownPeriodSec;
    }
    // Upgrade smoothly if rock-solid 60 FPS for more than 5 seconds
    else if (this.highFpsStreakSec > 5.0) {
      if (this.currentProfile === 'low') {
        this.currentProfile = 'medium';
        this.renderScale = 0.88;
        settingsChanged = true;
      } else if (this.currentProfile === 'medium') {
        this.currentProfile = 'high';
        this.renderScale = 1.0;
        settingsChanged = true;
      }
      this.highFpsStreakSec = 0;
      this.cooldownTimer = this.cooldownPeriodSec;
    }

    return settingsChanged;
  }

  public getSettings(): AdaptiveSettings {
    const isHigh = this.currentProfile === 'high';
    const isMed = this.currentProfile === 'medium';

    return {
      profile: this.currentProfile,
      renderScale: this.renderScale,
      pixelRatio: this.maxPixelRatio,
      shadowMapSize: isHigh ? 1024 : 512,
      shadowsEnabled: !isMed && !isHigh ? false : true,
      maxTraffic: isHigh ? 20 : isMed ? 14 : 10,
      trafficUpdateInterval: isHigh ? 1 : isMed ? 2 : 3,
      particleMultiplier: isHigh ? 1.0 : isMed ? 0.7 : 0.45,
      speedStreaksCount: isHigh ? 65 : isMed ? 40 : 25,
      postProcessingQuality: this.currentProfile,
    };
  }

  public getStats(): PerformanceStats {
    return {
      fps: this.fps,
      frameTimeMs: Math.round(this.frameTimeMs * 10) / 10,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      activeTraffic: this.activeTraffic,
      activeParticles: this.activeParticles,
      rendererBackend: this.rendererBackend,
      pixelRatio: Math.round(this.maxPixelRatio * 100) / 100,
      renderScale: Math.round(this.renderScale * 100) / 100,
      qualityProfile: this.isAuto ? `AUTO (${this.currentProfile.toUpperCase()})` : this.currentProfile.toUpperCase(),
    };
  }
}

export const perfMonitor = new PerformanceMonitor();
