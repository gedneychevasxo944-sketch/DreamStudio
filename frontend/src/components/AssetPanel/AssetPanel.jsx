import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Video, Palette, Target, Code, Maximize2, Users, Image, Layers, Sparkles, ChevronUp, ChevronDown, Shield, CheckCircle, AlertCircle, Play, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import './AssetPanel.css';

// 流式文本组件
const StreamingText = ({ text, isStreaming }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!isStreaming) {
      setDisplayText(text);
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [text, isStreaming]);

  return <span>{displayText}{isStreaming && <span className="cursor">|</span>}</span>;
};

// 思考过程展开组件
const ThinkingExpanded = ({ thinking, thinkingIndex }) => {
  return (
    <motion.div
      className="thinking-expanded"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      {thinking.slice(0, thinkingIndex).map((item, index) => (
        <div key={index} className="thinking-item">
          <div className="thinking-step">步骤 {index + 1}</div>
          <div className="thinking-text-content">{item}</div>
        </div>
      ))}
    </motion.div>
  );
};

// 制片人节点内容 - 弹窗完整展示
const ProducerAssetContent = ({ data }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  return (
    <div className="asset-node-content producer-node">
      {data?.thinking && data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>思考过程</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={data.thinking}
                thinkingIndex={data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <div className="result-section">
        <textarea
          className="result-textarea"
          value={data?.result || ''}
          readOnly
          placeholder="暂无内容"
        />
      </div>
    </div>
  );
};

// 编剧节点内容 - 弹窗完整展示（集数-场景层级）
const WriterAssetContent = ({ data }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [expandedEpisodes, setExpandedEpisodes] = useState(new Set([0]));
  const [expandedScenes, setExpandedScenes] = useState(new Set());
  
  const { episodes, totalScenes } = parseScript(data?.result);
  
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

  return (
    <div className="asset-node-content writer-node">
      {data?.thinking && data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>思考过程</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={data.thinking}
                thinkingIndex={data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <div className="script-detail-section">
        <div className="section-header">
          <FileText size={14} />
          <span>分场剧本详情</span>
          <span className="script-stats-badge">共 {episodes.length} 集 · {totalScenes} 场</span>
        </div>
        
        {episodes.length === 0 ? (
          <div className="script-empty">暂无剧本内容</div>
        ) : (
          <div className="episodes-detail-list">
            {episodes.map((episode) => (
              <div key={episode.id} className="episode-detail-item">
                <div 
                  className="episode-detail-header"
                  onClick={() => toggleEpisode(episode.id)}
                >
                  <div className="episode-detail-title">
                    <span className="episode-name">{episode.title}</span>
                    <span className="episode-scene-count">{episode.sceneRange}</span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`episode-chevron ${expandedEpisodes.has(episode.id) ? 'expanded' : ''}`}
                  />
                </div>
                
                <AnimatePresence>
                  {expandedEpisodes.has(episode.id) && (
                    <motion.div
                      className="episode-scenes-detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {episode.scenes.map((scene) => (
                        <div key={scene.id} className="scene-detail-item">
                          <div 
                            className="scene-detail-header"
                            onClick={() => toggleScene(scene.id)}
                          >
                            <span className="scene-name">{scene.title}</span>
                            <ChevronDown 
                              size={14} 
                              className={`scene-chevron ${expandedScenes.has(scene.id) ? 'expanded' : ''}`}
                            />
                          </div>
                          <AnimatePresence>
                            {expandedScenes.has(scene.id) && (
                              <motion.div
                                className="scene-content-text"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                              >
                                {scene.content}
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
        )}
      </div>
    </div>
  );
};

// 美术节点内容 - 弹窗完整展示
const VisualAssetContent = ({ data }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  return (
    <div className="asset-node-content visual-node">
      {data?.thinking && data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>思考过程</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={data.thinking}
                thinkingIndex={data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <div className="visual-section">
        <div className="section-header">
          <Palette size={14} />
          <span>整体风格</span>
        </div>
        <textarea
          className="visual-textarea"
          value={data?.overallStyle || ''}
          readOnly
          placeholder="描述整体美术风格..."
        />
      </div>

      {data?.characters && data.characters.length > 0 && (
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
            {data.characters.map((char) => (
              <div key={char.id} className="character-table-row">
                <input value={char.name} readOnly placeholder="角色名" />
                <input value={char.description} readOnly placeholder="角色描述" />
                <div className="character-thumbnail">
                  <img src={char.thumbnail} alt={char.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.scenes && data.scenes.length > 0 && (
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
            {data.scenes.map((scene) => (
              <div key={scene.id} className="character-table-row">
                <input value={scene.name} readOnly placeholder="场景名" />
                <input value={scene.description} readOnly placeholder="场景描述" />
                <div className="character-thumbnail">
                  <img src={scene.thumbnail} alt={scene.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.props && data.props.length > 0 && (
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
            {data.props.map((prop) => (
              <div key={prop.id} className="character-table-row">
                <input value={prop.name} readOnly placeholder="物品名" />
                <input value={prop.description} readOnly placeholder="物品描述" />
                <div className="character-thumbnail">
                  <img src={prop.thumbnail} alt={prop.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 分镜导演节点内容 - 弹窗完整展示
const DirectorAssetContent = ({ data }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  return (
    <div className="asset-node-content director-node">
      {data?.thinking && data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>思考过程</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={data.thinking}
                thinkingIndex={data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {data?.storyboards && data.storyboards.length > 0 && (
        <div className="storyboard-section">
          <div className="section-header">
            <Video size={14} />
            <span>分镜表格</span>
          </div>
          <div className="storyboard-table">
            <div className="storyboard-table-header">
              <span>镜号</span>
              <span>景别/角度</span>
              <span>运动</span>
              <span>画面内容</span>
              <span>时长(s)</span>
              <span>关键帧</span>
            </div>
            {data.storyboards.map((sb) => (
              <div key={sb.id} className="storyboard-table-row">
                <span>{sb.shotNumber}</span>
                <span>{sb.angle}</span>
                <span>{sb.motion}</span>
                <span>{sb.content}</span>
                <span>{sb.duration}</span>
                <div className="storyboard-thumbnail">
                  <img src={sb.thumbnail} alt={`分镜${sb.shotNumber}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 提示词工程师节点内容 - 弹窗完整展示
const TechnicalAssetContent = ({ data }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  return (
    <div className="asset-node-content technical-node">
      {data?.thinking && data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>思考过程</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={data.thinking}
                thinkingIndex={data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {data?.prompts && data.prompts.length > 0 && (
        <div className="prompts-section">
          <div className="section-header">
            <Code size={14} />
            <span>视频提示词</span>
          </div>
          <div className="prompts-table">
            <div className="prompts-table-header">
              <span>视频</span>
              <span>提示词</span>
              <span>时长</span>
              <span>关键帧</span>
            </div>
            {data.prompts.map((p) => (
              <div key={p.id} className="prompts-table-row">
                <span>{p.shotNumber}</span>
                <span className="prompt-text">{p.prompt}</span>
                <span>{p.duration}s</span>
                <div className="keyframes-thumbnails">
                  {p.keyframes?.map((frame, index) => (
                    <div key={index} className="keyframe-thumb">
                      <img src={frame} alt={`关键帧${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 视频生成节点内容 - 弹窗完整展示
const VideoGenAssetContent = ({ data }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [expandedVideos, setExpandedVideos] = useState(new Set());
  
  // 获取视频组信息
  const videoGroup = data?.videoGroup || [];
  const groupName = data?.groupName || '视频组';
  
  // 如果没有视频组数据，使用单条视频数据兼容
  const videoList = videoGroup.length > 0 ? videoGroup : (data?.videoPrompt ? [{
    id: 'single',
    name: '视频 1',
    prompt: data.videoPrompt,
    genParams: data.genParams,
    videoPreview: data.videoPreview,
    status: data.status || 'completed'
  }] : []);
  
  const toggleVideo = (videoId) => {
    const newSet = new Set(expandedVideos);
    if (newSet.has(videoId)) newSet.delete(videoId);
    else newSet.add(videoId);
    setExpandedVideos(newSet);
  };

  return (
    <div className="asset-node-content video-gen-node">
      {data?.thinking && data.thinking.length > 0 && (
        <>
          <div
            className="thinking-preview"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Sparkles size={12} />
            <span>思考过程</span>
            {isThinkingExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
          </div>
          <AnimatePresence>
            {isThinkingExpanded && (
              <ThinkingExpanded
                thinking={data.thinking}
                thinkingIndex={data.thinking.length}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <div className="video-group-section">
        <div className="section-header">
          <Video size={14} />
          <span>{groupName}</span>
          <span className="video-count-badge">共 {videoList.length} 个视频</span>
        </div>
        
        {videoList.length === 0 ? (
          <div className="video-list-empty">暂无视频</div>
        ) : (
          <div className="video-list">
            {videoList.map((video, index) => (
              <div key={video.id} className="video-list-item">
                <div 
                  className="video-list-header"
                  onClick={() => toggleVideo(video.id)}
                >
                  <div className="video-list-title">
                    <span className="video-number">{index + 1}</span>
                    <span className="video-name">{video.name || `视频 ${index + 1}`}</span>
                    <span className={`video-status ${video.status || 'completed'}`}>
                      {video.status === 'completed' ? '已完成' : '生成中'}
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`video-chevron ${expandedVideos.has(video.id) ? 'expanded' : ''}`}
                  />
                </div>
                
                <AnimatePresence>
                  {expandedVideos.has(video.id) && (
                    <motion.div
                      className="video-detail-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="video-prompt-section">
                        <div className="subsection-header">
                          <FileText size={12} />
                          <span>视频提示词</span>
                        </div>
                        <div className="video-prompt-text">{video.prompt || video.videoPrompt || '暂无提示词'}</div>
                      </div>
                      
                      <div className="video-params-section">
                        <div className="subsection-header">
                          <Target size={12} />
                          <span>生成参数</span>
                        </div>
                        <div className="video-params-grid">
                          <div className="param-item">
                            <span className="param-label">模型</span>
                            <span className="param-value">{video.genParams?.model || 'CogVideoX'}</span>
                          </div>
                          <div className="param-item">
                            <span className="param-label">画质</span>
                            <span className="param-value">{video.genParams?.quality || '720P'}</span>
                          </div>
                          <div className="param-item">
                            <span className="param-label">比例</span>
                            <span className="param-value">{video.genParams?.ratio || '16:9'}</span>
                          </div>
                          <div className="param-item">
                            <span className="param-label">时长</span>
                            <span className="param-value">{video.genParams?.duration || '10s'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {video.videoPreview && (
                        <div className="video-preview-section">
                          <div className="subsection-header">
                            <Play size={12} />
                            <span>视频预览</span>
                          </div>
                          <div className="video-preview-wrapper">
                            <video
                              className="video-preview-player"
                              src="https://www.w3schools.com/html/mov_bbb.mp4"
                              poster={video.videoPreview}
                              controls
                              preload="metadata"
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 根据资产类型渲染完整内容（弹窗使用）
const AssetContent = ({ asset }) => {
  const { type, data } = asset;

  switch (type) {
    case 'producer':
      return <ProducerAssetContent data={data} />;
    case 'content':
      return <WriterAssetContent data={data} />;
    case 'visual':
      return <VisualAssetContent data={data} />;
    case 'director':
      return <DirectorAssetContent data={data} />;
    case 'technical':
      return <TechnicalAssetContent data={data} />;
    case 'videoGen':
      return <VideoGenAssetContent data={data} />;
    default:
      return <div className="asset-empty">暂无内容</div>;
  }
};

// ========== 简化版卡片预览组件 ==========

// 解析剧本函数 - 支持集数-场景层级
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

// 制片人卡片预览 - 只展示项目书前100字
const ProducerCardPreview = ({ data }) => {
  const result = data?.result || '';
  const preview = result.length > 100 ? result.slice(0, 100) + '...' : result;
  
  return (
    <div className="card-preview-text">
      {preview || '暂无内容'}
    </div>
  );
};

// 编剧卡片预览 - 展示概览信息（与画布节点一致）
const WriterCardPreview = ({ data }) => {
  const { episodes, totalScenes } = parseScript(data?.result);
  
  if (episodes.length === 0) {
    return <div className="card-preview-empty">暂无剧本内容</div>;
  }
  
  return (
    <div className="card-preview-overview">
      <div className="overview-text">
        <div className="overview-line">故事概要：共{episodes.length}集，{totalScenes}场戏</div>
        <div className="overview-line">集数范围：第1集-第{episodes.length}集</div>
      </div>
    </div>
  );
};

// 美术卡片预览 - 只展示图片缩略图
const VisualCardPreview = ({ data }) => {
  const images = [];
  
  data?.characters?.forEach(char => {
    if (char.thumbnail) images.push({ src: char.thumbnail, type: '角色' });
  });
  data?.scenes?.forEach(scene => {
    if (scene.thumbnail) images.push({ src: scene.thumbnail, type: '场景' });
  });
  data?.props?.forEach(prop => {
    if (prop.thumbnail) images.push({ src: prop.thumbnail, type: '道具' });
  });

  if (images.length === 0) {
    return <div className="card-preview-empty">暂无图片</div>;
  }

  return (
    <div className="card-preview-images">
      {images.slice(0, 6).map((img, index) => (
        <div key={index} className="card-preview-thumb">
          <img src={img.src} alt={img.type} />
        </div>
      ))}
      {images.length > 6 && (
        <div className="card-preview-more">+{images.length - 6}</div>
      )}
    </div>
  );
};

// 分镜卡片预览 - 只展示关键帧
const DirectorCardPreview = ({ data }) => {
  const storyboards = data?.storyboards || [];
  
  if (storyboards.length === 0) {
    return <div className="card-preview-empty">暂无分镜</div>;
  }

  return (
    <div className="card-preview-images">
      {storyboards.slice(0, 6).map((sb, index) => (
        <div key={index} className="card-preview-thumb">
          <img src={sb.thumbnail} alt={`分镜${sb.shotNumber}`} />
        </div>
      ))}
      {storyboards.length > 6 && (
        <div className="card-preview-more">+{storyboards.length - 6}</div>
      )}
    </div>
  );
};

// 提示词工程师卡片预览 - 只展示前几个提示词
const TechnicalCardPreview = ({ data }) => {
  const prompts = data?.prompts || [];
  
  if (prompts.length === 0) {
    return <div className="card-preview-empty">暂无提示词</div>;
  }

  return (
    <div className="card-preview-prompts">
      {prompts.slice(0, 3).map((p, index) => (
        <div key={index} className="card-preview-prompt-item">
          <span className="prompt-shot">{p.shotNumber}</span>
          <span className="prompt-text-preview">
            {p.prompt.length > 60 ? p.prompt.slice(0, 60) + '...' : p.prompt}
          </span>
        </div>
      ))}
      {prompts.length > 3 && (
        <div className="card-preview-more-text">还有 {prompts.length - 3} 个提示词...</div>
      )}
    </div>
  );
};

// 视频生成卡片预览 - 概览展示一组视频
const VideoGenCardPreview = ({ data }) => {
  // 从data中获取视频组信息
  const videoGroup = data?.videoGroup || [];
  const videoCount = videoGroup.length || (data?.videoPrompt ? 1 : 0);
  const groupName = data?.groupName || '视频组';
  
  return (
    <div className="card-preview-video-group">
      <div className="video-group-icon">
        <Video size={32} />
      </div>
      <div className="video-group-info">
        <div className="video-group-name">{groupName}</div>
        <div className="video-group-count">共 {videoCount} 个视频</div>
      </div>
    </div>
  );
};


// 根据资产类型渲染卡片预览内容
const CardPreviewContent = ({ asset }) => {
  const { type, data } = asset;

  switch (type) {
    case 'producer':
      return <ProducerCardPreview data={data} />;
    case 'content':
      return <WriterCardPreview data={data} />;
    case 'visual':
      return <VisualCardPreview data={data} />;
    case 'director':
      return <DirectorCardPreview data={data} />;
    case 'technical':
      return <TechnicalCardPreview data={data} />;
    case 'videoGen':
      return <VideoGenCardPreview data={data} />;
    default:
      return <div className="card-preview-empty">暂无内容</div>;
  }
};

// 资产卡片预览弹窗
const AssetPreviewModal = ({ asset, isOpen, onClose }) => {
  if (!isOpen || !asset) return null;

  return createPortal(
    <motion.div
      className="asset-preview-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      <motion.div
        className="asset-preview-content"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="asset-preview-header">
          <h3>{asset.nodeName}</h3>
          <button className="preview-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="asset-preview-body">
          <AssetContent asset={asset} />
        </div>
        <div className="asset-preview-footer">
          <span className="asset-version">{asset.version}</span>
          <span className="asset-timestamp">{asset.timestamp}</span>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

// 版本选择下拉框组件
const VersionSelector = ({ versions, currentVersion, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="version-selector" ref={dropdownRef}>
      <button 
        className="version-selector-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span>V{currentVersion}</span>
        <ChevronDownIcon size={14} className={isOpen ? 'rotate' : ''} />
      </button>
      
      {isOpen && (
        <div className="version-dropdown">
          {versions.map((v) => (
            <div
              key={v.version}
              className={`version-option ${v.version === currentVersion ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(v.version);
                setIsOpen(false);
              }}
            >
              <span className="version-label">V{v.version}</span>
              <span className="version-time">{formatTime(v.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 资产卡片组件 - 带版本管理
const AssetCard = ({ asset, onClick, onVersionChange }) => {
  const getNodeIcon = (type) => {
    switch (type) {
      case 'producer': return Target;
      case 'visual': return Palette;
      case 'director': return Video;
      case 'technical': return Code;
      case 'videoGen': return Video;
      default: return FileText;
    }
  };

  const Icon = getNodeIcon(asset.type);

  // 构建版本列表（视频组不显示版本选择）
  const versions = [];
  if (!asset.isVideoGroup && asset.versionHistory && asset.versionHistory.length > 0) {
    asset.versionHistory.forEach(h => {
      versions.push({ version: h.version, timestamp: h.timestamp });
    });
  }
  // 添加当前版本
  if (!asset.isVideoGroup) {
    versions.push({ 
      version: asset.currentVersion || 1, 
      timestamp: asset.timestamp 
    });
  }

  const handleVersionChange = (version) => {
    onVersionChange(asset.nodeId, version);
  };

  return (
    <motion.div
      className="asset-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="asset-card-header">
        <div className="asset-node-info">
          <Icon size={14} />
          <span className="node-name">{asset.nodeName}</span>
        </div>
        {versions.length > 0 && (
          <VersionSelector 
            versions={versions}
            currentVersion={asset.displayVersion || asset.currentVersion || 1}
            onChange={handleVersionChange}
          />
        )}
      </div>

      <div 
        className="asset-card-content-simple"
        onClick={() => onClick(asset)}
        style={{ cursor: 'pointer' }}
      >
        <CardPreviewContent asset={asset} />
      </div>

      <div className="asset-card-footer">
        <span className="asset-timestamp">
          {new Date(asset.timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
        <span className="click-hint">点击查看详情</span>
      </div>
    </motion.div>
  );
};

// 主资产面板组件
const AssetPanel = ({ nodes = [], onExport, onUpdateNodeData }) => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef(null);

  // 检查节点是否有可展示的内容（检查所有版本）
  const hasNodeContent = (node) => {
    if (!node.data) return false;
    
    // 检查当前版本
    const hasCurrentContent = node.data.hasResult ||
           node.data.result ||
           node.data.characters?.length > 0 ||
           node.data.scenes?.length > 0 ||
           node.data.props?.length > 0 ||
           node.data.storyboards?.length > 0 ||
           node.data.prompts?.length > 0 ||
           node.data.videoPreview ||
           node.data.videoPrompt ||
           node.data.auditResult;
    
    if (hasCurrentContent) return true;
    
    // 检查历史版本
    const versionHistory = node.data.versionHistory || [];
    return versionHistory.some(h => 
      h.data?.hasResult ||
      h.data?.result ||
      h.data?.characters?.length > 0 ||
      h.data?.scenes?.length > 0 ||
      h.data?.props?.length > 0 ||
      h.data?.storyboards?.length > 0 ||
      h.data?.prompts?.length > 0 ||
      h.data?.videoPreview ||
      h.data?.videoPrompt ||
      h.data?.auditResult
    );
  };

  // 从节点数据生成资产列表
  useEffect(() => {
    // 分离视频生成节点和其他节点
    const videoGenNodes = nodes.filter(n => n.type === 'videoGen' && hasNodeContent(n));
    const otherNodes = nodes.filter(n => n.type !== 'videoGen' && hasNodeContent(n));
    
    // 按来源分组视频生成节点
    // 节点ID格式: videoGen-${timestamp}-${i}-${random}
    // 使用timestamp作为分组key，同一时间创建的视频属于同一组
    const videoGroups = new Map();
    videoGenNodes.forEach(node => {
      const parts = node.id.split('-');
      // 提取时间戳部分 (videoGen-${timestamp}-...)
      const groupKey = parts.length >= 2 ? parts[1] : 'unknown';
      
      if (!videoGroups.has(groupKey)) {
        videoGroups.set(groupKey, []);
      }
      videoGroups.get(groupKey).push(node);
    });
    
    // 生成其他节点的资产
    const otherAssets = otherNodes.map((node) => {
      const currentVersion = node.data?.currentVersion || 1;
      const versionHistory = node.data?.versionHistory || [];
      const displayVersion = node.data?.displayVersion || currentVersion;
      
      // 直接从版本数组获取对应版本的数据
      let displayData = node.data;
      
      if (displayVersion !== currentVersion) {
        const historyEntry = versionHistory.find(h => h.version === displayVersion);
        if (historyEntry && historyEntry.data) {
          displayData = historyEntry.data;
        }
      }
      
      return {
        id: `${node.id}-v${displayVersion}`,
        nodeId: node.id,
        nodeName: node.name,
        type: node.type,
        version: `V${displayVersion}`,
        currentVersion: currentVersion,
        displayVersion: displayVersion,
        timestamp: displayData?.timestamp || new Date().toISOString(),
        data: displayData,
        versionHistory: versionHistory,
        allVersions: versionHistory.map(h => h.version).concat([currentVersion])
      };
    });
    
    // 生成视频组合并资产
    const videoGroupAssets = Array.from(videoGroups.entries()).map(([groupKey, videoNodes]) => {
      const videoGroup = videoNodes.map((node, index) => ({
        id: node.id,
        name: node.name,
        prompt: node.data?.videoPrompt || '',
        genParams: node.data?.genParams,
        videoPreview: node.data?.videoPreview,
        status: node.data?.status || 'completed',
        shotNumber: node.data?.shotNumber || `镜头${index + 1}`
      }));
      
      // 获取最早的时间戳
      const timestamps = videoNodes.map(n => n.data?.timestamp).filter(Boolean);
      const earliestTimestamp = timestamps.length > 0 
        ? timestamps.sort()[0] 
        : new Date().toISOString();
      
      return {
        id: `videoGroup-${groupKey}`,
        nodeId: groupKey,
        nodeName: `视频生成组`,
        type: 'videoGen',
        version: 'V1',
        currentVersion: 1,
        displayVersion: 1,
        timestamp: earliestTimestamp,
        data: {
          groupName: '视频生成组',
          videoGroup: videoGroup,
          videoCount: videoGroup.length
        },
        versionHistory: [],
        allVersions: [1],
        isVideoGroup: true
      };
    });
    
    const generatedAssets = [...otherAssets, ...videoGroupAssets];
    setAssets(generatedAssets);
  }, [nodes]);

  // 资产列表更新时自动滚动到底部（只在资产数量增加时滚动）
  const prevAssetsLengthRef = useRef(0);
  useEffect(() => {
    if (contentRef.current && assets.length > 0 && assets.length > prevAssetsLengthRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
    prevAssetsLengthRef.current = assets.length;
  }, [assets]);

  const handleCardClick = (asset) => {
    setSelectedAsset(asset);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedAsset(null);
  };

  const handleVersionChange = (nodeId, version) => {
    // 更新节点数据中的 displayVersion
    if (onUpdateNodeData) {
      onUpdateNodeData(nodeId, { displayVersion: version });
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(assets);
    }
  };

  return (
    <div className="asset-panel">
      <div className="asset-panel-header">
        <h2 className="panel-title">当前资产</h2>
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={assets.length === 0}
        >
          <Download size={14} />
          <span>导出资产</span>
        </button>
      </div>

      <div className="asset-panel-content" ref={contentRef}>
        {assets.length === 0 ? (
          <div className="asset-empty-state">
            <FileText size={48} className="empty-icon" />
            <p>画布中暂无生成结果的节点</p>
            <span>节点生成结果后将自动同步到这里</span>
          </div>
        ) : (
          <div className="asset-cards-list">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={handleCardClick}
                onVersionChange={handleVersionChange}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPreview && (
          <AssetPreviewModal
            asset={selectedAsset}
            isOpen={showPreview}
            onClose={handleClosePreview}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetPanel;
