import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageCircle, Settings, History, GitBranch, Lock, Unlock, RotateCcw, AlertTriangle, Check, ChevronDown, ChevronUp, Play, Palette, PenTool, Video, Code, Users, Layers, List, BookOpen, Zap, Sparkles, Image, X, Target, Loader2, Copy, ExternalLink } from 'lucide-react';
import ChatConversation from './ChatConversation';
import { formatTimestamp } from '../utils/dateUtils';
import { parseScript } from '../utils/scriptUtils';
import { applyFieldChanges } from '../utils/nodeUtils';
import './ChatConversation.css';
import { nodeVersionApi, proposalApi, chatApi } from '../services/api';
import { useWorkflowStore } from '../stores';
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

// 把技术路径转成用户友好的标签
const getFieldLabel = (fieldPath) => {
  const labelMap = {
    'genParams.quality': '画质',
    'genParams.duration': '时长',
    'genParams.model': '模型',
    'genParams.ratio': '比例',
    'budget': '预算',
    'duration': '周期',
    'style': '风格',
    'model': '模型',
    'scene3.description': '场景描述',
    'shot1.type': '镜头类型',
    'shot1.duration': '镜头时长',
  };
  return labelMap[fieldPath] || fieldPath;
};

// 结果 Tab
const ResultTab = ({ node, projectId, onGenerateVideo, onRestoreVersion, versionRefreshKey }) => {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(null);
  const [apiVersions, setApiVersions] = useState(null);
  const [currentVersionResult, setCurrentVersionResult] = useState(null);
  const [appliedProposal, setAppliedProposal] = useState(null);
  const [modifiedByProposal, setModifiedByProposal] = useState(false);
  const [modifiedData, setModifiedData] = useState(null);
  const isFirstMountRef = useRef(true);

  // ESC 键关闭版本历史下拉
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showVersionHistory) {
        setShowVersionHistory(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showVersionHistory]);

  useEffect(() => {
    if (!node || !projectId) {
      setApiVersions(null);
      setCurrentVersionResult(null);
      setModifiedByProposal(false);
      setAppliedProposal(null);
      setModifiedData(null);
      return;
    }

    const currentNodeId = node.id;
    const currentNodeData = node.data ?? {};

    const loadVersionData = async () => {
      try {
        // 并行加载版本列表、当前版本和已应用的提案
        const [versionsRes, currentRes, appliedProposalRes] = await Promise.all([
          nodeVersionApi.getVersions(projectId, currentNodeId),
          nodeVersionApi.getCurrentVersion(projectId, currentNodeId),
          proposalApi.getAppliedProposal(projectId, currentNodeId)
        ]);

        // 检查 nodeId 是否变化
        if (currentNodeId !== node?.id) return;

        if (versionsRes.data && versionsRes.data.versions) {
          console.log('[ResultTab] versions from API:', versionsRes.data.versions);
          setApiVersions(versionsRes.data.versions);
        } else {
          setApiVersions([]);
        }

        if (currentRes.data) {
          setCurrentVersionResult(currentRes.data);
        }

        // 如果有已应用的提案，设置 modifiedByProposal 为 true，并计算修改后的数据
        if (appliedProposalRes?.data) {
          setModifiedByProposal(true);
          setAppliedProposal(appliedProposalRes.data);

          const diffJson = appliedProposalRes.data.diffJson;

          // 处理 textDiff 格式（producer, content 节点）
          if (diffJson?.textDiff?.afterText) {
            // 直接用 afterText 作为 resultText
            setModifiedData({ ...currentNodeData, resultText: diffJson.textDiff.afterText });
          } else {
            // 处理 configDiff 格式（其他节点）
            const changes = diffJson?.configDiff?.changes || [];
            console.log('[ResultTab] loaded appliedProposal:', appliedProposalRes.data);
            console.log('[ResultTab] changes:', changes);
            console.log('[ResultTab] currentNodeData:', currentNodeData);
            setModifiedData(applyFieldChanges(currentNodeData, changes));
          }
        } else {
          setModifiedByProposal(false);
          setAppliedProposal(null);
          setModifiedData(null);
        }
      } catch (error) {
        console.error('Failed to load version data:', error);
        if (currentNodeId !== node?.id) return;
        setApiVersions([]);
        setCurrentVersionResult(null);
        setModifiedByProposal(false);
        setAppliedProposal(null);
        setModifiedData(null);
      }
    };

    loadVersionData();
  }, [node, projectId, versionRefreshKey]);

  // 监听 versionRefreshKey 变化，当版本刷新时显示"已修改"提示
  // 仅在非首次挂载时（versionRefreshKey 从 0 变为 > 0）才设置 modifiedByProposal
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (versionRefreshKey > 0) {
      setModifiedByProposal(true);
    }
  }, [versionRefreshKey]);

  // 当节点变化时，重置 firstMountRef，这样新节点的第一次加载不会触发"已修改"
  useEffect(() => {
    isFirstMountRef.current = true;
    setModifiedByProposal(false);
  }, [node?.id]);

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

  // 用于展示的数据，如果有已应用的提案则用修改后的数据
  const safeNodeData = node?.data ?? {};
  const displayData = (modifiedData ?? safeNodeData ?? {});

  // 处理生成视频
  const handleGenerateVideo = (promptIdx) => {
    setGeneratingPrompt(promptIdx);
    onGenerateVideo?.(node.id, promptIdx);
    // 重置状态（由画布操作完成后回调更新）
    setTimeout(() => setGeneratingPrompt(null), 3000);
  };

  // 版本历史 - 仅使用API数据
  const versionHistory = apiVersions
    ? apiVersions.map(v => ({
        id: v.id,
        versionNo: v.versionNo,
        version: `v${v.versionNo}`,
        time: v.createdAt,
        isCurrent: v.isCurrent
      }))
    : [];

  // 仅使用API返回的resultText，如果有已应用的提案则用afterText覆盖
  const resultText = appliedProposal?.diffJson?.textDiff?.afterText
    || appliedProposal?.diffJson?.afterText
    || currentVersionResult?.resultText
    || '';

  // 模拟数据
  const currentVersion = currentVersionResult?.versionNo || node.data?.currentVersion || 1;
  const isRevised = node.data?.isRevised;
  const isLocked = node.data?.isLocked;
  const isPropagationLocked = node.data?.lockedByPropagation;
  const baseVersion = node.data?.baseVersion;
  const status = node.data?.status || 'completed';

  // 处理恢复版本 - 传递 versionId (id)
  const handleRestoreVersion = (versionId) => {
    onRestoreVersion?.(node.id, versionId);
    setShowVersionHistory(false);
  };

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
              value={resultText}
              readOnly
              placeholder="等待生成结果..."
            />
          </div>
        );

      case 'content':
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
                          onClick={() => setPreviewImage({ src: char.thumbnail, alt: char.name })}
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
                          onClick={() => setPreviewImage({ src: scene.thumbnail, alt: scene.name })}
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
                          onClick={() => setPreviewImage({ src: prop.thumbnail, alt: prop.name })}
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
                alt={node.name}
                className="result-image-full"
                onClick={() => setPreviewImage({ src: displayData.imageUrl, alt: node.name })}
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
          {modifiedByProposal && (
            <>
              <span className="modified-badge">
                <Sparkles size={10} />
                已修改
              </span>
              <button
                className="discard-modified-btn"
                onClick={() => {
                  setModifiedByProposal(false);
                  setAppliedProposal(null);
                  setModifiedData(null);
                }}
              >
                放弃
              </button>
            </>
          )}
          {isLocked && (
            <span className="locked-badge">
              <Lock size={10} />
              {isPropagationLocked ? '已被下游锁定' : '已锁定'}
            </span>
          )}
        </div>

        <div className="version-history-wrapper">
          <button
            className="version-history-toggle"
            onClick={() => setShowVersionHistory(!showVersionHistory)}
          >
            <History size={14} />
            版本历史
            <ChevronDown size={14} className={showVersionHistory ? 'open' : ''} />
          </button>

          {/* 遮罩层 */}
          <AnimatePresence>
            {showVersionHistory && (
              <>
                <motion.div
                  className="version-history-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowVersionHistory(false)}
                />
                <motion.div
                  className="version-history-dropdown"
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  {versionHistory.map((v, idx) => (
                    <div
                      key={idx}
                      className={`version-history-item ${v.isCurrent ? 'current' : ''}`}
                      onClick={() => !v.isCurrent && handleRestoreVersion(v.id)}
                    >
                      <span className="version-name">{v.version}</span>
                      <span className="version-time">{v.time}</span>
                      {v.isCurrent && <Check size={14} className="current-indicator" />}
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

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
const ChatTab = ({ node, projectId, messages, setMessages, onApplyProposal, onRegenerateProposal, onRejectProposal, onApplySuccess, applyingProposalId, setApplyingProposalId }) => {
  const [inputValue, setInputValue] = useState('');
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [modalProposal, setModalProposal] = useState(null);
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 监听 messages 变化，自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMessage = { role: 'user', content: inputValue };
    const assistantMessage = { role: 'assistant', content: '', thinking: '', result: '', proposal: null };
    const newMessages = [...messages, userMessage, assistantMessage];
    setMessages(newMessages);
    setInputValue('');

    // 获取 agentId
    const agentId = node.agentId || node.agentCode || node.type;
    if (!agentId) {
      setMessages(prev => prev.map((msg, idx) =>
        idx === prev.length - 1
          ? { ...msg, content: '[错误: 节点缺少 agentId]' }
          : msg
      ));
      return;
    }

    // 调用后端API发送消息并获取AI回复
    chatApi.sendMessageStream(
      {
        projectId,
        projectVersion: null,
        agentId: String(agentId),
        agentName: node.agentCode || node.type || String(agentId),
        message: inputValue.trim(),
        nodeId: node.id,
      },
      {
        onThinking: (data) => {
          setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, thinking: (msg.thinking || '') + (data.delta || '') }
              : msg
          ));
        },
        onResult: (data) => {
          setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, content: data.delta || '', result: data.delta || '', resultType: data.contentType || 'text' }
              : msg
          ));
        },
        onData: (data) => {
          // 解析提案数据
          if (data.type === 'proposal' && data.proposal) {
            setMessages(prev => prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.role === 'assistant'
                ? { ...msg, proposal: data.proposal }
                : msg
            ));
          }
          // 解析图片数据
          if (data.type === 'image' && data.items) {
            setMessages(prev => prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.role === 'assistant'
                ? { ...msg, imageUrls: [...(msg.imageUrls || []), ...data.items] }
                : msg
            ));
          }
          // 解析视频数据
          if (data.type === 'video' && data.items) {
            setMessages(prev => prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.role === 'assistant'
                ? { ...msg, videoItems: [...(msg.videoItems || []), ...data.items] }
                : msg
            ));
          }
        },
        onComplete: () => {
          // nothing special needed
        },
        onError: (error) => {
          setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, content: '[错误: ' + (error.message || '未知错误') + ']' }
              : msg
          ));
        },
      }
    );
  };

  // 获取diff变更列表（兼容不同格式）
  const getDiffChanges = (proposal) => {
    console.log('[getDiffChanges] proposal:', proposal);
    if (!proposal?.diffJson) return [];

    // configDiff 格式（新的通用格式）
    if (proposal.diffJson.configDiff?.changes && Array.isArray(proposal.diffJson.configDiff.changes)) {
      return proposal.diffJson.configDiff.changes.map(change => ({
        fieldPath: change.key || '',
        before: change.beforeValue || '',
        after: change.afterValue || ''
      }));
    }

    // textDiff 格式（旧格式）
    if (proposal.diffJson.textDiff) {
      return [{
        fieldPath: '',
        before: proposal.diffJson.textDiff.beforeText || '',
        after: proposal.diffJson.textDiff.afterText || ''
      }];
    }

    return [];
  };

  return (
    <div className="workspace-tab-content chat-tab">
      {/* 对话消息列表 */}
      <div className="cc-messages">
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="cc-chat-message user">
                <div className="cc-message-wrapper user">
                  <div className="cc-message-header-row user">
                    <div className="cc-message-avatar">
                      <div className="user-avatar-icon">👤</div>
                    </div>
                    <span className="cc-message-sender">用户</span>
                  </div>
                  <div className="cc-message-body">
                    <div className="cc-result-text">{msg.content}</div>
                  </div>
                </div>
              </div>
            );
          }

          // Assistant message
          const hasResult = msg.result || msg.content;
          const hasThinking = msg.thinking && msg.thinking.length > 0;
          const isLastAssistant = idx === messages.length - 1;
          const msgProposal = msg.proposal;
          const msgProposalStatus = msgProposal?.status || 'pending';

          return (
            <div key={idx} className="cc-chat-message assistant">
              <div className="cc-message-wrapper assistant">
                <div className="cc-message-header-row assistant">
                  <div className="cc-message-avatar">
                    <div className="assistant-avatar-icon">🤖</div>
                  </div>
                  <span className="cc-message-sender">助理</span>
                </div>
                <div className="cc-message-body">
                  {/* 思考过程 */}
                  {hasThinking && (
                    <div className="cc-thinking-section expanded">
                      <button className="cc-thinking-toggle" disabled>
                        <Sparkles size={12} />
                        <span>思考过程</span>
                        <ChevronUp size={14} />
                      </button>
                      <div className="cc-thinking-content">
                        {msg.thinking}
                      </div>
                    </div>
                  )}
                  {/* 结果内容 */}
                  {hasResult && (
                    <div className="cc-result-section">
                      <div className="cc-result-content">
                        <div className="cc-result-text">{msg.result || msg.content}</div>
                        {/* 提案卡片 - 在结果内容里 */}
                        {msgProposal && (
                          <div className="cc-proposal-section">
                            <div className="cc-proposal-header">
                              <GitBranch size={14} />
                              <span className="cc-proposal-label">建议修改：</span>
                              <span className="cc-proposal-summary">{msgProposal.summary}</span>
                            </div>
                            {msgProposal.diffJson && (() => {
                                const changes = getDiffChanges(msgProposal);
                                return (
                                  <div className="cc-proposal-diff-mini">
                                    {changes.length === 1 ? (
                                      <>
                                        <div className="diff-item">
                                          <span className="diff-label">原版：</span>
                                          <span className="diff-text">{changes[0].before}</span>
                                        </div>
                                        <div className="diff-arrow">→</div>
                                        <div className="diff-item">
                                          <span className="diff-label">新版：</span>
                                          <span className="diff-text">{changes[0].after}</span>
                                        </div>
                                      </>
                                    ) : (
                                      changes.map((change, idx) => (
                                        <div key={idx} className="diff-change-item">
                                          <span className="diff-field">{getFieldLabel(change.fieldPath)}：</span>
                                          <span className="diff-before">{change.before}</span>
                                          <span className="diff-arrow">→</span>
                                          <span className="diff-after">{change.after}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                );
                              })()}
                            <div className="cc-proposal-actions">
                              <button className="cc-proposal-btn view-full" onClick={() => { setModalProposal(msgProposal); setDiffModalOpen(true); }}>查看完整diff</button>
                              {msgProposalStatus.toUpperCase() === 'PENDING' ? (
                                <>
                                  <button className="cc-proposal-btn reject" onClick={() => { onRejectProposal?.(msgProposal.nodeId, msgProposal.id); }} disabled={applyingProposalId !== null}>暂不采纳</button>
                                  <button className="cc-proposal-btn apply" onClick={async () => {
                                    // 先更新本地状态为APPLYING，禁用按钮
                                    setApplyingProposalId(msgProposal.id);
                                    try {
                                      await onApplyProposal?.(msgProposal.nodeId, msgProposal.id);
                                      onApplySuccess?.(msgProposal.id);
                                    } catch (error) {
                                      console.error('Failed to apply proposal:', error);
                                    } finally {
                                      setApplyingProposalId(null);
                                    }
                                  }} disabled={applyingProposalId !== null}>{applyingProposalId === msgProposal.id ? '应用中...' : '确认应用'}</button>
                                </>
                              ) : (
                                <div className={`proposal-status-badge ${msgProposalStatus}`}>
                                  {msgProposalStatus.toUpperCase() === 'APPLIED' ? '✓ 已确认' : msgProposalStatus.toUpperCase() === 'REJECTED' ? '✗ 已拒绝' : msgProposalStatus}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="cc-result-actions">
                        <button className="cc-result-action-btn" onClick={() => { if (msgProposal?.diffJson) { setModalProposal(msgProposal); setDiffModalOpen(true); } }}>
                          <ExternalLink size={12} />
                          弹窗查看
                        </button>
                        <button className="cc-result-action-btn" onClick={() => navigator.clipboard.writeText(msg.result || msg.content)}>
                          <Copy size={12} />
                          复制
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* 用于自动滚动到底部的锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 对话输入框 */}
      <div className="cc-input-area">
        <textarea
          className="cc-input"
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
        <button className="cc-send-btn" onClick={handleSend}>
          发送
        </button>
      </div>

      {/* Diff 弹窗 */}
      <AnimatePresence>
        {diffModalOpen && modalProposal?.diffJson && (
          <motion.div
            className="cc-proposal-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDiffModalOpen(false)}
          >
            <motion.div
              className="cc-proposal-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cc-proposal-modal-header">
                <span>完整 Diff</span>
                <button className="cc-proposal-modal-close" onClick={() => setDiffModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="cc-proposal-modal-body">
                {getDiffChanges(modalProposal).map((change, idx) => (
                  <div key={idx} className="cc-proposal-modal-change">
                    <div className="cc-proposal-modal-field">{getFieldLabel(change.fieldPath)}</div>
                    <div className="cc-proposal-modal-section">
                      <div className="cc-proposal-modal-label">原版</div>
                      <div className="cc-proposal-modal-text before">{change.before}</div>
                    </div>
                    <div className="cc-proposal-modal-arrow">↓</div>
                    <div className="cc-proposal-modal-section">
                      <div className="cc-proposal-modal-label">新版</div>
                      <div className="cc-proposal-modal-text after">{change.after}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const isLocked = node.data?.isLocked || false;
  const isPropagationLocked = node.data?.lockedByPropagation;
  const propagationRoot = node.data?.propagationRoot;

  const toggleLock = () => {
    const store = useWorkflowStore.getState();
    if (isLocked) {
      // 解锁：仅解锁当前节点和被传播锁定的上游
      store.unlockNodeAndUpstream(node.id);
    } else {
      // 锁定：锁定当前节点和所有上游
      store.lockNodeAndUpstream(node.id);
    }
  };

  return (
    <div className="workspace-tab-content config-tab">
      <div className="config-header">
        <span className="config-title">节点配置</span>
        <span className="config-node-type">{node.name}</span>
      </div>

      {/* 锁定控制 */}
      <div className="lock-control">
        <div className="lock-status">
          {isLocked ? (
            <>
              <Lock size={16} className="lock-icon locked" />
              <span>
                {isPropagationLocked
                  ? `已被下游节点锁定`
                  : '节点已锁定'}
              </span>
            </>
          ) : (
            <>
              <Unlock size={16} className="lock-icon unlocked" />
              <span>节点未锁定</span>
            </>
          )}
        </div>
        {isPropagationLocked ? (
          <div className="propagation-hint">
            <AlertTriangle size={14} />
            <span>需从下游解锁</span>
          </div>
        ) : (
          <button
            className={`lock-toggle-btn ${isLocked ? 'locked' : ''}`}
            onClick={toggleLock}
          >
            {isLocked ? (
              <>
                <Unlock size={14} />
                <span>解锁节点</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>锁定节点</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="config-fields">
        {configFields.map((field, idx) => (
          <div key={idx} className={`config-field ${isLocked ? 'disabled' : ''}`}>
            <label className="config-label">{field.label}</label>
            {field.type === 'select' ? (
              <select className="config-select" value={field.value} disabled={isLocked} readOnly>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'boolean' ? (
              <label className="config-toggle">
                <input type="checkbox" checked={field.value} disabled={isLocked} readOnly />
                <span className="toggle-slider"></span>
              </label>
            ) : field.type === 'number' ? (
              <input
                type="number"
                className="config-input"
                value={field.value}
                min={0}
                disabled={isLocked}
                readOnly
              />
            ) : (
              <input
                type="text"
                className="config-input"
                value={field.value}
                disabled={isLocked}
                readOnly
              />
            )}
          </div>
        ))}
      </div>

      {/* 自动生成配置（技术节点专用） */}
      {renderAutoGenConfig()}

      <div className="config-actions">
        <button className="config-save-btn" disabled={isLocked}>保存配置</button>
        <button className="config-reset-btn" disabled={isLocked}>重置</button>
      </div>
    </div>
  );
};

// 运行记录 Tab
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

    console.log('[Upstream DEBUG] nodeName:', nodeName, 'resultJson:', resultJson.substring(0, 100));

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
        console.error('Failed to load history:', error);
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
      console.error('Failed to load record detail:', error);
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
const ImpactTab = ({ node, downstreamNodes, upstreamNodes, onRerunFromNode, onViewFullImpact }) => {
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

  const isStale = node.data?.status === 'stale';

  // 处理从当前节点重新运行
  const handleRerunFromNode = () => {
    onRerunFromNode?.(node.id);
  };

  // 处理查看完整影响范围
  const handleViewFullImpact = () => {
    onViewFullImpact?.(node.id);
  };

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
            <button className="action-btn primary" onClick={handleRerunFromNode}>
              从当前节点重新运行
            </button>
            <button className="action-btn secondary" onClick={handleViewFullImpact}>
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
const NodeWorkspace = ({
  selectedNode,
  projectId,
  onNodeUpdate,
  onGenerateVideo,
  onApplyProposal,
  onRegenerateProposal,
  onRejectProposal,
  onRestoreVersion,
  onRerunFromNode,
  onViewFullImpact,
  downstreamNodes = [],
  upstreamNodes = []
}) => {
  const [activeTab, setActiveTab] = useState('result');
  const [versionRefreshKey, setVersionRefreshKey] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [applyingProposalId, setApplyingProposalId] = useState(null);

  // 加载节点的历史对话
  useEffect(() => {
    if (!selectedNode || !projectId) {
      setChatMessages([]);
      return;
    }

    let cancelled = false;
    const currentNodeId = selectedNode.id;

    const loadChatHistory = async () => {
      try {
        console.log('[ChatHistory] Loading for node:', currentNodeId, 'project:', projectId);
        const res = await chatApi.getNodeChatHistory(projectId, currentNodeId);
        console.log('[ChatHistory] Response:', res);

        // Check if this effect is still valid (node hasn't changed)
        if (cancelled) {
          console.log('[ChatHistory] Cancelled, ignoring response for node:', currentNodeId);
          return;
        }

        if (res.data && Array.isArray(res.data)) {
          console.log('[ChatHistory] Found', res.data.length, 'records for node:', currentNodeId);
          // 转换历史消息格式
          const historyMessages = [];
          res.data.forEach(record => {
            // 添加用户消息
            if (record.question) {
              historyMessages.push({
                role: 'user',
                content: record.question
              });
            }
            // 添加助手回复
            if (record.result) {
              historyMessages.push({
                role: 'assistant',
                content: record.result,
                result: record.result,
                proposal: record.proposal || null
              });
            }
          });
          setChatMessages(historyMessages);
        } else {
          console.log('[ChatHistory] No data or empty array for node:', currentNodeId);
          setChatMessages([]);
        }
      } catch (error) {
        console.error('[ChatHistory] Failed to load chat history:', error);
        if (!cancelled) {
          setChatMessages([]);
        }
      }
    };

    loadChatHistory();

    // Cleanup function to cancel in-flight requests
    return () => {
      cancelled = true;
    };
  }, [selectedNode?.id, projectId]);

  // 聊天提案应用成功 - 切换到结果Tab，更新messages里的proposal状态
  const handleChatApplySuccess = useCallback((proposalId) => {
    // 更新messages里对应proposal的状态为APPLIED
    setChatMessages(prev => prev.map(msg => {
      if (msg.proposal && msg.proposal.id === proposalId) {
        return {
          ...msg,
          proposal: {
            ...msg.proposal,
            status: 'APPLIED'
          }
        };
      }
      return msg;
    }));
    setActiveTab('result');
  }, []);

  // 处理重新运行 - 只调用 onRerunFromNode，不在这里递增 versionRefreshKey
  const handleRerunAndRefresh = useCallback((nodeId) => {
    onRerunFromNode?.(nodeId);
  }, [onRerunFromNode]);

  // 监听工作流完成事件，在完成后刷新版本列表
  useEffect(() => {
    const handleWorkflowComplete = () => {
      setVersionRefreshKey(k => k + 1);
    };
    const handleProposalApplied = () => {
      setVersionRefreshKey(k => k + 1);
    };
    const handleProposalRejected = (e) => {
      const { proposalId } = e.detail;
      // 更新messages里对应proposal的状态为REJECTED
      setChatMessages(prev => prev.map(msg => {
        if (msg.proposal && msg.proposal.id === proposalId) {
          return {
            ...msg,
            proposal: {
              ...msg.proposal,
              status: 'REJECTED'
            }
          };
        }
        return msg;
      }));
    };
    document.addEventListener('workflowComplete', handleWorkflowComplete);
    document.addEventListener('proposalApplied', handleProposalApplied);
    document.addEventListener('proposalRejected', handleProposalRejected);
    return () => {
      document.removeEventListener('workflowComplete', handleWorkflowComplete);
      document.removeEventListener('proposalApplied', handleProposalApplied);
      document.removeEventListener('proposalRejected', handleProposalRejected);
    };
  }, []);

  const tabs = [
    { id: 'result', label: '结果', icon: 'result' },
    { id: 'chat', label: '对话', icon: 'chat' },
    { id: 'config', label: '配置', icon: 'config' },
    { id: 'history', label: '记录', icon: 'history' },
    { id: 'impact', label: '影响', icon: 'impact' },
  ];

  // Tab 内容组件映射
  const tabContentMap = {
    result: <ResultTab
      node={selectedNode}
      projectId={projectId}
      onGenerateVideo={onGenerateVideo}
      onRestoreVersion={onRestoreVersion}
      versionRefreshKey={versionRefreshKey}
    />,
    chat: <ChatTab
      node={selectedNode}
      projectId={projectId}
      messages={chatMessages}
      setMessages={setChatMessages}
      onApplyProposal={onApplyProposal}
      onRegenerateProposal={onRegenerateProposal}
      onRejectProposal={onRejectProposal}
      onApplySuccess={handleChatApplySuccess}
      applyingProposalId={applyingProposalId}
      setApplyingProposalId={setApplyingProposalId}
    />,
    config: <ConfigTab node={selectedNode} onNodeUpdate={onNodeUpdate} />,
    history: <HistoryTab node={selectedNode} projectId={projectId} versionRefreshKey={versionRefreshKey} />,
    impact: <ImpactTab
      node={selectedNode}
      downstreamNodes={downstreamNodes}
      upstreamNodes={upstreamNodes}
      onRerunFromNode={handleRerunAndRefresh}
      onViewFullImpact={onViewFullImpact}
    />,
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

  // 检查节点是否被锁定
  const isNodeLocked = selectedNode?.data?.isLocked;
  const isNodePropagationLocked = selectedNode?.data?.lockedByPropagation;

  // 解锁节点（会同时解锁被传播锁定的上游节点）
  const handleUnlock = () => {
    if (!selectedNode) return;
    const store = useWorkflowStore.getState();
    store.unlockNodeAndUpstream(selectedNode.id);
  };

  return (
    <div className={`node-workspace ${isNodeLocked ? 'locked' : ''}`}>
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
          {isNodeLocked && (
            <div className="node-info-locked-badge">
              <Lock size={12} />
              <span>已锁定</span>
            </div>
          )}
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
          <>
            {tabContentMap[activeTab]}
            {/* 锁定覆盖层 - 锁定时所有Tab都显示 */}
            {isNodeLocked && (
              <div className="locked-overlay">
                <div className="locked-overlay-content">
                  <div className="lock-icon-large">
                    <Lock size={20} />
                  </div>
                  {isNodePropagationLocked ? (
                    <>
                      <p>已被下游节点锁定</p>
                      <p className="propagation-hint-text">请从下游节点解锁</p>
                    </>
                  ) : (
                    <>
                      <p>节点已锁定</p>
                      <button className="unlock-btn" onClick={handleUnlock}>
                        <Unlock size={14} />
                        <span>立即解锁</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          renderProjectOverview()
        )}
      </div>
    </div>
  );
};

export default NodeWorkspace;
