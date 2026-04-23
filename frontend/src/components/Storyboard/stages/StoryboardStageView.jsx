import AssetGrid from '../AssetGrid';
import AssetDetailPanel from '../AssetDetailPanel';

/**
 * StoryboardStageView - 分镜阶段视图
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
 */
const StoryboardStageView = ({
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
  saveStatus,
}) => {
  return (
    <div className="storyboard-content storyboard-stage-content">
      <div className="storyboard-split-view">
        {/* 左侧：资产网格 */}
        <aside className="assets-panel">
          <AssetGrid
            assets={assets}
            stage="storyboard"
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

export default StoryboardStageView;
