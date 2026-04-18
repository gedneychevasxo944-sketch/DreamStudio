import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Sparkles, User, Check } from 'lucide-react';
import './TemplateSelector.css';

/**
 * TemplateSelector - 模板选择下拉组件
 *
 * Props:
 * - isOpen: 是否打开
 * - onClose: 关闭回调
 * - onSelect: 选择模板回调 (template)
 * - systemTemplates: 系统预设模板列表
 * - userTemplates: 用户模板列表
 * - currentTemplateId: 当前选中的模板ID（可选）
 */
function TemplateSelector({
  isOpen,
  onClose,
  onSelect,
  systemTemplates = [],
  userTemplates = [],
  currentTemplateId,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'system'
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 搜索时自动聚焦
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // 过滤模板
  const filterTemplates = (templates) => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t =>
      t.name?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  };

  const filteredUserTemplates = filterTemplates(userTemplates);
  const filteredSystemTemplates = filterTemplates(systemTemplates);

  const handleSelect = (template) => {
    onSelect?.(template);
    onClose?.();
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <motion.div
        className="template-selector-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* 下拉面板 */}
      <motion.div
        ref={dropdownRef}
        className="template-selector-dropdown"
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* 搜索框 */}
        <div className="template-search">
          <Search size={14} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tab 切换 */}
        <div className="template-tabs">
          <button
            className={`template-tab ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            <User size={14} />
            我的模板
            {userTemplates.length > 0 && (
              <span className="tab-count">{userTemplates.length}</span>
            )}
          </button>
          <button
            className={`template-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Sparkles size={14} />
            系统模板
            {systemTemplates.length > 0 && (
              <span className="tab-count">{systemTemplates.length}</span>
            )}
          </button>
        </div>

        {/* 模板列表 */}
        <div className="template-list">
          {activeTab === 'user' ? (
            filteredUserTemplates.length > 0 ? (
              filteredUserTemplates.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  isSelected={template.id === currentTemplateId}
                  onSelect={handleSelect}
                />
              ))
            ) : (
              <div className="template-empty">
                {searchQuery ? '未找到匹配的模板' : '暂无我的模板'}
              </div>
            )
          ) : (
            filteredSystemTemplates.length > 0 ? (
              filteredSystemTemplates.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  isSelected={template.id === currentTemplateId}
                  onSelect={handleSelect}
                />
              ))
            ) : (
              <div className="template-empty">
                {searchQuery ? '未找到匹配的模板' : '暂无系统模板'}
              </div>
            )
          )}
        </div>
      </motion.div>
    </>
  );
}

// 单个模板项
function TemplateItem({ template, isSelected, onSelect }) {
  return (
    <motion.button
      className={`template-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(template)}
      whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="template-item-content">
        <div className="template-name">{template.name || '未命名模板'}</div>
        {template.description && (
          <div className="template-description">{template.description}</div>
        )}
        {template.tags && template.tags.length > 0 && (
          <div className="template-tags">
            {template.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="template-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      {isSelected && (
        <div className="template-selected-icon">
          <Check size={14} />
        </div>
      )}
    </motion.button>
  );
}

export default TemplateSelector;
