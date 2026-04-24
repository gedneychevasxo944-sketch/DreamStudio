import { create } from 'zustand';
import { homePageApi } from '../services/api';
import { useStageStore } from './stageStore';

// localStorage keys
const PROJECTS_KEY = 'dreamstudio_projects';
const CURRENT_PROJECT_KEY = 'dreamstudio_current_project';

// 辅助函数：从 localStorage 加载项目列表
const loadProjectsFromStorage = () => {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// 辅助函数：保存项目列表到 localStorage
const saveProjectsToStorage = (projects) => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
};

export const useProjectStore = create((set, get) => ({
  // 项目列表
  projects: loadProjectsFromStorage(),

  // 项目基本信息
  currentProjectId: null,
  projectName: '未命名项目',
  currentVersion: null,

  // 保存状态
  savedProjectState: null,
  hasUnsavedChanges: false,

  // 版本历史
  versions: [],
  showVersionDropdown: false,

  // 保存状态
  isSaving: false,
  saveSuccess: false,

  // T069: 从后端加载项目列表
  loadProjects: async () => {
    try {
      const data = await homePageApi.getProjects();
      const rawProjects = data?.data?.projects || data?.projects || [];
      // 统一字段名：title -> name, updatedTime -> updatedAt
      const projects = rawProjects.map(p => ({
        id: p.id,
        name: p.title || p.name,
        description: p.description,
        status: p.status,
        coverImage: p.coverImage,
        tags: p.tags,
        config: p.config,
        lastResult: p.lastResult,
        currentVersion: p.currentVersion,
        createdAt: p.createdTime,
        updatedAt: p.updatedTime,
      }));
      saveProjectsToStorage(projects);
      set({ projects });
      return projects;
    } catch (error) {
      console.error('Failed to load projects from backend:', error);
      return [];
    }
  },

  // T069: 创建新项目（先调用后端创建，再切换）
  createProject: async (name) => {
    const projectTitle = name || '新项目';
    try {
      // 先调用后端创建项目
      const createResponse = await homePageApi.createProject(projectTitle);
      if (createResponse?.data?.id) {
        const newProject = {
          id: createResponse.data.id,  // 使用后端返回的真实 ID
          name: projectTitle,
          createdAt: createResponse.data.createdTime || new Date().toISOString(),
          updatedAt: createResponse.data.updatedTime || new Date().toISOString(),
        };

        const projects = [...get().projects, newProject];
        saveProjectsToStorage(projects);
        set({ projects });

        return newProject;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
    return null;
  },

  // T069: 选择/切换项目
  switchProject: async (projectId) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }

    console.log('[projectStore] switchProject called:', {
      projectId,
      projectName: project.name,
      currentState: {
        currentProjectId: get().currentProjectId,
        hasUnsavedChanges: get().hasUnsavedChanges,
        savedProjectState: get().savedProjectState,
      }
    });

    // 切换到新项目前，重置 stageStore 状态（清除旧项目的 pending 状态）
    console.log('[projectStore] Resetting stageStore before switch');
    useStageStore.getState().resetAllStageAssets();

    // 切换到新项目
    set({
      currentProjectId: project.id,
      projectName: project.name,
      // 重置其他 store 状态
      currentVersion: null,
      savedProjectState: {
        nodes: [],
        connections: [],
        viewport: {},
        name: project.name,
      },
      hasUnsavedChanges: false,
      versions: [],
    });

    // 保存当前项目 ID
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);

    // 加载新项目的故事板资产
    try {
      // 如果是本地 ID（project-xxx格式），跳过加载（尚未同步到后端）
      const projectIdStr = String(projectId);
      if (projectIdStr.startsWith('project-')) {
        console.log('[projectStore] Skipping load for local project:', projectId);
        return;
      }
      const projectResponse = await homePageApi.getProject(projectIdStr);
      const config = projectResponse?.data?.config
        ? JSON.parse(projectResponse.data.config)
        : { nodes: [], connections: [], viewport: {} };

      // 调用 stageStore 的加载方法
      await useStageStore.getState().loadProjectAssets(projectId, config);

      // 加载成功后，初始化 savedProjectState 为当前状态（用于脏检测）
      set({
        savedProjectState: {
          nodes: config.nodes || [],
          connections: config.connections || [],
          viewport: config.viewport || {},
          name: project.name,
        },
      });
    } catch (error) {
      console.error('[projectStore] Failed to load project assets:', error);
    }
  },

  // T069: 删除项目
  deleteProject: (projectId) => {
    const projects = get().projects.filter(p => p.id !== projectId);
    saveProjectsToStorage(projects);
    set({ projects });

    // 如果删除的是当前项目，重置状态
    if (get().currentProjectId === projectId) {
      set({
        currentProjectId: null,
        projectName: '未命名项目',
      });
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  },

  // T069: 更新项目信息
  updateProject: (projectId, updates) => {
    const projects = get().projects.map(p =>
      p.id === projectId
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    );
    saveProjectsToStorage(projects);
    set({ projects });

    // 如果更新的是当前项目，同步更新 projectName
    if (get().currentProjectId === projectId && updates.name) {
      set({ projectName: updates.name });
    }
  },

  // Actions
  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  setProjectName: (name) => set({ projectName: name }),

  setCurrentVersion: (version) => set({ currentVersion: version }),

  setSavedProjectState: (state) => set({ savedProjectState: state }),

  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

  setVersions: (versions) => set({ versions }),

  setShowVersionDropdown: (show) => set({ showVersionDropdown: show }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  setSaveSuccess: (success) => set({ saveSuccess: success }),

  // 标记保存成功
  markSaved: (state) => set({
    savedProjectState: state,
    hasUnsavedChanges: false,
    saveSuccess: true,
  }),

  // 重置项目状态
  resetProject: () => set({
    currentProjectId: null,
    projectName: '未命名项目',
    currentVersion: null,
    savedProjectState: null,
    hasUnsavedChanges: false,
    versions: [],
    showVersionDropdown: false,
  }),

  // 添加版本
  addVersion: (version) => set((state) => ({
    versions: [version, ...state.versions]
  })),

  // 删除版本
  removeVersion: (versionId) => set((state) => ({
    versions: state.versions.filter(v => v.id !== versionId)
  })),

  // 切换版本
  switchVersion: (versionId) => {
    const version = get().versions.find(v => v.id === versionId);
    if (version) {
      set({ currentVersion: version });
    }
  },
}));

export default useProjectStore;
