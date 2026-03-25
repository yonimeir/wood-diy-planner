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

// ─── Rotation Arc (Sleek, Flat Vector Style) ──────────────────────────────────

function RotArc({ radius, color, rotation, position = [0,0,0], onPointerDown }: {
  radius: number; color: string;
  rotation: [number, number, number];
  position?: [number, number, number];
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const [hovered, setHovered] = useState(false);
  
  // Arch length is 120 degrees
  const ARC_LEN = Math.PI / 1.5;
  // Offset rotation so the center of the arc points up
  const visualRot = new THREE.Euler(0, 0, (Math.PI - ARC_LEN) / 2);

  const matColor = hovered ? '#ef4444' : color;
  const thickness = hovered ? 0.25 : 0.15;
  const coneRad = hovered ? 1 : 0.7;
  const coneLen = hovered ? 2.5 : 2;

  return (
    <group position={position} rotation={rotation} onPointerDown={onPointerDown} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor='ew-resize'; }} onPointerOut={() => { setHovered(false); document.body.style.cursor='auto'; }}>
      
      {/* Invisible thicker hit zone */}
      <mesh rotation={visualRot}>
        <torusGeometry args={[radius, 4, 8, 24, ARC_LEN]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Visual Arc - Thin and flat */}
      <mesh rotation={visualRot}>
        <torusGeometry args={[radius, thickness, 8, 48, ARC_LEN]} />
        <meshBasicMaterial color={matColor} toneMapped={false} depthTest={false} />
      </mesh>

      <group rotation={visualRot}>
        {/* Right Arrowhead */}
        <mesh position={[radius * Math.cos(ARC_LEN), radius * Math.sin(ARC_LEN), 0]} rotation={[0, 0, ARC_LEN + Math.PI/2]}>
          <coneGeometry args={[coneRad, coneLen, 8]} />
          <meshBasicMaterial color={matColor} toneMapped={false} depthTest={false} />
        </mesh>
        
        {/* Left Arrowhead */}
        <mesh position={[radius, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
          <coneGeometry args={[coneRad, coneLen, 8]} />
          <meshBasicMaterial color={matColor} toneMapped={false} depthTest={false} />
        </mesh>
      </group>
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

// ─── Elevation Cone (Y Translation, Flat 2D Style) ────────────────────────────

function ElevateCone({ position, onPointerDown }: { position: [number, number, number]; onPointerDown: (e: ThreeEvent<PointerEvent>) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position} onPointerDown={onPointerDown} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor='ns-resize'; }} onPointerOut={() => { setHovered(false); document.body.style.cursor='auto'; }}>
      {/* Invisible hit testing cylinder */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[5, 5, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Visual flat upward triangle */}
      <mesh>
        <circleGeometry args={[2.5, 3]} />
        <meshBasicMaterial color={hovered ? "#3b82f6" : "#1e293b"} toneMapped={false} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Main Gizmo ───────────────────────────────────────────────────────────────

export default function SelectionGizmo({ board, groupRef }: Props) {
  const { updateBoard, saveHistory } = useStore();
  const { snapEnabled } = useSceneCtx();
  const { startDrag, startScreenDrag } = useHandleDrag();
  const { camera, gl } = useThree();

  const bt = board.boardType;
  const w  = bt.width;
  const h  = bt.height;
  const l  = board.length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleHeightDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    saveHistory();
    if (!groupRef.current) return;
    const bwc = groupRef.current.getWorldPosition(new THREE.Vector3());
    const dist = camera.position.distanceTo(bwc);
    const cam = camera as THREE.PerspectiveCamera;
    const uPerPx = (2 * dist * Math.tan((cam.fov * Math.PI) / 360)) / gl.domElement.clientHeight;
    const startY = board.y;
    let acc = 0;
    startScreenDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, (_dx, dy) => {
      acc -= dy * uPerPx;
      let ny = Math.max(0, startY + acc);
      if (snapEnabled) ny = Math.round(ny * 2) / 2;
      updateBoard(board.id, { y: ny }, false);
    });
  }, [board.id, board.y, groupRef, camera, gl.domElement.clientHeight, startScreenDrag, updateBoard, saveHistory, snapEnabled]);

  // ── Length handlers (Z scaling) ──────────────────────────────────────────────
  const makeLengthHandler = useCallback((sign: 1 | -1) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    saveHistory();
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
      updateBoard(board.id, changes, false);
    });
  }, [board.id, board.length, board.z, groupRef, startDrag, updateBoard, saveHistory, snapEnabled]);

  const handleLengthPlusDown  = makeLengthHandler(1);
  const handleLengthMinusDown = makeLengthHandler(-1);

  // ── RotationHandlers ─────────────────────────────────────────────────────────

  const makeLocalRotHandler = useCallback((axis: THREE.Vector3, getDelta: (dx: number, dy: number) => number) => {
    return (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      saveHistory(); // save state before rotating
      
      startScreenDrag(e.nativeEvent.clientX, e.nativeEvent.clientY, (dx, dy) => {
        const rotDelta = getDelta(dx, dy) * ROT_SENS;
        // Rotate the group locally on the specified axis
        groupRef.current!.rotateOnAxis(axis, rotDelta);
        // Extract eulers
        updateBoard(board.id, {
          rotationX: groupRef.current!.rotation.x,
          rotationY: groupRef.current!.rotation.y,
          rotationZ: groupRef.current!.rotation.z,
        }, false);
      });
    };
  }, [board.id, groupRef, saveHistory, startScreenDrag, updateBoard]);

  // Y axis rotation handler (Yaw) corresponds to the grey floor arc
  const handleRotateYDown = makeLocalRotHandler(new THREE.Vector3(0, 1, 0), (dx) => dx);
  // X axis rotation handler (Pitch) corresponds to the Red arc
  const handleRotateRedDown = makeLocalRotHandler(new THREE.Vector3(1, 0, 0), (_dx, dy) => dy);
  // Z axis rotation handler (Roll) corresponds to the Cyan arc
  const handleRotateCyanDown = makeLocalRotHandler(new THREE.Vector3(0, 0, 1), (dx, _dy) => dx);

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
      {/* Rotate Y (yaw) - horizontal arc on the floor under the center of the board */}
      <RotArc radius={ARC_RAD} color="#64748b" rotation={[Math.PI / 2, 0, 0]} position={[0, -h/2 - 1, 0]} onPointerDown={handleRotateYDown} />
      {/* Rotate X (pitch) - red arc hugging the side */}
      <RotArc radius={ARC_RAD} color="#ef4444" rotation={[0, Math.PI / 2, -Math.PI/2]} position={[-w/2 - 2, 0, 0]} onPointerDown={handleRotateRedDown} />
      {/* Rotate Z (roll) - cyan arc hugging the front face */}
      <RotArc radius={ARC_RAD} color="#06b6d4" rotation={[0, 0, Math.PI/2]} position={[0, 0, l / 2 + 2]} onPointerDown={handleRotateCyanDown} />

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
