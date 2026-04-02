import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, CheckCircle, Clock, AlertCircle, Eye, FileText, Image, Video, Music, Layers, Shield, Download, ChevronDown } from 'lucide-react';
import ExportAssets from './ExportAssets';
import './Gallery.css';

const assets = [
  {
    id: 1,
    type: 'project',
    name: '项目立项书',
    archiveNumber: '档案一',
    icon: FileText,
    status: 'approved',
    description: '一句话梗概与视觉参考描述',
    versions: [
      { id: 'v1', name: '立项书 v1.0', status: 'approved', date: '2024-03-15', thumbnail: null },
      { id: 'v2', name: '立项书 v2.0', status: 'approved', date: '2024-03-18', thumbnail: null }
    ]
  },
  {
    id: 2,
    type: 'script',
    name: '分场剧本',
    archiveNumber: '档案二',
    icon: Layers,
    status: 'approved',
    description: '视觉氛围与音频提示',
    versions: [
      { id: 'v1', name: '分场剧本 v1.0', status: 'approved', date: '2024-03-16', thumbnail: null },
      { id: 'v2', name: '分场剧本 v2.0', status: 'approved', date: '2024-03-17', thumbnail: null }
    ]
  },
  {
    id: 3,
    type: 'concept',
    name: '文生图静态资产',
    archiveNumber: '档案三',
    icon: Image,
    status: 'approved',
    description: '角色正面纯白底图、场景定格全景图',
    versions: [
      { id: 'v1', name: '角色设定集', status: 'approved', date: '2024-03-16', thumbnail: 'https://picsum.photos/seed/concept1/400/300' },
      { id: 'v2', name: '场景全景图', status: 'approved', date: '2024-03-17', thumbnail: 'https://picsum.photos/seed/concept2/400/300' },
      { id: 'v3', name: '色彩氛围版', status: 'approved', date: '2024-03-19', thumbnail: 'https://picsum.photos/seed/concept3/400/300' }
    ]
  },
  {
    id: 4,
    type: 'storyboard',
    name: 'AI分镜执行总表',
    archiveNumber: '档案四',
    icon: Video,
    status: 'pending',
    description: '起始画面、动态演进与时长表格',
    versions: [
      { id: 'v1', name: '分镜表 v1.0', status: 'pending', date: '2024-03-21', thumbnail: 'https://picsum.photos/seed/story1/400/300' },
      { id: 'v2', name: '分镜表 v2.0', status: 'approved', date: '2024-03-22', thumbnail: 'https://picsum.photos/seed/story2/400/300' }
    ]
  }
];

const tracks = [
  { id: 'visual', name: '视听轨', color: 'var(--accent-blue)', icon: Music },
  { id: 'physics', name: '物理轨', color: 'var(--accent-green)', icon: Layers },
  { id: 'consistency', name: '一致性轨', color: 'var(--accent-silver)', icon: Shield }
];

const trackSegments = [
  { track: 'visual', start: 0, end: 2, status: 'ok', duration: 2 },
  { track: 'visual', start: 2, end: 4.5, status: 'ok', duration: 2.5 },
  { track: 'visual', start: 4.5, end: 6, status: 'over', duration: 1.5 },
  { track: 'visual', start: 6, end: 8, status: 'ok', duration: 2 },
  { track: 'physics', start: 0, end: 2, status: 'ok', duration: 2 },
  { track: 'physics', start: 2, end: 4, status: 'ok', duration: 2 },
  { track: 'physics', start: 4, end: 6, status: 'ok', duration: 2 },
  { track: 'physics', start: 6, end: 8, status: 'mismatch', duration: 2 },
  { track: 'consistency', start: 0, end: 8, status: 'ok', duration: 8 }
];

const SupremeAuditor = ({ onPlay }) => {
  return (
    <div className="supreme-auditor">
      <div className="auditor-header">
        <div className="auditor-avatar">
          <Eye size={20} />
        </div>
        <div className="auditor-info">
          <span className="auditor-title">终审 Agent</span>
          <span className="auditor-name">The Supreme Auditor</span>
        </div>
        <div className="auditor-status">
          <span className="status-dot" />
          <span>全局观察中</span>
        </div>
      </div>
      <div className="auditor-metrics">
        <div className="auditor-metric">
          <span className="metric-value">24</span>
          <span className="metric-label">已审核项目</span>
        </div>
        <div className="auditor-metric">
          <span className="metric-value">98.5%</span>
          <span className="metric-label">通过率</span>
        </div>
        <div className="auditor-metric">
          <span className="metric-value">3</span>
          <span className="metric-label">待终审</span>
        </div>
      </div>
    </div>
  );
};

const ReviewPlayer = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showVerified, setShowVerified] = useState(false);
  const progressRef = useRef(null);

  const duration = 8;

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            setShowVerified(true);
            return duration;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const progress = (currentTime / duration) * 100;

  const getSegmentStatus = (track, time) => {
    const segment = trackSegments.find(
      s => s.track === track && time >= s.start && time < s.end
    );
    return segment?.status || 'ok';
  };

  return (
    <div className="review-player">
      <div className="player-header">
        <span className="player-title">终审播放器</span>
        <div className="player-controls">
          <button className="control-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className="time-display">
            {currentTime.toFixed(1)}s / {duration}s
          </span>
        </div>
      </div>

      <div className="player-viewport">
        <div className="viewport-placeholder">
          <Video size={48} />
          <span>视频预览区域</span>
        </div>

        {showVerified && (
          <motion.div
            className="verified-watermark"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle size={24} />
            <span>已核验</span>
          </motion.div>
        )}
      </div>

      <div className="player-progress">
        <div className="progress-track" ref={progressRef}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-head" style={{ left: `${progress}%` }} />
        </div>
      </div>

      <div className="player-tracks">
        {tracks.map(track => {
          const status = getSegmentStatus(track.id, currentTime);
          return (
            <div key={track.id} className="track-row">
              <div className="track-label">
                <track.icon size={12} style={{ color: track.color }} />
                <span>{track.name}</span>
              </div>
              <div className="track-segments">
                {trackSegments
                  .filter(s => s.track === track.id)
                  .map((seg, idx) => {
                    const width = ((seg.end - seg.start) / duration) * 100;
                    const left = (seg.start / duration) * 100;
                    return (
                      <div
                        key={idx}
                        className={`track-segment ${seg.status}`}
                        style={{ width: `${width}%`, left: `${left}%` }}
                      />
                    );
                  })}
                <div
                  className="track-cursor"
                  style={{ left: `${progress}%` }}
                />
              </div>
              <div className={`track-status ${status}`}>
                {status === 'ok' && <CheckCircle size={12} />}
                {status === 'over' && <AlertCircle size={12} />}
                {status === 'mismatch' && <AlertCircle size={12} />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="player-actions">
        <button className="action-btn secondary">
          <span>取消</span>
        </button>
        <button className={`action-btn primary ${showVerified ? 'ready' : ''}`}>
          <Download size={14} />
          <span>导出 / 渲染</span>
        </button>
      </div>
    </div>
  );
};

const ArchiveCard = ({ asset, onSelect }) => {
  // 默认展示最新版本（数组最后一个）
  const [currentVersion, setCurrentVersion] = useState(asset.versions.length - 1);
  const [isHovered, setIsHovered] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const version = asset.versions[currentVersion];
  const IconComponent = asset.icon;

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowVersionDropdown(false);
      }
    };

    if (showVersionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVersionDropdown]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={14} className="status-icon approved" />;
      case 'pending':
        return <Clock size={14} className="status-icon pending" />;
      case 'rejected':
        return <AlertCircle size={14} className="status-icon rejected" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="archive-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(asset)}
      whileHover={{ y: -2 }}
    >
      <div className="archive-header">
        <div className="archive-type">
          <IconComponent size={12} />
          <span>{asset.name}</span>
        </div>
      </div>

      <div className="archive-preview">
        {version.thumbnail ? (
          <img src={version.thumbnail} alt={version.name} />
        ) : (
          <div className="preview-placeholder">
            <IconComponent size={28} />
          </div>
        )}
        <div className="preview-overlay">
          <Eye size={18} />
          <span>预览</span>
        </div>
      </div>

      <div className="archive-info">
        <p className="archive-description">{asset.description}</p>
        <div className="version-selector" ref={dropdownRef}>
          <div 
            className="version-dropdown-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setShowVersionDropdown(!showVersionDropdown);
            }}
          >
            <span className="current-version">{version.id.toUpperCase()}</span>
            <ChevronDown size={14} className={`dropdown-arrow ${showVersionDropdown ? 'open' : ''}`} />
          </div>
          
          {showVersionDropdown && (
            <div className="version-dropdown-menu">
              {asset.versions.map((v, idx) => (
                <div
                  key={v.id}
                  className={`version-dropdown-item ${idx === currentVersion ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentVersion(idx);
                    setShowVersionDropdown(false);
                  }}
                >
                  <span className="version-id">{v.id.toUpperCase()}</span>
                  <span className="version-date">{v.date}</span>
                  {v.status === 'approved' && <CheckCircle size={12} className="status-icon approved" />}
                  {v.status === 'pending' && <Clock size={12} className="status-icon pending" />}
                  {v.status === 'rejected' && <AlertCircle size={12} className="status-icon rejected" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="archive-footer">
        <div className="version-details">
          <span className="version-name">{version.name}</span>
          <span className="version-date">{version.date}</span>
        </div>
        <div className="version-status">
          {getStatusIcon(version.status)}
          <span>
            {version.status === 'approved' ? '已通过' :
             version.status === 'pending' ? '审核中' : '已驳回'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const Gallery = ({ onAssetSelect }) => {
  const [filter, setFilter] = useState('all');
  const [showPlayer, setShowPlayer] = useState(false);

  if (showPlayer) {
    return <ReviewPlayer onClose={() => setShowPlayer(false)} />;
  }

  return (
    <div className="gallery">
      <div className="gallery-filter">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          已通过
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          审核中
        </button>
        <ExportAssets />
      </div>

      <div className="gallery-assets">
        {assets
          .filter(asset => {
            if (filter === 'all') return true;
            return asset.versions.some(v => v.status === filter);
          })
          .map((asset) => (
            <ArchiveCard
              key={asset.id}
              asset={asset}
              onSelect={onAssetSelect}
            />
          ))}
      </div>
    </div>
  );
};

export default Gallery;