import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import AgentLibrary from './AgentLibrary';
import NodeConnection from './NodeConnection';
import DraggingConnectionLine from './DraggingConnectionLine';
import AgentSettings from '../AgentSettings/AgentSettings';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import RichAgentNode from './RichAgentNode';
import { workSpaceApi } from '../../services/api';
import { useWorkflowStore } from '../../stores';
import { CanvasToolbar, CanvasStatusBar, FullscreenToolbar, SaveTemplateDialog } from '../Canvas';
import './NodeCanvas.css';

// 获取节点默认宽度
const getDefaultNodeWidth = (nodeType) => {
  if (nodeType === 'visual' || nodeType === 'director' || nodeType === 'technical') {
    return 540;
  }
  return 360;
};

// 计算节点位置
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
  } = useWorkflowStore();

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
        const [agentsRes, workflowsRes] = await Promise.all([
          workSpaceApi.getAgents(),
          workSpaceApi.getWorkflows()
        ]);

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
        }

        if (workflowsRes.code === 200 && workflowsRes.data) {
          const templateList = workflowsRes.data.workflows.map(wf => ({
            id: wf.id,
            name: wf.name,
            description: wf.description,
            category: wf.id,
            nodes: calculateNodePositions(wf.nodes.map(n => ({ type: n.type, label: n.label }))),
            connections: wf.connections,
          }));
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
    if (template && Object.keys(agentTypes).length > 0) {
      const loadedNodes = template.nodes.map(n => {
        const agentData = agentTypes[n.type] || {
          id: n.type,
          name: n.type,
          category: '未知',
          icon: 'Bot',
          color: '#888888',
          inputs: [{ id: 'input', label: '输入', type: 'any' }],
          outputs: [{ id: 'output', label: '输出', type: 'any' }]
        };
        return { ...agentData, id: n.id, type: n.type, x: n.x, y: n.y, status: 'idle' };
      });

      loadedNodes.forEach(node => addNode(node));

      template.connections.forEach((conn, index) => {
        const fromNode = loadedNodes.find(n => n.id === conn.from);
        const toNode = loadedNodes.find(n => n.id === conn.to);
        addConnection({
          ...conn,
          id: `${conn.from}-${conn.to}-${index}`,
          fromPort: fromNode?.outputs?.[0]?.id || 'output',
          toPort: toNode?.inputs?.[0]?.id || 'input'
        });
      });
    }
  }, [templates, agentTypes, addNode, addConnection]);

  // 添加节点
  const handleAddNode = useCallback((agentType, x, y) => {
    const nodeWidth = 200, nodeHeight = 80, gap = nodeWidth;
    let newX = x - position.x / scale;
    let newY = y - position.y / scale;

    const findNonOverlappingPosition = (baseX, baseY) => {
      let offsetX = 0, offsetY = 0, attempts = 0;
      while (attempts < 50) {
        const testX = baseX + offsetX, testY = baseY + offsetY;
        const hasOverlap = nodes.some(node =>
          testX < node.x + nodeWidth + gap && testX + nodeWidth + gap > node.x &&
          testY < node.y + nodeHeight + gap && testY + nodeHeight + gap > node.y
        );
        if (!hasOverlap) return { x: testX, y: testY };
        offsetX += nodeWidth + gap;
        if (offsetX > 600) { offsetX = 0; offsetY += nodeHeight + gap; }
        attempts++;
      }
      return { x: baseX + nodeWidth + gap, y: baseY };
    };

    const { x: finalX, y: finalY } = findNonOverlappingPosition(newX, newY);
    const agentTypeData = agentTypes[agentType] || Object.values(agentTypes)[0];
    if (!agentTypeData) return;

    addNode({ id: `${agentType}-${Date.now()}`, type: agentType, x: finalX, y: finalY, ...agentTypeData });
  }, [position, scale, nodes, agentTypes, addNode]);

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

  // 添加连接节点
  const addConnectedNode = useCallback((fromNodeId, agentType) => {
    const newNodeId = `${agentType}-${Date.now()}`;
    const fromNode = nodes.find(n => n.id === fromNodeId);
    if (!fromNode) return;

    const agentTypeData = agentTypes[agentType] || Object.values(agentTypes)[0];
    if (!agentTypeData) return;

    addNode({ ...agentTypeData, id: newNodeId, type: agentType, x: fromNode.x + 200 + 200, y: fromNode.y });
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

  // 执行工作流（带后端API）
  const executeWorkflowWithBackend = useCallback(async () => {
    if (!projectId || nodes.length === 0) return;
    setIsRunning(true);

    const nodeThinkingMap = new Map();
    const savedExecutionId = localStorage.getItem(`execution_${projectId}`);
    const executionId = savedExecutionId ? parseInt(savedExecutionId, 10) : null;

    try {
      const sseConnection = workSpaceApi.executeWorkflow(
        projectId, executionId, projectVersion, nodes, connections,
        (event) => {
          if (event.type === 'init') {
            localStorage.setItem(`execution_${projectId}`, event.executionId.toString());
            if (event.completedNodes?.length > 0) {
              batchUpdateNodes(event.completedNodes.map(c => ({
                id: c.nodeId, status: 'completed',
                data: { ...c, thinking: c.thinking || [], result: c.result || '', hasResult: !!c.result, isThinkingExpanded: true, isResultExpanded: true }
              })));
            }
          } else if (event.type === 'status') {
            if (event.nodeId) updateNodeStatus(event.nodeId, event.status === 'completed' ? 'completed' : 'running');
          } else if (event.type === 'thinking') {
            if (event.nodeId) {
              const existingThinking = nodeThinkingMap.get(event.nodeId) || [];
              existingThinking.push(event.content);
              nodeThinkingMap.set(event.nodeId, existingThinking);
              updateNodeData(event.nodeId, { thinking: [...existingThinking], thinkingIndex: existingThinking.length, isThinkingExpanded: true });
            }
          } else if (event.type === 'result') {
            if (event.nodeId) updateNodeResult(event.nodeId, event.content, nodeThinkingMap.get(event.nodeId) || []);
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
        (error) => { console.error('SSE error:', error); setIsRunning(false); }
      );
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setIsRunning(false);
    }
  }, [projectId, projectVersion, nodes, connections, setIsRunning, batchUpdateNodes, updateNodeStatus, updateNodeData, updateNodeResult]);

  // 运行工作流
  const simulateRun = useCallback(async () => {
    if (nodes.length === 0) return;
    if (projectId) { await executeWorkflowWithBackend(); return; }

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
  }, [nodes, connections, projectId, executeWorkflowWithBackend, setIsRunning, updateNode, updateNodeData, updateNodeStatus]);

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

  // 保存模板
  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) return;
    const template = { id: `custom-${Date.now()}`, name: templateName, nodes, connections, createdAt: new Date().toISOString() };
    const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    savedTemplates.push(template);
    localStorage.setItem('customTemplates', JSON.stringify(savedTemplates));
    setShowSaveTemplateDialog(false);
    setTemplateName('');
    alert('模板保存成功！');
  }, [templateName, nodes, connections]);

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
        onSave={handleSaveTemplate}
        onClose={() => setShowSaveTemplateDialog(false)}
      />
    </div>
  );
};

export default NodeCanvas;
