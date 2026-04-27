#!/usr/bin/env python3
"""
A股涨停板数据抓取脚本
依赖: pip install akshare pandas

使用方法:
    python akshare_zt.py

输出:
    data/zt_pool.json - 格式化后的涨停池数据
"""

import json
import datetime
import warnings
warnings.filterwarnings('ignore')

try:
    import akshare as ak
    import pandas as pd
    HAS_AKSHARE = True
except ImportError:
    HAS_AKSHARE = False
    print("❌ 请先安装 akshare: pip install akshare pandas")


def get_zt_pool_today() -> list[dict]:
    """获取今日涨停板数据"""
    if not HAS_AKSHARE:
        return []

    try:
        # 涨停股池
        df = ak.stock_zt_pool_em(date=datetime.date.today().strftime("%Y%m%d"))
        print(f"📊 抓到 {len(df)} 只涨停股")

        records = []
        for _, row in df.iterrows():
            code = str(row.get('代码', ''))
            name = str(row.get('名称', ''))
            # 过滤ST股
            if 'ST' in name or '*ST' in name:
                continue
            # 过滤创业板(300)科创板(688)
            if code.startswith('300') or code.startswith('688'):
                continue
            # 保留主板(600/000/001)
            if not (code.startswith('600') or code.startswith('000') or code.startswith('001')):
                continue

            records.append({
                'code': code,
                'name': name,
                'sealTime': str(row.get('封板时间', '09:30')),
                'openCount': int(row.get('开板次数', 0)),
                'marketCap': round(float(row.get('流通市值', 50)), 1),
                'sector': str(row.get('所属行业', '未知')),
                'boardLevel': int(row.get('连板数', 1)),
                'catalystLevel': 'B',
                'sealAmountRatio': round(float(row.get('封单额(万)', 0)) / 10000, 1),
                'dragonTiger': False,
                'timestamp': datetime.date.today().isoformat(),
            })
        return records
    except Exception as e:
        print(f"⚠️  获取涨停池失败: {e}")
        return []


def get_sector_zt_count() -> dict:
    """获取板块涨停数量"""
    if not HAS_AKSHARE:
        return {}
    try:
        df = ak.stock_zt_pool_em(date=datetime.date.today().strftime("%Y%m%d"))
        sector_counts = df.groupby('所属行业').size().to_dict()
        return sector_counts
    except Exception as e:
        print(f"⚠️  获取板块数据失败: {e}")
        return {}


def save_to_json(data: list, filepath: str = "data/zt_pool.json"):
    """保存到JSON文件"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 数据已保存到 {filepath}")


def main():
    print(f"📅 {datetime.date.today()} A股涨停数据抓取")
    print("-" * 40)

    records = get_zt_pool_today()

    if records:
        save_to_json(records)
        sectors = get_sector_zt_count()
        if sectors:
            print("\n📈 板块涨停排行:")
            for sector, count in sorted(sectors.items(), key=lambda x: -x[1])[:10]:
                print(f"   {sector}: {count}只")
    else:
        print("⚠️  未获取到数据，请检查网络或日期是否为交易日")


if __name__ == "__main__":
    main()
