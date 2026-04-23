import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, createPortal } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Copy, X, ExternalLink, Check, Sparkles, ChevronUp, ChevronDown, ZoomIn, GitBranch, Plus, ArrowRight, Trash2, Upload } from 'lucide-react';
import { chatApi } from '../services/api';
import { formatTimestamp } from '../utils/dateUtils';
import { chatLogger } from '../utils/logger';
import './ChatConversation.css';

/* ============================================
   公共消息组件 - 可独立复用
   ============================================ */

// Toast 组件
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

// 图片查看器
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

// 视频查看器
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

// 用户消息组件
export const UserMessage = ({ message }) => {
  return (
    <div className="cc-chat-message user">
      <div className="cc-message-wrapper user">
        <div className="cc-message-header-row user">
          <span className="cc-message-time">{message.timestamp || formatTimestamp()}</span>
          <span className="cc-message-sender">用户</span>
          <div className="cc-message-avatar user">
            <User size={16} />
          </div>
        </div>
        <div className="cc-message-body">
          <p>{message.content}</p>
        </div>
      </div>
    </div>
  );
};

// 助手消息组件（完整版 - 默认导出）
export const AssistantMessage = ({ message, onOpenModal, onShowToast, onApplyProposal, onRejectProposal, onDrillDown }) => {
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
    onShowToast?.('已复制到剪贴板');
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

    return (
      <div className="cc-result-render">
        {hasText && <ReactMarkdown>{content}</ReactMarkdown>}
        {hasImages && renderImages(imageUrls)}
        {hasVideos && renderVideos(mixedVideoItems)}
      </div>
    );
  };

  return (
    <>
      <div className="cc-chat-message assistant">
        <div className="cc-message-wrapper assistant">
          <div className="cc-message-header-row assistant">
            <div className="cc-message-avatar">
              <Bot size={16} />
            </div>
            <span className="cc-message-sender">助理</span>
            <span className="cc-message-time">{message.timestamp || formatTimestamp()}</span>
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
                            {proposal.status.toUpperCase() === 'CONFIRMED' ? '✓ 已确认' : '✕ 已拒绝'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="cc-result-actions">
                  <button className="cc-result-action-btn" onClick={() => onOpenModal?.(message)}>
                    <ExternalLink size={12} />
                    弹窗查看
                  </button>
                  <button className="cc-result-action-btn" onClick={handleCopy}>
                    <Copy size={12} />
                    复制
                  </button>
                  {message.hasModification && (
                    <button className="cc-result-action-btn drill-down" onClick={() => onDrillDown?.(message)}>
                      <Sparkles size={12} />
                      查看改了什么
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
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
            <button className="cc-proposal-modal-close" onClick={() => setDiffModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="cc-proposal-modal-header">
              <GitBranch size={16} />
              <span>修改对比</span>
            </div>
            <div className="cc-proposal-modal-body">
              <div className="diff-column">
                <div className="diff-column-header">原版</div>
                <pre className="diff-column-content">{getDiffBefore()}</pre>
              </div>
              <div className="diff-column">
                <div className="diff-column-header">新版</div>
                <pre className="diff-column-content">{getDiffAfter()}</pre>
              </div>
            </div>
            {proposal.status.toUpperCase() === 'PENDING' && (
              <div className="cc-proposal-modal-footer">
                <button className="cc-proposal-btn reject" onClick={handleRejectProposal}>暂不采纳</button>
                <button className="cc-proposal-btn apply" onClick={handleApplyProposal}>确认应用</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// 简化版助手消息（无操作按钮）
export const SimpleAssistantMessage = ({ message }) => {
  const content = message.result || message.content;
  if (!content) return null;

  return (
    <div className="cc-chat-message assistant">
      <div className="cc-message-wrapper assistant">
        <div className="cc-message-header-row assistant">
          <div className="cc-message-avatar assistant">
            <Bot size={16} />
          </div>
          <span className="cc-message-sender">助手</span>
          <span className="cc-message-time">{message.timestamp || formatTimestamp()}</span>
        </div>
        <div className="cc-message-body">
          <div className="cc-simple-result">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================
   ChatConversation 容器组件 - 核心逻辑
   ============================================ */

const ChatConversation = forwardRef(({
  agentId,
  nodeId,  // 节点ID，用于 Adeptify contextId
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
  onDrillDown,
  inputMode = 'textarea',

  // === Render Props 扩展 ===
  renderMessage,      // (msg, index) => ReactNode
  renderFooter,       // (lastMessage) => ReactNode
  headerContent,      // ReactNode

}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [modalMessage, setModalMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const sseConnectionRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
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

  // T061: 处理文件上传
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'text/plain', 'application/pdf'];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        showToast(`${file.name} 超过 10MB 限制`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name} 文件类型不支持`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      showToast(`已添加 ${validFiles.length} 个附件`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [showToast]);

  // T061: 移除附件
  const handleRemoveAttachment = useCallback((index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

    let assistantMsgId = null;
    setLoading(true);
    assistantMsgId = Date.now() + 1;
    updateMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp,
    }]);

    sseConnectionRef.current = chatApi.sendMessageStream(
      {
        projectId,
        message: messageContent.trim(),
        contextType: 'node',
        contextId: nodeId || 'default',
      },
      {
        onThinking: (event) => {
          // Adeptify: eventType === 'thinking', content in delta
          updateMessages(prev => prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, thinking: (msg.thinking || '') + (event.delta || '') }
              : msg
          ));
        },

        onResult: (event) => {
          // Adeptify: eventType === 'content', type === 'text', content in delta
          updateMessages(prev => prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, result: (msg.result || '') + (event.delta || '') }
              : msg
          ));
        },

        onData: (event) => {
          // Adeptify: batch_action events - could contain proposals, assets etc
          if (event.delta && typeof event.delta === 'object') {
            if (event.delta.proposal) {
              updateMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, proposal: event.delta.proposal }
                  : msg
              ));
            }
            if (event.delta.imageUrls) {
              updateMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, imageUrls: event.delta.imageUrls }
                  : msg
              ));
            }
            if (event.delta.videoItems) {
              updateMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, videoItems: event.delta.videoItems }
                  : msg
              ));
            }
          }
        },

        onComplete: (data) => {
          setLoading(false);
          sseConnectionRef.current = null;

          // 检查是否有 plan 或 workflow 数据
          if (data && data.plan && onPlanReceived) {
            onPlanReceived(data.plan);
          } else if (data && data.workflowCreated && onWorkflowCreated) {
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
  }, [loading, updateMessages, projectId, agentId, nodeId, onWorkflowCreated, onPlanReceived]);

  // 暴露 sendMessage 和 injectMessage 方法
  useImperativeHandle(ref, () => ({
    sendMessage: (content) => {
      sendChatMessage(content);
    },
    injectMessage: (content) => {
      setInputValue(prev => prev ? `${prev}\n${content}` : content);
    }
  }), [sendChatMessage]);

  const effectGenerationRef = useRef(0);

  useEffect(() => {
    effectGenerationRef.current += 1;
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
  const lastMessage = safeMessages[safeMessages.length - 1];

  return (
    <div className="cc-container">
      {/* 可选头部 */}
      {headerContent && (
        <div className="cc-header">
          {headerContent}
        </div>
      )}

      {/* 消息列表 */}
      <div className="cc-messages" ref={messagesContainerRef}>
        {safeMessages.length === 0 ? (
          <div className="cc-empty">
            <Bot size={48} />
            <p>开始与助理对话</p>
          </div>
        ) : (
          safeMessages.map((msg, index) => (
            renderMessage ? (
              renderMessage({ msg, index, onOpenModal: setModalMessage, onShowToast: showToast, onApplyProposal, onRejectProposal, onDrillDown })
            ) : (
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
                  onDrillDown={onDrillDown}
                />
              )
            )
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 可选底部插槽 */}
      {renderFooter && (
        <div className="cc-footer">
          {renderFooter({ message: lastMessage, messages: safeMessages })}
        </div>
      )}

      {/* 输入区 */}
      <div className="cc-input-area">
        {attachments.length > 0 && (
          <div className="cc-attachments">
            {attachments.map((file, index) => (
              <div key={index} className="cc-attachment-item">
                <span className="cc-attachment-name">{file.name}</span>
                <button
                  className="cc-attachment-remove"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="cc-input-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,text/plain,application/pdf"
            multiple
            style={{ display: 'none' }}
          />
          <button
            className="cc-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isEditable}
            title="添加附件"
          >
            <Upload size={16} />
          </button>
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

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
});

export default ChatConversation;
