import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, X, Maximize2, Film, ChevronRight, ChevronLeft, User, LogOut, ArrowRight, Layers, Video, Bot, FileText } from 'lucide-react';
import ProjectCard from './ProjectCard';
import AuthModal from './AuthModal/AuthModal';
import { homePageApi, authApi, teamApi } from '../services/api';
import { transformProjectData } from '../utils/transformUtils';
import { uiLogger } from '../utils/logger';
import { authStorage } from '../utils/authStorage';
import './HomePage.css';

// 产品流程步骤（详细）
const WORKFLOW_STEPS = [
  {
    icon: <FileText size={20} />,
    label: '剧本',
    title: '导入剧本',
    description: '上传剧本文件或直接输入，AI 自动识别故事结构',
    points: [
      '支持多种格式：txt、fountain、json',
      '自动解析场景、角色、对话',
      'AI 润色与改写辅助',
    ],
  },
  {
    icon: <User size={20} />,
    label: '角色',
    title: '角色生成',
    description: '根据剧本自动识别并生成角色形象',
    points: [
      'AI 解析角色外貌特征',
      '支持形象调整与重新生成',
      '角色维度管理，统一视觉风格',
    ],
  },
  {
    icon: <Layers size={20} />,
    label: '场景',
    title: '场景构建',
    description: '生成剧本中描述的场景环境',
    points: [
      '还原剧本场景描述',
      '支持环境光、氛围调节',
      '素材库快速复用',
    ],
  },
  {
    icon: <Film size={20} />,
    label: '分镜',
    title: '分镜编辑',
    description: '编排镜头序列，配置镜头参数',
    points: [
      '景别、运镜、时长精细控制',
      '角色/场景/道具关联',
      'Prompt 优化与调试',
    ],
  },
  {
    icon: <Video size={20} />,
    label: '视频',
    title: '视频生成',
    description: '端到端视频生成，支持批量导出',
    points: [
      '一键生成完整视频',
      '批量处理高效产出',
      '多格式导出（MP4、MOV）',
    ],
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

// Mock 案例数据（当 API 无返回时使用）
const MOCK_DEMOS = [
  { id: 'mock-1', title: '赛博朋克之夜', description: '霓虹灯光下的都市追逐，高科技与低生活的完美融合', thumbnail: 'https://picsum.photos/seed/cyber1/800/500', duration: '3:24', views: 12580, tags: ['赛博朋克', '动作'] },
  { id: 'mock-2', title: '星际穿越者', description: '宇宙飞船穿越虫洞，探索未知星系的史诗之旅', thumbnail: 'https://picsum.photos/seed/space1/800/500', duration: '4:12', views: 8932, tags: ['科幻', '冒险'] },
  { id: 'mock-3', title: '古风仙侠传', description: '御剑飞行于云海之间，道法自然的修仙故事', thumbnail: 'https://picsum.photos/seed/xianxia1/800/500', duration: '2:58', views: 15670, tags: ['古风', '仙侠'] },
  { id: 'mock-4', title: '都市物语', description: '繁忙都市中普通人的温情故事，平凡却真实', thumbnail: 'https://picsum.photos/seed/city1/800/500', duration: '2:15', views: 6780, tags: ['都市', '温情'] },
  { id: 'mock-5', title: '深海探险', description: '潜入未知深海，发现失落文明的惊险历程', thumbnail: 'https://picsum.photos/seed/ocean1/800/500', duration: '3:45', views: 9234, tags: ['探险', '神秘'] },
  { id: 'mock-6', title: '机械觉醒', description: '人工智能觉醒意识，开始思考存在的意义', thumbnail: 'https://picsum.photos/seed/robot1/800/500', duration: '3:08', views: 11230, tags: ['科幻', '人工智能'] },
  { id: 'mock-7', title: '奇幻森林', description: '魔法生物栖息的古老森林，冒险从这里开始', thumbnail: 'https://picsum.photos/seed/forest1/800/500', duration: '2:52', views: 7890, tags: ['奇幻', '冒险'] },
  { id: 'mock-8', title: '末日逃亡', description: '丧尸围城，人类最后的避难所在何方', thumbnail: 'https://picsum.photos/seed/zombie1/800/500', duration: '3:33', views: 14560, tags: ['末日', '惊悚'] },
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
        const transformedDemos = (templatesRes.data.templates || []).map(transformTemplateToDemo);
        // 如果 API 返回不足 4 个，使用 mock 数据补充
        if (transformedDemos.length < 4) {
          setDemoTemplates([...transformedDemos, ...MOCK_DEMOS]);
        } else {
          setDemoTemplates(transformedDemos);
        }
      } else {
        // API 无数据时使用 mock 数据
        setDemoTemplates(MOCK_DEMOS);
      }
    } catch (err) {
      uiLogger.error('[HomePage] Failed to load data:', err);
      // 失败时也使用 mock 数据作为后备
      setDemoTemplates(MOCK_DEMOS);
      setError(null); // 不显示错误，用 mock 数据
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

  const handleStartCreating = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    onEnter('', false);
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

      {/* 创作流程 */}
      <motion.div
        className="workflow-section"
        id="workflow-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <h2 className="section-title">创作流程</h2>
        <p className="section-subtitle">从剧本到视频，5 步完成你的故事</p>
        <div className="workflow-steps">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.label} className="workflow-step-card">
              <div className="step-header">
                <div className="step-icon">{step.icon}</div>
                <div className="step-info">
                  <h3 className="step-title">{step.title}</h3>
                  <span className="step-label">{step.label}</span>
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight size={20} className="step-arrow" />
                )}
              </div>
              <p className="step-description">{step.description}</p>
              <ul className="step-points">
                {step.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
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
    </div>
  );
};

export default HomePage;
