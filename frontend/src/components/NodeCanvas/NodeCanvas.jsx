import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Workflow, Plus, MousePointer2 } from 'lucide-react';
import { toast } from '../Toast/Toast';
import AgentLibrary from './AgentLibrary';
import NodeConnection from './NodeConnection';
import DraggingConnectionLine from './DraggingConnectionLine';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import RichAgentNode from './RichAgentNode';
import { workSpaceApi, teamApi, agentApi } from '../../services/api';
import { useWorkflowStore, calculateNodePositions } from '../../stores';
import { getDefaultNodeWidth, generateThinkingContent, generateResultContent, traverseConnectedNodes } from '../../utils/nodeUtils';
import { CANVAS, TEMPLATE_LAYOUT } from '../../constants/layoutConstants';
import { canvasLogger } from '../../utils/logger';
import { CanvasToolbar, CanvasStatusBar, FullscreenToolbar, SaveTemplateDialog, ResultDialog } from '../Canvas';
import './NodeCanvas.css';

// 主流程节点类型（简化视图中显示的节点）
const MAIN_FLOW_TYPES = ['producer', 'content', 'visual', 'director', 'technical', 'videoGen', 'videoEditor'];

const NodeCanvas = ({
  isFullscreen,
  onToggleFullscreen,
  projectId,
  projectVersion,
  runButtonText = '运行',
  runExplanation = '',
  hasStaleNodes = false,
  // 节点选择回调
  onNodeSelect,
  // 视频生成回调（供 NodeWorkspace 使用）
  onGenerateVideo,
  // Demo只读态
  isDemoMode = false,
  // 返回故事板
  onReturnToStoryboard,
}) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // P3: 简化视图状态
  const [isSimplifiedView, setIsSimplifiedView] = useState(true);

  // nodeDimensions 的 ref 版本，避免初始化顺序问题
  const nodeDimensionsRef = useRef({});

  // 处理节点选择 - 同时更新内部状态和调用外部回调
  const handleNodeSelect = useCallback((node) => {
    setSelectedNodeId(node.id);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  }, [onNodeSelect]);

  // 自动跟踪状态
  const [autoTrackEnabled, setAutoTrackEnabled] = useState(true);
  const [showTrackTip, setShowTrackTip] = useState(false);
  const autoTrackEnabledRef = useRef(true);

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [connectingMousePos, setConnectingMousePos] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(false);
  const [nodeDimensions, setNodeDimensions] = useState({});
  const [portPositions, setPortPositions] = useState({});
  const [agentTypes, setAgentTypes] = useState({});
  const [templates, setTemplates] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescribe, setTemplateDescribe] = useState('');

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  // T044: 运行结果对话框状态
  const [resultDialog, setResultDialog] = useState({
    isOpen: false,
    result: null,
    nodeId: null,
  });

  // 从 workflowStore 获取状态和方法
  const {
    nodes,
    connections,
    isRunning,
    addNode,
    updateNode,
    updateNodeData,
    updateNodeStatus,
    updateNodeResult,
    addConnection,
    deleteNode,
    deleteConnection,
    setIsRunning,
    batchUpdateNodes,
    resetCanvas,
    loadTemplateNodes,
  } = useWorkflowStore();

  // P3: 计算简化视图节点和焦点高亮
  const { visibleNodes, highlightedNodeIds, collapsedPlaceholder } = useMemo(() => {
    // 识别主流程节点
    const mainFlowNodeIds = new Set(
      nodes.filter(n => MAIN_FLOW_TYPES.includes(n.type) || MAIN_FLOW_TYPES.includes(n.agentCode)).map(n => n.id)
    );

    // 计算焦点高亮节点（选中节点 + 上下游）
    const highlighted = new Set();
    if (selectedNodeId) {
      highlighted.add(selectedNodeId);
      // 获取上游节点
      const upstreamIds = traverseConnectedNodes(selectedNodeId, connections, 'upstream');
      // 获取下游节点
      const downstreamIds = traverseConnectedNodes(selectedNodeId, connections, 'downstream');
      upstreamIds.forEach(id => highlighted.add(id));
      downstreamIds.forEach(id => highlighted.add(id));
    }

    // 确定可见节点
    let visible = nodes;
    let placeholder = null;

    if (isSimplifiedView) {
      // 简化视图：只显示主流程节点
      visible = nodes.filter(n => mainFlowNodeIds.has(n.id));

      // 检查是否有被收拢的节点
      const collapsedNodes = nodes.filter(n => !mainFlowNodeIds.has(n.id));
      if (collapsedNodes.length > 0) {
        // 计算收拢节点的位置（在最后一个主流程节点之后）
        const mainFlowNodes = nodes.filter(n => mainFlowNodeIds.has(n.id));
        const lastMainNode = mainFlowNodes[mainFlowNodes.length - 1];
        if (lastMainNode) {
          placeholder = {
            id: 'collapsed-placeholder',
            collapsedCount: collapsedNodes.length,
            x: lastMainNode.x + 200 + 60, // 200 = node width, 60 = gap
            y: lastMainNode.y,
          };
        }
      }
    }

    return { visibleNodes: visible, highlightedNodeIds: highlighted, collapsedPlaceholder: placeholder };
  }, [nodes, connections, selectedNodeId, isSimplifiedView]);

  // 自动滚动到指定节点（运行节点时调用）
  const scrollToNode = useCallback((nodeId) => {
    if (!autoTrackEnabledRef.current) return;
    const storeState = useWorkflowStore.getState();
    const node = storeState.nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const nodeWidth = nodeDimensionsRef.current[nodeId]?.width || 700;
    const nodeHeight = nodeDimensionsRef.current[nodeId]?.height || 200;

    // 计算节点中心在画布坐标系中的位置
    const nodeCenterX = node.x + nodeWidth / 2;
    const nodeCenterY = node.y + nodeHeight / 2;

    // 计算新的viewport位置，使节点居中
    const newX = canvasRect.width / 2 - nodeCenterX * scale;
    const newY = canvasRect.height / 2 - nodeCenterY * scale;

    setPosition({ x: newX, y: newY });
  }, [scale]);

  // 禁用自动跟踪并显示提示
  const disableAutoTrack = useCallback(() => {
    if (autoTrackEnabledRef.current && isRunning) {
      autoTrackEnabledRef.current = false;
      setAutoTrackEnabled(false);
      setShowTrackTip(true);
      setTimeout(() => setShowTrackTip(false), 3000);
    }
  }, [isRunning]);

  // 用于存储 executeWorkflowWithBackend 的 ref，避免初始化顺序问题
  const executeWorkflowRef = useRef(null);

  // 节点尺寸报告回调
  const handleNodeDimensionChange = useCallback((nodeId, width, height) => {
    setNodeDimensions(prev => ({ ...prev, [nodeId]: { width, height } }));
    nodeDimensionsRef.current = { ...nodeDimensionsRef.current, [nodeId]: { width, height } };
  }, []);

  // 用于存储 handleGenerateVideoNodes 的 ref，避免初始化顺序问题
  const handleGenerateVideoNodesRef = useRef(null);

  // 监听外部触发的视频生成事件（来自 NodeWorkspace）
  useEffect(() => {
    const handleGenerateVideoEvent = (e) => {
      const { sourceNodeId, count, promptId } = e.detail;
      if (handleGenerateVideoNodesRef.current) {
        handleGenerateVideoNodesRef.current(sourceNodeId, count, promptId);
      }
    };
    document.addEventListener('generateVideo', handleGenerateVideoEvent);
    return () => document.removeEventListener('generateVideo', handleGenerateVideoEvent);
  }, []);

  // 端口位置报告回调
  const handlePortPositionChange = useCallback((nodeId, portType, pos) => {
    setPortPositions(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], [portType]: pos }
    }));
  }, []);

  // 处理 wheel 事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      const scrollableSelectors = [
        '.thinking-expanded', '.result-textarea', '.chat-messages',
        '.cc-messages', '.cc-thinking-content', '.cc-result-content', '.conversation-messages'
      ];

      let target = e.target;
      while (target && target !== canvas) {
        for (const selector of scrollableSelectors) {
          if (target.matches && target.matches(selector)) return;
        }
        target = target.parentElement;
      }

      e.preventDefault();
      const isTrackpadPan = !e.ctrlKey && !e.metaKey && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0);
      const isZoom = e.ctrlKey || e.metaKey || (e.deltaX === 0 && Math.abs(e.deltaY) > 0 && !isTrackpadPan);

      if (isZoom) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.5, Math.min(2, prev * delta)));
      } else {
        setPosition(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
      disableAutoTrack();
    };

    let touchStartX = 0, touchStartY = 0, isTouching = false;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTouching = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouching || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      const isEdgeTouch = touchStartX < 30 || touchStartX > window.innerWidth - 30;
      if (isEdgeTouch && Math.abs(deltaX) > Math.abs(e.touches[0].clientY - touchStartY)) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => { isTouching = false; disableAutoTrack(); };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disableAutoTrack]);

  // 加载智能体类型和模板
  useEffect(() => {
    const loadData = async () => {
      setLoadingAgents(true);
      try {
        const [agentsRes, teamsRes] = await Promise.all([
          agentApi.search([], 1, 100),  // 使用新 API
          teamApi.search([], 1, 100)  // 使用团队 API 加载模板
        ]);

        if (agentsRes.code === 200 && agentsRes.data) {
          const agentsMap = {};
          // icon 映射：后端值 -> 前端 ICON_MAP 值
          const iconMap = {
            'PRODUCER': 'Target',
            'CONTENT': 'PenTool',
            'VISUAL': 'Palette',
            'DIRECTOR': 'Video',
            'TECHNICAL': 'Code',
            'VIDEO_GEN': 'Play',
            'VIDEO_EDITOR': 'Scissors',
          };
          agentsRes.data.list.forEach(agent => {
            // 使用 agentCode 作为 key，兼容前端 type 字段
            const type = agent.agentCode || agent.type;
            agentsMap[type] = {
              ...agent,
              id: type,  // 兼容
              type: type,  // 使用 agentCode
              name: agent.agentName || agent.name,
              category: agent.category,  // 后端直接返回 category: "官方认证"
              description: agent.describe || agent.description,
              agentId: agent.agentId,  // 新增：后端 agentId
              agentCode: agent.agentCode,  // 新增
              agentTags: agent.agentTags || [],  // 新增
              icon: iconMap[agent.icon] || agent.icon || 'Bot',  // 映射 icon
            };
          });
          setAgentTypes(agentsMap);
        }

        if (teamsRes.code === 200 && teamsRes.data) {
          const templateList = (teamsRes.data.list || []).map(team => {
            // 节点数据：后端返回的 name/icon/color 优先，agentTypes 兜底
            const nodesWithPosition = (team.dag?.nodes || []).map((n, index) => {
              // agentTypes 兜底数据
              const fallbackData = agentTypes[n.agentCode] || {
                name: n.agentCode,
                category: '未知',
                icon: 'Bot',
                color: '#888888',
                inputs: [{ id: 'input', label: '输入', type: 'any' }],
                outputs: [{ id: 'output', label: '输出', type: 'any' }]
              };
              // 后端返回的节点数据优先，否则用 fallbackData
              return {
                ...fallbackData,  // 先放兜底数据
                id: n.nodeId || `${n.agentCode}-${index}`,
                nodeId: n.nodeId,
                agentId: n.agentId,
                agentCode: n.agentCode,
                type: n.agentCode,
                // 后端返回的 name/icon/color 覆盖兜底数据
                name: n.name || fallbackData.name,
                icon: n.icon || fallbackData.icon,
                color: n.color || fallbackData.color,
                // 暂时不设置 x/y，由 calculateNodePositions 统一计算
                status: 'idle'
              };
            });
            // 使用统一的节点位置计算函数（使用默认布局常量）
            const nodesWithPositions = calculateNodePositions(nodesWithPosition);
            return {
              id: team.teamId,
              name: team.teamName,
              description: team.teamDescribe || '',
              category: team.tags?.[0] || 'default',
              nodes: nodesWithPositions,
              connections: (team.dag?.edges || []).map(e => ({
                from: e.fromNodeId || e.from,
                to: e.toNodeId || e.to
              })),
            };
          });
          setTemplates(templateList);
        }
      } catch (error) {
        canvasLogger.error('[NodeCanvas] Failed to load data:', error);
      } finally {
        setLoadingAgents(false);
      }
    };
    loadData();
  }, []);

  // 监听取消连线事件
  useEffect(() => {
    const handleCancelConnection = () => {
      setIsConnecting(false);
      setConnectingFrom(null);
    };
    window.addEventListener('cancelConnection', handleCancelConnection);
    return () => window.removeEventListener('cancelConnection', handleCancelConnection);
  }, []);

  // ESC键退出全屏
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        onToggleFullscreen?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  // 加载预设模板
  const loadTemplate = useCallback((templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // 先重置画布，再加载模板节点
      resetCanvas();

      // 模板已包含完整节点数据，直接使用
      const loadedNodes = template.nodes.map(n => ({
        ...n,
        id: n.id || n.nodeId,
        status: 'idle'
      }));

      const connections = template.connections.map((conn, index) => {
        const fromNode = loadedNodes.find(n => n.id === (conn.from || conn.fromNodeId));
        const toNode = loadedNodes.find(n => n.id === (conn.to || conn.toNodeId));
        return {
          ...conn,
          id: `${conn.from || conn.fromNodeId}-${conn.to || conn.toNodeId}-${index}`,
          from: conn.from || conn.fromNodeId,
          to: conn.to || conn.toNodeId,
          fromPort: fromNode?.outputs?.[0]?.id || 'output',
          toPort: toNode?.inputs?.[0]?.id || 'input'
        };
      });

      loadTemplateNodes(loadedNodes, connections);
    }
  }, [templates, resetCanvas, loadTemplateNodes]);

  // 添加节点 - 横向排列，间距基于最右侧节点的 endX
  const handleAddNode = useCallback((agentType, x, y) => {
    const gap = CANVAS.NODE_GAP;
    const startY = CANVAS.START_Y;

    // 计算最右侧节点的 endX
    const maxEndX = nodes.reduce((max, n) => {
      const nodeWidth = getDefaultNodeWidth(n.type || n.agentCode);
      return Math.max(max, n.x + nodeWidth);
    }, CANVAS.START_X);

    const newX = maxEndX + gap;
    const agentTypeData = agentTypes[agentType] || Object.values(agentTypes)[0];
    if (!agentTypeData) return;

    addNode({ id: `${agentType}-${Date.now()}`, type: agentType, x: newX, y: startY, ...agentTypeData });
  }, [nodes, agentTypes, addNode]);

  // 画布拖拽
  const handleMouseDown = (e) => {
    const isNode = e.target.closest('.agent-node');
    const isPort = e.target.closest('.port');
    const isButton = e.target.closest('button');
    if (!isNode && !isPort && !isButton) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      disableAutoTrack();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
    if (isConnecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setConnectingMousePos({
          x: (e.clientX - rect.left - position.x) / scale,
          y: (e.clientY - rect.top - position.y) / scale
        });
      }
    }
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    if (isConnecting) {
      const isPort = e.target.closest('.port');
      if (!isPort) {
        setIsConnecting(false);
        setConnectingFrom(null);
      }
    }
  };

  // 开始连线
  const startConnection = (nodeId, portId, portType) => {
    setIsConnecting(true);
    setConnectingFrom({ nodeId, portId, portType });
  };

  // 完成连线
  const completeConnection = (toNodeId, toPortId) => {
    if (isConnecting && connectingFrom) {
      const fromNode = nodes.find(n => n.id === connectingFrom.nodeId);
      const toNode = nodes.find(n => n.id === toNodeId);
      if (fromNode && toNode) {
        const fromOutput = fromNode.outputs?.find(o => o.id === connectingFrom.portId);
        const toInput = toNode.inputs?.find(i => i.id === toPortId);
        if (fromOutput && toInput && fromOutput.type !== toInput.type && toInput.type !== 'any') {
          toast.show({ message: `数据类型不匹配: ${fromOutput.type} → ${toInput.type}`, type: 'warning' });
          setIsConnecting(false);
          setConnectingFrom(null);
          return;
        }
        addConnection({
          id: `${connectingFrom.nodeId}-${connectingFrom.portId}-${toNodeId}-${toPortId}`,
          from: connectingFrom.nodeId,
          fromPort: connectingFrom.portId,
          to: toNodeId,
          toPort: toPortId,
          type: 'data-flow'
        });
      }
      setIsConnecting(false);
      setConnectingFrom(null);
    }
  };

  // 添加连接节点 - 使用统一的间距算法
  const addConnectedNode = useCallback((fromNodeId, agentType) => {
    const newNodeId = `${agentType}-${Date.now()}`;
    const fromNode = nodes.find(n => n.id === fromNodeId);
    if (!fromNode) return;

    const agentTypeData = agentTypes[agentType] || Object.values(agentTypes)[0];
    if (!agentTypeData) return;

    // 计算新节点位置：基于最右侧节点的 endX + gap
    const gap = CANVAS.NODE_GAP;
    const startY = CANVAS.START_Y;
    const maxEndX = nodes.reduce((max, n) => {
      const nodeWidth = getDefaultNodeWidth(n.type || n.agentCode);
      return Math.max(max, n.x + nodeWidth);
    }, CANVAS.START_X);
    const newX = maxEndX + gap;

    addNode({ ...agentTypeData, id: newNodeId, type: agentType, x: newX, y: startY });
    addConnection({
      id: `${fromNodeId}-${fromNode.outputs?.[0]?.id || 'output'}-${newNodeId}-${agentTypeData.inputs?.[0]?.id || 'input'}`,
      from: fromNodeId,
      fromPort: fromNode.outputs?.[0]?.id || 'output',
      to: newNodeId,
      toPort: agentTypeData.inputs?.[0]?.id || 'input',
      type: 'data-flow'
    });
  }, [nodes, agentTypes, addNode, addConnection]);

  // 删除节点
  const handleDeleteNode = useCallback((nodeId) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    if (nodeToDelete?.data?.hasResult || nodeToDelete?.data?.result) {
      setConfirmDialog({
        isOpen: true,
        title: '确认删除',
        message: `节点 "${nodeToDelete.name}" 已生成结果，删除后对应的资产将被清空。\n\n是否确认删除？`,
        onConfirm: () => { deleteNode(nodeId); setConfirmDialog(prev => ({ ...prev, isOpen: false })); },
        onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
    } else {
      deleteNode(nodeId);
    }
  }, [nodes, deleteNode]);

  // 更新节点位置
  const handleUpdateNodePosition = useCallback((nodeId, x, y) => {
    updateNode(nodeId, { x, y });
  }, [updateNode]);

  // 更新节点数据
  const handleUpdateNodeData = useCallback((nodeId, data) => {
    updateNodeData(nodeId, data);
  }, [updateNodeData]);

  // 生成时间戳
  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
  };

  // 执行新创建的节点（只执行指定节点，不执行其他节点，用于视频节点并行执行）
  const executeNewVideoNodes = useCallback((nodesToExecute, connectionsToSend) => {
    if (!projectId || nodesToExecute.length === 0) return;
    setIsRunning(true);

    const nodeThinkingMap = new Map();
    // 新节点执行不传 executionId，从头开始
    const executionId = null;

    try {
      const sseConnection = workSpaceApi.executeWorkflow(
        projectId, executionId, projectVersion, nodesToExecute, connectionsToSend,
        (event) => {
          if (event.type === 'node_status' || event.type === 'status') {
            if (event.nodeId) {
              const status = event.status === 'completed' ? 'completed' : 'running';
              updateNodeStatus(event.nodeId, status);
              if (status === 'running') {
                scrollToNode(event.nodeId);
                // 自动跟随时同步右侧面板到运行节点
                if (autoTrackEnabledRef.current) {
                  const storeState = useWorkflowStore.getState();
                  const runningNode = storeState.nodes.find(n => n.id === event.nodeId);
                  if (runningNode) handleNodeSelect(runningNode);
                }
              }
            }
          } else if (event.type === 'thinking') {
            if (event.nodeId) {
              const existingThinking = nodeThinkingMap.get(event.nodeId) || [];
              existingThinking.push(event.delta);
              nodeThinkingMap.set(event.nodeId, existingThinking);
              updateNodeData(event.nodeId, { thinking: [...existingThinking], thinkingIndex: existingThinking.length, isThinkingExpanded: true });
            }
          } else if (event.type === 'result') {
            if (event.nodeId) updateNodeResult(event.nodeId, event.delta, nodeThinkingMap.get(event.nodeId) || []);
          } else if (event.type === 'data') {
            if (event.nodeId && event.data) updateNodeData(event.nodeId, { ...event.data, hasResult: true });
          } else if (event.type === 'videos') {
            if (event.nodeId && event.videos) updateNodeData(event.nodeId, { videos: event.videos, hasResult: true });
          } else if (event.type === 'complete') {
            setIsRunning(false);
            sseConnection.close();
          } else if (event.type === 'error') {
            setIsRunning(false);
            sseConnection.close();
          }
        },
        (error) => { canvasLogger.error('[NodeCanvas] SSE error:', error); setIsRunning(false); },
        null
      );
    } catch (error) {
      canvasLogger.error('[NodeCanvas] Failed to execute new video nodes:', error);
      setIsRunning(false);
    }
  }, [projectId, projectVersion, setIsRunning, updateNodeStatus, updateNodeData, updateNodeResult, scrollToNode, handleNodeSelect]);

  // 生成视频节点（处理技术节点的自动/手动视频生成请求）
  const handleGenerateVideoNodes = useCallback((sourceNodeId, count, promptId) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode || !sourceNode.data?.prompts) {
      return;
    }

    const prompts = sourceNode.data.prompts;
    const videoGenAgent = agentTypes['videoGen'];
    if (!videoGenAgent) {
      return;
    }

    // Determine which prompts to use
    let promptsToUse;
    if (promptId) {
      // Single prompt specified (manual mode) - 只创建一个节点
      promptsToUse = prompts.filter(p => String(p.id) === String(promptId));
    } else {
      // All prompts or limited count
      const useCount = count > 0 ? Math.min(count, prompts.length) : prompts.length;
      promptsToUse = prompts.slice(0, useCount);
    }

    // 计算基础位置（在源节点右侧，跳过源节点宽度 + 间隔）
    const baseX = sourceNode.x + TEMPLATE_LAYOUT.SOURCE_NODE_WIDTH + TEMPLATE_LAYOUT.HORIZONTAL_GAP;
    const baseY = sourceNode.y;

    // 计算已有多少个视频节点，用于计算新节点的位置
    const existingVideoNodes = nodes.filter(n => n.id.startsWith('videoGen-'));
    const startIndex = existingVideoNodes.length;

    // Create videoGen nodes for each prompt
    const newNodeIds = [];
    promptsToUse.forEach((prompt, index) => {
      const newNodeId = `videoGen-${Date.now()}-${index}`;
      newNodeIds.push(newNodeId);
      const nodeIndex = startIndex + index;
      const newNode = {
        ...videoGenAgent,
        id: newNodeId,
        name: `${videoGenAgent.name} ${nodeIndex + 1}`,
        type: 'videoGen',
        x: baseX,
        y: baseY + nodeIndex * (TEMPLATE_LAYOUT.VIDEO_GEN_NODE_HEIGHT + TEMPLATE_LAYOUT.VERTICAL_GAP),
        data: {
          videoPrompt: prompt.prompt || prompt.text || '',
          promptId: prompt.id,
          status: 'pending'
        }
      };
      addNode(newNode);

      // 创建从技术节点到视频生成节点的连线
      const connectionId = `${sourceNodeId}-output-${newNodeId}-input`;
      addConnection({
        id: connectionId,
        from: sourceNodeId,
        fromPort: 'output',
        to: newNodeId,
        toPort: 'input',
        type: 'data-flow'
      });
    });

    // 从 store 获取最新状态，只取出这次创建的新节点
    setTimeout(() => {
      const storeState = useWorkflowStore.getState();
      const newVideoNodes = storeState.nodes.filter(n => newNodeIds.includes(n.id));
      executeNewVideoNodes(newVideoNodes, []);
    }, 0);
  }, [nodes, agentTypes, addNode, addConnection]);

  // 将 handleGenerateVideoNodes 存入 ref
  useEffect(() => {
    handleGenerateVideoNodesRef.current = handleGenerateVideoNodes;
  }, [handleGenerateVideoNodes]);

  // 执行工作流（后端模式）
  // mode: 'direct' | 'restart' | 'continue' | 'fromCurrent' | 'currentOnly'
  const executeWorkflowWithBackend = useCallback(async (mode = 'direct') => {
    // 使用 useWorkflowStore.getState() 获取最新状态，避免闭包问题
    const storeState = useWorkflowStore.getState();
    let currentNodes = storeState.nodes;
    let currentConnections = storeState.connections;

    if (!projectId || currentNodes.length === 0) {
      return;
    }
    setIsRunning(true);

    // 开始运行时启用自动跟踪
    autoTrackEnabledRef.current = true;
    setAutoTrackEnabled(true);

    const nodeThinkingMap = new Map();
    let savedExecutionId = localStorage.getItem(`execution_${projectId}`);
    let executionId = savedExecutionId ? parseInt(savedExecutionId, 10) : null;
    // upstreamContext 用于传递完整 DAG 信息，用于构建版本关系
    let upstreamContext = null;

    // 根据 mode 过滤 DAG
    if (mode === 'fromCurrent' && selectedNodeId) {
      // 从当前节点运行：获取从选中节点向后的所有节点和边，传递完整上下文用于构建版本关系
      upstreamContext = {
        nodes: storeState.nodes.map(node => ({
          nodeId: node.id,
          agentId: node.agentId,
          agentCode: node.agentCode || node.type,
          inputParam: node.data || {}
        })),
        edges: storeState.connections.map(conn => ({
          fromNodeId: conn.from,
          toNodeId: conn.to
        }))
      };
      const downstreamNodes = traverseConnectedNodes(selectedNodeId, currentConnections, 'downstream');
      currentNodes = currentNodes.filter(n => downstreamNodes.has(n.id));
      currentConnections = currentConnections.filter(c => downstreamNodes.has(c.from) && downstreamNodes.has(c.to));
      executionId = null;
      localStorage.removeItem(`execution_${projectId}`);
    } else if (mode === 'currentOnly' && selectedNodeId) {
      // 仅运行当前节点：只发送选中节点，无边，但传递完整上下文用于构建版本关系
      upstreamContext = {
        nodes: storeState.nodes.map(node => ({
          nodeId: node.id,
          agentId: node.agentId,
          agentCode: node.agentCode || node.type,
          inputParam: node.data || {}
        })),
        edges: storeState.connections.map(conn => ({
          fromNodeId: conn.from,
          toNodeId: conn.to
        }))
      };
      currentNodes = currentNodes.filter(n => n.id === selectedNodeId);
      currentConnections = [];
      executionId = null;
      localStorage.removeItem(`execution_${projectId}`);
    } else if (mode === 'continue') {
      // 继续运行：传递完整上下文用于构建版本关系
      upstreamContext = {
        nodes: storeState.nodes.map(node => ({
          nodeId: node.id,
          agentId: node.agentId,
          agentCode: node.agentCode || node.type,
          inputParam: node.data || {}
        })),
        edges: storeState.connections.map(conn => ({
          fromNodeId: conn.from,
          toNodeId: conn.to
        }))
      };
      // 继续运行：查找 stale 节点及其下游来运行
      const staleNodes = currentNodes.filter(n => n.data?.status === 'stale');
      if (staleNodes.length > 0) {
        // 找到所有需要运行的节点：stale 节点及其下游
        const nodesToRun = new Set();
        const queue = staleNodes.map(n => n.id);
        while (queue.length > 0) {
          const nodeId = queue.shift();
          if (!nodesToRun.has(nodeId)) {
            nodesToRun.add(nodeId);
            currentConnections.filter(c => c.from === nodeId).forEach(c => {
              if (!nodesToRun.has(c.to)) queue.push(c.to);
            });
          }
        }
        currentNodes = currentNodes.filter(n => nodesToRun.has(n.id));
        currentConnections = currentConnections.filter(c => nodesToRun.has(c.from) && nodesToRun.has(c.to));
        // 清除这些节点的 stale 状态
        executionId = null;
        localStorage.removeItem(`execution_${projectId}`);
      } else {
        // 没有 stale 节点，检查是否有已完成节点的下游未完成节点
        const completedNodeIds = new Set(currentNodes.filter(n => n.status === 'completed').map(n => n.id));
        if (completedNodeIds.size > 0) {
          // 找到未完成的起始节点（没有前置已完成节点的节点）
          const nodesToRun = new Set();
          currentNodes.forEach(n => {
            if (!completedNodeIds.has(n.id)) {
              const upstreamConns = currentConnections.filter(c => c.to === n.id);
              if (upstreamConns.length === 0 || upstreamConns.some(c => completedNodeIds.has(c.from))) {
                nodesToRun.add(n.id);
              }
            }
          });
          if (nodesToRun.size > 0) {
            const allNodesToRun = new Set();
            const queue = [...nodesToRun];
            while (queue.length > 0) {
              const nodeId = queue.shift();
              allNodesToRun.add(nodeId);
              currentConnections.filter(c => c.from === nodeId).forEach(c => {
                if (!completedNodeIds.has(c.to) && !allNodesToRun.has(c.to)) queue.push(c.to);
              });
            }
            currentNodes = currentNodes.filter(n => allNodesToRun.has(n.id));
            currentConnections = currentConnections.filter(c => allNodesToRun.has(c.from) && allNodesToRun.has(c.to));
          } else {
            setIsRunning(false);
            return;
          }
        } else {
          setIsRunning(false);
          return;
        }
      }
    } else if (mode === 'restart') {
      // 从头运行：清除保存的 executionId，同时设置 upstreamContext
      executionId = null;
      localStorage.removeItem(`execution_${projectId}`);
      upstreamContext = {
        nodes: storeState.nodes.map(node => ({
          nodeId: node.id,
          agentId: node.agentId,
          agentCode: node.agentCode || node.type,
          inputParam: node.data || {}
        })),
        edges: storeState.connections.map(conn => ({
          fromNodeId: conn.from,
          toNodeId: conn.to
        }))
      };
    } else if (mode === 'direct') {
      // 直接运行：如果有保存的 executionId 则继续，否则从头开始
      if (!executionId) {
        localStorage.removeItem(`execution_${projectId}`);
      }
      // 设置 upstreamContext 用于记录版本关系
      upstreamContext = {
        nodes: storeState.nodes.map(node => ({
          nodeId: node.id,
          agentId: node.agentId,
          agentCode: node.agentCode || node.type,
          inputParam: node.data || {}
        })),
        edges: storeState.connections.map(conn => ({
          fromNodeId: conn.from,
          toNodeId: conn.to
        }))
      };
    }

    try {
      const sseConnection = workSpaceApi.executeWorkflow(
        projectId, executionId, projectVersion, currentNodes, currentConnections,
        (event) => {
          if (event.type === 'init') {
            localStorage.setItem(`execution_${projectId}`, (event.workflowExecutionId || event.executionId || '').toString());
            if (event.completedNodes?.length > 0) {
              batchUpdateNodes(event.completedNodes.map(c => ({
                id: c.nodeId, status: 'completed',
                data: { ...c, thinking: c.thinking || [], result: c.result || '', hasResult: !!c.result, isThinkingExpanded: true, isResultExpanded: true }
              })));
            }
          } else if (event.type === 'node_status' || event.type === 'status') {
            if (event.nodeId) {
              const status = event.status === 'completed' ? 'completed' : 'running';
              updateNodeStatus(event.nodeId, status);
              if (status === 'running') {
                scrollToNode(event.nodeId);
                // 自动跟随时同步右侧面板到运行节点
                if (autoTrackEnabledRef.current) {
                  const storeState = useWorkflowStore.getState();
                  const runningNode = storeState.nodes.find(n => n.id === event.nodeId);
                  if (runningNode) handleNodeSelect(runningNode);
                }
              }
            }
          } else if (event.type === 'thinking') {
            if (event.nodeId) {
              const existingThinking = nodeThinkingMap.get(event.nodeId) || [];
              existingThinking.push(event.delta);
              nodeThinkingMap.set(event.nodeId, existingThinking);
              updateNodeData(event.nodeId, { thinking: [...existingThinking], thinkingIndex: existingThinking.length, isThinkingExpanded: true });
            }
          } else if (event.type === 'result') {
            if (event.nodeId) updateNodeResult(event.nodeId, event.delta, nodeThinkingMap.get(event.nodeId) || []);
          } else if (event.type === 'data') {
            if (event.nodeId && event.data) updateNodeData(event.nodeId, { ...event.data, hasResult: true });
          } else if (event.type === 'videos') {
            if (event.nodeId && event.videos) updateNodeData(event.nodeId, { videos: event.videos, hasResult: true });
          } else if (event.type === 'complete') {
            setIsRunning(false);
            localStorage.removeItem(`execution_${projectId}`);
            sseConnection.close();
            // 派发工作流完成事件，让 NodeWorkspace 刷新版本列表
            document.dispatchEvent(new CustomEvent('workflowComplete'));
          } else if (event.type === 'error') {
            setIsRunning(false);
            sseConnection.close();
          }
        },
        (error) => {
          setIsRunning(false);
        },
        upstreamContext
      );
    } catch (error) {
      setIsRunning(false);
    }
  }, [projectId, projectVersion, selectedNodeId, setIsRunning, batchUpdateNodes, updateNodeStatus, updateNodeData, updateNodeResult, scrollToNode, handleNodeSelect]);

  // 更新 ref 以便在其他回调中使用 executeWorkflowWithBackend
  useEffect(() => {
    executeWorkflowRef.current = executeWorkflowWithBackend;
  }, [executeWorkflowWithBackend]);

  // 运行工作流
  // mode: 'direct' | 'restart' | 'continue' | 'fromCurrent' | 'currentOnly'
  const simulateRun = useCallback(async (mode = 'direct') => {
    if (nodes.length === 0) {
      return;
    }

    // 如果有 projectId，调用后端执行
    if (projectId) {
      await executeWorkflowRef.current?.(mode);
      return;
    }
    setIsRunning(true);

    // 计算起始节点
    let startNodes = [];
    if (mode === 'fromCurrent' && selectedNodeId) {
      // 从当前选中节点开始
      startNodes = [nodes.find(n => n.id === selectedNodeId)].filter(Boolean);
    } else if (mode === 'currentOnly' && selectedNodeId) {
      // 仅运行当前节点
      startNodes = [nodes.find(n => n.id === selectedNodeId)].filter(Boolean);
    } else if (mode === 'continue') {
      // 继续运行：跳过已完成的节点
      startNodes = nodes.filter(node => node.status !== 'completed');
    } else {
      // 默认从头开始或直接运行
      startNodes = nodes.filter(node => !connections.some(conn => conn.to === node.id));
      if (startNodes.length === 0) startNodes = [nodes[0]];
    }

    const visited = new Set();

    const runNode = async (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const thinkingSteps = generateThinkingContent(node.type);
      updateNode(nodeId, { status: 'running' });
      updateNodeData(nodeId, { thinking: thinkingSteps, thinkingIndex: 0 });

      for (let i = 0; i < thinkingSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateNodeData(nodeId, { thinkingIndex: i + 1 });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateNode(nodeId, { status: 'completed', data: { result: generateResultContent(node.type), script: node.type === 'content' ? generateResultContent(node.type) : nodes.find(n => n.id === nodeId)?.data?.script, hasResult: true, timestamp: new Date().toISOString() } });

      const downstreamConnections = connections.filter(conn => conn.from === nodeId);
      for (const conn of downstreamConnections) await runNode(conn.to);
    };

    await Promise.all(startNodes.map(node => runNode(node.id)));
    setTimeout(() => { nodes.forEach(n => updateNodeStatus(n.id, 'idle')); setIsRunning(false); }, 2000);
  }, [nodes, connections, projectId, selectedNodeId, setIsRunning, updateNode, updateNodeData, updateNodeStatus]);

  // 清空画布
  const handleClearCanvas = useCallback(() => {
    nodes.forEach(n => deleteNode(n.id));
    connections.forEach(c => deleteConnection(c.id));
    setSelectedNodeId(null);
  }, [nodes, connections, deleteNode, deleteConnection]);

  // 关闭智能体库
  const handleCloseLibrary = useCallback(() => {
    setShowLibrary(false);
  }, []);

  // 保存模板（改为保存团队）
  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim()) return;
    try {
      // 构造 DAG 数据
      const dag = {
        nodes: nodes.map(node => ({
          nodeId: node.id,
          agentId: node.agentId,
          agentCode: node.agentCode || node.type,
          inputParam: node.data || {}
        })),
        edges: connections.map(conn => ({
          fromNodeId: conn.from,
          toNodeId: conn.to
        }))
      };

      // 调用团队保存 API
      const res = await teamApi.save({
        teamName: templateName,
        teamDescribe: templateDescribe || '',  // 新增描述字段
        tags: [],
        dag
      });

      if (res.code === 200) {
        // 同时存本地一份
        const savedTeams = JSON.parse(localStorage.getItem('customTeams') || '[]');
        savedTeams.push({ id: `local-${Date.now()}`, name: templateName, nodes, connections, createdAt: new Date().toISOString() });
        localStorage.setItem('customTeams', JSON.stringify(savedTeams));

        setShowSaveTemplateDialog(false);
        setTemplateName('');
        setTemplateDescribe('');
        toast.success('保存成功', { position: 'bottom' });
      } else {
        toast.error('保存失败：' + (res.message || '未知错误'), { position: 'bottom' });
      }
    } catch (error) {
      canvasLogger.error('[NodeCanvas] 保存团队失败:', error);
      toast.error('保存失败，请重试', { position: 'bottom' });
    }
  }, [templateName, templateDescribe, nodes, connections]);

  // T044: 处理运行结果操作
  const handleResultAction = useCallback((action, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (action === 'replace') {
      // TODO: 替换当前选中的资产
      toast.success('已替换当前资产', { position: 'bottom' });
    } else if (action === 'createNew') {
      // TODO: 创建为新资产并添加到故事板
      toast.success('已创建为新资产', { position: 'bottom' });
    }

    // 关闭对话框
    setResultDialog({ isOpen: false, result: null, nodeId: null });
  }, [nodes]);

  return (
    <div className={`node-canvas-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 顶部工具栏 */}
      <CanvasToolbar
          isRunning={isRunning}
          isFullscreen={isFullscreen}
          templates={templates}
          loadingAgents={loadingAgents}
          onToggleLibrary={() => !isDemoMode && setShowLibrary(!showLibrary)}
          onRun={!isDemoMode ? simulateRun : () => {}}
          onSaveTemplate={() => !isDemoMode && setShowSaveTemplateDialog(true)}
          onClearCanvas={!isDemoMode ? handleClearCanvas : () => {}}
          onToggleFullscreen={onToggleFullscreen}
          onLoadTemplate={!isDemoMode ? loadTemplate : () => {}}
          onReturnToStoryboard={onReturnToStoryboard}
          runButtonText={runButtonText}
          runExplanation={runExplanation}
          hasStaleNodes={hasStaleNodes}
        />

      {/* 全屏模式悬浮工具栏 */}
      {isFullscreen && (
        <FullscreenToolbar
          isRunning={isRunning}
          templates={templates}
          loadingAgents={loadingAgents}
          onToggleLibrary={() => !isDemoMode && setShowLibrary(!showLibrary)}
          onRun={!isDemoMode ? simulateRun : () => {}}
          onSaveTemplate={() => !isDemoMode && setShowSaveTemplateDialog(true)}
          onClearCanvas={!isDemoMode ? handleClearCanvas : () => {}}
          onToggleFullscreen={onToggleFullscreen}
          onLoadTemplate={!isDemoMode ? loadTemplate : () => {}}
        />
      )}

      {/* 左侧智能体库 */}
      <AnimatePresence>
        {showLibrary && !isDemoMode && (
          <AgentLibrary
            agents={agentTypes}
            onDragAgent={handleAddNode}
            onClose={handleCloseLibrary}
            loading={loadingAgents}
          />
        )}
      </AnimatePresence>

      {/* 画布主体 */}
      <div
        ref={canvasRef}
        className="canvas-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="canvas-world"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: '0 0' }}
        >
          <div className="canvas-grid" />

          {/* 连线 - 简化视图中只显示可见节点之间的连接 */}
          <svg className="connections-layer" width="5000" height="5000" viewBox="0 0 5000 5000">
            {connections
              .filter(conn => {
                if (!isSimplifiedView) return true;
                // 简化视图：只显示可见节点之间的连接
                const fromVisible = visibleNodes.some(n => n.id === conn.from);
                const toVisible = visibleNodes.some(n => n.id === conn.to);
                return fromVisible && toVisible;
              })
              .map(conn => (
                <NodeConnection key={conn.id} connection={conn} nodes={visibleNodes} isRunning={isRunning} portPositions={portPositions} />
              ))}
            {isConnecting && connectingFrom && (
              <DraggingConnectionLine fromNode={visibleNodes.find(n => n.id === connectingFrom.nodeId)} mousePos={connectingMousePos} portPositions={portPositions} />
            )}
          </svg>

          {/* 节点 */}
          {visibleNodes.map(node => (
            <RichAgentNode
              key={node.id}
              node={node}
              scale={scale}
              projectId={projectId}
              projectVersion={projectVersion}
              isSelected={selectedNodeId === node.id}
              isRunning={node.status === 'running'}
              isDemoMode={isDemoMode}
              isDimmed={selectedNodeId && !highlightedNodeIds.has(node.id)}
              onSelect={() => handleNodeSelect(node)}
              onDelete={() => !isDemoMode && handleDeleteNode(node.id)}
              onUpdatePosition={!isDemoMode ? handleUpdateNodePosition : () => {}}
              onUpdateData={!isDemoMode ? handleUpdateNodeData : () => {}}
              onStartConnection={!isDemoMode ? startConnection : () => {}}
              onCompleteConnection={!isDemoMode ? completeConnection : () => {}}
              onAddConnectedNode={!isDemoMode ? addConnectedNode : () => {}}
              isConnecting={isDemoMode ? false : isConnecting}
              connectingFrom={isDemoMode ? null : connectingFrom}
              availableAgents={Object.values(agentTypes)}
              onBringToFront={() => setSelectedNodeId(node.id)}
              onDimensionChange={handleNodeDimensionChange}
              onAddNode={!isDemoMode ? addConnectedNode : () => {}}
              onPortPositionChange={handlePortPositionChange}
              onGenerateVideoNodes={handleGenerateVideoNodes}
              onGenerateVideo={onGenerateVideo}
            />
          ))}

          {/* P3: 简化视图收拢节点占位符 */}
          {collapsedPlaceholder && (
            <div
              className="collapsed-nodes-placeholder"
              style={{
                position: 'absolute',
                left: collapsedPlaceholder.x,
                top: collapsedPlaceholder.y,
                transform: 'translateY(-50%)',
              }}
              onClick={() => setIsSimplifiedView(false)}
              title={`展开 ${collapsedPlaceholder.collapsedCount} 个节点`}
            >
              <span className="collapsed-count">⋯</span>
              <span className="collapsed-label">{collapsedPlaceholder.collapsedCount} 个节点</span>
            </div>
          )}
        </div>

        {/* 空状态引导 */}
        {nodes.length === 0 && (
          <div className="canvas-empty-state">
            <div className="canvas-empty-state-icon">
              <Workflow size={36} />
            </div>
            <div className="canvas-empty-state-title">画布空白</div>
            <div className="canvas-empty-state-desc">
              从左侧智能体库拖入节点，<br />或在模板中选择一个预设流程开始
            </div>
            <div
              className="canvas-empty-state-hint"
              onClick={() => setShowLibrary(true)}
            >
              <Plus size={14} />
              打开智能体库
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <CanvasStatusBar scale={scale} nodesCount={nodes.length} connectionsCount={connections.length} />

      {/* P3: 简化视图切换按钮 */}
      {nodes.length > 0 && (
        <button
          className="simplified-view-toggle"
          onClick={() => setIsSimplifiedView(!isSimplifiedView)}
          title={isSimplifiedView ? '全部展开' : '简化视图'}
        >
          {isSimplifiedView ? '☰ 全部展开' : '◎ 简化视图'}
        </button>
      )}

      {/* 自动跟踪提示 */}
      <AnimatePresence>
        {showTrackTip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 14,
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            已退出自动跟踪模式，你可以手动滚动画布
          </motion.div>
        )}
      </AnimatePresence>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />

      {/* 保存模板对话框 */}
      <SaveTemplateDialog
        isOpen={showSaveTemplateDialog}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        templateDescribe={templateDescribe}
        onTemplateDescribeChange={setTemplateDescribe}
        onSave={handleSaveTemplate}
        onClose={() => setShowSaveTemplateDialog(false)}
      />

      {/* T044: 运行结果对话框 */}
      <ResultDialog
        isOpen={resultDialog.isOpen}
        result={resultDialog.result}
        onReplace={() => handleResultAction('replace', resultDialog.nodeId)}
        onCreateNew={() => handleResultAction('createNew', resultDialog.nodeId)}
        onCancel={() => setResultDialog({ isOpen: false, result: null, nodeId: null })}
      />
    </div>
  );
};

export default NodeCanvas;
