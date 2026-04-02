import { AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-icon">
            <AlertTriangle size={24} />
          </div>
          <button className="confirm-dialog-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="confirm-dialog-body">
          <h3 className="confirm-dialog-title">{title}</h3>
          <p className="confirm-dialog-message">{message}</p>
        </div>

        <div className="confirm-dialog-footer">
          <button className="confirm-dialog-btn cancel" onClick={onCancel}>
            取消
          </button>
          <button className="confirm-dialog-btn confirm" onClick={onConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
