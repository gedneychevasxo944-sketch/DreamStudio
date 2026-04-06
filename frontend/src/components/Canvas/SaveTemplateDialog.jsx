import { motion } from 'framer-motion';
import { Save, Sparkles, Info } from 'lucide-react';
import './SaveTemplateDialog.css';

/**
 * 保存团队对话框组件
 */
const SaveTemplateDialog = ({
  isOpen,
  templateName,
  onTemplateNameChange,
  templateDescribe,
  onTemplateDescribeChange,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const charCount = (templateDescribe || '').length;

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
        initial={{ scale: 0.88, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="save-template-body">
          {/* 头部 */}
          <div className="save-template-header">
            <div className="save-template-icon">
              <Save size={20} />
            </div>
            <div>
              <h3 className="save-template-title">保存为团队模板</h3>
              <p className="save-template-subtitle">将当前工作流保存为可复用的智能体组合</p>
            </div>
          </div>

          {/* 表单 */}
          <div className="save-template-form">
            <div className="save-template-field">
              <label className="save-template-label">
                团队名称 <span className="required">*</span>
              </label>
              <input
                type="text"
                className="save-template-input"
                placeholder="例如：短视频制作工作流"
                value={templateName}
                onChange={(e) => onTemplateNameChange(e.target.value)}
                autoFocus
                maxLength={40}
              />
            </div>

            <div className="save-template-field">
              <label className="save-template-label">
                团队描述
              </label>
              <textarea
                className="save-template-textarea"
                placeholder="简要描述这个团队模板的用途和特点..."
                value={templateDescribe || ''}
                onChange={(e) => onTemplateDescribeChange(e.target.value)}
                rows={3}
                maxLength={200}
              />
              <div className="save-template-char-count">{charCount}/200</div>
            </div>

            {/* 提示 */}
            <div className="save-template-hint">
              <Info size={14} />
              <span>保存后可在「我的私有」模板中一键载入，快速初始化工作流</span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="save-template-footer">
          <button
            className="save-template-btn secondary"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="save-template-btn primary"
            onClick={onSave}
            disabled={!templateName.trim()}
          >
            <Sparkles size={14} style={{ marginRight: 6 }} />
            保存模板
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SaveTemplateDialog;
