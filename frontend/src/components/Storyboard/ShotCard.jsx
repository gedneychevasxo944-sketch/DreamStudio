import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import './ShotCard.css';

/**
 * ShotCard - 镜头卡片组件
 *
 * 功能：
 * - 显示镜头缩略图
 * - 显示修改标记 ⚡（有修改时）
 * - 点击选中
 * - 拖拽资产到镜头（支持拖放）
 */
const ShotCard = ({ shot, isSelected, onClick, onDrillDown, onDropAsset }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const hasModification = shot.modifiedFrom !== null;

  const getStatusColor = () => {
    switch (shot.status) {
      case 'generated':
        return 'var(--status-generated, #22c55e)';
      case 'adjusted':
        return 'var(--status-adjusted, #f59e0b)';
      case 'pending':
        return 'var(--status-pending, #888)';
      default:
        return 'var(--status-pending, #888)';
    }
  };

  // 拖拽事件处理
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // 获取拖拽的资产数据
    try {
      const assetData = e.dataTransfer.getData('application/json');
      if (assetData) {
        const asset = JSON.parse(assetData);
        onDropAsset?.(asset);
      }
    } catch (err) {
      console.error('Failed to parse dropped asset:', err);
    }
  }, [onDropAsset]);

  return (
    <div
      className={`shot-card ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 缩略图 */}
      <div className="shot-thumbnail">
        <img src={shot.thumbnailUrl} alt={shot.name} />

        {/* 状态指示器 */}
        <div className="shot-status" style={{ background: getStatusColor() }} />

        {/* 修改标记 */}
        {hasModification && (
          <div
            className="modification-marker"
            title={`来自${shot.modifiedFrom}调整`}
            onClick={(e) => {
              e.stopPropagation();
              onDrillDown?.();
            }}
          >
            <Sparkles size={12} />
          </div>
        )}

        {/* 悬停遮罩 */}
        {isHovered && !isDragOver && (
          <div className="shot-overlay">
            <span className="view-hint">查看详情</span>
          </div>
        )}

        {/* 拖拽中遮罩 */}
        {isDragOver && (
          <div className="shot-overlay drag-over">
            <span className="view-hint">松开替换</span>
          </div>
        )}
      </div>

      {/* 镜头信息 */}
      <div className="shot-info">
        <div className="shot-name">{shot.name}</div>
        <div className="shot-description">{shot.description}</div>
      </div>
    </div>
  );
};

export default ShotCard;
