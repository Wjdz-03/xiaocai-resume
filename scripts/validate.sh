#!/bin/bash
# 基础检查编译产物：PDF 存在，并尽量从 xelatex 日志读取页数和明显错误。
# 不判断 JD 匹配度、事实准确性、内容质量或视觉质量；这些由 Agent 负责。
# 零依赖：只读取 xelatex 生成的 .log 与 PDF 是否存在。
# 用法: validate.sh <path/to/resume.pdf>
# 发现明确编译问题时退出非 0，Agent 需读取日志、修复并重新编译。
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "用法: validate.sh <path/to/resume.pdf>" >&2
  exit 1
fi

PDF="$1"
DIR="$(cd "$(dirname "$PDF")" && pwd)"
BASENAME="$(basename "$PDF" .pdf)"
LOG="$DIR/$BASENAME.log"

if [ ! -f "$PDF" ]; then
  echo "❌ PDF 不存在: $PDF" >&2
  exit 1
fi

if [ -f "$LOG" ]; then
  # 页数：xelatex 日志形如 "Output written on resume.pdf (1 page, ...)"。
  # 页数只是机械证据；页面布局和 A4 视觉效果仍由 Agent 检查。
  PAGES="$(grep -oE "Output written on .* \([0-9]+ page" "$LOG" | grep -oE "[0-9]+" | head -n1 || true)"
  if [ -n "$PAGES" ] && [ "$PAGES" != "1" ]; then
    echo "❌ PDF 共 $PAGES 页，必须控制在 1 页 A4" >&2
    exit 1
  fi
  # 字体缺失 / 未定义命令 / 紧急停止
  if grep -qiE "Missing character|undefined control sequence|Font .* not found|emergency stop" "$LOG"; then
    echo "❌ 编译日志发现字体缺失或未定义命令：" >&2
    grep -iE "Missing character|undefined control sequence|Font .* not found|emergency stop" "$LOG" | head -n 5 >&2
    exit 1
  fi
else
  echo "⚠️ 未找到日志 $LOG，跳过编译日志检查；请 Agent 直接检查 PDF" >&2
fi

echo "✅ 编译产物基础检查通过: $PDF"
echo "⚠️ 仍需由 Agent 检查内容、事实边界和页面视觉质量"
