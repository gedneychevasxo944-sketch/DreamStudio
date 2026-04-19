import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Folder, Search } from 'lucide-react';
import './ProjectSelector.css';

/**
 * ProjectSelector - 项目选择对话框
 */
function ProjectSelector({
  isOpen,
  onClose,
  projects = [],
  onSelectProject,
  onCreateProject,
  loading = false,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject?.(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleSelect = (project) => {
    onSelectProject?.(project);
    onClose?.();
  };

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

  const getProjectName = (project) => {
    return project.name || project.title || '未命名项目';
  };

  // 过滤项目
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p => getProjectName(p).toLowerCase().includes(query));
  }, [projects, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="ps-wrapper">
          {/* 遮罩 */}
          <motion.div
            className="ps-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 弹窗 - 只用 opacity 动画，避免 scale 与 transform 冲突 */}
          <motion.div
            className="ps-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 头部 */}
            <div className="ps-header">
              <h2 className="ps-title">开始创作</h2>
              <button className="ps-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* 内容区 */}
            <div className="ps-content">
              {/* 创建区域 */}
              <div className="ps-create-section">
                {isCreating ? (
                  <div className="ps-create-form">
                    <input
                      type="text"
                      className="ps-input"
                      placeholder="输入项目名称..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate();
                        if (e.key === 'Escape') handleCancelCreate();
                      }}
                    />
                    <div className="ps-form-actions">
                      <button className="ps-btn ps-btn-cancel" onClick={handleCancelCreate}>
                        取消
                      </button>
                      <button
                        className="ps-btn ps-btn-confirm"
                        onClick={handleCreate}
                        disabled={!newProjectName.trim()}
                      >
                        创建
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    className="ps-create-btn"
                    onClick={() => setIsCreating(true)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Plus size={20} />
                    <span>创建新项目</span>
                  </motion.button>
                )}
              </div>

              {/* 分隔线 */}
              <div className="ps-divider">
                <span>或选择历史项目</span>
              </div>

              {/* 历史项目列表 */}
              <div className="ps-projects-section">
                {loading ? (
                  <div className="ps-skeleton-list">
                    <div className="ps-skeleton-item" />
                    <div className="ps-skeleton-item" />
                  </div>
                ) : (
                  <>
                    {/* 搜索框 */}
                    <div className="ps-search-wrapper">
                      <Search size={16} className="ps-search-icon" />
                      <input
                        type="text"
                        className="ps-search-input"
                        placeholder="搜索项目..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {filteredProjects.length > 0 ? (
                      <div className="ps-projects-list">
                        {filteredProjects.map((project) => (
                          <motion.button
                            key={project.id}
                            className="ps-project-item"
                            onClick={() => handleSelect(project)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="ps-project-icon">
                              <Folder size={18} />
                            </div>
                            <div className="ps-project-info">
                              <span className="ps-project-name">{getProjectName(project)}</span>
                              <span className="ps-project-date">
                                {formatDate(project.updatedAt || project.lastAccessedAt)}
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ) : searchQuery ? (
                      <div className="ps-empty-hint">
                        没有找到匹配的项目
                      </div>
                    ) : (
                      <div className="ps-empty-hint">
                        还没有任何项目，创建你的第一个吧
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProjectSelector;
