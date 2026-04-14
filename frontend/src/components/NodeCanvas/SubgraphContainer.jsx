import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Play, AlertCircle, Check } from 'lucide-react';
import { useSubgraphStore, SUBGRAPH_SYNC_STATUS } from '../../stores';
import './SubgraphContainer.css';

/**
 * SubgraphContainer - 子图容器组件
 * 用于在节点画布中展示可折叠的子图
 */
const SubgraphContainer = ({
  subgraph,
  isFocused = false,
  onExpand,
  onCollapse,
  onRun,
  onFocus,  // 点击"进入画布"时调用
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = subgraph.isExpanded !== false; // 默认展开
  const syncStatus = subgraph.syncStatus || SUBGRAPH_SYNC_STATUS.SYNCED;

  const handleToggle = () => {
    if (isExpanded) {
      onCollapse?.(subgraph.id);
    } else {
      onExpand?.(subgraph.id);
    }
  };

  const handleRun = (e) => {
    e.stopPropagation();
    onRun?.(subgraph.id);
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (syncStatus) {
      case SUBGRAPH_SYNC_STATUS.MODIFIED:
        return 'var(--status-adjusted, #f59e0b)';
      case SUBGRAPH_SYNC_STATUS.RUNNING:
        return 'var(--accent-blue, #3b82f6)';
      case SUBGRAPH_SYNC_STATUS.ERROR:
        return 'var(--status-error, #ef4444)';
      default:
        return 'var(--status-generated, #22c55e)';
    }
  };

  // 获取状态图标
  const getStatusIcon = () => {
    switch (syncStatus) {
      case SUBGRAPH_SYNC_STATUS.MODIFIED:
        return <AlertCircle size={12} />;
      case SUBGRAPH_SYNC_STATUS.RUNNING:
        return <div className="subgraph-running-spinner" />;
      case SUBGRAPH_SYNC_STATUS.ERROR:
        return <AlertCircle size={12} />;
      default:
        return <Check size={12} />;
    }
  };

  // 资产缩略图
  const renderThumbnail = () => {
    if (subgraph.thumbnail) {
      return (
        <img
          src={subgraph.thumbnail}
          alt={subgraph.name}
          className="subgraph-thumbnail"
        />
      );
    }
    return (
      <div className="subgraph-thumbnail-placeholder">
        {subgraph.type === 'character' ? '👤' :
         subgraph.type === 'scene' ? '🏞️' :
         subgraph.type === 'shot' ? '🎬' : '📦'}
      </div>
    );
  };

  return (
    <motion.div
      className={`subgraph-container ${isFocused ? 'focused' : ''} ${syncStatus === SUBGRAPH_SYNC_STATUS.RUNNING ? 'running' : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--subgraph-status-color': getStatusColor(),
      }}
    >
      {/* 子图头部 */}
      <div className="subgraph-header" onClick={handleToggle}>
        <div className="subgraph-toggle">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        <div className="subgraph-thumbnail-wrapper">
          {renderThumbnail()}
        </div>

        <div className="subgraph-info">
          <span className="subgraph-name">{subgraph.name}</span>
          <span className="subgraph-type">{subgraph.type}</span>
        </div>

        <div className="subgraph-status">
          {getStatusIcon()}
        </div>

        {/* 运行按钮 */}
        {(isHovered || isFocused) && (
          <button
            className="subgraph-run-btn"
            onClick={handleRun}
            title="运行此子图"
          >
            <Play size={12} />
          </button>
        )}
      </div>

      {/* 子图内容 */}
      {isExpanded && (
        <motion.div
          className="subgraph-content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 子图展开时的内部内容渲染 */}
          {children}

          {/* 进入画布按钮 */}
          <div className="subgraph-content-footer">
            <button
              className="subgraph-enter-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFocus?.(subgraph.id);
              }}
            >
              进入画布
            </button>
          </div>
        </motion.div>
      )}

      {/* 子图折叠时的预览节点 */}
      {!isExpanded && (
        <div className="subgraph-collapsed-preview">
          <div className="subgraph-nodes-count">
            {subgraph.nodes?.length || 0} 个节点
          </div>
        </div>
      )}

      {/* 运行进度光效 */}
      {syncStatus === SUBGRAPH_SYNC_STATUS.RUNNING && (
        <div className="subgraph-running-overlay">
          <div className="subgraph-running-progress" />
        </div>
      )}
    </motion.div>
  );
};

export default SubgraphContainer;
