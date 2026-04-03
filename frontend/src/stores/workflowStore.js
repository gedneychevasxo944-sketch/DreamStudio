import { create } from 'zustand';

// 生成节点默认宽度的函数
const getDefaultNodeWidth = (nodeType) => {
  if (nodeType === 'visual' || nodeType === 'director' || nodeType === 'technical') {
    return 540;
  }
  return 360;
};

// 计算模板节点位置
const calculateTemplateNodePositions = (columns, startX = 50, startY = 200, gap = 100) => {
  const nodes = [];
  let currentX = startX;

  columns.forEach((column) => {
    const { type, name, color, icon } = column;
    const nodeWidth = getDefaultNodeWidth(type);

    nodes.push({
      id: type,
      name: name,
      type: type,
      x: currentX,
      y: startY,
      color: color,
      icon: icon,
      data: {}
    });

    currentX += nodeWidth + gap;
  });

  return nodes;
};

export const useWorkflowStore = create((set, get) => ({
  // 画布状态
  nodes: [],
  connections: [],
  viewport: { x: 0, y: 0, zoom: 1 },

  // 选择状态
  selectedNodeId: null,

  // 运行状态
  isRunning: false,

  // 待发送的聊天消息
  pendingChatMessage: null,

  // 画布 key（用于强制重新挂载）
  canvasKey: 0,

  // Actions - 节点管理
  setNodes: (nodes) => set({ nodes }),

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),

  updateNode: (nodeId, updates) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n)
  })),

  updateNodeData: (nodeId, data) => set((state) => ({
    nodes: state.nodes.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
    )
  })),

  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== nodeId),
    connections: state.connections.filter(c => c.from !== nodeId && c.to !== nodeId),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
  })),

  // Actions - 连接管理
  setConnections: (connections) => set({ connections }),

  addConnection: (connection) => set((state) => ({
    connections: [...state.connections, connection]
  })),

  deleteConnection: (connectionId) => set((state) => ({
    connections: state.connections.filter(c => c.id !== connectionId)
  })),

  // 删除与某节点相关的所有连接
  deleteConnectionsForNode: (nodeId) => set((state) => ({
    connections: state.connections.filter(c => c.from !== nodeId && c.to !== nodeId)
  })),

  // Actions - 视口管理
  setViewport: (viewport) => set({ viewport }),

  updateViewport: (updates) => set((state) => ({
    viewport: { ...state.viewport, ...updates }
  })),

  // Actions - 选择状态
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  // Actions - 运行状态
  setIsRunning: (running) => set({ isRunning: running }),

  // 更新节点状态
  updateNodeStatus: (nodeId, status) => set((state) => ({
    nodes: state.nodes.map(n =>
      n.id === nodeId ? { ...n, status } : n
    )
  })),

  // 更新节点结果
  updateNodeResult: (nodeId, result, thinking = []) => set((state) => {
    const nodeExists = state.nodes.some(n => n.id === nodeId);
    if (!nodeExists) {
      console.warn('[workflowStore] updateNodeResult: node not found:', nodeId);
      return state;
    }
    return {
      nodes: state.nodes.map(n =>
        n.id === nodeId ? {
          ...n,
          status: 'completed',
          data: {
            ...n.data,
            result,
            thinking,
            hasResult: true,
            isResultExpanded: true
          }
        } : n
      )
    };
  }),

  // Actions - 待发送消息
  setPendingChatMessage: (message) => set({ pendingChatMessage: message }),

  clearPendingChatMessage: () => set({ pendingChatMessage: null }),

  // Actions - 画布 key
  incrementCanvasKey: () => set((state) => ({ canvasKey: state.canvasKey + 1 })),

  // 重置画布
  resetCanvas: () => set({
    nodes: [],
    connections: [],
    selectedNodeId: null,
    pendingChatMessage: null,
  }),

  // 加载工作流数据
  loadWorkflow: (nodes, connections) => set({
    nodes: nodes || [],
    connections: connections || []
  }),

  // 加载模板节点
  loadTemplateNodes: (templateNodes, templateConnections) => set({
    nodes: templateNodes,
    connections: templateConnections || []
  }),

  // 批量更新节点（用于执行过程中的状态更新）
  batchUpdateNodes: (updates) => set((state) => {
    const nodeMap = new Map(state.nodes.map(n => [n.id, n]));
    updates.forEach(update => {
      const existing = nodeMap.get(update.id);
      if (existing) {
        nodeMap.set(update.id, { ...existing, ...update });
      }
    });
    return { nodes: Array.from(nodeMap.values()) };
  }),

  // 检查是否有未保存的节点/连接变更
  hasCanvasChanges: () => {
    const state = get();
    return state.nodes.length > 0 || state.connections.length > 0;
  },
}));

// 导出工具函数
export { calculateTemplateNodePositions, getDefaultNodeWidth };

export default useWorkflowStore;
