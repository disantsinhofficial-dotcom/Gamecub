import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Zap, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

interface AndroidBarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  fps?: number;
  cpuTemp?: number;
  isGameRunning?: boolean;
}

export const AndroidBar: React.FC<AndroidBarProps> = ({
  isMuted,
  onToggleMute,
  fps,
  cpuTemp,
  isGameRunning,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="w-full bg-slate-950/95 border-b border-slate-900 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 select-none">
      {/* Left: Time and Gaming Mode */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-slate-200 font-mono-digits">{currentTime || '07:15'}</span>
        <div className="flex items-center gap-1 text-[11px] text-sky-400 font-medium">
          <Zap className="w-3.5 h-3.5 fill-sky-400/20" />
          <span>ColorOS Game Space</span>
        </div>
        {isGameRunning && fps !== undefined && (
          <span className="text-[11px] text-emerald-400 font-mono-digits font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {fps} FPS
          </span>
        )}
      </div>

      {/* Right: Quick system controls & status */}
      <div className="flex items-center gap-3">
        {cpuTemp !== undefined && (
          <span className="font-mono-digits text-[11px] text-slate-400">
            {cpuTemp}°C
          </span>
        )}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <Wifi className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center gap-1 font-mono-digits text-slate-300">
          <span>94%</span>
          <Battery className="w-3.5 h-3.5 rotate-90" />
        </div>
      </div>
    </div>
  );
};
