import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import AssetCard from './AssetCard';
import { useStageStore, STAGE_CONFIG } from '../../stores/stageStore';
import './AssetGrid.css';

/**
 * AssetGrid - 资产卡片网格组件
 *
 * Props:
 * - assets: Asset[] - 资产列表
 * - stage: STAGE - 当前阶段
 * - selectedId: string | null - 选中的资产ID
 * - onSelect: (asset) => void - 选择回调
 * - onContextMenu: (e, asset) => void - 右键菜单回调
 * - onAddNew: () => void - 添加新资产回调
 */
const AssetGrid = ({
  assets = [],
  stage,
  selectedId,
  onSelect,
  onContextMenu,
  onAddNew,
}) => {
  const config = STAGE_CONFIG[stage];

  // 处理资产选择
  const handleAssetClick = useCallback((asset) => {
    onSelect?.(asset);
  }, [onSelect]);

  // 处理右键菜单
  const handleContextMenu = useCallback((e, asset) => {
    onContextMenu?.(e, asset);
  }, [onContextMenu]);

  // 空状态
  const renderEmptyState = () => (
    <div className="asset-grid-empty">
      <div className="empty-icon">
        {config?.icon || '📦'}
      </div>
      <h3 className="empty-title">
        {config?.label || '暂无资产'}
      </h3>
      <p className="empty-description">
        点击下方按钮创建第一个{config?.label || '资产'}
      </p>
      <button className="empty-add-btn" onClick={onAddNew}>
        <Plus size={16} />
        <span>创建{config?.label || '资产'}</span>
      </button>
    </div>
  );

  // 资产列表
  const renderAssetList = () => (
    <div className="asset-grid-container">
      {/* 添加新资产按钮 */}
      <button className="asset-card add-card" onClick={onAddNew}>
        <div className="add-card-content">
          <div className="add-icon">
            <Plus size={24} />
          </div>
          <span className="add-label">创建{config?.label || '资产'}</span>
        </div>
      </button>

      {/* 资产卡片 */}
      {assets.map((asset, index) => (
        <motion.div
          key={asset.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03, duration: 0.2 }}
        >
          <AssetCard
            asset={asset}
            isSelected={asset.id === selectedId}
            onClick={() => handleAssetClick(asset)}
            onContextMenu={handleContextMenu}
          />
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="asset-grid">
      {/* 头部工具栏 */}
      <div className="asset-grid-header">
        <div className="header-info">
          <span className="asset-count">
            {assets.length} 个{config?.label || '资产'}
          </span>
        </div>
        <button className="header-action-btn">
          <Sparkles size={14} />
          <span>AI 批量生成</span>
        </button>
      </div>

      {/* 网格内容 */}
      <div className="asset-grid-content">
        {assets.length === 0 ? renderEmptyState() : renderAssetList()}
      </div>
    </div>
  );
};

export default AssetGrid;
