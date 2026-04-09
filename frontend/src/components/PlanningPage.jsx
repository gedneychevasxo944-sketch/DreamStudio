import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight, Sparkles, FileText, Upload, Image, Video, Users, Puzzle, ArrowRight, Bot } from 'lucide-react';
import ChatConversation from './ChatConversation';
import { formatTimestamp } from './ChatConversation';
import './PlanningPage.css';

// 模拟方案数据
const mockPlans = [
  {
    id: 'plan_1',
    name: '推荐链路 - 精品短剧',
    description: '完整链路，覆盖编剧、美术、分镜、视频生成，适合追求品质的精品项目',
    nodes: [
      { id: 'producer', name: '资深制片人', icon: 'Target', color: '#3b82f6' },
      { id: 'writer', name: '金牌编剧', icon: 'PenTool', color: '#06b6d4' },
      { id: 'visual', name: '概念美术', icon: 'Palette', color: '#8b5cf6' },
      { id: 'director', name: '分镜导演', icon: 'Video', color: '#f59e0b' },
      { id: 'technical', name: '提示词工程师', icon: 'Code', color: '#10b981' },
      { id: 'videoGen', name: '视频生成', icon: 'Play', color: '#6366f1' },
    ],
    mode: 'director',
    estimatedTime: '约2小时',
  },
  {
    id: 'plan_2',
    name: '快速链路 - 粗糙短剧',
    description: '精简链路，编剧到视频一气呵成，适合快速试产和灵感验证',
    nodes: [
      { id: 'writer', name: '金牌编剧', icon: 'PenTool', color: '#06b6d4' },
      { id: 'visual', name: '概念美术', icon: 'Palette', color: '#8b5cf6' },
      { id: 'videoGen', name: '视频生成', icon: 'Play', color: '#6366f1' },
    ],
    mode: 'factory',
    estimatedTime: '约30分钟',
  },
];

// 模拟团队数据
const mockTeams = [
  { id: 'team_1', name: '专业影视团队', members: 5, tags: ['精品', '专业'] },
  { id: 'team_2', name: '轻量制作团队', members: 3, tags: ['快速', '精简'] },
];

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
      {plan.nodes.map((node, idx) => (
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

// 团队卡片组件
const TeamCard = ({ team, onSelect }) => (
  <div className="team-card" onClick={onSelect}>
    <div className="team-icon">
      <Users size={20} />
    </div>
    <div className="team-info">
      <h5 className="team-name">{team.name}</h5>
      <span className="team-members">{team.members} 人</span>
    </div>
    <div className="team-tags">
      {team.tags.map((tag) => (
        <span key={tag} className="team-tag">{tag}</span>
      ))}
    </div>
  </div>
);

// 上下文面板组件
const ContextPanel = ({ rawInput, attachments, brief, onConfirm, onCancel, onBuildOwn }) => (
  <div className="context-panel">
    {/* 原始输入 */}
    {rawInput && (
      <div className="context-section">
        <div className="section-label">原始输入</div>
        <div className="section-content raw-input">
          <FileText size={14} />
          <p>{rawInput}</p>
        </div>
      </div>
    )}

    {/* 上传资料 */}
    {attachments && attachments.length > 0 && (
      <div className="context-section">
        <div className="section-label">已上传资料</div>
        <div className="section-content attachments">
          {attachments.map((att, idx) => (
            <div key={idx} className="attachment-item">
              {att.type === 'image' && <Image size={14} />}
              {att.type === 'video' && <Video size={14} />}
              {att.type === 'document' && <FileText size={14} />}
              <span>{att.name}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Brief 整理 */}
    {brief && (
      <div className="context-section">
        <div className="section-label">Brief 整理</div>
        <div className="section-content brief">
          <p>{brief}</p>
        </div>
      </div>
    )}

    {/* 操作按钮 */}
    <div className="context-actions">
      <button className="context-btn primary" onClick={onConfirm}>
        <Check size={16} />
        采用此方案
      </button>
      <button className="context-btn secondary" onClick={onBuildOwn}>
        <Puzzle size={16} />
        自己搭建
      </button>
      <button className="context-btn danger" onClick={onCancel}>
        取消
      </button>
    </div>
  </div>
);

// 方案预览区组件
const PlanPreview = ({ plans, selectedPlan, onSelectPlan }) => (
  <div className="plan-preview">
    <div className="preview-header">
      <h3>推荐方案</h3>
      <span className="preview-hint">选择一种方案进入执行态</span>
    </div>

    {/* 推荐链路卡片 */}
    <div className="plan-cards">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isSelected={selectedPlan === plan.id}
          onSelect={() => onSelectPlan(plan.id)}
        />
      ))}
    </div>

    {/* 或分隔 */}
    <div className="divider">
      <span>或者</span>
    </div>

    {/* 团队选择 */}
    <div className="team-section">
      <h4>推荐团队</h4>
      <div className="team-cards">
        {mockTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onSelect={() => console.log('Select team:', team.id)}
          />
        ))}
      </div>
    </div>

    {/* 自由节点组合 */}
    <div className="free组合-section">
      <h4>自由组合</h4>
      <p className="free-hint">从节点库中自由选择需要的节点</p>
      <button className="customize-btn">
        <Puzzle size={16} />
        自定义节点组合
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

// 规划态页面主组件
const PlanningPage = ({
  projectName = '未命名项目',
  rawInput = '',
  attachments = [],
  onConfirmPlan,
  onCancel,
  onGoToExecution,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planningMessages, setPlanningMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const hasInitialized = useRef(false);

  // 模拟 Brief
  const brief = rawInput ? `目标：制作一部 ${rawInput.length > 20 ? '短剧' : rawInput} 类型视频\n风格：待确认\n时长：待确认` : null;

  // 如果有原始输入，自动触发对话（仅执行一次）
  useEffect(() => {
    if (rawInput && !hasInitialized.current) {
      hasInitialized.current = true;

      const userTimestamp = formatTimestamp();

      // 添加用户消息
      setPlanningMessages([{ role: 'user', content: rawInput, timestamp: userTimestamp }]);
      setIsTyping(true);

      // 模拟 AI 回复
      setTimeout(() => {
        setIsTyping(false);
        setPlanningMessages(prev => [...prev, {
          role: 'assistant',
          content: '收到！根据你的描述，我建议使用"推荐链路 - 精品短剧"方案，包含资深制片人、金牌编剧、概念美术、分镜导演、提示词工程师和视频生成六个节点，可以确保内容质量。\n\n你可以点击右侧的方案卡片查看详情，或告诉我更多细节让我调整方案。',
          thinking: '用户想要制作视频短剧。我需要分析需求并推荐合适的工作流链路。\n\n考虑因素：\n1. 视频类型：短剧，需要故事情节\n2. 质量要求：待确认，但既然用户选择规划态，可能对质量有一定要求\n3. 生产效率：待确认\n\n推荐方案：精品短剧链路\n- 资深制片人：负责整体把控和质量监督\n- 金牌编剧：创作符合要求的剧本\n- 概念美术：视觉风格设计\n- 分镜导演：确保分镜头质量\n- 提示词工程师：优化生成效果\n- 视频生成：最终产出',
          result: '收到！根据你的描述，我建议使用"推荐链路 - 精品短剧"方案，包含资深制片人、金牌编剧、概念美术、分镜导演、提示词工程师和视频生成六个节点，可以确保内容质量。',
          timestamp: formatTimestamp()
        }]);
      }, 1500);
    }
  }, [rawInput]);

  // 处理发送消息
  const handleSendMessage = (message) => {
    const timestamp = formatTimestamp();
    setPlanningMessages(prev => [...prev, { role: 'user', content: message, timestamp }]);
    setIsTyping(true);

    // 模拟 AI 回复（含思考过程）
    setTimeout(() => {
      setIsTyping(false);
      setPlanningMessages(prev => [...prev, {
        role: 'assistant',
        content: '收到！根据你的描述，我建议使用"推荐链路 - 精品短剧"方案，包含资深制片人、金牌编剧、概念美术、分镜导演、提示词工程师和视频生成六个节点，可以确保内容质量。\n\n你可以点击右侧的方案卡片查看详情，或告诉我更多细节让我调整方案。',
        thinking: '用户想要制作视频短剧。我需要分析需求并推荐合适的工作流链路。\n\n考虑因素：\n1. 视频类型：短剧，需要故事情节\n2. 质量要求：待确认，但既然用户选择规划态，可能对质量有一定要求\n3. 生产效率：待确认\n\n推荐方案：精品短剧链路\n- 资深制片人：负责整体把控和质量监督\n- 金牌编剧：创作符合要求的剧本\n- 概念美术：视觉风格设计\n- 分镜导演：确保分镜头质量\n- 提示词工程师：优化生成效果\n- 视频生成：最终产出',
        result: '收到！根据你的描述，我建议使用"推荐链路 - 精品短剧"方案，包含资深制片人、金牌编剧、概念美术、分镜导演、提示词工程师和视频生成六个节点，可以确保内容质量。',
        timestamp: formatTimestamp()
      }]);
    }, 1500);
  };

  // 确认方案
  const handleConfirmPlan = () => {
    const plan = mockPlans.find(p => p.id === selectedPlan);
    if (onConfirmPlan) {
      onConfirmPlan(plan);
    }
    // 不再单独调用onGoToExecution，onConfirmPlan会切换到workspace
  };

  // 自己搭建
  const handleBuildOwn = () => {
    // 自己搭建时，传递blank模式，让App.jsx处理进入空白workspace
    if (onConfirmPlan) {
      onConfirmPlan({ mode: 'blank', id: 'blank' });
    }
  };

  return (
    <div className="planning-page">
      {/* 顶部栏 */}
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

      {/* 主内容区 */}
      <main className="planning-main">
        {/* 左侧：全局对话 */}
        <aside className="planning-left">
          <div className="console-header-simple">
            <Bot size={18} />
            <span>智能助理</span>
          </div>
          <ChatConversation
            messages={planningMessages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
          />
        </aside>

        {/* 中间：方案预览 */}
        <section className="planning-center">
          <PlanPreview
            plans={mockPlans}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
          />
        </section>

        {/* 右侧：上下文 */}
        <aside className="planning-right">
          <ContextPanel
            rawInput={rawInput}
            attachments={attachments}
            brief={brief}
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
