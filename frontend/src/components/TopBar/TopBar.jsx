import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, LayoutGrid, Settings, Save, Download, MoreVertical, Library, MessageCircle, FolderOpen, Plus, Check } from 'lucide-react';
import { useProjectStore, useStageStore, STAGES } from '../../stores';
import './TopBar.css';

/**
 * TopBar - 统一顶部导航栏
 *
 * 功能：
 * - 项目名称下拉切换
 * - 两层切换标签（故事板/节点）
 * - 悬浮助手按钮
 * - 快捷操作（保存、导出、工作流编辑）
 */
const TopBar = ({
  projectName,
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
  // 从 store 获取当前阶段用于判断导出按钮可见性
  const currentStage = useStageStore(state => state.currentStage);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 从 projectStore 获取项目列表和切换方法
  const { projects, switchProject, createProject, currentProjectId } = useProjectStore();

  const layers = [
    { id: 'storyboard', label: '故事板', icon: LayoutGrid },
    { id: 'node', label: '节点', icon: Settings },
  ];

  const handleSaveName = () => {
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempName(projectName);
    setIsEditingName(false);
  };

  // P0 修复：返回首页前检查未保存更改
  const handleGoHome = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('有未保存的更改，确定要离开吗？');
      if (!confirmed) return;
    }
    onGoHome?.();
  };

  // 点击空白处关闭下拉菜单
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProjectDropdown(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="top-bar">
      {/* 左侧：返回 + 项目名称 */}
      <div className="top-bar-left">
        <button className="home-btn" onClick={handleGoHome} title="返回首页">
          <ChevronLeft size={18} />
        </button>

        {isEditingName ? (
          <div className="name-editor">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
              className="name-input"
            />
            <button className="name-confirm" onClick={handleSaveName}>保存</button>
          </div>
        ) : (
          <div className="project-selector-wrapper" ref={dropdownRef}>
            <button
              className="project-name"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              title="切换项目"
            >
              <FolderOpen size={16} />
              <span>{projectName}</span>
              {hasUnsavedChanges && <span className="unsaved-indicator">•</span>}
            </button>

            {/* 项目下拉菜单 */}
            {showProjectDropdown && (
              <>
                <div className="dropdown-backdrop" onClick={() => setShowProjectDropdown(false)} />
                <motion.div
                  className="project-dropdown"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="dropdown-header">切换项目</div>
                  {projects.map(p => (
                    <button
                      key={p.id}
                      className="dropdown-item"
                      onClick={() => {
                        switchProject(p.id);
                        setShowProjectDropdown(false);
                      }}
                    >
                      <FolderOpen size={14} />
                      <span>{p.name}</span>
                      {p.id === currentProjectId && (
                        <Check size={14} className="check-icon" />
                      )}
                    </button>
                  ))}
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item create-new"
                    onClick={() => {
                      const newProject = createProject('新项目');
                      switchProject(newProject.id);
                      setShowProjectDropdown(false);
                    }}
                  >
                    <Plus size={14} />
                    <span>创建新项目</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 中间：两层切换标签 */}
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

      {/* 右侧：操作按钮 */}
      <div className="top-bar-right">
        {/* 焦点指示器 */}
        {focusedEntity && (
          <div className="focus-indicator">
            <span className="focus-label">当前焦点：</span>
            <span className="focus-value">
              {focusedEntity.name || focusedEntity.type} {focusedEntity.id && `(${focusedEntity.id})`}
            </span>
          </div>
        )}

        {/* 快捷操作 */}
        <div className="quick-actions">
          {/* 悬浮助手按钮 */}
          <button
            className="action-btn icon-only assistant-btn"
            onClick={onToggleAssistant}
            title="悬浮助手"
          >
            <MessageCircle size={16} />
          </button>

          {/* 保存按钮 */}
          <button
            className="action-btn"
            onClick={onSave}
            disabled={isSaving}
            title="保存项目"
          >
            <Save size={16} />
            {isSaving ? '保存中...' : saveSuccess ? '已保存' : '保存'}
          </button>

          {/* 导出按钮 - 仅在故事板层的分镜和视频阶段显示 */}
          {onExport && currentLayer === 'storyboard' && currentStage && [STAGES.STORYBOARD, STAGES.VIDEO].includes(currentStage) && (
            <button className="action-btn" onClick={onExport} title="导出">
              <Download size={16} />
              <span>导出</span>
            </button>
          )}

          {/* 资产库 */}
          <button className="action-btn icon-only asset-library-btn" onClick={onOpenAssetLibrary} title="资产库">
            <Library size={16} />
          </button>

          {/* 更多操作 */}
          <div className="more-menu-wrapper">
            <button
              className="action-btn icon-only"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="更多操作"
            >
              <MoreVertical size={16} />
            </button>
            {showMoreMenu && (
              <>
                <div className="dropdown-backdrop" onClick={() => setShowMoreMenu(false)} />
                <motion.div
                  className="project-dropdown"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ right: 0, left: 'auto', minWidth: 160 }}
                >
                  <button className="dropdown-item" onClick={() => { onSave?.(); setShowMoreMenu(false); }}>
                    <Save size={14} />
                    <span>保存项目</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { onOpenAssetLibrary?.(); setShowMoreMenu(false); }}>
                    <Library size={14} />
                    <span>资产库</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { onToggleAssistant?.(); setShowMoreMenu(false); }}>
                    <MessageCircle size={14} />
                    <span>悬浮助手</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { onGoHome?.(); setShowMoreMenu(false); }}>
                    <ChevronLeft size={14} />
                    <span>返回首页</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
