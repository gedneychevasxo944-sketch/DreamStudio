import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import './Toast.css';

const ICONS = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
};

const BottomToast = ({ message, type = 'success', onClose }) => (
  <motion.div
    className={`bottom-toast bottom-toast-${type}`}
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.97 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <span className="bottom-toast-icon">{ICONS[type]}</span>
    <span className="bottom-toast-message">{message}</span>
    <button className="bottom-toast-close" onClick={onClose}>×</button>
  </motion.div>
);

let globalShowBottomToast = null;

export const bottomToast = {
  show: (opt) => globalShowBottomToast && globalShowBottomToast(opt),
  success: (msg) => globalShowBottomToast && globalShowBottomToast({ message: msg, type: 'success' }),
  error: (msg) => globalShowBottomToast && globalShowBottomToast({ message: msg, type: 'error' }),
  warning: (msg) => globalShowBottomToast && globalShowBottomToast({ message: msg, type: 'warning' }),
};

const BottomToastContainer = () => {
  const [items, setItems] = useState([]);
  const showRef = useRef(null);

  useEffect(() => {
    showRef.current = (opt) => {
      const id = Date.now() + Math.random();
      setItems(prev => [...prev, { ...opt, id }]);
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), opt.duration || 3000);
    };
    globalShowBottomToast = showRef.current;
  }, []);

  return (
    <div className="bottom-toast-container">
      <AnimatePresence>
        {items.map(t => (
          <BottomToast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setItems(prev => prev.filter(x => x.id !== t.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BottomToastContainer;
