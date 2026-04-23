import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, Grid, List, FileText, Film } from 'lucide-react';
import SingleAssetView from './SingleAssetView';
import AssetGridView from './AssetGridView';
import ScriptEditorView from './ScriptEditorView';
import SequenceModeView from './SequenceModeView';
import './RightPreviewPanel.css';

/**
 * RightPreviewPanel - 对话层右侧自适应预览面板
 *
 * 核心功能：
 * - 自动检测项目内容类型，切换资产模式/序列模式
 * - 资产模式：单资产详情 / 多资产网格 / 剧本编辑器
 * - 序列模式：故事板微缩版（场景横向滚动 + 镜头序列）
 */

// 模式类型
export const PREVIEW_MODE = {
  SINGLE_ASSET: 'single_asset',     // 单一资产
  ASSET_GRID: 'asset_grid',          // 多资产网格
  SCRIPT_EDITOR: 'script_editor',   // 剧本编辑器
  SEQUENCE: 'sequence',              // 序列模式（故事板）
};

// 资产类型
export const ASSET_TYPE = {
  CHARACTER: 'character',
  SCENE: 'scene',
  PROP: 'prop',
  IMAGE: 'image',
  VIDEO: 'video',
  SCRIPT: 'script',
};

/**
 * 根据项目内容判断预览模式
 */
const detectPreviewMode = (assets, hasScript, hasSequence) => {
  // 优先判断是否有序列（有顺序的镜头）
  if (hasSequence && assets.length > 0) {
    return PREVIEW_MODE.SEQUENCE;
  }

  // 判断是否是纯文本剧本（无视觉资产，或只有剧本资产）
  const hasOnlyScript = assets.length === 0 ||
    (assets.length === 1 && assets[0]?.type === 'script');
  if (hasScript && hasOnlyScript) {
    return PREVIEW_MODE.SCRIPT_EDITOR;
  }

  // 单一资产
  if (assets.length === 1) {
    return PREVIEW_MODE.SINGLE_ASSET;
  }

  // 多个资产（无序列）
  if (assets.length > 1) {
    return PREVIEW_MODE.ASSET_GRID;
  }

  // 默认：空状态
  return null;
};

const RightPreviewPanel = ({
  assets = [],
  script = null,
  shots = [],
  characters = [],  // P5: 角色列表
  previewingAsset = null,  // P5: 当前预览的资产
  scenario = null,  // P5: 外部指定的场景模式
  onAssetClick,
  onShotClick,
  onSwitchToSequenceMode,
  onSwitchToAssetMode,
  onGenerateStoryboard,
  onDragStart,
  onClose,
  height = '100%',
}) => {
  // 内部状态
  const [localAssets, setLocalAssets] = useState(assets);

  // 监听外部assets变化
  useMemo(() => {
    setLocalAssets(assets);
  }, [assets]);

  // P5: 如果有previewingAsset，强制显示单资产视图
  const displayAsset = previewingAsset || (localAssets.length === 1 ? localAssets[0] : null);

  // 检测预览模式 - 优先使用外部scenario，内部状态用于切换
  const [internalMode, setInternalMode] = useState(PREVIEW_MODE.SINGLE_ASSET);
  const previewMode = scenario || internalMode;

  const switchMode = (mode) => {
    setInternalMode(mode);
  };

  // 检测预览模式
  const detectedMode = useMemo(() => {
    // P5: 如果有previewingAsset，直接显示单资产
    if (displayAsset) {
      return PREVIEW_MODE.SINGLE_ASSET;
    }
    // P5: 如果有外部scenario，使用外部scenario
    if (scenario) {
      return scenario;
    }
    return detectPreviewMode(localAssets, !!script, shots.length > 0);
  }, [displayAsset, scenario, localAssets, script, shots.length]);

  // 选中的场景索引（序列模式）
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);

  // 处理资产点击
  const handleAssetClick = (asset) => {
    onAssetClick?.(asset);
  };

  // 处理场景选择（序列模式）
  const handleSceneSelect = (index) => {
    setSelectedSceneIndex(index);
  };

  // 切换到序列模式
  const handleSwitchToSequence = () => {
    switchMode(PREVIEW_MODE.SEQUENCE);
    onSwitchToSequenceMode?.();
  };

  // 切换到资产模式
  const handleSwitchToAsset = () => {
    switchMode(PREVIEW_MODE.ASSET_GRID);
    onSwitchToAssetMode?.();
  };

  // 空状态
  if (!detectedMode) {
    return (
      <div className="right-preview-panel empty" style={{ height }}>
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p className="empty-title">暂无预览内容</p>
          <p className="empty-desc">在左侧对话中生成内容后，这里将显示预览</p>
        </div>
      </div>
    );
  }

  // 渲染内容
  const renderContent = () => {
    switch (previewMode) {
      case PREVIEW_MODE.SINGLE_ASSET:
        return (
          <SingleAssetView
            asset={displayAsset}
            onDragStart={onDragStart}
          />
        );

      case PREVIEW_MODE.ASSET_GRID:
        return (
          <AssetGridView
            assets={localAssets}
            onAssetClick={handleAssetClick}
            onSwitchToSequence={handleSwitchToSequence}
            onDragStart={onDragStart}
          />
        );

      case PREVIEW_MODE.SCRIPT_EDITOR:
        return (
          <ScriptEditorView
            script={script}
            onGenerateStoryboard={onGenerateStoryboard}
          />
        );

      case PREVIEW_MODE.SEQUENCE:
        return (
          <SequenceModeView
            shots={shots}
            characters={characters}
            script={script}
            selectedIndex={selectedSceneIndex}
            onSceneSelect={handleSceneSelect}
            onShotClick={onShotClick}
            onSwitchToAsset={handleSwitchToAsset}
          />
        );

      default:
        return null;
    }
  };

  // 获取模式标签
  const getModeLabel = () => {
    switch (previewMode) {
      case PREVIEW_MODE.SINGLE_ASSET:
        return '当前资产';
      case PREVIEW_MODE.ASSET_GRID:
        return '资产库视图';
      case PREVIEW_MODE.SCRIPT_EDITOR:
        return '剧本编辑器';
      case PREVIEW_MODE.SEQUENCE:
        return '故事板预览';
      default:
        return '预览';
    }
  };

  return (
    <div className="right-preview-panel" style={{ height }}>
      {/* 标题栏 */}
      <div className="preview-header">
        <span className="preview-title">{getModeLabel()}</span>
        <div className="preview-actions">
          {/* 模式切换按钮 */}
          {previewMode === PREVIEW_MODE.ASSET_GRID && shots.length > 0 && (
            <button
              className="preview-action-btn"
              onClick={handleSwitchToSequence}
              title="切换到序列模式"
            >
              <Film size={14} />
              <span>序列模式</span>
            </button>
          )}
          {previewMode === PREVIEW_MODE.SEQUENCE && (
            <button
              className="preview-action-btn"
              onClick={handleSwitchToAsset}
              title="切换到资产视图"
            >
              <Grid size={14} />
              <span>资产视图</span>
            </button>
          )}
        </div>
      </div>

      {/* 内容区 */}
      <div className="preview-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={previewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="preview-content-inner"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RightPreviewPanel;
