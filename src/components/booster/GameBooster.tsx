import React, { useState } from 'react';
import { BoosterConfig, BoosterProfile } from '../../emulator/types';
import { Gauge, Flame, BatteryCharging, Shield, Activity, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface GameBoosterProps {
  config: BoosterConfig;
  onChange: (newConfig: BoosterConfig) => void;
  liveTelemetry: {
    fps: number;
    frameTimeMs: number;
    cpuLoad: number;
    temp: number;
  };
}

export const GameBooster: React.FC<GameBoosterProps> = ({
  config,
  onChange,
  liveTelemetry,
}) => {
  const [cleaningRam, setCleaningRam] = useState(false);
  const [cleanedNotice, setCleanedNotice] = useState(false);

  const handleProfileSelect = (profile: BoosterProfile) => {
    let cpuOverclock = 100;
    let targetFPS = 60;
    if (profile === 'extreme_boost') {
      cpuOverclock = 120;
      targetFPS = 60;
    } else if (profile === 'battery_saver') {
      cpuOverclock = 80;
      targetFPS = 30;
    }

    onChange({
      ...config,
      profile,
      cpuOverclockPercent: cpuOverclock,
      targetFPS,
    });
    audioSynthesizer.playWiiRemoteClick();
  };

  const handleCleanMemory = () => {
    setCleaningRam(true);
    audioSynthesizer.playWiiRemoteClick();
    setTimeout(() => {
      setCleaningRam(false);
      setCleanedNotice(true);
      setTimeout(() => setCleanedNotice(false), 2500);
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-sky-400" />
            <span>ColorOS Game Space & Booster</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic hardware orchestration, CPU thread prioritization, thermal regulation, and frame pacing.
          </p>
        </div>

        <button
          onClick={handleCleanMemory}
          disabled={cleaningRam}
          className="px-3.5 py-2 text-xs font-semibold text-sky-300 bg-sky-950/60 border border-sky-500/30 hover:bg-sky-900/60 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cleaningRam ? 'animate-spin' : ''}`} />
          <span>{cleanedNotice ? 'RAM Purged (+380MB freed)' : 'Clean Background RAM'}</span>
        </button>
      </div>

      {/* 3 Core Performance Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Extreme Boost */}
        <div
          onClick={() => handleProfileSelect('extreme_boost')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            config.profile === 'extreme_boost'
              ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-amber-500/80 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Flame className={`w-6 h-6 ${config.profile === 'extreme_boost' ? 'text-amber-400' : 'text-slate-500'}`} />
            {config.profile === 'extreme_boost' && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                ACTIVE
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mt-3">Extreme Boost Mode</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Prioritizes raw emulator frame execution. Multi-threading and JIT cache maxed out for locked 60 FPS in heavy titles.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-digits text-slate-400">
            <span>CPU Clock: 120%</span>
            <span className="text-amber-400">Target: 60 FPS</span>
          </div>
        </div>

        {/* Balanced Mode */}
        <div
          onClick={() => handleProfileSelect('balanced')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            config.profile === 'balanced'
              ? 'bg-gradient-to-br from-sky-950/60 via-slate-900 to-slate-950 border-sky-400 shadow-lg shadow-sky-950/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Shield className={`w-6 h-6 ${config.profile === 'balanced' ? 'text-sky-400' : 'text-slate-500'}`} />
            {config.profile === 'balanced' && (
              <span className="text-[10px] font-bold text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/40">
                ACTIVE
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mt-3">Balanced Mode</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            The ideal profile for standard gaming sessions. Dynamic frame pacing maintains silky 60 FPS while managing temperatures.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-digits text-slate-400">
            <span>CPU Clock: 100%</span>
            <span className="text-sky-400">Target: 60 FPS</span>
          </div>
        </div>

        {/* Battery Saver */}
        <div
          onClick={() => handleProfileSelect('battery_saver')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            config.profile === 'battery_saver'
              ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-400 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <BatteryCharging className={`w-6 h-6 ${config.profile === 'battery_saver' ? 'text-emerald-400' : 'text-slate-500'}`} />
            {config.profile === 'battery_saver' && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                ACTIVE
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mt-3">Battery Saver Mode</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Reduces emulator power draw by ~45%. Locks refresh rate to 30 FPS and throttles idle cycles for extended road trips.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-digits text-slate-400">
            <span>CPU Clock: 80%</span>
            <span className="text-emerald-400">Target: 30 FPS</span>
          </div>
        </div>
      </div>

      {/* Live Hardware Telemetry Strip */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Real-Time Emulation Telemetry</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono-digits">60Hz Pacing Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Framerate</span>
            <span className="text-2xl font-extrabold text-white font-mono-digits mt-1 block">
              {liveTelemetry.fps} <span className="text-xs text-emerald-400 font-medium">FPS</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono-digits">
              {liveTelemetry.frameTimeMs} ms frame time
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">CPU Emulation Load</span>
            <span className="text-2xl font-extrabold text-white font-mono-digits mt-1 block">
              {liveTelemetry.cpuLoad}%
            </span>
            <span className="text-[10px] text-slate-500">
              {config.dualCore ? 'Dual-Core Threading' : 'Single-Core'}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Estimated SoC Temp</span>
            <span className="text-2xl font-extrabold text-white font-mono-digits mt-1 block">
              {liveTelemetry.temp}°C
            </span>
            <span className="text-[10px] text-emerald-400">
              Optimal Thermal State
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Emulator RAM Allocation</span>
            <span className="text-2xl font-extrabold text-white font-mono-digits mt-1 block">
              420 <span className="text-xs text-sky-400 font-medium">MB</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono-digits">
              System Total: 12 GB
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Performance Toggles */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Engine Execution Optimization</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Fastmem (Direct Memory Access)</span>
              <span className="text-[11px] text-slate-400">Bypasses MMU for ~15% speedup</span>
            </div>
            <input
              type="checkbox"
              checked={config.fastmem}
              onChange={e => onChange({ ...config, fastmem: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Dual-Core Execution</span>
              <span className="text-[11px] text-slate-400">Separate CPU & GPU threads</span>
            </div>
            <input
              type="checkbox"
              checked={config.dualCore}
              onChange={e => onChange({ ...config, dualCore: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">DSP Audio Emulation Mode</span>
              <span className="text-[11px] text-slate-400">HLE (High Level) vs LLE</span>
            </div>
            <select
              value={config.dspMode}
              onChange={e => onChange({ ...config, dspMode: e.target.value as 'HLE' | 'LLE' })}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1"
            >
              <option value="HLE">DSP HLE (Fastest)</option>
              <option value="LLE">DSP LLE (Cycle-Exact)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">On-Screen FPS Counter</span>
              <span className="text-[11px] text-slate-400">Display framerate during gameplay</span>
            </div>
            <input
              type="checkbox"
              checked={config.showFPSCounter}
              onChange={e => onChange({ ...config, showFPSCounter: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Android Background Task Guidance */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
        <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Android 13 / ColorOS Gaming Recommendations</span>
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
          <li>Enable "Game Space" or "Do Not Disturb" in Android quick settings to prevent touch gestures conflicting with edge swipes.</li>
          <li>For Snapdragon 8 Gen 1/2/3 devices, keep Balanced or Extreme Boost mode active with Vulkan backend.</li>
          <li>Close background heavy camera or GPS apps before launching 1080p Wii titles.</li>
        </ul>
      </div>
    </div>
  );
};
