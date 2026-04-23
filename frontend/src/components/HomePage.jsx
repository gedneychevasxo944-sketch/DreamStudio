import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, X, Maximize2, Film, ChevronRight, ChevronLeft, User, LogOut, ArrowRight, Layers, Video, Bot, FileText, Sun, Moon } from 'lucide-react';
import ProjectCard from './ProjectCard';
import AuthModal from './AuthModal/AuthModal';
import ProjectSelector from './ProjectSelector/ProjectSelector';
import { homePageApi, authApi, teamApi } from '../services/api';
import { transformProjectData } from '../utils/transformUtils';
import { uiLogger } from '../utils/logger';
import { authStorage } from '../utils/authStorage';
import useThemeStore from '../stores/themeStore';
import './HomePage.css';

// 产品流程步骤（主线：剧本 → 分镜 → 视频）
const WORKFLOW_MAIN_STEPS = [
  {
    icon: <FileText size={20} />,
    label: 'STEP 1',
    title: '导入剧本',
    description: '上传剧本文件或输入台词，AI 自动解析故事结构、角色、场景',
    highlights: ['智能解析角色与场景', '自动拆解分镜单元', '多格式支持'],
  },
  {
    icon: <Layers size={20} />,
    label: 'STEP 2',
    title: 'AI 生成分镜',
    description: 'AI 根据剧本内容生成完整分镜，包含角色位置、运镜方式、画面描述',
    highlights: ['一键生成分镜', '可调式镜头语言', '角色场景关联'],
  },
  {
    icon: <Video size={20} />,
    label: 'STEP 3',
    title: '视频生成',
    description: '选择分镜片段，一键生成视频片段，支持批量生成与导出',
    highlights: ['端到端生成', '批量高效', '多格式导出'],
  },
];

// 素材创作（支线）
const WORKFLOW_SUB_STEPS = [
  {
    icon: <User size={20} />,
    label: '角色',
    title: 'AI 生成角色',
    description: '根据剧本描述生成角色形象，支持风格定制与迭代优化',
  },
  {
    icon: <Layers size={20} />,
    label: '场景',
    title: 'AI 生成场景',
    description: '根据剧本场景描述生成场景素材，支持环境氛围调节',
  },
];

// 产品特性数据
const FEATURES = [
  {
    icon: <FileText size={20} />,
    title: '智能剧本解析',
    description: '上传剧本，AI 自动识别角色、场景、道具，快速构建故事板',
  },
  {
    icon: <Layers size={20} />,
    title: '可视化分镜',
    description: '直观的镜头序列编辑器，支持景别、运镜、时长等专业参数',
  },
  {
    icon: <Bot size={20} />,
    title: 'AI 智能生成',
    description: '一句话描述即可生成角色、场景、道具，创意无限延展',
  },
  {
    icon: <Video size={20} />,
    title: '端到端视频',
    description: '从分镜到视频一键生成，支持批量导出，专业高效',
  },
];

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

const DemoCard = ({ demo, onExpand, index }) => {
  return (
    <motion.div
      className="demo-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -6 }}
    >
      <div className="demo-thumbnail" onClick={() => onExpand(demo)}>
        <img src={demo.thumbnail} alt={demo.title} loading="lazy" />
        <div className="demo-overlay">
          <div className="play-btn">
            <Play size={32} fill="currentColor" />
          </div>
        </div>
        <div className="demo-duration">{demo.duration}</div>
        <div className="demo-views">
          <Film size={12} />
          {demo.views} 次浏览
        </div>
      </div>

      <div className="demo-info">
        <h4 className="demo-title" title={demo.title}>{demo.title}</h4>
        <p className="demo-description" title={demo.description}>{demo.description}</p>
        <div className="demo-tags">
          {demo.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="demo-tag">{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const VideoModal = ({ demo, onClose, onEnter, currentUser, onRequireLogin }) => {
  const handleEnter = () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    onEnter(demo.id);
  };

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="关闭视频">
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
            <button className="action-btn primary" onClick={handleEnter}>
              <ChevronRight size={14} />
              进入工作台
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ onEnter }) => {
  const [activeDemo, setActiveDemo] = useState(null);
  const showcaseScrollRef = useRef(null);

  // 主题状态
  const { mode, toggle } = useThemeStore();

  // 项目选择状态
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectSelectorLoading, setProjectSelectorLoading] = useState(false);

  // 数据状态
  const [demoTemplates, setDemoTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 登录状态
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState(null);

  // 检查登录状态
  useEffect(() => {
    const user = authStorage.getUser();
    const token = authStorage.getToken();

    const error = sessionStorage.getItem('authError');
    if (error) {
      sessionStorage.removeItem('authError');
      authStorage.clearAuth();
      setCurrentUser(null);
      setAuthError(error);
      setShowAuthModal(true);
      return;
    }

    if (user && token) {
      setCurrentUser(user);
      authApi.checkStatus()
        .then((res) => {
          if (res.data) setCurrentUser(res.data);
        })
        .catch(() => {
          authStorage.clearAuth();
          setCurrentUser(null);
        });
    }
  }, []);

  // 加载案例演示
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const templatesRes = await homePageApi.getTemplates();
      if (templatesRes.code === 200 && templatesRes.data) {
        const demos = (templatesRes.data.templates || []).map(transformTemplateToDemo);
        setDemoTemplates(demos);
      } else {
        setDemoTemplates([]);
      }
    } catch (err) {
      uiLogger.error('[HomePage] Failed to load data:', err);
      setError(err.message || '加载失败');
      setDemoTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setAuthError(null);
  };

  const handleLogout = () => {
    authStorage.clearAuth();
    setCurrentUser(null);
  };

  const handleStartCreating = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // 先加载项目列表
    setProjectSelectorLoading(true);
    let projectList = [];
    try {
      const res = await homePageApi.getProjects();
      // 支持多种响应格式：res.data.projects, res.data.list, res.data
      const data = res.data;
      if (Array.isArray(data)) {
        projectList = data;
      } else if (data?.projects) {
        projectList = data.projects;
      } else if (data?.list) {
        projectList = data.list;
      }
    } catch (err) {
      uiLogger.error('[HomePage] Failed to load projects:', err);
    } finally {
      setProjectSelectorLoading(false);
    }

    // 如果没有历史项目，直接进入创建新项目
    if (projectList.length === 0) {
      onEnter('', false, null, null);
      return;
    }

    // 有项目，显示选择弹窗
    setProjects(Array.isArray(projectList) ? projectList.map(transformProjectData) : []);
    setShowProjectSelector(true);
  };

  // 处理选择已有项目
  const handleSelectProject = (project) => {
    setShowProjectSelector(false);
    onEnter('', false, project.id);
  };

  // 处理创建新项目
  const handleCreateProject = (name) => {
    setShowProjectSelector(false);
    onEnter('', false, null, name);
  };

  const handleViewDemos = () => {
    // 滚动到创作流程区域
    const workflowSection = document.querySelector('.workflow-section');
    if (workflowSection) {
      workflowSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 案例横向滚动
  const scrollShowcase = useCallback((direction) => {
    if (!showcaseScrollRef.current) return;
    const scrollAmount = 300;
    showcaseScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="home-page">
      <div className="home-background">
        <div className="grid-overlay"></div>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
        <div className="glow-orb orb-4"></div>
      </div>

      {/* 右上角主题切换 + 登录/用户按钮 */}
      <div className="home-header-actions">
        {/* 主题切换按钮 */}
        <button
          className="theme-toggle-btn"
          onClick={toggle}
          title={mode === 'day' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {mode === 'day' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

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

      {/* Hero 区域 */}
      <motion.div
        className="hero-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-logo">
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

        <div className="hero-actions">
          <motion.button
            className="hero-btn primary"
            onClick={handleStartCreating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles size={18} />
            <span>开始创作</span>
            <ArrowRight size={16} />
          </motion.button>

          <motion.button
            className="hero-btn secondary"
            onClick={handleViewDemos}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileText size={16} />
            <span>使用文档</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 案例展示区域 */}
      <motion.div
        className="showcase-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="section-header">
          <h2 className="section-title">精选案例</h2>
          <p className="section-subtitle">探索 AI 创作的无限可能</p>
        </div>

        {loading ? (
          <div className="showcase-scroll-container">
            <div className="showcase-scroll">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-thumbnail"></div>
                  <div className="skeleton-info">
                    <div className="skeleton-line medium"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="showcase-empty">
            <p>{error}</p>
          </div>
        ) : demoTemplates.length > 0 ? (
          <div className="showcase-scroll-container">
            <button
              className="scroll-arrow left"
              onClick={() => scrollShowcase('left')}
              aria-label="向左滚动"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="showcase-scroll" ref={showcaseScrollRef}>
              {demoTemplates.slice(0, 8).map((demo, index) => (
                <DemoCard
                  key={demo.id}
                  demo={demo}
                  index={index}
                  onExpand={setActiveDemo}
                />
              ))}
            </div>

            <button
              className="scroll-arrow right"
              onClick={() => scrollShowcase('right')}
              aria-label="向右滚动"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="showcase-empty">
            <Film size={48} />
            <p>暂无案例展示</p>
          </div>
        )}
      </motion.div>

      {/* 创作流程 - 主线 */}
      <motion.div
        className="workflow-section"
        id="workflow-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <h2 className="section-title">创作流程</h2>
        <p className="section-subtitle">从剧本到视频，三步完成你的故事</p>
        <div className="workflow-main-steps">
          {WORKFLOW_MAIN_STEPS.map((step, index) => (
            <div key={step.label} className="workflow-main-step">
              <div className="step-number">{step.label}</div>
              <div className="step-icon-main">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              <ul className="step-highlights">
                {step.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
              {index < WORKFLOW_MAIN_STEPS.length - 1 && (
                <div className="step-connector">
                  <ChevronRight size={24} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 素材创作支线 */}
        <div className="workflow-sub-section">
          <div className="workflow-sub-title">素材创作（可选）</div>
          <div className="workflow-sub-steps">
            {WORKFLOW_SUB_STEPS.map((step) => (
              <div key={step.label} className="workflow-sub-step">
                <div className="step-icon-small">{step.icon}</div>
                <div className="step-info">
                  <h4 className="step-title-small">{step.title}</h4>
                  <p className="step-desc-small">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 产品特性 */}
      <motion.div
        className="features-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <div className="features-grid">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 视频播放弹窗 */}
      <AnimatePresence>
        {activeDemo && (
          <VideoModal
            demo={activeDemo}
            onClose={() => setActiveDemo(null)}
            onEnter={(demoId) => onEnter('', false, null, null, demoId)}
            currentUser={currentUser}
            onRequireLogin={() => setShowAuthModal(true)}
          />
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

      {/* 项目选择弹窗 */}
      <ProjectSelector
        isOpen={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        projects={projects}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        loading={projectSelectorLoading}
      />
    </div>
  );
};

export default HomePage;