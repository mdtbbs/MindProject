/**
 * doc-sync 主工具脚本
 * 文档自动同步工具 - 检测代码变更并生成文档更新建议
 */

const path = require('path');
const fs = require('fs');

// 工具模块
const git = require('./utils/git');
const file = require('./utils/file');
const ai = require('./utils/ai');

// 默认配置
const DEFAULT_CONFIG = {
  enabled: true,
  autoConfirm: false,
  silent: false,
  rootDir: null,
  configPath: '.doc-sync/config.json',
  pendingPath: '.doc-sync/pending-updates.json',
  historyDir: '.doc-sync/history',
  excludePatterns: [
    'node_modules/**',
    '*.test.js',
    '*.spec.js',
    '**/test-results/**',
    '**/playwright-report/**'
  ],
  watchPatterns: {
    '**/routes/*.js': ['## API 端点', '## 路由'],
    '**/db/**/*.js': ['## 数据库', '## 架构'],
    '**/public/**/*.html': ['## 前端', '## 页面'],
    '**/public/**/*.js': ['## 前端', '## SPA'],
    '**/public/**/*.css': ['## 前端', '## 样式'],
    '**/middleware/*.js': ['## 中间件', '## 安全'],
    '.env.example': ['## 环境变量', '## 配置'],
    'package.json': ['## 依赖', '## 命令']
  },
  docFiles: {
    'MindAuth/CLAUDE.md': { service: 'MindAuth', patterns: ['MindAuth/**'] },
    'MindFourm/CLAUDE.md': { service: 'MindFourm', patterns: ['MindFourm/**'] },
    'EasyManager/CLAUDE.md': { service: 'EasyManager', patterns: ['EasyManager/**'] },
    'CLAUDE.md': { service: 'root', patterns: ['shared/**', 'shared-styles/**'] },
    'README.md': { service: 'root', patterns: ['*'] }
  },
  requireConfirmation: true
};

/**
 * 匹配 glob 模式
 * @param {string} pattern - glob 模式
 * @param {string} filePath - 文件路径
 * @returns {boolean}
 */
function matchPattern(pattern, filePath) {
  // 简化的 glob 匹配
  const regex = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\./g, '\\.');
  return new RegExp(`^${regex}$`).test(filePath);
}

/**
 * 检查文件是否应该被排除
 * @param {string} filePath - 文件路径
 * @param {string[]} excludePatterns - 排除模式列表
 * @returns {boolean}
 */
function shouldExclude(filePath, excludePatterns) {
  return excludePatterns.some(pattern => matchPattern(pattern, filePath));
}

/**
 * 根据文件路径确定需要更新的文档
 * @param {string} filePath - 变更文件路径
 * @param {object} config - 配置对象
 * @returns {object[]} 需要更新的文档信息 [{ docFile, sections, service }]
 */
function getDocTargets(filePath, config) {
  const targets = [];

  // 检查 watchPatterns 匹配
  for (const [pattern, sections] of Object.entries(config.watchPatterns)) {
    if (matchPattern(pattern, filePath)) {
      // 找到匹配的文档文件
      for (const [docFile, docConfig] of Object.entries(config.docFiles)) {
        if (docConfig.patterns.some(p => matchPattern(p, filePath))) {
          targets.push({
            docFile,
            sections,
            service: docConfig.service,
            triggerPattern: pattern
          });
        }
      }
    }
  }

  return targets;
}

/**
 * 分析变更文件并生成更新建议
 * @param {string[]} changedFiles - 变更文件列表
 * @param {object} config - 配置对象
 * @param {string} rootDir - 根目录
 * @returns {object[]} 更新建议列表
 */
function analyzeChanges(changedFiles, config, rootDir) {
  const suggestions = [];

  for (const filePath of changedFiles) {
    // 跳过排除的文件
    if (shouldExclude(filePath, config.excludePatterns)) {
      continue;
    }

    const targets = getDocTargets(filePath, config);
    const diff = git.getFileDiff(filePath, true, rootDir);

    for (const target of targets) {
      suggestions.push({
        changedFile: filePath,
        docFile: target.docFile,
        sections: target.sections,
        service: target.service,
        triggerPattern: target.triggerPattern,
        diffPreview: diff.slice(0, 500), // 只取前 500 字符作为预览
        fullDiff: diff
      });
    }
  }

  // 去重 - 同一个文档文件只保留一条
  const uniqueSuggestions = [];
  const seen = new Set();

  for (const s of suggestions) {
    const key = `${s.docFile}:${s.sections.join(',')}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSuggestions.push(s);
    }
  }

  return uniqueSuggestions;
}

/**
 * 检测变更并生成待更新列表
 * @param {object} config - 配置对象
 * @param {string} rootDir - 根目录
 * @returns {object} 检测结果
 */
function detect(config, rootDir) {
  const stagedFiles = git.getStagedFiles(rootDir);

  if (stagedFiles.length === 0) {
    return {
      success: true,
      message: 'No staged changes detected.',
      suggestions: []
    };
  }

  const suggestions = analyzeChanges(stagedFiles, config, rootDir);

  return {
    success: true,
    message: `Detected ${stagedFiles.length} staged files, ${suggestions.length} doc updates needed.`,
    stagedFiles,
    suggestions,
    timestamp: new Date().toISOString(),
    commitInfo: git.getLastCommitInfo(rootDir)
  };
}

/**
 * 保存待确认的更新
 * @param {object} result - 检测结果
 * @param {string} rootDir - 根目录
 */
function savePending(result, rootDir) {
  const pendingPath = path.join(rootDir, '.doc-sync/pending-updates.json');
  file.writeJsonFile(pendingPath, result);
}

/**
 * 读取待确认的更新
 * @param {string} rootDir - 栅目录
 * @returns {object|null}
 */
function loadPending(rootDir) {
  const pendingPath = path.join(rootDir, '.doc-sync/pending-updates.json');
  return file.readJsonFile(pendingPath);
}

/**
 * 加载配置
 * @param {string} rootDir - 根目录
 * @returns {object}
 */
function loadConfig(rootDir) {
  const configPath = path.join(rootDir, '.doc-sync/config.json');
  const userConfig = file.readJsonFile(configPath);

  if (userConfig) {
    return { ...DEFAULT_CONFIG, ...userConfig };
  }

  return DEFAULT_CONFIG;
}

/**
 * 显示检测结果
 * @param {object} result - 检测结果
 */
function displayResult(result) {
  if (result.suggestions.length === 0) {
    console.log('\n📝 文档更新检测\n');
    console.log('  ✓ 没有需要更新的文档\n');
    return;
  }

  console.log('\n📝 文档更新检测\n');
  console.log('检测到以下变更可能需要更新文档:\n');

  for (const s of result.suggestions) {
    const arrow = '→';
    console.log(`  ✓ ${s.changedFile.padEnd(30)} ${arrow} ${s.docFile} (${s.sections[0]})`);
  }

  console.log('\n正在生成更新建议...\n');
}

/**
 * 主命令入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'detect';

  // 确定根目录
  const rootDir = path.resolve(process.cwd());

  // 检查是否在 git 仓库中
  if (!git.isGitRepo(rootDir)) {
    console.error('Error: Not in a git repository.');
    process.exit(1);
  }

  // 加载配置
  const config = loadConfig(rootDir);

  if (!config.enabled) {
    console.log('doc-sync is disabled in config.');
    process.exit(0);
  }

  switch (command) {
    case 'detect':
      const result = detect(config, rootDir);
      displayResult(result);
      savePending(result, rootDir);

      if (result.suggestions.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('运行 `npx doc-sync confirm` 来查看 AI 生成的更新建议');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      break;

    case 'confirm':
      const pending = loadPending(rootDir);
      if (!pending || pending.suggestions.length === 0) {
        console.log('\n没有待确认的文档更新。\n');
        process.exit(0);
      }

      console.log('\n📝 待确认的文档更新\n');
      console.log('正在调用 AI 分析变更...\n');

      // 调用 AI 分析
      ai.analyzeWithAI(pending.suggestions, config, rootDir)
        .then(aiResult => {
          ai.displayAIResult(aiResult);

          // 保存 AI 结果
          const aiResultPath = path.join(rootDir, '.doc-sync/ai-result.json');
          file.writeJsonFile(aiResultPath, aiResult);

          console.log('运行 `npx doc-sync apply` 应用这些更新');
          console.log('运行 `npx doc-sync skip` 跳过本次更新\n');
        })
        .catch(error => {
          console.error('\nAI 分析失败:', error.message);
          console.log('\n可以使用 `npx doc-sync apply --template` 使用模板建议\n');
        });
      break;

    case 'apply':
      const applyArgs = args.slice(1);
      const useTemplate = applyArgs.includes('--template');
      const aiResultPath = path.join(rootDir, '.doc-sync/ai-result.json');

      let applyResult;

      if (useTemplate || !file.fileExists(aiResultPath)) {
        // 使用模板建议
        const pendingForApply = loadPending(rootDir);
        if (!pendingForApply || pendingForApply.suggestions.length === 0) {
          console.log('\n没有待应用的文档更新。\n');
          process.exit(0);
        }
        applyResult = ai.generateTemplateUpdates(pendingForApply.suggestions, rootDir);
      } else {
        // 使用 AI 结果
        applyResult = file.readJsonFile(aiResultPath);
      }

      if (!applyResult || applyResult.results.length === 0) {
        console.log('\n没有需要应用的更新。\n');
        process.exit(0);
      }

      // 应用更新
      console.log('\n📝 应用文档更新\n');

      for (const result of applyResult.results) {
        const docPath = path.join(rootDir, result.suggestion.docFile);

        if (!file.fileExists(docPath)) {
          console.log(`  ⚠ ${result.suggestion.docFile} 不存在，跳过`);
          continue;
        }

        let docContent = file.readTextFile(docPath);

        for (const update of result.aiUpdates) {
          if (update.action === 'add' || update.action === 'update') {
            docContent = file.updateSection(docContent, update.section, update.content, update.action);
          }
        }

        file.writeTextFile(docPath, docContent);
        console.log(`  ✓ 已更新 ${result.suggestion.docFile}`);
      }

      // 清理待更新文件
      const pendingPath = path.join(rootDir, '.doc-sync/pending-updates.json');
      if (file.fileExists(pendingPath)) {
        fs.unlinkSync(pendingPath);
      }
      if (file.fileExists(aiResultPath)) {
        fs.unlinkSync(aiResultPath);
      }

      console.log('\n✓ 文档更新完成\n');
      console.log('建议: 运行 `git add . && git commit -m "docs: 自动更新文档"` 提交变更\n');
      break;

    case 'skip':
      const skipPath = path.join(rootDir, '.doc-sync/pending-updates.json');
      if (file.fileExists(skipPath)) {
        fs.unlinkSync(skipPath);
        console.log('\n已跳过本次文档更新。\n');
      }
      break;

    case 'status':
      const pendingStatus = loadPending(rootDir);
      if (pendingStatus && pendingStatus.suggestions.length > 0) {
        console.log('\n📝 待确认更新状态\n');
        console.log(`  待更新: ${pendingStatus.suggestions.length} 个文档`);
        console.log(`  时间: ${pendingStatus.timestamp}`);
        console.log('\n');
      } else {
        console.log('\n没有待确认的文档更新。\n');
      }
      break;

    case 'init':
      // 初始化配置文件
      const configPath = path.join(rootDir, '.doc-sync/config.json');
      if (!file.fileExists(configPath)) {
        file.writeJsonFile(configPath, DEFAULT_CONFIG);
        console.log('\n✓ 已创建默认配置文件: .doc-sync/config.json\n');
      } else {
        console.log('\n配置文件已存在。\n');
      }
      break;

    default:
      console.log('\n用法: npx doc-sync <command>\n');
      console.log('命令:');
      console.log('  detect  - 检测暂存区变更');
      console.log('  confirm - 查看待确认的更新');
      console.log('  apply   - 应用更新');
      console.log('  skip    - 跳过本次更新');
      console.log('  status  - 查看状态');
      console.log('  init    - 初始化配置\n');
  }
}

// 导出模块
module.exports = {
  detect,
  analyzeChanges,
  loadConfig,
  loadPending,
  savePending,
  DEFAULT_CONFIG
};

// 运行主程序
if (require.main === module) {
  main();
}