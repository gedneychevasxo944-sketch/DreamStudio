import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LayoutGrid, Settings, Save, Download, MoreVertical, Library, MessageCircle, FolderOpen, Plus, Check, Sun, Moon, Edit2, Home } from 'lucide-react';
import { useProjectStore, useStageStore, STAGES } from '../../stores';
import useThemeStore from '../../stores/themeStore';
import './TopBar.css';

/**
 * TopBar - 统一顶部导航栏
 *
 * 布局：
 * [Logo] [项目名称] [V版本▼] | [故事板] [节点] | [资产] [助手] [保存] [···]
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
}) => {
  // 从 store 获取
  const currentStage = useStageStore(state => state.currentStage);
  const { mode, toggle } = useThemeStore();
  const { projects, switchProject, createProject, currentProjectId, projectName, setProjectName, currentVersion, versions, switchVersion } = useProjectStore();

  // 编辑状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(projectName);
  const nameInputRef = useRef(null);

  // 下拉菜单状态
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 下拉菜单 ref
  const projectDropdownRef = useRef(null);
  const versionDropdownRef = useRef(null);
  const moreMenuRef = useRef(null);

  const layers = [
    { id: 'storyboard', label: '故事板', icon: LayoutGrid },
    { id: 'node', label: '节点', icon: Settings },
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
      const confirmed = window.confirm('有未保存的更改，确定要离开吗？');
      if (!confirmed) return;
    }
    onGoHome?.();
  }, [hasUnsavedChanges, onGoHome]);

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
  const handleCreateProject = useCallback(() => {
    const newProject = createProject('新项目');
    switchProject(newProject.id);
    setShowProjectDropdown(false);
  }, [createProject, switchProject]);

  // 切换项目
  const handleSwitchProject = useCallback((p) => {
    if (p.id !== currentProjectId) {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm('有未保存的更改，切换项目会丢失这些更改，确定要切换吗？');
        if (!confirmed) return;
      }
      switchProject(p.id);
    }
    setShowProjectDropdown(false);
  }, [currentProjectId, hasUnsavedChanges, switchProject]);

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
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
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
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="dropdown-header">切换项目</div>
                  {projects.map(p => (
                    <button
                      key={p.id}
                      className={`dropdown-item ${p.id === currentProjectId ? 'active' : ''}`}
                      onClick={() => handleSwitchProject(p)}
                    >
                      <FolderOpen size={14} />
                      <span className="item-name">{p.name}</span>
                      {p.id === currentProjectId && <Check size={14} className="check-icon" />}
                    </button>
                  ))}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleRename}>
                    <Edit2 size={14} />
                    <span>重命名</span>
                  </button>
                  <button className="dropdown-item create-new" onClick={handleCreateProject}>
                    <Plus size={14} />
                    <span>创建新项目</span>
                  </button>
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
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="dropdown-header">版本历史</div>
                  {versions.map(v => (
                    <button
                      key={v.id}
                      className={`dropdown-item version-item ${v.id === currentVersion?.id ? 'active' : ''}`}
                      onClick={() => handleSwitchVersion(v)}
                    >
                      <div className="version-info">
                        <span className="version-name">{v.name}</span>
                        {v.id === currentVersion?.id && <span className="current-badge">当前</span>}
                      </div>
                      <div className="version-meta">
                        <span className="version-time">{v.createdAt}</span>
                        <span className="version-desc">{v.description}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========== 中间：层切换 ========== */}
      <div className="top-bar-center">
        <div className="layer-tabs">
          {layers.map((layer) => {
            const Icon = layer.icon;
            const isActive = currentLayer === layer.id;
            return (
              <button
                key={layer.id}
                className={`layer-tab ${isActive ? 'active' : ''}`}
                onClick={() => onLayerChange?.(layer.id)}
              >
                <Icon size={16} />
                <span>{layer.label}</span>
                {isActive && (
                  <motion.div
                    className="tab-indicator"
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
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
