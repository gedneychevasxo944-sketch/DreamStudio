import { motion } from 'framer-motion';
import { Check, ChevronRight, Sparkles, FileText, Image, Video, Puzzle, Bot } from 'lucide-react';
import './PlanPreview.css';

const PlanCard = ({ plan, isSelected, onSelect }) => (
  <motion.div
    className={`plan-card ${isSelected ? 'selected' : ''}`}
    onClick={onSelect}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="plan-header">
      <div className="plan-icon">
        <Sparkles size={18} />
      </div>
      <div className="plan-info">
        <h4 className="plan-name">{plan.name}</h4>
        <span className="plan-mode-badge">{plan.mode === 'director' ? '导演模式' : '工厂模式'}</span>
      </div>
      <div className="plan-time">{plan.estimatedTime}</div>
    </div>
    <p className="plan-description">{plan.description}</p>
    <div className="plan-nodes">
      {plan.nodes && plan.nodes.map((node, idx) => (
        <div key={node.id} className="plan-node">
          <span className="node-dot" style={{ background: node.color }} />
          <span className="node-name">{node.name}</span>
          {idx < plan.nodes.length - 1 && <ChevronRight size={12} className="node-arrow" />}
        </div>
      ))}
    </div>
    {isSelected && (
      <motion.div
        className="selected-indicator"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <Check size={16} />
      </motion.div>
    )}
  </motion.div>
);

const PlanPreview = ({ plan, selectedPlanId, onSelectPlan, onBuildOwn }) => (
  <div className="plan-preview">
    <div className="preview-header">
      <h3>推荐方案</h3>
      <span className="preview-hint">AI 正在分析你的需求...</span>
    </div>

    {plan ? (
      <>
        <div className="plan-cards">
          <PlanCard
            plan={plan}
            isSelected={selectedPlanId === plan.id}
            onSelect={() => onSelectPlan(plan.id)}
          />
        </div>

        <div className="divider">
          <span>或者</span>
        </div>

        <div className="free-combination-section">
          <h4>自由组合</h4>
          <p className="free-hint">从节点库中自由选择需要的节点</p>
          <button className="customize-btn" onClick={onBuildOwn}>
            <Puzzle size={16} />
            自定义节点组合
            <ChevronRight size={16} />
          </button>
        </div>
      </>
    ) : (
      <div className="plan-empty">
        <div className="empty-spinner" />
        <p>等待 AI 返回方案...</p>
      </div>
    )}
  </div>
);

export default PlanPreview;
