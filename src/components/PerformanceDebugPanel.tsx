import React, { useEffect, useState } from 'react';
import { PerformanceStats } from '../types/game';

interface PerformanceDebugPanelProps {
  stats: PerformanceStats;
}

export const PerformanceDebugPanel: React.FC<PerformanceDebugPanelProps> = ({ stats }) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on F3 key
      if (e.key === 'F3' || e.code === 'F3') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <aside
      id="dev-perf-panel"
      aria-label="Developer Performance Panel"
      className="fixed top-4 left-4 z-50 bg-slate-950/95 border border-cyan-500/70 p-4 rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.4)] backdrop-blur-md font-mono text-xs text-white max-w-xs select-none pointer-events-auto"
    >
      <header className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/30">
        <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          F3 DEV MONITOR
        </span>
        <button
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded text-[10px] bg-slate-800"
          aria-label="Close performance panel"
        >
          ESC/F3
        </button>
      </header>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">FPS / Frame Time:</span>
          <span
            className={`font-bold ${
              stats.fps >= 55 ? 'text-emerald-400' : stats.fps >= 40 ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {stats.fps} FPS ({stats.frameTimeMs} ms)
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Quality Profile:</span>
          <span className="text-cyan-300 font-bold">{stats.qualityProfile}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Renderer Backend:</span>
          <span className="text-slate-200">{stats.rendererBackend}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Draw Calls:</span>
          <span className="text-cyan-200">{stats.drawCalls}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Triangles:</span>
          <span className="text-cyan-200">{stats.triangles.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Pixel Ratio / Scale:</span>
          <span className="text-amber-300">
            {stats.pixelRatio}x / {stats.renderScale * 100}%
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Active Traffic:</span>
          <span className="text-purple-300">{stats.activeTraffic} cars</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Active Particles:</span>
          <span className="text-blue-300">{stats.activeParticles}</span>
        </div>
      </div>
    </aside>
  );
};
