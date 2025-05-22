const Report = require('../models/report.model');
const Template = require('../models/template.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const { checkPermission } = require('../utils/permissions');
const aiService = require('../services/ai.service');

/**
 * 创建新报告
 * @route POST /api/reports
 * @access 权限：Admin, Partner, Manager, Senior
 */
exports.createReport = async (req, res, next) => {
  try {
    const { name, project, reportType, template, content, sections } = req.body;

    // 基本验证
    if (!name || !project || !reportType || !content) {
      return next(new ApiError('请提供所有必要的报告信息', 400));
    }

    // 检查用户权限
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager', 'Senior'])) {
      return next(new ApiError('您没有创建报告的权限', 403));
    }

    // 验证项目存在
    const existingProject = await Project.findById(project);
    if (!existingProject) {
      return next(new ApiError('指定的项目不存在', 400));
    }

    // 验证模板存在（如果提供）
    if (template) {
      const existingTemplate = await Template.findById(template);
      if (!existingTemplate) {
        return next(new ApiError('指定的模板不存在', 400));
      }
    }

    // 生成报告ID
    const reportId = await Report.generateReportId();

    // 创建报告记录
    const newReport = await Report.create({
      ...req.body,
      reportId,
      creator: req.user._id,
      versions: [
        {
          versionNumber: 1,
          content,
          createdBy: req.user._id,
          createdAt: Date.now(),
          changes: '初始版本'
        }
      ]
    });

    // 关联实体数据填充
    const populatedReport = await Report.findById(newReport._id)
      .populate('creator', 'name email avatarUrl department role')
      .populate('project', 'projectId name client')
      .populate('template', 'name category')
      .populate('assignedTo', 'name email avatarUrl')
      .populate('reviewers.user', 'name email avatarUrl role');

    // 返回新创建的报告
    res.status(201).json({
      success: true,
      data: populatedReport
    });
  } catch (error) {
    logger.error(`创建报告失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取所有报告列表
 * @route GET /api/reports
 * @access 权限：所有登录用户
 */
exports.getAllReports = async (req, res, next) => {
  try {
    const { reportType, status, projectId, creator, search, sortBy, sortOrder } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    
    // 构建查询条件
    const query = {};
    
    if (reportType) query.reportType = reportType;
    if (status) query.status = status;
    
    // 根据项目ID查询
    if (projectId) {
      const project = await Project.findOne({ projectId });
      if (project) {
        query.project = project._id;
      }
    }
    
    // 根据创建者查询
    if (creator) {
      if (creator === 'me') {
        query.creator = req.user._id;
      } else {
        query.creator = creator;
      }
    }
    
    // 搜索功能
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { reportId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 排序设置
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // 默认按创建时间倒序
    }
    
    // 执行查询
    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('creator', 'name email avatarUrl')
      .populate('project', 'projectId name client')
      .populate('template', 'name category')
      .populate('assignedTo', 'name email avatarUrl')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // 返回结果
    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reports
    });
  } catch (error) {
    logger.error(`获取报告列表失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取单个报告详情
 * @route GET /api/reports/:id
 * @access 权限：所有登录用户
 */
exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    })
      .populate('creator', 'name email avatarUrl department role')
      .populate({
        path: 'project',
        select: 'projectId name client status',
        populate: {
          path: 'client',
          select: 'name clientId'
        }
      })
      .populate('template', 'name category')
      .populate('assignedTo', 'name email avatarUrl role')
      .populate('reviewers.user', 'name email avatarUrl role')
      .populate('versions.createdBy', 'name avatarUrl')
      .populate('attachments.uploadedBy', 'name avatarUrl');
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error(`获取报告详情失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 更新报告信息
 * @route PUT /api/reports/:id
 * @access 权限：Admin, Partner, Manager, 报告创建者, 报告负责人
 */
exports.updateReport = async (req, res, next) => {
  try {
    // 查找报告
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    }).populate('creator', 'name')
      .populate('assignedTo', 'name');
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    // 检查权限
    const isCreator = report.creator && 
      report.creator._id.toString() === req.user._id.toString();
    
    const isAssigned = report.assignedTo && 
      report.assignedTo.some(user => user._id.toString() === req.user._id.toString());
      
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager']) && !isCreator && !isAssigned) {
      return next(new ApiError('您没有更新此报告的权限', 403));
    }
    
    // 不允许修改报告ID和创建者
    delete req.body.reportId;
    delete req.body.creator;
    
    // 如果更新了内容，则创建新版本
    if (req.body.content && req.body.content !== report.content) {
      const newVersion = {
        versionNumber: report.currentVersion + 1,
        content: req.body.content,
        createdBy: req.user._id,
        createdAt: Date.now(),
        changes: req.body.versionComment || '内容更新'
      };
      
      report.versions.push(newVersion);
      report.currentVersion = newVersion.versionNumber;
    }
    
    // 更新报告信息
    const updatedReport = await Report.findByIdAndUpdate(
      report._id,
      { 
        ...req.body, 
        versions: report.versions, 
        currentVersion: report.currentVersion 
      },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name email avatarUrl department role')
      .populate('project', 'projectId name client')
      .populate('template', 'name category')
      .populate('assignedTo', 'name email avatarUrl')
      .populate('reviewers.user', 'name email avatarUrl role');
    
    res.status(200).json({
      success: true,
      data: updatedReport
    });
  } catch (error) {
    logger.error(`更新报告失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 删除报告
 * @route DELETE /api/reports/:id
 * @access 权限：Admin, Partner, 报告创建者（仅限草稿状态）
 */
exports.deleteReport = async (req, res, next) => {
  try {
    // 查找报告
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    }).populate('creator', 'name');
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    // 检查权限
    const isCreator = report.creator && 
      report.creator._id.toString() === req.user._id.toString();
    
    if (!checkPermission(req.user, ['Admin', 'Partner']) && 
        !(isCreator && report.status === '草稿')) {
      return next(new ApiError('您没有删除此报告的权限', 403));
    }
    
    // 删除报告
    await report.remove();
    
    res.status(200).json({
      success: true,
      message: '报告已成功删除'
    });
  } catch (error) {
    logger.error(`删除报告失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 审核报告
 * @route POST /api/reports/:id/review
 * @access 权限：Admin, Partner, Manager, 指定的审核人
 */
exports.reviewReport = async (req, res, next) => {
  try {
    const { status, comments } = req.body;
    
    if (!status || !['待审核', '已审核', '需修改'].includes(status)) {
      return next(new ApiError('请提供有效的审核状态', 400));
    }
    
    // 查找报告
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    });
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    // 检查用户是否为审核人
    const isReviewer = report.reviewers.some(
      reviewer => reviewer.user && reviewer.user.toString() === req.user._id.toString()
    );
    
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager']) && !isReviewer) {
      return next(new ApiError('您不是此报告的审核人', 403));
    }
    
    // 更新审核状态
    let reviewerIndex = report.reviewers.findIndex(
      reviewer => reviewer.user && reviewer.user.toString() === req.user._id.toString()
    );
    
    if (reviewerIndex === -1) {
      // 如果用户不在审核人列表中但有权限，添加为新审核人
      report.reviewers.push({
        user: req.user._id,
        status,
        comments: comments || '',
        reviewedAt: Date.now()
      });
    } else {
      // 更新现有审核人的状态
      report.reviewers[reviewerIndex].status = status;
      report.reviewers[reviewerIndex].comments = comments || '';
      report.reviewers[reviewerIndex].reviewedAt = Date.now();
    }
    
    // 更新报告整体状态
    const allReviewers = report.reviewers.length;
    const completedReviews = report.reviewers.filter(
      reviewer => reviewer.status !== '待审核'
    ).length;
    
    const needsRevision = report.reviewers.some(
      reviewer => reviewer.status === '需修改'
    );
    
    if (needsRevision) {
      report.status = '待修订';
    } else if (allReviewers > 0 && completedReviews === allReviewers) {
      report.status = '已定稿';
    } else if (completedReviews > 0) {
      report.status = '审核中';
    }
    
    await report.save();
    
    // 填充关联数据
    const updatedReport = await Report.findById(report._id)
      .populate('reviewers.user', 'name email avatarUrl role');
    
    res.status(200).json({
      success: true,
      data: updatedReport.reviewers
    });
  } catch (error) {
    logger.error(`审核报告失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 添加或更新报告分配人员
 * @route POST /api/reports/:id/assign
 * @access 权限：Admin, Partner, Manager, 报告创建者
 */
exports.assignReportUsers = async (req, res, next) => {
  try {
    const { assignedTo, reviewers } = req.body;
    
    if (!assignedTo && !reviewers) {
      return next(new ApiError('请提供分配人员或审核人员', 400));
    }
    
    // 查找报告
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    }).populate('creator', 'name');
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    // 检查权限
    const isCreator = report.creator && 
      report.creator._id.toString() === req.user._id.toString();
      
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager']) && !isCreator) {
      return next(new ApiError('您没有分配此报告人员的权限', 403));
    }
    
    // 验证所有用户是否存在
    let updates = {};
    
    if (assignedTo) {
      const assignedUsers = await User.find({ _id: { $in: assignedTo } });
      if (assignedUsers.length !== assignedTo.length) {
        return next(new ApiError('部分指定的用户不存在', 400));
      }
      updates.assignedTo = assignedTo;
    }
    
    if (reviewers) {
      const reviewerUsers = await User.find({ _id: { $in: reviewers } });
      if (reviewerUsers.length !== reviewers.length) {
        return next(new ApiError('部分指定的审核人不存在', 400));
      }
      
      // 构建审核人数组
      const existingReviewers = report.reviewers.filter(
        reviewer => reviewer.user && reviewers.includes(reviewer.user.toString())
      );
      
      const newReviewers = reviewers
        .filter(userId => !report.reviewers.some(
          reviewer => reviewer.user && reviewer.user.toString() === userId
        ))
        .map(userId => ({
          user: userId,
          status: '待审核'
        }));
      
      updates.reviewers = [...existingReviewers, ...newReviewers];
      
      // 更新报告状态
      if (newReviewers.length > 0 && report.status === '草稿') {
        updates.status = '审核中';
      }
    }
    
    // 更新报告
    const updatedReport = await Report.findByIdAndUpdate(
      report._id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email avatarUrl role')
      .populate('reviewers.user', 'name email avatarUrl role');
    
    res.status(200).json({
      success: true,
      data: {
        assignedTo: updatedReport.assignedTo,
        reviewers: updatedReport.reviewers
      }
    });
  } catch (error) {
    logger.error(`分配报告人员失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 提交报告合规检查结果
 * @route POST /api/reports/:id/compliance
 * @access 权限：Admin, Partner, Manager
 */
exports.updateComplianceStatus = async (req, res, next) => {
  try {
    const { complianceStatus, complianceIssues } = req.body;
    
    if (!complianceStatus || !['未检查', '通过', '需修改', '不合规'].includes(complianceStatus)) {
      return next(new ApiError('请提供有效的合规状态', 400));
    }
    
    // 检查权限
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager'])) {
      return next(new ApiError('您没有进行合规检查的权限', 403));
    }
    
    // 查找报告
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    });
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    // 更新合规状态
    report.complianceStatus = complianceStatus;
    
    // 更新合规问题（如果有）
    if (complianceIssues && Array.isArray(complianceIssues)) {
      report.complianceIssues = complianceIssues;
    }
    
    await report.save();
    
    res.status(200).json({
      success: true,
      data: {
        complianceStatus: report.complianceStatus,
        complianceIssues: report.complianceIssues
      }
    });
  } catch (error) {
    logger.error(`更新合规状态失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 上传报告附件信息
 * @route POST /api/reports/:id/attachments
 * @access 权限：所有登录用户（有权访问该报告的）
 */
exports.addReportAttachment = async (req, res, next) => {
  try {
    const { name, fileUrl } = req.body;
    
    if (!name || !fileUrl) {
      return next(new ApiError('请提供附件名称和文件URL', 400));
    }
    
    // 查找报告
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    });
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    // 添加附件
    report.attachments.push({
      name,
      fileUrl,
      uploadedBy: req.user._id,
      uploadedAt: Date.now()
    });
    
    await report.save();
    
    // 填充用户信息
    const updatedReport = await Report.findById(report._id)
      .populate('attachments.uploadedBy', 'name avatarUrl');
    
    res.status(200).json({
      success: true,
      data: updatedReport.attachments[updatedReport.attachments.length - 1]
    });
  } catch (error) {
    logger.error(`添加报告附件失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取报告历史版本
 * @route GET /api/reports/:id/versions
 * @access 权限：所有登录用户（有权访问该报告的）
 */
exports.getReportVersions = async (req, res, next) => {
  try {
    // 查找报告
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    }).populate('versions.createdBy', 'name email avatarUrl');
    
    if (!report) {
      return next(new ApiError('未找到该报告', 404));
    }
    
    // 按版本号排序（降序）
    const sortedVersions = [...report.versions].sort((a, b) => b.versionNumber - a.versionNumber);
    
    res.status(200).json({
      success: true,
      data: sortedVersions
    });
  } catch (error) {
    logger.error(`获取报告版本历史失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取报告统计信息
 * @route GET /api/reports/stats
 * @access 权限：Admin, Partner, Manager
 */
exports.getReportStats = async (req, res, next) => {
  try {
    // 检查权限
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager'])) {
      return next(new ApiError('您没有查看报告统计的权限', 403));
    }
    
    // 按报告类型统计
    const typeStats = await Report.aggregate([
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 按状态统计
    const statusStats = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // 按创建人统计（前10名）
    const creatorStats = await Report.aggregate([
      { $group: { _id: '$creator', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // 填充创建人信息
    const populatedCreatorStats = await User.populate(creatorStats, {
      path: '_id',
      select: 'name email avatarUrl'
    });
    
    // 月度报告统计（最近12个月）
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    
    const monthlyStats = await Report.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalReports: await Report.countDocuments(),
        typeStats,
        statusStats,
        creatorStats: populatedCreatorStats,
        monthlyStats
      }
    });
  } catch (error) {
    logger.error(`获取报告统计信息失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 生成报告内容 
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.generateReport = async (req, res) => {
  try {
    const {
      reportType,
      clientName,
      projectName,
      financialData,
      template,
      aiModel = 'deepseek.r1'  // 默认使用 Deepseek R1
    } = req.body;

    // 验证必要的字段
    if (!reportType || !clientName || !projectName) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的信息：报告类型、客户名称或项目名称'
      });
    }

    // 调用AI服务生成报告
    const reportContent = await aiService.generateReportContent({
      reportType,
      clientName,
      projectName,
      financialData,
      template,
      aiModel  // 将选择的AI模型传递给服务
    });

    return res.status(200).json({
      success: true,
      data: reportContent,
      message: `已使用${aiModel}成功生成报告内容`
    });
  } catch (error) {
    logger.error(`生成报告失败: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || '生成报告时发生错误'
    });
  }
};

/**
 * 检查报告合规性
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.checkCompliance = async (req, res) => {
  try {
    const {
      content,
      reportType,
      regulations,
      aiModel = 'deepseek.r1'  // 默认使用 Deepseek R1
    } = req.body;

    if (!content || !reportType) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的信息：报告内容或报告类型'
      });
    }

    // 如果没有提供法规列表，使用默认法规
    const regulationList = regulations || defaultRegulations[reportType] || [];

    // 调用AI服务检查合规性
    const complianceResults = await aiService.checkReportCompliance({
      content,
      reportType,
      regulations: regulationList,
      aiModel  // 将选择的AI模型传递给服务
    });

    return res.status(200).json({
      success: true,
      data: complianceResults,
      message: `已使用${aiModel}完成合规性检查`
    });
  } catch (error) {
    logger.error(`合规性检查失败: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || '合规性检查时发生错误'
    });
  }
};

/**
 * 获取法规推荐
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getRegulationRecommendations = async (req, res) => {
  try {
    const {
      projectType,
      industry,
      businessScope,
      additionalInfo,
      projectName,
      aiModel = 'deepseek.r1'  // 默认使用 Deepseek R1
    } = req.body;

    if (!projectType || !industry) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的信息：项目类型或行业'
      });
    }

    // 调用AI服务获取法规推荐
    const recommendations = await aiService.getRegulationRecommendations({
      projectType,
      industry,
      businessScope,
      additionalInfo,
      projectName,
      aiModel  // 将选择的AI模型传递给服务
    });

    return res.status(200).json({
      success: true,
      data: recommendations,
      message: `已使用${aiModel}生成法规推荐`
    });
  } catch (error) {
    logger.error(`获取法规推荐失败: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || '获取法规推荐时发生错误'
    });
  }
}; 