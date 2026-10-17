#!/usr/bin/env node
// 简历 skill 的跨平台命令行入口（纯 Node 标准库，无第三方依赖）。
// 取代原 check_env.sh / new_output.sh / build.sh / validate.sh，
// macOS / Linux / Windows 原生终端使用同一套命令。
//
// 用法:
//   node scripts/resume.mjs check-env
//   node scripts/resume.mjs new-output <user> <slug>
//   node scripts/resume.mjs build <path/to/resume.tex>
//   node scripts/resume.mjs validate <path/to/resume.pdf>
//   node scripts/resume.mjs check-profile <path/to/profile.yaml>
//
// 约定：所有外部调用走 spawnSync 传参数数组（不使用 shell），路径统一走 node:path；
// 失败必须非零退出，机械动作保持确定性。

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLATFORM = process.platform; // darwin / linux / win32

// ---------- 通用工具 ----------

/** 检测外部命令是否可用：跑 <cmd> --version 看退出码，三平台通用（不用 which/where）。 */
function haveCmd(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { stdio: 'ignore', shell: false });
  return !r.error && r.status === 0;
}

/** 取外部命令输出的首行（用于打印版本号）。 */
function cmdFirstLine(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: false });
  if (r.error || r.status !== 0) return '';
  return (r.stdout || '').split(/\r?\n/)[0].trim();
}

/** 宏包检测：kpsewhich <file>；没有 kpsewhich 时视为缺失。 */
function kpseHas(file) {
  if (!haveCmd('kpsewhich', ['--version'])) return false;
  const r = spawnSync('kpsewhich', [file], { stdio: 'ignore', shell: false });
  return !r.error && r.status === 0;
}

function probeCjkFont(fontName) {
  if (!haveCmd('xelatex') || !kpseHas('xeCJK.sty')) return false;
  const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-font-'));
  const tex = [
    '\\documentclass{article}',
    '\\usepackage{xeCJK}',
    `\\setCJKmainfont{${fontName}}`,
    '\\begin{document}',
    '中文测试',
    '\\end{document}',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(probeDir, 'probe.tex'), tex, 'utf8');
  const result = spawnSync('xelatex', ['-interaction=nonstopmode', '-file-line-error', 'probe.tex'], {
    cwd: probeDir,
    encoding: 'utf8',
    shell: false,
  });
  const logText = `${result.stdout || ''}\n${result.stderr || ''}`;
  fs.rmSync(probeDir, { recursive: true, force: true });
  if (result.error || result.status !== 0) return false;
  return !/Missing character|undefined control sequence|Font .* not found|emergency stop/i.test(logText);
}

function recommendedCjkFont() {
  const candidates =
    PLATFORM === 'darwin'
      ? ['PingFang SC', 'Hiragino Sans GB']
      : PLATFORM === 'win32'
        ? ['Microsoft YaHei', 'msyh.ttc', 'SimSun', 'simsun.ttc', 'SimHei', 'simhei.ttf']
        : ['Noto Sans CJK SC', 'Source Han Sans SC', 'WenQuanYi Zen Hei', 'SimSun'];
  return candidates.find((font) => probeCjkFont(font)) || '';
}

function printUsage(lines, exitCode = 1) {
  for (const line of lines) console.error(line);
  process.exit(exitCode);
}

function localDateYYYYMMDD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

// ---------- check-env ----------

function cmdCheckEnv() {
  let missing = 0;

  console.log('== 1. xelatex 引擎 ==');
  if (haveCmd('xelatex')) {
    console.log(`✅ ${cmdFirstLine('xelatex')}`);
  } else {
    console.log('❌ 缺少 xelatex 引擎');
    missing = 1;
  }

  console.log('== 2. 中文宏包（basic/minimal 版常缺，必须补） ==');
  for (const pkg of ['ctexart.cls', 'xeCJK.sty', 'xeCJKfntef.sty', 'zhnumber.sty']) {
    if (kpseHas(pkg)) {
      console.log(`✅ ${pkg}`);
    } else {
      console.log(`❌ 缺少 ${pkg}`);
      missing = 1;
    }
  }

  console.log('== 3. 基础宏包 ==');
  for (const pkg of [
    'geometry.sty',
    'fancyhdr.sty',
    'enumitem.sty',
    'footmisc.sty',
    'hyperref.sty',
    'xcolor.sty',
  ]) {
    if (kpseHas(pkg)) {
      console.log(`✅ ${pkg}`);
    } else {
      console.log(`❌ 缺少 ${pkg}`);
      missing = 1;
    }
  }

  console.log('== 4. 中文字体 ==');
  const cjkFont = recommendedCjkFont();
  if (cjkFont) {
    console.log(`✅ 检测到可由 XeLaTeX 加载的中文字体（推荐字体: ${cjkFont}）`);
  } else {
    console.log(
      `❌ 未检测到可由 XeLaTeX 加载的中文字体（${
        PLATFORM === 'linux'
          ? 'Linux 请装 fonts-noto-cjk'
          : PLATFORM === 'darwin'
            ? 'macOS 请检查字体是否已注册到系统字体库；文件存在不代表 fontspec 可按名字找到'
            : 'Windows 请检查 Microsoft YaHei / SimSun / SimHei 或对应字体文件是否可被 fontspec 找到'
      }）`
    );
    missing = 1;
  }

  console.log();
  if (missing === 0) {
    console.log('✅ 编译环境完整，可直接运行 build');
    process.exit(0);
  }

  console.log('----------------------------------------');
  console.log('❌ 编译环境不完整。按平台安装最小编译包：');
  console.log();
  if (PLATFORM === 'darwin') {
    console.log('  macOS · 完全没装 TeX Live：');
    console.log('    brew install --cask basictex       # 或 mactex，完整版自带中文宏包');
    console.log('  macOS · 已装 basic/minimal（只补中文宏包）：');
    console.log('    sudo tlmgr update --self && sudo tlmgr install collection-langchinese');
  } else if (PLATFORM === 'win32') {
    console.log('  Windows · 完全没装 TeX Live：');
    console.log('    到 https://tug.org/texlive/ 下载安装器，选择 scheme-basic');
    console.log('  Windows · 补中文宏包与依赖（可能需要管理员权限的终端）：');
    console.log('    tlmgr install collection-langchinese enumitem footmisc');
  } else {
    console.log('  Ubuntu / Debian：');
    console.log('    sudo apt install texlive-xetex texlive-lang-chinese texlive-fonts-extra fonts-noto-cjk');
    console.log('  其它 Linux（用 tlmgr 补中文宏包）：');
    console.log('    sudo tlmgr install collection-langchinese');
  }
  console.log();
  console.log('装完后重跑 check-env 确认，再进行编译。');
  process.exit(1);
}

// ---------- new-output ----------

function cmdNewOutput(args) {
  // 解析可选参数 --photo <path>（把证件照复制进输出目录，tex 里引用本地 photo.<ext>）
  let photo = null;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--photo') {
      photo = args[++i];
    } else if (args[i].startsWith('--photo=')) {
      photo = args[i].slice('--photo='.length);
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length < 2) {
    printUsage([
      '用法: node scripts/resume.mjs new-output <user> <slug> [--photo <path>]',
      '示例: node scripts/resume.mjs new-output zhangming ai-quality --photo photo.jpg',
    ]);
  }
  const [user, slug] = positional;
  const dest = path.join('output', `${user}-${slug}-${localDateYYYYMMDD()}`);

  // 先校验照片存在，再建目录，避免失败时留下空目录
  let photoName = null;
  if (photo !== null) {
    if (!fs.existsSync(photo)) {
      console.error(`❌ 照片不存在: ${photo}`);
      process.exit(1);
    }
    photoName = `photo${path.extname(photo).toLowerCase() || '.jpg'}`;
  }

  if (fs.existsSync(dest)) {
    console.error(`❌ 目录已存在: ${dest}（同日重复生成请换不同 slug）`);
    process.exit(1);
  }

  fs.mkdirSync(dest, { recursive: true });

  if (photoName !== null) {
    fs.copyFileSync(photo, path.join(dest, photoName));
    console.log(`✅ 已复制照片: ${photoName}（tex 中引用 {${photoName}}）`);
  }

  console.log(dest);
}

// ---------- build ----------

function cmdBuild(args) {
  if (args.length < 1) {
    printUsage(['用法: node scripts/resume.mjs build <path/to/resume.tex>']);
  }
  const texFile = args[0];
  const dir = path.resolve(path.dirname(texFile));
  const basename = path.basename(texFile, path.extname(texFile));
  const clsSrc = path.join(SCRIPT_DIR, '..', 'templates', 'resume.cls');

  if (!fs.existsSync(clsSrc)) {
    console.error(`❌ 找不到 ${clsSrc}（脚本应位于 skill 的 scripts/ 目录内）`);
    process.exit(1);
  }

  // resume.cls 必须和 .tex 在同一目录
  try {
    fs.copyFileSync(clsSrc, path.join(dir, 'resume.cls'));
  } catch (err) {
    console.error(`❌ 复制 resume.cls 失败: ${err.message}`);
    process.exit(1);
  }

  if (!haveCmd('xelatex')) {
    console.error('❌ 未检测到 xelatex 引擎。运行 node scripts/resume.mjs check-env 查看安装指引');
    process.exit(1);
  }

  // 中文宏包检测（basic/minimal 版 TeX Live 常缺，否则会报晦涩的 File 'ctexart.cls' not found）
  if (!kpseHas('ctexart.cls')) {
    console.error(
      '❌ 缺少中文宏包 ctex（ctexart.cls）。运行 node scripts/resume.mjs check-env 查看完整环境与安装指引'
    );
    process.exit(1);
  }

  // 连续跑两次生成正确的 PDF 书签；输出透传给调用方
  for (let i = 0; i < 2; i++) {
    const r = spawnSync('xelatex', ['-interaction=nonstopmode', `${basename}.tex`], {
      cwd: dir,
      stdio: 'inherit',
      shell: false,
    });
    if (r.error) {
      console.error(`❌ 调用 xelatex 失败: ${r.error.message}`);
      process.exit(1);
    }
    if (r.status !== 0) {
      process.exit(r.status === null ? 1 : r.status);
    }
  }

  console.log(`✅ 编译完成: ${path.join(dir, basename + '.pdf')}`);
}

// ---------- validate ----------

function cmdValidate(args) {
  if (args.length < 1) {
    printUsage(['用法: node scripts/resume.mjs validate <path/to/resume.pdf>']);
  }
  const pdf = args[0];
  const dir = path.resolve(path.dirname(pdf));
  const basename = path.basename(pdf, path.extname(pdf));
  const log = path.join(dir, `${basename}.log`);

  if (!fs.existsSync(pdf)) {
    console.error(`❌ PDF 不存在: ${pdf}`);
    process.exit(1);
  }

  if (fs.existsSync(log)) {
    const content = fs.readFileSync(log, 'utf8');

    // 页数：xelatex 日志形如 "Output written on resume.pdf (1 page, ...)"。
    // 页数只是机械证据；页面布局和 A4 视觉效果仍由 Agent 检查。
    const pagesMatch = content.match(/Output written on [^\r\n]*\((\d+) pages?/);
    if (pagesMatch && pagesMatch[1] !== '1') {
      console.error(`❌ PDF 共 ${pagesMatch[1]} 页，必须控制在 1 页 A4`);
      process.exit(1);
    }

    // 字体缺失 / 未定义命令 / 紧急停止
    const errRe = /Missing character|undefined control sequence|Font .* not found|emergency stop/gi;
    const hits = content.split(/\r?\n/).filter((line) => {
      errRe.lastIndex = 0;
      return errRe.test(line);
    });
    if (hits.length > 0) {
      console.error('❌ 编译日志发现字体缺失或未定义命令：');
      for (const line of hits.slice(0, 5)) console.error(line);
      process.exit(1);
    }
  } else {
    console.error(`⚠️ 未找到日志 ${log}，跳过编译日志检查；请 Agent 直接检查 PDF`);
  }

  // ---- 内容检查（读同名 resume.tex；没有 tex 时跳过）----
  const tex = path.join(dir, `${basename}.tex`);
  if (fs.existsSync(tex)) {
    checkResumeContent(fs.readFileSync(tex, 'utf8'));
  } else {
    console.error(`⚠️ 未找到同名 ${basename}.tex，跳过内容检查`);
  }

  console.log(`✅ 校验通过: ${pdf}`);
  console.error('⚠️ 仍需由 Agent 检查内容、事实边界和页面视觉质量');
  process.exit(0);
}

/** tex 内容检查：联系方式 / 日期格式 / 超长 bullet / 夸大词 / 残留占位符。 */
function checkResumeContent(tex) {
  const problems = [];
  const warnings = [];

  // 1) 联系方式：电话（含分隔符的可疑格式）与邮箱格式
  const badPhone = tex.match(/(?<!\d)1[3-9]\d[\d\s-]{8,}(?!\d)/g) || [];
  for (const p of badPhone) {
    if (!/^1[3-9]\d{9}$/.test(p.replace(/[\s-]/g, ''))) {
      warnings.push(`电话格式可疑: ${p.trim()}`);
    }
  }
  // 邮箱：抓含 @ 的 token 里明显畸形的（缺域名 / 缺顶级域）
  const emailLike = tex.match(/[\w.+-]+@[\w.-]*/g) || [];
  for (const e of emailLike) {
    if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(e)) {
      warnings.push(`邮箱格式可疑: ${e}`);
    }
  }

  // 2) 日期格式：\ResumeItem 第 4 参里的日期；目标 YYYY.MM / YYYY.MM -- YYYY.MM / YYYY.MM -- 至今
  const itemBlocks = [...tex.matchAll(/\]\[([^\]]*)\]\s*$/gm)];
  for (const m of itemBlocks) {
    const d = m[1].trim();
    if (!d) continue;
    const ok =
      /^(\d{4}(\.\d{2})?)(\s*(--|-|—|~)\s*(\d{4}(\.\d{2})?|至今))?$/.test(d) ||
      /^present$|^now$|^current$/i.test(d);
    if (!ok) warnings.push(`日期格式请统一为 YYYY.MM 或 YYYY.MM -- YYYY.MM/至今: "${d}"`);
  }
  // 常见混排：中文日期、英文月名混用
  if (/\d{4}\s*年\s*\d{1,2}\s*月/.test(tex) || /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}/.test(tex)) {
    warnings.push('日期存在中英混排（如"2024年3月"或 "Mar 2024"），建议统一为 YYYY.MM');
  }

  // 3) 超长 bullet：itemize 里单条 \item 超过 120 字符（中文按 1 字符计）
  const items = tex.match(/\\item[^\\]{1,600}/g) || [];
  for (const it of items) {
    const text = it.replace(/^\\item\s*/, '').replace(/\s+/g, ' ');
    if (text.length > 120) {
      warnings.push(`bullet 过长（${text.length} 字符），建议拆分或精简: "${text.slice(0, 40)}..."`);
    }
  }

  // 4) 夸大词 + 量化断言：无数字支撑的夸大表述
  const hypeRe = /(显著提升|大幅优化|极大改善|大幅降低|业界领先|顶尖|精通|深谙|精通各种|遥遥领先|最强|完美|卓越|惊人)/g;
  const hypeHits = [...tex.matchAll(hypeRe)];
  for (const h of hypeHits) {
    warnings.push(`夸大词"${h[1]}"：请给出数据依据，或改为可核实的表述`);
  }
  // 量化断言必须带数字（如"提升30%"是好的；"提升明显"会被夸大词抓）
  const vagueQuant = /(提升|下降|降低|增长|优化)(明显|很多|很多|显著)/g;
  for (const v of tex.matchAll(vagueQuant)) {
    warnings.push(`量化描述 "${v[0]}" 缺少具体数字，建议补数据或删除`);
  }

  // 5) 残留占位符
  const placeholders = tex.match(/<[A-Z_]{3,}>|\bTODO\b|\bTBD\b|待补充|XX+/g) || [];
  for (const p of new Set(placeholders)) {
    problems.push(`残留占位符: ${p}`);
  }

  // 输出：先列警告（建议修）供参考，再列问题（必须修）；有任一问题则整体失败
  if (warnings.length > 0) {
    console.error(`⚠️ 内容检查提示（建议修正，${warnings.length} 项）:`);
    for (const w of warnings.slice(0, 15)) console.error(`  ${w}`);
    console.error('  → 以上为脚本提示，Agent 需逐条判断后决定是否修正。');
  }
  if (problems.length > 0) {
    console.error('❌ 内容检查发现问题（必须修复）:');
    for (const p of problems.slice(0, 10)) console.error(`  ${p}`);
    process.exit(1);
  }

  // ---- 事实核对清单（factual claims）----
  console.log();
  console.log('== 事实核对清单（Agent 交付前必须逐条向用户确认） ==');
  const claims = [];
  // 年份区间、百分比、星级、评分、名次等硬指标
  // tex 中 % 常写作 \%，正则需容忍转义反斜杠
  const pct = tex.match(/(\d+(\.\d+)?)\s*\\?%/g) || [];
  const stars = tex.match(/(\d+)\s*stars?/gi) || [];
  const ranks = tex.match(/(前\s*\d+%|top\s*\d+%?|前\s*\d+\s*名|排名第?\s*\d+)/gi) || [];
  const quant = tex.match(/(提升|下降|降低|增长|优化|覆盖|处理|支持)\s*了?\s*\d+(\.\d+)?\s*(%|倍|万|亿|个|条|次|s|ms)/gi) || [];
  const ranges = tex.match(/从\s*\d+(\.\d+)?\s*(提升|增长|优化)?\s*到\s*\d+(\.\d+)?/g) || [];
  const years = tex.match(/\d{4}\s*\.\s*\d{2}\s*(--|-|—|~|至)\s*(\d{4}\s*\.\s*\d{2}|至今)/g) || [];
  const unique = new Set([...pct, ...stars, ...ranks, ...quant, ...ranges, ...years]);
  for (const c of unique) claims.push(c.trim());
  if (claims.length === 0) {
    console.log('  （未发现量化断言；仍需确认经历名称、职责范围和技能水平的真实性）');
  } else {
    for (const c of claims.slice(0, 20)) console.log(`  □ ${c}`);
  }
  console.log('  → 交付前请用户对以上每一项勾选确认；无法核实的删掉或改成保守表述。');
}

// ---------- preview ----------

/** 预览用中文字体：优先与 check-env 相同的实测探测，探测不到时用平台默认。 */
function previewFont() {
  return (
    recommendedCjkFont() ||
    (PLATFORM === 'darwin' ? 'PingFang SC' : PLATFORM === 'win32' ? 'msyh.ttc' : 'Noto Sans CJK SC')
  );
}

function cmdPreview(args) {
  const previewDir = path.join(SCRIPT_DIR, '..', 'templates', 'preview');
  const list = args.filter((a) => !a.startsWith('--'));
  const outIdx = args.indexOf('--out');

  // 列出模式：无模板名参数时打印全部模板
  if (list.length === 0) {
    if (!fs.existsSync(previewDir)) {
      console.error(`❌ 找不到模板目录: ${previewDir}`);
      process.exit(1);
    }
    const files = fs.readdirSync(previewDir).filter((f) => f.endsWith('.tex'));
    if (files.length === 0) {
      console.error('⚠️ 模板目录为空');
      process.exit(0);
    }
    console.log('可用模板（node scripts/resume.mjs preview <name> 预览编译）:');
    for (const f of files) {
      const name = path.basename(f, '.tex');
      // 取样例第二行注释作为简介
      const first = fs.readFileSync(path.join(previewDir, f), 'utf8').split(/\r?\n/)[1] || '';
      const brief = first.replace(/^%\s*/, '');
      console.log(`  ${name}${brief ? '  —— ' + brief : ''}`);
    }
    process.exit(0);
  }

  // 编译模式：preview <name> [--out <dir>]
  const name = list[0];
  const src = path.join(previewDir, `${name}.tex`);
  if (!fs.existsSync(src)) {
    console.error(`❌ 模板不存在: ${name}（先跑不带参数的 preview 查看列表）`);
    process.exit(1);
  }

  const outDir =
    outIdx >= 0 && args[outIdx + 1]
      ? args[outIdx + 1]
      : path.join('output', `preview-${name}-${localDateYYYYMMDD()}`);
  fs.mkdirSync(outDir, { recursive: true });

  // 按探测结果替换字体占位符，落盘为 resume.tex 再走常规 build
  const font = previewFont();
  const tex = fs.readFileSync(src, 'utf8').replaceAll('<CJK_FONT>', font);
  const destTex = path.join(outDir, 'resume.tex');
  fs.writeFileSync(destTex, tex);
  console.log(`✅ 模板 ${name} 已应用字体 ${font}，输出到 ${destTex}`);
  console.log(`   看完效果想定制内容，把 ${destTex} 作为起点改写即可。`);

  cmdBuild([destTex]);
}

// ---------- check-profile ----------

function cmdCheckProfile(args) {
  if (args.length < 1) {
    printUsage(['用法: node scripts/resume.mjs check-profile <path/to/profile.yaml>']);
  }
  const script = path.join(SCRIPT_DIR, 'check_profile.py');
  if (!fs.existsSync(script)) {
    console.error(`❌ 找不到 ${script}`);
    process.exit(1);
  }

  // 可选依赖：优先 python3，Windows 上退回 python；都检测不到则跳过并以 0 退出
  const python = ['python3', 'python'].find((cmd) => haveCmd(cmd));
  if (!python) {
    console.error('⚠️ 未检测到 python3，跳过 profile 结构校验');
    process.exit(0);
  }

  const r = spawnSync(python, [script, args[0]], { stdio: 'inherit', shell: false });
  if (r.error) {
    console.error(`⚠️ 调用 ${python} 失败（${r.error.message}），跳过 profile 结构校验`);
    process.exit(0);
  }
  process.exit(r.status === null ? 1 : r.status);
}

// ---------- 入口 ----------

const USAGE = [
  '用法: node scripts/resume.mjs <command> [args]',
  '',
  '命令:',
  '  check-env                            体检最小编译环境（引擎/中文宏包/字体）',
  '  new-output <user> <slug> [--photo <path>]',
  '                                       创建 output/<user>-<slug>-<YYYYMMDD>/，',
  '                                       --photo 可选：复制证件照为输出目录的 photo.<ext>',
  '  build <path/to/resume.tex>           编译（xelatex ×2，先查引擎+中文宏包）',
  '  validate <path/to/resume.pdf>        产物检查：页数/编译错误 + 内容检查',
  '                                       （联系方式/日期/超长 bullet/夸大词/占位符）',
  '                                       + 事实核对清单（交付前须逐条确认）',
  '  preview                              列出可用模板（templates/preview/*.tex）',
  '  preview <name> [--out <dir>]         按平台字体编译模板预览 PDF，可直接改其输出',
  '                                       的 resume.tex 作为正式简历起点',
  '  check-profile <path/to/profile.yaml> 校验 profile.yaml（可选，需 python3 + pyyaml）',
];

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case 'check-env':
    cmdCheckEnv();
    break;
  case 'new-output':
    cmdNewOutput(rest);
    break;
  case 'build':
    cmdBuild(rest);
    break;
  case 'validate':
    cmdValidate(rest);
    break;
  case 'preview':
    cmdPreview(rest);
    break;
  case 'check-profile':
    cmdCheckProfile(rest);
    break;
  default:
    printUsage(USAGE);
}
