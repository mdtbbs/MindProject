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
      children: '<!-- FORM_CONTENT_PLACEHOLDER -->',
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
      username: '{{USERNAME}}',
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
  // 导入编译后的组件 (CommonJS)
  const componentsIndex = require(path.join(distPath, 'components/index.js'));

  let successCount = 0;
  let skipCount = 0;

  for (const config of componentsToRender) {
    const Component = componentsIndex[config.componentName];
    if (!Component) {
      console.warn(`Component ${config.componentName} not found, skipping...`);
      skipCount++;
      continue;
    }

    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(Component, config.props)
      );

      const outputPath = path.join(templatesDir, `${config.name}.html`);
      fs.writeFileSync(outputPath, html);
      console.log(`Generated: ${outputPath}`);
      successCount++;
    } catch (err) {
      console.warn(`Failed to render ${config.name}: ${err.message}`);
      skipCount++;
    }
  }

  console.log(`\nPre-rendering complete! Success: ${successCount}, Skipped: ${skipCount}`);
}

preRender().catch(err => {
  console.error('Pre-render error:', err);
  process.exit(1);
});