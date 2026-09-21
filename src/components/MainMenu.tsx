import React from 'react';
import { CarStats, PlayerProfile, GameMode, Difficulty } from '../types/game';
import { Play, Wrench, User, Trophy, Music, Settings as SettingsIcon } from 'lucide-react';
import { soundManager } from '../core/SoundManager';

interface MainMenuProps {
  selectedCar: CarStats;
  profile: PlayerProfile;
  selectedMode: GameMode;
  difficulty: Difficulty;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenProfile: () => void;
  onOpenModes: () => void;
  onOpenMusic: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedCar,
  profile,
  selectedMode,
  difficulty,
  onPlay,
  onOpenGarage,
  onOpenProfile,
  onOpenModes,
  onOpenMusic,
  onOpenSettings,
}) => {
  const handleHover = () => soundManager.playUIClick('hover');
  const handleClick = (fn: () => void) => {
    soundManager.playUIClick('click');
    fn();
  };

  const modeLabels: Record<GameMode, string> = {
    endless: 'ENDLESS RACE',
    time_attack: 'TIME ATTACK',
    traffic_rush: 'TRAFFIC RUSH',
    survival: 'SURVIVAL',
    challenge: 'CHALLENGES',
    free_ride: 'FREE RIDE',
  };

  return (
    <div id="main-menu" className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-6 sm:p-10 z-10">
      {/* Top Header */}
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline space-x-3">
            <h1 className="font-['Orbitron'] font-black italic text-4xl sm:text-6xl text-cyan-400 drop-shadow-[0_0_20px_rgba(0,240,255,0.8)] tracking-wider">
              NEON <span className="text-white">RACER</span>
            </h1>
          </div>
          <p className="font-['Rajdhani'] font-bold text-sm sm:text-base text-slate-400 tracking-[0.2em] mt-1">
            CYBERNETIC ARCADE HIGHWAY // 60 FPS RACING ENGINE
          </p>
        </div>

        {/* Player Snapshot Widget */}
        <div
          onClick={() => handleClick(onOpenProfile)}
          onMouseEnter={handleHover}
          className="pointer-events-auto cursor-pointer flex items-center space-x-3 bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700/80 hover:border-cyan-400/60 px-4 py-2.5 rounded-xl backdrop-blur-md transition-all shadow-[0_0_15px_rgba(0,0,0,0.6)]"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Orbitron'] font-bold text-xs text-white">
              {profile.name}
            </span>
            <span className="font-['Rajdhani'] font-semibold text-[11px] text-cyan-400 tracking-wider">
              LVL {profile.level} // BEST: {profile.highScore.toLocaleString()} PTS
            </span>
          </div>
        </div>
      </header>

      {/* Main Menu Action Navigation */}
      <div className="flex flex-col sm:flex-row items-end justify-between w-full">
        {/* Left Column: Menu Buttons */}
        <nav className="pointer-events-auto flex flex-col space-y-3 w-full sm:w-72">
          {/* Primary PLAY Button */}
          <button
            id="play-button"
            onClick={() => handleClick(onPlay)}
            onMouseEnter={handleHover}
            className="group relative flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black px-6 py-4 rounded-xl font-['Orbitron'] font-black text-xl tracking-wider transition-all duration-200 transform hover:scale-[1.02] shadow-[0_0_25px_rgba(0,240,255,0.7)] cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Play className="w-6 h-6 fill-black" />
              <span>START RACE</span>
            </div>
            <span className="text-xs font-['Rajdhani'] font-bold text-cyan-950 bg-cyan-200 px-2 py-0.5 rounded">
              ENTER
            </span>
          </button>

          {/* Secondary Action Buttons */}
          <button
            id="garage-button"
            onClick={() => handleClick(onOpenGarage)}
            onMouseEnter={handleHover}
            className="flex items-center space-x-3 bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-400/50 text-slate-200 hover:text-white px-5 py-3 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider backdrop-blur-md transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>GARAGE / VEHICLES</span>
          </button>

          <button
            id="modes-button"
            onClick={() => handleClick(onOpenModes)}
            onMouseEnter={handleHover}
            className="flex items-center justify-between bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-400/50 text-slate-200 hover:text-white px-5 py-3 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider backdrop-blur-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>GAME MODES</span>
            </div>
            <span className="text-[10px] font-['Rajdhani'] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
              {modeLabels[selectedMode]}
            </span>
          </button>

          <button
            id="music-button"
            onClick={() => handleClick(onOpenMusic)}
            onMouseEnter={handleHover}
            className="flex items-center space-x-3 bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-400/50 text-slate-200 hover:text-white px-5 py-3 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider backdrop-blur-md transition-all cursor-pointer"
          >
            <Music className="w-4 h-4 text-pink-400" />
            <span>MUSIC PLAYER</span>
          </button>

          <button
            id="settings-button"
            onClick={() => handleClick(onOpenSettings)}
            onMouseEnter={handleHover}
            className="flex items-center space-x-3 bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-400/50 text-slate-200 hover:text-white px-5 py-3 rounded-xl font-['Orbitron'] font-bold text-sm tracking-wider backdrop-blur-md transition-all cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <span>SETTINGS</span>
          </button>
        </nav>

        {/* Right Column: Selected Car Specs Card */}
        <div className="hidden sm:flex flex-col items-end max-w-sm mt-6 sm:mt-0">
          <div className="bg-slate-900/70 border border-cyan-500/30 p-5 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between space-x-4 mb-2">
              <span className="font-['Rajdhani'] font-bold text-xs text-cyan-400 tracking-widest uppercase">
                ACTIVE CHASSIS
              </span>
              <span className="font-['Orbitron'] font-bold text-xs text-amber-400">
                {difficulty.toUpperCase()} DIFF
              </span>
            </div>

            <h2 className="font-['Orbitron'] font-black text-2xl text-white tracking-wide">
              {selectedCar.name}
            </h2>
            <p className="font-['Rajdhani'] text-xs text-slate-400 mt-0.5">
              {selectedCar.tagline}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
              <div>
                <span className="block text-[10px] font-['Rajdhani'] font-bold text-slate-400">
                  TOP SPEED
                </span>
                <span className="font-['Orbitron'] font-bold text-sm text-cyan-300">
                  {selectedCar.topSpeedKmh} KM/H
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-['Rajdhani'] font-bold text-slate-400">
                  ACCELERATION
                </span>
                <span className="font-['Orbitron'] font-bold text-sm text-white">
                  {selectedCar.acceleration}/100
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-['Rajdhani'] font-bold text-slate-400">
                  HANDLING
                </span>
                <span className="font-['Orbitron'] font-bold text-sm text-white">
                  {selectedCar.handling}/100
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-['Rajdhani'] font-bold text-slate-400">
                  NITRO BOOST
                </span>
                <span className="font-['Orbitron'] font-bold text-sm text-cyan-300">
                  {selectedCar.nitroMultiplier}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
