require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // 数据库配置
  db: {
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/accounting_firm',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'accountingfirmsecret2024',
    expiry: process.env.JWT_EXPIRE || '30d',
    cookieExpiry: 30, // 天数
  },
  
  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    destination: 'uploads/',
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  
  // 分页配置
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  
  // 邮件配置
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@accountingfirm.com',
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // 系统配置
  system: {
    name: '会计师事务所管理系统',
    version: '1.0.0',
    companyName: '智能会计师事务所',
    companyAddress: '北京市朝阳区建国路88号',
    companyPhone: '010-12345678',
    companyEmail: 'contact@accountingfirm.com',
  },
  
  // 安全配置
  security: {
    bcryptSaltRounds: 10,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 每个IP在windowMs期间允许的最大请求数
      message: '请求过于频繁，请稍后再试',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  },
  
  // Deepseek配置
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
    models: {
      r1: process.env.DEEPSEEK_MODEL_1 || 'deepseek-chat',
      v3: process.env.DEEPSEEK_MODEL_V3 || 'deepseek-v3'
    },
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
  },
  
  // OpenAI配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },
  
  // 百度文心一言配置
  baidu: {
    apiKey: process.env.BAIDU_API_KEY,
    secretKey: process.env.BAIDU_SECRET_KEY,
    apiUrl: process.env.BAIDU_API_URL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/',
    model: process.env.BAIDU_MODEL || 'ernie-bot-4',
    temperature: parseFloat(process.env.BAIDU_TEMPERATURE || '0.7'),
  },
};

module.exports = config; 