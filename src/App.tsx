import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameMetadata, GraphicsConfig, BoosterConfig, ControllerLayoutConfig } from './emulator/types';
import { EmulatorEngine } from './emulator/gameEngine';
import { parseDiscImage } from './emulator/isoParser';
import { audioSynthesizer } from './emulator/audioSynthesizer';
import { AndroidBar } from './components/shell/AndroidBar';
import { Navigation, TabKey } from './components/shell/Navigation';
import { HomeDashboard } from './components/home/HomeDashboard';
import { GameLibrary } from './components/library/GameLibrary';
import { GameDetailModal } from './components/library/GameDetailModal';
import { ControllerCustomizer } from './components/controller/ControllerCustomizer';
import { GraphicsSettings } from './components/graphics/GraphicsSettings';
import { DriverManager } from './components/drivers/DriverManager';
import { GameBooster } from './components/booster/GameBooster';
import { GameScreen } from './components/ingame/GameScreen';
import { CheckCircle2, Play, X } from 'lucide-react';

const INITIAL_GAMES: GameMetadata[] = [
  {
    id: 'GALE01',
    title: 'Super Smash Bros. Melee',
    console: 'GAMECUBE',
    format: 'ISO',
    region: 'USA',
    fileSize: '1.36 GB',
    internalCode: 'GALE01',
    coverImage: 'https://art.gametdb.com/wii/cover/US/GALE01.jpg',
    lastPlayed: 'Today',
    playTimeMinutes: 48,
    isFavorite: true,
    isBundled: true,
    compatibility: 'PERFECT',
    recommendedBackend: 'vulkan',
    notes: 'Native 60 FPS platform fighter. GameCube A/B attacks, double jump, shield bubble, and smash targets fully playable.',
  },
  {
    id: 'RMCE01',
    title: 'Mario Kart Wii',
    console: 'WII',
    format: 'WBFS',
    region: 'USA',
    fileSize: '2.58 GB',
    internalCode: 'RMCE01',
    coverImage: 'https://art.gametdb.com/wii/cover/US/RMCE01.jpg',
    lastPlayed: 'Yesterday',
    playTimeMinutes: 72,
    isFavorite: true,
    isBundled: true,
    compatibility: 'PERFECT',
    recommendedBackend: 'vulkan',
    notes: '3D racing with drift turbo sparks, speedometer, and track minimap. Supports both Wii Remote tilt and GameCube controls.',
  },
  {
    id: 'GMSE01',
    title: 'Super Mario Sunshine',
    console: 'GAMECUBE',
    format: 'ISO',
    region: 'USA',
    fileSize: '1.35 GB',
    internalCode: 'GMSE01',
    coverImage: 'https://art.gametdb.com/wii/cover/US/GMSE01.jpg',
    lastPlayed: '3 days ago',
    playTimeMinutes: 45,
    isFavorite: true,
    isBundled: true,
    compatibility: 'PERFECT',
    recommendedBackend: 'vulkan',
    notes: 'FLUDD water physics accurately emulated via EFB to RAM. 60 FPS gecko patch compatible.',
  },
  {
    id: 'RSEE01',
    title: 'Wii Sports',
    console: 'WII',
    format: 'WBFS',
    region: 'USA',
    fileSize: '650 MB',
    internalCode: 'RSEE01',
    coverImage: 'https://art.gametdb.com/wii/cover/US/RSEE01.jpg',
    lastPlayed: '4 days ago',
    playTimeMinutes: 35,
    isFavorite: true,
    isBundled: true,
    compatibility: 'PERFECT',
    recommendedBackend: 'vulkan',
    notes: 'Wii Remote IR pointer tracking and swing motion simulation. Real pin physics with strikes and spares.',
  },
  {
    id: 'GZLE01',
    title: 'The Legend of Zelda: The Wind Waker',
    console: 'GAMECUBE',
    format: 'ISO',
    region: 'USA',
    fileSize: '1.35 GB',
    internalCode: 'GZLE01',
    coverImage: 'https://art.gametdb.com/wii/cover/US/GZLE01.jpg',
    lastPlayed: '5 days ago',
    playTimeMinutes: 90,
    isFavorite: false,
    isBundled: true,
    compatibility: 'PERFECT',
    recommendedBackend: 'opengl',
    notes: 'Cel-shaded graphics scale beautifully up to 4K. Internal resolution 3x or 4x recommended.',
  },
  {
    id: 'RZDE01',
    title: 'The Legend of Zelda: Twilight Princess',
    console: 'WII',
    format: 'RVZ',
    region: 'USA',
    fileSize: '1.09 GB',
    internalCode: 'RZDE01',
    coverImage: 'https://art.gametdb.com/wii/cover/US/RZDE01.jpg',
    lastPlayed: '1 week ago',
    playTimeMinutes: 110,
    isFavorite: false,
    isBundled: true,
    compatibility: 'PERFECT',
    recommendedBackend: 'vulkan',
    notes: 'Epic adventure running on Dolphin 3D core. Widescreen hack enabled with custom ubershaders.',
  },
];

export default function App() {
  const [games, setGames] = useState<GameMetadata[]>(INITIAL_GAMES);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeGame, setActiveGame] = useState<GameMetadata | null>(null);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<GameMetadata | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importedGamePrompt, setImportedGamePrompt] = useState<GameMetadata | null>(null);
  const [detectedGpu, setDetectedGpu] = useState<string>('Qualcomm Adreno 740 (Vulkan 1.3)');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Graphics & Booster & Controller Configs
  const [graphicsConfig, setGraphicsConfig] = useState<GraphicsConfig>({
    backend: 'vulkan',
    internalResolution: '2x',
    antiAliasing: 'fxaa',
    anisotropicFilter: '4x',
    textureFilter: 'default',
    vsync: true,
    widescreenHack: true,
    aspectRatio: '16:9',
    shaderCompilation: 'hybrid_ubershaders',
    shaderCache: true,
    postProcessing: 'none',
    compiledShadersCount: 2840,
    shaderCacheSizeBytes: 56.4 * 1024 * 1024,
  });

  const [boosterConfig, setBoosterConfig] = useState<BoosterConfig>({
    profile: 'balanced',
    cpuOverclockPercent: 100,
    dualCore: true,
    fastmem: true,
    dspMode: 'HLE',
    frameLimiter: true,
    targetFPS: 60,
    showFPSCounter: true,
    showTelemetry: true,
  });

  const [layoutConfig, setLayoutConfig] = useState<ControllerLayoutConfig>({
    opacity: 0.85,
    scale: 1.0,
    isLeftHanded: false,
    hapticFeedback: true,
    dpadPos: { x: 30, y: 30 },
    actionButtonsPos: { x: 30, y: 30 },
    analogStickPos: { x: 30, y: 160 },
    cstickPos: { x: 30, y: 160 },
    triggersPos: { x: 20, y: 20 },
    wiiRemotePos: { x: 30, y: 30 },
    nunchukPos: { x: 30, y: 30 },
    wiiPointerSensitivity: 5,
    sensorBarPosition: 'top',
    shakeSensitivity: 6,
  });

  // Emulator Engine Singleton
  const engine = useMemo(() => new EmulatorEngine(graphicsConfig, boosterConfig), []);

  useEffect(() => {
    engine.graphics = graphicsConfig;
    engine.booster = boosterConfig;
  }, [graphicsConfig, boosterConfig, engine]);

  // Detect real GPU via WebGL
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer && typeof renderer === 'string') {
            setDetectedGpu(renderer);
          }
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleLaunchGame = (game: GameMetadata) => {
    setImportedGamePrompt(null);
    setActiveGame(game);
  };

  const handleExitGame = () => {
    setActiveGame(null);
    audioSynthesizer.playWiiRemoteClick();
  };

  const handleToggleFavorite = (id: string) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g));
    audioSynthesizer.playWiiRemoteClick();
  };

  const handleRemoveGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
    audioSynthesizer.playWiiRemoteClick();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const processImportedFile = async (file: File) => {
    try {
      const newGame = await parseDiscImage(file);
      setGames(prev => [newGame, ...prev]);
      setImportNotice(`Loaded ${newGame.title} [${newGame.id}] (${newGame.format})`);
      setImportedGamePrompt(newGame);
      audioSynthesizer.playWiiRemoteClick();
      setTimeout(() => setImportNotice(null), 5000);
    } catch (err) {
      setImportNotice(`Error parsing disc image: ${(err as Error).message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImportedFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleResetLayout = () => {
    setLayoutConfig({
      opacity: 0.85,
      scale: 1.0,
      isLeftHanded: false,
      hapticFeedback: true,
      dpadPos: { x: 30, y: 30 },
      actionButtonsPos: { x: 30, y: 30 },
      analogStickPos: { x: 30, y: 160 },
      cstickPos: { x: 30, y: 160 },
      triggersPos: { x: 20, y: 20 },
      wiiRemotePos: { x: 30, y: 30 },
      nunchukPos: { x: 30, y: 30 },
      wiiPointerSensitivity: 5,
      sensorBarPosition: 'top',
      shakeSensitivity: 6,
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col antialiased">
      {/* Hidden File Input for Android SAF / File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".iso,.rvz,.wbfs,.gcm,.ciso,.dol,.elf"
        className="hidden"
      />

      {/* Android 13 / ColorOS 13 System Status Bar */}
      <AndroidBar
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(prev => !prev)}
        fps={engine.fps}
        cpuTemp={engine.temperatureC}
        isGameRunning={!!activeGame}
      />

      {/* Main Emulator View: Either Active Game Screen OR Gaming Dashboard */}
      {activeGame ? (
        <GameScreen
          game={activeGame}
          graphicsConfig={graphicsConfig}
          boosterConfig={boosterConfig}
          layoutConfig={layoutConfig}
          onExitGame={handleExitGame}
          engine={engine}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Top Bar Navigation */}
          <Navigation
            activeTab={activeTab}
            onTabChange={tab => {
              setActiveTab(tab);
              audioSynthesizer.playWiiRemoteClick();
            }}
            onImportClick={handleImportClick}
            gameCount={games.length}
            isGameRunning={!!activeGame}
            onOpenRunningGame={() => {}}
          />

          {/* Prompt Dialog when a ROM is successfully imported */}
          {importedGamePrompt && (
            <div className="bg-sky-950/95 border-b border-sky-400 p-4">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600/30 border border-sky-400 flex items-center justify-center text-sky-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">ROM Verified & Mounted in Virtual 1T-SRAM</h4>
                    <p className="text-xs text-sky-200">
                      {importedGamePrompt.title} [{importedGamePrompt.id}] · {importedGamePrompt.format} ({importedGamePrompt.fileSize})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setImportedGamePrompt(null)}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleLaunchGame(importedGamePrompt)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-sky-950/50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Launch Game Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notice Banner */}
          {importNotice && !importedGamePrompt && (
            <div className="bg-sky-950/90 border-b border-sky-400/40 px-4 py-2 text-xs text-sky-200 flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{importNotice}</span>
              </div>
            </div>
          )}

          {/* Main Dashboard Body */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'home' && (
              <HomeDashboard
                games={games}
                onLaunchGame={handleLaunchGame}
                onNavigateTab={setActiveTab}
                onImportClick={handleImportClick}
                onFileDrop={processImportedFile}
                graphicsConfig={graphicsConfig}
                boosterConfig={boosterConfig}
                detectedGpu={detectedGpu}
              />
            )}

            {activeTab === 'library' && (
              <GameLibrary
                games={games}
                onLaunchGame={handleLaunchGame}
                onImportClick={handleImportClick}
                onToggleFavorite={handleToggleFavorite}
                onRemoveGame={handleRemoveGame}
                onSelectGameDetails={setSelectedGameForDetails}
              />
            )}

            {activeTab === 'controller' && (
              <ControllerCustomizer
                config={layoutConfig}
                onChange={setLayoutConfig}
                onReset={handleResetLayout}
              />
            )}

            {activeTab === 'graphics' && (
              <GraphicsSettings
                config={graphicsConfig}
                onChange={setGraphicsConfig}
                detectedGpu={detectedGpu}
              />
            )}

            {activeTab === 'drivers' && (
              <DriverManager
                detectedGpu={detectedGpu}
                activeBackend={graphicsConfig.backend}
              />
            )}

            {activeTab === 'booster' && (
              <GameBooster
                config={boosterConfig}
                onChange={setBoosterConfig}
                liveTelemetry={{
                  fps: engine.fps,
                  frameTimeMs: engine.frameTimeMs,
                  cpuLoad: engine.cpuLoad,
                  temp: engine.temperatureC,
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* Game Details Modal */}
      {selectedGameForDetails && (
        <GameDetailModal
          game={selectedGameForDetails}
          onClose={() => setSelectedGameForDetails(null)}
          onLaunch={handleLaunchGame}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
