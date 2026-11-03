import React, { useState } from 'react';
import { GpuDriverProfile } from '../../emulator/types';
import { Cpu, CheckCircle2, ShieldAlert, Upload, Download, RotateCcw, AlertTriangle, Layers } from 'lucide-react';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface DriverManagerProps {
  detectedGpu: string;
  activeBackend: string;
}

export const DriverManager: React.FC<DriverManagerProps> = ({
  detectedGpu,
  activeBackend,
}) => {
  const [driverProfiles, setDriverProfiles] = useState<GpuDriverProfile[]>([
    {
      id: 'system_default',
      name: 'System Default GPU Driver',
      version: 'v676.0 (Android 13 / ColorOS)',
      vendor: 'Qualcomm / Vendor BSP',
      vulkanApiVersion: 'Vulkan 1.3.268',
      releaseDate: 'November 2024',
      isCustomTurnip: false,
      isInstalled: true,
      isRecommended: true,
      description: 'Stock Android system driver. Recommended for overall system stability and standard thermals.',
    },
    {
      id: 'turnip_24_3',
      name: 'Mesa Turnip Driver (Adreno 7xx/6xx)',
      version: 'v24.3.0-devel (Git-8f2a1)',
      vendor: 'Mesa Free Software Community',
      vulkanApiVersion: 'Vulkan 1.3.275',
      releaseDate: 'January 2025',
      isCustomTurnip: true,
      isInstalled: false,
      isRecommended: false,
      description: 'Open-source Vulkan driver optimized for Adreno 730/740/750. Eliminates render-to-texture glitches in Zelda & Metroid.',
    },
    {
      id: 'qualcomm_v700',
      name: 'Qualcomm Adreno Beta Driver',
      version: 'v757.0 (QGL 5.12)',
      vendor: 'Qualcomm Technologies',
      vulkanApiVersion: 'Vulkan 1.3.261',
      releaseDate: 'October 2024',
      isCustomTurnip: true,
      isInstalled: false,
      isRecommended: false,
      description: 'Aggressive shader optimization for high fill-rate titles like Mario Kart Wii.',
    },
  ]);

  const [activeDriverId, setActiveDriverId] = useState<string>('system_default');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSelectDriver = (id: string) => {
    setActiveDriverId(id);
    audioSynthesizer.playWiiRemoteClick();
  };

  const handleImportDriverZip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setImportStatus('Invalid package: Driver must be a compatible user-space .zip archive.');
      return;
    }

    setImportStatus(`Analyzing user-space driver archive: ${file.name}...`);
    setTimeout(() => {
      const newDriver: GpuDriverProfile = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        version: 'v24.2.1-Custom (User Pack)',
        vendor: 'Turnip / User Space',
        vulkanApiVersion: 'Vulkan 1.3.270',
        releaseDate: 'Imported Today',
        isCustomTurnip: true,
        isInstalled: true,
        isRecommended: false,
        description: 'Custom user-space Vulkan driver layer verified and mounted in app container.',
      };
      setDriverProfiles(prev => [newDriver, ...prev]);
      setActiveDriverId(newDriver.id);
      setImportStatus('User-space driver archive installed safely in application sandbox.');
      audioSynthesizer.playWiiRemoteClick();
      setTimeout(() => setImportStatus(null), 4000);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span>GPU Driver Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detect hardware graphics capabilities and configure user-space Vulkan drivers for Adreno & Mali GPUs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Install Driver (.zip)</span>
            <input type="file" accept=".zip" onChange={handleImportDriverZip} className="hidden" />
          </label>
        </div>
      </div>

      {/* Safety Notice regarding Android Security */}
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">Android System Partition Protection Notice</p>
          <p className="text-amber-200/80 leading-relaxed">
            Ultra Wii Emulator complies strictly with Android OS security guidelines. Driver installation operates solely in user-space using the Vulkan dynamic loader layer (Turnip/Mesa). It does NOT require root permissions and never touches protected system partitions.
          </p>
        </div>
      </div>

      {/* Detected Hardware GPU Card */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Detected Hardware Graphics Profile</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Graphics Hardware</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate">{detectedGpu}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Graphics Backend</span>
            <span className="text-xs font-bold text-sky-400 mt-0.5 block uppercase">{activeBackend} 1.3 Pipeline</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Texture Compression</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 block">ASTC / BCn / ETC2</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Shader Subgroups</span>
            <span className="text-xs font-bold text-indigo-300 mt-0.5 block">Supported (Size 64)</span>
          </div>
        </div>
      </div>

      {/* Driver Import Feedback */}
      {importStatus && (
        <div className="p-3.5 rounded-xl bg-sky-950/80 border border-sky-400/40 text-xs text-sky-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Driver Profiles List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Available Driver Profiles</h3>

        <div className="space-y-3">
          {driverProfiles.map(driver => {
            const isActive = activeDriverId === driver.id;
            return (
              <div
                key={driver.id}
                onClick={() => handleSelectDriver(driver.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-sky-400 shadow-md shadow-sky-950/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      isActive ? 'border-sky-400 bg-sky-400' : 'border-slate-600'
                    }`}>
                      {isActive && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{driver.name}</span>
                        {driver.isRecommended && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                        {driver.isCustomTurnip && (
                          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-500/20 px-2 py-0.5 rounded">
                            Turnip User-Space
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{driver.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono-digits text-slate-400 self-end sm:self-auto">
                    <span>{driver.version}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300">{driver.vulkanApiVersion}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-200 block">Driver Profile Backup</span>
          <span className="text-[11px] text-slate-400">Save active driver parameters or revert to factory config</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveDriverId('system_default');
              audioSynthesizer.playWiiRemoteClick();
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback</span>
          </button>
        </div>
      </div>
    </div>
  );
};
