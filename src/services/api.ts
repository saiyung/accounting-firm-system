import axios from '@/lib/axios';

// 待办任务API
export const fetchMyTasks = async (params?: any) => {
  return await axios.get('/api/tasks', { params });
};

export const fetchUpcomingTasks = async () => {
  return await axios.get('/api/tasks', { params: { upcoming: true } });
};

export const createTask = async (taskData: any) => {
  return axios.post('/api/tasks', taskData);
};

export const updateTask = async (id: string, taskData: any) => {
  return axios.put(`/api/tasks/${id}`, taskData);
};

export const completeTask = async (id: string) => {
  return await axios.put(`/api/tasks/${id}/complete`);
};

export const deleteTask = async (id: string) => {
  return axios.delete(`/api/tasks/${id}`);
};

// 活动API
export const fetchTeamActivities = async (limit: number = 5) => {
  return await axios.get('/api/activities/team', { params: { limit } });
};

export const fetchMyActivities = async (limit: number = 10) => {
  return await axios.get('/api/activities/me', { params: { limit } });
};

export const fetchProjectActivities = async (projectId: string, limit: number = 20) => {
  return await axios.get(`/api/activities/projects/${projectId}`, { params: { limit } });
};

// 项目进度API
export const fetchProjectProgress = async (limit: number = 5) => {
  return await axios.get('/api/projects', { 
    params: { 
      limit,
      status: '进行中',
      sort: 'dates.endDate'
    } 
  });
}; 