import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, PanelLeft, Maximize2, X } from 'lucide-react';
import Console from './components/Console';
import ToastContainer from './components/Toast/Toast';
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
import { StoryboardView } from './components/Storyboard';
import { DrillPanel, PromptDiffPanel, AssetChangeCard, ParameterDiffPanel, VisualSliderPanel, BatchImpactList } from './components/DrillPanel';
import { SmartSuggestion } from './components/SmartSuggestion';
import { SingleAssetView, AssetGridView, ScriptEditorView, SequenceModeView } from './components/RightPreviewPanel';
import { homePageApi, nodeVersionApi, proposalApi } from './services/api';
import { AUTH_ERROR_MESSAGES } from './constants/authConstants';
import { WORKFLOW_LAYOUT, PLAN_LAYOUT } from './constants/layoutConstants';
import { uiLogger } from './utils/logger';
import { authStorage } from './utils/authStorage';
import { eventBus, EVENT_TYPES } from './utils/eventBus';
import { useProjectStore, useWorkflowStore, useUIStore, useSubgraphStore, useStageStore } from './stores';
import { traverseConnectedNodes } from './utils/nodeUtils';
import { mockModifications } from './mock/mockData';
import { getScenario } from './mock/previewScenarios';
import { initializeMockData } from './mock/stagesMock';
import './App.css';

// 新增组件导入
import StoryboardMainView from './components/Storyboard2/StoryboardMainView';
import FloatingAssistantButton from './components/FloatingAssistant/FloatingAssistantButton';
import FloatingAssistantDrawer from './components/FloatingAssistant/FloatingAssistantDrawer';

// P5: 场景按钮样式辅助函数
const scenarioBtnStyle = (isActive, activeColor) => ({
  padding: '6px 12px',
  background: isActive ? `${activeColor}20` : 'rgba(255,255,255,0.05)',
  border: `1px solid ${isActive ? activeColor + '50' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '6px',
  color: isActive ? activeColor : 'var(--text-secondary)',
  fontSize: '11px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

function App() {
  const containerRef = useRef(null);
  const versionDropdownRef = useRef(null);
  const chatRef = useRef(null);

  // ============================================================================
  // P0 新增：三层架构状态
  // ============================================================================
  // currentView: 'home' | 'workspace'
  // currentLayer: 'conversation' | 'storyboard' | 'node' (仅在 workspace 下有效)
  const [currentView, setCurrentView] = useState('home');
  const [currentLayer, setCurrentLayer] = useState('conversation');
  const [focusedEntity, setFocusedEntity] = useState(null); // 当前焦点实体

  // 节点层查看模式：'nodes' | 'subgraph'
  const [nodeViewMode, setNodeViewMode] = useState('nodes');

  // 故事板选中镜头
  const [selectedShotId, setSelectedShotId] = useState(null);

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

  // P5 新增：右侧预览面板状态（对话层）
  // 实际项目中这些数据应该从后端获取或从节点执行结果中提取
  const [previewAssets, setPreviewAssets] = useState([]);
  const [previewScript, setPreviewScript] = useState(null);
  const [previewShots, setPreviewShots] = useState([]);
  const [previewCharacters, setPreviewCharacters] = useState([]);  // P5: 角色列表
  const [previewPanelVisible, setPreviewPanelVisible] = useState(false);  // P5: 预览面板默认隐藏
  const [previewingAsset, setPreviewingAsset] = useState(null);  // P5: 当前预览的资产
  const [previewScenario, setPreviewScenario] = useState(null);  // P5: 当前场景类型
  const [previewFullscreen, setPreviewFullscreen] = useState(false);  // P5: 预览区全屏查看

  // PRD 2.0: 悬浮助手状态
  const [floatingAssistantOpen, setFloatingAssistantOpen] = useState(false);

  // Plan 收到后的回调
  const handlePlanReceived = useCallback((receivedPlan) => {
    if (receivedPlan) {
      setPlan(receivedPlan);
      setSelectedPlanId(receivedPlan.id);
    }
  }, []);

  // P5: 加载预览场景（用于开发和测试）
  const loadPreviewScenario = (scenarioName) => {
    const scenario = getScenario(scenarioName);
    if (scenario) {
      setPreviewAssets(scenario.assets || []);
      setPreviewScript(scenario.script || null);
      setPreviewShots(scenario.shots || []);
      setPreviewCharacters(scenario.characters || []);
      setPreviewScenario(scenario.mode);
      // 如果场景有单一资产，直接预览
      if (scenario.asset) {
        setPreviewingAsset(scenario.asset);
      }
      // 显示预览面板
      setPreviewPanelVisible(true);

      // P0: 为每个资产生成子图（带节点数据）
      const { getOrCreateSubgraphByAssetId, setSubgraphContent } = useSubgraphStore.getState();

      // 处理资产列表
      (scenario.assets || []).forEach(asset => {
        const subgraph = getOrCreateSubgraphByAssetId(asset.id, asset.type, asset.name);
        // 如果资产有子图节点数据，设置到子图
        if (asset.subgraphNodes && subgraph) {
          setSubgraphContent(subgraph.id, asset.subgraphNodes, []);
        }
      });

      // 如果场景有单一资产，也为其创建子图
      if (scenario.asset) {
        const subgraph = getOrCreateSubgraphByAssetId(scenario.asset.id, scenario.asset.type, scenario.asset.name);
        if (scenario.subgraphNodes && subgraph) {
          setSubgraphContent(subgraph.id, scenario.subgraphNodes, []);
        }
      }
    }
  };

  // Project Store
  const {
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
    setCurrentLayer(layer);
    // 如果切换到非节点层，清除选中节点
    if (layer !== 'node') {
      setRightPanelVisible(false);
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
  }, []);

  const handleShotSelect = useCallback((shotId) => {
    setSelectedShotId(shotId);
    // 设置焦点实体
    setFocusedEntity(`镜头${shotId.replace('shot-', '')}`);
  }, []);

  const handleConversationAdjust = useCallback(() => {
    // 切换到对话层
    setCurrentLayer('conversation');
  }, []);

  // P0: 处理子图聚焦（从子图列表进入节点画布）
  const handleSubgraphFocus = useCallback((subgraphId) => {
    // 切换到节点视图模式
    setNodeViewMode('nodes');
    // 设置焦点子图
    useSubgraphStore.getState().setFocusedSubgraph(subgraphId);
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

  // P5: 继续对话 - 将资产引用注入到对话输入框
  const handleContinueConversation = useCallback((asset) => {
    if (!asset || !chatRef.current) return;
    const reference = `[@${asset.type}:${asset.name}]`;
    chatRef.current.injectMessage(reference);
    setPreviewPanelVisible(false);
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

  // P0: 切换到节点层时，如果有子图则自动显示子图列表
  useEffect(() => {
    if (currentLayer === 'node') {
      const subgraphs = useSubgraphStore.getState().subgraphs;
      if (subgraphs.length > 0) {
        setNodeViewMode('subgraph');
      } else {
        setNodeViewMode('nodes');
      }

      // 如果没有子图，加载演示数据
      if (subgraphs.length === 0) {
        loadDemoSubgraphs();
      }
    }
  }, [currentLayer]);

  // P0: 加载演示用子图数据
  const loadDemoSubgraphs = () => {
    const { getOrCreateSubgraphByAssetId, setSubgraphContent, updateSubgraph } = useSubgraphStore.getState();

    // 角色类
    const char1 = getOrCreateSubgraphByAssetId('demo-char-1', 'character', '红发女黑客');
    setSubgraphContent(char1.id, [
      { id: 'dc1-node-1', name: '角色设计', type: 'visual' },
      { id: 'dc1-node-2', name: 'Prompt优化', type: 'content' },
      { id: 'dc1-node-3', name: '高清渲染', type: 'videoGen' },
    ], []);

    const char2 = getOrCreateSubgraphByAssetId('demo-char-2', 'character', '安保人员A');
    setSubgraphContent(char2.id, [
      { id: 'dc2-node-1', name: '角色设计', type: 'visual' },
      { id: 'dc2-node-2', name: '服装生成', type: 'content' },
    ], []);

    const char3 = getOrCreateSubgraphByAssetId('demo-char-3', 'character', 'AI管理员');
    setSubgraphContent(char3.id, [
      { id: 'dc3-node-1', name: 'AI形象设计', type: 'visual' },
      { id: 'dc3-node-2', name: '语音合成', type: 'technical' },
      { id: 'dc3-node-3', name: '行为模型', type: 'content' },
    ], []);

    // 场景类
    const scene1 = getOrCreateSubgraphByAssetId('demo-scene-1', 'scene', '数据中心场景');
    setSubgraphContent(scene1.id, [
      { id: 'ds1-node-1', name: '场景构图', type: 'director' },
      { id: 'ds1-node-2', name: '环境光照', type: 'visual' },
      { id: 'ds1-node-3', name: '氛围渲染', type: 'videoGen' },
    ], []);

    const scene2 = getOrCreateSubgraphByAssetId('demo-scene-2', 'scene', '霓虹雨夜街道');
    setSubgraphContent(scene2.id, [
      { id: 'ds2-node-1', name: '街道布局', type: 'director' },
      { id: 'ds2-node-2', name: '霓虹灯光', type: 'visual' },
      { id: 'ds2-node-3', name: '雨天特效', type: 'technical' },
      { id: 'ds2-node-4', name: '最终合成', type: 'videoGen' },
    ], [
      { id: 'c1', from: 'ds2-node-1', to: 'ds2-node-2' },
      { id: 'c2', from: 'ds2-node-3', to: 'ds2-node-2' },
      { id: 'c3', from: 'ds2-node-2', to: 'ds2-node-4' },
    ]);

    // 道具类
    const prop1 = getOrCreateSubgraphByAssetId('demo-prop-1', 'prop', '服务器终端');
    setSubgraphContent(prop1.id, [
      { id: 'dp1-node-1', name: '道具建模', type: 'technical' },
      { id: 'dp1-node-2', name: '材质贴图', type: 'visual' },
    ], []);

    const prop2 = getOrCreateSubgraphByAssetId('demo-prop-2', 'prop', '黑客终端');
    setSubgraphContent(prop2.id, [
      { id: 'dp2-node-1', name: '终端建模', type: 'technical' },
      { id: 'dp2-node-2', name: '代码动画', type: 'content' },
    ], []);

    // 设置不同状态
    updateSubgraph(char1.id, { syncStatus: 'synced' });
    updateSubgraph(char2.id, { syncStatus: 'modified' });
    updateSubgraph(char3.id, { syncStatus: 'running' });
    updateSubgraph(scene1.id, { syncStatus: 'synced' });
    updateSubgraph(scene2.id, { syncStatus: 'synced' });
    updateSubgraph(prop1.id, { syncStatus: 'error', lastError: '渲染超时' });
    updateSubgraph(prop2.id, { syncStatus: 'synced' });

    setNodeViewMode('subgraph');
  };

  // P0: 监听资产生成事件，自动创建子图
  useEffect(() => {
    const { getOrCreateSubgraphByAssetId } = useSubgraphStore.getState();

    const handleAssetGenerated = ({ asset }) => {
      if (asset) {
        getOrCreateSubgraphByAssetId(asset.id, asset.type, asset.name);
      }
    };

    eventBus.on(EVENT_TYPES.ASSET_GENERATED, handleAssetGenerated);
    return () => {
      eventBus.off(EVENT_TYPES.ASSET_GENERATED, handleAssetGenerated);
    };
  }, []);

  // ESC 键关闭预览全屏
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && previewFullscreen) {
        setPreviewFullscreen(false);
      }
    };
    if (previewFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewFullscreen]);

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

    // 初始化 mock 数据（PRD 2.0 开发阶段）
    const { setStageAssets, setStageCompletion } = useStageStore.getState();
    const { initializeMockData } = await import('./mock/stagesMock');
    initializeMockData(setStageAssets, setStageCompletion);

    if (demoId) {
      setIsDemoMode(true);
      setProjectName('Demo演示');
      setCurrentView('workspace');
      setCurrentLayer('node'); // Demo 默认显示节点层
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
              uiLogger.error('[App] Failed to parse project config:', e);
            }
          }
          await loadVersions(projectId);
        }
      } catch (error) {
        uiLogger.error('[App] Failed to load project data:', error);
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
      setFocusedEntity(node.name);
    }
  }, [setSelectedNodeId]);

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
    <div className="app-container">
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
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          {/* 主内容区 */}
          <main
            ref={containerRef}
            className={`workspace-main ${isCanvasFullscreen ? 'canvas-fullscreen' : ''} ${isDraggingLeft ? 'dragging' : ''}`}
          >
            {/* 左侧面板 - 仅对话层和节点层显示 */}
            {currentLayer !== 'storyboard' && (
              <>
                <aside
                  className={`panel-left ${leftCollapsed ? 'collapsed' : ''} ${isCanvasFullscreen ? 'hidden' : ''}`}
                  style={{ flex: `0 0 ${actualLeftWidth}vw` }}
                >
                  <div className="panel-content">
                    <Console
                      ref={chatRef}
                      onLoadWorkflow={handleLoadWorkflow}
                      pendingChatMessage={planningRawInput}
                      onPendingChatMessageSent={() => {}}
                      messages={sharedMessages}
                      onMessagesChange={setSharedMessages}
                      onPlanReceived={handlePlanReceived}
                      onDrillDown={handleDrillDown}
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
              </>
            )}

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
                      viewMode={nodeViewMode}
                      onSubgraphFocus={handleSubgraphFocus}
                      onSwitchToSubgraphView={() => setNodeViewMode('subgraph')}
                    />
                  </motion.div>
                )}

                {/* 对话层 - 中间内容区（100%宽度）+ 右侧浮层抽屉 */}
                {currentLayer === 'conversation' && (
                  <>
                    {/* 中间内容区 - 100%宽度 */}
                    <div
                      className="conversation-content-area"
                      style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }}
                    >
                      {/* 场景选择器（开发测试用） */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--bg-toolbar)',
                      }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginRight: '8px' }}>
                          预览场景：
                        </span>
                        <button
                          onClick={() => loadPreviewScenario('single_asset')}
                          style={scenarioBtnStyle(previewScenario === 'single_asset', '#3b82f6')}
                        >
                          📦 单一资产
                        </button>
                        <button
                          onClick={() => loadPreviewScenario('asset_grid')}
                          style={scenarioBtnStyle(previewScenario === 'asset_grid', '#06b6d4')}
                        >
                          📚 多资产
                        </button>
                        <button
                          onClick={() => loadPreviewScenario('script_editor')}
                          style={scenarioBtnStyle(previewScenario === 'script_editor', '#818cf8')}
                        >
                          📝 剧本
                        </button>
                        <button
                          onClick={() => loadPreviewScenario('sequence')}
                          style={scenarioBtnStyle(previewScenario === 'sequence', '#f59e0b')}
                        >
                          🎬 序列
                        </button>
                      </div>

                      {/* 主内容区 - 根据场景显示不同视图 */}
                      <div style={{ flex: 1, overflow: 'auto', padding: '16px', minHeight: 0 }}>

                        {/* 单一资产预览 - hover显示点击提示 + 全屏 + @引用按钮 */}
                        {previewScenario === 'single_asset' && previewAssets.length === 1 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '600px',
                                aspectRatio: '16/10',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                setPreviewingAsset(previewAssets[0]);
                                setPreviewPanelVisible(true);
                              }}
                            >
                              <img
                                src={previewAssets[0].thumbnail}
                                alt={previewAssets[0].name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              {/* 全屏按钮 */}
                              <button
                                className="preview-fullscreen-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFullscreen(true);
                                }}
                                title="全屏查看"
                              >
                                <Maximize2 size={14} />
                              </button>
                              {/* @引用按钮 */}
                              <button
                                className="preview-reference-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const asset = previewAssets[0];
                                  const reference = `[@${asset.type}:${asset.name}]`;
                                  chatRef.current?.injectMessage(reference);
                                }}
                                title="引用到输入框"
                              >
                                @
                              </button>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                              {previewAssets[0].name}
                            </p>
                          </div>
                        )}

                        {/* 预览区全屏查看遮罩 */}
                        {previewFullscreen && previewAssets[0] && (
                          <div
                            style={{
                              position: 'fixed',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0, 0, 0, 0.95)',
                              zIndex: 10000,
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewFullscreen(false)}
                          >
                            <button
                              style={{
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                color: 'white',
                                cursor: 'pointer',
                              }}
                              onClick={() => setPreviewFullscreen(false)}
                            >
                              <X size={20} />
                            </button>
                            <img
                              src={previewAssets[0].thumbnail}
                              alt={previewAssets[0].name}
                              style={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: 8,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                                cursor: 'default',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}

                        {/* 多资产网格 */}
                        {previewScenario === 'asset_grid' && (
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <AssetGridView
                              assets={previewAssets}
                              onAssetClick={(asset) => {
                                setPreviewingAsset(asset);
                                setPreviewPanelVisible(true);
                              }}
                              onReference={(asset) => {
                                const reference = `[@${asset.type}:${asset.name}]`;
                                chatRef.current?.injectMessage(reference);
                              }}
                              onSwitchToSequence={() => setPreviewScenario('sequence')}
                            />
                          </div>
                        )}

                        {/* 剧本编辑器 */}
                        {previewScenario === 'script_editor' && (
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                            <ScriptEditorView
                              script={previewScript}
                              onGenerateStoryboard={() => setPreviewScenario('sequence')}
                            />
                          </div>
                        )}

                        {/* 序列模式 */}
                        {previewScenario === 'sequence' && (
                          <SequenceModeView
                            shots={previewShots}
                            characters={previewCharacters}
                            script={previewScript}
                            onShotClick={(shot) => {
                              // 创建临时资产对象用于预览
                              setPreviewingAsset({
                                id: shot.id,
                                name: shot.label,
                                type: shot.type === 'video' ? 'video' : 'image',
                                thumbnail: shot.thumbnail,
                              });
                              setPreviewPanelVisible(true);
                            }}
                            onSwitchToAsset={() => setPreviewScenario('asset_grid')}
                          />
                        )}

                        {/* 空状态 */}
                        {!previewScenario && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎬</div>
                              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>还没有生成任何内容</p>
                              <p style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>在左侧对话中描述你的创意，这里将自动展示</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* P5: 右侧浮层抽屉 */}
                    <AnimatePresence>
                      {previewPanelVisible && previewingAsset && (
                        <>
                          {/* 遮罩层 */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                              position: 'fixed',
                              inset: 0,
                              background: 'rgba(0, 0, 0, 0.5)',
                              zIndex: 998,
                            }}
                            onClick={() => setPreviewPanelVisible(false)}
                          />

                          {/* 右侧抽屉 */}
                          <motion.aside
                            initial={{ x: 400 }}
                            animate={{ x: 0 }}
                            exit={{ x: 400 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            style={{
                              position: 'fixed',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: '400px',
                              background: 'var(--bg-panel)',
                              borderLeft: '1px solid var(--border-subtle)',
                              zIndex: 999,
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            {/* 抽屉头部 */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--border-subtle)',
                              background: 'var(--bg-toolbar)',
                            }}>
                              <button
                                onClick={() => setPreviewPanelVisible(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 10px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: 'var(--text-secondary)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                ← 返回
                              </button>
                              <button
                                onClick={() => setPreviewPanelVisible(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                }}
                              >
                                ✕
                              </button>
                            </div>

                            {/* 抽屉内容 */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                              <SingleAssetView
                                asset={previewingAsset}
                                onContinueConversation={handleContinueConversation}
                              />
                            </div>
                          </motion.aside>
                        </>
                      )}
                    </AnimatePresence>
                  </>
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
                title="资产库"
                currentEditingContext={selectedShotId ? `镜头${selectedShotId.replace('shot-', '')}` : null}
                onAssetSelect={(asset) => {
                  console.log('[App] 资产选中:', asset);
                }}
                onAssetDrag={(asset) => {
                  console.log('[App] 资产拖拽:', asset);
                }}
                onJump={(layer, id) => {
                  console.log('[App] 跳转:', layer, id);
                  // 关闭资产库
                  setAssetLibraryOpen(false);
                  // 根据层级跳转
                  if (layer === 'conversation') {
                    setCurrentLayer('conversation');
                    setFocusedEntity({ type: 'conversation', id });
                  } else if (layer === 'storyboard') {
                    setCurrentLayer('storyboard');
                    setFocusedEntity({ type: 'storyboard', id });
                  } else if (layer === 'workflow') {
                    // 工作流：先显示概览，这里暂时直接跳到节点层
                    // TODO: 实现工作流概览浮层
                    setCurrentLayer('node');
                    setFocusedEntity({ type: 'workflow', id });
                  }
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
        </div>
      )}
      <ToastContainer />
      <BottomToastContainer />

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

      {/* PRD 2.0: 悬浮助手 */}
      <FloatingAssistantButton
        onClick={() => setFloatingAssistantOpen(true)}
      />
      <FloatingAssistantDrawer
        isOpen={floatingAssistantOpen}
        onClose={() => setFloatingAssistantOpen(false)}
        onMinimize={() => setFloatingAssistantOpen(false)}
        ref={chatRef}
        messages={sharedMessages}
        onMessagesChange={setSharedMessages}
      />
    </div>
  );
}

export default App;
