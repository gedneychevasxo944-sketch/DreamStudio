import { AnimatePresence } from 'framer-motion';
import { toast } from '../../Toast/Toast';
import AssetGrid from '../AssetGrid';
import AssetDetailPanel from '../AssetDetailPanel';
import AssetAIDialog from '../AssetAIDialog';

/**
 * AssetStageView - 角色/场景/道具阶段视图
 *
 * 用于 CHARACTER, SCENE, PROP 三个阶段，它们共用相同的布局
 *
 * Props:
 * - stage: 'character' | 'scene' | 'prop'
 * - assets: Asset[]
 * - selectedAsset: Asset | null
 * - aiDialog: { isOpen: boolean, asset: Asset | null, messages: Message[] }
 * - onSelectAsset: (id: string) => void
 * - onUpdateAsset: (id: string, updates: object) => void
 * - onDeleteAsset: (id: string) => void
 * - onGenerate: (id: string) => void
 * - onAIDialog: (asset: Asset) => void
 * - onAIMessagesChange: (messages: Message[]) => void
 * - onCloseAIDialog: () => void
 * - onAddNew: () => void
 * - onUpload: () => void
 */
const AssetStageView = ({
  stage,
  assets,
  selectedAsset,
  aiDialog,
  onSelectAsset,
  onUpdateAsset,
  onDeleteAsset,
  onGenerate,
  onAIDialog,
  onAIMessagesChange,
  onCloseAIDialog,
  onAddNew,
  onUpload,
}) => {
  return (
    <div className="asset-stage-layout">
      {/* 左侧主区域 */}
      <div className="asset-main-area">
        {/* 资产网格 */}
        <aside className="assets-panel">
          <AssetGrid
            assets={assets}
            stage={stage}
            selectedId={selectedAsset?.id}
            onSelect={onSelectAsset}
            onAddNew={onAddNew}
            onUpload={onUpload}
          />
        </aside>

        {/* 详情面板 */}
        <section className="detail-panel">
          {selectedAsset && (
            <AssetDetailPanel
              asset={selectedAsset}
              onUpdate={onUpdateAsset}
              onDelete={onDeleteAsset}
              onGenerate={onGenerate}
              onAIDialog={onAIDialog}
            />
          )}
        </section>
      </div>

      {/* 右侧 AI 对话面板 */}
      <AnimatePresence>
        {aiDialog?.isOpen && (
          <div className="asset-ai-assistant-area">
            <AssetAIDialog
              isOpen={aiDialog.isOpen}
              asset={aiDialog.asset}
              messages={aiDialog.messages}
              onMessagesChange={onAIMessagesChange}
              onClose={onCloseAIDialog}
              onGenerate={(assetId) => {
                onGenerate(assetId);
                onCloseAIDialog();
              }}
              onSave={() => {
                toast?.success?.('Prompt 已保存');
                onCloseAIDialog();
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetStageView;
