# Shared UI Integration Design

## Overview

将shared包的UI组件对接到MindAuth和MindFourm项目，实现统一的视觉风格和组件复用。

- **MindAuth**：登录/注册/管理中心页面，采用静态HTML片段 + CSS方案
- **MindFourm**：全部页面UI更新，直接使用React组件

## Architecture

### shared构建输出结构

```
shared/
├── src/components/          # React组件源码
├── dist/
│   ├── index.js             # React组件bundle（MindFourm用）
│   ├── templates/           # 预渲染HTML片段（MindAuth用）
│   │   ├── login-layout.html
│   │   ├── admin-sidebar.html
│   │   ├── header.html
│   │   └── user-card.html
│   └── styles.css           # 合并的CSS（或直接引用shared-styles）
└── scripts/
    └── pre-render.js        # 预渲染脚本，生成HTML片段
```

### MindAuth对接方式

MindAuth为原生HTML/CSS/JS SPA，通过加载预渲染HTML片段对接shared组件：

```
MindAuth/public/
├── js/
│   ├── shared-loader.js     # 加载HTML片段的工具
│   └── app.js               # 修改：使用片段替换现有HTML
├── templates/               # 从shared/dist/templates复制或直接引用
└── style.css                # 保留项目特定样式，基础样式引用shared-styles
```

加载方式：
```javascript
// shared-loader.js
async function loadTemplate(name) {
  const res = await fetch(`/templates/${name}.html`);
  return res.text();
}

// 使用
const loginHtml = await loadTemplate('login-layout');
document.getElementById('app').innerHTML = loginHtml;
// JS绑定事件、填充动态数据
```

### MindFourm对接方式

Next.js项目，直接通过npm引用`@mindproject/shared`，使用React组件。

## Component Mapping

### MindAuth页面映射

| 页面 | 当前结构 | 替换为 |
|------|----------|--------|
| 登录/注册 | `auth-split-container` HTML | `LoginLayout` HTML片段 |
| Dashboard | `dashboard-header` + `user-card` | `header.html` + `UserCard` |
| Account Settings | `settings-card` | 保持现有，引用shared-styles CSS |
| Admin | `section-card` + `data-table` | `AdminSidebar` + `DataTable` |

### MindFourm页面映射

| 页面/区域 | 当前组件 | 替换为 |
|-----------|----------|--------|
| 公共布局 | `UnifiedHeader`（已用） | 扩展配置 |
| 首页侧边栏 | `forum/sidebar.tsx` | 使用shared组件风格重构 |
| 帖子卡片 | `forum/post-card.tsx` | 保持，样式迁移shared-styles |
| 用户页面 | 自定义布局 | `UserCard` + `ServerCard` |
| 管理后台 | 自定义布局 | `AdminSidebar` + `DataTable` + `StatsGrid` |
| Footer | `forum/footer.tsx` | 保持，样式迁移shared-styles |

## Pre-render Build Process

### shared构建脚本

```javascript
// shared/scripts/pre-render.js
// 使用react-dom/server.renderToStaticMarkup生成HTML片段

const componentsToRender = [
  { name: 'LoginLayout', component: LoginLayout, props: { serviceName: 'MindAuth' } },
  { name: 'Header', component: UnifiedHeader, props: { siteName: 'MindAuth' } },
  { name: 'UserCard', component: UserCard, props: {} },
  { name: 'AdminSidebar', component: AdminSidebar, props: {} },
];

// 输出到 dist/templates/<name>.html
```

### 构建命令

```bash
# shared目录
npm run build          # 构建React组件 + 预渲染HTML片段

# MindAuth引用
# 开发时：直接引用shared/dist/templates（通过Express静态服务）
# 生产时：复制到MindAuth/public/templates或CDN
```

## MindFourm Refactor Details

### 公共布局扩展

当前`(public)/layout.tsx`已用`UnifiedHeader`，扩展：
- 增加`showServerCount`配置（显示服务器数量）
- 侧边栏组件使用shared样式风格重构

### 管理后台重构

`admin/`目录页面重构：
- 引入`AdminSidebar`作为左侧导航
- 数据表格替换为`DataTable`组件
- 统计面板使用`StatsGrid` + `ActivityChart`
- 页面结构统一为：Sidebar + Main Content

### 用户页面重构

`(public)/users/[id]/page.tsx`：
- 用户信息区使用`UserCard`
- 用户服务器列表使用`ServerCard`

### 样式迁移

保留现有功能性组件（post-card、reply-form等），但：
- 样式变量引用`shared-styles/variables.css`
- 组件样式迁移到shared-styles风格
- 移除组件内重复的样式定义

## Implementation Phases

### Phase 1：shared构建准备
1. 编写预渲染脚本`pre-render.js`
2. 配置构建输出目录`dist/templates/`
3. 生成HTML片段文件
4. 测试片段输出正确性

### Phase 2：MindAuth对接
1. 修改Express静态服务，引用shared/dist
2. 编写`shared-loader.js`工具
3. 登录/注册页使用`LoginLayout`片段
4. Dashboard使用`Header` + `UserCard`
5. Admin页面使用`AdminSidebar` + `DataTable`
6. 测试各页面功能正常

### Phase 3：MindFourm公共页面
1. 扩展`UnifiedHeader`配置
2. 重构侧边栏组件风格
3. 用户页面引入`UserCard`、`ServerCard`
4. 样式迁移到shared-styles
5. 测试公共页面功能

### Phase 4：MindFourm管理后台
1. 引入`AdminSidebar`
2. 替换数据表格为`DataTable`
3. 统计面板使用`StatsGrid`
4. 测试管理后台功能

## Technical Notes

- MindAuth保持原生JS架构，不转为React
- HTML片段为静态模板，动态数据通过JS填充
- 样式系统统一使用shared-styles CSS变量
- 构建产物独立，各项目可独立部署