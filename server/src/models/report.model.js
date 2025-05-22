const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, '请提供报告名称'],
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, '请关联项目'],
    },
    reportType: {
      type: String,
      enum: ['审计报告', '税务报告', '内控报告', '资产评估报告', '尽职调查报告', '其他'],
      required: [true, '请选择报告类型'],
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '请指定创建者'],
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reviewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['待审核', '已审核', '需修改'],
          default: '待审核',
        },
        comments: String,
        reviewedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ['草稿', '审核中', '待修订', '已定稿', '已归档'],
      default: '草稿',
    },
    complianceStatus: {
      type: String,
      enum: ['未检查', '通过', '需修改', '不合规'],
      default: '未检查',
    },
    complianceIssues: [
      {
        description: String,
        severity: {
          type: String,
          enum: ['低', '中', '高'],
        },
        fixSuggestion: String,
      },
    ],
    content: {
      type: String,
      required: [true, '报告内容不能为空'],
    },
    sections: [
      {
        title: String,
        content: String,
        order: Number,
        aiGenerated: {
          type: Boolean,
          default: false,
        },
      },
    ],
    attachments: [
      {
        name: String,
        fileUrl: String,
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
    versions: [
      {
        versionNumber: Number,
        content: String,
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
    publishedDate: {
      type: Date,
    },
    aiAssistanceEnabled: {
      type: Boolean,
      default: false,
    },
    aiSuggestions: [
      {
        section: String,
        suggestion: String,
        accepted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

// 自动生成报告编号的静态方法
reportSchema.statics.generateReportId = async function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const prefix = `R${year}${month}${day}`;
  
  // 查找当天已创建的报告数量
  const count = await this.countDocuments({
    reportId: { $regex: `^${prefix}` },
  });
  
  // 生成3位序号
  const seq = String(count + 1).padStart(3, '0');
  
  return `${prefix}${seq}`;
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 