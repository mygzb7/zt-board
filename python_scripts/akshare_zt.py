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


def get_zt_pool_today() -> list[dict]:
    """获取今日涨停板数据（主板 + 中小板）"""
    if not HAS_AKSHARE:
        return []

    today = datetime.date.today().strftime("%Y%m%d")
    print(f"📅 抓取日期: {today}")

    try:
        df = ak.stock_zt_pool_em(date=today)
        print(f"📊 抓到 {len(df)} 只涨停股（含所有板块）")
    except Exception as e:
        print(f"⚠️  获取涨停池失败: {e}")
        return []

    records = []
    for _, row in df.iterrows():
        code = str(row.get('代码', ''))
        name = str(row.get('名称', ''))

        # 过滤 ST
        if 'ST' in name or '*ST' in name:
            continue

        # 过滤 创业板(300/301) 和 科创板(688)
        if code.startswith('300') or code.startswith('301') or code.startswith('688'):
            continue

        # 包含主板(600/601/605)+深证主板(000/001)+中小板(002/003)
        # 注意：实际akshare返回的数据中600x/000x/002x/003x都包含
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
        # 封板资金单位是元，转为万
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


def save_to_json(data: list, filepath: str):
    """保存到JSON文件"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 数据已保存到 {filepath}")


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
    parser.add_argument('--json-only', action='store_true', help='只保存JSON，不更新TypeScript常量')
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

        sector_map = {}
        for r in records:
            s = r['sector']
            sector_map[s] = sector_map.get(s, 0) + 1

        print(f"\n📈 板块涨停排行 (前10):")
        for sector, count in sorted(sector_map.items(), key=lambda x: -x[1])[:10]:
            print(f"   {sector}: {count}只")
    else:
        print("⚠️  未获取到数据，请检查网络或日期是否为交易日")


if __name__ == "__main__":
    main()
