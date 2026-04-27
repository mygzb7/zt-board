import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { filterZtPool, getSealTimeColor } from '../utils/constants';
import { ZtStock } from '../types';

// ---- 股票卡片 ----
interface StockCardProps {
  stock: ZtStock;
  highlighted: boolean;
  dimmed: boolean;
}

function StockCard({ stock, highlighted, dimmed }: StockCardProps) {
  const [showTip, setShowTip] = useState(false);
  const timeColor = getSealTimeColor(stock.sealTime);

  return (
    <div className="relative">
      <div
        className={`
          relative w-28 flex-shrink-0 rounded-lg border p-2.5 cursor-pointer
          transition-all duration-200
          ${highlighted
            ? 'bg-slate-700 border-yellow-400 shadow-lg shadow-yellow-900/30'
            : dimmed
            ? 'bg-slate-800 border-slate-700 opacity-40'
            : 'bg-slate-800 border-slate-600 hover:border-slate-500'
          }
        `}
        onMouseEnter={() => stock.openCount > 0 && setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {stock.openCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold px-1 rounded z-10">
            R
          </span>
        )}
        <div className="font-bold text-white text-sm leading-tight truncate" title={stock.name}>
          {stock.name}
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">{stock.sector}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`text-xs font-mono font-medium ${timeColor}`}>
            {stock.sealTime}
          </span>
          <span className={`text-xs font-bold ${
            (stock.changeRate ?? 0) >= 9.5 ? 'text-red-400' : 'text-slate-300'
          }`}>
            {stock.changeRate != null ? `${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}%` : ''}
          </span>
        </div>
        {stock.dragonTiger && (
          <div className="mt-1 text-[9px] bg-yellow-900/50 text-yellow-300 rounded px-1 inline-block">
            龙虎
          </div>
        )}
      </div>
      {showTip && stock.openCount > 0 && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 whitespace-nowrap shadow-xl pointer-events-none">
          开板{stock.openCount}次
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600" />
        </div>
      )}
    </div>
  );
}

// ---- 题材分组行 ----
interface SectorGroupRowProps {
  sector: string;
  stocks: ZtStock[];
  highlighted: boolean;
  dimmed: boolean;
}

function SectorGroupRow({ sector, stocks, highlighted, dimmed }: SectorGroupRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-16 flex-shrink-0">
        <span className="text-[10px] text-slate-500 leading-tight">{sector}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {stocks.map(stock => (
          <StockCard
            key={stock.code}
            stock={stock}
            highlighted={highlighted}
            dimmed={dimmed}
          />
        ))}
      </div>
    </div>
  );
}

// ---- 单层板 ----
interface LadderTierProps {
  level: number;
  stocks: ZtStock[];
  highlightedSector: string | null;
  dimmed: boolean;
}

function LadderTier({ level, stocks, highlightedSector, dimmed }: LadderTierProps) {
  const sectorGroups = useMemo(() => {
    const map = new Map<string, ZtStock[]>();
    stocks.forEach(s => {
      if (!map.has(s.sector)) map.set(s.sector, []);
      map.get(s.sector)!.push(s);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [stocks]);

  const totalCount = sectorGroups.reduce((acc, [, s]) => acc + s.length, 0);

  return (
    <div className="border-t-2 border-red-800/60 py-3">
      <div className="flex items-center gap-3 mb-2.5">
        <span className={`
          inline-flex items-center px-2.5 py-1 rounded text-xs font-black tracking-wide
          ${level >= 4 ? 'bg-red-700 text-white' : level >= 3 ? 'bg-red-900/70 text-red-200' : 'bg-slate-700 text-slate-300'}
        `}>
          {level}板
        </span>
        <span className="text-xs text-slate-500">
          共{totalCount}只
          {sectorGroups.length > 1 && ` · ${sectorGroups.length}个题材`}
        </span>
      </div>
      <div className="space-y-0.5">
        {sectorGroups.map(([sector, groupStocks]) => {
          const isHighlighted = highlightedSector === sector;
          const isDimmed = dimmed && !isHighlighted;
          return (
            <SectorGroupRow
              key={sector}
              sector={sector}
              stocks={groupStocks.sort((a, b) => {
                if (b.boardLevel !== a.boardLevel) return b.boardLevel - a.boardLevel;
                return a.sealTime.localeCompare(b.sealTime);
              })}
              highlighted={isHighlighted}
              dimmed={isDimmed}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---- 右侧板块统计面板 ----
interface SectorStatsPanelProps {
  stats: { sector: string; count: number; stocks: ZtStock[] }[];
  highlightedSector: string | null;
  onSelect: (s: string | null) => void;
}

function SectorStatsPanel({ stats, highlightedSector, onSelect }: SectorStatsPanelProps) {
  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-3 h-fit">
      <div className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
        <span>📊</span> 板块强度排名
      </div>
      <div className="space-y-1">
        {stats.map(({ sector, count, stocks }) => {
          const isActive = highlightedSector === sector;
          const totalBoards = Math.max(...stocks.map(s => s.boardLevel));
          return (
            <button
              key={sector}
              onClick={() => onSelect(isActive ? null : sector)}
              className={`
                w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg
                transition-all duration-150 text-sm
                ${isActive
                  ? 'bg-yellow-900/50 border border-yellow-600/60 text-yellow-200'
                  : 'hover:bg-slate-700/60 text-slate-300 border border-transparent'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-yellow-400' : 'bg-slate-600'}`} />
                <span className="truncate max-w-[120px]">{sector}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-bold ${isActive ? 'text-yellow-300' : 'text-slate-400'}`}>
                  {count}
                </span>
                {totalBoards >= 3 && (
                  <span className="text-[9px] bg-red-900/50 text-red-300 rounded px-1">
                    {totalBoards}板
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {highlightedSector && (
        <button
          onClick={() => onSelect(null)}
          className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 text-center py-1 border border-slate-700 rounded"
        >
          清除高亮
        </button>
      )}
    </div>
  );
}

// ---- 主组件 ----
export default function BoardingTiers() {
  const { ztPool } = useApp();
  const filtered = filterZtPool(ztPool);

  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [highlightedSector, setHighlightedSector] = useState<string | null>(null);
  const [firstBoardCollapsed, setFirstBoardCollapsed] = useState(true);

  const allSectors = useMemo(() => {
    return Array.from(new Set(filtered.map(s => s.sector))).sort();
  }, [filtered]);

  const displayStocks = useMemo(() => {
    if (selectedSectors.length === 0) return filtered;
    return filtered.filter(s => selectedSectors.includes(s.sector));
  }, [filtered, selectedSectors]);

  const tiersAboveOne = useMemo(() => {
    const map = new Map<number, ZtStock[]>();
    displayStocks.forEach(s => {
      if (s.boardLevel <= 1) return;
      if (!map.has(s.boardLevel)) map.set(s.boardLevel, []);
      map.get(s.boardLevel)!.push(s);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .filter(([, stocks]) => stocks.length > 0);
  }, [displayStocks]);

  const firstBoardStocks = useMemo(() => {
    return displayStocks.filter(s => s.boardLevel === 1);
  }, [displayStocks]);

  const sectorStats = useMemo(() => {
    const map = new Map<string, ZtStock[]>();
    displayStocks.forEach(s => {
      if (!map.has(s.sector)) map.set(s.sector, []);
      map.get(s.sector)!.push(s);
    });
    return Array.from(map.entries())
      .map(([sector, stocks]) => ({ sector, count: stocks.length, stocks }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return Math.max(...b.stocks.map(s => s.boardLevel)) - Math.max(...a.stocks.map(s => s.boardLevel));
      });
  }, [displayStocks]);

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">🏆 连板梯队天梯图</h2>

      {/* 题材筛选 */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-400">题材筛选：</span>
        <div className="flex flex-wrap gap-1.5">
          {allSectors.map(sector => {
            const active = selectedSectors.includes(sector);
            return (
              <button
                key={sector}
                onClick={() => toggleSector(sector)}
                className={`
                  text-xs px-2 py-0.5 rounded border transition-all
                  ${active
                    ? 'bg-blue-900/50 border-blue-500 text-blue-200'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                  }
                `}
              >
                {sector}
              </button>
            );
          })}
        </div>
        {selectedSectors.length > 0 && (
          <button
            onClick={() => setSelectedSectors([])}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-0.5 border border-slate-700 rounded"
          >
            清除
          </button>
        )}
      </div>

      {/* 主内容：75%天梯 + 25%统计面板 */}
      <div className="flex gap-4 items-start">
        {/* 天梯图 */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-4">
            {tiersAboveOne.map(([level, stocks]) => (
              <LadderTier
                key={level}
                level={level}
                stocks={stocks}
                highlightedSector={highlightedSector}
                dimmed={!!highlightedSector}
              />
            ))}

            {tiersAboveOne.length === 0 && firstBoardStocks.length === 0 && (
              <div className="text-center text-slate-500 py-12">暂无连板数据</div>
            )}

            {/* 首板折叠区 */}
            {firstBoardStocks.length > 0 && (
              <div className="border-t-2 border-slate-700/60 pt-3 mt-1">
                <button
                  onClick={() => setFirstBoardCollapsed(c => !c)}
                  className="w-full flex items-center justify-between px-1 py-2 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs font-black">
                      首板
                    </span>
                    <span className="text-xs text-slate-500">
                      共<span className="text-slate-300 font-medium">{firstBoardStocks.length}</span>只
                      · <span className="text-slate-400">{sectorStats.length}</span>个题材
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {firstBoardCollapsed ? '▶ 点击展开' : '▼ 点击收起'}
                  </span>
                </button>

                {!firstBoardCollapsed && (
                  <div className="space-y-0.5 mt-1">
                    {sectorStats
                      .map(({ sector, stocks }) => ({
                        sector,
                        stocks: stocks.filter(s => s.boardLevel === 1),
                      }))
                      .filter(g => g.stocks.length > 0)
                      .sort((a, b) => b.stocks.length - a.stocks.length)
                      .map(({ sector, stocks }) => {
                        const isHighlighted = highlightedSector === sector;
                        const isDimmed = !!highlightedSector && !isHighlighted;
                        return (
                          <SectorGroupRow
                            key={sector}
                            sector={sector}
                            stocks={stocks.sort((a, b) => a.sealTime.localeCompare(b.sealTime))}
                            highlighted={isHighlighted}
                            dimmed={isDimmed}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧统计面板 */}
        <div className="w-56 flex-shrink-0">
          <SectorStatsPanel
            stats={sectorStats}
            highlightedSector={highlightedSector}
            onSelect={setHighlightedSector}
          />
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="font-semibold">图例：</span>
        <span className="flex items-center gap-1">
          <span className="text-red-400">红色时间</span> ≤10:30
        </span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-400">黄色时间</span> 10:30-13:00
        </span>
        <span className="flex items-center gap-1">
          <span className="text-slate-400">灰色时间</span> &gt;13:00
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-orange-600 text-white text-[9px] px-1 rounded">R</span> 开板过
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-yellow-900/50 text-yellow-300 text-[9px] px-1 rounded">龙虎</span> 上过龙虎榜
        </span>
      </div>
    </div>
  );
}
