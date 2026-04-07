import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageCircle, Settings, History, GitBranch, Lock, Unlock, RotateCcw, AlertTriangle, Check, ChevronDown, Play, Palette, PenTool, Video, Code, Users, Layers, List, BookOpen, Zap, Sparkles, Image, X, Target, Loader2 } from 'lucide-react';
import ChatConversation from './ChatConversation';
import { formatTimestamp } from './ChatConversation';
import './NodeWorkspace.css';

// Tab 图标组件
const TabIcon = ({ type, size = 16 }) => {
  switch (type) {
    case 'result':
      return <FileText size={size} />;
    case 'chat':
      return <MessageCircle size={size} />;
    case 'config':
      return <Settings size={size} />;
    case 'history':
      return <History size={size} />;
    case 'impact':
      return <GitBranch size={size} />;
    default:
      return <FileText size={size} />;
  }
};

// 剧本解析函数 - 支持集数-场景层级
const parseScript = (script) => {
  if (!script) return { episodes: [], totalScenes: 0 };

  const episodeRegex = /(第[一二三四五六七八九十百千]+集|第\d+集|Episode\s*\d+|集\s*\d+)[：:\s]*\n?/gi;
  const sceneRegex = /(场景[一二三四五六七八九十百千]+|第[一二三四五六七八九十百千]+场|场景\s*\d+|第\d+场)[：:\s-]*/gi;

  const episodes = [];
  let currentEpisode = null;
  let episodeCounter = 0;

  const episodeParts = script.split(episodeRegex);

  if (episodeParts.length <= 1) {
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

  episodeParts.forEach((part, index) => {
    if (part.match(episodeRegex)) {
      episodeCounter++;
      currentEpisode = {
        id: episodeCounter - 1,
        title: part.trim(),
        scenes: [],
        sceneRange: ''
      };

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

// 结果 Tab
const ResultTab = ({ node, onGenerateVideo }) => {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(null);

  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <FileText size={32} />
          <p>选择一个节点查看结果</p>
        </div>
      </div>
    );
  }

  // 处理生成视频
  const handleGenerateVideo = (promptIdx) => {
    setGeneratingPrompt(promptIdx);
    onGenerateVideo?.(node.id, promptIdx);
    // 重置状态（由画布操作完成后回调更新）
    setTimeout(() => setGeneratingPrompt(null), 3000);
  };

  // 模拟数据
  const currentVersion = node.data?.currentVersion || 1;
  const isRevised = node.data?.isRevised;
  const isLocked = node.data?.isLocked;
  const baseVersion = node.data?.baseVersion;
  const status = node.data?.status || 'completed';

  const versionHistory = [
    { version: 'v3-r2', type: '修订版', time: '10分钟前', isCurrent: true },
    { version: 'v3-r1', type: '修订版', time: '30分钟前', isCurrent: false },
    { version: 'v3', type: '运行版', time: '1小时前', isCurrent: false },
    { version: 'v2', type: '运行版', time: '2小时前', isCurrent: false },
  ];

  // 渲染节点特定的结果内容
  const renderNodeResult = () => {
    if (!node.data) {
      return <div className="result-empty"><p>暂无结果内容</p></div>;
    }

    switch (node.type) {
      case 'producer':
        return (
          <div className="result-section">
            <div className="section-header">
              <FileText size={14} />
              <span>结果内容</span>
            </div>
            <textarea
              className="result-textarea readonly"
              value={node.data.result || ''}
              readOnly
              placeholder="等待生成结果..."
            />
          </div>
        );

      case 'content':
        const { episodes, totalScenes } = parseScript(node.data.result);
        return (
          <div className="result-section">
            <div className="section-header">
              <List size={14} />
              <span>分场剧本概览</span>
            </div>
            {episodes.length === 0 ? (
              <div className="result-empty"><p>暂无剧本内容</p></div>
            ) : (
              <div className="script-overview">
                <div className="script-summary">
                  <div className="summary-line">故事概要：共{episodes.length}集，{totalScenes}场戏</div>
                  <div className="summary-line">集数范围：第1集-第{episodes.length}集</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'visual':
        return (
          <div className="result-section">
            {node.data.overallStyle && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Palette size={14} />
                  <span>整体风格</span>
                </div>
                <textarea
                  className="result-textarea readonly"
                  value={node.data.overallStyle}
                  readOnly
                />
              </div>
            )}

            {node.data.characters?.length > 0 && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Users size={14} />
                  <span>角色 ({node.data.characters.length})</span>
                </div>
                <div className="character-table">
                  <div className="character-table-header">
                    <span>姓名</span>
                    <span>描述</span>
                    <span>缩略图</span>
                  </div>
                  {node.data.characters.map((char, idx) => (
                    <div key={idx} className="character-table-row">
                      <span className="char-name">{char.name}</span>
                      <span className="char-desc">{char.description}</span>
                      {char.thumbnail && (
                        <img
                          src={char.thumbnail}
                          alt={char.name}
                          className="table-thumb"
                          onClick={() => setPreviewImage({ src: char.thumbnail, alt: char.name })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.data.scenes?.length > 0 && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Image size={14} />
                  <span>场景 ({node.data.scenes.length})</span>
                </div>
                <div className="character-table">
                  <div className="character-table-header">
                    <span>名称</span>
                    <span>描述</span>
                    <span>缩略图</span>
                  </div>
                  {node.data.scenes.map((scene, idx) => (
                    <div key={idx} className="character-table-row">
                      <span className="char-name">{scene.name}</span>
                      <span className="char-desc">{scene.description}</span>
                      {scene.thumbnail && (
                        <img
                          src={scene.thumbnail}
                          alt={scene.name}
                          className="table-thumb"
                          onClick={() => setPreviewImage({ src: scene.thumbnail, alt: scene.name })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.data.props?.length > 0 && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Layers size={14} />
                  <span>物品 ({node.data.props.length})</span>
                </div>
                <div className="character-table">
                  <div className="character-table-header">
                    <span>名称</span>
                    <span>描述</span>
                    <span>缩略图</span>
                  </div>
                  {node.data.props.map((prop, idx) => (
                    <div key={idx} className="character-table-row">
                      <span className="char-name">{prop.name}</span>
                      <span className="char-desc">{prop.description}</span>
                      {prop.thumbnail && (
                        <img
                          src={prop.thumbnail}
                          alt={prop.name}
                          className="table-thumb"
                          onClick={() => setPreviewImage({ src: prop.thumbnail, alt: prop.name })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!node.data.overallStyle && !node.data.characters?.length && !node.data.scenes?.length && !node.data.props?.length && (
              <div className="result-empty"><p>暂无结果内容</p></div>
            )}
          </div>
        );

      case 'director':
        return (
          <div className="result-section">
            <div className="section-header">
              <Video size={14} />
              <span>分镜表格</span>
            </div>
            {node.data.storyboards?.length > 0 ? (
              <div className="storyboard-table">
                <div className="storyboard-table-header">
                  <span>镜号</span>
                  <span>景别/角度</span>
                  <span>运动</span>
                  <span>画面内容</span>
                  <span>时长</span>
                  <span>关键帧</span>
                </div>
                {node.data.storyboards.map((sb, idx) => (
                  <div key={idx} className="storyboard-table-row">
                    <span className="shot-number">{sb.shotNumber}</span>
                    <span className="shot-angle">{sb.angle}</span>
                    <span className="shot-motion">{sb.motion}</span>
                    <span className="shot-content">{sb.content}</span>
                    <span className="shot-duration">{sb.duration}s</span>
                    {sb.thumbnail && (
                      <img
                        src={sb.thumbnail}
                        alt={`分镜${sb.shotNumber}`}
                        className="table-thumb"
                        onClick={() => setPreviewImage({ src: sb.thumbnail, alt: `分镜${sb.shotNumber}` })}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="result-empty"><p>暂无分镜内容</p></div>
            )}
          </div>
        );

      case 'technical':
        return (
          <div className="result-section">
            <div className="section-header">
              <Code size={14} />
              <span>视频提示词</span>
            </div>
            {node.data.prompts?.length > 0 ? (
              <div className="prompt-table">
                <div className="prompt-table-header">
                  <span>镜号</span>
                  <span>提示词</span>
                  <span>时长(s)</span>
                  <span>关键帧</span>
                  <span>操作</span>
                </div>
                {node.data.prompts.map((p, idx) => (
                  <div key={idx} className="prompt-table-row">
                    <span className="prompt-shot-number">{p.shotNumber}</span>
                    <span className="prompt-text">{p.prompt}</span>
                    <span className="prompt-duration">{p.duration}</span>
                    <div className="keyframes-thumbnails">
                      {p.keyframes?.map((frame, kIdx) => (
                        <div
                          key={kIdx}
                          className="keyframe-thumb"
                          onClick={() => setPreviewImage({ src: frame, alt: `关键帧${kIdx + 1}` })}
                        >
                          <img src={frame} alt={`关键帧${kIdx + 1}`} />
                        </div>
                      ))}
                    </div>
                    <button
                      className={`generate-video-btn ${generatingPrompt === idx ? 'generating' : ''}`}
                      onClick={() => handleGenerateVideo(idx)}
                      disabled={generatingPrompt === idx}
                    >
                      {generatingPrompt === idx ? (
                        <Loader2 size={12} className="spin" />
                      ) : (
                        <Play size={12} />
                      )}
                      <span>{generatingPrompt === idx ? '生成中' : '生成'}</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="result-empty"><p>暂无提示词内容</p></div>
            )}
          </div>
        );

      case 'videoGen':
        return (
          <div className="result-section">
            {node.data.videoPrompt && (
              <div className="video-gen-section">
                <div className="section-header">
                  <FileText size={14} />
                  <span>视频提示词</span>
                </div>
                <textarea
                  className="result-textarea readonly"
                  value={node.data.videoPrompt}
                  readOnly
                />
              </div>
            )}

            {node.data.genParams && (
              <div className="video-gen-section">
                <div className="section-header">
                  <Zap size={14} />
                  <span>生成参数</span>
                </div>
                <div className="gen-params-table">
                  <div className="gen-params-row">
                    <span className="param-label">模型</span>
                    <span className="param-value">{node.data.genParams.model}</span>
                  </div>
                  <div className="gen-params-row">
                    <span className="param-label">画质</span>
                    <span className="param-value">{node.data.genParams.quality}</span>
                  </div>
                  <div className="gen-params-row">
                    <span className="param-label">比例</span>
                    <span className="param-value">{node.data.genParams.ratio}</span>
                  </div>
                  <div className="gen-params-row">
                    <span className="param-label">时长</span>
                    <span className="param-value">{node.data.genParams.duration}</span>
                  </div>
                </div>
              </div>
            )}

            {node.data.videos?.length > 0 && (
              <div className="video-gen-section">
                <div className="section-header">
                  <Play size={14} />
                  <span>视频预览</span>
                </div>
                <div className="video-preview-container">
                  {node.data.videos.map((video, idx) => (
                    <div key={idx} className="video-item">
                      <div className="video-info">
                        <span className="video-title">{video.title || `视频 ${idx + 1}`}</span>
                        <span className="video-duration">{video.duration}s</span>
                      </div>
                      {video.url && (
                        <video
                          src={video.url}
                          controls
                          className="video-player"
                          preload="metadata"
                        />
                      )}
                      {video.description && (
                        <p className="video-description">{video.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!node.data.videoPrompt && !node.data.genParams && !node.data.videos?.length && (
              <div className="result-empty"><p>暂无结果内容</p></div>
            )}
          </div>
        );

      case 'videoEditor':
        return (
          <div className="result-section">
            <div className="section-header">
              <Video size={14} />
              <span>待剪辑视频 ({node.data.videos?.length || 0})</span>
            </div>
            {node.data.videos?.length > 0 ? (
              <div className="video-list">
                {node.data.videos.map((video, idx) => (
                  <div key={idx} className="video-list-item">
                    <span className="video-name">{video.name || `视频 ${idx + 1}`}</span>
                    <span className="video-duration">{video.duration}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="result-empty"><p>暂无待剪辑视频</p></div>
            )}
          </div>
        );

      default:
        return (
          <div className="result-section">
            <div className="section-header">
              <FileText size={14} />
              <span>结果内容</span>
            </div>
            {node.data.result ? (
              <textarea className="result-textarea readonly" value={node.data.result} readOnly />
            ) : node.data.imageUrl ? (
              <img
                src={node.data.imageUrl}
                alt={node.name}
                className="result-image-full"
                onClick={() => setPreviewImage({ src: node.data.imageUrl, alt: node.name })}
              />
            ) : node.data.videoUrl ? (
              <video src={node.data.videoUrl} controls className="result-video-full" />
            ) : (
              <div className="result-empty"><p>暂无结果内容</p></div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="workspace-tab-content result-tab">
      {/* 结果头部 */}
      <div className="result-header">
        <div className="result-meta">
          <span className="version-badge">V{currentVersion}</span>
          {isRevised && (
            <span className="revised-badge">
              <RotateCcw size={10} />
              修订版
            </span>
          )}
          {isLocked && (
            <span className="locked-badge">
              <Lock size={10} />
              已锁定
            </span>
          )}
        </div>

        <button
          className="version-history-toggle"
          onClick={() => setShowVersionHistory(!showVersionHistory)}
        >
          <History size={14} />
          版本历史
          <ChevronDown size={14} className={showVersionHistory ? 'open' : ''} />
        </button>
      </div>

      {/* 版本历史下拉 */}
      <AnimatePresence>
        {showVersionHistory && (
          <motion.div
            className="version-history-dropdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {versionHistory.map((v, idx) => (
              <div key={idx} className={`version-history-item ${v.isCurrent ? 'current' : ''}`}>
                <div className="version-history-left">
                  <span className="version-name">{v.version}</span>
                  <span className="version-type">{v.type}</span>
                </div>
                <div className="version-history-right">
                  <span className="version-time">{v.time}</span>
                  {v.isCurrent && <span className="current-indicator"><Check size={12} /></span>}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 结果来源链 */}
      {isRevised && baseVersion && (
        <div className="result-source">
          <span className="source-label">来源</span>
          <span className="source-link">基于 {baseVersion} 修订</span>
        </div>
      )}

      {/* 节点特定的结果内容 */}
      <div className="result-content">
        {renderNodeResult()}
      </div>

      {/* 状态指示器 */}
      <div className={`status-indicator ${status}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {status === 'completed' && '已完成'}
          {status === 'running' && '运行中'}
          {status === 'failed' && '失败'}
          {status === 'stale' && '依赖失效'}
          {status === 'awaiting_apply' && '待应用'}
        </span>
      </div>

      {/* 图片预览模态框 */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="image-preview-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              className="image-preview-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="image-preview-close" onClick={() => setPreviewImage(null)}>
                <X size={20} />
              </button>
              <img src={previewImage.src} alt={previewImage.alt} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 对话 Tab
const ChatTab = ({ node }) => {
  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <MessageCircle size={32} />
          <p>选择一个节点开始对话</p>
        </div>
      </div>
    );
  }

  // 模拟对话数据
  const [messages, setMessages] = useState([
    { role: 'user', content: '把结尾改成开放式' },
    { role: 'assistant', content: '我理解你要修改编剧节点的结尾部分，改为开放式结局。' },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 模拟提案
  const hasProposal = true;
  const proposal = {
    type: 'revision',
    summary: '结尾从"悲剧收场"改为"开放式结局"',
    diff: {
      before: '...主角最终在孤独中离世，留下无尽的遗憾。',
      after: '...主角站在分岔路口，望向远方的城市灯火，故事在此戛然而止。'
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages([...messages, { role: 'user', content: inputValue }]);
    setInputValue('');
    setIsTyping(true);

    // 模拟 AI 回复
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '我理解你要修改结尾。让我生成一个提案...'
      }]);
    }, 1500);
  };

  return (
    <div className="workspace-tab-content chat-tab">
      {/* 提案提示 */}
      {hasProposal && (
        <div className="proposal-banner">
          <div className="proposal-summary">
            <AlertTriangle size={14} />
            <span>有待应用的提案：{proposal.summary}</span>
          </div>
          <div className="proposal-actions">
            <button className="proposal-btn apply">应用提案</button>
            <button className="proposal-btn view-diff">查看差异</button>
            <button className="proposal-btn regenerate">重生成</button>
          </div>
        </div>
      )}

      {/* 对话消息列表 */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content typing">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
      </div>

      {/* 对话输入框 */}
      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder="输入修改指令..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="chat-send-btn" onClick={handleSend}>
          发送
        </button>
      </div>
    </div>
  );
};

// 配置 Tab
const ConfigTab = ({ node, onNodeUpdate }) => {
  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <Settings size={32} />
          <p>选择一个节点查看配置</p>
        </div>
      </div>
    );
  }

  // 更新节点数据
  const updateNodeData = (data) => {
    onNodeUpdate?.(node.id, data);
  };

  // 根据节点类型显示不同的配置项
  const getConfigFields = () => {
    switch (node.type) {
      case 'content': // 编剧
        return [
          { label: '故事类型', value: node.data?.storyType || '未设置', type: 'select', options: ['剧情片', '喜剧', '悬疑', '科幻'] },
          { label: '风格', value: node.data?.style || '现实主义', type: 'select', options: ['现实主义', '浪漫主义', '超现实主义'] },
          { label: '集数', value: node.data?.episodes || 1, type: 'number' },
          { label: '每集时长', value: node.data?.duration || '45分钟', type: 'text' },
        ];
      case 'visual': // 美术
        return [
          { label: '视觉风格', value: node.data?.visualStyle || '写实', type: 'select', options: ['写实', '动漫', '水墨', '赛博朋克'] },
          { label: '色彩风格', value: node.data?.colorStyle || '暖色调', type: 'select', options: ['暖色调', '冷色调', '高饱和', '低饱和'] },
          { label: '分辨率', value: node.data?.resolution || '1080p', type: 'select', options: ['720p', '1080p', '2K', '4K'] },
        ];
      case 'director': // 分镜
        return [
          { label: '镜头语言', value: node.data?.shotStyle || '标准', type: 'select', options: ['标准', '电影感', '快速剪辑'] },
          { label: '画幅比例', value: node.data?.aspectRatio || '16:9', type: 'select', options: ['16:9', '2.35:1', '1:1', '9:16'] },
        ];
      case 'technical': // 提示词工程师
        return [
          { label: '启用', value: node.data?.enabled !== false, type: 'boolean' },
        ];
      case 'videoGen': // 视频生成
        return [
          { label: '生成模型', value: node.data?.model || 'VideoGen V2', type: 'select', options: ['VideoGen V1', 'VideoGen V2', 'VideoGen V3'] },
          { label: '生成时长', value: node.data?.duration || '5秒', type: 'select', options: ['3秒', '5秒', '10秒'] },
          { label: '帧率', value: node.data?.fps || 30, type: 'number' },
        ];
      default:
        return [
          { label: '启用', value: node.data?.enabled !== false, type: 'boolean' },
        ];
    }
  };

  // 渲染自动生成配置（仅技术节点）
  const renderAutoGenConfig = () => {
    if (node.type !== 'technical') return null;

    const autoGenConfig = node.data?.autoGenConfig || { mode: 'manual', count: 0 };

    const setMode = (mode) => {
      updateNodeData({ autoGenConfig: { ...autoGenConfig, mode } });
    };

    const setCount = (count) => {
      updateNodeData({ autoGenConfig: { ...autoGenConfig, count } });
    };

    return (
      <div className="auto-gen-config">
        <div className="auto-gen-header">
          <Play size={14} />
          <span>自动生成视频节点</span>
          <span className={`config-badge ${autoGenConfig.mode}`}>
            {autoGenConfig.mode === 'auto' ? '自动' : '手动'}
          </span>
        </div>
        <div className="auto-gen-body">
          <div className="config-row">
            <label className="config-label">生成模式：</label>
            <div className="config-options">
              <button
                className={`config-option ${autoGenConfig.mode === 'manual' ? 'active' : ''}`}
                onClick={() => setMode('manual')}
              >
                手动
              </button>
              <button
                className={`config-option ${autoGenConfig.mode === 'auto' ? 'active' : ''}`}
                onClick={() => setMode('auto')}
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
                  placeholder="全部"
                  min="0"
                  onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                />
                <span className="config-hint">0 = 全部</span>
              </div>
            </div>
          )}
          <div className="config-row">
            <label className="config-label">提示词数量：</label>
            <span className="config-value">{node.data?.prompts?.length || 0} 个</span>
          </div>
        </div>
      </div>
    );
  };

  const configFields = getConfigFields();

  return (
    <div className="workspace-tab-content config-tab">
      <div className="config-header">
        <span className="config-title">节点配置</span>
        <span className="config-node-type">{node.name}</span>
      </div>

      <div className="config-fields">
        {configFields.map((field, idx) => (
          <div key={idx} className="config-field">
            <label className="config-label">{field.label}</label>
            {field.type === 'select' ? (
              <select className="config-select" value={field.value}>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'boolean' ? (
              <label className="config-toggle">
                <input type="checkbox" checked={field.value} />
                <span className="toggle-slider"></span>
              </label>
            ) : field.type === 'number' ? (
              <input
                type="number"
                className="config-input"
                value={field.value}
                min={0}
              />
            ) : (
              <input
                type="text"
                className="config-input"
                value={field.value}
              />
            )}
          </div>
        ))}
      </div>

      {/* 自动生成配置（技术节点专用） */}
      {renderAutoGenConfig()}

      <div className="config-actions">
        <button className="config-save-btn">保存配置</button>
        <button className="config-reset-btn">重置</button>
      </div>
    </div>
  );
};

// 运行记录 Tab
const HistoryTab = ({ node }) => {
  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <History size={32} />
          <p>选择一个节点查看运行记录</p>
        </div>
      </div>
    );
  }

  // 模拟运行记录
  const runRecords = [
    { id: 1, version: 'v3', time: '1小时前', duration: '45秒', status: 'success', input: '完整的剧本内容', output: '修订版剧本' },
    { id: 2, version: 'v2', time: '2小时前', duration: '52秒', status: 'success', input: '初稿剧本', output: '二稿剧本' },
    { id: 3, version: 'v1', time: '3小时前', duration: '38秒', status: 'success', input: '故事大纲', output: '完整剧本' },
  ];

  const [expandedRecord, setExpandedRecord] = useState(null);

  return (
    <div className="workspace-tab-content history-tab">
      <div className="history-header">
        <span className="history-title">运行记录</span>
        <span className="history-count">{runRecords.length} 条</span>
      </div>

      <div className="run-records">
        {runRecords.map((record) => (
          <div
            key={record.id}
            className={`run-record-item ${expandedRecord === record.id ? 'expanded' : ''}`}
          >
            <div
              className="run-record-header"
              onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
            >
              <div className="record-left">
                <span className={`record-status ${record.status}`}>
                  {record.status === 'success' ? <Check size={12} /> : <AlertTriangle size={12} />}
                </span>
                <span className="record-version">{record.version}</span>
              </div>
              <div className="record-right">
                <span className="record-time">{record.time}</span>
                <span className="record-duration">{record.duration}</span>
              </div>
            </div>

            <AnimatePresence>
              {expandedRecord === record.id && (
                <motion.div
                  className="run-record-detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="record-detail-section">
                    <span className="detail-label">输入</span>
                    <div className="detail-content">{record.input}</div>
                  </div>
                  <div className="record-detail-section">
                    <span className="detail-label">输出</span>
                    <div className="detail-content">{record.output}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

// 影响 Tab
const ImpactTab = ({ node }) => {
  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <GitBranch size={32} />
          <p>选择一个节点查看影响范围</p>
        </div>
      </div>
    );
  }

  // 模拟下游节点
  const downstreamNodes = [
    { id: 'node_3', name: '分镜导演', status: 'stale', reason: '依赖节点已修改' },
    { id: 'node_4', name: '视频生成', status: 'stale', reason: '依赖节点已修改' },
  ];

  // 模拟上游节点
  const upstreamNodes = [
    { id: 'node_1', name: '资深制片人', status: 'completed' },
  ];

  const isStale = node.data?.status === 'stale';

  return (
    <div className="workspace-tab-content impact-tab">
      {/* 当前节点状态 */}
      <div className="impact-section">
        <div className="impact-section-header">
          <span className="section-title">当前节点</span>
        </div>
        <div className={`current-node-status ${node.data?.status || 'ready'}`}>
          <div className="node-info">
            <span className="node-name">{node.name}</span>
            <span className={`node-status-badge ${node.data?.status || 'ready'}`}>
              {node.data?.status === 'stale' && '依赖失效'}
              {node.data?.status === 'completed' && '已完成'}
              {node.data?.status === 'running' && '运行中'}
              {!node.data?.status && '就绪'}
            </span>
          </div>
        </div>
      </div>

      {/* 下游影响 */}
      <div className="impact-section">
        <div className="impact-section-header">
          <span className="section-title">下游影响</span>
          <span className="impact-count">{downstreamNodes.length} 个节点</span>
        </div>
        {downstreamNodes.length > 0 ? (
          <div className="downstream-nodes">
            {downstreamNodes.map((dn) => (
              <div key={dn.id} className="downstream-node-item">
                <div className="node-connection-line">
                  <GitBranch size={12} />
                </div>
                <div className="node-info">
                  <span className="node-name">{dn.name}</span>
                  <span className={`node-status-badge ${dn.status}`}>
                    <AlertTriangle size={10} />
                    {dn.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="impact-empty">无下游节点</div>
        )}
      </div>

      {/* 建议操作 */}
      {downstreamNodes.length > 0 && (
        <div className="impact-section">
          <div className="impact-section-header">
            <span className="section-title">建议操作</span>
          </div>
          <div className="suggested-actions">
            <button className="action-btn primary">
              从当前节点重新运行
            </button>
            <button className="action-btn secondary">
              查看完整影响范围
            </button>
          </div>
        </div>
      )}

      {/* 上游依赖 */}
      <div className="impact-section">
        <div className="impact-section-header">
          <span className="section-title">上游依赖</span>
        </div>
        <div className="upstream-nodes">
          {upstreamNodes.map((un) => (
            <div key={un.id} className="upstream-node-item">
              <span className="node-name">{un.name}</span>
              <span className={`node-status-badge ${un.status}`}>
                <Check size={10} />
                已完成
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 主组件
const NodeWorkspace = ({ selectedNode, onNodeUpdate, onGenerateVideo }) => {
  const [activeTab, setActiveTab] = useState('result');

  const tabs = [
    { id: 'result', label: '结果', icon: 'result' },
    { id: 'chat', label: '对话', icon: 'chat' },
    { id: 'config', label: '配置', icon: 'config' },
    { id: 'history', label: '记录', icon: 'history' },
    { id: 'impact', label: '影响', icon: 'impact' },
  ];

  // Tab 内容组件映射
  const tabContentMap = {
    result: <ResultTab node={selectedNode} onGenerateVideo={onGenerateVideo} />,
    chat: <ChatTab node={selectedNode} />,
    config: <ConfigTab node={selectedNode} onNodeUpdate={onNodeUpdate} />,
    history: <HistoryTab node={selectedNode} />,
    impact: <ImpactTab node={selectedNode} />,
  };

  // 无节点时的项目概览
  const renderProjectOverview = () => (
    <div className="workspace-tab-content project-overview">
      <div className="overview-header">
        <h3>项目概览</h3>
      </div>
      <div className="overview-stats">
        <div className="stat-item">
          <span className="stat-value">4</span>
          <span className="stat-label">节点数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">2</span>
          <span className="stat-label">待处理</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">1</span>
          <span className="stat-label">运行中</span>
        </div>
      </div>
      <div className="overview-hint">
        <p>从画布选择一个节点查看详情</p>
      </div>
    </div>
  );

  return (
    <div className="node-workspace">
      {/* 节点信息区域 */}
      {selectedNode && (
        <div className="workspace-node-info">
          <div className="node-info-icon" style={{ backgroundColor: selectedNode.color }}>
            <Target size={14} />
          </div>
          <div className="node-info-content">
            <span className="node-info-name">{selectedNode.name}</span>
            <span className="node-info-type">{selectedNode.type}</span>
          </div>
        </div>
      )}

      {/* Tab 栏 */}
      <div className="workspace-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`workspace-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <TabIcon type={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="workspace-tab-panel">
        {selectedNode ? (
          tabContentMap[activeTab]
        ) : (
          renderProjectOverview()
        )}
      </div>
    </div>
  );
};

export default NodeWorkspace;
