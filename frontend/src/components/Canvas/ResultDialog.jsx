import { motion } from 'framer-motion';
import { Check, Plus, X, Sparkles } from 'lucide-react';
import './ResultDialog.css';

/**
 * ResultDialog - 运行结果处理对话框
 *
 * Props:
 * - isOpen: 是否显示
 * - result: 运行结果数据
 * - onReplace: 替换当前资产
 * - onCreateNew: 创建为新资产
 * - onCancel: 取消
 */
function ResultDialog({
  isOpen,
  result,
  onReplace,
  onCreateNew,
  onCancel,
}) {
  if (!isOpen || !result) return null;

  const resultType = result.type || 'image';
  const thumbnail = result.thumbnail || result.result?.thumbnail;

  return (
    <motion.div
      className="result-dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="result-dialog"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="result-dialog-header">
          <div className="header-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="result-dialog-title">生成完成</h3>
            <p className="result-dialog-subtitle">请选择如何处理生成结果</p>
          </div>
        </div>

        {/* 预览 */}
        {thumbnail && (
          <div className="result-preview">
            {resultType === 'video' ? (
              <video src={thumbnail} className="preview-media" controls />
            ) : (
              <img src={thumbnail} alt="生成结果" className="preview-media" />
            )}
          </div>
        )}

        {/* 结果信息 */}
        <div className="result-info">
          <span className="result-type">
            {resultType === 'video' ? '视频' : '图片'}
          </span>
          {result.nodeName && (
            <span className="result-source">来源: {result.nodeName}</span>
          )}
        </div>

        {/* 操作 */}
        <div className="result-dialog-actions">
          <button
            className="result-btn secondary"
            onClick={onCancel}
          >
            <X size={16} />
            取消
          </button>
          <button
            className="result-btn secondary"
            onClick={onCreateNew}
          >
            <Plus size={16} />
            创建为新资产
          </button>
          <button
            className="result-btn primary"
            onClick={onReplace}
          >
            <Check size={16} />
            替换当前资产
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ResultDialog;
