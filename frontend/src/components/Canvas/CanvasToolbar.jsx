import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Play, Loader2, Save, Trash2, Maximize2, Minimize2, ChevronDown, AlertCircle, LayoutGrid } from 'lucide-react';
import PipelineTemplates from '../NodeCanvas/PipelineTemplates';

/**
 * 画布顶部工具栏组件
 */
const CanvasToolbar = ({
  isRunning,
  isFullscreen,
  templates,
  loadingAgents,
  onToggleLibrary,
  onRun,
  onSaveTemplate,
  onClearCanvas,
  onToggleFullscreen,
  onLoadTemplate,
  onReturnToStoryboard,
  runButtonText = '运行',
  runExplanation = '',
  hasStaleNodes = false,
}) => {
  const [showRunMenu, setShowRunMenu] = useState(false);

  const runMenuOptions = useMemo(() => [
    { key: 'restart', label: '从头运行', description: '重新运行整个流程' },
    { key: 'continue', label: '继续运行', description: '从受影响节点继续', disabled: !hasStaleNodes },
    { key: 'fromCurrent', label: '从当前节点运行', description: '从选中节点重新开始' },
    { key: 'currentOnly', label: '仅运行当前节点', description: '只运行选中的节点' },
  ], [hasStaleNodes]);

  const handleRunClick = (e) => {
    e.stopPropagation();
    // 切换菜单显示
    setShowRunMenu(!showRunMenu);
  };

  const handleMenuItemClick = (option) => {
    setShowRunMenu(false);
    if (option.disabled) {
      return;
    }
    if (option.action) {
      option.action();
    } else if (option.key === 'restart') {
      if (onRun) onRun('restart');
    } else if (option.key === 'continue') {
      if (onRun) onRun('continue');
    } else if (option.key === 'fromCurrent') {
      if (onRun) onRun('fromCurrent');
    } else if (option.key === 'currentOnly') {
      if (onRun) onRun('currentOnly');
    }
  };

  // 点击空白关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      // 忽略来自按钮或菜单内部的点击
      if (e.target.closest('.run-btn-wrapper')) return;
      setShowRunMenu(false);
    };
    if (showRunMenu) {
      // 延迟添加监听器，避免立即触发
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showRunMenu]);

  return (
    <div className="canvas-toolbar">
      {/* 左侧：添加智能体 + 返回故事板 */}
      <div className="toolbar-left">
        <button
          className="toolbar-btn storyboard-btn"
          onClick={onReturnToStoryboard}
          title="返回故事板"
        >
          <LayoutGrid size={16} />
          <span>返回故事板</span>
        </button>
        <div className="toolbar-divider" />
        <button
          className="toolbar-btn"
          onClick={onToggleLibrary}
        >
          <Plus size={16} />
          <span>添加智能体</span>
        </button>
        <PipelineTemplates
          templates={templates}
          onSelect={onLoadTemplate}
          loading={loadingAgents}
        />
      </div>

      <div className="toolbar-center">
        {/* stale 警告 */}
        {hasStaleNodes && (
          <div className="stale-warning" title="存在依赖失效的节点">
            <AlertCircle size={14} />
          </div>
        )}

        {/* 运行按钮（支持下拉） */}
        <div className="run-btn-wrapper">
          <button
            className={`toolbar-run-btn ${isRunning ? 'running' : ''}`}
            onClick={handleRunClick}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 size={16} className="spinning" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            <span>{isRunning ? '运行中...' : runButtonText}</span>
            {!isRunning && <ChevronDown size={14} className="run-dropdown-icon" />}
          </button>

          {showRunMenu && !isRunning && (
            <div className="run-menu-dropdown">
              {runMenuOptions.map((option) => (
                <button
                  key={option.key}
                  className="run-menu-item"
                  disabled={option.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick(option);
                  }}
                >
                  <span className="menu-item-label">{option.label}</span>
                  <span className="menu-item-desc">{option.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 运行说明 */}
        {runExplanation && (
          <div className="run-explanation">
            {runExplanation}
          </div>
        )}

        <button className="toolbar-btn" onClick={onSaveTemplate}>
          <Save size={16} />
          <span>保存团队</span>
        </button>
        <button className="toolbar-btn" onClick={onClearCanvas}>
          <Trash2 size={16} />
          <span>清空画布</span>
        </button>
      </div>

      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={onToggleFullscreen}>
          {isFullscreen ? (
            <Minimize2 size={16} />
          ) : (
            <Maximize2 size={16} />
          )}
          <span>{isFullscreen ? '退出全屏' : '最大化'}</span>
        </button>
      </div>
    </div>
  );
};

export default CanvasToolbar;
