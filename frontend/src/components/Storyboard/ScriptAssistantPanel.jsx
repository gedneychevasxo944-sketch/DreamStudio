import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ChatConversation, { UserMessage, AssistantMessage } from '../ChatConversation';
import { useProjectStore } from '../../stores/projectStore';
import './ScriptAssistantPanel.css';

/**
 * ScriptAssistantPanel - 剧本生成助手面板
 *
 * 使用 ChatConversation 通用容器，复用 AssistantMessage 统一样式
 * 接受/拒绝按钮已在 AssistantMessage 内部实现
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

  // 处理接受 - 把 markdown 内容填入编辑器
  const handleApplySuggestion = useCallback((suggestionId) => {
    const lastMsg = messages.filter(m => m.role === 'assistant').pop();
    if (lastMsg?.content) {
      onAccept?.(lastMsg.content);
    }
  }, [messages, onAccept]);

  // 处理拒绝 - 仅标记状态，保留对话内容
  const handleRejectSuggestion = useCallback((suggestionId) => {
    onReject?.();
  }, [onReject]);

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
        nodeId="character_script"
        projectId={currentProjectId}
        messages={messages}
        onMessagesChange={setMessages}
        headerContent={headerContent}
        placeholder="描述你的故事想法，或直接接受上方生成的剧本..."
        inputMode="textarea"
        onApplySuggestion={handleApplySuggestion}
        onRejectSuggestion={handleRejectSuggestion}
      />
    </motion.div>
  );
};

export default ScriptAssistantPanel;