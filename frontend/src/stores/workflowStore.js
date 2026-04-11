import { create } from 'zustand';

// 生成节点默认宽度的函数（统一700px）
const getDefaultNodeWidth = (nodeType) => {
  return 700;
};

// 计算节点位置 - 横向排列，间距基于前一个节点的 endX
export const calculateNodePositions = (nodes, options = {}) => {
  const {
    startX = 50,
    startY = 200,
    gap = 100,  // 节点之间的间距
  } = options;

  let currentX = startX;

  return nodes.map((node, index) => {
    const nodeWidth = getDefaultNodeWidth(node.type || node.agentCode);
    const x = currentX;
    currentX = x + nodeWidth + gap;

    return {
      ...node,
      x,
      y: startY,
    };
  });
};

// 计算模板节点位置（保留兼容）
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
      n.id === nodeId ? {
        ...n,
        status,
        // 运行完成后清除 stale 状态
        data: status === 'completed' ? { ...n.data, status: undefined, staleReason: undefined } : n.data
      } : n
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

  // 获取下游节点（通过连接关系查找）
  getDownstreamNodes: (nodeId) => {
    const state = get();
    const downstreamIds = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      state.connections.forEach(conn => {
        if (conn.from === currentId && !downstreamIds.has(conn.to)) {
          downstreamIds.add(conn.to);
          queue.push(conn.to);
        }
      });
    }

    return state.nodes.filter(n => downstreamIds.has(n.id));
  },

  // 标记节点为stale（依赖失效）
  markNodeAsStale: (nodeId, reason) => set((state) => ({
    nodes: state.nodes.map(n =>
      n.id === nodeId ? {
        ...n,
        data: { ...n.data, status: 'stale', staleReason: reason }
      } : n
    )
  })),

  // 标记下游所有节点为stale
  markDownstreamAsStale: (nodeId, reason) => set((state) => {
    // 先找出所有下游节点
    const downstreamIds = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      state.connections.forEach(conn => {
        if (conn.from === currentId && !downstreamIds.has(conn.to)) {
          downstreamIds.add(conn.to);
          queue.push(conn.to);
        }
      });
    }

    // 批量更新所有下游节点为stale
    return {
      nodes: state.nodes.map(n =>
        downstreamIds.has(n.id) ? {
          ...n,
          data: { ...n.data, status: 'stale', staleReason: reason || `依赖节点 ${nodeId} 已修改` }
        } : n
      )
    };
  }),

  // 清除节点的stale状态
  clearNodeStale: (nodeId) => set((state) => ({
    nodes: state.nodes.map(n =>
      n.id === nodeId ? {
        ...n,
        data: { ...n.data, status: 'completed', staleReason: null }
      } : n
    )
  })),

  // 清除下游所有节点的stale状态
  clearDownstreamStale: (nodeId) => set((state) => {
    // 先找出所有下游节点
    const downstreamIds = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      state.connections.forEach(conn => {
        if (conn.from === currentId && !downstreamIds.has(conn.to)) {
          downstreamIds.add(conn.to);
          queue.push(conn.to);
        }
      });
    }

    // 批量清除所有下游节点的stale状态
    return {
      nodes: state.nodes.map(n =>
        downstreamIds.has(n.id) ? {
          ...n,
          data: { ...n.data, status: 'completed', staleReason: null }
        } : n
      )
    };
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
