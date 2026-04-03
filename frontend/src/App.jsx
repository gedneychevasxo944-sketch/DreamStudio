import { useState, useRef, useEffect, useCallback } from 'react';
import { Home, GitCompare, ChevronLeft, ChevronRight, PanelLeft, PanelRight, Package, Save, Plus, FileText, Edit2, Check, X, History, Trash2, AlertTriangle, FilePlus } from 'lucide-react';
import Console from './components/Console';
import NodeCanvas from './components/NodeCanvas/NodeCanvas';
import AssetPanel from './components/AssetPanel/AssetPanel';
import Modal from './components/Modal';
import HomePage from './components/HomePage';
import SkillMarket from './components/SkillMarket/SkillMarket';
import { homePageApi, workSpaceApi } from './services/api';
import { useProjectStore, useWorkflowStore, useUIStore, calculateTemplateNodePositions } from './stores';
import './App.css';

function App() {
  const containerRef = useRef(null);
  const versionDropdownRef = useRef(null);

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
        // 检查是否是认证错误
        const authErrors = ['用户不存在', '用户未登录', '登录已过期', '认证失败', '没有访问权限'];
        if (authErrors.some(e => error.message && error.message.includes(e))) {
          // 清除本地存储的登录信息
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          // 设置错误信息并跳转到首页
          sessionStorage.setItem('authError', '登录已失效，请重新登录');
          alert('登录已失效，请重新登录');
          window.location.href = '/';
          return;
        }
        alert('创建项目失败: ' + error.message);
        return;
      }
    }

    setCurrentView('workspace');

    if (shouldTriggerSystem && userInput) {
      setPendingChatMessage(userInput);
    }
  }, [
    resetCanvas, setSavedProjectState, setHasUnsavedChanges, setCurrentProjectId,
    setProjectName, incrementCanvasKey, setCanvasNodes, setCanvasConnections,
    setCanvasViewport, loadVersions, setVersions, setCurrentVersion, setCurrentView,
    setPendingChatMessage
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
      // 检查是否是认证错误
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');

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

  // 节点选择
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    setActiveModal('nodeDetail');
  }, [setSelectedNode, setActiveModal]);

  // 计算实际宽度
  const { actualLeftWidth, actualRightWidth, centerWidth } = getActualWidths();

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
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteConfirm(version);
                            }}
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
              <button className="nav-btn diff-btn" onClick={() => openModal('diffView')}>
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
                    // 使用 workflowStore 的 updateNodeData
                    const { updateNodeData } = useWorkflowStore.getState();
                    updateNodeData(nodeId, data);
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
              onClose={closeModal}
            />
          )}

          {showSkillMarket && (
            <SkillMarket
              onClose={() => setShowSkillMarket(false)}
              onInstallSkill={(skill) => console.log('安装Skill:', skill)}
            />
          )}

          {showDeleteConfirm && (
            <div className="delete-confirm-backdrop" onClick={closeDeleteConfirm}>
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
                  <button className="delete-confirm-btn cancel" onClick={closeDeleteConfirm}>
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

          {showNewProjectConfirm && (
            <div className="new-project-confirm-backdrop" onClick={() => setShowNewProjectConfirm(false)}>
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
                  <button className="new-project-confirm-btn cancel" onClick={() => setShowNewProjectConfirm(false)}>
                    取消
                  </button>
                  <button className="new-project-confirm-btn discard" onClick={createNewProject}>
                    <X size={14} />
                    不保存
                  </button>
                  <button className="new-project-confirm-btn save" onClick={saveAndCreateNewProject}>
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
