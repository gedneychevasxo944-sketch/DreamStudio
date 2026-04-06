import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import AgentLibrary from './AgentLibrary';
import NodeConnection from './NodeConnection';
import DraggingConnectionLine from './DraggingConnectionLine';
import AgentSettings from '../AgentSettings/AgentSettings';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import RichAgentNode from './RichAgentNode';
import { workSpaceApi, teamApi, agentApi } from '../../services/api';
import { useWorkflowStore, calculateNodePositions } from '../../stores';
import { CanvasToolbar, CanvasStatusBar, FullscreenToolbar, SaveTemplateDialog } from '../Canvas';
import './NodeCanvas.css';

// 获取节点默认宽度（统一700px）
const getDefaultNodeWidth = (nodeType) => {
  return 700;
};

// 思考内容生成
const generateThinkingContent = (nodeType) => {
  const thinkings = {
    producer: ['正在分析项目可行性...', '评估预算和资源需求...', '制定项目时间线...', '生成项目立项书...'],
    content: ['构建故事框架...', '设计角色弧线...', '编写分场剧本...', '优化对白和节奏...'],
    visual: ['分析视觉风格参考...', '生成概念草图...', '优化色彩和构图...', '输出文生图指令...'],
    director: ['分析剧本节奏...', '设计镜头语言...', '规划运镜方案...', '生成分镜脚本...'],
    technical: ['解析视觉输入...', '优化视频提示词...', '配置生成参数...', '打包输出指令...'],
    auditor: ['审核内容质量...', '检查合规性...', '评估技术指标...', '生成审核报告...']
  };
  return thinkings[nodeType] || ['处理中...', '分析输入...', '生成输出...'];
};

// 结果内容生成
const generateResultContent = (nodeType) => {
  const results = {
    producer: '项目立项完成，预算500万，周期6个月',
    content: '第一场 日 外 城市街道\n\n繁华的都市街头，人来人往...',
    visual: '概念美术完成，8张关键场景图',
    director: '分镜脚本完成，45个镜头设计',
    technical: '视频提示词包生成，15组指令',
    auditor: '审核通过，质量评分92/100'
  };
  return results[nodeType] || '任务执行完成';
};

const NodeCanvas = ({ isFullscreen, onToggleFullscreen, projectId, projectVersion }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [connectingMousePos, setConnectingMousePos] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAgentSettings, setShowAgentSettings] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
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

  // 用于存储 executeWorkflowWithBackend 的 ref，避免初始化顺序问题
  const executeWorkflowRef = useRef(null);

  // 节点尺寸报告回调
  const handleNodeDimensionChange = useCallback((nodeId, width, height) => {
    setNodeDimensions(prev => ({ ...prev, [nodeId]: { width, height } }));
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

    const handleTouchEnd = () => { isTouching = false; };

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
  }, []);

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
            // 使用统一的节点位置计算函数
            const nodesWithPositions = calculateNodePositions(nodesWithPosition, {
              startX: 50,
              startY: 200,
              gap: 100,  // 节点之间的间距
            });
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
        console.error('[NodeCanvas] Failed to load data:', error);
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
    const gap = 100;
    const startY = 200;

    // 计算最右侧节点的 endX
    const maxEndX = nodes.reduce((max, n) => {
      const nodeWidth = getDefaultNodeWidth(n.type || n.agentCode);
      return Math.max(max, n.x + nodeWidth);
    }, 50);

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
          alert(`数据类型不匹配: ${fromOutput.type} → ${toInput.type}`);
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
    const gap = 100;
    const startY = 200;
    const maxEndX = nodes.reduce((max, n) => {
      const nodeWidth = getDefaultNodeWidth(n.type || n.agentCode);
      return Math.max(max, n.x + nodeWidth);
    }, 50);
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
            if (event.nodeId) updateNodeStatus(event.nodeId, event.status === 'completed' ? 'completed' : 'running');
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
        (error) => { console.error('SSE error:', error); setIsRunning(false); }
      );
    } catch (error) {
      console.error('Failed to execute new video nodes:', error);
      setIsRunning(false);
    }
  }, [projectId, projectVersion, setIsRunning, updateNodeStatus, updateNodeData, updateNodeResult]);

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
    const sourceNodeWidth = 540;
    const horizontalGap = 300;
    const baseX = sourceNode.x + sourceNodeWidth + horizontalGap;
    const baseY = sourceNode.y;
    const videoGenNodeHeight = 300;
    const verticalGap = 150;

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
        y: baseY + nodeIndex * (videoGenNodeHeight + verticalGap),
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

  // 执行工作流（带后端API）
  const executeWorkflowWithBackend = useCallback(async () => {
    // 使用 useWorkflowStore.getState() 获取最新状态，避免闭包问题
    const storeState = useWorkflowStore.getState();
    const currentNodes = storeState.nodes;
    const currentConnections = storeState.connections;

    if (!projectId || currentNodes.length === 0) return;
    setIsRunning(true);

    const nodeThinkingMap = new Map();
    const savedExecutionId = localStorage.getItem(`execution_${projectId}`);
    const executionId = savedExecutionId ? parseInt(savedExecutionId, 10) : null;

    console.log('[DEBUG executeWorkflow] calling workSpaceApi.executeWorkflow...');

    try {
      const sseConnection = workSpaceApi.executeWorkflow(
        projectId, executionId, projectVersion, currentNodes, currentConnections,
        (event) => {
          if (event.type === 'init') {
            localStorage.setItem(`execution_${projectId}`, event.executionId.toString());
            if (event.completedNodes?.length > 0) {
              batchUpdateNodes(event.completedNodes.map(c => ({
                id: c.nodeId, status: 'completed',
                data: { ...c, thinking: c.thinking || [], result: c.result || '', hasResult: !!c.result, isThinkingExpanded: true, isResultExpanded: true }
              })));
            }
          } else if (event.type === 'node_status' || event.type === 'status') {
            if (event.nodeId) updateNodeStatus(event.nodeId, event.status === 'completed' ? 'completed' : 'running');
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
          } else if (event.type === 'error') {
            setIsRunning(false);
            sseConnection.close();
          }
        },
        (error) => { setIsRunning(false); }
      );
    } catch (error) {
      setIsRunning(false);
    }
  }, [projectId, projectVersion, setIsRunning, batchUpdateNodes, updateNodeStatus, updateNodeData, updateNodeResult]);

  // 更新 ref 以便在其他回调中使用 executeWorkflowWithBackend
  useEffect(() => {
    executeWorkflowRef.current = executeWorkflowWithBackend;
  }, [executeWorkflowWithBackend]);

  // 运行工作流
  const simulateRun = useCallback(async () => {
    if (nodes.length === 0) return;
    if (projectId) { await executeWorkflowRef.current?.(); return; }

    setIsRunning(true);
    const startNodes = nodes.filter(node => !connections.some(conn => conn.to === node.id));
    const nodesToRun = startNodes.length > 0 ? startNodes : [nodes[0]];
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

    await Promise.all(nodesToRun.map(node => runNode(node.id)));
    setTimeout(() => { nodes.forEach(n => updateNodeStatus(n.id, 'idle')); setIsRunning(false); }, 2000);
  }, [nodes, connections, projectId, setIsRunning, updateNode, updateNodeData, updateNodeStatus]);

  // 清空画布
  const handleClearCanvas = useCallback(() => {
    nodes.forEach(n => deleteNode(n.id));
    connections.forEach(c => deleteConnection(c.id));
    setSelectedNodeId(null);
  }, [nodes, connections, deleteNode, deleteConnection]);

  // 打开智能体设置
  const handleOpenAgentSettings = useCallback((node) => {
    setEditingAgent(node);
    setShowAgentSettings(true);
  }, []);

  // 关闭智能体库
  const handleCloseLibrary = useCallback(() => {
    setShowLibrary(false);
  }, []);

  // 保存智能体设置
  const handleSaveAgentSettings = useCallback((settings) => {
    if (editingAgent) updateNode(editingAgent.id, settings);
    setShowAgentSettings(false);
    setEditingAgent(null);
  }, [editingAgent, updateNode]);

  // 复制智能体
  const handleDuplicateAgent = useCallback((agent) => {
    const newNodeId = `${agent.type}-custom-${Date.now()}`;
    addNode({ ...agent, id: newNodeId, name: `${agent.name} (副本)`, category: '自定义', x: agent.x + 50, y: agent.y + 50, initialPrompt: agent.initialPrompt || '', selfEvolutionPrompt: agent.selfEvolutionPrompt || '' });
    setEditingAgent(null);
  }, [addNode]);

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
        alert('团队保存成功！');
      } else {
        alert('保存失败：' + (res.message || '未知错误'));
      }
    } catch (error) {
      console.error('保存团队失败:', error);
      alert('保存失败，请重试');
    }
  }, [templateName, templateDescribe, nodes, connections]);

  return (
    <div className={`node-canvas-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 顶部工具栏 */}
      <CanvasToolbar
        isRunning={isRunning}
        isFullscreen={isFullscreen}
        templates={templates}
        loadingAgents={loadingAgents}
        showLibrary={showLibrary}
        onToggleLibrary={() => setShowLibrary(!showLibrary)}
        onRun={simulateRun}
        onSaveTemplate={() => setShowSaveTemplateDialog(true)}
        onClearCanvas={handleClearCanvas}
        onToggleFullscreen={onToggleFullscreen}
        onLoadTemplate={loadTemplate}
      />

      {/* 全屏模式悬浮工具栏 */}
      {isFullscreen && (
        <FullscreenToolbar
          isRunning={isRunning}
          templates={templates}
          loadingAgents={loadingAgents}
          onToggleLibrary={() => setShowLibrary(!showLibrary)}
          onRun={simulateRun}
          onSaveTemplate={() => setShowSaveTemplateDialog(true)}
          onClearCanvas={handleClearCanvas}
          onToggleFullscreen={onToggleFullscreen}
          onLoadTemplate={loadTemplate}
        />
      )}

      {/* 左侧智能体库 */}
      <AnimatePresence>
        {showLibrary && (
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

          {/* 连线 */}
          <svg className="connections-layer" width="5000" height="5000" viewBox="0 0 5000 5000">
            {connections.map(conn => (
              <NodeConnection key={conn.id} connection={conn} nodes={nodes} isRunning={isRunning} portPositions={portPositions} />
            ))}
            {isConnecting && connectingFrom && (
              <DraggingConnectionLine fromNode={nodes.find(n => n.id === connectingFrom.nodeId)} mousePos={connectingMousePos} portPositions={portPositions} />
            )}
          </svg>

          {/* 节点 */}
          {nodes.map(node => (
            <RichAgentNode
              key={node.id}
              node={node}
              scale={scale}
              projectId={projectId}
              projectVersion={projectVersion}
              isSelected={selectedNodeId === node.id}
              isRunning={node.status === 'running'}
              onSelect={() => setSelectedNodeId(node.id)}
              onDelete={() => handleDeleteNode(node.id)}
              onEdit={() => handleOpenAgentSettings(node)}
              onUpdatePosition={handleUpdateNodePosition}
              onUpdateData={handleUpdateNodeData}
              onStartConnection={startConnection}
              onCompleteConnection={completeConnection}
              onAddConnectedNode={addConnectedNode}
              isConnecting={isConnecting}
              connectingFrom={connectingFrom}
              availableAgents={Object.values(agentTypes)}
              onOpenSettings={handleOpenAgentSettings}
              onBringToFront={() => setSelectedNodeId(node.id)}
              onDimensionChange={handleNodeDimensionChange}
              onAddNode={addConnectedNode}
              onPortPositionChange={handlePortPositionChange}
              onGenerateVideoNodes={handleGenerateVideoNodes}
            />
          ))}
        </div>
      </div>

      {/* 底部状态栏 */}
      <CanvasStatusBar scale={scale} nodesCount={nodes.length} connectionsCount={connections.length} />

      {/* 智能体设置弹窗 */}
      <AnimatePresence>
        {showAgentSettings && (
          <AgentSettings
            agent={editingAgent}
            onClose={() => setShowAgentSettings(false)}
            onSave={handleSaveAgentSettings}
            onDuplicate={handleDuplicateAgent}
          />
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
    </div>
  );
};

export default NodeCanvas;
