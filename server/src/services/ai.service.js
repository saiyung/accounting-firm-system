const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * 调用Deepseek API
 * @param {Array} messages 消息数组
 * @param {string} modelVersion 模型版本，'r1'或'v3'
 * @returns {Promise<string>} API响应
 */
const callDeepseekAPI = async (messages, modelVersion = 'r1') => {
  try {
    // 根据版本选择模型
    const model = config.deepseek.models[modelVersion] || config.deepseek.models.r1;
    
    const response = await axios.post(
      config.deepseek.apiUrl,
      {
        model: model,
        messages: messages,
        temperature: config.deepseek.temperature,
        // 不设置max_tokens参数，允许无限制输出
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseek.apiKey}`
        }
      }
    );
    
    logger.info(`Deepseek API(${model})调用成功`);
    return response.data.choices[0].message.content;
  } catch (error) {
    logger.error(`Deepseek API调用失败: ${error.message}`);
    if (error.response) {
      logger.error(`响应状态: ${error.response.status}`);
      logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`AI服务调用失败: ${error.message}`);
  }
};

/**
 * 调用OpenAI API
 * @param {Array} messages 消息数组
 * @returns {Promise<string>} API响应
 */
const callOpenAIAPI = async (messages) => {
  try {
    const response = await axios.post(
      config.openai.apiUrl,
      {
        model: config.openai.model,
        messages: messages,
        temperature: config.openai.temperature,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openai.apiKey}`
        }
      }
    );
    
    logger.info('OpenAI API调用成功');
    return response.data.choices[0].message.content;
  } catch (error) {
    logger.error(`OpenAI API调用失败: ${error.message}`);
    if (error.response) {
      logger.error(`响应状态: ${error.response.status}`);
      logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`AI服务调用失败: ${error.message}`);
  }
};

/**
 * 获取百度文心一言访问令牌
 * @returns {Promise<string>} 访问令牌
 */
const getBaiduAccessToken = async () => {
  try {
    const response = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: config.baidu.apiKey,
          client_secret: config.baidu.secretKey
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    logger.error(`获取百度访问令牌失败: ${error.message}`);
    throw new Error(`获取百度访问令牌失败: ${error.message}`);
  }
};

/**
 * 调用百度文心一言API
 * @param {Array} messages 消息数组
 * @returns {Promise<string>} API响应
 */
const callBaiduAPI = async (messages) => {
  try {
    // 获取访问令牌
    const accessToken = await getBaiduAccessToken();
    
    // 转换消息格式为百度API所需格式
    const baiduMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 调用百度API
    const response = await axios.post(
      `${config.baidu.apiUrl}${config.baidu.model}?access_token=${accessToken}`,
      {
        messages: baiduMessages,
        temperature: config.baidu.temperature,
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    logger.info('百度文心一言API调用成功');
    return response.data.result;
  } catch (error) {
    logger.error(`百度文心一言API调用失败: ${error.message}`);
    if (error.response) {
      logger.error(`响应状态: ${error.response.status}`);
      logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`AI服务调用失败: ${error.message}`);
  }
};

/**
 * 根据选择的模型调用相应的AI API
 * @param {Array} messages 消息数组
 * @param {string} model 模型类型：'deepseek.r1', 'deepseek.v3', 'openai', 'baidu'
 * @returns {Promise<string>} API响应
 */
const callAIAPI = async (messages, model = 'deepseek.r1') => {
  // 解析模型类型
  if (model.startsWith('deepseek.')) {
    const version = model.split('.')[1]; // 获取版本部分 (r1 或 v3)
    return await callDeepseekAPI(messages, version);
  } else if (model === 'openai') {
    return await callOpenAIAPI(messages);
  } else if (model === 'baidu') {
    return await callBaiduAPI(messages);
  } else {
    // 默认使用deepseek r1
    return await callDeepseekAPI(messages, 'r1');
  }
};

/**
 * 使用AI生成报告内容
 * @param {Object} data 包含报告所需的数据
 * @param {string} data.reportType 报告类型（如审计报告、税务报告等）
 * @param {string} data.clientName 客户名称
 * @param {string} data.projectName 项目名称
 * @param {Object} data.financialData 财务数据
 * @param {string} data.template 报告模板内容
 * @param {string} data.aiModel 使用的AI模型 (deepseek.r1, deepseek.v3, openai, baidu)
 * @returns {Promise<Object>} 生成的报告内容
 */
exports.generateReportContent = async (data) => {
  try {
    const aiModel = data.aiModel || 'deepseek.r1';
    logger.info(`开始为项目 ${data.projectName} 使用${aiModel}生成AI报告`);
    
    // 构建提示词
    const prompt = constructPrompt(data);
    
    // 调用AI API
    const messages = [
      { role: 'system', content: '你是一名专业的会计师事务所报告生成助手，擅长根据模板和客户数据生成专业、规范的财务报告。你的回答应当严格遵循会计准则和法规要求，注重数据准确性和逻辑性。' },
      { role: 'user', content: prompt }
    ];
    
    const response = await callAIAPI(messages, aiModel);
    
    logger.info(`成功使用${aiModel}为 ${data.projectName} 生成AI报告`);
    
    // 解析AI返回的内容并分段
    return parseAIResponse(response, data.reportType);
    
  } catch (error) {
    logger.error(`生成AI报告失败: ${error.message}`);
    throw new Error(`AI报告生成失败: ${error.message}`);
  }
};

/**
 * 使用AI对报告进行合规性检查
 * @param {Object} data 包含报告内容和规则
 * @param {string} data.content 报告内容
 * @param {string} data.reportType 报告类型
 * @param {Array} data.regulations 需要检查的法规列表
 * @param {string} data.aiModel 使用的AI模型 (deepseek.r1, deepseek.v3, openai, baidu)
 * @returns {Promise<Object>} 检查结果和建议
 */
exports.checkReportCompliance = async (data) => {
  try {
    const aiModel = data.aiModel || 'deepseek.r1';
    logger.info(`开始使用${aiModel}对报告进行AI合规检查`);
    
    // 构建提示词
    const prompt = `请对以下${data.reportType}进行合规性检查，特别关注以下法规和会计准则的符合情况：
    ${data.regulations.join('\n')}
    
    报告内容：
    ${data.content}
    
    请提供：
    1. 合规性评分（0-100）
    2. 详细的合规性问题清单，包括每个问题的描述、严重程度（高/中/低）
    3. 修改建议
    
    回答仅包含JSON格式数据，格式如下：
    {
      "score": 数字,
      "issues": [
        {
          "description": "问题描述",
          "severity": "严重程度",
          "suggestion": "修改建议"
        }
      ],
      "overallSuggestion": "总体建议"
    }
    `;
    
    // 调用AI API
    const messages = [
      { role: 'system', content: '你是一名专业的会计合规审核专家，擅长识别财务报告中的合规问题并提供专业建议。' },
      { role: 'user', content: prompt }
    ];
    
    const response = await callAIAPI(messages, aiModel);
    
    logger.info(`成功使用${aiModel}完成报告合规检查`);
    
    // 解析返回的JSON
    return JSON.parse(response);
    
  } catch (error) {
    logger.error(`AI合规检查失败: ${error.message}`);
    throw new Error(`合规检查失败: ${error.message}`);
  }
};

/**
 * 根据项目数据智能推荐相关法规及注意事项
 * @param {Object} data 项目数据
 * @param {string} data.aiModel 使用的AI模型 (deepseek.r1, deepseek.v3, openai, baidu)
 * @returns {Promise<Object>} 推荐的法规和注意事项
 */
exports.getRegulationRecommendations = async (data) => {
  try {
    const aiModel = data.aiModel || 'deepseek.r1';
    logger.info(`开始使用${aiModel}为项目 ${data.projectName} 生成法规推荐`);
    
    // 构建提示词
    const prompt = `请为以下项目推荐相关的会计准则、税务法规和注意事项：
    
    项目类型：${data.projectType}
    客户行业：${data.industry}
    业务范围：${data.businessScope}
    ${data.additionalInfo ? `其他信息：${data.additionalInfo}` : ''}
    
    请提供：
    1. 最相关的会计准则列表（至少3条）
    2. 最相关的税务法规列表（至少3条）
    3. 该类项目常见的合规风险
    4. 针对性的注意事项
    
    回答仅包含JSON格式数据。`;
    
    // 调用AI API
    const messages = [
      { role: 'system', content: '你是一名专业的会计法规专家，精通各类会计准则和税务法规，能针对不同行业和业务类型提供精准的法规建议。' },
      { role: 'user', content: prompt }
    ];
    
    const response = await callAIAPI(messages, aiModel);
    
    logger.info(`成功使用${aiModel}生成项目法规推荐`);
    
    // 解析返回的JSON
    return JSON.parse(response);
    
  } catch (error) {
    logger.error(`生成法规推荐失败: ${error.message}`);
    throw new Error(`法规推荐失败: ${error.message}`);
  }
};

/**
 * 构建报告生成的提示词
 * @param {Object} data 报告数据
 * @returns {string} 构建的提示词
 */
function constructPrompt(data) {
  // 基于报告类型构建不同的提示词
  let prompt = `请根据以下信息生成一份专业的${data.reportType}：
  
  客户名称：${data.clientName}
  项目名称：${data.projectName}
  报告类型：${data.reportType}
  `;
  
  // 添加财务数据
  if (data.financialData) {
    prompt += `\n财务数据：\n`;
    Object.entries(data.financialData).forEach(([key, value]) => {
      prompt += `- ${key}: ${value}\n`;
    });
  }
  
  // 添加模板信息
  if (data.template) {
    prompt += `\n请按照以下模板结构生成报告，但内容需要基于上述提供的信息：\n${data.template}\n`;
  } else {
    prompt += `\n请包含以下几个主要部分：
    1. 报告标题与目的
    2. 执行概述
    3. 发现与分析
    4. 结论与建议
    5. 附录（如适用）
    `;
  }
  
  prompt += `\n请确保报告内容专业、准确、符合会计准则和法规要求。如果信息不足，请合理推断但标注这些部分是基于有限信息的推断。`;
  
  return prompt;
}

/**
 * 解析AI返回的报告内容
 * @param {string} content AI返回的内容
 * @param {string} reportType 报告类型
 * @returns {Object} 解析后的结构化内容
 */
function parseAIResponse(content, reportType) {
  // 将内容按章节划分
  const sections = [];
  let currentSection = null;
  let currentContent = [];
  
  // 使用正则表达式识别标题
  const titleRegex = /^(#+)\s+(.+)$|^([IVX]+\.\s+.+)$|^(\d+\.\s+.+)$/gm;
  
  // 按行分割内容
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const titleMatch = titleRegex.exec(line);
    
    // 重置正则表达式
    titleRegex.lastIndex = 0;
    
    if (titleMatch) {
      // 如果已有当前章节，将其保存
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n'),
          order: sections.length + 1,
          aiGenerated: true
        });
      }
      
      // 开始新章节
      currentSection = titleMatch[2] || titleMatch[3] || titleMatch[4] || line;
      currentContent = [];
    } else if (line.trim() !== '') {
      // 添加非空行到当前内容
      currentContent.push(line);
    }
  }
  
  // 添加最后一个章节
  if (currentSection) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n'),
      order: sections.length + 1,
      aiGenerated: true
    });
  }
  
  // 如果没有识别出章节，将整个内容作为一个章节
  if (sections.length === 0 && content.trim() !== '') {
    sections.push({
      title: `${reportType}内容`,
      content: content,
      order: 1,
      aiGenerated: true
    });
  }
  
  return {
    sections,
    rawContent: content
  };
}

module.exports = exports; 