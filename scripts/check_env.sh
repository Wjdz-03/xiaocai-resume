#!/bin/bash
# 体检简历编译的"最小环境"：xelatex 引擎 + 中文宏包(ctex 系) + 基础宏包 + 中文字体。
# 缺什么报什么，并给出对应平台的最小安装命令。退出码非 0 = 环境不完整。
# agent 在首次编译前应先运行本脚本；失败则按输出指引安装后重跑。
# 用法: check_env.sh
set -uo pipefail

MISSING=0
OS="$(uname -s)"

have() { command -v "$1" >/dev/null 2>&1; }
kpse() { have kpsewhich && kpsewhich "$1" >/dev/null 2>&1; }

echo "== 1. xelatex 引擎 =="
if have xelatex; then
  echo "✅ $(xelatex --version 2>/dev/null | head -n1)"
else
  echo "❌ 缺少 xelatex 引擎"
  MISSING=1
fi

echo "== 2. 中文宏包（basic/minimal 版常缺，必须补） =="
for pkg in ctexart.cls xeCJK.sty xeCJKfntef.sty zhnumber.sty; do
  if kpse "$pkg"; then echo "✅ $pkg"; else echo "❌ 缺少 $pkg"; MISSING=1; fi
done

echo "== 3. 基础宏包 =="
for pkg in geometry.sty fancyhdr.sty enumitem.sty footmisc.sty hyperref.sty xcolor.sty; do
  if kpse "$pkg"; then echo "✅ $pkg"; else echo "❌ 缺少 $pkg"; MISSING=1; fi
done

echo "== 4. 中文字体 =="
if [ "$OS" = "Darwin" ]; then
  echo "✅ macOS 自带 PingFang SC（skeleton.tex 默认字体）"
elif have fc-list; then
  if fc-list :lang=zh 2>/dev/null | grep -qiE "noto|source han|wqy|simsun|simhei|yahei|pingfang"; then
    echo "✅ 检测到中文字体"
  else
    echo "❌ 未检测到中文字体（Linux 请装 fonts-noto-cjk，并把 skeleton.tex 字体改为 Noto Sans CJK SC）"
    MISSING=1
  fi
else
  echo "⚠️ 无 fc-list，无法检测字体；若编译报字体缺失请安装中文字体"
fi

echo
if [ "$MISSING" = "0" ]; then
  echo "✅ 编译环境完整，可直接运行 build.sh"
  exit 0
fi

echo "----------------------------------------"
echo "❌ 编译环境不完整。按平台安装最小编译包："
echo
if [ "$OS" = "Darwin" ]; then
  echo "  macOS · 完全没装 TeX Live："
  echo "    brew install --cask mactex          # 完整版，自带中文宏包"
  echo "  macOS · 已装 basic/minimal（只补中文宏包）："
  echo "    sudo tlmgr update --self && sudo tlmgr install collection-langchinese"
else
  echo "  Ubuntu / Debian："
  echo "    sudo apt install texlive-xetex texlive-lang-chinese texlive-fonts-extra fonts-noto-cjk"
  echo "  其它 Linux（用 tlmgr 补中文宏包）："
  echo "    sudo tlmgr install collection-langchinese"
fi
echo
echo "装完后重跑本脚本确认，再进行编译。"
exit 1
