#!/bin/bash
# A股涨停数据每日自动抓取（ArkClaw 实例本地执行，固定IP避免TuShare限制）
set -e

cd /root/.openclaw/workspace/zt-board

TODAY=$(date +%Y%m%d)
HOUR=$(date +%H)

echo "=========================================="
echo "📅 每日涨停数据抓取 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 检查是否为交易日（周一至周五）
DOW=$(date +%u)
if [ "$DOW" -gt 5 ]; then
    echo "🛑 周末，跳过"
    exit 0
fi

# 运行爬虫
python3 python_scripts/akshare_zt.py

# 数据验证
python3 scripts/data_validation.py || {
    echo "🔴 数据验证失败，请检查"
    exit 1
}

# 如果有数据变更，提交并推送（触发 GitHub Actions 部署）
if git diff --quiet data/ src/utils/constants.ts; then
    echo "🟡 数据无变化，跳过提交"
else
    git add data/ src/utils/constants.ts python_scripts/akshare_zt.py
    git commit -m "📊 自动更新涨停数据 $TODAY [ArkClaw cron]" || true
    git push origin main
    echo "✅ 已推送，GitHub Actions 将自动构建部署"
fi

echo "🏁 完成"
