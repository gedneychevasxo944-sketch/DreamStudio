import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import { useSubgraphStore, SUBGRAPH_SYNC_STATUS } from '../../stores';
import { eventBus, EVENT_TYPES } from '../../utils/eventBus';
import './SubgraphCanvas.css';

/**
 * SubgraphCanvas - 多子图画布
 * 精简设计：卡片列表 + 浮动运行按钮
 */
const SubgraphCanvas = ({
  onSubgraphExpand,
  onSubgraphCollapse,
  onSubgraphRun,
  onSubgraphSelect,
  onSubgraphFocus,
  projectId,
}) => {
  const {
    subgraphs,
    focusedSubgraphId,
    setFocusedSubgraph,
    expandSubgraph,
    collapseSubgraph,
    runSubgraph,
    runAllSubgraphs,
    markAsSynced,
    markAsError,
  } = useSubgraphStore();

  const [expandedId, setExpandedId] = useState(null);

  // 监听子图运行完成事件
  useEffect(() => {
    const handleRunComplete = ({ subgraphId, success, error }) => {
      if (success) {
        markAsSynced(subgraphId);
      } else {
        markAsError(subgraphId, error);
      }
    };

    eventBus.on(EVENT_TYPES.SUBGRAPH_RUN_COMPLETE, handleRunComplete);
    return () => {
      eventBus.off(EVENT_TYPES.SUBGRAPH_RUN_COMPLETE, handleRunComplete);
    };
  }, [markAsSynced, markAsError]);

  // 切换展开/收起
  const toggleExpand = useCallback((subgraphId) => {
    setExpandedId(prev => prev === subgraphId ? null : subgraphId);
  }, []);

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case SUBGRAPH_SYNC_STATUS.MODIFIED:
        return <span className="status-dot modified" title="有未同步修改" />;
      case SUBGRAPH_SYNC_STATUS.RUNNING:
        return <span className="status-dot running" title="运行中" />;
      case SUBGRAPH_SYNC_STATUS.ERROR:
        return <span className="status-dot error" title="运行错误" />;
      default:
        return <span className="status-dot synced" title="已同步" />;
    }
  };

  // 获取资产类型图标
  const getTypeIcon = (type) => {
    switch (type) {
      case 'character': return '👤';
      case 'scene': return '🏞️';
      case 'shot': return '🎬';
      case 'prop': return '�道具';
      default: return '📦';
    }
  };

  if (subgraphs.length === 0) {
    return (
      <div className="subgraph-canvas-empty">
        <div className="subgraph-canvas-empty-icon">📦</div>
        <div className="subgraph-canvas-empty-text">暂无子图</div>
        <div className="subgraph-canvas-empty-hint">在对话层生成资产后，将在节点层自动创建对应的子图</div>
      </div>
    );
  }

  return (
    <div className="subgraph-canvas">
      {/* 极简顶栏 */}
      <div className="subgraph-topbar">
        <div className="subgraph-topbar-left">
          <span className="subgraph-topbar-title">子图列表</span>
          <span className="subgraph-topbar-badge">{subgraphs.length}</span>
        </div>
        <button
          className="subgraph-topbar-run-btn"
          onClick={() => runAllSubgraphs({ projectId })}
        >
          <Play size={13} />
          运行全部
        </button>
      </div>

      {/* 卡片列表 */}
      <div className="subgraph-cards">
        {subgraphs.map((subgraph) => (
          <motion.div
            key={subgraph.id}
            className={`subgraph-card ${subgraph.id === focusedSubgraphId ? 'focused' : ''}`}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* 卡片主体 */}
            <div
              className="subgraph-card-main"
              onClick={() => toggleExpand(subgraph.id)}
            >
              <div className="subgraph-card-toggle">
                {expandedId === subgraph.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              <div className="subgraph-card-icon">
                {getTypeIcon(subgraph.assetType)}
              </div>
              <div className="subgraph-card-info">
                <div className="subgraph-card-name">{subgraph.name}</div>
                <div className="subgraph-card-type">{subgraph.assetType || '未知'}</div>
              </div>
              <div className="subgraph-card-status">
                {getStatusIcon(subgraph.syncStatus)}
              </div>
              <div className="subgraph-card-actions">
                <button
                  className="subgraph-card-btn enter"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubgraphFocus?.(subgraph.id);
                  }}
                  title="编辑子图"
                >
                  编辑
                </button>
                <button
                  className="subgraph-card-btn run"
                  onClick={(e) => {
                    e.stopPropagation();
                    runSubgraph(subgraph.id);
                  }}
                  title="运行此子图"
                >
                  <Play size={12} />
                </button>
              </div>
            </div>

            {/* 展开详情 */}
            <AnimatePresence>
              {expandedId === subgraph.id && (
                <motion.div
                  className="subgraph-card-detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="subgraph-detail-content">
                    {subgraph.nodes && subgraph.nodes.length > 0 ? (
                      <div className="subgraph-nodes">
                        {subgraph.nodes.map((node) => (
                          <div key={node.id} className="subgraph-node-item">
                            <span className="subgraph-node-name">{node.name}</span>
                            <span className="subgraph-node-type">{node.type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="subgraph-detail-empty">暂无节点，点击「进入」编辑</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SubgraphCanvas;
