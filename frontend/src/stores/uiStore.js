import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // 视图状态
  currentView: 'home', // 'home' | 'workspace'

  // 布局状态
  leftWidth: 20,
  rightWidth: 28,
  leftCollapsed: false,
  rightCollapsed: false,

  // 拖拽状态
  isDraggingLeft: false,
  isDraggingRight: false,

  // 模态框状态
  activeModal: null,
  selectedNodeId: null,

  // 全屏状态
  isCanvasFullscreen: false,

  // 技能市场
  showSkillMarket: false,

  // 新建项目确认
  showNewProjectConfirm: false,

  // 删除版本确认
  showDeleteConfirm: false,
  versionToDelete: null,

  // P5: 右侧预览面板状态
  rightPreviewVisible: true,  // 对话层右侧预览面板显示状态

  // Actions - 视图
  setCurrentView: (view) => set({ currentView: view }),

  // Actions - 布局
  setLeftWidth: (width) => set({ leftWidth: Math.max(15, Math.min(45, width)) }),

  setRightWidth: (width) => set({ rightWidth: Math.max(10, Math.min(35, width)) }),

  toggleLeftCollapse: () => set((state) => ({ leftCollapsed: !state.leftCollapsed })),

  toggleRightCollapse: () => set((state) => ({ rightCollapsed: !state.rightCollapsed })),

  // Actions - 拖拽
  setIsDraggingLeft: (dragging) => set({ isDraggingLeft: dragging }),

  setIsDraggingRight: (dragging) => set({ isDraggingRight: dragging }),

  // Actions - 模态框
  setActiveModal: (modal) => set({ activeModal: modal }),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  openModal: (modal, nodeId = null) => set({ activeModal: modal, selectedNodeId: nodeId }),

  closeModal: () => set({ activeModal: null, selectedNodeId: null }),

  // Actions - 全屏
  setIsCanvasFullscreen: (fullscreen) => set({ isCanvasFullscreen: fullscreen }),

  toggleCanvasFullscreen: () => set((state) => ({ isCanvasFullscreen: !state.isCanvasFullscreen })),

  // Actions - 技能市场
  setShowSkillMarket: (show) => set({ showSkillMarket: show }),

  toggleSkillMarket: () => set((state) => ({ showSkillMarket: !state.showSkillMarket })),

  // Actions - 新建项目确认
  setShowNewProjectConfirm: (show) => set({ showNewProjectConfirm: show }),

  // Actions - 删除版本确认
  setShowDeleteConfirm: (show) => set({ showDeleteConfirm: show }),

  setVersionToDelete: (version) => set({ versionToDelete: version }),

  // P5: 右侧预览面板
  setRightPreviewVisible: (visible) => set({ rightPreviewVisible: visible }),

  toggleRightPreview: () => set((state) => ({ rightPreviewVisible: !state.rightPreviewVisible })),

  // 打开删除确认
  openDeleteConfirm: (version) => set({ showDeleteConfirm: true, versionToDelete: version }),

  closeDeleteConfirm: () => set({ showDeleteConfirm: false, versionToDelete: null }),

  // 计算实际宽度
  getActualWidths: () => {
    const state = get();
    const actualLeftWidth = state.leftCollapsed ? 0 : (state.isCanvasFullscreen ? 0 : state.leftWidth);
    const actualRightWidth = state.rightCollapsed ? 0 : (state.isCanvasFullscreen ? 0 : state.rightWidth);
    const centerWidth = state.isCanvasFullscreen
      ? 100
      : (100 - actualLeftWidth - actualRightWidth);
    return { actualLeftWidth, actualRightWidth, centerWidth };
  },
}));

export default useUIStore;
