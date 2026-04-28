#!/usr/bin/env python3
"""
A股涨停板数据抓取脚本
抓取 → 保存 JSON → 更新 TypeScript 常量
"""
import json
import datetime
import os
import warnings
warnings.filterwarnings('ignore')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

try:
    import akshare as ak
    import pandas as pd
    HAS_AKSHARE = True
except ImportError:
    HAS_AKSHARE = False
    print("❌ 请先安装 akshare: pip install akshare pandas")

try:
    import tushare as ts
    HAS_TUSHARE = True
    TUSHARE_TOKEN = os.environ.get('TUSHARE_TOKEN', '8d0f3ef0eb327423c77b277886d8b5a22e65b6c1a1011735a63e7eca')
except ImportError:
    HAS_TUSHARE = False
    print("❌ 请先安装 tushare: pip install tushare --break-system-packages")

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


def get_zt_pool_today() -> list[dict]:
    """获取今日涨停板数据(主板 + 中小板)，优先用 TuShare"""
    today = datetime.date.today().strftime("%Y%m%d")
    print(f"📅 抓取日期: {today}")

    records = []
    source = ""

    # ===== 首选: TuShare pro.limit_list_d =====
    if HAS_TUSHARE:
        try:
            pro = ts.pro_api(TUSHARE_TOKEN)
            df_lim = pro.limit_list_d(trade_date=today)
            zt_df = df_lim[df_lim['limit'] == 'U'].copy()
            print(f"📊 TuShare抓到 {len(zt_df)} 只涨停股(含所有板块)")

            for _, row in zt_df.iterrows():
                ts_code = str(row.get('ts_code', ''))
                code = ts_code.split('.')[0]  # 去掉 .SH/.SZ 后缀
                name = str(row.get('name', ''))

                if 'ST' in name or '*ST' in name:
                    continue
                if code.startswith('300') or code.startswith('301') or code.startswith('688'):
                    continue
                if not (code.startswith('600') or code.startswith('000') or
                        code.startswith('001') or code.startswith('002') or
                        code.startswith('003') or code.startswith('605') or
                        code.startswith('601')):
                    continue

                # first_time 格式: 092500 -> 09:25
                first_time = str(row.get('first_time', '09:30'))
                seal_time = first_time[:2] + ':' + first_time[2:4] if len(first_time) >= 4 else '09:30'
                if seal_time == '00:00' or seal_time == '':
                    seal_time = '09:30'

                open_count = int(row.get('open_times', 0)) if not pd.isna(row.get('open_times')) else 0

                # float_mv 单位是万元，转为亿元
                float_mv = float(row.get('float_mv', 50)) if not pd.isna(row.get('float_mv')) else 50.0
                market_cap = round(float_mv / 10000, 1)

                # fd_amount 封单资金，单位元，转为万元
                fd_amount = float(row.get('fd_amount', 0)) if not pd.isna(row.get('fd_amount')) else 0.0
                seal_ratio = round(fd_amount / 10000, 2)

                board_level = int(row.get('limit_times', 1)) if not pd.isna(row.get('limit_times')) else 1

                pct_chg = float(row.get('pct_chg', 10.0)) if not pd.isna(row.get('pct_chg')) else 10.0

                records.append({
                    'code': code,
                    'name': name,
                    'sealTime': seal_time,
                    'openCount': open_count,
                    'marketCap': market_cap,
                    'sector': str(row.get('industry', '未知')),
                    'boardLevel': board_level,
                    'catalystLevel': 'B',
                    'sealAmountRatio': seal_ratio,
                    'dragonTiger': False,
                    'timestamp': today,
                    'changeRate': round(pct_chg, 2),
                })

            source = "TuShare"
            print(f"✅ TuShare过滤后剩余 {len(records)} 只主板/中小板涨停股")
            return records
        except Exception as e:
            print(f"⚠️  TuShare涨停池失败: {e}, 尝试akshare...")

    # ===== fallback: akshare =====
    if HAS_AKSHARE:
        try:
            df = ak.stock_zt_pool_em(date=today)
            print(f"📊 akshare抓到 {len(df)} 只涨停股(含所有板块)")

            for _, row in df.iterrows():
                code = str(row.get('代码', ''))
                name = str(row.get('名称', ''))

                if 'ST' in name or '*ST' in name:
                    continue
                if code.startswith('300') or code.startswith('301') or code.startswith('688'):
                    continue
                if not (code.startswith('600') or code.startswith('000') or
                        code.startswith('001') or code.startswith('002') or
                        code.startswith('003') or code.startswith('605') or
                        code.startswith('601')):
                    continue

                seal_time_raw = row.get('首次封板时间', row.get('封板时间', '09:30'))
                seal_time = str(seal_time_raw)[:5] if seal_time_raw and not pd.isna(seal_time_raw) else '09:30'
                if seal_time == '000000' or seal_time == '':
                    seal_time = '09:30'

                open_count_raw = row.get('炸板次数', 0)
                open_count = int(open_count_raw) if open_count_raw and not pd.isna(open_count_raw) else 0

                mkt_cap_raw = row.get('流通市值', 50)
                market_cap = round(float(mkt_cap_raw) / 1e8, 1) if mkt_cap_raw and not pd.isna(mkt_cap_raw) else 50.0

                seal_ratio_raw = row.get('封板资金', 0)
                seal_ratio = round(float(seal_ratio_raw) / 10000, 2) if seal_ratio_raw and not pd.isna(seal_ratio_raw) else 0.0

                board_raw = row.get('连板数', 1)
                board_level = int(board_raw) if board_raw and not pd.isna(board_raw) else 1

                change_rate_raw = row.get('涨跌幅', 10.0)
                change_rate = round(float(change_rate_raw), 2) if change_rate_raw and not pd.isna(change_rate_raw) else 10.0

                records.append({
                    'code': code,
                    'name': name,
                    'sealTime': seal_time,
                    'openCount': open_count,
                    'marketCap': market_cap,
                    'sector': str(row.get('所属行业', '未知')),
                    'boardLevel': board_level,
                    'catalystLevel': 'B',
                    'sealAmountRatio': seal_ratio,
                    'dragonTiger': False,
                    'timestamp': today,
                    'changeRate': change_rate,
                })

            source = "akshare"
            print(f"✅ akshare过滤后剩余 {len(records)} 只主板/中小板涨停股")
            return records
        except Exception as e:
            print(f"⚠️  akshare涨停池失败: {e}")

    return records


def get_market_metrics_from_em() -> dict:
    """从东方财富API获取市场概况数据"""
    if not HAS_REQUESTS:
        return {}

    today = datetime.date.today().strftime("%Y%m%d")

    try:
        # f6字段是成交额（元），直接除以1e8得到成交额（亿）
        url = 'https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f12,f14,f3,f6&secids=1.000001,0.399001&ut=b2884a393a59ad64002292a3e90d46a5'
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        data = resp.json()
        
        total_turnover = 0.0
        sh_change = sz_change = 0.0
        
        for item in data.get('data', {}).get('diff', []):
            code = item.get('f12', '')
            f6 = float(item.get('f6', 0))  # f6 = 成交额（元）
            f3 = float(item.get('f3', 0))

            if code == '000001':
                total_turnover += f6 / 1e8  # 转换为亿元
                sh_change = f3
            elif code == '399001':
                total_turnover += f6 / 1e8  # 转换为亿元
                sz_change = f3
        
        if total_turnover > 10000:
            turnover_str = f'{round(total_turnover/10000, 2)}万亿'
        else:
            turnover_str = f'{round(total_turnover, 0)}亿'

        return {
            'ztCount': 60,
            'totalTurnover': turnover_str,
            'sealRate': '98%',
            'boardRate': '20%',
            'upCount': 2800,
            'date': today,
            'shChange': sh_change,
            'szChange': sz_change,
        }
    except Exception as e:
        print(f'⚠️  东方财富API失败: {e}')
        return {}


def get_market_metrics() -> dict:
    """获取今日市场概况数据（优先 TuShare，fallback akshare/东方财富）"""
    today = datetime.date.today().strftime("%Y%m%d")
    result = {
        'ztCount': 60,
        'totalTurnover': '0.8万亿',
        'sealRate': 85,
        'boardRate': 20,
        'upCount': 1500,
        'shChange': 0.0,
        'szChange': 0.0,
        'date': today,
    }

    # ===== 1. 成交额 + 指数涨跌：优先 TuShare index_daily =====
    turnover_from_tushare = False
    if HAS_TUSHARE:
        try:
            pro = ts.pro_api(TUSHARE_TOKEN)

            # 指数日线
            df_sh = pro.index_daily(ts_code='000001.SH', start_date=today, end_date=today)
            df_sz = pro.index_daily(ts_code='399001.SZ', start_date=today, end_date=today)

            if not df_sh.empty:
                result['shChange'] = round(float(df_sh.iloc[0]['pct_chg']), 2)
                # TuShare index_daily amount 单位是 千元 (千分之一元)
                # 验证: 上证正常约1.1万亿(1.1e12元) → amount约1.1e9
                sh_amount_raw = float(df_sh.iloc[0]['amount']) if not pd.isna(df_sh.iloc[0]['amount']) else 0
                sh_amount = sh_amount_raw * 1000 / 1e8  # 千元→元→亿元
            else:
                sh_amount = 0

            if not df_sz.empty:
                result['szChange'] = round(float(df_sz.iloc[0]['pct_chg']), 2)
                sz_amount_raw = float(df_sz.iloc[0]['amount']) if not pd.isna(df_sz.iloc[0]['amount']) else 0
                sz_amount = sz_amount_raw * 1000 / 1e8
            else:
                sz_amount = 0

            total_turnover = sh_amount + sz_amount
            # 验证合理性：正常A股日成交额0.5-3万亿(5000-30000亿)
            if total_turnover < 1000 or total_turnover > 50000:
                print(f"⚠️  TuShare成交额异常({total_turnover:.0f}亿)，使用东方财富API")
                raise ValueError(f"TuShare成交额异常: {total_turnover}")

            if total_turnover > 10000:
                result['totalTurnover'] = f'{round(total_turnover/10000, 2)}万亿'
            else:
                result['totalTurnover'] = f'{round(total_turnover, 0)}亿'
            print(f"📊 TuShare成交额: {result['totalTurnover']}")
            turnover_from_tushare = True
        except Exception as e:
            print(f"⚠️  TuShare指数数据失败: {e}")

    # fallback: 东方财富API获取成交额
    if not turnover_from_tushare and HAS_REQUESTS:
        try:
            url = 'https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f12,f14,f3,f6&secids=1.000001,0.399001&ut=b2884a393a59ad64002292a3e90d46a5'
            resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            data = resp.json()
            total_turnover = 0.0
            for item in data.get('data', {}).get('diff', []):
                code = item.get('f12', '')
                f6 = float(item.get('f6', 0))
                f3 = float(item.get('f3', 0))
                if code == '000001':
                    total_turnover += f6 / 1e8
                    result['shChange'] = f3
                elif code == '399001':
                    total_turnover += f6 / 1e8
                    result['szChange'] = f3
            if total_turnover > 10000:
                result['totalTurnover'] = f'{round(total_turnover/10000, 2)}万亿'
            else:
                result['totalTurnover'] = f'{round(total_turnover, 0)}亿'
            print(f"📊 东方财富成交额: {result['totalTurnover']}")
        except Exception as e:
            print(f"⚠️  东方财富API失败: {e}")

    # ===== 2. 涨停统计：优先 TuShare limit_list_d（过滤后仅主板/中小板）=====
    zt_stats_from_tushare = False
    if HAS_TUSHARE:
        try:
            pro = ts.pro_api(TUSHARE_TOKEN)
            df_lim = pro.limit_list_d(trade_date=today)
            zt_all = df_lim[df_lim['limit'] == 'U'].copy()

            # 过滤：排除ST、创业板300、科创板688，只保留主板/中小板
            def is_main_board(ts_code, name):
                code = str(ts_code).split('.')[0]
                if 'ST' in str(name) or '*ST' in str(name):
                    return False
                if code.startswith('300') or code.startswith('301') or code.startswith('688'):
                    return False
                if not (code.startswith('600') or code.startswith('000') or
                        code.startswith('001') or code.startswith('002') or
                        code.startswith('003') or code.startswith('605') or
                        code.startswith('601')):
                    return False
                return True

            zt_all['is_main'] = zt_all.apply(lambda r: is_main_board(r['ts_code'], r['name']), axis=1)
            zt = zt_all[zt_all['is_main'] == True]

            result['ztCount'] = len(zt)

            # 封板率：open_times=0 表示封死未开板
            still_sealed = len(zt[zt['open_times'] == 0])
            result['sealRate'] = round(still_sealed / max(len(zt), 1) * 100, 0)

            # 连板率：limit_times > 1
            board_count = len(zt[zt['limit_times'] > 1])
            result['boardRate'] = round(board_count / max(len(zt), 1) * 100, 0)
            print(f"📊 TuShare涨停统计(主板): {len(zt)}只, 封板率{result['sealRate']}%, 连板率{result['boardRate']}%")
            zt_stats_from_tushare = True
        except Exception as e:
            print(f"⚠️  TuShare涨停统计失败: {e}")

    # fallback: akshare涨停池（同样过滤）
    if not zt_stats_from_tushare and HAS_AKSHARE:
        try:
            df = ak.stock_zt_pool_em(date=today)

            # 过滤：与 get_zt_pool_today() 保持一致
            def is_main_board_ak(row):
                code = str(row.get('代码', ''))
                name = str(row.get('名称', ''))
                if 'ST' in name or '*ST' in name:
                    return False
                if code.startswith('300') or code.startswith('301') or code.startswith('688'):
                    return False
                if not (code.startswith('600') or code.startswith('000') or
                        code.startswith('001') or code.startswith('002') or
                        code.startswith('003') or code.startswith('605') or
                        code.startswith('601')):
                    return False
                return True

            df['is_main'] = df.apply(is_main_board_ak, axis=1)
            zt = df[df['is_main'] == True]

            result['ztCount'] = len(zt)

            still_sealed = 0
            total_seals = 0
            for _, row in zt.iterrows():
                stat = row.get('涨停统计', '')
                parts = str(stat).split('/')
                if len(parts) == 2:
                    sealed = int(parts[0])
                    total = int(parts[1])
                    if sealed == total:
                        still_sealed += 1
                    total_seals += 1
            result['sealRate'] = round(still_sealed / max(total_seals, 1) * 100, 0)

            board_count = len(zt[zt['连板数'] > 1])
            result['boardRate'] = round(board_count / max(len(zt), 1) * 100, 0)
            print(f"📊 akshare涨停统计(主板): {len(zt)}只")
        except Exception as e:
            print(f"⚠️  akshare涨停统计失败: {e}")

    # ===== 3. 上涨家数：优先 TuShare pro.daily() =====
    up_count_from_tushare = False
    if HAS_TUSHARE:
        try:
            pro = ts.pro_api(TUSHARE_TOKEN)
            df_daily = pro.daily(trade_date=today)
            up_count = len(df_daily[df_daily['pct_chg'] > 0])
            result['upCount'] = up_count
            print(f"📊 TuShare上涨家数: {up_count}")
            up_count_from_tushare = True
        except Exception as e:
            print(f"⚠️  TuShare上涨家数失败: {e}")

    # fallback: 用东方财富 API 获取涨跌家数
    if not up_count_from_tushare and HAS_REQUESTS:
        try:
            # 东方财富涨跌家数API
            url = 'https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fields=f170,f171,f172,f173,f177&ut=b2884a393a59ad64002292a3e90d46a5'
            resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            data = resp.json()
            if data.get('data'):
                # f170=上涨家数, f171=平盘家数, f172=下跌家数
                up = int(data['data'].get('f170', 0))
                if up > 0:
                    result['upCount'] = up
                    print(f"📊 东方财富上涨家数: {up}")
                    up_count_from_tushare = True
        except Exception as e:
            print(f"⚠️  东方财富上涨家数失败: {e}")

    # 最终 fallback: 用指数变化估算
    if not up_count_from_tushare:
        if result['szChange'] < -0.5:
            result['upCount'] = 1500
        elif result['szChange'] < 0:
            result['upCount'] = 2000
        else:
            result['upCount'] = 2500
        print(f"📊 估算上涨家数: {result['upCount']}")

    print(f"📊 市场概况: 涨停{result['ztCount']}只 | 成交{result['totalTurnover']} | "
          f"封板率{result['sealRate']}% | 连板率{result['boardRate']}% | "
          f"上涨{result['upCount']} | 上证{result['shChange']}% | 深证{result['szChange']}%")
    return result


def save_to_json(data: list, filepath: str):
    """保存到JSON文件"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 数据已保存到 {filepath}")


def save_market_metrics(metrics: dict, filepath: str):
    """保存市场概况到 JSON"""
    if not metrics:
        return
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)
    print(f"✅ 市场概况已保存: {filepath}")


def update_typescript_constants(data: list):
    """直接更新 TypeScript constants.ts（含股票数据 + 工具函数）"""
    ts_path = os.path.join(PROJECT_ROOT, "src", "utils", "constants.ts")

    lines = [
        "import { ZtStock } from '../types';",
        "",
        "export const DEFAULT_ZT_POOL: ZtStock[] = [",
    ]
    for s in data:
        lines.append("  {")
        lines.append(f"    code: '{s['code']}', name: '{s['name']}', sealTime: '{s['sealTime']}', openCount: {s['openCount']},")
        lines.append(f"    marketCap: {s['marketCap']}, sector: '{s['sector']}', boardLevel: {s['boardLevel']}, catalystLevel: '{s['catalystLevel']}' as const,")
        lines.append(f"    sealAmountRatio: {s['sealAmountRatio']}, dragonTiger: {str(s['dragonTiger']).lower()}, timestamp: '{s['timestamp']}',")
        lines.append(f"    changeRate: {s['changeRate']},")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    lines.append("// ===== 工具函数 =====")
    lines.append("export function filterZtPool(pool: ZtStock[]): ZtStock[] {")
    lines.append("  return pool.filter(s => {")
    lines.append("    if (s.name.includes('ST') || s.name.includes('*ST')) return false;")
    lines.append("    if (s.code.startsWith('300') || s.code.startsWith('688')) return false;")
    lines.append("    return true;")
    lines.append("  });")
    lines.append("}")
    lines.append("")
    lines.append("export function getSealTimeLevel(sealTime: string): string {")
    lines.append("  if (sealTime <= '09:30') return '🔥一字';")
    lines.append("  if (sealTime <= '10:00') return '⚡早板';")
    lines.append("  if (sealTime <= '11:30') return '📌午前';")
    lines.append("  return '🔴午后';")
    lines.append("}")
    lines.append("")
    lines.append("export function getMarketCapLevel(cap: number): 'optimal' | 'caution' | 'risky' {")
    lines.append("  if (cap <= 100) return 'optimal';")
    lines.append("  if (cap <= 300) return 'caution';")
    lines.append("  return 'risky';")
    lines.append("}")
    lines.append("")
    lines.append("export function getSealTimeColor(sealTime: string): string {")
    lines.append("  if (sealTime <= '09:30') return 'text-green-400';")
    lines.append("  if (sealTime <= '10:00') return 'text-lime-400';")
    lines.append("  if (sealTime <= '11:30') return 'text-yellow-400';")
    lines.append("  if (sealTime <= '13:00') return 'text-orange-400';")
    lines.append("  return 'text-red-400';")
    lines.append("}")
    lines.append("")
    lines.append("export const SENTIMENT_COLORS: Record<string, string> = {")
    lines.append("  '强共振': 'text-red-400',")
    lines.append("  '可做': 'text-green-400',")
    lines.append("  '谨慎': 'text-yellow-400',")
    lines.append("  '回避': 'text-slate-500',")
    lines.append("};")
    lines.append("")
    lines.append("export async function importFromCSV(file: File): Promise<Record<string, string>[]> {")
    lines.append("  const text = await file.text();")
    lines.append("  const lines = text.trim().split('\\n');")
    lines.append("  if (lines.length < 2) return [];")
    lines.append("  const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));")
    lines.append("  return lines.slice(1).map(line => {")
    lines.append("    const values = line.split(',').map(v => v.trim().replace(/^\"|\"$/g, ''));")
    lines.append("    const row: Record<string, string> = {};")
    lines.append("    headers.forEach((h, i) => { row[h] = values[i] || ''; });")
    lines.append("    return row;")
    lines.append("  });")
    lines.append("}")
    lines.append("")
    lines.append("export function exportToCSV(stocks: Record<string, unknown>[], filename?: string): void {")
    lines.append("  const headers = ['代码', '名称', '封板时间', '开板次数', '市值(亿)', '题材', '连板', '催化', '封单比', '龙虎榜', '日期'];")
    lines.append("  const rows = stocks.map((s: Record<string, unknown>) => [")
    lines.append("    String(s['代码'] ?? s['code'] ?? ''),")
    lines.append("    String(s['名称'] ?? s['name'] ?? ''),")
    lines.append("    String(s['封板时间'] ?? s['sealTime'] ?? ''),")
    lines.append("    String(s['开板次数'] ?? s['openCount'] ?? 0),")
    lines.append("    String(s['市值'] ?? s['marketCap'] ?? 0),")
    lines.append("    String(s['题材'] ?? s['sector'] ?? ''),")
    lines.append("    String(s['连板'] ?? s['boardLevel'] ?? 1),")
    lines.append("    String(s['催化等级'] ?? s['catalystLevel'] ?? 'B'),")
    lines.append("    String(s['封单比'] ?? s['sealAmountRatio'] ?? 0),")
    lines.append("    String(s['龙虎榜'] ?? s['dragonTiger'] ?? false),")
    lines.append("    String(s['日期'] ?? s['timestamp'] ?? ''),")
    lines.append("  ]);")
    lines.append("  const csv = [headers, ...rows].map(r => r.join(',')).join('\\n');")
    lines.append("  const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8' });")
    lines.append("  const url = URL.createObjectURL(blob);")
    lines.append("  const a = document.createElement('a');")
    lines.append("  a.href = url;")
    lines.append("  a.download = filename || `zt_pool_\${new Date().toISOString().slice(0, 10)}.csv`;")
    lines.append("  a.click();")
    lines.append("  URL.revokeObjectURL(url);")
    lines.append("}")

    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"✅ TypeScript 常量已更新: {ts_path}")


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--json-only', action='store_true', help='只保存JSON,不更新TypeScript常量')
    args = parser.parse_args()

    print(f"=" * 50)
    print(f"📅 A股涨停数据抓取 - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"=" * 50)

    records = get_zt_pool_today()

    if records:
        json_path = os.path.join(PROJECT_ROOT, "data", "zt_pool.json")
        save_to_json(records, json_path)

        if not args.json_only:
            update_typescript_constants(records)

        # 抓取并保存市场概况
        metrics = get_market_metrics()
        if metrics:
            metrics_path = os.path.join(PROJECT_ROOT, "data", "market_metrics.json")
            save_market_metrics(metrics, metrics_path)

        sector_map = {}
        for r in records:
            s = r['sector']
            sector_map[s] = sector_map.get(s, 0) + 1

        print(f"\n📈 板块涨停排行 (前10):")
        for sector, count in sorted(sector_map.items(), key=lambda x: -x[1])[:10]:
            print(f"   {sector}: {count}只")
    else:
        print("⚠️  未获取到数据,请检查网络或日期是否为交易日")


if __name__ == "__main__":
    main()
