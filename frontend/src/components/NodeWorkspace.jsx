import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageCircle, Settings, History, GitBranch, Lock, Unlock, RotateCcw, AlertTriangle, Check, ChevronDown, ChevronUp, Play, Palette, PenTool, Video, Code, Users, Layers, List, BookOpen, Zap, Sparkles, Image, X, Target, Loader2, Copy, ExternalLink, ChevronRight } from 'lucide-react';
import ChatConversation from './ChatConversation';
import { formatTimestamp } from '../utils/dateUtils';
import { parseScript } from '../utils/scriptUtils';
import { applyFieldChanges } from '../utils/nodeUtils';
import { canvasLogger } from '../utils/logger';
import NodeResultRenderer from './NodeWorkspace/NodeResultRenderer';
import ResultTab from './NodeWorkspace/ResultTab';
import ChatTab from './NodeWorkspace/ChatTab';
import ConfigTab from './NodeWorkspace/ConfigTab';
import HistoryTab from './NodeWorkspace/HistoryTab';
import ImpactTab from './NodeWorkspace/ImpactTab';
import './ChatConversation.css';
import { nodeVersionApi, proposalApi, chatApi } from '../services/api';
import { useWorkflowStore } from '../stores';
import './NodeWorkspace.css';

// Drawer 折叠项图标组件
const DrawerIcon = ({ type, size = 14 }) => {
  switch (type) {
    case 'config':
      return <Settings size={size} />;
    case 'history':
      return <History size={size} />;
    case 'impact':
      return <GitBranch size={size} />;
    default:
      return <Settings size={size} />;
  }
};

// 把技术路径转成用户友好的标签
const getFieldLabel = (fieldPath) => {
  const labelMap = {
    'genParams.quality': '画质',
    'genParams.duration': '时长',
    'genParams.model': '模型',
    'genParams.ratio': '比例',
    'budget': '预算',
    'duration': '周期',
    'style': '风格',
    'model': '模型',
    'scene3.description': '场景描述',
    'shot1.type': '镜头类型',
    'shot1.duration': '镜头时长',
  };
  return labelMap[fieldPath] || fieldPath;
};

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
  // 分割线位置 (0-100, 表示结果区占比)
  const [splitRatio, setSplitRatio] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Drawer 状态 (config | history | impact | null)
  const [activeDrawer, setActiveDrawer] = useState(null);

  const [versionRefreshKey, setVersionRefreshKey] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [applyingProposalId, setApplyingProposalId] = useState(null);

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

        // Check if this effect is still valid (node hasn't changed)
        if (cancelled) {
          canvasLogger.debug('[NodeWorkspace] [ChatHistory] Cancelled, ignoring response for node:', currentNodeId);
          return;
        }

        if (res.data && Array.isArray(res.data)) {
          canvasLogger.debug('[NodeWorkspace] [ChatHistory] Found', res.data.length, 'records for node:', currentNodeId);
          // 转换历史消息格式
          const historyMessages = [];
          res.data.forEach(record => {
            // 添加用户消息
            if (record.question) {
              historyMessages.push({
                role: 'user',
                content: record.question
              });
            }
            // 添加助手回复
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

    // Cleanup function to cancel in-flight requests
    return () => {
      cancelled = true;
    };
  }, [selectedNode?.id, projectId]);

  // 聊天提案应用成功 - 切换到结果Tab，更新messages里的proposal状态
  const handleChatApplySuccess = useCallback((proposalId) => {
    // 更新messages里对应proposal的状态为APPLIED
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

  // 处理重新运行 - 只调用 onRerunFromNode，不在这里递增 versionRefreshKey
  const handleRerunAndRefresh = useCallback((nodeId) => {
    onRerunFromNode?.(nodeId);
  }, [onRerunFromNode]);

  // 监听工作流完成事件，在完成后刷新版本列表
  useEffect(() => {
    const handleWorkflowComplete = () => {
      setVersionRefreshKey(k => k + 1);
    };
    const handleProposalApplied = () => {
      setVersionRefreshKey(k => k + 1);
    };
    const handleProposalRejected = (e) => {
      const { proposalId } = e.detail;
      // 更新messages里对应proposal的状态为REJECTED
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

  // 分割线拖动逻辑
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newRatio = Math.min(Math.max((y / rect.height) * 100, 30), 80);
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 切换 drawer
  const toggleDrawer = (drawerId) => {
    setActiveDrawer(prev => prev === drawerId ? null : drawerId);
  };

  // 检查节点是否被锁定
  const isNodeLocked = selectedNode?.data?.isLocked;
  const isNodePropagationLocked = selectedNode?.data?.lockedByPropagation;

  // 解锁节点（会同时解锁被传播锁定的上游节点）
  const handleUnlock = () => {
    if (!selectedNode) return;
    const store = useWorkflowStore.getState();
    store.unlockNodeAndUpstream(selectedNode.id);
  };

  const drawerItems = [
    { id: 'config', label: '配置参数' },
    { id: 'history', label: '历史记录' },
    { id: 'impact', label: '影响范围' },
  ];

  // 无节点时的项目概览
  const renderProjectOverview = () => (
    <div className="workspace-main-content project-overview">
      <div className="overview-header">
        <h3>项目概览</h3>
      </div>
      <div className="overview-stats">
        <div className="stat-item">
          <span className="stat-value">4</span>
          <span className="stat-label">节点数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">2</span>
          <span className="stat-label">待处理</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">1</span>
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
          {isNodeLocked && (
            <div className="node-info-locked-badge">
              <Lock size={12} />
              <span>已锁定</span>
            </div>
          )}
        </div>
      )}

      {/* 主内容区：结果 + 对话 + 分割线 */}
      <div className="workspace-main-area" ref={containerRef}>
        {selectedNode ? (
          <>
            {/* 结果区 */}
            <div className="workspace-result-pane" style={{ height: `${splitRatio}%` }}>
              <ResultTab
                node={selectedNode}
                projectId={projectId}
                onGenerateVideo={onGenerateVideo}
                onRestoreVersion={onRestoreVersion}
                versionRefreshKey={versionRefreshKey}
              />
            </div>

            {/* 分割线 */}
            <div
              className={`workspace-split-handle ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
            >
              <div className="split-handle-bar" />
            </div>

            {/* 对话区 */}
            <div className="workspace-chat-pane" style={{ height: `${100 - splitRatio}%` }}>
              <ChatTab
                node={selectedNode}
                projectId={projectId}
                messages={chatMessages}
                setMessages={setChatMessages}
                onApplyProposal={onApplyProposal}
                onRegenerateProposal={onRegenerateProposal}
                onRejectProposal={onRejectProposal}
                onApplySuccess={handleChatApplySuccess}
                applyingProposalId={applyingProposalId}
                setApplyingProposalId={setApplyingProposalId}
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

      {/* 底部 Drawer 折叠条 */}
      {selectedNode && (
        <div className="workspace-drawer-bar">
          {drawerItems.map((item) => (
            <button
              key={item.id}
              className={`drawer-tab ${activeDrawer === item.id ? 'active' : ''}`}
              onClick={() => toggleDrawer(item.id)}
            >
              <DrawerIcon type={item.id} size={14} />
              <span>{item.label}</span>
              <ChevronRight size={12} className={`drawer-chevron ${activeDrawer === item.id ? 'open' : ''}`} />
            </button>
          ))}
        </div>
      )}

      {/* Drawer 展开内容 */}
      <AnimatePresence>
        {activeDrawer && (
          <motion.div
            className="workspace-drawer-overlay"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '60%', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="workspace-drawer-content">
              <div className="drawer-header">
                <span className="drawer-title">
                  <DrawerIcon type={activeDrawer} size={16} />
                  {drawerItems.find(d => d.id === activeDrawer)?.label}
                </span>
                <button className="drawer-close" onClick={() => setActiveDrawer(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="drawer-body">
                {activeDrawer === 'config' && <ConfigTab node={selectedNode} onNodeUpdate={onNodeUpdate} />}
                {activeDrawer === 'history' && <HistoryTab node={selectedNode} projectId={projectId} versionRefreshKey={versionRefreshKey} />}
                {activeDrawer === 'impact' && (
                  <ImpactTab
                    node={selectedNode}
                    downstreamNodes={downstreamNodes}
                    upstreamNodes={upstreamNodes}
                    onRerunFromNode={handleRerunAndRefresh}
                    onViewFullImpact={onViewFullImpact}
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
