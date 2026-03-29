import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  PenTool, 
  Palette, 
  Video, 
  Code, 
  Sparkles, 
  Shield, 
  Edit3,
  X,
  Activity,
  CheckCircle2,
  Loader2,
  Plus
} from 'lucide-react';
import './AgentNode.css';

const ICON_MAP = {
  Target,
  PenTool,
  Palette,
  Video,
  Code,
  Sparkles,
  Shield
};

const AgentNode = ({
  node,
  isSelected,
  onSelect,
  onUpdatePosition,
  onDelete,
  onStartConnection,
  onCompleteConnection,
  onAddConnectedNode,
  isConnecting,
  connectingFrom,
  availableAgents,
  onOpenSettings,
  onDimensionChange
}) => {
  const nodeRef = useRef(null);
  const menuRef = useRef(null);
  const settingsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);

  // 使用 ref 存储拖拽状态
  const dragStateRef = useRef({ isDragging: false, offset: { x: 0, y: 0 } });

  // 报告节点尺寸变化
  useEffect(() => {
    if (nodeRef.current && onDimensionChange) {
      const updateDimensions = () => {
        const rect = nodeRef.current.getBoundingClientRect();
        onDimensionChange(node.id, rect.width, rect.height);
      };

      updateDimensions();

      // 监听尺寸变化
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(nodeRef.current);

      return () => resizeObserver.disconnect();
    }
  }, [node.id, onDimensionChange]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAgentMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAgentMenu(false);
      }
      if (showSettings && settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };

    if (showAgentMenu || showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAgentMenu, showSettings]);

  const handleMouseDown = (e) => {
    // 如果点击的是按钮、端口或菜单，不触发拖拽
    if (e.target.closest('.node-btn') || e.target.closest('.port') || e.target.closest('.agent-menu')) {
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    
    const offset = {
      x: e.clientX - node.x,
      y: e.clientY - node.y
    };
    
    dragStateRef.current = { isDragging: true, offset };
    setIsDragging(true);
  };

  // 全局鼠标移动处理
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (dragStateRef.current.isDragging) {
        onUpdatePosition(
          node.id, 
          e.clientX - dragStateRef.current.offset.x, 
          e.clientY - dragStateRef.current.offset.y
        );
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, node.id, onUpdatePosition]);

  // 输出端口事件
  const portDragState = useRef({ isDown: false, hasMoved: false });

  const handleOutputPortMouseDown = (e, portId) => {
    e.stopPropagation();
    e.preventDefault();
    portDragState.current = { isDown: true, hasMoved: false };
  };

  const handleOutputPortMouseMove = (e, portId) => {
    if (portDragState.current.isDown && !portDragState.current.hasMoved) {
      portDragState.current.hasMoved = true;
      onStartConnection(node.id, portId, 'output');
    }
  };

  const handleOutputPortMouseUp = (e, portId) => {
    e.stopPropagation();
    e.preventDefault();
    if (portDragState.current.isDown) {
      if (!portDragState.current.hasMoved) {
        // 没有移动，是点击，显示菜单，并取消连线状态
        setShowAgentMenu(true);
        // 取消连线状态
        if (isConnecting) {
          // 调用父组件取消连线
          window.dispatchEvent(new CustomEvent('cancelConnection'));
        }
      }
      portDragState.current = { isDown: false, hasMoved: false };
    }
  };

  // 输入端口鼠标抬起 - 完成连线
  const handleInputPortMouseUp = (e, portId) => {
    e.stopPropagation();
    e.preventDefault();
    if (isConnecting && connectingFrom && connectingFrom.nodeId !== node.id) {
      onCompleteConnection(node.id, portId);
    }
  };

  // 选择智能体并自动创建节点和连线
  const handleSelectAgent = (agentType) => {
    setShowAgentMenu(false);
    if (onAddConnectedNode) {
      onAddConnectedNode(node.id, agentType);
    }
  };

  // 删除节点
  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
  };

  // 编辑节点
  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onOpenSettings?.(node);
  };

  const IconComponent = ICON_MAP[node.icon] || Target;

  return (
    <>
      <motion.div
        ref={nodeRef}
        className={`agent-node ${isSelected ? 'selected' : ''} ${node.status || 'idle'}`}
        style={{
          left: node.x,
          top: node.y,
          '--node-color': node.color
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onMouseDown={handleMouseDown}
      >
        {/* 左上角 - 删除按钮 */}
        <button 
          className="node-btn delete-btn"
          onClick={handleDelete}
          title="删除节点"
        >
          <X size={12} />
        </button>

        {/* 右上角 - 编辑按钮 */}
        <button 
          className="node-btn edit-btn"
          onClick={handleEdit}
          title="编辑节点"
        >
          <Edit3 size={12} />
        </button>

        {/* 节点内容 */}
        <div className="node-content">
          <div className="node-icon" style={{ backgroundColor: `${node.color}20` }}>
            <IconComponent size={20} style={{ color: node.color }} />
          </div>
          <span className="node-name">{node.name}</span>
        </div>

        {/* 输入端口 - 左侧 */}
        {node.inputs?.map((input) => (
          <div 
            key={input.id}
            className="port input-port"
            onMouseUp={(e) => handleInputPortMouseUp(e, input.id)}
            title={input.label}
          />
        ))}

        {/* 输出端口 - 右侧 */}
        {node.outputs?.map((output) => (
          <div 
            key={output.id}
            className="port output-port"
            onMouseDown={(e) => handleOutputPortMouseDown(e, output.id)}
            onMouseMove={(e) => handleOutputPortMouseMove(e, output.id)}
            onMouseUp={(e) => handleOutputPortMouseUp(e, output.id)}
            title={output.label}
          />
        ))}
      </motion.div>

      {/* 智能体选择菜单 */}
      <AnimatePresence>
        {showAgentMenu && (
          <motion.div
            ref={menuRef}
            className="agent-menu"
            style={{
              left: node.x + 220,
              top: node.y + 20
            }}
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="agent-menu-header">
              <Plus size={14} />
              <span>添加智能体</span>
            </div>
            <div className="agent-menu-list">
              {availableAgents?.map((agent) => {
                const AgentIcon = ICON_MAP[agent.icon] || Target;
                return (
                  <button
                    key={agent.id}
                    className="agent-menu-item"
                    onClick={() => handleSelectAgent(agent.id)}
                  >
                    <div 
                      className="agent-menu-icon"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      <AgentIcon size={16} style={{ color: agent.color }} />
                    </div>
                    <span className="agent-menu-name">{agent.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 设置面板 */}
      {showSettings && (
        <motion.div 
          ref={settingsRef}
          className="node-settings-panel"
          style={{
            left: node.x + 210,
            top: node.y
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <div className="settings-header">
            <span>{node.name}</span>
            <button className="close-btn" onClick={() => setShowSettings(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <label>输入</label>
              {node.inputs?.map(input => (
                <div key={input.id} className="param-row">
                  <span className="param-name">{input.label}</span>
                  <span className="param-type">{input.type}</span>
                </div>
              ))}
            </div>
            <div className="setting-item">
              <label>输出</label>
              {node.outputs?.map(output => (
                <div key={output.id} className="param-row">
                  <span className="param-name">{output.label}</span>
                  <span className="param-type">{output.type}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default AgentNode;
