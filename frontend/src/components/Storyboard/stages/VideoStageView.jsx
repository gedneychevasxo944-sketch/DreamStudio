import { motion } from 'framer-motion';
import AssetGrid from '../AssetGrid';
import AssetDetailPanel from '../AssetDetailPanel';

/**
 * VideoStageView - 视频阶段视图
 *
 * Props:
 * - assets: Asset[]
 * - selectedAsset: Asset | null
 * - selectedAssetId: string | null
 * - onSelectAsset: (id: string) => void
 * - onContextMenu: (e: MouseEvent, asset: Asset) => void
 * - onUpdateAsset: (id: string, updates: object) => void
 * - onDeleteAsset: (id: string) => void
 * - onGenerate: (id: string) => void
 * - onAIDialog: (asset: Asset) => void
 * - onAddNew: () => void
 * - onUpload: () => void
 * - onBatchGenerate: () => void
 * - onExportVideos: () => void
 */
const VideoStageView = ({
  assets,
  selectedAsset,
  selectedAssetId,
  onSelectAsset,
  onContextMenu,
  onUpdateAsset,
  onDeleteAsset,
  onGenerate,
  onAIDialog,
  onAddNew,
  onUpload,
  onBatchGenerate,
  onExportVideos,
  saveStatus,
}) => {
  return (
    <div className="storyboard-content storyboard-stage-content">
      {/* 导出按钮 */}
      <div className="stage-action-bar">
        <motion.button
          className="export-btn"
          onClick={onExportVideos}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          导出所有视频
        </motion.button>
      </div>

      <div className="storyboard-split-view">
        {/* 左侧：资产网格 */}
        <aside className="assets-panel">
          <AssetGrid
            assets={assets}
            stage="video"
            selectedId={selectedAssetId}
            onSelect={onSelectAsset}
            onContextMenu={onContextMenu}
            onAddNew={onAddNew}
            onUpload={onUpload}
            onBatchGenerate={onBatchGenerate}
          />
        </aside>

        {/* 右侧：详情面板 - 仅当选中资产时渲染 */}
        {selectedAsset && (
          <section className="detail-panel">
            <AssetDetailPanel
              asset={selectedAsset}
              onUpdate={onUpdateAsset}
              onDelete={onDeleteAsset}
              onGenerate={onGenerate}
              onAIDialog={onAIDialog}
              saveStatus={saveStatus}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default VideoStageView;
