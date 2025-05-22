const Task = require('../models/task.model');
const Project = require('../models/project.model');
const Activity = require('../models/activity.model');
const mongoose = require('mongoose');

/**
 * @desc    创建新待办任务
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      project,
      deadline,
      priority,
      tags,
      relatedTo,
      reminder,
      recurring
    } = req.body;

    // 验证项目存在性（如果提供了项目ID）
    if (project) {
      const projectExists = await Project.findById(project);
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          error: '项目不存在'
        });
      }
    }

    // 创建任务
    const task = await Task.create({
      title,
      description,
      user: req.user._id,
      project,
      deadline: deadline ? new Date(deadline) : undefined,
      priority: priority || 'medium',
      status: 'pending',
      tags,
      relatedTo,
      reminder: reminder ? {
        isSet: true,
        time: new Date(reminder),
        sent: false
      } : undefined,
      recurring
    });

    // 记录活动
    if (project) {
      await Activity.createActivity({
        user: req.user._id,
        action: '创建',
        entityType: '任务',
        entityId: task._id,
        projectId: project,
        targetName: title,
        details: `创建了任务: ${title}`
      });
    } else {
      await Activity.createActivity({
        user: req.user._id,
        action: '创建',
        entityType: '任务',
        entityId: task._id,
        targetName: title,
        details: `创建了任务: ${title}`
      });
    }

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取当前用户的所有任务
 * @route   GET /api/tasks
 * @access  Private
 */
const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority, project, search, upcoming } = req.query;
    
    // 构建查询条件
    const filter = { user: req.user._id };

    // 状态过滤
    if (status) {
      filter.status = status;
    }

    // 优先级过滤
    if (priority) {
      filter.priority = priority;
    }

    // 项目过滤
    if (project) {
      filter.project = project;
    }

    // 标题搜索
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // 即将到期的任务
    if (upcoming === 'true') {
      const tasks = await Task.getUpcomingTasks(req.user._id);
      return res.json({
        success: true,
        count: tasks.length,
        data: tasks
      });
    }

    // 获取任务
    const tasks = await Task.getUserTasks(req.user._id, filter);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取单个任务
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name projectId')
      .populate('user', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }

    // 检查权限（只有任务的所有者可以查看）
    if (task.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此任务'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新任务
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      project,
      deadline,
      priority,
      status,
      tags,
      relatedTo,
      reminder,
      recurring
    } = req.body;

    // 查找任务
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }

    // 检查权限（只有任务的所有者可以更新）
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '无权限更新此任务'
      });
    }

    // 如果更新状态为已完成，则设置完成时间
    const completedAt = status === 'completed' && task.status !== 'completed'
      ? new Date()
      : task.completedAt;

    // 更新任务
    task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        project,
        deadline: deadline ? new Date(deadline) : task.deadline,
        priority,
        status,
        completedAt,
        tags,
        relatedTo,
        reminder: reminder ? {
          isSet: true,
          time: new Date(reminder),
          sent: false
        } : task.reminder,
        recurring
      },
      { new: true, runValidators: true }
    );

    // 记录活动
    await Activity.createActivity({
      user: req.user._id,
      action: '更新',
      entityType: '任务',
      entityId: task._id,
      projectId: task.project,
      targetName: task.title,
      details: `更新了任务: ${task.title}`
    });

    // 如果状态变为已完成，记录完成活动
    if (status === 'completed' && task.status !== 'completed') {
      await Activity.createActivity({
        user: req.user._id,
        action: '完成',
        entityType: '任务',
        entityId: task._id,
        projectId: task.project,
        targetName: task.title,
        details: `完成了任务: ${task.title}`
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除任务
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }

    // 检查权限（只有任务的所有者可以删除）
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '无权限删除此任务'
      });
    }

    // 记录任务信息，用于记录活动
    const { _id, title, project } = task;

    // 删除任务
    await task.remove();

    // 记录活动
    await Activity.createActivity({
      user: req.user._id,
      action: '删除',
      entityType: '任务',
      entityId: _id,
      projectId: project,
      targetName: title,
      details: `删除了任务: ${title}`
    });

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    完成任务
 * @route   PUT /api/tasks/:id/complete
 * @access  Private
 */
const completeTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }

    // 检查权限（只有任务的所有者可以完成）
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '无权限完成此任务'
      });
    }

    // 完成任务
    task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );

    // 记录活动
    await Activity.createActivity({
      user: req.user._id,
      action: '完成',
      entityType: '任务',
      entityId: task._id,
      projectId: task.project,
      targetName: task.title,
      details: `完成了任务: ${task.title}`
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask
}; 