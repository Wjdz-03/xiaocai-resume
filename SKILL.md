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
1. 环境自检：`bash <skill>/scripts/check_env.sh`。失败则按输出指引安装最小编译包（agent 可执行 brew/tlmgr/apt，系统级操作先告知用户），装完重跑确认再继续。
2. 若无 `profiles/<user>/profile.yaml`：引导用户粘贴/提供素材，按 `contracts/profile.schema.json` 整理成 profile.yaml，并放证件照。
3. 询问目标岗位 JD（文本或 URL）。
4. 读 profile.yaml + 分析 JD，筛选相关条目、按关键词改写、最相关排前；替换标题 `<POSITION_LINE>` 为岗位名。
5. `bash <skill>/scripts/new_output.sh <user> <slug>` 建输出目录。
6. 参照 `templates/skeleton.tex` 与 `contracts/latex-rules.md` 手写 `output/.../resume.tex`。
7. `bash <skill>/scripts/build.sh output/.../resume.tex` 编译（内部先查引擎+中文宏包）。
8. `bash <skill>/scripts/validate.sh output/.../resume.pdf` 校验（必须 1 页）。
9. 脚本失败（退出码非 0）则修复后重跑，不跳过。
10. 交付 PDF 路径，可顺带一句"需要匹配分析可以告诉我"。

## 护栏
- 不改 `templates/resume.cls`、`profiles/<user>/profile.yaml`。
- 不手写 output 目录/日期；不编造经历；只改写。
- 必须 1 页 A4。

## 依赖
最小编译环境：`xelatex` 引擎 + 中文宏包 `ctex`/`xeCJK`/`xeCJKfntef`/`zhnumber` + 中文字体。先跑 `scripts/check_env.sh` 自检，缺啥按指引装。`check_profile.py` 可选依赖 `pyyaml`。
