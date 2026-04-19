import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import './ImpactToast.css';

/**
 * ImpactToast - 资产修改影响提示组件
 *
 * Props:
 * - message: 提示消息
 * - impactedAssets: 受影响的资产列表 [{id, name, type}]
 * - onRegenerate: 重新生成按钮回调
 * - onDismiss: 忽略按钮回调
 * - onClose: 关闭提示回调
 */
function ImpactToast({
  message,
  impactedAssets = [],
  onRegenerate,
  onDismiss,
  onClose,
}) {
  return (
    <motion.div
      className="impact-toast"
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* 警告图标 */}
      <div className="toast-icon">
        <AlertTriangle size={18} />
      </div>

      {/* 内容 */}
      <div className="toast-content">
        <p className="toast-message">{message}</p>

        {/* 受影响资产列表 */}
        {impactedAssets.length > 0 && (
          <div className="impacted-list">
            <span className="impacted-label">受影响:</span>
            {impactedAssets.slice(0, 3).map((asset, index) => (
              <span key={asset.id || index} className="impacted-item">
                {asset.name || asset.type}
              </span>
            ))}
            {impactedAssets.length > 3 && (
              <span className="impacted-more">
                +{impactedAssets.length - 3} 更多
              </span>
            )}
          </div>
        )}
      </div>

      {/* 操作 */}
      <div className="toast-actions">
        {onRegenerate && (
          <button className="toast-btn regenerate" onClick={onRegenerate}>
            <RefreshCw size={14} />
            重新生成
          </button>
        )}
        {onDismiss && (
          <button className="toast-btn dismiss" onClick={onDismiss}>
            忽略
          </button>
        )}
        {onClose && (
          <button className="toast-btn close" onClick={onClose}>
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default ImpactToast;
