import React from 'react';
import { soundManager } from '../core/SoundManager';
import { RotateCcw, Wrench, Home, Trophy, Gauge, Route, Zap, Flame, Sliders } from 'lucide-react';

interface GameOverModalProps {
  stats: {
    score: number;
    distance: number;
    maxSpeed: number;
    nearMisses: number;
    bestCombo: number;
  };
  isNewHighScore: boolean;
  onRetry: () => void;
  onGarage: () => void;
  onMainMenu: () => void;
  onOpenModes?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHighScore,
  onRetry,
  onGarage,
  onMainMenu,
  onOpenModes,
}) => {
  return (
    <div id="gameover-modal" className="fixed inset-0 z-30 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.9)] text-center animate-fade-in">
        <span className="font-['Rajdhani'] font-bold text-xs tracking-[0.35em] text-rose-400 uppercase">
          SESSION TERMINATED
        </span>
        <h2 className="font-['Orbitron'] font-black text-4xl sm:text-5xl text-white tracking-wider my-2">
          RACE OVER
        </h2>

        {isNewHighScore && (
          <div className="my-3 inline-block bg-amber-500/20 border border-amber-400/60 px-4 py-1 rounded-full animate-bounce">
            <span className="font-['Orbitron'] font-bold text-xs text-amber-300 tracking-wider flex items-center">
              <Trophy className="w-3.5 h-3.5 mr-1.5" /> NEW PERSONAL BEST RECORD!
            </span>
          </div>
        )}

        {/* Primary Score Highlight */}
        <div className="my-5 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <span className="block font-['Rajdhani'] font-bold text-xs text-slate-400 uppercase tracking-widest">
            FINAL SCORE
          </span>
          <span className="block font-['Orbitron'] font-black text-3xl sm:text-5xl text-cyan-400 tracking-wider my-1 drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]">
            {stats.score.toLocaleString()}
          </span>
        </div>

        {/* Telemetry Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl text-left">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-['Rajdhani'] font-bold mb-1">
              <Route className="w-3.5 h-3.5 text-cyan-400" />
              <span>DISTANCE</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-lg text-white">
              {(stats.distance / 1000).toFixed(2)} KM
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl text-left">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-['Rajdhani'] font-bold mb-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>MAX SPEED</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-lg text-amber-300">
              {stats.maxSpeed} KM/H
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl text-left">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-['Rajdhani'] font-bold mb-1">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>NEAR MISSES</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-lg text-rose-400">
              {stats.nearMisses}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl text-left">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-['Rajdhani'] font-bold mb-1">
              <Flame className="w-3.5 h-3.5 text-pink-400" />
              <span>BEST COMBO</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-lg text-pink-300">
              x{stats.bestCombo}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 mt-6">
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onRetry();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black py-3.5 rounded-xl font-['Orbitron'] font-black text-sm tracking-wider cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.6)]"
          >
            <RotateCcw className="w-4 h-4 fill-black" />
            <span>RETRY RUN</span>
          </button>

          {onOpenModes && (
            <button
              onClick={() => {
                soundManager.playUIClick('click');
                onOpenModes();
              }}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>CHANGE MODE / DIFFICULTY</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundManager.playUIClick('click');
                onGarage();
              }}
              className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={() => {
                soundManager.playUIClick('click');
                onMainMenu();
              }}
              className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
