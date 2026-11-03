import React from 'react';
import { Home, Disc, Gamepad2, Monitor, Cpu, Gauge, Plus } from 'lucide-react';

export type TabKey = 'home' | 'library' | 'controller' | 'graphics' | 'drivers' | 'booster';

interface NavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onImportClick: () => void;
  gameCount: number;
  isGameRunning: boolean;
  onOpenRunningGame: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onImportClick,
  isGameRunning,
  onOpenRunningGame,
}) => {
  const navItems: { id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: Disc },
    { id: 'controller', label: 'Controllers', icon: Gamepad2 },
    { id: 'graphics', label: 'Graphics', icon: Monitor },
    { id: 'drivers', label: 'GPU Drivers', icon: Cpu },
    { id: 'booster', label: 'Game Booster', icon: Gauge },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Bar Contract */}
      <header className="hidden md:flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text wordmark */}
        <button
          onClick={() => onTabChange('home')}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="text-sky-400">Ultra Wii</span>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/60 border border-indigo-500/20 px-2 py-0.5 rounded">
            Dolphin Core
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 pb-1 relative ${
                  isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isGameRunning && (
            <button
              onClick={onOpenRunningGame}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded-lg hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0"
            >
              Resume Game 🎮
            </button>
          )}
          <button
            onClick={onImportClick}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md shadow-sky-950/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Game</span>
          </button>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-900 sticky top-0 z-30">
        <button
          onClick={() => onTabChange('home')}
          className="text-base font-bold text-white flex items-center gap-2"
        >
          <span className="text-sky-400">Ultra Wii</span>
          <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded">Core</span>
        </button>
        <div className="flex items-center gap-2">
          {isGameRunning && (
            <button
              onClick={onOpenRunningGame}
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 rounded-md"
            >
              Resume
            </button>
          )}
          <button
            onClick={onImportClick}
            className="p-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-500 text-xs font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Thumb Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 grid grid-cols-6 items-center h-16 pb-safe">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-medium tracking-tight mt-1 truncate ${
                isActive ? 'text-sky-400 font-semibold' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-1 w-1.5 h-1.5 bg-sky-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
