import { useState } from 'react';
import { Check, Sliders, HelpCircle } from 'lucide-react';
import './VisualSliderPanel.css';

/**
 * S4: 视觉滑动对比面板
 *
 * 场景：AI自动优化构图
 * 展示：左右滑动对比 + 元信息标签
 */
const VisualSliderPanel = ({ modification, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!modification) return null;

  const { beforeImage, afterImage, beforeMeta, afterMeta, aiReason, visualType } = modification;

  const getMetaLabel = (type, value) => {
    const labels = {
      position: { '偏右': '主体偏右', '居中': '主体居中' },
      framing: { '中景': '中景', '近景': '近景', '远景': '远景' },
      angle: { '平视': '平视', '略微俯视': '略微俯视', '俯视': '俯视' },
    };
    return labels[type]?.[value] || value;
  };

  const renderMeta = (meta, isBefore) => (
    <div className="meta-tags">
      {meta.position && (
        <span className={`meta-tag ${isBefore ? 'before' : 'after'}`}>
          {getMetaLabel('position', meta.position)}
        </span>
      )}
      {meta.framing && (
        <span className={`meta-tag ${isBefore ? 'before' : 'after'}`}>
          {getMetaLabel('framing', meta.framing)}
        </span>
      )}
      {meta.angle && (
        <span className={`meta-tag ${isBefore ? 'before' : 'after'}`}>
          {getMetaLabel('angle', meta.angle)}
        </span>
      )}
    </div>
  );

  return (
    <div className="visual-slider-panel">
      {/* AI 原因 */}
      {aiReason && (
        <div className="ai-reason">
          <span className="reason-icon">🤖</span>
          <span className="reason-text">{aiReason}</span>
        </div>
      )}

      {/* 滑动对比 */}
      <div className="slider-container">
        <div className="slider-image-container">
          {/* 修改后图片（底层） */}
          <img src={afterImage} alt="修改后" className="slider-image after" />

          {/* 修改前图片（顶层，通过 clip-path 裁剪） */}
          <img
            src={beforeImage}
            alt="修改前"
            className="slider-image before"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          />

          {/* 滑块 */}
          <div
            className="slider-handle"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={(e) => {
              const container = e.currentTarget.parentElement;
              const rect = container.getBoundingClientRect();
              const handleMouseMove = (e) => {
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, x)));
              };
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="slider-line" />
            <div className="slider-knob">⟷</div>
          </div>

          {/* 标签 */}
          <div className="slider-labels">
            <span className="label-before">修改前</span>
            <span className="label-after">修改后</span>
          </div>
        </div>

        {/* 元信息对比 */}
        <div className="meta-comparison">
          <div className="meta-column before">
            <div className="meta-header">修改前</div>
            {renderMeta(beforeMeta, true)}
          </div>
          <div className="meta-arrow">→</div>
          <div className="meta-column after">
            <div className="meta-header">修改后</div>
            {renderMeta(afterMeta, false)}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="panel-actions">
        <button className="action-btn primary">
          <Check size={14} />
          接受
        </button>
        <button className="action-btn secondary">
          <Sliders size={14} />
          微调
        </button>
        <button
          className="action-btn secondary"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <HelpCircle size={14} />
          解释为什么这样改
        </button>
      </div>

      {/* AI 解释 */}
      {showExplanation && (
        <div className="ai-explanation">
          <div className="explanation-content">
            AI 分析认为原始构图存在以下问题：
            <ul>
              <li>主体位置偏右，导致画面重心不平衡</li>
              <li>景别偏中景，主体不够突出</li>
              <li>角度为平视，缺乏视觉张力</li>
            </ul>
            经过调整后，构图更加平衡，主体更加突出。
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualSliderPanel;
