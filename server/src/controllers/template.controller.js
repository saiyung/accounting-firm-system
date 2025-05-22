const Template = require('../models/template.model');
const User = require('../models/user.model');
const Report = require('../models/report.model');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const { checkPermission } = require('../utils/permissions');

/**
 * 创建新模板
 * @route POST /api/templates
 * @access 权限：Admin, Partner, Manager
 */
exports.createTemplate = async (req, res, next) => {
  try {
    const { name, category, description, content, sections } = req.body;

    // 基本验证
    if (!name || !category || !description || !content) {
      return next(new ApiError('请提供所有必要的模板信息', 400));
    }

    // 检查用户权限
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager'])) {
      return next(new ApiError('您没有创建模板的权限', 403));
    }

    // 生成模板ID
    const templateId = await Template.generateTemplateId();

    // 创建模板记录
    const newTemplate = await Template.create({
      ...req.body,
      templateId,
      creator: req.user._id,
      lastUpdater: req.user._id,
      versions: [
        {
          versionNumber: 1,
          content,
          sections: sections || [],
          createdBy: req.user._id,
          createdAt: Date.now(),
          changes: '初始版本'
        }
      ]
    });

    // 关联实体数据填充
    const populatedTemplate = await Template.findById(newTemplate._id)
      .populate('creator', 'name email avatarUrl department role')
      .populate('lastUpdater', 'name email avatarUrl')
      .populate('versions.createdBy', 'name email avatarUrl');

    // 返回新创建的模板
    res.status(201).json({
      success: true,
      data: populatedTemplate
    });
  } catch (error) {
    logger.error(`创建模板失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取所有模板列表
 * @route GET /api/templates
 * @access 权限：所有登录用户
 */
exports.getAllTemplates = async (req, res, next) => {
  try {
    const { category, isActive, isSystem, creator, search, sortBy, sortOrder } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    
    // 构建查询条件
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isSystem !== undefined) query.isSystem = isSystem === 'true';
    
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
        { templateId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
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
    const total = await Template.countDocuments(query);
    const templates = await Template.find(query)
      .populate('creator', 'name email avatarUrl')
      .populate('lastUpdater', 'name email avatarUrl')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // 返回结果
    res.status(200).json({
      success: true,
      count: templates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: templates
    });
  } catch (error) {
    logger.error(`获取模板列表失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取单个模板详情
 * @route GET /api/templates/:id
 * @access 权限：所有登录用户
 */
exports.getTemplateById = async (req, res, next) => {
  try {
    const template = await Template.findOne({
      $or: [
        { _id: req.params.id },
        { templateId: req.params.id }
      ]
    })
      .populate('creator', 'name email avatarUrl department role')
      .populate('lastUpdater', 'name email avatarUrl')
      .populate('versions.createdBy', 'name email avatarUrl');
    
    if (!template) {
      return next(new ApiError('未找到该模板', 404));
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error(`获取模板详情失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 更新模板信息
 * @route PUT /api/templates/:id
 * @access 权限：Admin, Partner, Manager, 模板创建者
 */
exports.updateTemplate = async (req, res, next) => {
  try {
    // 查找模板
    const template = await Template.findOne({
      $or: [
        { _id: req.params.id },
        { templateId: req.params.id }
      ]
    }).populate('creator', 'name');
    
    if (!template) {
      return next(new ApiError('未找到该模板', 404));
    }
    
    // 检查权限
    const isCreator = template.creator && 
      template.creator._id.toString() === req.user._id.toString();
      
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager']) && !isCreator) {
      return next(new ApiError('您没有更新此模板的权限', 403));
    }
    
    // 不允许修改模板ID和创建者
    delete req.body.templateId;
    delete req.body.creator;
    
    // 如果模板是系统模板，只有Admin和Partner可以修改
    if (template.isSystem && !checkPermission(req.user, ['Admin', 'Partner'])) {
      return next(new ApiError('您没有修改系统模板的权限', 403));
    }
    
    // 如果更新了内容，则创建新版本
    if ((req.body.content && req.body.content !== template.content) || 
        (req.body.sections && JSON.stringify(req.body.sections) !== JSON.stringify(template.sections))) {
      const newVersion = {
        versionNumber: template.currentVersion + 1,
        content: req.body.content || template.content,
        sections: req.body.sections || template.sections,
        createdBy: req.user._id,
        createdAt: Date.now(),
        changes: req.body.versionComment || '内容更新'
      };
      
      template.versions.push(newVersion);
      template.currentVersion = newVersion.versionNumber;
    }
    
    // 更新最后更新者
    req.body.lastUpdater = req.user._id;
    
    // 更新模板信息
    const updatedTemplate = await Template.findByIdAndUpdate(
      template._id,
      { 
        ...req.body, 
        versions: template.versions, 
        currentVersion: template.currentVersion 
      },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name email avatarUrl department role')
      .populate('lastUpdater', 'name email avatarUrl');
    
    res.status(200).json({
      success: true,
      data: updatedTemplate
    });
  } catch (error) {
    logger.error(`更新模板失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 删除模板
 * @route DELETE /api/templates/:id
 * @access 权限：Admin, Partner, 非系统模板的创建者
 */
exports.deleteTemplate = async (req, res, next) => {
  try {
    // 查找模板
    const template = await Template.findOne({
      $or: [
        { _id: req.params.id },
        { templateId: req.params.id }
      ]
    }).populate('creator', 'name');
    
    if (!template) {
      return next(new ApiError('未找到该模板', 404));
    }
    
    // 检查权限
    const isCreator = template.creator && 
      template.creator._id.toString() === req.user._id.toString();
    
    if (!checkPermission(req.user, ['Admin', 'Partner']) && 
        !(isCreator && !template.isSystem)) {
      return next(new ApiError('您没有删除此模板的权限', 403));
    }
    
    // 检查该模板是否正在被使用
    const reportsUsingTemplate = await Report.countDocuments({
      template: template._id
    });
    
    if (reportsUsingTemplate > 0) {
      return next(new ApiError('该模板正在被报告使用，无法删除', 400));
    }
    
    // 删除模板
    await template.remove();
    
    res.status(200).json({
      success: true,
      message: '模板已成功删除'
    });
  } catch (error) {
    logger.error(`删除模板失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 更新模板状态（激活/停用）
 * @route PATCH /api/templates/:id/status
 * @access 权限：Admin, Partner, Manager, 模板创建者
 */
exports.updateTemplateStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return next(new ApiError('请提供模板状态', 400));
    }
    
    // 查找模板
    const template = await Template.findOne({
      $or: [
        { _id: req.params.id },
        { templateId: req.params.id }
      ]
    });
    
    if (!template) {
      return next(new ApiError('未找到该模板', 404));
    }
    
    // 检查权限
    const isCreator = template.creator && 
      template.creator._id.toString() === req.user._id.toString();
      
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager']) && !isCreator) {
      return next(new ApiError('您没有更新此模板状态的权限', 403));
    }
    
    // 如果模板是系统模板，只有Admin和Partner可以修改
    if (template.isSystem && !checkPermission(req.user, ['Admin', 'Partner'])) {
      return next(new ApiError('您没有修改系统模板状态的权限', 403));
    }
    
    // 更新状态
    template.isActive = isActive;
    template.lastUpdater = req.user._id;
    await template.save();
    
    res.status(200).json({
      success: true,
      data: {
        templateId: template.templateId,
        isActive: template.isActive
      }
    });
  } catch (error) {
    logger.error(`更新模板状态失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取模板历史版本
 * @route GET /api/templates/:id/versions
 * @access 权限：所有登录用户
 */
exports.getTemplateVersions = async (req, res, next) => {
  try {
    // 查找模板
    const template = await Template.findOne({
      $or: [
        { _id: req.params.id },
        { templateId: req.params.id }
      ]
    }).populate('versions.createdBy', 'name email avatarUrl');
    
    if (!template) {
      return next(new ApiError('未找到该模板', 404));
    }
    
    // 按版本号排序（降序）
    const sortedVersions = [...template.versions].sort((a, b) => b.versionNumber - a.versionNumber);
    
    res.status(200).json({
      success: true,
      data: sortedVersions
    });
  } catch (error) {
    logger.error(`获取模板版本历史失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 复制现有模板创建新模板
 * @route POST /api/templates/:id/duplicate
 * @access 权限：所有登录用户
 */
exports.duplicateTemplate = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return next(new ApiError('请提供新模板名称', 400));
    }
    
    // 查找源模板
    const sourceTemplate = await Template.findOne({
      $or: [
        { _id: req.params.id },
        { templateId: req.params.id }
      ]
    });
    
    if (!sourceTemplate) {
      return next(new ApiError('未找到源模板', 404));
    }
    
    // 生成新模板ID
    const templateId = await Template.generateTemplateId();
    
    // 创建新模板（复制源模板的主要属性）
    const newTemplate = await Template.create({
      templateId,
      name,
      category: sourceTemplate.category,
      description: `基于模板"${sourceTemplate.name}"创建`,
      content: sourceTemplate.content,
      sections: sourceTemplate.sections,
      creator: req.user._id,
      lastUpdater: req.user._id,
      isSystem: false,
      isActive: true,
      tags: sourceTemplate.tags,
      versions: [
        {
          versionNumber: 1,
          content: sourceTemplate.content,
          sections: sourceTemplate.sections,
          createdBy: req.user._id,
          createdAt: Date.now(),
          changes: `从模板"${sourceTemplate.name}"复制创建`
        }
      ],
      currentVersion: 1
    });
    
    // 关联实体数据填充
    const populatedTemplate = await Template.findById(newTemplate._id)
      .populate('creator', 'name email avatarUrl')
      .populate('lastUpdater', 'name email avatarUrl');
    
    res.status(201).json({
      success: true,
      data: populatedTemplate
    });
  } catch (error) {
    logger.error(`复制模板失败: ${error.message}`);
    return next(error);
  }
};

/**
 * 获取模板统计信息
 * @route GET /api/templates/stats
 * @access 权限：Admin, Partner, Manager
 */
exports.getTemplateStats = async (req, res, next) => {
  try {
    // 检查权限
    if (!checkPermission(req.user, ['Admin', 'Partner', 'Manager'])) {
      return next(new ApiError('您没有查看模板统计的权限', 403));
    }
    
    // 按分类统计
    const categoryStats = await Template.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 按创建者统计（前10名）
    const creatorStats = await Template.aggregate([
      { $group: { _id: '$creator', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // 填充创建者信息
    const populatedCreatorStats = await User.populate(creatorStats, {
      path: '_id',
      select: 'name email avatarUrl'
    });
    
    // 按使用次数统计（前10名）
    const usageStats = await Template.find()
      .sort({ usageCount: -1 })
      .limit(10)
      .select('templateId name category usageCount');
    
    // 系统模板与用户自定义模板比例
    const systemTemplateCount = await Template.countDocuments({ isSystem: true });
    const userTemplateCount = await Template.countDocuments({ isSystem: false });
    
    res.status(200).json({
      success: true,
      data: {
        totalTemplates: await Template.countDocuments(),
        systemTemplateCount,
        userTemplateCount,
        categoryStats,
        creatorStats: populatedCreatorStats,
        usageStats
      }
    });
  } catch (error) {
    logger.error(`获取模板统计信息失败: ${error.message}`);
    return next(error);
  }
}; 