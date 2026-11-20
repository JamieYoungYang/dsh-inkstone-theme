# Palette Pack · Studio Edition 设计笔记

这份笔记记录 3.0 重做的依据：先拆六套参考组件库的视觉语言，再把它们收敛成
DSH 能消费的颜色 token，最后用一套可审计的规则生成六套新色板。

旧版是 8 套社区配色（Catppuccin、Nord、Primer、Linear、Gruvbox、Rosé Pine、
Tokyo Night、Solarized）直接搬到 DSH。它们本身都好看，但共同问题是：

- 画布和卡片都带明显色相，整屏像给 DSH 套了一层滤镜；
- 强调色使用面积偏大，主按钮、气泡、选中态、链接一起抢注意力；
- 表面层级靠透明度堆出来，暖色和深色画布上容易发浑；
- token 覆盖不全，卡片、JSON 树、hovercard、chart 等位置仍回落到 DSH 默认色。

3.0 不再增加“另一套好看的颜色”，而是先确定 DSH 这种长时间阅读、以文本和工具
结果为主的界面需要什么，再让六套色板回答同一个问题。

---

## 1. 六个参考，各取什么

### BoardUI — 智能体界面的设计系统

[BoardUI](https://github.com/BoardUI/boardui) 是面向 agentic interface 的 React
设计系统：聊天、思考指示器、agent log、composer、侧栏，与表格、卡片、表单共用
一套视觉语言；400+ 语义 token，浅色深色由同一套 class 表达。

可迁移的点：

- **语义分层**：primitive → semantic → component，颜色按角色命名而不是按色相；
- **accent ramp 独立**：默认蓝色，但整套交互面（主按钮、焦点、选中、开关）
  引用 `accent-*`，换品牌色只换 11 个变量；
- **数据色与交互色分开**：图表、状态 chip 保留自己的颜色，不被品牌色带跑；
- **表面靠中性阶而非色相**：白、`#f7f7f7`、`#ebebeb`、`#e4e8ec`，蓝色只出现在
  文字强调、焦点和主按钮渐变里；
- **克制的主按钮**：蓝色渐变 CTA，但页面大面积仍是白和灰。

我们取：中性阶优先、accent 只做信号、主按钮可以是 ink 而不是品牌色。

### Bencho — 交互积木与界面声音

[Bencho](https://github.com/cabralorenzo/bencho) 是 47 个交互 React block 和 24 个
合成界面音效的集合。它的 `tokens.css` 几乎是单色系统：

- 浅色：`#ffffff` 画布、`#f7f7f6` 卡片、`#ecebe7` 第三层，文字 `#17181a`；
- 深色：`#000000` 画布、`#1a1a1a` board、`#0a0a0a` card、`#181818` 第二层；
- 信号色只有一个靛蓝 `#2231dd`，另有 `ok #15803d`、`ember #b8431c` 两个语义色；
- 主按钮是“黑石板”（`--slab: #17181a`）配白字，不是彩色按钮；
- 唯一点缀是超小面积的彩色图标和悬停反馈。

我们取：暖纸 + 墨、黑石板 CTA、单一信号色、极小的彩色面积。

### HeroUI Pro — 可定制的完整设计系统

[HeroUI Pro](https://heroui.pro/docs/react/getting-started/design-systems) 的核心是
“把品牌变成一个可用的 UI 基础”：导入网站或从零定义 identity，调颜色、字体、
圆角、边框、阴影、间距和组件样式，再导出代码。它的 OSS 主题仍是 CSS 变量 +
BEM class，默认蓝色 `#006FEE`，浅色白底、深色近黑，圆角和阴影偏“柔软”。

可迁移的点：

- **设计系统不是色板，是一组可解释的决策**：颜色、表面、描边、状态各司其职；
- **深色不是简单反相**：深色下 content 层要抬升，边框要降低对比；
- **品牌色可以只出现在链接、焦点、选中和强调标签上**，主按钮保持黑/白；
- **圆角与阴影是“柔软感”的来源**，但在 DSH 我们只做颜色，所以用表面阶和
  低对比描边模拟同样的“精致感”。

我们取：中性锌灰、紫罗兰信号、黑 CTA、柔软但清晰的层级。

### beUI Pro — 动效区块与模板

[beUI Pro](https://pro.beui.dev/zh) 提供 400+ Web 区块、页面、插画和模板，以及
React Native 页面。它的品牌基线是近单色：浅色 `#FCFCFC`、深色 `#151515`，
青色是功能强调，紫色是次级视觉强调；动效共享缓动 token、弹簧物理，并尊重
“减少动态效果”。

可迁移的点：

- **近黑/近白留白**：界面本身几乎无色彩，动效和内容才是主角；
- **一个功能色 + 一个次级色**：青色负责“进行中/可交互”，紫色负责“已完成/智能”；
- **深色不是纯黑**：`#151515` 带一点温度，卡片 `#1C1C1C` 抬升一档；
- **状态色保持语义**，不跟着品牌色漂移。

我们取：近黑留白、青色呼吸、极低饱和的表面阶。

### Libraries.dev — 面向下一代 UI 的效果库

[Libraries.dev](https://libraries.dev) 是 7 个 AI 时代 UI 效果库的集合：border
beam、thinking orbs、gooey、voice glow、bot avatars、liquid metal、image
generation。站点本身是“技术蓝图”气质：近黑 `#0a0a0a`、`#181818` 面板、
`#0071fc` 电光蓝 CTA、`#9e9eff` 淡紫辅助、点阵线框和等宽标签。

可迁移的点：

- **深色可以是“实验室”而不是“夜店”**：黑底 + 点阵/线框 + 一个电光蓝；
- **蓝色分两层**：`#0071fc` 负责行动，`#9e9eff` 负责“智能/生成中”；
- **大面积留黑**，效果只出现在一个局部；
- **等宽小字和细线框**建立“工具感”。

我们取：蓝图灰蓝画布、电光蓝信号、深色近黑、细描边。

### Watermelon UI — 开源 React 组件与模板

[Watermelon UI](https://ui.watermelon.sh/) 是 shadcn 风格的 React 组件、block、
dashboard 和模板平台：600+ 免费组件、Tailwind CSS v4、copy-paste、MIT。首页是
近黑底 + 酸性青柠 + 等宽正文 + 网格线，带明显的 brutalist/开发者工具气质。

可迁移的点：

- **一个高饱和色就够**：青柠只出现在 CTA、logo、少数标签上；
- **单色 + 等宽**能建立很强的识别度，不需要第二品牌色；
- **黑底上的亮色要足够亮**，否则会被黑吞掉；
- **CTA 可以是亮色底 + 黑字**，不必永远白字。

我们取：酸性青柠、单色 brutalist 底、亮色 CTA + 黑字。

---

## 2. 六条共同结论

1. **中性面是主角。** 六套参考里，界面 90% 以上是白、灰、黑的冷暖变化；彩色
   只占很小面积。DSH 是长时间阅读和工具调用的界面，这条尤其重要。
2. **一套色板只有一个信号色。** 链接、焦点、选中、进行中都用它；需要第二色时
   用状态色（成功/警告/错误/完成），不再引入第二个品牌色。
3. **画布和卡片的差异来自明度，不来自色相。** 画布可以带 1–3% 的冷暖倾向，
   卡片回到近白/近黑；两者差 2–4 个 L 值就够。
4. **描边是实色低对比，不是透明度汤。** `border-l1..l4` 用实色阶，暖色和深色
   画布上都不会发浑。
5. **主按钮默认是 ink。** 近黑（浅色）或近白（深色）；只有需要“品牌/行动”时
   才用信号色，Melon 这种 brutalist 色板才用亮色 CTA。
6. **深色不是反相。** 深色画布可以真黑（Bench/Melon）或近黑带温度
   （Motion `#151515`、Labs `#07090d`），卡片必须抬升一档；文字用 off-white，
   不用纯白满屏。

---

## 3. 六套工作室色板

| id | 参考 | 浅色画布 | 深色画布 | 信号色（浅 / 深） | 主按钮 |
| --- | --- | --- | --- | --- | --- |
| `board` | BoardUI | `#f5f8fd` 冷白 | `#0a0f18` 深海军蓝 | `#2258e6` / `#6b93ff` | ink |
| `bench` | Bencho | `#faf8f4` 暖纸 | `#000000` 真黑 | `#2231dd` / `#8b95ff` | 黑石板 |
| `hero` | HeroUI Pro | `#fafafa` 中性锌 | `#09090b` 近黑 | `#7c3aed` / `#a78bfa` | ink |
| `motion` | beUI Pro | `#fcfcfc` 近白 | `#151515` 暖黑 | `#0e7490` / `#22d3ee` | ink |
| `labs` | Libraries.dev | `#f3f6fa` 蓝图灰 | `#07090d` 蓝黑 | `#0068e8` / `#5b9bff` | ink |
| `melon` | Watermelon UI | `#f7f7f0` 青柠纸 | `#080808` 黑 | `#4d7c0f` / `#a3e635` | 青柠 + 黑字 |

设计上的分工：

- **Board** 最“产品”、最干净，适合白天长时间用；蓝色只做焦点、链接、选中。
- **Bench** 最暖、最像纸；黑色主按钮和靛蓝信号是它的识别点。
- **Hero** 最中性、最柔软；紫罗兰只在强调处出现，适合喜欢低刺激的人。
- **Motion** 最接近单色；青色很轻，深色像一间关了灯的工作室。
- **Labs** 最“工具”；蓝黑画布和电光蓝让它像一块仪表盘。
- **Melon** 唯一的高饱和 CTA；青柠纸 + 黑字，适合想要一点态度的时候。

所有色板都提供浅色/深色两版，跟随 DSH 现有的明暗设置；不注册新的 theme id，
不改变布局、圆角、字体、背景图或毛玻璃。

---

## 4. Token 架构

```
PALETTES（每套 15 个种子色）
        │  rolesFrom()
        ▼
roles（表面、文字、边框、状态、hover、diff、chart、json…）
        │  tokenSet()
        ▼
DSH alias tokens（138 个）+ Shiki 语法色 + focus ring
        │  applyStrength()
        ▼
克制 / 标准 / 鲜明 三档强调色强度
```

`rolesFrom` 只做机械推导（hover 透明度、状态淡染、滚动条、diff 底色），
表面、文字、边框、accent、CTA 仍是设计选择。这样六套色板行为一致，但不会
被算法抹平。

### 这次补齐的 token

旧版覆盖了主要表面和文字，但以下位置仍会回落到 DSH 默认色。3.0 全部覆盖：

- 遮罩：`bg-mask-1/2/3/drop/photo`
- 卡片：`card-fill`、`card-fill-hover`、`card-tile-fill`
- 选中描边：`border-selected`
- 悬停卡：`hovercard-bg`、三档 label、done/error
- JSON 树：`json-tree-hover/icon/keyword/number/property/punctuation/string`
- 图表：`chart-messages/system/tools`
- 设置卡：`settings-card-fill/stroke`
- 其他：`label-on-color`、`toast-action`、`tooltip-label`、`trajectory-accent`、
  `brand-primary-new-color*`

`tokens.required.json` 保存 DSH 当前读取的 138 个 alias，`audit.mjs` 会检查
漏覆盖。

### 对比度

`audit.mjs` 对每套色板、每个明暗模式、每一档强调色强度检查 33 组配对：

- 正文 ≥ 7:1，次级/三级 ≥ 4.5:1；
- 链接、状态文字、toast/hovercard 文字 ≥ 4.5:1；
- 焦点 accent ≥ 3:1；
- 主按钮文字 ≥ 4.5:1；
- 气泡正文 ≥ 7:1，代码正文 ≥ 7:1；
- 卡片描边 ≥ 1.05:1（只要求“看得见”，不追求强对比）。

当前结果：6 套 × 2 模式 × 3 档 = 1188 组配对，0 失败。

---

## 5. 不做的事

- 不做皮肤、背景图、玻璃拟态或圆角/字体主题；只改颜色。
- 不覆盖 DSH 组件里写死的颜色（例如 tooltip 的固定白字、onboarding 渐变），
  这是宿主代码，不在 token 层能解决的范围内。
- 不给经典色板重新调色；它们保留原样，只是补齐了新增 token 的映射。
- 不把色板注册成新的 theme id；内置外观仍是浅色/深色/跟随系统。

---

## 6. 验证

```bash
node audit.mjs                     # token 覆盖 + 1188 组对比度
node audit.mjs --all               # 连经典色板一起检查
node preview/gen.cjs               # 六套 + 经典的全景预览
node preview/row.cjs               # 真实设置行（React SSR + 真实 CSS）
PALETTE_PACK_REACT_ROOT=... node preview/behavior.cjs  # 点击切换/持久化/默认回退
node ~/.dsh/skills/dsh-plugin-theme/check-theme.mjs .
```

视觉检查至少覆盖：Board 浅色、Bench 浅色、Hero 浅色、Motion 深色、Labs 深色、
Melon 深色；以及 Board 的克制/标准/鲜明三档。重点看正文、次级、三级、hover、
选中、禁用、菜单、开关、焦点、空态、代码块、图表、JSON 树、hovercard。


## 色板来源

- **汝窑 / 赭石 / 松烟**：本仓原创（`inkstone/tools/palettes.mjs`）。
- **青瓷 / 紫毫 / 宣纸 / 胭脂**：派生自 ui-standard 契约源的主题，经同一条渲染路径与同一套闸门；命名与工艺参数是本仓的。
