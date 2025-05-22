const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, '项目名称不能为空'],
      trim: true,
      maxlength: [100, '项目名称不能超过100个字符'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, '请关联客户'],
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['审计', '税务', '内控', '尽调', '评估', '咨询', '其他'],
      required: [true, '请选择项目类型'],
    },
    status: {
      type: String,
      enum: ['未开始', '进行中', '已完成', '已暂停', '已取消'],
      default: '未开始',
    },
    priority: {
      type: String,
      enum: ['低', '中', '高', '紧急'],
      default: '中',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '请指定项目经理'],
    },
    team: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['项目经理', '项目助理', '高级审计师', '审计师', '其他'],
          required: true,
        },
        allocation: {
          type: Number, // 分配工时百分比
          min: 0,
          max: 100,
          default: 100,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    phases: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
        startDate: Date,
        endDate: Date,
        status: {
          type: String,
          enum: ['未开始', '进行中', '已完成', '已暂停'],
          default: '未开始',
        },
        tasks: [
          {
            name: {
              type: String,
              required: true,
            },
            description: String,
            assignedTo: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            dueDate: Date,
            status: {
              type: String,
              enum: ['未开始', '进行中', '已完成', '已逾期'],
              default: '未开始',
            },
            priority: {
              type: String,
              enum: ['低', '中', '高', '紧急'],
              default: '中',
            },
            completedAt: Date,
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
              },
            ],
          },
        ],
      },
    ],
    dates: {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      actualStartDate: {
        type: Date,
      },
      actualEndDate: {
        type: Date,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    hours: {
      estimated: {
        type: Number,
        default: 0,
      },
      actual: {
        type: Number,
        default: 0,
      },
    },
    budget: {
      estimated: {
        type: Number,
        default: 0,
      },
      actual: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'CNY',
      },
    },
    contractInfo: {
      contractNumber: String,
      contractDate: Date,
      contractValue: Number,
      paymentTerms: String,
    },
    billing: [
      {
        invoiceNumber: String,
        amount: Number,
        date: Date,
        status: {
          type: String,
          enum: ['未开票', '已开票', '已支付', '逾期', '部分支付'],
          default: '未开票',
        },
        paidAmount: {
          type: Number,
          default: 0,
        },
        paidDate: Date,
      },
    ],
    risks: [
      {
        description: {
          type: String,
          required: true,
        },
        level: {
          type: String,
          enum: ['低', '中', '高', '极高'],
          default: '中',
        },
        mitigationPlan: String,
        status: {
          type: String,
          enum: ['未解决', '监控中', '已解决', '已关闭'],
          default: '未解决',
        },
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
        resolvedAt: Date,
      },
    ],
    documents: [
      {
        name: String,
        description: String,
        fileUrl: String,
        fileType: String,
        size: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        version: {
          type: Number,
          default: 1,
        },
        category: {
          type: String,
          enum: ['合同', '报告', '工作底稿', '会议纪要', '客户资料', '其他'],
          default: '其他',
        },
      },
    ],
    meetings: [
      {
        title: String,
        date: Date,
        location: String,
        attendees: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        externalAttendees: [
          {
            name: String,
            organization: String,
            position: String,
            contact: String,
          },
        ],
        notes: String,
        actionItems: [
          {
            description: String,
            assignedTo: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            dueDate: Date,
            status: {
              type: String,
              enum: ['未开始', '进行中', '已完成', '已逾期'],
              default: '未开始',
            },
          },
        ],
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
    tags: [String],
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// 索引优化查询效率
projectSchema.index({ projectId: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ 'team.user': 1 });
projectSchema.index({ 'dates.startDate': 1 });
projectSchema.index({ 'dates.endDate': 1 });
projectSchema.index({ type: 1, status: 1 });
projectSchema.index({ tags: 1 });

// 生成项目ID
projectSchema.statics.generateProjectId = async function (type, year) {
  const currentYear = year || new Date().getFullYear().toString().substr(-2);
  
  // 根据项目类型生成前缀
  let prefix;
  switch (type) {
    case '审计':
      prefix = 'A';
      break;
    case '税务':
      prefix = 'T';
      break;
    case '内控':
      prefix = 'I';
      break;
    case '尽调':
      prefix = 'D';
      break;
    case '评估':
      prefix = 'V';
      break;
    case '咨询':
      prefix = 'C';
      break;
    default:
      prefix = 'O';
  }

  // 查找同类型同年度的最后一个项目
  const lastProject = await this.findOne({
    projectId: { $regex: `^${prefix}${currentYear}` },
  }).sort({ projectId: -1 });

  let nextNumber = 1;
  if (lastProject) {
    // 提取序号并递增
    const lastNumber = parseInt(lastProject.projectId.substr(3), 10);
    nextNumber = lastNumber + 1;
  }

  // 格式化项目ID: [类型前缀][年份][4位序号]
  return `${prefix}${currentYear}${nextNumber.toString().padStart(4, '0')}`;
};

// 项目团队成员虚拟属性
projectSchema.virtual('teamSize').get(function () {
  return this.team.length;
});

// 项目完成百分比虚拟属性
projectSchema.virtual('completionPercentage').get(function () {
  if (!this.phases || this.phases.length === 0) return 0;

  const totalTasks = this.phases.reduce(
    (acc, phase) => acc + (phase.tasks ? phase.tasks.length : 0),
    0
  );
  
  if (totalTasks === 0) return 0;

  const completedTasks = this.phases.reduce(
    (acc, phase) =>
      acc +
      (phase.tasks
        ? phase.tasks.filter((task) => task.status === '已完成').length
        : 0),
    0
  );

  return Math.round((completedTasks / totalTasks) * 100);
});

// 计算预算使用百分比
projectSchema.virtual('budgetUsagePercentage').get(function () {
  if (!this.budget.estimated || this.budget.estimated === 0) return 0;
  return Math.round((this.budget.actual / this.budget.estimated) * 100);
});

// 计算工时使用百分比
projectSchema.virtual('hoursUsagePercentage').get(function () {
  if (!this.hours.estimated || this.hours.estimated === 0) return 0;
  return Math.round((this.hours.actual / this.hours.estimated) * 100);
});

// 设置项目状态为已完成时自动设置实际结束日期
projectSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === '已完成' && !this.dates.actualEndDate) {
    this.dates.actualEndDate = new Date();
  }
  
  // 更新最后更新时间
  this.dates.lastUpdated = new Date();
  
  next();
});

// 添加团队成员的方法
projectSchema.methods.addTeamMember = function (userData) {
  // 检查用户是否已在团队中
  const existingMember = this.team.find(
    (member) => member.user.toString() === userData.user.toString()
  );

  if (existingMember) {
    throw new Error('该用户已在项目团队中');
  }

  this.team.push(userData);
  return this.save();
};

// 移除团队成员的方法
projectSchema.methods.removeTeamMember = function (userId) {
  const initialLength = this.team.length;
  this.team = this.team.filter(
    (member) => member.user.toString() !== userId.toString()
  );
  
  // 验证是否有成员被移除
  if (initialLength === this.team.length) {
    throw new Error('未找到该团队成员');
  }
  
  return this.save();
};

// 计算项目工时总额的方法
projectSchema.methods.calculateTotalHours = async function () {
  const Timesheet = mongoose.model('Timesheet');
  const result = await Timesheet.aggregate([
    { $match: { project: this._id } },
    { $group: { _id: null, totalHours: { $sum: '$hours' } } },
  ]);

  return result.length > 0 ? result[0].totalHours : 0;
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 