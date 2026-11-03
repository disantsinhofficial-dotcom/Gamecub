export type ConsoleType = 'WII' | 'GAMECUBE';

export type DiscFormat = 'ISO' | 'RVZ' | 'WBFS' | 'GCM' | 'CISO' | 'DOL' | 'ELF';

export type GameRegion = 'USA' | 'EUR' | 'JPN' | 'KOR' | 'WORLD';

export type CompatibilityRating = 'PERFECT' | 'PLAYABLE' | 'STARTS' | 'INTRO' | 'BROKEN';

export interface DolHeader {
  textOffsets: number[];
  dataOffsets: number[];
  textAddresses: number[];
  dataAddresses: number[];
  textSizes: number[];
  dataSizes: number[];
  bssAddress: number;
  bssSize: number;
  entryPoint: number;
}

export interface DiscHeader {
  gameId: string;
  makerCode: string;
  discNumber: number;
  version: number;
  magicWord: number;
  gameTitle: string;
  dolOffset: number;
  fstOffset: number;
  fstSize: number;
  userPosition: number;
  userLength: number;
}

export interface FstEntry {
  isDir: boolean;
  name: string;
  offset: number;
  size: number;
  path: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  subsystem: 'CPU' | 'GPU' | 'DVD' | 'DSP' | 'MEMORY' | 'IOS' | 'SYS';
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface ParsedDisc {
  header: DiscHeader;
  dolHeader?: DolHeader;
  files: FstEntry[];
  bannerDataUrl?: string;
  executableBuffer?: ArrayBuffer;
  isHomebrew?: boolean;
}

export interface GameMetadata {
  id: string; // e.g. "GALE01" for Melee, "RMCE01" for Mario Kart Wii
  title: string;
  console: ConsoleType;
  format: DiscFormat;
  region: GameRegion;
  fileSize: string;
  internalCode: string;
  coverImage?: string;
  lastPlayed?: string;
  playTimeMinutes: number;
  isFavorite: boolean;
  isBundled?: boolean;
  compatibility: CompatibilityRating;
  recommendedBackend: 'vulkan' | 'opengl';
  notes?: string;
  executableName?: string;
  fileObject?: File;
  parsedDisc?: ParsedDisc;
}

export type GraphicsBackend = 'vulkan' | 'opengl' | 'software';

export type InternalResolution = '1x' | '2x' | '3x' | '4x' | '5x';

export type AntiAliasing = 'none' | '2x_msaa' | '4x_msaa' | '8x_msaa' | 'fxaa' | 'smaa';

export type AnisotropicFilter = '1x' | '2x' | '4x' | '8x' | '16x';

export type TextureFilter = 'default' | 'bilinear' | 'point' | 'bicubic';

export type AspectRatio = 'auto' | '4:3' | '16:9' | 'stretch';

export type ShaderCompilation = 'sync' | 'async_skip' | 'hybrid_ubershaders' | 'specialized';

export type PostProcessingShader = 'none' | 'crt_scanlines' | 'bloom_hdr' | 'vibrant_colors' | 'sharp_bilinear';

export interface GraphicsConfig {
  backend: GraphicsBackend;
  internalResolution: InternalResolution;
  antiAliasing: AntiAliasing;
  anisotropicFilter: AnisotropicFilter;
  textureFilter: TextureFilter;
  vsync: boolean;
  widescreenHack: boolean;
  aspectRatio: AspectRatio;
  shaderCompilation: ShaderCompilation;
  shaderCache: boolean;
  postProcessing: PostProcessingShader;
  compiledShadersCount: number;
  shaderCacheSizeBytes: number;
}

export type BoosterProfile = 'extreme_boost' | 'balanced' | 'battery_saver';

export interface BoosterConfig {
  profile: BoosterProfile;
  cpuOverclockPercent: number; // 60 to 150
  dualCore: boolean;
  fastmem: boolean;
  dspMode: 'HLE' | 'LLE';
  frameLimiter: boolean;
  targetFPS: number;
  showFPSCounter: boolean;
  showTelemetry: boolean;
}

export interface ControllerLayoutConfig {
  opacity: number; // 0.1 to 1.0
  scale: number; // 0.6 to 1.4
  isLeftHanded: boolean;
  hapticFeedback: boolean;
  dpadPos: { x: number; y: number };
  actionButtonsPos: { x: number; y: number };
  analogStickPos: { x: number; y: number };
  cstickPos: { x: number; y: number };
  triggersPos: { x: number; y: number };
  wiiRemotePos: { x: number; y: number };
  nunchukPos: { x: number; y: number };
  wiiPointerSensitivity: number; // 1 to 10
  sensorBarPosition: 'top' | 'bottom';
  shakeSensitivity: number; // 1 to 10
}

export interface SaveState {
  slot: number;
  gameId: string;
  timestamp: string;
  screenshotUrl: string;
  playTimeMinutes: number;
  frameIndex: number;
}

export interface GpuDriverProfile {
  id: string;
  name: string;
  version: string;
  vendor: string;
  vulkanApiVersion: string;
  releaseDate: string;
  isCustomTurnip: boolean;
  isInstalled: boolean;
  isRecommended: boolean;
  description: string;
}
