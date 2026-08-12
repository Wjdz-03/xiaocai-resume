#!/bin/bash
# 校验编译产物：页数必须 1 页、无字体缺失/未定义命令。
# 零依赖：只读取 xelatex 生成的 .log 与 PDF 是否存在。
# 用法: validate.sh <path/to/resume.pdf>
# 退出码非 0 即失败，agent 看到失败需修复后重新编译。
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
  # 页数：xelatex 日志形如 "Output written on resume.pdf (1 page, ...)"
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
  echo "⚠️ 未找到日志 $LOG，跳过页数与字体校验（建议先运行 build.sh）" >&2
fi

echo "✅ 校验通过: $PDF"
