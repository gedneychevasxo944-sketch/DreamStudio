import { useState } from 'react';
import { MessageSquare, Settings, Play, ChevronRight, Sparkles } from 'lucide-react';
import './ShotPreview.css';

/**
 * ShotPreview - 镜头预览面板
 *
 * 功能：
 * - 大图预览
 * - 景别/运镜信息
 * - 快捷操作按钮
 */
const ShotPreview = ({ shot, onDrillDown, onConversationAdjust, onGenerateVideo }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!shot) {
    return (
      <div className="shot-preview empty">
        <div className="empty-state">
          <span className="empty-icon">📷</span>
          <p>选择镜头查看预览</p>
        </div>
      </div>
    );
  }

  const hasModification = shot.modifiedFrom !== null;

  return (
    <div className="shot-preview">
      {/* 头部 */}
      <div className="preview-header">
        <div className="header-info">
          <h3 className="shot-title">{shot.name}</h3>
          <span className="shot-description">{shot.description}</span>
        </div>
        {hasModification && (
          <div className="modification-badge" onClick={() => onDrillDown?.('text')}>
            <Sparkles size={12} />
            <span>有修改</span>
          </div>
        )}
      </div>

      {/* 大图预览 */}
      <div className="preview-image-container">
        <img src={shot.thumbnailUrl} alt={shot.name} className="preview-image" />
      </div>

      {/* 镜头信息 */}
      <div className="preview-meta">
        <div className="meta-row">
          <span className="meta-label">景别：</span>
          <span className="meta-value">{shot.prompt?.includes('近景') ? '近景' : shot.prompt?.includes('远景') ? '远景' : '中景'}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">运镜：</span>
          <span className="meta-value">{shot.prompt?.includes('推进') ? '推轨' : shot.prompt?.includes('拉') ? '拉镜' : '固定'}</span>
        </div>
      </div>

      {/* Prompt 预览 */}
      <div className="preview-prompt">
        <div className="prompt-label">Prompt</div>
        <p className="prompt-text">{shot.prompt}</p>
      </div>

      {/* 操作按钮 */}
      <div className="preview-actions">
        <button className="action-btn" onClick={() => onConversationAdjust?.()}>
          <MessageSquare size={14} />
          对话调整
        </button>
        <button className="action-btn" onClick={() => onDrillDown?.('text')}>
          <Settings size={14} />
          编辑参数
        </button>
        <button className="action-btn primary" onClick={() => onGenerateVideo?.()}>
          <Play size={14} />
          生成视频
        </button>
      </div>
    </div>
  );
};

export default ShotPreview;
