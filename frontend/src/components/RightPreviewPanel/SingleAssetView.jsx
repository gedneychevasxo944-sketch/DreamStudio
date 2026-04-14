import { useState, useEffect } from 'react';
import { Maximize2, MessageSquare, Bookmark, Copy, X } from 'lucide-react';
import './RightPreviewPanel.css';

/**
 * SingleAssetView - 单一资产详情视图（用于右侧抽屉）
 */
const SingleAssetView = ({
  asset,
  onContinueConversation,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  if (!asset) {
    return (
      <div className="single-asset-view">
        <div className="asset-preview-image">
          <div className="asset-preview-placeholder">📦</div>
        </div>
      </div>
    );
  }

  const {
    name = '未命名资产',
    type = 'image',
    thumbnail,
    prompt,
    model,
    seed,
    createdAt,
  } = asset;

  // 处理全屏查看 - 本地全屏
  const handleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen(true);
  };

  // 关闭全屏
  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  // ESC 键关闭全屏
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeFullscreen();
    }
  };

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  // 处理@引用
  const handleReference = () => {
    onContinueConversation?.(asset);
  };

  return (
    <div className="single-asset-view">
      {/* 大图预览 */}
      <div
        className="asset-preview-image"
        style={{ cursor: 'pointer' }}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={name} onClick={handleFullscreen} />
        ) : (
          <div className="asset-preview-placeholder">
            {type === 'character' ? '👤' : type === 'scene' ? '🏞️' : '🖼️'}
          </div>
        )}
        {/* 全屏按钮 - hover显示 */}
        <button
          className="asset-fullscreen-btn"
          onClick={handleFullscreen}
          title="全屏查看"
        >
          <Maximize2 size={14} />
        </button>
        {/* @引用按钮 - hover显示 */}
        <button
          className="asset-reference-btn"
          onClick={handleReference}
          title="引用到输入框"
        >
          @
        </button>
      </div>

      {/* 资产信息 */}
      <div className="asset-info">
        <h3 className="asset-name">{name}</h3>
        <div className="asset-meta">
          {type && (
            <div className="asset-meta-item">
              <span className="asset-meta-label">类型</span>
              <span className="asset-meta-value">
                {type === 'character' ? '角色设计' :
                  type === 'scene' ? '场景图' :
                    type === 'prop' ? '道具' : '图片'}
              </span>
            </div>
          )}
          {model && (
            <div className="asset-meta-item">
              <span className="asset-meta-label">模型</span>
              <span className="asset-meta-value">{model}</span>
            </div>
          )}
          {seed && (
            <div className="asset-meta-item">
              <span className="asset-meta-label">种子</span>
              <span className="asset-meta-value">{seed}</span>
            </div>
          )}
          {createdAt && (
            <div className="asset-meta-item">
              <span className="asset-meta-label">生成于</span>
              <span className="asset-meta-value">{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        {prompt && (
          <div className="asset-meta-item" style={{ marginTop: 8 }}>
            <span className="asset-meta-label">Prompt</span>
            <span className="asset-meta-value" style={{ fontSize: 11 }}>{prompt.substring(0, 50)}...</span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="asset-actions">
        <button
          className="asset-action-btn primary"
          onClick={() => onContinueConversation?.(asset)}
        >
          <MessageSquare size={14} />
          <span>继续调整</span>
        </button>
        <button className="asset-action-btn">
          <Bookmark size={14} />
          <span>保存到资产库</span>
        </button>
        <button className="asset-action-btn">
          <Copy size={14} />
          <span>基于此图生成更多</span>
        </button>
      </div>

      {/* 全屏查看遮罩 */}
      {isFullscreen && (
        <div
          className="asset-fullscreen-overlay"
          onClick={closeFullscreen}
          onKeyDown={handleKeyDown}
        >
          <button
            className="asset-fullscreen-close"
            onClick={closeFullscreen}
          >
            <X size={20} />
          </button>
          {thumbnail && (
            <img
              src={thumbnail}
              alt={name}
              className="asset-fullscreen-image"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SingleAssetView;
