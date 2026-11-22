/**
 * Palette Pack: the browser half of this bundle.
 *
 * Six studio palettes plus eight classic ramps, each with a light and a dark
 * variant, layered over DSH's own light/dark/system preference through
 * `ctx.theme.overrideTokens`. The plugin registers one row in Settings >
 * General; choosing a palette persists in localStorage and re-applies on the
 * next load. It changes colors only: no layout, corner radius, font,
 * background image, or material tokens.
 */
window.__ModuleLoader__.load({
  id: 'dsh-inkstone-theme',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useState } = React;

    /** Package identity, also the token-layer source name. */
    const SOURCE = 'dsh-inkstone-theme';
    /** Locale namespace for every string this plugin renders. */
    const NS = 'themePack';
    /** Where the chosen palette persists between loads. */
    const STORAGE_KEY = 'dsh-theme-pack:palette:v1';
    const FONT_KEY = 'dsh-theme-pack:font:v1';

    /**
     * 字体方向。DSH 读 --dsh-font-family-text（回退到 -default），所以覆盖这一层
     * 就能换正文字体；代码/终端走另外两个变量。
     * 'auto' 让字体跟着色板走：衬线色板（bench）配衬线，其余配系统无衬线。
     */
    const FONT_STACKS = {
      system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
      serif: "'New York', 'Songti SC', Georgia, 'Times New Roman', serif",
      mono: "'SF Mono', 'JetBrains Mono', Menlo, Consolas, 'PingFang SC', monospace",
    };
    const CODE_STACK = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

    // 走衬线的色板：bench 的身份是"暖纸 + 衬线编辑感"（Inkstone 里 display=serif）。
    const SERIF_PALETTES = new Set(['bench']);

    function fontStackFor(palette, mode) {
      if (mode === 'system' || mode === 'serif' || mode === 'mono') return FONT_STACKS[mode];
      return palette && SERIF_PALETTES.has(palette.id) ? FONT_STACKS.serif : FONT_STACKS.system;
    }
    const STRENGTH_KEY = 'dsh-theme-pack:strength:v1';
    const SIDEBAR_KEY = 'dsh-theme-pack:sidebar:v1';
    const BRAND_KEY = 'dsh-inkstone-theme:brand:v1';
    /** Style tag identity, so a reloaded bundle replaces rather than stacks. */
    const STYLE_ID = 'dsh-inkstone-theme/InkstoneRow.css';

    //#region dictionaries
    const zh = {
      title: '配色方案',
      desc: '与上方的明暗设置配合；每套色板都带浅色与深色两版取值。',
      default: '默认',
      'group.studio': '工作室',
      'group.studio.desc': '七套为 DSH 重新设计的色板，克制、以中性色为主，只留一个信号色。',
      'palette.board.tagline': '雨过天青云破处，汝瓷的冷',
      'palette.bench.tagline': '矿物赭红研成颜料，暖纸上的旧色',
      'palette.motion.tagline': '松木烧烟制的墨，最深的一层',
      'palette.aurora.tagline': '越窑青瓷，釉里透出一层青',
      'palette.dusk.tagline': '兔毫笔锋里的一点紫',
      'palette.kanagawa.tagline': '宣纸本色，落墨即字',
      'palette.watermelon.tagline': '胭脂是妆色，也是印泥的红',
      'brand.title': '侧栏品牌行',
      'brand.desc': '侧栏顶部那个 deepseek HARNESS 标识；隐藏后侧栏从第一行功能开始。',
      'brand.hide': '隐藏',
      'brand.show': '显示',
      'font.title': '字体',
      'font.desc': '跟随色板时，衬线色板（赭石）配衬线，其余用系统无衬线。',
      'font.auto': '跟随色板',
      'font.system': '无衬线',
      'font.serif': '衬线',
      'font.mono': '等宽',
      'group.classic': '经典色板',
      'group.classic.desc': '此前已有的社区色板，保留原样。',
      'palette.default.tagline': '系统原色',
      'palette.board.tagline': '冷白纸面，清透的电光蓝',
      'palette.bench.tagline': '暖纸与墨，一点靛蓝信号',
      'palette.hero.tagline': '中性灰阶，柔和的紫罗兰',
      'palette.motion.tagline': '近黑留白，一点青色呼吸',
      'palette.labs.tagline': '蓝图网格，实验室的蓝',
      'palette.melon.tagline': '酸性青柠，单色 Brutalist',
      'palette.graphite.tagline': '冷峻石墨，清晰的中性阶与一处靛蓝',
      'strength.title': '强调色强度',
      'strength.desc': '克制保留黑白主按钮；标准和鲜明让主按钮逐渐带上色板的强调色。',
      'strength.restrained': '克制',
      'strength.standard': '标准',
      'strength.vivid': '鲜明',
      'sidebar.title': '侧栏材质',
      'sidebar.desc': 'macOS 桌面版专用：让侧栏跟随主题，或保留系统的毛玻璃材质。',
      'sidebar.theme': '跟随主题',
      'sidebar.system': '跟随系统材质',
    };

    const en = {
      'palette.board.tagline': 'Ru-ware sky blue',
      'palette.bench.tagline': 'Ochre pigment',
      'palette.motion.tagline': 'Pine-soot ink',
      'palette.aurora.tagline': 'Celadon',
      'palette.dusk.tagline': 'Purple-hair brush',
      'palette.kanagawa.tagline': 'Xuan paper',
      'palette.watermelon.tagline': 'Rouge',
      'brand.title': "Sidebar brand",
      'brand.desc': "The deepseek HARNESS mark at the top of the sidebar.",
      'brand.hide': "Hidden",
      'brand.show': "Shown",
      'font.title': "Typeface",
      'font.desc': "Follow palette gives the serif palette (Ochre) a serif face; everything else stays on the system sans.",
      'font.auto': "Follow palette",
      'font.system': "Sans",
      'font.serif': "Serif",
      'font.mono': "Mono",
      title: 'Color palette',
      desc: 'Works with the light or dark appearance above; every palette ships a light and a dark variant.',
      default: 'Default',
      'group.studio': 'Studio',
      'group.studio.desc': 'Seven palettes rebuilt for DSH: neutral-first, restrained, with a single signal color.',
      'group.classic': 'Classic palettes',
      'group.classic.desc': 'The community ramps that shipped before, kept unchanged.',
      'palette.default.tagline': 'The built-in DSH palette',
      'palette.board.tagline': 'Cool paper and a crisp electric blue',
      'palette.bench.tagline': 'Warm paper and ink with one indigo signal',
      'palette.hero.tagline': 'Neutral zinc with a soft violet accent',
      'palette.motion.tagline': 'Near-black calm with a cyan pulse',
      'palette.labs.tagline': 'Blueprint neutrals and laboratory blue',
      'palette.melon.tagline': 'Acid lime on a brutalist monochrome base',
      'palette.graphite.tagline': 'Cool graphite, crisp neutrals, one indigo signal',
      'strength.title': 'Accent strength',
      'strength.desc': 'Restrained keeps black or white primary buttons; Standard and Vivid tint them with the palette accent.',
      'strength.restrained': 'Restrained',
      'strength.standard': 'Standard',
      'strength.vivid': 'Vivid',
      'sidebar.title': 'Sidebar material',
      'sidebar.desc': 'macOS desktop only: paint the sidebar with the theme, or keep the native vibrancy.',
      'sidebar.theme': 'Follow theme',
      'sidebar.system': 'Native material',
    };
    //#endregion

    // theme-allow-start: this pack defines color values by design
    //#region color helpers
    function rgb(value) {
      let text = String(value).replace('#', '');
      if (text.length === 3) text = text.split('').map((c) => c + c).join('');
      return [parseInt(text.slice(0, 2), 16), parseInt(text.slice(2, 4), 16), parseInt(text.slice(4, 6), 16)];
    }

    function hexOf(channels) {
      return '#' + channels.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    }

    /** Blend `a` toward `b` by `t` (0 keeps `a`, 1 returns `b`). */
    function mix(a, b, t) {
      const A = rgb(a);
      const B = rgb(b);
      return hexOf(A.map((v, i) => v + (B[i] - v) * t));
    }

    function rgba(color, alpha) {
      const [r, g, b] = rgb(color);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function luminance(color) {
      const [r, g, b] = rgb(color).map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /** OKLab 明度：比 sRGB 亮度更贴近"看起来的深浅"。 */
    function oklabL(color) {
      const [r, g, b] = rgb(color).map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      return 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * q;
    }

    function contrast(a, b) {
      const x = luminance(a);
      const y = luminance(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    }

    /** Black or white, whichever has the higher contrast on `background`. */
    function readable(background) {
      return contrast('#111111', background) >= contrast('#ffffff', background) ? '#111111' : '#ffffff';
    }

    function toHsl(color) {
      const [r, g, b] = rgb(color).map((v) => v / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let hue = 0;
      let sat = 0;
      if (max !== min) {
        const d = max - min;
        sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) hue = (b - r) / d + 2;
        else hue = (r - g) / d + 4;
        hue /= 6;
      }
      return [hue, sat, l];
    }

    function fromHsl(hue, sat, l) {
      if (sat === 0) {
        const v = Math.round(l * 255);
        return hexOf([v, v, v]);
      }
      const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
      const p = 2 * l - q;
      const channel = (t) => {
        let x = t;
        if (x < 0) x += 1;
        if (x > 1) x -= 1;
        if (x < 1 / 6) return p + (q - p) * 6 * x;
        if (x < 1 / 2) return q;
        if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
        return p;
      };
      return hexOf([channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)].map((v) => Math.round(v * 255)));
    }

    /** Nudge lightness until `foreground` reaches the contrast ratio against `background`. */
    function ensureContrast(foreground, background, target) {
      if (contrast(foreground, background) >= target) return foreground;
      const [, sat, initial] = toHsl(foreground);
      const hue = toHsl(foreground)[0];
      const step = luminance(background) > 0.45 ? -0.02 : 0.02;
      let l = initial;
      let out = foreground;
      for (let i = 0; i < 40 && contrast(out, background) < target; i += 1) {
        l = Math.max(0, Math.min(1, l + step));
        out = fromHsl(hue, sat, l);
      }
      return out;
    }
    //#endregion

    //#region palettes
    /**
     * Hand-tuned palette cores: surfaces, borders, text and the neutral
     * call-to-action follow each palette's own ramp; `rolesFrom` fills only the
     * mechanical values (hover alphas, soft tints, scrollbars).
     */
    const PALETTES = [
  {
    "id": "default",
    "label": "DSH",
    "preview": {
      "light": "#ffffff",
      "dark": "#151517",
      "accent": "#4176e6"
    }
  },
  {
    "id": "board",
    "label": "汝窑",
    "preview": {
      "light": "#e9eefb",
      "dark": "#0b0f16",
      "accent": "#1d4ed8"
    },
    "gradient": {
      "washTint": 0.11,
      "accent": false,
      "tint": 0.05
    },
    "light": {
      "bg": "#e9eefb",
      "surface": "#fbfcff",
      "surface2": "#e2e9f8",
      "surface3": "#d5dff2",
      "sidebar": "#f1f4fd",
      "border": [
        "#dadfeb",
        "#cfd3e0",
        "#c1c6d2",
        "#b4b9c4"
      ],
      "text": [
        "#0d1117",
        "#495462",
        "#535e75"
      ],
      "accent": "#1d4ed8",
      "accentSoft": "#e5ebfb",
      "link": "#1d4ed8",
      "cta": "#0d1117",
      "ctaFg": "#e9eefb",
      "bubble": "#e9eefc",
      "bubbleHi": "#dce4fa",
      "code": "#f1f4fd",
      "codeBanner": "#eef2fc",
      "inline": "#e2e9f8",
      "tooltipBg": "#0d1117",
      "tooltipFg": "#e9eefb",
      "success": "#12703f",
      "warn": "#7d5200",
      "error": "#a51f18",
      "done": "#7c3aed"
    },
    "dark": {
      "dark": true,
      "bg": "#0b0f16",
      "surface": "#121924",
      "surface2": "#19212f",
      "surface3": "#212b3b",
      "sidebar": "#0f141d",
      "border": [
        "#1b1f26",
        "#262a31",
        "#33373f",
        "#40454c"
      ],
      "text": [
        "#e9eef7",
        "#a3b0c2",
        "#7f8c9e"
      ],
      "accent": "#8ab0ff",
      "accentSoft": "#253147",
      "link": "#8ab0ff",
      "cta": "#e9eef7",
      "ctaFg": "#0b0f16",
      "bubble": "#253147",
      "bubbleHi": "#2f3d59",
      "code": "#0e141c",
      "codeBanner": "#0d121a",
      "inline": "#19212f",
      "tooltipBg": "#212b3b",
      "tooltipFg": "#e9eef7",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    }
  },
  {
    "id": "bench",
    "label": "赭石",
    "preview": {
      "light": "#e4cebe",
      "dark": "#38271e",
      "accent": "#9a3412"
    },
    "gradient": {
      "washTint": 0.1,
      "accent": false,
      "tint": 0.04
    },
    "light": {
      "bg": "#e4cebe",
      "surface": "#f3e8de",
      "surface2": "#e5d5c4",
      "surface3": "#d8c6af",
      "sidebar": "#ebdacc",
      "border": [
        "#d6c1b2",
        "#cbb8a9",
        "#bfad9f",
        "#b3a195"
      ],
      "text": [
        "#171412",
        "#56504a",
        "#544e47"
      ],
      "accent": "#9a3412",
      "accentSoft": "#ead6ca",
      "link": "#9a3412",
      "cta": "#171412",
      "ctaFg": "#e4cebe",
      "bubble": "#ecdace",
      "bubbleHi": "#e7cfc1",
      "code": "#ebdacc",
      "codeBanner": "#e8d5c6",
      "inline": "#e5d5c4",
      "tooltipBg": "#171412",
      "tooltipFg": "#e4cebe",
      "success": "#12703f",
      "warn": "#7d5200",
      "error": "#a51f18",
      "done": "#7c3aed"
    },
    "dark": {
      "dark": true,
      "bg": "#38271e",
      "surface": "#281e18",
      "surface2": "#342720",
      "surface3": "#3c2e24",
      "sidebar": "#30231b",
      "border": [
        "#45352c",
        "#4f3f36",
        "#5a4b42",
        "#65574e"
      ],
      "text": [
        "#f4efe4",
        "#beb5a3",
        "#ada595"
      ],
      "accent": "#ffa07a",
      "accentSoft": "#4a3328",
      "link": "#ffa07a",
      "cta": "#f4efe4",
      "ctaFg": "#38271e",
      "bubble": "#4a3328",
      "bubbleHi": "#5c3d30",
      "code": "#31231b",
      "codeBanner": "#34251d",
      "inline": "#342720",
      "tooltipBg": "#3c2e24",
      "tooltipFg": "#f4efe4",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    }
  },
  {
    "id": "motion",
    "label": "松烟",
    "preview": {
      "light": "#0a1d15",
      "dark": "#050f0a",
      "accent": "#3ddc97"
    },
    "gradient": {
      "washTint": 0.15,
      "accent": true
    },
    "light": {
      "bg": "#0a1d15",
      "surface": "#0f2a1f",
      "surface2": "#153528",
      "surface3": "#1c4433",
      "sidebar": "#0c231a",
      "border": [
        "#1a2c24",
        "#25372f",
        "#32443c",
        "#405149"
      ],
      "text": [
        "#eaf7ef",
        "#a6c6b4",
        "#7c9d8a"
      ],
      "accent": "#3ddc97",
      "accentSoft": "#143c2b",
      "link": "#3ddc97",
      "cta": "#3ddc97",
      "ctaFg": "#000000",
      "bubble": "#133829",
      "bubbleHi": "#154330",
      "code": "#0c231a",
      "codeBanner": "#0b2018",
      "inline": "#153528",
      "tooltipBg": "#eaf7ef",
      "tooltipFg": "#0a1d15",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    },
    "dark": {
      "dark": true,
      "bg": "#050f0a",
      "surface": "#0a1a12",
      "surface2": "#0f2419",
      "surface3": "#142e20",
      "sidebar": "#08150e",
      "border": [
        "#151f1a",
        "#212b26",
        "#2f3934",
        "#3d4742"
      ],
      "text": [
        "#eefaf3",
        "#a9c9b7",
        "#7fa08d"
      ],
      "accent": "#54e8a8",
      "accentSoft": "#163b2a",
      "link": "#54e8a8",
      "cta": "#54e8a8",
      "ctaFg": "#000000",
      "bubble": "#163b2a",
      "bubbleHi": "#1c4b36",
      "code": "#07140e",
      "codeBanner": "#06120c",
      "inline": "#0f2419",
      "tooltipBg": "#142e20",
      "tooltipFg": "#eefaf3",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    }
  },
  {
    "id": "aurora",
    "label": "青瓷",
    "preview": {
      "light": "#dceff0",
      "dark": "#0a1719",
      "accent": "#0a6f7a"
    },
    "gradient": {
      "washTint": 0.14,
      "accent": true,
      "tint": 0.05
    },
    "light": {
      "bg": "#dceff0",
      "surface": "#f6fbfb",
      "surface2": "#eef7f7",
      "surface3": "#d9e9e9",
      "sidebar": "#e8f4f5",
      "border": [
        "#cfe1e2",
        "#c5d7d8",
        "#b9cbcc",
        "#aebfc0"
      ],
      "text": [
        "#1c2628",
        "#47575c",
        "#5d6c71"
      ],
      "accent": "#0a6f7a",
      "accentSoft": "#deedee",
      "link": "#0a6f7a",
      "cta": "#0e9aa7",
      "ctaFg": "#000000",
      "bubble": "#e3f0f1",
      "bubbleHi": "#d5e7e9",
      "code": "#e8f4f5",
      "codeBanner": "#e3f2f3",
      "inline": "#eef7f7",
      "tooltipBg": "#1c2628",
      "tooltipFg": "#dceff0",
      "success": "#12703f",
      "warn": "#7d5200",
      "error": "#a51f18",
      "done": "#7c3aed"
    },
    "dark": {
      "dark": true,
      "bg": "#0a1719",
      "surface": "#1b2325",
      "surface2": "#262f32",
      "surface3": "#313b3d",
      "sidebar": "#131d1f",
      "border": [
        "#1a2729",
        "#263234",
        "#333f41",
        "#414d4e"
      ],
      "text": [
        "#f0f6f7",
        "#bcc9cc",
        "#8b989c"
      ],
      "accent": "#7fe4ea",
      "accentSoft": "#2b4245",
      "link": "#7fe4ea",
      "cta": "#4fd6de",
      "ctaFg": "#000000",
      "bubble": "#2b4245",
      "bubbleHi": "#335154",
      "code": "#121c1e",
      "codeBanner": "#0e1a1c",
      "inline": "#262f32",
      "tooltipBg": "#313b3d",
      "tooltipFg": "#f0f6f7",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    }
  },
  {
    "id": "dusk",
    "label": "紫毫",
    "preview": {
      "light": "#ebe5f7",
      "dark": "#151024",
      "accent": "#5636b8"
    },
    "gradient": {
      "washTint": 0.14,
      "accent": true,
      "tint": 0.05
    },
    "light": {
      "bg": "#ebe5f7",
      "surface": "#f9f6fd",
      "surface2": "#f2ecfa",
      "surface3": "#e2d9f3",
      "sidebar": "#f1edfa",
      "border": [
        "#ddd7e9",
        "#d3cddf",
        "#c7c1d4",
        "#bbb5c8"
      ],
      "text": [
        "#241f33",
        "#4d4462",
        "#696182"
      ],
      "accent": "#5636b8",
      "accentSoft": "#e9e3f6",
      "link": "#5636b8",
      "cta": "#7c4de8",
      "ctaFg": "#ffffff",
      "bubble": "#ece7f7",
      "bubbleHi": "#e2dbf3",
      "code": "#f1edfa",
      "codeBanner": "#efe9f9",
      "inline": "#f2ecfa",
      "tooltipBg": "#241f33",
      "tooltipFg": "#ebe5f7",
      "success": "#12703f",
      "warn": "#7d5200",
      "error": "#a51f18",
      "done": "#7c3aed"
    },
    "dark": {
      "dark": true,
      "bg": "#151024",
      "surface": "#221d36",
      "surface2": "#2e2945",
      "surface3": "#3a3356",
      "sidebar": "#1c172d",
      "border": [
        "#242033",
        "#302b3e",
        "#3d384b",
        "#4a4558"
      ],
      "text": [
        "#f2eefb",
        "#c6badd",
        "#9488ad"
      ],
      "accent": "#b9a2fc",
      "accentSoft": "#3a3256",
      "link": "#b9a2fc",
      "cta": "#a78bfa",
      "ctaFg": "#000000",
      "bubble": "#3a3256",
      "bubbleHi": "#463d66",
      "code": "#1b162c",
      "codeBanner": "#181329",
      "inline": "#2e2945",
      "tooltipBg": "#3a3356",
      "tooltipFg": "#f2eefb",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    }
  },
  {
    "id": "kanagawa",
    "label": "宣纸",
    "preview": {
      "light": "#f2ecdd",
      "dark": "#0e1520",
      "accent": "#1f4a78"
    },
    "gradient": {
      "washTint": 0.14,
      "accent": true,
      "tint": 0.03
    },
    "light": {
      "bg": "#f2ecdd",
      "surface": "#fdfaf0",
      "surface2": "#f6f0e2",
      "surface3": "#e9e0cd",
      "sidebar": "#f7f2e6",
      "border": [
        "#e4dfd2",
        "#dad5ca",
        "#cdcac0",
        "#c1bfb6"
      ],
      "text": [
        "#26303c",
        "#4d5a68",
        "#626c79"
      ],
      "accent": "#1f4a78",
      "accentSoft": "#e7e8e4",
      "link": "#1f4a78",
      "cta": "#2d5a8e",
      "ctaFg": "#ffffff",
      "bubble": "#ebece6",
      "bubbleHi": "#dee1df",
      "code": "#f7f2e6",
      "codeBanner": "#f5f0e2",
      "inline": "#f6f0e2",
      "tooltipBg": "#26303c",
      "tooltipFg": "#f2ecdd",
      "success": "#12703f",
      "warn": "#7d5200",
      "error": "#a51f18",
      "done": "#7c3aed"
    },
    "dark": {
      "dark": true,
      "bg": "#0e1520",
      "surface": "#192533",
      "surface2": "#233242",
      "surface3": "#2d3d51",
      "sidebar": "#141d2a",
      "border": [
        "#1d242f",
        "#282f3a",
        "#363d47",
        "#434a54"
      ],
      "text": [
        "#eaf1f7",
        "#bac7d3",
        "#8a9aac"
      ],
      "accent": "#74aed6",
      "accentSoft": "#283b4d",
      "link": "#74aed6",
      "cta": "#5d9ec9",
      "ctaFg": "#000000",
      "bubble": "#283b4d",
      "bubbleHi": "#2f465a",
      "code": "#131c29",
      "codeBanner": "#111925",
      "inline": "#233242",
      "tooltipBg": "#2d3d51",
      "tooltipFg": "#eaf1f7",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    }
  },
  {
    "id": "watermelon",
    "label": "胭脂",
    "preview": {
      "light": "#f4e0e5",
      "dark": "#1e1416",
      "accent": "#be123c"
    },
    "gradient": {
      "washTint": 0.14,
      "accent": true,
      "vivid": 1,
      "tint": 0.06
    },
    "light": {
      "bg": "#f4e0e5",
      "surface": "#fffafa",
      "surface2": "#f7e6ea",
      "surface3": "#edd2d8",
      "sidebar": "#f9ecee",
      "border": [
        "#e6d3d8",
        "#dbcace",
        "#cfbfc3",
        "#c3b4b8"
      ],
      "text": [
        "#272729",
        "#545359",
        "#66666d"
      ],
      "accent": "#be123c",
      "accentSoft": "#f9e3e7",
      "link": "#be123c",
      "cta": "#e11d48",
      "ctaFg": "#ffffff",
      "bubble": "#fae7eb",
      "bubbleHi": "#f6dadf",
      "code": "#f9ecee",
      "codeBanner": "#f7e7ea",
      "inline": "#f7e6ea",
      "tooltipBg": "#272729",
      "tooltipFg": "#f4e0e5",
      "success": "#12703f",
      "warn": "#7d5200",
      "error": "#a51f18",
      "done": "#7c3aed"
    },
    "dark": {
      "dark": true,
      "bg": "#1e1416",
      "surface": "#261a1d",
      "surface2": "#322125",
      "surface3": "#3e292e",
      "sidebar": "#22171a",
      "border": [
        "#2d2325",
        "#382e30",
        "#453b3d",
        "#52484a"
      ],
      "text": [
        "#f6eef0",
        "#c0aab0",
        "#a08e94"
      ],
      "accent": "#fda4af",
      "accentSoft": "#483034",
      "link": "#fda4af",
      "cta": "#fb7185",
      "ctaFg": "#000000",
      "bubble": "#483034",
      "bubbleHi": "#5a3b40",
      "code": "#221719",
      "codeBanner": "#201618",
      "inline": "#322125",
      "tooltipBg": "#3e292e",
      "tooltipFg": "#f6eef0",
      "success": "#5fd39b",
      "warn": "#e3b061",
      "error": "#ff8b82",
      "done": "#a78bfa"
    }
  }
];

    /**
     * Picker grouping and one-line character notes. The six studio palettes
     * were designed together against the references in DESIGN.md; the classic
     * group keeps the community ramps that shipped before them.
     */
    const PALETTE_META = {
  "default": { "group": "studio", "tagline": "palette.default.tagline" },
  "board": {
    "group": "studio",
    "tagline": "palette.board.tagline"
  },
  "bench": {
    "group": "studio",
    "tagline": "palette.bench.tagline"
  },
  "motion": {
    "group": "studio",
    "tagline": "palette.motion.tagline"
  },
  "aurora": {
    "group": "studio",
    "tagline": "palette.aurora.tagline"
  },
  "dusk": {
    "group": "studio",
    "tagline": "palette.dusk.tagline"
  },
  "kanagawa": {
    "group": "studio",
    "tagline": "palette.kanagawa.tagline"
  },
  "watermelon": {
    "group": "studio",
    "tagline": "palette.watermelon.tagline"
  }
};

    const SYSTEM_ID = 'default';

    const STUDIO_IDS = PALETTES
      .filter((palette) => palette.id !== SYSTEM_ID && (PALETTE_META[palette.id] || {}).group === 'studio')
      .map((palette) => palette.id);

    const CLASSIC_IDS = PALETTES
      .filter((palette) => palette.id !== SYSTEM_ID && (PALETTE_META[palette.id] || {}).group !== 'studio')
      .map((palette) => palette.id);

    function metaOf(palette) {
      return PALETTE_META[palette.id] || { group: 'classic' };
    }
    //#endregion

    //#region token composition
    /**
     * Turn a hand-tuned palette core into the full role set tokenSet expects.
     * Surfaces, borders, text, accent and the neutral call-to-action are design
     * choices carried by the core; only mechanical values (hover alphas, soft
     * tints, scrollbars) are derived, so every palette behaves the same way.
     */
    function rolesFrom(core, vivid, tint) {
      const dark = core.dark === true;
      const bg = core.bg;
      const surface = core.surface;
      const surface2 = core.surface2;
      const surface3 = core.surface3;
      const [text1, text2, text3] = core.text;
      const [border1, border2, border3, border4] = core.border;
      const accent = core.accent;
      const cta = core.cta;
      const ctaFg = core.ctaFg;
      const tooltipBg = core.tooltipBg;
      const tooltipFg = core.tooltipFg;

      return {
        bg,
        surface,
        surface2,
        surface3,
        sidebar: core.sidebar,
        vivid: vivid === undefined ? 1 : vivid,
        tint: tint === undefined ? 0 : tint,
        navActive: mix(core.sidebar, accent, dark ? 0.24 : 0.2),
        navAccent: mix(core.sidebar, accent, dark ? 0.32 : 0.28),
        input: dark ? surface2 : surface,
        loginInput: surface2,
        menu: dark ? surface2 : surface,
        menuHeader: dark ? surface3 : surface2,
        bubble: core.bubble,
        bubbleHi: core.bubbleHi,
        code: core.code,
        codeBanner: core.codeBanner,
        inlineCode: core.inline || core.code,
        codeSel: surface,
        codeUnsel: core.code,
        border1,
        border2,
        border3,
        border4,
        label1: text1,
        label2: text2,
        label3: text3,
        label4: ensureContrast(ensureContrast(ensureContrast(mix(text3, bg, 0.18), surface, 4.5), bg, 4.5), surface2, 4.5),
        labelDimmed: mix(bg, text1, dark ? 0.2 : 0.08),
        labelPrimaryDimmed: text1,
        labelPrimaryBlish: mix(accent, text1, 0.35),
        labelInverted: ctaFg,
        labelShimmer: rgba(text1, dark ? 0.4 : 0.25),
        labelForeground: ctaFg,
        menuIcon: text2,
        link: core.link,
        accent,
        accentSoft: core.accentSoft,
        brand: cta,
        brandInvert: bg,
        brandText: ctaFg,
        hover: rgba(text1, dark ? 0.07 : 0.05),
        active: rgba(text1, dark ? 0.11 : 0.09),
        hoverSolid: surface2,
        hoverAccent: rgba(accent, 0.12),
        hoverDanger: rgba(core.error, 0.1),
        success: core.success,
        successSec: mix(core.success, bg, 0.45),
        successTer: mix(core.success, surface, 0.88),
        warn: core.warn,
        warnSec: mix(core.warn, bg, 0.4),
        warnTer: mix(core.warn, surface, 0.88),
        warnLabel: core.warn,
        error: core.error,
        errorSec: mix(core.error, bg, 0.4),
        idle: mix(text1, bg, 0.55),
        done: core.done,
        functionColor: core.function || core.done,
        tooltipBg,
        tooltipLabel: tooltipFg,
        tooltipKey: mix(tooltipBg, '#ffffff', 0.16),
        toastBg: tooltipBg,
        toastLabel: tooltipFg,
        switchThumb: dark ? mix(text1, '#ffffff', 0.2) : '#ffffff',
        scrollbar: mix(bg, text1, dark ? 0.18 : 0.14),
        scrollbarHover: mix(bg, text1, dark ? 0.28 : 0.22),
        selection: rgba(accent, dark ? 0.32 : 0.24),
        skeleton: rgba(text1, 0.06),
        illustrationBg: mix(bg, text1, 0.025),
        illustrationSurface: surface2,
        illustrationBacking: surface3,
        illustrationDetail: mix(accent, text1, 0.5),
        illustrationInset: surface2,
        illustrationShadow: surface3,
        diffAdded: rgba(core.success, 0.14),
        diffDeleted: rgba(core.error, 0.14),
        fileAddedBg: mix(surface, core.success, dark ? 0.16 : 0.1),
        fileAddedGutter: mix(surface, core.success, dark ? 0.09 : 0.05),
        fileAddedMarker: core.success,
        fileDelBg: mix(surface, core.error, dark ? 0.16 : 0.1),
        fileDelGutter: mix(surface, core.error, dark ? 0.09 : 0.05),
        fileDelMarker: core.error,
        buttonContrast: text1,
        primaryHover: mix(cta, dark ? '#000000' : '#ffffff', 0.1),
        primaryDimmed: mix(cta, surface, 0.55),
        infoHover: mix(accent, dark ? '#000000' : '#ffffff', 0.1),
        elevated: surface,
        floating: surface,
        floatingHover: surface2,
        ghostBorder: border3,
        ghostFill: surface2,
        ghostHover: surface3,
        toolbarFill: rgba(text1, 0.45),
        toolbarInvisible: rgba(text1, 0.25),
        toolbarHover: rgba(text1, 0.6),
        turnTrigger: surface2,
        turnTriggerHover: surface3,
        cardFill: dark ? surface2 : mix(surface, bg, 0.35),
        cardFillHover: dark ? surface3 : mix(surface, bg, 0.62),
        cardTileFill: rgba('#ffffff', dark ? 0.05 : 0.5),
        settingsCardFill: dark ? surface2 : mix(surface, bg, 0.4),
        settingsCardStroke: border4,
        borderSelected: mix(border4, text2, dark ? 0.4 : 0.25),
        brandNew: accent,
        mask1: rgba('#000000', dark ? 0.5 : 0.24),
        mask2: rgba('#000000', dark ? 0.2 : 0.12),
        mask3: rgba('#000000', 0.48),
        maskPhoto: rgba('#000000', 0.88),
        maskDrop: dark ? rgba('#141416', 0.7) : rgba('#ffffff', 0.7),
        labelOnColor: readable(accent),
        hovercardBg: tooltipBg,
        hovercardLabel1: tooltipFg,
        hovercardLabel2: ensureContrast(mix(tooltipFg, tooltipBg, 0.28), tooltipBg, 4.5),
        hovercardLabel3: ensureContrast(mix(tooltipFg, tooltipBg, 0.45), tooltipBg, 4.5),
        hovercardDone: ensureContrast(mix(core.done, tooltipFg, dark ? 0.15 : 0.32), tooltipBg, 4.5),
        hovercardError: ensureContrast(mix(core.error, tooltipFg, dark ? 0.15 : 0.32), tooltipBg, 4.5),
        jsonHover: rgba(text1, dark ? 0.05 : 0.04),
        jsonIcon: text2,
        jsonKeyword: ensureContrast(accent, surface, 4.5),
        jsonNumber: ensureContrast(core.link, surface, 4.5),
        jsonProperty: ensureContrast(core.done, surface, 4.5),
        jsonPunctuation: text2,
        jsonString: ensureContrast(core.success, surface, 4.5),
        chartMessages: accent,
        chartSystem: text3,
        chartTools: core.done,
        toastAction: ensureContrast(mix(accent, tooltipFg, 0.15), tooltipBg, 4.5),
        trajectory: accent,
        fileUploadTrack: rgba(dark ? '#ffffff' : '#000000', 0.08),
      };
    }

    /**
     * 侧栏色 = 画布掺一点强调色（保住色相），再压一档明度。
     * 只混同一个色板的两个值，不引入新颜色。
     */
    /** 保色相、抬彩度：把每个通道推离均值。k=1 原样返回。 */
    function boostChroma(color, k) {
      if (k === 1) return color;
      const [r, g, b] = rgb(color);
      const mean = (r + g + b) / 3;
      return hexOf([r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(mean + (v - mean) * k)))));
    }

    function sidebarOf(r) {
      // 侧栏 = 画布只压明度，**不掺强调色**。
      // 掺强调色会稀释画布自己的色相：宣纸（暖纸 21）的强调色是靛蓝，
      // 一掺就变成灰纸（10）。强调色交给顶部那层 wash 去表达。
      const dark = luminance(r.bg) < 0.4;
      // 声明了 tint 的色板（如胭脂）：画布掺一点自己的强调色，变成"更浓的同色纸"
      if (r.tint > 0) {
        return boostChroma(mix(r.bg, r.accent, r.tint), r.vivid === undefined ? 1 : r.vivid);
      }
      // 其余色板：只压明度，保住画布自己的色相
      const targetL = dark ? luminance(r.bg) * 0.62 : oklabL(r.bg) - 0.025;
      const currentL = dark ? luminance(r.bg) : oklabL(r.bg);
      const toward = targetL < currentL ? '#000000' : '#ffffff';
      let best = r.bg;
      let bestErr = Infinity;
      for (let t = 0; t <= 0.6; t += 0.004) {
        const candidate = mix(r.bg, toward, t);
        const err = Math.abs((dark ? luminance(candidate) : oklabL(candidate)) - targetL);
        if (err < bestErr) { bestErr = err; best = candidate; }
      }
      return boostChroma(best, r.vivid === undefined ? 1 : r.vivid);
    }

    /** Project one color scheme's roles onto DSH alias token names. */
    function tokenSet(r) {
      const dark = luminance(r.bg) < 0.4;
      return {
        '--dsw-alias-bg-base': r.bg,
        '--dsw-alias-bg-layer-1': r.surface,
        '--dsw-alias-bg-layer-2': r.surface2,
        '--dsw-alias-bg-layer-3': r.surface3,
        '--dsw-alias-bg-overlay': r.surface2,
        '--dsw-alias-bg-module-platform': r.surface2,
        '--dsw-alias-bg-multi-select': r.surface2,
        '--dsw-alias-bg-document-preview': r.surface2,
        '--dsw-alias-bg-document-selection': r.selection,
        '--dsw-alias-bg-skeleton': r.skeleton,
        '--dsw-alias-label-document-preview': r.label2,
        '--dsw-alias-border-inverted': r.border1,
        '--dsw-alias-border-inverted2': r.border2,
        // 边框用墨色的低透明度，而不是把墨和底混成一个不透明灰：
        // 透明线会自己"吃掉"底色，在暖纸/粉底上不会显脏，也更容易调淡。
        '--dsw-alias-border-l1': rgba(r.label1, dark ? 0.1 : 0.055),
        '--dsw-alias-border-l2': rgba(r.label1, dark ? 0.15 : 0.09),
        '--dsw-alias-border-l2-darkmode-thin': rgba(r.label1, dark ? 0.15 : 0.09),
        '--dsw-alias-border-l3': rgba(r.label1, dark ? 0.12 : 0.06),
        '--dsw-alias-border-l4': rgba(r.label1, dark ? 0.26 : 0.18),
        '--dsw-alias-brand-primary': r.brand,
        '--dsw-alias-brand-primary-invert': r.brandInvert,
        '--dsw-alias-brand-text': r.brandText,
        '--dsw-alias-label-primary-foreground': r.labelForeground,
        '--dsw-alias-label-primary-inverted': r.labelInverted,
        '--dsw-alias-label-primary': r.label1,
        '--dsw-alias-label-secondary': r.label2,
        '--dsw-alias-label-tertiary': r.label3,
        '--dsw-alias-label-caption': r.label4,
        '--dsw-alias-label-dimmed': r.labelDimmed,
        '--dsw-alias-label-primary-dimmed': r.labelPrimaryDimmed,
        '--dsw-alias-label-primary-bluish': r.labelPrimaryBlish,
        '--dsw-alias-label-shimmer': r.labelShimmer,
        '--dsw-alias-label-deep-diving': r.accent,
        '--dsw-alias-label-deep-diving-shimmer': rgba(r.accent, 0.35),
        '--dsw-alias-menu-icon': r.menuIcon,
        '--dsw-alias-link': r.link,
        '--dsw-alias-markdown-citation': r.surface2,
        '--dsw-alias-markdown-code-block-banner': r.codeBanner,
        '--dsw-alias-markdown-code-block': r.code,
        '--dsw-alias-markdown-code-segment-selected': r.codeSel,
        '--dsw-alias-markdown-code-segment-unselected': r.codeUnsel,
        '--dsw-alias-markdown-inline-code': r.inlineCode,
        '--dsw-alias-markdown-placeholder': r.surface2,
        '--dsw-alias-markdown-tag': r.surface2,
        '--dsw-specific-bubble': r.bubble,
        '--dsw-specific-bubble-highlight': r.bubbleHi,
        '--dsw-specific-input-major': r.input,
        '--dsw-specific-login-input': r.loginInput,
        '--dsw-specific-menu': r.menu,
        '--dsw-menu-surface-fill': r.menu,
        '--dsw-alias-menu-group-header-fill': r.menuHeader,
        '--dsw-specific-selector': r.surface2,
        // 侧栏：DSH 默认把 fill 掺 3% 蓝再压到 40% 透明，蓝色被洗成灰；
        // 这里直接给出不透明的侧栏色，并显式拉开与画布的明度差（浅色压深一档，深色压更暗）。
        '--dsw-specific-sidebar-fill': sidebarOf(r),
        '--dsw-specific-sidebar-tint': rgba(sidebarOf(r), 0.98),
        '--dsw-specific-sidebar-glass-fill': rgba(sidebarOf(r), luminance(r.bg) < 0.4 ? 0.78 : 0.86),
        '--dsw-specific-sidebar-nav-item-active': r.navActive,
        // 侧栏原生上下渐变的四个端点也归色板管：顶部染一点强调色，底部压一点墨，
        // 否则渐变还是 DSH 默认主题的冷蓝，和色板对不上。
        // 深色主题：顶部用强调色（那是它的身份）；浅色主题：只做明暗，
        // 因为暖纸掺冷强调色会被中和成灰（宣纸 21 → 12）。
        '--dsw-specific-sidebar-wash-top': dark ? rgba(r.accent, 0.16) : rgba('#ffffff', 0.10),
        '--dsw-specific-sidebar-wash-top-clear': rgba(dark ? r.accent : '#ffffff', 0),
        '--dsw-specific-sidebar-wash-bottom-clear': rgba(dark ? '#ffffff' : '#000000', 0),
        '--dsw-specific-sidebar-wash-bottom': rgba(dark ? '#ffffff' : '#000000', dark ? 0.06 : 0.10),
        '--dsw-specific-sidebar-nav-item-active-accent': r.navAccent,
        '--dsw-specific-tip': r.surface2,
        '--dsw-alias-state-business-primary': r.accent,
        '--dsw-alias-state-business-tertiary': r.accentSoft,
        '--dsw-alias-state-done-primary': r.done,
        '--dsw-alias-state-error-primary': r.error,
        '--dsw-alias-state-error-secondary': r.errorSec,
        '--dsw-alias-state-idle-primary': r.idle,
        '--dsw-alias-state-success-primary': r.success,
        '--dsw-alias-state-success-secondary': r.successSec,
        '--dsw-alias-state-success-tertiary': r.successTer,
        '--dsw-alias-state-warn-label': r.warnLabel,
        '--dsw-alias-state-warn-primary': r.warn,
        '--dsw-alias-state-warn-secondary': r.warnSec,
        '--dsw-alias-state-warn-tertiary': r.warnTer,
        '--dsw-alias-switch-thumb': r.switchThumb,
        '--dsw-alias-toast-bg': r.toastBg,
        '--dsw-alias-toast-label': r.toastLabel,
        '--dsw-alias-tooltip-bg': r.tooltipBg,
        '--dsw-alias-tooltip-key-bg': r.tooltipKey,
        '--dsw-alias-turn-trigger-bg': r.turnTrigger,
        '--dsw-alias-turn-trigger-bg-hover': r.turnTriggerHover,
        '--dsw-alias-interactive-bg-hover': r.hover,
        '--dsw-alias-interactive-bg-hover-solid': r.hoverSolid,
        '--dsw-alias-interactive-bg-hover-accent': r.hoverAccent,
        '--dsw-alias-interactive-bg-hover-danger': r.hoverDanger,
        '--dsw-alias-interactive-bg-active': r.active,
        '--dsw-alias-button-contrast-fill': r.buttonContrast,
        '--dsw-alias-button-elevated-fill': r.elevated,
        '--dsw-alias-button-floating-fill': r.floating,
        '--dsw-alias-button-floating-hover': r.floatingHover,
        '--dsw-alias-button-ghost-active-border': r.ghostBorder,
        '--dsw-alias-button-ghost-active-fill': r.ghostFill,
        '--dsw-alias-button-ghost-active-hover': r.ghostHover,
        '--dsw-alias-button-info-fill': r.accent,
        '--dsw-alias-button-info-hover': r.infoHover,
        '--dsw-alias-button-primary-dimmed': r.primaryDimmed,
        '--dsw-alias-button-primary-fill': r.brand,
        '--dsw-alias-button-primary-hover': r.primaryHover,
        '--dsw-alias-button-tool-bar-fill': r.toolbarFill,
        '--dsw-alias-button-tool-bar-fill-invisible': r.toolbarInvisible,
        '--dsw-alias-button-tool-bar-hover': r.toolbarHover,
        '--dsw-alias-scrollbar-bg-l1': r.scrollbar,
        '--dsw-alias-scrollbar-bg-l2': r.scrollbar,
        '--dsw-alias-scrollbar-hover-l1': r.scrollbarHover,
        '--dsw-alias-scrollbar-hover-l2': r.scrollbarHover,
        '--dsw-alias-illustration-background': r.illustrationBg,
        '--dsw-alias-illustration-surface': r.illustrationSurface,
        '--dsw-alias-illustration-backing': r.illustrationBacking,
        '--dsw-alias-illustration-detail': r.illustrationDetail,
        '--dsw-alias-illustration-inset': r.illustrationInset,
        '--dsw-alias-illustration-shadow': r.illustrationShadow,
        '--dsw-alias-code-diff-added': r.diffAdded,
        '--dsw-alias-code-diff-deleted': r.diffDeleted,
        '--dsw-alias-file-diff-added-bg': r.fileAddedBg,
        '--dsw-alias-file-diff-added-gutter': r.fileAddedGutter,
        '--dsw-alias-file-diff-added-marker': r.fileAddedMarker,
        '--dsw-alias-file-diff-deleted-bg': r.fileDelBg,
        '--dsw-alias-file-diff-deleted-gutter': r.fileDelGutter,
        '--dsw-alias-file-diff-deleted-marker': r.fileDelMarker,
        '--dsw-alias-onboarding-accent': r.accent,
        '--dsw-alias-onboarding-card-fill': r.surface,
        '--dsw-alias-onboarding-checkbox-border': r.border3,
        '--dsw-alias-onboarding-secondary-fill': r.surface2,
        '--dsw-alias-bg-mask-1': r.mask1,
        '--dsw-alias-bg-mask-2': r.mask2,
        '--dsw-alias-bg-mask-3': r.mask3,
        '--dsw-alias-bg-mask-drop': r.maskDrop,
        '--dsw-alias-bg-mask-photo': r.maskPhoto,
        '--dsw-alias-border-selected': r.borderSelected,
        '--dsw-alias-brand-primary-new-colorprimary-new-color': r.brandNew,
        '--dsw-alias-card-fill': r.cardFill,
        '--dsw-alias-card-fill-hover': r.cardFillHover,
        '--dsw-alias-card-tile-fill': r.cardTileFill,
        '--dsw-alias-chart-messages': r.chartMessages,
        '--dsw-alias-chart-system': r.chartSystem,
        '--dsw-alias-chart-tools': r.chartTools,
        '--dsw-alias-hovercard-bg': r.hovercardBg,
        '--dsw-alias-hovercard-label-primary': r.hovercardLabel1,
        '--dsw-alias-hovercard-label-secondary': r.hovercardLabel2,
        '--dsw-alias-hovercard-label-tertiary': r.hovercardLabel3,
        '--dsw-alias-hovercard-state-done': r.hovercardDone,
        '--dsw-alias-hovercard-state-error': r.hovercardError,
        '--dsw-alias-json-tree-hover': r.jsonHover,
        '--dsw-alias-json-tree-icon': r.jsonIcon,
        '--dsw-alias-json-tree-keyword': r.jsonKeyword,
        '--dsw-alias-json-tree-number': r.jsonNumber,
        '--dsw-alias-json-tree-property': r.jsonProperty,
        '--dsw-alias-json-tree-punctuation': r.jsonPunctuation,
        '--dsw-alias-json-tree-string': r.jsonString,
        '--dsw-alias-label-on-color': r.labelOnColor,
        '--dsw-alias-settings-card-fill': r.settingsCardFill,
        '--dsw-alias-settings-card-stroke': r.settingsCardStroke,
        '--dsw-alias-toast-action': r.toastAction,
        '--dsw-alias-tooltip-label': r.tooltipLabel,
        '--dsw-alias-trajectory-accent': r.trajectory,
        '--dsw-specific-file-upload-track': r.fileUploadTrack,
        '--dsw-specific-guide-hero': r.illustrationBacking,
        '--dsw-specific-sidebar-right-flash': r.brandNew,
        '--shiki-foreground': r.label1,
        '--shiki-background': r.code,
        '--shiki-token-constant': ensureContrast(r.link, r.code, 4.5),
        '--shiki-token-string': ensureContrast(r.success, r.code, 4.5),
        '--shiki-token-comment': ensureContrast(r.label3, r.code, 4.5),
        '--shiki-token-keyword': ensureContrast(r.accent, r.code, 4.5),
        '--shiki-token-parameter': ensureContrast(r.warn, r.code, 4.5),
        '--shiki-token-function': ensureContrast(r.functionColor, r.code, 4.5),
        '--shiki-token-string-expression': ensureContrast(mix(r.success, r.code, 0.15), r.code, 4.5),
        '--shiki-token-punctuation': ensureContrast(r.label2, r.code, 4.5),
        '--shiki-token-link': ensureContrast(r.link, r.code, 4.5),
        '--dsw-focus-ring-color': r.accent,
      };
    }

    const TOKEN_CACHE = new Map();

    /**
     * Accent strength: 0 leaves the neutral CTA untouched, 1 blends the palette
     * accent into it, 2 uses the accent as-is and widens the accent washes.
     */
    function ctaPair(color, dark) {
      /* Light mode prefers white on the button, dark mode black on pastels. */
      const fg = dark ? '#111111' : '#ffffff';
      return { cta: ensureContrast(color, fg, 4.5), fg };
    }

    function applyStrength(tokens, core, level) {
      if (level === 0) return tokens;
      const pair = ctaPair(level >= 2 ? core.accent : mix(core.cta, core.accent, 0.55), core.dark === true);
      const cta = pair.cta;
      const fg = pair.fg;
      tokens['--dsw-alias-brand-primary'] = cta;
      tokens['--dsw-alias-brand-text'] = fg;
      tokens['--dsw-alias-label-primary-foreground'] = fg;
      tokens['--dsw-alias-label-primary-inverted'] = fg;
      tokens['--dsw-alias-button-primary-fill'] = cta;
      tokens['--dsw-alias-button-primary-hover'] = mix(cta, core.dark ? '#000000' : '#ffffff', 0.12);
      tokens['--dsw-alias-button-primary-dimmed'] = mix(cta, core.surface, 0.6);
      if (level >= 2) {
        tokens['--dsw-alias-interactive-bg-hover-accent'] = rgba(core.accent, 0.2);
        tokens['--dsw-alias-bg-document-selection'] = rgba(core.accent, 0.34);
        tokens['--dsw-alias-state-business-tertiary'] = mix(core.accent, core.surface, 0.8);
      }
      return tokens;
    }

    /** Token overrides for one palette and strength: the same names, one value per scheme. */
    function tokensOf(palette, level) {
      // 字体方向也进缓存键：换字体要重新出一份令牌，否则拿到的是上一份。
      const key = palette.id + ':' + level + ':' + fontMode;
      if (TOKEN_CACHE.has(key)) return TOKEN_CACHE.get(key);
      const stack = fontStackFor(palette, fontMode);
      const fontTokens = {
        '--dsh-font-family-text': stack,
        '--dsh-font-family-code': CODE_STACK,
        '--dsh-font-family-terminal': CODE_STACK,
        '--dsw-font-family': stack,
      };
      const vivid = palette.gradient === undefined || palette.gradient.vivid === undefined ? 1 : palette.gradient.vivid;
      const tint = palette.gradient === undefined || palette.gradient.tint === undefined ? 0 : palette.gradient.tint;
      const light = { ...applyStrength(tokenSet(rolesFrom(palette.light, vivid, tint)), palette.light, level), ...fontTokens };
      const dark = { ...applyStrength(tokenSet(rolesFrom(palette.dark, vivid, tint)), palette.dark, level), ...fontTokens };
      const pairs = {};
      for (const name of Object.keys(light)) pairs[name] = { light: light[name], dark: dark[name] };
      TOKEN_CACHE.set(key, pairs);
      return pairs;
    }
    //#endregion
    // theme-allow-end

    //#region row state
    let activeId = 'default';
    let strength = 0;
    let sidebarMode = 'theme';
    let brandMode = 'hide';
    let fontMode = 'auto';
    const listeners = new Set();
    let switchPalette = () => {};
    let switchStrength = () => {};
    let switchSidebar = () => {};
    let switchBrand = () => {};
    let switchFont = () => {};

    function byId(id) {
      return PALETTES.find((p) => p.id === id);
    }

    function readStored() {
      try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        return byId(value) ? value : 'default';
      } catch (error) {
        return 'default';
      }
    }

    function saveStored(id) {
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch (error) {
        /* Storage may be disabled; the palette still applies for this load. */
      }
    }

    function readStrength() {
      try {
        const level = Number(window.localStorage.getItem(STRENGTH_KEY));
        return level === 1 || level === 2 ? level : 0;
      } catch (error) {
        return 0;
      }
    }

    function saveStrength(level) {
      try {
        window.localStorage.setItem(STRENGTH_KEY, String(level));
      } catch (error) {
        /* Storage may be disabled; the level still applies for this load. */
      }
    }

    function getStrength() {
      return strength;
    }

    function readSidebarMode() {
      try {
        return window.localStorage.getItem(SIDEBAR_KEY) === 'system' ? 'system' : 'theme';
      } catch (error) {
        return 'theme';
      }
    }

    function saveSidebarMode(mode) {
      try {
        window.localStorage.setItem(SIDEBAR_KEY, mode);
      } catch (error) {
        /* Storage may be disabled; the mode still applies for this load. */
      }
    }

    function getSidebarMode() {
      return sidebarMode;
    }

    /* 侧栏品牌行（deepseek HARNESS）默认隐藏：它占的是主题的视觉预算，不是功能。 */
    function readBrandMode() {
      try {
        return window.localStorage.getItem(BRAND_KEY) === 'show' ? 'show' : 'hide';
      } catch (error) {
        return 'hide';
      }
    }

    function saveBrandMode(mode) {
      try {
        window.localStorage.setItem(BRAND_KEY, mode);
      } catch (error) {
        /* Storage may be disabled; the mode still applies for this load. */
      }
    }

    function getBrandMode() {
      return brandMode;
    }

    function readFontMode() {
      try {
        const value = window.localStorage.getItem(FONT_KEY);
        return value === 'system' || value === 'serif' || value === 'mono' ? value : 'auto';
      } catch (error) {
        return 'auto';
      }
    }

    function saveFontMode(mode) {
      try {
        window.localStorage.setItem(FONT_KEY, mode);
      } catch (error) {
        /* Storage may be disabled; the mode still applies for this load. */
      }
    }

    function getFontMode() {
      return fontMode;
    }

    function isDarwinDesktop() {
      const root = document.documentElement;
      return root !== null && root !== undefined && root.dataset !== undefined && root.dataset.platform === 'darwin';
    }

    /** The sidebar root carries a hash-suffixed `*_root` class; walk up from the brand. */
    function findSidebarRoot() {
      const brand = document.querySelector('[class*="_brand"]');
      let node = brand;
      while (node !== null && node !== document.body) {
        const tokens = typeof node.className === 'string' ? node.className.split(/\s+/) : [];
        if (tokens.some((token) => token.endsWith('_root'))) return node;
        node = node.parentElement;
      }
      return null;
    }

    function getActive() {
      return activeId;
    }
    //#endregion

    //#region styles
    const CSS = [
      '.dsh-tp-row{padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}',
      '.dsh-tp-title{color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px;font-weight:500}',
      '.dsh-tp-desc{margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;max-width:52ch}',
      '.dsh-tp-group{margin-top:14px}',
      '.dsh-tp-group-head{display:flex;align-items:baseline;gap:8px;margin-bottom:8px;min-width:0}',
      '.dsh-tp-group-name{flex:none;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;letter-spacing:.08em;text-transform:uppercase}',
      '.dsh-tp-group-note{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}',
      '.dsh-tp-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px}',
      '.dsh-tp-system{margin-bottom:8px}',
      '.dsh-tp-chip-note{color:var(--dsw-alias-label-tertiary);font-size:11px}',
      '.dsh-tp-card{display:flex;flex-direction:column;gap:8px;min-width:0;padding:9px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background .12s ease,border-color .12s ease,box-shadow .12s ease}',
      '.dsh-tp-card:hover{background:var(--dsw-alias-interactive-bg-hover-solid);border-color:var(--dsw-alias-border-l3)}',
      '.dsh-tp-card[aria-pressed="true"]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-layer-2);box-shadow:inset 0 0 0 1px var(--dsw-alias-state-business-primary)}',
      '.dsh-tp-card:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}',
      '.dsh-tp-swatch{display:flex;height:30px;overflow:hidden;border-radius:6px;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}',
      '.dsh-tp-swatch i{flex:1 1 0;min-width:0}',
      '.dsh-tp-card-copy{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.dsh-tp-card-name{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-primary);font-size:12px;line-height:16px;font-weight:500}',
      '.dsh-tp-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
      '.dsh-tp-card-note{display:-webkit-box;overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:15px;-webkit-box-orient:vertical;-webkit-line-clamp:2}',
      '.dsh-tp-toggle{display:flex;align-items:center;gap:8px;width:100%;min-height:24px;margin-top:14px;padding:3px 0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;text-align:left;cursor:pointer}',
      '.dsh-tp-toggle:hover{color:var(--dsw-alias-label-primary)}',
      '.dsh-tp-toggle:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px;border-radius:4px}',
      '.dsh-tp-chevron{flex:none;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid currentColor;transform:rotate(-90deg);transition:transform .12s ease}',
      '.dsh-tp-toggle[aria-expanded="true"] .dsh-tp-chevron{transform:rotate(0deg)}',
      '.dsh-tp-classic{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}',
      '.dsh-tp-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 10px 0 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1;cursor:pointer;transition:background .12s ease,border-color .12s ease,color .12s ease}',
      '.dsh-tp-chip:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsh-tp-chip[aria-pressed="true"]{border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);box-shadow:inset 0 0 0 1px var(--dsw-alias-label-primary);color:var(--dsw-alias-label-primary)}',
      '.dsh-tp-chip:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}',
      '.dsh-tp-sub{margin-top:16px;padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-tp-chip-sm{height:28px;padding:0 10px}',
      '.dsh-tp-dot{width:16px;height:16px;border-radius:50%;flex:none}',
      '@media (prefers-reduced-motion: reduce){.dsh-tp-card,.dsh-tp-chip,.dsh-tp-toggle,.dsh-tp-chevron{transition:none!important}}',
      /* 侧栏跟随主题时保留 DSH 原生的上下渐变（wash-top → wash-bottom，叠在 tint 上），只把底色换成主题的 tint。用简写 background 会连 background-image 一起清零，所以这里拆成 background-color + background-image 两条。 */
      '[data-inkstone-sidebar]{background-color:var(--dsw-specific-sidebar-tint,var(--dsw-specific-sidebar-fill))!important;background-image:linear-gradient(to bottom, var(--dsw-specific-sidebar-wash-top), var(--dsw-specific-sidebar-wash-top-clear) 35%, var(--dsw-specific-sidebar-wash-bottom-clear) 68%, var(--dsw-specific-sidebar-wash-bottom))!important}',
      /* 品牌行隐藏：类名带构建哈希，用后缀匹配；元素仍在 DOM 里，findSidebarRoot 不受影响。 */
      'html[data-inkstone-hide-brand] [class*="_logoRow"] [class*="_brand"]{display:none!important}',
      /* logoRow 本身有 40px 高度，光藏内容会留一块空白；收到 12px 只保住拖拽区。 */
      'html[data-inkstone-hide-brand] [class*="_logoRow"]{height:12px!important;overflow:hidden}',
      /* 侧栏列与主区之间的那条 .5px 实线是 DSH 写死的 border-right。
         两侧已经有明度差（ΔL≈0.03）和渐变，这条线是多余的一笔，直接去掉。
         用 [class*="_sidebarCol"] 而不是完整类名：哈希前缀会变，后缀是稳定的。 */
      /* 与 DSH 哈希类名相关的三条规则不在这里：它们由 syncCompat 在**确认元素存在**
         之后单独注入，DSH 改版导致类名变化时只会「不生效」，不会误伤别的元素。 */
      /* 渐变只出现在两处：主内容画布顶部、以及跟随主题时的侧栏。 */
      'body{background-image:var(--dsh-pp-grad-canvas,none)!important;background-repeat:no-repeat;background-attachment:fixed}',
    ].join('\n');

    /**
     * 与 DSH 内部类名耦合的补丁，单独一层。
     *
     * 侧栏与主区之间有两条缝：侧栏列的 border-right，和一个 .5px 的 flex 分隔条
     * （background 画的，不是边框）。类名带构建哈希，所以用 [class*=] 匹配后缀；
     * 但哈希之外的改名、或 DSH 改版，都可能让选择器失效——这里先查元素是否存在，
     * 存在才注入，不存在就跳过并记一条 console.info，绝不误伤别的元素。
     */
    const COMPAT_CSS = [
      '[data-inkstone-compat] [class*="_sidebarCol"]{border-right-color:transparent!important}',
      '[data-inkstone-compat] [class*="_divider"]{background:transparent!important}',
    ].join('\n');

    function syncCompat() {
      if (typeof document === 'undefined' || document.body === null) return;
      const sidebar = document.querySelector('[class*="_sidebarCol"]');
      const existing = document.querySelector('style[data-plugin-css="' + STYLE_ID + '-compat"]');
      if (sidebar === null) {
        if (existing !== null) existing.remove();
        return;
      }
      if (existing !== null) return;
      try {
        document.documentElement.setAttribute('data-inkstone-compat', '');
        const style = document.createElement('style');
        style.dataset.plugin = SOURCE;
        style.dataset.pluginCss = STYLE_ID + '-compat';
        style.textContent = COMPAT_CSS;
        document.head.append(style);
      } catch (error) {
        /* 补丁是 best-effort：注入失败只意味着分隔线还在，不影响主题。 */
        console.info('[inkstone-theme] compat layer skipped:', error && error.message);
      }
    }

    function installStyles() {
      if (typeof document === 'undefined') return null;
      const existing = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]');
      if (existing !== null) {
        /* Reloading the bundle replaces the sheet instead of keeping stale CSS. */
        existing.textContent = CSS;
        return existing;
      }
      const style = document.createElement('style');
      style.dataset.plugin = SOURCE;
      style.dataset.pluginCss = STYLE_ID;
      style.textContent = CSS;
      document.head.append(style);
      return style;
    }
    //#endregion

    //#region row
    /**
     * Settings > General row: a studio gallery of the six rebuilt palettes, a
     * collapsed list of the classic ramps, then accent strength and the macOS
     * sidebar material switch.
     */
    function PaletteRow({ t }) {
      const [view, setView] = useState(() => ({ palette: getActive(), strength: getStrength(), sidebar: getSidebarMode(), font: getFontMode(), brand: getBrandMode() }));
      const [classicOpen, setClassicOpen] = useState(() => {
        const active = byId(getActive());
        return active !== undefined && metaOf(active).group === 'classic';
      });
      const desktop = isDarwinDesktop();
      useEffect(() => {
        const listener = () => setView({ palette: getActive(), strength: getStrength(), sidebar: getSidebarMode(), font: getFontMode(), brand: getBrandMode() });
        listeners.add(listener);
        return () => listeners.delete(listener);
      }, []);

      const studio = STUDIO_IDS.map(byId).filter((palette) => palette !== undefined);
      const classic = CLASSIC_IDS.map(byId).filter((palette) => palette !== undefined);
      const active = byId(view.palette);

      const previewOf = (palette) => palette.preview || {
        light: palette.light.bg,
        dark: palette.dark.bg,
        accent: palette.light.accent,
      };

      const nameOf = (palette) => (palette.id === 'default' ? t('default') : palette.label);
      const taglineOf = (palette) => t(metaOf(palette).tagline || 'palette.default.tagline');

      const swatch = (palette) => {
        const preview = previewOf(palette);
        const lightSurface = palette.light === undefined ? preview.light : palette.light.surface;
        const darkSurface = palette.dark === undefined ? preview.dark : palette.dark.surface;
        return h('span', { className: 'dsh-tp-swatch', 'aria-hidden': 'true' },
          h('i', { style: { background: preview.light } }),
          h('i', { style: { background: lightSurface } }),
          h('i', { style: { background: preview.accent } }),
          h('i', { style: { background: darkSurface } }),
          h('i', { style: { background: preview.dark } }));
      };

      const card = (palette) => h(
        'button',
        {
          key: palette.id,
          type: 'button',
          className: 'dsh-tp-card',
          'aria-pressed': palette.id === view.palette,
          'aria-label': nameOf(palette) + ' — ' + taglineOf(palette),
          title: taglineOf(palette),
          onClick: () => switchPalette(palette.id),
        },
        swatch(palette),
        h('span', { className: 'dsh-tp-card-copy' },
          h('span', { className: 'dsh-tp-card-name' }, nameOf(palette)),
          h('span', { className: 'dsh-tp-card-note' }, taglineOf(palette))));

      const chip = (palette, withNote = false) => {
        const preview = previewOf(palette);
        return h(
          'button',
          {
            key: palette.id,
            type: 'button',
            className: 'dsh-tp-chip',
            'aria-pressed': palette.id === view.palette,
            title: nameOf(palette),
            onClick: () => switchPalette(palette.id),
          },
          h('span', {
            className: 'dsh-tp-dot',
            style: {
              background: `linear-gradient(135deg, ${preview.light} 0 50%, ${preview.dark} 50% 100%)`,
              boxShadow: `inset 0 0 0 1.5px ${preview.accent}`,
            },
          }),
          h('span', null, nameOf(palette)),
          withNote ? h('span', { className: 'dsh-tp-chip-note' }, taglineOf(palette)) : null);
      };

      return h(
        'div',
        { className: 'dsh-tp-row' },
        h('div', { className: 'dsh-tp-copy' },
          h('div', { className: 'dsh-tp-title' }, t('title')),
          h('div', { className: 'dsh-tp-desc' }, t('desc'))),
        h('div', { className: 'dsh-tp-group' },
          h('div', { className: 'dsh-tp-group-head' },
            h('span', { className: 'dsh-tp-group-name' }, t('group.studio') + ' · ' + studio.length),
            h('span', { className: 'dsh-tp-group-note' }, t('group.studio.desc'))),
          h('div', { className: 'dsh-tp-system' }, chip(byId(SYSTEM_ID), true)),
          h('div', { className: 'dsh-tp-gallery', role: 'group', 'aria-label': t('group.studio') },
            studio.map(card))),
        classic.length > 0 && h('div', { className: 'dsh-tp-group' },
          h('button', {
            type: 'button',
            className: 'dsh-tp-toggle',
            'aria-expanded': classicOpen,
            onClick: () => setClassicOpen((open) => !open),
          },
          h('span', { className: 'dsh-tp-chevron', 'aria-hidden': 'true' }),
          h('span', null, t('group.classic') + ' · ' + classic.length),
          !classicOpen && active !== undefined && metaOf(active).group === 'classic'
            ? h('span', { className: 'dsh-tp-group-note' }, nameOf(active))
            : null),
          classicOpen && h('div', { className: 'dsh-tp-classic', role: 'group', 'aria-label': t('group.classic') },
            classic.map((palette) => chip(palette)))),
        h('div', { className: 'dsh-tp-sub' },
          h('div', { className: 'dsh-tp-title' }, t('strength.title')),
          h('div', { className: 'dsh-tp-desc' }, t('strength.desc')),
          h('div', { className: 'dsh-tp-actions', role: 'group', 'aria-label': t('strength.title') },
            ['strength.restrained', 'strength.standard', 'strength.vivid'].map((key, level) => h(
              'button',
              {
                key,
                type: 'button',
                className: 'dsh-tp-chip dsh-tp-chip-sm',
                'aria-pressed': view.strength === level,
                onClick: () => switchStrength(level),
              },
              h('span', null, t(key)),
            )))),
        h('div', { className: 'dsh-tp-sub' },
          h('div', { className: 'dsh-tp-title' }, t('font.title')),
          h('div', { className: 'dsh-tp-desc' }, t('font.desc')),
          h('div', { className: 'dsh-tp-actions', role: 'group', 'aria-label': t('font.title') },
            ['font.auto', 'font.system', 'font.serif', 'font.mono'].map((key, index) => h(
              'button',
              {
                key,
                type: 'button',
                className: 'dsh-tp-chip dsh-tp-chip-sm',
                'aria-pressed': view.font === ['auto', 'system', 'serif', 'mono'][index],
                onClick: () => switchFont(['auto', 'system', 'serif', 'mono'][index]),
              },
              h('span', null, t(key)),
            )))),
        h('div', { className: 'dsh-tp-sub' },
          h('div', { className: 'dsh-tp-title' }, t('brand.title')),
          h('div', { className: 'dsh-tp-desc' }, t('brand.desc')),
          h('div', { className: 'dsh-tp-actions', role: 'group', 'aria-label': t('brand.title') },
            [['hide', 'brand.hide'], ['show', 'brand.show']].map(([mode, key]) => h(
              'button',
              {
                key: mode,
                type: 'button',
                className: 'dsh-tp-chip dsh-tp-chip-sm',
                'aria-pressed': view.brand === mode,
                onClick: () => switchBrand(mode),
              },
              h('span', null, t(key)),
            )))),
        desktop && h('div', { className: 'dsh-tp-sub' },
          h('div', { className: 'dsh-tp-title' }, t('sidebar.title')),
          h('div', { className: 'dsh-tp-desc' }, t('sidebar.desc')),
          h('div', { className: 'dsh-tp-actions', role: 'group', 'aria-label': t('sidebar.title') },
            [['theme', 'sidebar.theme'], ['system', 'sidebar.system']].map(([mode, key]) => h(
              'button',
              {
                key: mode,
                type: 'button',
                className: 'dsh-tp-chip dsh-tp-chip-sm',
                'aria-pressed': view.sidebar === mode,
                onClick: () => switchSidebar(mode),
              },
              h('span', null, t(key)),
            )))),
      );
    }
    //#endregion

    //#region plugin
    const inject = ['theme', 'slots', 'locale'];

    /** Client plugin body: install the layer, the row, and the cleanup. */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-inkstone-theme: dictionaries');

      const style = installStyles();
      syncCompat();
      // 侧栏可能晚于插件挂载才渲染：两次延时重试即可，不做常驻轮询。
      const compatTimers = [800, 2400].map((delay) => window.setTimeout(syncCompat, delay));
      ctx.effect(() => () => {
        for (const timer of compatTimers) window.clearTimeout(timer);
        if (style !== null) style.remove();
        const compat = document.querySelector('style[data-plugin-css="' + STYLE_ID + '-compat"]');
        if (compat !== null) compat.remove();
        document.documentElement.removeAttribute('data-inkstone-compat');
      }, 'dsh-inkstone-theme: styles');

      /**
       * 把该色板的渐变写成两个自定义属性。只由令牌派生（color-mix），
       * 所以明暗切换时自动跟着走，不需要第二套值。
       */
      const applyBrand = () => {
        const root = document.documentElement;
        if (root === undefined || root === null || typeof root.setAttribute !== 'function') return;
        if (brandMode === 'hide') root.setAttribute('data-inkstone-hide-brand', '');
        else root.removeAttribute('data-inkstone-hide-brand');
      };

      const applyGradient = (palette) => {
        const root = document.documentElement;
        if (root === undefined || root === null || root.style === undefined) return;
        const grad = palette === undefined ? undefined : palette.gradient;
        if (grad === undefined) {
          root.style.removeProperty('--dsh-pp-grad-canvas');
          return;
        }
        const tint = Math.round((grad.washTint || 0.12) * 100);
        root.style.setProperty('--dsh-pp-grad-canvas',
          'linear-gradient(180deg, color-mix(in oklab, var(--dsw-alias-bg-base) ' + (100 - tint) + '%, var(--dsw-alias-state-business-primary)) 0%, var(--dsw-alias-bg-base) 52%, var(--dsw-alias-bg-base) 100%)');
      };

      let layerDispose = null;
      const mount = () => {
        if (layerDispose !== null) {
          layerDispose();
          layerDispose = null;
        }
        const palette = byId(activeId);
        applyBrand();
        applyGradient(palette);
        if (palette === undefined || palette.id === 'default') return;
        layerDispose = ctx.theme.overrideTokens(SOURCE, tokensOf(palette, strength));
      };

      let sidebarTimer = null;
      const syncSidebar = () => {
        const root = findSidebarRoot();
        if (root === null) return;
        if (sidebarMode === 'theme' && isDarwinDesktop()) root.setAttribute('data-inkstone-sidebar', '');
        else root.removeAttribute('data-inkstone-sidebar');
      };

      activeId = readStored();
      strength = readStrength();
      sidebarMode = readSidebarMode();
      brandMode = readBrandMode();
      fontMode = readFontMode();
      mount();
      syncSidebar();
      sidebarTimer = window.setInterval(syncSidebar, 1500);

      switchPalette = (id) => {
        if (byId(id) === undefined || id === activeId) return;
        activeId = id;
        saveStored(id);
        mount();
        for (const listener of listeners) listener();
      };

      switchSidebar = (mode) => {
        if (mode !== 'theme' && mode !== 'system') return;
        if (mode === sidebarMode) return;
        sidebarMode = mode;
        saveSidebarMode(mode);
        syncSidebar();
        for (const listener of listeners) listener();
      };

      switchBrand = (mode) => {
        if (mode !== 'hide' && mode !== 'show') return;
        if (mode === brandMode) return;
        brandMode = mode;
        saveBrandMode(mode);
        applyBrand();
        for (const listener of listeners) listener();
      };

      switchFont = (mode) => {
        if (mode !== 'auto' && mode !== 'system' && mode !== 'serif' && mode !== 'mono') return;
        if (mode === fontMode) return;
        fontMode = mode;
        saveFontMode(mode);
        mount();
        for (const listener of listeners) listener();
      };

      switchStrength = (level) => {
        if (level !== 0 && level !== 1 && level !== 2) return;
        if (level === strength) return;
        strength = level;
        saveStrength(level);
        mount();
        for (const listener of listeners) listener();
      };

      ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'dsh-inkstone-theme',
        order: 12,
        locale: NS,
      }, PaletteRow));

      ctx.effect(() => () => {
        if (layerDispose !== null) {
          layerDispose();
          layerDispose = null;
        }
        if (sidebarTimer !== null) {
          window.clearInterval(sidebarTimer);
          sidebarTimer = null;
        }
        const root = findSidebarRoot();
        if (root !== null) root.removeAttribute('data-inkstone-sidebar');
        listeners.clear();
      }, 'dsh-inkstone-theme: palette layer');
    }
    //#endregion

    return { inject, apply };
  },
});
