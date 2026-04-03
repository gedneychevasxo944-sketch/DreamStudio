import { Plus, Play, Loader2, Save, Trash2, Minimize2 } from 'lucide-react';
import PipelineTemplates from '../NodeCanvas/PipelineTemplates';

/**
 * 全屏模式悬浮工具栏组件
 */
const FullscreenToolbar = ({
  isRunning,
  templates,
  loadingAgents,
  onToggleLibrary,
  onRun,
  onSaveTemplate,
  onClearCanvas,
  onToggleFullscreen,
  onLoadTemplate,
}) => {
  return (
    <div className="fullscreen-toolbar">
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
      <button
        className={`toolbar-btn ${isRunning ? 'active' : ''}`}
        onClick={onRun}
        disabled={isRunning}
      >
        {isRunning ? (
          <Loader2 size={16} className="spinning" />
        ) : (
          <Play size={16} />
        )}
        <span>{isRunning ? '运行中...' : '运行'}</span>
      </button>
      <button className="toolbar-btn" onClick={onSaveTemplate}>
        <Save size={16} />
        <span>保存模板</span>
      </button>
      <button className="toolbar-btn" onClick={onClearCanvas}>
        <Trash2 size={16} />
        <span>清空画布</span>
      </button>
      <button className="toolbar-btn" onClick={onToggleFullscreen}>
        <Minimize2 size={16} />
        <span>退出全屏 (ESC)</span>
      </button>
    </div>
  );
};

export default FullscreenToolbar;
