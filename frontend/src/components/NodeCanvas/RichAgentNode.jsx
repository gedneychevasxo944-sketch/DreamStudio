import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StreamingText from '../common/StreamingText';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Image,
  MessageSquare,
  Play,
  Pause,
  Check,
  Loader2,
  Send,
  X,
  Plus,
  GripVertical,
  Target,
  PenTool,
  Palette,
  Video,
  Code,
  Sparkles,
  Shield,
  Bot,
  FileText,
  Layers,
  Zap,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  BookOpen,
  List,
  Scissors,
  Lock
} from 'lucide-react';
import './RichAgentNode.css';
import { VideoEditor } from '../VideoEditor';
import ChatConversation from '../ChatConversation';
import { parseScript } from '../../utils/scriptUtils';

// 图片预览弹窗组件
const ImagePreviewModal = ({ src, alt, isOpen, onClose }) => {
  if (!isOpen || !src) return null;

  return createPortal(
    <motion.div
      className="image-preview-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      <motion.div
        className="image-preview-content"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button className="image-preview-close" onClick={onClose}>
          <X size={24} />
        </button>
        <img
          src={src}
          alt={alt || '预览图片'}
          onLoad={() => {}}
          onError={(e) => {}}
        />
      </motion.div>
    </motion.div>,
    document.body
  );
};


const ICON_MAP = {
  Target: Target,
  PenTool: PenTool,
  Palette: Palette,
  Video: Video,
  Code: Code,
  Sparkles: Sparkles,
  Shield: Shield,
  Bot: Bot
};

const DEFAULT_ICON = Bot;

// 思考过程展开组件 - 纯文字格式，带滚动
const ThinkingExpanded = ({ thinking, thinkingIndex, onClose, isRunning }) => {
  // 将思考步骤合并为纯文字显示
  const displayText = thinking.slice(0, thinkingIndex).join('\n\n');
  const contentRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current && isRunning) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [thinkingIndex, isRunning]);

  return (
    <motion.div
      className="thinking-expanded"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      <div className="thinking-text-content" ref={contentRef} style={{
        maxHeight: '200px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {displayText}
        {isRunning && <span className="thinking-cursor">▊</span>}
      </div>
    </motion.div>
  );
};

// 对话修改区域组件（通用）
const ConversationSection = ({ messages, inputValue, setInputValue, onSend }) => {
  const conversationRef = useRef(null);
  
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue);
    setInputValue('');
  };

  return (
    <div className="conversation-section">
      <div className="section-header">
        <MessageSquare size={14} />
        <span>对话修改</span>
      </div>
      <div className="conversation-area" ref={conversationRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <span className="message-role">{msg.role === 'user' ? '我' : 'AI'}</span>
            <span className="message-content">{msg.content}</span>
          </div>
        ))}
        <div className="conversation-input">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入修改指令..."
          />
          <button onClick={handleSend}><Send size={14} /></button>
        </div>
      </div>
    </div>
  );
};

// 剧本详情弹窗组件
const ScriptDetailModal = ({ isOpen, script, onClose }) => {
  if (!isOpen || !script) return null;
  
  const { episodes, totalScenes } = parseScript(script);
  const [expandedEpisodes, setExpandedEpisodes] = useState(new Set([0]));
  const [expandedScenes, setExpandedScenes] = useState(new Set());
  
  const toggleEpisode = (epId) => {
    const newSet = new Set(expandedEpisodes);
    if (newSet.has(epId)) newSet.delete(epId);
    else newSet.add(epId);
    setExpandedEpisodes(newSet);
  };
  
  const toggleScene = (sceneId) => {
    const newSet = new Set(expandedScenes);
    if (newSet.has(sceneId)) newSet.delete(sceneId);
    else newSet.add(sceneId);
    setExpandedScenes(newSet);
  };
  
  return createPortal(
    <motion.div
      className="script-detail-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      <motion.div
        className="script-detail-modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="script-detail-header">
          <div className="script-detail-title">
            <BookOpen size={20} />
            <span>分场剧本详情</span>
          </div>
          <div className="script-detail-stats">
            共 {episodes.length} 集 · {totalScenes} 场
          </div>
          <button className="script-detail-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="script-detail-content">
          {episodes.map((episode) => (
            <div key={episode.id} className="episode-section">
              <div 
                className="episode-header"
                onClick={() => toggleEpisode(episode.id)}
              >
                <div className="episode-title-wrapper">
                  <span className="episode-title">{episode.title}</span>
                  <span className="episode-range">{episode.sceneRange}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`episode-chevron ${expandedEpisodes.has(episode.id) ? 'expanded' : ''}`}
                />
              </div>
              
              <AnimatePresence>
                {expandedEpisodes.has(episode.id) && (
                  <motion.div
                    className="episode-scenes"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {episode.scenes.map((scene) => (
                      <div key={scene.id} className="scene-detail-card">
                        <div 
                          className="scene-detail-header"
                          onClick={() => toggleScene(scene.id)}
                        >
                          <span className="scene-detail-title">{scene.title}</span>
                          <ChevronDown 
                            size={14} 
                            className={`scene-chevron ${expandedScenes.has(scene.id) ? 'expanded' : ''}`}
                          />
                        </div>
                        <AnimatePresence>
                          {expandedScenes.has(scene.id) && (
                            <motion.div
                              className="scene-detail-content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <div className="scene-description">{scene.content}</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

// 基础节点内容组件 - 抽取公共结构
const BaseNodeContent = ({ node, isRunning, onSelect, icon: Icon, statusLabel, resultPreview }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const hasResult = !!resultPreview;

  return (
    <div className="rich-node-content simple-node" onMouseDown={() => onSelect?.()}>
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          {Icon && <Icon size={16} />}
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? <><Loader2 className="spin" size={12} /> 生成中</> :
             node.data?.status === 'stale' ? <><AlertCircle size={12} /> 依赖失效</> :
             hasResult ? <><Check size={12} /> {statusLabel || '已完成'}</> : '待生成'}
          </span>
        </div>
      </div>
      {node.data?.status === 'stale' && node.data?.staleReason && (
        <div className="stale-indicator" title={node.data.staleReason}><AlertCircle size={12} /><span>{node.data.staleReason}</span></div>
      )}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div className="thinking-preview minimal" onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}>
          <Sparkles size={12} />
          <span className="thinking-text">{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '点击查看思考过程'}</span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}
      <AnimatePresence>{isThinkingExpanded && <ThinkingExpanded thinking={node.data.thinking} thinkingIndex={node.data.thinking.length} />}</AnimatePresence>
      {hasResult && <div className="result-preview-minimal">{resultPreview}</div>}
    </div>
  );
};

// 编剧节点内容
const WriterNodeContent = ({ node, isRunning, onSelect }) => {
  const { episodes, totalScenes } = parseScript(node.data?.result);
  return <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={PenTool} statusLabel="已完成" resultPreview={<><BookOpen size={12} /><span>{episodes.length}集 · {totalScenes}场戏</span></>} />;
};

// 美术节点内容
const VisualNodeContent = ({ node, isRunning, onSelect }) => {
  const c = node.data?.characters || [], s = node.data?.scenes || [], p = node.data?.props || [];
  const hasResult = c.length > 0 || s.length > 0 || p.length > 0;
  return <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={Palette} statusLabel={hasResult ? '已完成' : '待生成'} resultPreview={hasResult && <><Image size={12} /><span>{c.length}角色 · {s.length}场景 · {p.length}道具</span></>} />;
};

// 分镜导演节点内容
const DirectorNodeContent = ({ node, isRunning, onSelect }) => {
  const storyboards = node.data?.storyboards || [];
  return <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={Video} statusLabel={storyboards.length > 0 ? `${storyboards.length}个分镜` : '待生成'} resultPreview={storyboards.length > 0 && <><Video size={12} /><span>{storyboards.length}个分镜</span></>} />;
};

// 制片人节点内容
const ProducerNodeContent = ({ node, isRunning, onSelect }) => (
  <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={Target} statusLabel="已完成" resultPreview={<><FileText size={12} /><span>查看右侧工作区获取详情</span></>} />
);

// 技术节点内容
const TechnicalNodeContent = ({ node, isRunning, onSelect }) => {
  const prompts = node.data?.prompts || [];
  return <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={Code} statusLabel={prompts.length > 0 ? `${prompts.length}组提示词` : '待生成'} resultPreview={prompts.length > 0 && <><Zap size={12} /><span>{prompts.length}组提示词</span></>} />;
};

// 视频生成节点内容
const VideoGenNodeContent = ({ node, isRunning, onSelect }) => {
  const videos = node.data?.videos || [], videoPreview = node.data?.videoPreview, hasResult = videoPreview || videos.length > 0;
  return <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={Video} statusLabel="已完成" resultPreview={hasResult && <><Play size={12} /><span>{videos.length > 0 ? `${videos.length}个视频` : videoPreview ? '视频已生成' : '视频生成中'}</span></>} />;
};

// 视频剪辑节点内容
const VideoEditorNodeContent = ({ node, isRunning, onSelect }) => {
  const editedVideo = node.data?.editedVideo, hasResult = !!editedVideo;
  return <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={Scissors} statusLabel={hasResult ? '已完成' : '待剪辑'} resultPreview={hasResult && <><Video size={12} /><span>剪辑完成</span></>} />;
};

// 通用节点内容
const GenericNodeContent = ({ node, isRunning, onSelect }) => (
  <BaseNodeContent node={node} isRunning={isRunning} onSelect={onSelect} icon={Bot} statusLabel="就绪" />
);

// 主组件
const RichAgentNode = ({
  node,
  isSelected,
  isRunning,
  isDimmed = false,
  onSelect,
  onDelete,
  onUpdatePosition,
  onUpdateData,
  onStartConnection,
  onCompleteConnection,
  isConnecting,
  connectingFrom,
  onBringToFront,
  onDimensionChange,
  onAddNode,
  availableAgents,
  onPortPositionChange,
  onGenerateVideoNodes,
  scale = 1,
  projectId,
  projectVersion,
  isDemoMode = false
}) => {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const menuRef = useRef(null);
  const portDragState = useRef({ isDown: false, hasMoved: false });
  const inputPortRef = useRef(null);
  const outputPortRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 获取节点默认宽度 - 极简版改为280px
  const getDefaultWidth = useCallback(() => {
    return 280;
  }, [node.type]);

  // 获取当前节点宽度（优先使用node.data中的width，否则使用默认值）
  const getNodeWidth = useCallback(() => {
    return node.data?.width || getDefaultWidth();
  }, [node.data?.width, getDefaultWidth]);

  // 报告端口位置变化 - 根据实际节点宽度动态计算
  const updatePortPositions = useCallback(() => {
    if (!onPortPositionChange) return;
    const width = getNodeWidth();
    // 输入端口在节点左侧边缘（x = node.x）
    // 输出端口在节点右侧边缘（x = node.x + width）
    onPortPositionChange(node.id, 'input', { x: node.x, y: node.y + 20 });
    onPortPositionChange(node.id, 'output', { x: node.x + width, y: node.y + 20 });
  }, [node.id, node.x, node.y, getNodeWidth, onPortPositionChange]);

  // 初始化和节点位置/宽度变化时更新端口位置
  useEffect(() => {
    updatePortPositions();
  }, [node.id, node.x, node.y, getNodeWidth, updatePortPositions]);

  useEffect(() => {
    if (isRunning && onBringToFront) {
      onBringToFront(node.id);
    }
  }, [isRunning, node.id, onBringToFront]);

  // 报告节点尺寸变化
  useEffect(() => {
    if (nodeRef.current && onDimensionChange) {
      const updateDimensions = () => {
        if (nodeRef.current) {
          const rect = nodeRef.current.getBoundingClientRect();
          onDimensionChange(node.id, rect.width, rect.height);
        }
      };

      updateDimensions();

      // 监听尺寸变化
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(nodeRef.current);

      return () => resizeObserver.disconnect();
    }
  }, [node.id, onDimensionChange]);

  // 点击外部关闭智能体菜单
  useEffect(() => {
    if (!showAgentMenu) return;

    const handleClickOutside = (e) => {
      // 检查点击是否在菜单内，不在则关闭
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAgentMenu(false);
      }
    };

    // 延迟添加监听，避免打开菜单时立即触发关闭
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAgentMenu]);

  const handleMouseDown = (e) => {
    // 检查是否点击了调整大小手柄
    const isResizeHandle = e.target.closest('.resize-handle');
    if (isResizeHandle) {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: getNodeWidth(),
        height: nodeRef.current?.getBoundingClientRect().height || 200
      });
      onSelect?.();
      return;
    }

    // 检查点击位置
    const isHeader = e.target.closest('.content-header');
    const isHandle = e.target.closest('.node-drag-handle');
    const isPort = e.target.closest('.port');
    const isButton = e.target.closest('button');
    const isThinking = e.target.closest('.thinking-preview');
    const isResultPreview = e.target.closest('.result-preview-minimal');
    const isInteractive = e.target.closest('textarea') || e.target.closest('input') || e.target.closest('.expanded-section');

    // 点击思考气泡或结果预览 -> 不阻止事件，让它们的 onClick 处理
    if (isThinking || isResultPreview) {
      onSelect?.();
      return; // 不 stopPropagation，让事件继续传递
    }

    // 只有点击头部或手柄才拖动
    if (!isHeader && !isHandle) {
      // 其他区域点击也选中节点
      onSelect?.();
      return;
    }
    if (isPort || isButton || isInteractive) return;

    e.stopPropagation();
    setIsDragging(true);
    // 记录拖动开始时的鼠标位置，用于检测是否是点击
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const rect = nodeRef.current.getBoundingClientRect();
    // 计算相对于 canvas 的未缩放位置
    const canvas = nodeRef.current.parentElement;
    const canvasRect = canvas.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - canvasRect.left) / scale - node.x,
      y: (e.clientY - canvasRect.top) / scale - node.y
    });
    onSelect?.();
  };

  const handleMouseMove = (e) => {
    // 处理调整大小
    if (isResizing) {
      const deltaX = (e.clientX - resizeStart.x) / scale;
      const deltaY = (e.clientY - resizeStart.y) / scale;

      // 计算新尺寸，设置最小值限制
      const minWidth = 280;
      const minHeight = 120;
      const newWidth = Math.max(minWidth, resizeStart.width + deltaX);
      const newHeight = Math.max(minHeight, resizeStart.height + deltaY);

      // 更新节点数据中的尺寸
      onUpdateData?.(node.id, { width: newWidth, height: newHeight });

      // 实时更新端口位置
      if (onPortPositionChange) {
        // 输出端口中心在节点右边缘: node.x + newWidth
        onPortPositionChange(node.id, 'output', { x: node.x + newWidth, y: node.y + 20 });
      }
      return;
    }

    // 处理拖动
    if (!isDragging) return;

    const canvas = nodeRef.current?.parentElement;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    // 将鼠标位置转换为未缩放的坐标
    const newX = (e.clientX - canvasRect.left) / scale - dragOffset.x;
    const newY = (e.clientY - canvasRect.top) / scale - dragOffset.y;

    // 实时更新端口位置
    if (onPortPositionChange) {
      const width = getNodeWidth();
      // 输入端口中心在节点左边缘: newX
      // 输出端口中心在节点右边缘: newX + width
      onPortPositionChange(node.id, 'input', { x: newX, y: newY + 20 });
      onPortPositionChange(node.id, 'output', { x: newX + width, y: newY + 20 });
    }

    onUpdatePosition?.(node.id, Math.max(0, newX), Math.max(0, newY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const handleOutputPortMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    portDragState.current = { isDown: true, hasMoved: false };
    // 拖拽开始连线
    onStartConnection?.(node.id, 'output');
  };

  const handleOutputPortMouseMove = (e) => {
    if (portDragState.current.isDown) {
      portDragState.current.hasMoved = true;
    }
  };

  const handleOutputPortMouseUp = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (portDragState.current.isDown) {
      if (!portDragState.current.hasMoved) {
        // 没有移动，是点击，显示添加智能体菜单
        setShowAgentMenu(true);
        // 取消连线状态
        if (isConnecting) {
          window.dispatchEvent(new CustomEvent('cancelConnection'));
        }
      }
      portDragState.current = { isDown: false, hasMoved: false };
    }
  };

  const handleSelectAgent = (agentType) => {
    setShowAgentMenu(false);
    if (onAddNode) {
      onAddNode(node.id, agentType);
    }
  };

  const handleInputPortMouseUp = (e) => {
    e.stopPropagation();
    if (isConnecting && connectingFrom && connectingFrom.nodeId !== node.id) {
      onCompleteConnection?.(node.id, 'input');
    }
  };

  const handleUpdateContent = (data) => {
    onUpdateData?.(node.id, data);
  };

  // 检测是否是拖动操作（移动超过5px认为是拖动）
  const isDragOperation = () => {
    if (!dragStartPos.current) return false;
    // 这里不需要实际计算，因为我们在 handleMouseUp 中会处理
    return false;
  };

  const renderContent = () => {
    const contentProps = useMemo(() => ({
      node,
      isRunning,
      onSelect,
      onUpdateContent: handleUpdateContent,
      onExpand: onBringToFront ? () => onBringToFront(node.id) : undefined,
      isDragging: isDragging || isResizing,
      projectId,
      projectVersion
    }), [node, isRunning, onSelect, handleUpdateContent, onBringToFront, isDragging, isResizing, projectId, projectVersion]);

  switch (node.type) {
      case 'producer':
        return <ProducerNodeContent {...contentProps} />;
      case 'content':
        return <WriterNodeContent {...contentProps} />;
      case 'visual':
        return <VisualNodeContent {...contentProps} />;
      case 'director':
        return <DirectorNodeContent {...contentProps} />;
      case 'technical':
        return <TechnicalNodeContent {...contentProps} onGenerateVideoNodes={onGenerateVideoNodes} />;
      case 'videoGen':
        return <VideoGenNodeContent {...contentProps} />;
      case 'videoEditor':
        return <VideoEditorNodeContent {...contentProps} />;
      default:
        return <GenericNodeContent {...contentProps} />;
    }
  };

  // 获取当前节点宽度
  const nodeWidth = getNodeWidth();

  // 检查是否锁定
  const isLocked = node.data?.isLocked || false;

  return (
    <motion.div
      ref={nodeRef}
      className={`rich-agent-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${node.status || 'idle'} ${isRunning ? 'running' : ''} ${node.data?.status === 'stale' ? 'stale' : ''} ${isLocked ? 'locked' : ''} ${isDimmed ? 'dimmed' : ''}`}
      style={{
        left: node.x,
        top: node.y,
        width: nodeWidth,
        '--node-color': node.color,
        zIndex: isRunning ? 1000 : (isSelected ? 100 : 1)
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onMouseDown={handleMouseDown}
    >
      {/* 锁定状态指示器 */}
      {isLocked && (
        <div className="lock-indicator" title="节点已锁定">
          <Lock size={12} />
        </div>
      )}

      {!isDemoMode && !isLocked && (
        <>
          <div className="node-drag-handle">
            <GripVertical size={12} />
          </div>

          <button className="node-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
            <X size={12} />
          </button>

          {/* 调整大小手柄 */}
          <div className="resize-handle" title="拖拽调整大小">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path
                d="M8 8L12 12M5 11L11 5M2 10L10 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </>
      )}

      {/* 端口固定在头部区域（中心在 26px 处）- Demo模式或锁定状态下禁用 */}
      {!isDemoMode && !isLocked && (
        <>
          <div className="port input-port" ref={inputPortRef} onMouseUp={handleInputPortMouseUp}>
            <div className="port-dot" />
          </div>

          <div
            className="port output-port"
            ref={outputPortRef}
            onMouseDown={handleOutputPortMouseDown}
            onMouseMove={handleOutputPortMouseMove}
            onMouseUp={handleOutputPortMouseUp}
          >
            <div className="port-dot" />
          </div>
        </>
      )}

      {/* 智能体选择菜单 */}
      <AnimatePresence>
        {showAgentMenu && (
          <motion.div
            ref={menuRef}
            className="agent-menu"
            style={{
              left: '100%',
              top: 0,
              marginLeft: '12px'
            }}
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="agent-menu-header">
              <Plus size={14} />
              <span>添加智能体</span>
            </div>
            <div className="agent-menu-list">
              {availableAgents?.map((agent) => {
                const AgentIcon = ICON_MAP[agent.icon] || Target;
                return (
                  <button
                    key={agent.id}
                    className="agent-menu-item"
                    onClick={() => handleSelectAgent(agent.id)}
                  >
                    <div
                      className="agent-menu-icon"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      <AgentIcon size={16} style={{ color: agent.color }} />
                    </div>
                    <span className="agent-menu-name">{agent.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderContent()}

      {isRunning && (
        <div className="running-indicator">
          <Loader2 className="spin" size={14} />
        </div>
      )}
    </motion.div>
  );
};

export default RichAgentNode;