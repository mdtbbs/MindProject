# Shared UI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将shared包的UI组件对接到MindAuth和MindFourm项目，实现统一的视觉风格和组件复用。

**Architecture:** MindAuth使用预渲染HTML片段 + CSS方案对接shared组件；MindFourm直接使用React组件重构所有页面UI。

**Tech Stack:** React, Next.js, Express, react-dom/server (预渲染), shared-styles CSS

---

## File Structure

### 新建文件
- `shared/scripts/pre-render.js` - 预渲染脚本，生成HTML片段
- `shared/dist/templates/*.html` - 预渲染输出的HTML片段
- `MindAuth/public/js/shared-loader.js` - 加载HTML片段的工具

### 修改文件
- `shared/package.json` - 添加预渲染构建命令
- `MindAuth/src/server.js` - 添加templates静态服务路由
- `MindAuth/public/app.js` - 使用HTML片段替换现有HTML
- `MindFourm/frontend/src/app/(public)/users/[id]/page.tsx` - 引入UserCard组件
- `MindFourm/frontend/src/app/admin/layout.tsx` - 使用shared AdminSidebar
- `MindFourm/frontend/src/components/admin/dashboard.tsx` - 使用StatsGrid组件

---

## Phase 1: shared构建准备

### Task 1: 创建预渲染脚本

**Files:**
- Create: `shared/scripts/pre-render.js`

- [ ] **Step 1: 编写预渲染脚本**

```javascript
// shared/scripts/pre-render.js
const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// 动态导入编译后的组件
const distPath = path.join(__dirname, '../dist');

// 确保templates目录存在
const templatesDir = path.join(distPath, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// 预渲染配置
const componentsToRender = [
  {
    name: 'login-layout',
    componentName: 'LoginLayout',
    props: {
      serviceName: 'MindAuth',
      brandDescription: 'Mindustry 社区统一认证',
      formTitle: '登录',
    },
  },
  {
    name: 'header',
    componentName: 'UnifiedHeader',
    props: {
      siteName: 'MindAuth',
      showSearch: false,
      showPostButton: false,
    },
  },
  {
    name: 'user-card',
    componentName: 'UserCard',
    props: {
      username: 'User',
      showStats: true,
    },
  },
  {
    name: 'admin-sidebar',
    componentName: 'AdminSidebar',
    props: {
      serviceName: 'MindAuth',
      subtitle: '管理后台',
      items: [],
    },
  },
];

async function preRender() {
  // 导入编译后的组件
  const componentsIndex = require(path.join(distPath, 'components/index.js'));
  
  for (const config of componentsToRender) {
    const Component = componentsIndex[config.componentName];
    if (!Component) {
      console.warn(`Component ${config.componentName} not found, skipping...`);
      continue;
    }
    
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Component, config.props)
    );
    
    const outputPath = path.join(templatesDir, `${config.name}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${outputPath}`);
  }
  
  console.log('Pre-rendering complete!');
}

preRender().catch(err => {
  console.error('Pre-render error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: 修改package.json添加预渲染命令**

在 `shared/package.json` 的 scripts 部分添加：

```json
{
  "scripts": {
    "build": "tsc && npm run pre-render",
    "pre-render": "node scripts/pre-render.js",
    "build:copy": "tsc && npm run pre-render && node -e \"const fs=require('fs');const path=require('path');fs.mkdirSync(path.join('dist','styles'),{recursive:true});fs.copyFileSync(path.join('src','styles','index.css'),path.join('dist','styles','index.css'));\""
  }
}
```

- [ ] **Step 3: 运行构建测试预渲染输出**

```bash
cd shared && npm run build
```

Expected: 生成 `shared/dist/templates/` 目录，包含 `login-layout.html`, `header.html`, `user-card.html`, `admin-sidebar.html`

- [ ] **Step 4: 验证生成的HTML片段**

检查 `shared/dist/templates/login-layout.html` 内容是否包含正确的HTML结构。

- [ ] **Step 5: Commit**

```bash
git add shared/scripts/pre-render.js shared/package.json
git commit -m "feat(shared): add pre-render script for static HTML templates"
```

---

## Phase 2: MindAuth对接

### Task 2: 配置Express静态服务

**Files:**
- Modify: `MindAuth/src/server.js`

- [ ] **Step 1: 添加templates静态服务路由**

在 `MindAuth/src/server.js` 的静态服务部分添加：

```javascript
// 在第71行后添加
// Serve shared templates from monorepo
app.use('/templates', express.static(path.join(__dirname, '../../shared/dist/templates'), { maxAge: '1d' }));
```

完整修改位置：
```javascript
// Serve shared-styles from monorepo root
app.use('/shared-styles', express.static(path.join(__dirname, '../../shared-styles'), { maxAge: '1d' }));
// Serve shared templates from monorepo
app.use('/templates', express.static(path.join(__dirname, '../../shared/dist/templates'), { maxAge: '1d' }));
```

- [ ] **Step 2: 测试Express服务能访问templates**

启动MindAuth服务，访问 `http://localhost:4001/templates/login-layout.html` 验证返回HTML。

- [ ] **Step 3: Commit**

```bash
git add MindAuth/src/server.js
git commit -m "feat(mindauth): add static route for shared templates"
```

### Task 3: 创建shared-loader工具

**Files:**
- Create: `MindAuth/public/js/shared-loader.js`

- [ ] **Step 1: 编写shared-loader.js**

```javascript
// MindAuth/public/js/shared-loader.js
/**
 * 加载预渲染的HTML模板片段
 * @param {string} name - 模板名称 (如 'login-layout', 'header')
 * @returns {Promise<string>} HTML内容
 */
async function loadTemplate(name) {
  const res = await fetch(`/templates/${name}.html`);
  if (!res.ok) {
    throw new Error(`Failed to load template: ${name}`);
  }
  return res.text();
}

/**
 * 加载模板并插入到指定元素
 * @param {string} name - 模板名称
 * @param {string|HTMLElement} target - 目标元素ID或元素本身
 * @returns {Promise<void>}
 */
async function renderTemplate(name, target) {
  const html = await loadTemplate(name);
  const element = typeof target === 'string' 
    ? document.getElementById(target) 
    : target;
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * 替换模板中的占位符
 * @param {string} html - HTML模板
 * @param {Object} data - 替换数据 { key: value }
 * @returns {string} 替换后的HTML
 */
function fillTemplate(html, data) {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

// 导出到全局
window.SharedLoader = {
  loadTemplate,
  renderTemplate,
  fillTemplate,
};
```

- [ ] **Step 2: 在index.html中引入shared-loader**

在 `MindAuth/public/index.html` 的script部分添加：

```html
<script src="js/common.js"></script>
<script src="js/shared-loader.js"></script>
<script src="/shared-styles/theme-switch.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add MindAuth/public/js/shared-loader.js MindAuth/public/index.html
git commit -m "feat(mindauth): add shared-loader utility for HTML templates"
```

### Task 4: 修改LoginLayout组件支持数据占位符

**Files:**
- Modify: `shared/src/components/LoginLayout.tsx`

- [ ] **Step 1: 更新LoginLayout组件添加占位符支持**

修改 `shared/src/components/LoginLayout.tsx`，在关键位置添加data属性便于JS填充：

```tsx
// 在serviceName显示处添加data属性
<div
  className="login-brand-logo"
  data-brand-name={serviceName}
  style={{
    fontSize: 28,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 16,
  }}
>
  {serviceName}
</div>

// 在formTitle处添加data属性
<h3
  className="login-form-title"
  data-form-title={formTitle}
  style={{
    fontSize: 18,
    fontWeight: 500,
    color: 'var(--text)',
    marginBottom: 24,
  }}
>
  {formTitle}
</h3>
```

- [ ] **Step 2: 重新构建shared**

```bash
cd shared && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add shared/src/components/LoginLayout.tsx
git commit -m "feat(shared): add data attributes to LoginLayout for JS filling"
```

### Task 5: MindAuth登录页使用LoginLayout片段

**Files:**
- Modify: `MindAuth/public/app.js`

- [ ] **Step 1: 修改login view使用模板片段**

在 `MindAuth/public/app.js` 的 views 对象中，替换 login 视图：

```javascript
const views = {
  login: null, // 将由动态加载填充
  
  // 其他views保持不变...
};
```

- [ ] **Step 2: 在router中加载login模板**

修改 `MindAuth/public/app.js` 的 router 函数：

```javascript
async function router() {
  // ... 之前的代码
  
  const app = document.getElementById('app');
  
  // 动态加载login模板
  if (viewName === 'login' && !views.login) {
    const html = await SharedLoader.loadTemplate('login-layout');
    // 添加表单和链接部分
    views.login = html.replace('</div>', `
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input class="form-input" type="text" id="username" name="username" required placeholder="请输入用户名">
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input class="form-input" type="password" id="password" name="password" required placeholder="输入密码">
            </div>
            <button type="submit" class="btn-primary">继续</button>
          </form>
          <p class="auth-link">没有账户? <a href="#register">创建一个</a></p>
          <p class="auth-link"><a href="#reset-request">忘记密码?</a></p>
        </div>
      </div>
    `);
  }
  
  app.innerHTML = views[viewName] || views.login;
  
  // ... 之后的代码
}
```

- [ ] **Step 3: 同样修改register视图**

添加register模板加载逻辑：

```javascript
if (viewName === 'register' && !views.register) {
  const html = await SharedLoader.loadTemplate('login-layout');
  // 替换标题并添加注册表单
  views.register = html
    .replace('登录', '注册')
    .replace('进入您的账户', '创建您的账户')
    .replace('</div>', `
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input class="form-input" type="text" id="username" name="username" required placeholder="2-50个字符">
            </div>
            <div class="form-group">
              <label class="form-label">邮箱地址</label>
              <input class="form-input" type="email" id="email" name="email" required placeholder="name@company.com">
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input class="form-input" type="password" id="password" name="password" required minlength="8" placeholder="至少8位，含大小写字母和数字">
              <p class="password-hint" style="color: var(--text-muted); font-size: 0.6875rem; margin-top: 0.25rem;">需要: 大写+小写+数字，至少8位</p>
            </div>
            <button type="submit" class="btn-primary">创建账户</button>
          </form>
          <p class="auth-link">已有账户? <a href="#login">登录</a></p>
        </div>
      </div>
    `);
}
```

- [ ] **Step 4: 测试登录和注册页面**

启动MindAuth，访问 `http://localhost:4001/#login` 和 `http://localhost:4001/#register` 验证页面正常显示和功能。

- [ ] **Step 5: Commit**

```bash
git add MindAuth/public/app.js
git commit -m "feat(mindauth): use LoginLayout template for login/register pages"
```

---

## Phase 3: MindFourm公共页面

### Task 6: 用户页面引入UserCard组件

**Files:**
- Modify: `MindFourm/frontend/src/app/(public)/users/[id]/page.tsx`

- [ ] **Step 1: 导入UserCard组件**

在文件顶部添加导入：

```tsx
import { UserCard } from '@mindproject/shared';
```

- [ ] **Step 2: 替换用户信息卡片部分**

将现有的用户信息卡片（第78-115行）替换为UserCard：

```tsx
// 替换整个用户信息卡片区域
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* User Info Card - 使用shared UserCard */}
  <div className="flex justify-center mb-8">
    <UserCard
      username={displayName}
      avatarUrl={profile.avatar_url}
      stats={{
        posts: profile.post_count,
        replies: profile.reply_count,
      }}
      showStats={true}
      onClick={() => {}}
    />
  </div>
  
  {/* 保留bio和详细信息 */}
  {profile.bio && (
    <div className="max-w-md mx-auto text-center mb-8">
      <p className="text-sm text-surface-600">{profile.bio}</p>
    </div>
  )}
  
  {/* Role badge */}
  <div className="max-w-md mx-auto flex justify-center gap-3 mb-8">
    <Badge variant={roleVariant}>{profile.role}</Badge>
    <ProfileEditLink userId={profile.id} />
  </div>
  
  {/* 保留Tabs部分... */}
</div>
```

- [ ] **Step 3: 测试用户页面**

访问 `http://localhost:3000/users/1` 验证UserCard正常显示。

- [ ] **Step 4: Commit**

```bash
git add MindFourm/frontend/src/app/(public)/users/[id]/page.tsx
git commit -m "feat(mindforum): use shared UserCard in user profile page"
```

### Task 7: 侧边栏样式迁移

**Files:**
- Modify: `MindFourm/frontend/src/components/forum/sidebar.tsx`

- [ ] **Step 1: 更新样式使用shared-styles变量**

将现有的Tailwind类替换为CSS变量样式：

```tsx
'use client';

import Link from 'next/link';
import { Category, Tag } from '@/types';
import { FolderOpen, Server } from 'lucide-react';

interface SidebarProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory?: number;
}

export default function Sidebar({ categories, tags, selectedCategory }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Categories */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}>
        <h3 style={{
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 12,
        }}>分类</h3>
        <nav className="space-y-1">
          <Link
            href="/"
            style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              background: !selectedCategory ? 'var(--bg-elevated)' : 'transparent',
              color: !selectedCategory ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: !selectedCategory ? 500 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            全部帖子
          </Link>
          {categories
            .filter((c) => c.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                  background: selectedCategory === category.id ? 'var(--bg-elevated)' : 'transparent',
                  color: selectedCategory === category.id ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: selectedCategory === category.id ? 500 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {category.name}
              </Link>
            ))}
        </nav>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}>
          <h3 style={{
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: 12,
          }}>热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 20).map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                style={{
                  padding: '4px 12px',
                  background: 'var(--bg-muted)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  borderRadius: 999,
                  transition: 'all 0.15s ease',
                }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Resource Center */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}>
        <Link
          href="/resources"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            transition: 'color 0.15s ease',
          }}
        >
          <FolderOpen style={{ width: 16, height: 16 }} />
          资源中心
        </Link>
      </div>

      {/* Game Servers */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}>
        <Link
          href="/servers"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            transition: 'color 0.15s ease',
          }}
        >
          <Server style={{ width: 16, height: 16 }} />
          游戏服务器
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: 测试侧边栏样式**

访问首页验证侧边栏样式正常。

- [ ] **Step 3: Commit**

```bash
git add MindFourm/frontend/src/components/forum/sidebar.tsx
git commit -m "style(mindforum): migrate sidebar to shared-styles CSS variables"
```

---

## Phase 4: MindFourm管理后台

### Task 8: 管理后台使用shared AdminSidebar

**Files:**
- Modify: `MindFourm/frontend/src/app/admin/layout.tsx`
- Modify: `MindFourm/frontend/src/components/admin/admin-sidebar.tsx`

- [ ] **Step 1: 更新admin layout使用shared AdminSidebar**

修改 `MindFourm/frontend/src/app/admin/layout.tsx`：

```tsx
'use client';

import AdminGuard from '@/components/admin/admin-guard';
import { AdminSidebar as SharedAdminSidebar } from '@mindproject/shared';
import AdminHeader from '@/components/admin/admin-header';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import {
  LayoutDashboard, Settings, Megaphone, Palette, Search, FileText, Tag,
  AlertTriangle, FileCheck, Clock, Ban, Trash2, FolderTree, Users, ScrollText,
  Package, AlertCircle, FolderOpen
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', label: '仪表盘', icon: <LayoutDashboard style={{ width: 16, height: 16 }} />, href: '/admin', roles: ['admin', 'moderator'] },
  { key: 'settings-basic', label: '基本信息', icon: <Settings style={{ width: 16, height: 16 }} />, href: '/admin/settings/basic', roles: ['admin'] },
  { key: 'settings-announce', label: '公告管理', icon: <Megaphone style={{ width: 16, height: 16 }} />, href: '/admin/settings/announce', roles: ['admin'] },
  { key: 'settings-display', label: '显示设置', icon: <Palette style={{ width: 16, height: 16 }} />, href: '/admin/settings/display', roles: ['admin'] },
  { key: 'settings-seo', label: 'SEO 设置', icon: <Search style={{ width: 16, height: 16 }} />, href: '/admin/settings/seo', roles: ['admin'] },
  { key: 'posts', label: '帖子管理', icon: <FileText style={{ width: 16, height: 16 }} />, href: '/admin/posts', roles: ['admin', 'moderator'] },
  { key: 'tags', label: '标签管理', icon: <Tag style={{ width: 16, height: 16 }} />, href: '/admin/content/tags', roles: ['admin'] },
  { key: 'moderation', label: '审核队列', icon: <AlertTriangle style={{ width: 16, height: 16 }} />, href: '/admin/content/moderation', roles: ['admin', 'moderator'] },
  { key: 'rules', label: '发帖规则', icon: <FileCheck style={{ width: 16, height: 16 }} />, href: '/admin/system/rules', roles: ['admin'] },
  { key: 'rate-limits', label: '限流设置', icon: <Clock style={{ width: 16, height: 16 }} />, href: '/admin/system/rate-limits', roles: ['admin'] },
  { key: 'bans', label: '封禁管理', icon: <Ban style={{ width: 16, height: 16 }} />, href: '/admin/system/bans', roles: ['admin'] },
  { key: 'cleanup', label: '数据清理', icon: <Trash2 style={{ width: 16, height: 16 }} />, href: '/admin/system/cleanup', roles: ['admin'] },
  { key: 'categories', label: '分类管理', icon: <FolderTree style={{ width: 16, height: 16 }} />, href: '/admin/categories', roles: ['admin'] },
  { key: 'users', label: '用户管理', icon: <Users style={{ width: 16, height: 16 }} />, href: '/admin/users', roles: ['admin'] },
  { key: 'logs', label: '系统日志', icon: <ScrollText style={{ width: 16, height: 16 }} />, href: '/admin/logs', roles: ['admin'] },
  { key: 'resources', label: '资源管理', icon: <Package style={{ width: 16, height: 16 }} />, href: '/admin/resources', roles: ['admin', 'moderator'] },
  { key: 'resources-moderation', label: '资源审批', icon: <AlertCircle style={{ width: 16, height: 16 }} />, href: '/admin/resources/moderation', roles: ['admin', 'moderator'] },
  { key: 'resource-categories', label: '类别管理', icon: <FolderOpen style={{ width: 16, height: 16 }} />, href: '/admin/resource-categories', roles: ['admin'] },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role ?? '';
  
  // 过滤出当前用户有权限的菜单项
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));
  
  // 确定当前激活的key
  const activeKey = navItems.find(item => 
    pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
  )?.key || 'dashboard';
  
  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <SharedAdminSidebar
          serviceName="MindForum"
          subtitle="管理后台"
          items={visibleItems.map(item => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
            href: item.href,
          }))}
          activeKey={activeKey}
          footerContent={
            <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ← 返回论坛
            </a>
          }
        />
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 200,
        }}>
          <AdminHeader />
          <main style={{ flex: 1, padding: 24 }}>{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
```

- [ ] **Step 2: 测试管理后台侧边栏**

访问 `http://localhost:3000/admin` 验证侧边栏正常显示和导航功能。

- [ ] **Step 3: Commit**

```bash
git add MindFourm/frontend/src/app/admin/layout.tsx
git commit -m "feat(mindforum): use shared AdminSidebar in admin layout"
```

### Task 9: Dashboard使用StatsGrid组件

**Files:**
- Modify: `MindFourm/frontend/src/components/admin/dashboard.tsx`

- [ ] **Step 1: 导入StatsGrid组件**

在文件顶部添加导入：

```tsx
import { StatsGrid } from '@mindproject/shared';
```

- [ ] **Step 2: 替换统计卡片部分**

将statCards部分（第32-37行和第48-56行）替换为StatsGrid：

```tsx
// 替换statCards定义
const statsData = [
  { label: '帖子', value: stats?.total_posts ?? '--', trend: stats ? `今日 +${stats.today_posts}` : undefined },
  { label: '回复', value: stats?.total_replies ?? '--', trend: stats ? `今日 +${stats.today_replies}` : undefined },
  { label: '用户', value: stats?.total_users ?? '--', trend: stats ? `今日 +${stats.today_users}` : undefined },
  { label: '24小时活跃', value: stats?.active_24h ?? '--' },
];

// 替换统计卡片渲染部分
{stats && <StatsGrid stats={statsData} columns={4} />}
{!stats && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-200 border border-surface-200">
    {statsData.map((card) => (
      <div key={card.label} className="bg-white p-6">
        <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">{card.label}</div>
        <div className="text-3xl font-light text-surface-900">{card.value}</div>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: 测试Dashboard**

访问 `http://localhost:3000/admin` 验证统计卡片正常显示。

- [ ] **Step 4: Commit**

```bash
git add MindFourm/frontend/src/components/admin/dashboard.tsx
git commit -m "feat(mindforum): use shared StatsGrid in admin dashboard"
```

---

## Phase 5: 最终测试与清理

### Task 10: 集成测试

- [ ] **Step 1: 测试MindAuth完整流程**

```bash
cd MindAuth && npm run dev
```

测试：
- 登录页面显示和功能
- 注册页面显示和功能
- Dashboard页面
- 主题切换

- [ ] **Step 2: 测试MindFourm完整流程**

```bash
cd MindFourm/frontend && npm run dev
```

测试：
- 公共页面布局
- 用户页面UserCard显示
- 管理后台侧边栏导航
- Dashboard统计卡片
- 主题切换

- [ ] **Step 3: 测试shared构建流程**

```bash
cd shared && npm run build
```

验证：
- TypeScript编译成功
- 预渲染HTML片段生成
- CSS样式文件复制

- [ ] **Step 4: Commit最终状态**

```bash
git add -A
git commit -m "feat: complete shared UI integration for MindAuth and MindFourm"
```

---

## Notes

1. MindAuth的预渲染HTML片段是静态模板，动态数据需要在app.js中用JS填充
2. shared-styles CSS变量需要确保在两个项目中都正确加载
3. MindFourm管理后台需要确保AdminSidebar的items格式与shared组件匹配
4. 测试时注意主题切换功能在两个项目中都正常工作