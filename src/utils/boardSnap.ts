/**
 * Board-to-board snapping — two modes that work together:
 *
 *  1. FACE SNAP  — when a board face is within threshold of another board's
 *     opposite face, snap so they are separated by exactly `gap` cm.
 *
 *  2. ALIGNMENT SNAP — when an edge or centre of the dragging board is
 *     within threshold of an edge or centre of another board, snap to align
 *     them exactly (like Smart Guides in Illustrator / Figma).
 *     Returns guide-line world coordinates so the caller can draw visual aids.
 *
 * Board footprints are approximated as axis-aligned bounding boxes in XZ
 * using each board's rotationY (handles 0° / 90° layouts well).
 */

export interface BoardSnapInfo {
  id: string;
  x: number;
  z: number;
  rotationY: number;
  boardType: { width: number };
  length: number;
}

interface AABB { xMin: number; xMax: number; zMin: number; zMax: number }

/** Axis-aligned bounding box of a board on the XZ plane */
function xzAABB(b: BoardSnapInfo): AABB {
  const cx = b.x + b.boardType.width / 2;
  const cz = b.z + b.length / 2;
  const w  = b.boardType.width;
  const l  = b.length;
  const cosR = Math.abs(Math.cos(b.rotationY));
  const sinR = Math.abs(Math.sin(b.rotationY));
  const xHalf = cosR * w / 2 + sinR * l / 2;
  const zHalf = sinR * w / 2 + cosR * l / 2;
  return { xMin: cx - xHalf, xMax: cx + xHalf, zMin: cz - zHalf, zMax: cz + zHalf };
}

/** How close (cm) a feature must be before the snap fires */
const THRESHOLD = 8;

export interface SnapResult {
  x: number;
  z: number;
  /** X position snapped (face or alignment) */
  snappedX: boolean;
  /** Z position snapped (face or alignment) */
  snappedZ: boolean;
  /**
   * World X coordinate for an alignment guide line
   * (draw a line at this X extending in the Z direction).
   * Undefined when no alignment snap fired on X.
   */
  guideX?: number;
  /**
   * World Z coordinate for an alignment guide line
   * (draw a line at this Z extending in the X direction).
   * Undefined when no alignment snap fired on Z.
   */
  guideZ?: number;
}

/**
 * Given a board being dragged to (tentativeX, tentativeZ) snap it to
 * adjacent faces and / or alignment axes of every other board.
 */
export function snapBoardPosition(
  dragging: BoardSnapInfo,
  tentativeX: number,
  tentativeZ: number,
  others: BoardSnapInfo[],
  gap: number,
): SnapResult {
  const w = dragging.boardType.width;
  const l = dragging.length;
  const ry = dragging.rotationY;
  const cosR = Math.abs(Math.cos(ry));
  const sinR = Math.abs(Math.sin(ry));
  const xHalf = cosR * w / 2 + sinR * l / 2;
  const zHalf = sinR * w / 2 + cosR * l / 2;

  // Centre of dragging board at tentative position
  const cx = tentativeX + w / 2;
  const cz = tentativeZ + l / 2;

  let bestX = tentativeX;
  let bestZ = tentativeZ;
  let bestDistX = THRESHOLD;
  let bestDistZ = THRESHOLD;
  let snappedX = false;
  let snappedZ = false;
  let guideX: number | undefined;
  let guideZ: number | undefined;

  // Helper: try to beat bestDistX with a candidate snap
  const tryX = (myFeature: number, target: number, computeX: () => number, guide: number) => {
    const d = Math.abs(myFeature - target);
    if (d < bestDistX) { bestDistX = d; bestX = computeX(); snappedX = true; guideX = guide; }
  };
  const tryZ = (myFeature: number, target: number, computeZ: () => number, guide: number) => {
    const d = Math.abs(myFeature - target);
    if (d < bestDistZ) { bestDistZ = d; bestZ = computeZ(); snappedZ = true; guideZ = guide; }
  };

  for (const other of others) {
    if (other.id === dragging.id) continue;
    const o = xzAABB(other);
    const oCx = (o.xMin + o.xMax) / 2;
    const oCz = (o.zMin + o.zMax) / 2;

    // ── FACE SNAP: touch / gap ────────────────────────────────────────────────
    // My left face → other's right face
    tryX(cx - xHalf, o.xMax + gap, () => o.xMax + gap + xHalf - w / 2, o.xMax + gap);
    // My right face → other's left face
    tryX(cx + xHalf, o.xMin - gap, () => o.xMin - gap - xHalf - w / 2, o.xMin - gap);
    // My front face → other's back face
    tryZ(cz - zHalf, o.zMax + gap, () => o.zMax + gap + zHalf - l / 2, o.zMax + gap);
    // My back face → other's front face
    tryZ(cz + zHalf, o.zMin - gap, () => o.zMin - gap - zHalf - l / 2, o.zMin - gap);

    // ── ALIGNMENT SNAP: shared edges / centres ────────────────────────────────
    // X alignment: my left / right / centre aligns with other's left / right / centre
    const xTargets = [o.xMin, o.xMax, oCx];
    tryX(cx - xHalf, xTargets[0], () => xTargets[0] + xHalf - w / 2, xTargets[0]);
    tryX(cx - xHalf, xTargets[1], () => xTargets[1] + xHalf - w / 2, xTargets[1]);
    tryX(cx - xHalf, xTargets[2], () => xTargets[2] + xHalf - w / 2, xTargets[2]);
    tryX(cx + xHalf, xTargets[0], () => xTargets[0] - xHalf - w / 2, xTargets[0]);
    tryX(cx + xHalf, xTargets[1], () => xTargets[1] - xHalf - w / 2, xTargets[1]);
    tryX(cx + xHalf, xTargets[2], () => xTargets[2] - xHalf - w / 2, xTargets[2]);
    tryX(cx,         xTargets[0], () => xTargets[0]         - w / 2, xTargets[0]);
    tryX(cx,         xTargets[1], () => xTargets[1]         - w / 2, xTargets[1]);
    tryX(cx,         xTargets[2], () => xTargets[2]         - w / 2, xTargets[2]);

    // Z alignment
    const zTargets = [o.zMin, o.zMax, oCz];
    tryZ(cz - zHalf, zTargets[0], () => zTargets[0] + zHalf - l / 2, zTargets[0]);
    tryZ(cz - zHalf, zTargets[1], () => zTargets[1] + zHalf - l / 2, zTargets[1]);
    tryZ(cz - zHalf, zTargets[2], () => zTargets[2] + zHalf - l / 2, zTargets[2]);
    tryZ(cz + zHalf, zTargets[0], () => zTargets[0] - zHalf - l / 2, zTargets[0]);
    tryZ(cz + zHalf, zTargets[1], () => zTargets[1] - zHalf - l / 2, zTargets[1]);
    tryZ(cz + zHalf, zTargets[2], () => zTargets[2] - zHalf - l / 2, zTargets[2]);
    tryZ(cz,         zTargets[0], () => zTargets[0]         - l / 2, zTargets[0]);
    tryZ(cz,         zTargets[1], () => zTargets[1]         - l / 2, zTargets[1]);
    tryZ(cz,         zTargets[2], () => zTargets[2]         - l / 2, zTargets[2]);
  }

  return { x: bestX, z: bestZ, snappedX, snappedZ, guideX, guideZ };
}
