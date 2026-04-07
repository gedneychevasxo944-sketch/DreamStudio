import { useState, useRef, useEffect } from 'react';
import { FileText, Edit2, Check, X, History, ChevronRight, Trash2, Save, Plus, Home, Settings, Package, AlertTriangle, FilePlus, FolderOpen, Archive } from 'lucide-react';
import './ProjectTopBar.css';

const ProjectTopBar = ({
  projectName,
  hasUnsavedChanges,
  isSaving,
  saveSuccess,
  currentVersion,
  versions = [],
  showVersionDropdown,
  onSave,
  onNewProject,
  onGoHome,
  onVersionSelect,
  onVersionDelete,
  onToggleVersionDropdown,
  onOpenAssetDrawer, // 新增：打开资产抽屉
  onExport,
  onOpenSettings,
  // 项目名称编辑
  isEditingName,
  tempProjectName,
  onStartEditName,
  onSaveName,
  onCancelEdit,
  onNameChange,
  // 版本下拉
  versionDropdownRef,
  // 删除版本确认
  showDeleteConfirm,
  versionToDelete,
  onOpenDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
  // 新建项目确认
  showNewProjectConfirm,
  onCloseNewProjectConfirm,
  onDiscardNewProject,
  onSaveAndCreateNewProject
}) => {
  return (
    <header className="project-topbar glass">
      <div className="project-topbar-left">
        {/* Logo */}
        <div className="logo-mini" onClick={onGoHome} style={{ cursor: 'pointer' }}>
          <span className="logo-text">造梦</span>
          <span className="logo-sub">AI</span>
        </div>

        {/* 项目名称区域 */}
        <div className="project-name-section">
          <FileText size={16} className="project-icon" />
          {isEditingName ? (
            <div className="project-name-edit">
              <input
                type="text"
                value={tempProjectName}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveName();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                autoFocus
                className="project-name-input"
              />
              <button className="name-action-btn save" onClick={onSaveName}>
                <Check size={14} />
              </button>
              <button className="name-action-btn cancel" onClick={onCancelEdit}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="project-name-display">
              <span className="project-name-text" title={projectName}>
                {projectName}
              </span>
              {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
              <button className="edit-name-btn" onClick={onStartEditName} title="编辑项目名称">
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 版本选择器 */}
        <div className="version-selector" ref={versionDropdownRef}>
          <button
            className="version-dropdown-trigger"
            onClick={onToggleVersionDropdown}
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
                  onClick={() => onVersionSelect(version)}
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
                        onOpenDeleteConfirm(version);
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

      <div className="project-topbar-center">
        {/* 导航按钮 */}
        <nav className="header-nav">
          <button className="nav-btn active">
            <FolderOpen size={14} />
            <span>生产流</span>
          </button>
          <button className="nav-btn">
            <Package size={14} />
            <span>监控台</span>
          </button>
          <button className="nav-btn" onClick={onOpenAssetDrawer}>
            <Archive size={14} />
            <span>资产库</span>
          </button>
          <button className="nav-btn">
            <Settings size={14} />
            <span>设置</span>
          </button>
        </nav>
      </div>

      <div className="project-topbar-right">
        {/* 保存按钮 */}
        <button
          className={`header-action-btn save-btn ${saveSuccess ? 'success' : ''}`}
          onClick={onSave}
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

        {/* 新建按钮 */}
        <button className="header-action-btn new-btn" onClick={onNewProject}>
          <Plus size={16} />
          <span>新建</span>
        </button>

        {/* 资产按钮 - 触发资产抽屉 */}
        <button
          className="header-action-btn asset-btn"
          onClick={onOpenAssetDrawer}
          title="打开资产库"
        >
          <Archive size={16} />
          <span>资产</span>
        </button>

        {/* 主页按钮 */}
        <button className="home-btn" onClick={onGoHome} title="返回主页">
          <Home size={18} />
        </button>
      </div>

      {/* 删除版本确认弹窗 */}
      {showDeleteConfirm && (
        <div className="delete-confirm-backdrop" onClick={onCloseDeleteConfirm}>
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
              <button className="delete-confirm-btn cancel" onClick={onCloseDeleteConfirm}>
                取消
              </button>
              <button className="delete-confirm-btn confirm" onClick={onConfirmDelete}>
                <Trash2 size={14} />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建项目确认弹窗 */}
      {showNewProjectConfirm && (
        <div className="new-project-confirm-backdrop" onClick={onCloseNewProjectConfirm}>
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
              <button className="new-project-confirm-btn cancel" onClick={onCloseNewProjectConfirm}>
                取消
              </button>
              <button className="new-project-confirm-btn discard" onClick={onDiscardNewProject}>
                <X size={14} />
                不保存
              </button>
              <button className="new-project-confirm-btn save" onClick={onSaveAndCreateNewProject}>
                <Save size={14} />
                保存并新建
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ProjectTopBar;
