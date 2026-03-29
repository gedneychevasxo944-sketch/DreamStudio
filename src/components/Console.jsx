import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Copy, X, ExternalLink, Check, Sparkles, ChevronUp, ChevronDown, ZoomIn } from 'lucide-react';
import { COMPONENT_TYPE } from '../constants/ComponentType';
import './Console.css';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-message">
      <Check size={14} />
      {message}
    </div>
  );
};

const ImageViewer = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-content" onClick={e => e.stopPropagation()}>
        <button className="image-viewer-close" onClick={onClose}>
          <X size={24} />
        </button>
        <img src={images[currentIndex]} alt={`图片 ${currentIndex + 1}`} />
        {images.length > 1 && (
          <div className="image-viewer-nav">
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
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-content" onClick={e => e.stopPropagation()}>
        <button className="image-viewer-close" onClick={onClose}>
          <X size={24} />
        </button>
        <video src={url} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
      </div>
    </div>
  );
};

const AssistantMessage = ({ message, onOpenModal, onShowToast }) => {
  const [thinkingExpanded, setThinkingExpanded] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);

  useEffect(() => {
    if (message.result && message.result.length > 0) {
      setThinkingExpanded(false);
    }
  }, [message.result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.result);
    onShowToast('已复制到剪贴板');
  };

  const imageUrls = message.resultType === 'image' ? message.result.split(',').map(u => u.trim()) : [];

  return (
    <div className="chat-message assistant">
      <div className="message-wrapper assistant">
        <div className="message-header-row assistant">
          <div className="message-avatar">
            <Bot size={16} />
          </div>
          <span className="message-sender">助理</span>
          <span className="message-time">{message.timestamp}</span>
        </div>

        <div className="message-body">
          {message.thinking && message.thinking.length > 0 && (
            <div className={`thinking-section ${thinkingExpanded ? 'expanded' : ''}`}>
              <button className="thinking-toggle" onClick={() => setThinkingExpanded(!thinkingExpanded)}>
                <Sparkles size={12} />
                <span>思考过程</span>
                {thinkingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {thinkingExpanded && (
                <div className="thinking-content">
                  {message.thinking.map((step, idx) => (
                    <div key={idx} className="thinking-step">• {step}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {message.result && (
            <div className="result-section">
              <div className="result-content">
                {message.resultType === 'markdown' ? (
                  <div className="result-markdown">{message.result}</div>
                ) : message.resultType === 'image' ? (
                  <div className="result-image">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="result-image-item" onClick={() => { setCurrentImageIndex(idx); setImageViewerOpen(true); }}>
                        <img src={url} alt={`图片${idx + 1}`} />
                        <div className="result-image-overlay">
                          <ZoomIn size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : message.resultType === 'video' ? (
                  <div className="result-video">
                    <video src={message.result} controls />
                  </div>
                ) : (
                  <div className="result-text">{message.result}</div>
                )}
              </div>
              <div className="result-actions">
                <button className="result-action-btn" onClick={() => onOpenModal(message)}>
                  <ExternalLink size={12} />
                  弹窗查看
                </button>
                <button className="result-action-btn" onClick={handleCopy}>
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
    <div className="chat-message user">
      <div className="message-wrapper user">
        <div className="message-header-row user">
          <span className="message-time">{message.timestamp}</span>
          <span className="message-sender">用户</span>
          <div className="message-avatar user">
            <User size={16} />
          </div>
        </div>
        <div className="message-body">
          <div className="message-bubble">{message.content}</div>
        </div>
      </div>
    </div>
  );
};

const ResultModal = ({ message, onClose, onShowToast }) => {
  const [copied, setCopied] = useState(false);
  const [modalThinkingExpanded, setModalThinkingExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.result);
    setCopied(true);
    onShowToast('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-top" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-body">
          {message.thinking && message.thinking.length > 0 && (
            <div className={`modal-thinking-section ${modalThinkingExpanded ? 'expanded' : ''}`}>
              <button className="modal-thinking-toggle" onClick={() => setModalThinkingExpanded(!modalThinkingExpanded)}>
                <Sparkles size={12} />
                <span>思考过程</span>
                {modalThinkingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {modalThinkingExpanded && (
                <div className="modal-thinking-content">
                  {message.thinking.map((step, idx) => (
                    <div key={idx} className="thinking-step">• {step}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="modal-section-title">结果内容</div>
          <div className="modal-result">
            {message.resultType === 'markdown' ? (
              <div className="result-markdown">{message.result}</div>
            ) : message.resultType === 'image' ? (
              <div className="result-image">
                {message.result.split(',').map((url, idx) => (
                  <img key={idx} src={url.trim()} alt={`图片${idx + 1}`} />
                ))}
              </div>
            ) : message.resultType === 'video' ? (
              <div className="result-video">
                <video src={message.result} controls />
              </div>
            ) : (
              <div className="result-text">{message.result}</div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制'}
          </button>
          <span className="modal-time">{message.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

const Console = ({ onLoadWorkflow, pendingChatMessage, onPendingChatMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [modalMessage, setModalMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const hasSentPendingMessage = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理待发送的聊天消息（从主页输入）
  useEffect(() => {
    if (pendingChatMessage && !hasSentPendingMessage.current && !loading) {
      hasSentPendingMessage.current = true;
      // 设置输入值并发送
      setInputValue(pendingChatMessage);
      // 使用 setTimeout 确保状态更新后再发送
      setTimeout(() => {
        sendChatMessage(pendingChatMessage);
        onPendingChatMessageSent?.();
      }, 100);
    }
  }, [pendingChatMessage, loading]);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  // 发送聊天消息的核心逻辑
  const sendChatMessage = useCallback(async (messageContent) => {
    if (!messageContent.trim() || loading) return;

    const timestamp = new Date().toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    }).replace(/\//g, '-');

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: messageContent.trim(),
      timestamp,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    const assistantMsgId = Date.now() + 1;
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thinking: [],
      resultType: 'text',
      result: '',
      timestamp: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).replace(/\//g, '-'),
    };
    setMessages(prev => [...prev, assistantMsg]);

    const thinkingSteps = [];
    let resultType = 'text';
    let result = '';

    try {
      const response = await fetch('/api/workspace/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 1,
          projectVersion: 1,
          agentId: COMPONENT_TYPE.ASSISTANT,
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

              if (data.step) {
                thinkingSteps.push(data.step);
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, thinking: [...thinkingSteps] }
                    : msg
                ));
              }

              if (data.resultType) {
                resultType = data.resultType;
                result = data.result;
                const steps = data.thinkingSteps || thinkingSteps;
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, resultType, result, thinking: steps }
                    : msg
                ));

                // 如果返回了工作流数据，加载到画布
                if (data.workflowCreated && data.workflowNodes && data.workflowEdges) {
                  onLoadWorkflow(data.workflowNodes, data.workflowEdges);
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
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId
          ? { ...msg, result: '抱歉，发生了错误，请稍后重试。' }
          : msg
      ));
    } finally {
      setLoading(false);
    }
  }, [loading, onLoadWorkflow]);

  const handleSend = useCallback(() => {
    sendChatMessage(inputValue);
  }, [inputValue, sendChatMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="console-chat">
      <div className="console-header-simple">
        <Bot size={18} />
        <span>智能助理</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <Bot size={48} />
            <p>开始与智能助理对话</p>
          </div>
        ) : (
          messages.map((msg, index) => (
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

      <div className="console-input-area">
        <div className="input-wrapper">
          <textarea
            className="simple-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={loading}
            rows={4}
          />
          <button
            className="send-btn-inner"
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
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
};

export default Console;
