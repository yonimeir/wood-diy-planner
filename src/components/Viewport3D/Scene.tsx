import { useRef, useCallback, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Grid, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { SceneContext } from './SceneContext';
import BoardMesh from './BoardMesh';
import SnapGuideLines from './SnapGuideLines';

export default function Scene() {
  const { boards, selectBoard, showGrid, snapEnabled } = useStore();
  const orbitRef = useRef<any>(null);
  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());

  const [, forceUpdate] = useState(0);

  // SceneContext callbacks
  const disableOrbit = useCallback(() => {
    if (orbitRef.current) orbitRef.current.enabled = false;
  }, []);
  const enableOrbit = useCallback(() => {
    if (orbitRef.current) orbitRef.current.enabled = true;
  }, []);

  const registerRef = useCallback((id: string, group: THREE.Group | null) => {
    if (group) groupRefs.current.set(id, group);
    else groupRefs.current.delete(id);
    forceUpdate(n => n + 1);
  }, []);

  const handleFloorClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectBoard(null);
  }, [selectBoard]);

  return (
    <SceneContext.Provider value={{ disableOrbit, enableOrbit, snapEnabled }}>
      {/* Lighting — bright neutral, suitable for light background */}
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight
        position={[150, 280, 120]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={700}
        shadow-camera-left={-350}
        shadow-camera-right={350}
        shadow-camera-top={350}
        shadow-camera-bottom={-350}
        shadow-bias={-0.0005}
      />
      {/* Soft fill from below */}
      <directionalLight position={[-80, 60, -100]} intensity={0.35} color="#dce8f0" />

      {/* OrbitControls — disabled during handle/body drags */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        minDistance={10}
        maxDistance={1500}
        maxPolarAngle={Math.PI / 2 - 0.005}
        enableDamping
        dampingFactor={0.07}
        mouseButtons={{
          LEFT: 0 as any,
          MIDDLE: 1 as any,
          RIGHT: 2 as any,
        }}
      />

      {/* ── Visible floor (workplane) ── */}
      {/* Solid surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
        onClick={handleFloorClick}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#d8dce2" roughness={0.95} metalness={0} />
      </mesh>

      {/* Subtle floor border / "table edge" shadow — thin dark ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.52, 0]}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#b0b8c4" roughness={1} transparent opacity={0.18} />
      </mesh>

      {/* Workplane grid (drawn on top of floor) */}
      {showGrid && (
        <Grid
          position={[0, 0, 0]}
          args={[800, 800]}
          cellSize={10}
          cellThickness={0.5}
          cellColor="#b8bec8"
          sectionSize={100}
          sectionThickness={1.2}
          sectionColor="#8a95a8"
          fadeDistance={700}
          fadeStrength={1.2}
          infiniteGrid
        />
      )}

      {/* Boards */}
      {boards.map(board => (
        <BoardMesh key={board.id} board={board} onRegisterRef={registerRef} />
      ))}

      {/* Alignment guide lines (shown during drag when board-snap is active) */}
      <SnapGuideLines />

      {/* Orientation gizmo cube (bottom-left) */}
      <GizmoHelper alignment="bottom-left" margin={[70, 70]}>
        <GizmoViewport
          axisColors={['#e53935', '#43a047', '#1e88e5']}
          labelColor="#222"
        />
      </GizmoHelper>
    </SceneContext.Provider>
  );
}
