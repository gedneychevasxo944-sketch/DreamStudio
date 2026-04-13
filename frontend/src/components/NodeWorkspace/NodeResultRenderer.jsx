import { FileText, List, Palette, Users, Image, Layers, Video, Code, Play, Zap } from 'lucide-react';
import { parseScript } from '../../utils/scriptUtils';

/**
 * 统一的节点结果渲染组件
 * @param {string} nodeType - 节点类型 (producer, content, visual, director, technical, videoGen, videoEditor)
 * @param {string} resultText - 原始文本结果
 * @param {Object} displayData - 已解析的结构化数据
 * @param {Function} onPreviewImage - 点击缩略图的回调 (src, alt) => void
 * @param {Function} onGenerateVideo - technical 节点生成视频的回调 (promptIndex) => void
 * @param {number} generatingPrompt - 当前正在生成的 prompt 索引
 */
const NodeResultRenderer = ({
  nodeType,
  resultText,
  displayData,
  onPreviewImage,
  onGenerateVideo,
  generatingPrompt,
}) => {
  const renderByType = () => {
    switch (nodeType) {
      case 'producer':
        return (
          <div className="result-section">
            <div className="section-header">
              <FileText size={14} />
              <span>结果内容</span>
            </div>
            <textarea
              className="result-textarea readonly"
              value={resultText}
              readOnly
              placeholder="等待生成结果..."
            />
          </div>
        );

      case 'content':
        try {
          const { episodes, totalScenes } = parseScript(resultText);
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
        } catch (e) {
          return (
            <div className="result-section">
              <textarea className="result-textarea readonly" value={resultText} readOnly />
            </div>
          );
        }

      case 'visual':
        return (
          <div className="result-section">
            {displayData.overallStyle && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Palette size={14} />
                  <span>整体风格</span>
                </div>
                <textarea
                  className="result-textarea readonly"
                  value={displayData.overallStyle}
                  readOnly
                />
              </div>
            )}

            {displayData.characters?.length > 0 && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Users size={14} />
                  <span>角色 ({displayData.characters.length})</span>
                </div>
                <div className="character-table">
                  <div className="character-table-header">
                    <span>姓名</span>
                    <span>描述</span>
                    <span>缩略图</span>
                  </div>
                  {displayData.characters.map((char, idx) => (
                    <div key={idx} className="character-table-row">
                      <span className="char-name">{char.name}</span>
                      <span className="char-desc">{char.description}</span>
                      {char.thumbnail && (
                        <img
                          src={char.thumbnail}
                          alt={char.name}
                          className="table-thumb"
                          onClick={() => onPreviewImage?.(char.thumbnail, char.name)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayData.scenes?.length > 0 && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Image size={14} />
                  <span>场景 ({displayData.scenes.length})</span>
                </div>
                <div className="character-table">
                  <div className="character-table-header">
                    <span>名称</span>
                    <span>描述</span>
                    <span>缩略图</span>
                  </div>
                  {displayData.scenes.map((scene, idx) => (
                    <div key={idx} className="character-table-row">
                      <span className="char-name">{scene.name}</span>
                      <span className="char-desc">{scene.description}</span>
                      {scene.thumbnail && (
                        <img
                          src={scene.thumbnail}
                          alt={scene.name}
                          className="table-thumb"
                          onClick={() => onPreviewImage?.(scene.thumbnail, scene.name)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayData.props?.length > 0 && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Layers size={14} />
                  <span>物品 ({displayData.props.length})</span>
                </div>
                <div className="character-table">
                  <div className="character-table-header">
                    <span>名称</span>
                    <span>描述</span>
                    <span>缩略图</span>
                  </div>
                  {displayData.props.map((prop, idx) => (
                    <div key={idx} className="character-table-row">
                      <span className="char-name">{prop.name}</span>
                      <span className="char-desc">{prop.description}</span>
                      {prop.thumbnail && (
                        <img
                          src={prop.thumbnail}
                          alt={prop.name}
                          className="table-thumb"
                          onClick={() => onPreviewImage?.(prop.thumbnail, prop.name)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!displayData.overallStyle && !displayData.characters?.length && !displayData.scenes?.length && !displayData.props?.length && (
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
            {displayData.storyboards?.length > 0 ? (
              <div className="storyboard-table">
                <div className="storyboard-table-header">
                  <span>镜号</span>
                  <span>景别/角度</span>
                  <span>运动</span>
                  <span>画面内容</span>
                  <span>时长</span>
                  <span>关键帧</span>
                </div>
                {displayData.storyboards.map((sb, idx) => (
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
                        onClick={() => onPreviewImage?.(sb.thumbnail, `分镜${sb.shotNumber}`)}
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
            {displayData.prompts?.length > 0 ? (
              <div className="prompt-table">
                <div className="prompt-table-header">
                  <span>镜号</span>
                  <span>提示词</span>
                  <span>时长(s)</span>
                  <span>关键帧</span>
                  <span>操作</span>
                </div>
                {displayData.prompts.map((p, idx) => (
                  <div key={idx} className="prompt-table-row">
                    <span className="prompt-shot-number">{p.shotNumber}</span>
                    <span className="prompt-text">{p.prompt}</span>
                    <span className="prompt-duration">{p.duration}</span>
                    <div className="keyframes-thumbnails">
                      {p.keyframes?.map((frame, kIdx) => (
                        <div
                          key={kIdx}
                          className="keyframe-thumb"
                          onClick={() => onPreviewImage?.(frame, `关键帧${kIdx + 1}`)}
                        >
                          <img src={frame} alt={`关键帧${kIdx + 1}`} />
                        </div>
                      ))}
                    </div>
                    <button
                      className={`generate-video-btn ${generatingPrompt === idx ? 'generating' : ''}`}
                      onClick={() => onGenerateVideo?.(idx)}
                      disabled={generatingPrompt === idx}
                    >
                      {generatingPrompt === idx ? (
                        <span className="spin">生成中</span>
                      ) : (
                        <span>生成</span>
                      )}
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
            {displayData.videoPrompt && (
              <div className="video-gen-section">
                <div className="section-header">
                  <FileText size={14} />
                  <span>视频提示词</span>
                </div>
                <textarea
                  className="result-textarea readonly"
                  value={displayData.videoPrompt}
                  readOnly
                />
              </div>
            )}

            {displayData.genParams && (
              <div className="video-gen-section">
                <div className="section-header">
                  <Zap size={14} />
                  <span>生成参数</span>
                </div>
                <div className="gen-params-table">
                  <div className="gen-params-row">
                    <span className="param-label">模型</span>
                    <span className="param-value">{displayData.genParams.model}</span>
                  </div>
                  <div className="gen-params-row">
                    <span className="param-label">画质</span>
                    <span className="param-value">{displayData.genParams.quality}</span>
                  </div>
                  <div className="gen-params-row">
                    <span className="param-label">比例</span>
                    <span className="param-value">{displayData.genParams.ratio}</span>
                  </div>
                  <div className="gen-params-row">
                    <span className="param-label">时长</span>
                    <span className="param-value">{displayData.genParams.duration}</span>
                  </div>
                </div>
              </div>
            )}

            {displayData.videos?.length > 0 && (
              <div className="video-gen-section">
                <div className="section-header">
                  <Play size={14} />
                  <span>视频预览</span>
                </div>
                <div className="video-preview-container">
                  {displayData.videos.map((video, idx) => (
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

            {displayData.videoPreview && !displayData.videos?.length && (
              <div className="video-gen-section">
                <div className="section-header">
                  <Play size={14} />
                  <span>视频预览</span>
                </div>
                <div className="video-preview-container">
                  <video
                    src={displayData.videoPreview}
                    controls
                    className="video-player"
                    preload="metadata"
                  />
                </div>
              </div>
            )}

            {!displayData.videoPrompt && !displayData.genParams && !displayData.videos?.length && !displayData.videoPreview && (
              <div className="result-empty"><p>暂无结果内容</p></div>
            )}
          </div>
        );

      case 'videoEditor':
        return (
          <div className="result-section">
            <div className="section-header">
              <Video size={14} />
              <span>待剪辑视频 ({displayData.videos?.length || 0})</span>
            </div>
            {displayData.videos?.length > 0 ? (
              <div className="video-list">
                {displayData.videos.map((video, idx) => (
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
            {displayData.result ? (
              <textarea className="result-textarea readonly" value={displayData.result} readOnly />
            ) : displayData.imageUrl ? (
              <img
                src={displayData.imageUrl}
                alt="result"
                className="result-image-full"
                onClick={() => displayData.imageUrl && onPreviewImage?.(displayData.imageUrl, 'result')}
              />
            ) : displayData.videoUrl ? (
              <video src={displayData.videoUrl} controls className="result-video-full" />
            ) : (
              <div className="result-empty"><p>暂无结果内容</p></div>
            )}
          </div>
        );
    }
  };

  return renderByType();
};

export default NodeResultRenderer;
