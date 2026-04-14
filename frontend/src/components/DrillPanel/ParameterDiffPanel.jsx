import { RotateCcw, Image } from 'lucide-react';
import './ParameterDiffPanel.css';

/**
 * S3: 参数变更对比
 *
 * 场景：节点层改模型/参数
 * 展示：参数变更对比 + 性能/质量权衡说明
 */
const ParameterDiffPanel = ({ modification, onClose }) => {
  if (!modification) return null;

  const { paramLabel, beforeValue, afterValue, beforeNote, afterNote, expectedImpact } = modification;

  return (
    <div className="parameter-diff-panel">
      {/* 参数标签 */}
      <div className="param-label">{paramLabel}</div>

      {/* 参数对比 */}
      <div className="param-comparison">
        <div className="param-card before">
          <div className="param-label-small">修改前</div>
          <div className="param-value">{beforeValue}</div>
          {beforeNote && <div className="param-note">{beforeNote}</div>}
        </div>

        <div className="param-arrow">→</div>

        <div className="param-card after">
          <div className="param-label-small">修改后</div>
          <div className="param-value">{afterValue}</div>
          {afterNote && <div className="param-note">{afterNote}</div>}
        </div>
      </div>

      {/* 预期影响 */}
      {expectedImpact && (
        <div className="expected-impact">
          <span className="impact-icon">📊</span>
          <span className="impact-text">预期影响：{expectedImpact}</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="panel-actions">
        <button className="action-btn primary">
          <RotateCcw size={14} />
          改回原参数
        </button>
        <button className="action-btn secondary">
          <Image size={14} />
          查看两种模型的效果对比图
        </button>
      </div>
    </div>
  );
};

export default ParameterDiffPanel;
