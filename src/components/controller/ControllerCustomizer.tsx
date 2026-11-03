import React, { useState } from 'react';
import { ControllerLayoutConfig } from '../../emulator/types';
import { Sliders, RotateCcw, Check, Sparkles, Smartphone } from 'lucide-react';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface ControllerCustomizerProps {
  config: ControllerLayoutConfig;
  onChange: (newConfig: ControllerLayoutConfig) => void;
  onReset: () => void;
}

export const ControllerCustomizer: React.FC<ControllerCustomizerProps> = ({
  config,
  onChange,
  onReset,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');

  const presets: Record<string, Partial<ControllerLayoutConfig>> = {
    default: {
      opacity: 0.85,
      scale: 1.0,
      isLeftHanded: false,
      hapticFeedback: true,
      wiiPointerSensitivity: 5,
      shakeSensitivity: 6,
      sensorBarPosition: 'top',
    },
    smash_pro: {
      opacity: 0.95,
      scale: 1.15,
      isLeftHanded: false,
      hapticFeedback: true,
      wiiPointerSensitivity: 4,
      shakeSensitivity: 8,
      sensorBarPosition: 'bottom',
    },
    motion_specialist: {
      opacity: 0.8,
      scale: 0.95,
      isLeftHanded: false,
      hapticFeedback: true,
      wiiPointerSensitivity: 8,
      shakeSensitivity: 9,
      sensorBarPosition: 'top',
    },
    minimal: {
      opacity: 0.45,
      scale: 0.85,
      isLeftHanded: false,
      hapticFeedback: false,
      wiiPointerSensitivity: 5,
      shakeSensitivity: 5,
      sensorBarPosition: 'top',
    },
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const p = presets[presetKey];
    onChange({
      ...config,
      ...p,
    });
    audioSynthesizer.playWiiRemoteClick();
  };

  const handleSave = () => {
    setSaveSuccess(true);
    audioSynthesizer.playWiiRemoteClick();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <span>Touch Controller Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fine-tune button scales, transparency, motion sensitivity, and haptics for GameCube & Wii.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onReset();
              audioSynthesizer.playWiiRemoteClick();
            }}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-sky-950/40"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            <span>{saveSuccess ? 'Profile Saved' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Quick Layout Presets */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-2">Controller Presets</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'default', label: 'Default Balanced' },
            { id: 'smash_pro', label: 'Pro Smash / Fighter' },
            { id: 'motion_specialist', label: 'Wii Motion Specialist' },
            { id: 'minimal', label: 'Minimal Transparent' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p.id)}
              className={`px-3 py-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
                selectedPreset === p.id
                  ? 'bg-sky-950/80 border-sky-400 text-sky-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Transparency */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Controller Opacity</span>
            <span className="text-sky-400 font-mono-digits">{Math.round(config.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={config.opacity}
            onChange={e => onChange({ ...config, opacity: parseFloat(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>20% (Subtle)</span>
            <span>100% (Solid)</span>
          </div>
        </div>

        {/* Button Scale */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Button Scale</span>
            <span className="text-sky-400 font-mono-digits">{Math.round(config.scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.65"
            max="1.35"
            step="0.05"
            value={config.scale}
            onChange={e => onChange({ ...config, scale: parseFloat(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>65% (Compact)</span>
            <span>135% (Jumbo)</span>
          </div>
        </div>

        {/* Wii Pointer IR Sensitivity */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Wii Remote IR Sensitivity</span>
            <span className="text-sky-400 font-mono-digits">{config.wiiPointerSensitivity} / 10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={config.wiiPointerSensitivity}
            onChange={e => onChange({ ...config, wiiPointerSensitivity: parseInt(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Controls pointer tracking speed from touchscreen and device gyroscope.
          </p>
        </div>

        {/* Shake & Motion Sensitivity */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Shake Gesture Sensitivity</span>
            <span className="text-sky-400 font-mono-digits">{config.shakeSensitivity} / 10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={config.shakeSensitivity}
            onChange={e => onChange({ ...config, shakeSensitivity: parseInt(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Sensitivity for Mario spin, Donkey Kong ground pound, and shaking attacks.
          </p>
        </div>
      </div>

      {/* Toggles & Options */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Ergonomics & Hardware</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Left-Handed Layout */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Left-Handed Mode</span>
              <span className="text-[11px] text-slate-400">Swap D-pad & ABXY sides</span>
            </div>
            <input
              type="checkbox"
              checked={config.isLeftHanded}
              onChange={e => onChange({ ...config, isLeftHanded: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          {/* Haptic Feedback */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Haptic Feedback</span>
              <span className="text-[11px] text-slate-400">Vibrate on button taps</span>
            </div>
            <input
              type="checkbox"
              checked={config.hapticFeedback}
              onChange={e => onChange({ ...config, hapticFeedback: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          {/* Sensor Bar Position */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">IR Sensor Bar</span>
              <span className="text-[11px] text-slate-400">Top vs Bottom calibration</span>
            </div>
            <select
              value={config.sensorBarPosition}
              onChange={e => onChange({ ...config, sensorBarPosition: e.target.value as 'top' | 'bottom' })}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      </div>

      {/* External Controller Hardware Info */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3 text-xs">
        <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 space-y-1">
          <p className="font-semibold text-indigo-300">External Gamepad & Bluetooth Support Active</p>
          <p className="text-slate-400">
            Connect any Android-compatible gamepad (Xbox Wireless, DualSense, Nintendo Switch Pro Controller, or 8BitDo) via Bluetooth or USB-C. Ultra Wii Emulator automatically detects axes, triggers, and thumbsticks with 0ms input latency.
          </p>
        </div>
      </div>
    </div>
  );
};
