import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const ICONS = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const Toast = ({ message, type = 'info', onClose }) => {
  return (
    <motion.div
      className={`toast toast-${type}`}
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="toast-icon">{ICONS[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </motion.div>
  );
};

// 全局 show 函数引用（模块级别）
let globalShowToast = null;

// 向外暴露的 show 方法
export const toast = {
  show: (opt) => globalShowToast && globalShowToast(opt),
  success: (msg) => globalShowToast && globalShowToast({ message: msg, type: 'success' }),
  error: (msg) => globalShowToast && globalShowToast({ message: msg, type: 'error' }),
  warning: (msg) => globalShowToast && globalShowToast({ message: msg, type: 'warning' }),
  info: (msg) => globalShowToast && globalShowToast({ message: msg, type: 'info' }),
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const showRef = useRef(null);

  useEffect(() => {
    showRef.current = (opt) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { ...opt, id }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, opt.duration || 3500);
    };
    globalShowToast = showRef.current;
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
