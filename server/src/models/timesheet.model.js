const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '请指定用户'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, '请关联项目'],
    },
    date: {
      type: Date,
      required: [true, '请选择日期'],
      default: Date.now,
    },
    hours: {
      type: Number,
      required: [true, '请填写工时'],
      min: [0.5, '工时不能少于0.5小时'],
      max: [24, '工时不能超过24小时'],
    },
    task: {
      type: String,
      required: [true, '请描述工作内容'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['现场工作', '远程工作', '报告编写', '资料整理', '会议', '客户沟通', '培训', '其他'],
      default: '现场工作',
    },
    status: {
      type: String,
      enum: ['待审核', '已审核', '已拒绝'],
      default: '待审核',
    },
    description: {
      type: String,
      trim: true,
    },
    billable: {
      type: Boolean,
      default: true,
    },
    billingRate: {
      type: Number,
      default: 0,
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
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
    attachments: [
      {
        name: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    overtime: {
      type: Boolean,
      default: false,
    },
    week: {
      type: Number,
      // 自动计算的周数（一年中的第几周）
    },
    month: {
      type: Number,
      // 自动计算的月份
    },
    year: {
      type: Number,
      // 自动计算的年份
    },
  },
  { timestamps: true }
);

// 保存前自动计算周、月、年
timesheetSchema.pre('save', function (next) {
  if (this.isModified('date') || this.isNew) {
    const date = new Date(this.date);
    
    // 计算一年中的第几周
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    this.week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    // 设置月份（0-11，转为1-12）
    this.month = date.getMonth() + 1;
    
    // 设置年份
    this.year = date.getFullYear();
  }
  next();
});

// 索引优化查询效率
timesheetSchema.index({ user: 1, project: 1, date: 1 });
timesheetSchema.index({ user: 1, date: 1 });
timesheetSchema.index({ project: 1, date: 1 });
timesheetSchema.index({ year: 1, month: 1, user: 1 });

// 汇总统计方法
timesheetSchema.statics.getProjectHours = async function (projectId) {
  return this.aggregate([
    { $match: { project: mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: null, totalHours: { $sum: '$hours' } } },
  ]);
};

timesheetSchema.statics.getUserMonthlyHours = async function (userId, year, month) {
  return this.aggregate([
    { 
      $match: { 
        user: mongoose.Types.ObjectId(userId),
        year: year,
        month: month
      } 
    },
    { $group: { _id: null, totalHours: { $sum: '$hours' } } },
  ]);
};

timesheetSchema.statics.getProjectUserHours = async function (projectId) {
  return this.aggregate([
    { $match: { project: mongoose.Types.ObjectId(projectId) } },
    { 
      $group: { 
        _id: '$user', 
        totalHours: { $sum: '$hours' },
        billableHours: { 
          $sum: { 
            $cond: [{ $eq: ['$billable', true] }, '$hours', 0] 
          } 
        }
      } 
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
    { $unwind: '$userDetails' },
    { 
      $project: { 
        userName: '$userDetails.name',
        totalHours: 1,
        billableHours: 1,
        efficiency: { $divide: ['$billableHours', '$totalHours'] }
      } 
    }
  ]);
};

const Timesheet = mongoose.model('Timesheet', timesheetSchema);

module.exports = Timesheet; 