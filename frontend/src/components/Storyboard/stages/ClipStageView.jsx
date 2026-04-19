import { Play, Pause, Scissors, Film, Trash2 } from 'lucide-react';
import { formatTime } from '../utils/timeUtils';

/**
 * ClipStageView - 剪辑阶段视图
 *
 * Props:
 * - clipAssets: ClipAsset[]
 * - selectedClipId: string | null
 * - clipCurrentTime: number
 * - clipIsPlaying: boolean
 * - clipZoom: number
 * - videoRef: RefObject
 * - currentClipIndex: number
 * - onClipSelect: (id: string) => void
 * - onClipDoubleClick: (e: MouseEvent, clip: ClipAsset) => void
 * - onTogglePlay: () => void
 * - onTimeUpdate: () => void
 * - onSplitAtPlayhead: () => void
 * - onDeleteClip: (id: string) => void
 * - onDragStart: (e: MouseEvent, id: string) => void
 * - onDragEnd: () => void
 * - onDrop: (e: MouseEvent, index: number) => void
 * - onTrimDrag: (e: MouseEvent, clipId: string, edge: 'left' | 'right') => void
 * - onZoomIn: () => void
 * - onZoomOut: () => void
 * - onSeek: (time: number) => void
 */
const ClipStageView = ({
  clipAssets,
  selectedClipId,
  clipCurrentTime,
  clipIsPlaying,
  clipZoom,
  videoRef,
  currentClipIndex,
  onClipSelect,
  onClipDoubleClick,
  onTogglePlay,
  onTimeUpdate,
  onSplitAtPlayhead,
  onDeleteClip,
  onDragStart,
  onDragEnd,
  onDrop,
  onTrimDrag,
  onZoomIn,
  onZoomOut,
}) => {
  // 计算总时长
  const totalDuration = clipAssets.reduce((sum, clip) => sum + (clip.endTime - clip.startTime), 0);
  const playheadPosition = totalDuration > 0 ? (clipCurrentTime / totalDuration) * 100 : 0;
  const zoomedDuration = totalDuration * clipZoom;
  const timelineScale = zoomedDuration > 0 ? (800 / zoomedDuration) : 0;

  return (
    <div className="storyboard-content storyboard-stage-content">
      <div className="clip-stage-layout">
        {/* 顶部工具栏 */}
        <div className="clip-toolbar">
          <div className="clip-toolbar-left">
            <span className="clip-title">视频剪辑</span>
          </div>
          <div className="clip-toolbar-center">
            <button className="clip-tool-btn" onClick={onTogglePlay} title={clipIsPlaying ? '暂停' : '播放'}>
              {clipIsPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className="clip-tool-btn" onClick={onSplitAtPlayhead} title="切割">
              <Scissors size={18} />
            </button>
            <div className="clip-time-display">
              {formatTime(clipCurrentTime)} / {formatTime(totalDuration)}
            </div>
          </div>
          <div className="clip-toolbar-right">
            <button className="clip-tool-btn" onClick={onZoomOut} title="缩小">
              -
            </button>
            <span className="clip-zoom-label">{Math.round(clipZoom * 100)}%</span>
            <button className="clip-tool-btn" onClick={onZoomIn} title="放大">
              +
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="clip-content-area">
          {/* 视频预览区 */}
          <div className="clip-preview-area">
            <div className="clip-video-wrapper">
              <video
                ref={videoRef}
                src={clipAssets[currentClipIndex]?.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                onTimeUpdate={onTimeUpdate}
                onEnded={() => {}}
                onClick={onTogglePlay}
              />
              {/* 播放头指示器 */}
              <div
                className="clip-playhead-indicator"
                style={{ left: `${playheadPosition}%` }}
              />
            </div>
          </div>

          {/* 底部区域 */}
          <div className="clip-bottom-area">
            {/* 时间线 */}
            <div className="clip-timeline-area">
              {/* 时间刻度 */}
              <div className="clip-timeline-scale">
                {Array.from({ length: Math.ceil(zoomedDuration) + 1 }, (_, i) => (
                  <div key={i} className="clip-time-mark" style={{ left: `${i * timelineScale}px` }}>
                    <span className="clip-time-label">{formatTime(i)}</span>
                  </div>
                ))}
              </div>

              {/* 播放头 */}
              <div
                className="clip-timeline-playhead"
                style={{ left: `${clipCurrentTime * timelineScale}px` }}
              />

              {/* 片段轨道 */}
              <div className="clip-timeline-track">
                {clipAssets.map((clip, index) => {
                  const clipDuration = clip.endTime - clip.startTime;
                  const clipWidth = clipDuration * timelineScale;
                  let offset = 0;
                  for (let i = 0; i < index; i++) {
                    offset += (clipAssets[i].endTime - clipAssets[i].startTime) * timelineScale;
                  }
                  return (
                    <div
                      key={clip.id}
                      className={`clip-timeline-clip ${selectedClipId === clip.id ? 'selected' : ''}`}
                      style={{ left: `${offset}px`, width: `${clipWidth}px` }}
                      draggable
                      onDragStart={(e) => onDragStart(e, clip.id)}
                      onDragEnd={onDragEnd}
                      onDrop={(e) => onDrop(e, index)}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => onClipSelect(clip.id)}
                      onDoubleClick={(e) => onClipDoubleClick(e, clip)}
                    >
                      {/* 左侧裁剪手柄 */}
                      <div
                        className="clip-trim-handle clip-trim-left"
                        onMouseDown={(e) => onTrimDrag(e, clip.id, 'left')}
                      />
                      {/* 片段内容 */}
                      <div className="clip-timeline-clip-content">
                        <span className="clip-timeline-clip-name">{clip.name}</span>
                      </div>
                      {/* 右侧裁剪手柄 */}
                      <div
                        className="clip-trim-handle clip-trim-right"
                        onMouseDown={(e) => onTrimDrag(e, clip.id, 'right')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 片段资产面板 */}
            <div className="clip-assets-panel">
              <div className="clip-assets-header">
                <span>片段列表 ({clipAssets.length})</span>
              </div>
              <div className="clip-assets-list">
                {clipAssets.map((clip) => (
                  <div
                    key={clip.id}
                    className={`clip-asset-item ${selectedClipId === clip.id ? 'selected' : ''}`}
                    onClick={() => onClipSelect(clip.id)}
                    draggable
                    onDragStart={(e) => onDragStart(e, clip.id)}
                    onDragEnd={onDragEnd}
                    onDrop={(e) => onDrop(e, clipAssets.indexOf(clip))}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="clip-asset-thumb">
                      {clip.thumbnail ? (
                        <img src={clip.thumbnail} alt={clip.name} />
                      ) : (
                        <Film size={24} />
                      )}
                    </div>
                    <div className="clip-asset-info">
                      <span className="clip-asset-name">{clip.name}</span>
                      <span className="clip-asset-duration">{formatTime(clip.endTime - clip.startTime)}</span>
                    </div>
                    <button
                      className="clip-asset-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClip(clip.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipStageView;
