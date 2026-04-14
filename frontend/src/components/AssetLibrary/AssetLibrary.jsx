import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Star, Image, Users, FileText, Video, GripVertical, Check, AlertCircle } from 'lucide-react';
import './AssetLibrary.css';

/**
 * AssetLibrary - 可复用的资产库侧边栏
 *
 * 功能：
 * - 搜索资产
 * - 分类展示（场景、角色卡等）
 * - 拖拽到外部编辑区
 * - 自动关联提示
 */
const AssetLibrary = ({
  isOpen,
  onClose,
  onAssetSelect,
  onAssetDrag,
  currentEditingContext = null, // 当前编辑上下文，用于关联提示
  title = '资产库',
  width = 320,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAssociationHint, setShowAssociationHint] = useState(false);

  // 模拟资产数据
  const [assets] = useState([
    // 场景
    { id: 'scene-1', name: '数据中心办公室', type: 'scene', thumbnail: 'https://picsum.photos/seed/datacenter2/300/200', source: 'A', favorite: true },
    { id: 'scene-2', name: '霓虹雨夜街道', type: 'scene', thumbnail: 'https://picsum.photos/seed/neonstreet2/300/200', source: 'B', favorite: false },
    { id: 'scene-3', name: '地下停车场', type: 'scene', thumbnail: 'https://picsum.photos/seed/parking2/300/200', source: 'A', favorite: false },
    { id: 'scene-4', name: '城市天际线', type: 'scene', thumbnail: 'https://picsum.photos/seed/skyline/300/200', source: 'C', favorite: true },
    // 角色
    { id: 'char-1', name: '红发女黑客', type: 'character', thumbnail: 'https://picsum.photos/seed/cyberchar2/200/200', source: '当前项目', favorite: true, consistencyId: 'char-001' },
    { id: 'char-2', name: '安保人员A', type: 'character', thumbnail: 'https://picsum.photos/seed/guard2/200/200', source: '当前项目', favorite: false, consistencyId: 'char-002' },
    { id: 'char-3', name: 'AI管理员', type: 'character', thumbnail: 'https://picsum.photos/seed/aiadmin/200/200', source: '当前项目', favorite: true, consistencyId: 'char-003' },
    { id: 'char-4', name: '反派大佬', type: 'character', thumbnail: 'https://picsum.photos/seed/villain/200/200', source: '库', favorite: false },
    // 道具
    { id: 'prop-1', name: '服务器终端', type: 'prop', thumbnail: 'https://picsum.photos/seed/terminal2/200/150', source: '当前项目', favorite: false },
    { id: 'prop-2', name: '黑客设备', type: 'prop', thumbnail: 'https://picsum.photos/seed/hackdevice/200/150', source: '库', favorite: false },
  ]);

  // 过滤资产
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 按类型分组
  const scenes = filteredAssets.filter(a => a.type === 'scene');
  const characters = filteredAssets.filter(a => a.type === 'character');
  const props = filteredAssets.filter(a => a.type === 'prop');

  // 类别统计
  const categoryStats = {
    all: assets.length,
    scene: assets.filter(a => a.type === 'scene').length,
    character: assets.filter(a => a.type === 'character').length,
    prop: assets.filter(a => a.type === 'prop').length,
  };

  // 处理资产选择
  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    if (onAssetSelect) {
      onAssetSelect(asset);
    }
  };

  // 处理拖拽开始
  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'asset',
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      thumbnailUrl: asset.thumbnail,
      consistencyId: asset.consistencyId,
    }));
    e.dataTransfer.effectAllowed = 'copy';

    if (onAssetDrag) {
      onAssetDrag(asset);
    }
  };

  // 处理关联确认
  const handleConfirmAssociation = () => {
    if (selectedAsset && currentEditingContext) {
      // 触发关联逻辑
      setShowAssociationHint(false);
      setSelectedAsset(null);
    }
  };

  // 显示关联提示
  useEffect(() => {
    if (selectedAsset && selectedAsset.consistencyId && currentEditingContext) {
      setShowAssociationHint(true);
    }
  }, [selectedAsset, currentEditingContext]);

  if (!isOpen) return null;

  return (
    <motion.aside
      className="asset-library"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ width }}
    >
      {/* 头部 */}
      <div className="asset-library-header">
        <h3 className="asset-library-title">{title}</h3>
        <button className="asset-library-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* 搜索框 */}
      <div className="asset-library-search">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="搜索资产..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* 类别切换 */}
      <div className="asset-library-tabs">
        <button
          className={`tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          全部 <span className="tab-count">{categoryStats.all}</span>
        </button>
        <button
          className={`tab-btn ${selectedCategory === 'scene' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('scene')}
        >
          <Image size={12} /> 场景 <span className="tab-count">{categoryStats.scene}</span>
        </button>
        <button
          className={`tab-btn ${selectedCategory === 'character' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('character')}
        >
          <Users size={12} /> 角色 <span className="tab-count">{categoryStats.character}</span>
        </button>
        <button
          className={`tab-btn ${selectedCategory === 'prop' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('prop')}
        >
          <FileText size={12} /> 道具 <span className="tab-count">{categoryStats.prop}</span>
        </button>
      </div>

      {/* 资产列表 */}
      <div className="asset-library-content">
        {/* 场景区域 */}
        {(selectedCategory === 'all' || selectedCategory === 'scene') && scenes.length > 0 && (
          <div className="asset-section">
            <div className="asset-section-header">
              <Image size={12} />
              <span>场景</span>
            </div>
            <div className="asset-grid">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={`asset-item ${selectedAsset?.id === scene.id ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, scene)}
                  onClick={() => handleAssetClick(scene)}
                >
                  <div className="asset-thumb">
                    <img src={scene.thumbnail} alt={scene.name} />
                    <div className="asset-source-badge">{scene.source}</div>
                  </div>
                  <div className="asset-name">{scene.name}</div>
                  {scene.favorite && <Star size={10} className="asset-favorite" fill="currentColor" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 角色区域 */}
        {(selectedCategory === 'all' || selectedCategory === 'character') && characters.length > 0 && (
          <div className="asset-section">
            <div className="asset-section-header">
              <Users size={12} />
              <span>我的角色卡</span>
              <span className="section-hint">◀ 当前项目自动关联</span>
            </div>
            <div className="asset-list">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className={`asset-card-horizontal ${selectedAsset?.id === char.id ? 'selected' : ''} ${char.source === '当前项目' ? 'from-current' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, char)}
                  onClick={() => handleAssetClick(char)}
                >
                  <div className="asset-drag-handle">
                    <GripVertical size={12} />
                  </div>
                  <div className="asset-thumb-small">
                    <img src={char.thumbnail} alt={char.name} />
                  </div>
                  <div className="asset-info">
                    <div className="asset-name">{char.name}</div>
                    <div className="asset-meta">
                      {char.source === '当前项目' && <span className="meta-tag current-project">当前项目</span>}
                      {char.favorite && <Star size={10} className="meta-favorite" fill="currentColor" />}
                      <span className="meta-favorite-text">{char.favorite ? '常用' : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 道具区域 */}
        {(selectedCategory === 'all' || selectedCategory === 'prop') && props.length > 0 && (
          <div className="asset-section">
            <div className="asset-section-header">
              <FileText size={12} />
              <span>道具</span>
            </div>
            <div className="asset-grid asset-grid-small">
              {props.map((prop) => (
                <div
                  key={prop.id}
                  className={`asset-item ${selectedAsset?.id === prop.id ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, prop)}
                  onClick={() => handleAssetClick(prop)}
                >
                  <div className="asset-thumb">
                    <img src={prop.thumbnail} alt={prop.name} />
                  </div>
                  <div className="asset-name">{prop.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {filteredAssets.length === 0 && (
          <div className="asset-empty">
            <Search size={24} />
            <p>没有找到匹配的资产</p>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="asset-library-footer">
        {selectedAsset ? (
          <div className="selected-asset-info">
            <span className="selected-label">已选择:</span>
            <span className="selected-name">{selectedAsset.name}</span>
            <button className="use-asset-btn" onClick={() => handleConfirmAssociation()}>
              <Check size={12} />
              使用
            </button>
          </div>
        ) : (
          <div className="drag-hint">
            <GripVertical size={12} />
            <span>拖拽资产到编辑区</span>
          </div>
        )}
      </div>

      {/* 关联提示弹窗 */}
      <AnimatePresence>
        {showAssociationHint && selectedAsset && (
          <motion.div
            className="association-hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="hint-icon">
              <AlertCircle size={16} />
            </div>
            <div className="hint-content">
              <p>是否将"{selectedAsset.name}"的角色一致性ID应用到这个镜头的角色生成？</p>
            </div>
            <div className="hint-actions">
              <button className="hint-btn cancel" onClick={() => setShowAssociationHint(false)}>
                取消
              </button>
              <button className="hint-btn confirm" onClick={handleConfirmAssociation}>
                应用
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

export default AssetLibrary;
