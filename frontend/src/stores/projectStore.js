import { create } from 'zustand';

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

  // T069: 加载项目列表
  loadProjects: () => {
    const projects = loadProjectsFromStorage();
    set({ projects });
    return projects;
  },

  // T069: 创建新项目
  createProject: (name) => {
    const newProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || '新项目',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const projects = [...get().projects, newProject];
    saveProjectsToStorage(projects);
    set({ projects });

    return newProject;
  },

  // T069: 选择/切换项目
  switchProject: (projectId) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }

    // 保存当前项目状态（如果有）
    // TODO: 保存当前项目到 storage

    // 切换到新项目
    set({
      currentProjectId: project.id,
      projectName: project.name,
      // 重置其他 store 状态
      currentVersion: null,
      savedProjectState: null,
      hasUnsavedChanges: false,
      versions: [],
    });

    // 保存当前项目 ID
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);

    // TODO: 加载新项目的状态到 stageStore, workflowStore 等
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
