# 输出契约

每次生成一份简历，产物的位置与形态必须遵守以下约定。

## 1. 目录命名

```
output/<user>-<slug>-<YYYYMMDD>/
```

- `<user>`：用户标识，通常与 `profiles/<user>/` 一致（如 `zhangming`）。
- `<slug>`：岗位或公司的短名，小写、无空格。例：`ai-quality`、`feishu-ai`、`backend-intern`。
- `<YYYYMMDD>`：生成当天的日期，用 `node scripts/resume.mjs new-output <user> <slug>` 自动生成，**不要手填**。
- 每次生成新建独立目录，互不覆盖。

## 2. 目录内文件

| 文件 | 来源 | 说明 |
|------|------|------|
| `resume.tex` | agent 手写 | 由 `node scripts/resume.mjs build` 编译为 PDF，不得手改编译产物 |
| `resume.pdf` | `build` 产物 | 最终交付物 |
| `fact-check.md` | agent 生成 | **交付前必须生成**：事实核对清单（见 3.5），请用户逐条确认 |
| `photo.jpg` | `new-output --photo` 可选 | 证件照副本，`resume.tex` 引用本地 `photo.<ext>` |
| `resume.cls` | 编译时由脚本复制 | 同目录才能编译，不手写 |
| `resume.log` / `resume.aux` 等 | 编译中间产物 | 可被 `.gitignore` 忽略 |

> 论文 PDF 等附件不要塞进输出目录；如简历需要引用，统一放所选 profile
> 目录下的 `attachments/`。

素材库可以来自当前工作空间的 `profiles/<user>/`、用户明确指定的路径，或全局
目录 `~/.agents/resume-builder/profiles/<user>/`。全局素材库不复制到输出目录；
照片推荐用 `new-output --photo` 复制进输出目录（见 `latex-rules.md` 第 2 节）。

## 3. 硬约束

- **必须 1 页 A4**。`node scripts/resume.mjs validate` 会尽量从编译日志提供页数证据；最终页数、
  A4 尺寸和视觉质量由 Agent 在交付前确认。
- 不覆盖已有输出目录；同一天二次生成请换不同的 `<slug>`。
- 不得在输出目录里存放任何个人信息之外的无关文件。

## 3.5 事实核对清单（交付前置）

`node scripts/resume.mjs validate` 会输出「事实核对清单」（量化断言、日期区间等硬指标）。
交付前 Agent 必须：

1. 把 `validate` 输出的清单整理成 `fact-check.md`（或直接在对话里列出），逐条请用户
   勾选确认："这个数字/成果能核实吗？"
2. 无法核实的条目删掉，或改成保守表述（"参与…"而非"主导…"，去掉无数据的夸大词）。
3. 用户确认完成后再交付 PDF；不要带着未确认的量化断言交付。

清单条目由脚本自动抽取：百分比、名次、stars 数、时间区间、"提升/降低 N%"类量化句，
以及夸大词命中项。脚本抽取不完整时 Agent 需自行补全（例如简历里的任何"第一/唯一/最"）。

## 3.6 交付物与后续修改

每次交付**三件套**：

1. `resume.pdf` —— 最终成品
2. `resume.tex` —— **可编辑源**：用户要改内容时，让 agent 改 tex 对应小节后
   `build` 重新编译即可，不要试图修改 PDF
3. 交付话术中告知用户："PDF 是最终格式；要调整内容/措辞/增删经历，直接告诉我，
   我改 tex 后 30 秒重新出一版"——避免用户以为交付后就改不动了

可选导出（仅当用户要求）：Word（`.docx`）用于某些 HR 强制要求的场景；此时从同一份
`resume.tex` 转换（如 `pandoc` 或在线工具），不要另写一份 docx 独立维护，避免内容漂移。

## 4. 匹配分析（可选）

匹配分析（`命中 / 不足 / 建议`）**不主动产出**。仅当用户主动询问时生成，或 agent 在交付 PDF 时顺带一句"需要匹配分析可以告诉我"。
