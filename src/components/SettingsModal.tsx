import React from 'react';
import { GameSettings, GraphicsQuality } from '../types/game';
import { soundManager } from '../core/SoundManager';
import { X, Sliders, Volume2, Monitor, Keyboard } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);

    if (key === 'masterVolume' || key === 'sfxVolume' || key === 'musicVolume') {
      soundManager.setVolumes(
        key === 'masterVolume' ? (value as number) : settings.masterVolume,
        key === 'sfxVolume' ? (value as number) : settings.sfxVolume,
        key === 'musicVolume' ? (value as number) : settings.musicVolume
      );
    }
  };

  const qualities: GraphicsQuality[] = ['auto', 'low', 'medium', 'high', 'ultra'];

  return (
    <div className="fixed inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-[0_0_35px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-['Rajdhani'] font-bold text-cyan-400 tracking-widest uppercase">
              SYSTEM CONFIGURATION
            </span>
            <h2 className="font-['Orbitron'] font-black text-2xl text-white">
              SETTINGS
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

        {/* 1. Graphics Quality */}
        <div className="my-5">
          <div className="flex items-center space-x-2 text-slate-300 mb-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-['Rajdhani'] font-bold uppercase tracking-wider">
              GRAPHICS PRESET
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {qualities.map(q => (
              <button
                key={q}
                onClick={() => {
                  soundManager.playUIClick('click');
                  updateSetting('graphics', q);
                }}
                className={`py-2 px-2 rounded-xl font-['Orbitron'] font-bold text-[11px] uppercase tracking-wider border transition-all cursor-pointer ${
                  settings.graphics === q
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Visual Toggles */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { label: 'Bloom Glow', key: 'bloom' as const },
              { label: 'Wet Road Reflections', key: 'reflections' as const },
              { label: 'Exhaust & Spark Particles', key: 'particles' as const },
              { label: 'Camera Impact Shake', key: 'cameraShake' as const },
              { label: 'On-Screen Touch Buttons', key: 'touchControls' as const },
            ].map(t => (
              <label
                key={t.key}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer"
              >
                <span className="font-['Rajdhani'] font-semibold text-xs text-slate-300">
                  {t.label}
                </span>
                <input
                  type="checkbox"
                  checked={settings[t.key]}
                  onChange={e => updateSetting(t.key, e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        {/* 2. Audio Volumes */}
        <div className="my-5 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-slate-300 mb-3">
            <Volume2 className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-['Rajdhani'] font-bold uppercase tracking-wider">
              AUDIO MIXER
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400">MASTER VOLUME</span>
                <span className="font-mono text-cyan-300">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={e => updateSetting('masterVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400">SFX / ENGINE / NITRO</span>
                <span className="font-mono text-cyan-300">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={e => updateSetting('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400">MUSIC / SOUNDTRACK</span>
                <span className="font-mono text-cyan-300">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={e => updateSetting('musicVolume', parseFloat(e.target.value))}
                className="w-full accent-pink-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Controls Reference Card */}
        <div className="my-5 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-slate-300 mb-2">
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-['Rajdhani'] font-bold uppercase tracking-wider">
              CONTROLS REFERENCE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="block text-cyan-400 font-bold">W / ↑</span>
              <span className="text-slate-400 text-[10px]">ACCELERATE</span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="block text-cyan-400 font-bold">S / ↓</span>
              <span className="text-slate-400 text-[10px]">BRAKE / REVERSE</span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="block text-cyan-400 font-bold">A / D or ← / →</span>
              <span className="text-slate-400 text-[10px]">STEER</span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="block text-cyan-400 font-bold">SPACE</span>
              <span className="text-slate-400 text-[10px]">NITRO BOOST</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onClose();
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.5)]"
          >
            SAVE CONFIG
          </button>
        </div>
      </div>
    </div>
  );
};
