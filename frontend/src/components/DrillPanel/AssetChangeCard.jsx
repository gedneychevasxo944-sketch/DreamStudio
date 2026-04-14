import { ExternalLink, RotateCcw, Copy } from 'lucide-react';
import './AssetChangeCard.css';

/**
 * S2: 资产变更卡片
 *
 * 场景：拖拽角色卡到镜头
 * 展示：前后资产卡片对比 + 一致性ID影响说明
 */
const AssetChangeCard = ({ modification, onClose }) => {
  if (!modification) return null;

  const { assetType, beforeAsset, afterAsset, consistencyNote } = modification;

  const getAssetTypeLabel = (type) => {
    const labels = {
      character: '角色',
      scene: '场景',
      style: '风格',
    };
    return labels[type] || '资产';
  };

  return (
    <div className="asset-change-card">
      {/* 操作说明 */}
      <div className="operation-label">
        <span className="operation-type">替换了{getAssetTypeLabel(assetType)}</span>
      </div>

      {/* 资产对比 */}
      <div className="asset-comparison">
        <div className="asset-card before">
          <div className="asset-label">原{getAssetTypeLabel(assetType)}</div>
          <div className="asset-preview">
            <img src={beforeAsset.thumbnail} alt={beforeAsset.name} />
          </div>
          <div className="asset-name">{beforeAsset.name}</div>
          <div className="asset-id">ID: {beforeAsset.id}</div>
        </div>

        <div className="asset-arrow">→</div>

        <div className="asset-card after">
          <div className="asset-label">新{getAssetTypeLabel(assetType)}</div>
          <div className="asset-preview">
            <img src={afterAsset.thumbnail} alt={afterAsset.name} />
          </div>
          <div className="asset-name">{afterAsset.name}</div>
          <div className="asset-id">来自资产库</div>
        </div>
      </div>

      {/* 一致性说明 */}
      {consistencyNote && (
        <div className="consistency-note">
          <span className="note-icon">⚡</span>
          <span className="note-text">{consistencyNote}</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="panel-actions">
        <button className="action-btn secondary">
          <ExternalLink size={14} />
          查看角色卡详情
        </button>
        <button className="action-btn secondary">
          <RotateCcw size={14} />
          撤销替换
        </button>
        <button className="action-btn primary">
          <Copy size={14} />
          应用到所有镜头
        </button>
      </div>
    </div>
  );
};

export default AssetChangeCard;
