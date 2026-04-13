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

const Toast = ({ message, type = 'info', position = 'top-right', onClose }) => {
  const classPrefix = position === 'bottom' ? 'bottom-toast' : 'toast';
  const iconSize = position === 'bottom' ? 16 : 18;

  const icons = {
    success: <CheckCircle2 size={iconSize} />,
    error: <XCircle size={iconSize} />,
    warning: <AlertTriangle size={iconSize} />,
    info: <Info size={iconSize} />,
  };

  return (
    <motion.div
      className={`${classPrefix} ${classPrefix}-${type}`}
      initial={position === 'bottom'
        ? { opacity: 0, y: 20, scale: 0.95 }
        : { opacity: 0, x: 60, scale: 0.95 }}
      animate={position === 'bottom'
        ? { opacity: 1, y: 0, scale: 1 }
        : { opacity: 1, x: 0, scale: 1 }}
      exit={position === 'bottom'
        ? { opacity: 0, y: 10, scale: 0.97 }
        : { opacity: 0, x: 40, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className={`${classPrefix}-icon`}>{icons[type]}</span>
      <span className={`${classPrefix}-message`}>{message}</span>
      <button className={`${classPrefix}-close`} onClick={onClose}>
        {position === 'bottom' ? '×' : <X size={14} />}
      </button>
    </motion.div>
  );
};

// 统一的全剧 show 引用
let globalShowToast = null;

export const toast = {
  show: (opt) => globalShowToast && globalShowToast(opt),
  success: (msg, opts = {}) => globalShowToast && globalShowToast({ message: msg, type: 'success', position: opts.position }),
  error: (msg, opts = {}) => globalShowToast && globalShowToast({ message: msg, type: 'error', position: opts.position }),
  warning: (msg, opts = {}) => globalShowToast && globalShowToast({ message: msg, type: 'warning', position: opts.position }),
  info: (msg, opts = {}) => globalShowToast && globalShowToast({ message: msg, type: 'info', position: opts.position }),
};

const ToastContainer = () => {
  const [topRightToasts, setTopRightToasts] = useState([]);
  const [bottomToasts, setBottomToasts] = useState([]);
  const showRef = useRef(null);

  useEffect(() => {
    showRef.current = (opt) => {
      const id = Date.now() + Math.random();
      const position = opt.position || 'top-right';
      const item = { ...opt, id };

      if (position === 'bottom') {
        setBottomToasts(prev => [...prev, item]);
      } else {
        setTopRightToasts(prev => [...prev, item]);
      }

      setTimeout(() => {
        if (position === 'bottom') {
          setBottomToasts(prev => prev.filter(t => t.id !== id));
        } else {
          setTopRightToasts(prev => prev.filter(t => t.id !== id));
        }
      }, opt.duration || (position === 'bottom' ? 3000 : 3500));
    };
    globalShowToast = showRef.current;
  }, []);

  const dismissTopRight = (id) => setTopRightToasts(prev => prev.filter(t => t.id !== id));
  const dismissBottom = (id) => setBottomToasts(prev => prev.filter(t => t.id !== id));

  return (
    <>
      <div className="toast-container">
        <AnimatePresence>
          {topRightToasts.map(t => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              position="top-right"
              onClose={() => dismissTopRight(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="bottom-toast-container">
        <AnimatePresence>
          {bottomToasts.map(t => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              position="bottom"
              onClose={() => dismissBottom(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ToastContainer;
