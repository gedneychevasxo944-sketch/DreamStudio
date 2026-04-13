/**
 * 数据转换工具函数
 */

/**
 * 转换后端项目数据为前端格式
 */
export const transformProjectData = (project) => ({
  id: project.id,
  title: project.title,
  type: project.tags || '短片',
  status: project.status === 'DRAFT' ? '草稿' :
          project.status === 'PROCESSING' ? '制作中' :
          project.status === 'COMPLETED' ? '已完成' : '审核阶段',
  progress: 0,
  agents: ['制片人', '编剧', '导演'],
  nodeStatuses: {},
  coverImage: project.coverImage,
  lastAccessedAt: project.updatedTime,
  createdAt: project.createdTime,
  config: project.config,
  lastResult: project.lastResult,
});
