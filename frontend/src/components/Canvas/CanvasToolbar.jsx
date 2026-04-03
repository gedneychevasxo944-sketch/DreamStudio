import { Plus, Play, Loader2, Save, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import PipelineTemplates from '../NodeCanvas/PipelineTemplates';

/**
 * 画布顶部工具栏组件
 */
const CanvasToolbar = ({
  isRunning,
  isFullscreen,
  templates,
  loadingAgents,
  showLibrary,
  onToggleLibrary,
  onRun,
  onSaveTemplate,
  onClearCanvas,
  onToggleFullscreen,
  onLoadTemplate,
}) => {
  return (
    <div className="canvas-toolbar">
      <div className="toolbar-left">
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
