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

  // 模拟资产数据（当API和节点都为空时使用）
  const MOCK_ASSETS = [
    {
      key: 'char-001',
      nodeId: 'char-001',
      nodeName: '赛博朋克红发女',
      currentVersion: 'V2',
      currentContent: '红发女黑客，霓虹灯光下身穿战术外套，眼神坚定',
      assetType: 'image',
      history: [
        { version: 'V2', type: '修订版', time: '2026-04-15 10:30', status: 'current', imageUrl: 'https://picsum.photos/seed/cyberchar1/400/300', content: '红发女黑客，霓虹灯光下身穿战术外套，眼神坚定' },
        { version: 'V1', type: '运行版', time: '2026-04-14 16:20', status: 'history', imageUrl: 'https://picsum.photos/seed/cyberchar1v1/400/300', content: '红发女概念设计，赛博朋克风格' }
      ]
    },
    {
      key: 'char-002',
      nodeId: 'char-002',
      nodeName: '安保人员A',
      currentVersion: 'V1',
      currentContent: '身穿黑色制服的安保人员，手持电击棍，表情严肃',
      assetType: 'image',
      history: [
        { version: 'V1', type: '运行版', time: '2026-04-15 09:15', status: 'current', imageUrl: 'https://picsum.photos/seed/guard1/400/300', content: '身穿黑色制服的安保人员，手持电击棍，表情严肃' }
      ]
    },
    {
      key: 'char-003',
      nodeId: 'char-003',
      nodeName: 'AI防御系统',
      currentVersion: 'V3',
      currentContent: '悬浮球形AI监控设备，蓝色全息投影，扫描半径50米',
      assetType: 'image',
      history: [
        { version: 'V3', type: '修订版', time: '2026-04-15 11:45', status: 'current', imageUrl: 'https://picsum.photos/seed/ai1/400/300', content: '悬浮球形AI监控设备，蓝色全息投影，扫描半径50米' },
        { version: 'V2', type: '修订版', time: '2026-04-14 20:00', status: 'history', imageUrl: 'https://picsum.photos/seed/ai1v2/400/300', content: '球形AI监控设备' },
        { version: 'V1', type: '运行版', time: '2026-04-13 15:30', status: 'history', imageUrl: 'https://picsum.photos/seed/ai1v1/400/300', content: 'AI防御系统原型' }
      ]
    },
    {
      key: 'scene-001',
      nodeId: 'scene-001',
      nodeName: '数据中心办公室',
      currentVersion: 'V2',
      currentContent: '高科技数据中心，满墙服务器，蓝色LED灯光，窗外霓虹夜景',
      assetType: 'image',
      history: [
        { version: 'V2', type: '修订版', time: '2026-04-15 10:00', status: 'current', imageUrl: 'https://picsum.photos/seed/datacenter1/400/300', content: '高科技数据中心，满墙服务器，蓝色LED灯光，窗外霓虹夜景' },
        { version: 'V1', type: '运行版', time: '2026-04-14 14:20', status: 'history', imageUrl: 'https://picsum.photos/seed/datacenter1v1/400/300', content: '数据中心室内场景' }
      ]
    },
    {
      key: 'scene-002',
      nodeId: 'scene-002',
      nodeName: '霓虹雨夜街道',
      currentVersion: 'V1',
      currentContent: '赛博朋克风格雨夜街道，霓虹灯牌倒映在积水，远处摩天楼',
      assetType: 'image',
      history: [
        { version: 'V1', type: '运行版', time: '2026-04-15 08:45', status: 'current', imageUrl: 'https://picsum.photos/seed/neonstreet/400/300', content: '赛博朋克风格雨夜街道，霓虹灯牌倒映在积水，远处摩天楼' }
      ]
    },
    {
      key: 'scene-003',
      nodeId: 'scene-003',
      nodeName: '地下停车场',
      currentVersion: 'V1',
      currentContent: '昏暗的地下停车场，汽车轮廓，紧急出口标志发出绿光',
      assetType: 'image',
      history: [
        { version: 'V1', type: '运行版', time: '2026-04-14 17:30', status: 'current', imageUrl: 'https://picsum.photos/seed/parking/400/300', content: '昏暗的地下停车场，汽车轮廓，紧急出口标志发出绿光' }
      ]
    },
    {
      key: 'prop-001',
      nodeId: 'prop-001',
      nodeName: '服务器终端',
      currentVersion: 'V1',
      currentContent: '复古CRT显示器风格的终端，绿色字符滚动，显示入侵警告',
      assetType: 'image',
      history: [
        { version: 'V1', type: '运行版', time: '2026-04-14 19:00', status: 'current', imageUrl: 'https://picsum.photos/seed/terminal1/400/300', content: '复古CRT显示器风格的终端，绿色字符滚动，显示入侵警告' }
      ]
    },
    {
      key: 'script-001',
      nodeId: 'script-001',
      nodeName: '第1集：潜入开始',
      currentVersion: 'V3',
      currentContent: '红发女黑客潜入数据中心，目标是三层加密的财务数据库。她快速输入一串指令，防火墙的警示灯开始闪烁。突然，警报响起！她快速拔出数据线，向紧急出口奔去...',
      assetType: 'script',
      history: [
        { version: 'V3', type: '修订版', time: '2026-04-15 12:00', status: 'current', content: '红发女黑客潜入数据中心，目标是三层加密的财务数据库。她快速输入一串指令，防火墙的警示灯开始闪烁。突然，警报响起！她快速拔出数据线，向紧急出口奔去...' },
        { version: 'V2', type: '修订版', time: '2026-04-14 22:00', status: 'history', content: '红发女黑客潜入数据中心，目标是三层加密的财务数据库。警报突然响起，她不得不中断行动...' },
        { version: 'V1', type: '运行版', time: '2026-04-13 10:00', status: 'history', content: '红发女黑客进入数据中心' }
      ]
    },
    {
      key: 'video-001',
      nodeId: 'video-001',
      nodeName: '追逐场景A',
      currentVersion: 'V1',
      currentContent: '红发女在走廊奔跑，安保在后面追赶，镜头跟随视角',
      assetType: 'video',
      history: [
        { version: 'V1', type: '运行版', time: '2026-04-15 14:00', status: 'current', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: '红发女在走廊奔跑，安保在后面追赶，镜头跟随视角' }
      ]
    },
    {
      key: 'video-002',
      nodeId: 'video-002',
      nodeName: '城市追车片段',
      currentVersion: 'V2',
      currentContent: '摩托车在城市街道疾驰，无人机追踪，镜头环绕旋转',
      assetType: 'video',
      history: [
        { version: 'V2', type: '修订版', time: '2026-04-15 15:30', status: 'current', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: '摩托车在城市街道疾驰，无人机追踪，镜头环绕旋转' },
        { version: 'V1', type: '运行版', time: '2026-04-14 18:00', status: 'history', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: '摩托车城市追逐' }
      ]
    }
  ];

  // 当API返回为空时，使用节点数据作为备用，再使用模拟数据
  const displayAssets = assets.length > 0 ? assets : (generateAssetsFromNodes().length > 0 ? generateAssetsFromNodes() : MOCK_ASSETS);

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
