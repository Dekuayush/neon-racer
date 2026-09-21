import React, { useEffect, useState } from 'react';
import { GameTelemetry, CarStats } from '../types/game';
import { Speedometer } from './Speedometer';
import { soundManager } from '../core/SoundManager';
import { musicManager, MusicManagerState } from '../core/MusicManager';
import { Flame, Play, Pause, SkipForward, SkipBack, Volume2, ShieldAlert, Timer } from 'lucide-react';

interface HUDProps {
  telemetry: GameTelemetry;
  car: CarStats;
  onPause: () => void;
  onMusicModalOpen: () => void;
  isMobileTouch: boolean;
  onMobileInput: (action: 'steerLeft' | 'steerRight' | 'accelerate' | 'brake' | 'nitro', active: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  car,
  onPause,
  onMusicModalOpen,
  isMobileTouch,
  onMobileInput,
}) => {
  const [musicState, setMusicState] = useState<MusicManagerState>(musicManager.getState());

  useEffect(() => {
    return musicManager.subscribe((state) => {
      setMusicState(state);
    });
  }, []);

  const currentTrack = musicState.currentTrack;
  const isMusicPlaying = musicState.isPlaying;

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Nitro High-Speed Screen Tunnel / Warp Overlay */}
      {telemetry.isNitroActive && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,240,255,0.18)_100%)] animate-pulse" />
      )}

      {/* 1. TOP BAR */}
      <header className="flex items-start justify-between w-full relative z-10">
        {/* Top-Left: Game Title */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="font-['Orbitron'] font-black italic tracking-wider text-2xl sm:text-4xl text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.85)]">
              NEON <span className="text-white">RACER</span>
            </h1>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2.5 py-0.5 rounded shadow-[0_0_8px_rgba(0,240,255,0.3)]">
              {car.name}
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <span className="font-['Rajdhani'] font-bold text-xs sm:text-sm tracking-[0.2em] text-slate-300 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
              HIGHWAY SPEEDWAY // SECTOR 07
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-black/70 px-2 py-0.5 rounded border border-emerald-500/40">
              {telemetry.fps} FPS
            </span>
          </div>
        </div>

        {/* Top-Center: DODGE / BOOST / SURVIVE */}
        <div className="flex flex-col items-center">
          {telemetry.timeRemainingSeconds !== undefined ? (
            <div className="flex items-center space-x-2 bg-black/80 border border-amber-500/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)] backdrop-blur-sm">
              <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-['Orbitron'] font-bold text-amber-300 text-base sm:text-lg">
                {telemetry.timeRemainingSeconds}s
              </span>
            </div>
          ) : telemetry.healthPercent !== undefined ? (
            <div className="flex items-center space-x-2 bg-black/80 border border-rose-500/50 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <div className="w-24 sm:w-32 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-rose-950">
                <div
                  className="h-full bg-rose-500 transition-all duration-150 shadow-[0_0_8px_#f43f5e]"
                  style={{ width: `${telemetry.healthPercent}%` }}
                />
              </div>
              <span className="font-['Orbitron'] font-bold text-xs text-rose-300">
                {telemetry.healthPercent}%
              </span>
            </div>
          ) : (
            <div className="text-center bg-black/40 border border-cyan-500/20 px-4 py-1 rounded-full backdrop-blur-sm">
              <span className="font-['Rajdhani'] font-bold italic tracking-[0.28em] text-xs sm:text-sm text-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">
                DODGE / BOOST / SURVIVE
              </span>
            </div>
          )}

          {/* Combo Multiplier Pill */}
          {telemetry.combo > 1 && (
            <div className="mt-2 bg-cyan-500/20 border border-cyan-400/80 px-3.5 py-0.5 rounded-full animate-bounce shadow-[0_0_18px_rgba(0,240,255,0.7)]">
              <span className="font-['Orbitron'] font-black italic text-cyan-300 text-xs sm:text-sm tracking-wider">
                COMBO x{telemetry.combo}
              </span>
            </div>
          )}
        </div>

        {/* Top-Right: Score & Pause Button */}
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex flex-col items-end">
            <span className="font-['Rajdhani'] font-bold text-xs tracking-widest text-slate-400">
              SCORE
            </span>
            <span className="font-['Orbitron'] font-black text-2xl sm:text-4xl text-white tracking-wider tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
              {telemetry.score.toLocaleString()}
            </span>
            <span className="font-['Rajdhani'] font-bold text-xs text-cyan-400 tracking-wide mt-0.5">
              {(telemetry.distanceMeters / 1000).toFixed(2)} KM // {telemetry.speedKmh} KM/H
            </span>
          </div>

          <button
            id="pause-btn"
            onClick={onPause}
            className="pointer-events-auto bg-slate-950/85 hover:bg-cyan-950/90 border border-slate-700/80 hover:border-cyan-400/80 p-2.5 sm:p-3 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.6)] backdrop-blur-md"
            title="Pause Game (ESC)"
          >
            <div className="flex space-x-1.5 items-center justify-center">
              <div className="w-1.5 h-4.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f0ff]" />
              <div className="w-1.5 h-4.5 bg-cyan-400 rounded-sm shadow-[0_0_6px_#00f0ff]" />
            </div>
          </button>
        </div>
      </header>

      {/* 2. CENTER NOTIFICATIONS (Near Miss / Boost / Combo) */}
      <div className="relative flex flex-col items-center justify-center space-y-2 pointer-events-none z-10">
        {telemetry.nearMissAlert?.active && (
          <div className="bg-cyan-950/90 border-2 border-cyan-400 px-6 py-2.5 rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.9)] animate-pulse transform -rotate-1 backdrop-blur-md">
            <span className="font-['Orbitron'] font-black italic text-xl sm:text-3xl text-white tracking-widest drop-shadow-[0_0_15px_#00f0ff]">
              {telemetry.nearMissAlert.text}
            </span>
          </div>
        )}

        {telemetry.boostAlert?.active && (
          <div className="bg-amber-950/90 border-2 border-amber-400 px-6 py-2.5 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.9)] animate-bounce transform rotate-1 backdrop-blur-md">
            <span className="font-['Orbitron'] font-black italic text-xl sm:text-3xl text-amber-200 tracking-widest drop-shadow-[0_0_15px_#fbbf24]">
              {telemetry.boostAlert.text}
            </span>
          </div>
        )}
      </div>

      {/* 3. BOTTOM HUD (Music Player on left, Nitro Meter in center, Speedometer on right) */}
      <footer className="flex items-end justify-between w-full relative z-10">
        {/* Bottom-Left: Mini Music Player Widget */}
        <div className="pointer-events-auto flex items-center space-x-2 sm:space-x-2.5 bg-black/80 border border-slate-800 hover:border-cyan-500/50 p-2 sm:p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              musicManager.prev();
            }}
            className="text-slate-400 hover:text-cyan-300 p-1 transition-colors cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick('click');
              musicManager.togglePlay();
            }}
            className="w-8 h-8 rounded-full bg-cyan-950/90 border border-cyan-500/60 flex items-center justify-center text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.4)]"
            title={isMusicPlaying ? 'Pause Music' : 'Play Music'}
          >
            {isMusicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick('click');
              musicManager.next();
            }}
            className="text-slate-400 hover:text-cyan-300 p-1 transition-colors cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div
            className="flex flex-col max-w-[100px] sm:max-w-[150px] truncate cursor-pointer pl-1"
            onClick={onMusicModalOpen}
            title="Open Music Player"
          >
            <span className="font-['Rajdhani'] font-bold text-xs sm:text-sm text-white truncate">
              {currentTrack ? currentTrack.title : 'Cyber Highway Run'}
            </span>
            <span className="font-['Rajdhani'] font-semibold text-[11px] text-cyan-400/90 truncate">
              {currentTrack ? currentTrack.artist : 'Neon Wave'}
            </span>
          </div>

          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onMusicModalOpen();
            }}
            className="text-slate-400 hover:text-cyan-300 p-1.5 transition-colors cursor-pointer"
            title="Music Settings / Local Tracks"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom-Center: High-Fidelity Nitro Meter */}
        <div className="flex flex-col items-center mb-2 sm:mb-4 px-2">
          <div className="flex items-center space-x-2 mb-1.5">
            <Flame
              className={`w-4 h-4 ${
                telemetry.isNitroActive
                  ? 'text-cyan-300 animate-bounce drop-shadow-[0_0_8px_#00f0ff]'
                  : 'text-cyan-400'
              }`}
            />
            <span
              className={`font-['Orbitron'] font-black text-xs sm:text-sm tracking-[0.2em] ${
                telemetry.isNitroActive
                  ? 'text-cyan-300 drop-shadow-[0_0_10px_#00f0ff]'
                  : telemetry.nitroPercent >= 99
                  ? 'text-cyan-300 animate-pulse drop-shadow-[0_0_8px_#00f0ff]'
                  : 'text-slate-300'
              }`}
            >
              NITRO BOOST <span className="text-cyan-400 font-mono text-xs">[SPACE]</span>
            </span>
          </div>

          {/* Long horizontal cyan progress bar */}
          <div className="relative w-56 sm:w-72 md:w-88 h-4 bg-slate-950/95 border border-slate-700 rounded-full p-0.5 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.9)] backdrop-blur-md">
            <div
              className={`h-full rounded-full transition-all duration-75 relative ${
                telemetry.isNitroActive
                  ? 'bg-gradient-to-r from-cyan-400 via-cyan-200 to-white shadow-[0_0_20px_#00f0ff]'
                  : telemetry.nitroPercent >= 99
                  ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-white shadow-[0_0_12px_#00f0ff]'
                  : 'bg-gradient-to-r from-cyan-700 via-cyan-500 to-cyan-400'
              }`}
              style={{ width: `${telemetry.nitroPercent}%` }}
            >
              {/* Internal glow line */}
              <div className="absolute inset-y-0 right-0 w-2 bg-white rounded-full opacity-80" />
            </div>

            {/* Segment divider ticks on nitro bar */}
            <div className="absolute inset-0 flex justify-between px-6 pointer-events-none opacity-30">
              <div className="w-[1px] h-full bg-white" />
              <div className="w-[1px] h-full bg-white" />
              <div className="w-[1px] h-full bg-white" />
            </div>
          </div>
        </div>

        {/* Bottom-Right: The Proper Large Circular Speedometer */}
        <div className="flex justify-end items-end">
          <Speedometer
            currentSpeed={telemetry.speedKmh}
            topSpeed={car.topSpeedKmh}
            rpmRatio={telemetry.rpmRatio}
            gear={telemetry.gear}
            isNitro={telemetry.isNitroActive}
          />
        </div>
      </footer>

      {/* 4. ON-SCREEN TOUCH CONTROLS (Rendered for touch devices or enabled in settings) */}
      <div className={`${isMobileTouch ? 'flex' : 'flex sm:hidden'} pointer-events-auto items-center justify-between w-full mt-2 pb-1`}>
        {/* Steering buttons */}
        <div className="flex space-x-3">
          <button
            onTouchStart={() => onMobileInput('steerLeft', true)}
            onTouchEnd={() => onMobileInput('steerLeft', false)}
            onMouseDown={() => onMobileInput('steerLeft', true)}
            onMouseUp={() => onMobileInput('steerLeft', false)}
            className="w-14 h-14 bg-slate-900/80 border border-cyan-500/40 active:bg-cyan-500 active:text-black rounded-xl text-cyan-300 font-['Orbitron'] font-black text-xl flex items-center justify-center select-none"
          >
            ◀
          </button>
          <button
            onTouchStart={() => onMobileInput('steerRight', true)}
            onTouchEnd={() => onMobileInput('steerRight', false)}
            onMouseDown={() => onMobileInput('steerRight', true)}
            onMouseUp={() => onMobileInput('steerRight', false)}
            className="w-14 h-14 bg-slate-900/80 border border-cyan-500/40 active:bg-cyan-500 active:text-black rounded-xl text-cyan-300 font-['Orbitron'] font-black text-xl flex items-center justify-center select-none"
          >
            ▶
          </button>
        </div>

        {/* Gas, Brake, Nitro */}
        <div className="flex space-x-2">
          <button
            onTouchStart={() => onMobileInput('brake', true)}
            onTouchEnd={() => onMobileInput('brake', false)}
            onMouseDown={() => onMobileInput('brake', true)}
            onMouseUp={() => onMobileInput('brake', false)}
            className="w-13 h-13 bg-rose-950/80 border border-rose-500/40 active:bg-rose-500 rounded-xl text-rose-300 font-['Orbitron'] text-xs font-bold flex items-center justify-center select-none"
          >
            BRAKE
          </button>
          <button
            onTouchStart={() => onMobileInput('nitro', true)}
            onTouchEnd={() => onMobileInput('nitro', false)}
            onMouseDown={() => onMobileInput('nitro', true)}
            onMouseUp={() => onMobileInput('nitro', false)}
            className="w-13 h-13 bg-cyan-950/80 border border-cyan-400/60 active:bg-cyan-400 rounded-xl text-cyan-200 font-['Orbitron'] text-xs font-bold flex items-center justify-center select-none"
          >
            NITRO
          </button>
          <button
            onTouchStart={() => onMobileInput('accelerate', true)}
            onTouchEnd={() => onMobileInput('accelerate', false)}
            onMouseDown={() => onMobileInput('accelerate', true)}
            onMouseUp={() => onMobileInput('accelerate', false)}
            className="w-15 h-14 bg-emerald-950/80 border border-emerald-500/50 active:bg-emerald-500 active:text-black rounded-xl text-emerald-300 font-['Orbitron'] text-sm font-bold flex items-center justify-center select-none"
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
