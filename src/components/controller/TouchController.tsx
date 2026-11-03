import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ControllerState } from '../../emulator/gameEngine';
import { ControllerLayoutConfig } from '../../emulator/types';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';
import { Radio, RefreshCw } from 'lucide-react';

export type ControllerMode = 'GAMECUBE' | 'WII_REMOTE';

interface TouchControllerProps {
  controller: ControllerState;
  onUpdateController: (updater: (prev: ControllerState) => ControllerState) => void;
  layoutConfig: ControllerLayoutConfig;
  mode: ControllerMode;
  onSwitchMode: (mode: ControllerMode) => void;
  isCustomizing?: boolean;
}

export const TouchController: React.FC<TouchControllerProps> = ({
  controller,
  onUpdateController,
  layoutConfig,
  mode,
  onSwitchMode,
}) => {
  const [activeGamepadName, setActiveGamepadName] = useState<string | null>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const cstickRef = useRef<HTMLDivElement>(null);
  const nunchukStickRef = useRef<HTMLDivElement>(null);

  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const [cstickOffset, setCstickOffset] = useState({ x: 0, y: 0 });
  const [nunchukOffset, setNunchukOffset] = useState({ x: 0, y: 0 });

  const triggerHaptic = useCallback(() => {
    if (layoutConfig.hapticFeedback && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore vibration error
      }
    }
  }, [layoutConfig.hapticFeedback]);

  // Physical Gamepad API polling
  useEffect(() => {
    let animId: number;
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find(g => g && g.connected);
      if (gp) {
        if (activeGamepadName !== gp.id) setActiveGamepadName(gp.id);
        
        onUpdateController(prev => ({
          ...prev,
          gcA: !!gp.buttons[0]?.pressed || prev.gcA,
          gcB: !!gp.buttons[1]?.pressed || prev.gcB,
          gcX: !!gp.buttons[2]?.pressed || prev.gcX,
          gcY: !!gp.buttons[3]?.pressed || prev.gcY,
          gcL: gp.buttons[4]?.value || (gp.buttons[4]?.pressed ? 1 : prev.gcL),
          gcR: gp.buttons[5]?.value || (gp.buttons[5]?.pressed ? 1 : prev.gcR),
          gcZ: !!gp.buttons[9]?.pressed || prev.gcZ,
          gcStart: !!gp.buttons[9]?.pressed || !!gp.buttons[8]?.pressed || prev.gcStart,
          dpadUp: !!gp.buttons[12]?.pressed || prev.dpadUp,
          dpadDown: !!gp.buttons[13]?.pressed || prev.dpadDown,
          dpadLeft: !!gp.buttons[14]?.pressed || prev.dpadLeft,
          dpadRight: !!gp.buttons[15]?.pressed || prev.dpadRight,
          stickX: Math.abs(gp.axes[0] || 0) > 0.15 ? gp.axes[0] : prev.stickX,
          stickY: Math.abs(gp.axes[1] || 0) > 0.15 ? gp.axes[1] : prev.stickY,
          cStickX: Math.abs(gp.axes[2] || 0) > 0.15 ? gp.axes[2] : prev.cStickX,
          cStickY: Math.abs(gp.axes[3] || 0) > 0.15 ? gp.axes[3] : prev.cStickY,
        }));
      } else if (activeGamepadName) {
        setActiveGamepadName(null);
      }
      animId = requestAnimationFrame(pollGamepad);
    };
    animId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animId);
  }, [activeGamepadName, onUpdateController]);

  // Gyroscope / Motion controls for Wii Remote tilt & shake
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (mode !== 'WII_REMOTE' || !e.gamma || !e.beta) return;
      const tiltX = Math.max(-1, Math.min(1, e.gamma / 30));
      const tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      
      onUpdateController(prev => ({
        ...prev,
        wiiPointerX: 0.5 + tiltX * 0.45 * (layoutConfig.wiiPointerSensitivity / 5),
        wiiPointerY: 0.5 + tiltY * 0.45 * (layoutConfig.wiiPointerSensitivity / 5),
        wiiPointerActive: true,
      }));
    };

    const handleMotion = (e: DeviceMotionEvent) => {
      if (mode !== 'WII_REMOTE' || !e.acceleration) return;
      const acc = e.acceleration;
      const totalAcc = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      if (totalAcc > (14 - layoutConfig.shakeSensitivity)) {
        triggerHaptic();
        audioSynthesizer.playWiiRemoteClick();
        onUpdateController(prev => ({ ...prev, wiiShake: true }));
        setTimeout(() => {
          onUpdateController(prev => ({ ...prev, wiiShake: false }));
        }, 150);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [mode, layoutConfig.wiiPointerSensitivity, layoutConfig.shakeSensitivity, onUpdateController, triggerHaptic]);

  // Touch analog stick handler helper
  const handleStickTouch = (
    clientX: number,
    clientY: number,
    element: HTMLElement,
    onMove: (x: number, y: number) => void,
    setOffset: (pos: { x: number; y: number }) => void
  ) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 12;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const ox = Math.cos(angle) * clampedDist;
    const oy = Math.sin(angle) * clampedDist;

    setOffset({ x: ox, y: oy });
    onMove(ox / maxRadius, oy / maxRadius);
  };

  const handleStickTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    ref: React.RefObject<HTMLDivElement | null>,
    onMove: (x: number, y: number) => void,
    setOffset: (pos: { x: number; y: number }) => void
  ) => {
    triggerHaptic();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (ref.current) {
      handleStickTouch(clientX, clientY, ref.current, onMove, setOffset);
    }
  };

  const handleStickTouchMove = (
    e: React.TouchEvent | React.MouseEvent,
    ref: React.RefObject<HTMLDivElement | null>,
    onMove: (x: number, y: number) => void,
    setOffset: (pos: { x: number; y: number }) => void
  ) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (ref.current) {
      handleStickTouch(clientX, clientY, ref.current, onMove, setOffset);
    }
  };

  const handleStickTouchEnd = (
    onMove: (x: number, y: number) => void,
    setOffset: (pos: { x: number; y: number }) => void
  ) => {
    setOffset({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const scaleStyle = {
    opacity: layoutConfig.opacity,
    transform: `scale(${layoutConfig.scale})`,
    transformOrigin: 'bottom center',
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-3"
      style={scaleStyle}
    >
      {/* Top Header Row: Controller mode switch & Gamepad indicator */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-xs text-slate-300">
          <button
            onClick={() => {
              triggerHaptic();
              onSwitchMode('GAMECUBE');
            }}
            className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
              mode === 'GAMECUBE' ? 'bg-indigo-600 text-white' : 'hover:text-white'
            }`}
          >
            GameCube
          </button>
          <button
            onClick={() => {
              triggerHaptic();
              onSwitchMode('WII_REMOTE');
            }}
            className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
              mode === 'WII_REMOTE' ? 'bg-sky-600 text-white' : 'hover:text-white'
            }`}
          >
            Wii Remote
          </button>
        </div>

        {activeGamepadName && (
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[11px] px-2.5 py-1 rounded-full">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="truncate max-w-[140px] font-mono-digits">{activeGamepadName}</span>
          </div>
        )}

        {/* Shake Gesture Button (essential for Wii games) */}
        {mode === 'WII_REMOTE' && (
          <button
            onTouchStart={() => {
              triggerHaptic();
              audioSynthesizer.playWiiRemoteClick();
              onUpdateController(p => ({ ...p, wiiShake: true }));
            }}
            onTouchEnd={() => onUpdateController(p => ({ ...p, wiiShake: false }))}
            onMouseDown={() => {
              triggerHaptic();
              audioSynthesizer.playWiiRemoteClick();
              onUpdateController(p => ({ ...p, wiiShake: true }));
            }}
            onMouseUp={() => onUpdateController(p => ({ ...p, wiiShake: false }))}
            className="flex items-center gap-1 bg-amber-600/90 hover:bg-amber-500 text-white font-semibold text-xs px-3 py-1.5 rounded-full shadow-lg border border-amber-400/40 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SHAKE</span>
          </button>
        )}
      </div>

      {/* Main Touch Controls Layer */}
      {mode === 'GAMECUBE' ? (
        <div className={`flex items-end justify-between w-full pb-2 ${layoutConfig.isLeftHanded ? 'flex-row-reverse' : ''}`}>
          {/* Left Side: Analog Stick & D-Pad */}
          <div className="flex flex-col items-center gap-4 pointer-events-auto">
            {/* GameCube Main Analog Stick */}
            <div
              ref={stickRef}
              onTouchStart={e => handleStickTouchStart(e, stickRef, (x, y) => onUpdateController(p => ({ ...p, stickX: x, stickY: y })), setStickOffset)}
              onTouchMove={e => handleStickTouchMove(e, stickRef, (x, y) => onUpdateController(p => ({ ...p, stickX: x, stickY: y })), setStickOffset)}
              onTouchEnd={() => handleStickTouchEnd((x, y) => onUpdateController(p => ({ ...p, stickX: x, stickY: y })), setStickOffset)}
              className="w-28 h-28 rounded-full bg-slate-900/85 border-2 border-slate-700/80 shadow-2xl relative flex items-center justify-center touch-none cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full border border-slate-700/40" />
              <div className="w-12 h-12 rounded-full border border-slate-700/30" />
              <div
                className="w-14 h-14 rounded-full bg-gradient-to-b from-slate-300 to-slate-500 border-2 border-slate-600 shadow-md absolute flex items-center justify-center transition-transform duration-75"
                style={{ transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)` }}
              >
                <div className="w-9 h-9 rounded-full border border-slate-400 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-600/60" />
                </div>
              </div>
            </div>

            {/* D-Pad Cross */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadUp: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadUp: false }))}
                className="absolute top-0 w-8 h-9 bg-slate-800 border border-slate-700 rounded-t active:bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold"
              >
                ▲
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadDown: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadDown: false }))}
                className="absolute bottom-0 w-8 h-9 bg-slate-800 border border-slate-700 rounded-b active:bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold"
              >
                ▼
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadLeft: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadLeft: false }))}
                className="absolute left-0 w-9 h-8 bg-slate-800 border border-slate-700 rounded-l active:bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold"
              >
                ◀
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadRight: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadRight: false }))}
                className="absolute right-0 w-9 h-8 bg-slate-800 border border-slate-700 rounded-r active:bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold"
              >
                ▶
              </button>
              <div className="w-8 h-8 bg-slate-800" />
            </div>
          </div>

          {/* Center: Start / Pause & Triggers */}
          <div className="flex flex-col items-center gap-3 pointer-events-auto mb-2">
            <div className="flex items-center gap-6">
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcL: 1.0 })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, gcL: 0 }))}
                className={`px-4 py-2 rounded-xl bg-slate-800 border-2 border-slate-700 text-slate-200 font-bold text-xs active:bg-slate-700 active:scale-95 shadow-lg ${controller.gcL > 0.5 ? 'border-sky-400 bg-sky-950' : ''}`}
              >
                L TRIGGER
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcZ: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, gcZ: false }))}
                className={`px-3 py-1.5 rounded-lg bg-indigo-700 border border-indigo-500 text-white font-bold text-xs active:scale-95 shadow-md ${controller.gcZ ? 'bg-indigo-500' : ''}`}
              >
                Z
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcR: 1.0 })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, gcR: 0 }))}
                className={`px-4 py-2 rounded-xl bg-slate-800 border-2 border-slate-700 text-slate-200 font-bold text-xs active:bg-slate-700 active:scale-95 shadow-lg ${controller.gcR > 0.5 ? 'border-sky-400 bg-sky-950' : ''}`}
              >
                R TRIGGER
              </button>
            </div>

            <button
              onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcStart: true })); }}
              onTouchEnd={() => onUpdateController(p => ({ ...p, gcStart: false }))}
              className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 text-slate-300 font-bold text-[10px] flex items-center justify-center active:bg-slate-700 active:scale-90 shadow-md"
            >
              START
            </button>
          </div>

          {/* Right Side: GameCube ABXY & C-Stick */}
          <div className="flex flex-col items-center gap-4 pointer-events-auto">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Giant Green A Button */}
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcA: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, gcA: false }))}
                className={`w-16 h-16 rounded-full bg-emerald-500 border-2 border-emerald-400 shadow-xl flex items-center justify-center text-white font-extrabold text-2xl active:scale-90 transition-transform ${controller.gcA ? 'bg-emerald-400 scale-95' : ''}`}
              >
                A
              </button>

              {/* Red B Button */}
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcB: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, gcB: false }))}
                className={`absolute bottom-1 left-0 w-11 h-11 rounded-full bg-rose-600 border border-rose-500 shadow-lg flex items-center justify-center text-white font-bold text-base active:scale-90 transition-transform ${controller.gcB ? 'bg-rose-500 scale-95' : ''}`}
              >
                B
              </button>

              {/* Silver Bean X Button */}
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcX: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, gcX: false }))}
                className={`absolute top-6 right-0 w-12 h-7 rounded-full bg-slate-300 border border-slate-400 shadow-md flex items-center justify-center text-slate-800 font-bold text-xs active:scale-90 rotate-45 ${controller.gcX ? 'bg-white scale-95' : ''}`}
              >
                X
              </button>

              {/* Silver Bean Y Button */}
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, gcY: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, gcY: false }))}
                className={`absolute top-0 left-9 w-12 h-7 rounded-full bg-slate-300 border border-slate-400 shadow-md flex items-center justify-center text-slate-800 font-bold text-xs active:scale-90 ${controller.gcY ? 'bg-white scale-95' : ''}`}
              >
                Y
              </button>
            </div>

            {/* Yellow C-Stick */}
            <div
              ref={cstickRef}
              onTouchStart={e => handleStickTouchStart(e, cstickRef, (x, y) => onUpdateController(p => ({ ...p, cStickX: x, cStickY: y })), setCstickOffset)}
              onTouchMove={e => handleStickTouchMove(e, cstickRef, (x, y) => onUpdateController(p => ({ ...p, cStickX: x, cStickY: y })), setCstickOffset)}
              onTouchEnd={() => handleStickTouchEnd((x, y) => onUpdateController(p => ({ ...p, cStickX: x, cStickY: y })), setCstickOffset)}
              className="w-22 h-22 rounded-full bg-slate-900/85 border-2 border-slate-700/80 shadow-xl relative flex items-center justify-center touch-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 border border-amber-600 shadow-md absolute flex items-center justify-center transition-transform duration-75"
                style={{ transform: `translate(${cstickOffset.x}px, ${cstickOffset.y}px)` }}
              >
                <span className="text-slate-900 font-extrabold text-sm">C</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Wii Remote + Nunchuk Mode */
        <div className={`flex items-end justify-between w-full pb-2 ${layoutConfig.isLeftHanded ? 'flex-row-reverse' : ''}`}>
          {/* Left: Nunchuk */}
          <div className="flex flex-col items-center gap-3 pointer-events-auto bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">NUNCHUK</span>
            <div
              ref={nunchukStickRef}
              onTouchStart={e => handleStickTouchStart(e, nunchukStickRef, (x, y) => onUpdateController(p => ({ ...p, nunchukStickX: x, nunchukStickY: y, stickX: x, stickY: y })), setNunchukOffset)}
              onTouchMove={e => handleStickTouchMove(e, nunchukStickRef, (x, y) => onUpdateController(p => ({ ...p, nunchukStickX: x, nunchukStickY: y, stickX: x, stickY: y })), setNunchukOffset)}
              onTouchEnd={() => handleStickTouchEnd((x, y) => onUpdateController(p => ({ ...p, nunchukStickX: x, nunchukStickY: y, stickX: x, stickY: y })), setNunchukOffset)}
              className="w-24 h-24 rounded-full bg-slate-950 border border-slate-700 shadow-lg relative flex items-center justify-center touch-none cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full bg-slate-300 border-2 border-slate-500 shadow-md absolute flex items-center justify-center"
                style={{ transform: `translate(${nunchukOffset.x}px, ${nunchukOffset.y}px)` }}
              >
                <div className="w-2 h-2 rounded-full bg-slate-500" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, nunchukC: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, nunchukC: false }))}
                className="w-10 h-8 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 font-bold text-xs active:bg-slate-700"
              >
                C
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, nunchukZ: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, nunchukZ: false }))}
                className="w-12 h-9 rounded-lg bg-slate-700 border border-slate-500 text-white font-bold text-sm active:bg-slate-600"
              >
                Z
              </button>
            </div>
          </div>

          {/* Right: Wii Remote Body */}
          <div className="flex flex-col items-center gap-2 pointer-events-auto bg-slate-100/90 text-slate-900 p-3 rounded-2xl border border-slate-300 shadow-2xl w-44">
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-[10px] font-bold tracking-tight text-slate-500">WII REMOTE</span>
              <div className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>
            </div>

            {/* D-Pad */}
            <div className="grid grid-cols-3 gap-1 w-20 my-1">
              <div />
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadUp: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadUp: false }))}
                className="h-6 bg-slate-300 border border-slate-400 rounded-t text-[10px] font-bold active:bg-slate-400"
              >
                ▲
              </button>
              <div />
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadLeft: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadLeft: false }))}
                className="h-6 bg-slate-300 border border-slate-400 rounded-l text-[10px] font-bold active:bg-slate-400"
              >
                ◀
              </button>
              <div className="bg-slate-300" />
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadRight: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadRight: false }))}
                className="h-6 bg-slate-300 border border-slate-400 rounded-r text-[10px] font-bold active:bg-slate-400"
              >
                ▶
              </button>
              <div />
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, dpadDown: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, dpadDown: false }))}
                className="h-6 bg-slate-300 border border-slate-400 rounded-b text-[10px] font-bold active:bg-slate-400"
              >
                ▼
              </button>
              <div />
            </div>

            {/* Large A Button */}
            <button
              onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, wiiA: true })); }}
              onTouchEnd={() => onUpdateController(p => ({ ...p, wiiA: false }))}
              className={`w-14 h-14 rounded-full bg-slate-200 border-2 border-slate-400 shadow-md flex items-center justify-center font-extrabold text-xl text-slate-800 active:scale-95 transition-transform ${controller.wiiA ? 'bg-sky-200' : ''}`}
            >
              A
            </button>

            {/* B Trigger (Rear) */}
            <button
              onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, wiiB: true })); }}
              onTouchEnd={() => onUpdateController(p => ({ ...p, wiiB: false }))}
              className={`w-full py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-1 active:bg-slate-900 ${controller.wiiB ? 'bg-sky-600' : ''}`}
            >
              <span>[B] TRIGGER (REAR)</span>
            </button>

            {/* -, Home, + */}
            <div className="flex items-center justify-between w-full px-2 py-0.5">
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, wiiMinus: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, wiiMinus: false }))}
                className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 font-bold text-xs"
              >
                -
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, wiiHome: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, wiiHome: false }))}
                className="w-7 h-7 rounded-full bg-sky-500 text-white font-bold text-[10px]"
              >
                ⌂
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, wiiPlus: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, wiiPlus: false }))}
                className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 font-bold text-xs"
              >
                +
              </button>
            </div>

            {/* 1 and 2 buttons */}
            <div className="flex items-center gap-3">
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, wii1: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, wii1: false }))}
                className="w-8 h-8 rounded-full bg-slate-200 border border-slate-400 font-bold text-xs"
              >
                1
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); onUpdateController(p => ({ ...p, wii2: true })); }}
                onTouchEnd={() => onUpdateController(p => ({ ...p, wii2: false }))}
                className="w-8 h-8 rounded-full bg-slate-200 border border-slate-400 font-bold text-xs"
              >
                2
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
