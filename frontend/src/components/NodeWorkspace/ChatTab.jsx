import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, ExternalLink, Loader2, X, GitBranch, MessageCircle, ChevronUp } from 'lucide-react';
import { formatTimestamp } from '../../utils/dateUtils';
import { canvasLogger } from '../../utils/logger';
import { proposalApi, chatApi } from '../../services/api';
import { getFieldLabel } from './getFieldLabel';
import ChatConversation from '../ChatConversation';
import '../ChatConversation.css';

const ChatTab = ({ node, projectId, messages, setMessages, onApplyProposal, onRegenerateProposal, onRejectProposal, onApplySuccess, applyingProposalId, setApplyingProposalId }) => {
  const [inputValue, setInputValue] = useState('');
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [modalProposal, setModalProposal] = useState(null);
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 监听 messages 变化，自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <MessageCircle size={32} />
          <p>选择一个节点开始对话</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMessage = { role: 'user', content: inputValue };
    const assistantMessage = { role: 'assistant', content: '', thinking: '', result: '', proposal: null };
    const newMessages = [...messages, userMessage, assistantMessage];
    setMessages(newMessages);
    setInputValue('');

    // 获取 agentId
    const agentId = node.agentId || node.agentCode || node.type;
    if (!agentId) {
      setMessages(prev => prev.map((msg, idx) =>
        idx === prev.length - 1
          ? { ...msg, content: '[错误: 节点缺少 agentId]' }
          : msg
      ));
      return;
    }

    // 调用后端API发送消息并获取AI回复
    chatApi.sendMessageStream(
      {
        projectId,
        projectVersion: null,
        agentId: String(agentId),
        agentName: node.agentCode || node.type || String(agentId),
        message: inputValue.trim(),
        nodeId: node.id,
      },
      {
        onThinking: (data) => {
          setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, thinking: (msg.thinking || '') + (data.delta || '') }
              : msg
          ));
        },
        onResult: (data) => {
          setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, content: data.delta || '', result: data.delta || '', resultType: data.contentType || 'text' }
              : msg
          ));
        },
        onData: (data) => {
          // 解析提案数据
          if (data.type === 'proposal' && data.proposal) {
            setMessages(prev => prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.role === 'assistant'
                ? { ...msg, proposal: data.proposal }
                : msg
            ));
          }
          // 解析图片数据
          if (data.type === 'image' && data.items) {
            setMessages(prev => prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.role === 'assistant'
                ? { ...msg, imageUrls: [...(msg.imageUrls || []), ...data.items] }
                : msg
            ));
          }
          // 解析视频数据
          if (data.type === 'video' && data.items) {
            setMessages(prev => prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.role === 'assistant'
                ? { ...msg, videoItems: [...(msg.videoItems || []), ...data.items] }
                : msg
            ));
          }
        },
        onComplete: () => {
          // nothing special needed
        },
        onError: (error) => {
          setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, content: '[错误: ' + (error.message || '未知错误') + ']' }
              : msg
          ));
        },
      }
    );
  };

  // 获取diff变更列表（兼容不同格式）
  const getDiffChanges = (proposal) => {
    canvasLogger.debug('[NodeWorkspace] [getDiffChanges] proposal:', proposal);
    if (!proposal?.diffJson) return [];

    // configDiff 格式（新的通用格式）
    if (proposal.diffJson.configDiff?.changes && Array.isArray(proposal.diffJson.configDiff.changes)) {
      return proposal.diffJson.configDiff.changes.map(change => ({
        fieldPath: change.key || '',
        before: change.beforeValue || '',
        after: change.afterValue || ''
      }));
    }

    // textDiff 格式（旧格式）
    if (proposal.diffJson.textDiff) {
      return [{
        fieldPath: '',
        before: proposal.diffJson.textDiff.beforeText || '',
        after: proposal.diffJson.textDiff.afterText || ''
      }];
    }

    return [];
  };

  return (
    <div className="workspace-tab-content chat-tab">
      {/* 对话消息列表 */}
      <div className="cc-messages">
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="cc-chat-message user">
                <div className="cc-message-wrapper user">
                  <div className="cc-message-header-row user">
                    <div className="cc-message-avatar">
                      <div className="user-avatar-icon">👤</div>
                    </div>
                    <span className="cc-message-sender">用户</span>
                  </div>
                  <div className="cc-message-body">
                    <div className="cc-result-text">{msg.content}</div>
                  </div>
                </div>
              </div>
            );
          }

          // Assistant message
          const hasResult = msg.result || msg.content;
          const hasThinking = msg.thinking && msg.thinking.length > 0;
          const isLastAssistant = idx === messages.length - 1;
          const msgProposal = msg.proposal;
          const msgProposalStatus = msgProposal?.status || 'pending';

          return (
            <div key={idx} className="cc-chat-message assistant">
              <div className="cc-message-wrapper assistant">
                <div className="cc-message-header-row assistant">
                  <div className="cc-message-avatar">
                    <div className="assistant-avatar-icon">🤖</div>
                  </div>
                  <span className="cc-message-sender">助理</span>
                </div>
                <div className="cc-message-body">
                  {/* 思考过程 */}
                  {hasThinking && (
                    <div className="cc-thinking-section expanded">
                      <button className="cc-thinking-toggle" disabled>
                        <Sparkles size={12} />
                        <span>思考过程</span>
                        <ChevronUp size={14} />
                      </button>
                      <div className="cc-thinking-content">
                        {msg.thinking}
                      </div>
                    </div>
                  )}
                  {/* 结果内容 */}
                  {hasResult && (
                    <div className="cc-result-section">
                      <div className="cc-result-content">
                        <div className="cc-result-text">{msg.result || msg.content}</div>
                        {/* 提案卡片 - 在结果内容里 */}
                        {msgProposal && (
                          <div className="cc-proposal-section">
                            <div className="cc-proposal-header">
                              <GitBranch size={14} />
                              <span className="cc-proposal-label">建议修改：</span>
                              <span className="cc-proposal-summary">{msgProposal.summary}</span>
                            </div>
                            {msgProposal.diffJson && (() => {
                                const changes = getDiffChanges(msgProposal);
                                return (
                                  <div className="cc-proposal-diff-mini">
                                    {changes.length === 1 ? (
                                      <>
                                        <div className="diff-item">
                                          <span className="diff-label">原版：</span>
                                          <span className="diff-text">{changes[0].before}</span>
                                        </div>
                                        <div className="diff-arrow">→</div>
                                        <div className="diff-item">
                                          <span className="diff-label">新版：</span>
                                          <span className="diff-text">{changes[0].after}</span>
                                        </div>
                                      </>
                                    ) : (
                                      changes.map((change, idx) => (
                                        <div key={idx} className="diff-change-item">
                                          <span className="diff-field">{getFieldLabel(change.fieldPath)}：</span>
                                          <span className="diff-before">{change.before}</span>
                                          <span className="diff-arrow">→</span>
                                          <span className="diff-after">{change.after}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                );
                              })()}
                            <div className="cc-proposal-actions">
                              <button className="cc-proposal-btn view-full" onClick={() => { setModalProposal(msgProposal); setDiffModalOpen(true); }}>查看完整diff</button>
                              {msgProposalStatus.toUpperCase() === 'PENDING' ? (
                                <>
                                  <button className="cc-proposal-btn reject" onClick={() => { onRejectProposal?.(msgProposal.nodeId, msgProposal.id); }} disabled={applyingProposalId !== null}>暂不采纳</button>
                                  <button className="cc-proposal-btn apply" onClick={async () => {
                                    // 先更新本地状态为APPLYING，禁用按钮
                                    setApplyingProposalId(msgProposal.id);
                                    try {
                                      await onApplyProposal?.(msgProposal.nodeId, msgProposal.id);
                                      onApplySuccess?.(msgProposal.id);
                                    } catch (error) {
                                      canvasLogger.error('[NodeWorkspace] Failed to apply proposal:', error);
                                    } finally {
                                      setApplyingProposalId(null);
                                    }
                                  }} disabled={applyingProposalId !== null}>{applyingProposalId === msgProposal.id ? '应用中...' : '确认应用'}</button>
                                </>
                              ) : (
                                <div className={`proposal-status-badge ${msgProposalStatus}`}>
                                  {msgProposalStatus.toUpperCase() === 'APPLIED' ? '✓ 已确认' : msgProposalStatus.toUpperCase() === 'REJECTED' ? '✗ 已拒绝' : msgProposalStatus}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="cc-result-actions">
                        <button className="cc-result-action-btn" onClick={() => { if (msgProposal?.diffJson) { setModalProposal(msgProposal); setDiffModalOpen(true); } }}>
                          <ExternalLink size={12} />
                          弹窗查看
                        </button>
                        <button className="cc-result-action-btn" onClick={() => navigator.clipboard.writeText(msg.result || msg.content)}>
                          <Copy size={12} />
                          复制
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* 用于自动滚动到底部的锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 对话输入框 */}
      <div className="cc-input-area">
        <textarea
          className="cc-input"
          placeholder="输入修改指令..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="cc-send-btn" onClick={handleSend}>
          发送
        </button>
      </div>

      {/* Diff 弹窗 */}
      <AnimatePresence>
        {diffModalOpen && modalProposal?.diffJson && (
          <motion.div
            className="cc-proposal-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDiffModalOpen(false)}
          >
            <motion.div
              className="cc-proposal-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cc-proposal-modal-header">
                <span>完整 Diff</span>
                <button className="cc-proposal-modal-close" onClick={() => setDiffModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="cc-proposal-modal-body">
                {getDiffChanges(modalProposal).map((change, idx) => (
                  <div key={idx} className="cc-proposal-modal-change">
                    <div className="cc-proposal-modal-field">{getFieldLabel(change.fieldPath)}</div>
                    <div className="cc-proposal-modal-section">
                      <div className="cc-proposal-modal-label">原版</div>
                      <div className="cc-proposal-modal-text before">{change.before}</div>
                    </div>
                    <div className="cc-proposal-modal-arrow">↓</div>
                    <div className="cc-proposal-modal-section">
                      <div className="cc-proposal-modal-label">新版</div>
                      <div className="cc-proposal-modal-text after">{change.after}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 配置 Tab

export default ChatTab;
