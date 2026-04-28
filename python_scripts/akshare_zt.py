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
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


def get_zt_pool_today() -> list[dict]:
    """获取今日涨停板数据(主板 + 中小板)"""
    if not HAS_AKSHARE:
        return []

    today = datetime.date.today().strftime("%Y%m%d")
    print(f"📅 抓取日期: {today}")

    try:
        df = ak.stock_zt_pool_em(date=today)
        print(f"📊 抓到 {len(df)} 只涨停股(含所有板块)")
    except Exception as e:
        print(f"⚠️  获取涨停池失败: {e}")
        return []

    records = []
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

        dragon_tiger = False

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
            'dragonTiger': dragon_tiger,
            'timestamp': datetime.date.today().strftime("%Y%m%d"),
            'changeRate': change_rate,
        })

    print(f"✅ 过滤后剩余 {len(records)} 只主板/中小板涨停股")
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
    """获取今日市场概况数据（综合多种来源）"""
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

    # 1. 从东方财富API获取成交额（最准确的数据源）
    try:
        url = 'https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f12,f14,f3,f6&secids=1.000001,0.399001&ut=b2884a393a59ad64002292a3e90d46a5'
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        data = resp.json()
        total_turnover = 0.0
        for item in data.get('data', {}).get('diff', []):
            code = item.get('f12', '')
            f6 = float(item.get('f6', 0))  # f6 = 成交额（元）
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
        print(f"📊 市场成交额（东方财富）: {result['totalTurnover']}")
    except Exception as e:
        print(f"⚠️  东方财富API失败: {e}")

    # 2. 从涨停池获取 zt_count、seal_rate、board_rate
    if HAS_AKSHARE:
        try:
            df = ak.stock_zt_pool_em(date=today)
            result['ztCount'] = len(df)

            # 封板率：从涨停统计字段计算
            still_sealed = 0
            total_seals = 0
            for stat in df['涨停统计']:
                parts = str(stat).split('/')
                if len(parts) == 2:
                    sealed = int(parts[0])
                    total = int(parts[1])
                    if sealed == total:  # 封死（首次封板后未再开板）
                        still_sealed += 1
                    total_seals += 1
            result['sealRate'] = round(still_sealed / max(total_seals, 1) * 100, 0)

            # 连板率
            board_count = len(df[df['连板数'] > 1])
            result['boardRate'] = round(board_count / max(len(df), 1) * 100, 0)
        except Exception as e:
            print(f"⚠️  涨停池数据失败: {e}")

    # 3. 上涨家数无法从API获取，根据历史统计估算
    # 深证-1.1%且上证-0.19%：弱势市场，上涨家数约1200-1800
    if result['szChange'] < -0.5:
        result['upCount'] = 1500
    elif result['szChange'] < 0:
        result['upCount'] = 2000
    else:
        result['upCount'] = 2500

    print(f"📊 市场概况: 涨停{result['ztCount']}只 | 成交{result['totalTurnover']} | "
          f"封板率{result['sealRate']}% | 上证{result['shChange']}% | 深证{result['szChange']}%")
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
    """直接更新 TypeScript constants.ts"""
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
