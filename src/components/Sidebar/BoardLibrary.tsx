import { useState } from 'react';
import { BOARD_TYPES, BOARD_CATEGORIES } from '../../data/boards';
import type { BoardCategory, BoardType } from '../../data/boards';
import { useStore } from '../../store';
import type { PlacedBoard } from '../../store';

function BoardCard({ bt }: { bt: BoardType }) {
  const { addBoard, selectBoard } = useStore();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('boardTypeId', bt.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = () => {
    const newBoard: Omit<PlacedBoard, 'id'> = {
      boardTypeId: bt.id,
      boardType: bt,
      x: Math.round(Math.random() * 80),
      y: 0,
      z: Math.round(Math.random() * 80),
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      pivotX: 0,
      pivotY: 0,
      pivotZ: 0,
      length: bt.defaultLength,
    };
    const id = addBoard(newBoard);
    selectBoard(id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={handleDoubleClick}
      title={bt.description + '\n(גרור למשטח ה-3D, או לחץ פעמיים)'}
      style={{ borderRight: `5px solid ${bt.color}` }}
      className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing rounded-xl p-3 mb-2 transition-all select-none group"
    >
      <div className="flex justify-between items-start mb-1">
        <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{bt.name}</div>
        <div className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-lg border border-slate-200">
          {bt.category}
        </div>
      </div>
      <div className="text-xs font-semibold text-slate-500 mb-0.5">
        חתך: <span className="text-slate-700">{bt.width}×{bt.height} ס"מ</span>
      </div>
      <div className="text-xs text-slate-400">
        אורכים: {bt.availableLengths[0]}–{bt.availableLengths[bt.availableLengths.length - 1]} ס"מ
      </div>
    </div>
  );
}

export default function BoardLibrary() {
  const [activeCategory, setActiveCategory] = useState<BoardCategory | 'הכל'>('הכל');

  const filtered = activeCategory === 'הכל'
    ? BOARD_TYPES
    : BOARD_TYPES.filter(b => b.category === activeCategory);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-4 text-center">
        <p className="text-xs font-medium text-blue-800">💡 גרור עץ למשטח כדי למקם, או לחץ פעמיים</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(['הכל', ...BOARD_CATEGORIES] as (BoardCategory | 'הכל')[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
              activeCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Board list */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-1">
        {filtered.map(bt => (
          <BoardCard key={bt.id} bt={bt} />
        ))}
      </div>
    </div>
  );
}
