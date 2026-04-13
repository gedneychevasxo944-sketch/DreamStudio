import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Copy, X, ExternalLink, Check, Sparkles, ChevronUp, ChevronDown, ZoomIn, GitBranch, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { chatApi } from '../services/api';
import { formatTimestamp } from '../utils/dateUtils';
import { chatLogger } from '../utils/logger';
import './ChatConversation.css';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return createPortal(
    <div className="cc-toast-message">
      <Check size={14} />
      {message}
    </div>,
    document.body
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

const AssistantMessage = ({ message, onOpenModal, onShowToast, onApplyProposal, onRejectProposal }) => {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const prevThinkingLengthRef = useRef(0);
  const proposal = message.proposal;

  useEffect(() => {
    const currentThinkingLength = message.thinking?.length || 0;
    if (currentThinkingLength > 0 && prevThinkingLengthRef.current === 0) {
      setThinkingExpanded(true);
    }
    prevThinkingLengthRef.current = currentThinkingLength;
  }, [message.thinking]);

  useEffect(() => {
    if (message.result && message.result.length > 0) {
      setThinkingExpanded(false);
    }
  }, [message.result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.result || message.content);
    onShowToast('已复制到剪贴板');
  };

  const handleViewFullDiff = () => {
    if (proposal?.diffJson) {
      setDiffModalOpen(true);
    }
  };

  const handleApplyProposal = () => {
    if (proposal?.status === 'pending') {
      onApplyProposal?.(proposal.id);
    }
  };

  const handleRejectProposal = () => {
    if (proposal?.status === 'pending') {
      onRejectProposal?.(proposal.id);
    }
  };

  const getDiffBefore = () => {
    if (!proposal?.diffJson) return '';
    return proposal.diffJson.textDiff?.beforeText || proposal.diffJson.beforeText || '';
  };

  const getDiffAfter = () => {
    if (!proposal?.diffJson) return '';
    return proposal.diffJson.textDiff?.afterText || proposal.diffJson.afterText || '';
  };

  const legacyImageUrls = message.resultType === 'image' && message.result
    ? message.result.split(',').map(u => u.trim())
    : [];
  const mixedImageUrls = message.imageUrls || [];
  const mixedVideoItems = message.videoItems || [];
  const imageUrls = mixedImageUrls.length > 0 ? mixedImageUrls : legacyImageUrls;

  const renderResult = () => {
    const content = message.result || message.content;
    const hasText = content && content.length > 0;
    const hasImages = mixedImageUrls.length > 0 || legacyImageUrls.length > 0;
    const hasVideos = mixedVideoItems.length > 0;

    if (!hasText && !hasImages && !hasVideos) return null;

    const renderImages = (urls) => (
      <div className="cc-result-image">
        {urls.map((url, idx) => (
          <div key={idx} className="cc-result-image-item" onClick={() => { setCurrentImageIndex(idx); setImageViewerOpen(true); }}>
            <img src={url} alt={`图片${idx + 1}`} />
            <div className="cc-result-image-overlay">
              <ZoomIn size={20} />
            </div>
          </div>
        ))}
      </div>
    );

    const renderVideos = (items) => (
      <div className="cc-result-video">
        {items.map((item, idx) => (
          <video key={idx} src={item.url || item} controls />
        ))}
      </div>
    );

    const renderText = () => {
      if (!hasText) return null;
      if (message.resultType === 'markdown') {
        return <div className="cc-result-markdown">{content}</div>;
      }
      return <div className="cc-result-text">{content}</div>;
    };

    if (hasImages || hasVideos) {
      return (
        <>
          {renderText()}
          {hasImages && renderImages(mixedImageUrls.length > 0 ? mixedImageUrls : legacyImageUrls)}
          {hasVideos && renderVideos(mixedVideoItems)}
        </>
      );
    }

    return renderText();
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
          {message.thinking && (
            <div className={`cc-thinking-section ${thinkingExpanded ? 'expanded' : ''}`}>
              <button className="cc-thinking-toggle" onClick={() => setThinkingExpanded(!thinkingExpanded)}>
                <Sparkles size={12} />
                <span>思考过程</span>
                {thinkingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {thinkingExpanded && (
                <div className="cc-thinking-content">
                  <ReactMarkdown>{message.thinking}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {(message.result || message.content) && (
            <div className="cc-result-section">
              <div className="cc-result-content">
                {renderResult()}
                {proposal && (
                  <div className="cc-proposal-section">
                    <div className="cc-proposal-header">
                      <GitBranch size={14} />
                      <span className="cc-proposal-label">建议修改：</span>
                      <span className="cc-proposal-summary">{proposal.summary}</span>
                    </div>
                    {proposal.diffJson && (
                      <div className="cc-proposal-diff-mini">
                        <div className="diff-item">
                          <span className="diff-label">原版：</span>
                          <span className="diff-text">{getDiffBefore().substring(0, 50)}{getDiffBefore().length > 50 ? '...' : ''}</span>
                        </div>
                        <div className="diff-arrow">→</div>
                        <div className="diff-item">
                          <span className="diff-label">新版：</span>
                          <span className="diff-text">{getDiffAfter().substring(0, 50)}{getDiffAfter().length > 50 ? '...' : ''}</span>
                        </div>
                      </div>
                    )}
                    <div className="cc-proposal-actions">
                      <button className="cc-proposal-btn view-full" onClick={handleViewFullDiff}>查看完整diff</button>
                      {proposal.status.toUpperCase() === 'PENDING' && (
                        <>
                          <button className="cc-proposal-btn reject" onClick={handleRejectProposal}>暂不采纳</button>
                          <button className="cc-proposal-btn apply" onClick={handleApplyProposal}>确认应用</button>
                        </>
                      )}
                      {proposal.status.toUpperCase() !== 'PENDING' && (
                        <span className={`proposal-status-badge ${proposal.status}`}>
                          {proposal.status.toUpperCase() === 'CONFIRMED' ? '✓ 已确认' : '✗ 已拒绝'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
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

      {diffModalOpen && proposal?.diffJson && (
        <div className="cc-proposal-modal-overlay" onClick={() => setDiffModalOpen(false)}>
          <div className="cc-proposal-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cc-proposal-modal-header">
              <span>完整 Diff</span>
              <button className="cc-proposal-modal-close" onClick={() => setDiffModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="cc-proposal-modal-body">
              <div className="cc-proposal-modal-section">
                <div className="cc-proposal-modal-label">原版</div>
                <div className="cc-proposal-modal-text before">{getDiffBefore()}</div>
              </div>
              <div className="cc-proposal-modal-arrow">↓</div>
              <div className="cc-proposal-modal-section">
                <div className="cc-proposal-modal-label">新版</div>
                <div className="cc-proposal-modal-text after">{getDiffAfter()}</div>
              </div>
            </div>
          </div>
        </div>
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

  const legacyImageUrls = message.resultType === 'image' && message.result
    ? message.result.split(',').map(u => u.trim())
    : [];
  const mixedImageUrls = message.imageUrls || [];
  const mixedVideoItems = message.videoItems || [];

  const renderResult = () => {
    const content = message.result || message.content;
    const hasText = content && content.length > 0;
    const hasImages = mixedImageUrls.length > 0 || legacyImageUrls.length > 0;
    const hasVideos = mixedVideoItems.length > 0;

    if (!hasText && !hasImages && !hasVideos) return null;

    const renderImages = (urls) => (
      <div className="cc-result-image">
        {urls.map((url, idx) => (
          <img key={idx} src={url.trim()} alt={`图片${idx + 1}`} />
        ))}
      </div>
    );

    const renderVideos = (items) => (
      <div className="cc-result-video">
        {items.map((item, idx) => (
          <video key={idx} src={item.url || item} controls />
        ))}
      </div>
    );

    const renderText = () => {
      if (!hasText) return null;
      if (message.resultType === 'markdown') {
        return <div className="cc-result-markdown">{content}</div>;
      }
      return <div className="cc-result-text">{content}</div>;
    };

    if (hasImages || hasVideos) {
      return (
        <>
          {renderText()}
          {hasImages && renderImages(mixedImageUrls.length > 0 ? mixedImageUrls : legacyImageUrls)}
          {hasVideos && renderVideos(mixedVideoItems)}
        </>
      );
    }

    return renderText();
  };

  return createPortal(
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal-content" onClick={e => e.stopPropagation()}>
        <button className="cc-modal-close-top" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="cc-modal-body">
          {message.thinking && (
            <div className={`cc-modal-thinking-section ${thinkingExpanded ? 'expanded' : ''}`}>
              <button className="cc-modal-thinking-toggle" onClick={() => setThinkingExpanded(!thinkingExpanded)}>
                <Sparkles size={12} />
                <span>思考过程</span>
                {thinkingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {thinkingExpanded && (
                <div className="cc-modal-thinking-content">
                  <ReactMarkdown>{message.thinking}</ReactMarkdown>
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
    </div>,
    document.body
  );
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
  onPlanReceived,
  onApplyProposal,
  onRejectProposal,
  inputMode = 'textarea',
  disableAutoScroll = false
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [modalMessage, setModalMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const sseConnectionRef = useRef(null);
  const [internalMessages, setInternalMessages] = useState([]);
  const hasExternalMessages = typeof onMessagesChange === 'function';
  const effectiveMessages = hasExternalMessages ? messages : internalMessages;
  const updateMessages = hasExternalMessages ? onMessagesChange : setInternalMessages;

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [effectiveMessages]);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  const sendChatMessage = useCallback((messageContent) => {
    if (!messageContent.trim() || loading) return;

    const currentGeneration = effectGenerationRef.current;

    if (sseConnectionRef.current) {
      sseConnectionRef.current.close({ checkGeneration: true, gen: currentGeneration });
    }

    const timestamp = formatTimestamp();
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: messageContent.trim(),
      timestamp,
    };

    updateMessages([...effectiveMessages, userMsg]);
    setInputValue('');
    setLoading(true);

    const assistantMsgId = Date.now() + 1;
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thinking: '',
      resultType: 'text',
      result: '',
      imageUrls: [],
      videoItems: [],
      timestamp: formatTimestamp(),
    };
    updateMessages(prev =>[...prev, assistantMsg]);

    let thinkingText = '';
    let resultText = '';
    let resultType = 'text';
    let imageUrls = [];
    let videoItems = [];

    sseConnectionRef.current = chatApi.sendMessageStream(
      {
        projectId,
        projectVersion,
        agentId,
        agentName: agentId,
        message: messageContent.trim(),
        generation: effectGenerationRef.current,
      },
      {
        onThinking: (data) => {
          if (data.delta) {
            thinkingText += data.delta;
            updateMessages(prev =>prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, thinking: thinkingText }
                : msg
            ));
          }
        },

        onResult: (data) => {
          if (data.delta) {
            resultText += data.delta;
          }
          if (data.contentType) {
            resultType = data.contentType;
          }
          updateMessages(prev =>prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, resultType, result: resultText }
              : msg
          ));

          if (data.workflowCreated && data.workflowNodes && data.workflowEdges) {
            onWorkflowCreated?.(data.workflowNodes, data.workflowEdges);
          }
        },

        onData: (data) => {
          if (data.type === 'image' && data.items) {
            imageUrls = [...imageUrls, ...data.items];
            updateMessages(prev =>prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, imageUrls }
                : msg
            ));
          } else if (data.type === 'video' && data.items) {
            videoItems = [...videoItems, ...data.items];
            updateMessages(prev =>prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, videoItems }
                : msg
            ));
          } else if (data.type === 'proposal' && data.proposal) {
            updateMessages(prev =>prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, proposal: data.proposal }
                : msg
            ));
          }
        },

        onComplete: (data) => {
          setLoading(false);
          sseConnectionRef.current = null;

          // 如果有 plan 数据，触发 onPlanReceived
          if (data.plan && onPlanReceived) {
            onPlanReceived(data.plan);
          } else if (data.workflowCreated && onWorkflowCreated) {
            onWorkflowCreated(data.workflowNodes || data.nodes, data.workflowEdges || data.edges);
          }
        },

        onError: (data) => {
          chatLogger.error('[ChatConversation] SSE error:', data);
          const errorMsg = data?.message || '抱歉，发生了错误，请稍后重试。';
          updateMessages(prev => prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, result: errorMsg }
              : msg
          ));
          setLoading(false);
          sseConnectionRef.current = null;
        },
      }
    );
  }, [loading, updateMessages, projectId, projectVersion, agentId, onWorkflowCreated, onPlanReceived]);

  // 暴露 sendMessage 方法给父组件
  useImperativeHandle(ref, () => ({
    sendMessage: (content) => {
      sendChatMessage(content);
    }
  }), [sendChatMessage]);

  // 组件卸载时关闭 SSE 连接
  // 注意：在 StrictMode 下，cleanup 会在 remount 之前运行，所以这里关闭可能导致问题
  // SSE 只应该被最终的真实卸载（unmount）关闭，而不是 StrictMode 的伪卸载
  const effectGenerationRef = useRef(0);

  useEffect(() => {
    effectGenerationRef.current += 1;
    const currentGeneration = effectGenerationRef.current;

    return () => {
      // StrictMode 下 cleanup 先于 remount 运行，不关闭 SSE
    };
  }, []);

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
  const safeMessages = Array.isArray(effectiveMessages) ? effectiveMessages : [];

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
                onApplyProposal={onApplyProposal}
                onRejectProposal={onRejectProposal}
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
