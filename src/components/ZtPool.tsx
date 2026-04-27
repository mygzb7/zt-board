import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { filterZtPool, getSealTimeLevel, getMarketCapLevel, exportToCSV, importFromCSV } from '../utils/constants';
import { ZtStock } from '../types';

export default function ZtPool() {
  const { ztPool, importZtPool } = useApp();
  const [showFiltered, setShowFiltered] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayPool = showFiltered ? filterZtPool(ztPool) : ztPool;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importFromCSV(file);
      const stocks: ZtStock[] = rows.map((r: Record<string, string>) => ({
        code: r['代码'] || r['code'] || '',
        name: r['名称'] || r['name'] || '',
        sealTime: r['封板时间'] || r['sealTime'] || '09:30',
        openCount: parseInt(r['开板次数'] || r['openCount'] || '0'),
        marketCap: parseFloat(r['市值'] || r['marketCap'] || '50'),
        sector: r['题材'] || r['sector'] || '未知',
        boardLevel: parseInt(r['连板'] || r['boardLevel'] || '1'),
        catalystLevel: (r['催化等级'] || r['catalystLevel'] || 'B') as ZtStock['catalystLevel'],
        sealAmountRatio: parseFloat(r['封单比'] || r['sealAmountRatio'] || '5'),
        dragonTiger: r['龙虎榜'] === '是' || r['dragonTiger'] === 'true',
        timestamp: r['日期'] || new Date().toISOString().slice(0, 10),
      })).filter(s => s.code && s.name);
      importZtPool(stocks);
      alert(`导入成功 ${stocks.length} 条`);
    } catch {
      alert('导入失败，请检查CSV格式');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExport = () => {
    exportToCSV(ztPool.map(s => ({
      代码: s.code, 名称: s.name, 封板时间: s.sealTime,
      开板次数: s.openCount, 市值: s.marketCap, 题材: s.sector,
      连板: s.boardLevel, 催化等级: s.catalystLevel,
      封单比: s.sealAmountRatio, 龙虎榜: s.dragonTiger ? '是' : '否',
      日期: s.timestamp,
    })), 'zt_pool_export.csv');
  };

  const capColor = (cap: number) => {
    const lv = getMarketCapLevel(cap);
    return lv === 'optimal' ? 'text-green-400' : lv === 'caution' ? 'text-yellow-400' : 'text-red-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🔥 涨停池初筛</h2>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={showFiltered} onChange={e => setShowFiltered(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500" />
            自动过滤(主板)
          </label>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            📥 CSV导入
          </button>
          <button onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            📤 CSV导出
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">代码</th>
                <th className="px-3 py-2 text-left">名称</th>
                <th className="px-3 py-2 text-left">封板时间</th>
                <th className="px-3 py-2 text-left">开板</th>
                <th className="px-3 py-2 text-left">市值(亿)</th>
                <th className="px-3 py-2 text-left">题材</th>
                <th className="px-3 py-2 text-left">连板</th>
                <th className="px-3 py-2 text-left">等级</th>
                <th className="px-3 py-2 text-left">封单比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {displayPool.map((s, i) => (
                <tr key={`${s.code}-${i}`} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-blue-400">{s.code}</td>
                  <td className="px-3 py-2 font-medium text-white">{s.name}</td>
                  <td className="px-3 py-2">
                    <span className={`font-mono ${s.sealTime <= '10:00' ? 'text-green-400' : s.sealTime <= '11:30' ? 'text-yellow-400' : s.sealTime <= '14:00' ? 'text-orange-400' : 'text-red-400'}`}>
                      {s.sealTime} {getSealTimeLevel(s.sealTime)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.openCount}次</td>
                  <td className={`px-3 py-2 font-mono ${capColor(s.marketCap)}`}>{s.marketCap}</td>
                  <td className="px-3 py-2 text-slate-300">{s.sector}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-300 text-xs font-bold">
                      {s.boardLevel}板
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      s.catalystLevel === 'S' ? 'bg-purple-900/50 text-purple-300' :
                      s.catalystLevel === 'A' ? 'bg-green-900/50 text-green-300' :
                      s.catalystLevel === 'B' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>{s.catalystLevel}级</span>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.sealAmountRatio ?? '-'}</td>
                </tr>
              ))}
              {displayPool.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 bg-slate-700/30 text-xs text-slate-400">
          共 {displayPool.length} 只 | 过滤掉ST/创业板/科创板/封板&gt;14:00
        </div>
      </div>
    </div>
  );
}
