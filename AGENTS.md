# Resume Builder — Agent 工作手册

根据用户的职位描述（JD），从其个人素材库中筛选、改写经历，生成一份针对性的、**1 页 A4** 的 LaTeX 简历 PDF。

> 本文件是流程的**唯一事实源**。`SKILL.md` 与其保持一致，`CLAUDE.md` 仅作指针。修改流程请同步更新。

## 边界：skill 本体 vs 用户数据

- **skill 本体**（本仓库，随 GitHub 分发）：`SKILL.md` / `AGENTS.md` / `contracts/` / `templates/` / `scripts/` / `README.md`。**绝不含任何真实个人信息**。
- **用户数据**（在用户工作目录运行时生成，**不进本仓库**）：
  - `profiles/<user>/` —— 个人素材库（`profile.yaml` + `photo.jpg` + `attachments/`）
  - `output/<user>-<slug>-<日期>/` —— 每次生成的简历产物

agent 在**用户的当前工作目录**下读写 `profiles/` 与 `output/`，**不要**写进 skill 安装目录。

## 术语

- `profile.yaml`：用户的经历全集（数据源）。结构见 `contracts/profile.schema.json`，示例见 `templates/example.profile.yaml`。
- `skeleton.tex`：简历骨架范本（`templates/skeleton.tex`），agent 据此手写。
- `<skill>`：本仓库 / 本 skill 的安装目录。

## 使用流程

### 第 0 步：确认素材库
检查用户工作目录是否有 `profiles/<user>/profile.yaml`：
- **没有（新用户）** → 先引导建素材库（见下），再生成简历。
- **有** → 直接进入生成流程。

### 建素材库（仅新用户首次）
1. 询问用户提供素材：粘贴个人经历文本、或给出旧简历 / 资料的文件路径、或 PDF。
2. 读取后按 `contracts/profile.schema.json` 结构，整理为 `profiles/<user>/profile.yaml`：
   - `meta`（name / phone / email / city / age / gender / github / photo / availability）
   - `education[]` / `experience[]` / `projects[]` / `skills[]` / `awards[]` / `open_source[]`
   - 为每段经历、每条 bullet 打上 `tags`（如 `llm`、`backend`、`rag`、`python`…），用于后续按 JD 精选。
3. 请用户提供证件照，放到 `profiles/<user>/photo.jpg`（暂无则留占位，简历可先去照片）。
4. 可选校验：`python3 <skill>/scripts/check_profile.py profiles/<user>/profile.yaml`（需 pyyaml，未装会自动跳过）。

### 生成简历
1. **环境自检**：`bash <skill>/scripts/check_env.sh`。若失败（退出码非 0），按输出的平台指引安装最小编译包（agent 可执行 `brew` / `tlmgr` / `apt`；系统级操作先告知用户再执行），装完重跑确认环境完整，再继续。
2. 询问目标岗位：JD 文本或 URL。URL 且能联网则抓取，不能则请用户粘贴。
3. 读 `profiles/<user>/profile.yaml`，分析 JD（岗位名、技术关键词、偏好经历类型、公司名）。
4. 从素材库**筛选**与 JD 相关的条目，最相关排前；按 JD 关键词**改写** bullet 措辞；重写标题行（替换 skeleton 中的 `<POSITION_LINE>` 为目标岗位名）。**只改写，不编造**。
5. 建输出目录：`bash <skill>/scripts/new_output.sh <user> <slug>`（slug 如 `ai-quality`），记下返回的目录路径。
6. 参照 `templates/skeleton.tex` 与 `contracts/latex-rules.md`，把筛选改写后的内容**手写**成 `output/.../resume.tex`。
7. 编译：`bash <skill>/scripts/build.sh output/.../resume.tex`（脚本内部会先查 xelatex 引擎与中文宏包）。
8. 校验：`bash <skill>/scripts/validate.sh output/.../resume.pdf`
9. 若 check_env / build / validate 任一脚本失败（退出码非 0），按报错修复后重跑，**不要跳过**。
10. 交付：告知用户 PDF 路径。可顺带一句"需要这份 JD 的匹配分析可以告诉我"。

## 匹配分析（可选，不主动做）
默认**不产出**。仅当用户主动询问，或你交付时顺带提供时，输出三段：**命中 / 不足 / 建议**。

## 护栏（违反即重来）
- 不改 `templates/resume.cls`、`profiles/<user>/profile.yaml`（素材是源）。
- 不手写 output 目录名或日期，必须 `new_output.sh`。
- 不编造经历 / 数据；只能改写措辞。
- 必须 1 页 A4；`validate.sh` 卡住就精简内容。
- 任何脚本失败，修复后重跑，不跳过、不隐瞒报错。

## 脚本约定
所有脚本**退出码非 0 即失败**。

| 脚本 | 用法 |
|------|------|
| 环境自检 | `bash <skill>/scripts/check_env.sh`（缺啥给啥安装命令） |
| 建输出目录 | `bash <skill>/scripts/new_output.sh <user> <slug>` |
| 校验素材（可选） | `python3 <skill>/scripts/check_profile.py <profile.yaml>` |
| 编译 | `bash <skill>/scripts/build.sh <resume.tex>` |
| 校验产物 | `bash <skill>/scripts/validate.sh <resume.pdf>` |

依赖（最小编译环境）：`xelatex` 引擎 + 中文宏包 `ctex`/`xeCJK`/`xeCJKfntef`/`zhnumber` + 中文字体。详见 `check_env.sh` 与 README「编译环境」。`check_profile.py` 可选依赖 `pyyaml`。
