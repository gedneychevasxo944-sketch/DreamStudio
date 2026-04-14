import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Image, FileText, Video, Copy, Download, RotateCcw, MapPin, Check, Clock, AlertTriangle } from 'lucide-react';
import { assetApi } from '../services/api';
import { uiLogger } from '../utils/logger';
import './AssetDrawer.css';

const AssetDrawer = ({
  isOpen,
  onClose,
  projectId,
  nodes = [],
  viewMode: initialViewMode = 'current', // 'current' | 'history'
  onLocateNode,
  onRestoreVersion
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedNode, setSelectedNode] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  // 从API加载资产数据
  useEffect(() => {
    if (!isOpen || !projectId) {
      setAssets([]);
      return;
    }

    const loadAssets = async () => {
      setLoading(true);
      try {
        const response = await assetApi.getProjectAssets(projectId, viewMode === 'current');
        if (response.data && response.data.assets) {
          // 转换API数据为组件格式
          const transformedAssets = response.data.assets.map(asset => ({
            key: asset.nodeId,
            nodeId: asset.nodeId,
            nodeName: asset.nodeName,
            currentVersion: `V${asset.versionNo}`,
            currentContent: asset.content || asset.resultText || '已生成',
            history: (asset.versions || []).map(v => ({
              version: `V${v.versionNo}`,
              type: v.versionKind === 'RUN_OUTPUT' ? '运行版' : '修订版',
              time: v.createdAt ? new Date(v.createdAt).toLocaleString('zh-CN') : '未知',
              status: v.isCurrent ? 'current' : 'history',
              content: v.resultText || v.content || '...',
              imageUrl: v.thumbnailUrl
            })),
            assetType: asset.assetType || 'script'
          }));
          setAssets(transformedAssets);
        } else {
          setAssets([]);
        }
      } catch (error) {
        uiLogger.error('[AssetDrawer] Failed to load assets:', error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [isOpen, projectId, viewMode]);

  // 备用：从节点数据生成资产列表（当API返回为空时）
  const generateAssetsFromNodes = () => {
    if (!nodes || nodes.length === 0) {
      return [];
    }

    // 过滤有结果的节点
    return nodes
      .filter(node => {
        const hasResult = node.data?.result ||
                          node.data?.characters?.length > 0 ||
                          node.data?.scenes?.length > 0 ||
                          node.data?.storyboards?.length > 0 ||
                          node.data?.prompts?.length > 0 ||
                          node.data?.videoPreview;
        return hasResult;
      })
      .map(node => {
        // 根据节点类型确定资产类型
        let assetType = 'script';
        if (node.type === 'visual') assetType = 'image';
        else if (node.type === 'director') assetType = 'document';
        else if (node.type === 'videoGen' || node.type === 'videoEditor') assetType = 'video';

        // 获取版本历史
        const versionHistory = node.data?.versionHistory || [];
        const currentVersion = node.data?.currentVersion || 1;
        const displayVersion = node.data?.displayVersion || currentVersion;

        // 构建历史列表
        const history = versionHistory.map((h, idx) => ({
          version: `V${h.version}`,
          type: '运行版',
          time: h.timestamp ? new Date(h.timestamp).toLocaleString('zh-CN') : '未知时间',
          status: h.version === displayVersion ? 'current' : 'history',
          content: h.data?.result || h.data?.characters?.[0]?.description || '...',
          imageUrl: h.data?.characters?.[0]?.thumbnail
        }));

        // 添加当前版本到历史
        history.unshift({
          version: `V${currentVersion}`,
          type: currentVersion > 1 ? '修订版' : '运行版',
          time: '当前版本',
          status: 'current',
          content: node.data?.result || node.data?.characters?.[0]?.description || '...',
          imageUrl: node.data?.characters?.[0]?.thumbnail
        });

        return {
          key: node.id,
          nodeId: node.id,
          nodeName: node.name,
          currentVersion: `V${displayVersion}`,
          currentContent: node.data?.result || '已生成',
          history: history,
          assetType: assetType
        };
      });
  };

  // 当API返回为空时，使用节点数据作为备用
  const displayAssets = assets.length > 0 ? assets : generateAssetsFromNodes();

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
  };

  const getAssetIcon = (assetType) => {
    switch (assetType) {
      case 'image': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'script': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // 拖拽事件处理
  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'asset',
      assetType: asset.assetType,
      assetId: asset.nodeId,
      assetName: asset.nodeName,
      thumbnailUrl: asset.history[0]?.imageUrl || null,
      content: asset.currentContent
    }));
    e.dataTransfer.effectAllowed = 'copy';
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
                <span className="asset-count">{displayAssets.length} 个节点</span>
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
                  {displayAssets.map((asset) => (
                    <div
                      key={asset.key}
                      className="asset-card current"
                      draggable
                      onDragStart={(e) => handleDragStart(e, asset)}
                    >
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
                            <img src={asset.history[0]?.imageUrl || 'https://picsum.photos/seed/demo/400/300'} alt={asset.nodeName} />
                          </div>
                        ) : asset.assetType === 'video' ? (
                          <div className="asset-preview video-preview">
                            <video src={asset.history[0]?.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'} />
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
                  {displayAssets.map((asset) => (
                    <div key={asset.key} className="asset-group">
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
                                  onClick={() => handleRestore(asset.key, item.version)}
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
