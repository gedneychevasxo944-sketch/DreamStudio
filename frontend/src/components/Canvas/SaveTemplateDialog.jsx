import { motion, AnimatePresence } from 'framer-motion';
import { Save } from 'lucide-react';

/**
 * 保存团队对话框组件
 */
const SaveTemplateDialog = ({
  isOpen,
  templateName,
  onTemplateNameChange,
  templateDescribe,      // 新增
  onTemplateDescribeChange,  // 新增
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
          <span>保存团队</span>
        </div>
        <div className="dialog-content">
          <label>团队名称</label>
          <input
            type="text"
            placeholder="输入团队名称..."
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            autoFocus
          />
          <label style={{ marginTop: '12px' }}>团队描述</label>
          <textarea
            type="text"
            placeholder="输入团队描述（可选）..."
            value={templateDescribe || ''}
            onChange={(e) => onTemplateDescribeChange(e.target.value)}
            rows={3}
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
