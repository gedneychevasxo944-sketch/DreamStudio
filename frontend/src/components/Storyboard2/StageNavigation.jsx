import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useStageStore, STAGE_ORDER, STAGE_LABELS, STAGE_CONFIG, STAGES } from '../../stores/stageStore';
import './StageNavigation.css';

/**
 * StageNavigation - 阶段导航组件
 *
 * 功能：
 * - 显示 6 个阶段的 Tab 导航
 * - 当前阶段高亮动画
 * - 已完成阶段显示 ✓ 图标
 * - 点击切换阶段
 */
const StageNavigation = ({ onAIGenerate }) => {
  const { currentStage, setCurrentStage, stageCompletion } = useStageStore();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleStageClick = (stage) => {
    if (stage !== currentStage) {
      setCurrentStage(stage);
    }
  };

  const handleAIGenerate = () => {
    if (onAIGenerate) {
      onAIGenerate(currentStage);
    }
  };

  // 获取当前阶段的 AI 生成按钮文字
  const getAIGenerateText = () => {
    switch (currentStage) {
      case STAGES.SCRIPT:
        return 'AI 生成剧本';
      case STAGES.CHARACTER:
      case STAGES.SCENE:
      case STAGES.PROP:
        return 'AI 解析生成';
      case STAGES.STORYBOARD:
        return 'AI 生成分镜';
      case STAGES.VIDEO:
        return 'AI 生成视频';
      default:
        return 'AI 生成';
    }
  };

  // T084: 键盘导航
  const handleKeyDown = (e) => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % STAGE_ORDER.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + STAGE_ORDER.length) % STAGE_ORDER.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = STAGE_ORDER.length - 1;
    }

    if (newIndex !== currentIndex) {
      setCurrentStage(STAGE_ORDER[newIndex]);
    }
  };

  return (
    <div className="stage-navigation">
      <div
        className="stage-tabs"
        role="tablist"
        aria-label="故事板阶段"
        onKeyDown={handleKeyDown}
      >
        {STAGE_ORDER.map((stage, index) => {
          const isActive = stage === currentStage;
          const isCompleted = stageCompletion[stage];
          const config = STAGE_CONFIG[stage];
          const isPast = STAGE_ORDER.indexOf(currentStage) > index;

          return (
            <button
              key={stage}
              role="tab"
              aria-selected={isActive}
              aria-label={`${config?.label || STAGE_LABELS[stage]}${isCompleted ? '（已完成）' : ''}`}
              className={`stage-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => handleStageClick(stage)}
              tabIndex={isActive ? 0 : -1}
            >
              {/* 阶段图标/状态 */}
              <span className="stage-indicator">
                {isCompleted ? (
                  <Check size={14} className="check-icon" />
                ) : isActive ? (
                  <span className="active-dot" />
                ) : (
                  <span className="stage-number">{index + 1}</span>
                )}
              </span>

              {/* 阶段标签 */}
              <span className="stage-label">
                {config?.label || STAGE_LABELS[stage]}
              </span>

              {/* 当前阶段下划线动画 */}
              {isActive && (
                <motion.div
                  className="stage-underline"
                  layoutId="stage-underline"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* AI 生成按钮 */}
      <div className="stage-actions">
        <button
          className="ai-generate-btn"
          aria-label={getAIGenerateText()}
          onClick={handleAIGenerate}
        >
          <span className="ai-icon">✨</span>
          <span>{getAIGenerateText()}</span>
        </button>
      </div>
    </div>
  );
};

export default StageNavigation;
