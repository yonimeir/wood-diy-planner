import type { PlacedBoard } from '../store';
import { getBoardById } from '../data/boards';

export interface CutItem {
  boardTypeId: string;
  boardName: string;
  cutLength: number;  // cm
  cutWidth: number;   // cm (= boardType.width)
  cutHeight: number;  // cm (= boardType.height / thickness)
  label?: string;
}

export interface BinMap {
  rawLength: number;
  usedLength: number;
  waste: number;
  cuts: CutItem[];
}

export interface RawMaterial {
  boardTypeId: string;
  boardName: string;
  rawLength: number;    // cm - the standard length to buy
  rawWidth: number;     // cm
  rawHeight: number;    // cm
  quantity: number;     // how many to buy
  bins: BinMap[];       // Detailed mapping of cuts per physical bin
  totalWaste: number;   // Total cm of waste across all these bins
}

const KERF = 0.4; // cm - saw blade kerf (updated to 0.4cm/4mm for better realism)

/**
 * Given placed boards, calculate the optimal raw materials to buy.
 * Groups by board type, then packs cuts into standard lengths using Best Fit Decreasing.
 */
export function computeCutList(boards: PlacedBoard[]): RawMaterial[] {
  // Group cuts by board type
  const groups = new Map<string, CutItem[]>();

  for (const board of boards) {
    const bt = board.boardType;
    const cut: CutItem = {
      boardTypeId: bt.id,
      boardName: bt.name,
      cutLength: Math.round(board.length * 10) / 10,
      cutWidth: bt.width,
      cutHeight: bt.height,
      label: board.label,
    };

    const existing = groups.get(bt.id) ?? [];
    existing.push(cut);
    groups.set(bt.id, existing);
  }

  const result: RawMaterial[] = [];

  for (const [boardTypeId, cuts] of groups.entries()) {
    const bt = getBoardById(boardTypeId);
    if (!bt) continue;

    // Sort cuts descending by length for bin-packing (Best Fit Decreasing)
    const sortedCuts = [...cuts].sort((a, b) => b.cutLength - a.cutLength);

    const bins: { rawLength: number; usedLength: number; cuts: CutItem[] }[] = [];

    // Valid lengths from the material definitions
    const standardLengths = [...bt.availableLengths].sort((a, b) => a - b);

    for (const cut of sortedCuts) {
      // Find smallest raw length that can fit this cut (plus kerf if we have multiple cuts, but let's just add kerf for safety)
      const requiredLength = cut.cutLength + KERF;
      const validLengths = standardLengths.filter(l => l >= requiredLength);
      if (validLengths.length === 0) {
        // Cut is longer than any standard length! We must still create a bin for it as an anomaly.
        validLengths.push(cut.cutLength + KERF); 
      }

      // Try to fit into an existing bin using BEST FIT
      // We look for the bin that will have the LEAST remaining space if we put the piece there.
      let bestBinIndex = -1;
      let minRemainingSpace = Infinity;

      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
        const remainingSpace = bin.rawLength - bin.usedLength;
        if (remainingSpace >= requiredLength) {
          const spaceAfter = remainingSpace - requiredLength;
          if (spaceAfter < minRemainingSpace) {
            minRemainingSpace = spaceAfter;
            bestBinIndex = i;
          }
        }
      }

      if (bestBinIndex !== -1) {
        // Place in best fitting existing bin
        bins[bestBinIndex].cuts.push(cut);
        bins[bestBinIndex].usedLength += requiredLength;
      } else {
        // Open a new bin. For simplicity and economy of scale, we usually buy the longest standard length 
        // to maximize usage, or the shortest valid length if we're optimizing tightly. 
        // We will default to the standard maximal length (the last one) unless the cut asks for a specific tiny board.
        // Actually, typical DIYers buy uniform lengths (e.g., all 400cm). Let's pick standardLengths[0] (shortest valid).
        const rawLength = validLengths[0];
        bins.push({
          rawLength,
          usedLength: requiredLength,
          cuts: [cut],
        });
      }
    }

    // Merge bins with same rawLength into RawMaterial entries
    const byLength = new Map<number, typeof bins>();
    for (const bin of bins) {
      const arr = byLength.get(bin.rawLength) ?? [];
      arr.push(bin);
      byLength.set(bin.rawLength, arr);
    }

    for (const [rawLength, lengthBins] of byLength.entries()) {
      const binMaps: BinMap[] = lengthBins.map(b => ({
        rawLength: b.rawLength,
        usedLength: b.usedLength,
        waste: b.rawLength - b.usedLength,
        cuts: b.cuts,
      }));

      const totalWaste = binMaps.reduce((sum, b) => sum + b.waste, 0);

      result.push({
        boardTypeId,
        boardName: bt.name,
        rawLength,
        rawWidth: bt.width,
        rawHeight: bt.height,
        quantity: lengthBins.length,
        bins: binMaps,
        totalWaste,
      });
    }
  }

  return result;
}

export function formatDim(cm: number): string {
  if (cm >= 100) return `${cm} ס"מ`;
  if (cm < 1) return `${Math.round(cm * 10)} מ"מ`;
  return `${cm} ס"מ`;
}
