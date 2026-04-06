import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  X, Search, Upload, Plus, MessageSquare, Star, Download, Trash2, Edit3,
  Check, Code, Zap, Palette, Film, Music, FileText, Image, Globe, Cpu,
  Sparkles, ChevronRight, Terminal, Send, Bot, User, MoreVertical,
  Package, Shield, Users, FolderOpen, Wand2
} from 'lucide-react';
import './SkillMarket.css';
import { toast } from '../Toast/Toast';

// 模拟Skill数据
const MOCK_SKILLS = [
  {
    id: '1',
    name: '文生图优化器',
    description: '自动优化图像生成提示词，提升画面质量和一致性',
    version: '2.1.0',
    author: '造梦AI官方',
    type: 'official',
    category: '图像生成',
    icon: Image,
    color: '#10b981',
    downloads: 15234,
    rating: 4.8,
    tags: ['图像', '优化', '提示词'],
    installed: false
  },
  {
    id: '2',
    name: '剧本结构分析',
    description: '分析剧本三幕结构，识别情节点和角色弧光',
    version: '1.5.2',
    author: '造梦AI官方',
    type: 'official',
    category: '剧本创作',
    icon: FileText,
    color: '#3b82f6',
    downloads: 8932,
    rating: 4.6,
    tags: ['剧本', '分析', '结构'],
    installed: true
  },
  {
    id: '3',
    name: '物理运动模拟',
    description: '模拟真实物理效果，包括重力、碰撞、流体等',
    version: '1.0.0',
    author: 'PhysicsMaster',
    type: 'community',
    category: '特效制作',
    icon: Zap,
    color: '#f59e0b',
    downloads: 3421,
    rating: 4.3,
    tags: ['物理', '模拟', '特效'],
    installed: false
  },
  {
    id: '4',
    name: '色彩情绪分析',
    description: '分析画面色彩情绪，提供调色建议',
    version: '1.2.0',
    author: 'ColorWizard',
    type: 'community',
    category: '美术设计',
    icon: Palette,
    color: '#ec4899',
    downloads: 5678,
    rating: 4.5,
    tags: ['色彩', '情绪', '调色'],
    installed: false
  },
  {
    id: '5',
    name: '音频节奏同步',
    description: '自动分析音频节奏，生成同步的视觉节拍',
    version: '2.0.1',
    author: '造梦AI官方',
    type: 'official',
    category: '音频处理',
    icon: Music,
    color: '#8b5cf6',
    downloads: 12109,
    rating: 4.7,
    tags: ['音频', '节奏', '同步'],
    installed: false
  },
  {
    id: '6',
    name: '镜头语言库',
    description: '专业电影镜头语言数据库，包含运镜技巧和视觉叙事',
    version: '3.0.0',
    author: 'CinematographyPro',
    type: 'community',
    category: '摄影指导',
    icon: Film,
    color: '#ef4444',
    downloads: 7891,
    rating: 4.9,
    tags: ['镜头', '电影', '运镜'],
    installed: true
  }
];

// 分类列表
const CATEGORIES = [
  { id: 'all', name: '全部', icon: Package },
  { id: 'image', name: '图像生成', icon: Image },
  { id: 'video', name: '视频制作', icon: Film },
  { id: 'audio', name: '音频处理', icon: Music },
  { id: 'text', name: '文本创作', icon: FileText },
  { id: 'code', name: '代码工具', icon: Code },
  { id: 'effect', name: '特效制作', icon: Sparkles },
];

// 使用 memo 优化 SkillCard 组件
const SkillCard = memo(({ skill, onToggleInstall }) => {
  const IconComponent = skill.icon;

  return (
    <div className="skill-card">
      <div className="skill-header">
        <div className="skill-header-left">
          {skill.type === 'official' ? (
            <span className="official-badge">
              <Shield size={10} />
              官方
            </span>
          ) : (
            <span className="community-badge">
              <Users size={10} />
              个人
            </span>
          )}
        </div>
        <div className="skill-icon" style={{ backgroundColor: `${skill.color}20` }}>
          <IconComponent size={24} style={{ color: skill.color }} />
        </div>
        <div className="skill-header-right">
          <span className="skill-version">v{skill.version}</span>
        </div>
      </div>

      <h4 className="skill-name">{skill.name}</h4>
      <p className="skill-desc">{skill.description}</p>

      <div className="skill-tags">
        {skill.tags.map(tag => (
          <span key={tag} className="skill-tag">{tag}</span>
        ))}
      </div>

      <div className="skill-footer">
        <div className="skill-stats">
          <span className="stat-item">
            <Download size={12} />
            {skill.downloads.toLocaleString()}
          </span>
          <span className="stat-item">
            <Star size={12} />
            {skill.rating}
          </span>
        </div>
        <span className="skill-author">by {skill.author}</span>
      </div>

      <button
        className={`install-btn ${skill.installed ? 'installed' : ''}`}
        onClick={() => onToggleInstall(skill.id)}
      >
        {skill.installed ? (
          <>
            <Check size={14} />
            已安装
          </>
        ) : (
          <>
            <Download size={14} />
            安装
          </>
        )}
      </button>
    </div>
  );
});

SkillCard.displayName = 'SkillCard';

const SkillMarket = ({ onClose, onInstallSkill }) => {
  const [activeTab, setActiveTab] = useState('official');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');

  // 对话创建状态
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', content: '你好！我是Skill创建助手。请描述你想要创建的Skill功能，我会帮你生成完整的Skill配置。' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const prevMessageCountRef = useRef(1);

  // 使用 useMemo 缓存过滤后的技能列表
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // 标签过滤
      if (activeTab === 'installed') {
        if (!skill.installed) return false;
      } else {
        if (skill.type !== activeTab) return false;
      }

      // 分类过滤
      if (activeCategory !== 'all') {
        const categoryMap = {
          'image': '图像生成',
          'video': '视频制作',
          'audio': '音频处理',
          'text': '文本创作',
          'code': '代码工具',
          'effect': '特效制作'
        };
        if (skill.category !== categoryMap[activeCategory]) return false;
      }

      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return skill.name.toLowerCase().includes(query) ||
               skill.description.toLowerCase().includes(query) ||
               skill.tags.some(tag => tag.toLowerCase().includes(query));
      }

      return true;
    });
  }, [skills, activeTab, activeCategory, searchQuery]);

  // 使用 useCallback 优化 toggleInstall 函数
  const toggleInstall = useCallback((skillId) => {
    setSkills(prev => {
      const skill = prev.find(s => s.id === skillId);
      if (skill && !skill.installed) {
        onInstallSkill?.(skill);
      }
      return prev.map(s =>
        s.id === skillId ? { ...s, installed: !s.installed } : s
      );
    });
  }, [onInstallSkill]);

  // 处理文件上传
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadName(file.name.replace('.json', '').replace('.skill', ''));
    }
  }, []);

  // 提交上传
  const submitUpload = useCallback(() => {
    if (uploadName.trim() && uploadFile) {
      const newSkill = {
        id: `custom-${Date.now()}`,
        name: uploadName,
        description: uploadDesc || '自定义上传的Skill',
        version: '1.0.0',
        author: '我',
        type: 'community',
        category: '自定义',
        icon: Code,
        color: '#06b6d4',
        downloads: 0,
        rating: 0,
        tags: ['自定义'],
        installed: true
      };
      setSkills(prev => [newSkill, ...prev]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDesc('');
      toast.show({ message: 'Skill 上传成功！', type: 'success' });
    }
  }, [uploadName, uploadFile, uploadDesc]);

  // 发送对话消息
  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsGenerating(true);

    // 模拟AI响应
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses = [
      '我理解你想要创建一个处理图像的Skill。让我为你生成配置...',
      '基于你的需求，我建议这个Skill包含以下功能模块：\n1. 图像预处理\n2. 风格迁移\n3. 质量评估',
      '配置已生成！你可以预览并调整参数，然后保存到个人库。'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    setChatMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
    setIsGenerating(false);
  }, [chatInput]);

  // 优化滚动 - 只在消息数量增加时滚动，且使用 auto 而非 smooth
  useEffect(() => {
    const currentCount = chatMessages.length;
    if (currentCount > prevMessageCountRef.current) {
      // 使用 requestAnimationFrame 延迟滚动，避免阻塞渲染
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
    prevMessageCountRef.current = currentCount;
  }, [chatMessages]);

  // 处理键盘事件
  const handleChatKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  }, [sendChatMessage]);

  return (
    <div className="skill-market-overlay" onClick={onClose}>
      <div
        className="skill-market-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="skill-market-header">
          <div className="header-left">
            <div className="market-icon">
              <Package size={24} />
            </div>
            <div className="market-info">
              <h3>Skill市场</h3>
              <span>发现、安装和创建智能Skill</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn upload" onClick={() => setShowUploadModal(true)}>
              <Upload size={16} />
              本地上传
            </button>
            <button className="action-btn create" onClick={() => setShowCreateChat(true)}>
              <Wand2 size={16} />
              对话创建
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="skill-market-body">
          {/* 左侧分类 */}
          <div className="market-sidebar">
            <div className="sidebar-section">
              <h4>来源</h4>
              <div className="tab-list">
                <button
                  className={`tab-item ${activeTab === 'official' ? 'active' : ''}`}
                  onClick={() => setActiveTab('official')}
                >
                  <Shield size={16} />
                  <span>官方</span>
                </button>
                <button
                  className={`tab-item ${activeTab === 'community' ? 'active' : ''}`}
                  onClick={() => setActiveTab('community')}
                >
                  <Users size={16} />
                  <span>个人</span>
                </button>
                <button
                  className={`tab-item ${activeTab === 'installed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('installed')}
                >
                  <Check size={16} />
                  <span>已安装</span>
                </button>
              </div>
            </div>

            <div className="sidebar-section">
              <h4>分类</h4>
              <div className="category-list">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <cat.icon size={14} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="market-content">
            {/* 搜索栏 */}
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="搜索Skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Skill列表 */}
            <div className="skills-grid">
              {filteredSkills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onToggleInstall={toggleInstall}
                />
              ))}
            </div>

            {filteredSkills.length === 0 && (
              <div className="empty-state">
                <Package size={48} />
                <p>没有找到匹配的Skill</p>
                <span>尝试其他搜索词或分类</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 上传模态框 - 使用 CSS 动画替代 Framer Motion */}
      {showUploadModal && (
        <div
          className="upload-overlay visible"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <Upload size={20} />
              <span>上传Skill</span>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="upload-area">
              <input
                type="file"
                accept=".json,.skill"
                onChange={handleFileUpload}
                id="skill-file"
                hidden
              />
              <label htmlFor="skill-file" className="upload-dropzone">
                <FolderOpen size={32} />
                <span>点击选择文件或拖拽到此处</span>
                <small>支持 .json, .skill 格式</small>
              </label>
              {uploadFile && (
                <div className="file-info">
                  <FileText size={16} />
                  <span>{uploadFile.name}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Skill名称</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="输入Skill名称"
              />
            </div>

            <div className="form-group">
              <label>描述</label>
              <textarea
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="描述这个Skill的功能..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                取消
              </button>
              <button
                className="btn-primary"
                onClick={submitUpload}
                disabled={!uploadFile || !uploadName.trim()}
              >
                上传
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 对话创建模态框 - 使用 CSS 动画替代 Framer Motion */}
      {showCreateChat && (
        <div
          className="chat-overlay visible"
          onClick={() => setShowCreateChat(false)}
        >
          <div
            className="chat-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-header">
              <div className="chat-title">
                <Bot size={20} />
                <span>Skill创建助手</span>
              </div>
              <button className="close-btn" onClick={() => setShowCreateChat(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="chat-messages" ref={chatMessagesRef}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="message-content">
                    <pre>{msg.content}</pre>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="chat-message assistant generating">
                  <div className="message-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="描述你想要的Skill功能..."
                disabled={isGenerating}
              />
              <button
                className="send-btn"
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isGenerating}
              >
                <Send size={16} />
              </button>
            </div>

            <div className="chat-hints">
              <span>试试:</span>
              <button onClick={() => setChatInput('创建一个自动翻译多语言的Skill')}>
                多语言翻译
              </button>
              <button onClick={() => setChatInput('创建一个分析视频情绪的Skill')}>
                视频情绪分析
              </button>
              <button onClick={() => setChatInput('创建一个生成3D模型的Skill')}>
                3D模型生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillMarket;
