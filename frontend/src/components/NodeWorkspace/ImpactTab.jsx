import { AlertTriangle, Play, GitBranch, Check } from 'lucide-react';

const ImpactTab = ({ node, downstreamNodes, upstreamNodes, onRerunFromNode, onViewFullImpact }) => {
  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <GitBranch size={32} />
          <p>选择一个节点查看影响范围</p>
        </div>
      </div>
    );
  }

  const isStale = node.data?.status === 'stale';

  // 处理从当前节点重新运行
  const handleRerunFromNode = () => {
    onRerunFromNode?.(node.id);
  };

  // 处理查看完整影响范围
  const handleViewFullImpact = () => {
    onViewFullImpact?.(node.id);
  };

  return (
    <div className="workspace-tab-content impact-tab">
      {/* 当前节点状态 */}
      <div className="impact-section">
        <div className="impact-section-header">
          <span className="section-title">当前节点</span>
        </div>
        <div className={`current-node-status ${node.data?.status || 'ready'}`}>
          <div className="node-info">
            <span className="node-name">{node.name}</span>
            <span className={`node-status-badge ${node.data?.status || 'ready'}`}>
              {node.data?.status === 'stale' && '依赖失效'}
              {node.data?.status === 'completed' && '已完成'}
              {node.data?.status === 'running' && '运行中'}
              {!node.data?.status && '就绪'}
            </span>
          </div>
        </div>
      </div>

      {/* 下游影响 */}
      <div className="impact-section">
        <div className="impact-section-header">
          <span className="section-title">下游影响</span>
          <span className="impact-count">{downstreamNodes.length} 个节点</span>
        </div>
        {downstreamNodes.length > 0 ? (
          <div className="downstream-nodes">
            {downstreamNodes.map((dn) => (
              <div key={dn.id} className="downstream-node-item">
                <div className="node-connection-line">
                  <GitBranch size={12} />
                </div>
                <div className="node-info">
                  <span className="node-name">{dn.name}</span>
                  <span className={`node-status-badge ${dn.status}`}>
                    <AlertTriangle size={10} />
                    {dn.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="impact-empty">无下游节点</div>
        )}
      </div>

      {/* 建议操作 */}
      {downstreamNodes.length > 0 && (
        <div className="impact-section">
          <div className="impact-section-header">
            <span className="section-title">建议操作</span>
          </div>
          <div className="suggested-actions">
            <button className="action-btn primary" onClick={handleRerunFromNode}>
              从当前节点重新运行
            </button>
            <button className="action-btn secondary" onClick={handleViewFullImpact}>
              查看完整影响范围
            </button>
          </div>
        </div>
      )}

      {/* 上游依赖 */}
      <div className="impact-section">
        <div className="impact-section-header">
          <span className="section-title">上游依赖</span>
        </div>
        <div className="upstream-nodes">
          {upstreamNodes.map((un) => (
            <div key={un.id} className="upstream-node-item">
              <span className="node-name">{un.name}</span>
              <span className={`node-status-badge ${un.status}`}>
                <Check size={10} />
                已完成
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 主组件
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
  const [activeTab, setActiveTab] = useState('result');
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
    setActiveTab('result');
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

  const tabs = [
    { id: 'result', label: '结果', icon: 'result' },
    { id: 'chat', label: '对话', icon: 'chat' },
    { id: 'config', label: '配置', icon: 'config' },
    { id: 'history', label: '记录', icon: 'history' },
    { id: 'impact', label: '影响', icon: 'impact' },
  ];

  // Tab 内容组件映射
  const tabContentMap = {
    result: <ResultTab
      node={selectedNode}
      projectId={projectId}
      onGenerateVideo={onGenerateVideo}
      onRestoreVersion={onRestoreVersion}
      versionRefreshKey={versionRefreshKey}
    />,
    chat: <ChatTab
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
    />,
    config: <ConfigTab node={selectedNode} onNodeUpdate={onNodeUpdate} />,
    history: <HistoryTab node={selectedNode} projectId={projectId} versionRefreshKey={versionRefreshKey} />,
    impact: <ImpactTab
      node={selectedNode}
      downstreamNodes={downstreamNodes}
      upstreamNodes={upstreamNodes}
      onRerunFromNode={handleRerunAndRefresh}
      onViewFullImpact={onViewFullImpact}
    />,
  };

  // 无节点时的项目概览
  const renderProjectOverview = () => (
    <div className="workspace-tab-content project-overview">
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

  // 检查节点是否被锁定
  const isNodeLocked = selectedNode?.data?.isLocked;
  const isNodePropagationLocked = selectedNode?.data?.lockedByPropagation;

  // 解锁节点（会同时解锁被传播锁定的上游节点）
  const handleUnlock = () => {
    if (!selectedNode) return;
    const store = useWorkflowStore.getState();
    store.unlockNodeAndUpstream(selectedNode.id);
  };

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

      {/* Tab 栏 */}
      <div className="workspace-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`workspace-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <TabIcon type={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="workspace-tab-panel">
        {selectedNode ? (
          <>
            {tabContentMap[activeTab]}
            {/* 锁定覆盖层 - 锁定时所有Tab都显示 */}
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
    </div>
  );
};

export default ImpactTab;
