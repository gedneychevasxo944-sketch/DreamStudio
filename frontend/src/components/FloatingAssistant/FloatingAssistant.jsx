import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, MessageCircle } from 'lucide-react';
import { useChatStore, useProjectStore } from '../../stores';
import ChatConversation from '../ChatConversation';
import { ASSISTANT_AGENT_ID } from '../../constants/ComponentType';
import './FloatingAssistant.css';

/**
 * FloatingAssistant - 悬浮助手
 */
function FloatingAssistant() {
  const { isFloatingOpen, closeFloating, floatingPosition, floatingSize, setFloatingPosition, contextType, contextName } = useChatStore();
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const currentVersion = useProjectStore(state => state.currentVersion);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 360, height: 480 });
  const drawerRef = useRef(null);

  // 初始化位置和大小
  useEffect(() => {
    setPosition({ x: floatingPosition.x, y: floatingPosition.y });
    setSize({ width: floatingSize.width, height: floatingSize.height });
  }, []);

  // 保存位置到 localStorage
  const savePosition = useCallback((pos) => {
    try {
      localStorage.setItem('floating_assistant_pos', JSON.stringify(pos));
    } catch (e) {}
  }, []);

  // 保存大小到 localStorage
  const saveSize = useCallback((s) => {
    try {
      localStorage.setItem('floating_assistant_size', JSON.stringify(s));
    } catch (e) {}
  }, []);

  // 从 localStorage 加载位置和大小
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem('floating_assistant_pos');
      if (savedPos) {
        const pos = JSON.parse(savedPos);
        setPosition(pos);
        setFloatingPosition(pos);
      }
      const savedSize = localStorage.getItem('floating_assistant_size');
      if (savedSize) {
        setSize(JSON.parse(savedSize));
      }
    } catch (e) {}
  }, []);

  // 拖拽开始 - 只在头部
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.header-btn')) return;
    if (e.target.closest('.resize-handle')) return;
    e.preventDefault();

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  // 拖拽中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // 边缘吸附
      const snapThreshold = 20;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const drawerWidth = size.width;
      const drawerHeight = size.height;

      let finalX = position.x;
      let finalY = position.y;

      // 左边吸附
      if (position.x < snapThreshold) {
        finalX = 0;
      }
      // 右边吸附
      else if (position.x + drawerWidth > windowWidth - snapThreshold) {
        finalX = windowWidth - drawerWidth;
      }

      // 顶部吸附
      if (position.y < snapThreshold) {
        finalY = 0;
      }
      // 底部吸附
      else if (position.y + drawerHeight > windowHeight - snapThreshold) {
        finalY = windowHeight - drawerHeight;
      }

      setPosition({ x: finalX, y: finalY });
      setFloatingPosition({ x: finalX, y: finalY });
      savePosition({ x: finalX, y: finalY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, setFloatingPosition, savePosition]);

  // 调整大小开始
  const handleResizeStart = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  // 调整大小中
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const rect = drawerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newWidth = Math.max(300, Math.min(600, e.clientX - rect.left));
      const newHeight = Math.max(300, Math.min(800, e.clientY - rect.top));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      saveSize(size);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, size, saveSize]);

  // 点击外部关闭
  useEffect(() => {
    if (!isFloatingOpen) return;

    const handleClickOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        closeFloating();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFloatingOpen, closeFloating]);

  // 获取标题
  const getTitle = () => {
    if (!contextType) return '智能助理';
    if (contextType === 'project') return contextName || '项目';
    if (contextType === 'asset') return contextName || '资产';
    if (contextType === 'workflow') return '工作流';
    if (contextType === 'node') return contextName || '节点';
    return '智能助理';
  };

  if (!isFloatingOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={drawerRef}
        className="floating-drawer"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
      >
        {/* 头部 - 可拖拽 */}
        <div
          className={`drawer-header ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="header-title">
            <MessageCircle size={18} />
            <span>{getTitle()}</span>
          </div>
          <div className="header-actions">
            <button className="header-btn close" onClick={closeFloating} title="关闭">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="drawer-content">
          <ChatConversation
            agentId={ASSISTANT_AGENT_ID}
            projectId={currentProjectId}
            projectVersion={currentVersion?.version}
            placeholder="输入消息，AI 助手随时为您服务..."
            disabledPlaceholder="生成完成后可对话"
          />
        </div>

        {/* 大小调整把手 */}
        <div className="resize-handle" onMouseDown={handleResizeStart} />
      </motion.div>
    </AnimatePresence>
  );
}

export default FloatingAssistant;
