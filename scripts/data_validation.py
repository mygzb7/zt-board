#!/usr/bin/env python3
"""
数据验证脚本 - 每次爬虫运行后自动执行
对比多源数据，发现不一致时告警
"""
import json
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

def validate():
    """验证数据一致性"""
    errors = []
    warnings = []

    # 加载本地数据
    metrics_path = os.path.join(PROJECT_ROOT, "data", "market_metrics.json")
    pool_path = os.path.join(PROJECT_ROOT, "data", "zt_pool.json")

    metrics = json.load(open(metrics_path))
    pool = json.load(open(pool_path))

    # 1. ztCount 与 zt_pool.json 长度差异检查
    # 说明：ztCount 是"全A口径"（含炸板），zt_pool.json 只包含封死涨停股
    # 差异在 10-20 只是正常的（炸板股数量）
    diff = abs(metrics['ztCount'] - len(pool))
    if diff > 30:
        errors.append(f"❌ ztCount({metrics['ztCount']}) 与 zt_pool.json({len(pool)}) 差异过大({diff}只)")
    elif diff > 0:
        warnings.append(f"⚠️  ztCount({metrics['ztCount']}) 比 zt_pool.json({len(pool)}) 多{diff}只（炸板股，属正常）")

    # 2. 涨停数合理性检查
    if metrics['ztCount'] < 10 or metrics['ztCount'] > 200:
        warnings.append(f"⚠️  涨停数异常: {metrics['ztCount']}只（正常范围10-200）")

    # 3. 成交额合理性
    turnover = metrics['totalTurnover']
    if '万亿' in turnover:
        val = float(turnover.replace('万亿', ''))
        if val < 0.3 or val > 5:
            warnings.append(f"⚠️  成交额异常: {turnover}（正常范围0.3-5万亿）")
    elif '亿' in turnover:
        val = float(turnover.replace('亿', ''))
        if val > 50000:  # 超过50000亿=5万亿
            warnings.append(f"⚠️  成交额异常: {turnover}")

    # 4. 封板率范围
    if metrics['sealRate'] < 0 or metrics['sealRate'] > 100:
        errors.append(f"❌ 封板率异常: {metrics['sealRate']}%")

    # 5. 指数涨跌幅范围
    if abs(metrics['shChange']) > 10 or abs(metrics['szChange']) > 10:
        warnings.append(f"⚠️  指数涨跌幅异常: 上证{metrics['shChange']}% 深证{metrics['szChange']}%")

    # 6. 上涨家数
    if metrics['upCount'] < 100 or metrics['upCount'] > 5500:
        warnings.append(f"⚠️  上涨家数异常: {metrics['upCount']}（正常范围100-5500）")

    # 7. 日期一致性
    if pool and metrics['date'] != pool[0]['timestamp']:
        errors.append(f"❌ 日期不一致: metrics({metrics['date']}) != pool({pool[0]['timestamp']})")

    # 输出结果
    print("=" * 50)
    print("📋 数据验证报告")
    print("=" * 50)

    if errors:
        print(f"\n🔴 错误 ({len(errors)}项):")
        for e in errors:
            print(f"  {e}")

    if warnings:
        print(f"\n🟡 警告 ({len(warnings)}项):")
        for w in warnings:
            print(f"  {w}")

    if not errors and not warnings:
        print("\n✅ 所有数据验证通过")

    print(f"\n📊 当前数据:")
    print(f"  涨停: {metrics['ztCount']}只 | 成交: {metrics['totalTurnover']}")
    print(f"  封板率: {metrics['sealRate']}% | 连板率: {metrics['boardRate']}%")
    print(f"  上涨: {metrics['upCount']}家 | 上证: {metrics['shChange']}% | 深证: {metrics['szChange']}%")
    print("=" * 50)

    return len(errors) == 0

if __name__ == "__main__":
    ok = validate()
    sys.exit(0 if ok else 1)
