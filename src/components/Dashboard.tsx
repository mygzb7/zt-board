import { useApp } from '../context/AppContext';
import { SENTIMENT_COLORS } from '../utils/constants';

export default function Dashboard() {
  const { marketMetrics } = useApp();

  const kpis = [
    { label: '市场打分', value: `${marketMetrics.totalScore}/15`, sub: marketMetrics.sentiment, color: 'text-white', hasSentiment: true },
    { label: '涨停家数', value: marketMetrics.ztCount, sub: '家', color: 'text-red-400', hasSentiment: false },
    { label: '封板率', value: `${marketMetrics.sealRate}%`, sub: '', color: 'text-green-400', hasSentiment: false },
    { label: '连板晋级率', value: `${marketMetrics.boardRate}%`, sub: '', color: 'text-blue-400', hasSentiment: false },
    { label: '上涨家数', value: marketMetrics.upCount, sub: '家', color: 'text-yellow-400', hasSentiment: false },
    { label: '成交额', value: marketMetrics.turnover, sub: '', color: 'text-purple-400', hasSentiment: false },
    { label: '仓位建议', value: `${marketMetrics.positionRatio}%`, sub: '', color: 'text-cyan-400', hasSentiment: false },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">📊 今日市场概况</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-500 transition-colors">
            <div className="text-slate-400 text-sm mb-1">{k.label}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            {k.hasSentiment && <div className={`text-sm font-semibold mt-1 ${SENTIMENT_COLORS[marketMetrics.sentiment]}`}>{marketMetrics.sentiment}</div>}
            {k.sub && !k.hasSentiment && <div className="text-xs text-slate-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold mb-3 text-white">📌 仓位说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-300"><strong className="text-green-400">强共振(13-15分)</strong>：40-60%仓位，精选龙头</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-slate-300"><strong className="text-yellow-400">可做(10-12分)</strong>：20-40%仓位，半仓操作</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-slate-300"><strong className="text-orange-400">谨慎(7-9分)</strong>：≤20%仓位，轻仓试错</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-300"><strong className="text-red-400">回避(≤6分)</strong>：0%仓位，空仓休息</span>
          </div>
        </div>
      </div>
    </div>
  );
}
