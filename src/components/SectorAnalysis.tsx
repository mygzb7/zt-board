import { useApp } from '../context/AppContext';

export default function SectorAnalysis() {
  const { sectorAnalysis } = useApp();

  const levelColor = (level: string) => ({
    '主线': 'bg-green-500/20 border-green-500 text-green-400',
    '支线': 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    '一日游': 'bg-slate-500/20 border-slate-500 text-slate-400',
  }[level]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">📈 题材强度分析</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectorAnalysis.map((s, i) => (
          <div key={s.name} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-500 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">{s.name}</span>
              <span className={`px-2 py-0.5 rounded border text-xs font-bold ${levelColor(s.level)}`}>
                {s.level}
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-red-400">{s.count}</span>
              <span className="text-slate-400 text-sm mb-1">只涨停</span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (s.count / (sectorAnalysis[0]?.count || 1)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
        {sectorAnalysis.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-8">暂无题材数据</div>
        )}
      </div>
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-xs text-slate-400">
        <strong className="text-slate-300">判断标准：</strong>
        主线（≥5只涨停）| 支线（3-4只）| 一日游（&lt;3只）
      </div>
    </div>
  );
}
