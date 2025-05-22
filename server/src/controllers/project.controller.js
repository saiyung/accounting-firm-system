const Project = require('../models/project.model');
const User = require('../models/user.model');
const Client = require('../models/client.model');
const mongoose = require('mongoose');

/**
 * @desc    创建新项目
 * @route   POST /api/projects
 * @access  Private (Admin, Partner, Manager)
 */
const createProject = async (req, res, next) => {
  try {
    const {
      name,
      client,
      description,
      type,
      status,
      priority,
      manager,
      team,
      startDate,
      endDate,
      hours,
      budget,
      contractInfo,
      tags,
    } = req.body;

    // 验证客户是否存在
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      res.status(404);
      throw new Error('客户不存在');
    }

    // 验证项目经理是否存在
    const managerExists = await User.findById(manager);
    if (!managerExists) {
      res.status(404);
      throw new Error('项目经理不存在');
    }

    // 生成项目编号
    const projectId = await Project.generateProjectId(type);

    // 创建项目
    const project = await Project.create({
      projectId,
      name,
      client,
      description,
      type,
      status,
      priority,
      manager,
      team: team || [],
      dates: {
        startDate,
        endDate,
        actualStartDate: status === '进行中' ? new Date() : null,
      },
      hours,
      budget,
      contractInfo,
      tags,
    });

    // 如果提供了团队成员，验证并添加
    if (team && team.length > 0) {
      for (const member of team) {
        const userExists = await User.findById(member.user);
        if (!userExists) {
          await project.remove();
          res.status(404);
          throw new Error(`团队成员ID: ${member.user} 不存在`);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取所有项目（带分页和过滤）
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 过滤条件
    const filter = {};

    // 项目名称搜索
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }

    // 项目类型过滤
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // 状态过滤
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // 客户过滤
    if (req.query.client) {
      filter.client = req.query.client;
    }

    // 项目经理过滤
    if (req.query.manager) {
      filter.manager = req.query.manager;
    }

    // 标签过滤
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    // 日期范围过滤
    if (req.query.startDateFrom && req.query.startDateTo) {
      filter['dates.startDate'] = {
        $gte: new Date(req.query.startDateFrom),
        $lte: new Date(req.query.startDateTo),
      };
    }

    // 团队成员过滤
    if (req.query.teamMember) {
      filter['team.user'] = req.query.teamMember;
    }

    // 基于用户角色的过滤
    // 如果不是管理员或合伙人，只能看到自己管理的或参与的项目
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      filter.$or = [
        { manager: req.user._id },
        { 'team.user': req.user._id },
      ];
    }

    // 计算总数
    const total = await Project.countDocuments(filter);

    // 查询项目
    const projects = await Project.find(filter)
      .sort(req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { 'dates.startDate': -1 })
      .skip(skip)
      .limit(limit)
      .populate('client', 'name clientId')
      .populate('manager', 'name email')
      .select('projectId name type status priority dates budget hours manager client team');

    res.json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取单个项目详情
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name clientId contactPerson')
      .populate('manager', 'name email phone')
      .populate('team.user', 'name email department')
      .populate('phases.tasks.assignedTo', 'name')
      .populate('documents.uploadedBy', 'name')
      .populate('meetings.attendees', 'name')
      .populate('risks.reportedBy', 'name')
      .populate('notes.createdBy', 'name');

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查用户是否有权限查看项目详情
    const isTeamMember = project.team.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );
    const isManager = project.manager._id.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isTeamMember && !isManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限查看此项目详情');
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新项目信息
 * @route   PUT /api/projects/:id
 * @access  Private (Admin, Partner, Manager of the project)
 */
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限，只有管理员、合伙人或项目经理可以更新项目
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限更新此项目');
    }

    // 如果更新了客户，验证客户是否存在
    if (req.body.client && req.body.client !== project.client.toString()) {
      const clientExists = await Client.findById(req.body.client);
      if (!clientExists) {
        res.status(404);
        throw new Error('客户不存在');
      }
    }

    // 如果更新了项目经理，验证用户是否存在
    if (req.body.manager && req.body.manager !== project.manager.toString()) {
      const managerExists = await User.findById(req.body.manager);
      if (!managerExists) {
        res.status(404);
        throw new Error('项目经理不存在');
      }
    }

    // 特殊处理日期和工时信息
    const updateData = { ...req.body };
    
    // 处理日期数据结构
    if (updateData.startDate || updateData.endDate || updateData.actualStartDate || updateData.actualEndDate) {
      updateData.dates = {
        ...(project.dates || {}),
        ...(updateData.startDate && { startDate: updateData.startDate }),
        ...(updateData.endDate && { endDate: updateData.endDate }),
        ...(updateData.actualStartDate && { actualStartDate: updateData.actualStartDate }),
        ...(updateData.actualEndDate && { actualEndDate: updateData.actualEndDate }),
      };
      
      // 移除单独的日期字段
      delete updateData.startDate;
      delete updateData.endDate;
      delete updateData.actualStartDate;
      delete updateData.actualEndDate;
    }
    
    // 处理工时数据结构
    if (updateData.estimatedHours || updateData.actualHours) {
      updateData.hours = {
        ...(project.hours || {}),
        ...(updateData.estimatedHours && { estimated: updateData.estimatedHours }),
        ...(updateData.actualHours && { actual: updateData.actualHours }),
      };
      
      // 移除单独的工时字段
      delete updateData.estimatedHours;
      delete updateData.actualHours;
    }
    
    // 处理预算数据结构
    if (updateData.estimatedBudget || updateData.actualBudget || updateData.currency) {
      updateData.budget = {
        ...(project.budget || {}),
        ...(updateData.estimatedBudget && { estimated: updateData.estimatedBudget }),
        ...(updateData.actualBudget && { actual: updateData.actualBudget }),
        ...(updateData.currency && { currency: updateData.currency }),
      };
      
      // 移除单独的预算字段
      delete updateData.estimatedBudget;
      delete updateData.actualBudget;
      delete updateData.currency;
    }

    // 更新项目
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('client', 'name clientId')
      .populate('manager', 'name email');

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除项目
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin, Partner)
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 只有管理员和合伙人可以删除项目
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      res.status(403);
      throw new Error('无权限删除项目');
    }

    await project.remove();

    res.json({
      success: true,
      message: '项目已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    添加项目团队成员
 * @route   POST /api/projects/:id/team
 * @access  Private (Admin, Partner, Project Manager)
 */
const addTeamMember = async (req, res, next) => {
  try {
    const { user, role, allocation } = req.body;
    const logger = req.app.get('logger');

    logger.info(`添加项目成员请求: projectId=${req.params.id}, userId=${user}, role=${role}`);

    if (!user || !role) {
      logger.warn(`添加项目成员失败: 缺少必要参数 userId=${user}, role=${role}`);
      return res.status(400).json({
        success: false,
        error: '请提供用户ID和角色'
      });
    }

    // 验证用户是否存在
    const userExists = await User.findById(user);
    
    if (!userExists) {
      // 尝试通过邮箱查找用户
      const userByEmail = await User.findOne({ email: user });
      
      if (!userByEmail) {
        logger.error(`添加项目成员失败: 用户不存在 userId/email=${user}`);
        return res.status(404).json({
          success: false,
          error: '用户不存在',
          details: '输入的用户ID或邮箱未找到匹配的用户记录'
        });
      }
      
      // 使用通过邮箱查找到的用户ID
      user = userByEmail._id;
      logger.info(`通过邮箱找到用户: email=${user}, userId=${userByEmail._id}`);
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      logger.error(`添加项目成员失败: 项目不存在 projectId=${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      logger.warn(`添加项目成员失败: 无权限修改项目团队 userId=${req.user._id}, role=${req.user.role}`);
      return res.status(403).json({
        success: false,
        error: '无权限修改项目团队'
      });
    }

    // 检查用户是否已经是团队成员
    const existingMember = project.team.find(
      (member) => member.user.toString() === user.toString()
    );

    if (existingMember) {
      logger.warn(`添加项目成员失败: 用户已是团队成员 userId=${user}, projectId=${req.params.id}`);
      return res.status(400).json({
        success: false,
        error: '该用户已经是团队成员',
        member: existingMember
      });
    }

    // 获取用户详细信息
    const userDetails = await User.findById(user).select('name email department');
    
    // 添加团队成员
    project.team.push({
      user,
      role,
      allocation: allocation || 100,
      joinedAt: new Date(),
    });

    await project.save();
    logger.info(`成功添加团队成员: userId=${user}, projectId=${req.params.id}, role=${role}`);

    // 获取包含用户信息的更新后的项目
    const updatedProject = await Project.findById(req.params.id).populate(
      'team.user',
      'name email department'
    );

    res.status(201).json({
      success: true,
      data: updatedProject.team,
      userDetails: userDetails // 返回添加的用户详细信息
    });
  } catch (error) {
    const logger = req.app.get('logger');
    logger.error(`添加项目成员异常: ${error.message}`, { stack: error.stack });
    
    res.status(500).json({
      success: false,
      error: '添加项目成员失败',
      message: error.message
    });
  }
};

/**
 * @desc    更新团队成员信息
 * @route   PUT /api/projects/:id/team/:memberId
 * @access  Private (Admin, Partner, Project Manager)
 */
const updateTeamMember = async (req, res, next) => {
  try {
    const { role, allocation } = req.body;
    const { id, memberId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限修改项目团队');
    }

    // 查找团队成员
    const memberIndex = project.team.findIndex(
      (member) => member._id.toString() === memberId
    );

    if (memberIndex === -1) {
      res.status(404);
      throw new Error('团队成员不存在');
    }

    // 更新团队成员信息
    if (role) project.team[memberIndex].role = role;
    if (allocation !== undefined) project.team[memberIndex].allocation = allocation;

    await project.save();

    // 获取包含用户信息的更新后的项目
    const updatedProject = await Project.findById(id).populate(
      'team.user',
      'name email department'
    );

    res.json({
      success: true,
      data: updatedProject.team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    移除团队成员
 * @route   DELETE /api/projects/:id/team/:memberId
 * @access  Private (Admin, Partner, Project Manager)
 */
const removeTeamMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限修改项目团队');
    }

    // 查找团队成员
    const memberIndex = project.team.findIndex(
      (member) => member._id.toString() === memberId
    );

    if (memberIndex === -1) {
      res.status(404);
      throw new Error('团队成员不存在');
    }

    // 移除团队成员
    project.team.splice(memberIndex, 1);
    await project.save();

    res.json({
      success: true,
      message: '团队成员已移除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取项目团队
 * @route   GET /api/projects/:id/team
 * @access  Private
 */
const getProjectTeam = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team.user', 'name email department avatar phone')
      .populate('manager', 'name email department avatar phone')
      .select('team manager');

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限
    const isTeamMember = project.team.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );
    const isManager = project.manager._id.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isTeamMember && !isManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限查看项目团队');
    }

    // 组织团队数据，包括项目经理
    const teamData = {
      manager: project.manager,
      members: project.team,
    };

    res.json({
      success: true,
      data: teamData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    添加项目阶段
 * @route   POST /api/projects/:id/phases
 * @access  Private (Admin, Partner, Project Manager)
 */
const addProjectPhase = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('阶段名称不能为空');
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限修改项目阶段');
    }

    // 添加新阶段
    const newPhase = {
      name,
      description,
      startDate,
      endDate,
      status: status || '未开始',
      tasks: [],
    };

    project.phases.push(newPhase);
    await project.save();

    res.status(201).json({
      success: true,
      data: project.phases[project.phases.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新项目阶段
 * @route   PUT /api/projects/:id/phases/:phaseId
 * @access  Private (Admin, Partner, Project Manager)
 */
const updateProjectPhase = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;
    const { id, phaseId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限修改项目阶段');
    }

    // 查找阶段
    const phaseIndex = project.phases.findIndex(
      (phase) => phase._id.toString() === phaseId
    );

    if (phaseIndex === -1) {
      res.status(404);
      throw new Error('项目阶段不存在');
    }

    // 更新阶段信息
    if (name) project.phases[phaseIndex].name = name;
    if (description !== undefined) project.phases[phaseIndex].description = description;
    if (startDate) project.phases[phaseIndex].startDate = startDate;
    if (endDate) project.phases[phaseIndex].endDate = endDate;
    if (status) project.phases[phaseIndex].status = status;

    await project.save();

    res.json({
      success: true,
      data: project.phases[phaseIndex],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除项目阶段
 * @route   DELETE /api/projects/:id/phases/:phaseId
 * @access  Private (Admin, Partner, Project Manager)
 */
const deleteProjectPhase = async (req, res, next) => {
  try {
    const { id, phaseId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限修改项目阶段');
    }

    // 查找阶段
    const phaseIndex = project.phases.findIndex(
      (phase) => phase._id.toString() === phaseId
    );

    if (phaseIndex === -1) {
      res.status(404);
      throw new Error('项目阶段不存在');
    }

    // 检查阶段任务
    if (project.phases[phaseIndex].tasks && project.phases[phaseIndex].tasks.length > 0) {
      res.status(400);
      throw new Error('该阶段包含任务，请先删除所有任务');
    }

    // 删除阶段
    project.phases.splice(phaseIndex, 1);
    await project.save();

    res.json({
      success: true,
      message: '项目阶段已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取项目阶段列表
 * @route   GET /api/projects/:id/phases
 * @access  Private
 */
const getProjectPhases = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .select('phases')
      .populate('phases.tasks.assignedTo', 'name avatar');

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    res.json({
      success: true,
      data: project.phases,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    添加项目任务
 * @route   POST /api/projects/:id/phases/:phaseId/tasks
 * @access  Private (Admin, Partner, Project Manager, Team Members)
 */
const addProjectTask = async (req, res, next) => {
  try {
    const { name, description, assignedTo, dueDate, priority } = req.body;
    const { id, phaseId } = req.params;

    if (!name) {
      res.status(400);
      throw new Error('任务名称不能为空');
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);
    const isTeamMember = project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isProjectManager && !isAdminOrPartner && !isTeamMember) {
      res.status(403);
      throw new Error('无权限添加项目任务');
    }

    // 查找阶段
    const phase = project.phases.id(phaseId);
    if (!phase) {
      res.status(404);
      throw new Error('项目阶段不存在');
    }

    // 如果指定了任务负责人，验证用户存在且是项目团队成员
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        res.status(404);
        throw new Error('指定的用户不存在');
      }

      // 验证用户是否是项目团队成员
      const isUserInTeam = project.team.some(
        (member) => member.user.toString() === assignedTo
      );
      const isUserManager = project.manager.toString() === assignedTo;

      if (!isUserInTeam && !isUserManager) {
        res.status(400);
        throw new Error('只能将任务分配给项目团队成员或项目经理');
      }
    }

    // 添加新任务
    const newTask = {
      name,
      description,
      assignedTo,
      dueDate,
      priority: priority || '中',
      status: '未开始',
      comments: [],
    };

    phase.tasks.push(newTask);
    await project.save();

    // 获取填充用户信息的更新后的任务
    const updatedProject = await Project.findById(id);
    const updatedPhase = updatedProject.phases.id(phaseId);
    const newTaskWithUserInfo = updatedPhase.tasks[updatedPhase.tasks.length - 1];

    res.status(201).json({
      success: true,
      data: newTaskWithUserInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新项目任务
 * @route   PUT /api/projects/:id/phases/:phaseId/tasks/:taskId
 * @access  Private (Admin, Partner, Project Manager, Task Owner)
 */
const updateProjectTask = async (req, res, next) => {
  try {
    const { name, description, assignedTo, dueDate, status, priority } = req.body;
    const { id, phaseId, taskId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 查找阶段和任务
    const phase = project.phases.id(phaseId);
    if (!phase) {
      res.status(404);
      throw new Error('项目阶段不存在');
    }

    const task = phase.tasks.id(taskId);
    if (!task) {
      res.status(404);
      throw new Error('任务不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);
    const isTaskOwner = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isProjectManager && !isAdminOrPartner && !isTaskOwner) {
      res.status(403);
      throw new Error('无权限更新任务');
    }

    // 如果更新了任务负责人，验证用户存在且是项目团队成员
    if (assignedTo && assignedTo !== task.assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        res.status(404);
        throw new Error('指定的用户不存在');
      }

      // 验证用户是否是项目团队成员
      const isUserInTeam = project.team.some(
        (member) => member.user.toString() === assignedTo
      );
      const isUserManager = project.manager.toString() === assignedTo;

      if (!isUserInTeam && !isUserManager) {
        res.status(400);
        throw new Error('只能将任务分配给项目团队成员或项目经理');
      }
    }

    // 更新任务
    if (name) task.name = name;
    if (description !== undefined) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;
    
    // 如果任务状态变更为已完成，记录完成时间
    if (status && status !== task.status) {
      task.status = status;
      if (status === '已完成') {
        task.completedAt = new Date();
      } else {
        // 如果从已完成变更为其他状态，清除完成时间
        if (task.completedAt) {
          task.completedAt = undefined;
        }
      }
    }

    await project.save();

    // 获取填充用户信息的更新后的任务
    const updatedProject = await Project.findById(id);
    const updatedPhase = updatedProject.phases.id(phaseId);
    const updatedTask = updatedPhase.tasks.id(taskId);

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除项目任务
 * @route   DELETE /api/projects/:id/phases/:phaseId/tasks/:taskId
 * @access  Private (Admin, Partner, Project Manager)
 */
const deleteProjectTask = async (req, res, next) => {
  try {
    const { id, phaseId, taskId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 查找阶段和任务
    const phase = project.phases.id(phaseId);
    if (!phase) {
      res.status(404);
      throw new Error('项目阶段不存在');
    }

    const task = phase.tasks.id(taskId);
    if (!task) {
      res.status(404);
      throw new Error('任务不存在');
    }

    // 检查权限
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限删除任务');
    }

    // 删除任务
    phase.tasks.pull(taskId);
    await project.save();

    res.json({
      success: true,
      message: '任务已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取项目任务
 * @route   GET /api/projects/:id/tasks
 * @access  Private
 */
const getProjectTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority } = req.query;

    const project = await Project.findById(id)
      .populate('phases.tasks.assignedTo', 'name avatar email')
      .select('phases');

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查用户是否有权限查看项目任务
    const isTeamMember = project.team && project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    const isManager = project.manager && project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isTeamMember && !isManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限查看项目任务');
    }

    // 整理所有任务并按需过滤
    let allTasks = [];
    project.phases.forEach((phase) => {
      if (phase.tasks && phase.tasks.length > 0) {
        const phaseTasks = phase.tasks.map((task) => ({
          ...task.toObject(),
          phaseId: phase._id,
          phaseName: phase.name,
        }));
        allTasks = [...allTasks, ...phaseTasks];
      }
    });

    // 应用过滤条件
    if (status) {
      allTasks = allTasks.filter((task) => task.status === status);
    }

    if (assignedTo) {
      // 如果传入 'me'，则过滤当前用户的任务
      if (assignedTo === 'me') {
        allTasks = allTasks.filter(
          (task) => task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString()
        );
      } else {
        allTasks = allTasks.filter(
          (task) => task.assignedTo && task.assignedTo._id.toString() === assignedTo
        );
      }
    }

    if (priority) {
      allTasks = allTasks.filter((task) => task.priority === priority);
    }

    res.json({
      success: true,
      count: allTasks.length,
      data: allTasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    添加任务评论
 * @route   POST /api/projects/:id/phases/:phaseId/tasks/:taskId/comments
 * @access  Private
 */
const addTaskComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { id, phaseId, taskId } = req.params;

    if (!content) {
      res.status(400);
      throw new Error('评论内容不能为空');
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 查找阶段和任务
    const phase = project.phases.id(phaseId);
    if (!phase) {
      res.status(404);
      throw new Error('项目阶段不存在');
    }

    const task = phase.tasks.id(taskId);
    if (!task) {
      res.status(404);
      throw new Error('任务不存在');
    }

    // 添加评论
    const comment = {
      user: req.user._id,
      content,
      createdAt: new Date(),
    };

    task.comments.push(comment);
    await project.save();

    // 获取填充用户信息的评论
    const updatedProject = await Project.findById(id);
    const updatedPhase = updatedProject.phases.id(phaseId);
    const updatedTask = updatedPhase.tasks.id(taskId);
    const newComment = updatedTask.comments[updatedTask.comments.length - 1];

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    添加项目文档
 * @route   POST /api/projects/:id/documents
 * @access  Private
 */
const addProjectDocument = async (req, res, next) => {
  try {
    const { name, description, fileUrl, fileType, size, category } = req.body;
    const { id } = req.params;

    if (!name || !fileUrl) {
      res.status(400);
      throw new Error('文档名称和文件URL不能为空');
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查用户是否有权限添加文档
    const isTeamMember = project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    const isManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isTeamMember && !isManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限添加项目文档');
    }

    // 添加文档
    const document = {
      name,
      description,
      fileUrl,
      fileType,
      size,
      category: category || '其他',
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      version: 1,
    };

    project.documents.push(document);
    await project.save();

    // 获取填充用户信息的文档
    const updatedProject = await Project.findById(id).populate(
      'documents.uploadedBy',
      'name'
    );
    const newDocument = updatedProject.documents[updatedProject.documents.length - 1];

    res.status(201).json({
      success: true,
      data: newDocument,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新项目文档
 * @route   PUT /api/projects/:id/documents/:documentId
 * @access  Private
 */
const updateProjectDocument = async (req, res, next) => {
  try {
    const { name, description, fileUrl, fileType, size, category } = req.body;
    const { id, documentId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 查找文档
    const documentIndex = project.documents.findIndex(
      (doc) => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      res.status(404);
      throw new Error('文档不存在');
    }

    const document = project.documents[documentIndex];

    // 检查权限
    const isUploader = document.uploadedBy.toString() === req.user._id.toString();
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isUploader && !isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限更新文档');
    }

    // 如果更新了文件 URL，增加版本号
    if (fileUrl && fileUrl !== document.fileUrl) {
      document.version += 1;
    }

    // 更新文档
    if (name) document.name = name;
    if (description !== undefined) document.description = description;
    if (fileUrl) document.fileUrl = fileUrl;
    if (fileType) document.fileType = fileType;
    if (size) document.size = size;
    if (category) document.category = category;

    await project.save();

    // 获取填充用户信息的文档
    const updatedProject = await Project.findById(id).populate(
      'documents.uploadedBy',
      'name'
    );
    const updatedDocument = updatedProject.documents[documentIndex];

    res.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除项目文档
 * @route   DELETE /api/projects/:id/documents/:documentId
 * @access  Private
 */
const deleteProjectDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 查找文档
    const documentIndex = project.documents.findIndex(
      (doc) => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      res.status(404);
      throw new Error('文档不存在');
    }

    const document = project.documents[documentIndex];

    // 检查权限
    const isUploader = document.uploadedBy.toString() === req.user._id.toString();
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isUploader && !isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限删除文档');
    }

    // 删除文档
    project.documents.splice(documentIndex, 1);
    await project.save();

    res.json({
      success: true,
      message: '文档已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取项目文档
 * @route   GET /api/projects/:id/documents
 * @access  Private
 */
const getProjectDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    const project = await Project.findById(id)
      .populate('documents.uploadedBy', 'name avatar')
      .select('documents');

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查用户是否有权限查看项目文档
    const isTeamMember = project.team && project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    const isManager = project.manager && project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isTeamMember && !isManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限查看项目文档');
    }

    // 过滤文档
    let documents = project.documents;
    if (category) {
      documents = documents.filter((doc) => doc.category === category);
    }

    // 按上传时间排序
    documents.sort((a, b) => b.uploadedAt - a.uploadedAt);

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    添加项目风险
 * @route   POST /api/projects/:id/risks
 * @access  Private
 */
const addProjectRisk = async (req, res, next) => {
  try {
    const { description, level, mitigationPlan, status } = req.body;
    const { id } = req.params;

    if (!description) {
      res.status(400);
      throw new Error('风险描述不能为空');
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 检查用户是否有权限添加风险
    const isTeamMember = project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    const isManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isTeamMember && !isManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限添加项目风险');
    }

    // 添加风险
    const risk = {
      description,
      level: level || '中',
      mitigationPlan,
      status: status || '未解决',
      reportedBy: req.user._id,
      reportedAt: new Date(),
    };

    project.risks.push(risk);
    await project.save();

    // 获取填充用户信息的风险
    const updatedProject = await Project.findById(id).populate(
      'risks.reportedBy',
      'name'
    );
    const newRisk = updatedProject.risks[updatedProject.risks.length - 1];

    res.status(201).json({
      success: true,
      data: newRisk,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新项目风险
 * @route   PUT /api/projects/:id/risks/:riskId
 * @access  Private
 */
const updateProjectRisk = async (req, res, next) => {
  try {
    const { description, level, mitigationPlan, status } = req.body;
    const { id, riskId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 查找风险
    const riskIndex = project.risks.findIndex(
      (risk) => risk._id.toString() === riskId
    );

    if (riskIndex === -1) {
      res.status(404);
      throw new Error('风险不存在');
    }

    const risk = project.risks[riskIndex];

    // 检查权限
    const isReporter = risk.reportedBy.toString() === req.user._id.toString();
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isReporter && !isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限更新风险');
    }

    // 如果风险状态变更为已解决或已关闭，记录解决时间
    if (status && (status === '已解决' || status === '已关闭') && risk.status !== status) {
      risk.resolvedAt = new Date();
    }

    // 更新风险
    if (description) risk.description = description;
    if (level) risk.level = level;
    if (mitigationPlan !== undefined) risk.mitigationPlan = mitigationPlan;
    if (status) risk.status = status;

    await project.save();

    // 获取填充用户信息的风险
    const updatedProject = await Project.findById(id).populate(
      'risks.reportedBy',
      'name'
    );
    const updatedRisk = updatedProject.risks[riskIndex];

    res.json({
      success: true,
      data: updatedRisk,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除项目风险
 * @route   DELETE /api/projects/:id/risks/:riskId
 * @access  Private
 */
const deleteProjectRisk = async (req, res, next) => {
  try {
    const { id, riskId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 查找风险
    const riskIndex = project.risks.findIndex(
      (risk) => risk._id.toString() === riskId
    );

    if (riskIndex === -1) {
      res.status(404);
      throw new Error('风险不存在');
    }

    const risk = project.risks[riskIndex];

    // 检查权限
    const isReporter = risk.reportedBy.toString() === req.user._id.toString();
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAdminOrPartner = ['admin', 'partner'].includes(req.user.role);

    if (!isReporter && !isProjectManager && !isAdminOrPartner) {
      res.status(403);
      throw new Error('无权限删除风险');
    }

    // 删除风险
    project.risks.splice(riskIndex, 1);
    await project.save();

    res.json({
      success: true,
      message: '风险已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取项目风险
 * @route   GET /api/projects/:id/risks
 * @access  Private
 */
const getProjectRisks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, level } = req.query;

    const project = await Project.findById(id)
      .populate('risks.reportedBy', 'name avatar')
      .select('risks');

    if (!project) {
      res.status(404);
      throw new Error('项目不存在');
    }

    // 过滤风险
    let risks = project.risks;
    if (status) {
      risks = risks.filter((risk) => risk.status === status);
    }
    if (level) {
      risks = risks.filter((risk) => risk.level === level);
    }

    // 按优先级和状态排序
    risks.sort((a, b) => {
      // 首先按风险等级排序（高风险排在前面）
      const levelOrder = { '极高': 0, '高': 1, '中': 2, '低': 3 };
      const levelDiff = levelOrder[a.level] - levelOrder[b.level];
      if (levelDiff !== 0) return levelDiff;

      // 其次按状态排序（未解决的排在前面）
      const statusOrder = { '未解决': 0, '监控中': 1, '已解决': 2, '已关闭': 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    res.json({
      success: true,
      count: risks.length,
      data: risks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getProjectTeam,
  addProjectPhase,
  updateProjectPhase,
  deleteProjectPhase,
  getProjectPhases,
  addProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectTasks,
  addTaskComment,
  addProjectDocument,
  updateProjectDocument,
  deleteProjectDocument,
  getProjectDocuments,
  addProjectRisk,
  updateProjectRisk,
  deleteProjectRisk,
  getProjectRisks,
}; 