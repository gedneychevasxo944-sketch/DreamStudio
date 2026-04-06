import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  PenTool,
  Palette,
  Video,
  Code,
  Sparkles,
  Shield,
  X,
  Search,
  Star,
  User,
  Plus,
  Loader2,
  Bot,
  Play,
  Scissors
} from 'lucide-react';
import './AgentLibrary.css';

const ICON_MAP = {
  Target,
  PenTool,
  Palette,
  Video,
  Code,
  Sparkles,
  Shield,
  Bot,
  Play,
  Scissors
};

const AgentLibrary = ({ agents, onDragAgent, onClose, loading = false }) => {
  const [activeTab, setActiveTab] = useState('official'); // 'official' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedAgent, setDraggedAgent] = useState(null);
  const libraryRef = useRef(null);

  // 点击外部关闭 - 使用 setTimeout 避免动画期间事件问题
  useEffect(() => {
    const handleClickOutside = (e) => {
      // 延迟关闭，确保动画完成
      setTimeout(() => {
        if (libraryRef.current && !libraryRef.current.contains(e.target)) {
          onClose();
        }
      }, 100);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 过滤智能体
  const filteredAgents = Object.values(agents).filter(agent => {
    const matchesTab = activeTab === 'official'
      ? agent.category === '官方认证'
      : agent.category === '我的私有';
    const matchesSearch = (agent.agentName || agent.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (agent.agentId || agent.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // 处理拖拽开始
  const handleDragStart = (e, agentType) => {
    setDraggedAgent(agentType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('agentType', agentType);
  };

  // 处理拖拽结束
  const handleDragEnd = (e) => {
    if (draggedAgent) {
      // 计算放置位置（相对于画布）
      const rect = e.target.closest('.agent-library')?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX;
        const y = e.clientY;
        onDragAgent(draggedAgent, x, y);
      }
      setDraggedAgent(null);
    }
  };

  // 点击添加（备用方案）
  const handleClickAdd = (agentType) => {
    // 默认添加到画布可见区域中心，间距200px
    onDragAgent(agentType, 300, 250);
  };

  return (
    <motion.div 
      ref={libraryRef}
      className="agent-library"
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* 头部 */}
      <div className="library-header">
        <div className="library-title">
          <Sparkles size={18} className="title-icon" />
          <span>智能体库</span>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="library-search">
        <Search size={14} className="search-icon" />
        <input 
          type="text" 
          placeholder="搜索智能体..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 标签切换 */}
      <div className="library-tabs">
        <button 
          className={`tab ${activeTab === 'official' ? 'active' : ''}`}
          onClick={() => setActiveTab('official')}
        >
          <Star size={14} />
          <span>官方认证</span>
        </button>
        <button 
          className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <User size={14} />
          <span>我的私有</span>
        </button>
      </div>

      {/* 智能体列表 */}
      <div className="agents-list">
        {loading ? (
          <div className="empty-state">
            <Loader2 size={32} className="empty-icon spinning" />
            <p>加载智能体中...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="empty-state">
            {activeTab === 'custom' ? (
              <>
                <User size={32} className="empty-icon" />
                <p>暂无自定义智能体</p>
                <button className="create-agent-btn">
                  <Plus size={14} />
                  <span>创建智能体</span>
                </button>
              </>
            ) : (
              <>
                <Search size={32} className="empty-icon" />
                <p>未找到匹配的智能体</p>
              </>
            )}
          </div>
        ) : (
          filteredAgents.map((agent) => {
            // 将后端图标枚举值映射到前端图标组件名
            const iconNameMap = {
              'PRODUCER': 'Target',
              'CONTENT': 'PenTool',
              'VISUAL': 'Palette',
              'DIRECTOR': 'Video',
              'TECHNICAL': 'Code',
              'VIDEO_GEN': 'Play',
              'VIDEO_EDITOR': 'Scissors',
            };
            const frontendIconName = iconNameMap[agent.icon] || agent.icon || 'Target';
            const IconComponent = ICON_MAP[frontendIconName] || Target;
            // 使用 agentCode 作为唯一标识（与 NodeCanvas.agentTypes 的 key 对应）
            const agentKey = agent.agentCode || agent.type;
            return (
              <motion.div
                key={agentKey}
                className="agent-item"
                draggable
                onDragStart={(e) => handleDragStart(e, agentKey)}
                onDragEnd={handleDragEnd}
                onClick={() => handleClickAdd(agentKey)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div 
                  className="agent-item-icon"
                  style={{ backgroundColor: `${agent.color}20` }}
                >
                  <IconComponent size={20} style={{ color: agent.color }} />
                </div>
                <div className="agent-item-info">
                  <span className="agent-item-name">{agent.agentName || agent.name}</span>
                  <span className="agent-item-type">{agent.agentId || agent.id}</span>
                </div>
                <div className="agent-item-ports">
                  <div className="port-hint in" title={`${agent.inputs?.length || 0} 输入`}>
                    <div className="dot" />
                    <span>{agent.inputs?.length || 0}</span>
                  </div>
                  <div className="port-hint out" title={`${agent.outputs?.length || 0} 输出`}>
                    <span>{agent.outputs?.length || 0}</span>
                    <div className="dot" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 底部提示 */}
      <div className="library-footer">
        <p>拖拽智能体到画布，或点击添加</p>
      </div>
    </motion.div>
  );
};

export default AgentLibrary;
