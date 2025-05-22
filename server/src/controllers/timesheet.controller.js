const Timesheet = require('../models/timesheet.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * @desc    创建工作量记录
 * @route   POST /api/timesheets
 * @access  Private
 */
const createTimesheet = async (req, res, next) => {
  try {
    // 从请求体中获取参数
    const {
      project,
      date,
      hours,
      task,
      category,
      description,
      billable,
      billingRate,
      location,
      overtime,
    } = req.body;

    // 验证项目是否存在
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 创建工作量记录
    const timesheet = await Timesheet.create({
      user: req.user._id, // 从认证中间件获取当前用户
      project,
      date,
      hours,
      task,
      category,
      description,
      billable,
      billingRate,
      location,
      overtime,
    });

    // 更新项目的实际工时
    await Project.findByIdAndUpdate(project, {
      $inc: { 'hours.actual': hours },
    });

    res.status(201).json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取当前用户的工作量记录
 * @route   GET /api/timesheets
 * @access  Private
 */
const getMyTimesheets = async (req, res, next) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 过滤参数
    const filter = { user: req.user._id };
    
    // 日期范围过滤
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }
    
    // 项目过滤
    if (req.query.project) {
      filter.project = req.query.project;
    }
    
    // 状态过滤
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // 统计总数
    const total = await Timesheet.countDocuments(filter);

    // 查询数据并排序
    const timesheets = await Timesheet.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('project', 'name projectId')
      .populate('approver', 'name');

    // 计算总工时
    const totalHours = await Timesheet.aggregate([
      { $match: filter },
      { $group: { _id: null, sum: { $sum: '$hours' } } },
    ]);

    res.json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalHours: totalHours.length > 0 ? totalHours[0].sum : 0,
      data: timesheets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取单个工作量记录详情
 * @route   GET /api/timesheets/:id
 * @access  Private
 */
const getTimesheetById = async (req, res, next) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .populate('project', 'name projectId client')
      .populate('user', 'name email')
      .populate('approver', 'name email')
      .populate({
        path: 'comments.user',
        select: 'name avatar',
      });

    if (!timesheet) {
      res.status(404);
      throw new Error('工作量记录不存在');
    }

    // 确保用户只能查看自己的记录（除非是管理员或项目经理）
    if (
      timesheet.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'partner' &&
      !(await isProjectManager(req.user._id, timesheet.project._id))
    ) {
      res.status(403);
      throw new Error('无权限访问此记录');
    }

    res.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新工作量记录
 * @route   PUT /api/timesheets/:id
 * @access  Private
 */
const updateTimesheet = async (req, res, next) => {
  try {
    let timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      res.status(404);
      throw new Error('工作量记录不存在');
    }

    // 确保用户只能更新自己的记录
    if (timesheet.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('无权限更新此记录');
    }

    // 已审核的记录不能修改
    if (timesheet.status === '已审核') {
      res.status(400);
      throw new Error('已审核的记录不能修改');
    }

    // 如果修改了工时，更新项目的实际工时
    const oldHours = timesheet.hours;
    const newHours = req.body.hours || oldHours;
    
    if (newHours !== oldHours) {
      await Project.findByIdAndUpdate(timesheet.project, {
        $inc: { 'hours.actual': newHours - oldHours },
      });
    }

    // 更新记录
    timesheet = await Timesheet.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除工作量记录
 * @route   DELETE /api/timesheets/:id
 * @access  Private
 */
const deleteTimesheet = async (req, res, next) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      res.status(404);
      throw new Error('工作量记录不存在');
    }

    // 确保用户只能删除自己的记录
    if (timesheet.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('无权限删除此记录');
    }

    // 已审核的记录不能删除
    if (timesheet.status === '已审核') {
      res.status(400);
      throw new Error('已审核的记录不能删除');
    }

    // 更新项目的实际工时
    await Project.findByIdAndUpdate(timesheet.project, {
      $inc: { 'hours.actual': -timesheet.hours },
    });

    // 删除记录
    await timesheet.remove();

    res.json({
      success: true,
      message: '工作量记录已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    审核工作量记录
 * @route   PUT /api/timesheets/:id/approve
 * @access  Private (Manager, Partner, Admin)
 */
const approveTimesheet = async (req, res, next) => {
  try {
    const { status, comments } = req.body;

    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      res.status(404);
      throw new Error('工作量记录不存在');
    }

    // 检查是否是项目经理或管理员
    const isManager = await isProjectManager(req.user._id, timesheet.project);
    if (!isManager && req.user.role !== 'admin' && req.user.role !== 'partner') {
      res.status(403);
      throw new Error('只有项目经理、合伙人或管理员可以审核工时');
    }

    // 更新状态和审核人
    timesheet.status = status;
    timesheet.approver = req.user._id;
    timesheet.approvedAt = Date.now();

    // 添加评论（如果有）
    if (comments) {
      timesheet.comments.push({
        user: req.user._id,
        content: comments,
      });
    }

    await timesheet.save();

    res.json({
      success: true,
      message: `工作量记录已${status === '已审核' ? '审核通过' : '被拒绝'}`,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取项目的工时统计
 * @route   GET /api/timesheets/projects/:id/stats
 * @access  Private
 */
const getProjectTimesheetStats = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // 检查项目是否存在
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 获取按用户分组的工时统计
    const userStats = await Timesheet.getProjectUserHours(projectId);

    // 获取按日期分组的工时统计
    const dateStats = await Timesheet.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalHours: { $sum: '$hours' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 获取按任务类型分组的工时统计
    const categoryStats = await Timesheet.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$category',
          totalHours: { $sum: '$hours' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        userStats,
        dateStats,
        categoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取用户按月的工时统计
 * @route   GET /api/timesheets/users/:id/monthly
 * @access  Private
 */
const getUserMonthlyStats = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // 确保用户只能查看自己的统计，除非是管理员
    if (userId !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'partner') {
      res.status(403);
      throw new Error('无权限查看此用户的统计');
    }

    // 按月统计工时
    const monthlyStats = await Timesheet.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          year: year,
        },
      },
      {
        $group: {
          _id: '$month',
          totalHours: { $sum: '$hours' },
          billableHours: {
            $sum: { $cond: [{ $eq: ['$billable', true] }, '$hours', 0] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 按项目统计工时
    const projectStats = await Timesheet.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          year: year,
        },
      },
      {
        $group: {
          _id: '$project',
          totalHours: { $sum: '$hours' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'projectDetails',
        },
      },
      { $unwind: '$projectDetails' },
      {
        $project: {
          projectName: '$projectDetails.name',
          projectId: '$projectDetails.projectId',
          totalHours: 1,
          count: 1,
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        monthlyStats,
        projectStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    添加评论到工作量记录
 * @route   POST /api/timesheets/:id/comments
 * @access  Private
 */
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400);
      throw new Error('评论内容不能为空');
    }

    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      res.status(404);
      throw new Error('工作量记录不存在');
    }

    // 检查权限（用户自己、项目经理、管理员）
    const isOwner = timesheet.user.toString() === req.user._id.toString();
    const isManager = await isProjectManager(req.user._id, timesheet.project);
    
    if (!isOwner && !isManager && req.user.role !== 'admin' && req.user.role !== 'partner') {
      res.status(403);
      throw new Error('无权限添加评论');
    }

    const comment = {
      user: req.user._id,
      content,
    };

    timesheet.comments.push(comment);
    await timesheet.save();

    // 获取填充用户信息的最新评论
    const updatedTimesheet = await Timesheet.findById(req.params.id).populate({
      path: 'comments.user',
      select: 'name avatar',
    });

    const newComment = updatedTimesheet.comments[updatedTimesheet.comments.length - 1];

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 辅助函数：检查用户是否是项目的经理
 */
const isProjectManager = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  return project && project.manager.toString() === userId.toString();
};

module.exports = {
  createTimesheet,
  getMyTimesheets,
  getTimesheetById,
  updateTimesheet,
  deleteTimesheet,
  approveTimesheet,
  getProjectTimesheetStats,
  getUserMonthlyStats,
  addComment,
}; 