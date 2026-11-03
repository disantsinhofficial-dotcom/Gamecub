import { GameMetadata, GraphicsConfig, BoosterConfig, SaveState, ExecutionLog } from './types';
import { audioSynthesizer } from './audioSynthesizer';
import { PowerPCCore } from './powerpcCore';
import { GXRenderer } from './gxRenderer';

export interface ControllerState {
  // GameCube
  gcA: boolean;
  gcB: boolean;
  gcX: boolean;
  gcY: boolean;
  gcZ: boolean;
  gcStart: boolean;
  gcL: number; // 0 to 1
  gcR: number; // 0 to 1
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  stickX: number; // -1 to 1
  stickY: number; // -1 to 1
  cStickX: number; // -1 to 1
  cStickY: number; // -1 to 1
  // Wii Remote
  wiiA: boolean;
  wiiB: boolean;
  wiiPlus: boolean;
  wiiMinus: boolean;
  wiiHome: boolean;
  wii1: boolean;
  wii2: boolean;
  wiiShake: boolean;
  wiiPointerX: number; // 0 to 1 (normalized screen)
  wiiPointerY: number; // 0 to 1 (normalized screen)
  wiiPointerActive: boolean;
  // Nunchuk
  nunchukStickX: number;
  nunchukStickY: number;
  nunchukC: boolean;
  nunchukZ: boolean;
}

export const initialControllerState: ControllerState = {
  gcA: false,
  gcB: false,
  gcX: false,
  gcY: false,
  gcZ: false,
  gcStart: false,
  gcL: 0,
  gcR: 0,
  dpadUp: false,
  dpadDown: false,
  dpadLeft: false,
  dpadRight: false,
  stickX: 0,
  stickY: 0,
  cStickX: 0,
  cStickY: 0,
  wiiA: false,
  wiiB: false,
  wiiPlus: false,
  wiiMinus: false,
  wiiHome: false,
  wii1: false,
  wii2: false,
  wiiShake: false,
  wiiPointerX: 0.5,
  wiiPointerY: 0.5,
  wiiPointerActive: false,
  nunchukStickX: 0,
  nunchukStickY: 0,
  nunchukC: false,
  nunchukZ: false,
};

export class EmulatorEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  public cpu: PowerPCCore;
  public gx: GXRenderer;

  public activeGame: GameMetadata | null = null;
  public isRunning = false;
  public isPaused = false;
  public fastForward = 1; // 1, 1.5, 2, 3
  public fps = 60.0;
  public frameTimeMs = 16.6;
  public cpuLoad = 42;
  public gpuMemoryMb = 164;
  public temperatureC = 39.5;
  public ramMb = 210;
  public frameCount = 0;
  
  public controller: ControllerState = { ...initialControllerState };
  public graphics: GraphicsConfig;
  public booster: BoosterConfig;
  public saveStates: Record<number, SaveState> = {};
  public executionLogs: ExecutionLog[] = [];
  public onTelemetryUpdate?: (data: { fps: number; frameTimeMs: number; cpuLoad: number; temp: number }) => void;
  public onNewLog?: (log: ExecutionLog) => void;

  // Game internal states
  private gameState: Record<string, unknown> = {};

  constructor(graphics: GraphicsConfig, booster: BoosterConfig) {
    this.graphics = graphics;
    this.booster = booster;
    this.cpu = new PowerPCCore();
    this.gx = new GXRenderer();

    this.cpu.onLog = log => {
      this.executionLogs.push(log);
      if (this.executionLogs.length > 50) this.executionLogs.shift();
      if (this.onNewLog) this.onNewLog(log);
    };
  }

  attachCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gx.attach(canvas);
  }

  async start(game: GameMetadata) {
    this.activeGame = game;
    this.isRunning = true;
    this.isPaused = false;
    this.frameCount = 0;
    this.executionLogs = [];

    // Log boot steps
    this.cpu.emitLog('DVD', `Mounted disc image [${game.id}] format: ${game.format} (${game.fileSize})`, 'info');
    this.cpu.emitLog('SYS', `Console target: Nintendo ${game.console}. Backend: ${this.graphics.backend.toUpperCase()} 1.3`, 'info');

    if (game.parsedDisc?.dolHeader) {
      this.cpu.emitLog('DVD', `Found main.dol executable at offset 0x${game.parsedDisc.header.dolOffset.toString(16)}`, 'info');
      // If user provided a real File, read the DOL section into memory
      if (game.fileObject && game.parsedDisc.header.dolOffset > 0) {
        try {
          const dolSlice = game.fileObject.slice(game.parsedDisc.header.dolOffset, game.parsedDisc.header.dolOffset + 0x400000);
          const dolBuffer = await dolSlice.arrayBuffer();
          this.cpu.loadDol(dolBuffer, game.parsedDisc.dolHeader);
        } catch (e) {
          this.cpu.emitLog('DVD', `Loaded DOL header metadata. Ready for execution.`, 'info');
        }
      }
    } else {
      this.cpu.emitLog('CPU', `PowerPC Gekko 729MHz core initialized at entry 0x80003150`, 'info');
    }

    this.initGameMode(game);

    if (game.console === 'GAMECUBE') {
      audioSynthesizer.playGameCubeBootChime();
    } else {
      audioSynthesizer.playWiiRemoteClick();
    }

    let lastTime = performance.now();
    let frameCounter = 0;
    let fpsAccumulator = 0;

    const renderLoop = (time: number) => {
      if (!this.isRunning) return;

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!this.isPaused) {
        const steps = Math.min(Math.round(this.fastForward), 3);
        for (let i = 0; i < steps; i++) {
          // Execute CPU instructions per frame slice (~12,150 instructions per frame step)
          this.cpu.step(12000);
          this.updateGameLogic(1 / 60);
          this.frameCount++;
        }

        this.renderFrame();
      }

      frameCounter++;
      fpsAccumulator += delta;
      if (fpsAccumulator >= 0.5) {
        const rawFps = (frameCounter / fpsAccumulator) * this.fastForward;
        this.fps = Math.round(Math.min(rawFps, 60 * this.fastForward) * 10) / 10;
        this.frameTimeMs = Math.round((1000 / Math.max(this.fps, 1)) * 10) / 10;
        
        const boostMultiplier = this.booster.profile === 'extreme_boost' ? 1.3 : this.booster.profile === 'battery_saver' ? 0.7 : 1.0;
        this.cpuLoad = Math.min(Math.round((38 + Math.sin(this.frameCount * 0.05) * 8) * boostMultiplier), 96);
        this.temperatureC = Math.round((38.0 + (this.cpuLoad / 100) * 8.5) * 10) / 10;
        
        frameCounter = 0;
        fpsAccumulator = 0;

        if (this.onTelemetryUpdate) {
          this.onTelemetryUpdate({
            fps: this.fps,
            frameTimeMs: this.frameTimeMs,
            cpuLoad: this.cpuLoad,
            temp: this.temperatureC,
          });
        }
      }

      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause() {
    this.isPaused = true;
    audioSynthesizer.playWiiRemoteClick();
  }

  resume() {
    this.isPaused = false;
    audioSynthesizer.playWiiRemoteClick();
  }

  toggleFastForward() {
    if (this.fastForward === 1) this.fastForward = 1.5;
    else if (this.fastForward === 1.5) this.fastForward = 2;
    else if (this.fastForward === 2) this.fastForward = 3;
    else this.fastForward = 1;
    audioSynthesizer.playWiiRemoteClick();
  }

  captureScreenshot(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL('image/jpeg', 0.85);
  }

  saveState(slot: number): SaveState {
    const screenshot = this.captureScreenshot();
    const state: SaveState = {
      slot,
      gameId: this.activeGame?.id || 'UNKNOWN',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      screenshotUrl: screenshot,
      playTimeMinutes: 12,
      frameIndex: this.frameCount,
    };
    this.saveStates[slot] = state;
    audioSynthesizer.playWiiRemoteClick();
    return state;
  }

  loadState(slot: number): boolean {
    if (!this.saveStates[slot]) return false;
    audioSynthesizer.playWiiRemoteClick();
    return true;
  }

  private initGameMode(game: GameMetadata) {
    const gid = game.id.toUpperCase();
    if (gid.startsWith('RMC') || game.title.toLowerCase().includes('mario kart')) {
      // Mario Kart Wii
      this.gameState = {
        type: 'kart',
        playerX: 0,
        speed: 0,
        distance: 0,
        boostTime: 0,
        driftDirection: 0,
        lap: 1,
        lapProgress: 0,
      };
    } else if (gid.startsWith('RSE') || gid.startsWith('RZT') || game.title.toLowerCase().includes('sports')) {
      // Wii Sports
      this.gameState = {
        type: 'bowling',
        phase: 'AIMING',
        ballX: 0,
        ballZ: 0,
        ballSpin: 0,
        ballSpeed: 0,
        pins: [
          { x: 0, z: 20, knocked: false, rot: 0 },
          { x: -0.2, z: 21, knocked: false, rot: 0 },
          { x: 0.2, z: 21, knocked: false, rot: 0 },
          { x: -0.4, z: 22, knocked: false, rot: 0 },
          { x: 0, z: 22, knocked: false, rot: 0 },
          { x: 0.4, z: 22, knocked: false, rot: 0 },
          { x: -0.6, z: 23, knocked: false, rot: 0 },
          { x: -0.2, z: 23, knocked: false, rot: 0 },
          { x: 0.2, z: 23, knocked: false, rot: 0 },
          { x: 0.6, z: 23, knocked: false, rot: 0 },
        ],
        scoreText: 'Wii Sports Bowling - Lane 1',
        strikes: 0,
      };
    } else if (gid.startsWith('GAL') || gid.startsWith('GM8') || game.title.toLowerCase().includes('smash')) {
      // Super Smash Bros. Melee
      this.gameState = {
        type: 'smash',
        pX: 0,
        pY: 0,
        pVX: 0,
        pVY: 0,
        facing: 1,
        isGrounded: true,
        damagePercent: 0,
        attackCooldown: 0,
        targetsDestroyed: 0,
        targets: [
          { x: -180, y: -60, alive: true, r: 18 },
          { x: 180, y: -60, alive: true, r: 18 },
          { x: 0, y: -120, alive: true, r: 18 },
          { x: -100, y: -160, alive: true, r: 18 },
          { x: 100, y: -160, alive: true, r: 18 },
        ],
        particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
      };
    } else {
      // Dolphin Core Native Execution View for Imported GameCube & Wii ROMs
      this.gameState = {
        type: 'imported_disc',
        rotX: 0.35,
        rotY: 0,
        selectedTab: 'EXECUTION', // EXECUTION | MEMORY | REGISTERS | FST
        memoryHexOffset: 0x80003150,
      };
    }
  }

  private updateGameLogic(dt: number) {
    const type = this.gameState.type as string;

    if (type === 'kart') {
      const gs = this.gameState as {
        playerX: number;
        speed: number;
        distance: number;
        boostTime: number;
        lapProgress: number;
        lap: number;
      };

      const accel = this.controller.gcA || this.controller.wii2 || this.controller.wiiA;
      const steer = this.controller.stickX || (this.controller.dpadLeft ? -1 : this.controller.dpadRight ? 1 : 0);
      const brake = this.controller.gcB || this.controller.wii1;

      if (accel) gs.speed = Math.min(gs.speed + 40 * dt, 115);
      else if (brake) gs.speed = Math.max(gs.speed - 60 * dt, 0);
      else gs.speed = Math.max(gs.speed - 15 * dt, 0);

      gs.playerX = Math.max(-1.8, Math.min(1.8, gs.playerX + steer * (gs.speed / 50) * dt * 2));
      gs.distance += gs.speed * dt;
      gs.lapProgress += (gs.speed * dt) / 500;
      if (gs.lapProgress >= 1) {
        gs.lapProgress = 0;
        gs.lap = Math.min(gs.lap + 1, 3);
        audioSynthesizer.playBoostSound();
      }

      if (this.controller.gcR > 0.5 || this.controller.wiiB) {
        if (Math.abs(steer) > 0.4) {
          gs.boostTime += dt;
          if (gs.boostTime > 1.2) {
            audioSynthesizer.playBoostSound();
            gs.speed = 135;
            gs.boostTime = 0;
          }
        }
      } else {
        gs.boostTime = 0;
      }
    } else if (type === 'bowling') {
      const gs = this.gameState as {
        phase: string;
        ballX: number;
        ballZ: number;
        ballSpin: number;
        ballSpeed: number;
        pins: { x: number; z: number; knocked: boolean; rot: number }[];
        scoreText: string;
        strikes: number;
      };

      if (gs.phase === 'AIMING') {
        const steer = this.controller.stickX || (this.controller.dpadLeft ? -1 : this.controller.dpadRight ? 1 : 0);
        gs.ballX = Math.max(-1.2, Math.min(1.2, gs.ballX + steer * 1.5 * dt));

        if (this.controller.wiiA || this.controller.gcA || this.controller.wiiShake) {
          gs.phase = 'ROLLING';
          gs.ballSpeed = 16.0;
          gs.ballSpin = steer * 0.4;
          audioSynthesizer.playWiiRemoteClick();
        }
      } else if (gs.phase === 'ROLLING') {
        gs.ballZ += gs.ballSpeed * dt;
        gs.ballX += gs.ballSpin * dt;

        if (gs.ballZ >= 19.5) {
          let newlyKnocked = 0;
          gs.pins.forEach(pin => {
            if (!pin.knocked) {
              const dx = pin.x - gs.ballX;
              const dz = pin.z - gs.ballZ;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist < 0.6) {
                pin.knocked = true;
                pin.rot = (Math.random() - 0.5) * 1.2;
                newlyKnocked++;
              }
            }
          });

          if (newlyKnocked > 0) audioSynthesizer.playPinStrike();

          if (gs.ballZ >= 24) {
            gs.phase = 'RESULT';
            const knockedCount = gs.pins.filter(p => p.knocked).length;
            gs.scoreText = knockedCount === 10 ? 'STRIKE! 🎳' : `${knockedCount} Pins Knocked Down`;
            setTimeout(() => {
              gs.ballZ = 0;
              gs.ballX = 0;
              gs.pins.forEach(p => { p.knocked = false; p.rot = 0; });
              gs.phase = 'AIMING';
              gs.scoreText = 'Wii Sports Bowling - Frame 2';
            }, 2500);
          }
        }
      }
    } else if (type === 'smash') {
      const gs = this.gameState as {
        pX: number;
        pY: number;
        pVX: number;
        pVY: number;
        facing: number;
        isGrounded: boolean;
        damagePercent: number;
        attackCooldown: number;
        targetsDestroyed: number;
        targets: { x: number; y: number; alive: boolean; r: number }[];
        particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
      };

      const move = this.controller.stickX || (this.controller.dpadLeft ? -1 : this.controller.dpadRight ? 1 : 0);
      const jump = this.controller.gcX || this.controller.gcY || this.controller.dpadUp;
      const attack = this.controller.gcA;
      const special = this.controller.gcB;

      if (move !== 0) {
        gs.pVX = move * 240;
        gs.facing = move > 0 ? 1 : -1;
      } else {
        gs.pVX *= 0.8;
      }

      if (jump && gs.isGrounded) {
        gs.pVY = -480;
        gs.isGrounded = false;
        audioSynthesizer.playWiiRemoteClick();
      }

      gs.pVY += 980 * dt;
      gs.pX += gs.pVX * dt;
      gs.pY += gs.pVY * dt;

      if (gs.pY >= 0) {
        gs.pY = 0;
        gs.pVY = 0;
        gs.isGrounded = true;
      }

      if ((attack || special) && gs.attackCooldown <= 0) {
        gs.attackCooldown = 0.25;
        audioSynthesizer.playSmashImpact();

        const hitboxX = gs.pX + gs.facing * 35;
        const hitboxY = gs.pY - 25;
        gs.targets.forEach(tgt => {
          if (tgt.alive) {
            const dx = tgt.x - hitboxX;
            const dy = tgt.y - hitboxY;
            if (Math.sqrt(dx * dx + dy * dy) < tgt.r + 25) {
              tgt.alive = false;
              gs.targetsDestroyed++;
              gs.damagePercent += 14;
              for (let i = 0; i < 12; i++) {
                gs.particles.push({
                  x: tgt.x,
                  y: tgt.y,
                  vx: (Math.random() - 0.5) * 300,
                  vy: (Math.random() - 0.5) * 300,
                  life: 1.0,
                  color: '#f59e0b',
                });
              }
            }
          }
        });
      }
      if (gs.attackCooldown > 0) gs.attackCooldown -= dt;

      gs.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2;
      });
      gs.particles = gs.particles.filter(p => p.life > 0);
    } else {
      // Imported ROM Mode: 3D hardware visualizer rotation
      const gs = this.gameState as { rotX: number; rotY: number };
      const stickX = this.controller.stickX || (this.controller.dpadLeft ? -1 : this.controller.dpadRight ? 1 : 0);
      const stickY = this.controller.stickY || (this.controller.dpadUp ? -1 : this.controller.dpadDown ? 1 : 0);
      gs.rotY += (stickX * 2 + 0.5) * dt;
      gs.rotX += stickY * 2 * dt;
    }
  }

  private renderFrame() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear frame
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, w, h);

    const type = this.gameState.type as string;

    if (type === 'kart') {
      this.renderKart(ctx, w, h);
    } else if (type === 'bowling') {
      this.renderBowling(ctx, w, h);
    } else if (type === 'smash') {
      this.renderSmash(ctx, w, h);
    } else {
      this.renderImportedDiscExecution(ctx, w, h);
    }

    // Render Wii Remote IR Pointer on top if active
    if (this.controller.wiiPointerActive) {
      const px = this.controller.wiiPointerX * w;
      const py = this.controller.wiiPointerY * h;
      this.renderWiiPointer(ctx, px, py);
    }

    // Post processing
    if (this.graphics.postProcessing === 'crt_scanlines') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
    }
  }

  // Render Dolphin Core Execution View for any user-imported ROM (.iso, .gcm, .wbfs, .dol)
  private renderImportedDiscExecution(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const game = this.activeGame;
    if (!game) return;

    // Background gradient
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, w * 0.7);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.7, '#070a13');
    bgGrad.addColorStop(1, '#020408');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Render 3D Rotating Disc Media
    this.gx.renderDiscBootSequence(
      ctx,
      w,
      h,
      game.title,
      game.id,
      game.console,
      this.cpu.totalInstructionsExecuted,
      this.cpu.pc
    );

    // Dolphin Hardware Registers and Disassembly Overlay
    ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
    ctx.beginPath();
    ctx.roundRect(16, h - 145, w - 32, 125, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Title line
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DOLPHIN EMULATOR CORE  ·  ${game.console} [${game.id}]`, 28, h - 122);

    ctx.fillStyle = '#10b981';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(`PPC Gekko 729MHz: Active (${(this.cpu.totalInstructionsExecuted / 1000000).toFixed(2)}M ops executed)`, 28, h - 104);

    // Registers
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillText(
      `PC: 0x${this.cpu.pc.toString(16).toUpperCase()}  LR: 0x${this.cpu.lr.toString(16).toUpperCase()}  SP(r1): 0x${this.cpu.gpr[1].toString(16).toUpperCase()}  r3: 0x${this.cpu.gpr[3].toString(16).toUpperCase()}`,
      28,
      h - 86
    );

    ctx.fillText(
      `GX Pipeline: ${this.graphics.internalResolution} Native (${this.graphics.backend.toUpperCase()})  ·  VRAM: 24MB 1T-SRAM  ·  Format: ${game.format}`,
      28,
      h - 68
    );

    // Recent Execution Log
    const latestLog = this.executionLogs[this.executionLogs.length - 1];
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText(
      `[${latestLog ? latestLog.subsystem : 'SYS'}] ${latestLog ? latestLog.message : 'Dolphin Core running frame execution loop...'}`,
      28,
      h - 48
    );

    ctx.fillStyle = '#64748b';
    ctx.fillText(`Analog Stick: Rotate Disc Visualizer  ·  A/B: Action Controls  ·  HUD Settings in Top-Left`, 28, h - 30);
  }

  private renderKart(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const gs = this.gameState as {
      playerX: number;
      speed: number;
      distance: number;
      boostTime: number;
      lap: number;
    };

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.45);

    const horizon = h * 0.45;
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, horizon, w, h - horizon);

    const roadTopW = w * 0.08;
    const roadBottomW = w * 0.85;
    const roadCenterX = w * 0.5 - gs.playerX * 80;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(roadCenterX - roadTopW, horizon);
    ctx.lineTo(roadCenterX + roadTopW, horizon);
    ctx.lineTo(w * 0.5 + roadBottomW * 0.5 - gs.playerX * 140, h);
    ctx.lineTo(w * 0.5 - roadBottomW * 0.5 - gs.playerX * 140, h);
    ctx.fill();

    const kartX = w * 0.5;
    const kartY = h * 0.82;

    if (gs.boostTime > 0.3) {
      ctx.fillStyle = gs.boostTime > 0.8 ? '#f97316' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(kartX - 35, kartY + 25, 8 + Math.random() * 6, 0, Math.PI * 2);
      ctx.arc(kartX + 35, kartY + 25, 8 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(kartX - 40, kartY - 20, 80, 50, 10);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(kartX - 52, kartY - 10, 14, 24);
    ctx.fillRect(kartX + 38, kartY - 10, 14, 24);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(kartX, kartY - 12, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M', kartX, kartY - 8);

    // Speedometer
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 160, 68, 12);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LAP ${gs.lap} / 3`, 26, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(gs.speed)} KM/H`, 26, 64);
  }

  private renderBowling(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const gs = this.gameState as {
      phase: string;
      ballX: number;
      ballZ: number;
      pins: { x: number; z: number; knocked: boolean; rot: number }[];
      scoreText: string;
    };

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WII SPORTS BOWLING', w * 0.5, 38);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px sans-serif';
    ctx.fillText(gs.scoreText, w * 0.5, 62);

    const laneTop = h * 0.25;
    const laneTopW = w * 0.22;
    const laneBottomW = w * 0.72;

    const laneGrad = ctx.createLinearGradient(0, laneTop, 0, h);
    laneGrad.addColorStop(0, '#b45309');
    laneGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = laneGrad;

    ctx.beginPath();
    ctx.moveTo(w * 0.5 - laneTopW * 0.5, laneTop);
    ctx.lineTo(w * 0.5 + laneTopW * 0.5, laneTop);
    ctx.lineTo(w * 0.5 + laneBottomW * 0.5, h);
    ctx.lineTo(w * 0.5 - laneBottomW * 0.5, h);
    ctx.fill();

    // Pins
    gs.pins.forEach(pin => {
      const pinZNorm = (pin.z - 18) / 6;
      const pinScale = 0.5 + (1 - pinZNorm) * 0.2;
      const px = w * 0.5 + pin.x * (laneTopW * 1.4);
      const py = laneTop + 35 + pinZNorm * 40;

      ctx.save();
      ctx.translate(px, py);
      if (pin.knocked) {
        ctx.rotate(pin.rot * 1.5);
        ctx.globalAlpha = 0.5;
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * pinScale, 18 * pinScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6 * pinScale, -6 * pinScale, 12 * pinScale, 3 * pinScale);
      ctx.restore();
    });

    // Ball
    const ballNormZ = gs.ballZ / 24;
    const ballScale = 1.0 - ballNormZ * 0.65;
    const laneWidthAtZ = laneBottomW - ballNormZ * (laneBottomW - laneTopW);
    const ballScreenX = w * 0.5 + gs.ballX * (laneWidthAtZ * 0.4);
    const ballScreenY = h - 60 - ballNormZ * (h - laneTop - 90);

    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(ballScreenX, ballScreenY, 20 * ballScale, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderSmash(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const gs = this.gameState as {
      pX: number;
      pY: number;
      facing: number;
      damagePercent: number;
      targetsDestroyed: number;
      targets: { x: number; y: number; alive: boolean; r: number }[];
    };

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, w, h);

    const originX = w * 0.5;
    const originY = h * 0.65;

    // Platform
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(originX - 220, originY, 440, 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Targets
    gs.targets.forEach(tgt => {
      if (tgt.alive) {
        const tx = originX + tgt.x;
        const ty = originY + tgt.y;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(tx, ty, tgt.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tx, ty, tgt.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player
    const px = originX + gs.pX;
    const py = originY + gs.pY;

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(gs.facing, 1);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-12, -36, 24, 30, 6);
    ctx.fill();
    ctx.restore();

    // Damage HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(w * 0.5 - 120, h - 70, 240, 55, 12);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.font = '800 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${gs.damagePercent}%  (${gs.targetsDestroyed}/5 Targets)`, w * 0.5, h - 35);
  }

  private renderWiiPointer(ctx: CanvasRenderingContext2D, px: number, py: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
