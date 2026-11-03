import React, { useState } from 'react';
import { GraphicsConfig, GraphicsBackend, InternalResolution, AntiAliasing, AnisotropicFilter, TextureFilter, ShaderCompilation, PostProcessingShader, AspectRatio } from '../../emulator/types';
import { Monitor, Check, Trash2, Cpu, Sparkles } from 'lucide-react';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface GraphicsSettingsProps {
  config: GraphicsConfig;
  onChange: (newConfig: GraphicsConfig) => void;
  detectedGpu?: string;
}

export const GraphicsSettings: React.FC<GraphicsSettingsProps> = ({
  config,
  onChange,
  detectedGpu,
}) => {
  const [clearedNotice, setClearedNotice] = useState(false);
  const [compiledNotice, setCompiledNotice] = useState(false);

  const handleClearCache = () => {
    onChange({
      ...config,
      compiledShadersCount: 0,
      shaderCacheSizeBytes: 0,
    });
    audioSynthesizer.playWiiRemoteClick();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2000);
  };

  const handleCompileShaders = () => {
    onChange({
      ...config,
      compiledShadersCount: config.compiledShadersCount + 1420,
      shaderCacheSizeBytes: config.shaderCacheSizeBytes + 28 * 1024 * 1024,
    });
    audioSynthesizer.playWiiRemoteClick();
    setCompiledNotice(true);
    setTimeout(() => setCompiledNotice(false), 2000);
  };

  const autoOptimizeBackend = () => {
    // Recommend Vulkan for modern mobile GPUs
    onChange({
      ...config,
      backend: 'vulkan',
      internalResolution: '2x',
      shaderCompilation: 'hybrid_ubershaders',
      antiAliasing: 'fxaa',
      anisotropicFilter: '4x',
    });
    audioSynthesizer.playWiiRemoteClick();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-sky-400" />
            <span>HD Graphics Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure internal resolution up to 4K, Vulkan/OpenGL backends, texture filtering, and shaders.
          </p>
        </div>

        <button
          onClick={autoOptimizeBackend}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-md shadow-indigo-950/40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Optimize for My Device</span>
        </button>
      </div>

      {/* Hardware Detection Badge */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>Active GPU Pipeline:</span>
          <span className="font-semibold text-slate-100 font-mono-digits">{detectedGpu || 'Qualcomm Adreno / Vulkan Hardware Driver'}</span>
        </div>
        <span className="text-[11px] text-emerald-400 font-medium">Optimal Vulkan 1.3 Active</span>
      </div>

      {/* Grid of Main Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Graphics Backend */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-200 block">Graphics Backend</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'vulkan', name: 'Vulkan', desc: 'Fastest (Adreno/Mali)' },
              { id: 'opengl', name: 'OpenGL ES', desc: 'Highest Compatibility' },
              { id: 'software', name: 'Software', desc: 'Accurate / Fallback' },
            ].map(b => (
              <button
                key={b.id}
                onClick={() => {
                  onChange({ ...config, backend: b.id as GraphicsBackend });
                  audioSynthesizer.playWiiRemoteClick();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  config.backend === b.id
                    ? 'bg-sky-950/80 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold block">{b.name}</span>
                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{b.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Vulkan provides multi-threaded command buffers and minimal driver overhead on Android 13+.
          </p>
        </div>

        {/* Internal Resolution */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-200">Internal Resolution Multiplier</label>
            <span className="text-sky-400 font-mono-digits font-semibold">{config.internalResolution} Native</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { id: '1x', label: '1x (480p)' },
              { id: '2x', label: '2x (720p)' },
              { id: '3x', label: '3x (1080p)' },
              { id: '4x', label: '4x (1440p)' },
              { id: '5x', label: '5x (4K)' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => {
                  onChange({ ...config, internalResolution: r.id as InternalResolution });
                  audioSynthesizer.playWiiRemoteClick();
                }}
                className={`py-2 px-1 text-center rounded-xl border text-[11px] font-medium transition-all ${
                  config.internalResolution === r.id
                    ? 'bg-sky-950/80 border-sky-400 text-sky-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Dynamic resolution scales 3D geometry while preserving authentic 2D UI elements.
          </p>
        </div>

        {/* Anti-Aliasing (MSAA / FXAA) */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-200 block">Anti-Aliasing</label>
          <select
            value={config.antiAliasing}
            onChange={e => onChange({ ...config, antiAliasing: e.target.value as AntiAliasing })}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:border-sky-500"
          >
            <option value="none">None (Maximum Performance)</option>
            <option value="fxaa">Fast Approximate Anti-Aliasing (FXAA)</option>
            <option value="smaa">Subpixel Morphological Anti-Aliasing (SMAA)</option>
            <option value="2x_msaa">2x Multi-Sample AA (MSAA)</option>
            <option value="4x_msaa">4x Multi-Sample AA (MSAA)</option>
            <option value="8x_msaa">8x Multi-Sample AA (MSAA - Flagship GPU)</option>
          </select>
        </div>

        {/* Anisotropic & Texture Filtering */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-200 block">Anisotropic Texture Filtering</label>
          <select
            value={config.anisotropicFilter}
            onChange={e => onChange({ ...config, anisotropicFilter: e.target.value as AnisotropicFilter })}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:border-sky-500"
          >
            <option value="1x">1x (Off)</option>
            <option value="2x">2x Anisotropic</option>
            <option value="4x">4x Anisotropic (Recommended)</option>
            <option value="8x">8x Anisotropic</option>
            <option value="16x">16x Anisotropic (Ultra Sharp Textures)</option>
          </select>
        </div>

        {/* Shader Compilation Mode */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-200 block">Shader Compilation Pipeline</label>
          <select
            value={config.shaderCompilation}
            onChange={e => onChange({ ...config, shaderCompilation: e.target.value as ShaderCompilation })}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:border-sky-500"
          >
            <option value="hybrid_ubershaders">Hybrid Ubershaders (Zero Stutter - Recommended)</option>
            <option value="async_skip">Asynchronous (Skip Drawing - Fast on Slow Devices)</option>
            <option value="sync">Synchronous (Exact Hardware Emulation)</option>
            <option value="specialized">Exclusive Specialized Shaders</option>
          </select>
          <p className="text-[11px] text-slate-400">
            Hybrid Ubershaders compiles background pipelines while using fallback code to eliminate stutter.
          </p>
        </div>

        {/* Post-Processing Shaders */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-200 block">Post-Processing Filter</label>
          <select
            value={config.postProcessing}
            onChange={e => onChange({ ...config, postProcessing: e.target.value as PostProcessingShader })}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:border-sky-500"
          >
            <option value="none">None (Clean Original Native Output)</option>
            <option value="crt_scanlines">Retro CRT Scanlines & Phosphor Glow</option>
            <option value="bloom_hdr">HDR Bloom & Sunlight Diffusion</option>
            <option value="vibrant_colors">Vibrant Color Boost (Nintendo OLED Palette)</option>
            <option value="sharp_bilinear">Sharp Bilinear Edge Reconstruction</option>
          </select>
        </div>
      </div>

      {/* Screen Aspect Ratio & Hacks */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Display & Viewport Geometry</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-semibold text-slate-200 block">Aspect Ratio</span>
            <select
              value={config.aspectRatio}
              onChange={e => onChange({ ...config, aspectRatio: e.target.value as AspectRatio })}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5"
            >
              <option value="auto">Auto (Game Default)</option>
              <option value="16:9">Force 16:9 Widescreen</option>
              <option value="4:3">Force 4:3 Standard</option>
              <option value="stretch">Stretch to Screen</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Widescreen Hack</span>
              <span className="text-[11px] text-slate-400">Expand camera 3D FOV</span>
            </div>
            <input
              type="checkbox"
              checked={config.widescreenHack}
              onChange={e => onChange({ ...config, widescreenHack: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">V-Sync (Tear-Free)</span>
              <span className="text-[11px] text-slate-400">Lock to display refresh</span>
            </div>
            <input
              type="checkbox"
              checked={config.vsync}
              onChange={e => onChange({ ...config, vsync: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Shader Cache Manager */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Shader Cache Storage</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cached shaders prevent frame stutter during new particle effects and character entries.
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-sky-400 font-mono-digits font-semibold">{config.compiledShadersCount}</span>
            <span className="text-slate-400"> Shaders</span>
            <span className="text-slate-600 mx-1.5">·</span>
            <span className="text-slate-300 font-mono-digits">{(config.shaderCacheSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleCompileShaders}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {compiledNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-sky-400" />}
            <span>{compiledNotice ? 'Compiled 1,420 Shaders' : 'Pre-Compile Shaders Now'}</span>
          </button>
          <button
            onClick={handleClearCache}
            className="px-3.5 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-500/20 hover:bg-rose-900/40 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearedNotice ? 'Cache Purged' : 'Clear Shader Cache'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
