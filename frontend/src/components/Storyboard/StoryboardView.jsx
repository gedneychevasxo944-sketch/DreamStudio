import { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Palette, Download, FileText } from 'lucide-react';
import ShotCard from './ShotCard';
import ShotPreview from './ShotPreview';
import { DrillPanel, PromptDiffPanel, AssetChangeCard } from '../DrillPanel';
import { mockShots, mockModifications, getLatestModification } from '../../mock/mockData';
import './Storyboard.css';

/**
 * StoryboardView - 故事板层视图
 *
 * 功能：
 * - 虚拟滚动支持 100+ 镜头
 * - 选中镜头显示预览
 * - 修改标记点击弹出钻取面板
 * - 拖拽资产到镜头
 */
const StoryboardView = ({
  onConversationAdjust,
  onDrillDown,
  selectedShotId,
  onShotSelect,
}) => {
  const [shots] = useState(mockShots);
  const [drillPanelOpen, setDrillPanelOpen] = useState(false);
  const [drillPanelType, setDrillPanelType] = useState('text');
  const listRef = useRef(null);

  // 虚拟滚动配置
  const itemHeight = 180; // 每个 ShotCard 的高度（包含间距）
  const itemWidth = 180; // 每个 ShotCard 的宽度
  const bufferSize = 3; // 上下缓冲的 item 数量

  // 计算可见范围
  const getVisibleRange = useCallback((scrollTop, containerHeight, totalItems) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * bufferSize;
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount);
    return { startIndex, endIndex };
  }, []);

  // 虚拟滚动状态
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 600; // 估算值，实际由 CSS 决定

  const visibleRange = useMemo(() => {
    return getVisibleRange(scrollTop, containerHeight, shots.length);
  }, [scrollTop, containerHeight, shots.length, getVisibleRange]);

  const visibleShots = useMemo(() => {
    return shots.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [shots, visibleRange]);

  const totalHeight = shots.length * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  const selectedShot = useMemo(() => {
    return shots.find((s) => s.id === selectedShotId) || null;
  }, [shots, selectedShotId]);

  const handleShotClick = (shot) => {
    onShotSelect?.(shot.id);
  };

  const handleDrillDown = (type = 'text') => {
    setDrillPanelType(type);
    setDrillPanelOpen(true);
  };

  // 获取当前镜头的最新修改记录
  const currentModification = useMemo(() => {
    if (!selectedShot) return null;
    return getLatestModification(selectedShot.id);
  }, [selectedShot]);

  // 获取钻取面板标题
  const getDrillPanelTitle = () => {
    if (!selectedShot) return '';
    switch (drillPanelType) {
      case 'text':
        return `${selectedShot.name} · 背景描述`;
      case 'asset':
        return `${selectedShot.name} · 角色替换`;
      case 'parameter':
        return `场景美术Agent · 模型切换`;
      default:
        return `${selectedShot.name} · 修改详情`;
    }
  };

  // 渲染钻取面板内容
  const renderDrillPanelContent = () => {
    if (!currentModification) return null;
    switch (drillPanelType) {
      case 'text':
        return <PromptDiffPanel modification={currentModification} />;
      case 'asset':
        return <AssetChangeCard modification={currentModification} />;
      default:
        return <PromptDiffPanel modification={currentModification} />;
    }
  };

  return (
    <div className="storyboard-view">
      {/* 顶部栏 */}
      <div className="storyboard-header">
        <div className="script-section">
          <FileText size={14} />
          <span className="script-label">剧本段落：</span>
          <span className="script-text">"红发女黑客潜入数据中心..."</span>
          <button className="edit-script-btn">编辑剧本</button>
        </div>
        <div className="storyboard-stats">
          共 {shots.length} 个镜头
        </div>
      </div>

      {/* 主内容区 */}
      <div className="storyboard-content">
        {/* 左侧：镜头列表 - 使用虚拟滚动 */}
        <div className="shots-panel">
          <div className="shots-toolbar">
            <button className="toolbar-btn">
              <Plus size={14} />
              添加镜头
            </button>
            <button className="toolbar-btn">
              <Palette size={14} />
              批量替换风格
            </button>
            <button className="toolbar-btn">
              <Download size={14} />
              导出故事板
            </button>
          </div>

          {/* 虚拟滚动列表 */}
          <div
            className="shots-list"
            ref={listRef}
            onScroll={handleScroll}
          >
            {/* 占位元素，维持总高度 */}
            <div className="shots-list-spacer" style={{ height: totalHeight }}>
              {/* 可见区域的内容 */}
              <div
                className="shots-list-visible"
                style={{
                  transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
                }}
              >
                {visibleShots.map((shot) => (
                  <ShotCard
                    key={shot.id}
                    shot={shot}
                    isSelected={shot.id === selectedShotId}
                    onClick={() => handleShotClick(shot)}
                    onDrillDown={() => {
                      onShotSelect?.(shot.id);
                      handleDrillDown('text');
                    }}
                    onDropAsset={(asset) => {
                      // 处理资产拖放
                      console.log('Drop asset on shot:', shot.id, asset);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：预览面板 */}
        <div className="preview-panel">
          <ShotPreview
            shot={selectedShot}
            onDrillDown={handleDrillDown}
            onConversationAdjust={() => {
              onConversationAdjust?.(selectedShot);
            }}
            onGenerateVideo={() => {
              console.log('Generate video for shot:', selectedShot?.id);
            }}
          />
        </div>
      </div>

      {/* 钻取面板 */}
      <DrillPanel
        isOpen={drillPanelOpen}
        onClose={() => setDrillPanelOpen(false)}
        title={getDrillPanelTitle()}
        position="right"
        width={420}
      >
        {renderDrillPanelContent()}
      </DrillPanel>
    </div>
  );
};

export default StoryboardView;
