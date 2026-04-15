import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import './FloatingAssistant.css';

/**
 * FloatingAssistantButton - 悬浮助手按钮
 *
 * 右下角固定的圆形按钮，点击展开抽屉
 */
const FloatingAssistantButton = ({ onClick, unreadCount = 0 }) => {
  return (
    <motion.button
      className="floating-assistant-button"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <MessageCircle size={24} />

      {/* 未读消息计数 */}
      {unreadCount > 0 && (
        <motion.span
          className="unread-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      )}

      {/* 脉冲动画 */}
      <span className="pulse-ring" />
    </motion.button>
  );
};

export default FloatingAssistantButton;
