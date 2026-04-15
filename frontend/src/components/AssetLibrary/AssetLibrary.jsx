import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Image, Users, FileText, Video, GripVertical, Copy, ChevronDown, ChevronLeft, Layers } from 'lucide-react';
import './AssetLibrary.css';

/** @type {Record<string, string>} */
const ASSET_TYPES = {
  CHARACTER: 'character',
  SCENE: 'scene',
  PROP: 'prop',
  VIDEO: 'video',
  SCRIPT: 'script',
};

/** @type {Record<string, string>} */
const LAYER_TYPES = {
  CONVERSATION: 'conversation',
  STORYBOARD: 'storyboard',
  WORKFLOW: 'workflow',
};

/** @type {Record<string, React.ComponentType<{size?: number}>>} */
const ASSET_ICON_MAP = {
  [ASSET_TYPES.CHARACTER]: Users,
  [ASSET_TYPES.SCENE]: Image,
  [ASSET_TYPES.PROP]: Layers,
  [ASSET_TYPES.VIDEO]: Video,
  [ASSET_TYPES.SCRIPT]: FileText,
};

/** @type {Array<{key: string, label: string, icon: React.ComponentType<{size?: number}> | null}>} */
const CATEGORY_TABS = [
  { key: 'all', label: '全部', icon: null },
  { key: ASSET_TYPES.CHARACTER, label: '角色', icon: Users },
  { key: ASSET_TYPES.SCENE, label: '场景', icon: Image },
  { key: ASSET_TYPES.PROP, label: '道具', icon: Layers },
  { key: ASSET_TYPES.VIDEO, label: '视频', icon: Video },
  { key: ASSET_TYPES.SCRIPT, label: '剧本', icon: FileText },
];

/** @type {Array<{key: string, label: string}>} */
const LAYER_TABS = [
  { key: 'all', label: '全部' },
  { key: LAYER_TYPES.CONVERSATION, label: '对话' },
  { key: LAYER_TYPES.STORYBOARD, label: '故事板' },
  { key: LAYER_TYPES.WORKFLOW, label: '工作流' },
];

/**
 * @param {string} createTime
 * @returns {string}
 */
const formatTimeDiff = (createTime) => {
  const now = new Date();
  const create = new Date(createTime);
  const diffMs = now - create;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return create.toLocaleDateString('zh-CN');
};

/**
 * @type {Record<string, {id: string, name: string}[]>}
 */
const MOCK_ASSETS = [
  {
    id: 'asset-001',
    name: '红发女黑客',
    type: ASSET_TYPES.CHARACTER,
    content: '红发女黑客，霓虹灯光下身穿战术外套，眼神坚定',
    thumbnail: 'https://picsum.photos/seed/cyberchar1/400/300',
    createTime: new Date(Date.now() - 10 * 60000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.CONVERSATION,
      originLayerId: 'conv-001',
      originLayerName: '第1集：潜入',
      lineage: {
        conversation: { id: 'conv-001', name: '第1集：潜入' },
        storyboard: { id: 'sb-001', name: '追逐场景A' },
        workflow: {
          id: 'wf-001',
          name: '角色生成工作流',
          graph: {
            nodes: [
              { id: 'node-001', name: '角色生成#1', type: 'characterGenerator' },
              { id: 'node-002', name: '角色优化#1', type: 'characterOptimizer' }
            ],
            edges: [
              { from: 'node-001', to: 'node-002' }
            ]
          }
        }
      }
    }
  },
  {
    id: 'asset-002',
    name: '数据中心办公室',
    type: ASSET_TYPES.SCENE,
    content: '高科技数据中心，满墙服务器，蓝色LED灯光，窗外霓虹夜景',
    thumbnail: 'https://picsum.photos/seed/datacenter1/400/300',
    createTime: new Date(Date.now() - 30 * 60000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.STORYBOARD,
      originLayerId: 'sb-002',
      originLayerName: '潜入准备',
      lineage: {
        conversation: { id: 'conv-002', name: '第2集' },
        storyboard: { id: 'sb-002', name: '潜入准备' },
        workflow: {
          id: 'wf-002',
          name: '场景生成工作流',
          graph: {
            nodes: [
              { id: 'node-003', name: '场景生成#1', type: 'sceneGenerator' }
            ],
            edges: []
          }
        }
      }
    }
  },
  {
    id: 'asset-003',
    name: '服务器终端',
    type: ASSET_TYPES.PROP,
    content: '复古CRT显示器风格的终端，绿色字符滚动，显示入侵警告',
    thumbnail: 'https://picsum.photos/seed/terminal1/400/300',
    createTime: new Date(Date.now() - 60 * 60000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.WORKFLOW,
      originLayerId: 'wf-003',
      originLayerName: '道具生成工作流',
      lineage: {
        conversation: null,
        storyboard: null,
        workflow: {
          id: 'wf-003',
          name: '道具生成工作流',
          graph: {
            nodes: [
              { id: 'node-004', name: '道具生成#1', type: 'propGenerator' }
            ],
            edges: []
          }
        }
      }
    }
  },
  {
    id: 'asset-004',
    name: '第1集：潜入开始',
    type: ASSET_TYPES.SCRIPT,
    content: '红发女黑客潜入数据中心，目标是三层加密的财务数据库...',
    thumbnail: null,
    createTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.CONVERSATION,
      originLayerId: 'conv-001',
      originLayerName: '第1集：潜入',
      lineage: {
        conversation: { id: 'conv-001', name: '第1集：潜入' },
        storyboard: null,
        workflow: {
          id: 'wf-004',
          name: '编剧工作流',
          graph: {
            nodes: [
              { id: 'node-005', name: '编剧#1', type: 'writer' }
            ],
            edges: []
          }
        }
      }
    }
  },
  {
    id: 'asset-005',
    name: '追逐场景A',
    type: ASSET_TYPES.VIDEO,
    content: '红发女在走廊奔跑，安保在后面追赶，镜头跟随视角',
    thumbnail: 'https://picsum.photos/seed/chase1/400/300',
    createTime: new Date(Date.now() - 3 * 3600000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.STORYBOARD,
      originLayerId: 'sb-001',
      originLayerName: '追逐场景A',
      lineage: {
        conversation: { id: 'conv-001', name: '第1集：潜入' },
        storyboard: { id: 'sb-001', name: '追逐场景A' },
        workflow: {
          id: 'wf-005',
          name: '视频生成工作流',
          graph: {
            nodes: [
              { id: 'node-006', name: '分镜#1', type: 'director' },
              { id: 'node-007', name: '视频生成#1', type: 'videoGenerator' }
            ],
            edges: [
              { from: 'node-006', to: 'node-007' }
            ]
          }
        }
      }
    }
  },
  {
    id: 'asset-006',
    name: '安保人员A',
    type: ASSET_TYPES.CHARACTER,
    content: '身穿黑色制服的安保人员，手持电击棍，表情严肃',
    thumbnail: 'https://picsum.photos/seed/guard1/400/300',
    createTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.CONVERSATION,
      originLayerId: 'conv-001',
      originLayerName: '第1集：潜入',
      lineage: {
        conversation: { id: 'conv-001', name: '第1集：潜入' },
        storyboard: { id: 'sb-001', name: '追逐场景A' },
        workflow: {
          id: 'wf-001',
          name: '角色生成工作流',
          graph: {
            nodes: [
              { id: 'node-001', name: '角色生成#1', type: 'characterGenerator' },
              { id: 'node-002', name: '角色优化#1', type: 'characterOptimizer' }
            ],
            edges: [
              { from: 'node-001', to: 'node-002' }
            ]
          }
        }
      }
    }
  },
  {
    id: 'asset-007',
    name: '霓虹雨夜街道',
    type: ASSET_TYPES.SCENE,
    content: '赛博朋克风格雨夜街道，霓虹灯牌倒映在积水，远处摩天楼',
    thumbnail: 'https://picsum.photos/seed/neonstreet/400/300',
    createTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.STORYBOARD,
      originLayerId: 'sb-003',
      originLayerName: '城市夜景',
      lineage: {
        conversation: { id: 'conv-003', name: '外景规划' },
        storyboard: { id: 'sb-003', name: '城市夜景' },
        workflow: {
          id: 'wf-006',
          name: '场景生成工作流',
          graph: {
            nodes: [
              { id: 'node-008', name: '场景生成#2', type: 'sceneGenerator' }
            ],
            edges: []
          }
        }
      }
    }
  },
  {
    id: 'asset-008',
    name: '城市追车片段',
    type: ASSET_TYPES.VIDEO,
    content: '摩托车在城市街道疾驰，无人机追踪，镜头环绕旋转',
    thumbnail: 'https://picsum.photos/seed/chase2/400/300',
    createTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    source: {
      originLayer: LAYER_TYPES.STORYBOARD,
      originLayerId: 'sb-004',
      originLayerName: '追车片段B',
      lineage: {
        conversation: { id: 'conv-002', name: '第2集' },
        storyboard: { id: 'sb-004', name: '追车片段B' },
        workflow: {
          id: 'wf-007',
          name: '视频生成工作流',
          graph: {
            nodes: [
              { id: 'node-009', name: '分镜#2', type: 'director' },
              { id: 'node-010', name: '视频生成#2', type: 'videoGenerator' }
            ],
            edges: [
              { from: 'node-009', to: 'node-010' }
            ]
          }
        }
      }
    }
  },
];

/**
 * 资产卡片组件
 * @param {{ asset: typeof MOCK_ASSETS[0], onClick: (asset: typeof MOCK_ASSETS[0]) => void }} props
 */
const AssetCard = ({ asset, onClick }) => {
  const Icon = ASSET_ICON_MAP[asset.type] || FileText;
  const lineage = asset.source.lineage;

  const getLineageText = () => {
    const parts = [];
    if (lineage.storyboard) {
      parts.push(`🎬 ${lineage.storyboard.name}`);
    }
    if (lineage.workflow) {
      const nodeCount = lineage.workflow.graph.nodes.length;
      parts.push(`⚡ ${lineage.workflow.name}(${nodeCount}节点)`);
    }
    return parts.join(' → ');
  };

  const getSourceText = () => {
    const origin = asset.source;
    if (origin.originLayer === LAYER_TYPES.CONVERSATION) {
      return `对话「${origin.originLayerName}」`;
    }
    if (origin.originLayer === LAYER_TYPES.STORYBOARD) {
      return `故事板「${origin.originLayerName}」`;
    }
    if (origin.originLayer === LAYER_TYPES.WORKFLOW) {
      return `工作流「${origin.originLayerName}」`;
    }
    return '未知来源';
  };

  return (
    <motion.div
      className="asset-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(asset)}
    >
      <div className="asset-card-header">
        <div className="asset-type-icon">
          <Icon size={14} />
          <span className="asset-type-label">{asset.type}</span>
        </div>
        <span className="asset-time">{formatTimeDiff(asset.createTime)}</span>
      </div>

      <div className="asset-card-name">{asset.name}</div>

      <div className="asset-source">来自：{getSourceText()}</div>

      {getLineageText() && (
        <div className="asset-lineage">{getLineageText()}</div>
      )}

      <div className="asset-card-preview">
        {asset.thumbnail ? (
          <img src={asset.thumbnail} alt={asset.name} />
        ) : (
          <div className="asset-preview-text">
            <FileText size={20} />
            <span>文本内容</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * @param {{ asset: typeof MOCK_ASSETS[0], onClose: () => void, onJump: (layer: string, id: string) => void, onCopy: (text: string) => void }} props
 */
const AssetDetail = ({ asset, onClose, onJump, onCopy }) => {
  if (!asset) return null;

  const Icon = ASSET_ICON_MAP[asset.type] || FileText;
  const lineage = asset.source.lineage;

  return (
    <motion.div
      className="asset-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="asset-detail-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-header">
          <button className="detail-back-btn" onClick={onClose}>
            <ChevronLeft size={18} />
          </button>
          <div className="detail-title">
            <Icon size={18} />
            <span>{asset.name}</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-label">类型</span>
              <span className="detail-value">{asset.type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">创建时间</span>
              <span className="detail-value">
                {new Date(asset.createTime).toLocaleString('zh-CN')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">来源</span>
              <span className="detail-value">
                {asset.source.originLayer === LAYER_TYPES.CONVERSATION && `对话「${asset.source.originLayerName}」`}
                {asset.source.originLayer === LAYER_TYPES.STORYBOARD && `故事板「${asset.source.originLayerName}」`}
                {asset.source.originLayer === LAYER_TYPES.WORKFLOW && `工作流「${asset.source.originLayerName}」`}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <div className="section-title">血缘链路</div>
            <div className="lineage-chain">
              {lineage.conversation && (
                <div className="lineage-item" onClick={() => onJump('conversation', lineage.conversation.id)}>
                  <span className="lineage-icon">💬</span>
                  <span className="lineage-name">{lineage.conversation.name}</span>
                </div>
              )}
              {lineage.conversation && lineage.storyboard && (
                <ChevronRight size={14} className="lineage-arrow" />
              )}
              {lineage.storyboard && (
                <div className="lineage-item" onClick={() => onJump('storyboard', lineage.storyboard.id)}>
                  <span className="lineage-icon">🎬</span>
                  <span className="lineage-name">{lineage.storyboard.name}</span>
                </div>
              )}
              {(lineage.conversation || lineage.storyboard) && lineage.workflow && (
                <ChevronRight size={14} className="lineage-arrow" />
              )}
              {lineage.workflow && (
                <div className="lineage-item" onClick={() => onJump('workflow', lineage.workflow.id)}>
                  <span className="lineage-icon">⚡</span>
                  <span className="lineage-name">{lineage.workflow.name}</span>
                </div>
              )}
            </div>
          </div>

          {lineage.workflow && (
            <div className="detail-section">
              <div className="section-title">工作流</div>
              <div className="workflow-preview">
                <div className="workflow-name">{lineage.workflow.name}</div>
                <div className="workflow-graph">
                  <div className="graph-nodes">
                    {lineage.workflow.graph.nodes.map((node) => (
                      <div key={node.id} className="graph-node">
                        {node.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="detail-section">
            <div className="section-title">内容</div>
            {asset.thumbnail ? (
              <div className="detail-preview-image">
                <img src={asset.thumbnail} alt={asset.name} />
              </div>
            ) : (
              <div className="detail-preview-text">
                {asset.content}
              </div>
            )}
          </div>
        </div>

        <div className="detail-footer">
          <button className="detail-action-btn" onClick={() => onCopy(asset.content)}>
            <Copy size={14} />
            复制内容
          </button>
          {lineage.workflow && (
            <button className="detail-action-btn primary" onClick={() => onJump('workflow', lineage.workflow.id)}>
              <ChevronRight size={14} />
              查看工作流
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onAssetSelect?: (asset: typeof MOCK_ASSETS[0]) => void,
 *   onAssetDrag?: (asset: typeof MOCK_ASSETS[0]) => void,
 *   onJump?: (layer: string, id: string) => void,
 *   title?: string,
 *   width?: number,
 *   assets?: typeof MOCK_ASSETS
 * }} props
 */
const AssetLibrary = ({
  isOpen,
  onClose,
  onAssetSelect,
  onAssetDrag,
  onJump,
  title = '资产库',
  width = 320,
  assets: externalAssets = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const assets = externalAssets || MOCK_ASSETS;

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
    const matchesLayer = selectedLayer === 'all' || asset.source.originLayer === selectedLayer;
    return matchesSearch && matchesCategory && matchesLayer;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) =>
    new Date(b.createTime) - new Date(a.createTime)
  );

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setShowDetail(true);
    onAssetSelect?.(asset);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
  };

  const handleJump = (layer, id) => {
    onJump?.(layer, id);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'asset',
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      thumbnailUrl: asset.thumbnail,
      content: asset.content,
    }));
    e.dataTransfer.effectAllowed = 'copy';
    onAssetDrag?.(asset);
  };

  const getCategoryCount = (key) => {
    if (key === 'all') return assets.length;
    return assets.filter(a => a.type === key).length;
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.aside
        className="asset-library"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: width, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ width }}
      >
        <div className="asset-library-header">
          <h3 className="asset-library-title">{title}</h3>
          <button className="asset-library-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

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

        <div className="asset-library-layer-tabs">
          {LAYER_TABS.map(tab => (
            <button
              key={tab.key}
              className={`layer-tab-btn ${selectedLayer === tab.key ? 'active' : ''}`}
              onClick={() => setSelectedLayer(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="asset-library-tabs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${selectedCategory === tab.key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(tab.key)}
            >
              {tab.icon && <tab.icon size={12} />}
              <span>{tab.label}</span>
              <span className="tab-count">{getCategoryCount(tab.key)}</span>
            </button>
          ))}
        </div>

        <div className="asset-library-content">
          {sortedAssets.length === 0 ? (
            <div className="asset-empty">
              <Search size={24} />
              <p>没有找到匹配的资产</p>
            </div>
          ) : (
            <div className="asset-list">
              {sortedAssets.map((asset) => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                >
                  <AssetCard asset={asset} onClick={handleAssetClick} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="asset-library-footer">
          <div className="drag-hint">
            <GripVertical size={12} />
            <span>拖拽资产到编辑区</span>
          </div>
        </div>
      </motion.aside>

      <AnimatePresence>
        {showDetail && selectedAsset && (
          <AssetDetail
            asset={selectedAsset}
            onClose={handleCloseDetail}
            onJump={handleJump}
            onCopy={handleCopy}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AssetLibrary;
