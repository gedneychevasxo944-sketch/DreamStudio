import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useStageStore, STAGE_ORDER, STAGE_LABELS, STAGE_ICONS, STAGE_CONFIG } from '../../stores/stageStore';
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
const StageNavigation = () => {
  const { currentStage, setCurrentStage, stageCompletion } = useStageStore();

  const handleStageClick = (stage) => {
    if (stage !== currentStage) {
      setCurrentStage(stage);
    }
  };

  return (
    <div className="stage-navigation">
      <div className="stage-tabs">
        {STAGE_ORDER.map((stage, index) => {
          const isActive = stage === currentStage;
          const isCompleted = stageCompletion[stage];
          const config = STAGE_CONFIG[stage];
          const isPast = STAGE_ORDER.indexOf(currentStage) > index;

          return (
            <button
              key={stage}
              className={`stage-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => handleStageClick(stage)}
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
        <button className="ai-generate-btn">
          <span className="ai-icon">✨</span>
          <span>AI 生成</span>
        </button>
      </div>
    </div>
  );
};

export default StageNavigation;
