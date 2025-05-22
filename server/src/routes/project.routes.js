const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/project.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// 所有路由都需要认证
router.use(protect);

// 项目基本CRUD操作
router
  .route('/')
  .get(getProjects)
  .post(authorize('admin', 'partner', 'manager'), createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(authorize('admin', 'partner'), deleteProject);

// 项目团队管理
router.route('/:id/team')
  .get(getProjectTeam)
  .post(addTeamMember);

router.route('/:id/team/:memberId')
  .put(updateTeamMember)
  .delete(removeTeamMember);

// 项目阶段管理
router.route('/:id/phases')
  .get(getProjectPhases)
  .post(addProjectPhase);

router.route('/:id/phases/:phaseId')
  .put(updateProjectPhase)
  .delete(deleteProjectPhase);

// 项目任务管理
router.route('/:id/tasks')
  .get(getProjectTasks);

router.route('/:id/phases/:phaseId/tasks')
  .post(addProjectTask);

router.route('/:id/phases/:phaseId/tasks/:taskId')
  .put(updateProjectTask)
  .delete(deleteProjectTask);

router.route('/:id/phases/:phaseId/tasks/:taskId/comments')
  .post(addTaskComment);

// 项目文档管理
router.route('/:id/documents')
  .get(getProjectDocuments)
  .post(addProjectDocument);

router.route('/:id/documents/:documentId')
  .put(updateProjectDocument)
  .delete(deleteProjectDocument);

// 项目风险管理
router.route('/:id/risks')
  .get(getProjectRisks)
  .post(addProjectRisk);

router.route('/:id/risks/:riskId')
  .put(updateProjectRisk)
  .delete(deleteProjectRisk);

module.exports = router; 