/**
 * AI 调用模块
 * 支持多种 AI 提供商进行文档更新分析
 */

const fs = require('fs');
const path = require('path');

// AI 提示模板
const AI_PROMPT_TEMPLATE = `
## 任务
分析以下代码变更，生成 CLAUDE.md 文档更新建议。

## 变更文件
{changedFiles}

## 变更类型
{changeTypes}

## 变更内容预览
{diffPreview}

## 当前文档内容
{currentDoc}

## 输出格式
请严格按照以下 JSON 格式输出，不要添加任何其他内容：

~~~json
{
  "updates": [
    {
      "file": "文档文件路径",
      "section": "## 标题",
      "action": "add|update|remove",
      "content": "具体要添加/更新的内容",
      "reason": "更新原因"
    }
  ],
  "summary": "本次变更的简要说明（一句话）"
}
~~~

## 要求
1. 保持文档风格一致，使用 Markdown 格式
2. 只输出必要的更新，避免冗余
3. 新增内容放在适当位置
4. 删除过时内容时注明原因
5. 如果变更不需要文档更新，返回空 updates 数组
`;

/**
 * 生成 AI 提示
 * @param {object} suggestion - 更新建议
 * @param {string} rootDir - 根目录
 * @returns {string} 提示文本
 */
function generatePrompt(suggestion, rootDir) {
  const docPath = path.join(rootDir, suggestion.docFile);
  let currentDoc = '';

  try {
    if (fs.existsSync(docPath)) {
      currentDoc = fs.readFileSync(docPath, 'utf-8').slice(0, 3000); // 限制长度
    }
  } catch (e) {
    currentDoc = '(文档文件不存在)';
  }

  return AI_PROMPT_TEMPLATE
    .replace('{changedFiles}', suggestion.changedFile)
    .replace('{changeTypes}', suggestion.sections.join(', '))
    .replace('{diffPreview}', suggestion.diffPreview || '(无 diff 内容)')
    .replace('{currentDoc}', currentDoc);
}

/**
 * 使用 Anthropic API 调用 AI
 * @param {string} prompt - 提示文本
 * @param {object} config - AI 配置
 * @returns {object} AI 响应
 */
async function callAnthropic(prompt, config) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set in environment');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-6',
      max_tokens: config.maxTokens || 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  return parseAIResponse(content);
}

/**
 * 使用 OpenAI API 调用 AI
 * @param {string} prompt - 提示文本
 * @param {object} config - AI 配置
 * @returns {object} AI 响应
 */
async function callOpenAI(prompt, config) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      max_tokens: config.maxTokens || 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return parseAIResponse(content);
}

/**
 * 解析 AI 响应内容
 * @param {string} content - AI 返回的文本
 * @returns {object} 解析后的更新对象
 */
function parseAIResponse(content) {
  // 尝试提取 JSON 内容（支持 ```json 和 ~~~json 格式）
  const jsonMatch = content.match(/(?:```|~~~)json\s*([\s\S]*?)\s*(?:```|~~~)/);

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('Failed to parse AI JSON response:', e.message);
    }
  }

  // 尝试直接解析整个响应
  try {
    return JSON.parse(content);
  } catch (e) {
    // 返回空结果
    return {
      updates: [],
      summary: 'AI 响应解析失败'
    };
  }
}

/**
 * 调用 AI 分析变更
 * @param {object[]} suggestions - 更新建议列表
 * @param {object} config - 配置对象
 * @param {string} rootDir - 根目录
 * @returns {Promise<object>} AI 分析结果
 */
async function analyzeWithAI(suggestions, config, rootDir) {
  const aiConfig = config.ai || { provider: 'anthropic' };

  // 如果没有配置 API key，返回模拟结果
  const hasApiKey = aiConfig.provider === 'anthropic'
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENAI_API_KEY;

  if (!hasApiKey) {
    console.log('\n⚠️  AI API key not configured. Using template-based suggestions.\n');
    return generateTemplateUpdates(suggestions, rootDir);
  }

  const results = [];

  for (const suggestion of suggestions) {
    const prompt = generatePrompt(suggestion, rootDir);

    try {
      let response;
      if (aiConfig.provider === 'anthropic') {
        response = await callAnthropic(prompt, aiConfig);
      } else if (aiConfig.provider === 'openai') {
        response = await callOpenAI(prompt, aiConfig);
      }

      if (response && response.updates) {
        results.push({
          suggestion,
          aiUpdates: response.updates,
          summary: response.summary
        });
      }
    } catch (error) {
      console.error(`AI analysis failed for ${suggestion.docFile}:`, error.message);
      results.push({
        suggestion,
        aiUpdates: [],
        summary: `分析失败: ${error.message}`
      });
    }
  }

  return {
    success: true,
    results,
    timestamp: new Date().toISOString()
  };
}

/**
 * 生成模板化的更新建议（无 AI 时使用）
 * @param {object[]} suggestions - 更新建议列表
 * @param {string} rootDir - 根目录
 * @returns {object} 模板更新结果
 */
function generateTemplateUpdates(suggestions, rootDir) {
  const results = [];

  for (const suggestion of suggestions) {
    const templateUpdates = [];

    for (const section of suggestion.sections) {
      templateUpdates.push({
        file: suggestion.docFile,
        section: section,
        action: 'review',
        content: `请检查 ${suggestion.changedFile} 的变更是否需要更新此部分`,
        reason: `文件 ${suggestion.changedFile} 有变更，可能影响文档`
      });
    }

    results.push({
      suggestion,
      aiUpdates: templateUpdates,
      summary: `文件 ${suggestion.changedFile} 有变更，建议人工审核`
    });
  }

  return {
    success: true,
    results,
    timestamp: new Date().toISOString(),
    note: 'Template-based suggestions (AI not configured)'
  };
}

/**
 * 格式化 AI 结果显示
 * @param {object} aiResult - AI 分析结果
 */
function displayAIResult(aiResult) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const result of aiResult.results) {
    console.log(`\n${result.suggestion.docFile}\n`);

    for (const update of result.aiUpdates) {
      const actionIcon = {
        add: '+',
        update: '~',
        remove: '-',
        review: '?'
      }[update.action] || '?';

      console.log(`${update.section}`);
      console.log(`${actionIcon} ${update.content}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (aiResult.note) {
    console.log(`注意: ${aiResult.note}\n`);
  }
}

module.exports = {
  generatePrompt,
  callAnthropic,
  callOpenAI,
  parseAIResponse,
  analyzeWithAI,
  generateTemplateUpdates,
  displayAIResult,
  AI_PROMPT_TEMPLATE
};