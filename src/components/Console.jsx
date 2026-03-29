import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Bot } from 'lucide-react';
import ChatConversation from './ChatConversation';
import { COMPONENT_TYPE } from '../constants/ComponentType';
import './Console.css';

const Console = ({ onLoadWorkflow, pendingChatMessage, onPendingChatMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);
  const hasSentPendingMessage = useRef(false);

  // 处理待发送的聊天消息（从主页输入）
  useEffect(() => {
    if (pendingChatMessage && !hasSentPendingMessage.current) {
      hasSentPendingMessage.current = true;
      // 调用 ChatConversation 内部的发送方法
      if (chatRef.current?.sendMessage) {
        chatRef.current.sendMessage(pendingChatMessage);
      }
      onPendingChatMessageSent?.();
    }
  }, [pendingChatMessage, onPendingChatMessageSent]);

  const handleWorkflowCreated = useCallback((nodes, edges) => {
    onLoadWorkflow?.(nodes, edges);
  }, [onLoadWorkflow]);

  return (
    <div className="console-chat">
      <div className="console-header-simple">
        <Bot size={18} />
        <span>智能助理</span>
      </div>

      <ChatConversation
        ref={chatRef}
        agentId={COMPONENT_TYPE.ASSISTANT}
        projectId={1}
        projectVersion={1}
        messages={messages}
        onMessagesChange={setMessages}
        placeholder="输入消息..."
        disabledPlaceholder="生成完成后可对话"
        onWorkflowCreated={handleWorkflowCreated}
      />
    </div>
  );
};

export default Console;
