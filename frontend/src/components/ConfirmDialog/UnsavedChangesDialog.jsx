import { X, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import './UnsavedChangesDialog.css';

const UnsavedChangesDialog = ({
  isOpen,
  projectName,
  changes = [],
  onSaveAndLeave,
  onLeaveWithoutSaving,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="unsaved-dialog-overlay" onClick={onCancel}>
      <div className="unsaved-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button className="unsaved-dialog-close" onClick={onCancel}>
          <X size={18} />
        </button>

        {/* 头部 */}
        <div className="unsaved-dialog-header">
          <div className="unsaved-dialog-icon">
            <AlertCircle size={20} />
          </div>
          <div className="unsaved-dialog-title-group">
            <div className="unsaved-dialog-project-name">{projectName}</div>
            <div className="unsaved-dialog-subtitle">
              有 {changes.length} 处修改尚未保存
            </div>
          </div>
        </div>

        {/* 修改列表 */}
        <div className="unsaved-dialog-changes">
          {changes.map((change, idx) => (
            <div key={idx} className="unsaved-dialog-change-item">
              <span className="unsaved-dialog-change-stage">{change.stage}</span>
              <span className="unsaved-dialog-change-desc">{change.description}</span>
            </div>
          ))}
        </div>

        {/* 提示 */}
        <div className="unsaved-dialog-hint">
          这些修改将在离开后丢失
        </div>

        {/* 按钮组 */}
        <div className="unsaved-dialog-footer">
          <button
            className="unsaved-dialog-btn primary"
            onClick={onSaveAndLeave}
          >
            保存并离开
          </button>
          <button
            className="unsaved-dialog-btn secondary"
            onClick={onLeaveWithoutSaving}
          >
            不保存离开
          </button>
          <button
            className="unsaved-dialog-btn cancel"
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UnsavedChangesDialog;
