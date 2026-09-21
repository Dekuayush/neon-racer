import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 250);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18 + 8);
      });
    }, 90);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] flex flex-col items-center justify-center p-6 select-none">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-['Orbitron'] font-black italic text-5xl sm:text-7xl text-cyan-400 drop-shadow-[0_0_30px_rgba(0,240,255,0.9)] tracking-wider">
          NEON <span className="text-white">RACER</span>
        </h1>
        <p className="font-['Rajdhani'] font-bold text-sm sm:text-base text-slate-400 tracking-[0.3em] uppercase mt-2">
          3D CYBERNETIC HIGHWAY SIMULATION
        </p>
      </div>

      {/* Progress Container */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs font-['Orbitron'] font-bold text-slate-400 mb-2">
          <span className="text-cyan-400">INITIALIZING SHADERS & MESHES...</span>
          <span className="text-white">{progress}%</span>
        </div>

        {/* Progress bar with glowing cyan head */}
        <div className="w-full h-3 bg-slate-900 border border-slate-700/80 rounded-full overflow-hidden p-0.5 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-white rounded-full transition-all duration-100 shadow-[0_0_15px_#00f0ff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-['Rajdhani'] font-semibold text-slate-500 mt-3">
          <span>WEBGL 2.0 // HIGH PERFORMANCE ENGINE</span>
          <span>AUDIO ENGINE: READY</span>
        </div>
      </div>
    </div>
  );
};
