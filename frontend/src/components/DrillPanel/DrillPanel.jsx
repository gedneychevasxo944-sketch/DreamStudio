import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './DrillPanel.css';

/**
 * DrillPanel - 钻取面板容器
 *
 * 功能：
 * - 右侧抽屉滑入动画
 * - ESC / 遮罩 点击关闭
 * - 动态渲染子面板
 *
 * @param {boolean} isOpen - 是否显示
 * @param {function} onClose - 关闭回调
 * @param {string} title - 面板标题
 * @param {React.ReactNode} children - 子面板内容
 * @param {string} position - 'right' | 'center'
 * @param {number} width - 面板宽度 (position=right 时生效)
 */
const DrillPanel = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = 400,
}) => {
  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 防止滚动穿透
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (position === 'center') {
    // 居中浮层
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="drill-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
          >
            <motion.div
              className="drill-panel drill-panel-center"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="drill-header">
                  <h3 className="drill-title">{title}</h3>
                  <button className="drill-close" onClick={onClose}>
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="drill-content">{children}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // 右侧抽屉
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            className="drill-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 抽屉面板 */}
          <motion.div
            className="drill-panel drill-panel-right"
            style={{ width }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {title && (
              <div className="drill-header">
                <h3 className="drill-title">{title}</h3>
                <button className="drill-close" onClick={onClose}>
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="drill-content">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DrillPanel;
