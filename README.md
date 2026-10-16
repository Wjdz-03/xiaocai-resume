# 小菜简历 / xiaocai-resume

一个**跨 agent** 的简历生成 skill：给它一段职位描述（JD），它从你的个人素材库中筛选、改写经历，生成一份针对性的、**1 页 A4** 的 LaTeX 简历 PDF。

支持 Claude Code / Codex / WorkBuddy 等任何能跑 bash 的 AI 编码助手。

## 核心理念

- **素材库 + 按需裁剪**：你的全部经历存为一份结构化的 `profile.yaml`（数据源），每次按 JD 挑相关内容生成针对性简历，而不是每投一个岗位从零写。
- **自由度与可靠性分层**：agent 负责"判断"（分析 JD、裁剪、改写和质量检查），脚本负责机械动作（建目录和编译）。
- **skill 本体与用户数据分离**：本仓库只含契约 / 模板 / 脚本 / 文档，**绝不含真实个人信息**。默认素材库放在 `~/.agents/resume-builder/profiles/`，简历产物放在调用 skill 的当前工作空间。

## 编译环境（最小依赖）

编译需要三样，缺一不可：

1. **xelatex 引擎**（TeX Live）
2. **中文宏包** `ctex` / `xeCJK` / `xeCJKfntef` / `zhnumber` —— **basic / minimal 版 TeX Live 默认没有**，这是新用户最常卡住的地方
3. **中文字体**：macOS 自带 `PingFang SC`；Linux 需 `fonts-noto-cjk`（并把 skeleton 字体改为 Noto Sans CJK SC）

**先自检，再编译**：

```bash
bash scripts/check_env.sh
```

它逐项检测，环境不全时退出码非 0，并打印你平台的**最小安装命令**。常见安装：

- macOS 未装任何 TeX Live：`brew install --cask mactex`（完整版，含中文宏包）
- macOS 已装 basic/minimal，只补中文宏包：`sudo tlmgr install collection-langchinese`
- Ubuntu/Debian：`sudo apt install texlive-xetex texlive-lang-chinese texlive-fonts-extra fonts-noto-cjk`

可选：`pyyaml`（仅用于 `check_profile.py` 结构校验；未装会自动跳过，不影响主流程）。

## 安装

把本仓库放到你所用 agent 的 skill 目录（软链或拷贝均可）：

```bash
git clone https://github.com/kuangxiaoc/xiaocai-resume.git

# Claude Code
ln -s "$PWD/xiaocai-resume" ~/.claude/skills/xiaocai-resume

# WorkBuddy
ln -s "$PWD/xiaocai-resume" ~/.workbuddy/skills/xiaocai-resume

# Generic Agent Skills directory
mkdir -p ~/.agents/skills
ln -s "$PWD/xiaocai-resume" ~/.agents/skills/xiaocai-resume

# Codex / 其它读取 AGENTS.md 的 agent：把仓库放进项目根，或让 AGENTS.md 可被读取即可
```

## 素材放在哪里

这个 skill 的数据分两层，不要混在一起。

### 1. 全局基础素材库（长期维护）

默认位置：

```text
~/.agents/resume-builder/profiles/<user>/
```

这里放**稳定的个人事实**，也就是不随岗位变化的内容：

```yaml
meta:
education:
experience:
projects:
skills:
```

它是长期维护的主素材库。新增经历、修正时间、补充项目成果，都改这里。

### 2. 工作空间本地补充素材（可选）

默认位置：

```text
<当前工作空间>/profiles/<user>/
```

这里放**这个项目或这个领域才需要的资料**，比如某类岗位的补充材料、论文附件、
或从全局素材派生出的岗位方向版本。它不会替代全局素材，除非你明确让 agent
这么用；两边冲突时，agent 会先问你，不会自动合并。

### 3. 简历输出

输出**永远在你调用 skill 的那个文件夹**下面，不会写回 skill 安装目录，也不会
写到全局素材库：

```text
<当前工作空间>/output/<user>-<slug>-<日期>/resume.pdf
```

这样每次生成的简历都留在对应项目里，素材库继续作为长期事实源被复用。

## 使用

在你的工作目录里对 agent 说：

```
帮我做一份简历，投这个岗位：
[粘贴 JD，或给 JD 链接]
```

首次使用时，agent 会引导你建立素材库：
1. 你粘贴个人经历文本，或给出旧简历 / 资料的文件路径；
2. agent 整理成全局素材库中的 `profile.yaml`，并请你提供证件照；
3. 之后在任意工作空间只需给 JD，agent 读取素材库 → 裁剪改写 → 编译 →
   在当前工作空间产出简历。

匹配分析（命中 / 不足 / 建议）默认不主动产出，需要时直接问 agent 即可。

## 目录结构

```
xiaocai-resume/
├── SKILL.md                   # skill 定义（完整使用流程）
├── AGENTS.md                  # 本仓库开发规则（辅助 skill 开发）
├── contracts/                 # 契约层
│   ├── profile.schema.json    # profile.yaml 结构定义
│   ├── output-contract.md     # 输出目录命名、1 页、文件清单
│   └── latex-rules.md         # 手写 tex 规范
├── templates/
│   ├── resume.cls             # 排版模板（勿改）
│   ├── skeleton.tex           # 简历骨架范本
│   └── example.profile.yaml   # 示例素材库（虚构，教学用）
└── scripts/                   # 确定性原语（agent 只调用）
    ├── check_env.sh           # 体检最小编译环境（引擎/中文宏包/字体），给安装命令
    ├── new_output.sh          # 建 output/<user>-<slug>-<日期>/
    ├── check_profile.py       # 校验 profile.yaml（可选，需 pyyaml）
    ├── build.sh               # 编译（系统 xelatex ×2，先查引擎+中文宏包）
    └── validate.sh            # 编译产物基础检查（页数 / 明显错误）
```

用户数据不会进入这个仓库：全局素材库在 `~/.agents/resume-builder/`，
本地补充和简历输出在调用 skill 的工作空间。

## Credits / 第三方组件

- `templates/resume.cls` 改编自 Feng Kaiyu 的 "Another Resume Class"，保留原作者署名。若上游项目采用更严格的许可证，请遵循其条款；分发前建议确认其 License。
- 其余代码与文档为本项目原创。

## License

[MIT](LICENSE)
