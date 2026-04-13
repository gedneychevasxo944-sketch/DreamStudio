import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, List, Palette, Users, Image, Layers, Video, Code, Play, Zap, History, RotateCcw, Loader2, ChevronDown, ChevronUp, Check, AlertTriangle, X } from 'lucide-react';
import { parseScript } from '../../utils/scriptUtils';
import { canvasLogger } from '../../utils/logger';
import { nodeVersionApi } from '../../services/api';
import { getFieldLabel } from './getFieldLabel';
import NodeResultRenderer from './NodeResultRenderer';

const HistoryTab = ({ node, projectId, versionRefreshKey }) => {
  const [runRecords, setRunRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordDetail, setRecordDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // 渲染版本结果（根据节点类型，复用 ResultTab 的渲染逻辑）
  const renderVersionResult = (detail) => {
    if (!detail) return null;

    const resultText = detail.resultText || '';
    const nodeType = detail.nodeType || detail.agentCode || '';

    // 解析 resultJson 获取结构化数据
    let displayData = {};
    if (detail.resultJson) {
      try {
        displayData = JSON.parse(detail.resultJson);
      } catch (e) {
        // ignore
      }
    }

    // 根据节点类型渲染（复用 ResultTab 的渲染逻辑）
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
                <textarea className="result-textarea readonly" value={displayData.overallStyle} readOnly />
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
                      {char.thumbnail && <span className="table-thumb">有缩略图</span>}
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
                      {scene.thumbnail && <span className="table-thumb">有缩略图</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!displayData.overallStyle && !displayData.characters?.length && !displayData.scenes?.length && (
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
                </div>
                {displayData.prompts.map((p, idx) => (
                  <div key={idx} className="prompt-table-row">
                    <span className="prompt-shot-number">{p.shotNumber}</span>
                    <span className="prompt-text">{p.prompt}</span>
                    <span className="prompt-duration">{p.duration}</span>
                    <div className="keyframes-thumbnails">
                      {p.keyframes?.map((frame, kIdx) => (
                        <div key={kIdx} className="keyframe-thumb">
                          <img src={frame} alt={`关键帧${kIdx + 1}`} />
                        </div>
                      ))}
                    </div>
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
                <textarea className="result-textarea readonly" value={displayData.videoPrompt} readOnly />
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

            {/* 单个视频预览 - videoPreview 是字符串URL */}
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

      default:
        // 默认显示纯文本
        return (
          <div className="result-section">
            <textarea
              className="result-textarea readonly"
              value={resultText}
              readOnly
              placeholder="等待生成结果..."
            />
          </div>
        );
    }
  };

  // 渲染上游节点输出（根据节点类型渲染）
  const renderUpstreamResult = (upstream) => {
    if (!upstream) return null;

    const output = upstream.output || '';
    const resultJson = upstream.resultJson || '';
    const nodeName = upstream.nodeName || upstream.nodeId || '';
    const nodeType = nodeName.toLowerCase();

    canvasLogger.debug('[NodeWorkspace] [Upstream DEBUG] nodeName:', nodeName, 'resultJson:', resultJson.substring(0, 100));

    // 优先使用 resultJson 解析结构化数据
    let displayData = {};
    let isJson = false;
    if (resultJson) {
      try {
        displayData = JSON.parse(resultJson);
        isJson = true;
      } catch (e) {
        // resultJson 不是 JSON，忽略
      }
    }

    // 如果没有任何输出
    if (!output) {
      return <div className="result-empty"><p>无输出</p></div>;
    }

    // 根据节点类型渲染
    switch (nodeType) {
      case 'producer':
        return (
          <div className="result-section">
            <textarea className="result-textarea readonly" value={output} readOnly />
          </div>
        );

      case 'content':
        try {
          const { episodes, totalScenes } = parseScript(output);
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
                  </div>
                </div>
              )}
            </div>
          );
        } catch (e) {
          return (
            <div className="result-section">
              <textarea className="result-textarea readonly" value={output} readOnly />
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
                <textarea className="result-textarea readonly" value={displayData.overallStyle} readOnly />
              </div>
            )}
            {displayData.characters?.length > 0 && (
              <div className="visual-result-section">
                <div className="section-header">
                  <Users size={14} />
                  <span>角色 ({displayData.characters.length})</span>
                </div>
              </div>
            )}
            {!displayData.overallStyle && !displayData.characters?.length && (
              <div className="result-empty"><p>暂无视觉风格内容</p></div>
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
                </div>
                {displayData.storyboards.map((sb, idx) => (
                  <div key={idx} className="storyboard-table-row">
                    <span className="shot-number">{sb.shotNumber}</span>
                    <span className="shot-angle">{sb.angle}</span>
                    <span className="shot-motion">{sb.motion}</span>
                    <span className="shot-content">{sb.content}</span>
                    <span className="shot-duration">{sb.duration}s</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="result-empty"><p>暂无分镜内容</p></div>
            )}
          </div>
        );

      case 'technical':
        // 技术节点输出可能是纯文本（提示词包）或 JSON（结构化提示词表格）
        if (!isJson || !displayData.prompts?.length) {
          // 输出是纯文本，直接显示
          return (
            <div className="result-section">
              <div className="section-header">
                <Code size={14} />
                <span>视频提示词</span>
              </div>
              <textarea className="result-textarea readonly" value={output} readOnly />
            </div>
          );
        }
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
                </div>
                {displayData.prompts.map((p, idx) => (
                  <div key={idx} className="prompt-table-row">
                    <span className="prompt-shot-number">{p.shotNumber}</span>
                    <span className="prompt-text">{p.prompt}</span>
                    <span className="prompt-duration">{p.duration}</span>
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
                <textarea className="result-textarea readonly" value={displayData.videoPrompt} readOnly />
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
                  {displayData.genParams.quality && (
                    <div className="gen-params-row">
                      <span className="param-label">画质</span>
                      <span className="param-value">{displayData.genParams.quality}</span>
                    </div>
                  )}
                  {displayData.genParams.ratio && (
                    <div className="gen-params-row">
                      <span className="param-label">比例</span>
                      <span className="param-value">{displayData.genParams.ratio}</span>
                    </div>
                  )}
                  {displayData.genParams.duration && (
                    <div className="gen-params-row">
                      <span className="param-label">时长</span>
                      <span className="param-value">{displayData.genParams.duration}</span>
                    </div>
                  )}
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
                        {video.duration && <span className="video-duration">{video.duration}s</span>}
                      </div>
                      {video.url && (
                        <video src={video.url} controls className="video-player" preload="metadata" />
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
                  <video src={displayData.videoPreview} controls className="video-player" preload="metadata" />
                </div>
              </div>
            )}
            {!displayData.videoPrompt && !displayData.genParams && !displayData.videos?.length && !displayData.videoPreview && (
              <div className="result-empty"><p>暂无结果内容</p></div>
            )}
          </div>
        );

      default:
        // 默认显示纯文本或 JSON
        if (isJson) {
          // 如果是 JSON 但节点类型不匹配，尝试渲染 JSON 的关键字段
          return (
            <div className="result-section">
              <textarea
                className="result-textarea readonly"
                value={output}
                readOnly
                placeholder="无输出"
              />
            </div>
          );
        }
        return (
          <div className="result-section">
            <textarea
              className="result-textarea readonly"
              value={output}
              readOnly
              placeholder="无输出"
            />
          </div>
        );
    }
  };

  useEffect(() => {
    if (!node || !projectId) {
      setRunRecords([]);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await nodeVersionApi.getHistory(projectId, node.id);
        if (response.data && response.data.versions) {
          const records = response.data.versions.map(v => ({
            id: v.id,
            version: `v${v.versionNo}`,
            time: v.createdAt,
            duration: '-',
            status: v.status === 'READY' ? 'success' : 'failed'
          }));
          setRunRecords(records);
        }
      } catch (error) {
        canvasLogger.error('[NodeWorkspace] Failed to load history:', error);
        setRunRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [node, projectId, versionRefreshKey]);

  // 点击记录查看详情
  const handleRecordClick = async (record) => {
    if (selectedRecord?.id === record.id) return;
    setSelectedRecord(record);
    setDetailLoading(true);
    try {
      const response = await nodeVersionApi.getVersionDetailWithUpstream(projectId, node.id, record.id);
      if (response.data) {
        setRecordDetail(response.data);
      }
    } catch (error) {
      canvasLogger.error('[NodeWorkspace] Failed to load record detail:', error);
      setRecordDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setSelectedRecord(null);
    setRecordDetail(null);
  };

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
            className={`run-record-item ${selectedRecord?.id === record.id ? 'selected' : ''}`}
            onClick={() => handleRecordClick(record)}
          >
            <div className="record-left">
              <span className={`record-status ${record.status}`}>
                {record.status === 'success' ? <Check size={12} /> : <AlertTriangle size={12} />}
              </span>
              <span className="record-version">{record.version}</span>
            </div>
            <div className="record-right">
              <span className="record-time">{record.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 运行详情弹窗 */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            className="run-detail-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="run-detail-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className="run-detail-header">
                <span className="run-detail-title">运行详情</span>
                <button className="run-detail-close" onClick={handleCloseModal}>
                  <X size={18} />
                </button>
              </div>

              {/* 版本信息 */}
              <div className="run-detail-meta">
                <span className="run-detail-version">{selectedRecord.version}</span>
                <span className="run-detail-time">{selectedRecord.time}</span>
                <span className={`run-detail-status ${selectedRecord.status}`}>
                  {selectedRecord.status === 'success' ? '成功' : '失败'}
                </span>
              </div>

              {/* 加载状态 */}
              {detailLoading && (
                <div className="run-detail-loading">
                  <Loader2 size={20} className="spin" />
                  <span>加载中...</span>
                </div>
              )}

              {/* 内容区域 */}
              {!detailLoading && recordDetail && (
                <div className="run-detail-content">
                  {/* 上游节点（数据来源） */}
                  {recordDetail.upstreamNodes && recordDetail.upstreamNodes.length > 0 && (
                    <div className="run-detail-section">
                      <div className="run-detail-section-header">
                        <span className="detail-label">上游节点（数据来源）</span>
                      </div>
                      <div className="run-detail-upstreams">
                        {recordDetail.upstreamNodes.map((upstream, idx) => (
                          <div key={idx} className="run-detail-upstream-item">
                            <div className="upstream-name">{upstream.nodeName || upstream.nodeId}</div>
                            <div className="upstream-output">
                              {renderUpstreamResult(upstream)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 本节点输出 - 根据节点类型渲染 */}
                  <div className="run-detail-section">
                    <div className="run-detail-section-header">
                      <span className="detail-label">输出</span>
                    </div>
                    <div className="run-detail-result">
                      {renderVersionResult(recordDetail)}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 影响 Tab

export default HistoryTab;
