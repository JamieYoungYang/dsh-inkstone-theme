#!/usr/bin/env node
/**
 * Palette Pack audit.
 *
 * Loads the browser half in a vm, captures the token pairs it hands to
 * `ctx.theme.overrideTokens`, and checks two things the settings row cannot:
 *
 *   1. every alias token DSH reads is covered by the layer (tokens.required.json);
 *   2. text, focus and state pairs clear their contrast floor in both schemes,
 *      at every accent-strength level.
 *
 * Usage:
 *   node audit.mjs             # studio palettes, every strength level
 *   node audit.mjs --all       # classic palettes too
 *   node audit.mjs --palette board
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, 'client.js'), 'utf8');
const required = JSON.parse(fs.readFileSync(path.join(here, 'tokens.required.json'), 'utf8'));

const all = process.argv.includes('--all');
const paletteFlag = process.argv.indexOf('--palette');
const only = paletteFlag === -1 ? undefined : process.argv[paletteFlag + 1];

const paletteSource = code.slice(code.indexOf('const PALETTES = ['), code.indexOf('\n    ];', code.indexOf('const PALETTES = [')));
// 同时接受 'id': 与 "id": 两种写法（生成器输出的是 JSON 风格）。
const ids = [...paletteSource.matchAll(/^\s*"?id"?:\s*['"]([^'"]+)['"],?$/gm)].map((match) => match[1]);

const STUDIO = new Set(['board', 'bench', 'motion', 'aurora', 'dusk', 'kanagawa', 'watermelon']);

function tokensFor(id, level) {
  let mod;
  const store = {
    'dsh-theme-pack:palette:v1': id,
    'dsh-theme-pack:strength:v1': String(level),
  };
  const sandbox = {
    window: {
      __ModuleLoader__: { load: (loaded) => { mod = loaded; } },
      localStorage: { getItem: (key) => store[key] ?? null, setItem() {} },
      setInterval: () => 0,
      clearInterval() {},
      setTimeout: () => 0,
    },
    document: {
      querySelector: () => null,
      createElement: () => ({ dataset: {}, style: {}, textContent: '', remove() {} }),
      head: { append() {} },
      documentElement: { dataset: {}, style: { setProperty() {}, removeProperty() {} } },
      body: {},
    },
    console,
  };
  vm.runInNewContext(code, sandbox, { filename: 'client.js' });

  const React = {
    createElement: () => null,
    useState: (value) => [typeof value === 'function' ? value() : value, () => {}],
    useEffect() {},
  };
  let captured = null;
  mod.factory(() => React).apply({
    effect: (fn) => { fn(); },
    locale: { register() {} },
    theme: { overrideTokens: (source, tokens) => { captured = tokens; return () => {}; } },
    slots: { inject: (name, fn) => fn(), register: () => ({}) },
  });
  return captured;
}

function parseColor(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.startsWith('#')) {
    let hex = text.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(1);
    if (hex.length === 8) return [0, 2, 4, 6].map((i) => parseInt(hex.slice(i, i + 2), 16)).map((v, i) => (i === 3 ? v / 255 : v));
    return null;
  }
  const match = text.match(/^rgba?\(([^)]+)\)$/);
  if (match === null) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
}

function luminance(rgb) {
  const [r, g, b] = rgb.slice(0, 3).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function composite(fg, bg) {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
}

function contrast(fgText, bgText) {
  const fg = parseColor(fgText);
  const bg = parseColor(bgText);
  if (fg === null || bg === null) return null;
  const backdrop = bg[3] < 1 ? composite(bg, [255, 255, 255]) : bg.slice(0, 3);
  const front = fg[3] < 1 ? composite(fg, backdrop) : fg.slice(0, 3);
  const x = luminance(front);
  const y = luminance(backdrop);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const TEXT = (name, fg, bg, target) => ({ name, fg, bg, target });

function checks(t, mode) {
  const v = (name) => (t[name] ? t[name][mode] : undefined);
  return [
    TEXT('body text on canvas', v('--dsw-alias-label-primary'), v('--dsw-alias-bg-base'), 7),
    TEXT('body text on card', v('--dsw-alias-label-primary'), v('--dsw-alias-bg-layer-1'), 7),
    TEXT('secondary text on card', v('--dsw-alias-label-secondary'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('tertiary text on card', v('--dsw-alias-label-tertiary'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('caption on canvas', v('--dsw-alias-label-caption'), v('--dsw-alias-bg-base'), 4.5),
    TEXT('caption on card', v('--dsw-alias-label-caption'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('caption on raised surface', v('--dsw-alias-label-caption'), v('--dsw-alias-bg-layer-2'), 4.5),
    TEXT('link on canvas', v('--dsw-alias-link'), v('--dsw-alias-bg-base'), 4.5),
    TEXT('link on card', v('--dsw-alias-link'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('accent text on canvas', v('--dsw-alias-state-business-primary'), v('--dsw-alias-bg-base'), 4.5),
    TEXT('accent text on card', v('--dsw-alias-state-business-primary'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('focus accent on card', v('--dsw-alias-state-business-primary'), v('--dsw-alias-bg-layer-1'), 3),
    TEXT('ink on accent button', v('--dsw-alias-label-on-color'), v('--dsw-alias-button-info-fill'), 3),
    TEXT('ink on error fill', v('--dsw-alias-label-on-color'), v('--dsw-alias-state-error-primary'), 3),
    TEXT('ink on primary button', v('--dsw-alias-label-primary-foreground'), v('--dsw-alias-button-primary-fill'), 4.5),
    TEXT('tooltip text', v('--dsw-alias-tooltip-label'), v('--dsw-alias-tooltip-bg'), 4.5),
    TEXT('toast text', v('--dsw-alias-toast-label'), v('--dsw-alias-toast-bg'), 4.5),
    TEXT('toast action', v('--dsw-alias-toast-action'), v('--dsw-alias-toast-bg'), 4.5),
    TEXT('hovercard primary', v('--dsw-alias-hovercard-label-primary'), v('--dsw-alias-hovercard-bg'), 4.5),
    TEXT('hovercard secondary', v('--dsw-alias-hovercard-label-secondary'), v('--dsw-alias-hovercard-bg'), 4.5),
    TEXT('hovercard tertiary', v('--dsw-alias-hovercard-label-tertiary'), v('--dsw-alias-hovercard-bg'), 4.5),
    TEXT('success text', v('--dsw-alias-state-success-primary'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('warning text', v('--dsw-alias-state-warn-primary'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('error text', v('--dsw-alias-state-error-primary'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('done text', v('--dsw-alias-state-done-primary'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('chat bubble text', v('--dsw-alias-label-primary'), v('--dsw-specific-bubble'), 7),
    TEXT('code text', v('--shiki-foreground'), v('--shiki-background'), 7),
    TEXT('json keyword', v('--dsw-alias-json-tree-keyword'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('json string', v('--dsw-alias-json-tree-string'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('json number', v('--dsw-alias-json-tree-number'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('json property', v('--dsw-alias-json-tree-property'), v('--dsw-alias-bg-layer-1'), 4.5),
    TEXT('chart messages', v('--dsw-alias-chart-messages'), v('--dsw-alias-bg-layer-1'), 3),
    TEXT('card boundary', v('--dsw-alias-border-l2'), v('--dsw-alias-bg-base'), 1.05),
  ];
}

let failures = 0;
let checked = 0;
let palettes = 0;
const rows = [];

const modes = ['light', 'dark'];

for (const id of ids) {
  if (only !== undefined && id !== only) continue;
  const studio = STUDIO.has(id);
  if (!all && !studio) continue;
  palettes += 1;
  for (const level of [0, 1, 2]) {
    const tokens = tokensFor(id, level);
    if (tokens === null) continue;
    for (const mode of modes) {
      const missing = required.filter((name) => tokens[name] === undefined);
      if (missing.length > 0) {
        failures += 1;
        rows.push(`${id} ${mode} s${level}: missing ${missing.length} token(s): ${missing.slice(0, 4).join(', ')}`);
      }
      if (!studio) {
        rows.push(`${id.padEnd(10)} ${mode.padEnd(5)} s${level}  coverage only (classic ramp frozen)`);
        continue;
      }
      let worst = { ratio: 99, name: '' };
      for (const check of checks(tokens, mode)) {
        checked += 1;
        const ratio = contrast(check.fg, check.bg);
        if (ratio === null) {
          failures += 1;
          rows.push(`${id} ${mode} s${level}: ${check.name} has an unreadable color`);
          continue;
        }
        if (ratio < check.target) {
          failures += 1;
          rows.push(`${id} ${mode} s${level}: ${check.name} ${ratio.toFixed(2)} < ${check.target}`);
        }
        if (check.name !== 'card boundary' && ratio < worst.ratio) worst = { ratio, name: check.name };
      }
      // 边框要有上限：发丝线是"能看出边界"，不是"画黑框"。
      // 这条是一次真实翻车后加的——混色方向写反，四档 border 全成了近黑色。
      for (const [token, ceiling] of [
        ['--dsw-alias-border-l1', 2.2],
        ['--dsw-alias-border-l2', 2.6],
        ['--dsw-alias-border-l3', 3.2],
        ['--dsw-alias-border-l4', 4.2],
      ]) {
        checked += 1;
        const ratio = contrast(tokens[token], tokens['--dsw-alias-bg-base']);
        if (ratio === null) continue;
        if (ratio > ceiling) {
          failures += 1;
          rows.push(`${id} ${mode} s${level}: ${token.replace('--dsw-alias-', '')} too heavy ${ratio.toFixed(2)} > ${ceiling}`);
        }
      }
      rows.push(`${id.padEnd(10)} ${mode.padEnd(5)} s${level}  floor ${worst.ratio.toFixed(2)}  (${worst.name})`);
    }
  }
}

for (const row of rows) console.log(row);
console.log(`\n${checked} contrast pairs across ${palettes} palettes; ${failures} failure(s).`);
if (failures > 0) {
  console.error('\nAudit failed. Fix the palette data, not the thresholds.');
  process.exitCode = 1;
} else {
  console.log('Audit passed.');
}
