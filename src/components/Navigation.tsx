import { useApp } from '../context/AppContext';

type Tab = 'dashboard' | 'scoring' | 'ztpool' | 'sector' | 'tiers' | 'filter' | 'review';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'scoring', label: '市场打分', icon: '🎯' },
  { key: 'ztpool', label: '涨停池', icon: '🔥' },
  { key: 'sector', label: '题材分析', icon: '📈' },
  { key: 'tiers', label: '连板梯队', icon: '🏆' },
  { key: 'filter', label: '深度筛选', icon: '🔍' },
  { key: 'review', label: '复盘模板', icon: '📋' },
];

export default function Navigation({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export type { Tab };
