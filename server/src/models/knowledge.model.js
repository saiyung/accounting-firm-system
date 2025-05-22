const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '请提供标题'],
      trim: true,
      maxlength: [100, '标题不能超过100个字符'],
    },
    content: {
      type: String,
      required: [true, '请提供内容'],
    },
    category: {
      type: String,
      enum: ['审计', '税务', '内控', '评估', '法规', '财务报表', '案例分析', '最佳实践', '行业研究', '其他'],
      required: [true, '请选择分类'],
    },
    tags: [String],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reviewedAt: {
          type: Date,
          default: Date.now,
        },
        comments: String,
      },
    ],
    status: {
      type: String,
      enum: ['草稿', '已发布', '已归档', '审核中'],
      default: '草稿',
    },
    visibility: {
      type: String,
      enum: ['公开', '仅内部', '指定部门'],
      default: '仅内部',
    },
    visibleTo: [
      {
        type: String,
        enum: ['审计', '税务', '咨询', '行政', '人事', '财务', '信息技术', '市场'],
      },
    ],
    attachments: [
      {
        name: String,
        fileUrl: String,
        fileType: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    relatedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    relatedClients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        replies: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            content: String,
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    summary: {
      type: String,
      trim: true,
      maxlength: [500, '摘要不能超过500个字符'],
    },
    keywords: [String],
    references: [
      {
        title: String,
        url: String,
        description: String,
      },
    ],
    revisions: [
      {
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        changes: String,
        version: Number,
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    expiryDate: Date,
  },
  { timestamps: true }
);

// 创建全文搜索索引
knowledgeSchema.index({
  title: 'text',
  content: 'text',
  summary: 'text',
  keywords: 'text',
  tags: 'text',
});

// 创建复合索引提高查询性能
knowledgeSchema.index({ category: 1, status: 1 });
knowledgeSchema.index({ author: 1, status: 1 });
knowledgeSchema.index({ visibility: 1, status: 1 });
knowledgeSchema.index({ publishedAt: -1 });
knowledgeSchema.index({ viewCount: -1 });

// 计算点赞数
knowledgeSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// 计算评论数
knowledgeSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// 增加阅读计数的方法
knowledgeSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  return this.save();
};

// 检查用户是否有权限查看的方法
knowledgeSchema.methods.isVisibleToUser = function (user) {
  // 作者或管理员/合伙人可以查看
  if (
    this.author.toString() === user._id.toString() ||
    user.role === 'admin' ||
    user.role === 'partner'
  ) {
    return true;
  }

  // 公开的知识可以被任何人查看
  if (this.visibility === '公开') {
    return true;
  }

  // 内部可见且状态为已发布的知识可以被所有内部用户查看
  if (this.visibility === '仅内部' && this.status === '已发布') {
    return true;
  }

  // 指定部门可见的知识
  if (
    this.visibility === '指定部门' &&
    this.status === '已发布' &&
    this.visibleTo.includes(user.department)
  ) {
    return true;
  }

  return false;
};

// 按分类统计知识文章的静态方法
knowledgeSchema.statics.countByCategory = async function () {
  return this.aggregate([
    { $match: { status: '已发布' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

// 查找热门知识的静态方法
knowledgeSchema.statics.findPopular = async function (limit = 5) {
  return this.find({ status: '已发布' })
    .sort({ viewCount: -1 })
    .limit(limit)
    .populate('author', 'name avatar');
};

// 查找用户关注领域的知识
knowledgeSchema.statics.findRelevantForUser = async function (user, limit = 10) {
  // 如果用户有兴趣标签，则查找相关的知识
  if (user.interests && user.interests.length > 0) {
    return this.find({
      status: '已发布',
      $or: [
        { category: { $in: user.interests } },
        { tags: { $in: user.interests } },
      ],
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate('author', 'name avatar');
  }
  
  // 否则返回用户部门相关的知识
  return this.find({
    status: '已发布',
    $or: [
      { category: user.department },
      { visibility: '指定部门', visibleTo: user.department },
    ],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('author', 'name avatar');
};

const Knowledge = mongoose.model('Knowledge', knowledgeSchema);

module.exports = Knowledge; 