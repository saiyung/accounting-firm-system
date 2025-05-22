const Knowledge = require('../models/knowledge.model');
const mongoose = require('mongoose');

/**
 * @desc    创建知识条目
 * @route   POST /api/knowledge
 * @access  Private
 */
const createKnowledge = async (req, res, next) => {
  try {
    // 从请求体获取数据
    const {
      title,
      content,
      category,
      tags,
      summary,
      visibility,
      visibleTo,
      keywords,
      references,
      relatedProjects,
      relatedClients,
      isTemplate,
      isFeatured,
    } = req.body;

    // 创建知识条目
    const knowledge = await Knowledge.create({
      title,
      content,
      category,
      tags,
      summary,
      visibility,
      visibleTo,
      keywords,
      references,
      relatedProjects,
      relatedClients,
      isTemplate,
      isFeatured,
      author: req.user._id,
    });

    // 如果状态是已发布，设置发布时间
    if (req.body.status === '已发布') {
      knowledge.publishedAt = Date.now();
    }

    await knowledge.save();

    res.status(201).json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取所有知识条目（带分页和过滤）
 * @route   GET /api/knowledge
 * @access  Private
 */
const getKnowledge = async (req, res, next) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 过滤条件
    const filter = {};

    // 标题搜索
    if (req.query.title) {
      filter.title = { $regex: req.query.title, $options: 'i' };
    }

    // 分类过滤
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // 标签过滤
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    // 状态过滤（管理员和合伙人可以看所有状态，其他人只能看已发布的）
    if (req.query.status && (req.user.role === 'admin' || req.user.role === 'partner')) {
      filter.status = req.query.status;
    } else {
      // 非管理员只能看到已发布的
      filter.status = '已发布';
    }

    // 作者过滤
    if (req.query.author) {
      filter.author = req.query.author;
    }

    // 根据用户角色和部门设置可见性过滤
    if (!(req.user.role === 'admin' || req.user.role === 'partner')) {
      filter.$or = [
        { visibility: '公开' },
        { visibility: '仅内部' },
        { visibility: '指定部门', visibleTo: req.user.department },
        { author: req.user._id }, // 用户总是可以看到自己创建的知识
      ];
    }

    // 全文搜索（如果提供了搜索关键词）
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // 计算总数
    const total = await Knowledge.countDocuments(filter);

    // 获取数据
    let query = Knowledge.find(filter)
      .sort(req.query.sort ? { [req.query.sort]: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('reviewers.user', 'name avatar');

    // 如果需要关联项目或客户信息
    if (req.query.populate === 'full') {
      query = query
        .populate('relatedProjects', 'name projectId')
        .populate('relatedClients', 'name clientId');
    }

    const knowledge = await query;

    res.json({
      success: true,
      count: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: knowledge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取单个知识条目
 * @route   GET /api/knowledge/:id
 * @access  Private
 */
const getKnowledgeById = async (req, res, next) => {
  try {
    const knowledge = await Knowledge.findById(req.params.id)
      .populate('author', 'name avatar department')
      .populate('reviewers.user', 'name avatar')
      .populate('relatedProjects', 'name projectId')
      .populate('relatedClients', 'name clientId')
      .populate('comments.user', 'name avatar')
      .populate('comments.replies.user', 'name avatar')
      .populate('likes.user', 'name');

    if (!knowledge) {
      res.status(404);
      throw new Error('知识不存在');
    }

    // 检查用户是否有权限查看
    if (!knowledge.isVisibleToUser(req.user)) {
      res.status(403);
      throw new Error('无权限查看此知识');
    }

    // 增加阅读计数（除非是作者自己在查看）
    if (knowledge.author._id.toString() !== req.user._id.toString()) {
      await knowledge.incrementViewCount();
    }

    res.json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新知识条目
 * @route   PUT /api/knowledge/:id
 * @access  Private
 */
const updateKnowledge = async (req, res, next) => {
  try {
    let knowledge = await Knowledge.findById(req.params.id);

    if (!knowledge) {
      res.status(404);
      throw new Error('知识不存在');
    }

    // 检查权限（只有作者、管理员和合伙人可以更新）
    if (
      knowledge.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'partner'
    ) {
      res.status(403);
      throw new Error('无权限更新此知识');
    }

    // 保存旧版本
    const oldVersion = knowledge.toObject();
    const revisionData = {
      updatedBy: req.user._id,
      version: knowledge.currentVersion,
      changes: req.body.revisionComment || '更新内容',
    };
    
    // 添加修订记录
    knowledge.revisions.push(revisionData);
    knowledge.currentVersion += 1;

    // 如果状态从草稿变为已发布，设置发布时间
    if (knowledge.status !== '已发布' && req.body.status === '已发布') {
      knowledge.publishedAt = Date.now();
    }

    // 更新知识
    Object.keys(req.body).forEach((key) => {
      // 不直接更新作者、评论、点赞等字段
      if (
        !['author', 'comments', 'likes', 'viewCount', 'revisions', 'currentVersion'].includes(
          key
        )
      ) {
        knowledge[key] = req.body[key];
      }
    });

    await knowledge.save();

    res.json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除知识条目
 * @route   DELETE /api/knowledge/:id
 * @access  Private
 */
const deleteKnowledge = async (req, res, next) => {
  try {
    const knowledge = await Knowledge.findById(req.params.id);

    if (!knowledge) {
      res.status(404);
      throw new Error('知识不存在');
    }

    // 检查权限（只有作者、管理员和合伙人可以删除）
    if (
      knowledge.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'partner'
    ) {
      res.status(403);
      throw new Error('无权限删除此知识');
    }

    await knowledge.remove();

    res.json({
      success: true,
      message: '知识已删除',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    点赞知识
 * @route   POST /api/knowledge/:id/like
 * @access  Private
 */
const likeKnowledge = async (req, res, next) => {
  try {
    const knowledge = await Knowledge.findById(req.params.id);

    if (!knowledge) {
      res.status(404);
      throw new Error('知识不存在');
    }

    // 检查用户是否已点赞
    const alreadyLiked = knowledge.likes.find(
      (like) => like.user.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      // 取消点赞
      knowledge.likes = knowledge.likes.filter(
        (like) => like.user.toString() !== req.user._id.toString()
      );
    } else {
      // 添加点赞
      knowledge.likes.push({
        user: req.user._id,
      });
    }

    await knowledge.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: knowledge.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    评论知识
 * @route   POST /api/knowledge/:id/comment
 * @access  Private
 */
const commentKnowledge = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400);
      throw new Error('评论内容不能为空');
    }

    const knowledge = await Knowledge.findById(req.params.id);

    if (!knowledge) {
      res.status(404);
      throw new Error('知识不存在');
    }

    const comment = {
      user: req.user._id,
      content,
    };

    knowledge.comments.push(comment);
    await knowledge.save();

    // 获取包含用户信息的最新评论
    const populatedKnowledge = await Knowledge.findById(req.params.id).populate(
      'comments.user',
      'name avatar'
    );
    const newComment = populatedKnowledge.comments[populatedKnowledge.comments.length - 1];

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    回复评论
 * @route   POST /api/knowledge/:id/comment/:commentId/reply
 * @access  Private
 */
const replyToComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400);
      throw new Error('回复内容不能为空');
    }

    const knowledge = await Knowledge.findById(req.params.id);

    if (!knowledge) {
      res.status(404);
      throw new Error('知识不存在');
    }

    // 查找评论
    const comment = knowledge.comments.id(req.params.commentId);

    if (!comment) {
      res.status(404);
      throw new Error('评论不存在');
    }

    const reply = {
      user: req.user._id,
      content,
    };

    comment.replies.push(reply);
    await knowledge.save();

    // 获取包含用户信息的最新回复
    const populatedKnowledge = await Knowledge.findById(req.params.id).populate(
      'comments.replies.user',
      'name avatar'
    );
    const updatedComment = populatedKnowledge.comments.id(req.params.commentId);
    const newReply = updatedComment.replies[updatedComment.replies.length - 1];

    res.status(201).json({
      success: true,
      data: newReply,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    审核知识
 * @route   POST /api/knowledge/:id/review
 * @access  Private (管理员和合伙人)
 */
const reviewKnowledge = async (req, res, next) => {
  try {
    const { status, comments } = req.body;

    if (!status) {
      res.status(400);
      throw new Error('请提供审核状态');
    }

    const knowledge = await Knowledge.findById(req.params.id);

    if (!knowledge) {
      res.status(404);
      throw new Error('知识不存在');
    }

    // 检查权限
    if (req.user.role !== 'admin' && req.user.role !== 'partner') {
      res.status(403);
      throw new Error('只有管理员和合伙人可以审核知识');
    }

    // 添加审核记录
    knowledge.reviewers.push({
      user: req.user._id,
      comments,
    });

    // 更新状态
    knowledge.status = status;

    // 如果审核通过，设置发布时间
    if (status === '已发布' && !knowledge.publishedAt) {
      knowledge.publishedAt = Date.now();
    }

    await knowledge.save();

    res.json({
      success: true,
      message: `知识已${status === '已发布' ? '审核通过并发布' : '更新状态为' + status}`,
      data: knowledge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取用户推荐的知识
 * @route   GET /api/knowledge/recommended
 * @access  Private
 */
const getRecommendedKnowledge = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    // 获取用户相关的知识
    const relevantKnowledge = await Knowledge.findRelevantForUser(req.user, limit);

    // 获取热门知识
    const popularKnowledge = await Knowledge.findPopular(limit);

    // 合并并去重
    const combined = [...relevantKnowledge];
    popularKnowledge.forEach((item) => {
      if (!combined.some((k) => k._id.toString() === item._id.toString())) {
        combined.push(item);
      }
    });

    // 最多返回请求的限制数量
    const recommended = combined.slice(0, limit);

    res.json({
      success: true,
      data: recommended,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取知识库统计信息
 * @route   GET /api/knowledge/stats
 * @access  Private
 */
const getKnowledgeStats = async (req, res, next) => {
  try {
    // 按分类统计
    const categoryStats = await Knowledge.countByCategory();

    // 获取总数
    const totalCount = await Knowledge.countDocuments({ status: '已发布' });

    // 获取最近添加的知识
    const recentlyAdded = await Knowledge.find({ status: '已发布' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category createdAt viewCount')
      .populate('author', 'name');

    // 获取最多阅读的知识
    const mostViewed = await Knowledge.find({ status: '已发布' })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('title category viewCount')
      .populate('author', 'name');

    // 获取当前用户的贡献
    const userContribution = await Knowledge.find({ author: req.user._id }).countDocuments();

    res.json({
      success: true,
      data: {
        totalCount,
        categoryStats,
        recentlyAdded,
        mostViewed,
        userContribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKnowledge,
  getKnowledge,
  getKnowledgeById,
  updateKnowledge,
  deleteKnowledge,
  likeKnowledge,
  commentKnowledge,
  replyToComment,
  reviewKnowledge,
  getRecommendedKnowledge,
  getKnowledgeStats,
}; 