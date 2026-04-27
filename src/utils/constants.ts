import { ZtStock, ReviewRecord } from '../types';

export const DEFAULT_ZT_POOL: ZtStock[] = [
  {
    code: '600519', name: '贵州茅台', sealTime: '09:32', openCount: 0,
    marketCap: 85, sector: '白酒龙头', boardLevel: 1, catalystLevel: 'A',
    sealAmountRatio: 12.5, dragonTiger: false, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '000858', name: '五粮液', sealTime: '09:41', openCount: 1,
    marketCap: 68, sector: '白酒龙头', boardLevel: 1, catalystLevel: 'A',
    sealAmountRatio: 8.2, dragonTiger: false, timestamp: '2026-04-27', changeRate: 9.5,
  },
  {
    code: '600036', name: '招商银行', sealTime: '10:15', openCount: 0,
    marketCap: 95, sector: '金融科技', boardLevel: 2, catalystLevel: 'B',
    sealAmountRatio: 6.8, dragonTiger: false, timestamp: '2026-04-27', changeRate: 5.2,
  },
  {
    code: '000725', name: '京东方A', sealTime: '09:25', openCount: 0,
    marketCap: 52, sector: 'AI算力', boardLevel: 3, catalystLevel: 'S',
    sealAmountRatio: 15.3, dragonTiger: true, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '002230', name: '科大讯飞', sealTime: '09:38', openCount: 1,
    marketCap: 78, sector: 'AI算力', boardLevel: 2, catalystLevel: 'A',
    sealAmountRatio: 9.1, dragonTiger: true, timestamp: '2026-04-27', changeRate: 9.8,
  },
  {
    code: '600588', name: '用友网络', sealTime: '10:22', openCount: 2,
    marketCap: 45, sector: 'AI算力', boardLevel: 1, catalystLevel: 'B',
    sealAmountRatio: 5.4, dragonTiger: false, timestamp: '2026-04-27', changeRate: 8.3,
  },
  {
    code: '000977', name: '浪潮信息', sealTime: '09:35', openCount: 0,
    marketCap: 62, sector: 'AI算力', boardLevel: 3, catalystLevel: 'A',
    sealAmountRatio: 11.2, dragonTiger: true, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '603986', name: '兆易创新', sealTime: '13:45', openCount: 3,
    marketCap: 120, sector: '半导体', boardLevel: 1, catalystLevel: 'B',
    sealAmountRatio: 3.2, dragonTiger: false, timestamp: '2026-04-27', changeRate: 5.1,
  },
  {
    code: '688041', name: '寒武纪', sealTime: '14:15', openCount: 2,
    marketCap: 180, sector: 'AI算力', boardLevel: 1, catalystLevel: 'C',
    sealAmountRatio: 2.1, dragonTiger: false, timestamp: '2026-04-27', changeRate: 3.2,
  },
  {
    code: '000001', name: '平安银行', sealTime: '10:05', openCount: 0,
    marketCap: 55, sector: '金融科技', boardLevel: 2, catalystLevel: 'B',
    sealAmountRatio: 7.5, dragonTiger: false, timestamp: '2026-04-27', changeRate: 6.8,
  },
  {
    code: '300059', name: '东方财富', sealTime: '09:50', openCount: 1,
    marketCap: 110, sector: '金融科技', boardLevel: 1, catalystLevel: 'A',
    sealAmountRatio: 6.9, dragonTiger: true, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '601012', name: '隆基绿能', sealTime: '11:20', openCount: 0,
    marketCap: 48, sector: '新能源', boardLevel: 4, catalystLevel: 'S',
    sealAmountRatio: 14.8, dragonTiger: true, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '600900', name: '长江电力', sealTime: '10:30', openCount: 0,
    marketCap: 72, sector: '新能源', boardLevel: 1, catalystLevel: 'B',
    sealAmountRatio: 5.6, dragonTiger: false, timestamp: '2026-04-27', changeRate: 4.5,
  },
  {
    code: '600745', name: '闻泰科技', sealTime: '13:25', openCount: 1,
    marketCap: 88, sector: '半导体', boardLevel: 2, catalystLevel: 'A',
    sealAmountRatio: 7.3, dragonTiger: true, timestamp: '2026-04-27', changeRate: 6.2,
  },
  {
    code: '002049', name: '紫光国微', sealTime: '09:55', openCount: 0,
    marketCap: 58, sector: '半导体', boardLevel: 3, catalystLevel: 'A',
    sealAmountRatio: 10.5, dragonTiger: false, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '300001', name: '宁德时代', sealTime: '10:10', openCount: 1,
    marketCap: 150, sector: '新能源', boardLevel: 1, catalystLevel: 'A',
    sealAmountRatio: 8.8, dragonTiger: false, timestamp: '2026-04-27', changeRate: 7.3,
  },
  {
    code: '600050', name: '中国联通', sealTime: '09:40', openCount: 0,
    marketCap: 38, sector: 'AI算力', boardLevel: 1, catalystLevel: 'A',
    sealAmountRatio: 9.4, dragonTiger: false, timestamp: '2026-04-27', changeRate: 9.6,
  },
  {
    code: '000063', name: '中兴通讯', sealTime: '10:02', openCount: 1,
    marketCap: 88, sector: 'AI算力', boardLevel: 2, catalystLevel: 'A',
    sealAmountRatio: 8.7, dragonTiger: true, timestamp: '2026-04-27', changeRate: 9.1,
  },
  {
    code: '601666', name: '平煤股份', sealTime: '09:58', openCount: 0,
    marketCap: 28, sector: 'AI算力', boardLevel: 1, catalystLevel: 'B',
    sealAmountRatio: 7.2, dragonTiger: false, timestamp: '2026-04-27', changeRate: 8.8,
  },
  {
    code: '002371', name: '北方华创', sealTime: '10:08', openCount: 0,
    marketCap: 95, sector: '半导体', boardLevel: 2, catalystLevel: 'A',
    sealAmountRatio: 11.3, dragonTiger: false, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '603160', name: '汇顶科技', sealTime: '13:10', openCount: 1,
    marketCap: 42, sector: '半导体', boardLevel: 1, catalystLevel: 'B',
    sealAmountRatio: 4.8, dragonTiger: false, timestamp: '2026-04-27', changeRate: 4.2,
  },
  {
    code: '600703', name: '三安光电', sealTime: '09:52', openCount: 0,
    marketCap: 65, sector: '光学光电', boardLevel: 3, catalystLevel: 'A',
    sealAmountRatio: 12.1, dragonTiger: true, timestamp: '2026-04-27', changeRate: 10.0,
  },
  {
    code: '002456', name: '欧菲光', sealTime: '10:18', openCount: 2,
    marketCap: 38, sector: '光学光电', boardLevel: 2, catalystLevel: 'B',
    sealAmountRatio: 6.5, dragonTiger: false, timestamp: '2026-04-27', changeRate: 8.4,
  },
  {
    code: '300136', name: '信维通信', sealTime: '11:05', openCount: 0,
    marketCap: 32, sector: '光学光电', boardLevel: 1, catalystLevel: 'B',
    sealAmountRatio: 5.9, dragonTiger: false, timestamp: '2026-04-27', changeRate: 6.7,
  },
  {
    code: '600398', name: '海澜之家', sealTime: '09:48', openCount: 0,
    marketCap: 18, sector: '服装家纺', boardLevel: 1, catalystLevel: 'C',
    sealAmountRatio: 4.2, dragonTiger: false, timestamp: '2026-04-27', changeRate: 3.5,
  },
  {
    code: '002154', name: '报喜鸟', sealTime: '10:25', openCount: 1,
    marketCap: 12, sector: '服装家纺', boardLevel: 1, catalystLevel: 'C',
    sealAmountRatio: 3.8, dragonTiger: false, timestamp: '2026-04-27', changeRate: 2.8,
  },
  {
    code: '603518', name: '锦泓集团', sealTime: '13:35', openCount: 0,
    marketCap: 8, sector: '服装家纺', boardLevel: 1, catalystLevel: 'C',
    sealAmountRatio: 2.9, dragonTiger: false, timestamp: '2026-04-27', changeRate: 1.5,
  },
];

export const SCORE_LABELS = {
  strong: '强',
  medium: '中',
  weak: '弱',
  poor: '差',
};

export const SENTIMENT_COLORS = {
  '强共振': 'text-green-400',
  '可做': 'text-yellow-400',
  '谨慎': 'text-orange-400',
  '回避': 'text-red-400',
};

export function filterZtPool(pool: ZtStock[]): ZtStock[] {
  return pool.filter(s => {
    if (s.name.includes('ST')) return false;
    if (s.code.startsWith('300')) return false;
    if (s.code.startsWith('688')) return false;
    if (!s.code.startsWith('600') && !s.code.startsWith('000') && !s.code.startsWith('001')) return false;
    if (s.sealTime > '14:00') return false;
    return true;
  });
}

export function getSealTimeLevel(time: string): '⭐⭐⭐' | '⭐⭐' | '⭐' | '❌' {
  if (time <= '10:00') return '⭐⭐⭐';
  if (time <= '11:30') return '⭐⭐';
  if (time <= '14:00') return '⭐';
  return '❌';
}

export function getSealTimeColor(time: string): string {
  if (time <= '10:30') return 'text-red-400';
  if (time <= '13:00') return 'text-yellow-400';
  return 'text-slate-400';
}

export function getMarketCapLevel(cap: number): 'optimal' | 'caution' | 'exclude' {
  if (cap >= 20 && cap <= 100) return 'optimal';
  if (cap > 100 && cap <= 200) return 'caution';
  return 'exclude';
}

export function exportToCSV<T extends Record<string, unknown>>(records: T[], filename: string) {
  if (records.length === 0) return;
  const headers = Object.keys(records[0]);
  const csv = [
    headers.join(','),
    ...records.map(r => headers.map(h => {
      const v = r[h];
      const str = String(v ?? '');
      return str.includes(',') ? `"${str}"` : str;
    }).join(','))
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { resolve([]); return; }
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const records = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => obj[h] = values[i] ?? '');
          return obj;
        });
        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
