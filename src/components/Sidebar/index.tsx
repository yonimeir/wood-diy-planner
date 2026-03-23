import { useStore } from '../../store';
import BoardLibrary from './BoardLibrary';
import ConnectorLibrary from './ConnectorLibrary';
import Properties from './Properties';

const TABS = [
  { id: 'boards' as const, label: 'קרשים' },
  { id: 'connectors' as const, label: 'חיבורים' },
  { id: 'properties' as const, label: 'מאפיינים' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, selectedBoardId } = useStore();

  return (
    <aside className="flex flex-col h-full bg-white border-l border-slate-200 shadow-[4px_0_12px_rgba(0,0,0,0.03)] overflow-hidden z-10" style={{ minWidth: 260, maxWidth: 300, width: 280 }}>
      {/* Tabs */}
      <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600 bg-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            {tab.label}
            {tab.id === 'properties' && selectedBoardId && (
              <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full shadow-[0_-2px_4px_rgba(37,99,235,0.2)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden p-4 bg-slate-50/30">
        {activeTab === 'boards' && <BoardLibrary />}
        {activeTab === 'connectors' && <ConnectorLibrary />}
        {activeTab === 'properties' && <Properties />}
      </div>
    </aside>
  );
}
