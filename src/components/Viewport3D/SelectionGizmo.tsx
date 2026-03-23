/**
 * Tinkercad-like selection gizmo – 3 separate modes to avoid clutter:
 *   move   → Red ±X, Green +Y, Blue ±Z translation arrows
 *   rotate → Yellow Y-arc (XZ plane), Red X-arc (YZ plane), Cyan Z-arc (XY plane)
 *   resize → Orange cubes at the ±Z ends (change board length)
 *
 * Click any displayed value to type an exact number.
 */
import { useCallback, useState } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import type { PlacedBoard } from '../../store';
import { useHandleDrag } from './useHandleDrag';
import { useSceneCtx } from './SceneContext';
import { snapBoardPosition } from '../../utils/boardSnap';

interface Props {
  board: PlacedBoard;
  groupRef: React.RefObject<THREE.Group>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROT_SENS  = 0.008; // rad per pixel of screen drag
const ARROW_LEN = 9;
const HEAD_R    = 2.2;
const HEAD_L    = 5;
const SHAFT_R   = 0.6;
const ARROW_GAP = 5;
const CUBE_GAP  = 2;
const CUBE_SIZE = 5;

type GizmoMode = 'move' | 'rotate' | 'resize';

const MODE_LABELS: Record<GizmoMode, string> = { move: 'הזזה', rotate: 'סיבוב', resize: 'אורך' };

const INPUT_STYLE: React.CSSProperties = {
  width: 62,
  background: '#0d2540',
  color: '#e0f7fa',
  border: '1px solid #42a5f5',
  borderRadius: 4,
  padding: '1px 5px',
  fontSize: 12,
  fontFamily: 'monospace',
  outline: 'none',
};

// ─── Arrow ────────────────────────────────────────────────────────────────────

function Arrow({ length = ARROW_LEN, color, rotation, position, onPointerDown }: {
  length?: number; color: string;
  rotation: [number, number, number]; position: [number, number, number];
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const total = length + HEAD_L;
  return (
    <group position={position} rotation={rotation}>
      {/* Hit area offset forward so it doesn't extend into the board */}
      <mesh position={[0, total / 2, 0]} onPointerDown={onPointerDown}>
        <cylinderGeometry args={[HEAD_R + 1, HEAD_R + 1, total, 8]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[SHAFT_R, SHAFT_R, length, 8]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, length + HEAD_L / 2, 0]}>
        <coneGeometry args={[HEAD_R, HEAD_L, 8]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </group>
  );
}

// ─── Rotation arc ─────────────────────────────────────────────────────────────

function RotArc({ radius, color, rotation, onPointerDown }: {
  radius: number; color: string;
  rotation: [number, number, number];
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  return (
    <group onPointerDown={onPointerDown}>
      <mesh rotation={rotation}>
        <torusGeometry args={[radius, 0.8, 8, 48, Math.PI * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Larger invisible hit zone */}
      <mesh rotation={rotation}>
        <torusGeometry args={[radius, 4, 4, 48, Math.PI * 1.5]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Resize cube ──────────────────────────────────────────────────────────────

function ResizeCube({ position, color, onPointerDown }: {
  position: [number, number, number]; color: string;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  return (
    <mesh position={position} onPointerDown={onPointerDown}>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
  );
}

// ─── Main gizmo ───────────────────────────────────────────────────────────────

export default function SelectionGizmo({ board, groupRef }: Props) {
  const { updateBoard, setSnapGuides, clearSnapGuides } = useStore();
  const { snapEnabled } = useSceneCtx();
  const boardSnapEnabled = useStore(s => s.boardSnapEnabled);
  const boardSnapGap     = useStore(s => s.boardSnapGap);
  const { startDrag, startScreenDrag } = useHandleDrag();
  const { camera, gl } = useThree();

  const [mode, setMode]         = useState<GizmoMode>('move');
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const bt = board.boardType;
  const w  = bt.width;
  const h  = bt.height;
  const l  = board.length;
  // Defensive defaults — guard against HMR state drift where pivot fields may be undefined
  const pX = board.pivotX ?? 0;
  const pY = board.pivotY ?? 0;
  const pZ = board.pivotZ ?? 0;

  // ── Edit helpers ────────────────────────────────────────────────────────────

  const startEdit = (field: string, rawVal: number, isAngle = false) => {
    setEditField(field);
    setEditValue(isAngle
      ? String(Math.round(((rawVal * 180) / Math.PI + 360) % 360))
      : String(Math.round(rawVal * 10) / 10),
    );
  };

  const commitEdit = useCallback(() => {
    const n = parseFloat(editValue);
    if (!isNaN(n) && editField) {
      const rad = (deg: number) => (deg * Math.PI) / 180;
      const map: Partial<Record<string, Partial<PlacedBoard>>> = {
        x:       { x: n },
        y:       { y: Math.max(0, n) },
        z:       { z: n },
        length:  { length: Math.max(1, n) },
        rotX:    { rotationX: rad(n) },
        rotY:    { rotationY: rad(n) },
        rotZ:    { rotationZ: rad(n) },
      };
      if (map[editField]) updateBoard(board.id, map[editField]!);
    }
    setEditField(null);
  }, [editField, editValue, board.id, updateBoard]);

  // ── Translate handlers ──────────────────────────────────────────────────────

  const makeTranslateHandler = useCallback(
    (localAxis: THREE.Vector3) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!groupRef.current) return;
      const group    = groupRef.current;
      const bwc      = group.getWorldPosition(new THREE.Vector3());
      const wAxis    = localAxis.clone().applyQuaternion(group.quaternion);
      const xzPlane  = new THREE.Plane(new THREE.Vector3(0, 1, 0), -bwc.y);
      const startX   = board.x; const startZ = board.z;
      startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, xzPlane, (_, delta) => {
        const along = delta.dot(wAxis);
        let nx = startX + wAxis.x * along;
        let nz = startZ + wAxis.z * along;
        if (snapEnabled) { nx = Math.round(nx); nz = Math.round(nz); }
        if (boardSnapEnabled) {
          const allBoards = useStore.getState().boards;
          const snapped = snapBoardPosition(board, nx, nz, allBoards, boardSnapGap);
          nx = snapped.x; nz = snapped.z;
          setSnapGuides({ x: snapped.guideX, z: snapped.guideZ });
        }
        updateBoard(board.id, { x: nx, z: nz });
      }, clearSnapGuides);
    },
    [board, groupRef, startDrag, updateBoard, snapEnabled, boardSnapEnabled, boardSnapGap, setSnapGuides, clearSnapGuides],
  );

  const handleMoveXDown = makeTranslateHandler(new THREE.Vector3(1, 0, 0));
  const handleMoveZDown = makeTranslateHandler(new THREE.Vector3(0, 0, 1));

  // ── Height handler ──────────────────────────────────────────────────────────

  const handleHeightDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!groupRef.current) return;
      const bwc      = groupRef.current.getWorldPosition(new THREE.Vector3());
      const cam      = camera as THREE.PerspectiveCamera;
      const dist     = camera.position.distanceTo(bwc);
      const uPerPx   = (2 * dist * Math.tan((cam.fov * Math.PI) / 360)) / gl.domElement.clientHeight;
      const startY   = board.y;
      let acc = 0;
      startScreenDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, (_dx, dy) => {
        acc -= dy * uPerPx;
        let ny = Math.max(0, startY + acc);
        if (snapEnabled) ny = Math.round(ny * 2) / 2;
        updateBoard(board.id, { y: ny });
      });
    },
    [board, groupRef, camera, gl, startScreenDrag, updateBoard, snapEnabled],
  );

  // ── Length resize handlers ──────────────────────────────────────────────────

  const makeLengthHandler = useCallback(
    (sign: 1 | -1) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!groupRef.current) return;
      const group   = groupRef.current;
      const bwc     = group.getWorldPosition(new THREE.Vector3());
      const localZ  = new THREE.Vector3(0, 0, 1).applyQuaternion(group.quaternion);
      const xzPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -bwc.y);
      const startL  = board.length; const startZ = board.z;
      startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, xzPlane, (_, delta) => {
        const along = delta.dot(localZ) * sign;
        let nl = Math.max(1, startL + along);
        if (snapEnabled) nl = Math.round(nl);
        const changes: Partial<PlacedBoard> = sign === 1
          ? { length: nl }
          : { length: nl, z: startZ - (nl - startL) };
        updateBoard(board.id, changes);
      });
    },
    [board, groupRef, startDrag, updateBoard, snapEnabled],
  );

  const handleLengthPlusDown  = makeLengthHandler(1);
  const handleLengthMinusDown = makeLengthHandler(-1);

  // ── Rotation handlers ───────────────────────────────────────────────────────

  // Y — arc-following (atan2 on XZ plane through pivot) — pivot-aware
  const handleRotateYDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!groupRef.current) return;
      const group = groupRef.current;

      const startBwc = group.getWorldPosition(new THREE.Vector3());
      const pivotWorld = startBwc.clone().add(
        new THREE.Vector3(pX, pY, pZ).applyQuaternion(group.quaternion),
      );

      const xzPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -pivotWorld.y);
      const startQ = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(board.rotationX, board.rotationY, board.rotationZ, 'XYZ'),
      );
      let startA: number | null = null;

      startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, xzPlane, (pt) => {
        const a = Math.atan2(pt.z - pivotWorld.z, pt.x - pivotWorld.x);
        if (startA === null) { startA = a; return; }

        let delta = a - startA;
        if (snapEnabled) delta = Math.round(delta / (Math.PI / 12)) * (Math.PI / 12);

        const deltaQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), delta);
        const newBwc = pivotWorld.clone().add(
          startBwc.clone().sub(pivotWorld).applyQuaternion(deltaQ),
        );
        const newQ = deltaQ.clone().multiply(startQ);
        const eu = new THREE.Euler().setFromQuaternion(newQ, 'XYZ');

        updateBoard(board.id, {
          x: newBwc.x - w / 2,
          y: Math.max(0, newBwc.y - h / 2),
          z: newBwc.z - l / 2,
          rotationX: eu.x,
          rotationY: eu.y,
          rotationZ: eu.z,
        });
      });
    },
    [board, w, h, l, groupRef, startDrag, updateBoard, snapEnabled],
  );

  // ── Shared: rotate around a WORLD-SPACE axis, respecting the pivot point ─────
  // Uses quaternion math to avoid Euler-order artifacts (e.g. after rotationY≠0,
  // plain Euler += on Z rotates around local-Z which is world-X).
  // Also rotates the board's POSITION around the pivot so the pivot stays fixed.
  const makeWorldRotHandler = useCallback(
    (worldAxis: THREE.Vector3, screenDelta: (dx: number, dy: number) => number) =>
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!groupRef.current) return;
      const group = groupRef.current;

      // Board world center at drag start
      const startBwc = group.getWorldPosition(new THREE.Vector3());

      // Pivot in world space = board center + local pivot rotated into world
      const pivotWorld = startBwc.clone().add(
        new THREE.Vector3(pX, pY, pZ).applyQuaternion(group.quaternion),
      );

      const startQ = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(board.rotationX, board.rotationY, board.rotationZ, 'XYZ'),
      );
      let acc = 0;

      startScreenDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, (dx, dy) => {
        acc += screenDelta(dx, dy) * ROT_SENS;
        const snapped = snapEnabled
          ? Math.round(acc / (Math.PI / 12)) * (Math.PI / 12)
          : acc;

        const deltaQ = new THREE.Quaternion().setFromAxisAngle(worldAxis, snapped);

        // New board center = rotate (startBwc − pivot) around pivot
        const newBwc = pivotWorld.clone().add(
          startBwc.clone().sub(pivotWorld).applyQuaternion(deltaQ),
        );

        const newQ = deltaQ.clone().multiply(startQ);
        const eu = new THREE.Euler().setFromQuaternion(newQ, 'XYZ');

        updateBoard(board.id, {
          x: newBwc.x - w / 2,
          y: Math.max(0, newBwc.y - h / 2),
          z: newBwc.z - l / 2,
          rotationX: eu.x,
          rotationY: eu.y,
          rotationZ: eu.z,
        });
      });
    },
    [board, w, h, l, groupRef, startScreenDrag, updateBoard, snapEnabled],
  );

  // Red arc (in YZ plane → visually wraps around board's length) = Z rotation (roll)
  // Drag screen-X to roll the board clockwise / counter-clockwise
  const handleRotateRedDown = makeWorldRotHandler(new THREE.Vector3(0, 0, 1), (dx) => dx);

  // Cyan arc (in XY plane at board end → visually wraps around end face) = X rotation (tip)
  // Drag screen-Y to tip the board forward / backward
  const handleRotateCyanDown = makeWorldRotHandler(new THREE.Vector3(1, 0, 0), (_dx, dy) => dy);

  // ── Derived geometry ────────────────────────────────────────────────────────

  const arcRadY     = Math.max(w, l) * 0.5 + 14;
  const arcRadX     = Math.max(h, l) * 0.5 + 14;
  const arcRadZ     = Math.max(w, h) * 0.5 + 12;
  const tipX        = arcRadY * Math.cos(-Math.PI / 2);
  const tipZ        = arcRadY * Math.sin(-Math.PI / 2);
  const cubeExtent  = CUBE_GAP + CUBE_SIZE / 2;
  const zArrowBase  = cubeExtent + ARROW_GAP;

  const toDeg = (rad: number) => Math.round(((rad * 180) / Math.PI + 360) % 360);

  // ── Inline edit input ───────────────────────────────────────────────────────

  const EditInput = (
    <input
      autoFocus
      type="number"
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') commitEdit();
        if (e.key === 'Escape') setEditField(null);
        e.stopPropagation();
      }}
      onBlur={commitEdit}
      style={INPUT_STYLE}
    />
  );

  const EditableSpan = (field: string, display: string, rawVal: number, color: string, isAngle = false) =>
    editField === field
      ? EditInput
      : (
        <span
          title="לחץ לעריכה ידנית"
          style={{ color, cursor: 'pointer', borderBottom: '1px dotted rgba(255,255,255,0.35)', paddingBottom: 1 }}
          onClick={() => startEdit(field, rawVal, isAngle)}
        >
          {display}
        </span>
      );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <group onClick={(e) => e.stopPropagation()}>

      {/* Bounding-box wireframe – always shown */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, l)]} />
        <lineBasicMaterial color="#29b6f6" linewidth={1.5} />
      </lineSegments>

      {/* ── MOVE ── */}
      {mode === 'move' && <>
        <Arrow color="#ef5350" rotation={[0, 0, -Math.PI / 2]} position={[ w / 2 + ARROW_GAP, 0, 0]} onPointerDown={handleMoveXDown} />
        <Arrow color="#ef5350" rotation={[0, 0,  Math.PI / 2]} position={[-w / 2 - ARROW_GAP, 0, 0]} onPointerDown={handleMoveXDown} />
        <Arrow color="#43a047" rotation={[0, 0, 0]}            position={[0, h / 2 + ARROW_GAP, 0]}   onPointerDown={handleHeightDown} />
        <Arrow color="#1e88e5" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0,  l / 2 + zArrowBase]} onPointerDown={handleMoveZDown} />
        <Arrow color="#1e88e5" rotation={[ Math.PI / 2, 0, 0]} position={[0, 0, -l / 2 - zArrowBase]} onPointerDown={handleMoveZDown} />
      </>}

      {/* ── ROTATE ── */}
      {mode === 'rotate' && <>
        {/* Yellow Y-arc: torus in XZ plane → rotation [π/2, 0, 0] */}
        <group position={[0, h / 2 + 3, 0]} onPointerDown={handleRotateYDown}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[arcRadY, 0.8, 8, 48, Math.PI * 1.5]} />
            <meshStandardMaterial color="#ffd600" roughness={0.3} />
          </mesh>
          <mesh position={[tipX, 0, tipZ]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <coneGeometry args={[2.5, 5, 8]} />
            <meshStandardMaterial color="#ffd600" roughness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[arcRadY, 4, 4, 48, Math.PI * 1.5]} />
            <meshStandardMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>

        {/* Red arc: in YZ plane — visually wraps around board length → Z roll */}
        <RotArc radius={arcRadX} color="#ef5350" rotation={[0, Math.PI / 2, 0]} onPointerDown={handleRotateRedDown} />

        {/* Cyan arc: in XY plane at board end — visually wraps end face → X tip */}
        <group position={[0, 0, l / 2 + 4]}>
          <RotArc radius={arcRadZ} color="#26c6da" rotation={[0, 0, 0]} onPointerDown={handleRotateCyanDown} />
        </group>

        {/* Pivot indicator: orange sphere in LOCAL board space */}
        <mesh position={[pX, pY, pZ]}>
          <sphereGeometry args={[2.2, 10, 10]} />
          <meshBasicMaterial color="#ff6f00" depthTest={false} />
        </mesh>
      </>}

      {/* ── RESIZE ── */}
      {mode === 'resize' && <>
        <ResizeCube position={[0, 0,  l / 2 + CUBE_GAP]} color="#ff7043" onPointerDown={handleLengthPlusDown}  />
        <ResizeCube position={[0, 0, -l / 2 - CUBE_GAP]} color="#ff7043" onPointerDown={handleLengthMinusDown} />
      </>}

      {/* ── HTML label / controls ── */}
      <Html position={[0, -h / 2 - 10, 0]} center>
        <div
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'rgba(10,30,60,0.96)',
            color: '#e0f7fa',
            borderRadius: 8,
            fontFamily: 'monospace',
            boxShadow: '0 3px 14px rgba(0,0,0,0.55)',
            direction: 'rtl',
            minWidth: 170,
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {(['move', 'rotate', 'resize'] as GizmoMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setEditField(null); }}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer',
                  padding: '5px 0', fontSize: 11, fontWeight: 700,
                  background: mode === m ? '#1565c0' : 'transparent',
                  color: mode === m ? '#fff' : '#90caf9',
                  borderBottom: mode === m ? '2px solid #42a5f5' : '2px solid transparent',
                }}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Values panel */}
          <div style={{ padding: '8px 12px', fontSize: 12 }}>

            {/* MOVE: X Y Z position */}
            {mode === 'move' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {([
                    { field: 'x', label: 'X', val: board.x,  color: '#ef9a9a' },
                    { field: 'y', label: 'Y', val: board.y,  color: '#a5d6a7' },
                    { field: 'z', label: 'Z', val: board.z,  color: '#90caf9' },
                  ] as const).map(({ field, label, val, color }) => (
                    <tr key={field}>
                      <td style={{ color, width: 16, paddingBottom: 4, fontWeight: 700 }}>{label}</td>
                      <td style={{ paddingBottom: 4 }}>
                        {EditableSpan(field, val.toFixed(1), val, color)}
                      </td>
                      <td style={{ color: '#546e7a', paddingBottom: 4, paddingRight: 2 }}>ס"מ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ROTATE: X Y Z angles + pivot grid */}
            {mode === 'rotate' && (<>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <tbody>
                  {([
                    { field: 'rotX', label: 'X', val: board.rotationX, color: '#80deea' },
                    { field: 'rotY', label: 'Y', val: board.rotationY, color: '#fff59d' },
                    { field: 'rotZ', label: 'Z', val: board.rotationZ, color: '#ef9a9a' },
                  ] as const).map(({ field, label, val, color }) => (
                    <tr key={field}>
                      <td style={{ color, width: 16, paddingBottom: 4, fontWeight: 700 }}>{label}</td>
                      <td style={{ paddingBottom: 4 }}>
                        {EditableSpan(field, `${toDeg(val)}`, val, color, true)}
                      </td>
                      <td style={{ color: '#546e7a', paddingBottom: 4, paddingRight: 2 }}>°</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pivot selector (like Illustrator's 3×3 bounding-box grid) */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 7 }}>
                <div style={{ color: '#78909c', fontSize: 10, marginBottom: 5, textAlign: 'center' }}>
                  נקודת ציר לסיבוב
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 3,
                  width: 72,
                  margin: '0 auto',
                }}>
                  {([ // [zFrac, xFrac] — z = length, x = width
                    [-1, -1], [0, -1], [1, -1],
                    [-1,  0], [0,  0], [1,  0],
                    [-1,  1], [0,  1], [1,  1],
                  ] as [number, number][]).map(([zFrac, xFrac], i) => {
                    const tx = xFrac * w / 2;
                    const tz = zFrac * l / 2;
                    const active = Math.abs(pX - tx) < 0.5 && Math.abs(pZ - tz) < 0.5;
                    return (
                      <button
                        key={i}
                        title={`ציר: Z=${tz.toFixed(0)} X=${tx.toFixed(0)} ס"מ`}
                        onClick={() => updateBoard(board.id, { pivotX: tx, pivotY: 0, pivotZ: tz })}
                        style={{
                          width: 22, height: 22,
                          border: `1px solid ${active ? '#42a5f5' : 'rgba(255,255,255,0.15)'}`,
                          borderRadius: 3,
                          background: active ? '#1565c0' : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        <div style={{
                          width: active ? 7 : 5,
                          height: active ? 7 : 5,
                          borderRadius: '50%',
                          background: active ? '#fff' : '#546e7a',
                        }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>)}

            {/* RESIZE: fixed cross-section + editable length */}
            {mode === 'resize' && (
              <div>
                <div style={{ color: '#78909c', marginBottom: 6, fontSize: 11 }}>
                  חתך קבוע: {w} × {h} ס"מ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#90caf9', fontWeight: 700 }}>אורך</span>
                  {EditableSpan('length', String(l), l, '#7dd3fc')}
                  <span style={{ color: '#546e7a' }}>ס"מ</span>
                </div>
              </div>
            )}

          </div>

          {/* Hint */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '3px 12px 4px', fontSize: 10, color: '#455a64', textAlign: 'center' }}>
            לחץ על ערך לעריכה מדויקת
          </div>
        </div>
      </Html>
    </group>
  );
}
