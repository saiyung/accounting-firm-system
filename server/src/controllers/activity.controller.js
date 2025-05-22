const Activity = require('../models/activity.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const mongoose = require('mongoose');

/**
 * @desc    获取当前用户的活动
 * @route   GET /api/activities/me
 * @access  Private
 */
const getMyActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const activities = await Activity.getUserActivities(req.user._id, limit);
    
    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取团队活动
 * @route   GET /api/activities/team
 * @access  Private
 */
const getTeamActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // 查找当前用户所在的所有项目
    const userProjects = await Project.find({
      $or: [
        { manager: req.user._id },
        { 'team.user': req.user._id }
      ]
    }).select('_id team manager');
    
    if (userProjects.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // 收集所有团队成员的ID
    const teamUserIds = new Set();
    teamUserIds.add(req.user._id.toString());
    
    userProjects.forEach(project => {
      // 添加项目经理
      teamUserIds.add(project.manager.toString());
      
      // 添加团队成员
      project.team.forEach(member => {
        teamUserIds.add(member.user.toString());
      });
    });
    
    // 获取团队活动
    const activities = await Activity.getTeamActivities(
      Array.from(teamUserIds).map(id => mongoose.Types.ObjectId(id)),
      limit
    );
    
    // 查询用户信息，用于显示头像和名称
    const userIds = [...new Set(activities.map(activity => activity.user._id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('name avatar department');
    
    // 添加用户信息到活动数据
    const activitiesWithUserInfo = activities.map(activity => {
      const userInfo = users.find(user => user._id.toString() === activity.user._id.toString());
      return {
        ...activity,
        user: userInfo
      };
    });
    
    res.json({
      success: true,
      count: activitiesWithUserInfo.length,
      data: activitiesWithUserInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取项目活动
 * @route   GET /api/activities/projects/:id
 * @access  Private
 */
const getProjectActivities = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const limit = parseInt(req.query.limit) || 20;
    
    // 验证项目存在并检查用户权限
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }
    
    // 检查是否为团队成员或管理员
    const isTeamMember = project.team.some(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = project.manager.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'partner';
    
    if (!isTeamMember && !isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此项目活动'
      });
    }
    
    // 获取项目活动
    const activities = await Activity.getProjectActivities(projectId, limit);
    
    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取所有活动（仅管理员可用）
 * @route   GET /api/activities
 * @access  Private (Admin)
 */
const getAllActivities = async (req, res, next) => {
  try {
    // 仅允许管理员访问
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        error: '无权限访问所有活动记录'
      });
    }
    
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // 过滤条件
    const filter = {};
    
    // 用户过滤
    if (req.query.user) {
      filter.user = req.query.user;
    }
    
    // 项目过滤
    if (req.query.project) {
      filter.projectId = req.query.project;
    }
    
    // 操作类型过滤
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    // 实体类型过滤
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }
    
    // 时间范围过滤
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // 计算总数
    const total = await Activity.countDocuments(filter);
    
    // 获取活动记录
    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar')
      .lean();
    
    res.json({
      success: true,
      count: activities.length,
      total,
      pages: Math.ceil(total / limit),
      page,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyActivities,
  getTeamActivities,
  getProjectActivities,
  getAllActivities
}; 