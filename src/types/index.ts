export interface ZtStock {
  code: string;       // 股票代码，如 "600519"
  name: string;       // 股票名称
  sealTime: string;   // 封板时间，如 "09:35"
  openCount: number;  // 开板次数
  marketCap: number;  // 流通市值（亿元）
  sector: string;    // 题材板块
  boardLevel: number; // 连板高度 1-5
  catalystLevel: 'S' | 'A' | 'B' | 'C'; // 题材催化等级
  sealAmountRatio?: number; // 封单金额/成交额比
  dragonTiger?: boolean; // 是否上龙虎榜
  timestamp: string;  // 数据日期 YYYY-MM-DD
  changeRate?: number; // 当日涨跌幅（%）
}

export interface MarketScore {
  ztCount: 'strong' | 'medium' | 'weak' | 'poor';
  sealRate: 'strong' | 'medium' | 'weak' | 'poor';
  boardRate: 'strong' | 'medium' | 'weak' | 'poor';
  upCount: 'strong' | 'medium' | 'weak' | 'poor';
  turnover: 'strong' | 'medium' | 'weak' | 'poor';
}

export interface MarketMetrics {
  totalScore: number;
  sentiment: '强共振' | '可做' | '谨慎' | '回避';
  positionRatio: number;
  ztCount: number;
  sealRate: number;
  boardRate: number;
  upCount: number;
  turnover: string;
}

export interface SectorAnalysis {
  name: string;
  count: number;
  level: '主线' | '支线' | '一日游';
}

export interface BoardingTier {
  sector: string;
  stocks: ZtStock[];
}

export interface StockFilter {
  marketCapMin?: number;
  marketCapMax?: number;
  sealTimeMax?: string;
  catalystLevels: ('S' | 'A' | 'B')[];
  dragonTigerOnly: boolean;
  minSealAmountRatio?: number;
}

export interface ReviewRecord {
  id: string;
  code: string;
  name: string;
  firstSealTime: string;
  openCount: number;
  catalystLevel: 'S' | 'A' | 'B' | 'C';
  sealAmountRatio: number;
  notes: string;
  date: string;
}
