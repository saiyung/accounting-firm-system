const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['创建', '更新', '完成', '删除', '评论', '分配', '上传', '下载', '提交', '审核', '添加'],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['项目', '任务', '报告', '客户', '文档', '评论', '团队', '会议', '风险'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    targetName: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 索引优化
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ projectId: 1, timestamp: -1 });

/**
 * 创建活动记录的静态方法
 * @param {Object} activityData 活动数据
 * @returns {Promise} 创建的活动记录
 */
activitySchema.statics.createActivity = async function(activityData) {
  try {
    return await this.create(activityData);
  } catch (error) {
    console.error('创建活动记录失败:', error);
    // 记录错误但不中断应用流程
    return null;
  }
};

/**
 * 获取用户活动的静态方法
 * @param {String} userId 用户ID
 * @param {Number} limit 限制数量
 * @returns {Promise} 用户活动列表
 */
activitySchema.statics.getUserActivities = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name avatar')
    .lean();
};

/**
 * 获取项目活动的静态方法
 * @param {String} projectId 项目ID
 * @param {Number} limit 限制数量
 * @returns {Promise} 项目活动列表
 */
activitySchema.statics.getProjectActivities = async function(projectId, limit = 20) {
  return this.find({ projectId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name avatar')
    .lean();
};

/**
 * 获取团队活动的静态方法
 * @param {Array} userIds 用户ID数组
 * @param {Number} limit 限制数量
 * @returns {Promise} 团队活动列表
 */
activitySchema.statics.getTeamActivities = async function(userIds, limit = 20) {
  return this.find({ user: { $in: userIds } })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name avatar')
    .lean();
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity; 