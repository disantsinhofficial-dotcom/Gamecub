import React, { useState } from 'react';
import { GameMetadata, GraphicsConfig, BoosterConfig } from '../../emulator/types';
import { Play, Disc, Cpu, Monitor, Zap, Plus, ShieldCheck, ChevronRight, UploadCloud, FileCode2 } from 'lucide-react';
import { TabKey } from '../shell/Navigation';

interface HomeDashboardProps {
  games: GameMetadata[];
  onLaunchGame: (game: GameMetadata) => void;
  onNavigateTab: (tab: TabKey) => void;
  onImportClick: () => void;
  onFileDrop: (file: File) => void;
  graphicsConfig: GraphicsConfig;
  boosterConfig: BoosterConfig;
  detectedGpu: string;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  games,
  onLaunchGame,
  onNavigateTab,
  onImportClick,
  onFileDrop,
  graphicsConfig,
  boosterConfig,
  detectedGpu,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const featuredGame = games[0] || null;
  const wiiGames = games.filter(g => g.console === 'WII');
  const gcGames = games.filter(g => g.console === 'GAMECUBE');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileDrop(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ROM Drag & Drop Import Banner (High Priority) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onImportClick}
        className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden ${
          isDragging
            ? 'bg-sky-950/80 border-sky-400 shadow-2xl shadow-sky-500/20 scale-[1.01]'
            : 'bg-slate-900/70 border-slate-700/80 hover:border-sky-500/60 hover:bg-slate-900'
        }`}
      >
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-950/90 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 shadow-lg">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white">
            Drag & Drop or Import Any GameCube / Wii ROM
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            Directly load your legally obtained <span className="text-sky-300 font-semibold font-mono-digits">.ISO</span>, <span className="text-sky-300 font-semibold font-mono-digits">.GCM</span>, <span className="text-sky-300 font-semibold font-mono-digits">.WBFS</span>, <span className="text-sky-300 font-semibold font-mono-digits">.RVZ</span>, or homebrew <span className="text-sky-300 font-semibold font-mono-digits">.DOL</span> files. The engine parses disc headers, maps virtual 1T-SRAM memory, and executes via Dolphin PowerPC core.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 font-mono-digits">
            <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">ISO 9660</span>
            <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">GameCube GCM</span>
            <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">Wii WBFS</span>
            <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">RVZ Compressed</span>
            <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">DOL Executable</span>
          </div>
        </div>
      </div>

      {/* Featured Quick Launch Hero Split */}
      {featuredGame && (
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row items-stretch">
          {/* Left Hero Details */}
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6 z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-950/80 border border-sky-500/20 px-2.5 py-0.5 rounded">
                  {featuredGame.console} Core
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dolphin Verified 60 FPS</span>
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight text-balance">
                {featuredGame.title}
              </h1>

              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {featuredGame.notes || 'Full native execution with Vulkan multi-threaded command queues and hybrid ubershader compilation.'}
              </p>

              {/* Zero-Pill Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-digits pt-1">
                <span>{featuredGame.id}</span>
                <span aria-hidden="true">·</span>
                <span>{featuredGame.format}</span>
                <span aria-hidden="true">·</span>
                <span>{featuredGame.fileSize}</span>
                <span aria-hidden="true">·</span>
                <span>{featuredGame.region}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onLaunchGame(featuredGame)}
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/40 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Launch in Dolphin Core</span>
              </button>

              <button
                onClick={() => onNavigateTab('graphics')}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>HD Graphics ({graphicsConfig.internalResolution})</span>
              </button>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="relative md:w-72 lg:w-80 aspect-[3/4] md:aspect-auto overflow-hidden bg-slate-950 shrink-0">
            {featuredGame.coverImage ? (
              <img
                src={featuredGame.coverImage}
                alt={featuredGame.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent md:w-28" />
          </div>
        </div>
      )}

      {/* 4-Column KPI Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigateTab('drivers')}
          className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Graphics Pipeline</span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-sm font-bold text-slate-100 block font-mono-digits uppercase">
            {graphicsConfig.backend} 1.3
          </span>
          <span className="text-[11px] text-slate-400 truncate block">
            {detectedGpu}
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('booster')}
          className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Booster Governor</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-bold text-amber-400 block font-mono-digits uppercase">
            {boosterConfig.profile.replace('_', ' ')}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Target 60.0 FPS · CPU {boosterConfig.cpuOverclockPercent}%
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('graphics')}
          className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Internal Scaling</span>
            <Monitor className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-indigo-300 block font-mono-digits">
            {graphicsConfig.internalResolution} (HD Resolution)
          </span>
          <span className="text-[11px] text-slate-400 block">
            MSAA {graphicsConfig.antiAliasing} · Aniso {graphicsConfig.anisotropicFilter}
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('library')}
          className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Loaded Games</span>
            <Disc className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-emerald-400 block font-mono-digits">
            {games.length} Discs Ready
          </span>
          <span className="text-[11px] text-slate-400 block">
            {wiiGames.length} Wii · {gcGames.length} GameCube
          </span>
        </div>
      </div>

      {/* Nintendo Wii Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-sky-400">Nintendo Wii Titles</span>
              <span className="text-slate-400 font-normal text-xs">· Dolphin 5.0 Core</span>
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('library')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wiiGames.slice(0, 4).map(game => (
            <div
              key={game.id}
              onClick={() => onLaunchGame(game)}
              className="group bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden hover:border-sky-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="aspect-[3/4] bg-slate-950 overflow-hidden relative">
                {game.coverImage ? (
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase text-white bg-slate-950/80 px-2 py-0.5 rounded">
                  Wii
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                  {game.title}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono-digits mt-1">
                  <span>{game.id}</span>
                  <span>·</span>
                  <span>{game.fileSize}</span>
                  <span>·</span>
                  <span className="text-emerald-400">{game.compatibility}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nintendo GameCube Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">Nintendo GameCube Titles</span>
              <span className="text-slate-400 font-normal text-xs">· Gekko 729MHz Execution</span>
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('library')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {gcGames.slice(0, 4).map(game => (
            <div
              key={game.id}
              onClick={() => onLaunchGame(game)}
              className="group bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="aspect-[3/4] bg-slate-950 overflow-hidden relative">
                {game.coverImage ? (
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase text-white bg-slate-950/80 px-2 py-0.5 rounded">
                  GameCube
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {game.title}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono-digits mt-1">
                  <span>{game.id}</span>
                  <span>·</span>
                  <span>{game.fileSize}</span>
                  <span>·</span>
                  <span className="text-emerald-400">{game.compatibility}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
