import { motion } from 'framer-motion';
import { MoreVertical, Image, Film, FileText, Sparkles } from 'lucide-react';
import { STAGES, STAGE_ICONS } from '../../stores/stageStore';
import './AssetCard.css';

/**
 * AssetCard - 单个资产卡片组件
 *
 * Props:
 * - asset: Asset 对象
 * - isSelected: 是否选中
 * - onClick: 点击回调
 * - onContextMenu: 右键菜单回调（可选）
 */
const AssetCard = ({
  asset,
  isSelected = false,
  onClick,
  onContextMenu,
}) => {
  const { type, name, thumbnail, status, description, prompt, videoUrl } = asset;

  // 获取资产类型图标
  const getTypeIcon = () => {
    switch (type) {
      case STAGES.CHARACTER:
        return STAGE_ICONS[STAGES.CHARACTER];
      case STAGES.SCENE:
        return STAGE_ICONS[STAGES.SCENE];
      case STAGES.PROP:
        return STAGE_ICONS[STAGES.PROP];
      case STAGES.STORYBOARD:
        return STAGE_ICONS[STAGES.STORYBOARD];
      case STAGES.VIDEO:
        return STAGE_ICONS[STAGES.VIDEO];
      case STAGES.SCRIPT:
        return STAGE_ICONS[STAGES.SCRIPT];
      default:
        return '📦';
    }
  };

  // 获取缩略图
  const renderThumbnail = () => {
    // pending 或 running 状态显示 skeleton loading
    if (status === 'pending' || status === 'running') {
      return (
        <div className="asset-thumbnail skeleton">
          <div className="skeleton-shimmer" />
          <span className="skeleton-icon">{getTypeIcon()}</span>
        </div>
      );
    }

    if (thumbnail) {
      return (
        <div className="asset-thumbnail">
          <img src={thumbnail} alt={name} />
          {videoUrl && (
            <div className="video-indicator">
              <Film size={14} />
            </div>
          )}
        </div>
      );
    }

    // 无缩略图时显示占位符
    return (
      <div className="asset-thumbnail placeholder">
        <span className="placeholder-icon">{getTypeIcon()}</span>
      </div>
    );
  };

  // 状态标签
  const renderStatusBadge = () => {
    if (!status || status === 'synced' || status === 'generated') return null;

    const statusConfig = {
      modified: { label: '已修改', className: 'status-modified' },
      running: { label: '生成中', className: 'status-running' },
      pending: { label: '等待生成', className: 'status-pending' },
      error: { label: '错误', className: 'status-error' },
    };

    const config = statusConfig[status];
    if (!config) return null;

    return (
      <span className={`status-badge ${config.className}`}>
        {(status === 'running' || status === 'pending') && <span className="pulse-dot" />}
        {config.label}
      </span>
    );
  };

  return (
    <motion.div
      className={`asset-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, asset);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* 缩略图区域 */}
      <div className="asset-preview">
        {renderThumbnail()}

        {/* 选中态遮罩 */}
        {isSelected && (
          <motion.div
            className="selected-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <span className="selected-check">✓</span>
          </motion.div>
        )}

        {/* 状态徽章 */}
        {renderStatusBadge()}

        {/* 右上角菜单按钮 */}
        <button
          className="menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu?.(e, asset);
          }}
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {/* 资产信息 */}
      <div className="asset-info">
        <h4 className="asset-name" title={name}>
          {name}
        </h4>
        {description && (
          <p className="asset-description" title={description}>
            {description.length > 40 ? description.substring(0, 40) + '...' : description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default AssetCard;
