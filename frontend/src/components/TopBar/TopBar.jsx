import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LayoutGrid, Settings, Save, Download, MoreVertical, Library, MessageCircle, FolderOpen, Plus, Check, Sun, Moon, Edit2, Home, Search, Folder } from 'lucide-react';
import { useProjectStore, useStageStore, STAGES } from '../../stores';
import useThemeStore from '../../stores/themeStore';
import './TopBar.css';

/**
 * TopBar - 统一顶部导航栏
 *
 * 布局：
 * [Logo] [项目名称] [V版本▼] | [故事板 ▼] | [资产] [助手] [···]
 *
 * 交互：
 * - 点击项目名称 → 编辑模式
 * - 点击 ▼ → 下拉菜单
 * - Enter 或失焦 → 保存编辑
 */
const TopBar = ({
  currentLayer = 'storyboard',
  focusedEntity = null,
  onLayerChange,
  onGoHome,
  onSave,
  onOpenAssetLibrary,
  onToggleAssistant,
  onExport,
  isSaving = false,
  saveSuccess = false,
  hasUnsavedChanges = false,
  onRequestUnsavedConfirm,
}) => {
  // 从 store 获取
  const currentStage = useStageStore(state => state.currentStage);
  const { mode, toggle } = useThemeStore();
  const { projects, switchProject, createProject, currentProjectId, projectName, setProjectName, currentVersion, versions, switchVersion, loadProjects } = useProjectStore();

  // 编辑状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(projectName);
  const nameInputRef = useRef(null);

  // 下拉菜单状态
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // 下拉菜单 ref
  const projectDropdownRef = useRef(null);
  const versionDropdownRef = useRef(null);
  const moreMenuRef = useRef(null);
  const layerDropdownRef = useRef(null);

  // 打开项目下拉框时从后端加载项目列表
  const handleOpenProjectDropdown = useCallback(() => {
    setShowProjectDropdown(true);
    loadProjects();
  }, [loadProjects]);

  // 层选项
  const layerOptions = [
    { id: 'storyboard', label: '故事板', desc: '标准创作流程' },
    { id: 'node', label: '自由创作', desc: '适合进阶用户自由创作', disabled: true, badge: '开发中' },
  ];

  // 同步编辑名称
  useEffect(() => {
    setEditName(projectName);
  }, [projectName]);

  // 开始编辑名称
  const handleStartEditName = useCallback(() => {
    setIsEditingName(true);
    setShowProjectDropdown(false);
    setTimeout(() => nameInputRef.current?.select(), 0);
  }, []);

  // 保存编辑
  const handleSaveName = useCallback(() => {
    if (editName.trim()) {
      setProjectName(editName.trim());
    } else {
      setEditName(projectName);
    }
    setIsEditingName(false);
  }, [editName, projectName, setProjectName]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditName(projectName);
    setIsEditingName(false);
  }, [projectName]);

  // 键盘事件
  const handleNameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveName, handleCancelEdit]);

  // 返回首页前检查未保存更改
  const handleGoHome = useCallback(() => {
    if (hasUnsavedChanges) {
      onRequestUnsavedConfirm?.('goHome');
    } else {
      onGoHome?.();
    }
  }, [hasUnsavedChanges, onGoHome, onRequestUnsavedConfirm]);

  // 点击空白处关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setShowProjectDropdown(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(e.target)) {
        setShowVersionDropdown(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
      if (layerDropdownRef.current && !layerDropdownRef.current.contains(e.target)) {
        setShowLayerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 重命名
  const handleRename = useCallback(() => {
    setShowProjectDropdown(false);
    handleStartEditName();
  }, [handleStartEditName]);

  // 创建新项目
  const handleCreateProject = useCallback(async () => {
    const newProject = await createProject('新项目');
    if (newProject) {
      switchProject(newProject.id);
    }
    setShowProjectDropdown(false);
  }, [createProject, switchProject]);

  // 切换项目
  const handleSwitchProject = useCallback((p) => {
    console.log('[TopBar] handleSwitchProject called:', {
      targetProjectId: p.id,
      currentProjectId,
      hasUnsavedChanges,
    });
    if (p.id !== currentProjectId) {
      if (hasUnsavedChanges) {
        console.log('[TopBar] Has unsaved changes, requesting confirm dialog');
        onRequestUnsavedConfirm?.('switchProject', p.id);
      } else {
        console.log('[TopBar] No unsaved changes, directly switching project');
        switchProject(p.id);
      }
    }
    setShowProjectDropdown(false);
  }, [currentProjectId, hasUnsavedChanges, switchProject, onRequestUnsavedConfirm]);

  // 切换版本
  const handleSwitchVersion = useCallback((v) => {
    if (v.id !== currentVersion?.id) {
      switchVersion(v.id);
    }
    setShowVersionDropdown(false);
  }, [currentVersion, switchVersion]);

  // 导出处理
  const handleExport = useCallback(() => {
    setShowMoreMenu(false);
    onExport?.();
  }, [onExport]);

  // 主题切换
  const handleToggleTheme = useCallback(() => {
    toggle();
    setShowMoreMenu(false);
  }, [toggle]);

  // 资产库
  const handleOpenAssetLibrary = useCallback(() => {
    setShowMoreMenu(false);
    onOpenAssetLibrary?.();
  }, [onOpenAssetLibrary]);

  // 助手
  const handleToggleAssistant = useCallback(() => {
    onToggleAssistant?.();
  }, [onToggleAssistant]);

  return (
    <header className="top-bar">
      {/* ========== 左侧 ========== */}
      <div className="top-bar-left">
        {/* Logo */}
        <button className="logo-btn" onClick={handleGoHome} title="返回首页">
          <span className="logo-text">造梦</span>
          <span className="logo-sub">AI</span>
        </button>

        {/* 项目名称区域 */}
        <div className="project-name-area">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleSaveName}
              className="name-input"
              autoFocus
            />
          ) : (
            <button
              className="project-name-btn"
              onClick={handleStartEditName}
              title="点击编辑项目名称"
            >
              <FolderOpen size={15} />
              <span className="project-name-text">{projectName}</span>
              {hasUnsavedChanges && <span className="unsaved-dot" />}
            </button>
          )}

          {/* 项目下拉按钮 */}
          <button
            className="dropdown-trigger"
            onClick={handleOpenProjectDropdown}
            aria-label="项目列表"
          >
            <ChevronDown size={14} className={`dropdown-arrow ${showProjectDropdown ? 'open' : ''}`} />
          </button>

          {/* 项目下拉菜单 */}
          <AnimatePresence>
            {showProjectDropdown && (
              <>
                <div className="dropdown-backdrop" onClick={() => setShowProjectDropdown(false)} />
                <motion.div
                  ref={projectDropdownRef}
                  className="dropdown-panel project-dropdown"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* 创建故事板按钮 */}
                  <button className="project-create-btn" onClick={() => { handleCreateProject(); setShowProjectDropdown(false); setProjectSearchQuery(''); }}>
                    <Plus size={14} />
                    创建故事板
                  </button>

                  {/* 搜索框 */}
                  <div className="project-search-wrapper">
                    <Search size={13} className="project-search-icon" />
                    <input
                      type="text"
                      className="project-search-input"
                      placeholder="搜索项目"
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* 项目列表 */}
                  <div className="project-list">
                    {(() => {
                      // 确保 projects 是数组
                      const projectList = Array.isArray(projects) ? projects : [];

                      if (projectList.length === 0) {
                        return <div className="project-list-empty">暂无历史项目</div>;
                      }

                      // 去重：使用id作为key，保留最后一个
                      const uniqueProjects = [...new Map(
                        projectList.map(p => [p.id, p])
                      ).values()];
                      return uniqueProjects
                        .filter(p => !projectSearchQuery || (p.name && p.name.toLowerCase().includes(projectSearchQuery.toLowerCase())))
                        .map(p => (
                          <button
                            key={p.id}
                            className={`project-item ${p.id === currentProjectId ? 'active' : ''}`}
                            onClick={() => { handleSwitchProject(p); setShowProjectDropdown(false); setProjectSearchQuery(''); }}
                          >
                            <Folder size={14} className="project-item-icon" />
                            <span className="project-item-name">{p.name}</span>
                            <span className="project-item-time">{p.updatedAt || ''}</span>
                            {p.id === currentProjectId && <Check size={13} className="check-icon" />}
                          </button>
                        ));
                    })()}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 版本下拉 */}
        <div className="version-area">
          <button
            className="version-btn"
            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
          >
            <span className="version-text">{currentVersion?.name || 'V1.0'}</span>
            <ChevronDown size={12} className={`dropdown-arrow ${showVersionDropdown ? 'open' : ''}`} />
          </button>

          <AnimatePresence>
            {showVersionDropdown && (
              <>
                <div className="dropdown-backdrop" onClick={() => setShowVersionDropdown(false)} />
                <motion.div
                  ref={versionDropdownRef}
                  className="dropdown-panel version-dropdown"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {versions.map(v => (
                    <button
                      key={v.id}
                      className={`version-item ${v.id === currentVersion?.id ? 'active' : ''}`}
                      onClick={() => handleSwitchVersion(v)}
                      title={v.description}
                    >
                      <div className="version-item-check">
                        {v.id === currentVersion?.id ? <Check size={14} /> : null}
                      </div>
                      <span className="version-item-name">{v.name}</span>
                      <span className="version-item-time">{v.createdAt}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========== 中间：层切换（下拉式）========== */}
      <div className="top-bar-center">
        <div className="layer-tabs" ref={layerDropdownRef}>
          {/* Tab - 显示当前层名称，始终可点击显示下拉 */}
          <button
            className={`layer-tab ${currentLayer === 'storyboard' ? 'active' : ''}`}
            onClick={() => {
              // 始终切换下拉显示/隐藏
              setShowLayerDropdown(!showLayerDropdown);
            }}
          >
            {currentLayer === 'storyboard' ? <LayoutGrid size={16} /> : <Settings size={16} />}
            <span>{currentLayer === 'storyboard' ? '故事板' : '自由创作'}</span>
            <ChevronDown
              size={14}
              className={`dropdown-arrow ${showLayerDropdown ? 'open' : ''}`}
              style={{ marginLeft: 2 }}
            />
            {/* 指示器 - 始终显示在 tab 上 */}
            <motion.div
              className="tab-indicator"
              layoutId="activeTab"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              style={{ position: 'absolute', inset: 0 }}
            />
          </button>

          {/* 下拉面板 - 放在 layer-tabs 内部，position: absolute 相对于 layer-tabs 定位 */}
          <AnimatePresence>
            {showLayerDropdown && (
              <>
                <div
                  className="dropdown-backdrop"
                  onClick={() => setShowLayerDropdown(false)}
                  style={{ display: 'none' }}
                />
                <motion.div
                  className="dropdown-panel layer-dropdown"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {layerOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`dropdown-item layer-option ${currentLayer === option.id ? 'active' : ''} ${option.disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (option.disabled) {
                          toast?.('自由创作功能正在开发中，敬请期待');
                          return;
                        }
                        onLayerChange?.(option.id);
                        setShowLayerDropdown(false);
                      }}
                    >
                      <div className="layer-option-content">
                        <span className="layer-option-label">
                          {option.id === 'storyboard' ? <LayoutGrid size={15} /> : <Settings size={15} />}
                          {option.label}
                        </span>
                        <span className="layer-option-desc">{option.desc}</span>
                      </div>
                      {option.badge && (
                        <span className="layer-option-badge">{option.badge}</span>
                      )}
                      {currentLayer === option.id && <Check size={15} className="check-icon" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========== 右侧：操作按钮 ========== */}
      <div className="top-bar-right">
        <div className="quick-actions">
          {/* 资产库 */}
          <button
            className="action-btn"
            onClick={handleOpenAssetLibrary}
            title="资产库"
          >
            <Library size={16} />
            <span>资产</span>
          </button>

          {/* 悬浮助手 - 渐变背景，最醒目 */}
          <button
            className="action-btn assistant-btn"
            onClick={handleToggleAssistant}
            title="悬浮助手"
          >
            <MessageCircle size={16} />
            <span>助手</span>
          </button>

          {/* 保存 */}
          <button
            className={`action-btn save-btn ${saveSuccess ? 'success' : ''}`}
            onClick={onSave}
            disabled={isSaving}
            title="保存项目"
          >
            <Save size={16} />
            <span>{isSaving ? '保存中' : saveSuccess ? '已保存' : '保存'}</span>
          </button>

          {/* 更多 */}
          <div className="more-menu-wrapper">
            <button
              className="action-btn"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="更多操作"
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowMoreMenu(false)} />
                  <motion.div
                    ref={moreMenuRef}
                    className="dropdown-panel more-dropdown"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* 导出 - 仅在分镜和视频阶段显示 */}
                    {currentLayer === 'storyboard' && [STAGES.STORYBOARD, STAGES.VIDEO].includes(currentStage) && (
                      <button className="dropdown-item" onClick={handleExport}>
                        <Download size={14} />
                        <span>导出</span>
                      </button>
                    )}

                    {/* 主题切换 */}
                    <button className="dropdown-item" onClick={handleToggleTheme}>
                      {mode === 'day' ? <Moon size={14} /> : <Sun size={14} />}
                      <span>{mode === 'day' ? '深色模式' : '浅色模式'}</span>
                    </button>

                    <div className="dropdown-divider" />

                    {/* 返回首页 */}
                    <button className="dropdown-item" onClick={handleGoHome}>
                      <Home size={14} />
                      <span>返回首页</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 焦点指示器 - 仅在有焦点时显示 */}
        {focusedEntity && (
          <div className="focus-indicator">
            <span className="focus-value">
              {focusedEntity.name || focusedEntity.type}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
