import { useCallback } from 'react';
import { motion } from 'framer-motion';
import StageNavigation from './StageNavigation';
import AssetGrid from './AssetGrid';
import AssetDetailPanel from './AssetDetailPanel';
import { useStageStore, STAGES } from '../../stores/stageStore';
import './StoryboardMainView.css';

/**
 * StoryboardMainView - 故事板主视图
 *
 * PRD 2.0 的核心组件，整合阶段导航、资产网格、详情面板
 */
const StoryboardMainView = () => {
  const {
    currentStage,
    stageAssets,
    selectedAssetId,
    setCurrentStage,
    setStageAssets,
    selectAsset,
    addStageAsset,
    updateStageAsset,
    deleteStageAsset,
    getSelectedAsset,
  } = useStageStore();

  // 获取当前阶段的资产
  const currentAssets = stageAssets[currentStage] || [];
  const selectedAsset = getSelectedAsset();

  // 处理资产选择
  const handleSelectAsset = useCallback((asset) => {
    selectAsset(asset.id);
  }, [selectAsset]);

  // 处理添加新资产
  const handleAddNew = useCallback(() => {
    const newAsset = {
      id: `${currentStage}-${Date.now()}`,
      type: currentStage,
      name: `新${currentStage === STAGES.STORYBOARD ? '镜头' : '资产'}`,
      description: '',
      prompt: '',
      thumbnail: null,
    };
    addStageAsset(currentStage, newAsset);
    selectAsset(newAsset.id);
  }, [currentStage, addStageAsset, selectAsset]);

  // 处理资产更新
  const handleUpdateAsset = useCallback((assetId, updates) => {
    updateStageAsset(currentStage, assetId, updates);
  }, [currentStage, updateStageAsset]);

  // 处理资产删除
  const handleDeleteAsset = useCallback((assetId) => {
    if (window.confirm('确定要删除这个资产吗？')) {
      deleteStageAsset(currentStage, assetId);
    }
  }, [currentStage, deleteStageAsset]);

  // 处理生成（图片/视频）
  const handleGenerate = useCallback((assetId, type = 'image') => {
    console.log(`生成 ${type} for asset ${assetId}`);
    // TODO: 调用 AI 生成接口
    updateStageAsset(currentStage, assetId, {
      status: 'running',
      thumbnail: type === 'video' ? null : `https://picsum.photos/seed/${assetId}/400/225`,
      videoUrl: type === 'video' ? `https://example.com/video/${assetId}.mp4` : null,
    });
    // 模拟生成完成
    setTimeout(() => {
      updateStageAsset(currentStage, assetId, {
        status: 'synced',
      });
    }, 2000);
  }, [currentStage, updateStageAsset]);

  // 右键菜单
  const handleContextMenu = useCallback((e, asset) => {
    e.preventDefault();
    // TODO: 实现右键菜单
    console.log('Context menu for:', asset);
  }, []);

  // 剧本阶段特殊处理
  if (currentStage === STAGES.SCRIPT) {
    return (
      <div className="storyboard-main">
        <StageNavigation />
        <div className="storyboard-content script-content">
          <AssetDetailPanel
            asset={currentAssets[0] || {
              id: 'script-main',
              type: STAGES.SCRIPT,
              name: '剧本',
              content: '在此输入剧本内容...',
            }}
            onUpdate={handleUpdateAsset}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="storyboard-main">
      <StageNavigation />

      <div className="storyboard-content">
        {/* 左侧：资产网格 */}
        <aside className="assets-panel">
          <AssetGrid
            assets={currentAssets}
            stage={currentStage}
            selectedId={selectedAssetId}
            onSelect={handleSelectAsset}
            onContextMenu={handleContextMenu}
            onAddNew={handleAddNew}
          />
        </aside>

        {/* 右侧：详情面板 */}
        <section className="detail-panel">
          <AssetDetailPanel
            asset={selectedAsset}
            onUpdate={handleUpdateAsset}
            onDelete={handleDeleteAsset}
            onGenerate={handleGenerate}
          />
        </section>
      </div>
    </div>
  );
};

export default StoryboardMainView;
