# 输出契约

每次生成一份简历，产物的位置与形态必须遵守以下约定。

## 1. 目录命名

```
output/<user>-<slug>-<YYYYMMDD>/
```

- `<user>`：用户标识，通常与 `profiles/<user>/` 一致（如 `zhangming`）。
- `<slug>`：岗位或公司的短名，小写、无空格。例：`ai-quality`、`feishu-ai`、`backend-intern`。
- `<YYYYMMDD>`：生成当天的日期，用 `scripts/new_output.sh <user> <slug>` 自动生成，**不要手填**。
- 每次生成新建独立目录，互不覆盖。

## 2. 目录内文件

| 文件 | 来源 | 说明 |
|------|------|------|
| `resume.tex` | agent 手写 | 由 `build.sh` 编译为 PDF，不得手改编译产物 |
| `resume.pdf` | `build.sh` 产物 | 最终交付物 |
| `resume.cls` | 编译时由脚本复制 | 同目录才能编译，不手写 |
| `resume.log` / `resume.aux` 等 | 编译中间产物 | 可被 `.gitignore` 忽略 |

> 论文 PDF 等附件不要塞进输出目录；如简历需要引用，统一放 `profiles/<user>/attachments/`。

## 3. 硬约束

- **必须 1 页 A4**。`validate.sh` 会尽量从编译日志提供页数证据；最终页数、
  A4 尺寸和视觉质量由 Agent 在交付前确认。
- 不覆盖已有输出目录；同一天二次生成请换不同的 `<slug>`。
- 不得在输出目录里存放任何个人信息之外的无关文件。

## 4. 匹配分析（可选）

匹配分析（`命中 / 不足 / 建议`）**不主动产出**。仅当用户主动询问时生成，或 agent 在交付 PDF 时顺带一句"需要匹配分析可以告诉我"。
