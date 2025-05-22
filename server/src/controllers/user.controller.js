/**
 * @desc    搜索用户
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = async (req, res, next) => {
  try {
    const { term } = req.query;
    const logger = req.app.get('logger');
    
    if (!term) {
      return res.status(400).json({
        success: false,
        error: '请提供搜索关键词'
      });
    }
    
    logger.info(`用户搜索请求: term=${term}, requestedBy=${req.user._id}`);
    
    // 构建查询条件 - 支持通过ID、姓名和邮箱查找
    let query = {};
    
    // 尝试根据ObjectId查找
    if (term.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = term;
    } else {
      // 否则尝试姓名和邮箱模糊匹配
      query = {
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } }
        ]
      };
    }
    
    // 执行搜索
    const users = await User.find(query)
      .select('name email department')
      .limit(10);
    
    if (users.length === 0) {
      logger.warn(`用户搜索未找到结果: term=${term}`);
      
      // 特殊处理：如果像邮箱地址但未找到，记录为潜在新用户
      if (term.includes('@') && term.includes('.')) {
        logger.info(`潜在新用户邮箱: ${term}`);
      }
      
      return res.json({
        success: true,
        data: [],
        message: '未找到匹配的用户'
      });
    }
    
    logger.info(`用户搜索成功: term=${term}, matchCount=${users.length}`);
    
    return res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    const logger = req.app.get('logger');
    logger.error(`用户搜索异常: ${error.message}`, { stack: error.stack });
    
    return res.status(500).json({
      success: false,
      error: '搜索用户失败',
      message: error.message
    });
  }
};

module.exports = {
  searchUsers,
}; 