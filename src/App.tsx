import { useState } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import Viewport3D from './components/Viewport3D';
import Viewport2D from './components/Viewport2D';
import CutList from './components/CutList';

type RightPanel = 'cutlist' | '2d' | 'none';

export default function App() {
  const { viewMode, setViewMode, clearAll, boards, selectedBoardId, pastBoards, futureBoards, undo, redo } = useStore();
  const [rightPanel, setRightPanel] = useState<RightPanel>('2d');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (confirmClear) { clearAll(); setConfirmClear(false); }
    else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-blue-100">

      {/* ── Header ── */}
      <header
        className="flex items-center gap-3 px-4 h-14 shrink-0 bg-white border-b border-slate-200 shadow-sm z-20"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 rounded-lg p-1.5 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M2 5h20v4H2zm0 6h15v4H2zm0 6h15v4H2z" />
            </svg>
          </div>
          <span className="font-extrabold text-slate-800 text-lg tracking-tight">עץ-תכנן</span>
          <span className="text-slate-400 text-xs hidden sm:block font-medium">DIY Planner</span>
        </div>

         {/* Undo / Redo */}
         <div className="mr-6 flex gap-1 items-center bg-slate-100 rounded-full p-0.5 border border-slate-200">
          <button
            onClick={redo}
            disabled={futureBoards.length === 0}
            className={`p-1.5 rounded-full transition-colors ${futureBoards.length === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-white shadow-sm hover:text-blue-600'}`}
            title="קדימה (Redo)"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
          <div className="w-px h-4 bg-slate-300 mx-0.5"></div>
          <button
            onClick={undo}
            disabled={pastBoards.length === 0}
            className={`p-1.5 rounded-full transition-colors ${pastBoards.length === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-white shadow-sm hover:text-blue-600'}`}
            title="חזור (Undo)"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
        </div>

        <div className="flex-1" />

        {/* Board count badge */}
        {boards.length > 0 && (
          <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {boards.length} חתיכות עץ
          </div>
        )}

        {/* View mode */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
          {([['split', '⊞ פצול'], ['3d', '⬡ 3D'], ['2d', '▦ שרטוט']] as [typeof viewMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm font-semibold transition-all rounded-lg ${
                viewMode === mode
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right panel toggle */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner ml-2">
          {([['2d', 'חזיות'], ['cutlist', 'רשימת חיתוך'], ['none', '✕']] as [RightPanel, string][]).map(([p, label]) => (
            <button
              key={p}
              onClick={() => setRightPanel(p)}
              className={`px-3 py-1 text-sm font-semibold transition-all rounded-lg flex items-center gap-1.5 ${
                rightPanel === p
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
              {p === 'cutlist' && boards.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rightPanel === p ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                  {boards.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Clear */}
        <button
          onClick={handleClear}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
            confirmClear
              ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500'
          }`}
        >
          {confirmClear ? '⚠ לאישור?' : 'נקה הכל'}
        </button>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar */}
        <Sidebar />

        {/* Viewport area */}
        <main className="flex flex-1 overflow-hidden relative bg-slate-100 rounded-tl-2xl shadow-inner m-0">

          {/* 3D view */}
          {(viewMode === '3d' || viewMode === 'split') && (
            <div className={viewMode === 'split' ? 'flex-1 h-full' : 'w-full h-full'}>
              <Viewport3D />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="w-1 bg-slate-200 shrink-0 cursor-col-resize z-10 hover:bg-blue-300 transition-colors" />
          )}

          {/* 2D full view */}
          {viewMode === '2d' && (
            <div className="w-full h-full bg-white z-0">
              <Viewport2D />
            </div>
          )}

          {/* Empty state hint */}
          {boards.length === 0 && (viewMode === '3d' || viewMode === 'split') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ right: viewMode === 'split' ? '50%' : 0 }}
            >
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 text-center animate-bounce-soft">
                <div className="text-6xl mb-4 drop-shadow-md">🪵</div>
                <div className="text-slate-800 text-lg font-bold mb-2">גרור עץ מהמחסן לכאן</div>
                <div className="text-slate-500 text-sm font-medium">או לחץ פעמיים על פרופיל עץ כדי להתחיל לתכנן</div>
              </div>
            </div>
          )}
        </main>

        {/* Right panel */}
        {rightPanel !== 'none' && (
          <aside
            className="h-full overflow-hidden flex flex-col shrink-0 bg-white border-r border-slate-200 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] z-10 relative"
            style={{ width: 320 }}
          >
            {rightPanel === '2d'      && <Viewport2D />}
            {rightPanel === 'cutlist' && <CutList />}
          </aside>
        )}
      </div>

      {/* ── Status bar ── */}
      <footer
        className="flex items-center gap-4 px-4 h-8 text-xs shrink-0 bg-slate-800 text-slate-300 border-t border-slate-900 z-20"
      >
        <span className="font-medium text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
          {boards.length} פריטים בפרויקט
        </span>
        
        {selectedBoardId && (() => {
          const b = boards.find(b => b.id === selectedBoardId);
          return b && (
            <>
              <div className="w-px h-3 bg-slate-600"></div>
              <span className="text-amber-300 font-semibold truncate max-w-[300px]">
                בחרת: {b.label ?? b.boardType.name} ({b.boardType.width}×{b.boardType.height} ס"מ, אורך {b.length} ס"מ)
              </span>
            </>
          );
        })()}

        <span className="flex-1" />
        
        <div className="hidden md:flex items-center gap-3 opacity-80">
          <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-100 mx-1">גרירה</kbd> הזזה על הרצפה</span>
          <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-100 mx-1">קצוות כחולים</kbd> מתיחת אורך</span>
          <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-100 mx-1">קצה צהוב</kbd> סיבוב</span>
        </div>
      </footer>
    </div>
  );
}
