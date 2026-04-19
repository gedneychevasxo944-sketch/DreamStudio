import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Trash2 } from 'lucide-react';
import ChatConversation, { UserMessage, SimpleAssistantMessage } from '../ChatConversation';
import { useProjectStore } from '../../stores/projectStore';
import './ScriptAssistantPanel.css';

/**
 * ScriptAssistantPanel - 剧本生成助手面板
 *
 * 使用 ChatConversation 通用容器，通过 render props 实现：
 * - 代码块形式展示生成的剧本
 * - [接受]/[拒绝] 按钮
 */
const ScriptAssistantPanel = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
  scriptContent,
}) => {
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);
  const { currentProjectId } = useProjectStore();

  // 当面板打开时，如果有剧本内容，自动发送一条消息触发 AI 生成
  const hasAutoSentRef = useRef(false);
  useEffect(() => {
    if (isOpen && scriptContent && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true;
      const timer = setTimeout(() => {
        const userMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: `请根据以下剧本内容生成目录结构：\n${scriptContent}`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages([userMessage]);
      }, 100);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      hasAutoSentRef.current = false;
    }
  }, [isOpen, scriptContent]);

  // 自定义消息渲染 - 代码块模式
  const renderCodeBlockMessage = ({ msg, index }) => {
    if (msg.role === 'user') {
      return <UserMessage key={msg.id || index} message={msg} />;
    }

    // 检查是否是剧本生成结果（有 result 且是代码块格式）
    if (msg.result && msg.isCodeBlock) {
      return (
        <div key={msg.id || index} className="cc-chat-message assistant">
          <div className="cc-message-wrapper assistant">
            <div className="cc-message-header-row assistant">
              <div className="cc-message-avatar assistant">
                <span>🤖</span>
              </div>
              <span className="cc-message-sender">助手</span>
              <span className="cc-message-time">{msg.timestamp}</span>
            </div>
            <div className="cc-message-body">
              <div className="cc-script-code-block">
                <div className="script-code-header">
                  <span>生成的剧本</span>
                </div>
                <pre className="script-code-content">{msg.result}</pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 普通助手消息
    return <SimpleAssistantMessage key={msg.id || index} message={msg} />;
  };

  // 底部操作栏 - 接受/拒绝按钮
  const renderAcceptRejectFooter = ({ message }) => {
    if (message?.isCodeBlock && message?.result) {
      return (
        <div className="script-assistant-footer">
          <button
            className="btn-accept"
            onClick={() => {
              onAccept?.(message.result);
            }}
          >
            <Check size={16} />
            接受
          </button>
          <button
            className="btn-reject"
            onClick={() => {
              onReject?.();
            }}
          >
            <Trash2 size={16} />
            拒绝
          </button>
        </div>
      );
    }
    return null;
  };

  // 头部内容
  const headerContent = (
    <div className="script-assistant-header">
      <h3>剧本生成助手</h3>
      <button className="close-btn" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      className="script-assistant-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <ChatConversation
        ref={chatRef}
        agentId={3}
        projectId={currentProjectId}
        messages={messages}
        onMessagesChange={setMessages}
        headerContent={headerContent}
        renderMessage={renderCodeBlockMessage}
        renderFooter={renderAcceptRejectFooter}
        placeholder="描述你的故事想法..."
        inputMode="textarea"
      />
    </motion.div>
  );
};

export default ScriptAssistantPanel;
