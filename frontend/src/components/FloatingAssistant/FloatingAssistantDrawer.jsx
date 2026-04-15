import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import { forwardRef } from 'react';
import ChatConversation from '../ChatConversation';
import { COMPONENT_TYPE, ASSISTANT_AGENT_ID } from '../../constants/ComponentType';
import { useProjectStore } from '../../stores';
import './FloatingAssistant.css';

/**
 * FloatingAssistantDrawer - 悬浮助手抽屉
 *
 * 360px 宽的侧边抽屉，内嵌 ChatConversation
 */
const FloatingAssistantDrawer = forwardRef(({
  isOpen,
  onClose,
  onMinimize,
  projectId,
  projectVersion,
  messages,
  onMessagesChange,
}, ref) => {
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const currentVersion = useProjectStore(state => state.currentVersion);

  // 处理工作流创建
  const handleWorkflowCreated = (nodes, edges) => {
    console.log('[FloatingAssistant] 工作流创建:', nodes, edges);
    // 可以触发事件或回调通知父组件
  };

  // 处理提案应用
  const handleApplyProposal = (proposal) => {
    console.log('[FloatingAssistant] 应用提案:', proposal);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            className="floating-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 抽屉 */}
          <motion.aside
            className="floating-drawer"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* 抽屉头部 */}
            <div className="drawer-header">
              <div className="header-title">
                <MessageCircle size={18} />
                <span>智能助理</span>
              </div>
              <div className="header-actions">
                <button
                  className="header-btn"
                  onClick={onMinimize}
                  title="最小化"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  className="header-btn close"
                  onClick={onClose}
                  title="关闭"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 聊天内容 */}
            <div className="drawer-content">
              <ChatConversation
                ref={ref}
                agentId={ASSISTANT_AGENT_ID}
                projectId={projectId || currentProjectId}
                projectVersion={projectVersion || currentVersion?.version}
                messages={messages}
                onMessagesChange={onMessagesChange}
                placeholder="输入消息，AI 助手随时为您服务..."
                disabledPlaceholder="生成完成后可对话"
                onWorkflowCreated={handleWorkflowCreated}
                onApplyProposal={handleApplyProposal}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
});

FloatingAssistantDrawer.displayName = 'FloatingAssistantDrawer';

export default FloatingAssistantDrawer;
