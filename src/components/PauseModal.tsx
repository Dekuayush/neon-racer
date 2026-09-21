import React from 'react';
import { soundManager } from '../core/SoundManager';
import { Play, RotateCcw, Settings, Music, Home, Sliders } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onOpenMusic: () => void;
  onQuitToMenu: () => void;
  onOpenModes?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onOpenMusic,
  onQuitToMenu,
  onOpenModes,
}) => {
  return (
    <div id="pause-modal" className="fixed inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-[0_0_35px_rgba(0,240,255,0.3)] text-center">
        <span className="font-['Rajdhani'] font-bold text-xs tracking-[0.3em] text-cyan-400 uppercase">
          SIMULATION SUSPENDED
        </span>
        <h2 className="font-['Orbitron'] font-black text-3xl sm:text-4xl text-white tracking-wider my-2">
          PAUSED
        </h2>

        <div className="space-y-3 mt-6">
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onResume();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black py-3.5 rounded-xl font-['Orbitron'] font-black text-sm tracking-wider cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.6)]"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>RESUME RACE</span>
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onRestart();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESTART</span>
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
              <span>GAME MODES & DIFFICULTY</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onOpenSettings();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onOpenMusic();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-3 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer"
          >
            <Music className="w-4 h-4 text-pink-400" />
            <span>MUSIC / AUDIO</span>
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onQuitToMenu();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 py-3 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer"
          >
            <Home className="w-4 h-4 text-rose-400" />
            <span>QUIT TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
