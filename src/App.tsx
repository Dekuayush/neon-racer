import React, { useEffect, useRef, useState } from 'react';
import { GameScreen, GameMode, Difficulty, CarStats, PlayerProfile, GameSettings, GameTelemetry, ChallengeDef, PerformanceStats } from './types/game';
import { CARS_CATALOG } from './data/cars';
import { StorageManager } from './core/Storage';
import { GameEngine } from './core/GameEngine';
import { soundManager } from './core/SoundManager';
import { musicManager, MusicManagerState } from './core/MusicManager';
import { LoadingScreen } from './components/LoadingScreen';
import { perfMonitor } from './core/PerformanceMonitor';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { GarageModal } from './components/GarageModal';
import { GameModesModal } from './components/GameModesModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { MusicModal } from './components/MusicModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { PerformanceDebugPanel } from './components/PerformanceDebugPanel';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Core App States
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [activeModal, setActiveModal] = useState<'modes' | 'profile' | 'music' | 'settings' | null>(null);
  const [musicState, setMusicState] = useState<MusicManagerState>(musicManager.getState());

  // Performance debug stats
  const [perfStats, setPerfStats] = useState<PerformanceStats>({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    activeTraffic: 0,
    activeParticles: 0,
    rendererBackend: 'WebGL2',
    pixelRatio: 1.0,
    renderScale: 1.0,
    qualityProfile: 'AUTO (HIGH)',
  });

  // Game data persisted in storage
  const [settings, setSettings] = useState<GameSettings>(() => StorageManager.getSettings());
  const [profile, setProfile] = useState<PlayerProfile>(() => StorageManager.getProfile());
  const [unlockedCarIds, setUnlockedCarIds] = useState<string[]>(() => StorageManager.getUnlockedCarIds());
  const [challenges, setChallenges] = useState<ChallengeDef[]>(() => StorageManager.getChallenges());

  // Current session configuration
  const [selectedCar, setSelectedCar] = useState<CarStats>(() => {
    const unlocked = StorageManager.getUnlockedCarIds();
    return CARS_CATALOG.find(c => unlocked.includes(c.id)) || CARS_CATALOG[0];
  });
  const [selectedMode, setSelectedMode] = useState<GameMode>('endless');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // Real-time Telemetry
  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speedKmh: 0,
    rpmRatio: 0,
    gear: 1,
    nitroPercent: 100,
    isNitroActive: false,
    score: 0,
    combo: 1,
    distanceMeters: 0,
    nearMissAlert: null,
    boostAlert: null,
    fps: 60,
  });

  // Game Over results
  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    distance: number;
    maxSpeed: number;
    nearMisses: number;
    bestCombo: number;
    isNewHighScore: boolean;
  } | null>(null);

  // Subscribe to persistent MusicManager at root level
  useEffect(() => {
    return musicManager.subscribe((state) => {
      setMusicState(state);
    });
  }, []);

  // Sync user graphics quality preference with adaptive performance monitor
  useEffect(() => {
    perfMonitor.setPreference(settings.graphics);
  }, [settings.graphics]);

  // Initialize GameEngine once canvas is mounted
  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;

    soundManager.setVolumes(settings.masterVolume, settings.sfxVolume, settings.musicVolume);

    const engine = new GameEngine(canvasRef.current, {
      onTelemetry: (data) => {
        setTelemetry(data);
      },
      onPerformanceStats: (stats) => {
        setPerfStats(stats);
      },
      onGameOver: (stats) => {
        handleRaceFinished(stats);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Update GameEngine mode state when screen changes
  useEffect(() => {
    if (!engineRef.current) return;
    if (screen === 'menu') {
      engineRef.current.setScreenState('menu');
    } else if (screen === 'garage') {
      engineRef.current.setScreenState('garage');
    } else if (screen === 'paused') {
      engineRef.current.setScreenState('paused');
    }
  }, [screen]);

  // Global ESC handler for Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (screen === 'racing') {
          setScreen('paused');
        } else if (screen === 'paused') {
          engineRef.current?.setScreenState('racing');
          setScreen('racing');
        } else if (activeModal) {
          setActiveModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, activeModal]);

  const handleStartRace = () => {
    if (!engineRef.current) return;
    engineRef.current.startRace(selectedMode, difficulty, selectedCar);
    soundManager.startMusic();
    setScreen('racing');
  };

  const handleRaceFinished = (stats: {
    score: number;
    distance: number;
    maxSpeed: number;
    nearMisses: number;
    bestCombo: number;
  }) => {
    const isNewHigh = stats.score > profile.highScore;

    // Update Profile Stats
    const updatedProfile: PlayerProfile = {
      ...profile,
      highScore: Math.max(profile.highScore, stats.score),
      totalDistanceMeters: profile.totalDistanceMeters + stats.distance,
      topSpeedKmh: Math.max(profile.topSpeedKmh, stats.maxSpeed),
      nearMissesCount: profile.nearMissesCount + stats.nearMisses,
      racesPlayed: profile.racesPlayed + 1,
      level: Math.floor((profile.totalDistanceMeters + stats.distance) / 4000) + 1,
    };
    setProfile(updatedProfile);
    StorageManager.saveProfile(updatedProfile);

    // Check unlocks: Unlock Apex if score >= 25000 or level >= 5
    if (updatedProfile.highScore >= 25000 || updatedProfile.level >= 5) {
      StorageManager.unlockCar('apex');
      setUnlockedCarIds(StorageManager.getUnlockedCarIds());
    }

    // Check challenge completions
    const updatedChallenges = challenges.map(c => {
      if (c.completed) return c;
      let val = c.currentValue;
      if (c.targetType === 'speed' && stats.maxSpeed >= c.targetValue) return { ...c, completed: true };
      if (c.targetType === 'score' && stats.score >= c.targetValue) return { ...c, completed: true };
      if (c.targetType === 'near_miss') {
        val += stats.nearMisses;
        return { ...c, currentValue: val, completed: val >= c.targetValue };
      }
      if (c.targetType === 'distance') {
        val += stats.distance;
        return { ...c, currentValue: val, completed: val >= c.targetValue };
      }
      return c;
    });
    setChallenges(updatedChallenges);
    StorageManager.saveChallenges(updatedChallenges);

    setGameOverStats({
      ...stats,
      isNewHighScore: isNewHigh,
    });
    setScreen('gameover');
  };

  const handleMobileInput = (action: 'steerLeft' | 'steerRight' | 'accelerate' | 'brake' | 'nitro', active: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.inputs[action] = active;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-['Rajdhani']">
      {/* 3D WebGL Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block touch-none"
      />

      {/* 1. Loading Screen */}
      {screen === 'loading' && (
        <LoadingScreen onComplete={() => setScreen('menu')} />
      )}

      {/* 2. Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          selectedCar={selectedCar}
          profile={profile}
          selectedMode={selectedMode}
          difficulty={difficulty}
          onPlay={handleStartRace}
          onOpenGarage={() => setScreen('garage')}
          onOpenProfile={() => setActiveModal('profile')}
          onOpenModes={() => setActiveModal('modes')}
          onOpenMusic={() => setActiveModal('music')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* 3. Garage Showroom */}
      {screen === 'garage' && (
        <GarageModal
          currentCar={selectedCar}
          unlockedCarIds={unlockedCarIds}
          onSelectCar={(car) => {
            setSelectedCar(car);
            engineRef.current?.setCar(car);
          }}
          onClose={() => setScreen('menu')}
        />
      )}

      {/* 4. Active In-Game HUD */}
      {screen === 'racing' && (
        <HUD
          telemetry={telemetry}
          car={selectedCar}
          onPause={() => setScreen('paused')}
          onMusicModalOpen={() => setActiveModal('music')}
          isMobileTouch={settings.touchControls}
          onMobileInput={handleMobileInput}
        />
      )}

      {/* 5. Pause Modal */}
      {screen === 'paused' && (
        <PauseModal
          onResume={() => {
            engineRef.current?.setScreenState('racing');
            setScreen('racing');
          }}
          onRestart={() => {
            handleStartRace();
          }}
          onOpenModes={() => setActiveModal('modes')}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenMusic={() => setActiveModal('music')}
          onQuitToMenu={() => {
            setScreen('menu');
          }}
        />
      )}

      {/* 6. Game Over Modal */}
      {screen === 'gameover' && gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          isNewHighScore={gameOverStats.isNewHighScore}
          onRetry={handleStartRace}
          onOpenModes={() => setActiveModal('modes')}
          onGarage={() => setScreen('garage')}
          onMainMenu={() => setScreen('menu')}
        />
      )}

      {/* Secondary Overlay Modals */}
      {activeModal === 'modes' && (
        <GameModesModal
          currentMode={selectedMode}
          currentDifficulty={difficulty}
          onSelectMode={(m) => {
            setSelectedMode(m);
            engineRef.current?.setMode(m);
          }}
          onSelectDifficulty={(d) => {
            setDifficulty(d);
            engineRef.current?.setDifficulty(d);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'profile' && (
        <PlayerProfileModal
          profile={profile}
          challenges={challenges}
          onSaveProfile={(p) => {
            setProfile(p);
            StorageManager.saveProfile(p);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'music' && (
        <MusicModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(s) => {
            setSettings(s);
            StorageManager.saveSettings(s);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Autoplay prompt banner if browser blocked audio initialization */}
      {musicState.autoplayBlocked && activeModal !== 'music' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-pink-950/90 border-2 border-pink-500 px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(236,72,153,0.6)] backdrop-blur-md flex items-center space-x-3 pointer-events-auto animate-bounce">
          <span className="font-['Orbitron'] font-bold text-xs sm:text-sm text-pink-200">
            AUDIO MUTED BY BROWSER
          </span>
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              musicManager.resumeAutoplay();
            }}
            className="bg-pink-500 hover:bg-pink-400 text-white font-['Orbitron'] font-black text-xs px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(236,72,153,0.8)] cursor-pointer"
          >
            CLICK TO START MUSIC
          </button>
        </div>
      )}

      {/* F3 Developer Performance Monitor Overlay */}
      <PerformanceDebugPanel stats={perfStats} />
    </div>
  );
}
