import { useCallback, useState } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import type { PlacedBoard } from '../../store';
import { useHandleDrag } from './useHandleDrag';
import { useSceneCtx } from './SceneContext';

interface Props {
  board: PlacedBoard;
  groupRef: React.RefObject<THREE.Group | null>;
}

// ─── Constants & Styles ───────────────────────────────────────────────────────

const ROT_SENS = 0.008; // rad per pixel of screen drag
const CUBE_SIZE = 2; // small resize handles like Tinkercad

// Floating dimension label input style
function DimInput({ val, onChange, label, disabled = false }: { val: number, onChange?: (v: number) => void, label?: string, disabled?: boolean }) {
  const [valStr, setValStr] = useState(val.toFixed(2));
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={`bg-white rounded shadow border border-slate-300 flex items-center overflow-hidden transition-all ${disabled ? 'opacity-90' : 'hover:shadow-md hover:border-blue-400'}`} style={{ pointerEvents: 'auto' }}>
      {label && <div className="bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-500 border-l border-slate-200">{label}</div>}
      <input
        type="number"
        value={isEditing ? valStr : val.toFixed(2)}
        onFocus={() => setIsEditing(true)}
        onChange={e => setValStr(e.target.value)}
        disabled={disabled}
        onBlur={() => {
          setIsEditing(false);
          if (onChange && !disabled) {
            const num = parseFloat(valStr);
            if (!isNaN(num) && num > 0) onChange(num);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur();
          e.stopPropagation();
        }}
        className={`w-14 px-1.5 py-1 text-xs font-mono text-slate-800 text-center focus:outline-none focus:bg-blue-50 ${disabled ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
        title={disabled ? "מידה קבועה לפרופיל זה" : "לחץ לעריכה"}
      />
    </div>
  );
}

// ─── Rotation Arc ─────────────────────────────────────────────────────────────

function RotArc({ radius, color, rotation, position = [0,0,0], onPointerDown }: {
  radius: number; color: string;
  rotation: [number, number, number];
  position?: [number, number, number];
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position} rotation={rotation} onPointerDown={onPointerDown} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor='ew-resize'; }} onPointerOut={() => { setHovered(false); document.body.style.cursor='auto'; }}>
      {/* Visual Arc */}
      <mesh>
        {/* Draw a half circle (Torusa) */}
        <torusGeometry args={[radius, hovered ? 1 : 0.6, 8, 48, Math.PI]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : color} roughness={0.3} toneMapped={false} />
      </mesh>
      {/* Invisible thicker hit zone */}
      <mesh>
        <torusGeometry args={[radius, 5, 8, 24, Math.PI]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Arrows at the ends of the arc */}
      <mesh position={[radius, 0, 0]} rotation={[Math.PI/2, Math.PI/2, 0]}>
        <coneGeometry args={[hovered ? 2.5 : 1.8, 5, 8]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : color} roughness={0.3} toneMapped={false} />
      </mesh>
      <mesh position={[-radius, 0, 0]} rotation={[Math.PI/2, -Math.PI/2, 0]}>
        <coneGeometry args={[hovered ? 2.5 : 1.8, 5, 8]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : color} roughness={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Resize Handle (Little Square) ────────────────────────────────────────────

function ResizeCube({ position, onPointerDown }: {
  position: [number, number, number];
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <mesh 
      position={position} 
      onPointerDown={onPointerDown}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'ns-resize'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial color={hovered ? "#ef4444" : "#1e293b"} roughness={0.4} />
      {/* White Outline for contrast */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(CUBE_SIZE+0.1, CUBE_SIZE+0.1, CUBE_SIZE+0.1)]} />
        <lineBasicMaterial color={hovered ? "#fca5a5" : "#ffffff"} linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

// ─── Elevation Cone (Y Translation) ───────────────────────────────────────────

function ElevateCone({ position, onPointerDown }: { position: [number, number, number]; onPointerDown: (e: ThreeEvent<PointerEvent>) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position} onPointerDown={onPointerDown} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor='ns-resize'; }} onPointerOut={() => { setHovered(false); document.body.style.cursor='auto'; }}>
      {/* Invisible hit testing cylinder */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[5, 5, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <coneGeometry args={[3, 6, 12]} />
        <meshStandardMaterial color={hovered ? "#3b82f6" : "#1e293b"} roughness={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Main Gizmo ───────────────────────────────────────────────────────────────

export default function SelectionGizmo({ board, groupRef }: Props) {
  const { updateBoard } = useStore();
  const { snapEnabled } = useSceneCtx();
  const { startDrag, startScreenDrag } = useHandleDrag();
  const { camera, gl } = useThree();

  const bt = board.boardType;
  const w  = bt.width;
  const h  = bt.height;
  const l  = board.length;
  const pX = board.pivotX ?? 0;
  const pY = board.pivotY ?? 0;
  const pZ = board.pivotZ ?? 0;

  // ── Height handler (Y translation) ───────────────────────────────────────────
  const handleHeightDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!groupRef.current) return;
    const bwc = groupRef.current.getWorldPosition(new THREE.Vector3());
    const cam = camera as THREE.PerspectiveCamera;
    const dist = camera.position.distanceTo(bwc);
    const uPerPx = (2 * dist * Math.tan((cam.fov * Math.PI) / 360)) / gl.domElement.clientHeight;
    const startY = board.y;
    let acc = 0;
    startScreenDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, (_dx, dy) => {
      acc -= dy * uPerPx;
      let ny = Math.max(0, startY + acc);
      if (snapEnabled) ny = Math.round(ny * 2) / 2;
      updateBoard(board.id, { y: ny });
    });
  }, [board.id, board.y, groupRef, camera, gl.domElement.clientHeight, startScreenDrag, updateBoard, snapEnabled]);

  // ── Length handlers (Z scaling) ──────────────────────────────────────────────
  const makeLengthHandler = useCallback((sign: 1 | -1) => (e: ThreeEvent<PointerEvent>) => {
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
  }, [board.id, board.length, board.z, groupRef, startDrag, updateBoard, snapEnabled]);

  const handleLengthPlusDown  = makeLengthHandler(1);
  const handleLengthMinusDown = makeLengthHandler(-1);

  // ── RotationHandlers ─────────────────────────────────────────────────────────

  const handleRotateYDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!groupRef.current) return;
    const group = groupRef.current;
    const startBwc = group.getWorldPosition(new THREE.Vector3());
    const pivotWorld = startBwc.clone().add(new THREE.Vector3(pX, pY, pZ).applyQuaternion(group.quaternion));
    const xzPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -pivotWorld.y);
    const startQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(board.rotationX, board.rotationY, board.rotationZ, 'XYZ'));
    let startA: number | null = null;
    startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, xzPlane, (pt) => {
      const a = Math.atan2(pt.z - pivotWorld.z, pt.x - pivotWorld.x);
      if (startA === null) { startA = a; return; }
      let delta = a - startA;
      if (snapEnabled) delta = Math.round(delta / (Math.PI / 12)) * (Math.PI / 12);
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), delta);
      const newBwc = pivotWorld.clone().add(startBwc.clone().sub(pivotWorld).applyQuaternion(deltaQ));
      const newQ = deltaQ.clone().multiply(startQ);
      const eu = new THREE.Euler().setFromQuaternion(newQ, 'XYZ');
      updateBoard(board.id, {
        x: newBwc.x - w / 2, y: Math.max(0, newBwc.y - h / 2), z: newBwc.z - l / 2,
        rotationX: eu.x, rotationY: eu.y, rotationZ: eu.z,
      });
    });
  }, [board, pX, pY, pZ, w, h, l, groupRef, startDrag, updateBoard, snapEnabled]);

  const makeWorldRotHandler = useCallback((worldAxis: THREE.Vector3, screenDelta: (dx: number, dy: number) => number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!groupRef.current) return;
    const group = groupRef.current;
    const startBwc = group.getWorldPosition(new THREE.Vector3());
    const pivotWorld = startBwc.clone().add(new THREE.Vector3(pX, pY, pZ).applyQuaternion(group.quaternion));
    const startQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(board.rotationX, board.rotationY, board.rotationZ, 'XYZ'));
    let acc = 0;
    startScreenDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, (dx, dy) => {
      acc += screenDelta(dx, dy) * ROT_SENS;
      const snapped = snapEnabled ? Math.round(acc / (Math.PI / 12)) * (Math.PI / 12) : acc;
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(worldAxis, snapped);
      const newBwc = pivotWorld.clone().add(startBwc.clone().sub(pivotWorld).applyQuaternion(deltaQ));
      const newQ = deltaQ.clone().multiply(startQ);
      const eu = new THREE.Euler().setFromQuaternion(newQ, 'XYZ');
      updateBoard(board.id, {
        x: newBwc.x - w / 2, y: Math.max(0, newBwc.y - h / 2), z: newBwc.z - l / 2,
        rotationX: eu.x, rotationY: eu.y, rotationZ: eu.z,
      });
    });
  }, [board, pX, pY, pZ, w, h, l, groupRef, startScreenDrag, updateBoard, snapEnabled]);

  const handleRotateRedDown = makeWorldRotHandler(new THREE.Vector3(0, 0, 1), (dx) => dx);
  const handleRotateCyanDown = makeWorldRotHandler(new THREE.Vector3(1, 0, 0), (_dx, dy) => dy);

  // ── Derived arc logic ─────────────────────────────────────────────────────────

  // Fixed radius for Tinkercad-style subtle arcs
  const ARC_RAD = 7;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <group onClick={(e) => e.stopPropagation()}>
      
      {/* Selection outline (light blue wires matching Tinkercad) */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w + 0.2, h + 0.2, l + 0.2)]} />
        <lineBasicMaterial color="#38bdf8" linewidth={2} toneMapped={false} />
      </lineSegments>

      {/* ── ELEVATION CONE ── (Top center) */}
      <ElevateCone position={[0, h / 2 + 10, 0]} onPointerDown={handleHeightDown} />
      
      {/* ── ROTATION ARCS (Small curved arrows hovering near faces) ── */}
      {/* Rotate Y (yaw) - horizontal arc on the floor, past the end of the board */}
      <RotArc radius={ARC_RAD} color="#64748b" rotation={[Math.PI / 2, 0, 0]} position={[0, -h/2 - 1, l/2 + 10]} onPointerDown={handleRotateYDown} />
      {/* Rotate X (pitch) - red arc on the side */}
      <RotArc radius={ARC_RAD} color="#ef4444" rotation={[0, Math.PI / 2, -Math.PI/2]} position={[-w/2 - 10, 0, 0]} onPointerDown={handleRotateRedDown} />
      {/* Rotate Z (roll) - cyan arc on the front face */}
      <RotArc radius={ARC_RAD} color="#06b6d4" rotation={[0, 0, Math.PI/2]} position={[0, 0, l / 2 + 10]} onPointerDown={handleRotateCyanDown} />

      {/* ── RESIZE HANDLES ── */}
      <ResizeCube position={[0, 0,  l / 2 + CUBE_SIZE/2]} onPointerDown={handleLengthPlusDown}  />
      <ResizeCube position={[0, 0, -l / 2 - CUBE_SIZE/2]} onPointerDown={handleLengthMinusDown} />

      {/* ── DIMENSION LABELS (HTML OVERLAYS) ── */}
      {/* Only show Length box, per user request */}
      <Html position={[0, 0, l / 2 + 8]} center zIndexRange={[100, 0]}>
         <DimInput val={l} onChange={(v) => updateBoard(board.id, { length: v })} label="אורך" />
      </Html>

      {/* Z Elevation label (only shown if levitating) */}
      {board.y > 0 && (
        <Html position={[0, h / 2 + 18, 0]} center zIndexRange={[100, 0]}>
          <DimInput val={board.y} onChange={(v) => updateBoard(board.id, { y: v })} label="גובה" />
        </Html>
      )}

    </group>
  );
}
