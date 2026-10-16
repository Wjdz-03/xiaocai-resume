# 手写 LaTeX 规范

agent 直接编写 `resume.tex`，不借助程序渲染，因此必须严格遵守本规范以保证
`xelatex` 通过、且排版正确。`validate.sh` 只提供编译产物的基础辅助检查；
编译后仍需由 Agent 检查内容、事实边界和页面视觉效果。若脚本报错，按日志修复
后重编译，**不要跳过任何报错**。

## 1. 文档类与模板

- 文档类固定：`\documentclass{resume}`，**不要修改 `templates/resume.cls`**。
- 中文字体：macOS 用 `\setCJKmainfont{PingFang SC}`；其他系统替换为可用的中文字体（如 Windows 的 `SimSun`/`Microsoft YaHei`，Linux 的 `Noto Sans CJK SC`）。

## 2. 照片路径

- 照片位于所选 profile 目录（例如当前工作空间的 `profiles/<user>/photo.jpg`
  或全局的 `~/.agents/resume-builder/profiles/<user>/photo.jpg`）。编译发生在
  `output/<user>-<slug>-<日期>/`，因此 `resume.tex` 中引用照片必须使用从输出目录
  指向实际文件的正确路径；全局 profile 不要复制到输出目录。

  ```latex
  \includegraphics[width=2.0cm]{../../profiles/<user>/photo.jpg}
  ```

## 3. resume.cls 提供的结构命令

| 命令 | 用途 |
|------|------|
| `\ResumeName{姓名}` | 标题姓名 |
| `\ResumeContact{项}` / `\ResumeContacts{项A, 项B}` | 联系方式 |
| `\ResumeTitle{}` | 渲染标题区 |
| `\section{章节}` | 章节标题（自带下划线） |
| `\ResumeItem[书签]{机构}{附加信息}{日期}` | 经历条目；附加信息如 `\textnormal{专业，学院\textbar} 学历` |
| `\ResumeUrl{url}{显示文本}` | 带下划线的超链接 |
| `\GrayText{内容}` | 灰色次要文字 |

> `\ResumeItem` 第一个可选参数用于 PDF 书签，一般填"`机构\textbar 学历`"。

## 4. 占位符

- 标题行的岗位名位置，用 `<POSITION_LINE>` 标识，agent 生成时**替换为真实目标岗位名**（如 `AI 质量与评测方向实习生`）。

## 5. 禁止项

- 禁止编造经历、虚构数据、夸大成果。只能基于 `profile.yaml` 改写措辞，不能无中生有。
- 禁止使用 `resume.cls` 未定义的命令。
- 避免裸 Unicode 全角标点与半角混排导致排版错乱；数字、英文用半角，中文间用正常中文标点即可。
- 不出现简历 cls 之外的自定义复杂宏，保持可编译。

## 6. 1 页控制

- 只保留与 JD 相关的内容；最相关排前。
- 措辞精炼；Agent 应在编译后确认 PDF 不超过 1 页，并优先删减低相关内容，
  不要用极端缩小字号掩盖内容过多。
