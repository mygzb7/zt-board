import { useApp } from '../context/AppContext';
import { MarketScore } from '../types';
import { SENTIMENT_COLORS } from '../utils/constants';

const OPTIONS = [
  { label: '涨停家数', key: 'ztCount' as const },
  { label: '封板率', key: 'sealRate' as const },
  { label: '连板晋级率', key: 'boardRate' as const },
  { label: '上涨家数', key: 'upCount' as const },
  { label: '成交额', key: 'turnover' as const },
];

const LEVELS = ['strong', 'medium', 'weak', 'poor'] as const;
const LEVEL_LABELS = { strong: '强(3分)', medium: '中(2分)', weak: '弱(1分)', poor: '差(0分)' };

export default function MarketScoring() {
  const { marketScore, setMarketScore, marketMetrics } = useApp();

  const handleChange = (key: keyof MarketScore, value: 'strong' | 'medium' | 'weak' | 'poor') => {
    setMarketScore({ ...marketScore, [key]: value });
  };

  const sentimentKey = marketMetrics.sentiment;
  const sentimentBg = {
    '强共振': 'bg-green-500/20 border-green-500',
    '可做': 'bg-yellow-500/20 border-yellow-500',
    '谨慎': 'bg-orange-500/20 border-orange-500',
    '回避': 'bg-red-500/20 border-red-500',
  }[sentimentKey];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🎯 市场环境打分</h2>
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPTIONS.map(opt => (
            <div key={opt.key} className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{opt.label}</label>
              <select
                value={marketScore[opt.key]}
                onChange={e => handleChange(opt.key, e.target.value as 'strong' | 'medium' | 'weak' | 'poor')}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LEVELS.map(l => (
                  <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className={`mt-6 rounded-xl p-4 border-2 ${sentimentBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">综合评分</div>
              <div className="text-4xl font-bold text-white">{marketMetrics.totalScore} <span className="text-lg text-slate-400">/ 15</span></div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">情绪判定</div>
              <div className={`text-2xl font-bold ${SENTIMENT_COLORS[sentimentKey]}`}>{sentimentKey}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">仓位建议</div>
              <div className="text-2xl font-bold text-cyan-400">{marketMetrics.positionRatio}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500 space-y-1">
          <div>• 强(3分)：涨停≥70家 / 封板率≥80% / 连板晋级≥45% / 上涨&gt;3000家 / 成交≥1.5万亿</div>
          <div>• 中(2分)：涨停50-69 / 封板率70-80% / 连板晋级30-45% / 上涨2200-3000 / 成交1.0-1.5万亿</div>
          <div>• 弱(1分)：涨停40-49 / 封板率60-70% / 连板晋级20-30% / 上涨1500-2200 / 成交0.8-1.0万亿</div>
          <div>• 差(0分)：涨停&lt;40 / 封板率&lt;60% / 连板晋级&lt;20% / 上涨&lt;1500 / 成交&lt;0.8万亿</div>
        </div>
      </div>
    </div>
  );
}
