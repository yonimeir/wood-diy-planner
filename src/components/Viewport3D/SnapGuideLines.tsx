/**
 * Renders world-space alignment guide lines (like Smart Guides in Illustrator)
 * while a board is being dragged.
 *
 *  – guideX: a vertical dashed line at world-X = guideX, extending in Z
 *  – guideZ: a horizontal dashed line at world-Z = guideZ, extending in X
 *
 * The lines are read from the Zustand store (activeSnapGuides) so they appear
 * during drag and vanish the moment drag ends.
 */
import * as THREE from 'three';
import { useMemo } from 'react';
import { useStore } from '../../store';

const GUIDE_EXTENT = 400; // half-length of the guide line in cm
const GUIDE_Y      = 0.3; // slightly above the ground plane

function GuideLine({ points, color }: { points: [number,number,number][]; color: string }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const flat = new Float32Array(points.flatMap(p => p));
    geo.setAttribute('position', new THREE.BufferAttribute(flat, 3));
    return geo;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.85} depthTest={false} />
    </lineSegments>
  );
}

/** Dashed look: series of short segments alternating on/off */
function DashedLine({ axis, pos, color }: {
  axis: 'x' | 'z';
  pos: number;
  color: string;
}) {
  const points = useMemo<[number,number,number][]>(() => {
    const pts: [number,number,number][] = [];
    const dashLen = 6;
    const gapLen  = 4;
    const step    = dashLen + gapLen;
    for (let t = -GUIDE_EXTENT; t < GUIDE_EXTENT; t += step) {
      const t2 = Math.min(t + dashLen, GUIDE_EXTENT);
      if (axis === 'x') {
        // line at world-X = pos, extending in Z
        pts.push([pos, GUIDE_Y, t], [pos, GUIDE_Y, t2]);
      } else {
        // line at world-Z = pos, extending in X
        pts.push([t, GUIDE_Y, pos], [t2, GUIDE_Y, pos]);
      }
    }
    return pts;
  }, [axis, pos]);

  return <GuideLine points={points} color={color} />;
}

export default function SnapGuideLines() {
  const { x, z } = useStore(s => s.activeSnapGuides);

  if (x === undefined && z === undefined) return null;

  return (
    <group renderOrder={999}>
      {x !== undefined && <DashedLine axis="x" pos={x} color="#f59e0b" />}
      {z !== undefined && <DashedLine axis="z" pos={z} color="#06b6d4" />}
    </group>
  );
}
