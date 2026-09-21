import { GameSettings, PlayerProfile, ChallengeDef } from '../types/game';
import { INITIAL_CHALLENGES } from '../data/cars';

const SETTINGS_KEY = 'neon_racer_settings_v1';
const PROFILE_KEY = 'neon_racer_profile_v1';
const CARS_UNLOCKED_KEY = 'neon_racer_unlocked_cars_v1';
const CHALLENGES_KEY = 'neon_racer_challenges_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  graphics: 'high',
  bloom: true,
  shadows: true,
  reflections: true,
  particles: true,
  cameraShake: true,
  masterVolume: 0.9,
  sfxVolume: 0.85,
  musicVolume: 0.75,
  touchControls: false,
};

export const DEFAULT_PROFILE: PlayerProfile = {
  name: 'PILOT-01',
  level: 1,
  totalDistanceMeters: 0,
  highScore: 0,
  topSpeedKmh: 0,
  nearMissesCount: 0,
  racesPlayed: 0,
};

export class StorageManager {
  public static getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: GameSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  public static getProfile(): PlayerProfile {
    try {
      const data = localStorage.getItem(PROFILE_KEY);
      if (data) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROFILE;
  }

  public static saveProfile(profile: PlayerProfile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  public static getUnlockedCarIds(): string[] {
    try {
      const data = localStorage.getItem(CARS_UNLOCKED_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return ['neon-x', 'volt-r', 'phantom'];
  }

  public static unlockCar(carId: string) {
    const list = this.getUnlockedCarIds();
    if (!list.includes(carId)) {
      list.push(carId);
      try {
        localStorage.setItem(CARS_UNLOCKED_KEY, JSON.stringify(list));
      } catch {
        // ignore
      }
    }
  }

  public static getChallenges(): ChallengeDef[] {
    try {
      const data = localStorage.getItem(CHALLENGES_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return INITIAL_CHALLENGES;
  }

  public static saveChallenges(challenges: ChallengeDef[]) {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    } catch {
      // ignore
    }
  }
}
