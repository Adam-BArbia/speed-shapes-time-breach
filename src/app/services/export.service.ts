import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../state/game-state.service';
import { Cell, Connection, GameState, Team } from '../state/game-state.models';
 
// ── Canvas layout constants ──────────────────────────────────────────────────
const GRID_SIDE = 8;
const CELL_SIZE = 72;          // px per cell
const CELL_GAP = 4;            // gap between cells
const GRID_PADDING = 24;       // space around the grid
const HEADER_HEIGHT = 80;      // title + stability bar height
const FOOTER_HEIGHT = 0;
const GRID_AREA = GRID_SIDE * CELL_SIZE + (GRID_SIDE - 1) * CELL_GAP;
const CANVAS_W = GRID_AREA + GRID_PADDING * 2;
const CANVAS_H = HEADER_HEIGHT + GRID_AREA + GRID_PADDING * 2 + FOOTER_HEIGHT;
 
// ── Color palette (matches app theme) ────────────────────────────────────────
const COLOR = {
  bg:            '#070e1d',
  headerBg:      '#0a1428',
  cellEmpty:     '#0d1f3a',
  cellBorder:    '#1a3055',
  cellPending:   '#1a2e50',
  cellConfirmed: '#0d3050',
  cellUsed:      '#0a1f36',
  textMain:      '#c8d8f0',
  textMuted:     '#5a7090',
  stability:     '#11d6ff',
  stabilityBg:   '#0a1f36',
  connLine:      'rgba(255,255,255,0.55)',
};
 
// ── Shape renderers ───────────────────────────────────────────────────────────
type ShapeRenderer = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;
 
const SHAPES: Record<string, ShapeRenderer> = {
  circle: (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  },
  diamond: (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
  },
  triangle: (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.87, cy + r * 0.5);
    ctx.lineTo(cx - r * 0.87, cy + r * 0.5);
    ctx.closePath();
    ctx.fill();
  },
  square: (ctx, cx, cy, r) => {
    const s = r * 1.4;
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
  },
  hexagon: (ctx, cx, cy, r) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  },
  star: (ctx, cx, cy, r) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  },
};
 
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly gameState = inject(GameStateService);
 
  // ── JSON export ─────────────────────────────────────────────────────────────
 
  exportJson(): void {
    const snapshot = this.gameState.getStateSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.triggerDownload(blob, `speed-shapes-${this.timestamp()}.json`);
  }
 
  // ── PNG export — canvas-rendered, no DOM dependency ─────────────────────────
 
  exportPng(): void {
    const state = this.gameState.state();
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
 
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('ExportService: could not get 2d context');
      return;
    }
 
    this.drawBackground(ctx);
    this.drawHeader(ctx, state);
    this.drawGrid(ctx, state);
    this.drawConnections(ctx, state);
 
    canvas.toBlob((blob) => {
      if (!blob) return;
      this.triggerDownload(blob, `speed-shapes-${this.timestamp()}.png`);
    }, 'image/png');
  }
 
  // ── Drawing primitives ───────────────────────────────────────────────────────
 
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
 
  private drawHeader(ctx: CanvasRenderingContext2D, state: GameState): void {
    // Header background
    ctx.fillStyle = COLOR.headerBg;
    ctx.fillRect(0, 0, CANVAS_W, HEADER_HEIGHT);
 
    // Title
    ctx.fillStyle = COLOR.textMain;
    ctx.font = 'bold 20px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('SPEED SHAPES: TIME BREACH', GRID_PADDING, 22);
 
    // Timer
    const remaining = state.timer.remainingSec;
    const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
    const ss = Math.floor(remaining % 60).toString().padStart(2, '0');
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = state.timer.status === 'ended' ? '#ff3c50' : COLOR.stability;
    ctx.textAlign = 'right';
    ctx.fillText(`${mm}:${ss}`, CANVAS_W - GRID_PADDING, 22);
 
    // Stability bar label
    const confirmedCount = state.grid.filter(
      (c) => c.state === 'confirmed' || c.state === 'used',
    ).length;
    const stabilityPct = Math.round((confirmedCount / 64) * 100);
 
    ctx.font = '13px monospace';
    ctx.fillStyle = COLOR.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText(`STABILITY ${stabilityPct}%`, GRID_PADDING, 48);
 
    // Stability bar track
    const barX = GRID_PADDING;
    const barY = 58;
    const barW = CANVAS_W - GRID_PADDING * 2;
    const barH = 8;
    const radius = 4;
 
    ctx.fillStyle = COLOR.stabilityBg;
    this.roundRect(ctx, barX, barY, barW, barH, radius);
    ctx.fill();
 
    // Stability bar fill
    const fillW = Math.max(0, (stabilityPct / 100) * barW);
    if (fillW > 0) {
      ctx.fillStyle = COLOR.stability;
      this.roundRect(ctx, barX, barY, fillW, barH, radius);
      ctx.fill();
    }
  }
 
  private drawGrid(ctx: CanvasRenderingContext2D, state: GameState): void {
    const teamMap = new Map<string, Team>(state.teams.map((t) => [t.id, t]));
 
    for (const cell of state.grid) {
      const { x, y } = this.cellOrigin(cell.index);
      const team = cell.teamId ? teamMap.get(cell.teamId) : null;
 
      // Cell background
      ctx.fillStyle = this.cellBgColor(cell.state, team?.color ?? null);
      this.roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.fill();
 
      // Cell border
      ctx.strokeStyle = team?.color
        ? this.alphaColor(team.color, cell.state === 'used' ? 0.35 : 0.6)
        : COLOR.cellBorder;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.stroke();
 
      // Shape icon
      if (team && (cell.state === 'confirmed' || cell.state === 'used' || cell.state === 'pending')) {
        const alpha = cell.state === 'used' ? 0.45 : cell.state === 'pending' ? 0.55 : 0.85;
        ctx.fillStyle = this.alphaColor(team.color, alpha);
        const renderer = SHAPES[team.shape] ?? SHAPES['circle'];
        renderer(ctx, x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE * 0.26);
      }
 
      // Cell index label
      ctx.font = '10px monospace';
      ctx.fillStyle = team ? this.alphaColor(team.color, 0.55) : COLOR.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(cell.index), x + 5, y + 4);
    }
  }
 
  private drawConnections(ctx: CanvasRenderingContext2D, state: GameState): void {
    const teamMap = new Map<string, Team>(state.teams.map((t) => [t.id, t]));
 
    for (const conn of state.connections) {
      const [a, b, c] = conn.cellIndices;
      const pa = this.cellCenter(a);
      const pb = this.cellCenter(b);
      const pc = this.cellCenter(c);
      const team = conn.teamId ? teamMap.get(conn.teamId) : null;
 
      ctx.strokeStyle = team ? this.alphaColor(team.color, 0.85) : COLOR.connLine;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
 
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.lineTo(pc.x, pc.y);
      ctx.stroke();
 
      // Dot at each connected cell center
      for (const pt of [pa, pb, pc]) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = team ? team.color : COLOR.connLine;
        ctx.fill();
      }
    }
  }
 
  // ── Coordinate helpers ───────────────────────────────────────────────────────
 
  private cellOrigin(index: number): { x: number; y: number } {
    const zeroBased = index - 1;
    const col = zeroBased % GRID_SIDE;
    const row = Math.floor(zeroBased / GRID_SIDE);
    return {
      x: GRID_PADDING + col * (CELL_SIZE + CELL_GAP),
      y: HEADER_HEIGHT + GRID_PADDING + row * (CELL_SIZE + CELL_GAP),
    };
  }
 
  private cellCenter(index: number): { x: number; y: number } {
    const o = this.cellOrigin(index);
    return { x: o.x + CELL_SIZE / 2, y: o.y + CELL_SIZE / 2 };
  }
 
  // ── Color helpers ────────────────────────────────────────────────────────────
 
  private cellBgColor(state: Cell['state'], teamColor: string | null): string {
    if (state === 'used') return teamColor ? this.alphaColor(teamColor, 0.12) : COLOR.cellUsed;
    if (state === 'confirmed') return teamColor ? this.alphaColor(teamColor, 0.18) : COLOR.cellConfirmed;
    if (state === 'pending') return teamColor ? this.alphaColor(teamColor, 0.1) : COLOR.cellPending;
    return COLOR.cellEmpty;
  }
 
  /**
   * Converts a hex color + alpha to rgba().
   * Handles both #rrggbb and #rgb formats.
   */
  private alphaColor(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
 
  // ── Canvas utility ───────────────────────────────────────────────────────────
 
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
 
  // ── Download helper ───────────────────────────────────────────────────────────
 
  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
 
  private timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }
}