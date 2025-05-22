const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, '请提供客户名称'],
      trim: true,
      unique: true,
    },
    industry: {
      type: String,
      enum: ['科技', '贸易', '医疗', '餐饮', '金融', '地产', '制造', '教育', '服务', '其他'],
      required: [true, '请选择所属行业'],
    },
    contactPerson: {
      name: {
        type: String,
        required: [true, '请提供联系人姓名'],
      },
      position: String,
      phone: {
        type: String,
        required: [true, '请提供联系电话'],
      },
      email: {
        type: String,
        match: [
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
          '请提供有效的邮箱地址',
        ],
      },
    },
    alternativeContacts: [
      {
        name: String,
        position: String,
        phone: String,
        email: String,
      },
    ],
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
    },
    registrationInfo: {
      registrationNumber: String, // 工商注册号
      taxId: String, // 税号
      legalRepresentative: String, // 法定代表人
      registeredCapital: Number, // 注册资本
      foundingDate: Date, // 成立日期
    },
    financialInfo: {
      annualRevenue: Number, // 年营收
      lastAuditYear: Number, // 上次审计年度
      fiscalYearEnd: String, // 财年结束月份，如 "12-31"
    },
    tags: [String], // 如 '高价值', '上市企业', '潜力客户' 等标签
    category: {
      type: String,
      enum: ['A', 'B', 'C', 'D'], // 客户分级
      default: 'C',
    },
    status: {
      type: String,
      enum: ['活跃', '潜在', '流失', '黑名单'],
      default: '活跃',
    },
    source: {
      type: String,
      enum: ['推荐', '营销活动', '自主咨询', '老客户', '其他'],
    },
    relationshipManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    agreements: [
      {
        type: {
          type: String,
          enum: ['服务协议', '保密协议', '其他'],
        },
        startDate: Date,
        endDate: Date,
        documentUrl: String,
      },
    ],
    notes: [
      {
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        name: String,
        fileUrl: String,
        category: {
          type: String,
          enum: ['营业执照', '税务资料', '财务报表', '其他'],
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    history: [
      {
        action: {
          type: String,
          enum: ['创建', '更新', '停用', '启用'],
        },
        date: {
          type: Date,
          default: Date.now,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        details: String,
      },
    ],
  },
  { timestamps: true }
);

// 自动生成客户编号的静态方法
clientSchema.statics.generateClientId = async function () {
  const date = new Date();
  const year = date.getFullYear();
  
  const prefix = `C${year}`;
  
  // 查找当前年度已创建的客户数量
  const count = await this.countDocuments({
    clientId: { $regex: `^${prefix}` },
  });
  
  // 生成4位序号
  const seq = String(count + 1).padStart(4, '0');
  
  return `${prefix}${seq}`;
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client; 