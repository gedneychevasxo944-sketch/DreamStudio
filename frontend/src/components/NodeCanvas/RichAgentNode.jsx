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

// 编剧节点内容 - 极简版（结果在右侧工作区展示）
const WriterNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const hasResult = !!node.data?.result;

  // 解析剧本获取摘要
  const { episodes, totalScenes } = parseScript(node.data?.result);

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <PenTool size={16} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程气泡 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={node.data.thinking.length}
          />
        )}
      </AnimatePresence>

      {/* 结果预览 - 显示剧本摘要 */}
      {hasResult && (
        <div className="result-preview-minimal">
          <BookOpen size={12} />
          <span>{episodes.length}集 · {totalScenes}场戏</span>
        </div>
      )}
    </div>
  );
};

// 美术节点内容 - 极简版（结果在右侧工作区展示）
const VisualNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const characters = node.data?.characters || [];
  const scenes = node.data?.scenes || [];
  const props = node.data?.props || [];
  const hasResult = characters.length > 0 || scenes.length > 0 || props.length > 0;

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Palette size={16} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程气泡 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={node.data.thinking.length}
          />
        )}
      </AnimatePresence>

      {/* 结果预览 - 显示资源统计 */}
      {hasResult && (
        <div className="result-preview-minimal">
          <Image size={12} />
          <span>{characters.length}角色 · {scenes.length}场景 · {props.length}道具</span>
        </div>
      )}
    </div>
  );
};

// 分镜导演节点内容 - 极简版（结果在右侧工作区展示）
const DirectorNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const storyboards = node.data?.storyboards || [];
  const hasResult = storyboards.length > 0;

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Video size={16} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中</>
            ) : hasResult ? (
              <><Check size={12} /> {storyboards.length}个分镜</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程气泡 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={node.data.thinking.length}
          />
        )}
      </AnimatePresence>

      {/* 结果预览 */}
      {hasResult && (
        <div className="result-preview-minimal">
          <Video size={12} />
          <span>{storyboards.length}个分镜</span>
        </div>
      )}
    </div>
  );
};

// 制片人节点内容 - 极简版（结果在右侧工作区展示）
const ProducerNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const hasResult = !!node.data?.result;

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 - 点击不展开，只展示状态 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Target size={16} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程气泡 - 仅展示最新一条，点击可展开 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={node.data.thinking.length}
          />
        )}
      </AnimatePresence>

      {/* 结果预览 - 仅显示摘要，点击提示去右侧查看 */}
      {hasResult && (
        <div className="result-preview-minimal">
          <FileText size={12} />
          <span>查看右侧工作区获取详情</span>
        </div>
      )}
    </div>
  );
};

// 技术节点内容 - 极简版（结果在右侧工作区展示）
const TechnicalNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, onGenerateVideoNodes, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const prompts = node.data?.prompts || [];
  const hasResult = prompts.length > 0;

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Code size={16} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中</>
            ) : hasResult ? (
              <><Check size={12} /> {prompts.length}组提示词</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程气泡 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={node.data.thinking.length}
          />
        )}
      </AnimatePresence>

      {/* 结果预览 */}
      {hasResult && (
        <div className="result-preview-minimal">
          <Zap size={12} />
          <span>{prompts.length}组提示词</span>
        </div>
      )}
    </div>
  );
};

// 视频生成节点内容 - 极简版（结果在右侧工作区展示）
const VideoGenNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const hasResult = node.data?.videoPreview || node.data?.videos?.length > 0;
  const videos = node.data?.videos || [];
  const videoPreview = node.data?.videoPreview;

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Video size={16} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 生成中</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待生成'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程气泡 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={node.data.thinking.length}
          />
        )}
      </AnimatePresence>

      {/* 结果预览 */}
      {hasResult && (
        <div className="result-preview-minimal">
          <Play size={12} />
          <span>
            {videos.length > 0
              ? `${videos.length}个视频`
              : videoPreview
                ? '视频已生成'
                : '视频生成中'}
          </span>
        </div>
      )}
    </div>
  );
};

// 视频剪辑节点内容 - 极简版（结果在右侧工作区展示）
const VideoEditorNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const videos = node.data?.videos || [];
  const editedVideo = node.data?.editedVideo;
  const hasResult = !!editedVideo;

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: '#a855f7' }}>
          <Scissors size={16} />
        </div>
        <div className="content-info">
          <span className="content-title">{node.name}</span>
          <span className="content-status">
            {isRunning ? (
              <><Loader2 className="spin" size={12} /> 处理中</>
            ) : hasResult ? (
              <><Check size={12} /> 已完成</>
            ) : (
              '待剪辑'
            )}
          </span>
        </div>
      </div>

      {/* 思考过程气泡 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={node.data.thinking.length}
          />
        )}
      </AnimatePresence>

      {/* 结果预览 */}
      {hasResult && (
        <div className="result-preview-minimal">
          <Video size={12} />
          <span>剪辑完成</span>
        </div>
      )}
    </div>
  );
};


// 通用节点内容 - 极简版（未定义的类型）
const GenericNodeContent = ({ node, isRunning, onSelect, onUpdateContent, onExpand, isDragging: isParentDragging, projectId, projectVersion }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const handleMouseDown = (e) => {
    onSelect?.();
  };

  return (
    <div className="rich-node-content simple-node" onMouseDown={handleMouseDown}>
      {/* 头部 */}
      <div className="content-header">
        <div className="content-icon" style={{ backgroundColor: node.color }}>
          <Bot size={16} />
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

      {/* 思考过程气泡 */}
      {node.data?.thinking && node.data.thinking.length > 0 && (
        <div
          className="thinking-preview minimal"
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
        >
          <Sparkles size={12} />
          <span className="thinking-text">
            {isRunning
              ? (node.data.thinking[node.data.thinkingIndex - 1] || '思考中...')
              : '点击查看思考过程'}
          </span>
          {isThinkingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      )}

      {/* 思考内容展开区域 */}
      <AnimatePresence>
        {isThinkingExpanded && (
          <ThinkingExpanded
            thinking={node.data.thinking}
            thinkingIndex={isRunning ? node.data.thinkingIndex : node.data.thinking.length}
          />
        )}
      </AnimatePresence>
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
  scale = 1,
  projectId,
  projectVersion
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
      onSelect,
      onUpdateContent: handleUpdateContent,
      onExpand: onBringToFront ? () => onBringToFront(node.id) : undefined,
      isDragging: isDragging || isResizing,
      projectId,
      projectVersion
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