import React, { useState } from 'react';
import { Play, Pause, Save, FolderOpen, FastForward, Camera, Layout, LogOut, Check } from 'lucide-react';
import { SaveState } from '../../emulator/types';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface InGameHUDProps {
  isPaused: boolean;
  onResume: () => void;
  onPause: () => void;
  fastForwardRate: number;
  onToggleFastForward: () => void;
  onCaptureScreenshot: () => void;
  onSaveState: (slot: number) => void;
  onLoadState: (slot: number) => void;
  saveStates: Record<number, SaveState>;
  onExitGame: () => void;
  onToggleControllerOverlay: () => void;
  isControllerOverlayVisible: boolean;
  fps: number;
  gameTitle: string;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  isPaused,
  onResume,
  onPause,
  fastForwardRate,
  onToggleFastForward,
  onCaptureScreenshot,
  onSaveState,
  onLoadState,
  saveStates,
  onExitGame,
  onToggleControllerOverlay,
  isControllerOverlayVisible,
  fps,
  gameTitle,
}) => {
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 2000);
  };

  const handleSave = () => {
    onSaveState(selectedSlot);
    showNotice(`State Saved to Slot ${selectedSlot}`);
  };

  const handleLoad = () => {
    if (saveStates[selectedSlot]) {
      onLoadState(selectedSlot);
      showNotice(`State Loaded from Slot ${selectedSlot}`);
    } else {
      showNotice(`Slot ${selectedSlot} is empty`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              Dolphin In-Game Quick Menu
            </span>
            <h3 className="text-base font-bold text-white truncate max-w-[260px]">{gameTitle}</h3>
          </div>
          <span className="text-xs font-mono-digits text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
            {fps} FPS
          </span>
        </div>

        {/* Feedback pill */}
        {feedbackNotice && (
          <div className="p-2.5 rounded-xl bg-sky-950 border border-sky-400/40 text-xs text-sky-200 text-center font-medium animate-fade-in">
            {feedbackNotice}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onResume}
            className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 active:scale-95 transition-transform"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Game</span>
          </button>

          <button
            onClick={onToggleFastForward}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <FastForward className="w-4 h-4 text-amber-400" />
            <span>Fast-Forward ({fastForwardRate}x)</span>
          </button>
        </div>

        {/* Save State & Load State Slots (1 - 5) */}
        <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Save State Slots</span>
            <span className="text-slate-500 font-mono-digits">Slot {selectedSlot}</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map(slot => {
              const hasSave = !!saveStates[slot];
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 rounded-xl text-xs font-mono-digits font-bold border flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isSelected
                      ? 'bg-sky-950 border-sky-400 text-sky-200 shadow-sm'
                      : hasSave
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-slate-900 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <span>#{slot}</span>
                  <span className="text-[9px] font-normal">
                    {hasSave ? 'SAVED' : 'EMPTY'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slot Preview Thumbnail if available */}
          {saveStates[selectedSlot] && (
            <div className="relative h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 mt-2">
              <img
                src={saveStates[selectedSlot].screenshotUrl}
                alt={`Slot ${selectedSlot}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-2 text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded font-mono-digits">
                {saveStates[selectedSlot].timestamp}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleSave}
              className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save State</span>
            </button>
            <button
              onClick={handleLoad}
              disabled={!saveStates[selectedSlot]}
              className={`py-2 px-3 rounded-lg text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-colors ${
                saveStates[selectedSlot]
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Load State</span>
            </button>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCaptureScreenshot}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Screenshot</span>
          </button>

          <button
            onClick={onToggleControllerOverlay}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2"
          >
            <Layout className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isControllerOverlayVisible ? 'Hide Controls' : 'Show Controls'}</span>
          </button>
        </div>

        {/* Exit Button */}
        <button
          onClick={onExitGame}
          className="w-full py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit to Game Library</span>
        </button>
      </div>
    </div>
  );
};
