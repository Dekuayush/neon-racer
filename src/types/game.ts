export type GameScreen = 'loading' | 'menu' | 'racing' | 'garage' | 'paused' | 'gameover';

export type GameMode = 'endless' | 'time_attack' | 'traffic_rush' | 'survival' | 'challenge' | 'free_ride';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type GraphicsQuality = 'auto' | 'low' | 'medium' | 'high' | 'ultra';

export interface CarStats {
  id: string;
  name: string;
  tagline: string;
  topSpeedKmh: number; // e.g. 260
  acceleration: number; // 0-100 scale or m/s^2 multiplier
  handling: number; // lateral agility
  nitroMultiplier: number;
  brakingPower: number;
  bodyColor: string;
  neonColor: string;
  accentColor: string;
  unlocked: boolean;
  unlockRequirement?: string;
}

export interface PlayerProfile {
  name: string;
  level: number;
  totalDistanceMeters: number;
  highScore: number;
  topSpeedKmh: number;
  nearMissesCount: number;
  racesPlayed: number;
}

export interface GameSettings {
  graphics: GraphicsQuality;
  bloom: boolean;
  shadows: boolean;
  reflections: boolean;
  particles: boolean;
  cameraShake: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  touchControls: boolean;
}

export interface GameTelemetry {
  speedKmh: number;
  rpmRatio: number; // 0 - 1
  gear: number;
  nitroPercent: number; // 0 - 100
  isNitroActive: boolean;
  score: number;
  combo: number;
  distanceMeters: number;
  timeRemainingSeconds?: number;
  healthPercent?: number;
  nearMissAlert: { active: boolean; text: string; id: number } | null;
  boostAlert: { active: boolean; text: string; id: number } | null;
  fps: number;
}

export type PlaybackMode = 'normal' | 'shuffle' | 'repeat_one' | 'repeat_all';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
  isCustom?: boolean;
  file?: File;
}

export interface PerformanceStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  activeTraffic: number;
  activeParticles: number;
  rendererBackend: string;
  pixelRatio: number;
  renderScale: number;
  qualityProfile: string;
}

export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  targetType: 'speed' | 'near_miss' | 'distance' | 'score' | 'boost_pads';
  targetValue: number;
  currentValue: number;
  completed: boolean;
}
