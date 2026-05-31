/**
 * 文件操作工具模块
 * 用于读写文件、解析配置等
 */

const fs = require('fs');
const path = require('path');

/**
 * 安全读取 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {object|null} JSON 对象或 null
 */
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 安全写入 JSON 文件
 * @param {string} filePath - 文件路径
 * @param {object} data - JSON 数据
 */
function writeJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 安全读取文本文件
 * @param {string} filePath - 文件路径
 * @returns {string|null} 文件内容或 null
 */
function readTextFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading text file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 安全写入文本文件
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 */
function writeTextFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing text file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean}
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 获取文件的修改时间
 * @param {string} filePath - 文件路径
 * @returns {Date|null}
 */
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    return null;
  }
}

/**
 * 在文件中查找特定 section
 * @param {string} content - 文件内容
 * @param {string} sectionTitle - section 标题 (如 "## API 端点")
 * @returns {object|null} { start, end, content }
 */
function findSection(content, sectionTitle) {
  const lines = content.split('\n');
  let start = -1;
  let end = lines.length;
  const sectionLevel = sectionTitle.match(/^#+/)?.[0]?.length || 2;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(sectionTitle)) {
      start = i;
    } else if (start !== -1 && lines[i].match(/^#{1,6}\s/) && lines[i].match(/^#{1,6}/)[0].length <= sectionLevel) {
      end = i;
      break;
    }
  }

  if (start === -1) return null;

  return {
    start,
    end,
    content: lines.slice(start, end).join('\n')
  };
}

/**
 * 在文件中插入或更新 section
 * @param {string} content - 原文件内容
 * @param {string} sectionTitle - section 标题
 * @param {string} newContent - 新内容
 * @param {string} action - 'add' | 'update' | 'append'
 * @returns {string} 更新后的内容
 */
function updateSection(content, sectionTitle, newContent, action = 'update') {
  const existing = findSection(content, sectionTitle);

  if (action === 'add' && !existing) {
    // 在文件末尾添加新 section
    return content.trimEnd() + '\n\n' + newContent + '\n';
  }

  if (action === 'update' && existing) {
    // 替换现有 section
    const lines = content.split('\n');
    const before = lines.slice(0, existing.start).join('\n');
    const after = lines.slice(existing.end).join('\n');
    return before + '\n' + newContent + '\n' + after;
  }

  if (action === 'append' && existing) {
    // 在现有 section 后追加内容
    const lines = content.split('\n');
    const before = lines.slice(0, existing.end).join('\n');
    const after = lines.slice(existing.end).join('\n');
    return before + '\n' + newContent + '\n' + after;
  }

  return content;
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  readTextFile,
  writeTextFile,
  fileExists,
  getFileModTime,
  findSection,
  updateSection
};