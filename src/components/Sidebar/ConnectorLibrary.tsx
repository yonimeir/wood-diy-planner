import { useState } from 'react';
import { CONNECTOR_TYPES, CONNECTOR_CATEGORIES } from '../../data/connectors';
import type { ConnectorCategory } from '../../data/connectors';

export default function ConnectorLibrary() {
  const [activeCategory, setActiveCategory] = useState<ConnectorCategory | 'הכל'>('הכל');

  const filtered = activeCategory === 'הכל'
    ? CONNECTOR_TYPES
    : CONNECTOR_TYPES.filter(c => c.category === activeCategory);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <p className="text-xs text-slate-400 mb-2">
        חיבורים זמינים בחנויות בארץ. בשלב הנוכחי משמשים לתיעוד ורשימת קניות.
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(['הכל', ...CONNECTOR_CATEGORIES] as (ConnectorCategory | 'הכל')[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              activeCategory === cat
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Connector list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map(ct => (
          <div
            key={ct.id}
            className="bg-slate-800 rounded p-2 border border-slate-700 hover:border-amber-700 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-100">
              {ct.icon} {ct.name}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{ct.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
