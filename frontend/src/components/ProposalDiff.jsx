import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Sparkles } from 'lucide-react';
import './ProposalDiff.css';

/**
 * 文本 Diff 组件
 */
export const TextDiff = ({ before, after, mode = 'side-by-side' }) => {
  if (!before && !after) return null;

  // 简单的行级 diff 计算
  const beforeLines = (before || '').split('\n');
  const afterLines = (after || '').split('\n');

  // 标记每行的状态
  const maxLines = Math.max(beforeLines.length, afterLines.length);
  const diffLines = [];

  for (let i = 0; i < maxLines; i++) {
    const beforeLine = beforeLines[i];
    const afterLine = afterLines[i];

    if (beforeLine === afterLine) {
      diffLines.push({ type: 'unchanged', before: beforeLine, after: afterLine });
    } else if (beforeLine === undefined) {
      diffLines.push({ type: 'added', before: null, after: afterLine });
    } else if (afterLine === undefined) {
      diffLines.push({ type: 'removed', before: beforeLine, after: null });
    } else {
      diffLines.push({ type: 'modified', before: beforeLine, after: afterLine });
    }
  }

  return (
    <div className={`text-diff ${mode}`}>
      {mode === 'side-by-side' ? (
        <div className="diff-side-by-side">
          <div className="diff-panel before">
            <div className="diff-panel-header">
              <span className="diff-label">原版</span>
            </div>
            <div className="diff-content">
              {diffLines.map((line, idx) => (
                <div key={idx} className={`diff-line ${line.type}`}>
                  <span className="line-number">{idx + 1}</span>
                  <span className="line-content">{line.before || ''}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="diff-panel after">
            <div className="diff-panel-header">
              <span className="diff-label">新版</span>
            </div>
            <div className="diff-content">
              {diffLines.map((line, idx) => (
                <div key={idx} className={`diff-line ${line.type}`}>
                  <span className="line-number">{idx + 1}</span>
                  <span className="line-content">{line.after || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="diff-inline">
          <div className="diff-content">
            {diffLines.map((line, idx) => (
              <div key={idx} className={`diff-line ${line.type}`}>
                <span className="line-marker">
                  {line.type === 'added' && '+'}
                  {line.type === 'removed' && '-'}
                  {line.type === 'modified' && '~'}
                  {line.type === 'unchanged' && ' '}
                </span>
                <span className="line-content">{line.after || line.before || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 参数 Diff 组件
 */
export const ParamDiff = ({ before, after }) => {
  if (!before && !after) return null;

  const allKeys = [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])];

  return (
    <div className="param-diff">
      <div className="param-diff-header">
        <span className="param-column old">原值</span>
        <span className="param-column new">新值</span>
      </div>
      <div className="param-diff-content">
        {allKeys.map((key) => {
          const oldVal = before?.[key];
          const newVal = after?.[key];
          const isChanged = oldVal !== newVal;

          return (
            <div key={key} className={`param-row ${isChanged ? 'changed' : ''}`}>
              <span className="param-key">{key}</span>
              <span className="param-column old">{isChanged ? oldVal : '—'}</span>
              <span className="param-column new">{isChanged ? newVal : oldVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 提案摘要组件（紧凑展示）
 */
export const ProposalSummary = ({ proposal, onApply, onReject, onRegenerate, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (!proposal) return null;

  const { type, summary, reason, affectedNodes } = proposal;

  return (
    <div className={`proposal-summary ${compact ? 'compact' : ''}`}>
      <div className="proposal-header">
        <div className="proposal-icon">
          {type === 'revision' ? <Sparkles size={14} /> : <RefreshCw size={14} />}
        </div>
        <div className="proposal-info">
          <span className="proposal-type">
            {type === 'revision' ? '局部编辑' : '重生成'}
          </span>
          <span className="proposal-summary-text">{summary}</span>
        </div>
        <button
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {reason && (
        <div className="proposal-reason">
          <AlertTriangle size={12} />
          <span>{reason}</span>
        </div>
      )}

      {affectedNodes && affectedNodes.length > 0 && (
        <div className="affected-nodes">
          <span className="affected-label">影响节点：</span>
          {affectedNodes.map((node) => (
            <span key={node} className="affected-node-badge">{node}</span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="proposal-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {proposal.diff && (
              <div className="proposal-diff-section">
                <TextDiff before={proposal.diff.before} after={proposal.diff.after} mode="inline" />
              </div>
            )}
            {proposal.paramDiff && (
              <div className="proposal-diff-section">
                <ParamDiff before={proposal.paramDiff.before} after={proposal.paramDiff.after} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="proposal-actions">
        <button className="action-btn primary" onClick={onApply}>
          <Check size={14} />
          应用提案
        </button>
        <button className="action-btn secondary" onClick={onRegenerate}>
          <RefreshCw size={14} />
          重生成
        </button>
        <button className="action-btn danger" onClick={onReject}>
          放弃
        </button>
      </div>
    </div>
  );
};

/**
 * 提案弹层组件
 */
export const ProposalModal = ({ isOpen, onClose, proposal, onApply, onReject, onRegenerate }) => {
  if (!isOpen || !proposal) return null;

  const { type, title, summary, reason, affectedNodes, diff, paramDiff } = proposal;

  return (
    <div className="proposal-modal-backdrop" onClick={onClose}>
      <motion.div
        className="proposal-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} />
            <span>{title || (type === 'revision' ? '局部编辑提案' : '重生成提案')}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 提案摘要 */}
          <div className="modal-section">
            <div className="section-label">变更内容</div>
            <div className="section-content">
              <p className="proposal-text">{summary}</p>
            </div>
          </div>

          {/* 变更原因 */}
          {reason && (
            <div className="modal-section">
              <div className="section-label">变更原因</div>
              <div className="section-content">
                <p className="proposal-reason-text">{reason}</p>
              </div>
            </div>
          )}

          {/* 影响节点 */}
          {affectedNodes && affectedNodes.length > 0 && (
            <div className="modal-section">
              <div className="section-label">影响范围</div>
              <div className="section-content">
                <div className="affected-nodes-list">
                  {affectedNodes.map((node) => (
                    <span key={node.id} className="affected-node-item">
                      <span className="node-name">{node.name}</span>
                      <span className={`node-impact ${node.impact}`}>{node.impactText}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 文本 Diff */}
          {diff && (
            <div className="modal-section">
              <div className="section-label">文本变更</div>
              <div className="section-content">
                <TextDiff before={diff.before} after={diff.after} mode="side-by-side" />
              </div>
            </div>
          )}

          {/* 参数 Diff */}
          {paramDiff && (
            <div className="modal-section">
              <div className="section-label">参数变更</div>
              <div className="section-content">
                <ParamDiff before={paramDiff.before} after={paramDiff.after} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="action-btn secondary" onClick={onReject}>
            放弃
          </button>
          <button className="action-btn secondary" onClick={onRegenerate}>
            <RefreshCw size={14} />
            重生成
          </button>
          <button className="action-btn primary" onClick={onApply}>
            <Check size={14} />
            确认{type === 'revision' ? '应用修改' : '重新生成'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 提案Banner - 用于对话Tab内的紧凑展示
 */
export const ProposalBanner = ({ proposal, onApply, onViewDiff, onRegenerate }) => {
  if (!proposal) return null;

  return (
    <div className={`proposal-banner ${proposal.type}`}>
      <div className="banner-icon">
        <AlertTriangle size={16} />
      </div>
      <div className="banner-content">
        <div className="banner-title">
          {proposal.type === 'revision' ? '📝 有待应用的编辑提案' : '🔄 有待确认的重生成提案'}
        </div>
        <div className="banner-summary">{proposal.summary}</div>
      </div>
      <div className="banner-actions">
        <button className="banner-btn primary" onClick={onApply}>
          应用
        </button>
        {onViewDiff && (
          <button className="banner-btn" onClick={onViewDiff}>
            查看差异
          </button>
        )}
        {onRegenerate && (
          <button className="banner-btn" onClick={onRegenerate}>
            重生成
          </button>
        )}
      </div>
    </div>
  );
};

export default ProposalSummary;
