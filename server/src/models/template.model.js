const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, '请提供模板名称'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['审计', '税务', '内控', '尽调', '评估', '其他'],
      required: [true, '请选择模板分类'],
    },
    description: {
      type: String,
      required: [true, '请提供模板描述'],
    },
    content: {
      type: String,
      required: [true, '模板内容不能为空'],
    },
    sections: [
      {
        title: {
          type: String,
          required: true,
        },
        content: String,
        order: Number,
        isRequired: {
          type: Boolean,
          default: true,
        },
        placeholders: [
          {
            key: String,
            description: String,
            defaultValue: String,
          },
        ],
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        name: String,
        fileUrl: String,
      },
    ],
    tags: [String],
    versions: [
      {
        versionNumber: Number,
        content: String,
        sections: [
          {
            title: String,
            content: String,
            order: Number,
          },
        ],
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        changes: String,
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// 自动生成模板编号的静态方法
templateSchema.statics.generateTemplateId = async function () {
  const prefix = 'T';
  
  // 查找已创建的模板数量
  const count = await this.countDocuments();
  
  // 生成3位序号
  const seq = String(count + 1).padStart(3, '0');
  
  return `${prefix}${seq}`;
};

const Template = mongoose.model('Template', templateSchema);

module.exports = Template; 