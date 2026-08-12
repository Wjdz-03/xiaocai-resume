#!/bin/bash
# 创建一份简历的输出目录：output/<user>-<slug>-<YYYYMMDD>/
# 日期自动取当天，目录已存在则报错（防覆盖）。
# 用法: new_output.sh <user> <slug>
# 示例: new_output.sh zhangming ai-quality
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "用法: new_output.sh <user> <slug>" >&2
  echo "示例: new_output.sh zhangming ai-quality" >&2
  exit 1
fi

USER="$1"
SLUG="$2"
DATE="$(date +%Y%m%d)"
DEST="output/${USER}-${SLUG}-${DATE}"

if [ -d "$DEST" ]; then
  echo "❌ 目录已存在: $DEST（同日重复生成请换不同 slug）" >&2
  exit 1
fi

mkdir -p "$DEST"
echo "$DEST"
