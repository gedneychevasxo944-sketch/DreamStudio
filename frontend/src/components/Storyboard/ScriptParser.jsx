import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight, User, MapPin, Package, Sparkles, Loader2 } from 'lucide-react';
import './ScriptParser.css';

/**
 * ScriptParser - 剧本解析结果显示组件
 *
 * Props:
 * - isOpen: 是否显示解析结果
 * - parseResult: 解析结果数据
 * - onConfirm: 确认并导入到故事板
 * - onCancel: 取消
 * - onRetry: 重试解析
 */
function ScriptParser({
  isOpen,
  parseResult,
  onConfirm,
  onCancel,
  onRetry,
}) {
  const [selectedItems, setSelectedItems] = useState({
    characters: {},
    scenes: {},
    props: {},
  });
  const [isImporting, setIsImporting] = useState(false);

  // 解析结果变化时，默认全选
  useEffect(() => {
    if (parseResult) {
      setSelectedItems({
        characters: (parseResult.characters || []).reduce((acc, c) => { acc[c.id] = true; return acc; }, {}),
        scenes: (parseResult.scenes || []).reduce((acc, s) => { acc[s.id] = true; return acc; }, {}),
        props: (parseResult.props || []).reduce((acc, p) => { acc[p.id] = true; return acc; }, {}),
      });
    }
  }, [parseResult]);

  // 切换选中状态
  const toggleItem = (category, id) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [id]: !prev[category][id],
      },
    }));
  };

  // 全选/取消全选
  const toggleAll = (category) => {
    const items = parseResult?.[category] || [];
    const allSelected = items.every(item => selectedItems[category][item.id]);
    setSelectedItems(prev => ({
      ...prev,
      [category]: items.reduce((acc, item) => {
        acc[item.id] = !allSelected;
        return acc;
      }, {}),
    }));
  };

  // 获取选中数量
  const getSelectedCount = (category) => {
    return Object.values(selectedItems[category] || {}).filter(Boolean).length;
  };

  // 处理确认导入
  const handleConfirm = async () => {
    setIsImporting(true);
    try {
      // 构建导入数据
      const importData = {
        characters: (parseResult?.characters || [])
          .filter(c => selectedItems.characters[c.id])
          .map(c => ({ name: c.name, description: c.description, generatePrompt: c.generatePrompt })),
        scenes: (parseResult?.scenes || [])
          .filter(s => selectedItems.scenes[s.id])
          .map(s => ({ name: s.name, description: s.description, generatePrompt: s.generatePrompt })),
        props: (parseResult?.props || [])
          .filter(p => selectedItems.props[p.id])
          .map(p => ({ name: p.name, description: p.description, generatePrompt: p.generatePrompt })),
      };
      await onConfirm?.(importData);
    } finally {
      setIsImporting(false);
    }
  };

  // 计算选中总数
  const totalSelected =
    getSelectedCount('characters') +
    getSelectedCount('scenes') +
    getSelectedCount('props');

  if (!isOpen || !parseResult) return null;

  const categories = [
    { key: 'characters', label: '角色', icon: User, color: '#667eea' },
    { key: 'scenes', label: '场景', icon: MapPin, color: '#06b6d4' },
    { key: 'props', label: '道具', icon: Package, color: '#f59e0b' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="script-parser-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="script-parser-modal"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="script-parser-header">
            <div className="header-title">
              <Sparkles size={20} className="sparkle-icon" />
              <h2>AI 解析结果</h2>
            </div>
            <p className="header-subtitle">
              剧本已解析，识别出以下角色、场景和道具。请勾选要导入到故事板的内容。
            </p>
          </div>

          {/* 内容区 */}
          <div className="script-parser-content">
            {categories.map(({ key, label, icon: Icon, color }) => {
              const items = parseResult[key] || [];
              if (items.length === 0) return null;

              return (
                <div key={key} className="parse-category">
                  <div className="category-header">
                    <div className={`category-title ${key}`}>
                      <div className="icon-wrapper">
                        <Icon size={14} />
                      </div>
                      <span>{label}</span>
                      <span className="category-count">({items.length})</span>
                    </div>
                    <button
                      className="select-all-btn"
                      onClick={() => toggleAll(key)}
                    >
                      {items.every(item => selectedItems[key]?.[item.id])
                        ? '取消全选'
                        : '全选'}
                    </button>
                  </div>

                  <div className="category-items">
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        className={`parse-item ${selectedItems[key]?.[item.id] ? 'selected' : ''}`}
                        style={{
                          '--item-color': color,
                          borderColor: selectedItems[key]?.[item.id] ? color : 'transparent',
                        }}
                        onClick={() => toggleItem(key, item.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`item-checkbox ${selectedItems[key]?.[item.id] ? 'checked' : ''}`}>
                          <Check size={14} />
                        </div>
                        <div className="item-content">
                          <span className="item-name">{item.name}</span>
                          {item.description && (
                            <span className="item-desc">{item.description}</span>
                          )}
                        </div>
                        <ChevronRight size={16} className="item-arrow" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}

            {parseResult.characters?.length === 0 &&
              parseResult.scenes?.length === 0 &&
              parseResult.props?.length === 0 && (
                <div className="empty-result">
                  <div className="empty-result-icon">📭</div>
                  <p>未能从剧本中识别出角色、场景或道具</p>
                  <p className="empty-hint">请尝试手动创建或重新上传剧本</p>
                </div>
              )}
          </div>

          {/* 底部操作 */}
          <div className="script-parser-footer">
            <button className="parser-btn secondary" onClick={onRetry}>
              <Loader2 size={16} />
              重新解析
            </button>
            <div className="footer-right">
              <button className="parser-btn secondary" onClick={onCancel}>
                取消
              </button>
              <button
                className="parser-btn primary"
                onClick={handleConfirm}
                disabled={totalSelected === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    导入选中 ({totalSelected})
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ScriptParser;
