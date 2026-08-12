#!/bin/bash
# 编译简历为 PDF。
# resume.cls 通过相对路径（脚本位于 skill/scripts/，模板在 ../templates）自动定位。
# 使用系统 xelatex；未安装会提示。texmf 由用户自行安装 TeX Live 提供。
# 用法: build.sh <path/to/resume.tex>
# 示例: build.sh output/zhangming-ai-quality-20260616/resume.tex
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "用法: build.sh <path/to/resume.tex>" >&2
  exit 1
fi

TEX_FILE="$1"
DIR="$(cd "$(dirname "$TEX_FILE")" && pwd)"
BASENAME="$(basename "$TEX_FILE" .tex)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES="$SCRIPT_DIR/../templates"

if [ ! -f "$TEMPLATES/resume.cls" ]; then
  echo "❌ 找不到 $TEMPLATES/resume.cls（脚本应位于 skill 的 scripts/ 目录内）" >&2
  exit 1
fi

# resume.cls 必须和 .tex 在同一目录
cp "$TEMPLATES/resume.cls" "$DIR/"

if ! command -v xelatex >/dev/null 2>&1; then
  echo "❌ 未检测到 xelatex 引擎。运行 scripts/check_env.sh 查看安装指引" >&2
  exit 1
fi

# 中文宏包检测（basic/minimal 版 TeX Live 常缺，否则会报晦涩的 File 'ctexart.cls' not found）
if ! kpsewhich ctexart.cls >/dev/null 2>&1; then
  echo "❌ 缺少中文宏包 ctex（ctexart.cls）。运行 scripts/check_env.sh 查看完整环境与安装指引" >&2
  exit 1
fi

cd "$DIR"
xelatex "$BASENAME.tex"
xelatex "$BASENAME.tex"   # 运行两次生成正确的 PDF 书签

echo "✅ 编译完成: $DIR/$BASENAME.pdf"
