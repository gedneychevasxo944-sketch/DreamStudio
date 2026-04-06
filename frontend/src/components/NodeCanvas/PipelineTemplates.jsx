import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Film,
  Zap,
  Check,
  LayoutGrid,
  Sparkles,
  Loader2
} from 'lucide-react';
import './PipelineTemplates.css';

// 默认图标映射
const getIconByCategory = (category) => {
  switch (category) {
    case 'rapid-team':
      return Zap;
    case 'minimal':
      return LayoutGrid;
    default:
      return Film;
  }
};

const getColorByCategory = (category) => {
  switch (category) {
    case 'rapid-team':
      return '#3b82f6';
    case 'minimal':
      return '#10b981';
    default:
      return '#f59e0b';
  }
};

const PipelineTemplates = ({ templates = [], onSelect, loading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (templateId) => {
    setSelectedId(templateId);
    onSelect(templateId);
    setIsOpen(false);
  };

  const selectedTemplate = templates.find(t => t.id === selectedId);

  return (
    <div className="pipeline-templates" ref={dropdownRef}>
      {/* 主按钮 */}
      <button
        className="template-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <div className="trigger-icon">
          {loading ? (
            <Loader2 size={16} className="spin" />
          ) : selectedTemplate ? (
            <LayoutGrid size={16} style={{ color: getColorByCategory(selectedTemplate.category) }} />
          ) : (
            <LayoutGrid size={16} />
          )}
        </div>
        <span className="trigger-text">
          {loading ? '加载中...' : (selectedTemplate ? selectedTemplate.name : '选择流派预设')}
        </span>
        <ChevronDown
          size={14}
          className={`trigger-arrow ${isOpen ? 'open' : ''}`}
        />
      </button>
      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="template-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="dropdown-header">
              <Sparkles size={14} />
              <span>团队列表</span>
            </div>

            <div className="preset-list">
              {templates.map((template) => {
                const IconComponent = getIconByCategory(template.category);
                const color = getColorByCategory(template.category);
                const isSelected = selectedId === template.id;
                const nodeCount = template.nodes?.length || 0;

                return (
                  <motion.button
                    key={template.id}
                    className={`preset-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(template.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="preset-icon"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <IconComponent size={18} style={{ color }} />
                    </div>
                    <div className="preset-info">
                      <span className="preset-name">{template.name}</span>
                      <span className="preset-desc">{template.description}</span>
                    </div>
                    <div className="preset-meta">
                      <span className="meta-item">{nodeCount} 节点</span>
                    </div>
                    {isSelected && (
                      <div className="selected-check">
                        <Check size={14} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PipelineTemplates;
