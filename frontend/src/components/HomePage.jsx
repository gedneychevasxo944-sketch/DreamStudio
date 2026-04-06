import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, X, Maximize2, Film, ChevronRight, Zap, Wand2, Loader2, ChevronLeft, User, LogOut } from 'lucide-react';
import ProjectCard from './ProjectCard';
import AuthModal from './AuthModal/AuthModal';
import { homePageApi, authApi, teamApi } from '../services/api';
import './HomePage.css';

// 模拟项目数据 - 2个未完成 + 1个已完成（带视频）
const mockProjects = [
  {
    projectId: 'proj_001',
    title: '星际迷途 - 科幻短片',
    description: '一个关于未来太空探索的科幻故事',
    status: 'processing',
    progress: 68,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    style: '科幻短片',
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7天前
  },
  {
    projectId: 'proj_002',
    title: '江南旧梦 - 古风动画',
    description: '江南水乡的唯美古风动画',
    status: 'draft',
    progress: 35,
    coverImage: 'https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=400',
    style: '古风动画',
    lastAccessedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3天前
  },
  {
    projectId: 'proj_003',
    title: '深海探秘 - 自然纪录片',
    description: '探索深海神秘生物的纪录片',
    status: 'completed',
    progress: 100,
    coverImage: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400',
    style: '纪录片',
    lastAccessedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天前
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14天前
    // 已完成项目的模拟视频
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    videoThumbnail: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800',
    duration: '3:45'
  }
];

// 转换后端项目数据为前端格式
const transformProjectData = (project) => ({
  id: project.id,
  title: project.title,
  type: project.tags || '短片',
  status: project.status === 'DRAFT' ? '草稿' :
          project.status === 'PROCESSING' ? '制作中' :
          project.status === 'COMPLETED' ? '已完成' : '审核阶段',
  progress: 0,
  agents: ['制片人', '编剧', '导演'],
  nodeStatuses: {},
  coverImage: project.coverImage,
  lastAccessedAt: project.updatedTime,
  createdAt: project.createdTime,
  config: project.config,
  lastResult: project.lastResult,
});

// 转换后端团队数据为前端演示案例格式
const transformTemplateToDemo = (template) => ({
  id: template.id || template.projectId,
  teamId: template.id || template.projectId,
  title: template.name || template.teamName || '未命名模板',
  description: template.description || template.teamDescribe || '',
  thumbnail: template.coverImage || `https://picsum.photos/seed/${template.id || template.projectId}/800/500`,
  duration: '2:00',
  views: template.useCount || 0,
  category: '',
  style: '',
  difficulty: '',
  tags: template.tags ? (Array.isArray(template.tags) ? template.tags : [template.tags]) : [],
});

const DemoCard = ({ demo, onExpand, onFork }) => {
  return (
    <motion.div
      className="demo-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
    >
      <div className="demo-thumbnail" onClick={() => onExpand(demo)}>
        <img src={demo.thumbnail} alt={demo.title} />
        <div className="demo-overlay">
          <div className="play-btn">
            <Play size={28} fill="currentColor" />
          </div>
        </div>
        <div className="demo-duration">{demo.duration}</div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); onExpand(demo); }}>
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="demo-info">
        <h4 className="demo-title">{demo.title}</h4>
        <p className="demo-description">{demo.description}</p>
        <div className="demo-tags">
          {demo.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="demo-tag">{tag}</span>
          ))}
        </div>
        <div className="demo-meta">
          <span className="demo-views">{demo.views}</span>
          <div className="demo-actions">
            <button className="demo-fork-btn" onClick={(e) => { e.stopPropagation(); onFork(demo); }}>
              <Sparkles size={12} />
              使用模板
            </button>
            <button className="demo-play-btn" onClick={() => onExpand(demo)}>
              <Play size={12} />
              预览
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const VideoModal = ({ demo, onClose, onEnter, onFork, currentUser, onRequireLogin }) => {
  const handleFork = () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    onFork(demo);
  };

  const handleEnter = () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    onEnter();
  };

  return (
    <div
      className="video-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="video-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="video-player-large">
          <video
            src={demo.videoUrl || demo.thumbnail}
            poster={demo.thumbnail}
            controls
            autoPlay
            className="video-player"
          />
        </div>

        <div className="video-info-large">
          <h3>{demo.title}</h3>
          <p>{demo.description}</p>
          {demo.tags && (
            <div className="video-tags">
              {demo.tags.map((tag, idx) => (
                <span key={idx} className="video-tag">{tag}</span>
              ))}
            </div>
          )}
          <div className="video-actions">
            <button className="action-btn primary" onClick={handleFork}>
              <Sparkles size={14} />
              使用此模板创建
            </button>
            <button className="action-btn secondary" onClick={handleEnter}>
              <ChevronRight size={14} />
              进入工作台
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 查看更多弹窗组件（无动画版本）
const ViewMoreModal = ({ title, children, onClose, currentPage, totalPages, onPageChange }) => {
  // 弹窗打开时禁止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="view-more-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="view-more-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="view-more-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="view-more-body">
          {children}
        </div>
        
        {/* 始终显示分页控件 */}
        <div className="view-more-pagination">
          <button 
            className="pagination-btn" 
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={16} />
            上一页
          </button>
          <span className="pagination-info">{currentPage} / {totalPages}</span>
          <button 
            className="pagination-btn" 
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            下一页
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ onEnter }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // 数据状态
  const [recentProjects, setRecentProjects] = useState([]);
  const [demoTemplates, setDemoTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // 弹窗状态
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [projectsPage, setProjectsPage] = useState(1);
  const [templatesPage, setTemplatesPage] = useState(1);
  const pageSize = 6; // 每页6个（2排 x 3个）

  // 登录状态
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState(null);

  // 检查登录状态并验证 token 有效性
  useEffect(() => {
    console.log('[HomePage] Checking auth status...');
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('[HomePage] User:', !!user, 'Token:', !!token);

    // 先检查是否有认证错误（从其他页面重定向过来）
    const error = sessionStorage.getItem('authError');
    if (error) {
      console.log('[HomePage] Found auth error in sessionStorage:', error);
      sessionStorage.removeItem('authError');
      // 清除可能残留的登录信息，直接显示登录弹窗
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      setCurrentUser(null);
      setAuthError(error);
      setShowAuthModal(true);
      return;
    }

    if (user && token) {
      console.log('[HomePage] Has user and token, validating...');
      setCurrentUser(JSON.parse(user));

      // 使用专门的 /auth/me 接口验证 token
      authApi.checkStatus()
        .then((res) => {
          console.log('[HomePage] Token validation passed', res);
          // 用后端返回的最新用户信息更新状态
          if (res.data) {
            setCurrentUser(res.data);
          }
        })
        .catch((err) => {
          console.log('[HomePage] Token validation failed:', err);
          // token 无效，清除本地存储，直接显示登录弹窗
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          setCurrentUser(null);
          setAuthError(err.message || '登录已失效，请重新登录');
          setShowAuthModal(true);
        });
    }
  }, []);

  // 加载数据（案例演示始终加载，最近项目仅在登录后加载）
  useEffect(() => {
    let cancelled = false;
    loadData();
    return () => { cancelled = true; };
  }, []);

  // 登录状态变化时重新加载最近项目
  useEffect(() => {
    if (currentUser) {
      loadRecentProjects();
    } else {
      setRecentProjects([]);
    }
  }, [currentUser]);

  // 处理登录成功
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setAuthError(null); // 清除错误状态
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setRecentProjects([]);
  };

  // 加载案例演示（始终加载）
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const templatesRes = await homePageApi.getTemplates();  // 使用 /templates 接口获取演示模板
      if (templatesRes.code === 200 && templatesRes.data) {
        const transformedDemos = (templatesRes.data.templates || []).map(transformTemplateToDemo);
        setDemoTemplates(transformedDemos);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('加载数据失败，请检查后端服务是否启动');
      setDemoTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载最近项目（仅登录后）
  const loadRecentProjects = async () => {
    try {
      const projectsRes = await homePageApi.getRecentProjects(10);
      if (projectsRes.code === 200 && projectsRes.data && projectsRes.data.projects) {
        const transformedProjects = projectsRes.data.projects.map(transformProjectData);
        setRecentProjects(transformedProjects);
      } else {
        setRecentProjects([]);
      }
    } catch (err) {
      console.error('Failed to load recent projects:', err);
      setRecentProjects([]);
    }
  };

  // 检查是否登录
  const checkLogin = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // 创建项目
  const handleCreateProject = async () => {
    if (!inputValue.trim()) return;
    if (!checkLogin()) return;

    setCreating(true);
    try {
      const response = await homePageApi.createProject(inputValue.trim());
      if (response.code === 200 && response.data) {
        onEnter(inputValue.trim(), true, response.data.id);
      } else {
        setError(response.message || '创建项目失败');
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('创建项目失败，请稍后重试');
    } finally {
      setCreating(false);
    }
  };

  // 基于模板创建项目
  const handleForkTemplate = async (demo) => {
    if (!checkLogin()) return;

    setCreating(true);
    try {
      // Fork时传入的是模板关联的项目ID (projectId)
      // 如果有 projectId，使用 forkTemplate；否则使用 teamId 获取详情后创建
      const projectId = demo.projectId || demo.teamId;
      const response = await homePageApi.forkTemplate(projectId);
      if (response.code === 200 && response.data) {
        onEnter(response.data.title, true, response.data.id);
      } else {
        setError(response.message || '创建项目失败');
      }
    } catch (err) {
      console.error('Failed to fork template:', err);
      setError('创建项目失败，请稍后重试');
    } finally {
      setCreating(false);
      setActiveDemo(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() && !creating) {
      handleCreateProject();
    }
  };

  // 分页数据
  const paginatedProjects = recentProjects.slice((projectsPage - 1) * pageSize, projectsPage * pageSize);
  const paginatedTemplates = demoTemplates.slice((templatesPage - 1) * pageSize, templatesPage * pageSize);
  const projectsTotalPages = Math.ceil(recentProjects.length / pageSize) || 1;
  const templatesTotalPages = Math.ceil(demoTemplates.length / pageSize) || 1;

  return (
    <div className="home-page">
      <div className="home-background">
        <div className="grid-overlay"></div>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      {/* 右上角登录/用户按钮 */}
      <div className="home-header-actions">
        {currentUser ? (
          <div className="user-menu">
            <div className="user-info">
              <img src={currentUser.avatar} alt={currentUser.nickname} className="user-avatar" />
              <span className="user-name">{currentUser.nickname}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="退出登录">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="login-btn" onClick={() => setShowAuthModal(true)}>
            <User size={16} />
            登录 / 注册
          </button>
        )}
      </div>

      <motion.div
        className="home-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="logo-container">
          <svg className="logo-svg" viewBox="0 0 200 60" fill="none">
            <motion.path
              d="M20 30 L40 10 L60 30 L40 50 Z"
              stroke="#06b6d4"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <motion.path
              d="M50 30 L70 10 L90 30 L70 50 Z"
              stroke="#3b82f6"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.7 }}
            />
            <motion.path
              d="M80 30 L100 10 L120 30 L100 50 Z"
              stroke="#c0c8d4"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.9 }}
            />
          </svg>
          <div className="logo-text-large">
            <span className="logo-main">造梦</span>
            <span className="logo-ai">AI</span>
          </div>
          <p className="logo-tagline">AI驱动的智能电影生产线</p>
        </div>

        <motion.div
          className={`search-container ${searchFocused ? 'focused' : ''}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <input
            type="text"
            className="search-input"
            placeholder="输入你的创意想法..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleKeyDown}
            disabled={creating}
          />
          <div className="search-actions">
            <button 
              className="action-btn generate-btn"
              onClick={handleCreateProject}
              disabled={!inputValue.trim() || creating}
              title="输入创意想法一键出片"
            >
              {creating ? <Loader2 size={18} className="spin" /> : <Wand2 size={18} />}
            </button>
            <button
              className="action-btn workspace-btn"
              onClick={() => {
                if (!checkLogin()) return;
                onEnter('', false);
              }}
              title="直接进入造梦工作台"
            >
              <Zap size={18} />
            </button>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
            <button onClick={loadData}>重试</button>
          </motion.div>
        )}
      </motion.div>

      {/* 最近项目 - 仅登录后显示 */}
      {currentUser && (
        <motion.div
          className="projects-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="section-header-row">
            <h3 className="section-title">最近项目</h3>
            <button className="view-all-btn" onClick={() => setShowProjectsModal(true)}>
              查看更多
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="projects-grid">
            {recentProjects.slice(0, 3).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEnter={onEnter}
              />
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        className="demos-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <div className="section-header-row">
          <h3 className="section-title">案例演示</h3>
          <button className="view-all-btn" onClick={() => setShowTemplatesModal(true)}>
            查看更多
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="demos-grid">
          {demoTemplates.slice(0, 3).map((demo) => (
            <DemoCard
              key={demo.id}
              demo={demo}
              onExpand={setActiveDemo}
              onFork={handleForkTemplate}
            />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {activeDemo && (
          <VideoModal
            demo={activeDemo}
            onClose={() => setActiveDemo(null)}
            onEnter={() => onEnter('', false)}
            onFork={handleForkTemplate}
            currentUser={currentUser}
            onRequireLogin={() => setShowAuthModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProjectsModal && (
          <ViewMoreModal
            title="最近项目"
            onClose={() => setShowProjectsModal(false)}
            currentPage={projectsPage}
            totalPages={projectsTotalPages}
            onPageChange={setProjectsPage}
          >
            <div className="view-more-grid">
              {paginatedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEnter={onEnter}
                />
              ))}
            </div>
          </ViewMoreModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplatesModal && (
          <ViewMoreModal
            title="案例演示"
            onClose={() => setShowTemplatesModal(false)}
            currentPage={templatesPage}
            totalPages={templatesTotalPages}
            onPageChange={setTemplatesPage}
          >
            <div className="view-more-grid">
              {paginatedTemplates.map((demo) => (
                <DemoCard
                  key={demo.id}
                  demo={demo}
                  onExpand={setActiveDemo}
                  onFork={handleForkTemplate}
                />
              ))}
            </div>
          </ViewMoreModal>
        )}
      </AnimatePresence>

      {/* 认证错误提示 */}
      {authError && (
        <div className="auth-error-banner">
          <span>{authError}</span>
          <button onClick={() => setAuthError(null)}>×</button>
        </div>
      )}

      {/* 登录/注册弹窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setAuthError(null); }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default HomePage;
