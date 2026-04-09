import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GitCompare, ChevronLeft, ChevronRight, PanelLeft, PanelRight, Package, Save, Plus, FileText, Edit2, Check, X, History, Trash2, AlertTriangle, FilePlus, Home, Download, Settings, FolderOpen } from 'lucide-react';
import Console from './components/Console';
import ToastContainer from './components/Toast/Toast';
import BottomToastContainer from './components/Toast/BottomToast';
import NodeCanvas from './components/NodeCanvas/NodeCanvas';
import AssetPanel from './components/AssetPanel/AssetPanel';
import NodeWorkspace from './components/NodeWorkspace';
import Modal from './components/Modal';
import HomePage from './components/HomePage';
import SkillMarket from './components/SkillMarket/SkillMarket';
import ProjectTopBar from './components/ProjectTopBar';
import AssetDrawer from './components/AssetDrawer';
import PlanningPage from './components/PlanningPage';
import { homePageApi, workSpaceApi, nodeVersionApi, proposalApi } from './services/api';
import { useProjectStore, useWorkflowStore, useUIStore, calculateTemplateNodePositions } from './stores';
import './App.css';

function App() {
  const containerRef = useRef(null);
  const versionDropdownRef = useRef(null);

  // Planning state
  const [planningRawInput, setPlanningRawInput] = useState('');
  const [planningAttachments, setPlanningAttachments] = useState([]);

  // Project Store
  const {
    currentProjectId,
    projectName,
    currentVersion,
    savedProjectState,
    hasUnsavedChanges,
    isSaving,
    saveSuccess,
    versions,
    showVersionDropdown,
    setCurrentProjectId,
    setProjectName,
    setCurrentVersion,
    setSavedProjectState,
    setHasUnsavedChanges,
    setIsSaving,
    setSaveSuccess,
    setVersions,
    setShowVersionDropdown,
    addVersion,
    removeVersion,
    resetProject,
    markSaved,
  } = useProjectStore();

  // Workflow Store
  const {
    nodes: canvasNodes,
    connections: canvasConnections,
    viewport: canvasViewport,
    pendingChatMessage,
    canvasKey,
    isRunning,
    setNodes: setCanvasNodes,
    setConnections: setCanvasConnections,
    setViewport: setCanvasViewport,
    setPendingChatMessage,
    clearPendingChatMessage,
    incrementCanvasKey,
    resetCanvas,
    loadWorkflow,
  } = useWorkflowStore();

  // UI Store
  const {
    currentView,
    leftWidth,
    rightWidth,
    leftCollapsed,
    rightCollapsed,
    isDraggingLeft,
    isDraggingRight,
    activeModal,
    selectedNodeId,
    isCanvasFullscreen,
    showSkillMarket,
    showNewProjectConfirm,
    showDeleteConfirm,
    versionToDelete,
    setCurrentView,
    setLeftWidth,
    setRightWidth,
    toggleLeftCollapse,
    toggleRightCollapse,
    setIsDraggingLeft,
    setIsDraggingRight,
    setActiveModal,
    setSelectedNodeId,
    openModal,
    closeModal,
    setIsCanvasFullscreen,
    toggleCanvasFullscreen,
    setShowSkillMarket,
    setShowNewProjectConfirm,
    openDeleteConfirm,
    closeDeleteConfirm,
    getActualWidths,
  } = useUIStore();

  // 从 canvasNodes 派生 selectedNode，确保与 store 同步
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return canvasNodes.find(n => n.id === selectedNodeId) || null;
  }, [canvasNodes, selectedNodeId]);

  // 计算下游节点（基于选中节点和连接关系）
  const downstreamNodes = useMemo(() => {
    if (!selectedNode) return [];
    const downstreamIds = new Set();
    const queue = [selectedNode.id];

    while (queue.length > 0) {
      const currentId = queue.shift();
      canvasConnections.forEach(conn => {
        if (conn.from === currentId && !downstreamIds.has(conn.to)) {
          downstreamIds.add(conn.to);
          queue.push(conn.to);
        }
      });
    }

    return canvasNodes.filter(n => downstreamIds.has(n.id)).map(n => ({
      id: n.id,
      name: n.name,
      status: n.data?.status || 'completed',
      reason: n.data?.staleReason || '依赖节点已修改'
    }));
  }, [selectedNode, canvasNodes, canvasConnections]);

  // 计算上游节点（基于选中节点和连接关系）
  const upstreamNodes = useMemo(() => {
    if (!selectedNode) return [];
    const upstreamIds = new Set();
    const queue = [selectedNode.id];

    while (queue.length > 0) {
      const currentId = queue.shift();
      canvasConnections.forEach(conn => {
        if (conn.to === currentId && !upstreamIds.has(conn.from)) {
          upstreamIds.add(conn.from);
          queue.push(conn.from);
        }
      });
    }

    return canvasNodes.filter(n => upstreamIds.has(n.id)).map(n => ({
      id: n.id,
      name: n.name,
      status: n.data?.status || 'completed'
    }));
  }, [selectedNode, canvasNodes, canvasConnections]);

  // 资产抽屉状态
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);

  // Demo只读态
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 项目模式状态（工厂/导演）
  const [projectMode, setProjectMode] = useState('factory');

  // 运行按钮状态 - 使用useMemo动态计算
  const { runButtonText, runExplanation, hasStaleNodes } = useMemo(() => {
    if (canvasNodes.length === 0) {
      return { runButtonText: '运行', runExplanation: '', hasStaleNodes: false };
    }

    // 检测stale节点（模拟：假设有修改过的节点会导致下游stale）
    const staleNodes = canvasNodes.filter(n => n.data?.status === 'stale');
    const hasStale = staleNodes.length > 0;

    // 如果有选中的节点
    if (selectedNode) {
      // 检测选中节点是否需要重生成（当前版本与基础版本不一致）
      const currentVer = selectedNode.data?.currentVersion || 1;
      const baseVer = selectedNode.data?.baseVersion;
      if (baseVer && currentVer > baseVer) {
        // 当前节点已被修订，需要重生成
        const downstreamNodes = canvasNodes.filter(n => {
          return canvasConnections.some(c => c.from === selectedNode.id && c.to === n.id);
        });
        const downstreamNames = downstreamNodes.map(n => n.name).join(' → ');
        return {
          runButtonText: '从当前节点重新运行',
          runExplanation: `建议运行范围：${selectedNode.name} → ${downstreamNames || '无下游节点'}\n原因：${selectedNode.name}已从v${baseVer}修订为v${currentVer}`,
          hasStaleNodes: hasStale
        };
      }
    }

    // 如果有stale节点，提示继续运行
    if (hasStale) {
      const staleNames = staleNodes.map(n => n.name).join('、');
      return {
        runButtonText: '继续运行受影响节点',
        runExplanation: `建议运行范围：${staleNames}\n原因：依赖节点已修改，这些节点需要更新`,
        hasStaleNodes: true
      };
    }

    // 默认：初次运行
    const firstNodeName = canvasNodes[0]?.name || '首节点';
    const lastNodeName = canvasNodes[canvasNodes.length - 1]?.name || '末节点';
    return {
      runButtonText: '从头运行',
      runExplanation: `建议运行范围：${firstNodeName} → ${lastNodeName}\n原因：首次运行整个流程`,
      hasStaleNodes: false
    };
  }, [canvasNodes, canvasConnections, selectedNode]);

  // 项目名称编辑状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');

  // 脏状态检测 - 使用稳定比较
  useEffect(() => {
    if (savedProjectState) {
      const currentState = JSON.stringify({
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: canvasViewport,
        name: projectName
      });
      const savedState = JSON.stringify(savedProjectState);
      setHasUnsavedChanges(currentState !== savedState);
    } else if (canvasNodes.length > 0 || canvasConnections.length > 0 || projectName !== '未命名项目') {
      setHasUnsavedChanges(true);
    }
  }, [canvasNodes, canvasConnections, canvasViewport, projectName, savedProjectState, setHasUnsavedChanges]);

  // 点击版本下拉框外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target)) {
        setShowVersionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowVersionDropdown]);

  // 加载版本列表
  const loadVersions = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      const [versionsResponse, projectResponse] = await Promise.all([
        homePageApi.getVersions(projectId),
        homePageApi.getProject(projectId)
      ]);

      if (versionsResponse.data && projectResponse.data) {
        const historyVersions = versionsResponse.data.versions.map(v => ({
          id: v.id,
          name: `V${v.versionNumber}.0`,
          versionNumber: v.versionNumber,
          description: v.description,
          createdAt: v.createdTime,
          isDefault: false,
          config: v.config
        }));

        const currentVersionNumber = projectResponse.data.currentVersion;
        const currentVersionObj = {
          id: 'current',
          name: `V${currentVersionNumber}.0`,
          versionNumber: currentVersionNumber,
          description: '当前版本',
          createdAt: projectResponse.data.updatedTime,
          isDefault: true,
          config: projectResponse.data.config
        };

        setVersions([currentVersionObj, ...historyVersions]);
        setCurrentVersion(currentVersionObj);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  }, [setVersions, setCurrentVersion]);

  // 加载工作流到画布
  const handleLoadWorkflow = useCallback((nodes, edges) => {
    const startX = 100;
    const startY = 300;
    const gap = 150;

    let currentX = startX;
    const formattedNodes = nodes.map((node) => {
      const nodeWidth = 360;
      const x = node.x ?? currentX;
      const y = node.y ?? startY;
      currentX += nodeWidth + gap;
      return {
        id: node.id,
        name: node.label,
        type: node.type,
        x,
        y,
        data: {}
      };
    });

    const formattedEdges = edges.map(edge => ({
      id: edge.id || `${edge.source}-${edge.sourceHandle || 'output'}-${edge.target}-${edge.targetHandle || 'input'}`,
      from: edge.source,
      fromPort: edge.sourceHandle || 'output',
      to: edge.target,
      toPort: edge.targetHandle || 'input',
      type: 'data-flow'
    }));

    loadWorkflow(formattedNodes, formattedEdges);
    setHasUnsavedChanges(true);
  }, [loadWorkflow, setHasUnsavedChanges]);

  // 保存项目
  const handleSaveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      let projectId = currentProjectId;

      if (!projectId) {
        const createResponse = await homePageApi.createProject(projectName);
        if (createResponse.data) {
          projectId = createResponse.data.id;
          setCurrentProjectId(projectId);
        }
      }

      if (!projectId) {
        throw new Error('Failed to create project');
      }

      const config = {
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: canvasViewport
      };

      const response = await homePageApi.saveProject(projectId, projectName, config);

      if (response.data && response.data.currentVersion) {
        setCurrentVersion({
          name: `V${response.data.currentVersion}.0`,
          version: response.data.currentVersion,
          description: '当前版本'
        });
      }

      await loadVersions(projectId);

      markSaved({
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: canvasViewport,
        name: projectName
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [
    currentProjectId, projectName, canvasNodes, canvasConnections, canvasViewport,
    setCurrentProjectId, setIsSaving, setCurrentVersion, loadVersions, markSaved, setSaveSuccess
  ]);

  // 处理主页进入
  const handleHomePageEnter = useCallback(async (userInput, shouldTriggerSystem = true, projectId = null, initialProjectName = null, demoId = null) => {
    resetCanvas();
    setSavedProjectState(null);
    setHasUnsavedChanges(false);
    setIsDemoMode(false); // 重置Demo模式

    // Demo只读态进入
    if (demoId) {
      setIsDemoMode(true);
      setProjectName('Demo演示');
      // Demo模式下，使用模拟数据加载画布
      // 实际项目中应该调用API获取Demo数据
      const demoNodes = [
        { id: 'producer', name: '资深制片人', type: 'producer', color: '#3b82f6', icon: 'Target', x: 100, y: 300, inputs: [{ id: 'input', label: '输入', type: 'any' }], outputs: [{ id: 'output', label: '输出', type: 'any' }], status: 'completed', data: { result: '项目立项完成，预算500万，周期6个月' } },
        { id: 'content', name: '金牌编剧', type: 'content', color: '#06b6d4', icon: 'PenTool', x: 900, y: 300, inputs: [{ id: 'input', label: '输入', type: 'any' }], outputs: [{ id: 'output', label: '输出', type: 'any' }], status: 'completed', data: { result: '第一场 日 外 城市街道\n\n繁华的都市街头...' } },
        { id: 'visual', name: '概念美术', type: 'visual', color: '#8b5cf6', icon: 'Palette', x: 1700, y: 300, inputs: [{ id: 'input', label: '输入', type: 'any' }], outputs: [{ id: 'output', label: '输出', type: 'any' }], status: 'completed', data: { result: '概念美术完成，8张关键场景图' } },
        { id: 'videoGen', name: '视频生成', type: 'videoGen', color: '#6366f1', icon: 'Play', x: 2500, y: 300, inputs: [{ id: 'input', label: '输入', type: 'any' }], outputs: [{ id: 'output', label: '输出', type: 'any' }], status: 'completed', data: { result: 'demo_video.mp4' } },
      ];
      const demoConnections = [
        { id: 'c1', from: 'producer', fromPort: 'output', to: 'content', toPort: 'input', type: 'data-flow' },
        { id: 'c2', from: 'content', fromPort: 'output', to: 'visual', toPort: 'input', type: 'data-flow' },
        { id: 'c3', from: 'visual', fromPort: 'output', to: 'videoGen', toPort: 'input', type: 'data-flow' },
      ];
      incrementCanvasKey();
      loadWorkflow(demoNodes, demoConnections);
      setCurrentView('workspace');
      return;
    }

    if (projectId) {
      setCurrentProjectId(projectId);

      try {
        const projectResponse = await homePageApi.getProject(projectId);
        if (projectResponse.data) {
          setProjectName(projectResponse.data.title || '未命名项目');

          if (projectResponse.data.config) {
            try {
              const config = typeof projectResponse.data.config === 'string'
                ? JSON.parse(projectResponse.data.config)
                : projectResponse.data.config;

              incrementCanvasKey();

              setTimeout(() => {
                if (config.nodes) setCanvasNodes(config.nodes);
                if (config.connections) setCanvasConnections(config.connections);
                if (config.viewport) setCanvasViewport(config.viewport);
              }, 100);
            } catch (e) {
              console.error('Failed to parse project config:', e);
            }
          }

          await loadVersions(projectId);
        }
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    } else {
      const projectTitle = initialProjectName || (userInput ? (userInput.length > 20 ? userInput.substring(0, 20) + '...' : userInput) : '未命名项目');
      setProjectName(projectTitle);

      try {
        const createResponse = await homePageApi.createProject(projectTitle, null, {});
        if (createResponse.data) {
          setCurrentProjectId(createResponse.data.id);
          setVersions([]);
          setCurrentVersion(null);
        }
      } catch (error) {
        console.error('Failed to create project:', error);
        const authErrors = ['用户不存在', '用户未登录', '登录已过期', '认证失败', '没有访问权限'];
        if (authErrors.some(e => error.message && error.message.includes(e))) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          sessionStorage.setItem('authError', '登录已失效，请重新登录');
          alert('登录已失效，请重新登录');
          window.location.href = '/';
          return;
        }
        alert('创建项目失败: ' + error.message);
        return;
      }
    }

    // 有用户输入时进入规划态，否则直接进入执行态
    if (shouldTriggerSystem && userInput) {
      setCurrentView('planning');
      setPlanningRawInput(userInput);
      setPlanningAttachments([]);
    } else {
      setCurrentView('workspace');
    }
  }, [
    resetCanvas, setSavedProjectState, setHasUnsavedChanges, setCurrentProjectId,
    setProjectName, incrementCanvasKey, setCanvasNodes, setCanvasConnections,
    setCanvasViewport, loadVersions, setVersions, setCurrentVersion, setCurrentView,
    setPlanningRawInput, setPlanningAttachments, setIsDemoMode, loadWorkflow
  ]);

  // 模拟方案数据到节点配置的转换
const planToNodesAndConnections = (plan, userInput) => {
  if (!plan || plan.mode === 'blank') {
    return { nodes: [], connections: [] };
  }

  // 精品短剧链路
  const producerNode = {
    id: 'producer',
    name: '资深制片人',
    type: 'producer',
    color: '#3b82f6',
    icon: 'Target',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    status: 'idle'
  };

  const writerNode = {
    id: 'content',
    name: '金牌编剧',
    type: 'content',
    color: '#06b6d4',
    icon: 'PenTool',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    status: 'idle'
  };

  const visualNode = {
    id: 'visual',
    name: '概念美术',
    type: 'visual',
    color: '#8b5cf6',
    icon: 'Palette',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    status: 'idle'
  };

  const directorNode = {
    id: 'director',
    name: '分镜导演',
    type: 'director',
    color: '#f59e0b',
    icon: 'Video',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    status: 'idle'
  };

  const technicalNode = {
    id: 'technical',
    name: '提示词工程师',
    type: 'technical',
    color: '#10b981',
    icon: 'Code',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    status: 'idle'
  };

  const videoGenNode = {
    id: 'videoGen',
    name: '视频生成',
    type: 'videoGen',
    color: '#6366f1',
    icon: 'Play',
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: [{ id: 'output', label: '输出', type: 'any' }],
    status: 'idle'
  };

  let nodes = [];
  let connections = [];

  // 根据plan.id决定节点组合
  if (plan.id === 'plan_1' || plan.id === 'recommended') {
    // 精品短剧 - 完整链路
    nodes = [producerNode, writerNode, visualNode, directorNode, technicalNode, videoGenNode];
    connections = [
      { id: 'c1', from: 'producer', fromPort: 'output', to: 'content', toPort: 'input', type: 'data-flow' },
      { id: 'c2', from: 'content', fromPort: 'output', to: 'visual', toPort: 'input', type: 'data-flow' },
      { id: 'c3', from: 'visual', fromPort: 'output', to: 'director', toPort: 'input', type: 'data-flow' },
      { id: 'c4', from: 'director', fromPort: 'output', to: 'technical', toPort: 'input', type: 'data-flow' },
      { id: 'c5', from: 'technical', fromPort: 'output', to: 'videoGen', toPort: 'input', type: 'data-flow' },
    ];
  } else if (plan.id === 'plan_2' || plan.id === 'quick') {
    // 粗糙短剧 - 快速链路
    nodes = [writerNode, visualNode, videoGenNode];
    connections = [
      { id: 'c1', from: 'content', fromPort: 'output', to: 'visual', toPort: 'input', type: 'data-flow' },
      { id: 'c2', from: 'visual', fromPort: 'output', to: 'videoGen', toPort: 'input', type: 'data-flow' },
    ];
  } else {
    // 默认精品链路
    nodes = [producerNode, writerNode, visualNode, directorNode, technicalNode, videoGenNode];
    connections = [
      { id: 'c1', from: 'producer', fromPort: 'output', to: 'content', toPort: 'input', type: 'data-flow' },
      { id: 'c2', from: 'content', fromPort: 'output', to: 'visual', toPort: 'input', type: 'data-flow' },
      { id: 'c3', from: 'visual', fromPort: 'output', to: 'director', toPort: 'input', type: 'data-flow' },
      { id: 'c4', from: 'director', fromPort: 'output', to: 'technical', toPort: 'input', type: 'data-flow' },
      { id: 'c5', from: 'technical', fromPort: 'output', to: 'videoGen', toPort: 'input', type: 'data-flow' },
    ];
  }

  // 计算节点位置（横向排列）
  const startX = 100;
  const startY = 300;
  const gap = 100;
  const nodeWidth = 700;

  let currentX = startX;
  nodes = nodes.map(node => {
    const x = currentX;
    currentX += nodeWidth + gap;
    return { ...node, x, y: startY };
  });

  return { nodes, connections };
};

// 新建项目
  const createNewProject = useCallback(async () => {
    resetCanvas();
    setShowNewProjectConfirm(false);

    try {
      const createResponse = await homePageApi.createProject('未命名项目', null, {});
      if (createResponse.data) {
        setCurrentProjectId(createResponse.data.id);
        setProjectName(createResponse.data.title || '未命名项目');
        setVersions([]);
        setCurrentVersion(null);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      const authErrors = ['用户不存在', '用户未登录', '登录已过期', '认证失败', '没有访问权限'];
      if (authErrors.some(e => error.message && error.message.includes(e))) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
        sessionStorage.setItem('authError', '登录已失效，请重新登录');
        alert('登录已失效，请重新登录');
        window.location.href = '/';
        return;
      }
      alert('创建项目失败: ' + error.message);
    }
  }, [resetCanvas, setShowNewProjectConfirm, setCurrentProjectId, setProjectName, setVersions, setCurrentVersion]);

  const handleNewProjectClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowNewProjectConfirm(true);
    } else {
      createNewProject();
    }
  }, [hasUnsavedChanges, setShowNewProjectConfirm, createNewProject]);

  const saveAndCreateNewProject = useCallback(async () => {
    await handleSaveProject();
    await createNewProject();
  }, [handleSaveProject, createNewProject]);

  // 项目名称编辑
  const startEditingName = () => {
    setTempProjectName(projectName);
    setIsEditingName(true);
  };

  const saveProjectName = () => {
    if (tempProjectName.trim()) {
      setProjectName(tempProjectName.trim());
    }
    setIsEditingName(false);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setTempProjectName('');
  };

  // 版本切换
  const handleSwitchVersion = useCallback(async (version) => {
    try {
      incrementCanvasKey();
      setCanvasNodes([]);
      setCanvasConnections([]);

      const response = version.isDefault
        ? await homePageApi.getProject(currentProjectId)
        : await homePageApi.getVersion(currentProjectId, version.versionNumber);

      if (response.data && response.data.config) {
        const config = typeof response.data.config === 'string' ? JSON.parse(response.data.config) : response.data.config;
        setCanvasNodes(config.nodes || []);
        setCanvasConnections(config.connections || []);
        setCanvasViewport(config.viewport || { x: 0, y: 0, zoom: 1 });
      }

      if (response.data && response.data.title) {
        setProjectName(response.data.title);
      }

      setCurrentVersion(version);
      setShowVersionDropdown(false);
    } catch (error) {
      console.error('Failed to switch version:', error);
      alert('切换版本失败: ' + error.message);
    }
  }, [
    currentProjectId, incrementCanvasKey, setCanvasNodes, setCanvasConnections,
    setCanvasViewport, setProjectName, setCurrentVersion, setShowVersionDropdown
  ]);

  // 删除版本
  const confirmDeleteVersion = useCallback(async () => {
    if (versionToDelete && currentProjectId) {
      try {
        await workSpaceApi.deleteVersion(currentProjectId, versionToDelete.id);
        removeVersion(versionToDelete.id);
        if (currentVersion?.id === versionToDelete.id && versions.length > 1) {
          const remainingVersions = versions.filter(v => v.id !== versionToDelete.id);
          setCurrentVersion(remainingVersions[0]);
        }
      } catch (error) {
        console.error('Failed to delete version:', error);
        alert('删除版本失败: ' + error.message);
      }
    }
    closeDeleteConfirm();
  }, [versionToDelete, currentProjectId, removeVersion, currentVersion, versions, setCurrentVersion, closeDeleteConfirm]);

  // 拖拽调整左右面板
  const startDragLeft = useCallback((e) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  }, [setIsDraggingLeft]);

  const startDragRight = useCallback((e) => {
    e.preventDefault();
    setIsDraggingRight(true);
  }, [setIsDraggingRight]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (isDraggingLeft) {
        const newLeftWidth = Math.max(15, Math.min(45, (x / containerWidth) * 100));
        setLeftWidth(newLeftWidth);
      } else if (isDraggingRight) {
        const newRightWidth = Math.max(10, Math.min(35, ((containerWidth - x) / containerWidth) * 100));
        setRightWidth(newRightWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight, setLeftWidth, setRightWidth, setIsDraggingLeft, setIsDraggingRight]);

  // 节点选择 - NodeWorkspace 模式下不需要弹窗
  const handleNodeSelect = useCallback((node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  // 计算实际宽度
  const { actualLeftWidth, actualRightWidth, centerWidth } = getActualWidths();

  // 计算运行按钮状态（根据节点状态动态切换文案和解释）
  // 这需要是一个useMemo，因为依赖canvasNodes和selectedNode
  const computeRunButtonState = useCallback(() => {
    if (canvasNodes.length === 0) {
      return { runButtonText: '运行', runExplanation: '', hasStaleNodes: false, suggestedRange: [] };
    }

    // 检测stale节点（模拟：假设有修改过的节点会导致下游stale）
    const staleNodes = canvasNodes.filter(n => n.data?.status === 'stale');
    const hasStale = staleNodes.length > 0;

    // 如果有选中的节点
    if (selectedNode) {
      // 检测选中节点是否需要重生成（当前版本与基础版本不一致）
      const currentVer = selectedNode.data?.currentVersion || 1;
      const baseVer = selectedNode.data?.baseVersion;
      if (baseVer && currentVer > baseVer) {
        // 当前节点已被修订，需要重生成
        const downstreamNodes = canvasNodes.filter(n => {
          // 简单的下游检测：检查连接关系
          return canvasConnections.some(c => c.from === selectedNode.id && c.to === n.id);
        });
        const downstreamNames = downstreamNodes.map(n => n.name).join(' → ');
        return {
          runButtonText: '从当前节点重新运行',
          runExplanation: `建议运行范围：${selectedNode.name} → ${downstreamNames || '无下游节点'}\n原因：${selectedNode.name}已从v${baseVer}修订为v${currentVer}`,
          hasStaleNodes: hasStale,
          suggestedRange: downstreamNodes.map(n => n.id)
        };
      }
    }

    // 如果有stale节点，提示继续运行
    if (hasStale) {
      const staleNames = staleNodes.map(n => n.name).join('、');
      return {
        runButtonText: '继续运行受影响节点',
        runExplanation: `建议运行范围：${staleNames}\n原因：依赖节点已修改，这些节点需要更新`,
        hasStaleNodes: true,
        suggestedRange: staleNodes.map(n => n.id)
      };
    }

    // 默认：初次运行
    const firstNodeName = canvasNodes[0]?.name || '首节点';
    const lastNodeName = canvasNodes[canvasNodes.length - 1]?.name || '末节点';
    return {
      runButtonText: '从头运行',
      runExplanation: `建议运行范围：${firstNodeName} → ${lastNodeName}\n原因：首次运行整个流程`,
      hasStaleNodes: false,
      suggestedRange: canvasNodes.map(n => n.id)
    };
  }, [canvasNodes, canvasConnections, selectedNode]);

  // 运行相关处理
  const handleRun = (runType = 'restart') => {
    // runType: 'restart' | 'continue' | 'fromCurrent' | 'currentOnly'
    console.log('Running workflow with type:', runType);
    // TODO: 根据 runType 调用不同的运行逻辑
  };

  // 从指定节点重新运行
  const handleRerunFromNode = (nodeId) => {
    console.log('Rerun from node:', nodeId);
    const targetNode = canvasNodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    // 触发运行 - 从当前节点开始
    // 后续实现：调用运行API
    alert(`将从节点 "${targetNode.name}" 开始重新运行`);

    // 切换到画布并选中该节点
    setSelectedNodeId(nodeId);
  };

  // 查看完整影响范围
  const handleViewFullImpact = (nodeId) => {
    console.log('View full impact for node:', nodeId);
    const targetNode = canvasNodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    // 获取下游节点
    const downstreamIds = new Set();
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      canvasConnections.forEach(conn => {
        if (conn.from === currentId && !downstreamIds.has(conn.to)) {
          downstreamIds.add(conn.to);
          queue.push(conn.to);
        }
      });
    }

    const downstreamNodes = canvasNodes.filter(n => downstreamIds.has(n.id));

    if (downstreamNodes.length === 0) {
      alert(`节点 "${targetNode.name}" 无下游节点`);
    } else {
      alert(`节点 "${targetNode.name}" 会影响以下节点:\n${downstreamNodes.map(n => n.name).join('\n')}`);
    }

    // 可选：定位到第一个下游节点
    if (downstreamNodes.length > 0) {
      setSelectedNodeId(downstreamNodes[0].id);
    }
  };

  // 查看影响范围（运行菜单中的选项）
  const handleViewImpact = () => {
    if (selectedNode) {
      handleViewFullImpact(selectedNode.id);
    } else {
      alert('请先选择一个节点');
    }
  };

  // 模式切换处理
  const handleModeChange = (mode) => {
    setProjectMode(mode);
  };

  // 资产抽屉处理
  const handleOpenAssetDrawer = () => {
    setAssetDrawerOpen(true);
  };

  const handleLocateNode = (nodeId) => {
    // 定位到指定节点
    console.log('Locate node:', nodeId);
    setAssetDrawerOpen(false);
  };

  const handleRestoreVersion = async (nodeKey, versionId) => {
    console.log('Restore version:', nodeKey, versionId);
    if (!currentProjectId) {
      console.warn('No projectId available for restore version');
      return;
    }

    try {
      // 调用后端API激活版本
      await nodeVersionApi.activateVersion(currentProjectId, nodeKey, versionId);

      // 找到对应的节点
      const targetNode = canvasNodes.find(n => n.id === nodeKey);
      if (!targetNode) return;

      // 标记下游节点为stale
      const { markDownstreamAsStale } = useWorkflowStore.getState();
      markDownstreamAsStale(nodeKey, `节点 ${targetNode.name} 已恢复到版本 ${versionId}`);
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('恢复版本失败: ' + error.message);
    }
  };

  // 提案处理 - 应用提案
  const handleApplyProposal = async (nodeId, proposalId) => {
    if (!currentProjectId) {
      console.warn('No projectId available for apply proposal');
      return;
    }

    try {
      // 调用后端API应用提案
      await proposalApi.applyProposal(currentProjectId, nodeId, proposalId);

      // 找到对应的节点
      const targetNode = canvasNodes.find(n => n.id === nodeId);
      if (!targetNode) return;

      // 标记下游节点为stale
      const { markDownstreamAsStale } = useWorkflowStore.getState();
      markDownstreamAsStale(nodeId, `节点 ${targetNode.name} 已修改，需要更新下游节点`);

      console.log('Proposal applied:', nodeId, proposalId);
    } catch (error) {
      console.error('Failed to apply proposal:', error);
      alert('应用提案失败: ' + error.message);
    }
  };

  // 提案处理 - 重新生成提案
  const handleRegenerateProposal = (nodeId, proposal) => {
    const { updateNodeData } = useWorkflowStore.getState();

    // 更新节点的提案数据，重置状态为pending
    updateNodeData(nodeId, {
      proposal: proposal,
      proposalStatus: 'pending'
    });

    console.log('Proposal regenerated:', nodeId, proposal);
  };

  // 提案处理 - 拒绝提案
  const handleRejectProposal = async (nodeId, proposalId) => {
    if (!currentProjectId) {
      console.warn('No projectId available for reject proposal');
      return;
    }

    try {
      // 调用后端API拒绝提案
      await proposalApi.rejectProposal(currentProjectId, nodeId, proposalId);
      console.log('Proposal rejected:', nodeId, proposalId);
    } catch (error) {
      console.error('Failed to reject proposal:', error);
      alert('拒绝提案失败: ' + error.message);
    }
  };

  // 导出处理
  const handleExport = () => {
    console.log('Export project');
    alert('导出功能开发中...');
  };

  return (
    <div className="app-container">
      {currentView === 'home' && (
        <HomePage onEnter={handleHomePageEnter} />
      )}
      {currentView === 'planning' && (
        <PlanningPage
          projectName={projectName}
          rawInput={planningRawInput}
          attachments={planningAttachments}
          onConfirmPlan={(plan) => {
            console.log('Plan confirmed:', plan);
            // 根据方案创建真实DAG
            const { nodes, connections } = planToNodesAndConnections(plan, planningRawInput);
            if (nodes.length > 0) {
              incrementCanvasKey();
              loadWorkflow(nodes, connections);
            }
            // 设置项目模式
            if (plan && plan.mode) {
              setProjectMode(plan.mode === 'director' ? 'director' : 'factory');
            }
            setCurrentView('workspace');
          }}
          onCancel={() => setCurrentView('home')}
          onGoToExecution={(options) => {
            // 自己搭建 - 进入空白执行态
            if (options && options.mode === 'blank') {
              incrementCanvasKey();
              resetCanvas();
            }
            setCurrentView('workspace');
          }}
        />
      )}
      {currentView === 'workspace' && (
        <div className="workspace">
          {/* 项目顶栏 - 包含项目级控制 */}
          <ProjectTopBar
            projectName={projectName}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            currentVersion={currentVersion}
            versions={versions}
            showVersionDropdown={showVersionDropdown}
            onSave={handleSaveProject}
            onNewProject={handleNewProjectClick}
            onGoHome={() => setCurrentView('home')}
            onVersionSelect={handleSwitchVersion}
            onVersionDelete={confirmDeleteVersion}
            onToggleVersionDropdown={() => setShowVersionDropdown(!showVersionDropdown)}
            onOpenAssetDrawer={handleOpenAssetDrawer}
            onExport={handleExport}
            onOpenSettings={() => setShowSkillMarket(true)}
            // 项目名称编辑
            isEditingName={isEditingName}
            tempProjectName={tempProjectName}
            onStartEditName={startEditingName}
            onSaveName={saveProjectName}
            onCancelEdit={cancelEditingName}
            onNameChange={setTempProjectName}
            // 版本下拉
            versionDropdownRef={versionDropdownRef}
            // 删除版本确认
            showDeleteConfirm={showDeleteConfirm}
            versionToDelete={versionToDelete}
            onOpenDeleteConfirm={openDeleteConfirm}
            onCloseDeleteConfirm={closeDeleteConfirm}
            onConfirmDelete={confirmDeleteVersion}
            // 新建项目确认
            showNewProjectConfirm={showNewProjectConfirm}
            onCloseNewProjectConfirm={() => setShowNewProjectConfirm(false)}
            onDiscardNewProject={createNewProject}
            onSaveAndCreateNewProject={saveAndCreateNewProject}
          />

          {/* 主内容区 */}
          <main
            ref={containerRef}
            className={`workspace-main ${isCanvasFullscreen ? 'canvas-fullscreen' : ''} ${isDraggingLeft || isDraggingRight ? 'dragging' : ''}`}
          >
            {/* 左侧面板 - 全局对话 */}
            <aside
              className={`panel-left ${leftCollapsed ? 'collapsed' : ''} ${isCanvasFullscreen ? 'hidden' : ''}`}
              style={{ flex: `0 0 ${actualLeftWidth}vw` }}
            >
              <div className="panel-content">
                <Console
                  onLoadWorkflow={handleLoadWorkflow}
                  pendingChatMessage={pendingChatMessage}
                  onPendingChatMessageSent={clearPendingChatMessage}
                />
              </div>
              <button
                className="collapse-btn left"
                onClick={toggleLeftCollapse}
                title={leftCollapsed ? '展开' : '收起'}
              >
                {leftCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </aside>

            {leftCollapsed && !isCanvasFullscreen && (
              <button
                className="floating-toggle left"
                onClick={toggleLeftCollapse}
                title="展开左侧面板"
              >
                <PanelLeft size={18} />
              </button>
            )}

            {!isCanvasFullscreen && !leftCollapsed && (
              <div
                className="resizer left-resizer"
                onMouseDown={startDragLeft}
              />
            )}

            {/* 中间画布区域 */}
            <section
              className="panel-center"
              style={{ flex: `1 1 ${centerWidth}vw` }}
            >
              <NodeCanvas
                key={canvasKey}
                isFullscreen={isCanvasFullscreen}
                onToggleFullscreen={toggleCanvasFullscreen}
                projectId={currentProjectId}
                projectVersion={currentVersion?.version}
                projectMode={projectMode}
                onModeChange={handleModeChange}
                runButtonText={isDemoMode ? 'Demo模式不可运行' : runButtonText}
                runExplanation={isDemoMode ? 'Demo模式为只读展示' : runExplanation}
                hasStaleNodes={hasStaleNodes}
                onViewImpact={handleViewImpact}
                onNodeSelect={handleNodeSelect}
                isDemoMode={isDemoMode}
              />
            </section>

            {!isCanvasFullscreen && !rightCollapsed && (
              <div
                className="resizer right-resizer"
                onMouseDown={startDragRight}
              />
            )}

            {rightCollapsed && !isCanvasFullscreen && (
              <button
                className="floating-toggle right"
                onClick={toggleRightCollapse}
                title="展开右侧面板"
              >
                <PanelRight size={18} />
              </button>
            )}

            {/* 右侧面板 - 节点工作区 */}
            <aside
              className={`panel-right ${rightCollapsed ? 'collapsed' : ''} ${isCanvasFullscreen ? 'hidden' : ''}`}
              style={{ flex: `0 0 ${actualRightWidth}vw` }}
            >
              <button
                className="collapse-btn right"
                onClick={toggleRightCollapse}
                title={rightCollapsed ? '展开' : '收起'}
              >
                {rightCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
              <div className="panel-content">
                <NodeWorkspace
                  selectedNode={selectedNode}
                  projectId={currentProjectId}
                  onNodeUpdate={(nodeId, data) => {
                    const { updateNodeData } = useWorkflowStore.getState();
                    updateNodeData(nodeId, data);
                    // selectedNode now derived from canvasNodes via useMemo, no manual sync needed
                  }}
                  onGenerateVideo={(nodeId, promptIdx) => {
                    const event = new CustomEvent('generateVideo', {
                      detail: { sourceNodeId: nodeId, count: 0, promptId: promptIdx },
                      bubbles: true
                    });
                    document.dispatchEvent(event);
                  }}
                  onApplyProposal={handleApplyProposal}
                  onRegenerateProposal={handleRegenerateProposal}
                  onRejectProposal={handleRejectProposal}
                  onRerunFromNode={handleRerunFromNode}
                  onViewFullImpact={handleViewFullImpact}
                  onRestoreVersion={handleRestoreVersion}
                  downstreamNodes={downstreamNodes}
                  upstreamNodes={upstreamNodes}
                />
              </div>
            </aside>
          </main>

          {/* 资产抽屉 - 从右滑出的叠加层 */}
          <AssetDrawer
            isOpen={assetDrawerOpen}
            onClose={() => setAssetDrawerOpen(false)}
            projectId={currentProjectId}
            nodes={canvasNodes}
            onLocateNode={handleLocateNode}
            onRestoreVersion={handleRestoreVersion}
          />

          {/* 模态框 */}
          {activeModal && (
            <Modal
              type={activeModal}
              data={selectedNode}
              onClose={closeModal}
            />
          )}

          {showSkillMarket && (
            <SkillMarket
              onClose={() => setShowSkillMarket(false)}
              onInstallSkill={(skill) => console.log('安装Skill:', skill)}
            />
          )}
        </div>
      )}
      <ToastContainer />
      <BottomToastContainer />
    </div>
  );
}

export default App;
