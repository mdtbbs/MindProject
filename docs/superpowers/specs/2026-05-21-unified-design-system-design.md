---
name: unified-design-system
description: 统一三个项目网页端的设计系统规格
---

# 统一设计系统规格

## 背景

三个 Mindustry 社区产品需要统一的网页风格：
- **MindAuth** — OAuth 认证服务 (纯静态前端)
- **MindBBS** (原名 MindFourm) — 论坛系统 (Next.js + TypeScript)
- **EasyManager** — 服务器管理面板 (Next.js)

## 设计风格

**Material Design + 温暖柔和极简**
- Material Design 的层级感和阴影系统
- 温暖柔和的色调
- Mindustry 橙色作为品牌色

## 技术方案

**共享 CSS 设计系统**
- 创建 `shared-styles` 目录存放设计变量和组件样式
- 三个项目通过相对路径引用
- MindAuth 使用自定义 CSS 变量
- MindBBS 和 EasyManager 使用 Tailwind + CSS 变量

---

## 颜色系统

### 品牌色（Mindustry 橙色系）

| 名称 | 色值 | 用途 |
|------|------|------|
| primary | `#ff6b35` | 主按钮、链接、强调 |
| primary-dark | `#e55a2b` | hover 状态 |
| primary-light | `#ff8c5a` | 浅色变体 |
| accent | `#ffc107` | 次级强调、成功提示 |

### 浅色主题（默认）

| 名称 | 色值 | 用途 |
|------|------|------|
| bg | `#faf8f5` | 页面背景（温暖米白） |
| bg-card | `#ffffff` | 卡片背景 |
| bg-elevated | `#f5f2ed` | 悬浮层、表头 |
| text | `#2d2a26` | 主要文字 |
| text-secondary | `#6b6660` | 次级文字 |
| text-muted | `#a09890` | 辅助文字、placeholder |
| border | `#e8e5e0` | 边框 |

### 深色主题

| 名称 | 色值 | 用途 |
|------|------|------|
| bg | `#1a1816` | 页面背景（深暖灰） |
| bg-card | `#262420` | 卡片背景 |
| bg-elevated | `#363230` | 悬浮层、表头 |
| text | `#f5f2ed` | 主要文字 |
| text-secondary | `#a09890` | 次级文字 |
| text-muted | `#6b6b60` | 辅助文字、placeholder |
| border | `#3a3630` | 边框 |

### 功能色

| 名称 | 色值 | 用途 |
|------|------|------|
| success | `#22c55e` | 成功状态 |
| warning | `#ffc107` | 警告状态（使用品牌 accent） |
| error | `#ef4444` | 错误状态 |

---

## 圆角系统

| 组件 | 圆角值 | 说明 |
|------|--------|------|
| 卡片 | `0px` | 方正清晰 |
| 按钮 | `6px` | 小圆角 |
| 输入框 | `6px` | 小圆角 |
| 标签/徽章 | `4px` | 最小圆角 |
| 弹窗/对话框 | `8px` | 中等圆角 |
| 头像 | `50%` | 圆形 |

---

## 阴影系统

| 层级 | 浅色主题 | 深色主题 |
|------|----------|----------|
| 卡片默认 | `0 2px 8px rgba(0,0,0,0.08)` | `0 2px 8px rgba(0,0,0,0.24)` |
| 卡片悬浮 | `0 4px 16px rgba(0,0,0,0.12)` | `0 4px 16px rgba(0,0,0,0.32)` |
| 弹窗/下拉 | `0 8px 24px rgba(0,0,0,0.16)` | `0 8px 24px rgba(0,0,0,0.40)` |

---

## 组件规格

### 按钮

| 类型 | 样式 |
|------|------|
| 主按钮 | 背景 `primary`，文字白色，hover 背景加深 10% |
| 次按钮 | 背景 `bg-card`，边框 `border`，文字 `text-secondary` |
| 危险按钮 | 背景 `error`，文字白色 |
| 禁用状态 | opacity 50%，cursor not-allowed |

**尺寸**
- 标准：高度 40px，内边距 12px 20px
- 小：高度 32px，内边距 8px 16px
- 大：高度 48px，内边距 16px 24px

### 输入框

- 背景：浅色 `bg-card`，深色 `bg-card`
- 边框：默认 `border`，focus 时 `primary`
- 高度：40px
- placeholder：`text-muted` 透明度 60%
- 错误状态：边框 `error`，下方显示红色错误文字

### 卡片

- 背景：`bg-card`
- 边框：无边框（靠阴影区分）或可选极浅边框
- 阴影：使用阴影系统
- 内边距：标准 16px，大卡片 24px

### 导航栏

- 高度：56px（移动端 48px）
- 背景：`bg` + `backdrop-filter: blur(8px)` 半透明效果
- 位置：固定顶部
- 布局：左侧 Logo + 项目名，右侧导航链接 + 用户头像 + 主题切换

---

## 响应式断点

| 断点 | 范围 |
|------|------|
| 移动端 | `< 480px` |
| 平板 | `480px - 768px` |
| 桌面 | `> 768px` |

### 移动端适配规则

- 导航栏高度 48px
- 卡片内边距 12px
- 表格改为卡片列表形式
- 按钮可扩展至 100% 宽度
- 导航菜单改为汉堡菜单

---

## 主题切换

### 实现方式

CSS 变量 + `data-theme` 属性：

```css
:root {
  /* 浅色主题变量 */
}

[data-theme="dark"] {
  /* 深色主题变量 */
}
```

### 切换机制

1. 使用 `<html data-theme="dark/light">` 控制
2. `localStorage` 存储 `theme` 值
3. 导航栏右侧提供切换按钮
4. 馈次访问默认浅色主题
5. 系统偏好检测：`prefers-color-scheme` 可作为初始值参考

---

## 项目命名

| 项目 | 显示名称 | 副标题（可选） |
|------|----------|----------------|
| MindAuth | MindAuth | (mdtbbs) |
| MindBBS | MindBBS | (mdtbbs) |
| EasyManager | EasyManager | (mdtbbs) |

副标题格式：小括号包裹，灰色小字体，位于名称下方或右侧

---

## 字体

使用系统默认字体，优先加载 Inter：

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
  'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

---

## 文件结构

```
G:\MindProject\
├── shared-styles/
│   ├── variables.css      # CSS 变量（颜色、阴影、圆角）
│   ├── components.css     # 组件样式
│   ├── utilities.css      # 工具类
│   └── theme-switch.js    # 主题切换逻辑
│
├── MindAuth/public/
│   └── style.css          # 引用 shared-styles（改为相对路径）
│
├── MindBBS/frontend/src/app/
│   └ globals.css          # 引用 shared-styles
│
└── EasyManager/frontend/app/
│   └── globals.css        # 引用 shared-styles
```

---

## 实施步骤

1. 创建 `shared-styles` 目录和文件
2. 定义 CSS 变量和基础样式
3. 实现 theme-switch.js
4. 修改 MindAuth style.css 引入共享样式
5. 修改 MindBBS globals.css 引入共享样式
6. 修改 EasyManager globals.css 引入共享样式
7. 更新各项目的组件使用新变量
8. 测试三个项目的主题切换功能
9. 验证响应式适配

---

## How to apply

- 所有新组件开发使用此设计系统的 CSS 变量
- 修改颜色/样式时只改 `shared-styles` 目录
- 各项目保持独立代码结构，共享样式通过相对路径引用