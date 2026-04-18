import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Folder } from 'lucide-react';
import './ProjectSelector.css';

/**
 * ProjectSelector - 项目选择对话框
 *
 * 点击"开始创作"后弹出，显示：
 * - 创建新项目选项
 * - 历史项目列表
 */
function ProjectSelector({
  isOpen,
  onClose,
  projects = [],
  onSelectProject,
  onCreateProject,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // 处理创建新项目
  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject?.(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  // 处理选择项目
  const handleSelect = (project) => {
    onSelectProject?.(project);
    onClose?.();
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            className="project-selector-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 对话框 */}
          <motion.div
            className="project-selector"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* 头部 */}
            <div className="selector-header">
              <h2 className="selector-title">开始创作</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="selector-content">
              {/* 创建新项目 */}
              {isCreating ? (
                <div className="create-form">
                  <input
                    type="text"
                    className="project-name-input"
                    placeholder="输入项目名称..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                      if (e.key === 'Escape') setIsCreating(false);
                    }}
                  />
                  <div className="create-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => setIsCreating(false)}
                    >
                      取消
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleCreate}
                      disabled={!newProjectName.trim()}
                    >
                      创建
                    </button>
                  </div>
                </div>
              ) : (
                <motion.button
                  className="create-btn"
                  onClick={() => setIsCreating(true)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Plus size={20} />
                  <span>创建新项目</span>
                </motion.button>
              )}

              {/* 历史项目列表 */}
              {projects.length > 0 && (
                <div className="projects-section">
                  <h3 className="section-title">历史项目</h3>
                  <div className="projects-list">
                    {projects.map((project) => (
                      <motion.button
                        key={project.id}
                        className="project-item"
                        onClick={() => handleSelect(project)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="project-icon">
                          <Folder size={18} />
                        </div>
                        <div className="project-info">
                          <span className="project-name">{project.name}</span>
                          <span className="project-date">
                            {formatDate(project.updatedAt)}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {projects.length === 0 && !isCreating && (
                <p className="empty-hint">还没有任何项目，创建你的第一个吧！</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ProjectSelector;
