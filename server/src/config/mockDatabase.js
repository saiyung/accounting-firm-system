/**
 * 模拟数据库配置
 * 替代MongoDB连接，使用本地JSON文件存储数据
 */

const { generateMockDb } = require('../utils/generateMockDb');
const logger = require('../utils/logger');

/**
 * 初始化模拟数据库
 */
const initMockDatabase = async () => {
  try {
    // 生成模拟数据
    const result = generateMockDb();
    
    if (result) {
      logger.info('模拟数据库初始化成功');
    } else {
      logger.error('模拟数据库初始化失败');
    }
    
    return result;
  } catch (error) {
    logger.error(`模拟数据库初始化错误: ${error.message}`);
    return false;
  }
};

module.exports = initMockDatabase; 