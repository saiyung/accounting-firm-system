const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '任务标题不能为空'],
      trim: true,
      maxlength: [200, '任务标题不能超过200个字符'],
    },
    description: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '任务必须关联用户'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    deadline: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'inProgress', 'completed', 'canceled'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
    },
    tags: [String],
    relatedTo: {
      type: {
        type: String,
        enum: ['project', 'client', 'report', 'meeting', 'other'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: String,
    },
    reminder: {
      isSet: {
        type: Boolean,
        default: false,
      },
      time: Date,
      sent: {
        type: Boolean,
        default: false,
      },
    },
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      endDate: Date,
    },
  },
  { timestamps: true }
);

// 索引优化
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ 'reminder.time': 1, 'reminder.isSet': 1, 'reminder.sent': 1 });

/**
 * 获取用户待办任务的静态方法
 * @param {String} userId 用户ID
 * @param {Object} filter 过滤条件
 * @returns {Promise} 任务列表
 */
taskSchema.statics.getUserTasks = async function(userId, filter = {}) {
  const query = { user: userId, ...filter };
  
  return this.find(query)
    .sort({ deadline: 1, priority: -1, createdAt: -1 })
    .populate('project', 'name projectId')
    .lean();
};

/**
 * 获取项目任务的静态方法
 * @param {String} projectId 项目ID
 * @param {Object} filter 过滤条件
 * @returns {Promise} 任务列表
 */
taskSchema.statics.getProjectTasks = async function(projectId, filter = {}) {
  const query = { project: projectId, ...filter };
  
  return this.find(query)
    .sort({ deadline: 1, priority: -1, createdAt: -1 })
    .populate('user', 'name avatar')
    .lean();
};

/**
 * 获取即将到期的任务的静态方法
 * @param {String} userId 用户ID
 * @param {Number} days 天数
 * @returns {Promise} 任务列表
 */
taskSchema.statics.getUpcomingTasks = async function(userId, days = 3) {
  const today = new Date();
  const upcoming = new Date();
  upcoming.setDate(today.getDate() + days);
  
  return this.find({
    user: userId,
    status: { $in: ['pending', 'inProgress'] },
    deadline: { $gte: today, $lte: upcoming },
  })
    .sort({ deadline: 1, priority: -1 })
    .populate('project', 'name projectId')
    .lean();
};

/**
 * 完成任务的实例方法
 */
taskSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 