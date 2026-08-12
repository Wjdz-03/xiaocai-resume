---
name: resume-builder
description: 根据职位描述（JD）从个人素材库生成针对性的 1 页 A4 LaTeX 简历 PDF。跨 agent（Claude Code / Codex / WorkBuddy）。首次使用会引导用户建立素材库 profile.yaml，之后按 JD 裁剪改写、手写 tex、编译校验出 PDF。
---

# Resume Builder

> 本 skill 的**完整工作手册见同目录 `AGENTS.md`**（唯一事实源：边界、流程、护栏、脚本约定）。以下为同内容速览，二者保持同步。

## 它做什么
输入 JD（文本或 URL）→ 读取用户素材库 `profiles/<user>/profile.yaml` → 筛选 + 改写 + 排序 → 手写 `resume.tex` → 编译校验 → 输出 `output/<user>-<slug>-<日期>/resume.pdf`。

## 边界
- skill 本体（本目录）：契约 / 模板 / 脚本 / 文档，不含真实个人信息。
- 用户数据（用户工作目录运行时生成，不进 skill 目录）：`profiles/<user>/`、`output/`。

## 使用流程
1. 若无 `profiles/<user>/profile.yaml`：引导用户粘贴/提供素材，按 `contracts/profile.schema.json` 整理成 profile.yaml，并放证件照。
2. 询问目标岗位 JD（文本或 URL）。
3. 读 profile.yaml + 分析 JD，筛选相关条目、按关键词改写、最相关排前；替换标题 `<POSITION_LINE>` 为岗位名。
4. `bash <skill>/scripts/new_output.sh <user> <slug>` 建输出目录。
5. 参照 `templates/skeleton.tex` 与 `contracts/latex-rules.md` 手写 `output/.../resume.tex`。
6. `bash <skill>/scripts/build.sh output/.../resume.tex` 编译。
7. `bash <skill>/scripts/validate.sh output/.../resume.pdf` 校验（必须 1 页）。
8. 脚本失败（退出码非 0）则修复后重跑，不跳过。
9. 交付 PDF 路径，可顺带一句"需要匹配分析可以告诉我"。

## 护栏
- 不改 `templates/resume.cls`、`profiles/<user>/profile.yaml`。
- 不手写 output 目录/日期；不编造经历；只改写。
- 必须 1 页 A4。

## 依赖
系统需装 `xelatex`（TeX Live；macOS `brew install mactex`）。`check_profile.py` 可选依赖 `pyyaml`。
