import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Clock } from 'lucide-react';
import './SmartSuggestion.css';

/**
 * SmartSuggestion - 智能建议通知组件
 *
 * 功能：
 * - 非模态通知，出现在右下角
 * - 连续3次调整同一镜头但未点"满意"时显示
 * - 提供"稍后"和"打开故事板"两个选项
 */
const SmartSuggestion = ({
  isVisible,
  message = '检测到多次调整，是否切换到故事板批量处理？',
  onOpenStoryboard,
  onDismiss,
  autoHideDelay = 0, // 0 means don't auto hide
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);

  useEffect(() => {
    setIsShowing(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (autoHideDelay > 0 && isShowing) {
      const timer = setTimeout(() => {
        setIsShowing(false);
        onDismiss?.();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isShowing, autoHideDelay, onDismiss]);

  const handleOpenStoryboard = () => {
    setIsShowing(false);
    onOpenStoryboard?.();
  };

  const handleDismiss = () => {
    setIsShowing(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          className="smart-suggestion"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="suggestion-icon">
            <MessageSquare size={18} />
          </div>

          <div className="suggestion-content">
            <p className="suggestion-message">{message}</p>
          </div>

          <div className="suggestion-actions">
            <button className="suggestion-btn secondary" onClick={handleDismiss}>
              稍后
            </button>
            <button className="suggestion-btn primary" onClick={handleOpenStoryboard}>
              打开故事板
            </button>
          </div>

          <button className="suggestion-close" onClick={handleDismiss}>
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmartSuggestion;
