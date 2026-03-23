import { useStore } from '../../store';
import { BOARD_TYPES } from '../../data/boards';

function NumInput({
  label, value, onChange, min, step = 1, unit = 'ס"מ',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5 mb-2">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={Math.round(value * 100) / 100}
          min={min}
          step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-500 whitespace-nowrap">{unit}</span>
      </div>
    </label>
  );
}

function toDeg(r: number) { return Math.round((r * 180) / Math.PI); }
function toRad(d: number) { return (d * Math.PI) / 180; }

export default function Properties() {
  const { boards, selectedBoardId, updateBoard, removeBoard, duplicateBoard, selectBoard, setTransformMode } = useStore();

  const board = boards.find(b => b.id === selectedBoardId);

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm text-center gap-2 px-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity={0.4}>
          <path d="M3 3h18v4H3zm0 6h18v4H3zm0 6h18v4H3z" />
        </svg>
        <span>לחץ על קרש בתצוגה כדי לראות ולערוך את מאפייניו</span>
      </div>
    );
  }

  const bt = board.boardType;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto h-full pb-2">
      {/* Header */}
      <div
        className="rounded-xl p-3 mb-2 shadow-sm border border-slate-100"
        style={{ background: `linear-gradient(to left, ${bt.color}15, white)`, borderRight: `5px solid ${bt.color}` }}
      >
        <div className="text-sm font-bold text-slate-800">{bt.name}</div>
        <div className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{bt.description}</div>
      </div>

      {/* Label */}
      <label className="flex flex-col gap-1 mb-2 bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-700">תווית (אופציונלי)</span>
        <input
          type="text"
          value={board.label ?? ''}
          placeholder="למשל: רגל שמאל קדמית..."
          onChange={e => updateBoard(board.id, { label: e.target.value || undefined })}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow"
        />
      </label>

      {/* Fixed dimensions */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">מידות פרופיל</div>
        <div className="text-sm font-bold text-slate-700">
          רוחב: {bt.width} ס"מ <span className="text-slate-300 mx-1">|</span> עובי: {bt.height} ס"מ
        </div>
        <div className="text-slate-500 text-[10px] mt-1 font-medium bg-white inline-block px-1.5 py-0.5 rounded border border-slate-200">
          *קבוע לפי סוג העץ
        </div>
      </div>

      {/* Cut length */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <NumInput
          label='אורך חיתוך (ס"מ)'
          value={board.length}
          onChange={v => updateBoard(board.id, { length: Math.max(1, v) })}
          min={1}
          step={1}
          unit=""
        />
        <label className="flex flex-col gap-1 mt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">קבע לאורך גולמי מקורי</span>
          <select
            value=""
            onChange={e => { if (e.target.value) updateBoard(board.id, { length: Number(e.target.value) }); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow hover:bg-white"
          >
            <option value="">בחר...</option>
            {bt.availableLengths.map(l => (
              <option key={l} value={l}>{l} ס"מ</option>
            ))}
          </select>
        </label>
      </div>

      {/* Position */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">מיקום במרחב</div>
        <div className="space-y-1">
          <NumInput label='X (שמאל עכבר ימין)' value={Math.round(board.x * 10) / 10} onChange={v => updateBoard(board.id, { x: v })} step={1} unit="" />
          <NumInput label='Y (גובה מהרצפה)' value={Math.round(board.y * 10) / 10} onChange={v => updateBoard(board.id, { y: Math.max(0, v) })} step={1} min={0} unit="" />
          <NumInput label='Z (עומק אחורה קדימה)' value={Math.round(board.z * 10) / 10} onChange={v => updateBoard(board.id, { z: v })} step={1} unit="" />
        </div>
      </div>

      {/* Rotation */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">סיבוב (מעלות)</span>
          <button
            onClick={() => updateBoard(board.id, { rotationX: 0, rotationY: 0, rotationZ: 0 })}
            className="text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 px-2 py-1 rounded transition-colors"
          >
            אפס זוויות
          </button>
        </div>

        {/* Y rotation quick buttons */}
        <div className="flex gap-1 mb-4 bg-slate-50 p-1 rounded-lg border border-slate-100">
          {[0, 45, 90, 135, 180, 270].map(deg => (
            <button
              key={deg}
              onClick={() => {
                updateBoard(board.id, { rotationX: 0, rotationY: toRad(deg), rotationZ: 0 });
                setTransformMode('translate');
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                Math.abs(toDeg(board.rotationY) - deg) < 2 &&
                Math.abs(board.rotationX) < 0.02 &&
                Math.abs(board.rotationZ) < 0.02
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>

        {/* Fine rotation inputs */}
        <div className="grid grid-cols-3 gap-2">
          {(['X', 'Y', 'Z'] as const).map(axis => {
            const key = `rotation${axis}` as 'rotationX' | 'rotationY' | 'rotationZ';
            return (
              <label key={axis} className="flex flex-col gap-1 items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">ציר {axis}</span>
                <input
                  type="number"
                  value={toDeg(board[key])}
                  step={5}
                  onChange={e => updateBoard(board.id, { [key]: toRad(Number(e.target.value)) })}
                  className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Change board type */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/50 shadow-sm mt-1">
        <div className="text-[10px] font-black text-amber-700/70 uppercase tracking-wider mb-2">החלף סוג פרופיל</div>
        <select
          value={board.boardTypeId}
          onChange={e => {
            const newBt = BOARD_TYPES.find(b => b.id === e.target.value);
            if (newBt) updateBoard(board.id, { boardTypeId: newBt.id, boardType: newBt });
          }}
          className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-shadow"
        >
          {BOARD_TYPES.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2 pt-2 pb-1">
        <button
          onClick={() => duplicateBoard(board.id)}
          className="flex-1 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 shadow-sm hover:shadow hover:bg-blue-50 text-blue-600 transition-all active:scale-95"
        >
          שכפל
        </button>
        <button
          onClick={() => { removeBoard(board.id); selectBoard(null); }}
          className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-50 border border-red-100 shadow-sm hover:shadow hover:bg-red-100 text-red-600 transition-all active:scale-95"
        >
          מחק
        </button>
      </div>
    </div>
  );
}
