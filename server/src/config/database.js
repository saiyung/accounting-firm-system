const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * 连接MongoDB数据库
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB连接成功: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB连接失败: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 