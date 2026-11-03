import { GraphicsConfig } from './types';

export interface Vertex3D {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  a: number;
  u: number;
  v: number;
}

export class GXRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  public internalWidth: number = 640;
  public internalHeight: number = 480;
  public drawCalls: number = 0;
  public polygonsRendered: number = 0;
  public efbCopies: number = 0;

  // Viewport & Matrix state
  private projMatrix: Float32Array = new Float32Array(16);
  private modelViewMatrix: Float32Array = new Float32Array(16);

  constructor() {
    this.initMatrices();
  }

  public attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  private initMatrices() {
    // Identity
    this.projMatrix.fill(0);
    this.modelViewMatrix.fill(0);
    for (let i = 0; i < 4; i++) {
      this.projMatrix[i * 5] = 1;
      this.modelViewMatrix[i * 5] = 1;
    }
  }

  public setResolution(multiplier: string) {
    let scale = 1;
    if (multiplier === '2x') scale = 1.5;
    else if (multiplier === '3x') scale = 2.0;
    else if (multiplier === '4x') scale = 2.5;

    this.internalWidth = Math.round(640 * scale);
    this.internalHeight = Math.round(480 * scale);
  }

  public beginFrame(config: GraphicsConfig) {
    if (!this.canvas || !this.ctx) return;
    this.drawCalls = 0;
    this.polygonsRendered = 0;
    this.efbCopies = 0;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background to GameCube / Wii hardware dark palette
    this.ctx.fillStyle = '#060810';
    this.ctx.fillRect(0, 0, w, h);
  }

  public renderDiscBootSequence(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    gameTitle: string,
    gameId: string,
    consoleType: string,
    cycleCount: number,
    pc: number
  ) {
    // 3D GameCube Rotating Disc & Core Visualizer
    const cx = w * 0.5;
    const cy = h * 0.45;
    const radius = Math.min(w, h) * 0.28;

    const rot = (cycleCount * 0.000003) % (Math.PI * 2);

    ctx.save();
    ctx.translate(cx, cy);

    // Glowing Disc Outer Edge
    const edgeGrad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius);
    edgeGrad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
    edgeGrad.addColorStop(0.7, consoleType === 'WII' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(99, 102, 241, 0.2)');
    edgeGrad.addColorStop(0.95, consoleType === 'WII' ? 'rgba(56, 189, 248, 0.6)' : 'rgba(99, 102, 241, 0.6)');
    edgeGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Disc Data Tracks
    ctx.strokeStyle = consoleType === 'WII' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(129, 140, 248, 0.3)';
    ctx.lineWidth = 1.5;
    for (let r = radius * 0.4; r < radius * 0.9; r += 12) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Holographic Rainbow Sheen
    const sheenGrad = ctx.createLinearGradient(
      -radius * Math.cos(rot),
      -radius * Math.sin(rot),
      radius * Math.cos(rot),
      radius * Math.sin(rot)
    );
    sheenGrad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
    sheenGrad.addColorStop(0.3, 'rgba(59, 130, 246, 0.2)');
    sheenGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.2)');
    sheenGrad.addColorStop(1, 'rgba(234, 179, 8, 0.15)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2);
    ctx.fill();

    // Center Spindle Hole
    ctx.fillStyle = '#060810';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = consoleType === 'WII' ? '#38bdf8' : '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Disc Logo & Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(consoleType === 'WII' ? 'NINTENDO WII' : 'NINTENDO GAMECUBE', 0, -radius * 0.45);

    ctx.fillStyle = consoleType === 'WII' ? '#38bdf8' : '#a5b4fc';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(gameId, 0, radius * 0.55);

    ctx.restore();

    this.drawCalls++;
    this.polygonsRendered += 64;
  }
}
