import React from 'react';
import { CarStats } from '../types/game';
import { CARS_CATALOG } from '../data/cars';
import { soundManager } from '../core/SoundManager';
import { Check, Lock, ChevronLeft, ChevronRight, Gauge, Zap, Crosshair, Flame, Shield } from 'lucide-react';

interface GarageModalProps {
  currentCar: CarStats;
  unlockedCarIds: string[];
  onSelectCar: (car: CarStats) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  currentCar,
  unlockedCarIds,
  onSelectCar,
  onClose,
}) => {
  const currentIndex = CARS_CATALOG.findIndex(c => c.id === currentCar.id);

  const selectIndex = (idx: number) => {
    const validIdx = (idx + CARS_CATALOG.length) % CARS_CATALOG.length;
    const car = CARS_CATALOG[validIdx];
    soundManager.playUIClick('click');
    onSelectCar(car);
  };

  const isUnlocked = unlockedCarIds.includes(currentCar.id);

  return (
    <div id="garage-modal" className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-6 sm:p-10">
      {/* Top Bar */}
      <header className="flex items-center justify-between pointer-events-auto">
        <div>
          <span className="font-['Rajdhani'] font-bold text-xs text-cyan-400 tracking-[0.25em] uppercase">
            CHASSIS SHOWROOM // 3D INSPECT
          </span>
          <h2 className="font-['Orbitron'] font-black text-3xl sm:text-4xl text-white tracking-wider">
            CYBER GARAGE
          </h2>
        </div>

        <button
          onClick={() => {
            soundManager.playUIClick('click');
            onClose();
          }}
          className="bg-slate-900/80 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-400/50 px-5 py-2.5 rounded-xl font-['Orbitron'] font-bold text-xs text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-md"
        >
          BACK TO MENU
        </button>
      </header>

      {/* Middle Carousel Controls */}
      <div className="flex items-center justify-between pointer-events-auto w-full">
        <button
          onClick={() => selectIndex(currentIndex - 1)}
          className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400/60 flex items-center justify-center text-cyan-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.7)]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => selectIndex(currentIndex + 1)}
          className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400/60 flex items-center justify-center text-cyan-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.7)]"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Panel: Car Specs & Selector */}
      <footer className="pointer-events-auto flex flex-col sm:flex-row items-end justify-between gap-6">
        {/* Car selector pills */}
        <div className="flex space-x-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-md">
          {CARS_CATALOG.map((car, idx) => {
            const isSelected = car.id === currentCar.id;
            const unlocked = unlockedCarIds.includes(car.id);
            return (
              <button
                key={car.id}
                onClick={() => selectIndex(idx)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-['Orbitron'] font-bold text-xs tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.7)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {!unlocked && <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />}
                <span>{car.name}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Stats Card */}
        <div className="bg-slate-900/85 border border-slate-700/80 p-6 rounded-2xl backdrop-blur-xl w-full sm:w-96 shadow-[0_0_25px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-['Orbitron'] font-black text-2xl text-white">
                {currentCar.name}
              </h3>
              <p className="font-['Rajdhani'] font-semibold text-xs text-cyan-400">
                {currentCar.tagline}
              </p>
            </div>
            {isUnlocked ? (
              <span className="flex items-center text-xs font-['Orbitron'] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <Check className="w-3.5 h-3.5 mr-1" /> READY
              </span>
            ) : (
              <span className="flex items-center text-xs font-['Orbitron'] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5 mr-1" /> LOCKED
              </span>
            )}
          </div>

          {/* Stats meters */}
          <div className="space-y-2.5 mt-4">
            {/* Top Speed */}
            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400 flex items-center">
                  <Gauge className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> TOP SPEED
                </span>
                <span className="font-['Orbitron'] text-cyan-300">
                  {currentCar.topSpeedKmh} KM/H
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${(currentCar.topSpeedKmh / 360) * 100}%` }}
                />
              </div>
            </div>

            {/* Acceleration */}
            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400 flex items-center">
                  <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> ACCELERATION
                </span>
                <span className="font-['Orbitron'] text-white">
                  {currentCar.acceleration}/100
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${currentCar.acceleration}%` }}
                />
              </div>
            </div>

            {/* Handling */}
            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400 flex items-center">
                  <Crosshair className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> HANDLING
                </span>
                <span className="font-['Orbitron'] text-white">
                  {currentCar.handling}/100
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${currentCar.handling}%` }}
                />
              </div>
            </div>

            {/* Nitro */}
            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400 flex items-center">
                  <Flame className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> NITRO MULTIPLIER
                </span>
                <span className="font-['Orbitron'] text-rose-300">
                  {currentCar.nitroMultiplier}x
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${((currentCar.nitroMultiplier - 1) / 0.8) * 100}%` }}
                />
              </div>
            </div>

            {/* Braking */}
            <div>
              <div className="flex justify-between text-xs font-['Rajdhani'] font-bold mb-1">
                <span className="text-slate-400 flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> BRAKING
                </span>
                <span className="font-['Orbitron'] text-white">
                  {currentCar.brakingPower}/100
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${currentCar.brakingPower}%` }}
                />
              </div>
            </div>
          </div>

          {!isUnlocked && currentCar.unlockRequirement && (
            <div className="mt-4 p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl">
              <span className="block font-['Rajdhani'] font-bold text-xs text-amber-300">
                REQUIREMENT: {currentCar.unlockRequirement}
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
