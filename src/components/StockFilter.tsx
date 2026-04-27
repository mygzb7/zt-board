import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { filterZtPool, getSealTimeLevel } from '../utils/constants';
import { ZtStock } from '../types';

export default function StockFilter() {
  const { ztPool } = useApp();

  const [marketCapMin, setMarketCapMin] = useState(20);
  const [marketCapMax, setMarketCapMax] = useState(100);
  const [sealTimeMax, setSealTimeMax] = useState('14:00');
  const [catalystLevels, setCatalystLevels] = useState<('S' | 'A' | 'B')[]>(['S', 'A', 'B']);
  const [dragonTigerOnly, setDragonTigerOnly] = useState(false);
  const [minSealRatio, setMinSealRatio] = useState(0);

  const toggleCatalyst = (c: 'S' | 'A' | 'B') => {
    setCatalystLevels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const filtered = useMemo(() => {
    return filterZtPool(ztPool).filter(s => {
      if (s.marketCap < marketCapMin || s.marketCap > marketCapMax) return false;
      if (s.sealTime > sealTimeMax) return false;
      if (!catalystLevels.includes(s.catalystLevel as 'S' | 'A' | 'B')) return false;
      if (dragonTigerOnly && !s.dragonTiger) return false;
      if ((s.sealAmountRatio ?? 0) < minSealRatio) return false;
      return true;
    });
  }, [ztPool, marketCapMin, marketCapMax, sealTimeMax, catalystLevels, dragonTigerOnly, minSealRatio]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">🔍 个股深度筛选</h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
            <h3 className="font-semibold text-white">流通市值</h3>
            <div className="flex items-center gap-2">
              <input type="number" value={marketCapMin} onChange={e => setMarketCapMin(Number(e.target.value))}
                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm" />
              <span className="text-slate-400">~</span>
              <input type="number" value={marketCapMax} onChange={e => setMarketCapMax(Number(e.target.value))}
                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm" />
              <span className="text-slate-400">亿</span>
            </div>
            <div className="text-xs text-slate-500">最优20-100亿 | 谨慎100-200亿 | 排除&gt;200亿</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
            <h3 className="font-semibold text-white">封板质量</h3>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">最晚封板时间</label>
              <select value={sealTimeMax} onChange={e => setSealTimeMax(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm">
                <option value="10:00">≤10:00 ⭐⭐⭐</option>
                <option value="11:30">≤11:30 ⭐⭐</option>
                <option value="14:00">≤14:00 ⭐</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">最低封单/成交额比</label>
              <input type="number" value={minSealRatio} onChange={e => setMinSealRatio(Number(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm" step="0.5" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
            <h3 className="font-semibold text-white">题材驱动</h3>
            <div className="flex flex-wrap gap-2">
              {(['S', 'A', 'B'] as const).map(c => (
                <button key={c} onClick={() => toggleCatalyst(c)}
                  className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                    catalystLevels.includes(c)
                      ? c === 'S' ? 'bg-purple-600 text-white' : c === 'A' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                  {c}级
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500">S=国家级政策 | A=产业链大单 | B=公司利好</div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
            <h3 className="font-semibold text-white">龙虎榜数据</h3>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={dragonTigerOnly} onChange={e => setDragonTigerOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500" />
              仅显示上榜股票
            </label>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-2 bg-slate-700/50 text-sm text-slate-300">
              精选观察池：<span className="text-red-400 font-bold">{filtered.length}</span> 只
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 text-slate-300 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">代码</th>
                    <th className="px-3 py-2 text-left">名称</th>
                    <th className="px-3 py-2 text-left">封板时间</th>
                    <th className="px-3 py-2 text-left">开板</th>
                    <th className="px-3 py-2 text-left">市值</th>
                    <th className="px-3 py-2 text-left">题材</th>
                    <th className="px-3 py-2 text-left">连板</th>
                    <th className="px-3 py-2 text-left">等级</th>
                    <th className="px-3 py-2 text-left">龙虎榜</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filtered.map((s, i) => (
                    <tr key={`${s.code}-${i}`} className="hover:bg-slate-700/30">
                      <td className="px-3 py-2 font-mono text-blue-400">{s.code}</td>
                      <td className="px-3 py-2 text-white font-medium">{s.name}</td>
                      <td className={`px-3 py-2 font-mono ${s.sealTime <= '10:00' ? 'text-green-400' : s.sealTime <= '11:30' ? 'text-yellow-400' : 'text-orange-400'}`}>
                        {s.sealTime} {getSealTimeLevel(s.sealTime)}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{s.openCount}次</td>
                      <td className={`px-3 py-2 font-mono ${s.marketCap <= 100 ? 'text-green-400' : s.marketCap <= 200 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {s.marketCap}亿
                      </td>
                      <td className="px-3 py-2 text-slate-300">{s.sector}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-300 text-xs font-bold">{s.boardLevel}板</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          s.catalystLevel === 'S' ? 'bg-purple-900/50 text-purple-300' :
                          s.catalystLevel === 'A' ? 'bg-green-900/50 text-green-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}>{s.catalystLevel}级</span>
                      </td>
                      <td className="px-3 py-2">
                        {s.dragonTiger ? <span className="text-orange-400">🐯上榜</span> : <span className="text-slate-500">-</span>}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-500">无匹配股票</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
