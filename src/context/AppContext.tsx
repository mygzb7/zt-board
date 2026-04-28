import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ZtStock, MarketScore, MarketMetrics, ReviewRecord, SectorAnalysis } from '../types';
import { DEFAULT_ZT_POOL } from '../utils/constants';

// 昨日真实市场数据（2026-04-27，用户确认数据）
// 今日市场概况（2026-04-28：上证-0.19% / 深证-1.1%，成交约7550亿）
const REAL_MARKET_METRICS: MarketMetrics = {
  totalScore: 14,
  sentiment: '谨慎',
  positionRatio: 20,
  ztCount: 60,
  sealRate: 85, // %（85%首板封死）
  boardRate: 20, // %
  upCount: 1698,
  turnover: '2.54万亿',
};

interface AppState {
  ztPool: ZtStock[];
  marketScore: MarketScore;
  marketMetrics: MarketMetrics;
  reviewRecords: ReviewRecord[];
  sectorAnalysis: SectorAnalysis[];
}

interface AppContextType extends AppState {
  setZtPool: (pool: ZtStock[]) => void;
  setMarketScore: (score: MarketScore) => void;
  addReviewRecord: (record: ReviewRecord) => void;
  deleteReviewRecord: (id: string) => void;
  updateReviewRecord: (record: ReviewRecord) => void;
  importZtPool: (data: ZtStock[]) => void;
  importReviewRecords: (records: ReviewRecord[]) => void;
}

const defaultMarketScore: MarketScore = {
  ztCount: 'medium',
  sealRate: 'medium',
  boardRate: 'medium',
  upCount: 'medium',
  turnover: 'medium',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_ZT_POOL = 'zt_board_pool';
const STORAGE_KEY_MARKET_SCORE = 'zt_board_market_score';
const STORAGE_KEY_REVIEW_RECORDS = 'zt_board_review_records';

function calcMarketMetrics(score: MarketScore): MarketMetrics {
  const scoreMap: Record<string, number> = { strong: 3, medium: 2, weak: 1, poor: 0 };
  const totalScore = Object.values(score).reduce((sum, v) => sum + (scoreMap[v] ?? 0), 0);

  let sentiment: MarketMetrics['sentiment'] = '回避';
  let positionRatio = 0;
  if (totalScore >= 13) { sentiment = '强共振'; positionRatio = 50; }
  else if (totalScore >= 10) { sentiment = '可做'; positionRatio = 30; }
  else if (totalScore >= 7) { sentiment = '谨慎'; positionRatio = 15; }

  const ztCountMap = { strong: 75, medium: 55, weak: 45, poor: 35 };
  const sealRateMap = { strong: 82, medium: 75, weak: 65, poor: 55 };
  const boardRateMap = { strong: 48, medium: 35, weak: 25, poor: 15 };
  const upCountMap = { strong: 3200, medium: 2500, weak: 1800, poor: 1200 };
  const turnoverMap = { strong: '1.6万亿', medium: '1.2万亿', weak: '0.9万亿', poor: '0.7万亿' };

  return {
    totalScore,
    sentiment,
    positionRatio,
    ztCount: ztCountMap[score.ztCount],
    sealRate: sealRateMap[score.sealRate],
    boardRate: boardRateMap[score.boardRate],
    upCount: upCountMap[score.upCount],
    turnover: turnoverMap[score.turnover],
  };
}

function calcSectorAnalysis(pool: ZtStock[]): SectorAnalysis[] {
  const map = new Map<string, number>();
  pool.forEach(s => map.set(s.sector, (map.get(s.sector) || 0) + 1));
  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
      level: (count >= 5 ? '主线' : count >= 3 ? '支线' : '一日游') as SectorAnalysis['level'],
    }))
    .sort((a, b) => b.count - a.count);
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  // 始终使用 DEFAULT_ZT_POOL（由爬虫每日更新），避免 localStorage 缓存导致数据过期
  const [ztPool, setZtPoolState] = useState<ZtStock[]>(DEFAULT_ZT_POOL);
  const [marketScore, setMarketScoreState] = useState<MarketScore>(() =>
    loadFromStorage<MarketScore>(STORAGE_KEY_MARKET_SCORE, defaultMarketScore)
  );
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>(() =>
    loadFromStorage<ReviewRecord[]>(STORAGE_KEY_REVIEW_RECORDS, [])
  );

  // 首次加载显示真实数据（84涨停/2.6万亿），用户可自行调整
  // 始终使用 REAL_MARKET_METRICS（由爬虫每日更新），避免 localStorage 缓存导致数据过期
  const marketMetrics = REAL_MARKET_METRICS;
  const sectorAnalysis = calcSectorAnalysis(ztPool);

  const setZtPool = (pool: ZtStock[]) => {
    setZtPoolState(pool);
    saveToStorage(STORAGE_KEY_ZT_POOL, pool);
  };

  const setMarketScore = (score: MarketScore) => {
    setMarketScoreState(score);
    saveToStorage(STORAGE_KEY_MARKET_SCORE, score);
  };

  const addReviewRecord = (record: ReviewRecord) => {
    const updated = [record, ...reviewRecords];
    setReviewRecords(updated);
    saveToStorage(STORAGE_KEY_REVIEW_RECORDS, updated);
  };

  const deleteReviewRecord = (id: string) => {
    const updated = reviewRecords.filter(r => r.id !== id);
    setReviewRecords(updated);
    saveToStorage(STORAGE_KEY_REVIEW_RECORDS, updated);
  };

  const updateReviewRecord = (record: ReviewRecord) => {
    const updated = reviewRecords.map(r => r.id === record.id ? record : r);
    setReviewRecords(updated);
    saveToStorage(STORAGE_KEY_REVIEW_RECORDS, updated);
  };

  const importZtPool = (data: ZtStock[]) => {
    setZtPool(data);
  };

  const importReviewRecords = (records: ReviewRecord[]) => {
    setReviewRecords(records);
    saveToStorage(STORAGE_KEY_REVIEW_RECORDS, records);
  };

  return (
    <AppContext.Provider value={{
      ztPool, marketScore, marketMetrics, reviewRecords, sectorAnalysis,
      setZtPool, setMarketScore, addReviewRecord, deleteReviewRecord, updateReviewRecord,
      importZtPool, importReviewRecords,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
