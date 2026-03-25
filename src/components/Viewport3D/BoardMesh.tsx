/**
 * Renders a single board as a 3D box.
 *
 * Interactions:
 *  - First click → select the board
 *  - Drag on already-selected board body → move on XZ workplane (like Tinkercad)
 *  - Shows SelectionGizmo handles when selected
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import type { PlacedBoard } from '../../store';
import { useHandleDrag } from './useHandleDrag';
import { useSceneCtx } from './SceneContext';
import SelectionGizmo from './SelectionGizmo';
import { snapBoardPosition } from '../../utils/boardSnap';

interface BoardMeshProps {
  board: PlacedBoard;
  onRegisterRef: (id: string, group: THREE.Group | null) => void;
}

export default function BoardMesh({ board, onRegisterRef }: BoardMeshProps) {
  const { selectBoard, selectedBoardId, updateBoard, setSnapGuides, clearSnapGuides } = useStore();
  const { snapEnabled } = useSceneCtx();
  const boardSnapEnabled = useStore(s => s.boardSnapEnabled);
  const boardSnapGap     = useStore(s => s.boardSnapGap);
  const { startDrag } = useHandleDrag();

  const groupRef  = useRef<THREE.Group>(null!);
  const isDragRef = useRef(false);
  const isSelected = selectedBoardId === board.id;
  const [hovered, setHovered] = useState(false);

  const { boardType: bt, x, y, z, rotationX, rotationY, rotationZ, length: l } = board;
  const w = bt.width;
  const h = bt.height;

  // Register this group with Scene so TransformControls (or other tools) can reference it
  useEffect(() => {
    onRegisterRef(board.id, groupRef.current);
    return () => onRegisterRef(board.id, null);
  }, [board.id, onRegisterRef]);

  // Sync position/rotation from store — skipped while dragging to avoid fighting Three.js
  useEffect(() => {
    if (!groupRef.current || isDragRef.current) return;
    groupRef.current.position.set(x + w / 2, y + h / 2, z + l / 2);
    groupRef.current.rotation.set(rotationX, rotationY, rotationZ);
  }, [x, y, z, rotationX, rotationY, rotationZ, w, h, l]);

  // ── Click to select ───────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation(); // prevent floor's onClick from deselecting
      selectBoard(board.id);
    },
    [board.id, selectBoard],
  );

  // ── Body drag (workplane XZ) ──────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();

      if (!isSelected) return; // onClick handles selection

      // Already selected → start XZ workplane drag
      isDragRef.current = true;
      document.body.style.cursor = 'grabbing';

      const workPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(y + h / 2));
      const startX = x;
      const startZ = z;

      startDrag(
        e.nativeEvent.clientX,
        e.nativeEvent.clientY,
        workPlane,
        // onMove — directly mutate Three.js group (no React re-render per frame)
        (_pt, delta) => {
          let newX = startX + delta.x;
          let newZ = startZ + delta.z;
          // 1. Grid snap
          if (snapEnabled) { newX = Math.round(newX); newZ = Math.round(newZ); }
          // 2. Board-to-board face + alignment snap
          if (boardSnapEnabled) {
            const allBoards = useStore.getState().boards;
            const snapped = snapBoardPosition(board, newX, newZ, allBoards, boardSnapGap);
            newX = snapped.x; newZ = snapped.z;
            setSnapGuides({ x: snapped.guideX, z: snapped.guideZ });
          }
          if (groupRef.current) {
            groupRef.current.position.x = newX + w / 2;
            groupRef.current.position.z = newZ + l / 2;
          }
          // Store pending values without triggering re-render
          ;(groupRef as any)._pendingXZ = { x: newX, z: newZ };
        },
        // onEnd — commit to store once and clear guide lines
        () => {
          isDragRef.current = false;
          document.body.style.cursor = 'auto';
          clearSnapGuides();
          const pending = (groupRef as any)._pendingXZ;
          if (pending) {
            updateBoard(board.id, pending);
            ;(groupRef as any)._pendingXZ = null;
          }
        },
      );
    },
    [isSelected, board.id, board, x, y, z, w, h, l, selectBoard, startDrag, updateBoard, snapEnabled, boardSnapEnabled, boardSnapGap, setSnapGuides, clearSnapGuides],
  );

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = isSelected ? 'grab' : 'pointer';
  }, [isSelected]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  const color = isSelected
    ? '#4fc3f7'
    : hovered
      ? '#ffe082'
      : bt.color;

  return (
    <group
      ref={groupRef}
      position={[x + w / 2, y + h / 2, z + l / 2]}
      rotation={[rotationX, rotationY, rotationZ]}
    >
      {/* Board body */}
      <mesh
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, l]} />
        <meshStandardMaterial
          color={color}
          roughness={0.82}
          metalness={0.0}
          transparent={isSelected}
          opacity={isSelected ? 0.85 : 1}
        />
      </mesh>

      {/* Grain lines (thin dark horizontal lines to suggest wood texture) */}
      {!isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, l)]} />
          <lineBasicMaterial color={bt.color} transparent opacity={0.25} />
        </lineSegments>
      )}

      {/* Engraved/Painted label directly on the board face */}
      <Text
        position={[w / 2 + 0.01, 0, 0]} // Long side face (Positive X)
        rotation={[0, Math.PI / 2, 0]} // Face outward along X
        fontSize={Math.min(l * 0.1, h * 0.7, 3.5)} // Scale with length and height
        color={isSelected ? "#ffffff" : "rgba(255,255,255,0.6)"}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        anchorX="center"
        anchorY="middle"
        outlineWidth={isSelected ? 0.04 : 0}
        outlineColor="rgba(0,0,0,0.4)"
        renderOrder={1}
      >
        {`${w}x${h}`}
      </Text>

      {isSelected && <SelectionGizmo board={board} groupRef={groupRef} />}
    </group>
  );
}
// Sync position/rotation from store — skipped while dragging to avoid fighting Three.js
