#!/bin/bash

# 批量分析所有应用的 bundle
# 使用方法: ./build-optimization/scripts/analyze-all.sh

set -e  # 遇到错误立即退出

echo "🔍 开始分析所有应用的 bundle..."
echo ""

# 保存当前目录
ROOT_DIR=$(pwd)

# 主应用
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 分析主应用 (main)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$ROOT_DIR/packages/main"
analyze=analyze npm run build
echo "✅ 主应用分析完成: packages/main/dist/bundle-report.html"
echo ""

# Shop 应用
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛍️  分析 Shop 应用..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$ROOT_DIR/packages/shop"
analyze=analyze npm run build
echo "✅ Shop 应用分析完成: packages/shop/dist/bundle-report.html"
echo ""

# Utils 应用
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 分析 Utils 应用..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$ROOT_DIR/packages/utils"
analyze=analyze npm run build
echo "✅ Utils 应用分析完成: packages/utils/dist/bundle-report.html"
echo ""

# Components 应用
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧩 分析 Components 应用..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$ROOT_DIR/packages/components"
analyze=analyze npm run build
echo "✅ Components 应用分析完成: packages/components/dist/bundle-report.html"
echo ""

# 回到根目录
cd "$ROOT_DIR"

# 汇总文件大小
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Bundle 大小汇总"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "主应用 (main):"
du -sh packages/main/dist 2>/dev/null || echo "  未找到 dist 目录"

echo ""
echo "Shop 应用:"
du -sh packages/shop/dist 2>/dev/null || echo "  未找到 dist 目录"

echo ""
echo "Utils 应用:"
du -sh packages/utils/dist 2>/dev/null || echo "  未找到 dist 目录"

echo ""
echo "Components 应用:"
du -sh packages/components/dist 2>/dev/null || echo "  未找到 dist 目录"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 分析完成！"
echo ""
echo "查看报告:"
echo "  - 主应用: open packages/main/dist/bundle-report.html"
echo "  - Shop:   open packages/shop/dist/bundle-report.html"
echo "  - Utils:  open packages/utils/dist/bundle-report.html"
echo "  - Components: open packages/components/dist/bundle-report.html"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
