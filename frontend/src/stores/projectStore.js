import { create } from 'zustand';

export const useProjectStore = create((set, get) => ({
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
}));

export default useProjectStore;
