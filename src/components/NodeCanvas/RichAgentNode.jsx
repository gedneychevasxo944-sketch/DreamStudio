import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit3,
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
  Scissors
} from 'lucide-react';
import './RichAgentNode.css';
import { VideoEditor } from '../VideoEditor';
import ChatConversation from '../ChatConversation';

// 图片预览弹窗组件
const ImagePreviewModal = ({ src, alt, isOpen, onClose }) => {
  console.log('[ImagePreviewModal] isOpen:', isOpen, 'src:', src, 'alt:', alt);
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
          onLoad={() => console.log('[ImagePreviewModal] image loaded:', src)}
          onError={(e) => console.log('[ImagePreviewModal] image error:', src, e)}
        />
      </motion.div>
    </motion.div>,
    document.body
  );
};

// 流式文本组件
const StreamingText = ({ text, isStreaming }) => {
  const [displayText, setDisplayText] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayText(text);
      return;
    }

    indexRef.current = 0;
    setDisplayText('');

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText(prev => prev + text[indexRef.current]);
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, isStreaming]);

  return (
    <span className={isStreaming ? 'result-streaming' : ''}>
      {displayText}
    </span>
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

// 剧本解析函数 - 支持集数-场景层级
const parseScript = (script) => {
  if (!script) return { episodes: [], totalScenes: 0 };
  
  // 尝试匹配集数格式：第X集、Episode X等
  const episodeRegex = /(第[一二三四五六七八九十百千]+集|第\d+集|Episode\s*\d+|集\s*\d+)[：:\s]*\n?/gi;
  const sceneRegex = /(场景[一二三四五六七八九十百千]+|第[一二三四五六七八九十百千]+场|场景\s*\d+|第\d+场)[：:\s-]*/gi;
  
  const episodes = [];
  let currentEpisode = null;
  let episodeCounter = 0;
  
  // 先按集数分割
  const episodeParts = script.split(episodeRegex);
  
  if (episodeParts.length <= 1) {
    // 没有集数，只有场景
    const scenes = [];
    const sceneParts = script.split(sceneRegex);
    
    sceneParts.forEach((part, index) => {
      if (part.match(sceneRegex)) {
        scenes.push({
          id: index,
          title: part.trim(),
          content: sceneParts[index + 1] ? sceneParts[index + 1].trim() : ''
        });
      }
    });
    
    if (scenes.length === 0 && script.trim()) {
      scenes.push({ id: 0, title: '完整剧本', content: script.trim() });
    }
    
    return {
      episodes: [{ id: 0, title: '第1集', scenes, sceneRange: `第1-${scenes.length}场` }],
      totalScenes: scenes.length
    };
  }
  
  // 有集数的情况
  episodeParts.forEach((part, index) => {
    if (part.match(episodeRegex)) {
      episodeCounter++;
      currentEpisode = {
        id: episodeCounter - 1,
        title: part.trim(),
        scenes: [],
        sceneRange: ''
      };
      
      // 解析该集内的场景
      const sceneContent = episodeParts[index + 1] || '';
      const sceneParts = sceneContent.split(sceneRegex);
      let sceneCounter = 0;
      
      sceneParts.forEach((scenePart, sceneIndex) => {
        if (scenePart.match(sceneRegex)) {
          sceneCounter++;
          currentEpisode.scenes.push({
            id: `${episodeCounter - 1}-${sceneCounter - 1}`,
            title: scenePart.trim(),
            content: sceneParts[sceneIndex + 1] ? sceneParts[sceneIndex + 1].trim().split(/\n{2,}/)[0] : ''
          });
        }
      });
      
      if (currentEpisode.scenes.length > 0) {
        currentEpisode.sceneRange = `第1-${currentEpisode.scenes.length}场`;
      }
      
      episodes.push(currentEpisode);
    }
  });
  
  const totalScenes = episodes.reduce((sum, ep) => sum + ep.scenes.length, 0);
  
  return { episodes, totalScenes };
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

// 编剧节点内容 - 概览 + 弹窗详情模式
const WriterNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const prevRunningRef = useRef(false);

  // 解析剧本
  const { episodes, totalScenes } = parseScript(node.data?.result);

  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      setIsExpanded(true);
      onExpand?.();
    }
    prevRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (node.data?.result) {
      setHasResult(true);
    }
  }, [node.data?.result]);

  // 监听外部传入的展开状态
  useEffect(() => {
    if (node.data?.isThinkingExpanded) {
      setIsThinkingExpanded(true);
    }
  }, [node.data?.isThinkingExpanded]);

  // 思考内容自动收起：当有结果时收起思考内容
  // 暂时注释掉，避免 React 警告
  // useEffect(() => {
  //   if (node.data?.result && node.data?.thinking?.length > 0) {
  //     setIsThinkingExpanded(false);
  //   }
  // }, [node.data?.result, node.data?.thinking]);

  // 监听外部传入的结果展开状态
  useEffect(() => {
    if (node.data?.isResultExpanded) {
      setIsExpanded(true);
      onExpand?.();
    }
  }, [node.data?.isResultExpanded]);

  const handleMessagesChange = useCallback((newMessages) => {
    console.log('[RichAgentNode] handleMessagesChange called, type:', typeof newMessages);
    // ChatConversation 可能传函数（函数式更新）或数组
    // 需要判断处理
    if (typeof newMessages === 'function') {
      console.log('[RichAgentNode] handleMessagesChange - received a function, using messagesRef');
      // 如果是函数，用 messagesRef 而非 node.data.messages 来解析（避免 stale closure）
      const resolvedMessages = newMessages(messagesRef.current);
      console.log('[RichAgentNode] handleMessagesChange - resolved messages:', resolvedMessages);
      // 更新 ref
      messagesRef.current = resolvedMessages;
      onUpdateContent?.({ ...node.data, messages: resolvedMessages });
    } else {
      console.log('[RichAgentNode] handleMessagesChange - received array:', newMessages);
      // 更新 ref
      messagesRef.current = newMessages;
      onUpdateContent?.({ ...node.data, messages: newMessages });
    }
  }, [node.data, onUpdateContent]);

  const handleToggleExpand = (e) => {
    if (isParentDragging) return;
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className="rich-node-content writer-node">
        {/* 头部 */}
        <div className="content-header" onClick={handleToggleExpand}>
          <div className="content-icon" style={{ backgroundColor: node.color }}>
            <PenTool size={20} />
          </div>
          <div className="content-info">
            <span className="content-title">{node.name}</span>
            <span className="content-status">
              {isRunning ? (
                <><Loader2 className="spin" size={12} /> 生成中...</>
              ) : hasResult ? (
                <><Check size={12} /> 已完成</>
              ) : (
                '待生成'
              )}
            </span>
          </div>
          <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* 思考过程区域 */}
        {node.data?.thinking && node.data.thinking.length > 0 && (
          <>
            <div
              className="thinking-preview"
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
              style={{ cursor: 'pointer' }}
            >
              <Sparkles size={12} />
              <span>{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '思考过程'}</span>
              {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
            </div>
            <AnimatePresence>
              {isThinkingExpanded && (
                <ThinkingExpanded
                  thinking={node.data.thinking}
                  thinkingIndex={node.data.thinking.length}
                />
              )}
            </AnimatePresence>
          </>
        )}

        {/* 展开内容 - 只显示概览 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="content-expanded writer-expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {/* 剧本概览 */}
              <div className="script-overview-section">
                <div className="section-header">
                  <div className="section-header-left">
                    <List size={14} />
                    <span>分场剧本概览</span>
                  </div>
                </div>

                {episodes.length === 0 ? (
                  <div className="script-overview-empty">
                    {isRunning ? '正在生成剧本...' : '暂无剧本内容'}
                  </div>
                ) : (
                  <div className="script-overview-content">
                    <div className="script-summary-text">
                      <div className="summary-line">故事概要：共{episodes.length}集，{totalScenes}场戏</div>
                      <div className="summary-line">集数范围：第1集-第{episodes.length}集</div>
                    </div>

                    <button
                      className="view-detail-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetailModal(true);
                      }}
                    >
                      <BookOpen size={14} />
                      查看完整剧本详情
                    </button>
                  </div>
                )}
              </div>

              {/* 对话区域 */}
              <div className="chat-section" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
                <ChatConversation
                  agentId={node.type}
                  projectId={1}
                  projectVersion={1}
                  messages={node.data?.messages || []}
                  onMessagesChange={handleMessagesChange}
                  placeholder="输入消息..."
                  disabledPlaceholder="生成完成后可对话"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 剧本详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && (
          <ScriptDetailModal
            isOpen={showDetailModal}
            script={node.data?.result}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// 美术节点内容（概念美术总监）- 按照手绘图布局
const VisualNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const clickStartPos = useRef({ x: 0, y: 0 });
  const prevRunningRef = useRef(false);

  // 图片预览状态
  const [previewImage, setPreviewImage] = useState(null);

  // 数据状态 - 默认为空，需要执行后才能生成
  const [overallStyle, setOverallStyle] = useState(node.data?.overallStyle || '');
  const [characters, setCharacters] = useState(node.data?.characters || []);
  const [scenes, setScenes] = useState(node.data?.scenes || []);
  const [props, setProps] = useState(node.data?.props || []);

  // 处理图片点击预览
  const handleImageClick = (src, alt) => {
    setPreviewImage({ src, alt });
  };

  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      setIsExpanded(true);
      onExpand?.();
    }
    prevRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    // 同步 node.data 数据到本地状态
    if (node.data?.overallStyle !== undefined) {
      setOverallStyle(node.data.overallStyle);
    }
    if (node.data?.characters !== undefined) {
      setCharacters(node.data.characters);
    }
    if (node.data?.scenes !== undefined) {
      setScenes(node.data.scenes);
    }
    if (node.data?.props !== undefined) {
      setProps(node.data.props);
    }
    // 有数据时设置 hasResult
    if (node.data?.overallStyle || node.data?.characters?.length > 0 || node.data?.scenes?.length > 0) {
      setHasResult(true);
    }
  }, [node.data]);

  // 监听外部传入的展开状态
  useEffect(() => {
    if (node.data?.isThinkingExpanded) {
      setIsThinkingExpanded(true);
    }
  }, [node.data?.isThinkingExpanded]);

  // 思考内容自动收起：当有结果时收起思考内容
  // 暂时注释掉，避免 React 警告
  // useEffect(() => {
  //   if (node.data?.result && node.data?.thinking?.length > 0) {
  //     setIsThinkingExpanded(false);
  //   }
  // }, [node.data?.result, node.data?.thinking]);

  // 监听外部传入的结果展开状态
  useEffect(() => {
    if (node.data?.isResultExpanded) {
      setIsExpanded(true);
      onExpand?.();
    }
  }, [node.data?.isResultExpanded]);

  // 初始化时将本地数据同步到 node.data
  useEffect(() => {
    if (characters.length > 0 || scenes.length > 0 || props.length > 0) {
      onUpdateContent?.({
        ...node.data,
        characters,
        scenes,
        props,
        hasResult: true
      });
    }
  }, []);

  const handleMessagesChange = useCallback((newMessages) => {
    console.log('[RichAgentNode] handleMessagesChange called, type:', typeof newMessages);
    // ChatConversation 可能传函数（函数式更新）或数组
    // 需要判断处理
    if (typeof newMessages === 'function') {
      console.log('[RichAgentNode] handleMessagesChange - received a function, using messagesRef');
      // 如果是函数，用 messagesRef 而非 node.data.messages 来解析（避免 stale closure）
      const resolvedMessages = newMessages(messagesRef.current);
      console.log('[RichAgentNode] handleMessagesChange - resolved messages:', resolvedMessages);
      // 更新 ref
      messagesRef.current = resolvedMessages;
      onUpdateContent?.({ ...node.data, messages: resolvedMessages });
    } else {
      console.log('[RichAgentNode] handleMessagesChange - received array:', newMessages);
      // 更新 ref
      messagesRef.current = newMessages;
      onUpdateContent?.({ ...node.data, messages: newMessages });
    }
  }, [node.data, onUpdateContent]);

  const handleMouseDown = (e) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleToggleExpand = (e) => {
    // 检测是否是拖动操作（移动超过5px认为是拖动）
    if (clickStartPos.current) {
      const dx = Math.abs(e.clientX - clickStartPos.current.x);
      const dy = Math.abs(e.clientY - clickStartPos.current.y);
      if (dx > 5 || dy > 5) {
        return; // 是拖动操作，不展开/收起
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleCharacterChange = (id, field, value) => {
    const newCharacters = characters.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setCharacters(newCharacters);
    onUpdateContent?.({ ...node.data, characters: newCharacters });
  };

  const handleSceneChange = (id, field, value) => {
    const newScenes = scenes.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setScenes(newScenes);
    onUpdateContent?.({ ...node.data, scenes: newScenes });
  };

  const handlePropChange = (id, field, value) => {
    const newProps = props.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setProps(newProps);
    onUpdateContent?.({ ...node.data, props: newProps });
  };

  return (
    <div className="rich-node-content visual-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header" onClick={handleToggleExpand}>
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Palette size={20} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中...</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 思考过程区域 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '思考过程'}</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={node.data.thinking}
                thinkingIndex={node.data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="content-expanded visual-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* 整体风格 */}
            <div className="visual-section">
              <div className="section-header">
                <Palette size={14} />
                <span>整体风格</span>
              </div>
              <textarea
                className="visual-textarea"
                value={overallStyle}
                onChange={(e) => {
                  setOverallStyle(e.target.value);
                  onUpdateContent?.({ ...node.data, overallStyle: e.target.value });
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder={isRunning ? '正在生成...' : '描述整体美术风格...'}
                readOnly={isRunning}
              />
            </div>

            {/* 角色表格 */}
            <div className="visual-section">
              <div className="section-header">
                <Users size={14} />
                <span>角色</span>
              </div>
              <div className="character-table">
                <div className="character-table-header">
                  <span>姓名</span>
                  <span>描述</span>
                  <span>缩略图</span>
                </div>
                {characters.map((char) => (
                  <div key={char.id} className="character-table-row">
                    <input
                      value={char.name}
                      onChange={(e) => handleCharacterChange(char.id, 'name', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="角色名"
                      readOnly={isRunning}
                    />
                    <input
                      value={char.description}
                      onChange={(e) => handleCharacterChange(char.id, 'description', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="角色描述"
                      readOnly={isRunning}
                    />
                    <div className="character-thumbnail" onClick={() => handleImageClick(char.thumbnail, char.name)}>
                      <img src={char.thumbnail} alt={char.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 场景表格 */}
            <div className="visual-section">
              <div className="section-header">
                <Image size={14} />
                <span>场景</span>
              </div>
              <div className="character-table">
                <div className="character-table-header">
                  <span>名称</span>
                  <span>描述</span>
                  <span>缩略图</span>
                </div>
                {scenes.map((scene) => (
                  <div key={scene.id} className="character-table-row">
                    <input
                      value={scene.name}
                      onChange={(e) => handleSceneChange(scene.id, 'name', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="场景名称"
                      readOnly={isRunning}
                    />
                    <input
                      value={scene.description}
                      onChange={(e) => handleSceneChange(scene.id, 'description', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="场景描述"
                      readOnly={isRunning}
                    />
                    <div className="character-thumbnail" onClick={() => handleImageClick(scene.thumbnail, scene.name)}>
                      <img src={scene.thumbnail} alt={scene.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 物品表格 */}
            <div className="visual-section">
              <div className="section-header">
                <Layers size={14} />
                <span>物品</span>
              </div>
              <div className="character-table">
                <div className="character-table-header">
                  <span>名称</span>
                  <span>描述</span>
                  <span>缩略图</span>
                </div>
                {props.map((prop) => (
                  <div key={prop.id} className="character-table-row">
                    <input
                      value={prop.name}
                      onChange={(e) => handlePropChange(prop.id, 'name', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="物品名称"
                      readOnly={isRunning}
                    />
                    <input
                      value={prop.description}
                      onChange={(e) => handlePropChange(prop.id, 'description', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="物品描述"
                      readOnly={isRunning}
                    />
                    <div className="character-thumbnail" onClick={() => handleImageClick(prop.thumbnail, prop.name)}>
                      <img src={prop.thumbnail} alt={prop.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 图片预览弹窗 */}
            <ImagePreviewModal
              src={previewImage?.src}
              alt={previewImage?.alt}
              isOpen={!!previewImage}
              onClose={handleClosePreview}
            />

            {/* 对话区域 */}
            <div className="chat-section" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
              <ChatConversation
                agentId={node.type}
                projectId={1}
                projectVersion={1}
                messages={node.data?.messages || []}
                onMessagesChange={handleMessagesChange}
                placeholder="输入消息..."
                disabledPlaceholder="生成完成后可对话"
                inputMode="input"
                disableAutoScroll={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 分镜导演节点内容 - 按照手绘图布局
const DirectorNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const clickStartPos = useRef({ x: 0, y: 0 });
  const prevRunningRef = useRef(false);

  // 图片预览状态
  const [previewImage, setPreviewImage] = useState(null);

  // 分镜数据状态 - 默认为空，需要执行后才能生成
  const [storyboards, setStoryboards] = useState(node.data?.storyboards || []);

  // 处理图片点击预览
  const handleImageClick = (src, alt) => {
    console.log('[DirectorNode] handleImageClick:', src, alt);
    setPreviewImage({ src, alt });
  };

  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      setIsExpanded(true);
      onExpand?.();
    }
    prevRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    // 模拟有结果数据
    if (node.data?.storyboards && node.data.storyboards.length > 0) {
      setStoryboards(node.data.storyboards);
      setHasResult(true);
    }
  }, [node.data]);

  // 监听外部传入的展开状态
  useEffect(() => {
    if (node.data?.isThinkingExpanded) {
      setIsThinkingExpanded(true);
    }
  }, [node.data?.isThinkingExpanded]);

  // 思考内容自动收起：当有结果时收起思考内容
  // 暂时注释掉，避免 React 警告
  // useEffect(() => {
  //   if (node.data?.result && node.data?.thinking?.length > 0) {
  //     setIsThinkingExpanded(false);
  //   }
  // }, [node.data?.result, node.data?.thinking]);

  // 监听外部传入的结果展开状态
  useEffect(() => {
    if (node.data?.isResultExpanded) {
      setIsExpanded(true);
      onExpand?.();
    }
  }, [node.data?.isResultExpanded]);

  const handleMessagesChange = useCallback((newMessages) => {
    console.log('[RichAgentNode] handleMessagesChange called, type:', typeof newMessages);
    // ChatConversation 可能传函数（函数式更新）或数组
    // 需要判断处理
    if (typeof newMessages === 'function') {
      console.log('[RichAgentNode] handleMessagesChange - received a function, using messagesRef');
      // 如果是函数，用 messagesRef 而非 node.data.messages 来解析（避免 stale closure）
      const resolvedMessages = newMessages(messagesRef.current);
      console.log('[RichAgentNode] handleMessagesChange - resolved messages:', resolvedMessages);
      // 更新 ref
      messagesRef.current = resolvedMessages;
      onUpdateContent?.({ ...node.data, messages: resolvedMessages });
    } else {
      console.log('[RichAgentNode] handleMessagesChange - received array:', newMessages);
      // 更新 ref
      messagesRef.current = newMessages;
      onUpdateContent?.({ ...node.data, messages: newMessages });
    }
  }, [node.data, onUpdateContent]);

  const handleMouseDown = (e) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleToggleExpand = (e) => {
    // 检测是否是拖动操作（移动超过5px认为是拖动）
    if (clickStartPos.current) {
      const dx = Math.abs(e.clientX - clickStartPos.current.x);
      const dy = Math.abs(e.clientY - clickStartPos.current.y);
      if (dx > 5 || dy > 5) {
        return; // 是拖动操作，不展开/收起
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleStoryboardChange = (id, field, value) => {
    const newStoryboards = storyboards.map(sb =>
      sb.id === id ? { ...sb, [field]: value } : sb
    );
    setStoryboards(newStoryboards);
    onUpdateContent?.({ ...node.data, storyboards: newStoryboards });
  };

  return (
    <div className="rich-node-content director-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header" onClick={handleToggleExpand}>
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Video size={20} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中...</>
            ) : hasResult ? (
              <><Check size={12} /> {storyboards.length}个分镜</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 思考过程区域 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '思考过程'}</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={node.data.thinking}
                thinkingIndex={node.data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="content-expanded director-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* 分镜表格 - 镜号、景别/角度、运动、画面内容、时长(s)、关键帧 */}
            <div className="director-section">
              <div className="section-header">
                <Video size={14} />
                <span>分镜表格</span>
              </div>
              <div className="storyboard-table-container">
                <div className="storyboard-table-header">
                  <span>镜号</span>
                  <span>景别/角度</span>
                  <span>运动</span>
                  <span>画面内容</span>
                  <span>时长(s)</span>
                  <span>关键帧</span>
                </div>
                {storyboards.map((sb) => (
                  <div key={sb.id} className="storyboard-table-row">
                    <input
                      className="shot-number"
                      value={sb.shotNumber}
                      onChange={(e) => handleStoryboardChange(sb.id, 'shotNumber', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="镜号"
                      readOnly={isRunning}
                    />
                    <input
                      value={sb.angle}
                      onChange={(e) => handleStoryboardChange(sb.id, 'angle', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="景别/角度"
                      readOnly={isRunning}
                    />
                    <input
                      value={sb.motion}
                      onChange={(e) => handleStoryboardChange(sb.id, 'motion', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="运动"
                      readOnly={isRunning}
                    />
                    <input
                      className="content-cell"
                      value={sb.content}
                      onChange={(e) => handleStoryboardChange(sb.id, 'content', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="画面内容"
                      readOnly={isRunning}
                    />
                    <input
                      className="duration-cell"
                      value={sb.duration}
                      onChange={(e) => handleStoryboardChange(sb.id, 'duration', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="秒"
                      readOnly={isRunning}
                    />
                    <div className="storyboard-thumbnail" onClick={() => handleImageClick(sb.thumbnail, `分镜${sb.shotNumber}`)}>
                      <img src={sb.thumbnail} alt={`分镜${sb.shotNumber}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 图片预览弹窗 */}
            <ImagePreviewModal
              src={previewImage?.src}
              alt={previewImage?.alt}
              isOpen={!!previewImage}
              onClose={handleClosePreview}
            />

            {/* 对话区域 */}
            <div className="chat-section" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
              <ChatConversation
                agentId={node.type}
                projectId={1}
                projectVersion={1}
                messages={node.data?.messages || []}
                onMessagesChange={handleMessagesChange}
                placeholder="输入消息..."
                disabledPlaceholder="生成完成后可对话"
                inputMode="input"
                disableAutoScroll={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 制片人节点内容 - 新设计
const ProducerNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [resultContent, setResultContent] = useState(node.data?.result || '');
  const [displayContent, setDisplayContent] = useState(node.data?.result || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasResult, setHasResult] = useState(!!node.data?.result);
  const textareaRef = useRef(null);
  const clickStartPos = useRef({ x: 0, y: 0 });
  const prevRunningRef = useRef(false);
  // 用 ref 跟踪最新消息，避免函数式更新时使用 stale 的 node.data.messages
  const messagesRef = useRef(node.data?.messages || []);

  console.log('[ProducerNodeContent] render, node.data?.result:', node.data?.result);
  console.log('[ProducerNodeContent] displayContent:', displayContent);
  console.log('[ProducerNodeContent] isExpanded:', isExpanded);

  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      setIsExpanded(true);
      onExpand?.();
    }
    prevRunningRef.current = isRunning;
  }, [isRunning]);

  // 监听 node.data 变化
  useEffect(() => {
    if (node.data?.result) {
      setResultContent(node.data.result);
      setDisplayContent(node.data.result);
      setHasResult(true);
    }
  }, [node.data?.result]);

  // 监听外部传入的展开状态
  useEffect(() => {
    if (node.data?.isThinkingExpanded) {
      setIsThinkingExpanded(true);
    }
  }, [node.data?.isThinkingExpanded]);

  // 思考内容自动收起：当有结果时收起思考内容
  // 暂时注释掉，避免 React 警告
  // useEffect(() => {
  //   if (node.data?.result && node.data?.thinking?.length > 0) {
  //     setIsThinkingExpanded(false);
  //   }
  // }, [node.data?.result, node.data?.thinking]);

  // 监听外部传入的结果展开状态
  useEffect(() => {
    if (node.data?.isResultExpanded) {
      setIsExpanded(true);
      onExpand?.();
    }
  }, [node.data?.isResultExpanded]);

  // 流式输出效果
  useEffect(() => {
    if (isRunning && node.data?.result) {
      setIsStreaming(true);
      setHasResult(true);
      setDisplayContent('');
      let index = 0;
      const text = node.data.result;

      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayContent(prev => prev + text[index]);
          index++;
        } else {
          clearInterval(interval);
          setIsStreaming(false);
          setResultContent(text);
        }
      }, 15);

      return () => clearInterval(interval);
    }
  }, [isRunning, node.data?.result]);

  const handleMessagesChange = useCallback((newMessages) => {
    console.log('[RichAgentNode] handleMessagesChange called, type:', typeof newMessages);
    // ChatConversation 可能传函数（函数式更新）或数组
    // 需要判断处理
    if (typeof newMessages === 'function') {
      console.log('[RichAgentNode] handleMessagesChange - received a function, using messagesRef');
      // 如果是函数，用 messagesRef 而非 node.data.messages 来解析（避免 stale closure）
      const resolvedMessages = newMessages(messagesRef.current);
      console.log('[RichAgentNode] handleMessagesChange - resolved messages:', resolvedMessages);
      // 更新 ref
      messagesRef.current = resolvedMessages;
      onUpdateContent?.({ ...node.data, messages: resolvedMessages });
    } else {
      console.log('[RichAgentNode] handleMessagesChange - received array:', newMessages);
      // 更新 ref
      messagesRef.current = newMessages;
      onUpdateContent?.({ ...node.data, messages: newMessages });
    }
  }, [node.data, onUpdateContent]);

  const handleMouseDown = (e) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleToggleExpand = (e) => {
    // 检测是否是拖动操作（移动超过5px认为是拖动）
    if (clickStartPos.current) {
      const dx = Math.abs(e.clientX - clickStartPos.current.x);
      const dy = Math.abs(e.clientY - clickStartPos.current.y);
      if (dx > 5 || dy > 5) {
        return; // 是拖动操作，不展开/收起
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="rich-node-content writer-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header" onClick={handleToggleExpand}>
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Target size={20} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中...</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 思考过程区域 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '思考过程'}</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={node.data.thinking}
                thinkingIndex={node.data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="content-expanded producer-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* 结果内容区域 - 始终只读 */}
            <div className="result-section">
              <div className="section-header">
                <FileText size={14} />
                <span>
                  结果内容
                  {isStreaming && <span className="streaming-indicator">生成中...</span>}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                className={`result-textarea ${isStreaming ? 'streaming' : ''} readonly`}
                value={displayContent}
                onClick={(e) => e.stopPropagation()}
                placeholder={isRunning ? '正在生成...' : '等待生成结果...'}
                readOnly
              />
            </div>

            {/* 对话区域 */}
            <div className="chat-section" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
              <ChatConversation
                agentId={node.type}
                projectId={1}
                projectVersion={1}
                messages={node.data?.messages || []}
                onMessagesChange={handleMessagesChange}
                placeholder="输入消息..."
                disabledPlaceholder="生成完成后可对话"
                inputMode="input"
                disableAutoScroll={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 技术节点内容（视频提示词工程师）- 按照手绘图布局
const TechnicalNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging, onGenerateVideoNodes }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [showAutoGenConfig, setShowAutoGenConfig] = useState(false);
  const clickStartPos = useRef({ x: 0, y: 0 });
  const prevRunningRef = useRef(false);

  // 图片预览状态
  const [previewImage, setPreviewImage] = useState(null);

  // 视频提示词数据 - 默认为空，需要执行后才能生成
  const [prompts, setPrompts] = useState(node.data?.prompts || []);

  // 自动生成下游节点配置 - 默认手动
  const autoGenConfig = node.data?.autoGenConfig || { mode: 'manual', count: 0 };

  // 处理图片点击预览
  const handleImageClick = (src, alt) => {
    console.log('[TechnicalNode] handleImageClick:', src, alt);
    setPreviewImage({ src, alt });
  };

  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  // 处理自动生成配置变更
  const handleAutoGenConfigChange = (field, value) => {
    const newConfig = { ...autoGenConfig, [field]: value };
    onUpdateContent?.({ ...node.data, autoGenConfig: newConfig });
  };

  // 触发创建视频节点（手动和自动模式都可用）
  const triggerAutoGenerate = () => {
    if (prompts.length > 0 && onGenerateVideoNodes) {
      const count = autoGenConfig.count > 0 ? Math.min(autoGenConfig.count, prompts.length) : prompts.length;
      onGenerateVideoNodes(node.id, count);
    }
  };

  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      setIsExpanded(true);
      onExpand?.();
    }
    if (!isRunning && prevRunningRef.current && autoGenConfig.mode === 'auto' && (node.data?.prompts?.length > 0 || node.data?.genParams)) {
      const count = autoGenConfig.count > 0 ? Math.min(autoGenConfig.count, node.data?.prompts?.length || 0) : (node.data?.prompts?.length || 0);
      onGenerateVideoNodes?.(node.id, count);
    }
    prevRunningRef.current = isRunning;
  }, [isRunning, autoGenConfig.mode, autoGenConfig.count, node.data?.prompts?.length, node.id]);

  useEffect(() => {
    // 同步 node.data 数据到本地状态
    if (node.data?.prompts !== undefined) {
      setPrompts(node.data.prompts);
    }
    // 有数据时设置 hasResult
    if (node.data?.prompts?.length > 0 || node.data?.genParams) {
      setHasResult(true);
    }
  }, [node.data]);

  // 监听外部传入的展开状态
  useEffect(() => {
    if (node.data?.isThinkingExpanded) {
      setIsThinkingExpanded(true);
    }
  }, [node.data?.isThinkingExpanded]);

  // 思考内容自动收起：当有结果时收起思考内容
  // 暂时注释掉，避免 React 警告
  // useEffect(() => {
  //   if (node.data?.result && node.data?.thinking?.length > 0) {
  //     setIsThinkingExpanded(false);
  //   }
  // }, [node.data?.result, node.data?.thinking]);

  // 监听外部传入的结果展开状态
  useEffect(() => {
    if (node.data?.isResultExpanded) {
      setIsExpanded(true);
      onExpand?.();
    }
  }, [node.data?.isResultExpanded]);

  const handleMessagesChange = useCallback((newMessages) => {
    console.log('[RichAgentNode] handleMessagesChange called, type:', typeof newMessages);
    // ChatConversation 可能传函数（函数式更新）或数组
    // 需要判断处理
    if (typeof newMessages === 'function') {
      console.log('[RichAgentNode] handleMessagesChange - received a function, using messagesRef');
      // 如果是函数，用 messagesRef 而非 node.data.messages 来解析（避免 stale closure）
      const resolvedMessages = newMessages(messagesRef.current);
      console.log('[RichAgentNode] handleMessagesChange - resolved messages:', resolvedMessages);
      // 更新 ref
      messagesRef.current = resolvedMessages;
      onUpdateContent?.({ ...node.data, messages: resolvedMessages });
    } else {
      console.log('[RichAgentNode] handleMessagesChange - received array:', newMessages);
      // 更新 ref
      messagesRef.current = newMessages;
      onUpdateContent?.({ ...node.data, messages: newMessages });
    }
  }, [node.data, onUpdateContent]);

  const handleMouseDown = (e) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleToggleExpand = (e) => {
    // 检测是否是拖动操作（移动超过5px认为是拖动）
    if (clickStartPos.current) {
      const dx = Math.abs(e.clientX - clickStartPos.current.x);
      const dy = Math.abs(e.clientY - clickStartPos.current.y);
      if (dx > 5 || dy > 5) {
        return; // 是拖动操作，不展开/收起
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handlePromptChange = (id, field, value) => {
    const newPrompts = prompts.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setPrompts(newPrompts);
    onUpdateContent?.({ ...node.data, prompts: newPrompts });
  };

  return (
    <div className="rich-node-content technical-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header" onClick={handleToggleExpand}>
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Code size={20} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中...</>
            ) : hasResult ? (
              <><Check size={12} /> {prompts.length}组提示词</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 思考过程区域 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '思考过程'}</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={node.data.thinking}
                thinkingIndex={node.data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="content-expanded technical-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* 自动生成下游节点配置 */}
            <div className="technical-section auto-gen-section">
              <div 
                className="section-header"
                onClick={() => setShowAutoGenConfig(!showAutoGenConfig)}
                style={{ cursor: 'pointer' }}
              >
                <div className="section-header-left">
                  <Play size={14} />
                  <span>自动生成视频节点</span>
                  <span className={`config-badge ${autoGenConfig.mode}`}>
                    {autoGenConfig.mode === 'auto' ? '自动' : '手动'}
                  </span>
                </div>
                <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setShowAutoGenConfig(!showAutoGenConfig); }}>
                  {showAutoGenConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              <AnimatePresence>
                {showAutoGenConfig && (
                  <motion.div
                    className="auto-gen-config"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="config-row">
                      <label className="config-label">生成模式：</label>
                      <div className="config-options">
                        <button
                          className={`config-option ${autoGenConfig.mode === 'manual' ? 'active' : ''}`}
                          onClick={() => handleAutoGenConfigChange('mode', 'manual')}
                        >
                          手动
                        </button>
                        <button
                          className={`config-option ${autoGenConfig.mode === 'auto' ? 'active' : ''}`}
                          onClick={() => handleAutoGenConfigChange('mode', 'auto')}
                        >
                          自动
                        </button>
                      </div>
                    </div>
                    {autoGenConfig.mode === 'auto' && (
                      <div className="config-row">
                        <label className="config-label">生成数量：</label>
                        <div className="config-input-group">
                          <input
                            type="number"
                            className="config-number-input"
                            value={autoGenConfig.count || ''}
                            onChange={(e) => handleAutoGenConfigChange('count', parseInt(e.target.value) || 0)}
                            placeholder="全部"
                            min="0"
                          />
                          <span className="config-hint">0 = 全部 ({prompts.length}个)</span>
                        </div>
                      </div>
                    )}
                    {hasResult && (
                      <button 
                        className="trigger-auto-gen-btn"
                        onClick={triggerAutoGenerate}
                      >
                        <Play size={14} />
                        {autoGenConfig.mode === 'auto' ? '立即生成' : '创建'} {autoGenConfig.count > 0 ? Math.min(autoGenConfig.count, prompts.length) : prompts.length} 个视频节点
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 视频提示词表格 - 镜号、提示词、时长、关键帧、生成 */}
            <div className="technical-section">
              <div className="section-header">
                <Zap size={14} />
                <span>视频提示词</span>
              </div>
              <div className="prompt-table-container">
                <div className="prompt-table-header">
                  <span>镜号</span>
                  <span>提示词</span>
                  <span>时长(s)</span>
                  <span>关键帧</span>
                  <span>操作</span>
                </div>
                {prompts.map((p) => (
                  <div key={p.id} className="prompt-table-row">
                    <input
                      className="shot-number"
                      value={p.shotNumber}
                      onChange={(e) => handlePromptChange(p.id, 'shotNumber', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="镜号"
                      readOnly={isRunning}
                    />
                    <input
                      className="prompt-cell"
                      value={p.prompt}
                      onChange={(e) => handlePromptChange(p.id, 'prompt', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="提示词内容"
                      readOnly={isRunning}
                    />
                    <input
                      className="duration-cell"
                      value={p.duration}
                      onChange={(e) => handlePromptChange(p.id, 'duration', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="秒"
                      readOnly={isRunning}
                    />
                    <div className="keyframes-thumbnails">
                      {p.keyframes?.map((frame, index) => (
                        <div key={index} className="keyframe-thumb" onClick={() => handleImageClick(frame, `关键帧${index + 1}`)}>
                          <img src={frame} alt={`关键帧${index + 1}`} />
                        </div>
                      ))}
                    </div>
                    <button
                      className="generate-video-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onGenerateVideoNodes) {
                          // 创建单个视频节点
                          onGenerateVideoNodes(node.id, 1, p.id);
                        }
                      }}
                      disabled={isRunning || !p.prompt}
                      title="生成该视频"
                    >
                      <Play size={14} />
                      <span>生成</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 图片预览弹窗 */}
            <ImagePreviewModal
              src={previewImage?.src}
              alt={previewImage?.alt}
              isOpen={!!previewImage}
              onClose={handleClosePreview}
            />

            {/* 对话区域 */}
            <div className="chat-section" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
              <ChatConversation
                agentId={node.type}
                projectId={1}
                projectVersion={1}
                messages={node.data?.messages || []}
                onMessagesChange={handleMessagesChange}
                placeholder="输入消息..."
                disabledPlaceholder="生成完成后可对话"
                inputMode="input"
                disableAutoScroll={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 视频生成节点内容 - 按照手绘图布局
const VideoGenNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [hasResult, setHasResult] = useState(!!(node.data?.videoPrompt || node.data?.videos?.length > 0 || node.data?.videoPreview));
  const clickStartPos = useRef({ x: 0, y: 0 });
  const prevRunningRef = useRef(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);

  // 调试：每次渲染都打印
  console.log('[VideoGenNodeContent] render, node.data:', node.data);

  // 视频提示词 - 从node.data获取
  const [videoPrompt, setVideoPrompt] = useState(node.data?.videoPrompt || '');

  // 生成参数 - 模型、画质、比例、时长、生成时间
  const [genParams, setGenParams] = useState(node.data?.genParams || {
    model: 'CogVideoX',
    quality: '720P',
    ratio: '16:9',
    duration: '10s',
    genTime: '30分钟'
  });

  // 视频预览URL - 默认为空，需要执行后才能生成
  const [videoPreview, setVideoPreview] = useState(node.data?.videoPreview || '');

  useEffect(() => {
    if (isRunning && !prevRunningRef.current) {
      // 开始运行，自动展开
      setIsExpanded(true);
      onExpand?.();
    } else if (!isRunning && prevRunningRef.current) {
      // 运行结束，自动收起
      setIsExpanded(false);
    }
    prevRunningRef.current = isRunning;
  }, [isRunning]);

  // 同步 node.data 数据到本地状态
  useEffect(() => {
    console.log('[VideoGenNode] node.data changed:', node.data);
    if (node.data?.videoPrompt !== undefined) {
      console.log('[VideoGenNode] Setting videoPrompt:', node.data.videoPrompt);
      setVideoPrompt(node.data.videoPrompt);
    }
    if (node.data?.genParams !== undefined) {
      setGenParams(node.data.genParams);
    }
    if (node.data?.videoPreview !== undefined) {
      setVideoPreview(node.data.videoPreview);
    }
    // 有数据时设置 hasResult
    if (node.data?.videoPreview || node.data?.videos?.length > 0) {
      setHasResult(true);
    }
  }, [node.data]);

  const handleMessagesChange = useCallback((newMessages) => {
    console.log('[RichAgentNode] handleMessagesChange called, type:', typeof newMessages);
    // ChatConversation 可能传函数（函数式更新）或数组
    // 需要判断处理
    if (typeof newMessages === 'function') {
      console.log('[RichAgentNode] handleMessagesChange - received a function, using messagesRef');
      // 如果是函数，用 messagesRef 而非 node.data.messages 来解析（避免 stale closure）
      const resolvedMessages = newMessages(messagesRef.current);
      console.log('[RichAgentNode] handleMessagesChange - resolved messages:', resolvedMessages);
      // 更新 ref
      messagesRef.current = resolvedMessages;
      onUpdateContent?.({ ...node.data, messages: resolvedMessages });
    } else {
      console.log('[RichAgentNode] handleMessagesChange - received array:', newMessages);
      // 更新 ref
      messagesRef.current = newMessages;
      onUpdateContent?.({ ...node.data, messages: newMessages });
    }
  }, [node.data, onUpdateContent]);

  const handleMouseDown = (e) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleToggleExpand = (e) => {
    // 检测是否是拖动操作（移动超过5px认为是拖动）
    if (clickStartPos.current) {
      const dx = Math.abs(e.clientX - clickStartPos.current.x);
      const dy = Math.abs(e.clientY - clickStartPos.current.y);
      if (dx > 5 || dy > 5) {
        return; // 是拖动操作，不展开/收起
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleParamChange = (field, value) => {
    const newParams = { ...genParams, [field]: value };
    setGenParams(newParams);
    onUpdateContent?.({ ...node.data, genParams: newParams });
  };

  return (
    <div className="rich-node-content video-gen-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header" onClick={handleToggleExpand}>
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Video size={20} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中...</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 思考过程区域 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '思考过程'}</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={node.data.thinking}
                thinkingIndex={node.data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="content-expanded video-gen-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* 视频提示词 */}
            <div className="video-gen-section">
              <div className="section-header">
                <FileText size={14} />
                <span>视频提示词</span>
              </div>
              <textarea
                className="video-gen-textarea"
                value={videoPrompt}
                onChange={(e) => {
                  setVideoPrompt(e.target.value);
                  onUpdateContent?.({ ...node.data, videoPrompt: e.target.value });
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder={isRunning ? '正在生成...' : '输入视频生成提示词...'}
                readOnly={isRunning}
              />
            </div>

            {/* 生成参数表格 - 模型、画质、比例、时长、生成时间 */}
            <div className="video-gen-section">
              <div className="section-header">
                <Zap size={14} />
                <span>生成参数</span>
              </div>
              <div className="gen-params-table">
                <div className="gen-params-header">
                  <span>模型</span>
                  <span>画质</span>
                  <span>比例</span>
                  <span>时长</span>
                  <span>生成时间</span>
                </div>
                <div className="gen-params-row">
                  <input
                    value={genParams.model}
                    onChange={(e) => handleParamChange('model', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="模型"
                    readOnly={isRunning}
                  />
                  <input
                    value={genParams.quality}
                    onChange={(e) => handleParamChange('quality', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="画质"
                    readOnly={isRunning}
                  />
                  <input
                    value={genParams.ratio}
                    onChange={(e) => handleParamChange('ratio', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="比例"
                    readOnly={isRunning}
                  />
                  <input
                    value={genParams.duration}
                    onChange={(e) => handleParamChange('duration', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="时长"
                    readOnly={isRunning}
                  />
                  <input
                    value={genParams.genTime}
                    onChange={(e) => handleParamChange('genTime', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="生成时间"
                    readOnly={isRunning}
                  />
                </div>
              </div>
            </div>

            {/* 视频预览区域 */}
            <div className="video-gen-section">
              <div className="section-header">
                <Play size={14} />
                <span>视频预览</span>
              </div>
              <div className="video-preview-container">
                {hasResult && node.data?.videos?.length > 0 ? (
                  <div className="video-list">
                    {node.data.videos.map((video, index) => (
                      <div key={index} className="video-item">
                        <div className="video-info">
                          <span className="video-title">{video.title || `视频 ${index + 1}`}</span>
                          <span className="video-duration">{video.duration}s</span>
                        </div>
                        <video
                          className="video-preview-player"
                          src={video.url}
                          controls
                          preload="metadata"
                          style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '8px' }}
                        />
                        {video.description && (
                          <p className="video-description">{video.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : hasResult && videoPreview ? (
                  <div className="video-preview-wrapper">
                    <video
                      className="video-preview-player"
                      src={videoPreview}
                      controls
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <div className="video-preview-placeholder">
                    <Video size={48} />
                    <span>视频生成后将在此预览</span>
                  </div>
                )}
              </div>
            </div>

            {/* 对话区域 */}
            <div className="chat-section" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
              <ChatConversation
                agentId={node.type}
                projectId={1}
                projectVersion={1}
                messages={node.data?.messages || []}
                onMessagesChange={handleMessagesChange}
                placeholder="输入消息..."
                disabledPlaceholder="生成完成后可对话"
                inputMode="input"
                disableAutoScroll={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 视频剪辑节点内容
const VideoEditorNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  
  // 默认视频数据
  const defaultVideos = [
    { 
      id: 1, 
      name: '镜头1', 
      duration: '5s',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop'
    },
    { 
      id: 2, 
      name: '镜头2', 
      duration: '4s',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop'
    },
    { 
      id: 3, 
      name: '镜头3', 
      duration: '6s',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop'
    }
  ];
  
  const [videos, setVideos] = useState(node.data?.videos || defaultVideos);
  const [editedVideo, setEditedVideo] = useState(node.data?.editedVideo || null);
  const clickStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  // 监听外部传入的结果展开状态
  useEffect(() => {
    if (node.data?.isResultExpanded) {
      setIsExpanded(true);
      onExpand?.();
    }
  }, [node.data?.isResultExpanded]);

  const handleToggleExpand = () => {
    if (!isParentDragging) {
      setIsExpanded(!isExpanded);
      if (!isExpanded) onExpand?.();
    }
  };

  return (
    <div className="rich-node-content video-editor-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header" onClick={handleToggleExpand}>
        <div className="content-icon" style={{ backgroundColor: '#a855f7' }}>
          <Scissors size={20} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 处理中...</>
            ) : editedVideo ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待剪辑'
            )}
          </span>
        </div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div
          className="content-expanded video-editor-expanded"
        >
          {/* 视频列表 */}
          <div className="video-editor-section">
            <div className="section-header">
              <Video size={14} />
              <span>待剪辑视频</span>
              <span className="video-count">{videos.length} 个</span>
            </div>
            <div className="video-list-container">
              {videos.length === 0 ? (
                <div className="video-list-empty">
                  <Video size={32} />
                  <span>暂无待剪辑视频</span>
                  <span className="hint">请连接视频生成节点</span>
                </div>
              ) : (
                <div className="video-list-items">
                  {videos.map((video, index) => (
                    <div key={index} className="video-item">
                      <div className="video-thumb" style={{ 
                        backgroundImage: `url(${video.thumbnail})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                        width: '60px',
                        height: '45px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(168, 85, 247, 0.2)'
                      }}>
                        <Play size={16} color="#a855f7" />
                      </div>
                      <div className="video-info">
                        <span className="video-name">{video.name || `视频 ${index + 1}`}</span>
                        <span className="video-duration">{video.duration || '10s'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 剪辑结果 */}
          {editedVideo && (
            <div className="video-editor-section">
              <div className="section-header">
                <Check size={14} />
                <span>剪辑结果</span>
              </div>
              <div className="edited-video-preview">
                <video
                  className="edited-video-player"
                  src={editedVideo.url}
                  controls
                  preload="metadata"
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="video-editor-actions">
            <button
              className="open-editor-btn"
              onClick={(e) => {
                e.stopPropagation();
                console.log('[VideoEditorNode] 打开剪辑器按钮被点击', { currentState: showVideoEditor });
                setShowVideoEditor(true);
                console.log('[VideoEditorNode] showVideoEditor 已设置为 true');
              }}
            >
              <Scissors size={14} />
              <span>打开剪辑器 ({videos.length}个视频)</span>
            </button>
          </div>
        </div>
      )}

      {/* 视频编辑器弹窗 */}
      <VideoEditor
        isOpen={showVideoEditor}
        onClose={() => setShowVideoEditor(false)}
        projectId={node.id}
        videos={videos}
      />
    </div>
  );
};


// 通用节点内容（未定义的类型）
const GenericNodeContent = ({ node, isRunning, onUpdateContent, onExpand, isDragging: isParentDragging }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const clickStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isRunning) {
      onExpand?.();
    }
  }, [isRunning]);

  const handleMessagesChange = useCallback((newMessages) => {
    console.log('[RichAgentNode] handleMessagesChange called, type:', typeof newMessages);
    // ChatConversation 可能传函数（函数式更新）或数组
    // 需要判断处理
    if (typeof newMessages === 'function') {
      console.log('[RichAgentNode] handleMessagesChange - received a function, using messagesRef');
      // 如果是函数，用 messagesRef 而非 node.data.messages 来解析（避免 stale closure）
      const resolvedMessages = newMessages(messagesRef.current);
      console.log('[RichAgentNode] handleMessagesChange - resolved messages:', resolvedMessages);
      // 更新 ref
      messagesRef.current = resolvedMessages;
      onUpdateContent?.({ ...node.data, messages: resolvedMessages });
    } else {
      console.log('[RichAgentNode] handleMessagesChange - received array:', newMessages);
      // 更新 ref
      messagesRef.current = newMessages;
      onUpdateContent?.({ ...node.data, messages: newMessages });
    }
  }, [node.data, onUpdateContent]);

  return (
    <div className="rich-node-content simple">
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Bot size={20} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 运行中</>
            ) : (
              '就绪'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程显示 - 可点击展开（执行中和执行完都显示） */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <>
          <div className="thinking-preview" onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}>
            <Sparkles size={12} />
            <span>{isRunning ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...') : '思考过程'}</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={node.data.thinking}
                thinkingIndex={isRunning ? node.data.thinkingIndex : node.data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <div className="chat-section" style={{ height: '280px', display: 'flex', flexDirection: 'column' }}>
        <ChatConversation
          agentId={node.type}
          projectId={1}
          projectVersion={1}
          messages={node.data?.messages || []}
          onMessagesChange={handleMessagesChange}
          placeholder="输入消息..."
          disabledPlaceholder="生成完成后可对话"
        />
      </div>
    </div>
  );
};

// 主组件
const RichAgentNode = ({
  node,
  isSelected,
  isRunning,
  onSelect,
  onDelete,
  onEdit,
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
  onOpenSettings,
  onPortPositionChange,
  onGenerateVideoNodes,
  scale = 1
}) => {
  // 调试日志：监控 node 变化
  useEffect(() => {
    if (node.type === 'videoGen') {
      console.log('[RichAgentNode] node updated:', node.id, node.data);
    }
  }, [node]);

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

  // 获取节点默认宽度 - 视频生成节点和技术节点默认宽度为2倍，美术、分镜为1.5倍
  const getDefaultWidth = useCallback(() => {
    if (node.type === 'videoGen' || node.type === 'technical') {
      return 720; // 360 * 2
    }
    if (node.type === 'visual' || node.type === 'director') {
      return 540; // 360 * 1.5
    }
    return 360;
  }, [node.type]);

  // 获取当前节点宽度（优先使用node.data中的width，否则使用默认值）
  const getNodeWidth = useCallback(() => {
    return node.data?.width || getDefaultWidth();
  }, [node.data?.width, getDefaultWidth]);

  // 报告端口位置变化 - 根据实际节点宽度动态计算
  const updatePortPositions = useCallback(() => {
    if (!onPortPositionChange) return;
    const width = getNodeWidth();
    // 输入端口在左侧，端口中心在节点左边缘
    // 输入端口 left: -7px, 端口宽度14px, 中心在7px处, 所以中心位置是 node.x - 7 + 7 = node.x
    onPortPositionChange(node.id, 'input', { x: node.x, y: node.y + 20 });
    // 输出端口在右侧，端口中心在节点右边缘
    // 输出端口 right: -7px, 端口宽度14px, 中心在7px处, 所以中心位置是 node.x + width + 7 - 7 = node.x + width
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

    // 只允许拖动节点头部和拖拽手柄
    const isHeader = e.target.closest('.content-header');
    const isHandle = e.target.closest('.node-drag-handle');
    const isPort = e.target.closest('.port');
    const isButton = e.target.closest('button');
    const isInteractive = e.target.closest('textarea') || e.target.closest('input') || e.target.closest('.expanded-section');

    // 只有点击头部或手柄才拖动，其他都不响应
    if (!isHeader && !isHandle) return;
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
  }, [isDragging, isResizing, dragOffset, resizeStart]);

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
    console.log('[RichAgentNode] handleUpdateContent called, node.id:', node.id, 'data:', data);
    onUpdateData?.(node.id, data);
  };

  // 检测是否是拖动操作（移动超过5px认为是拖动）
  const isDragOperation = () => {
    if (!dragStartPos.current) return false;
    // 这里不需要实际计算，因为我们在 handleMouseUp 中会处理
    return false;
  };

  const renderContent = () => {
    const contentProps = {
      node,
      isRunning,
      onUpdateContent: handleUpdateContent,
      onExpand: onBringToFront ? () => onBringToFront(node.id) : undefined,
      isDragging: isDragging || isResizing
    };

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

  return (
    <motion.div
      ref={nodeRef}
      className={`rich-agent-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${node.status || 'idle'} ${isRunning ? 'running' : ''}`}
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
      <div className="node-drag-handle">
        <GripVertical size={12} />
      </div>

      <button className="node-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
        <X size={12} />
      </button>

      <button className="node-edit-btn" onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
        <Edit3 size={12} />
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

      {/* 端口固定在头部区域（中心在 26px 处） */}
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