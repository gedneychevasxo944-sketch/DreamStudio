import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Grid, Save, FolderOpen, Plus, Settings, Play, Pause, Loader2, Trash2 } from 'lucide-react';
import AgentNode from './AgentNode';
import RichAgentNode from './RichAgentNode';
import AgentLibrary from './AgentLibrary';
import PipelineTemplates from './PipelineTemplates';
import NodeConnection from './NodeConnection';
import DraggingConnectionLine from './DraggingConnectionLine';
import AgentSettings from '../AgentSettings/AgentSettings';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { workSpaceApi } from '../../services/api';
import { COMPONENT_TYPE, COMPONENT_INFO } from '../../constants/ComponentType';
import './NodeCanvas.css';

// 获取节点默认宽度
const getDefaultNodeWidth = (nodeType) => {
  // 美术、分镜和技术节点默认宽度为1.5倍
  if (nodeType === 'visual' || nodeType === 'director' || nodeType === 'technical') {
    return 540; // 360 * 1.5
  }
  return 360;
};

// 动态计算节点位置
const calculateNodePositions = (columns, startX = 50, startY = 200, gap = 100) => {
  const nodes = [];
  let currentX = startX;

  columns.forEach((column) => {
    const { type, label } = column;
    const nodeWidth = getDefaultNodeWidth(type);

    nodes.push({
      id: type,
      type: type,
      x: currentX,
      y: startY,
      label: label
    });

    currentX += nodeWidth + gap;
  });

  return nodes;
};

// 智能体类型定义（备用，当API不可用时）
const AGENT_TYPES = {
  producer: {
    id: 'producer',
    name: '资深影视制片人',
    category: '官方认证',
    icon: 'Target',
    inputs: [{ id: 'idea', label: '原始想法', type: 'text' }],
    outputs: [{ id: 'proposal', label: '项目立项书', type: 'document' }],
    color: '#3b82f6'
  },
  content: {
    id: 'content',
    name: '金牌编剧',
    category: '官方认证',
    icon: 'PenTool',
    inputs: [{ id: 'proposal', label: '项目立项书', type: 'document' }],
    outputs: [{ id: 'script', label: '分场剧本', type: 'document' }],
    color: '#06b6d4'
  },
  visual: {
    id: 'visual',
    name: '概念美术总监',
    category: '官方认证',
    icon: 'Palette',
    inputs: [{ id: 'script', label: '分场剧本', type: 'document' }],
    outputs: [{ id: 'assets', label: '文生图指令', type: 'image-prompt' }],
    color: '#8b5cf6'
  },
  director: {
    id: 'director',
    name: '分镜导演',
    category: '官方认证',
    icon: 'Video',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    color: '#f59e0b'
  },
  technical: {
    id: 'technical',
    name: '视频提示词工程师',
    category: '官方认证',
    icon: 'Code',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    color: '#10b981'
  },
  // 不同类型的审核智能体
};

const NodeCanvas = ({ isFullscreen, onToggleFullscreen, onAddExecutionLog, onSetRunning, isRunning, onNodesChange, onConnectionsChange, initialNodes, initialConnections, projectId, projectVersion }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
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

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  // 节点尺寸报告回调
  const handleNodeDimensionChange = useCallback((nodeId, width, height) => {
    setNodeDimensions(prev => ({
      ...prev,
      [nodeId]: { width, height }
    }));
  }, []);

  // 端口位置报告回调 - 使用节点坐标和实际宽度计算
  const handlePortPositionChange = useCallback((nodeId, portType, pos) => {
    // 使用子组件传递的实际位置，不再重新计算
    setPortPositions(prev => {
      const newPos = {
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          [portType]: pos
        }
      };
      return newPos;
    });
  }, []);

  // 处理 wheel 事件（需要 passive: false 才能 preventDefault）
  // 以及触摸事件防止浏览器边缘手势触发返回
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
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

    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTouching = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouching) return;
      if (e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;

      const isEdgeTouch = touchStartX < 30 || touchStartX > window.innerWidth - 30;
      if (isEdgeTouch && Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
    };

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
        // 并行加载智能体列表和流派预设
        const [agentsRes, workflowsRes] = await Promise.all([
          workSpaceApi.getAgents(),
          workSpaceApi.getWorkflows()
        ]);

        // 处理智能体列表
        if (agentsRes.code === 200 && agentsRes.data) {
          const agentsMap = {};
          agentsRes.data.agents.forEach(agent => {
            agentsMap[agent.type] = {
              id: agent.type,
              name: agent.name,
              category: agent.category,
              icon: agent.icon,
              color: agent.color,
              inputs: agent.inputs || [],
              outputs: agent.outputs || [],
            };
          });
          setAgentTypes(agentsMap);
          console.log('[NodeCanvas] Loaded agents:', Object.keys(agentsMap).length);
        }

        // 处理流派预设（从API获取）
        if (workflowsRes.code === 200 && workflowsRes.data) {
          const templateList = workflowsRes.data.workflows.map(wf => {
            // 计算节点位置
            const nodes = calculateNodePositions(
              wf.nodes.map(n => ({
                type: n.type,
                label: n.label
              }))
            );
            return {
              id: wf.id,
              name: wf.name,
              description: wf.description,
              category: wf.id,
              nodes: nodes,
              connections: wf.connections,
            };
          });
          setTemplates(templateList);
          console.log('[NodeCanvas] Loaded workflows:', templateList.length);
        }
      } catch (error) {
        console.error('[NodeCanvas] Failed to load data:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadData();
  }, []);

  // 监听 nodes 变化，通知父组件
  useEffect(() => {
    onNodesChange?.(nodes);
  }, [nodes, onNodesChange]);

  // 监听 connections 变化，通知父组件
  useEffect(() => {
    onConnectionsChange?.(connections);
  }, [connections, onConnectionsChange]);

  // 监听外部传入的初始节点和连线
  useEffect(() => {
    console.log('[NodeCanvas] useEffect 触发, initialNodes:', initialNodes?.length, 'agentTypes:', Object.keys(agentTypes).length);
    if (initialNodes && initialNodes.length > 0 && Object.keys(agentTypes).length > 0) {
      // 将外部节点转换为内部节点格式，从 agentTypes 获取完整的属性
      const formattedNodes = initialNodes.map(node => {
        const agentType = agentTypes[node.type] || agentTypes[1]; // 默认使用第一个智能体
        // 合并节点数据：优先使用 agentType 的属性，用 node 的属性覆盖位置相关的字段
        return {
          ...agentType, // 先展开 agentType 中的所有属性（name, icon, color, inputs, outputs 等）
          id: node.id,  // 使用传入的 id
          x: node.x,    // 使用传入的 x 坐标
          y: node.y,    // 使用传入的 y 坐标
          type: node.type || 'agent',
          status: 'idle'
        };
      });
      
      console.log('[NodeCanvas] formattedNodes:', formattedNodes.length);
      
      // 检查是否需要添加节点（避免重复）
      setNodes(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNodes = formattedNodes.filter(n => !existingIds.has(n.id));
        console.log('[NodeCanvas] setNodes, existing:', prev.length, 'new:', newNodes.length);
        if (newNodes.length > 0) {
          return [...prev, ...newNodes];
        }
        return prev;
      });
      
      // 处理连线
      if (initialConnections && initialConnections.length > 0) {
        console.log('[NodeCanvas] 处理连线:', initialConnections.length);
        setConnections(prev => {
          const existingConns = new Set(prev.map(c => `${c.from}-${c.to}`));
          const newConns = initialConnections.filter(c => !existingConns.has(`${c.from}-${c.to}`));
          console.log('[NodeCanvas] setConnections, existing:', prev.length, 'new:', newConns.length);
          if (newConns.length > 0) {
            return [...prev, ...newConns];
          }
          return prev;
        });
      }
    }
  }, [initialNodes, initialConnections, agentTypes]);

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
        onToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  // 加载预设模板
  const loadTemplate = useCallback((templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template && Object.keys(agentTypes).length > 0) {
      // 将后端模板节点转换为前端格式
      const loadedNodes = template.nodes.map(n => {
        const agentData = agentTypes[n.type];
        if (!agentData) {
          console.warn(`[loadTemplate] Agent type not found: ${n.type}`);
        }
        return {
          ...(agentData || {
            id: n.type,
            name: n.type,
            category: '未知',
            icon: 'Bot',
            color: '#888888',
            inputs: [{ id: 'input', label: '输入', type: 'any' }],
            outputs: [{ id: 'output', label: '输出', type: 'any' }]
          }),
          id: n.id,
          type: n.type,
          x: n.x,
          y: n.y,
          status: 'idle'
        };
      });
      setNodes(loadedNodes);

      setConnections(template.connections.map((conn, index) => {
        // 查找源节点和目标节点以获取端口ID
        const fromNode = loadedNodes.find(n => n.id === conn.from);
        const toNode = loadedNodes.find(n => n.id === conn.to);
        const fromPortId = fromNode?.outputs?.[0]?.id || 'output';
        const toPortId = toNode?.inputs?.[0]?.id || 'input';

        return {
          ...conn,
          id: `${conn.from}-${conn.to}-${index}`,
          fromPort: fromPortId,
          toPort: toPortId
        };
      }));
    }
  }, [templates, agentTypes]);

  // 添加节点
  const addNode = useCallback((agentType, x, y) => {
    const nodeWidth = 200;
    const nodeHeight = 80;
    const gap = nodeWidth; // 一个卡片长度的间距
    
    // 计算画布坐标
    let newX = x - position.x / scale;
    let newY = y - position.y / scale;
    
    // 检查是否与其他节点重叠，如果是则自动偏移
    const findNonOverlappingPosition = (baseX, baseY) => {
      let offsetX = 0;
      let offsetY = 0;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (attempts < maxAttempts) {
        const testX = baseX + offsetX;
        const testY = baseY + offsetY;
        
        const hasOverlap = nodes.some(node => {
          return (
            testX < node.x + nodeWidth + gap &&
            testX + nodeWidth + gap > node.x &&
            testY < node.y + nodeHeight + gap &&
            testY + nodeHeight + gap > node.y
          );
        });
        
        if (!hasOverlap) {
          return { x: testX, y: testY };
        }
        
        // 向右下方偏移，间距200px
        offsetX += nodeWidth + gap;
        if (offsetX > 600) {
          offsetX = 0;
          offsetY += nodeHeight + gap;
        }
        attempts++;
      }
      
      return { x: baseX + nodeWidth + gap, y: baseY }; // 如果找不到，就放在右边远处
    };
    
    const { x: finalX, y: finalY } = findNonOverlappingPosition(newX, newY);
    
    const agentTypeData = agentTypes[agentType] || Object.values(agentTypes)[0];
    if (!agentTypeData) return;
    
    const newNode = {
      id: `${agentType}-${Date.now()}`,
      type: agentType,
      x: finalX,
      y: finalY,
      ...agentTypeData
    };
    setNodes(prev => [...prev, newNode]);
  }, [position, scale, nodes, agentTypes]);

  // 画布拖拽
  const handleMouseDown = (e) => {
    // 只有在没有点击节点或端口时才开始画布拖拽
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
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    // 更新连线时的鼠标位置
    if (isConnecting) {
      // 将屏幕坐标转换为画布坐标
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
    // 如果在连线状态，则取消连线（无论点击哪里，只要不是完成连线）
    if (isConnecting) {
      // 检查是否点击在输入端口上，如果不是则取消
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

  // 取消连线
  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setConnectingFrom(null);
  }, []);

  // 完成连线
  const completeConnection = (toNodeId, toPortId) => {
    if (isConnecting && connectingFrom) {
      // 检查类型匹配
      const fromNode = nodes.find(n => n.id === connectingFrom.nodeId);
      const toNode = nodes.find(n => n.id === toNodeId);
      
      if (fromNode && toNode) {
        const fromOutput = fromNode.outputs.find(o => o.id === connectingFrom.portId);
        const toInput = toNode.inputs.find(i => i.id === toPortId);
        
        // 类型校验
        if (fromOutput && toInput && fromOutput.type !== toInput.type && toInput.type !== 'any') {
          alert(`数据类型不匹配: ${fromOutput.type} → ${toInput.type}`);
          setIsConnecting(false);
          setConnectingFrom(null);
          return;
        }

        const newConnection = {
          id: `${connectingFrom.nodeId}-${connectingFrom.portId}-${toNodeId}-${toPortId}`,
          from: connectingFrom.nodeId,
          fromPort: connectingFrom.portId,
          to: toNodeId,
          toPort: toPortId,
          type: 'data-flow'
        };
        
        setConnections(prev => [...prev, newConnection]);
      }
      
      setIsConnecting(false);
      setConnectingFrom(null);
    }
  };

  // 添加连接节点（从输出端口点击添加）
  const addConnectedNode = useCallback((fromNodeId, agentType) => {
    const newNodeId = `${agentType}-${Date.now()}`;
    
    // 先更新节点
    setNodes(prevNodes => {
      const fromNode = prevNodes.find(n => n.id === fromNodeId);
      if (!fromNode) return prevNodes;

      const nodeWidth = 200;
      const nodeHeight = 80;
      const gap = nodeWidth; // 一个卡片长度的间距

      const agentTypeData = agentTypes[agentType] || Object.values(agentTypes)[0];
      if (!agentTypeData) return prevNodes;
      // 注意：必须先展开 agentTypeData，再用 newNodeId 覆盖 id 字段
      const newNode = {
        ...agentTypeData,
        id: newNodeId,
        type: agentType,
        x: fromNode.x + nodeWidth + gap,
        y: fromNode.y
      };

      return [...prevNodes, newNode];
    });

    // 再更新连接（使用相同的 newNodeId）
    setConnections(prevConns => {
      const fromNode = nodes.find(n => n.id === fromNodeId);
      if (!fromNode) return prevConns;

      const agentTypeData = agentTypes[agentType] || Object.values(agentTypes)[0];
      const fromPortId = fromNode.outputs?.[0]?.id || 'output';
      const toPortId = agentTypeData.inputs?.[0]?.id || 'input';

      const newConnection = {
        id: `${fromNodeId}-${fromPortId}-${newNodeId}-${toPortId}`,
        from: fromNodeId,
        fromPort: fromPortId,
        to: newNodeId,
        toPort: toPortId,
        type: 'data-flow'
      };

      return [...prevConns, newConnection];
    });
  }, [nodes]);

  // 删除节点
  const deleteNode = useCallback((nodeId) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);

    // 检查节点是否有生成结果
    if (nodeToDelete?.data?.hasResult || nodeToDelete?.data?.result) {
      // 有结果的节点，显示自定义确认对话框
      setConfirmDialog({
        isOpen: true,
        title: '确认删除',
        message: `节点 "${nodeToDelete.name}" 已生成结果，删除后对应的资产将被清空。\n\n是否确认删除？`,
        onConfirm: () => {
          setNodes(prev => prev.filter(n => n.id !== nodeId));
          setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      // 没有结果的节点，直接删除
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    }
  }, [nodes]);

  // 更新节点位置
  const updateNodePosition = (nodeId, x, y) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, x, y } : n
    ));
  };

  // 更新节点数据
  const updateNodeData = (nodeId, data) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
    ));
  };

  // 处理自动生成视频节点
  const handleGenerateVideoNodes = useCallback((technicalNodeId, count, specificPromptId = null) => {
    // 使用函数式更新获取最新的nodes状态
    setNodes(prevNodes => {
      const technicalNode = prevNodes.find(n => n.id === technicalNodeId);
      if (!technicalNode) return prevNodes;

      const prompts = technicalNode.data?.prompts || [];
      
      // 如果指定了特定提示词ID，只生成该提示词的视频
      let promptsToGenerate = prompts;
      if (specificPromptId) {
        const specificPrompt = prompts.find(p => p.id === specificPromptId);
        if (specificPrompt) {
          promptsToGenerate = [specificPrompt];
        }
      }
      
      const actualCount = Math.min(count, promptsToGenerate.length);

      // 获取视频生成节点类型
      const videoGenType = agentTypes['videoGen'] || Object.values(agentTypes).find(a => a.name?.includes('视频生成'));
      if (!videoGenType) return prevNodes;

      // 批量创建视频生成节点
      const newNodes = [];
      const newConnections = [];
      const timestamp = Date.now();

      // 技术节点宽度（2倍 = 720px）
      const technicalNodeWidth = 720;
      // 视频生成节点宽度（2倍 = 720px）
      const videoNodeWidth = 720;
      // 节点之间的水平间距
      const horizontalGap = 100;
      // 计算新节点的x位置：技术节点右边缘 + 间距
      const baseX = technicalNode.x + technicalNodeWidth + horizontalGap;
      
      // 查找已存在的视频生成节点（由该技术节点创建的）
      const existingVideoNodes = prevNodes.filter(n => 
        n.type === 'videoGen' && 
        n.x === baseX &&
        n.id.startsWith('videoGen-')
      );
      
      // 计算起始Y位置：基于已有节点数量
      const existingCount = existingVideoNodes.length;
      const verticalSpacing = 280;

      for (let i = 0; i < actualCount; i++) {
        const newNodeId = `videoGen-${timestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        // 计算Y位置：基于已有节点 + 当前索引
        const totalIndex = existingCount + i;
        const offsetY = (totalIndex - (existingCount + actualCount - 1) / 2) * verticalSpacing;

        const newNode = {
          id: newNodeId,
          type: 'videoGen',
          name: `${videoGenType.name} ${promptsToGenerate[i]?.shotNumber || totalIndex + 1}`,
          icon: videoGenType.icon,
          color: videoGenType.color,
          inputs: videoGenType.inputs,
          outputs: videoGenType.outputs,
          x: baseX,
          y: technicalNode.y + offsetY,
          status: 'running', // 初始状态为运行中
          data: {
            ...videoGenType.data,
            videoPrompt: promptsToGenerate[i]?.prompt || '',
            sourcePromptId: promptsToGenerate[i]?.id,
            shotNumber: promptsToGenerate[i]?.shotNumber || `镜头${i + 1}`,
            genParams: {
              model: 'CogVideoX',
              quality: '720P',
              ratio: '16:9',
              duration: '10s',
              genTime: '30分钟'
            },
            timestamp: new Date().toISOString()
          }
        };

        newNodes.push(newNode);

        // 创建连接
        const newConnection = {
          id: `conn-${timestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          from: technicalNodeId,
          to: newNodeId,
          type: 'data-flow'
        };

        newConnections.push(newConnection);
      }

      // 更新连接
      setConnections(prev => [...prev, ...newConnections]);

      // 添加日志
      onAddExecutionLog({
        level: 'system',
        agent: '系统',
        content: `已自动生成 ${actualCount} 个视频生成节点，开始视频生成...`,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      });

      // 模拟视频生成过程
      newNodes.forEach((node, index) => {
        // 添加开始生成日志
        setTimeout(() => {
          onAddExecutionLog({
            level: 'info',
            agent: node.name,
            content: `开始生成视频: ${node.data.videoPrompt?.slice(0, 50)}...`,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
          });
        }, index * 500);

        // 模拟生成完成（3-5秒后）
        const genTime = 3000 + Math.random() * 2000;
        setTimeout(() => {
          // 更新节点状态为完成，并添加视频预览
          setNodes(currentNodes => currentNodes.map(n => {
            if (n.id !== node.id) return n;
            return {
              ...n,
              status: 'completed',
              data: {
                ...n.data,
                status: 'completed',
                videoPreview: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop', // 使用默认预览图
                hasResult: true
              }
            };
          }));

          // 添加完成日志
          onAddExecutionLog({
            level: 'success',
            agent: node.name,
            content: '视频生成完成',
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
          });
        }, genTime + index * 500);
      });

      return [...prevNodes, ...newNodes];
    });
  }, [onAddExecutionLog, agentTypes]);

  // 保存节点版本历史（每次运行后调用）
  const saveNodeVersion = useCallback((nodeId) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;

      const versionHistory = n.data?.versionHistory || [];
      const currentVersion = n.data?.currentVersion || 1;

      // 保存当前版本到历史（只保存必要的数据字段，避免循环引用）
      const { versionHistory: _, displayVersion: __, ...dataToSave } = n.data || {};
      const historyEntry = {
        version: currentVersion,
        timestamp: n.data?.timestamp || new Date().toISOString(),
        data: dataToSave
      };

      return {
        ...n,
        data: {
          ...n.data,
          versionHistory: [...versionHistory, historyEntry],
          currentVersion: currentVersion + 1,
          timestamp: new Date().toISOString()
        }
      };
    }));
  }, []);

  // 生成时间戳
  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
  };

  // 生成思考内容
  const generateThinkingContent = (nodeType, nodeName) => {
    const thinkings = {
      producer: [
        '正在分析项目可行性...',
        '评估预算和资源需求...',
        '制定项目时间线...',
        '生成项目立项书...'
      ],
      content: [
        '构建故事框架...',
        '设计角色弧线...',
        '编写分场剧本...',
        '优化对白和节奏...'
      ],
      visual: [
        '分析视觉风格参考...',
        '生成概念草图...',
        '优化色彩和构图...',
        '输出文生图指令...'
      ],
      director: [
        '分析剧本节奏...',
        '设计镜头语言...',
        '规划运镜方案...',
        '生成分镜脚本...'
      ],
      technical: [
        '解析视觉输入...',
        '优化视频提示词...',
        '配置生成参数...',
        '打包输出指令...'
      ],
      auditor: [
        '审核内容质量...',
        '检查合规性...',
        '评估技术指标...',
        '生成审核报告...'
      ]
    };
    return thinkings[nodeType] || ['处理中...', '分析输入...', '生成输出...'];
  };

  // 生成执行结果
  const generateResultContent = (nodeType, nodeName) => {
    const results = {
      producer: '项目立项完成，预算500万，周期6个月',
      content: `第一场 日 外 城市街道

繁华的都市街头，人来人往。车水马龙，霓虹闪烁。

主人公李明（男，30岁，西装革履）正在匆匆赶路。他看了看手表，面露焦急之色。

突然，他的手机响了。李明接起电话，脸色瞬间变得凝重。

李明："什么？怎么会这样...我马上过去。"

他挂断电话，招手拦下一辆出租车，迅速上车离去。

第二场 日 内 办公室

宽敞明亮的办公室内，李明坐在办公桌前，眉头紧锁。

他的助手小王敲门进来，递上一份文件。

小王："李总，这是您要的项目资料。"

李明接过文件，快速翻阅，然后抬起头，眼神坚定。

李明："通知所有人，半小时后开会。这个项目，我们必须拿下。"

第三场 夜 内 会议室

会议室里灯火通明，团队成员围坐在长桌旁。

李明站在投影屏幕前，指着上面的数据图表。

李明："各位，这是我们最后的机会。我知道大家都很累，但成功就在眼前。"

团队成员们互相看了看，然后纷纷点头。

团队成员A："李总，我们跟您干！"

团队成员B："对，一定能成功！"

李明露出欣慰的笑容。

李明："好！那就让我们创造奇迹！"

（完）`,
      visual: '概念美术完成，8张关键场景图',
      director: '分镜脚本完成，45个镜头设计',
      technical: '视频提示词包生成，15组指令',
      auditor: '审核通过，质量评分92/100'
    };
    return results[nodeType] || '任务执行完成';
  };

  // 使用后端API执行工作流
  const executeWorkflowWithBackend = useCallback(async (projectId, projectVersion) => {
    if (!projectId || nodes.length === 0) return;

    onSetRunning(true);

    // 存储每个节点的思考过程
    const nodeThinkingMap = new Map();
    // 存储每个节点的结果
    const nodeResultMap = new Map();

    // 从 localStorage 获取之前的 executionId
    const savedExecutionId = localStorage.getItem(`execution_${projectId}`);
    const executionId = savedExecutionId ? parseInt(savedExecutionId, 10) : null;

    try {
      // 启动工作流执行
      const sseConnection = workSpaceApi.executeWorkflow(
        projectId,
        executionId,
        projectVersion,
        nodes,
        connections,
        (event) => {
          console.log('[NodeCanvas] event:', event.type, event.nodeId);
          if (event.type === 'init') {
            const newExecutionId = event.executionId;
            // 保存 executionId 到 localStorage
            localStorage.setItem(`execution_${projectId}`, newExecutionId.toString());
            console.log('[Execution] Started with executionId:', newExecutionId);

            // 恢复已完成的节点
            if (event.completedNodes && event.completedNodes.length > 0) {
              console.log('[Execution] Restoring completed nodes:', event.completedNodes);
              setNodes(prev => prev.map(n => {
                const completed = event.completedNodes.find(c => c.nodeId === n.id);
                if (completed) {
                  nodeThinkingMap.set(n.id, completed.thinking || []);
                  nodeResultMap.set(n.id, completed.result || '');
                  return {
                    ...n,
                    status: 'completed',
                    data: {
                      ...n.data,
                      thinking: completed.thinking || [],
                      result: completed.result || '',
                      hasResult: !!completed.result,
                      isThinkingExpanded: true,
                      isResultExpanded: true,
                    }
                  };
                }
                return n;
              }));
            }
          } else if (event.type === 'status') {
            if (event.nodeId) {
              const newStatus = event.status === 'completed' ? 'completed' : 'running';
              setNodes(prev => prev.map(n =>
                n.id === event.nodeId ? {
                  ...n,
                  status: newStatus,
                  data: {
                    ...n.data,
                    isThinkingExpanded: true
                  }
                } : n
              ));
            }
            onAddExecutionLog({
              level: 'info',
              agent: event.nodeId || '系统',
              timestamp: getTimestamp(),
              thinking: event.content,
              isThinkingComplete: true
            });
          } else if (event.type === 'thinking') {
            if (event.nodeId) {
              const existingThinking = nodeThinkingMap.get(event.nodeId) || [];
              existingThinking.push(event.content);
              nodeThinkingMap.set(event.nodeId, existingThinking);

              setNodes(prev => prev.map(n =>
                n.id === event.nodeId ? {
                  ...n,
                  data: {
                    ...n.data,
                    thinking: [...existingThinking],
                    thinkingIndex: existingThinking.length,
                    isThinkingExpanded: true
                  }
                } : n
              ));
            }
          } else if (event.type === 'result') {
            if (event.nodeId) {
              nodeResultMap.set(event.nodeId, event.content);

              setNodes(prev => prev.map(n =>
                n.id === event.nodeId ? {
                  ...n,
                  status: 'completed',
                  data: {
                    ...n.data,
                    result: event.content,
                    hasResult: true,
                    resultProgress: 100,
                    isResultExpanded: true
                  }
                } : n
              ));
            }
          } else if (event.type === 'data') {
            if (event.nodeId && event.data) {
              setNodes(prev => prev.map(n =>
                n.id === event.nodeId ? {
                  ...n,
                  data: {
                    ...n.data,
                    ...event.data,
                    hasResult: true
                  }
                } : n
              ));
            }
          } else if (event.type === 'videos') {
            if (event.nodeId && event.videos) {
              setNodes(prev => prev.map(n =>
                n.id === event.nodeId ? {
                  ...n,
                  data: {
                    ...n.data,
                    videos: event.videos,
                    hasResult: true
                  }
                } : n
              ));
            }
          } else if (event.type === 'complete') {
            onSetRunning(false);
            // 清除保存的 executionId
            localStorage.removeItem(`execution_${projectId}`);
            onAddExecutionLog({
              level: 'system',
              agent: '系统',
              timestamp: getTimestamp(),
              result: event.content || '工作流执行完成',
              isThinkingComplete: true
            });
            sseConnection.close();
          } else if (event.type === 'error') {
            onSetRunning(false);
            onAddExecutionLog({
              level: 'error',
              agent: event.nodeId || '系统',
              timestamp: getTimestamp(),
              result: event.content || '执行出错',
              isThinkingComplete: true
            });
            sseConnection.close();
          }
        },
        (error) => {
          console.error('SSE error:', error);
          onSetRunning(false);
          onAddExecutionLog({
            level: 'error',
            agent: '系统',
            timestamp: getTimestamp(),
            result: 'SSE连接错误: ' + error.message,
            isThinkingComplete: true
          });
        }
      );
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      onSetRunning(false);
      onAddExecutionLog({
        level: 'error',
        agent: '系统',
        timestamp: getTimestamp(),
        result: '执行失败: ' + error.message,
        isThinkingComplete: true
      });
    }
  }, [nodes, connections, projectVersion, onSetRunning, onAddExecutionLog]);

    // 运行工作流 - 优先使用后端接口
  const simulateRun = useCallback(async () => {
    if (nodes.length === 0) return;

    // 如果有项目ID，调用后端接口执行
    if (projectId) {
      await executeWorkflowWithBackend(projectId, projectVersion);
      return;
    }

    // 没有项目ID时，使用前端模拟执行
    onSetRunning(true);

    // 添加系统开始日志
    onAddExecutionLog({
      level: 'system',
      agent: '系统',
      timestamp: getTimestamp(),
      thinking: '初始化工作流执行环境...\n检查节点依赖关系...\n验证数据流连通性...',
      thinkingDuration: '1秒',
      result: '工作流开始执行',
      resultTitle: '系统通知',
      isThinkingComplete: true
    });

    // 找到起始节点（没有输入连接的节点）
    const startNodes = nodes.filter(node =>
      !connections.some(conn => conn.to === node.id)
    );

    // 如果没有找到起始节点，就从第一个节点开始
    const nodesToRun = startNodes.length > 0 ? startNodes : [nodes[0]];

    // 按拓扑顺序执行节点
    const visited = new Set();
    const runNode = async (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      // 生成思考内容
      const thinkingSteps = generateThinkingContent(node.type, node.name);
      const resultContent = generateResultContent(node.type, node.name);

      // 设置节点为运行中状态，并更新 thinking 内容（节点内部会显示）
      // 注意：不要清空 result，以便保存历史版本时有数据
      setNodes(prev => prev.map(n =>
        n.id === nodeId ? {
          ...n,
          status: 'running',
          data: {
            ...n.data,
            thinking: thinkingSteps,
            thinkingIndex: 0
            // 保留之前的 result，以便保存历史版本
          }
        } : n
      ));

      // 逐步显示思考内容
      for (let i = 0; i < thinkingSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setNodes(prev => prev.map(n =>
          n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              thinkingIndex: i + 1
            }
          } : n
        ));
      }

      // 模拟执行时间
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 设置节点为完成状态，并显示结果（同时处理版本保存）
      setNodes(prev => prev.map(n => {
        if (n.id !== nodeId) return n;

        let newVersionHistory = n.data?.versionHistory || [];
        let newCurrentVersion = n.data?.currentVersion || 1;

        // 如果已经有结果（不是第一次运行），先保存当前版本到历史
        if (n.data?.hasResult) {
          const { versionHistory: _, displayVersion: __, ...dataToSave } = n.data || {};
          const historyEntry = {
            version: newCurrentVersion,
            timestamp: n.data?.timestamp || new Date().toISOString(),
            data: dataToSave
          };
          newVersionHistory = [...newVersionHistory, historyEntry];
          newCurrentVersion = newCurrentVersion + 1;
        }

        return {
          ...n,
          status: 'completed',
          data: {
            ...n.data,
            result: resultContent,
            script: n.type === 'content' ? resultContent : n.data?.script,
            hasResult: true,
            versionHistory: newVersionHistory,
            currentVersion: newCurrentVersion,
            timestamp: new Date().toISOString()
          }
        };
      }));

      // 找到下游节点并执行
      const downstreamConnections = connections.filter(conn => conn.from === nodeId);
      for (const conn of downstreamConnections) {
        await runNode(conn.to);
      }
    };

    // 并行执行所有起始节点
    await Promise.all(nodesToRun.map(node => runNode(node.id)));

    // 添加系统完成日志
    onAddExecutionLog({
      level: 'system',
      agent: '系统',
      timestamp: getTimestamp(),
      thinking: '汇总所有节点执行结果...\n验证输出数据完整性...\n生成执行报告...',
      thinkingDuration: '1秒',
      result: `工作流执行完成，共处理 ${nodes.length} 个节点`,
      resultTitle: '系统通知',
      isThinkingComplete: true
    });

    // 延迟后重置节点运行状态，但保留 thinking 和 result 数据
    setTimeout(() => {
      setNodes(prev => prev.map(n => ({
        ...n,
        status: 'idle'
      })));
      onSetRunning(false);
    }, 2000);
  }, [nodes, connections, onAddExecutionLog, onSetRunning, projectId, executeWorkflowWithBackend]);

  // 清空画布
  const handleClearCanvas = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
  }, []);

  // 打开智能体设置
  const handleOpenAgentSettings = useCallback((node) => {
    setEditingAgent(node);
    setShowAgentSettings(true);
  }, []);

  // 保存智能体设置
  const handleSaveAgentSettings = useCallback((settings) => {
    if (editingAgent) {
      setNodes(prev => prev.map(n =>
        n.id === editingAgent.id ? { ...n, ...settings } : n
      ));
    }
    setShowAgentSettings(false);
    setEditingAgent(null);
  }, [editingAgent]);

  // 复制官方智能体
  const handleDuplicateAgent = useCallback((agent) => {
    const newNodeId = `${agent.type}-custom-${Date.now()}`;
    const duplicatedAgent = {
      ...agent,
      id: newNodeId,
      name: `${agent.name} (副本)`,
      category: '自定义',
      x: agent.x + 50,
      y: agent.y + 50,
      initialPrompt: agent.initialPrompt || '',
      selfEvolutionPrompt: agent.selfEvolutionPrompt || '',
    };
    setNodes(prev => [...prev, duplicatedAgent]);
    setEditingAgent(duplicatedAgent);
  }, []);

  // 保存当前工作流为模板
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleSaveTemplate = useCallback(() => {
    if (templateName.trim()) {
      const template = {
        id: `custom-${Date.now()}`,
        name: templateName,
        nodes: nodes,
        connections: connections,
        createdAt: new Date().toISOString()
      };
      // 这里可以实现保存到本地存储或后端
      console.log('保存模板:', template);
      
      // 保存到localStorage
      const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      savedTemplates.push(template);
      localStorage.setItem('customTemplates', JSON.stringify(savedTemplates));
      
      setShowSaveTemplateDialog(false);
      setTemplateName('');
      alert('模板保存成功！');
    }
  }, [templateName, nodes, connections]);

  return (
    <div className={`node-canvas-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 顶部工具栏 */}
      <div className="canvas-toolbar">
        <div className="toolbar-left">
          <button 
            className="toolbar-btn"
            onClick={() => setShowLibrary(!showLibrary)}
          >
            <Plus size={16} />
            <span>添加智能体</span>
          </button>
          <PipelineTemplates templates={templates} onSelect={loadTemplate} loading={loadingAgents} />
        </div>

        <div className="toolbar-center">
          <button 
            className={`toolbar-btn ${isRunning ? 'active' : ''}`}
            onClick={simulateRun}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 size={16} className="spinning" /> : <Play size={16} />}
            <span>{isRunning ? '运行中...' : '运行'}</span>
          </button>
          <button className="toolbar-btn" onClick={() => setShowSaveTemplateDialog(true)}>
            <Save size={16} />
            <span>保存模板</span>
          </button>
          <button className="toolbar-btn" onClick={handleClearCanvas}>
            <Trash2 size={16} />
            <span>清空画布</span>
          </button>
        </div>
        
        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={onToggleFullscreen}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? '退出全屏' : '最大化'}</span>
          </button>
        </div>
      </div>

      {/* 全屏模式悬浮工具栏 */}
      {isFullscreen && (
        <div className="fullscreen-toolbar">
          <button
            className="toolbar-btn"
            onClick={() => setShowLibrary(!showLibrary)}
          >
            <Plus size={16} />
            <span>添加智能体</span>
          </button>
          <PipelineTemplates templates={templates} onSelect={loadTemplate} loading={loadingAgents} />
          <button
            className={`toolbar-btn ${isRunning ? 'active' : ''}`}
            onClick={simulateRun}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 size={16} className="spinning" /> : <Play size={16} />}
            <span>{isRunning ? '运行中...' : '运行'}</span>
          </button>
          <button className="toolbar-btn" onClick={() => setShowSaveTemplateDialog(true)}>
            <Save size={16} />
            <span>保存模板</span>
          </button>
          <button className="toolbar-btn" onClick={handleClearCanvas}>
            <Trash2 size={16} />
            <span>清空画布</span>
          </button>
          <button className="toolbar-btn" onClick={onToggleFullscreen}>
            <Minimize2 size={16} />
            <span>退出全屏 (ESC)</span>
          </button>
        </div>
      )}

      {/* 左侧智能体库 */}
      <AnimatePresence>
        {showLibrary && (
          <AgentLibrary
            agents={agentTypes}
            onDragAgent={addNode}
            onClose={() => setShowLibrary(false)}
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
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        >
          {/* 网格背景 */}
          <div className="canvas-grid" />
          
          {/* 连线 */}
          <svg
            className="connections-layer"
            width="5000"
            height="5000"
            viewBox="0 0 5000 5000"
          >
            {connections.map(conn => (
              <NodeConnection
                key={conn.id}
                connection={conn}
                nodes={nodes}
                isRunning={isRunning}
                portPositions={portPositions}
              />
            ))}

            {/* 拖拽连线预览 */}
            {isConnecting && connectingFrom && (
              <DraggingConnectionLine
                fromNode={nodes.find(n => n.id === connectingFrom.nodeId)}
                mousePos={connectingMousePos}
                portPositions={portPositions}
              />
            )}
          </svg>
          
          {/* 节点 - 使用富节点组件 */}
          {nodes.map(node => {
            // 所有节点类型都使用 RichAgentNode 组件
            const NodeComponent = RichAgentNode;

            return (
              <NodeComponent
                key={node.id}
                node={node}
                scale={scale}
                isSelected={selectedNode === node.id}
                isRunning={node.status === 'running'}
                onSelect={() => setSelectedNode(node.id)}
                onDelete={() => deleteNode(node.id)}
                onEdit={() => handleOpenAgentSettings(node)}
                onUpdatePosition={updateNodePosition}
                onUpdateData={updateNodeData}
                onStartConnection={startConnection}
                onCompleteConnection={completeConnection}
                onAddConnectedNode={addConnectedNode}
                isConnecting={isConnecting}
                connectingFrom={connectingFrom}
                availableAgents={Object.values(agentTypes)}
                onOpenSettings={handleOpenAgentSettings}
                onBringToFront={() => {
                  setSelectedNode(node.id);
                }}
                onDimensionChange={handleNodeDimensionChange}
                onAddNode={addConnectedNode}
                onPortPositionChange={handlePortPositionChange}
                onGenerateVideoNodes={handleGenerateVideoNodes}
              />
            );
          })}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="canvas-statusbar">
        <div className="status-item">
          <Grid size={14} />
          <span>缩放: {Math.round(scale * 100)}%</span>
        </div>
        <div className="status-item">
          <span>节点: {nodes.length}</span>
        </div>
        <div className="status-item">
          <span>连线: {connections.length}</span>
        </div>
      </div>

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
      <AnimatePresence>
        {showSaveTemplateDialog && (
          <motion.div
            className="save-template-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveTemplateDialog(false)}
          >
            <motion.div
              className="save-template-dialog"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header">
                <Save size={18} />
                <span>保存团队模板</span>
              </div>
              <div className="dialog-content">
                <label>模板名称</label>
                <input
                  type="text"
                  placeholder="输入模板名称..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  autoFocus
                />
                <p className="dialog-hint">
                  保存后可在"我的私有"中一键载入此团队配置
                </p>
              </div>
              <div className="dialog-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowSaveTemplateDialog(false)}
                >
                  取消
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default NodeCanvas;