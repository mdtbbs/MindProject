/**
 * Git 操作工具模块
 * 用于获取变更文件、diff 内容等
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * 获取暂存区文件列表
 * @param {string} cwd - 工作目录
 * @returns {string[]} 文件路径列表
 */
function getStagedFiles(cwd = process.cwd()) {
  try {
    const output = execSync('git diff --cached --name-only', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * 获取最近一次提交的变更文件
 * @param {string} cwd - 工作目录
 * @returns {string[]} 文件路径列表
 */
function getLastCommitFiles(cwd = process.cwd()) {
  try {
    const output = execSync('git diff HEAD~1 --name-only', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * 获取文件的 diff 内容
 * @param {string} file - 文件路径
 * @param {boolean} staged - 是否获取暂存区 diff
 * @param {string} cwd - 工作目录
 * @returns {string} diff 内容
 */
function getFileDiff(file, staged = true, cwd = process.cwd()) {
  try {
    const cmd = staged
      ? `git diff --cached "${file}"`
      : `git diff HEAD~1 -- "${file}"`;
    const output = execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    return output.trim();
  } catch (error) {
    return '';
  }
}

/**
 * 获取当前分支名
 * @param {string} cwd - 工作目录
 * @returns {string} 分支名
 */
function getCurrentBranch(cwd = process.cwd()) {
  try {
    const output = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * 获取最近一次提交信息
 * @param {string} cwd - 工作目录
 * @returns {object} 提交信息 { hash, message, author, date }
 */
function getLastCommitInfo(cwd = process.cwd()) {
  try {
    const format = '%H%n%s%n%an%n%ai';
    const output = execSync(`git log -1 --format="${format}"`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const [hash, message, author, date] = output.trim().split('\n');
    return { hash, message, author, date };
  } catch (error) {
    return { hash: '', message: '', author: '', date: '' };
  }
}

/**
 * 检查是否在 git 仓库中
 * @param {string} cwd - 工作目录
 * @returns {boolean}
 */
function isGitRepo(cwd = process.cwd()) {
  try {
    execSync('git rev-parse --git-dir', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取文件相对于仓库根目录的路径
 * @param {string} filePath - 文件路径
 * @param {string} cwd - 工作目录
 * @returns {string} 相对路径
 */
function getRelativePath(filePath, cwd = process.cwd()) {
  try {
    const root = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return path.relative(root, path.resolve(cwd, filePath));
  } catch (error) {
    return filePath;
  }
}

module.exports = {
  getStagedFiles,
  getLastCommitFiles,
  getFileDiff,
  getCurrentBranch,
  getLastCommitInfo,
  isGitRepo,
  getRelativePath
};