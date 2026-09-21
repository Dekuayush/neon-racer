import React, { useState, useEffect, useRef } from 'react';
import { musicManager, MusicManagerState } from '../core/MusicManager';
import { soundManager } from '../core/SoundManager';
import {
  X,
  Music,
  Upload,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc,
  Repeat,
  Repeat1,
  Shuffle,
  Trash2,
  AlertCircle,
  Radio,
  FileAudio,
} from 'lucide-react';

interface MusicModalProps {
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MusicModal: React.FC<MusicModalProps> = ({ onClose }) => {
  const [musicState, setMusicState] = useState<MusicManagerState>(musicManager.getState());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  useEffect(() => {
    const unsubscribe = musicManager.subscribe((state) => {
      setMusicState(state);
      if (!isSeeking) {
        setSeekValue(state.currentTime);
      }
    });
    return unsubscribe;
  }, [isSeeking]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    musicManager.addLocalFiles(files);
    soundManager.playUIClick('click');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekValue(val);
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    musicManager.seek(seekValue);
  };

  const cycleRepeatMode = () => {
    soundManager.playUIClick('click');
    if (musicState.playbackMode === 'normal') {
      musicManager.setPlaybackMode('repeat_all');
    } else if (musicState.playbackMode === 'repeat_all') {
      musicManager.setPlaybackMode('repeat_one');
    } else {
      musicManager.setPlaybackMode('normal');
    }
  };

  const toggleShuffle = () => {
    soundManager.playUIClick('click');
    musicManager.toggleShuffle();
  };

  const currentDuration = musicState.duration || 14;
  const displayCurrentTime = isSeeking ? seekValue : musicState.currentTime;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-['Rajdhani'] font-bold text-pink-400 tracking-widest uppercase flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>COCKPIT SOUND SYSTEM // LOCAL AUDIO EMITTER</span>
            </span>
            <h2 className="font-['Orbitron'] font-black text-xl sm:text-2xl text-white tracking-wider">
              MUSIC PLAYER
            </h2>
          </div>
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close Music Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Autoplay blocked banner if browser policy delayed initial sound */}
        {musicState.autoplayBlocked && (
          <div className="mt-3 p-3 bg-pink-950/70 border border-pink-500/80 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(236,72,153,0.3)] animate-pulse">
            <div className="flex items-center space-x-2 text-pink-200 text-xs font-['Rajdhani'] font-bold">
              <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
              <span>BROWSER AUDIO RESTRICTED // CLICK TO UNMUTE SOUNDTRACK</span>
            </div>
            <button
              onClick={() => {
                soundManager.playUIClick('click');
                musicManager.resumeAutoplay();
              }}
              className="px-3 py-1 bg-pink-500 hover:bg-pink-400 text-white font-['Orbitron'] font-black text-xs rounded-lg transition-colors cursor-pointer shadow-[0_0_10px_rgba(236,72,153,0.5)]"
            >
              START MUSIC
            </button>
          </div>
        )}

        {/* Notice if user refreshed browser with previous metadata */}
        {musicState.needsLocalReselection && (
          <div className="mt-3 p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl flex items-center space-x-3 text-amber-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <span>
                Browser security requires selecting your local audio files (.mp3, .wav, .ogg) again after a page reload.
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold font-['Orbitron'] rounded-md text-[11px] cursor-pointer"
            >
              RE-SELECT
            </button>
          </div>
        )}

        {/* Current Playing Track Card */}
        <div className="bg-slate-950/90 border border-slate-800 p-4 sm:p-5 rounded-2xl my-4 shadow-[0_0_20px_rgba(0,0,0,0.7)] flex flex-col space-y-3.5">
          <div className="flex items-center space-x-4">
            {/* Spinning Disc / Vinyl Art */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pink-950/80 to-purple-950/80 border border-pink-500/40 flex items-center justify-center text-pink-300 shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <Disc className={`w-8 h-8 sm:w-9 sm:h-9 ${musicState.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              {musicState.isPlaying && (
                <div className="absolute inset-0 rounded-2xl border-2 border-pink-400/30 animate-ping pointer-events-none" />
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="block font-['Orbitron'] font-bold text-base sm:text-lg text-white truncate">
                  {musicState.currentTrack?.title || 'Cyber Highway Run'}
                </span>
                {musicState.currentTrack?.isCustom ? (
                  <span className="text-[10px] uppercase font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full shrink-0">
                    Local File
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold bg-pink-950 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full shrink-0">
                    Default BGM
                  </span>
                )}
              </div>
              <span className="block font-['Rajdhani'] font-semibold text-xs sm:text-sm text-pink-400/90 truncate mt-0.5">
                {musicState.currentTrack?.artist || 'Neon Wave'}
              </span>
            </div>
          </div>

          {/* Progress / Seek Bar */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                {formatTime(displayCurrentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={currentDuration}
                step="0.1"
                value={displayCurrentTime}
                onMouseDown={() => setIsSeeking(true)}
                onTouchStart={() => setIsSeeking(true)}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="flex-1 accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[11px] font-mono text-slate-400 w-10 text-left">
                {formatTime(currentDuration)}
              </span>
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Controls: Shuffle & Repeat */}
            <div className="flex items-center space-x-2">
              {/* Shuffle Toggle */}
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  musicState.playbackMode === 'shuffle'
                    ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={musicState.playbackMode === 'shuffle' ? 'Shuffle ON (Click to disable)' : 'Shuffle OFF (Click to enable)'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Repeat Toggle */}
              <button
                onClick={cycleRepeatMode}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  musicState.playbackMode === 'repeat_one'
                    ? 'bg-pink-950 border border-pink-400 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                    : musicState.playbackMode === 'repeat_all'
                    ? 'bg-purple-950 border border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={`Repeat: ${
                  musicState.playbackMode === 'repeat_one'
                    ? 'Repeat One'
                    : musicState.playbackMode === 'repeat_all'
                    ? 'Repeat All'
                    : 'Repeat Off'
                } (Click to toggle)`}
              >
                {musicState.playbackMode === 'repeat_one' ? (
                  <>
                    <Repeat1 className="w-4 h-4" />
                    <span className="text-[10px] font-['Orbitron'] font-bold">ONE</span>
                  </>
                ) : musicState.playbackMode === 'repeat_all' ? (
                  <>
                    <Repeat className="w-4 h-4" />
                    <span className="text-[10px] font-['Orbitron'] font-bold">ALL</span>
                  </>
                ) : (
                  <>
                    <Repeat className="w-4 h-4 opacity-50" />
                    <span className="text-[10px] font-['Orbitron'] text-slate-500">OFF</span>
                  </>
                )}
              </button>
            </div>

            {/* Center Controls: Prev, Play/Pause, Next */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  soundManager.playUIClick('click');
                  musicManager.prev();
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-full transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  soundManager.playUIClick('click');
                  musicManager.togglePlay();
                }}
                className="w-12 h-12 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-[0_0_20px_rgba(236,72,153,0.6)]"
                title={musicState.isPlaying ? 'Pause Music' : 'Play Music'}
              >
                {musicState.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  soundManager.playUIClick('click');
                  musicManager.next();
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-full transition-colors cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Right Status Badge */}
            <div className="text-right">
              <span className="text-[10px] font-['Orbitron'] font-bold tracking-widest text-slate-400 uppercase">
                {musicState.isPlaying ? (
                  <span className="text-emerald-400">PLAYING</span>
                ) : (
                  <span className="text-slate-500">PAUSED</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl mb-4">
          <button
            onClick={() => {
              soundManager.playUIClick('click');
              musicManager.setVolumes(1.0, musicState.volume > 0 ? 0 : 0.7);
            }}
            className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
            title="Mute / Unmute"
          >
            {musicState.volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <span className="text-xs font-['Rajdhani'] font-bold text-slate-300 uppercase tracking-wider w-20">
            VOLUME
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={musicState.volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              musicManager.setVolumes(1.0, val);
              soundManager.setMusicVolume(val);
            }}
            className="flex-1 accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-xs font-mono text-cyan-300 w-10 text-right">
            {Math.round(musicState.volume * 100)}%
          </span>
        </div>

        {/* Local Music Import & Playlist Section */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-['Rajdhani'] font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <span>LOCAL PLAYLIST ({musicState.playlist.length} {musicState.playlist.length === 1 ? 'TRACK' : 'TRACKS'})</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                  .MP3 • .WAV • .OGG
                </span>
              </span>
              <p className="text-[11px] text-slate-400">
                Single or multiple local file import. Files stream directly in browser memory without server uploads.
              </p>
            </div>

            <button
              id="add-local-music-btn"
              onClick={() => {
                soundManager.playUIClick('click');
                fileInputRef.current?.click();
              }}
              className="flex items-center space-x-1.5 text-xs font-['Orbitron'] font-bold bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 px-3.5 py-2 rounded-xl hover:bg-cyan-900 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.25)] shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ IMPORT AUDIO</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Playlist Table */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {musicState.playlist.map((track, idx) => {
              const isCurrent = musicState.currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-pink-950/40 border-pink-500/60 shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      soundManager.playUIClick('click');
                      musicManager.selectTrack(idx);
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
                      {isCurrent && musicState.isPlaying ? (
                        <div className="flex items-end space-x-0.5 h-3">
                          <span className="w-0.5 bg-pink-400 animate-pulse h-2" />
                          <span className="w-0.5 bg-pink-400 animate-pulse h-3" style={{ animationDelay: '0.15s' }} />
                          <span className="w-0.5 bg-pink-400 animate-pulse h-1.5" style={{ animationDelay: '0.3s' }} />
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-['Orbitron'] font-bold text-xs truncate ${
                            isCurrent ? 'text-pink-200' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </span>
                        {!track.isCustom && (
                          <span className="text-[9px] font-mono text-pink-400 bg-pink-950/80 border border-pink-500/30 px-1.5 py-0.2 rounded shrink-0">
                            DEFAULT BGM
                          </span>
                        )}
                      </div>
                      <span className="block font-['Rajdhani'] text-[11px] text-slate-400 truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 ml-2">
                    {/* Duration */}
                    <span className="text-[11px] font-mono text-slate-400">
                      {track.duration ? formatTime(track.duration) : '--:--'}
                    </span>

                    {/* Play Button */}
                    <button
                      onClick={() => {
                        soundManager.playUIClick('click');
                        musicManager.selectTrack(idx);
                      }}
                      className={`text-xs font-['Orbitron'] px-2.5 py-1 rounded cursor-pointer transition-colors ${
                        isCurrent
                          ? 'text-pink-300 font-bold bg-pink-950/70 border border-pink-500/40'
                          : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40'
                      }`}
                    >
                      {isCurrent && musicState.isPlaying ? 'ACTIVE' : 'PLAY'}
                    </button>

                    {/* Delete Custom Track */}
                    {track.isCustom && (
                      <button
                        onClick={() => {
                          soundManager.playUIClick('click');
                          musicManager.removeTrack(track.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Remove track from playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {musicState.playlist.length === 1 && (
            <div className="mt-3 p-3.5 rounded-xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center text-slate-500 text-xs">
              <FileAudio className="w-5 h-5 text-slate-600 mb-1" />
              <span>Import your favorite MP3, WAV, or OGG tracks to build your custom cockpit highway playlist!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
