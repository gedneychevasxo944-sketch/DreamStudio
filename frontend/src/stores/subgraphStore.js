import { create } from 'zustand';
import { eventBus, EVENT_TYPES } from '../utils/eventBus';

/**
 * 子图类型
 */
export const SUBGRAPH_TYPES = {
  CHARACTER: 'character',
  SCENE: 'scene',
  SHOT: 'shot',
  STORYBOARD: 'storyboard',
};

/**
 * 子图状态
 */
export const SUBGRAPH_SYNC_STATUS = {
  SYNCED: 'synced',           // 已同步
  MODIFIED: 'modified',       // 有未同步的修改
  RUNNING: 'running',         // 正在运行
  ERROR: 'error',             // 运行错误
};

/**
 * Subgraph Store
 * 管理所有工作流子图
 */
export const useSubgraphStore = create((set, get) => ({
  // 子图列表
  subgraphs: [],

  // 当前焦点
  focusedSubgraphId: null,

  // 焦点资产ID（从对话层/故事板层传来）
  focusedAssetId: null,

  // Actions - 子图管理

  // 添加子图
  addSubgraph: (subgraph) => set((state) => ({
    subgraphs: [...state.subgraphs, subgraph]
  })),

  // 更新子图
  updateSubgraph: (subgraphId, updates) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, ...updates } : sg
    )
  })),

  // 删除子图
  removeSubgraph: (subgraphId) => set((state) => ({
    subgraphs: state.subgraphs.filter(sg => sg.id !== subgraphId),
    focusedSubgraphId: state.focusedSubgraphId === subgraphId ? null : state.focusedSubgraphId
  })),

  // 根据资产ID获取子图
  getSubgraphByAssetId: (assetId) => {
    const state = get();
    return state.subgraphs.find(sg => sg.assetId === assetId);
  },

  // 根据ID获取子图
  getSubgraphById: (subgraphId) => {
    const state = get();
    return state.subgraphs.find(sg => sg.id === subgraphId);
  },

  // 根据资产ID获取或创建子图
  getOrCreateSubgraphByAssetId: (assetId, assetType, assetName) => {
    const state = get();
    let subgraph = state.subgraphs.find(sg => sg.assetId === assetId);
    if (!subgraph) {
      // 创建新子图 - 使用 Date.now() + 随机数确保唯一
      const newSubgraph = {
        id: `subgraph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        assetId,
        assetType: assetType || 'unknown',
        name: assetName || `子图 ${state.subgraphs.length + 1}`,
        nodes: [],
        connections: [],
        syncStatus: SUBGRAPH_SYNC_STATUS.SYNCED,
        isExpanded: false,
        createdAt: new Date().toISOString(),
      };
      state.addSubgraph(newSubgraph);
      return newSubgraph;
    }
    return subgraph;
  },

  // 设置子图节点和连接
  setSubgraphContent: (subgraphId, nodes, connections) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, nodes, connections } : sg
    )
  })),

  // 更新子图节点
  updateSubgraphNode: (subgraphId, nodeId, updates) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? {
        ...sg,
        nodes: sg.nodes.map(n =>
          n.id === nodeId ? { ...n, ...updates } : n
        ),
        syncStatus: SUBGRAPH_SYNC_STATUS.MODIFIED
      } : sg
    )
  })),

  // Actions - 焦点管理

  // 设置焦点子图
  setFocusedSubgraph: (subgraphId) => {
    set({ focusedSubgraphId: subgraphId });
    const subgraph = get().subgraphs.find(sg => sg.id === subgraphId);
    eventBus.emit(EVENT_TYPES.FOCUS_CHANGED, {
      type: 'subgraph',
      subgraphId,
      assetId: subgraph?.assetId
    });
  },

  // 根据资产ID设置焦点
  setFocusByAssetId: (assetId) => {
    const state = get();
    const subgraph = state.subgraphs.find(sg => sg.assetId === assetId);
    if (subgraph) {
      set({
        focusedSubgraphId: subgraph.id,
        focusedAssetId: assetId
      });
      eventBus.emit(EVENT_TYPES.FOCUS_CHANGED, {
        type: 'subgraph',
        subgraphId: subgraph.id,
        assetId
      });
    }
  },

  // 清除焦点
  clearFocus: () => {
    set({ focusedSubgraphId: null, focusedAssetId: null });
    eventBus.emit(EVENT_TYPES.FOCUS_CHANGED, {
      type: 'none',
      subgraphId: null,
      assetId: null
    });
  },

  // Actions - 同步状态

  // 标记子图为已修改
  markAsModified: (subgraphId) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, syncStatus: SUBGRAPH_SYNC_STATUS.MODIFIED } : sg
    )
  })),

  // 标记子图为同步
  markAsSynced: (subgraphId) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, syncStatus: SUBGRAPH_SYNC_STATUS.SYNCED } : sg
    )
  })),

  // 标记子图正在运行
  markAsRunning: (subgraphId) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, syncStatus: SUBGRAPH_SYNC_STATUS.RUNNING } : sg
    )
  })),

  // 标记子图为错误
  markAsError: (subgraphId, error) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? {
        ...sg,
        syncStatus: SUBGRAPH_SYNC_STATUS.ERROR,
        lastError: error
      } : sg
    )
  })),

  // Actions - 展开/收起状态

  // 展开子图
  expandSubgraph: (subgraphId) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, isExpanded: true } : sg
    )
  })),

  // 收起子图
  collapseSubgraph: (subgraphId) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, isExpanded: false } : sg
    )
  })),

  // 切换展开/收起状态
  toggleSubgraphExpanded: (subgraphId) => set((state) => ({
    subgraphs: state.subgraphs.map(sg =>
      sg.id === subgraphId ? { ...sg, isExpanded: !sg.isExpanded } : sg
    )
  })),

  // Actions - 运行

  // 运行子图
  runSubgraph: async (subgraphId, executionContext = {}) => {
    const state = get();
    const subgraph = state.subgraphs.find(sg => sg.id === subgraphId);
    if (!subgraph) return;

    // 标记为运行中
    state.markAsRunning(subgraphId);
    eventBus.emit(EVENT_TYPES.SUBGRAPH_RUN_START, {
      subgraphId,
      assetId: subgraph.assetId,
      nodes: subgraph.nodes,
      connections: subgraph.connections,
      ...executionContext
    });

    // 如果子图没有节点，发射完成事件（模拟成功）
    if (!subgraph.nodes || subgraph.nodes.length === 0) {
      // 模拟运行
      await new Promise(resolve => setTimeout(resolve, 500));
      state.markAsSynced(subgraphId);
      eventBus.emit(EVENT_TYPES.SUBGRAPH_RUN_COMPLETE, {
        subgraphId,
        assetId: subgraph.assetId,
        success: true
      });
      return { success: true };
    }

    // 有节点时，由外部处理实际执行
    // 外部监听 SUBGRAPH_RUN_START 事件，获取节点数据后执行
    // 执行完成后调用 markAsSynced 或 markAsError
    return { success: true, needsExecution: true };
  },

  // 运行所有子图
  runAllSubgraphs: async (executionContext = {}) => {
    const state = get();
    const results = [];

    for (const sg of state.subgraphs) {
      const result = await state.runSubgraph(sg.id, executionContext);
      results.push({ subgraphId: sg.id, ...result });
    }

    return results;
  },

  // Actions - 批量操作

  // 加载子图列表
  loadSubgraphs: (subgraphs) => set({ subgraphs }),

  // 清空所有子图
  clearAllSubgraphs: () => set({
    subgraphs: [],
    focusedSubgraphId: null,
    focusedAssetId: null
  }),

  // 重置状态
  reset: () => set({
    subgraphs: [],
    focusedSubgraphId: null,
    focusedAssetId: null
  }),
}));

export default useSubgraphStore;
