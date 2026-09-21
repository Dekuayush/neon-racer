import React from 'react';
import { GameMode, Difficulty } from '../types/game';
import { soundManager } from '../core/SoundManager';
import { X, Infinity as InfinityIcon, Timer, Zap, ShieldAlert, Target, Compass } from 'lucide-react';

interface GameModesModalProps {
  currentMode: GameMode;
  currentDifficulty: Difficulty;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficulty: (diff: Difficulty) => void;
  onClose: () => void;
}

export const GameModesModal: React.FC<GameModesModalProps> = ({
  currentMode,
  currentDifficulty,
  onSelectMode,
  onSelectDifficulty,
  onClose,
}) => {
  const modes: { id: GameMode; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'endless',
      title: 'ENDLESS RACE',
      desc: 'Infinite cyber highway. Dodge dynamic traffic, collect boost pads, and set the all-time highest score.',
      icon: <InfinityIcon className="w-5 h-5" />,
      color: 'text-cyan-400',
    },
    {
      id: 'time_attack',
      title: 'TIME ATTACK',
      desc: '75-second countdown. Every boost pad and near-miss extends your timer. Push maximum velocity.',
      icon: <Timer className="w-5 h-5" />,
      color: 'text-amber-400',
    },
    {
      id: 'traffic_rush',
      title: 'TRAFFIC RUSH',
      desc: 'Dense autonomous civilian grid. Navigate heavy multi-lane highway congestion at top speed.',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-rose-400',
    },
    {
      id: 'survival',
      title: 'SURVIVAL',
      desc: 'Finite hull integrity (100% health). Severe impact consequences. Survive as far as you can.',
      icon: <ShieldAlert className="w-5 h-5" />,
      color: 'text-emerald-400',
    },
    {
      id: 'challenge',
      title: 'CHALLENGES',
      desc: 'Objective-based trials: reach 250 KM/H, perform 10 near misses, chain multi-stage combos.',
      icon: <Target className="w-5 h-5" />,
      color: 'text-purple-400',
    },
    {
      id: 'free_ride',
      title: 'FREE RIDE',
      desc: 'No stress, no failure state, pure cyberpunk synthwave driving vibes on an infinite wet highway.',
      icon: <Compass className="w-5 h-5" />,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-[0_0_35px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-['Rajdhani'] font-bold text-cyan-400 tracking-widest uppercase">
              SELECT OBJECTIVE
            </span>
            <h2 className="font-['Orbitron'] font-black text-2xl text-white">
              GAME MODES
            </h2>
          </div>
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/80 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Selection */}
        <div className="my-5">
          <span className="block text-xs font-['Rajdhani'] font-bold text-slate-400 uppercase tracking-wider mb-2">
            GRID DIFFICULTY
          </span>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => (
              <button
                key={diff}
                onClick={() => {
                  soundManager.playUIClick('click');
                  onSelectDifficulty(diff);
                }}
                className={`py-2.5 px-4 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider border transition-all cursor-pointer ${
                  currentDifficulty === diff
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.6)]'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                {diff.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Modes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
          {modes.map(mode => {
            const isSelected = currentMode === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => {
                  soundManager.playUIClick('click');
                  onSelectMode(mode.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2.5 mb-1.5">
                    <span className={mode.color}>{mode.icon}</span>
                    <h3 className="font-['Orbitron'] font-bold text-base text-white">
                      {mode.title}
                    </h3>
                  </div>
                  <p className="font-['Rajdhani'] text-xs text-slate-400 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <span className={`text-[11px] font-['Orbitron'] font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}>
                    {isSelected ? 'SELECTED' : 'SELECT'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Confirm */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onClose();
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.5)]"
          >
            CONFIRM SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
