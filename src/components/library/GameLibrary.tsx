import React, { useState } from 'react';
import { GameMetadata } from '../../emulator/types';
import { Search, Plus, Star, Play, Info, Trash2, Grid, List, UploadCloud, FileCheck2 } from 'lucide-react';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface GameLibraryProps {
  games: GameMetadata[];
  onLaunchGame: (game: GameMetadata) => void;
  onImportClick: () => void;
  onToggleFavorite: (id: string) => void;
  onRemoveGame: (id: string) => void;
  onSelectGameDetails: (game: GameMetadata) => void;
}

export const GameLibrary: React.FC<GameLibraryProps> = ({
  games,
  onLaunchGame,
  onImportClick,
  onToggleFavorite,
  onRemoveGame,
  onSelectGameDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'wii' | 'gamecube' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'lastPlayed' | 'fileSize'>('title');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredGames = games.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'wii') return g.console === 'WII';
    if (filterTab === 'gamecube') return g.console === 'GAMECUBE';
    if (filterTab === 'favorites') return g.isFavorite;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'lastPlayed') return (b.lastPlayed || '').localeCompare(a.lastPlayed || '');
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Quick Import Header Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-sky-400" />
            <span>Nintendo Disc & ROM Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Support for GameCube (.iso, .gcm, .dol) and Wii (.iso, .wbfs, .rvz) images.
          </p>
        </div>

        <button
          onClick={onImportClick}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-sky-950/40 shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import ROM File</span>
        </button>
      </div>

      {/* Top Filter and Search Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search game title, Game ID (e.g. GALE01, RMCE01)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Action Controls & View Mode */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Filter Tabs (Interactive Segmented Control) */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'All Discs' },
              { id: 'wii', label: 'Wii' },
              { id: 'gamecube', label: 'GameCube' },
              { id: 'favorites', label: 'Favorites' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterTab(tab.id as 'all' | 'wii' | 'gamecube' | 'favorites');
                  audioSynthesizer.playWiiRemoteClick();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterTab === tab.id
                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid/List Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-sky-400' : 'text-slate-500'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-sky-400' : 'text-slate-500'}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Game Cards Container */}
      {filteredGames.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">No games found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Import a Nintendo Wii or GameCube disc image (.iso, .rvz, .wbfs, .gcm, .dol) to begin.
            </p>
          </div>
          <button
            onClick={onImportClick}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Game Image</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredGames.map(game => (
            <div
              key={game.id}
              className="group bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-950/20 transition-all flex flex-col justify-between"
            >
              {/* Cover Art Box with Aspect 3:4 */}
              <div
                onClick={() => onLaunchGame(game)}
                className="relative aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer"
              >
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

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Console Kicker */}
                <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase tracking-wider text-white/90 bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded">
                  {game.console}
                </span>

                {/* Favorite Star Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(game.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <Star className={`w-3.5 h-3.5 ${game.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                </button>

                {/* Launch Button Floating on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xl shadow-sky-950/60 transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title & Metadata (Clean Unboxed Text with Separators) */}
              <div className="p-3 space-y-2">
                <h3
                  onClick={() => onLaunchGame(game)}
                  title={game.title}
                  className="text-xs font-bold text-white hover:text-sky-300 transition-colors truncate cursor-pointer"
                >
                  {game.title}
                </h3>

                {/* Zero-Pill Metadata */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono-digits">
                  <span>{game.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{game.format}</span>
                  <span aria-hidden="true">·</span>
                  <span>{game.fileSize}</span>
                </div>

                {/* Actions row */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => onLaunchGame(game)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-sky-400" />
                    <span>Play</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectGameDetails(game)}
                      title="Game Properties & Dolphin Settings"
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {!game.isBundled && (
                      <button
                        onClick={() => onRemoveGame(game.id)}
                        title="Remove from library (does not delete file)"
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
          {filteredGames.map(game => (
            <div
              key={game.id}
              className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-14 bg-slate-950 rounded overflow-hidden shrink-0">
                  {game.coverImage ? (
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-mono-digits font-bold">
                      {game.console}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4
                    onClick={() => onLaunchGame(game)}
                    className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors truncate cursor-pointer"
                  >
                    {game.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono-digits mt-0.5">
                    <span>{game.console}</span>
                    <span aria-hidden="true">·</span>
                    <span>{game.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{game.format}</span>
                    <span aria-hidden="true">·</span>
                    <span>{game.fileSize}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400">{game.compatibility}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onLaunchGame(game)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Play</span>
                </button>
                <button
                  onClick={() => onSelectGameDetails(game)}
                  className="p-1.5 text-slate-400 hover:text-slate-200"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
