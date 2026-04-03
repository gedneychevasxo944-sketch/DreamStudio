import { motion, AnimatePresence } from 'framer-motion';
import { Save } from 'lucide-react';

/**
 * 保存模板对话框组件
 */
const SaveTemplateDialog = ({
  isOpen,
  templateName,
  onTemplateNameChange,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="save-template-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="save-template-dialog"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <Save size={18} />
          <span>保存团队模板</span>
        </div>
        <div className="dialog-content">
          <label>模板名称</label>
          <input
            type="text"
            placeholder="输入模板名称..."
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            autoFocus
          />
          <p className="dialog-hint">
            保存后可在"我的私有"中一键载入此团队配置
          </p>
        </div>
        <div className="dialog-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="btn-primary"
            onClick={onSave}
            disabled={!templateName.trim()}
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SaveTemplateDialog;
