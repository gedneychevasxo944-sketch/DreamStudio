import { useState, useRef, useCallback, useEffect } from 'react';
import { Home, GitCompare, ChevronLeft, ChevronRight, PanelLeft, PanelRight, Package, Save, Plus, FileText, Edit2, Check, X, History, Trash2, AlertTriangle, FilePlus } from 'lucide-react';
import Console from './components/Console';
import NodeCanvas from './components/NodeCanvas/NodeCanvas';
import AssetPanel from './components/AssetPanel/AssetPanel';
import Modal from './components/Modal';
import HomePage from './components/HomePage';
import SkillMarket from './components/SkillMarket/SkillMarket';
import { homePageApi, workSpaceApi } from './services/api';
import './App.css';

// 获取节点默认宽度
const getDefaultNodeWidth = (nodeType) => {
  if (nodeType === 'visual' || nodeType === 'director' || nodeType === 'technical') {
    return 540;
  }
  return 360;
};

const getNodeDefaultData = (type) => {
  return {};
};

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
      data: getNodeDefaultData(type)
    });

    currentX += nodeWidth + gap;
  });

  return nodes;
};

// 版本数据现在从后端获取

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [showSkillMarket, setShowSkillMarket] = useState(false);
  
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectName, setProjectName] = useState('未命名项目');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedProjectState, setSavedProjectState] = useState(null);

  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);

  const [executionLogs, setExecutionLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const [canvasNodes, setCanvasNodes] = useState([]);
  const [canvasConnections, setCanvasConnections] = useState([]);
  const [canvasViewport, setCanvasViewport] = useState({ x: 0, y: 0, zoom: 1 });

  // 待发送的聊天消息（从主页输入）
  const [pendingChatMessage, setPendingChatMessage] = useState(null);

  const [leftWidth, setLeftWidth] = useState(20);
  const [rightWidth, setRightWidth] = useState(18);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const containerRef = useRef(null);
  const versionDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target)) {
        setShowVersionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (savedProjectState) {
      const currentState = JSON.stringify({ nodes: canvasNodes, connections: canvasConnections, viewport: canvasViewport, name: projectName });
      const savedState = JSON.stringify(savedProjectState);
      setHasUnsavedChanges(currentState !== savedState);
    } else if (canvasNodes.length > 0 || canvasConnections.length > 0 || projectName !== '未命名项目') {
      setHasUnsavedChanges(true);
    }
  }, [canvasNodes, canvasConnections, canvasViewport, projectName, savedProjectState]);

  const addExecutionLog = useCallback((log) => {
    setExecutionLogs(prev => [...prev, { ...log, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  // 加载工作流到画布
  const handleLoadWorkflow = useCallback((nodes, edges) => {
    // 自动排版参数
    const startX = 100;
    const startY = 300;
    const gap = 150; // 节点间隔

    // 转换节点格式，如果没有位置则自动排版
    let currentX = startX;
    const formattedNodes = nodes.map((node) => {
      const nodeWidth = getDefaultNodeWidth(node.type);
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

    // 转换连线格式
    const formattedEdges = edges.map(edge => ({
      id: edge.id || `${edge.source}-${edge.sourceHandle || 'output'}-${edge.target}-${edge.targetHandle || 'input'}`,
      from: edge.source,
      fromPort: edge.sourceHandle || 'output',
      to: edge.target,
      toPort: edge.targetHandle || 'input',
      type: 'data-flow'
    }));

    setCanvasNodes(formattedNodes);
    setCanvasConnections(formattedEdges);
    setHasUnsavedChanges(true);
  }, []);

  const handleBeforeExecute = useCallback(async () => {
    let projectId = currentProjectId;

    // 如果没有项目ID，先创建新项目
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

    // 保存工作流数据
    const config = {
      nodes: canvasNodes,
      connections: canvasConnections,
      viewport: canvasViewport
    };
    await homePageApi.saveProject(projectId, projectName, config);
  }, [currentProjectId, projectName, canvasNodes, canvasConnections, canvasViewport]);

  const handleTemplateWorkflow = (userInput, timestamp) => {
    setIsRunning(true);
    
    const templates = [
      { id: 'hollywood', name: '好莱坞工业流水线', color: '#f59e0b' },
      { id: 'rapid', name: '极速概念片团队', color: '#3b82f6' },
      { id: 'minimal', name: '极简单兵模式', color: '#10b981' }
    ];
    
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    setTimeout(() => {
      addExecutionLog({
        level: 'system',
        agent: '系统',
        thinking: '正在分析用户输入..."1"，识别为预设模板请求。\n正在匹配预设模板库...\n找到匹配模板：' + selectedTemplate.name,
        thinkingDuration: '1.5秒',
        result: '',
        timestamp: timestamp,
        isThinkingComplete: false,
      });
    }, 500);
    
    setTimeout(() => {
      setExecutionLogs(prev => {
        const newLogs = [...prev];
        const lastLog = newLogs.find(log => log.level === 'system' && !log.result);
        if (lastLog) {
          lastLog.isThinkingComplete = true;
          lastLog.result = '已为你找到匹配的预设模板：' + selectedTemplate.name + '。点击画布上方的运行按钮执行即可。';
        }
        return newLogs;
      });
      
      let templateNodes = [];
      let templateConnections = [];

      if (selectedTemplate.id === 'hollywood') {
        templateNodes = calculateTemplateNodePositions([
          { type: 'producer', name: '资深影视制片人', color: '#3b82f6', icon: 'Target' },
          { type: 'content', name: '金牌编剧', color: '#06b6d4', icon: 'PenTool' },
          { type: 'visual', name: '概念美术总监', color: '#8b5cf6', icon: 'Palette' },
          { type: 'director', name: '分镜导演', color: '#f59e0b', icon: 'Video' },
          { type: 'technical', name: '视频提示词工程师', color: '#10b981', icon: 'Code' }
        ]);
        templateConnections = [
          { id: 'conn-1', from: 'producer', to: 'content', type: 'data-flow' },
          { id: 'conn-2', from: 'content', to: 'visual', type: 'data-flow' },
          { id: 'conn-3', from: 'visual', to: 'director', type: 'data-flow' },
          { id: 'conn-4', from: 'director', to: 'technical', type: 'data-flow' }
        ];
      } else if (selectedTemplate.id === 'rapid') {
        templateNodes = calculateTemplateNodePositions([
          { type: 'content', name: '金牌编剧', color: '#06b6d4', icon: 'PenTool' },
          { type: 'visual', name: '概念美术总监', color: '#8b5cf6', icon: 'Palette' },
          { type: 'director', name: '分镜导演', color: '#f59e0b', icon: 'Video' }
        ]);
        templateConnections = [
          { id: 'conn-1', from: 'content', to: 'visual', type: 'data-flow' },
          { id: 'conn-2', from: 'visual', to: 'director', type: 'data-flow' }
        ];
      } else if (selectedTemplate.id === 'minimal') {
        templateNodes = calculateTemplateNodePositions([
          { type: 'director', name: '分镜导演', color: '#f59e0b', icon: 'Video' }
        ], 400);
        templateConnections = [];
      }
      
      setCanvasNodes(templateNodes);
      setCanvasConnections(templateConnections);

      console.log('[模板加载]', selectedTemplate.name, '节点:', JSON.stringify(templateNodes));
      
      setIsRunning(false);
    }, 2500);
  };

  const handleTeamWorkflow = (userInput, timestamp) => {
    setIsRunning(true);
    
    setTimeout(() => {
      addExecutionLog({
        level: 'system',
        agent: '系统',
        thinking: '正在分析用户输入..."2"，识别为团队组装请求。\n正在根据需求"制片人->编剧->美术->分镜"匹配智能体...\n正在构建协作流程...',
        thinkingDuration: '2秒',
        result: '',
        timestamp: timestamp,
        isThinkingComplete: false,
      });
    }, 500);
    
    setTimeout(() => {
      setExecutionLogs(prev => {
        const newLogs = [...prev];
        const lastLog = newLogs.find(log => log.level === 'system' && !log.result);
        if (lastLog) {
          lastLog.isThinkingComplete = true;
          lastLog.result = '根据您的想法，为你找到可以解决的团队。如果没有问题，点击画布上方的运行按钮执行即可。';
        }
        return newLogs;
      });
      
      const SPACING = 460;
      const Y_POS = 200;
      setCanvasNodes([
        { id: 'content', name: '金牌编剧', type: 'content', x: 50, y: Y_POS, color: '#06b6d4', icon: 'PenTool' },
        { id: 'director', name: '分镜导演', type: 'director', x: 50 + SPACING, y: Y_POS, color: '#f59e0b', icon: 'Video' }
      ]);

      setCanvasConnections([
        { id: 'conn-1', from: 'content', to: 'director', type: 'data-flow' }
      ]);
      
      setIsRunning(false);
    }, 3000);
  };

  const handleDefaultWorkflow = (userInput, timestamp) => {
    setIsRunning(true);
    
    setTimeout(() => {
      addExecutionLog({
        level: 'system',
        agent: '系统',
        thinking: `正在分析你的想法："${userInput}"...\n正在评估项目需求...\n正在匹配合适的智能体...`,
        thinkingDuration: '2秒',
        result: '',
        timestamp: timestamp,
        isThinkingComplete: false,
      });
    }, 500);
    
    setTimeout(() => {
      setExecutionLogs(prev => {
        const newLogs = [...prev];
        const lastLog = newLogs.find(log => log.level === 'system' && !log.result);
        if (lastLog) {
          lastLog.isThinkingComplete = true;
          lastLog.result = '根据您的想法，为你找到可以解决的团队。如果没有问题，点击画布上方的运行按钮执行即可。';
        }
        return newLogs;
      });
      
      setIsRunning(false);
    }, 3000);
  };

  const handleSendCommand = useCallback((content, timestamp) => {
    addExecutionLog({
      level: 'user',
      agent: '用户',
      content: content,
      timestamp: timestamp,
    });
    
    console.log('用户发送命令:', content);
  }, [addExecutionLog]);

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setActiveModal('nodeDetail');
  };

  const handleOpenDiffView = () => {
    setActiveModal('diffView');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedNode(null);
  };

  // 加载版本列表 - 必须在 handleHomePageEnter 之前定义
  const loadVersions = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      // 同时获取历史版本列表和项目详情（包含当前版本）
      const [versionsResponse, projectResponse] = await Promise.all([
        homePageApi.getVersions(projectId),
        homePageApi.getProject(projectId)
      ]);
      
      if (versionsResponse.data && projectResponse.data) {
        // 格式化历史版本
        const historyVersions = versionsResponse.data.versions.map(v => ({
          id: v.id,
          name: `V${v.versionNumber}.0`,
          versionNumber: v.versionNumber,
          description: v.description,
          createdAt: v.createdTime,
          isDefault: false,
          config: v.config
        }));
        
        // 添加当前版本到列表顶部
        const currentVersionNumber = projectResponse.data.currentVersion;
        console.log('[loadVersions] currentVersionNumber from backend:', currentVersionNumber);
        const currentVersion = {
          id: 'current',
          name: `V${currentVersionNumber}.0`,
          versionNumber: currentVersionNumber,
          description: '当前版本',
          createdAt: projectResponse.data.updatedTime,
          isDefault: true,
          config: projectResponse.data.config
        };
        
        const allVersions = [currentVersion, ...historyVersions];
        setVersions(allVersions);
        setCurrentVersion(currentVersion);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  }, []);

  const handleHomePageEnter = useCallback(async (userInput, shouldTriggerSystem = true, projectId = null, initialProjectName = null) => {
    setExecutionLogs([]);
    
    if (projectId) {
      // 从最近项目进入 - 加载已有项目
      setCurrentProjectId(projectId);
      console.log('[项目] 进入工作台，项目ID:', projectId);
      
      // 加载项目详情
      try {
        const projectResponse = await homePageApi.getProject(projectId);
        if (projectResponse.data) {
          setProjectName(projectResponse.data.title || '未命名项目');
        }
        
        // 加载工作流数据（从项目详情中获取）
        if (projectResponse.data.config) {
          try {
            const config = typeof projectResponse.data.config === 'string'
              ? JSON.parse(projectResponse.data.config)
              : projectResponse.data.config;
            
            console.log('[加载项目] config:', config);
            
            // 强制重新挂载画布
            setCanvasKey(prev => {
              console.log('[加载项目] 更新 canvasKey:', prev + 1);
              return prev + 1;
            });
            
            // 在重新挂载后设置新数据
            setTimeout(() => {
              console.log('[加载项目] setTimeout 执行，设置新数据');
              if (config.nodes) {
                console.log('[加载项目] 设置 canvasNodes:', config.nodes.length, '个节点');
                setCanvasNodes(config.nodes);
              }
              if (config.connections) {
                console.log('[加载项目] 设置 canvasConnections:', config.connections.length, '条连线');
                setCanvasConnections(config.connections);
              }
              if (config.viewport) {
                setCanvasViewport(config.viewport);
              }
            }, 100);
          } catch (e) {
            console.error('Failed to parse project config:', e);
          }
        }
        
        // 加载版本列表
        await loadVersions(projectId);
        
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    } else {
      // 新建项目 - 立即调用后端创建（版本在第一次保存时创建）
      const projectTitle = initialProjectName || (userInput ? (userInput.length > 20 ? userInput.substring(0, 20) + '...' : userInput) : '未命名项目');
      setProjectName(projectTitle);
      
      try {
        const createResponse = await homePageApi.createProject(projectTitle, null, {});
        if (createResponse.data) {
          const newProjectId = createResponse.data.id;
          setCurrentProjectId(newProjectId);
          console.log('[项目] 创建新项目:', newProjectId);
          
          // 清空版本列表（等待第一次保存时创建V1.0）
          setVersions([]);
          setCurrentVersion(null);
        }
      } catch (error) {
        console.error('Failed to create project:', error);
        alert('创建项目失败: ' + error.message);
        return;
      }
    }

    setSavedProjectState(null);
    setHasUnsavedChanges(false);

    setCurrentView('workspace');

    // 如果有用户输入，设置待发送的聊天消息
    if (shouldTriggerSystem && userInput) {
      setPendingChatMessage(userInput);
    }
  }, [loadVersions]);

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      let projectId = currentProjectId;
      let isNewProject = false;
      
      // 如果没有项目ID，先创建新项目
      if (!projectId) {
        const createResponse = await homePageApi.createProject(projectName);
        if (createResponse.data) {
          projectId = createResponse.data.id;
          setCurrentProjectId(projectId);
          isNewProject = true;
          console.log('Created new project:', projectId);
        }
      }
      
      if (!projectId) {
        throw new Error('Failed to create project');
      }
      
      // 保存工作流数据（包含项目名称和画布配置）
      const config = {
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: canvasViewport
      };
      console.log('Saving config:', JSON.stringify(config, null, 2));
      const response = await homePageApi.saveProject(projectId, projectName, config);
      
      // 更新版本号（从返回数据中获取最新版本）
      // 响应结构: { code, message, data: { currentVersion, ... } }
      if (response.data && response.data.currentVersion) {
        setCurrentVersion({
          name: `V${response.data.currentVersion}.0`,
          version: response.data.currentVersion,
          description: '当前版本'
        });
      }
      
      // 刷新版本历史列表
      await loadVersions(projectId);
      
      setSavedProjectState({
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: canvasViewport,
        name: projectName
      });
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewProjectClick = async () => {
    if (hasUnsavedChanges) {
      setShowNewProjectConfirm(true);
    } else {
      await createNewProject();
    }
  };

  // 用于强制重新挂载NodeCanvas的key
  const [canvasKey, setCanvasKey] = useState(0);

  const createNewProject = async () => {
    setCanvasNodes([]);
    setCanvasConnections([]);
    setExecutionLogs([]);
    setSavedProjectState(null);
    setHasUnsavedChanges(false);
    setShowNewProjectConfirm(false);
    // 强制重新挂载NodeCanvas组件，确保画布完全清空
    setCanvasKey(prev => prev + 1);
    
    // 立即创建新项目（版本在第一次保存时创建）
    try {
      const createResponse = await homePageApi.createProject('未命名项目', null, {});
      if (createResponse.data) {
        const newProjectId = createResponse.data.id;
        setCurrentProjectId(newProjectId);
        setProjectName(createResponse.data.title || '未命名项目');
        console.log('[项目] 创建新项目:', newProjectId);
        
        // 清空版本列表（等待第一次保存时创建V1.0）
        setVersions([]);
        setCurrentVersion(null);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('创建项目失败: ' + error.message);
    }
  };

  const saveAndCreateNewProject = async () => {
    await handleSaveProject();
    await createNewProject();
  };

  const cancelNewProject = () => {
    setShowNewProjectConfirm(false);
  };

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

  const handleSwitchVersion = async (version) => {
    try {
      console.log('[handleSwitchVersion] 切换版本:', version.name, 'versionNumber:', version.versionNumber, 'isDefault:', version.isDefault);
      
      // 1. 强制重新挂载画布（清空）
      setCanvasKey(prev => prev + 1);
      
      // 2. 清空数据
      setCanvasNodes([]);
      setCanvasConnections([]);
      
      // 3. 获取版本数据
      console.log('[handleSwitchVersion] 调用API, currentProjectId:', currentProjectId, 'versionNumber:', version.versionNumber);
      const response = version.isDefault
        ? await homePageApi.getProject(currentProjectId)
        : await homePageApi.getVersion(currentProjectId, version.versionNumber);
      
      // 4. 设置新数据
      if (response.data && response.data.config) {
        const config = typeof response.data.config === 'string' ? JSON.parse(response.data.config) : response.data.config;
        setCanvasNodes(config.nodes || []);
        setCanvasConnections(config.connections || []);
        setCanvasViewport(config.viewport || { x: 0, y: 0, zoom: 1 });
      }
      
      // 更新项目名称（从历史版本中恢复）
      if (response.data && response.data.title) {
        setProjectName(response.data.title);
      }
      
      setCurrentVersion(version);
      setShowVersionDropdown(false);
      console.log('切换到版本:', version.name);
    } catch (error) {
      console.error('Failed to switch version:', error);
      alert('切换版本失败: ' + error.message);
    }
  };

  const requestDeleteVersion = (version, e) => {
    e.stopPropagation();
    setVersionToDelete(version);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteVersion = async () => {
    if (versionToDelete && currentProjectId) {
      try {
        await workSpaceApi.deleteVersion(currentProjectId, versionToDelete.id);
        setVersions(prev => prev.filter(v => v.id !== versionToDelete.id));
        if (currentVersion?.id === versionToDelete.id && versions.length > 1) {
          const remainingVersions = versions.filter(v => v.id !== versionToDelete.id);
          setCurrentVersion(remainingVersions[0]);
        }
      } catch (error) {
        console.error('Failed to delete version:', error);
        alert('删除版本失败: ' + error.message);
      }
    }
    setShowDeleteConfirm(false);
    setVersionToDelete(null);
  };

  const cancelDeleteVersion = () => {
    setShowDeleteConfirm(false);
    setVersionToDelete(null);
  };

  const handleToggleCanvasFullscreen = () => {
    setIsCanvasFullscreen(!isCanvasFullscreen);
  };

  const startDragLeft = useCallback((e) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  }, []);

  const startDragRight = useCallback((e) => {
    e.preventDefault();
    setIsDraggingRight(true);
  }, []);

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
  }, [isDraggingLeft, isDraggingRight]);

  const toggleLeftCollapse = () => {
    setLeftCollapsed(!leftCollapsed);
  };

  const toggleRightCollapse = () => {
    setRightCollapsed(!rightCollapsed);
  };

  const actualLeftWidth = leftCollapsed ? 0 : (isCanvasFullscreen ? 0 : leftWidth);
  const actualRightWidth = rightCollapsed ? 0 : (isCanvasFullscreen ? 0 : rightWidth);
  const centerWidth = isCanvasFullscreen
    ? 100
    : (100 - actualLeftWidth - actualRightWidth);

  return (
    <div className="app-container">
      {currentView === 'home' ? (
        <HomePage onEnter={handleHomePageEnter} />
      ) : (
        <div className="workspace">
          <header className="workspace-header glass">
            <div className="header-left">
              <div className="logo-mini" onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>
                <span className="logo-text">造梦</span>
                <span className="logo-sub">AI</span>
              </div>
              
              <div className="project-name-section">
                <FileText size={16} className="project-icon" />
                {isEditingName ? (
                  <div className="project-name-edit">
                    <input
                      type="text"
                      value={tempProjectName}
                      onChange={(e) => setTempProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveProjectName();
                        if (e.key === 'Escape') cancelEditingName();
                      }}
                      autoFocus
                      className="project-name-input"
                    />
                    <button className="name-action-btn save" onClick={saveProjectName}>
                      <Check size={14} />
                    </button>
                    <button className="name-action-btn cancel" onClick={cancelEditingName}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="project-name-display">
                    <span className="project-name-text" title={projectName}>
                      {projectName}
                    </span>
                    {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
                    <button className="edit-name-btn" onClick={startEditingName} title="编辑项目名称">
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="version-selector" ref={versionDropdownRef}>
                <button 
                  className="version-dropdown-trigger"
                  onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                >
                  <History size={14} />
                  <span>{currentVersion?.name || 'V1.0'}</span>
                  <ChevronRight 
                    size={14} 
                    className={`dropdown-arrow ${showVersionDropdown ? 'open' : ''}`}
                  />
                </button>
                
                {showVersionDropdown && (
                  <div className="version-dropdown-menu">
                    <div className="version-dropdown-header">
                      <span>版本历史</span>
                    </div>
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={`version-dropdown-item ${currentVersion?.id === version.id ? 'active' : ''}`}
                        onClick={() => handleSwitchVersion(version)}
                      >
                        <div className="version-info">
                          <span className="version-name">{version.name}</span>
                          <span className="version-desc">{version.description}</span>
                          <span className="version-time">{version.createdAt}</span>
                        </div>
                        {!version.isDefault && (
                          <button
                            className="version-delete-btn"
                            onClick={(e) => requestDeleteVersion(version, e)}
                            title="删除版本"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <nav className="header-nav">
              <button className="nav-btn active">生产流</button>
              <button className="nav-btn">监控台</button>
              <button className="nav-btn">资产库</button>
              <button className="nav-btn" onClick={() => setShowSkillMarket(true)}>
                <Package size={14} />
                <span>Skill市场</span>
              </button>
              <button className="nav-btn diff-btn" onClick={handleOpenDiffView}>
                <GitCompare size={14} />
                <span>代码审查</span>
              </button>
            </nav>

            <div className="header-right">
              <button 
                className={`header-action-btn save-btn ${saveSuccess ? 'success' : ''}`} 
                onClick={handleSaveProject}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="save-spinner" />
                ) : saveSuccess ? (
                  <Check size={16} />
                ) : (
                  <Save size={16} />
                )}
                <span>{saveSuccess ? '已保存' : '保存'}</span>
              </button>
              
              <button className="header-action-btn new-btn" onClick={handleNewProjectClick}>
                <Plus size={16} />
                <span>新建</span>
              </button>
              
              <button className="home-btn" onClick={() => setCurrentView('home')} title="返回主页">
                <Home size={18} />
              </button>
            </div>
          </header>

          <main
            ref={containerRef}
            className={`workspace-main ${isCanvasFullscreen ? 'canvas-fullscreen' : ''} ${isDraggingLeft || isDraggingRight ? 'dragging' : ''}`}
          >
            <aside
              className={`panel-left ${leftCollapsed ? 'collapsed' : ''} ${isCanvasFullscreen ? 'hidden' : ''}`}
              style={{ flex: `0 0 ${actualLeftWidth}vw` }}
            >
              <div className="panel-content">
                <Console 
                  executionLogs={executionLogs}
                  isRunning={isRunning}
                  canvasNodes={canvasNodes}
                  onSendCommand={handleSendCommand}
                  onLoadWorkflow={handleLoadWorkflow}
                  pendingChatMessage={pendingChatMessage}
                  onPendingChatMessageSent={() => setPendingChatMessage(null)}
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

            <section
              className="panel-center"
              style={{ flex: `1 1 ${centerWidth}vw` }}
            >
              <NodeCanvas
                key={canvasKey}
                isFullscreen={isCanvasFullscreen}
                onToggleFullscreen={handleToggleCanvasFullscreen}
                onAddExecutionLog={addExecutionLog}
                onSetRunning={setIsRunning}
                isRunning={isRunning}
                onNodesChange={setCanvasNodes}
                onConnectionsChange={setCanvasConnections}
                initialNodes={canvasNodes}
                initialConnections={canvasConnections}
                projectId={currentProjectId}
                projectVersion={currentVersion?.version}
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
                <AssetPanel
                  nodes={canvasNodes}
                  onExport={(assets) => console.log('导出资产:', assets)}
                  onUpdateNodeData={(nodeId, data) => {
                    setCanvasNodes(prev => prev.map(n =>
                      n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
                    ));
                  }}
                  projectId={currentProjectId}
                />
              </div>
            </aside>
          </main>

          {activeModal && (
            <Modal
              type={activeModal}
              data={selectedNode}
              onClose={handleCloseModal}
            />
          )}

          {showSkillMarket && (
            <SkillMarket
              onClose={() => setShowSkillMarket(false)}
              onInstallSkill={(skill) => console.log('安装Skill:', skill)}
            />
          )}

          {showDeleteConfirm && (
            <div className="delete-confirm-backdrop" onClick={cancelDeleteVersion}>
              <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="delete-confirm-icon">
                  <AlertTriangle size={32} />
                </div>
                <h3>确认删除版本?</h3>
                <p>
                  您即将删除版本 <strong>{versionToDelete?.name}</strong>
                  <br />
                  此操作不可恢复，是否继续?
                </p>
                <div className="delete-confirm-actions">
                  <button className="delete-confirm-btn cancel" onClick={cancelDeleteVersion}>
                    取消
                  </button>
                  <button className="delete-confirm-btn confirm" onClick={confirmDeleteVersion}>
                    <Trash2 size={14} />
                    确认删除
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 新建项目确认弹窗 */}
          {showNewProjectConfirm && (
            <div className="new-project-confirm-backdrop" onClick={cancelNewProject}>
              <div className="new-project-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="new-project-confirm-icon">
                  <FilePlus size={32} />
                </div>
                <h3>新建项目</h3>
                <p>
                  当前项目有未保存的修改
                  <br />
                  如果不保存，修改将会丢失
                </p>
                <div className="new-project-confirm-actions">
                  <button className="new-project-confirm-btn cancel" onClick={cancelNewProject}>
                    取消
                  </button>
                  <button className="new-project-confirm-btn discard" onClick={() => createNewProject()}>
                    <X size={14} />
                    不保存
                  </button>
                  <button className="new-project-confirm-btn save" onClick={() => saveAndCreateNewProject()}>
                    <Save size={14} />
                    保存并新建
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
