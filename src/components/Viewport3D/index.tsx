import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import type { PlacedBoard } from '../../store';
import { getBoardById } from '../../data/boards';
import Scene from './Scene';

// Captures Three.js camera + renderer into an external ref for use outside Canvas
function ThreeStateCapture({
  stateRef,
}: {
  stateRef: React.MutableRefObject<{ camera: THREE.Camera; gl: THREE.WebGLRenderer } | null>;
}) {
  const { camera, gl } = useThree();
  stateRef.current = { camera, gl };
  return null;
}

// ── Floating mode toolbar ─────────────────────────────────────────────────────
function ModeToolbar() {
  const { snapEnabled, toggleSnap, showGrid, toggleGrid,
          boardSnapEnabled, toggleBoardSnap, boardSnapGap, setBoardSnapGap,
          selectedBoardId, boards, duplicateBoard, removeBoard, updateBoard, selectBoard } = useStore();

  const board = selectedBoardId ? boards.find(b => b.id === selectedBoardId) : null;
  const hasSel = !!board;

  // Shared button styles
  const btn = (active?: boolean, disabled?: boolean): React.CSSProperties => ({
    background: active ? '#2563eb' : disabled ? '#f8fafc' : '#ffffff',
    color: active ? '#ffffff' : disabled ? '#cbd5e1' : '#64748b',
    border: `1px solid ${active ? '#2563eb' : disabled ? '#f1f5f9' : '#e2e8f0'}`,
    boxShadow: active ? '0 4px 12px rgba(37,99,235,0.3)' : '0 2px 4px rgba(0,0,0,0.02)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: disabled ? 'none' : 'auto',
    transform: active ? 'scale(1.02)' : 'scale(1)',
  });

  const sep = <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-auto shadow-xl"
      style={{ direction: 'ltr', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: 12, padding: '6px 8px', border: '1px solid rgba(0,0,0,0.05)' }}
    >
      {/* ── Snap toggle ── */}
      <button
        onClick={toggleSnap}
        title="הצמד לגריד 1 ס״מ (S)"
        style={btn(snapEnabled)}
        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
        </svg>
        גריד אישי
      </button>

      {/* ── Grid toggle ── */}
      <button
        onClick={toggleGrid}
        title="גריד (G)"
        style={btn(showGrid)}
        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/>
        </svg>
        רצפה
      </button>

      {sep}

      {/* ── Board-to-board snap (magnet) + gap input ── */}
      <button
        onClick={toggleBoardSnap}
        title="הצמד לקרשים סמוכים — מגנט בין קרשים"
        style={boardSnapEnabled ? { ...btn(true), background: '#f59e0b', borderColor: '#f59e0b', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' } : btn(false)}
        className={!boardSnapEnabled ? "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200" : ""}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
        מגנט
      </button>

      {/* Gap input — shown when board snap is active */}
      {boardSnapEnabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', padding: '4px 8px', borderRadius: 8, border: '1px solid #fde68a' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', whiteSpace: 'nowrap' }}>רווח:</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={boardSnapGap}
            onChange={e => setBoardSnapGap(parseFloat(e.target.value) || 0)}
            style={{
              width: 50, padding: '4px 6px', fontSize: 12, fontWeight: 700, borderRadius: 6,
              border: '1px solid #fbd38d', background: '#fff', color: '#b45309',
              outline: 'none', textAlign: 'center', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="מרחק בין קרשים בס״מ (0 = נוגעים)"
          />
        </div>
      )}

      {sep}

      {/* ── Duplicate ── */}
      <button
        onClick={() => hasSel && duplicateBoard(selectedBoardId!)}
        title={hasSel ? 'שכפל קרש (Ctrl+D)' : 'בחר קרש תחילה'}
        style={btn(false, !hasSel)}
        className="hover:bg-slate-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      </button>

      {/* ── Delete ── */}
      <button
        onClick={() => { if (hasSel) { removeBoard(selectedBoardId!); selectBoard(null); } }}
        title={hasSel ? 'מחק קרש (Del)' : 'בחר קרש תחילה'}
        style={{ ...btn(false, !hasSel), color: hasSel ? '#ef4444' : '#cbd5e1', borderColor: hasSel ? '#fecaca' : '#f1f5f9' }}
        className={hasSel ? "hover:bg-red-50 hover:border-red-200 shadow-sm" : ""}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>

      {sep}

      {/* ── Alignment group ── */}
      {[
        {
          title: 'הנח על הקרקע — Y=0',
          icon: <path d="M19 19H5v2h14v-2zM7 17l5-5 5 5-1.4 1.4L12 14.8l-3.6 3.6L7 17zm5-15L5 9h4v6h6V9h4L12 2z"/>,
          action: () => board && updateBoard(board.id, { y: 0 }),
          label: 'קרקע',
        },
        {
          title: 'ישר — אפס סיבובי X ו-Z',
          icon: <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V3h-2v2h-4v2h4v2z"/>,
          action: () => board && updateBoard(board.id, { rotationX: 0, rotationZ: 0 }),
          label: 'ישר',
        },
      ].map(({ title, icon, action, label }) => (
        <button
          key={label}
          onClick={() => hasSel && action()}
          title={hasSel ? title : 'בחר קרש תחילה'}
          style={btn(false, !hasSel)}
          className="hover:bg-slate-100"
        >
           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">{icon}</svg>
           {label}
        </button>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Viewport3D() {
  const threeStateRef = useRef<{ camera: THREE.Camera; gl: THREE.WebGLRenderer } | null>(null);
  const { addBoard, selectBoard, removeBoard, duplicateBoard, toggleSnap, toggleGrid } = useStore();

  // ── Global keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const st = useStore.getState();
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (st.selectedBoardId) removeBoard(st.selectedBoardId);
          break;
        case 'Escape':
          selectBoard(null);
          break;
        case 'd':
        case 'D':
          if ((e.ctrlKey || e.metaKey) && st.selectedBoardId) {
            e.preventDefault();
            duplicateBoard(st.selectedBoardId);
          }
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) toggleSnap();
          break;
        case 'g':
        case 'G':
          toggleGrid();
          break;
        case 'f':
        case 'F':
          // Future: frame selected
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [removeBoard, selectBoard, duplicateBoard, toggleSnap, toggleGrid]);

  // ── Drop from library (places board at cursor position on workplane) ──
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const boardTypeId = e.dataTransfer.getData('boardTypeId');
      if (!boardTypeId) return;
      const bt = getBoardById(boardTypeId);
      if (!bt) return;

      // Raycast cursor to workplane (y=0)
      let dropX = Math.round(Math.random() * 60);
      let dropZ = Math.round(Math.random() * 60);

      if (threeStateRef.current) {
        const { camera, gl } = threeStateRef.current;
        const rect = gl.domElement.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(nx, ny), camera);
        const workPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const pt = new THREE.Vector3();
        if (rc.ray.intersectPlane(workPlane, pt)) {
          dropX = Math.round(pt.x - bt.width / 2);
          dropZ = Math.round(pt.z - bt.defaultLength / 2);
        }
      }

      const newBoard: Omit<PlacedBoard, 'id'> = {
        boardTypeId: bt.id,
        boardType: bt,
        x: dropX,
        y: 0,
        z: dropZ,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        pivotX: 0,
        pivotY: 0,
        pivotZ: 0,
        length: bt.defaultLength,
      };
      const id = addBoard(newBoard);
      selectBoard(id);
    },
    [addBoard, selectBoard],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div
      className="w-full h-full relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ModeToolbar />

      <Canvas
        shadows
        gl={{ antialias: true }}
        style={{ background: 'linear-gradient(160deg, #e8ecf0 0%, #dde2e8 100%)' }}
      >
        <ThreeStateCapture stateRef={threeStateRef} />
        <PerspectiveCamera makeDefault position={[120, 100, 200]} fov={45} near={0.1} far={5000} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Keyboard hint strip */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 text-xs pointer-events-none"
        style={{ direction: 'rtl', color: '#6b7280' }}
      >
        {[['Del','מחק'],['Esc','בטל'],['Ctrl+D','שכפל'],['S','צמד'],['G','גריד']].map(([k,v]) => (
          <span key={k}>
            <kbd style={{ background:'rgba(255,255,255,0.75)', border:'1px solid #c0c8d0', padding:'1px 4px', borderRadius:3, fontSize:10, color:'#374151' }}>{k}</kbd>
            {' '}{v}
          </span>
        ))}
        <span style={{ color:'#9ca3af' }}>גלגלת=זום · ימני=פאן</span>
      </div>
    </div>
  );
}
