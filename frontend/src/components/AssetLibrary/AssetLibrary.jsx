import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Image, Users, FileText, Video, GripVertical, Copy, ChevronDown, ChevronLeft, Layers, Folder, FolderOpen } from 'lucide-react';
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
const ASSET_TYPE_LABELS = {
  [ASSET_TYPES.CHARACTER]: '角色',
  [ASSET_TYPES.SCENE]: '场景',
  [ASSET_TYPES.PROP]: '道具',
  [ASSET_TYPES.VIDEO]: '视频',
  [ASSET_TYPES.SCRIPT]: '剧本',
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
 * @typedef {Object} Asset
 * @property {string} id
 * @property {string} projectId
 * @property {string} name
 * @property {string} type
 * @property {string} content
 * @property {string|null} thumbnail
 * @property {string} createTime
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} AssetLibraryProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {{ id: string, name: string }} currentProject
 * @property {Project[]} projects
 * @property {(projectId: string) => void} onProjectChange
 * @property {Asset[]} [assets]
 * @property {((asset: Asset) => void)?} onAssetSelect
 * @property {((asset: Asset) => void)?} onAssetDrag
 * @property {((asset: Asset) => void)?} onAssetAddToStoryboard
 */

/**
 * 项目选择器组件
 * @param {{ currentProject: { id: string, name: string }, projects: Project[], onChange: (projectId: string) => void }} props
 */
const ProjectSelector = ({ currentProject, projects, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const otherProjects = projects.filter(p => p.id !== currentProject.id);

  const handleSelect = (projectId) => {
    onChange(projectId);
    setIsOpen(false);
  };

  return (
    <div className="project-selector">
      <div className="project-selector-label">项目:</div>
      <div className="project-selector-dropdown">
        <button
          className="project-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Folder size={14} />
          <span className="project-selector-name">{currentProject.name}</span>
          <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
              <motion.div
                className="project-dropdown-menu"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {/* 当前项目（不可选） */}
                <div className="project-dropdown-item current">
                  <FolderOpen size={14} />
                  <span>{currentProject.name}</span>
                </div>

                {otherProjects.length > 0 && (
                  <>
                    <div className="project-dropdown-divider" />
                    {otherProjects.map(p => (
                      <button
                        key={p.id}
                        className="project-dropdown-item"
                        onClick={() => handleSelect(p.id)}
                      >
                        <Folder size={14} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * 资产卡片组件（精简版）
 * @param {{ asset: Asset, onClick: (asset: Asset) => void }} props
 */
const AssetCard = ({ asset, onClick }) => {
  const Icon = ASSET_ICON_MAP[asset.type] || FileText;

  return (
    <motion.div
      className="asset-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(asset)}
    >
      <div className="asset-card-content">
        <div className="asset-card-info">
          <div className="asset-card-icon">
            <Icon size={14} />
          </div>
          <span className="asset-card-name">{asset.name}</span>
        </div>
        <div className="asset-card-thumb">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt={asset.name} />
          ) : (
            <div className="asset-card-thumb-placeholder">
              <FileText size={16} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 项目分组组件
 * @param {{ project: { id: string, name: string }, assets: Asset[], onAssetClick: (asset: Asset) => void }} props
 */
const ProjectGroup = ({ project, assets, onAssetClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="project-group">
      <button
        className="project-group-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronRight
          size={14}
          className={`project-group-arrow ${isExpanded ? 'expanded' : ''}`}
        />
        <Folder size={14} />
        <span className="project-group-name">{project.name}</span>
        <span className="project-group-count">{assets.length}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="project-group-assets"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {assets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={onAssetClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 资产详情面板（精简版）
 * @param {{ asset: Asset|null, projectName: string, onClose: () => void, onCopy: (text: string) => void, onAddToStoryboard?: (asset: Asset) => void }} props
 */
const AssetDetail = ({ asset, projectName, onClose, onCopy, onAddToStoryboard }) => {
  if (!asset) return null;

  const Icon = ASSET_ICON_MAP[asset.type] || FileText;

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
          {/* 预览 */}
          <div className="detail-preview">
            {asset.thumbnail ? (
              <img src={asset.thumbnail} alt={asset.name} />
            ) : (
              <div className="detail-preview-text">
                <FileText size={32} />
              </div>
            )}
          </div>

          {/* 基本信息 */}
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-label">名称</span>
              <span className="detail-value">{asset.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">类型</span>
              <span className="detail-value">{ASSET_TYPE_LABELS[asset.type] || asset.type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">项目</span>
              <span className="detail-value">{projectName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">创建时间</span>
              <span className="detail-value">{new Date(asset.createTime).toLocaleString('zh-CN')}</span>
            </div>
          </div>

          {/* 内容描述 */}
          <div className="detail-section">
            <div className="section-title">描述</div>
            <div className="detail-description">
              {asset.content}
            </div>
          </div>
        </div>

        <div className="detail-footer">
          <button className="detail-action-btn" onClick={() => onCopy(asset.content)}>
            <Copy size={14} />
            复制内容
          </button>
          {onAddToStoryboard && (
            <button className="detail-action-btn primary" onClick={() => onAddToStoryboard(asset)}>
              <ChevronRight size={14} />
              添加到故事板
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * 资产库主组件
 * @param {AssetLibraryProps} props
 */
const AssetLibrary = ({
  isOpen,
  onClose,
  currentProject,
  projects,
  onProjectChange,
  assets: externalAssets = null,
  onAssetSelect,
  onAssetDrag,
  onAssetAddToStoryboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const allAssets = externalAssets || [];

  // 按项目分组
  const groupedAssets = useMemo(() => {
    const groups = {};
    allAssets.forEach(asset => {
      if (!groups[asset.projectId]) {
        groups[asset.projectId] = [];
      }
      groups[asset.projectId].push(asset);
    });
    return groups;
  }, [allAssets]);

  // 筛选后的资产
  const filteredAssets = useMemo(() => {
    return allAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           asset.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
      // 如果当前项目ID存在且与资产项目ID匹配则筛选，否则显示全部
      const matchesProject = !currentProject.id || asset.projectId === currentProject.id;
      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [allAssets, searchQuery, selectedCategory, currentProject.id]);

  // 检查是否有真实项目数据
  const hasRealProjectData = currentProject.id && projects.some(p => p.id === currentProject.id);

  // 搜索跨所有项目
  const searchedAssets = useMemo(() => {
    if (!searchQuery) return filteredAssets;
    return allAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           asset.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allAssets, searchQuery, selectedCategory, currentProject.id]);

  // 搜索时按项目分组显示
  const displayGroups = useMemo(() => {
    if (!searchQuery) {
      // 非搜索模式
      if (hasRealProjectData) {
        // 有真实项目数据：只显示当前项目的资产
        const currentGroup = filteredAssets.filter(a => a.projectId === currentProject.id);
        if (currentGroup.length === 0) return [];
        return [{
          project: currentProject,
          assets: currentGroup,
        }];
      } else {
        // 没有真实项目数据（demo模式）：显示所有资产按项目分组
        const groups = {};
        allAssets.forEach(asset => {
          const project = projects.find(p => p.id === asset.projectId) || { id: asset.projectId, name: '示例项目' };
          if (!groups[asset.projectId]) {
            groups[asset.projectId] = { project, assets: [] };
          }
          groups[asset.projectId].assets.push(asset);
        });
        return Object.values(groups);
      }
    } else {
      // 搜索模式：跨所有项目
      const groups = {};
      searchedAssets.forEach(asset => {
        const project = projects.find(p => p.id === asset.projectId) || { id: asset.projectId, name: '未知项目' };
        if (!groups[asset.projectId]) {
          groups[asset.projectId] = { project, assets: [] };
        }
        groups[asset.projectId].assets.push(asset);
      });
      return Object.values(groups);
    }
  }, [searchQuery, filteredAssets, searchedAssets, currentProject, projects, hasRealProjectData, allAssets]);

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setShowDetail(true);
    onAssetSelect?.(asset);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
  };

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
  }, []);

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

  const getCategoryCount = useCallback((key) => {
    const assetsToCount = searchQuery ? searchedAssets : filteredAssets;
    if (key === 'all') return assetsToCount.length;
    return assetsToCount.filter(a => a.type === key).length;
  }, [searchQuery, filteredAssets, searchedAssets]);

  const handleProjectChange = (projectId) => {
    onProjectChange(projectId);
    setSelectedCategory('all');
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.aside
        className="asset-library"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 320, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="asset-library-header">
          <h3 className="asset-library-title">资产库</h3>
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

        <ProjectSelector
          currentProject={currentProject}
          projects={projects}
          onChange={handleProjectChange}
        />

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
          {displayGroups.length === 0 ? (
            <div className="asset-empty">
              <Search size={24} />
              <p>没有找到匹配的资产</p>
            </div>
          ) : (
            <div className="asset-tree-view">
              {displayGroups.map(group => (
                <ProjectGroup
                  key={group.project.id}
                  project={group.project}
                  assets={group.assets}
                  onAssetClick={handleAssetClick}
                />
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
            projectName={projects.find(p => p.id === selectedAsset.projectId)?.name || currentProject.name}
            onClose={handleCloseDetail}
            onCopy={handleCopy}
            onAddToStoryboard={onAssetAddToStoryboard}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AssetLibrary;
