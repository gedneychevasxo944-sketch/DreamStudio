import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Console from './components/Console';
import ToastContainer, { toast } from './components/Toast/Toast';
import BottomToastContainer from './components/Toast/BottomToast';
import NodeCanvas from './components/NodeCanvas/NodeCanvas';
import AssetLibrary from './components/AssetLibrary';
import NodeWorkspace from './components/NodeWorkspace';
import Modal from './components/Modal';
import HomePage from './components/HomePage';
import SkillMarket from './components/SkillMarket/SkillMarket';
import PlanPreview from './components/PlanPreview';
import ContextPanel from './components/ContextPanel';
import { TopBar } from './components/TopBar';
import UnsavedChangesDialog from './components/ConfirmDialog/UnsavedChangesDialog';
import { DrillPanel, PromptDiffPanel, AssetChangeCard, ParameterDiffPanel, VisualSliderPanel, BatchImpactList } from './components/DrillPanel';
import { SmartSuggestion } from './components/SmartSuggestion';
import { homePageApi, nodeVersionApi, proposalApi } from './services/api';
import { AUTH_ERROR_MESSAGES } from './constants/authConstants';
import { WORKFLOW_LAYOUT } from './constants/layoutConstants';
import { uiLogger } from './utils/logger';
import { authStorage } from './utils/authStorage';
import { eventBus, EVENT_TYPES } from './utils/eventBus';
import { useProjectStore, useWorkflowStore, useUIStore, useStageStore, useChatStore, STAGES } from './stores';
import { traverseConnectedNodes } from './utils/nodeUtils';
import { mockModifications } from './mock/mockData';
import { initializeMockData } from './mock/stagesMock';
import './App.css';

// 新增组件导入
import StoryboardMainView from './components/Storyboard/StoryboardMainView';
import FloatingAssistant from './components/FloatingAssistant/FloatingAssistant';

function App() {
  const containerRef = useRef(null);
  const versionDropdownRef = useRef(null);
  const chatRef = useRef(null);

  // ============================================================================
  // P0 新增：两层架构状态
  // ============================================================================
  // currentView: 'home' | 'workspace'
  // currentLayer: 'storyboard' | 'node' (仅在 workspace 下有效)
  const [currentView, setCurrentView] = useState('home');
  const [currentLayer, setCurrentLayer] = useState('storyboard');
  const [focusedEntity, setFocusedEntity] = useState(null); // 当前焦点实体

  // 故事板选中镜头
  const [selectedShotId, setSelectedShotId] = useState(null);

  // 未保存确认弹窗状态
  const [unsavedDialog, setUnsavedDialog] = useState({
    isOpen: false,
    pendingAction: null, // 'goHome' | 'switchProject'
    target: null, // project id for switchProject
  });

  // 未保存修改详情（示例，实际应从 store 获取）
  const [unsavedChanges, setUnsavedChanges] = useState([
    { stage: '剧本阶段', description: '台词已修改' },
  ]);

  // ============================================================================
  // 原有状态（保留）
  // ============================================================================
  const [planningRawInput, setPlanningRawInput] = useState('');
  const [, setPlanningAttachments] = useState([]);
  const [sharedMessages, setSharedMessages] = useState([]);
  const [, setSelectedPlanId] = useState(null);
  const [, setPlan] = useState(null);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // ============================================================================
  // P1 新增：钻取面板状态
  // ============================================================================
  const [drillPanelOpen, setDrillPanelOpen] = useState(false);
  const [drillPanelTitle, setDrillPanelTitle] = useState('');
  const [drillPanelType, setDrillPanelType] = useState('text'); // text | asset | parameter | visual | batch
  const [drillPanelData, setDrillPanelData] = useState(null);

  // P1 新增：智能建议状态
  const [showSmartSuggestion, setShowSmartSuggestion] = useState(false);
  const [smartSuggestionMessage] = useState('');

  // PRD 2.0: 悬浮助手状态 - 现在由 FloatingAssistant 组件内部管理

  // Plan 收到后的回调
  const handlePlanReceived = useCallback((receivedPlan) => {
    if (receivedPlan) {
      setPlan(receivedPlan);
      setSelectedPlanId(receivedPlan.id);
    }
  }, []);

  // Project Store
  const {
    projects,
    currentProjectId,
    projectName,
    currentVersion,
    savedProjectState,
    hasUnsavedChanges,
    isSaving,
    saveSuccess,
    setCurrentProjectId,
    setProjectName,
    setCurrentVersion,
    setSavedProjectState,
    setHasUnsavedChanges,
    setIsSaving,
    setSaveSuccess,
    setVersions,
    setShowVersionDropdown,
    markSaved,
    switchProject,
  } = useProjectStore();

  // Workflow Store
  const {
    nodes: canvasNodes,
    connections: canvasConnections,
    viewport: canvasViewport,
    canvasKey,
    setNodes: setCanvasNodes,
    setConnections: setCanvasConnections,
    setViewport: setCanvasViewport,
    incrementCanvasKey,
    resetCanvas,
    loadWorkflow,
  } = useWorkflowStore();

  // UI Store - 暂时保留，用于兼容
  const {
    leftCollapsed,
    isDraggingLeft,
    activeModal,
    selectedNodeId,
    isCanvasFullscreen,
    showSkillMarket,
    setSelectedNodeId,
    closeModal,
    toggleLeftCollapse,
    setIsDraggingLeft,
    getActualWidths,
    setShowSkillMarket,
    setLeftWidth,
  } = useUIStore();

  // ============================================================================
  // P0 新增：层切换处理
  // ============================================================================
  const handleLayerChange = useCallback((layer) => {
    const { switchContext } = useChatStore.getState();
    const prevLayer = currentLayer;

    setCurrentLayer(layer);
    // 如果切换到非节点层，清除选中节点
    if (layer !== 'node') {
      setRightPanelVisible(false);
    }

    // T040: 切换层时更新对话助手上下文
    if (layer === 'storyboard') {
      // 切换到故事板层 → 项目级上下文
      switchContext('project', null, projectName);
    } else if (layer === 'node') {
      // 切换到节点层 → 工作流级上下文（等待节点选择）
      switchContext('workflow', null, '工作流');
    }

    // 如果之前在节点层，清除选中节点
    if (prevLayer === 'node') {
      setSelectedNodeId(null);
    }

    // 如果切换到故事板层，初始化 mock 数据
    if (layer === 'storyboard') {
      const { stageAssets } = useStageStore.getState();
      // 检查是否已经初始化过
      const hasInitialized = Object.values(stageAssets).some(arr => arr.length > 0);
      if (!hasInitialized) {
        const { setStageAssets, setStageCompletion } = useStageStore.getState();
        import('./mock/stagesMock').then(({ initializeMockData }) => {
          initializeMockData(setStageAssets, setStageCompletion);
        });
      }
    }
  }, [currentLayer, projectName]);

  // 处理悬浮助手开关
  const handleToggleAssistant = useCallback(() => {
    useChatStore.getState().toggleFloating();
  }, []);

  // 处理导出
  const handleExport = useCallback(() => {
    const currentStage = useStageStore.getState().currentStage;
    if (currentStage === STAGES.VIDEO) {
      // 视频阶段 - 触发导出
      toast?.info?.('正在导出视频...');
      // 通过事件通知 StoryboardMainView
      document.dispatchEvent(new CustomEvent('exportVideos'));
    } else if (currentStage === STAGES.STORYBOARD) {
      // 分镜阶段 - 导出分镜数据
      toast?.info?.('正在导出分镜...');
      document.dispatchEvent(new CustomEvent('exportStoryboard'));
    } else {
      toast?.warning?.('当前阶段不支持导出');
    }
  }, []);

  const handleShotSelect = useCallback((shotId) => {
    setSelectedShotId(shotId);
    // 设置焦点实体
    setFocusedEntity({ type: 'shot', id: shotId });
  }, []);

  // P1: 处理钻取 - 打开钻取面板
  const handleDrillDown = useCallback((message) => {
    if (!message || !message.modificationId) return;

    const modification = mockModifications[message.modificationId];
    if (!modification) return;

    setDrillPanelType(modification.type);
    setDrillPanelData(modification);
    setDrillPanelTitle(getDrillPanelTitle(modification));
    setDrillPanelOpen(true);
  }, []);

  // P1: 获取钻取面板标题
  const getDrillPanelTitle = (modification) => {
    if (!modification) return '';
    switch (modification.type) {
      case 'text':
        return `镜头${modification.targetId.replace('shot-', '')} · 背景描述`;
      case 'asset':
        return `镜头${modification.targetId.replace('shot-', '')} · 角色替换`;
      case 'parameter':
        return `场景美术Agent · 模型切换`;
      case 'visual':
        return `镜头${modification.targetId.replace('shot-', '')} · 构图优化`;
      case 'batch':
        return `批量修改 · 夜景→白天`;
      default:
        return '修改详情';
    }
  };

  // P1: 处理智能建议 - 打开故事板
  const handleOpenStoryboardFromSuggestion = useCallback(() => {
    setShowSmartSuggestion(false);
    setCurrentLayer('storyboard');
  }, []);

  // P1: 渲染钻取面板内容
  const renderDrillPanelContent = () => {
    switch (drillPanelType) {
      case 'text':
        return drillPanelData ? <PromptDiffPanel modification={drillPanelData} /> : null;
      case 'asset':
        return drillPanelData ? <AssetChangeCard modification={drillPanelData} /> : null;
      case 'parameter':
        return drillPanelData ? <ParameterDiffPanel modification={drillPanelData} /> : null;
      case 'visual':
        return drillPanelData ? <VisualSliderPanel modification={drillPanelData} /> : null;
      case 'batch':
        return drillPanelData ? <BatchImpactList modification={drillPanelData} /> : null;
      default:
        return null;
    }
  };

  // ============================================================================
  // 原有方法（保留）
  // ============================================================================

  // 从 canvasNodes 派生 selectedNode
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return canvasNodes.find(n => n.id === selectedNodeId) || null;
  }, [canvasNodes, selectedNodeId]);

  // 计算下游/上游节点
  const downstreamNodes = useMemo(() => {
    if (!selectedNode) return [];
    const downstreamIds = traverseConnectedNodes(selectedNode.id, canvasConnections, 'downstream');
    return canvasNodes.filter(n => downstreamIds.has(n.id)).map(n => ({
      id: n.id,
      name: n.name,
      status: n.data?.status || 'completed',
      reason: n.data?.staleReason || '依赖节点已修改'
    }));
  }, [selectedNode, canvasNodes, canvasConnections]);

  const upstreamNodes = useMemo(() => {
    if (!selectedNode) return [];
    const upstreamIds = traverseConnectedNodes(selectedNode.id, canvasConnections, 'upstream');
    return canvasNodes.filter(n => upstreamIds.has(n.id)).map(n => ({
      id: n.id,
      name: n.name,
      status: n.data?.status || 'completed'
    }));
  }, [selectedNode, canvasNodes, canvasConnections]);

  // 计算运行按钮状态
  const { runButtonText, runExplanation, hasStaleNodes } = useMemo(() => {
    if (canvasNodes.length === 0) {
      return { runButtonText: '运行', runExplanation: '', hasStaleNodes: false };
    }
    const staleNodes = canvasNodes.filter(n => n.data?.status === 'stale');
    const hasStale = staleNodes.length > 0;
    if (selectedNode) {
      const currentVer = selectedNode.data?.currentVersion || 1;
      const baseVer = selectedNode.data?.baseVersion;
      if (baseVer && currentVer > baseVer) {
        const downstreamNames = downstreamNodes.map(n => n.name).join(' → ');
        return {
          runButtonText: '从当前节点重新运行',
          runExplanation: `建议运行范围：${selectedNode.name} → ${downstreamNames || '无下游节点'}\n原因：${selectedNode.name}已从v${baseVer}修订为v${currentVer}`,
          hasStaleNodes: hasStale
        };
      }
    }
    if (hasStale) {
      const staleNames = staleNodes.map(n => n.name).join('、');
      return {
        runButtonText: '继续运行受影响节点',
        runExplanation: `建议运行范围：${staleNames}\n原因：依赖节点已修改，这些节点需要更新`,
        hasStaleNodes: true
      };
    }
    const firstNodeName = canvasNodes[0]?.name || '首节点';
    const lastNodeName = canvasNodes[canvasNodes.length - 1]?.name || '末节点';
    return {
      runButtonText: '从头运行',
      runExplanation: `建议运行范围：${firstNodeName} → ${lastNodeName}\n原因：首次运行整个流程`,
      hasStaleNodes: false
    };
  }, [canvasNodes, canvasConnections, selectedNode]);

  // 脏状态检测
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
      uiLogger.error('[App] Failed to load versions:', error);
    }
  }, [setVersions, setCurrentVersion]);

  // 加载工作流到画布
  const handleLoadWorkflow = useCallback((nodes, edges) => {
    let currentX = WORKFLOW_LAYOUT.START_X;
    const formattedNodes = nodes.map((node) => {
      const x = node.x ?? currentX;
      const y = node.y ?? WORKFLOW_LAYOUT.START_Y;
      currentX += WORKFLOW_LAYOUT.NODE_WIDTH + WORKFLOW_LAYOUT.GAP;
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
      uiLogger.error('[App] Failed to save project:', error);
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
    setIsDemoMode(false);

    // 清空故事板资产（新项目不加载 mock）
    useStageStore.getState().resetAllStageAssets();

    if (demoId) {
      // Demo 模式加载 mock 数据
      const { setStageAssets, setStageCompletion } = useStageStore.getState();
      const { initializeMockData } = await import('./mock/stagesMock');
      initializeMockData(setStageAssets, setStageCompletion);
      setIsDemoMode(true);
      setProjectName('Demo演示');
      setCurrentView('workspace');
      setCurrentLayer('node'); // Demo 默认显示节点层
      return;
    }

    if (projectId) {
      // 加载已有项目
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
              uiLogger.error('[App] Failed to parse project config:', e);
            }
          }
          await loadVersions(projectId);

          // 如果项目没有资产，加载 mock 作为演示
          const { stageAssets: currentAssets, setStageAssets: setAssets, setStageCompletion: setCompletion } = useStageStore.getState();
          const hasAssets = Object.values(currentAssets).some(arr => arr.length > 0);
          if (!hasAssets) {
            const { initializeMockData } = await import('./mock/stagesMock');
            initializeMockData(setAssets, setCompletion);
          }

          // 如果画布没有节点，加载 mockNodes 作为演示
          const { nodes: currentNodes, setNodes: setCanvasNodes, setConnections: setCanvasConnections } = useWorkflowStore.getState();
          if (currentNodes.length === 0) {
            const { mockNodes, mockConnections } = await import('./mock/mockData');
            setCanvasNodes(mockNodes);
            setCanvasConnections(mockConnections);
          }
        }
      } catch (error) {
        uiLogger.error('[App] Failed to load project data:', error);
      }
    } else {
      // 新项目 - 不加载 mock，显示 EmptyGuide
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
        uiLogger.error('[App] Failed to create project:', error);
        if (AUTH_ERROR_MESSAGES.some(e => error.message && error.message.includes(e))) {
          authStorage.clearAuth();
          sessionStorage.setItem('authError', '登录已失效，请重新登录');
          alert('登录已失效，请重新登录');
          window.location.href = '/';
          return;
        }
        alert('创建项目失败: ' + error.message);
        return;
      }
    }

    // 进入工作空间，默认显示故事板层（PRD 2.0）
    setCurrentView('workspace');
    setCurrentLayer('storyboard');

    if (shouldTriggerSystem && userInput) {
      setPlanningRawInput(userInput);
      setPlanningAttachments([]);
      setPlan(null);
      setSelectedPlanId(null);
    }
  }, [
    resetCanvas, setSavedProjectState, setHasUnsavedChanges, setCurrentProjectId,
    setProjectName, incrementCanvasKey, setCanvasNodes, setCanvasConnections,
    setCanvasViewport, loadVersions, setVersions, setCurrentVersion
  ]);

  // 取消规划
  const handleCancelPlanning = useCallback(() => {
    setCurrentView('home');
    setPlan(null);
    setSelectedPlanId(null);
    setSharedMessages([]);
  }, []);

  // 未保存确认弹窗 - 请求确认（由 TopBar 调用）
  const handleRequestUnsavedConfirm = useCallback((action, target = null) => {
    setUnsavedDialog({ isOpen: true, pendingAction: action, target });
  }, []);

  // 未保存确认弹窗 - 保存并离开
  const handleSaveAndLeave = useCallback(async () => {
    const { pendingAction, target } = unsavedDialog;
    setUnsavedDialog({ isOpen: false, pendingAction: null, target: null });
    await handleSaveProject();
    // 执行待处理动作
    if (pendingAction === 'goHome') {
      handleCancelPlanning();
    } else if (pendingAction === 'switchProject' && target) {
      const { switchProject } = useProjectStore.getState();
      switchProject(target);
    }
  }, [handleSaveProject, handleCancelPlanning, unsavedDialog]);

  // 未保存确认弹窗 - 不保存离开
  const handleLeaveWithoutSaving = useCallback(() => {
    const { pendingAction, target } = unsavedDialog;
    setUnsavedDialog({ isOpen: false, pendingAction: null, target: null });
    // 执行待处理动作（不保存）
    if (pendingAction === 'goHome') {
      handleCancelPlanning();
    } else if (pendingAction === 'switchProject' && target) {
      const { switchProject } = useProjectStore.getState();
      switchProject(target);
    }
  }, [handleCancelPlanning]);

  // 未保存确认弹窗 - 取消
  const handleCancelUnsaved = useCallback(() => {
    setUnsavedDialog({ isOpen: false, pendingAction: null, target: null });
  }, []);

  // 拖拽调整左右面板
  const startDragLeft = useCallback((e) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  }, [setIsDraggingLeft]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (isDraggingLeft) {
        const newLeftWidth = Math.max(15, Math.min(45, (x / containerWidth) * 100));
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
    };

    if (isDraggingLeft) {
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
  }, [isDraggingLeft, setLeftWidth, setIsDraggingLeft]);

  // 节点选择
  const handleNodeSelect = useCallback((node) => {
    setSelectedNodeId(node.id);
    if (node) {
      setRightPanelVisible(true);
      setFocusedEntity({ type: 'node', id: node.id, name: node.name });
      // T040: 在画布层时，更新对话助手上下文为节点级别
      if (currentLayer === 'node') {
        const { switchContext } = useChatStore.getState();
        switchContext('node', node.id, node.name);
      }
    }
  }, [setSelectedNodeId, currentLayer]);

  // 节点取消选择 - 仅在画布层且当前有选中的节点时重置上下文
  const handleNodeDeselect = useCallback(() => {
    const prevSelectedNodeId = selectedNodeId;
    setSelectedNodeId(null);
    setRightPanelVisible(false);
    // T040: 在画布层时，如果之前有选中节点，重置对话助手上下文为工作流级别
    if (currentLayer === 'node' && prevSelectedNodeId) {
      const { switchContext } = useChatStore.getState();
      switchContext('workflow', null, '工作流');
    }
  }, [selectedNodeId, currentLayer]);

  // 计算实际宽度
  const { actualLeftWidth, centerWidth } = getActualWidths();

  const handleRerunFromNode = (nodeId) => {
    uiLogger.debug('[App] Rerun from node:', nodeId);
    const targetNode = canvasNodes.find(n => n.id === nodeId);
    if (!targetNode) return;
    alert(`将从节点 "${targetNode.name}" 开始重新运行`);
    setSelectedNodeId(nodeId);
  };

  const handleViewFullImpact = (nodeId) => {
    uiLogger.debug('[App] View full impact for node:', nodeId);
    const targetNode = canvasNodes.find(n => n.id === nodeId);
    if (!targetNode) return;

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

    if (downstreamNodes.length > 0) {
      setSelectedNodeId(downstreamNodes[0].id);
    }
  };

  // 版本恢复
  const handleRestoreVersion = async (nodeKey, versionId) => {
    uiLogger.debug('[App] Restore version:', nodeKey, versionId);
    if (!currentProjectId) {
      uiLogger.warn('[App] No projectId available for restore version');
      return;
    }

    try {
      await nodeVersionApi.activateVersion(currentProjectId, nodeKey, versionId);
      document.dispatchEvent(new Event('workflowComplete'));

      const targetNode = canvasNodes.find(n => n.id === nodeKey);
      if (!targetNode) return;

      const { markDownstreamAsStale } = useWorkflowStore.getState();
      markDownstreamAsStale(nodeKey, `节点 ${targetNode.name} 已恢复到版本 ${versionId}`);
    } catch (error) {
      uiLogger.error('[App] Failed to restore version:', error);
      alert('恢复版本失败: ' + error.message);
    }
  };

  // 提案处理
  const handleApplyProposal = async (nodeId, proposalId) => {
    if (!currentProjectId) {
      uiLogger.warn('[App] No projectId available for apply proposal');
      return;
    }

    try {
      await proposalApi.applyProposal(currentProjectId, nodeId, proposalId);

      const targetNode = canvasNodes.find(n => n.id === nodeId);
      if (!targetNode) return;

      const { markDownstreamAsStale } = useWorkflowStore.getState();
      markDownstreamAsStale(nodeId, `节点 ${targetNode.name} 已修改，需要更新下游节点`);

      const event = new CustomEvent('proposalApplied', {
        detail: { nodeId, proposalId },
        bubbles: true
      });
      document.dispatchEvent(event);

      uiLogger.debug('[App] Proposal applied:', nodeId, proposalId);
    } catch (error) {
      uiLogger.error('[App] Failed to apply proposal:', error);
      alert('应用提案失败: ' + error.message);
    }
  };

  const handleRegenerateProposal = (nodeId, proposal) => {
    const { updateNodeData } = useWorkflowStore.getState();
    updateNodeData(nodeId, {
      proposal: proposal,
      proposalStatus: 'pending'
    });
    uiLogger.debug('[App] Proposal regenerated:', nodeId, proposal);
  };

  const handleRejectProposal = async (nodeId, proposalId) => {
    if (!currentProjectId) {
      uiLogger.warn('[App] No projectId available for reject proposal');
      return;
    }

    try {
      await proposalApi.rejectProposal(currentProjectId, nodeId, proposalId);

      const event = new CustomEvent('proposalRejected', {
        detail: { nodeId, proposalId },
        bubbles: true
      });
      document.dispatchEvent(event);

      uiLogger.debug('[App] Proposal rejected:', nodeId, proposalId);
    } catch (error) {
      uiLogger.error('[App] Failed to reject proposal:', error);
      alert('拒绝提案失败: ' + error.message);
    }
  };

  // ============================================================================
  // 渲染
  // ============================================================================
  return (
    <div className={`app-container ${currentView === 'home' ? 'home-view' : ''}`}>
      {/* 首页 */}
      {currentView === 'home' && (
        <HomePage onEnter={handleHomePageEnter} />
      )}

      {/* 工作空间 */}
      {currentView === 'workspace' && (
        <div className="workspace">
          {/* P0 新增：统一 TopBar */}
          <TopBar
            projectName={projectName}
            currentLayer={currentLayer}
            focusedEntity={focusedEntity}
            onLayerChange={handleLayerChange}
            onGoHome={handleCancelPlanning}
            onSave={handleSaveProject}
            onOpenAssetLibrary={() => setAssetLibraryOpen(true)}
            onToggleAssistant={handleToggleAssistant}
            onExport={handleExport}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            hasUnsavedChanges={hasUnsavedChanges}
            onRequestUnsavedConfirm={handleRequestUnsavedConfirm}
          />

          {/* 主内容区 */}
          <main
            ref={containerRef}
            className={`workspace-main ${isCanvasFullscreen ? 'canvas-fullscreen' : ''} ${isDraggingLeft ? 'dragging' : ''}`}
          >
            {/* 中间区域 - 根据 currentLayer 切换 */}
            <section
              className="panel-center"
              style={{ flex: currentLayer === 'storyboard' ? '1' : `1 1 ${centerWidth}vw` }}
            >
              <AnimatePresence mode="wait">
                {/* PRD 2.0: 故事板主界面 */}
                {currentLayer === 'storyboard' && (
                  <motion.div
                    key="storyboard-main-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                  >
                    <StoryboardMainView />
                  </motion.div>
                )}

                {/* 节点层 */}
                {currentLayer === 'node' && (
                  <motion.div
                    key={`canvas-${canvasKey}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                  >
                    <NodeCanvas
                      key={canvasKey}
                      isFullscreen={isCanvasFullscreen}
                      onToggleFullscreen={() => useUIStore.getState().toggleCanvasFullscreen()}
                      projectId={currentProjectId}
                      projectVersion={currentVersion?.version}
                      runButtonText={isDemoMode ? 'Demo模式不可运行' : runButtonText}
                      runExplanation={isDemoMode ? 'Demo模式为只读展示' : runExplanation}
                      hasStaleNodes={hasStaleNodes}
                      onNodeSelect={(node) => {
                        handleNodeSelect(node);
                      }}
                      isDemoMode={isDemoMode}
                      onReturnToStoryboard={() => handleLayerChange('storyboard')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* 节点工作区浮层 */}
            {currentLayer === 'node' && rightPanelVisible && selectedNode && !isCanvasFullscreen && (
              <motion.div
                className="node-workspace-overlay"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  className="node-workspace-close"
                  onClick={() => setRightPanelVisible(false)}
                  title="关闭"
                >
                  <ChevronRight size={16} />
                </button>
                <NodeWorkspace
                  selectedNode={selectedNode}
                  projectId={currentProjectId}
                  onNodeUpdate={(nodeId, data) => {
                    const { updateNodeData } = useWorkflowStore.getState();
                    updateNodeData(nodeId, data);
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
              </motion.div>
            )}
          </main>

          {/* 资产库浮层 */}
          {assetLibraryOpen && (
            <>
              <motion.div
                className="asset-library-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAssetLibraryOpen(false)}
              />
              <AssetLibrary
                isOpen={assetLibraryOpen}
                onClose={() => setAssetLibraryOpen(false)}
                currentProject={{
                  id: currentProjectId,
                  name: projectName,
                }}
                projects={projects.map(p => ({ id: p.id, name: p.name }))}
                onProjectChange={(projectId) => {
                  // 切换项目前检查未保存更改
                  if (projectId !== currentProjectId && hasUnsavedChanges) {
                    // TODO: 显示确认对话框
                    console.log('[App] 切换项目有未保存更改');
                  }
                  switchProject(projectId);
                  setAssetLibraryOpen(false);
                }}
                onAssetSelect={(asset) => {
                  console.log('[App] 资产选中:', asset);
                }}
                onAssetDrag={(asset) => {
                  console.log('[App] 资产拖拽:', asset);
                }}
                onAssetAddToStoryboard={(asset) => {
                  console.log('[App] 添加资产到故事板:', asset);
                  // TODO: 实现添加到故事板的逻辑
                  setAssetLibraryOpen(false);
                }}
              />
            </>
          )}

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
              onInstallSkill={(skill) => uiLogger.info('[Skill] 安装Skill:', skill)}
            />
          )}

          {/* PRD 2.0: 悬浮助手 - 只在 workspace 显示 */}
          <FloatingAssistant />
        </div>
      )}
      <ToastContainer />
      <BottomToastContainer />

      {/* 未保存确认弹窗 */}
      <UnsavedChangesDialog
        isOpen={unsavedDialog.isOpen}
        projectName={projectName}
        changes={unsavedChanges}
        onSaveAndLeave={handleSaveAndLeave}
        onLeaveWithoutSaving={handleLeaveWithoutSaving}
        onCancel={handleCancelUnsaved}
      />

      {/* P1: 钻取面板 */}
      <DrillPanel
        isOpen={drillPanelOpen}
        onClose={() => setDrillPanelOpen(false)}
        title={drillPanelTitle}
        position="right"
        width={420}
      >
        {renderDrillPanelContent()}
      </DrillPanel>

      {/* P1: 智能建议通知 */}
      <SmartSuggestion
        isVisible={showSmartSuggestion}
        message={smartSuggestionMessage || '检测到多次调整，是否切换到故事板批量处理？'}
        onOpenStoryboard={handleOpenStoryboardFromSuggestion}
        onDismiss={() => setShowSmartSuggestion(false)}
      />
    </div>
  );
}

export default App;
