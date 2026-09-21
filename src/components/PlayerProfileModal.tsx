import React, { useState } from 'react';
import { PlayerProfile, ChallengeDef } from '../types/game';
import { soundManager } from '../core/SoundManager';
import { X, User, Trophy, Award, Gauge, Route, Zap, Edit2, Check } from 'lucide-react';

interface PlayerProfileModalProps {
  profile: PlayerProfile;
  challenges: ChallengeDef[];
  onSaveProfile: (profile: PlayerProfile) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  profile,
  challenges,
  onSaveProfile,
  onClose,
}) => {
  const [name, setName] = useState(profile.name);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveName = () => {
    if (!name.trim()) return;
    onSaveProfile({ ...profile, name: name.trim() });
    setIsEditing(false);
    soundManager.playUIClick('click');
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-[0_0_35px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-['Rajdhani'] font-bold text-cyan-400 tracking-widest uppercase">
              PILOT DOSSIER
            </span>
            <h2 className="font-['Orbitron'] font-black text-2xl text-white">
              PLAYER PROFILE
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

        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 bg-slate-950/70 border border-slate-800 p-5 rounded-xl my-4">
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <User className="w-10 h-10" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={16}
                    className="bg-slate-900 border border-cyan-400 px-3 py-1 rounded font-['Orbitron'] font-bold text-lg text-white"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 bg-cyan-500 text-black rounded hover:bg-cyan-400 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="font-['Orbitron'] font-black text-2xl text-white">
                    {profile.name}
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-3 mt-1">
              <span className="font-['Orbitron'] font-bold text-xs text-cyan-400">
                LEVEL {profile.level}
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="font-['Rajdhani'] font-semibold text-xs text-slate-400">
                {profile.racesPlayed} RUNS LOGGED
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center space-x-1.5 text-cyan-400 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-['Rajdhani'] font-bold">HIGH SCORE</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-base text-white">
              {profile.highScore.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center space-x-1.5 text-amber-400 mb-1">
              <Gauge className="w-3.5 h-3.5" />
              <span className="text-[10px] font-['Rajdhani'] font-bold">TOP SPEED</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-base text-amber-300">
              {profile.topSpeedKmh} KM/H
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center space-x-1.5 text-emerald-400 mb-1">
              <Route className="w-3.5 h-3.5" />
              <span className="text-[10px] font-['Rajdhani'] font-bold">DISTANCE</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-base text-white">
              {(profile.totalDistanceMeters / 1000).toFixed(1)} KM
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center space-x-1.5 text-rose-400 mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-['Rajdhani'] font-bold">NEAR MISSES</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-base text-rose-300">
              {profile.nearMissesCount}
            </span>
          </div>
        </div>

        {/* Challenges & Milestones */}
        <div className="my-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-['Rajdhani'] font-bold text-slate-400 uppercase tracking-wider">
              PILOT CHALLENGES
            </span>
            <span className="text-xs font-['Orbitron'] text-cyan-400">
              {challenges.filter(c => c.completed).length} / {challenges.length} COMPLETED
            </span>
          </div>

          <div className="space-y-2">
            {challenges.map(c => (
              <div
                key={c.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  c.completed
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <Award className={`w-4 h-4 ${c.completed ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="font-['Orbitron'] font-bold text-xs text-white">
                      {c.title}
                    </span>
                  </div>
                  <p className="font-['Rajdhani'] text-xs text-slate-400 mt-0.5">
                    {c.description}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-['Orbitron'] font-bold px-2 py-0.5 rounded ${
                    c.completed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {c.completed ? 'COMPLETED' : 'IN PROGRESS'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
