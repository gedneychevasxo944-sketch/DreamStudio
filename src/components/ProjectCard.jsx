import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Film, CheckCircle, Clock, AlertTriangle, User, ArrowRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import './ProjectCard.css';

const NodeStatusIndicator = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { icon: <User size={8} />, color: '#3b82f6', label: '进行中' };
      case 'approved':
        return { icon: <CheckCircle size={8} />, color: '#10b981', label: '已通过' };
      case 'interception':
        return { icon: <AlertTriangle size={8} />, color: '#f59e0b', label: '拦截' };
      case 'pending':
        return { icon: <Clock size={8} />, color: '#5a6270', label: '等待' };
      default:
        return { icon: <User size={8} />, color: '#5a6270', label: '未知' };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className="node-status-dot"
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  );
};

// 视频预览弹窗
const VideoPreviewModal = ({ isOpen, videoUrl, thumbnail, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <motion.div
      className="video-preview-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="video-preview-content"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="video-preview-close" onClick={onClose}>
          <X size={20} />
        </button>
        <video
          src={videoUrl}
          poster={thumbnail}
          controls
          autoPlay
          className="video-preview-player"
        />
      </motion.div>
    </motion.div>,
    document.body
  );
};

const ProjectCard = ({ project, onEnter }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const isCompleted = project.status === '已完成';

  const handlePlayClick = (e) => {
    e.stopPropagation();
    setShowVideoPreview(true);
  };

  const handleCardClick = () => {
    onEnter('', false, project.id);
  };

  return (
    <>
      <motion.div
        className={`project-card ${isCompleted ? 'completed' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Preview Area */}
        <div className="card-preview">
          {isCompleted && (project.videoThumbnail || project.thumbnail) ? (
            <>
              <img src={project.videoThumbnail || project.thumbnail} alt={project.title} />
              <div className="preview-overlay">
                <div className="play-icon" onClick={handlePlayClick}>
                  <Play size={24} fill="currentColor" />
                </div>
                {project.duration && (
                  <span className="video-duration">{project.duration}</span>
                )}
              </div>
            </>
          ) : (
            <div className="placeholder-content">
              <Film size={32} color="#5a6270" />
              <span className="placeholder-text">制作进度 {project.progress}%</span>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="card-body">
          <div className="card-meta">
            <span className="project-type">{project.type}</span>
            <span className={`status-badge ${project.status.replace(/\s/g, '-')}`}>
              {project.status}
            </span>
          </div>

          <h4 className="project-title">{project.title}</h4>

          {!isCompleted && (
            <>
              <div className="progress-row">
                <div className="progress-track">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="progress-value">{project.progress}%</span>
              </div>

              <div className="agents-row">
                {project.agents.map((agent, i) => (
                  <div key={i} className="agent-chip">
                    <NodeStatusIndicator status={project.nodeStatuses[agent]} />
                    <span>{agent}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {isCompleted && (
            <div className="completed-row">
              <CheckCircle size={14} color="#10b981" />
              <span>已完成</span>
            </div>
          )}
        </div>

        {/* Hover Overlay - 点击进入工作台 */}
        {isHovered && (
          <motion.div
            className="hover-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="overlay-content">
              <ArrowRight size={24} color="#06b6d4" />
              <span className="overlay-label">点击进入工作台</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 视频预览弹窗 */}
      <AnimatePresence>
        {showVideoPreview && (
          <VideoPreviewModal
            isOpen={showVideoPreview}
            videoUrl={project.videoUrl}
            thumbnail={project.videoThumbnail || project.thumbnail}
            onClose={() => setShowVideoPreview(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProjectCard;
