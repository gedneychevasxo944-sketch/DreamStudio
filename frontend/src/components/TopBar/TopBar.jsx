import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MessageSquare, LayoutGrid, Settings, Save, Home, Download, MoreVertical, PanelRight } from 'lucide-react';
import './TopBar.css';

/**
 * TopBar - 统一顶部导航栏
 *
 * 功能：
 * - 项目名称（可编辑）
 * - 三层切换标签（对话/故事板/节点）
 * - 焦点指示器
 * - 快捷操作
 * - 主题色选择
 */
const TopBar = ({
  projectName,
  currentLayer = 'conversation',
  focusedEntity = null,
  onLayerChange,
  onGoHome,
  onSave,
  onOpenAssetDrawer,
  isSaving = false,
  saveSuccess = false,
  hasUnsavedChanges = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  const layers = [
    { id: 'conversation', label: '对话', icon: MessageSquare },
    { id: 'storyboard', label: '故事板', icon: LayoutGrid },
    { id: 'node', label: '节点', icon: Settings },
  ];

  const handleSaveName = () => {
    setIsEditingName(false);
    // 在这里可以调用 onNameChange 回调
  };

  const handleCancelEdit = () => {
    setTempName(projectName);
    setIsEditingName(false);
  };

  return (
    <header className="top-bar">
      {/* 左侧：返回 + 项目名称 */}
      <div className="top-bar-left">
        <button className="home-btn" onClick={onGoHome} title="返回首页">
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
          <button className="project-name" onClick={() => setIsEditingName(true)}>
            {projectName}
            {hasUnsavedChanges && <span className="unsaved-indicator">•</span>}
          </button>
        )}
      </div>

      {/* 中间：三层切换标签 */}
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
            <span className="focus-value">{focusedEntity}</span>
          </div>
        )}

        {/* 快捷操作 */}
        <div className="quick-actions">
          <button
            className="action-btn"
            onClick={onSave}
            disabled={isSaving}
            title="保存项目"
          >
            <Save size={16} />
            {isSaving ? '保存中...' : saveSuccess ? '已保存' : '保存'}
          </button>

          <button className="action-btn icon-only" onClick={onOpenAssetDrawer} title="资产库">
            <PanelRight size={16} />
          </button>

          <button className="action-btn icon-only" title="更多操作">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
