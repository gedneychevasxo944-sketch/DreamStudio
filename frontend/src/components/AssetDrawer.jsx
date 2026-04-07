import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Image, FileText, Video, Copy, Download, RotateCcw, MapPin, Check, Clock, AlertTriangle } from 'lucide-react';
import './AssetDrawer.css';

// 模拟资产数据 - 实际使用时替换为API数据
const mockAssets = {
  '编剧': {
    nodeId: 'node_1',
    nodeName: '编剧',
    currentVersion: 'v3-r2',
    currentContent: '第三幕结尾需要修改，增加开放式结局...',
    history: [
      { version: 'v3-r2', type: '修订版', time: '10分钟前', status: 'current', content: '第三幕结尾需要修改，增加开放式结局...' },
      { version: 'v3-r1', type: '修订版', time: '30分钟前', status: 'history', content: '修改了第二幕的对白风格...' },
      { version: 'v3', type: '运行版', time: '1小时前', status: 'history', content: '初始生成版本，包含完整三幕结构...' },
      { version: 'v2', type: '运行版', time: '2小时前', status: 'history', content: '重新生成，调整了主角动机...' },
      { version: 'v1', type: '运行版', time: '3小时前', status: 'history', content: '初稿版本...' },
    ],
    assetType: 'script'
  },
  '美术': {
    nodeId: 'node_2',
    nodeName: '概念美术',
    currentVersion: 'v2',
    currentContent: 'cyberpunk_style_v2.png',
    history: [
      { version: 'v2', type: '运行版', time: '1小时前', status: 'current', content: 'cyberpunk_style_v2.png', imageUrl: 'https://picsum.photos/seed/cyber/400/300' },
      { version: 'v1', type: '运行版', time: '2小时前', status: 'history', content: 'cyberpunk_style_v1.png', imageUrl: 'https://picsum.photos/seed/cyber1/400/300' },
    ],
    assetType: 'image'
  },
  '分镜': {
    nodeId: 'node_3',
    nodeName: '分镜导演',
    currentVersion: 'v1',
    currentContent: 'storyboard_v1.pdf',
    history: [
      { version: 'v1', type: '运行版', time: '30分钟前', status: 'current', content: 'storyboard_v1.pdf' },
    ],
    assetType: 'document'
  },
  '视频': {
    nodeId: 'node_4',
    nodeName: '视频生成',
    currentVersion: 'v1',
    currentContent: 'final_output.mp4',
    history: [
      { version: 'v1', type: '运行版', time: '15分钟前', status: 'current', content: 'final_output.mp4', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    assetType: 'video'
  }
};

const AssetDrawer = ({
  isOpen,
  onClose,
  viewMode: initialViewMode = 'current', // 'current' | 'history'
  onLocateNode,
  onRestoreVersion
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleLocate = (nodeId) => {
    if (onLocateNode) {
      onLocateNode(nodeId);
    }
  };

  const handleRestore = (nodeKey, version) => {
    if (onRestoreVersion) {
      onRestoreVersion(nodeKey, version);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // 实际项目中可以用Toast提示
  };

  const getAssetIcon = (assetType) => {
    switch (assetType) {
      case 'image': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'script': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            className="asset-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 抽屉主体 */}
          <motion.div
            className="asset-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* 抽屉头部 */}
            <div className="drawer-header">
              <div className="drawer-title">
                <h3>项目资产</h3>
                <span className="asset-count">{Object.keys(mockAssets).length} 个节点</span>
              </div>
              <button className="drawer-close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* 视图切换 */}
            <div className="drawer-view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'current' ? 'active' : ''}`}
                onClick={() => setViewMode('current')}
              >
                当前生效
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'history' ? 'active' : ''}`}
                onClick={() => setViewMode('history')}
              >
                历史版本
              </button>
            </div>

            {/* 资产列表 */}
            <div className="drawer-content">
              {viewMode === 'current' ? (
                // 当前生效资产视图
                <div className="current-assets-list">
                  {Object.entries(mockAssets).map(([key, asset]) => (
                    <div key={key} className="asset-card current">
                      <div className="asset-card-header">
                        <div className="asset-type-icon">
                          {getAssetIcon(asset.assetType)}
                        </div>
                        <div className="asset-node-info">
                          <span className="asset-node-name">{asset.nodeName}</span>
                          <span className="asset-version-badge">{asset.currentVersion}</span>
                        </div>
                        <button
                          className="locate-btn"
                          onClick={() => handleLocate(asset.nodeId)}
                          title="定位到节点"
                        >
                          <MapPin size={14} />
                        </button>
                      </div>

                      <div className="asset-card-content">
                        {asset.assetType === 'image' ? (
                          <div className="asset-preview image-preview">
                            <img src={asset.history[0].imageUrl} alt={asset.nodeName} />
                          </div>
                        ) : asset.assetType === 'video' ? (
                          <div className="asset-preview video-preview">
                            <video src={asset.history[0].videoUrl} />
                            <div className="video-duration">0:45</div>
                          </div>
                        ) : (
                          <div className="asset-preview text-preview">
                            <p>{asset.currentContent}</p>
                          </div>
                        )}
                      </div>

                      <div className="asset-card-actions">
                        {asset.assetType === 'script' && (
                          <button
                            className="asset-action-btn"
                            onClick={() => copyToClipboard(asset.currentContent)}
                            title="复制文本"
                          >
                            <Copy size={14} />
                            复制
                          </button>
                        )}
                        <button className="asset-action-btn" title="下载">
                          <Download size={14} />
                          下载
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // 历史版本视图
                <div className="history-assets-list">
                  {Object.entries(mockAssets).map(([key, asset]) => (
                    <div key={key} className="asset-group">
                      <div className="asset-group-header">
                        <div className="asset-type-icon">
                          {getAssetIcon(asset.assetType)}
                        </div>
                        <span className="asset-group-name">{asset.nodeName}</span>
                        <span className="asset-group-count">{asset.history.length} 个版本</span>
                      </div>

                      <div className="asset-history-items">
                        {asset.history.map((item, idx) => (
                          <div
                            key={item.version}
                            className={`history-item ${item.status === 'current' ? 'current' : ''}`}
                          >
                            <div className="history-item-left">
                              <div className={`history-status-indicator ${item.status}`}>
                                {item.status === 'current' && <Check size={12} />}
                              </div>
                              <div className="history-version-info">
                                <span className="history-version">{item.version}</span>
                                <span className="history-type">{item.type}</span>
                              </div>
                            </div>

                            <div className="history-item-center">
                              {item.status === 'current' ? (
                                <span className="current-badge">当前</span>
                              ) : (
                                <span className="history-time">
                                  <Clock size={10} />
                                  {item.time}
                                </span>
                              )}
                            </div>

                            <div className="history-item-right">
                              {item.status !== 'current' && (
                                <button
                                  className="restore-btn"
                                  onClick={() => handleRestore(key, item)}
                                  title="恢复为此版本"
                                >
                                  <RotateCcw size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssetDrawer;
