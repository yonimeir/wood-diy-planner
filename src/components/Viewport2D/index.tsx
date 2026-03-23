import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import type { PlacedBoard } from '../../store';

type View = 'top' | 'front' | 'side';

const VIEW_LABELS: Record<View, string> = {
  top: 'מבט עליון (X-Z)',
  front: 'חזית (X-Y)',
  side: 'צד (Z-Y)',
};

// Get the 2D bounding box for all boards in the given projection
function getBounds(boards: PlacedBoard[], view: View) {
  if (boards.length === 0) return { minX: -50, minY: -50, maxX: 200, maxY: 200 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const b of boards) {
    const { x, y, z, length, boardType } = b;
    const w = boardType.width;
    const h = boardType.height;
    const l = length;

    let x1: number, y1: number, x2: number, y2: number;

    if (view === 'top') {
      // looking down: X horizontal, Z vertical
      x1 = x; x2 = x + w; y1 = z; y2 = z + l;
    } else if (view === 'front') {
      // looking from front: X horizontal, Y vertical
      x1 = x; x2 = x + w; y1 = y; y2 = y + h;
    } else {
      // side: Z horizontal, Y vertical
      x1 = z; x2 = z + l; y1 = y; y2 = y + h;
    }

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  }

  const pad = 20;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

function draw2DView(
  canvas: HTMLCanvasElement,
  boards: PlacedBoard[],
  selectedId: string | null,
  view: View,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background — light gray matching 3D viewport
  ctx.fillStyle = '#e8ecf0';
  ctx.fillRect(0, 0, W, H);

  const bounds = getBounds(boards, view);
  const bW = bounds.maxX - bounds.minX;
  const bH = bounds.maxY - bounds.minY;

  const scaleX = W / bW;
  const scaleY = H / bH;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const offsetX = (W - bW * scale) / 2 - bounds.minX * scale;
  const offsetY = (H - bH * scale) / 2 - bounds.minY * scale;

  const toCanvasX = (v: number) => v * scale + offsetX;
  const toCanvasY = (v: number) => H - (v * scale + offsetY); // flip Y

  // Draw grid — minor lines every 10 cm, major every 50 cm
  const gridMinor = 10;
  const gridMajor = 50;
  const startX = Math.floor(bounds.minX / gridMinor) * gridMinor;
  const startY = Math.floor(bounds.minY / gridMinor) * gridMinor;

  // Minor lines
  ctx.strokeStyle = '#9aa3b0';
  ctx.lineWidth = 0.8;
  for (let gx = startX; gx <= bounds.maxX; gx += gridMinor) {
    if (gx % gridMajor === 0) continue; // skip — drawn as major
    ctx.beginPath();
    ctx.moveTo(toCanvasX(gx), 0);
    ctx.lineTo(toCanvasX(gx), H);
    ctx.stroke();
  }
  for (let gy = startY; gy <= bounds.maxY; gy += gridMinor) {
    if (gy % gridMajor === 0) continue;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(gy));
    ctx.lineTo(W, toCanvasY(gy));
    ctx.stroke();
  }

  // Major lines (every 50 cm) — darker and labelled
  ctx.strokeStyle = '#5a6880';
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#5a6880';
  ctx.font = '9px monospace';
  for (let gx = startX; gx <= bounds.maxX; gx += gridMajor) {
    if (gx % gridMajor !== 0) continue;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(gx), 0);
    ctx.lineTo(toCanvasX(gx), H);
    ctx.stroke();
    if (gx !== 0) ctx.fillText(`${gx}`, toCanvasX(gx) + 2, 9);
  }
  for (let gy = startY; gy <= bounds.maxY; gy += gridMajor) {
    if (gy % gridMajor !== 0) continue;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(gy));
    ctx.lineTo(W, toCanvasY(gy));
    ctx.stroke();
    if (gy !== 0) ctx.fillText(`${gy}`, 2, toCanvasY(gy) - 2);
  }

  // Origin axes (X=0, Y=0) — slightly stronger
  ctx.strokeStyle = '#3a4a5a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), H);
  ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(W, toCanvasY(0));
  ctx.stroke();

  // Draw boards
  for (const b of boards) {
    const { x, y, z, length, boardType } = b;
    const w = boardType.width;
    const h = boardType.height;
    const l = length;

    let bx: number, by: number, bw: number, bh: number;

    if (view === 'top') {
      bx = x; by = z; bw = w; bh = l;
    } else if (view === 'front') {
      bx = x; by = y; bw = w; bh = h;
    } else {
      bx = z; by = y; bw = l; bh = h;
    }

    const cx = toCanvasX(bx);
    const cy = toCanvasY(by + bh);
    const cw = bw * scale;
    const ch = bh * scale;

    const isSelected = b.id === selectedId;

    // Fill
    ctx.fillStyle = isSelected ? '#bae6fd' : boardType.color + 'bb';
    ctx.fillRect(cx, cy, cw, ch);

    // Stroke
    ctx.strokeStyle = isSelected ? '#0284c7' : boardType.color;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(cx, cy, cw, ch);

    // Label
    if (cw > 30 && ch > 12) {
      ctx.fillStyle = isSelected ? '#0c4a6e' : '#2a1a08';
      ctx.font = `${Math.max(9, Math.min(12, cw / 8))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = b.label ?? boardType.name;
      const maxChars = Math.floor(cw / 7);
      ctx.fillText(
        label.length > maxChars ? label.slice(0, maxChars) + '…' : label,
        cx + cw / 2,
        cy + ch / 2,
      );
    }

    // Dimension annotation for selected
    if (isSelected) {
      ctx.fillStyle = '#0369a1';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${bw}`, cx + cw / 2, cy - 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(cx + cw + 2, cy + ch / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${bh}`, 0, 0);
      ctx.restore();
    }
  }

}

function View2DPanel({ view, boards, selectedId }: { view: View; boards: PlacedBoard[]; selectedId: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw2DView(canvas, boards, selectedId, view);
  }, [boards, selectedId, view]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      redraw();
    });
    obs.observe(canvas.parentElement!);
    return () => obs.disconnect();
  }, [redraw]);

  return (
    <div className="relative flex-1 overflow-hidden rounded border border-slate-300" style={{ background: '#e8ecf0' }}>
      <span className="absolute top-1.5 right-2 text-xs z-10 pointer-events-none font-medium" style={{ color: '#6b7280' }}>
        {VIEW_LABELS[view]}
      </span>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export default function Viewport2D() {
  const { boards, selectedBoardId } = useStore();

  return (
    <div className="flex flex-col gap-1 h-full p-1">
      <View2DPanel view="top" boards={boards} selectedId={selectedBoardId} />
      <View2DPanel view="front" boards={boards} selectedId={selectedBoardId} />
      <View2DPanel view="side" boards={boards} selectedId={selectedBoardId} />
    </div>
  );
}
