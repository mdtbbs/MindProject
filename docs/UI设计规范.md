# MindProject UI 设计规范

> 本文档定义了 MindProject 全站（MindAuth、MindFourm、以及暂停保留的 EasyManager）的统一 UI 设计规范。所有新页面、新组件必须遵循此规范。

---

## 一、设计哲学

**Clean Blue — 现代极简论坛风格**

- 灵感来源：XenForo、Linear、Vercel Dashboard
- 关键词：**克制、清晰、信息密度优先**
- 无圆角（0px radius），直角设计传达专业感
- 蓝色主色调，不使用花哨渐变
- 大量留白，通过间距和边框分区而非色块
- 信息展示优先，装饰元素极少

---

## 二、色彩系统

### 2.1 品牌色

| 变量 | 值 | 用途 |
|------|-----|------|
| `--primary` | `#2f80ed` | 主操作按钮、链接、选中态、强调色 |
| `--primary-dark` | `#2563eb` | 按钮 hover 状态 |
| `--primary-light` | `#5ba0ff` | 浅色强调、深色模式主色 |

### 2.2 浅色主题

| 变量 | 值 | 用途 |
|------|-----|------|
| `--background` / `--bg` | `#f5f9ff` | 页面底色（微蓝白） |
| `--card` / `--bg-card` | `#ffffff` | 卡片、面板背景 |
| `--muted` / `--bg-elevated` | `#eef4fb` | 悬浮/选中背景、统计项底色 |
| `--bg-hover` | `#eaf2ff` | 行 hover 背景 |
| `--foreground` / `--text` | `#0f172a` | 主文字（深蓝黑） |
| `--text-secondary` / `--muted-foreground` | `#667085` | 次要文字、描述 |
| `--text-muted` | `#64748b` | 最弱文字（时间戳、辅助信息） |
| `--border` | `#d8e2f0` | 主要边框 |
| `--border-light` | `#e8eef6` | 分割线、次要边框 |

### 2.3 深色主题

通过 `[data-theme="dark"]` 或 `.dark` class 切换。

| 变量 | 值 | 用途 |
|------|-----|------|
| `--background` | `#0b1220` | 页面底色（深蓝黑） |
| `--card` | `#101a2d` | 卡片背景 |
| `--muted` / `--bg-elevated` | `#13233c` | 悬浮背景 |
| `--bg-hover` | `#173153` | 行 hover |
| `--foreground` / `--text` | `#e5eefc` | 主文字（浅蓝白） |
| `--text-secondary` | `#9fb0ca` | 次要文字 |
| `--text-muted` | `#7c8ca6` | 最弱文字 |
| `--border` | `rgba(148,163,184,0.18)` | 边框（半透明） |
| `--primary` | `#74a9ff` | 深色模式主色（更亮） |

### 2.4 功能色

| 语义 | 颜色 | 用途 |
|------|------|------|
| Success | `#4caf50` / `rgba(34,197,94,0.12)` bg | 成功状态、在线、已通过 |
| Warning | `#ffc107` / `rgba(255,193,7,0.12)` bg | 警告、待审核、处理中 |
| Error | `#f44336` / `rgba(239,68,68,0.12)` bg | 错误、删除、拒绝 |
| Info | `#2196f3` / `rgba(33,150,243,0.12)` bg | 信息提示 |

### 2.5 角色/称号颜色

| 角色 | 颜色 | 说明 |
|------|------|------|
| active | `#4caf50` | 活跃用户 |
| core | `#2196f3` | 核心用户 |
| moderator | `#ff6b35` | 版主 |
| admin | `#ffc107` | 管理员（金色渐变图标） |
| contributor | `#9c27b0` | 贡献者 |

---

## 三、排版系统

### 3.1 字体

| 用途 | 字体 | 备选 |
|------|------|------|
| 正文 | **Inter** | -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei |
| 等宽/代码 | **Geist Mono** | JetBrains Mono, Consolas |

通过 Next.js `next/font/google` 加载，CSS 变量 `--font-sans` 和 `--font-mono`。

### 3.2 字号规范

| 层级 | 大小 | 行高 | 用途 |
|------|------|------|------|
| 页面标题 | `1.125rem` (18px) | 1.4 | 后台页面标题 |
| 卡片标题 | `1rem` (16px) | 1.4 | 区块标题、服务器名称 |
| 正文 | `0.875rem` (14px) | 1.5 | 帖子内容、表单文字 |
| 辅助文字 | `0.75rem` (12px) | 1.5 | 时间戳、分类标签、统计 |
| 极小文字 | `0.6875rem` (11px) | 1.4 | 统计标签、徽章文字 |

### 3.3 字重

| 名称 | 值 | 用途 |
|------|-----|------|
| `font-medium` | 500 | 正文加粗、按钮 |
| `font-semibold` | 600 | 标题、侧边栏 logo |
| `font-bold` | 700 | 极少使用，强调数字 |

### 3.4 文字颜色层级

```
主文字 (--text)          → 标题、正文
次要文字 (--text-secondary) → 描述、辅助说明
弱文字 (--text-muted)     → 时间、统计数字标签
```

---

## 四、间距与布局

### 4.1 间距系统

采用 4px 为基础单位：

| 类名 | 值 | 用途 |
|------|-----|------|
| gap-1 / p-1 | 0.25rem (4px) | 图标间距、紧凑元素 |
| gap-2 / p-2 | 0.5rem (8px) | 按钮内间距、列表项间距 |
| gap-3 / p-3 | 0.75rem (12px) | 卡片内间距（紧凑） |
| gap-4 / p-4 | 1rem (16px) | 标准卡片内间距、区块间距 |
| p-6 | 1.5rem (24px) | 大面板内间距 |

### 4.2 圆角

**设计原则：全站零圆角**

```css
--radius: 0px;
--radius-sm: 0px;
--radius-lg: 0px;
--radius-card: 0px;
--radius-badge: 0px;
```

所有按钮、输入框、卡片、徽章均为直角。这是 Clean Blue 主题的核心特征。

### 4.3 容器宽度

```css
--content-max-width: 640px;   /* 内容区最大宽度 */
max-width: 1280px;            /* 页面容器最大宽度 */
```

### 4.4 布局尺寸

| 元素 | 尺寸 |
|------|------|
| 导航栏高度 | 56px（桌面）/ 48px（移动） |
| 管理侧边栏宽度 | 200px（展开）/ 60px（折叠） |
| 按钮高度 | 40px（默认）/ 32px（小）/ 48px（大） |
| 输入框高度 | 40px |

---

## 五、边框与阴影

### 5.1 边框

统一使用 1px solid：

```css
border: 1px solid var(--border);       /* 卡片、面板 */
border-bottom: 1px solid var(--border); /* 分割线 */
```

深色模式边框使用半透明：`rgba(148,163,184,0.18)`

### 5.2 阴影

极简阴影，仅用于区分层级：

| 名称 | 值 | 用途 |
|------|-----|------|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.08)` | 卡片静态 |
| `shadow-card-hover` | `0 4px 12px rgba(0,0,0,0.10)` | 卡片 hover |
| `shadow-modal` | `0 8px 24px rgba(0,0,0,0.12)` | 弹窗 |

### 5.3 Hover 效果

卡片 hover 时增加蓝色描边感：

```css
.card:hover {
  border-color: rgba(47,128,237,0.22);
  box-shadow: 0 4px 12px rgba(47,128,237,0.08);
}
```

输入框 focus 时蓝色外发光：

```css
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(47,128,237,0.15);
}
```

---

## 六、组件规范

### 6.1 按钮

```
┌────────────────────┐
│  发帖               │  ← btn-primary: bg=#2f80ed, text=white, height=32px~48px
└────────────────────┘

┌────────────────────┐
│  取消               │  ← btn-secondary: bg=white, border=1px solid #d8e2f0, text=#667085
└────────────────────┘

┌────────────────────┐
│  删除               │  ← btn-danger: bg=#f44336, text=white
└────────────────────┘
```

- 按钮文字全小写，`font-weight: 500`
- hover 时背景加深，transition 0.15s
- disabled 状态 `opacity: 0.5`

### 6.2 输入框

```
┌─────────────────────────────┐
│  请输入标题...                │  ← bg=white, border=#d8e2f0, height=40px
└─────────────────────────────┘
   ↑ focus: border=#2f80ed + 3px蓝色外发光
```

- placeholder 颜色 `var(--text-muted)` + `opacity: 0.6`
- 错误状态：`border-color: var(--error)` + 下方红色错误提示文字

### 6.3 卡片

```
┌──────────────────────────────┐
│  border: 1px solid #d8e2f0  │
│  bg: #ffffff                 │
│  padding: 16px               │
│  border-radius: 0            │
│                              │
│  卡片内容                     │
└──────────────────────────────┘
   ↑ hover: border变蓝, shadow加深
```

使用 `.panel-surface` 类作为内容面板：
```css
.panel-surface {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
}
```

### 6.4 徽章 / Badge

```
┌────────┐
│ 待审核  │  ← padding: 2px 8px, font-size: 11px, bg=rgba(255,193,7,0.12), color=#ffc107
└────────┘

┌────────┐
│ 已发布  │  ← bg=rgba(34,197,94,0.12), color=#4caf50
└────────┘

┌────────┐
│ 已拒绝  │  ← bg=rgba(239,68,68,0.12), color=#f44336
└────────┘
```

徽章使用**透明底色 + 同色系文字**，不使用实色填充。

### 6.5 数据表格

```
┌─────────────────────────────────────────────┐
│ 表头 (bg=#eef4fb, font-size=12px, color=#667085) │
├─────────────────────────────────────────────┤
│ 行1  border-bottom: 1px solid #e8eef6       │
├─────────────────────────────────────────────┤
│ 行2  hover → bg=#eaf2ff                     │
├─────────────────────────────────────────────┤
│ 行3                                         │
└─────────────────────────────────────────────┘
```

### 6.6 导航栏 (Header)

```
高度: 56px
背景: var(--bg) (#f5f9ff)
底部: 1px solid var(--border)
定位: sticky top:0, z-index:50
效果: backdrop-filter: blur(8px)
```

### 6.7 侧边栏导航项

```
┌─────────────────────┐
│  ● 仪表盘           │  ← 选中态: bg=#eef4fb, color=#2f80ed, font-weight:500
├─────────────────────┤
│    用户管理          │  ← 默认: color=#667085
├─────────────────────┤
│    内容审核          │  ← hover: bg=#eaf2ff, color=#0f172a
└─────────────────────┘

分组标题: font-size:11px, uppercase, letter-spacing:0.05em, color=#64748b
```

### 6.8 Toast 通知

```
位置: fixed bottom:1.5rem, left:50%, translateX(-50%)
背景: var(--bg-card)
边框: 1px solid var(--border)
阴影: shadow-modal
动画: opacity 0→1, 0.25s ease
```

成功 Toast: `bg=rgba(34,197,94,0.12), border=rgba(34,197,94,0.25), color=#4caf50`
错误 Toast: `bg=rgba(239,68,68,0.12), border=rgba(239,68,68,0.25), color=#f44336`

### 6.9 帖子卡片

```
┌──┬──────────────────────────────────┬────────┐
│01│ [分类标签]  帖子标题              │ 💬 0   │
│  │ 帖子摘要文字（最多2行）           │ 👁 12  │
│  │                                  │ 👍 3   │
│  │                                  │ 4天前   │
└──┴──────────────────────────────────┴────────┘

左侧序号: border-left: 2px solid var(--primary), font-mono, color=var(--primary)
hover: bg=#f7fbff (微蓝)
置顶图标: color=var(--primary)
分类标签: border+bg蓝色系, font-size:11px
```

待审核帖子特殊样式：
```
bg: rgba(255,193,7,0.04) 或 bg-amber-50/60
左边框: 3px solid #f59e0b (amber-400)
附加徽章: "待审核" (Clock 图标 + amber 色)
```

---

## 七、页面布局模式

### 7.1 论坛首页

```
┌──────────────────────────────────────────────────┐
│  Header (sticky, 56px, blur)                      │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────┐  ┌───────────────┐     │
│  │  论坛介绍面板          │  │  统计网格      │     │
│  │  panel-surface        │  │  4~5列 grid    │     │
│  │  左: 标题+描述         │  │  每项: bg=muted │     │
│  │  右: 统计数据          │  │                │     │
│  └──────────────────────┘  └───────────────┘     │
│                                                    │
│  ┌─────┐  ┌──────────────────────────────┐       │
│  │分类  │  │  帖子列表                      │       │
│  │侧栏  │  │  panel-surface                │       │
│  │     │  │  ┌──────────────────────────┐ │       │
│  │     │  │  │ [发帖按钮] 标题栏         │ │       │
│  │     │  │  ├──────────────────────────┤ │       │
│  │     │  │  │ 帖子卡片 ×N              │ │       │
│  │     │  │  └──────────────────────────┘ │       │
│  └─────┘  └──────────────────────────────┘       │
│                                                    │
│  ┌──────────────────────────────────────┐         │
│  │  分页器                               │         │
│  └──────────────────────────────────────┘         │
└──────────────────────────────────────────────────┘
```

### 7.2 管理后台

```
┌──────────┬─────────────────────────────────────┐
│ Sidebar  │  页面标题              [操作按钮]    │
│ 200px    │─────────────────────────────────────│
│ fixed    │                                      │
│          │  ┌─────────────────────────────────┐│
│ 分组标签  │  │  数据表格 / 卡片列表              ││
│ 导航项   │  │  panel-surface                   ││
│          │  │                                  ││
│          │  └─────────────────────────────────┘│
│          │                                      │
└──────────┴─────────────────────────────────────┘
```

### 7.3 登录页（分栏布局）

```
┌───────────────────┬───────────────────┐
│  品牌展示区        │  登录表单区         │
│  bg: #333          │  bg: var(--bg)     │
│  flex:1            │  flex:1            │
│                    │                    │
│  Logo (大字)       │  标题              │
│  描述文字 (灰色)    │  表单输入框         │
│                    │  登录按钮           │
│                    │                    │
└───────────────────┴───────────────────┘
移动端: 纵向排列, 品牌区变为 200px 高度
```

---

## 八、动画系统

### 8.1 设计原则

- 所有动画 duration ≤ 0.3s，使用 `ease` 或 `cubic-bezier(0.4, 0, 0.2, 1)`
- 必须支持 `prefers-reduced-motion: reduce`
- 主题切换动画 0.4s，带闪光效果

### 8.2 加载动画（Mindustry 工业主题）

| 名称 | 效果 | 用途 |
|------|------|------|
| **Orbital Spin** | 中心圆点 + 3个轨道点旋转 | 页面加载（主 loader） |
| **Hexagon Pulse** | 缩放 1→1.15，3个延迟 | 六边形图标加载 |
| **Block Wave** | 方块阵列依次缩放，9个延迟 | 网格加载 |
| **Shimmer Sweep** | 蓝色渐变光扫过骨架屏 | 内容加载中 |

### 8.3 交互反馈

| 元素 | 动画 |
|------|------|
| 通知铃铛（有未读） | `wiggle` 左右摇摆 0.5s |
| 未读数量徽章 | `badge-pulse` 缩放 + 红色光环 |
| 主题切换 | 全局颜色 0.4s 过渡 + 径向闪光 |
| 卡片 hover | shadow 加深 0.2s |

### 8.4 主题切换动画

```css
/* 全局颜色过渡 */
.theme-transitioning * {
  transition: background-color 0.4s, color 0.4s, border-color 0.4s, box-shadow 0.4s;
}

/* 闪光效果 */
.theme-flash-overlay {
  background: radial-gradient(circle, var(--primary), transparent 70%);
  animation: theme-flash 0.5s ease-out forwards;
}
```

---

## 九、Tailwind CSS 使用规范

### 9.1 颜色映射

在 Tailwind 中使用 CSS 变量：

```tsx
// ✅ 正确 - 使用 CSS 变量颜色
<div className="bg-[var(--card)] border-[var(--border)] text-[var(--text)]">

// ✅ 正确 - 使用 shadcn/ui 语义色
<div className="bg-card text-foreground border-border">

// ✅ 正确 - 使用 surface 系列
<div className="bg-surface-50 text-surface-700 border-surface-200">

// ❌ 错误 - 使用硬编码颜色
<div className="bg-white text-gray-900 border-gray-200">
```

### 9.2 Surface 颜色系列

用于深色模式兼容：

| Tailwind 类 | 浅色值 | 深色值 |
|-------------|--------|--------|
| `bg-surface-50` | `#eef4fb` | `#13233c` |
| `bg-surface-100` | `#eef4fb` | `#13233c` |
| `text-surface-700` | `#0f172a` | `#e5eefc` |
| `text-surface-600` | `#0f172a` | `#e5eefc` |
| `text-surface-400` | `#64748b` | `#7c8ca6` |
| `border-surface-200` | `#d8e2f0` | `rgba(148,163,184,0.18)` |

### 9.3 常用布局组合

```tsx
// 标准面板
<div className="panel-surface p-4">

// 统计项
<div className="border border-[var(--border)] bg-[var(--muted)] p-3">
  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">标签</div>
  <div className="mt-2 text-lg font-semibold text-[var(--foreground)]">数值</div>
</div>

// 帖子行 hover
<article className="grid gap-3 bg-white px-4 py-3 hover:bg-[#f7fbff] border-b border-[var(--border)]">

// 分类标签
<span className="shrink-0 border border-[#cfe0f5] bg-[#edf6ff] px-2 py-0.5 text-[11px] font-medium text-[#1d5ea8]">
```

---

## 十、暗色模式规范

### 10.1 切换机制

```javascript
// HTML 属性控制
<html data-theme="dark" class="dark">

// localStorage 持久化
localStorage.setItem('theme', 'dark');

// 初始化脚本（防闪烁，放在 <head> 中）
(function() {
  var theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }
})();
```

### 10.2 暗色模式注意事项

1. **不使用纯黑**：底色 `#0b1220` 带蓝调，卡片 `#101a2d` 略浅
2. **边框用半透明**：`rgba(148,163,184,0.18)` 而非实色
3. **主色更亮**：深色模式 `--primary: #74a9ff`（比浅色的 `#2f80ed` 更亮）
4. **阴影更深**：`shadow-card: 0 1px 3px rgba(0,0,0,0.24)`
5. **白色 class 覆盖**：`.bg-white` 在深色模式下自动变为 `var(--bg-card)`
6. **所有颜色通过 CSS 变量**：确保切换时全局过渡动画生效

---

## 十一、响应式设计

### 11.1 断点

| 名称 | 宽度 | 说明 |
|------|------|------|
| mobile | ≤ 480px | 隐藏 `.hidden-mobile` |
| tablet | 481px ~ 768px | 侧边栏折叠，grid 变 2 列 |
| desktop | 769px ~ 1200px | 完整布局 |
| wide | > 1200px | 5列统计 → 4列 |

### 11.2 响应式规则

| 元素 | 桌面 | 移动 |
|------|------|------|
| 导航栏 | 56px 高 | 48px 高 |
| 侧边栏 | 200px 展开 | 60px 折叠（仅图标） |
| 帖子卡片 | 3列 grid | 单列 |
| 统计网格 | 4~5 列 | 2 列 |
| 登录页 | 左右分栏 | 上下排列 |
| 服务器网格 | `auto-fill, minmax(280px, 1fr)` | 单列 |

---

## 十二、图标规范

- 图标库：**Lucide React**（`lucide-react`）
- 尺寸：`h-3.5 w-3.5`（12px 辅助）/ `h-4 w-4`（16px 标准）/ `h-5 w-5`（20px 标题）
- 颜色：继承 `currentColor`，通过父元素 `color` 控制
- 描边风格：`strokeWidth: 2`（默认）
- 常用图标：

| 用途 | 图标名 |
|------|--------|
| 回复 | `MessageSquare` |
| 浏览 | `Eye` |
| 点赞 | `ThumbsUp` |
| 置顶 | `Pin` |
| 通知 | `Bell` |
| 待审核 | `Clock` |
| 主题切换 | `Sun` / `Moon` |
| 搜索 | `Search` |
| 设置 | `Settings` / `Cog` |

---

## 十三、新页面设计 Checklist

创建新页面时，逐项确认：

- [ ] 使用 CSS 变量颜色（`var(--text)` 等），不硬编码颜色值
- [ ] 支持深色模式（`[data-theme="dark"]` 下表现正常）
- [ ] 圆角为 0（不使用 `rounded-*`）
- [ ] 字体使用 Inter（不引入新字体）
- [ ] 按钮使用 `btn` / `btn-primary` / `btn-secondary` 类
- [ ] 面板使用 `panel-surface` 类
- [ ] 响应式：移动端布局正常（≤480px）
- [ ] hover/focus 状态有视觉反馈
- [ ] 间距使用设计系统的 4px 倍数
- [ ] 加载状态有骨架屏或 spinner
- [ ] `prefers-reduced-motion` 下动画降级

---

## 十四、禁止事项

1. ❌ 不使用圆角（border-radius 必须为 0）
2. ❌ 不使用渐变背景（除勋章/称号图标外）
3. ❌ 不使用硬编码颜色值（必须用 CSS 变量）
4. ❌ 不使用超过 0.4s 的动画
5. ❌ 不使用彩色阴影（阴影只用黑色半透明）
6. ❌ 不使用 emoji 作为功能图标（用 Lucide）
7. ❌ 不在深色模式使用纯黑 `#000` 或纯白 `#fff` 作为背景
8. ❌ 不使用 `box-shadow` 作为主要分隔手段（用 border）

---

## 十五、状态与错误页面

### 15.1 全幅居中卡片

所有错误页、状态页使用统一的全幅居中卡片布局：

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ┌─────────────────────┐              │
│              │   ┌────────────┐    │              │
│              │   │  64×64     │    │  ← 图标区:  │
│              │   │  状态图标   │    │    2px border│
│              │   └────────────┘    │    功能色背景 │
│              │                     │              │
│              │  [等待审核 ●]       │  ← 状态徽章  │
│              │                     │    含呼吸动画  │
│              │  文件暂不可下载      │  ← 标题      │
│              │                     │    1.25rem    │
│              │  filename.zip       │  ← 文件名     │
│              │  mono, bg=muted     │    font-mono  │
│              │                     │              │
│              │  详细说明文字...     │  ← 消息      │
│              │                     │    0.875rem   │
│              │ ─────────────────── │              │
│              │  [← 返回文件列表]   │  ← 操作按钮  │
│              └─────────────────────┘              │
│                                                    │
└──────────────────────────────────────────────────┘
```

**卡片样式：**
- `max-width: 480px`，`width: 100%`
- `background: var(--card)`, `border: 1px solid var(--border)`
- `box-shadow: var(--shadow-card)`
- 零圆角

### 15.2 状态图标映射

| 状态 | 图标 (Lucide) | 图标区颜色 | 图标区背景 |
|------|--------------|-----------|-----------|
| `pending` (待审核) | `Clock` | `#b45309` (浅) / `#fbbf24` (暗) | `var(--warning-bg)` |
| `rejected` (已拒绝) | `CircleX` | `#dc2626` (浅) / `#f87171` (暗) | `var(--error-bg)` |
| `not_found` (不存在) | `Search` | `var(--text-muted)` | `var(--muted)` |
| `generic` (通用错误) | `AlertCircle` | `var(--info)` | `var(--info-bg)` |

图标区：`64×64px`，`2px solid border`（同色系），内部 SVG `28×28px`。

### 15.3 状态徽章

```
┌──────────────┐
│ ● 等待审核    │  ← 含呼吸动画圆点
└──────────────┘
```

- `font-size: 0.75rem`, `font-weight: 600`, `text-transform: uppercase`
- `letter-spacing: 0.08em`
- 圆点 `6×6px`，`pending` 状态使用 `1.5s ease-in-out infinite` 呼吸动画

### 15.4 文件名展示

```css
font-family: var(--font-mono);
font-size: 0.75rem;
color: var(--text-secondary);
background: var(--muted);
border: 1px solid var(--border);
padding: var(--space-1) var(--space-3);
word-break: break-all;
```

---

## 十六、审核状态视觉规范

### 16.1 全局状态色

| 状态 | 文字色 | 背景色 | 边框色 | 用途 |
|------|--------|--------|--------|------|
| `pending` | `--warning` | `var(--warning-bg)` | `var(--warning-border)` | 待审核 |
| `approved` | `--success` | `var(--success-bg)` | `var(--success-border)` | 已通过 |
| `rejected` | `--error` | `var(--error-bg)` | `var(--error-border)` | 已拒绝 |
| `published` | `--success` | `var(--success-bg)` | `var(--success-border)` | 已发布 |

### 16.2 帖子待审核横幅 (普通用户)

```
┌──────────────────────────────────────────────┐
│  ⏰  此帖子正在等待审核                         │
│      审核通过后将对其他用户可见。如有疑问请联系管理组。│
└──────────────────────────────────────────────┘

背景: bg-amber-50 / dark:bg-amber-950/30
边框: border-amber-200 / dark:border-amber-800
图标: 圆形 bg-amber-100, 24×24px
文字: text-amber-800 / dark:text-amber-200
```

### 16.3 帖子待审核横幅 (管理员)

普通横幅 + 右侧操作按钮：

```
┌──────────────────────────────────────────────────────┐
│  ⏰  此帖子正在等待审核              [✅ 通过] [❌ 拒绝] │
│      您可以审核此帖子。                                │
└──────────────────────────────────────────────────────┘
```

通过按钮：`bg-green-600`, text=white
拒绝按钮：`bg-red-600`, text=white

### 16.4 帖子列表中的待审核样式

```css
/* 左边框标记 */
border-left: 3px solid #f59e0b;  /* amber-400 */
background: rgba(255, 193, 7, 0.04);
```

附加 `待审核` 徽章（Clock 图标 + amber 色）。

### 16.5 资源详情页审核状态

| 状态 | 下载按钮 | 横幅 |
|------|---------|------|
| `pending` | 灰色禁用，文字"等待审核" | 琥珀色：此资源正在等待审核，审核通过后可下载 |
| `rejected` | 灰色禁用，文字"审核未通过" | 红色：此资源未通过审核：{原因} |
| `approved` | 正常蓝色按钮 | 无横幅 |

### 16.6 审核拒绝 Modal

```
┌────────────────────────────────┐
│  拒绝原因                       │  ← font-semibold
│  请填写拒绝此帖子的原因（可选）：  │  ← text-muted
│  ──────────────────────────── │
│  ┌──────────────────────────┐  │
│  │ textarea, rows=4          │  │
│  │ placeholder: 例如：内容不  │  │
│  │ 符合社区规范...            │  │
│  └──────────────────────────┘  │
│                                │
│            [取消]  [确认拒绝]    │  ← 取消=ghost, 确认=destructive
└────────────────────────────────┘

遮罩: bg-black/40
卡片: bg-var(--bg-card), border-var(--border), shadow-xl
```

---

## 十七、功能开关 UI 规范

### 17.1 后台功能管理页

每个功能以卡片行展示：

```
┌──────────────────────────────────────────────────────┐
│  ┌──────┐  资源中心                        [开关]    │
│  │ 📁   │  允许用户浏览和下载社区资源                   │
│  └──────┘  已启用                                     │
│            /resources                                 │
└──────────────────────────────────────────────────────┘
```

- 图标区：`36×36px`，启用时 border=primary, bg=rgba(47,128,237,0.06)；关闭时 border=border, bg=muted
- 关闭状态：整体 `opacity: 0.6`
- 状态徽章：`[已启用]` green / `[已关闭]` gray
- 关联路由：`font-mono text-[10px]` 灰色标签

### 17.2 Toggle 开关

```css
/* 轨道 */
width: 44px; height: 24px;
border: 1px solid var(--border);
background: var(--muted);

/* 滑块 */
width: 20px; height: 20px;
background: white; border: 1px solid var(--border);

/* 选中态 */
border-color: var(--primary);
background: rgba(47,128,237,0.12);
滑块: translate-x-full, bg=var(--primary), border=var(--primary);
```

### 17.3 侧边栏快捷入口联动

关闭的功能从侧边栏快捷入口中移除。如果所有快捷入口都关闭，整个"快捷入口"区块隐藏。

### 17.4 后台侧边栏联动

关闭"资源中心"后，后台"资源"导航组也隐藏。

---

*最后更新: 2026-07-13*
