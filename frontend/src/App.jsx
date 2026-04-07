import { useState, useRef, useEffect, useCallback } from 'react';
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
import { homePageApi, workSpaceApi } from './services/api';
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
    selectedNode,
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
    setSelectedNode,
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

  // 资产抽屉状态
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);

  // 项目模式状态（工厂/导演）
  const [projectMode, setProjectMode] = useState('factory');

  // 运行按钮状态（模拟）
  const [runButtonText, setRunButtonText] = useState('运行');
  const [runExplanation, setRunExplanation] = useState('');
  const [hasStaleNodes, setHasStaleNodes] = useState(false);

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
  const handleHomePageEnter = useCallback(async (userInput, shouldTriggerSystem = true, projectId = null, initialProjectName = null) => {
    resetCanvas();
    setSavedProjectState(null);
    setHasUnsavedChanges(false);

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
    setPlanningRawInput, setPlanningAttachments
  ]);

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
    setSelectedNode(node);
  }, [setSelectedNode]);

  // 计算实际宽度
  const { actualLeftWidth, actualRightWidth, centerWidth } = getActualWidths();

  // 运行相关处理
  const handleRun = (runType = 'restart') => {
    // runType: 'restart' | 'continue' | 'fromCurrent' | 'currentOnly'
    console.log('Running workflow with type:', runType);
    // TODO: 根据 runType 调用不同的运行逻辑
  };

  const handleViewImpact = () => {
    console.log('Viewing impact...');
    // TODO: 显示影响范围面板
  };

  // 模式切换处理
  const handleModeChange = (mode) => {
    setProjectMode(mode);
    // 后续可以根据模式更新其他状态，如默认审批点等
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

  const handleRestoreVersion = (nodeKey, version) => {
    console.log('Restore version:', nodeKey, version);
    // 恢复版本逻辑
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
            setCurrentView('workspace');
          }}
          onCancel={() => setCurrentView('home')}
          onGoToExecution={() => setCurrentView('workspace')}
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
                runButtonText={runButtonText}
                runExplanation={runExplanation}
                hasStaleNodes={hasStaleNodes}
                onViewImpact={handleViewImpact}
                onNodeSelect={handleNodeSelect}
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
                />
              </div>
            </aside>
          </main>

          {/* 资产抽屉 - 从右滑出的叠加层 */}
          <AssetDrawer
            isOpen={assetDrawerOpen}
            onClose={() => setAssetDrawerOpen(false)}
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
