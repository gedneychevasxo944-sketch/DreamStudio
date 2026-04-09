import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Copy, X, ExternalLink, Check, Sparkles, ChevronUp, ChevronDown, ZoomIn, GitBranch, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { chatApi } from '../services/api';
import './ChatConversation.css';


// 提案卡片组件
const ProposalCard = ({ proposal, onApply, onReject }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'add_node': return <Plus size={14} />;
      case 'remove_node': return <Trash2 size={14} />;
      case 'update_config': return <GitBranch size={14} />;
      default: return <GitBranch size={14} />;
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'add_node': return '添加节点';
      case 'remove_node': return '删除节点';
      case 'update_config': return '修改配置';
      default: return '未知操作';
    }
  };

  return (
    <div className="cc-proposal-card">
      <div className="cc-proposal-header">
        <GitBranch size={16} />
        <span className="cc-proposal-title">{proposal.title}</span>
      </div>
      <div className="cc-proposal-description">{proposal.description}</div>
      <div className="cc-proposal-changes">
        {proposal.changes.map((change, idx) => (
          <div key={idx} className="cc-proposal-change-item">
            <div className="cc-proposal-change-icon">{getActionIcon(change.action)}</div>
            <div className="cc-proposal-change-content">
              <span className="cc-proposal-change-label">{getActionLabel(change.action)}</span>
              <span className="cc-proposal-change-desc">{change.description}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="cc-proposal-actions">
        <button className="cc-proposal-btn reject" onClick={() => onReject(proposal.id)}>
          <X size={14} />
          暂不采纳
        </button>
        <button className="cc-proposal-btn apply" onClick={() => onApply(proposal)}>
          <Check size={14} />
          确认应用
        </button>
      </div>
    </div>
  );
};

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

const AssistantMessage = ({ message, onOpenModal, onShowToast, proposal, onApplyProposal, onRejectProposal }) => {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const prevThinkingLengthRef = useRef(0);

  // 思考内容自动展开/收起逻辑
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

  // 从 result 解析的图片 URL（旧逻辑，用于纯图片类型）
  const legacyImageUrls = message.resultType === 'image' && message.result
    ? message.result.split(',').map(u => u.trim())
    : [];

  // 混合类型的图片 URL
  const mixedImageUrls = message.imageUrls || [];
  // 混合类型的视频
  const mixedVideoItems = message.videoItems || [];

  // ImageViewer 使用的图片 URL（优先使用混合类型）
  const imageUrls = mixedImageUrls.length > 0 ? mixedImageUrls : legacyImageUrls;

  const renderResult = () => {
    const content = message.result || message.content;
    const hasText = content && content.length > 0;
    const hasImages = mixedImageUrls.length > 0 || legacyImageUrls.length > 0;
    const hasVideos = mixedVideoItems.length > 0;
    const hasProposal = !!proposal;

    // 无内容
    if (!hasText && !hasImages && !hasVideos && !hasProposal) return null;

    // 渲染图片的函数
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

    // 渲染视频的函数
    const renderVideos = (items) => (
      <div className="cc-result-video">
        {items.map((item, idx) => (
          <video key={idx} src={item.url || item} controls />
        ))}
      </div>
    );

    // 渲染文字
    const renderText = () => {
      if (!hasText) return null;
      if (message.resultType === 'markdown') {
        return <div className="cc-result-markdown">{content}</div>;
      }
      return <div className="cc-result-text">{content}</div>;
    };

    // 渲染提案卡片
    const renderProposal = () => {
      if (!hasProposal) return null;
      return (
        <ProposalCard
          proposal={proposal}
          onApply={onApplyProposal}
          onReject={onRejectProposal}
        />
      );
    };

    // 混合类型：有图片或视频或提案
    if (hasImages || hasVideos || hasProposal) {
      return (
        <>
          {renderText()}
          {hasImages && renderImages(mixedImageUrls.length > 0 ? mixedImageUrls : legacyImageUrls)}
          {hasVideos && renderVideos(mixedVideoItems)}
          {hasProposal && renderProposal()}
        </>
      );
    }

    // 纯文字类型
    return (
      <>
        {renderText()}
        {hasProposal && renderProposal()}
      </>
    );
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

          {(message.result || message.content || proposal) && (
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

  // 从 result 解析的图片 URL（旧逻辑）
  const legacyImageUrls = message.resultType === 'image' && message.result
    ? message.result.split(',').map(u => u.trim())
    : [];

  // 混合类型的图片 URL
  const mixedImageUrls = message.imageUrls || [];
  // 混合类型的视频
  const mixedVideoItems = message.videoItems || [];

  const renderResult = () => {
    const content = message.result || message.content;
    const hasText = content && content.length > 0;
    const hasImages = mixedImageUrls.length > 0 || legacyImageUrls.length > 0;
    const hasVideos = mixedVideoItems.length > 0;

    // 无内容
    if (!hasText && !hasImages && !hasVideos) return null;

    // 渲染图片
    const renderImages = (urls) => (
      <div className="cc-result-image">
        {urls.map((url, idx) => (
          <img key={idx} src={url.trim()} alt={`图片${idx + 1}`} />
        ))}
      </div>
    );

    // 渲染视频
    const renderVideos = (items) => (
      <div className="cc-result-video">
        {items.map((item, idx) => (
          <video key={idx} src={item.url || item} controls />
        ))}
      </div>
    );

    // 渲染文字
    const renderText = () => {
      if (!hasText) return null;
      if (message.resultType === 'markdown') {
        return <div className="cc-result-markdown">{content}</div>;
      }
      return <div className="cc-result-text">{content}</div>;
    };

    // 混合类型
    if (hasImages || hasVideos) {
      return (
        <>
          {renderText()}
          {hasImages && renderImages(mixedImageUrls.length > 0 ? mixedImageUrls : legacyImageUrls)}
          {hasVideos && renderVideos(mixedVideoItems)}
        </>
      );
    }

    // 纯文字类型
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

export const formatTimestamp = () => {
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
  onApplyProposal,
  inputMode = 'textarea',  // 'textarea' | 'input'
  disableAutoScroll = false
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [modalMessage, setModalMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [proposals, setProposals] = useState({}); // messageId -> proposal
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesRef = useRef(messages);
  const sendMessageFnRef = useRef(null);
  const sseConnectionRef = useRef(null);

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

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  // 处理应用提案
  const handleApplyProposal = useCallback((proposal) => {
    // 调用父组件的 onApplyProposal 回调
    if (onApplyProposal) {
      onApplyProposal(proposal);
    }
    showToast('已应用提案更改');
    // 从 proposals 状态中移除
    setProposals(prev => {
      const newProposals = { ...prev };
      Object.keys(newProposals).forEach(msgId => {
        if (newProposals[msgId]?.id === proposal.id) {
          delete newProposals[msgId];
        }
      });
      return newProposals;
    });
  }, [onApplyProposal, showToast]);

  // 处理拒绝提案
  const handleRejectProposal = useCallback((proposalId) => {
    setProposals(prev => {
      const newProposals = { ...prev };
      Object.keys(newProposals).forEach(msgId => {
        if (newProposals[msgId]?.id === proposalId) {
          delete newProposals[msgId];
        }
      });
      return newProposals;
    });
    showToast('已拒绝提案');
  }, [showToast]);

  const sendChatMessage = useCallback((messageContent) => {
    if (!messageContent.trim() || loading) return;

    // 关闭之前的 SSE 连接
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
    }

    const timestamp = formatTimestamp();
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: messageContent.trim(),
      timestamp,
    };

    onMessagesChange([...messagesRef.current, userMsg]);
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
    onMessagesChange(prev => [...prev, assistantMsg]);

    let thinkingText = '';
    let resultText = '';
    let resultType = 'text';
    let imageUrls = [];
    let videoItems = [];
    let pendingProposal = null;

    // 使用 chatApi 发送消息
    sseConnectionRef.current = chatApi.sendMessageStream(
      {
        projectId,
        projectVersion,
        agentId,
        agentName: agentId,
        message: messageContent.trim(),
      },
      {
        onThinking: (data) => {
          // 思考步骤 - 增量累加
          if (data.delta) {
            thinkingText += data.delta;
            onMessagesChange(prev => prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, thinking: thinkingText }
                : msg
            ));
          }
        },

        onResult: (data) => {
          // 结果 - 增量累加
          if (data.delta) {
            resultText += data.delta;
          }
          if (data.contentType) {
            resultType = data.contentType;
          }
          onMessagesChange(prev => prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, resultType, result: resultText }
              : msg
          ));

          // 如果返回了工作流数据
          if (data.workflowCreated && data.workflowNodes && data.workflowEdges) {
            onWorkflowCreated?.(data.workflowNodes, data.workflowEdges);
          }
        },

        onData: (data) => {
          // 处理图片/视频数据
          if (data.type === 'image' && data.items) {
            imageUrls = [...imageUrls, ...data.items];
            onMessagesChange(prev => prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, imageUrls }
                : msg
            ));
          } else if (data.type === 'video' && data.items) {
            videoItems = [...videoItems, ...data.items];
            onMessagesChange(prev => prev.map(msg =>
              msg.id === assistantMsgId
                ? { ...msg, videoItems }
                : msg
            ));
          }
        },

        onComplete: (data) => {
          // 完成
          setLoading(false);
          sseConnectionRef.current = null;
        },

        onError: (data) => {
          // 错误
          console.error('[ChatConversation] SSE error:', data);
          const errorMsg = data?.message || '抱歉，发生了错误，请稍后重试。';
          onMessagesChange(prev => prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, result: errorMsg }
              : msg
          ));
          setLoading(false);
          sseConnectionRef.current = null;
        },
      }
    );
  }, [loading, onMessagesChange, projectId, projectVersion, agentId, onWorkflowCreated, onApplyProposal]);

  // 更新 sendMessageFnRef
  useEffect(() => {
    sendMessageFnRef.current = sendChatMessage;
  }, [sendChatMessage]);

  // 组件卸载时关闭 SSE 连接
  useEffect(() => {
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close();
      }
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
                proposal={proposals[msg.id]}
                onApplyProposal={handleApplyProposal}
                onRejectProposal={handleRejectProposal}
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
