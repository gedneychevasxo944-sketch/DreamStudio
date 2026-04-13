import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Lock, Unlock, RotateCcw, AlertTriangle, Check, ChevronDown, ChevronUp, Loader2, X, ExternalLink, Copy, Target, Play, History, Sparkles } from 'lucide-react';
import { formatTimestamp } from '../../utils/dateUtils';
import { applyFieldChanges } from '../../utils/nodeUtils';
import { canvasLogger } from '../../utils/logger';
import { nodeVersionApi, proposalApi } from '../../services/api';
import { useWorkflowStore } from '../../stores';
import NodeResultRenderer from './NodeResultRenderer';
import '../ChatConversation.css';

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
          canvasLogger.debug('[ResultTab] versions from API:', versionsRes.data.versions);
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
            canvasLogger.debug('[ResultTab] loaded appliedProposal:', appliedProposalRes.data);
            canvasLogger.debug('[ResultTab] changes:', changes);
            canvasLogger.debug('[ResultTab] currentNodeData:', currentNodeData);
            setModifiedData(applyFieldChanges(currentNodeData, changes));
          }
        } else {
          setModifiedByProposal(false);
          setAppliedProposal(null);
          setModifiedData(null);
        }
      } catch (error) {
        canvasLogger.error('[NodeWorkspace] Failed to load version data:', error);
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
      <div className="empty-state">
        <FileText size={32} />
        <p>选择一个节点查看结果</p>
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

    return (
      <NodeResultRenderer
        nodeType={node.type}
        resultText={resultText}
        displayData={displayData}
        onPreviewImage={(src, alt) => setPreviewImage({ src, alt })}
        onGenerateVideo={handleGenerateVideo}
        generatingPrompt={generatingPrompt}
      />
    );
  };


  return (
    <div className="result-tab">
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

export default ResultTab;
