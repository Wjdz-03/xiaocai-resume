---
name: resume-builder
description: 根据职位描述（JD）从个人素材库生成针对性的 1 页 A4 LaTeX 简历 PDF。跨 agent（Claude Code / Codex / WorkBuddy）。首次使用会引导用户建立素材库 profile.yaml，之后按 JD 裁剪改写、手写 tex、编译校验出 PDF。
---

# Resume Builder

## 它做什么
输入 JD（文本或 URL）→ 读取用户素材库 `profiles/<user>/profile.yaml` → 筛选 + 改写 + 排序 → 手写 `resume.tex` → 编译校验 → 输出 `output/<user>-<slug>-<日期>/resume.pdf`。

## 边界
- skill 本体（本目录）：契约 / 模板 / 脚本 / 文档，不含真实个人信息。
- 用户数据（用户工作目录运行时生成，不进 skill 目录）：`profiles/<user>/`、`output/`。

## 核心原则

- Agent 负责理解 JD、做内容取舍、改写事实和判断质量；脚本只负责环境检查、目录创建和编译等机械动作。
- `profile.yaml` 是事实源。只能基于其中已有事实改写，不能为了匹配 JD 补写经历。
- 编译成功不等于简历完成。Agent 必须检查内容和页面，发现问题后继续修改并重新编译。
- 信息不足、事实依据不明确或存在多个合理方案时，先询问用户，不要猜测。

## 使用流程

### 0. 确认素材库

在用户当前工作目录检查 `profiles/<user>/profile.yaml`：

- 不存在：先建立素材库，再继续。
- 存在：直接进入简历生成流程。

首次建立素材库时：

1. 询问用户粘贴个人经历，或提供旧简历、资料文件或 PDF 路径。
2. 按 `contracts/profile.schema.json` 整理为 `profiles/<user>/profile.yaml`，包含
   `meta`、`education`、`experience`、`projects`、`skills`、`awards`、
   `open_source` 等字段。
3. 为经历和 bullet 添加 `tags`（例如 `llm`、`backend`、`rag`、`python`）。
4. 请用户提供证件照，放到 `profiles/<user>/photo.jpg`；没有照片时可以先不放。
5. 可选执行 `python3 <skill>/scripts/check_profile.py <profile.yaml>`。

### 1. 环境自检

执行：

```bash
bash <skill>/scripts/check_env.sh
```

如果失败，按照脚本输出安装最小编译环境（系统级安装先告知用户），安装后
重新执行。不得跳过失败的环境检查。

### 2. 获取并分析 JD

询问目标岗位的 JD 文本或 URL。URL 无法访问时请用户粘贴文本。读取
`profile.yaml`，先提取岗位名称、公司名称、核心能力、必备技术栈、加分项、
业务领域、经验要求和语言要求，并区分“必须匹配”“强相关”“可选加分”。

从素材库筛选并排序相关条目。优先选择能直接证明岗位核心能力、技术匹配度高、
成果清晰、与岗位相关且能在一页内表达的经历；不要单纯按关键词命中数量排序。
替换 `skeleton.tex` 中的 `<POSITION_LINE>`。

### 3. 改写内容

允许调整句式、合并同一经历中的已有事实、重排 bullet，以及使用 JD 中更准确
的同义术语。禁止增加素材库中不存在的技术栈、指标、职责、团队规模、时间、
公司或项目事实；不得把“参与”改成“负责”，把“协助”改成“主导”，或把课程
项目改成商业项目。

对每条最终 bullet 反向核对：其中每个事实是否都能在 `profile.yaml` 找到依据。
无法确认时删除该表述或询问用户。

### 4. 生成并编译

1. 用脚本创建输出目录：
   `bash <skill>/scripts/new_output.sh <user> <slug>`
2. 参考 `templates/skeleton.tex` 和 `contracts/latex-rules.md`，手写
   `output/.../resume.tex`。
3. 编译：
   `bash <skill>/scripts/build.sh output/.../resume.tex`
4. 校验：
   `bash <skill>/scripts/validate.sh output/.../resume.pdf`

脚本失败时必须读取错误信息或日志，修复 `resume.tex` 或环境后重跑，不能跳过
或隐瞒。脚本只提供基础编译证据，不替代 Agent 的内容判断。

### 5. Agent 自检与迭代

编译后，Agent 必须检查：

- PDF 确实生成、可打开且为 1 页 A4；
- 姓名、联系方式、目标岗位、教育经历和核心经历完整且正确；
- 没有残留占位符、空字段、异常符号或未经素材支持的表述；
- 高相关经历优先，内容没有重复，页面没有溢出、大面积空白或明显拥挤；
- 中英文、数字、字体和层级清晰可读。

如果结果不合格，按以下顺序迭代：删除低相关经历，删除或合并重复 bullet，
缩短低价值描述，减少非核心技能，最后才调整间距或字号。每次修改后重新编译
并重新检查；不得用极端缩小字号掩盖内容过多。

### 6. 交付

告知用户生成的 PDF 路径。匹配分析默认不主动输出；用户需要时再提供
“命中 / 不足 / 建议”三段分析。

## 需要询问用户的情况

- 没有 `profile.yaml`，且用户尚未提供足够素材；
- JD URL 无法访问，且用户没有提供 JD 文本；
- 岗位名称、用户标识或目标语言无法确定；
- 素材与 JD 关联很弱，或某条表述的事实依据不足；
- 用户要求加入素材库中不存在的技术、指标或经历；
- 一页内存在多个合理取舍，Agent 无法依据相关性和证据强度做出唯一选择。

## 护栏
- 不改 `templates/resume.cls`、`profiles/<user>/profile.yaml`。
- 不手写 output 目录名或日期，必须使用 `new_output.sh`。
- 不编造经历或数据，只改写素材库中的事实。
- 必须 1 页 A4。
- 默认不输出 `age`、`gender` 等非必要个人信息，除非用户明确要求。

## 依赖
最小编译环境：`xelatex` 引擎 + 中文宏包 `ctex`/`xeCJK`/`xeCJKfntef`/`zhnumber` + 中文字体。先跑 `scripts/check_env.sh` 自检，缺啥按指引装。`check_profile.py` 可选依赖 `pyyaml`。
