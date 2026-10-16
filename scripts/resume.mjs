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
  if (PLATFORM === 'darwin') {
    // macOS 自带 PingFang SC（skeleton.tex 默认字体）
    console.log('✅ macOS 自带 PingFang SC（推荐字体: PingFang SC）');
  } else if (PLATFORM === 'win32') {
    const fontsDir = path.join(process.env.SystemRoot || 'C:\\Windows', 'Fonts');
    const hasFont = ['msyh.ttc', 'simhei.ttf', 'simsun.ttc'].some((f) =>
      fs.existsSync(path.join(fontsDir, f))
    );
    if (hasFont) {
      console.log('✅ 检测到中文字体（推荐字体: Microsoft YaHei）');
    } else {
      console.log(
        '❌ 未检测到中文字体（Windows 需要 Microsoft YaHei 或 SimSun，推荐字体: Microsoft YaHei）'
      );
      missing = 1;
    }
  } else {
    // linux：fc-list 检测；无 fc-list 时只警告不判失败
    if (!haveCmd('fc-list')) {
      console.log(
        '⚠️ 无 fc-list，无法检测字体；若编译报字体缺失请安装中文字体（推荐字体: Noto Sans CJK SC）'
      );
    } else {
      const r = spawnSync('fc-list', [':lang=zh'], { encoding: 'utf8', shell: false });
      const out = (r.stdout || '').toLowerCase();
      if (/noto|source han|wqy|simsun|simhei|yahei|pingfang/.test(out)) {
        console.log('✅ 检测到中文字体（推荐字体: Noto Sans CJK SC）');
      } else {
        console.log(
          '❌ 未检测到中文字体（Linux 请装 fonts-noto-cjk，并把字体改为 Noto Sans CJK SC，推荐字体: Noto Sans CJK SC）'
        );
        missing = 1;
      }
    }
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
  if (args.length < 2) {
    printUsage([
      '用法: node scripts/resume.mjs new-output <user> <slug>',
      '示例: node scripts/resume.mjs new-output zhangming ai-quality',
    ]);
  }
  const [user, slug] = args;
  const dest = path.join('output', `${user}-${slug}-${localDateYYYYMMDD()}`);

  if (fs.existsSync(dest)) {
    console.error(`❌ 目录已存在: ${dest}（同日重复生成请换不同 slug）`);
    process.exit(1);
  }

  fs.mkdirSync(dest, { recursive: true });
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
    const r = spawnSync('xelatex', [`${basename}.tex`], {
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

  console.log(`✅ 校验通过: ${pdf}`);
  console.error('⚠️ 仍需由 Agent 检查内容、事实边界和页面视觉质量');
  process.exit(0);
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
  '  new-output <user> <slug>             创建 output/<user>-<slug>-<YYYYMMDD>/',
  '  build <path/to/resume.tex>           编译（xelatex ×2，先查引擎+中文宏包）',
  '  validate <path/to/resume.pdf>        编译产物基础检查（页数 / 明显错误）',
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
  case 'check-profile':
    cmdCheckProfile(rest);
    break;
  default:
    printUsage(USAGE);
}
