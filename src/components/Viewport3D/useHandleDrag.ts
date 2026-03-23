import { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneCtx } from './SceneContext';

/**
 * Hook that starts a drag operation using native canvas pointer events.
 * Works regardless of what object is under the cursor during the drag.
 */
export function useHandleDrag() {
  const { camera, gl } = useThree();
  const { disableOrbit, enableOrbit } = useSceneCtx();
  const rcRef = useRef(new THREE.Raycaster());

  const getRayPoint = useCallback(
    (clientX: number, clientY: number, plane: THREE.Plane): THREE.Vector3 | null => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      rcRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      const pt = new THREE.Vector3();
      const hit = rcRef.current.ray.intersectPlane(plane, pt);
      return hit ? pt : null;
    },
    [camera, gl],
  );

  const startDrag = useCallback(
    (
      clientX: number,
      clientY: number,
      plane: THREE.Plane,
      onMove: (worldPoint: THREE.Vector3, delta: THREE.Vector3) => void,
      onEnd?: () => void,
    ) => {
      disableOrbit();
      const startPt = getRayPoint(clientX, clientY, plane) ?? new THREE.Vector3();

      const handleMove = (ev: PointerEvent) => {
        const pt = getRayPoint(ev.clientX, ev.clientY, plane);
        if (!pt) return;
        const delta = pt.clone().sub(startPt);
        onMove(pt, delta);
      };

      const handleEnd = () => {
        enableOrbit();
        onEnd?.();
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleEnd);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleEnd);
    },
    [camera, gl, disableOrbit, enableOrbit, getRayPoint],
  );

  /**
   * Screen-space drag: reports raw pixel deltas on each move.
   * Use this when plane-based raycasting is unreliable (e.g. height drag when
   * camera is nearly top-down, which makes the vertical plane nearly parallel
   * to the camera ray and causes intersection to fail).
   */
  const startScreenDrag = useCallback(
    (
      clientX: number,
      clientY: number,
      onMove: (dx: number, dy: number) => void,
      onEnd?: () => void,
    ) => {
      disableOrbit();
      let prevX = clientX;
      let prevY = clientY;

      const handleMove = (ev: PointerEvent) => {
        const dx = ev.clientX - prevX;
        const dy = ev.clientY - prevY;
        prevX = ev.clientX;
        prevY = ev.clientY;
        onMove(dx, dy);
      };

      const handleEnd = () => {
        enableOrbit();
        onEnd?.();
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleEnd);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleEnd);
    },
    [disableOrbit, enableOrbit],
  );

  return { startDrag, startScreenDrag, getRayPoint };
}
