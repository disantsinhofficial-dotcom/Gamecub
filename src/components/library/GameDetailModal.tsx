import React, { useState } from 'react';
import { GameMetadata } from '../../emulator/types';
import { X, Play, Monitor, Cpu, Star, CheckCircle2, Sliders } from 'lucide-react';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface GameDetailModalProps {
  game: GameMetadata | null;
  onClose: () => void;
  onLaunch: (game: GameMetadata) => void;
  onToggleFavorite: (id: string) => void;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  game,
  onClose,
  onLaunch,
  onToggleFavorite,
}) => {
  if (!game) return null;

  const [customResolution, setCustomResolution] = useState<'default' | '1x' | '2x' | '3x' | '4x'>('default');
  const [widescreenOverride, setWidescreenOverride] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header with Cover Backdrop */}
        <div className="relative h-44 bg-slate-950 overflow-hidden flex items-end p-5">
          {game.coverImage && (
            <img
              src={game.coverImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title on Backdrop */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-22 rounded-lg bg-slate-950 border border-slate-700 overflow-hidden shadow-lg shrink-0">
              {game.coverImage ? (
                <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold">
                  {game.console}
                </div>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                {game.console} · {game.region}
              </span>
              <h2 className="text-base font-bold text-white line-clamp-2">{game.title}</h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono-digits mt-1">
                <span>ID: {game.id}</span>
                <span>·</span>
                <span>{game.format}</span>
                <span>·</span>
                <span>{game.fileSize}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Compatibility & Recommended Profile */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Dolphin Compatibility Rating</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{game.compatibility} (5 / 5)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono-digits">
              <span>Optimal Graphics Backend:</span>
              <span className="text-sky-400 font-bold uppercase">{game.recommendedBackend} 1.3</span>
            </div>
            {game.notes && (
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 leading-relaxed">
                {game.notes}
              </p>
            )}
          </div>

          {/* Per-Game Individual Graphics Overrides */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Per-Game Hardware Overrides</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Resolution Override</span>
                <select
                  value={customResolution}
                  onChange={e => setCustomResolution(e.target.value as 'default' | '1x' | '2x' | '3x' | '4x')}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1"
                >
                  <option value="default">Global Config</option>
                  <option value="1x">Force 1x (480p)</option>
                  <option value="2x">Force 2x (720p)</option>
                  <option value="3x">Force 3x (1080p)</option>
                  <option value="4x">Force 4x (1440p)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-200 block font-medium">Widescreen 16:9</span>
                  <span className="text-[10px] text-slate-500">Gecko 3D patch</span>
                </div>
                <input
                  type="checkbox"
                  checked={widescreenOverride}
                  onChange={e => setWidescreenOverride(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onToggleFavorite(game.id)}
            className="px-3 py-2 rounded-xl text-slate-300 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <Star className={`w-4 h-4 ${game.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>{game.isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onLaunch(game);
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl flex items-center gap-1.5 shadow-lg shadow-sky-950/40"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Title</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
