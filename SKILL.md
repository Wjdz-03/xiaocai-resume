---
name: xiaocai-resume
description: 根据职位描述（JD）从个人素材库生成针对性的 1 页 A4 LaTeX 简历 PDF。跨 agent（Claude Code / Codex / WorkBuddy）。首次使用会引导用户建立素材库 profile.yaml，之后按 JD 裁剪改写、手写 tex、编译校验出 PDF。
---

# Resume Builder

## 它做什么
输入 JD（文本或 URL）→ 定位用户素材库 → 筛选 + 改写 + 排序 → 手写
`resume.tex` → 编译校验 → 在当前工作空间输出
`output/<user>-<slug>-<日期>/resume.pdf`。

## 边界
- skill 本体（本目录）：契约 / 模板 / 脚本 / 文档，不含真实个人信息。
- 用户数据不放进 skill 本体。默认全局素材库位于
  `~/.agents/resume-builder/profiles/<user>/`；当前工作空间可以使用
  `profiles/<user>/` 覆盖或补充；生成结果始终位于当前工作空间的 `output/`。

## 核心原则

- Agent 负责理解 JD、做内容取舍、改写事实和判断质量；脚本只负责环境检查、目录创建和编译等机械动作。
- `profile.yaml` 是事实源。只能基于其中已有事实改写，不能为了匹配 JD 补写经历。
- 编译成功不等于简历完成。Agent 必须检查内容和页面，发现问题后继续修改并重新编译。
- 信息不足、事实依据不明确或存在多个合理方案时，先询问用户，不要猜测。

## 使用流程

### 0. 确认素材库

按以下优先级定位 `profile.yaml`，不要把个人资料复制到 skill 安装目录：

1. 用户明确指定的 profile 路径；
2. 当前工作空间的 `profiles/<user>/profile.yaml`；
3. 全局素材库 `~/.agents/resume-builder/profiles/<user>/profile.yaml`；
4. 用户明确提供的其他简历、资料或 PDF 路径。

如果发现多个可用 profile，先询问用户本次使用哪一个。当前工作空间的 profile
可以是全局 profile 的派生版本，用于不同岗位方向；不要静默合并互相冲突的资料。
如果上述位置都没有可用素材，才引导建立素材库。

首次建立素材库时：

1. 询问用户粘贴个人经历，或提供旧简历、资料文件或 PDF 路径。
2. 询问用户希望保存到当前工作空间，还是全局目录
   `~/.agents/resume-builder/profiles/<user>/`。用户未指定时，优先建议全局目录，
   以便其他工作空间复用。
3. 按 `contracts/profile.schema.json` 整理为选定目录下的 `profile.yaml`，包含
   `meta`、`education`、`experience`、`projects`、`skills`、`awards`、
   `open_source` 等字段。
4. 为经历和 bullet 添加 `tags`（例如 `llm`、`backend`、`rag`、`python`）。
5. 请用户提供证件照，放在选定 profile 目录；没有照片时可以先不放。
6. 可选执行 `node <skill>/scripts/resume.mjs check-profile <profile.yaml>`
   （内部转发给 `check_profile.py`，检测不到 Python 时自动跳过）。

素材太少（"没什么可写"）时，按 `contracts/intake-playbook.md` 的采料问卷逐项追问
（课程设计/大作业/毕设/竞赛/社团/兼职/自学项目都是合法素材），并参考其中的人群
playbook（应届无实习 / 有实习 / 考研 gap / 转行）调整结构侧重。挖不出来时如实告知，
建议先做练手项目，不要编造填充。

### 1. 环境自检

执行：

```bash
node <skill>/scripts/resume.mjs check-env
```

如果失败，按照脚本输出安装最小编译环境（系统级安装先告知用户），安装后
重新执行。不得跳过失败的环境检查。

生成 `resume.tex` 时，用 `check-env` 输出里的“推荐字体”替换模板中的
`<CJK_FONT>`。字体是否可用只能以实际探测为准，不要按操作系统假设。

### 2. 获取并分析 JD

询问目标岗位的 JD 文本或 URL。URL 无法访问时请用户粘贴文本。读取
`profile.yaml`，先提取岗位名称、公司名称、核心能力、必备技术栈、加分项、
业务领域、经验要求和语言要求，并区分“必须匹配”“强相关”“可选加分”。

从素材库筛选并排序相关条目。优先选择能直接证明岗位核心能力、技术匹配度高、
成果清晰、与岗位相关且能在一页内表达的经历；不要单纯按关键词命中数量排序。
替换 `skeleton.tex` 中的 `<POSITION_LINE>`。

### 3. 改写内容

按 `contracts/bullet-craft.md` 的 STAR 结构与动作动词库改写：每条 bullet
= 动词开头 + 技术/方法 + 产出/结果（能量化就量化，没有数字用规模或产出物替代），
完成度用 `bullet-craft.md` 的自检清单逐条过。

允许调整句式、合并同一经历中的已有事实、重排 bullet，以及使用 JD 中更准确
的同义术语。禁止增加素材库中不存在的技术栈、指标、职责、团队规模、时间、
公司或项目事实；不得把"参与"改成"负责"，把"协助"改成"主导"，或把课程
项目改成商业项目。

对每条最终 bullet 反向核对：其中每个事实是否都能在 `profile.yaml` 找到依据。
无法确认时删除该表述或询问用户。

JD 关键词对齐按 `contracts/jd-alignment.md`：只换叫法不改事实，用 JD 的词汇
（同义替换、顺序调整），最相关关键词放在第一条 bullet；"必须匹配"档未命中的
列进覆盖报告的"不足"，不硬补。

### 4. 生成并编译

1. 用脚本创建输出目录；带证件照时加 `--photo`（复制进输出目录，tex 里引用
   本地 `photo.<ext>`，见 `contracts/latex-rules.md` 第 2 节）：
   `node <skill>/scripts/resume.mjs new-output <user> <slug> [--photo <profile>/photo.jpg]`
2. 选排版风格并手写 `output/.../resume.tex`（参考 `templates/skeleton.tex` 和
   `contracts/latex-rules.md`）。
   默认用 `skeleton.tex` 的经典单栏；用户想要别的观感时，先跑
   `node <skill>/scripts/resume.mjs preview` 看模板列表、`preview <name>` 编译
   各模板效果图让用户挑：
   `t1-classic` 信息密集单栏（经历多）/ `t2-twocolumn` 双栏（信息分类清晰）/
   `t3-minimal` 极简留白（经历精炼）/ `t4-accent` 强调色现代（互联网/AI 岗）/
   `t5-academic` 学术风（考研/留学/科研）。
   选中的模板输出的 `resume.tex` 可直接作为改写起点。
   照片是可选项：国内校招/国企岗位通常带照片，外企或用户要求时不带。
   不要复制整份素材库到输出目录。
3. 编译：
   `node <skill>/scripts/resume.mjs build output/.../resume.tex`
4. 校验：
   `node <skill>/scripts/resume.mjs validate output/.../resume.pdf`

`validate` 除页数/编译错误外，还会做内容检查（联系方式、日期格式、超长 bullet、
夸大词、残留占位符）并输出「事实核对清单」。脚本失败时必须读取错误信息或日志，
修复 `resume.tex` 或环境后重跑，不能跳过或隐瞒。脚本只提供基础编译证据，不替代
Agent 的内容判断。

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

### 6. 事实核对清单

交付前必须把 `validate` 输出的「事实核对清单」（量化断言、时间区间、夸大词命中）
逐条请用户确认，可整理为输出目录下的 `fact-check.md`。无法核实的条目删掉或改成
保守表述，不要带着未确认的量化断言交付。详见 `contracts/output-contract.md` 3.5。

### 7. 交付

告知用户生成的 PDF 路径，并按三件套交付：`resume.pdf` + `resume.tex`（可编辑源）+
事实核对结果。明确告诉用户："要调整内容/措辞/增删经历直接说，我改 tex 后重新
编译出新 PDF"——不要让 PDF 看起来是改不动的终点。匹配分析默认不主动输出；
用户需要时再提供"命中 / 不足 / 建议"三段分析。

## 需要询问用户的情况

- 所有候选位置都没有 `profile.yaml`，且用户尚未提供足够素材；
- 存在多个 profile，但无法确定本次使用哪一个；
- 需要在当前工作空间 profile 和全局 profile 之间选择或合并；
- JD URL 无法访问，且用户没有提供 JD 文本；
- 岗位名称、用户标识或目标语言无法确定；
- 素材与 JD 关联很弱，或某条表述的事实依据不足；
- 用户要求加入素材库中不存在的技术、指标或经历；
- 一页内存在多个合理取舍，Agent 无法依据相关性和证据强度做出唯一选择。

## 护栏
- 不改 `templates/resume.cls`，也不擅自覆盖用户已有 profile。
- 不手写 output 目录名或日期，必须使用 `new-output` 子命令。
- 不编造经历或数据，只改写素材库中的事实。
- 必须 1 页 A4。
- 交付前必须完成事实核对清单（`validate` 输出的量化断言/日期/夸大词），未确认的条目删掉或改保守表述。
- 交付三件套：`resume.pdf` + `resume.tex` + 事实核对结果；明确告知用户可继续改 tex 重新编译。
- 默认不输出 `age`、`gender` 等非必要个人信息，除非用户明确要求。
- 不把全局素材库复制到 skill 仓库或当前输出目录；照片用 `new-output --photo` 复制为输出目录的 `photo.<ext>`。

## 依赖
脚本层需要 **Node.js**（纯标准库，无第三方依赖），macOS / Linux / Windows 原生终端均可运行。
最小编译环境：`xelatex` 引擎 + 中文宏包 `ctex`/`xeCJK`/`xeCJKfntef`/`zhnumber` + 中文字体（见 1.5 的平台字体表）。先跑 `node <skill>/scripts/resume.mjs check-env` 自检，缺啥按指引装。`check_profile.py` 可选依赖 `pyyaml`（经 `check-profile` 子命令转发，无 Python 时自动跳过）。
