import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Sparkles, FileText, Image, Video, Puzzle, Bot } from 'lucide-react';
import ChatConversation from './ChatConversation';
import './PlanningPage.css';

// 方案卡片组件
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

// 上下文面板组件
const ContextPanel = ({ rawInput, attachments, brief, plan, onConfirm, onCancel, onBuildOwn }) => (
  <div className="context-panel">
    {rawInput && (
      <div className="context-section">
        <div className="section-label">原始输入</div>
        <div className="section-content raw-input">
          <FileText size={14} />
          <p>{rawInput}</p>
        </div>
      </div>
    )}

    {attachments && attachments.length > 0 && (
      <div className="context-section">
        <div className="section-label">已上传资料</div>
        <div className="section-content attachments">
          {attachments.map((att, idx) => (
            <div key={idx} className="attachment-item">
              {att.type === 'image' && <Image size={14} />}
              {att.type === 'video' && <Video size={14} />}
              <span>{att.name}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {brief && (
      <div className="context-section">
        <div className="section-label">Brief 整理</div>
        <div className="section-content brief">
          <p>{brief}</p>
        </div>
      </div>
    )}

    <div className="context-actions">
      {plan ? (
        <>
          <button className="context-btn primary" onClick={onConfirm}>
            <Check size={16} />
            采用此方案
          </button>
          <button className="context-btn secondary" onClick={onBuildOwn}>
            <Puzzle size={16} />
            自己搭建
          </button>
        </>
      ) : (
        <button className="context-btn secondary" onClick={onBuildOwn}>
          <Puzzle size={16} />
          自己搭建
        </button>
      )}
      <button className="context-btn danger" onClick={onCancel}>
        取消
      </button>
    </div>
  </div>
);

// 方案预览区组件
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

        <div className="free组合-section">
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
      <div className="plan-empty">等待 AI 返回方案...</div>
    )}
  </div>
);

// 规划态页面主组件
const PlanningPage = ({
  projectName = '未命名项目',
  projectId = null,
  rawInput = '',
  attachments = [],
  messages = [],
  onMessagesChange,
  onConfirmPlan,
  onCancel,
}) => {
  const chatRef = useRef(null);
  const hasSentMessage = useRef(false);
  const [plan, setPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // 收到 plan 数据时的回调
  const handlePlanReceived = (receivedPlan) => {
    if (receivedPlan) {
      setPlan(receivedPlan);
      setSelectedPlanId(receivedPlan.id);
    }
  };

  // 发送消息给 chat
  useEffect(() => {
    if (rawInput && projectId && !hasSentMessage.current) {
      hasSentMessage.current = true;
      chatRef.current?.sendMessage(rawInput);
    }
  }, [rawInput, projectId]);

  // 模拟 Brief
  const brief = rawInput
    ? `目标：制作一部 ${rawInput.length > 20 ? '短剧' : rawInput} 类型视频\n风格：待确认\n时长：待确认`
    : null;

  // 确认方案
  const handleConfirmPlan = () => {
    if (plan && onConfirmPlan) {
      onConfirmPlan(plan);
    }
  };

  // 自己搭建
  const handleBuildOwn = () => {
    if (onConfirmPlan) {
      onConfirmPlan({ mode: 'blank', id: 'blank' });
    }
  };

  return (
    <div className="planning-page">
      <header className="planning-header">
        <div className="header-left">
          <div className="logo-mini">
            <span className="logo-text">造梦</span>
            <span className="logo-sub">AI</span>
          </div>
          <div className="project-indicator">
            <span className="indicator-label">规划态</span>
            <span className="project-name">{projectName}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={onCancel}>
            主页
          </button>
        </div>
      </header>

      <main className="planning-main">
        <aside className="planning-left">
          <div className="console-header-simple">
            <Bot size={18} />
            <span>智能助理</span>
          </div>
          <ChatConversation
            ref={chatRef}
            agentId={0}
            projectId={projectId}
            messages={messages}
            onMessagesChange={onMessagesChange}
            onPlanReceived={handlePlanReceived}
            placeholder="输入消息..."
            disabledPlaceholder="生成完成后可对话"
          />
        </aside>

        <section className="planning-center">
          <PlanPreview
            plan={plan}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onBuildOwn={handleBuildOwn}
          />
        </section>

        <aside className="planning-right">
          <ContextPanel
            rawInput={rawInput}
            attachments={attachments}
            brief={brief}
            plan={plan}
            onConfirm={handleConfirmPlan}
            onCancel={onCancel}
            onBuildOwn={handleBuildOwn}
          />
        </aside>
      </main>
    </div>
  );
};

export default PlanningPage;
