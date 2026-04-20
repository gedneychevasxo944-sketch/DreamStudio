import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageCircle, History, Lock, Unlock, Check, X, Target, Loader2, ChevronRight, List, Palette, Video, Code, Play, BookOpen, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { parseScript } from '../utils/scriptUtils';
import { canvasLogger } from '../utils/logger';
import ChatConversation from './ChatConversation';
import { nodeVersionApi, chatApi } from '../services/api';
import { useWorkflowStore } from '../stores';
import './NodeWorkspace.css';
import './ChatConversation.css';

// ============ 子组件 ============

// 输入区域
const InputArea = ({ node, upstreamNodes = [], onInputChange, inputValue }) => {
  if (!node) {
    return (
      <div className="input-area empty">
        <FileText size={24} />
        <p>等待节点数据</p>
      </div>
    );
  }

  // producer 和 content 节点特殊处理
  if (node.type === 'producer' || node.type === 'content') {
    const hasUpstream = upstreamNodes && upstreamNodes.length > 0;
    const upstream = hasUpstream ? upstreamNodes[0] : null;

    return (
      <div className="input-area">
        <div className="input-area-header">
          <span className="input-area-title">输入</span>
        </div>
        <div className="input-area-content">
          {hasUpstream ? (
            <div className="input-with-upstream">
              <div className="upstream-source">
                <div className="upstream-source-header">
                  <span className="upstream-icon">🔗</span>
                  <span className="upstream-label">来自：</span>
                  <span className="upstream-name">{upstream.nodeName || upstream.name}</span>
                </div>
                <pre className="upstream-output">{upstream.output || '无输出'}</pre>
              </div>
              <textarea
                className="input-textarea supplementary"
                placeholder="+ 补充输入（可选）..."
                value={inputValue || ''}
                onChange={(e) => onInputChange?.(e.target.value)}
              />
            </div>
          ) : (
            <textarea
              className="input-textarea"
              placeholder="请输入你的想法、创意或剧本大纲..."
              value={inputValue || ''}
              onChange={(e) => onInputChange?.(e.target.value)}
            />
          )}
        </div>
      </div>
    );
  }

  // 其他节点保持原有逻辑 - 显示上游节点卡片列表
  return (
    <div className="input-area">
      <div className="input-area-header">
        <span className="input-area-title">输入</span>
      </div>
      <div className="input-area-content">
        {upstreamNodes.length === 0 ? (
          <div className="input-source-item system-default">
            <div className="source-icon">
              <FileText size={14} />
            </div>
            <div className="source-info">
              <span className="source-name">系统默认</span>
              <span className="source-desc">使用节点默认配置</span>
            </div>
          </div>
        ) : (
          upstreamNodes.map((upstream) => (
            <div key={upstream.nodeId || upstream.id} className="input-source-item">
              <div className="source-icon" style={{ backgroundColor: upstream.color || '#3b82f6' }}>
                <Target size={14} />
              </div>
              <div className="source-info">
                <span className="source-name">{upstream.nodeName || upstream.name}</span>
                <span className="source-type">{upstream.nodeType || upstream.type}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 输出区域
const OutputArea = ({ node, resultText, displayData }) => {
  if (!node) {
    return (
      <div className="output-area empty">
        <FileText size={24} />
        <p>等待节点数据</p>
      </div>
    );
  }

  return (
    <div className="output-area">
      <div className="output-area-header">
        <span className="output-area-title">输出</span>
      </div>
      <div className="output-area-content">
        {node.type === 'producer' ? (
          <ProducerResult resultText={resultText} />
        ) : node.type === 'content' ? (
          <ContentResult resultText={resultText} />
        ) : (
          <div className="output-result">
            {node.type === 'visual' && <VisualResult displayData={displayData} />}
            {node.type === 'director' && <DirectorResult displayData={displayData} />}
            {node.type === 'technical' && <TechnicalResult displayData={displayData} />}
            {node.type === 'videoGen' && <VideoGenResult displayData={displayData} />}
          </div>
        )}
      </div>
    </div>
  );
};

// Producer 节点结果 - 预览 + Markdown 阅读器
const ProducerResult = ({ resultText }) => {
  const [readerOpen, setReaderOpen] = useState(false);

  const previewText = resultText ? resultText.substring(0, 300) + (resultText.length > 300 ? '...' : '') : '等待生成结果...';

  return (
    <>
      <div className="content-preview">
        <pre className="content-preview-text">{previewText}</pre>
        <button className="content-fullscreen-btn" onClick={() => setReaderOpen(true)}>
          <Maximize2 size={14} />
          查看全文
        </button>
      </div>

      <AnimatePresence>
        {readerOpen && (
          <ProducerReader text={resultText} onClose={() => setReaderOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

// Producer Markdown 阅读器弹窗
const ProducerReader = ({ text, onClose }) => {
  return (
    <motion.div
      className="content-reader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="producer-reader-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reader-header">
          <button className="reader-close" onClick={onClose}>
            <X size={18} />
          </button>
          <span className="reader-title">内容详情</span>
          <span className="reader-progress">Markdown</span>
        </div>
        <div className="producer-reader-content">
          <ReactMarkdown>{text || '暂无内容'}</ReactMarkdown>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Content 节点结果 - 预览 + 阅读器
const ContentResult = ({ resultText }) => {
  const [readerOpen, setReaderOpen] = useState(false);

  // 解析剧本获取章节
  const chapters = [];
  if (resultText) {
    const lines = resultText.split('\n');
    let currentChapter = null;
    let currentContent = [];

    lines.forEach(line => {
      const chapterMatch = line.match(/^第([一二三四五六七八九十百千万\d]+)章/);
      if (chapterMatch) {
        if (currentChapter) {
          chapters.push({
            title: currentChapter,
            content: currentContent.join('\n').trim()
          });
        }
        currentChapter = line.trim();
        currentContent = [];
      } else if (currentChapter) {
        currentContent.push(line);
      }
    });

    if (currentChapter) {
      chapters.push({
        title: currentChapter,
        content: currentContent.join('\n').trim()
      });
    }
  }

  const previewText = resultText ? resultText.substring(0, 300) + (resultText.length > 300 ? '...' : '') : '等待生成结果...';

  return (
    <>
      <div className="content-preview">
        <pre className="content-preview-text">{previewText}</pre>
        <button className="content-fullscreen-btn" onClick={() => setReaderOpen(true)}>
          <BookOpen size={14} />
          查看全文
        </button>
      </div>

      <AnimatePresence>
        {readerOpen && (
          <ContentReader chapters={chapters} onClose={() => setReaderOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

// 剧本阅读器弹窗
const ContentReader = ({ chapters, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const contentRef = useRef(null);

  const currentChapter = chapters[selectedIndex];

  const goToPrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex < chapters.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <motion.div
      className="content-reader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="content-reader-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="reader-header">
          <button className="reader-close" onClick={onClose}>
            <X size={18} />
          </button>
          <span className="reader-title">剧本内容</span>
          <span className="reader-progress">{selectedIndex + 1} / {chapters.length}</span>
        </div>

        {/* 内容区 */}
        <div className="reader-body">
          {/* 左侧目录 */}
          <div className="reader-toc">
            <div className="reader-toc-header">
              <BookOpen size={14} />
              <span>目录</span>
            </div>
            <div className="reader-toc-list">
              {chapters.map((chapter, idx) => (
                <button
                  key={idx}
                  className={`reader-toc-item ${idx === selectedIndex ? 'active' : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  {chapter.title}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="reader-content" ref={contentRef}>
            <div className="reader-content-inner">
              <h2 className="reader-chapter-title">{currentChapter?.title}</h2>
              <pre className="reader-chapter-content">{currentChapter?.content || '无内容'}</pre>
            </div>
          </div>
        </div>

        {/* 底部导航 */}
        <div className="reader-footer">
          <button
            className="reader-nav-btn"
            onClick={goToPrev}
            disabled={selectedIndex === 0}
          >
            ◀ 上一章
          </button>
          <div className="reader-nav-bar">
            <div
              className="reader-nav-progress"
              style={{ width: `${((selectedIndex + 1) / chapters.length) * 100}%` }}
            />
          </div>
          <button
            className="reader-nav-btn"
            onClick={goToNext}
            disabled={selectedIndex === chapters.length - 1}
          >
            下一章 ▶
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Visual 节点结果
const VisualResult = ({ displayData }) => {
  return (
    <div className="result-section">
      <div className="section-header">
        <Palette size={14} />
        <span>视觉风格</span>
      </div>
      <textarea className="result-textarea readonly" value={displayData.overallStyle || ''} readOnly />
    </div>
  );
};

// Director 节点结果
const DirectorResult = ({ displayData }) => {
  return (
    <div className="result-section">
      <div className="section-header">
        <Video size={14} />
        <span>分镜表格</span>
      </div>
      <pre className="output-text">{JSON.stringify(displayData.storyboards || [], null, 2)}</pre>
    </div>
  );
};

// Technical 节点结果
const TechnicalResult = ({ displayData }) => {
  return (
    <div className="result-section">
      <div className="section-header">
        <Code size={14} />
        <span>视频提示词</span>
      </div>
      <textarea className="result-textarea readonly" value={JSON.stringify(displayData.prompts || [], null, 2)} readOnly />
    </div>
  );
};

// VideoGen 节点结果
const VideoGenResult = ({ displayData }) => {
  return (
    <div className="result-section">
      <div className="section-header">
        <Play size={14} />
        <span>视频预览</span>
      </div>
      <pre className="output-text">{displayData.videoPrompt || '暂无视频'}</pre>
    </div>
  );
};

// 运行历史面板
const RunHistoryPanel = ({ node, projectId, versionRefreshKey }) => {
  const [runRecords, setRunRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordDetail, setRecordDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!node || !projectId) {
      setRunRecords([]);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await nodeVersionApi.getHistory(projectId, node.id);
        if (response.data && response.data.versions) {
          const records = response.data.versions.map(v => ({
            id: v.id,
            version: `v${v.versionNo}`,
            time: v.createdAt,
            duration: '-',
            status: v.status === 'READY' ? 'success' : 'failed'
          }));
          setRunRecords(records);
        }
      } catch (error) {
        canvasLogger.error('[RunHistoryPanel] Failed to load history:', error);
        setRunRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [node, projectId, versionRefreshKey]);

  const handleRecordClick = async (record) => {
    if (selectedRecord?.id === record.id) return;
    setSelectedRecord(record);
    setDetailLoading(true);
    try {
      const response = await nodeVersionApi.getVersionDetailWithUpstream(projectId, node.id, record.id);
      if (response.data) {
        setRecordDetail(response.data);
      }
    } catch (error) {
      canvasLogger.error('[RunHistoryPanel] Failed to load record detail:', error);
      setRecordDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (!node) {
    return (
      <div className="run-history-panel empty">
        <History size={24} />
        <p>选择一个节点查看运行记录</p>
      </div>
    );
  }

  return (
    <div className="run-history-panel">
      <div className="run-history-header">
        <span className="run-history-title">运行记录</span>
        <span className="run-history-count">{runRecords.length} 条</span>
      </div>

      <div className="run-records-list">
        {loading ? (
          <div className="run-records-loading">
            <Loader2 size={20} className="spin" />
            <span>加载中...</span>
          </div>
        ) : runRecords.length === 0 ? (
          <div className="run-records-empty">
            <p>暂无运行记录</p>
          </div>
        ) : (
          runRecords.map((record) => (
            <div
              key={record.id}
              className={`run-record-item ${selectedRecord?.id === record.id ? 'selected' : ''}`}
              onClick={() => handleRecordClick(record)}
            >
              <div className="record-left">
                <span className={`record-status ${record.status}`}>
                  {record.status === 'success' ? <Check size={12} /> : <X size={12} />}
                </span>
                <span className="record-version">{record.version}</span>
              </div>
              <div className="record-right">
                <span className="record-time">{record.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            className="run-detail-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedRecord(null); setRecordDetail(null); }}
          >
            <motion.div
              className="run-detail-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="run-detail-header">
                <span className="run-detail-title">运行详情</span>
                <button className="run-detail-close" onClick={() => { setSelectedRecord(null); setRecordDetail(null); }}>
                  <X size={18} />
                </button>
              </div>

              <div className="run-detail-meta">
                <span className="run-detail-version">{selectedRecord.version}</span>
                <span className="run-detail-time">{selectedRecord.time}</span>
                <span className={`run-detail-status ${selectedRecord.status}`}>
                  {selectedRecord.status === 'success' ? '成功' : '失败'}
                </span>
              </div>

              {detailLoading && (
                <div className="run-detail-loading">
                  <Loader2 size={20} className="spin" />
                  <span>加载中...</span>
                </div>
              )}

              {!detailLoading && recordDetail && (
                <div className="run-detail-content">
                  {recordDetail.upstreamNodes && recordDetail.upstreamNodes.length > 0 && (
                    <div className="run-detail-section">
                      <div className="run-detail-section-header">
                        <span>上游节点（数据来源）</span>
                      </div>
                      <div className="run-detail-upstreams">
                        {recordDetail.upstreamNodes.map((upstream, idx) => (
                          <div key={idx} className="run-detail-upstream-item">
                            <div className="upstream-name">{upstream.nodeName || upstream.nodeId}</div>
                            <div className="upstream-output">
                              {upstream.output || '无输出'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="run-detail-section">
                    <div className="run-detail-section-header">
                      <span>输出</span>
                    </div>
                    <div className="run-detail-result">
                      {recordDetail.resultText || '无输出'}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============ 主组件 ============

const NodeWorkspace = ({
  selectedNode,
  projectId,
  onNodeUpdate,
  onGenerateVideo,
  onApplyProposal,
  onRegenerateProposal,
  onRejectProposal,
  onRestoreVersion,
  onRerunFromNode,
  onViewFullImpact,
  downstreamNodes = [],
  upstreamNodes = []
}) => {
  // Drawer 状态 (chat | history | null)
  const [activeDrawer, setActiveDrawer] = useState(null);

  const [versionRefreshKey, setVersionRefreshKey] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [applyingProposalId, setApplyingProposalId] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // 加载节点的历史对话
  useEffect(() => {
    if (!selectedNode || !projectId) {
      setChatMessages([]);
      return;
    }

    let cancelled = false;
    const currentNodeId = selectedNode.id;

    const loadChatHistory = async () => {
      try {
        canvasLogger.debug('[NodeWorkspace] [ChatHistory] Loading for node:', currentNodeId, 'project:', projectId);
        const res = await chatApi.getNodeChatHistory(projectId, currentNodeId);
        canvasLogger.debug('[NodeWorkspace] [ChatHistory] Response:', res);

        if (cancelled) {
          canvasLogger.debug('[NodeWorkspace] [ChatHistory] Cancelled, ignoring response for node:', currentNodeId);
          return;
        }

        if (res.data && Array.isArray(res.data)) {
          canvasLogger.debug('[NodeWorkspace] [ChatHistory] Found', res.data.length, 'records for node:', currentNodeId);
          const historyMessages = [];
          res.data.forEach(record => {
            if (record.question) {
              historyMessages.push({
                role: 'user',
                content: record.question
              });
            }
            if (record.result) {
              historyMessages.push({
                role: 'assistant',
                content: record.result,
                result: record.result,
                proposal: record.proposal || null
              });
            }
          });
          setChatMessages(historyMessages);
        } else {
          canvasLogger.debug('[NodeWorkspace] [ChatHistory] No data or empty array for node:', currentNodeId);
          setChatMessages([]);
        }
      } catch (error) {
        canvasLogger.error('[NodeWorkspace] [ChatHistory] Failed to load chat history:', error);
        if (!cancelled) {
          setChatMessages([]);
        }
      }
    };

    loadChatHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedNode?.id, projectId]);

  // 聊天提案应用成功
  const handleChatApplySuccess = useCallback((proposalId) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.proposal && msg.proposal.id === proposalId) {
        return {
          ...msg,
          proposal: {
            ...msg.proposal,
            status: 'APPLIED'
          }
        };
      }
      return msg;
    }));
  }, []);

  // 处理重新运行
  const handleRerunAndRefresh = useCallback((nodeId) => {
    onRerunFromNode?.(nodeId);
  }, [onRerunFromNode]);

  // 监听工作流完成事件
  useEffect(() => {
    const handleWorkflowComplete = () => {
      setVersionRefreshKey(k => k + 1);
    };
    const handleProposalApplied = () => {
      setVersionRefreshKey(k => k + 1);
    };
    const handleProposalRejected = (e) => {
      const { proposalId } = e.detail;
      setChatMessages(prev => prev.map(msg => {
        if (msg.proposal && msg.proposal.id === proposalId) {
          return {
            ...msg,
            proposal: {
              ...msg.proposal,
              status: 'REJECTED'
            }
          };
        }
        return msg;
      }));
    };
    document.addEventListener('workflowComplete', handleWorkflowComplete);
    document.addEventListener('proposalApplied', handleProposalApplied);
    document.addEventListener('proposalRejected', handleProposalRejected);
    return () => {
      document.removeEventListener('workflowComplete', handleWorkflowComplete);
      document.removeEventListener('proposalApplied', handleProposalApplied);
      document.removeEventListener('proposalRejected', handleProposalRejected);
    };
  }, []);

  // 切换 drawer
  const toggleDrawer = (drawerId) => {
    const newDrawer = activeDrawer === drawerId ? null : drawerId;
    setActiveDrawer(newDrawer);
  };

  // 检查节点是否被锁定
  const isNodeLocked = selectedNode?.data?.isLocked;
  const isNodePropagationLocked = selectedNode?.data?.lockedByPropagation;

  // 解锁节点
  const handleUnlock = () => {
    if (!selectedNode) return;
    const store = useWorkflowStore.getState();
    store.unlockNodeAndUpstream(selectedNode.id);
  };

  const drawerTabs = [
    { id: 'chat', label: '对话', icon: MessageCircle },
    { id: 'history', label: '运行历史', icon: History },
  ];

  // 当前版本号
  const currentVersion = selectedNode?.data?.currentVersion || 0;

  // 无节点时的项目概览
  const renderProjectOverview = () => (
    <div className="workspace-main-content project-overview">
      <div className="overview-header">
        <h3>项目概览</h3>
      </div>
      <div className="overview-stats">
        <div className="stat-item">
          <span className="stat-value">-</span>
          <span className="stat-label">节点数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">-</span>
          <span className="stat-label">待处理</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">-</span>
          <span className="stat-label">运行中</span>
        </div>
      </div>
      <div className="overview-hint">
        <p>从画布选择一个节点查看详情</p>
      </div>
    </div>
  );

  return (
    <div className={`node-workspace ${isNodeLocked ? 'locked' : ''}`}>
      {/* 节点信息区域 */}
      {selectedNode && (
        <div className="workspace-node-info">
          <div className="node-info-icon" style={{ backgroundColor: selectedNode.color }}>
            <Target size={14} />
          </div>
          <div className="node-info-content">
            <span className="node-info-name">{selectedNode.name}</span>
            <span className="node-info-type">{selectedNode.type}</span>
          </div>
          <span className="version-badge-header">V{currentVersion}</span>
          {isNodeLocked && (
            <div className="node-info-locked-badge">
              <Lock size={12} />
              <span>已锁定</span>
            </div>
          )}
        </div>
      )}

      {/* 主内容区 */}
      <div className="workspace-main-area">
        {selectedNode ? (
          <>
            {/* 输入区域 - 50% 高度 */}
            <div className="workspace-content-section input-section">
              <InputArea
                node={selectedNode}
                upstreamNodes={upstreamNodes}
                onInputChange={setInputValue}
                inputValue={inputValue}
              />
            </div>

            {/* 分割线 */}
            <div className="workspace-divider" />

            {/* 输出区域 - 50% 高度 */}
            <div className="workspace-content-section output-section">
              <OutputArea
                node={selectedNode}
                resultText={selectedNode?.data?.resultText || ''}
                displayData={selectedNode?.data || {}}
              />
            </div>

            {/* 锁定覆盖层 */}
            {isNodeLocked && (
              <div className="locked-overlay">
                <div className="locked-overlay-content">
                  <div className="lock-icon-large">
                    <Lock size={20} />
                  </div>
                  {isNodePropagationLocked ? (
                    <>
                      <p>已被下游节点锁定</p>
                      <p className="propagation-hint-text">请从下游节点解锁</p>
                    </>
                  ) : (
                    <>
                      <p>节点已锁定</p>
                      <button className="unlock-btn" onClick={handleUnlock}>
                        <Unlock size={14} />
                        <span>立即解锁</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          renderProjectOverview()
        )}
      </div>

      {/* 底部 Drawer Tab 条 */}
      {selectedNode && (
        <div className="workspace-drawer-bar">
          {drawerTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`drawer-tab ${activeDrawer === tab.id ? 'active' : ''}`}
                onClick={() => toggleDrawer(tab.id)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <ChevronRight size={12} className={`drawer-chevron ${activeDrawer === tab.id ? 'open' : ''}`} />
              </button>
            );
          })}
        </div>
      )}

      {/* Drawer 展开内容 */}
      <AnimatePresence>
        {activeDrawer && (
          <motion.div
            className="workspace-drawer-overlay"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '50%', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="workspace-drawer-content">
              <div className="drawer-header">
                <span className="drawer-title">
                  {activeDrawer === 'chat' ? <MessageCircle size={16} /> : <History size={16} />}
                  {activeDrawer === 'chat' ? '对话' : '运行历史'}
                </span>
                <button className="drawer-close" onClick={() => setActiveDrawer(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="drawer-body">
                {activeDrawer === 'chat' && (
                  <ChatConversation
                    agentId={selectedNode?.agentId || selectedNode?.agentCode || selectedNode?.type}
                    projectId={projectId}
                    messages={chatMessages}
                    onMessagesChange={setChatMessages}
                    placeholder="输入修改指令..."
                    inputMode="textarea"
                  />
                )}
                {activeDrawer === 'history' && (
                  <RunHistoryPanel
                    node={selectedNode}
                    projectId={projectId}
                    versionRefreshKey={versionRefreshKey}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NodeWorkspace;
