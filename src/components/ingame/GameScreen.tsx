import React, { useRef, useEffect, useState } from 'react';
import { GameMetadata, GraphicsConfig, BoosterConfig, ControllerLayoutConfig } from '../../emulator/types';
import { EmulatorEngine, ControllerState } from '../../emulator/gameEngine';
import { TouchController, ControllerMode } from '../controller/TouchController';
import { InGameHUD } from './InGameHUD';
import { Settings, FastForward, ArrowLeft, Terminal, Cpu, X } from 'lucide-react';
import { audioSynthesizer } from '../../emulator/audioSynthesizer';

interface GameScreenProps {
  game: GameMetadata;
  graphicsConfig: GraphicsConfig;
  boosterConfig: BoosterConfig;
  layoutConfig: ControllerLayoutConfig;
  onExitGame: () => void;
  engine: EmulatorEngine;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  game,
  graphicsConfig,
  boosterConfig,
  layoutConfig,
  onExitGame,
  engine,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [controllerMode, setControllerMode] = useState<ControllerMode>(
    game.console === 'WII' ? 'WII_REMOTE' : 'GAMECUBE'
  );
  const [controllerState, setControllerState] = useState<ControllerState>(engine.controller);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isLogTerminalOpen, setIsLogTerminalOpen] = useState(false);
  const [telemetry, setTelemetry] = useState({
    fps: 60.0,
    frameTimeMs: 16.6,
    cpuLoad: 42,
    temp: 39.5,
  });

  // Attach canvas and launch emulator engine
  useEffect(() => {
    if (canvasRef.current) {
      engine.attachCanvas(canvasRef.current);
      engine.onTelemetryUpdate = setTelemetry;
      engine.start(game);
    }

    return () => {
      engine.stop();
    };
  }, [game, engine]);

  // Sync controller state to engine
  const handleUpdateController = (updater: (prev: ControllerState) => ControllerState) => {
    setControllerState(prev => {
      const next = updater(prev);
      engine.controller = next;
      return next;
    });
  };

  // Track pointer on screen for Wii Remote IR Pointer
  const handleScreenPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    handleUpdateController(prev => ({
      ...prev,
      wiiPointerX: nx,
      wiiPointerY: ny,
      wiiPointerActive: true,
    }));
  };

  const handleScreenPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (game.console === 'WII') {
      audioSynthesizer.playLaserZap();
      handleUpdateController(prev => ({ ...prev, wiiA: true }));
      setTimeout(() => {
        handleUpdateController(prev => ({ ...prev, wiiA: false }));
      }, 100);
    }
  };

  const getAspectClass = () => {
    if (graphicsConfig.aspectRatio === '4:3') return 'aspect-[4/3]';
    if (graphicsConfig.aspectRatio === '16:9' || graphicsConfig.widescreenHack) return 'aspect-[16/9]';
    return game.console === 'WII' ? 'aspect-[16/9]' : 'aspect-[4/3]';
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handleScreenPointerMove}
      onPointerDown={handleScreenPointerDown}
      className="relative w-full h-full min-h-[500px] flex-1 bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Active Game Canvas */}
      <div className={`relative max-w-full max-h-full ${getAspectClass()} flex items-center justify-center shadow-2xl overflow-hidden`}>
        <canvas
          ref={canvasRef}
          width={854}
          height={480}
          className="w-full h-full object-contain image-rendering-auto bg-slate-950"
        />

        {/* Live HUD Telemetry Overlay */}
        {boosterConfig.showFPSCounter && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono-digits pointer-events-none">
            <span className="text-emerald-400 font-bold">{telemetry.fps} FPS</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">{telemetry.frameTimeMs}ms</span>
            {engine.fastForward > 1 && (
              <span className="text-amber-400 font-bold ml-1">{engine.fastForward}x FF</span>
            )}
          </div>
        )}
      </div>

      {/* Touchscreen Controller Overlay */}
      {isControlsVisible && (
        <TouchController
          controller={controllerState}
          onUpdateController={handleUpdateController}
          layoutConfig={layoutConfig}
          mode={controllerMode}
          onSwitchMode={setControllerMode}
        />
      )}

      {/* Floating Toolbar (Top Center / Left) */}
      <div className="absolute top-3 left-3 z-40 flex items-center gap-2">
        <button
          onClick={() => {
            audioSynthesizer.playWiiRemoteClick();
            engine.pause();
            setIsMenuOpen(true);
          }}
          className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700 shadow-lg active:scale-90 transition-transform"
          title="Open In-Game Quick Settings"
        >
          <Settings className="w-4 h-4 text-sky-400" />
        </button>

        <button
          onClick={() => engine.toggleFastForward()}
          className={`px-2.5 py-1 rounded-full text-xs font-mono-digits font-bold flex items-center gap-1 backdrop-blur-md border shadow transition-all ${
            engine.fastForward > 1
              ? 'bg-amber-600 border-amber-400 text-white'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Fast Forward Speed"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>{engine.fastForward}x</span>
        </button>

        <button
          onClick={() => setIsLogTerminalOpen(prev => !prev)}
          className={`p-2 rounded-full backdrop-blur-md border shadow transition-colors ${
            isLogTerminalOpen ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-white'
          }`}
          title="Dolphin Core Hardware & Registers Inspector"
        >
          <Terminal className="w-4 h-4" />
        </button>

        <button
          onClick={onExitGame}
          className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-rose-400 border border-slate-800 shadow"
          title="Exit Game to Library"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Dolphin Core Live Execution & Disassembly Window */}
      {isLogTerminalOpen && (
        <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-4 text-xs font-mono-digits backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Dolphin Core Inspector · {game.console}</span>
            </div>
            <button
              onClick={() => setIsLogTerminalOpen(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PowerPC Registers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-slate-500">PC: </span>
              <span className="text-emerald-400 font-bold">0x{engine.cpu.pc.toString(16).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500">LR: </span>
              <span className="text-sky-400">0x{engine.cpu.lr.toString(16).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500">SP(r1): </span>
              <span className="text-slate-300">0x{engine.cpu.gpr[1].toString(16).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500">Ops: </span>
              <span className="text-amber-400 font-bold">{(engine.cpu.totalInstructionsExecuted / 1000000).toFixed(2)}M</span>
            </div>
          </div>

          {/* Live Subsystem Log Feed */}
          <div className="h-28 overflow-y-auto space-y-1 text-[10.5px] bg-black/60 p-2.5 rounded-xl border border-slate-800/60 font-mono">
            {engine.executionLogs.length === 0 ? (
              <span className="text-slate-500">Waiting for sub-system activity...</span>
            ) : (
              engine.executionLogs.map(log => (
                <div key={log.id} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span className={`font-bold ${
                    log.subsystem === 'CPU' ? 'text-sky-400' :
                    log.subsystem === 'DVD' ? 'text-amber-400' :
                    log.subsystem === 'MEMORY' ? 'text-purple-400' : 'text-emerald-400'
                  }`}>
                    [{log.subsystem}]
                  </span>
                  <span className={log.level === 'success' ? 'text-emerald-300' : 'text-slate-200'}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* In-Game HUD Modal */}
      {isMenuOpen && (
        <InGameHUD
          isPaused={engine.isPaused}
          onResume={() => {
            engine.resume();
            setIsMenuOpen(false);
          }}
          onPause={() => engine.pause()}
          fastForwardRate={engine.fastForward}
          onToggleFastForward={() => engine.toggleFastForward()}
          onCaptureScreenshot={() => {
            const url = engine.captureScreenshot();
            if (url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = `${game.id}_screenshot.jpg`;
              a.click();
            }
          }}
          onSaveState={slot => engine.saveState(slot)}
          onLoadState={slot => engine.loadState(slot)}
          saveStates={engine.saveStates}
          onExitGame={() => {
            engine.stop();
            onExitGame();
          }}
          onToggleControllerOverlay={() => setIsControlsVisible(prev => !prev)}
          isControllerOverlayVisible={isControlsVisible}
          fps={telemetry.fps}
          gameTitle={game.title}
        />
      )}
    </div>
  );
};
