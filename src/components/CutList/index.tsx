import { useMemo } from 'react';
import { useStore } from '../../store';
import { computeCutList, formatDim } from '../../utils/cutList';
import type { RawMaterial } from '../../utils/cutList';

function RawMaterialCard({ mat }: { mat: RawMaterial }) {
  return (
    <div className="bg-slate-800 rounded border border-slate-700 mb-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-750 border-b border-slate-700">
        <span className="text-sm font-semibold text-slate-100 flex-1">
          {mat.boardName}
        </span>
        <span className="text-xs bg-amber-700 text-amber-100 px-2 py-0.5 rounded-full font-bold">
          ×{mat.quantity}
        </span>
        <span className="text-xs text-slate-400">
          {formatDim(mat.rawLength)}
        </span>
      </div>

      {/* Cuts per Bin */}
      <div className="p-2 flex flex-col gap-2">
        {mat.bins.map((bin, bIndex) => (
          <div key={bIndex} className="bg-slate-900 rounded border border-slate-700 px-2 py-1.5">
            <div className="text-xs font-semibold text-slate-400 mb-1 border-b border-slate-800 pb-1 flex justify-between">
              <span>קורה #{bIndex + 1}</span>
              {bin.waste > 0.5 && <span className="text-slate-500">שארית: ~{Math.round(bin.waste)} ס"מ</span>}
            </div>
            {bin.cuts.map((cut, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 text-xs">
                <span className="text-slate-300">{cut.label ?? `חתיכה`}</span>
                <span className="text-amber-500 font-mono font-bold mr-2 text-right flex-1">{formatDim(cut.cutLength)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CutList() {
  const { boards } = useStore();
  const cutList = useMemo(() => computeCutList(boards), [boards]);

  const exportText = () => {
    const lines: string[] = ['רשימת חיתוכים וחומרים', '===================', ''];
    for (const mat of cutList) {
      lines.push(`${mat.boardName} — סה"כ ${mat.quantity} קורות של ${formatDim(mat.rawLength)}`);
      lines.push(`  מידות חתך: ${mat.rawWidth}×${mat.rawHeight} ס"מ`);
      
      mat.bins.forEach((bin, bIndex) => {
        lines.push(`  קורה #${bIndex + 1}:`);
        bin.cuts.forEach((cut, cIndex) => {
          lines.push(`    ${cIndex + 1}. ${cut.label ?? 'חתיכה'} — ${formatDim(cut.cutLength)}`);
        });
        if (bin.waste > 0.5) {
          lines.push(`    [שארית: ~${Math.round(bin.waste)} ס"מ]`);
        }
      });
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cut-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm text-center px-4 gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity={0.4}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
        </svg>
        <span>הוסף קרשים לפרויקט כדי לראות רשימת חיתוכים</span>
      </div>
    );
  }

  const totalRaw = cutList.reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <div className="text-sm font-semibold text-slate-200">רשימת חיתוכים</div>
          <div className="text-xs text-slate-500">{boards.length} חתיכות • {totalRaw} אורכים גולמיים לקנות</div>
        </div>
        <button
          onClick={exportText}
          className="px-2 py-1 text-xs bg-green-800 hover:bg-green-700 text-green-100 rounded transition-colors"
        >
          ייצא
        </button>
      </div>

      {/* Summary hint */}
      <div className="text-xs text-slate-500 mb-2 bg-slate-800 rounded p-2 shrink-0">
        הרשימה מחשבת את האורכים הגולמיים הזולים ביותר לקנות, ומנסה למזג חיתוכים לאותו אורך גולמי.
      </div>

      {/* Cut list */}
      <div className="flex-1 overflow-y-auto">
        {cutList.map((mat, i) => (
          <RawMaterialCard key={i} mat={mat} />
        ))}
      </div>
    </div>
  );
}
