import { create } from 'zustand';
import { traverseConnectedNodes } from '../utils/nodeUtils';
import { storeLogger } from '../utils/logger';
export { calculateNodePositions, calculateTemplateNodePositions } from '../utils/nodeUtils';

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
      storeLogger.warn('[workflowStore] updateNodeResult: node not found:', nodeId);
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
    const downstreamIds = traverseConnectedNodes(nodeId, state.connections, 'downstream');
    return state.nodes.filter(n => downstreamIds.has(n.id));
  },

  // 获取上游节点（通过连接关系查找）
  getUpstreamNodes: (nodeId) => {
    const state = get();
    const upstreamIds = traverseConnectedNodes(nodeId, state.connections, 'upstream');
    return state.nodes.filter(n => upstreamIds.has(n.id));
  },

  // 检查节点是否可以被修改（没有下游节点被锁定）
  checkCanModifyNode: (nodeId) => {
    const state = get();
    const downstreamIds = traverseConnectedNodes(nodeId, state.connections, 'downstream');

    // 检查是否有下游节点被锁定
    const lockedDownstream = state.nodes.filter(n =>
      downstreamIds.has(n.id) && n.data?.isLocked
    );

    if (lockedDownstream.length > 0) {
      return {
        canModify: false,
        lockedBy: lockedDownstream.map(n => n.name || n.id)
      };
    }

    return { canModify: true, lockedBy: [] };
  },

  // 锁定节点及其上游节点
  lockNodeAndUpstream: (nodeId) => {
    const state = get();
    const upstreamIds = traverseConnectedNodes(nodeId, state.connections, 'upstream');

    // 锁定当前节点和所有上游节点
    const now = new Date().toISOString();
    const idsToLock = [nodeId, ...Array.from(upstreamIds)];

    set({
      nodes: state.nodes.map(n =>
        idsToLock.includes(n.id) ? {
          ...n,
          data: {
            ...n.data,
            isLocked: true,
            lockedAt: now,
            lockedByPropagation: n.id !== nodeId,
            propagationRoot: nodeId
          }
        } : n
      )
    });

    return idsToLock;
  },

  // 解锁节点及其上游节点（仅解锁与该节点一起被锁定的上游节点）
  unlockNodeAndUpstream: (nodeId) => {
    const state = get();
    // 找出被这个节点传播锁定的上游节点
    const idsToUnlock = state.nodes
      .filter(n =>
        n.data?.propagationRoot === nodeId && n.data?.lockedByPropagation
      )
      .map(n => n.id);

    idsToUnlock.push(nodeId);

    set({
      nodes: state.nodes.map(n =>
        idsToUnlock.includes(n.id) ? {
          ...n,
          data: {
            ...n.data,
            isLocked: false,
            lockedAt: undefined,
            lockedByPropagation: undefined,
            propagationRoot: undefined
          }
        } : n
      )
    });

    return idsToUnlock;
  },

  // 检查节点是否因下游锁定而被锁定
  isLockedByDownstream: (nodeId) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    return node?.data?.lockedByPropagation === true;
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
    const downstreamIds = traverseConnectedNodes(nodeId, state.connections, 'downstream');

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
    const downstreamIds = traverseConnectedNodes(nodeId, state.connections, 'downstream');

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

export default useWorkflowStore;
