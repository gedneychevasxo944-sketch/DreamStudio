import { useState } from 'react';
import { Sparkles, Edit2, RotateCcw, Save } from 'lucide-react';
import './PromptDiffPanel.css';

/**
 * S1: Prompt 对比面板
 *
 * 场景：对话调整镜头描述
 * 展示：修改前后 Prompt 对比 + 差异统计
 */
const PromptDiffPanel = ({ modification, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(modification.afterPrompt);

  if (!modification) return null;

  const { beforePrompt, afterPrompt, userInstruction, changes } = modification;

  // 简单的高亮差异（实际应用中可用 diff 算法）
  const renderDiff = (text, type) => {
    if (type === 'before') {
      return <div className="prompt-text before">{beforePrompt}</div>;
    }
    return <div className="prompt-text after">{afterPrompt}</div>;
  };

  return (
    <div className="prompt-diff-panel">
      {/* 用户指令 */}
      {userInstruction && (
        <div className="user-instruction">
          <span className="label">你的指令：</span>
          <span className="value">"{userInstruction}"</span>
        </div>
      )}

      {/* 修改前后对比 */}
      <div className="prompt-comparison">
        <div className="prompt-section">
          <div className="prompt-label">修改前 Prompt：</div>
          {renderDiff(beforePrompt, 'before')}
        </div>

        <div className="diff-arrow">↓</div>

        <div className="prompt-section">
          <div className="prompt-label">修改后 Prompt：</div>
          {isEditing ? (
            <textarea
              className="prompt-editor"
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={4}
            />
          ) : (
            renderDiff(afterPrompt, 'after')
          )}
        </div>
      </div>

      {/* 变化统计 */}
      {changes && (
        <div className="changes-summary">
          <Sparkles size={14} />
          <span>
            变化：删除了{changes.removed?.length || 0}个物体，新增了{changes.added?.length || 0}个元素
          </span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="panel-actions">
        {isEditing ? (
          <>
            <button className="action-btn primary" onClick={() => setIsEditing(false)}>
              保存编辑
            </button>
            <button className="action-btn secondary" onClick={() => setIsEditing(false)}>
              取消
            </button>
          </>
        ) : (
          <>
            <button className="action-btn primary" onClick={() => setIsEditing(true)}>
              <Edit2 size={14} />
              直接编辑Prompt
            </button>
            <button className="action-btn secondary">
              <RotateCcw size={14} />
              回退到修改前
            </button>
            <button className="action-btn secondary">
              <Save size={14} />
              保存为风格预设
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PromptDiffPanel;
