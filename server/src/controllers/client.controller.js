/**
 * 客户管理控制器
 * 使用MockDbService替代MongoDB模型，实现本地JSON文件存储
 */

const MockDbService = require('../services/MockDbService');
const logger = require('../utils/logger');

// 创建客户服务实例
const clientService = new MockDbService('clients');

/**
 * 获取所有客户
 * @route GET /api/clients
 * @access 私有
 */
exports.getAllClients = async (req, res, next) => {
  try {
    // 获取查询参数
    const { industry, tags, search } = req.query;
    
    // 基本过滤条件
    let filter = {};
    
    // 按行业过滤
    if (industry) {
      filter.industry = industry;
    }
    
    // 获取所有客户
    let clients = await clientService.findAll(filter);
    
    // 按标签过滤（这需要在内存中处理，因为我们的简单模拟数据库不支持数组子查询）
    if (tags) {
      const tagList = tags.split(',');
      clients = clients.filter(client => {
        return client.tags && client.tags.some(tag => tagList.includes(tag));
      });
    }
    
    // 搜索功能
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(client => {
        return (
          client.name.toLowerCase().includes(searchLower) ||
          client.contact.toLowerCase().includes(searchLower) ||
          client.address.toLowerCase().includes(searchLower) ||
          client.id.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // 记录日志
    logger.info(`获取客户列表: 找到 ${clients.length} 条记录`);
    
    // 返回结果
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    logger.error(`获取客户列表失败: ${error.message}`);
    next(error);
  }
};

/**
 * 根据ID获取客户
 * @route GET /api/clients/:id
 * @access 私有
 */
exports.getClientById = async (req, res, next) => {
  try {
    const client = await clientService.findById(req.params.id);
    
    if (!client) {
      logger.warn(`未找到客户: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到客户'
        }
      });
    }
    
    logger.info(`获取客户详情: ${client.id}`);
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`获取客户详情失败: ${error.message}`);
    next(error);
  }
};

/**
 * 创建客户
 * @route POST /api/clients
 * @access 私有
 */
exports.createClient = async (req, res, next) => {
  try {
    // 生成客户ID（如果没有提供）
    if (!req.body.id) {
      // 生成C开头的6位ID，格式：C + 随机数字
      req.body.id = `C${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    // 创建客户
    const client = await clientService.create(req.body);
    
    logger.info(`创建客户成功: ${client.id}`);
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`创建客户失败: ${error.message}`);
    next(error);
  }
};

/**
 * 更新客户
 * @route PUT /api/clients/:id
 * @access 私有
 */
exports.updateClient = async (req, res, next) => {
  try {
    // 查找并更新客户
    const client = await clientService.update(req.params.id, req.body);
    
    if (!client) {
      logger.warn(`更新客户失败: 未找到 ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到客户'
        }
      });
    }
    
    logger.info(`更新客户成功: ${client.id}`);
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`更新客户失败: ${error.message}`);
    next(error);
  }
};

/**
 * 删除客户
 * @route DELETE /api/clients/:id
 * @access 私有
 */
exports.deleteClient = async (req, res, next) => {
  try {
    // 查找并删除客户
    const result = await clientService.delete(req.params.id);
    
    if (!result) {
      logger.warn(`删除客户失败: 未找到 ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到客户'
        }
      });
    }
    
    logger.info(`删除客户成功: ${req.params.id}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`删除客户失败: ${error.message}`);
    next(error);
  }
};

/**
 * 更新客户状态
 * @route PATCH /api/clients/:id/status
 * @access 私有
 */
exports.updateClientStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请提供状态'
        }
      });
    }
    
    // 查找并更新客户状态
    const client = await clientService.update(req.params.id, { status });
    
    if (!client) {
      logger.warn(`更新客户状态失败: 未找到 ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到客户'
        }
      });
    }
    
    logger.info(`更新客户状态成功: ${client.id} -> ${status}`);
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`更新客户状态失败: ${error.message}`);
    next(error);
  }
};

/**
 * 添加客户备注
 * @route POST /api/clients/:id/notes
 * @access 私有
 */
exports.addClientNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请提供备注内容'
        }
      });
    }
    
    // 查找客户
    const client = await clientService.findById(req.params.id);
    
    if (!client) {
      logger.warn(`添加客户备注失败: 未找到 ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到客户'
        }
      });
    }
    
    // 创建新备注
    const note = {
      id: Date.now().toString(),
      content,
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };
    
    // 添加备注到客户
    client.notes = client.notes || [];
    client.notes.push(note);
    
    // 更新客户
    const updatedClient = await clientService.update(req.params.id, client);
    
    logger.info(`添加客户备注成功: ${client.id}`);
    
    res.status(201).json({
      success: true,
      data: updatedClient
    });
  } catch (error) {
    logger.error(`添加客户备注失败: ${error.message}`);
    next(error);
  }
};

/**
 * 添加客户附件
 * @route POST /api/clients/:id/attachments
 * @access 私有
 */
exports.addClientAttachment = async (req, res, next) => {
  try {
    // 检查是否有文件
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请上传文件'
        }
      });
    }
    
    // 查找客户
    const client = await clientService.findById(req.params.id);
    
    if (!client) {
      logger.warn(`添加客户附件失败: 未找到 ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到客户'
        }
      });
    }
    
    // 模拟文件上传
    const attachment = {
      id: Date.now().toString(),
      name: req.body.name || '附件',
      fileName: req.files.file.name,
      fileType: req.files.file.mimetype,
      fileSize: req.files.file.size,
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString()
    };
    
    // 添加附件到客户
    client.attachments = client.attachments || [];
    client.attachments.push(attachment);
    
    // 更新客户
    const updatedClient = await clientService.update(req.params.id, client);
    
    logger.info(`添加客户附件成功: ${client.id}`);
    
    res.status(201).json({
      success: true,
      data: updatedClient
    });
  } catch (error) {
    logger.error(`添加客户附件失败: ${error.message}`);
    next(error);
  }
};

/**
 * 获取客户统计信息
 * @route GET /api/clients/stats
 * @access 私有
 */
exports.getClientStats = async (req, res, next) => {
  try {
    // 获取所有客户
    const clients = await clientService.findAll();
    
    // 计算统计信息
    const stats = {
      total: clients.length,
      byIndustry: {},
      byStatus: {},
      byTag: {}
    };
    
    // 按行业统计
    clients.forEach(client => {
      // 行业统计
      if (client.industry) {
        stats.byIndustry[client.industry] = (stats.byIndustry[client.industry] || 0) + 1;
      }
      
      // 状态统计
      if (client.status) {
        stats.byStatus[client.status] = (stats.byStatus[client.status] || 0) + 1;
      }
      
      // 标签统计
      if (client.tags && Array.isArray(client.tags)) {
        client.tags.forEach(tag => {
          stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
        });
      }
    });
    
    logger.info(`获取客户统计信息: 共 ${clients.length} 个客户`);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`获取客户统计信息失败: ${error.message}`);
    next(error);
  }
}; 