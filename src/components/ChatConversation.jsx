import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Send, Bot, User, Copy, X, ExternalLink, Check, Sparkles, ChevronUp, ChevronDown, ZoomIn } from 'lucide-react';
import './ChatConversation.css';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="cc-toast-message">
      <Check size={14} />
      {message}
    </div>
  );
};

const ImageViewer = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  return (
    <div className="cc-image-viewer-overlay" onClick={onClose}>
      <div className="cc-image-viewer-content" onClick={e => e.stopPropagation()}>
        <button className="cc-image-viewer-close" onClick={onClose}>
          <X size={24} />
        </button>
        <img src={images[currentIndex]} alt={`图片 ${currentIndex + 1}`} />
        {images.length > 1 && (
          <div className="cc-image-viewer-nav">
            <button onClick={onPrev} disabled={currentIndex === 0}>←</button>
            <span>{currentIndex + 1} / {images.length}</span>
            <button onClick={onNext} disabled={currentIndex === images.length - 1}>→</button>
          </div>
        )}
      </div>
    </div>
  );
};

const VideoViewer = ({ url, onClose }) => {
  return (
    <div className="cc-image-viewer-overlay" onClick={onClose}>
      <div className="cc-image-viewer-content" onClick={e => e.stopPropagation()}>
        <button className="cc-image-viewer-close" onClick={onClose}>
          <X size={24} />
        </button>
        <video src={url} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
      </div>
    </div>
  );
};

const AssistantMessage = ({ message, onOpenModal, onShowToast }) => {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const prevThinkingLengthRef = useRef(0);

  // 思考内容自动展开/收起逻辑
  useEffect(() => {
    const currentThinkingLength = message.thinking?.length || 0;

    // 当有新的思考步骤时，自动展开
    if (currentThinkingLength > 0 && prevThinkingLengthRef.current === 0) {
      setThinkingExpanded(true);
    }
    prevThinkingLengthRef.current = currentThinkingLength;
  }, [message.thinking]);

  useEffect(() => {
    // 当有结果时，自动收起思考内容
    if (message.result && message.result.length > 0) {
      setThinkingExpanded(false);
    }
  }, [message.result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.result || message.content);
    onShowToast('已复制到剪贴板');
  };

  const imageUrls = message.resultType === 'image' && message.result
    ? message.result.split(',').map(u => u.trim())
    : [];

  const renderResult = () => {
    if (!message.result && !message.content) return null;

    const content = message.result || message.content;

    if (message.resultType === 'markdown') {
      return <div className="cc-result-markdown">{content}</div>;
    }
    if (message.resultType === 'image') {
      return (
        <div className="cc-result-image">
          {imageUrls.map((url, idx) => (
            <div key={idx} className="cc-result-image-item" onClick={() => { setCurrentImageIndex(idx); setImageViewerOpen(true); }}>
              <img src={url} alt={`图片${idx + 1}`} />
              <div className="cc-result-image-overlay">
                <ZoomIn size={20} />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (message.resultType === 'video') {
      return (
        <div className="cc-result-video">
          <video src={content} controls />
        </div>
      );
    }
    return <div className="cc-result-text">{content}</div>;
  };

  return (
    <div className="cc-chat-message assistant">
      <div className="cc-message-wrapper assistant">
        <div className="cc-message-header-row assistant">
          <div className="cc-message-avatar">
            <Bot size={16} />
          </div>
          <span className="cc-message-sender">助理</span>
          <span className="cc-message-time">{message.timestamp}</span>
        </div>

        <div className="cc-message-body">
          {message.thinking && message.thinking.length > 0 && (
            <div className={`cc-thinking-section ${thinkingExpanded ? 'expanded' : ''}`}>
              <button className="cc-thinking-toggle" onClick={() => setThinkingExpanded(!thinkingExpanded)}>
                <Sparkles size={12} />
                <span>思考过程</span>
                {thinkingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {thinkingExpanded && (
                <div className="cc-thinking-content">
                  {message.thinking.map((step, idx) => (
                    <div key={idx} className="cc-thinking-step">• {step}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(message.result || message.content) && (
            <div className="cc-result-section">
              <div className="cc-result-content">
                {renderResult()}
              </div>
              <div className="cc-result-actions">
                <button className="cc-result-action-btn" onClick={() => onOpenModal(message)}>
                  <ExternalLink size={12} />
                  弹窗查看
                </button>
                <button className="cc-result-action-btn" onClick={handleCopy}>
                  <Copy size={12} />
                  复制
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {imageViewerOpen && (
        <ImageViewer
          images={imageUrls}
          currentIndex={currentImageIndex}
          onClose={() => setImageViewerOpen(false)}
          onPrev={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
          onNext={() => setCurrentImageIndex(i => Math.min(imageUrls.length - 1, i + 1))}
        />
      )}

      {videoViewerOpen && (
        <VideoViewer
          url={message.result}
          onClose={() => setVideoViewerOpen(false)}
        />
      )}
    </div>
  );
};

const UserMessage = ({ message }) => {
  return (
    <div className="cc-chat-message user">
      <div className="cc-message-wrapper user">
        <div className="cc-message-header-row user">
          <span className="cc-message-time">{message.timestamp}</span>
          <span className="cc-message-sender">用户</span>
          <div className="cc-message-avatar user">
            <User size={16} />
          </div>
        </div>
        <div className="cc-message-body">
          <div className="cc-message-bubble">{message.content}</div>
        </div>
      </div>
    </div>
  );
};

const ResultModal = ({ message, onClose, onShowToast }) => {
  const [copied, setCopied] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.result || message.content);
    setCopied(true);
    onShowToast('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const imageUrls = message.resultType === 'image' && message.result
    ? message.result.split(',').map(u => u.trim())
    : [];

  const renderResult = () => {
    const content = message.result || message.content;

    if (message.resultType === 'markdown') {
      return <div className="cc-result-markdown">{content}</div>;
    }
    if (message.resultType === 'image') {
      return (
        <div className="cc-result-image">
          {imageUrls.map((url, idx) => (
            <img key={idx} src={url.trim()} alt={`图片${idx + 1}`} />
          ))}
        </div>
      );
    }
    if (message.resultType === 'video') {
      return (
        <div className="cc-result-video">
          <video src={content} controls />
        </div>
      );
    }
    return <div className="cc-result-text">{content}</div>;
  };

  return (
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal-content" onClick={e => e.stopPropagation()}>
        <button className="cc-modal-close-top" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="cc-modal-body">
          {message.thinking && message.thinking.length > 0 && (
            <div className={`cc-modal-thinking-section ${thinkingExpanded ? 'expanded' : ''}`}>
              <button className="cc-modal-thinking-toggle" onClick={() => setThinkingExpanded(!thinkingExpanded)}>
                <Sparkles size={12} />
                <span>思考过程</span>
                {thinkingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {thinkingExpanded && (
                <div className="cc-modal-thinking-content">
                  {message.thinking.map((step, idx) => (
                    <div key={idx} className="cc-thinking-step">• {step}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="cc-modal-section-title">结果内容</div>
          <div className="cc-modal-result">
            {renderResult()}
          </div>
        </div>

        <div className="cc-modal-footer">
          <button className="cc-modal-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制'}
          </button>
          <span className="cc-modal-time">{message.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

const formatTimestamp = () => {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

const ChatConversation = forwardRef(({
  agentId,
  projectId,
  projectVersion,
  messages = [],
  onMessagesChange,
  placeholder = '输入消息...',
  disabledPlaceholder = '生成完成后可对话',
  onWorkflowCreated,
  inputMode = 'textarea',  // 'textarea' | 'input'
  disableAutoScroll = false
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [modalMessage, setModalMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesRef = useRef(messages);
  const sendMessageFnRef = useRef(null);

  // 保持 messagesRef 同步
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 暴露 sendMessage 方法给父组件
  useImperativeHandle(ref, () => ({
    sendMessage: (content) => {
      sendMessageFnRef.current?.(content);
    }
  }), []);

  // 自动滚动到最新消息（使用 scrollTop 避免影响父容器）
  // 注意：这个滚动只影响容器内部的滚动条，不会触发父容器（画布）的滚动
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // 只有当内容超出容器时才滚动
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  const sendChatMessage = useCallback(async (messageContent) => {
    if (!messageContent.trim() || loading) return;

    const timestamp = formatTimestamp();
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: messageContent.trim(),
      timestamp,
    };

    onMessagesChange([...messagesRef.current, userMsg]);
    console.log('[ChatConversation] User message added, id:', userMsg.id);
    setInputValue('');
    setLoading(true);

    const assistantMsgId = Date.now() + 1;
    console.log('[ChatConversation] Assistant message created, id:', assistantMsgId);
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thinking: [],
      resultType: 'text',
      result: '',
      timestamp: formatTimestamp(),
    };
    onMessagesChange(prev => {
      console.log('[ChatConversation] Assistant added, prev count:', prev.length);
      return [...prev, assistantMsg];
    });

    const thinkingSteps = [];
    let resultType = 'text';
    let result = '';
    let currentAssistantId = assistantMsgId;

    try {
      const response = await fetch('/api/workspace/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          projectVersion,
          agentId,
          agentName: agentId,
          message: messageContent.trim(),
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        while (buffer.includes('\n')) {
          const newlineIndex = buffer.indexOf('\n');
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (line.startsWith('event:')) {
            continue;
          }

          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              console.log('[ChatConversation] SSE data:', data);

              if (data.step) {
                console.log('[ChatConversation] Thinking step:', data.step);
                thinkingSteps.push(data.step);
                onMessagesChange(prev => prev.map(msg =>
                  msg.id === currentAssistantId
                    ? { ...msg, thinking: [...thinkingSteps] }
                    : msg
                ));
              }

              if (data.resultType !== undefined || data.result !== undefined) {
                console.log('[ChatConversation] Result:', data.resultType, data.result);
                console.log('[ChatConversation] currentAssistantId:', currentAssistantId);
                resultType = data.resultType || 'text';
                result = data.result || '';
                const steps = data.thinkingSteps || thinkingSteps;
                console.log('[ChatConversation] Thinking steps:', steps);
                // 不再用 data.id 覆盖 currentAssistantId，因为 SSE 返回的 id 与前端创建的不匹配
                onMessagesChange(prev => {
                  console.log('[ChatConversation] onMessagesChange - looking for id:', currentAssistantId);
                  console.log('[ChatConversation] onMessagesChange - prev messages:', prev.map(m => ({id: m.id, role: m.role})));
                  return prev.map(msg =>
                    msg.id === currentAssistantId
                      ? { ...msg, resultType, result, thinking: steps }
                      : msg
                  );
                });

                // 如果返回了工作流数据
                if (data.workflowCreated && data.workflowNodes && data.workflowEdges) {
                  onWorkflowCreated?.(data.workflowNodes, data.workflowEdges);
                }
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      onMessagesChange(prev => prev.map(msg =>
        msg.id === assistantMsgId
          ? { ...msg, result: '抱歉，发生了错误，请稍后重试。' }
          : msg
      ));
    } finally {
      setLoading(false);
    }
  }, [loading, onMessagesChange, projectId, projectVersion, agentId, onWorkflowCreated]);

  // 更新 sendMessageFnRef
  useEffect(() => {
    sendMessageFnRef.current = sendChatMessage;
  }, [sendChatMessage]);

  const handleSend = useCallback(() => {
    sendChatMessage(inputValue);
  }, [inputValue, sendChatMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEditable = !loading;
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="cc-container">
      <div className="cc-messages" ref={messagesContainerRef}>
        {safeMessages.length === 0 ? (
          <div className="cc-empty">
            <Bot size={48} />
            <p>开始与助理对话</p>
          </div>
        ) : (
          safeMessages.map((msg, index) => (
            msg.role === 'user' ? (
              <UserMessage key={msg.id || index} message={msg} />
            ) : (
              <AssistantMessage
                key={msg.id || index}
                message={msg}
                onOpenModal={setModalMessage}
                onShowToast={showToast}
              />
            )
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="cc-input-area">
        <div className="cc-input-wrapper">
          {inputMode === 'textarea' ? (
            <textarea
              className="cc-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEditable ? placeholder : disabledPlaceholder}
              disabled={!isEditable}
              rows={3}
            />
          ) : (
            <input
              type="text"
              className="cc-input cc-input-single"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEditable ? placeholder : disabledPlaceholder}
              disabled={!isEditable}
            />
          )}
          <button
            className="cc-send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || !isEditable}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {modalMessage && (
        <ResultModal
          message={modalMessage}
          onClose={() => setModalMessage(null)}
          onShowToast={showToast}
        />
      )}

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
});

export default ChatConversation;
