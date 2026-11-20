#!/usr/bin/env node
/**
 * 语言包完整性检查。
 *
 * 这个插件的字典写在 client.js 里（扁平点号键），而 `t()` 的键来自三处：
 * 字面量 t('x')、PALETTE_META 的 tagline、以及行内拼接的 group.* / strength.*。
 * 少一个键，界面上就会把键名原样显示出来——2026-11-21 就是这样翻的车。
 *
 * 用法：node check-locale.mjs     失败退出码 1
 */
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./client.js', import.meta.url), 'utf8');

function block(name) {
  const start = source.indexOf(`const ${name} = {`);
  if (start === -1) throw new Error(`找不到字典 ${name}`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`字典 ${name} 没有闭合`);
}

const keysOf = (text) => {
  const out = new Set();
  // 键可能写成 'x': 也可能写成 x: ，两种都要认
  for (const m of text.matchAll(/^\s*['"]?([a-zA-Z][\w.-]*)['"]?\s*:/gm)) out.add(m[1]);
  return out;
};

const required = new Set();
for (const m of source.matchAll(/\bt\('([a-zA-Z][\w.-]*)'\)/g)) required.add(m[1]);
for (const m of source.matchAll(/tagline: '([a-zA-Z][\w.-]*)'/g)) required.add(m[1]);
for (const m of source.matchAll(/\|\| '([a-zA-Z][\w.-]*)'\)/g)) required.add(m[1]);

const zh = keysOf(block('zh'));
const en = keysOf(block('en'));

const missingZh = [...required].filter((k) => !zh.has(k));
const missingEn = [...required].filter((k) => !en.has(k));

console.log(`必需键 ${required.size} 个 · zh ${zh.size} 条 · en ${en.size} 条`);
if (missingZh.length) console.log('zh 缺:', missingZh.join(', '));
if (missingEn.length) console.log('en 缺:', missingEn.join(', '));
if (missingZh.length || missingEn.length) {
  console.error('语言包不完整：界面上会显示原始键名');
  process.exit(1);
}
console.log('语言包完整');
