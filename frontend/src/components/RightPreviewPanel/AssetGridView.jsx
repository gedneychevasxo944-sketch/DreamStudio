import { useState, useMemo } from 'react';
import { Film, Plus, Download, Maximize2 } from 'lucide-react';
import './RightPreviewPanel.css';

/**
 * 资产分类
 */
const ASSET_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'character', label: '角色' },
  { id: 'scene', label: '场景' },
  { id: 'prop', label: '道具' },
];

/**
 * AssetGridView - 多资产网格视图
 */
const AssetGridView = ({
  assets = [],
  onAssetClick,
  onSwitchToSequence,
  onReference,
}) => {
  const [activeCategory, setActiveCategory] = useState('all');

  // 根据分类筛选资产
  const filteredAssets = useMemo(() => {
    if (activeCategory === 'all') return assets;
    return assets.filter(asset => asset.type === activeCategory);
  }, [assets, activeCategory]);

  // 处理@引用
  const handleReference = (e, asset) => {
    e.stopPropagation();
    onReference?.(asset);
  };

  // 获取资产图标
  const getAssetIcon = (type) => {
    switch (type) {
      case 'character': return '👤';
      case 'scene': return '🏞️';
      case 'prop': return '🎁';
      case 'video': return '🎬';
      default: return '🖼️';
    }
  };

  return (
    <div className="asset-grid-view">
      {/* 顶部信息栏 */}
      <div className="asset-grid-header">
        <span className="asset-count">
          共 {filteredAssets.length} 个资产{activeCategory !== 'all' && `（${ASSET_CATEGORIES.find(c => c.id === activeCategory)?.label}）`}
        </span>
        <div className="asset-grid-actions">
          {assets.length > 0 && (
            <button className="preview-action-btn" onClick={onSwitchToSequence} title="以分镜序列方式查看资产">
              <Film size={14} />
              <span>序列模式</span>
            </button>
          )}
        </div>
      </div>

      {/* 分类标签 */}
      <div className="asset-grid-tabs">
        {ASSET_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`asset-grid-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 资产网格 */}
      <div className="asset-grid">
        {filteredAssets.map((asset, index) => (
          <div
            key={asset.id || index}
            className="asset-grid-card"
            onClick={() => onAssetClick?.(asset)}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {asset.thumbnail ? (
                <img
                  src={asset.thumbnail}
                  alt={asset.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="asset-grid-card-placeholder">
                  {getAssetIcon(asset.type)}
                </div>
              )}
              {/* 全屏图标 */}
              <div
                className="asset-card-fullscreen-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssetClick?.(asset);
                }}
              >
                <Maximize2 size={14} />
              </div>
              {/* @引用按钮 */}
              <button
                className="asset-card-reference-btn"
                onClick={(e) => handleReference(e, asset)}
                title="引用到输入框"
              >
                @
              </button>
            </div>
            {asset.name && (
              <div className="asset-grid-card-label">{asset.name}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetGridView;
