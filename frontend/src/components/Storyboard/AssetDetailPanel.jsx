import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Sparkles, RefreshCw, Trash2, Play, Settings,
  Image, Film, FileText, User, MapPin, Box
} from 'lucide-react';
import { useStageStore, STAGES, STAGE_CONFIG, SHOT_TYPES, CAMERA_MOVEMENTS } from '../../stores/stageStore';
import './AssetDetailPanel.css';

/**
 * AssetDetailPanel - 资产详情编辑面板
 *
 * 根据不同阶段渲染不同的编辑表单：
 * - SCRIPT: 剧本编辑器
 * - CHARACTER: 角色编辑器
 * - SCENE: 场景编辑器
 * - PROP: 道具编辑器
 * - STORYBOARD: 分镜编辑器
 * - VIDEO: 视频播放器
 */
const AssetDetailPanel = ({
  asset,
  onUpdate,
  onDelete,
  onGenerate,
  onAIDialog,
}) => {
  // 没选中资产时返回 null，不渲染详情面板
  if (!asset) {
    return null;
  }

  const { currentStage, stageAssets } = useStageStore();

  // 根据阶段渲染不同的编辑器
  switch (currentStage) {
    case STAGES.SCRIPT:
      return <ScriptEditor asset={asset} onUpdate={onUpdate} />;
    case STAGES.CHARACTER:
      return <CharacterEditor asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} />;
    case STAGES.SCENE:
      return <SceneEditor asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} />;
    case STAGES.PROP:
      return <PropEditor asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} />;
    case STAGES.STORYBOARD:
      return <StoryboardEditor asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} />;
    case STAGES.VIDEO:
      return <VideoEditor asset={asset} onUpdate={onUpdate} onGenerate={onGenerate} />;
    default:
      return <DefaultEditor asset={asset} />;
  }
};

// ============ 剧本编辑器 ============
const ScriptEditor = ({ asset, onUpdate }) => {
  // 剧本内容（纯文本）
  const [content, setContent] = useState(asset.content || '');

  // 当内容变化时同步到 store
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate?.(asset.id, { content });
    }, 500);
    return () => clearTimeout(timer);
  }, [content, asset.id, onUpdate]);

  // 是否已生成目录
  const [hasGeneratedToc, setHasGeneratedToc] = useState(false);

  // 剧本目录数据结构（生成后才有）
  const [scriptData, setScriptData] = useState(null);

  // 当前选中位置
  const [selectedPath, setSelectedPath] = useState(null);
  const [expandedActs, setExpandedActs] = useState([]);
  const [expandedScenes, setExpandedScenes] = useState([]);

  // 当前编辑的内容
  const [currentContent, setCurrentContent] = useState('');

  // 基于规则生成剧本导航
  const handleGenerateToc = () => {
    // 模拟 AI 生成目录结构
    const generated = {
      acts: [
        {
          id: 'act-1',
          name: '第一集',
          scenes: [
            {
              id: 'scene-1',
              name: '场景 1',
              paragraphs: [
                { id: 'para-1', label: '开场', content: '在一个雷雨交加的夜晚...' },
                { id: 'para-2', label: '发展', content: '主角出现了...' }
              ]
            }
          ]
        }
      ]
    };
    setScriptData(generated);
    setHasGeneratedToc(true);
    setExpandedActs(['act-1']);
    setExpandedScenes(['scene-1']);
    setSelectedPath({ actId: 'act-1', sceneId: 'scene-1', paraId: 'para-1' });
    setCurrentContent('在一个雷雨交加的夜晚...\n\n主角出现了...');
  };

  // 自动生成完整剧本
  const handleGenerateFull = () => {
    // 模拟 AI 生成完整剧本
    const fullScript = `在一个雷雨交加的夜晚，零独自走在霓虹闪烁的街道上。

第一幕：数据中心

场景 1：数据中心内部

段落 1：开场
红发女黑客"零"正在一台终端前快速敲击键盘。她的动作干净利落，眼神专注而锐利。服务器的蓝光映照在她的脸上，勾勒出冷峻的轮廓。

段落 2：紧张时刻
突然，警报响起。"检测到入侵者！"零的嘴角微微上扬，手指在键盘上飞舞得更快了。

场景 2：走廊

段落 3：追逐
就在零即将完成入侵时，安保人员A出现在走廊尽头。零迅速藏身于服务器之间。

第二幕：逃脱

场景 3：霓虹雨夜

段落 4：成功脱身
零利用提前设置好的干扰器成功摆脱追踪，带着数据消失在雨夜中。`;

    setContent(fullScript);
    setCurrentContent(fullScript);

    // 同时生成目录结构
    const generated = {
      acts: [
        {
          id: 'act-1',
          name: '第一集',
          scenes: [
            {
              id: 'scene-1',
              name: '数据中心内部',
              paragraphs: [
                { id: 'para-1', label: '开场', content: '红发女黑客"零"正在一台终端前快速敲击键盘...' },
                { id: 'para-2', label: '紧张时刻', content: '突然，警报响起...' }
              ]
            },
            {
              id: 'scene-2',
              name: '走廊',
              paragraphs: [
                { id: 'para-3', label: '追逐', content: '就在零即将完成入侵时...' }
              ]
            },
            {
              id: 'scene-3',
              name: '霓虹雨夜',
              paragraphs: [
                { id: 'para-4', label: '成功脱身', content: '零利用提前设置好的干扰器...' }
              ]
            }
          ]
        }
      ]
    };
    setScriptData(generated);
    setHasGeneratedToc(true);
    setExpandedActs(['act-1']);
    setExpandedScenes(['scene-1', 'scene-2', 'scene-3']);
    setSelectedPath({ actId: 'act-1', sceneId: 'scene-1', paraId: 'para-1' });
  };

  // 切换集数展开/折叠
  const toggleAct = (actId) => {
    setExpandedActs(prev =>
      prev.includes(actId) ? prev.filter(id => id !== actId) : [...prev, actId]
    );
  };

  // 切换场景展开/折叠
  const toggleScene = (sceneId) => {
    setExpandedScenes(prev =>
      prev.includes(sceneId) ? prev.filter(id => id !== sceneId) : [...prev, sceneId]
    );
  };

  // 选择段落
  const selectParagraph = (actId, sceneId, paraId) => {
    setSelectedPath({ actId, sceneId, paraId });
    // 找到对应段落内容
    if (scriptData) {
      const act = scriptData.acts.find(a => a.id === actId);
      if (act) {
        const scene = act.scenes.find(s => s.id === sceneId);
        if (scene) {
          const para = scene.paragraphs.find(p => p.id === paraId);
          if (para) {
            setCurrentContent(para.content);
          }
        }
      }
    }
  };

  // 保存剧本
  const handleSave = () => {
    onUpdate?.(asset.id, { content });
  };

  // 判断是否选中
  const isParaSelected = (actId, sceneId, paraId) => {
    return selectedPath?.actId === actId && selectedPath?.sceneId === sceneId && selectedPath?.paraId === paraId;
  };

  // 计算段落数量
  const getTotalParagraphs = () => {
    if (!scriptData) return 0;
    return scriptData.acts.reduce((sum, act) => {
      return sum + act.scenes.reduce((sceneSum, scene) => {
        return sceneSum + scene.paragraphs.length;
      }, 0);
    }, 0);
  };

  // 如果还没生成目录，显示简化视图
  if (!hasGeneratedToc) {
    return (
      <div className="detail-panel-content script-editor-simple">
        <div className="panel-header">
          <FileText size={18} />
          <h3>剧本编辑器</h3>
        </div>

        <div className="panel-body">
          <textarea
            className="script-textarea-full"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此输入剧本内容..."
          />
        </div>
      </div>
    );
  }

  // 生成后显示带目录的视图
  return (
    <div className="detail-panel-content script-editor">
      {/* 左侧目录 */}
      <div className="script-toc-panel">
        <div className="script-toc-header">
          <h4>剧本目录</h4>
          <span className="toc-stats">{scriptData?.acts.length || 0} 集 / {getTotalParagraphs()} 段落</span>
        </div>

        <div className="script-toc-content">
          {scriptData?.acts.map((act) => (
            <div key={act.id} className="toc-act">
              <div className="toc-act-header" onClick={() => toggleAct(act.id)}>
                <span className={`toc-expand-icon ${expandedActs.includes(act.id) ? 'expanded' : ''}`}>
                  ▶
                </span>
                <span className="toc-act-name">{act.name}</span>
              </div>

              {expandedActs.includes(act.id) && (
                <div className="toc-scenes">
                  {act.scenes.map((scene) => (
                    <div key={scene.id} className="toc-scene">
                      <div className="toc-scene-header" onClick={() => toggleScene(scene.id)}>
                        <span className={`toc-expand-icon ${expandedScenes.includes(scene.id) ? 'expanded' : ''}`}>
                          ▶
                        </span>
                        <span className="toc-scene-name">{scene.name}</span>
                      </div>

                      {expandedScenes.includes(scene.id) && (
                        <div className="toc-paragraphs">
                          {scene.paragraphs.map((para) => (
                            <div
                              key={para.id}
                              className={`toc-paragraph ${isParaSelected(act.id, scene.id, para.id) ? 'selected' : ''}`}
                              onClick={() => selectParagraph(act.id, scene.id, para.id)}
                            >
                              <span className="para-label">{para.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="add-act-btn" onClick={handleGenerateToc}>
          重新生成导航
        </button>
      </div>

      {/* 右侧编辑区 */}
      <div className="script-edit-panel">
        <div className="panel-header">
          <FileText size={18} />
          <h3>剧本编辑</h3>
          {selectedPath && (
            <span className="current-location">
              {scriptData?.acts.find(a => a.id === selectedPath.actId)?.name} / {' '}
              {scriptData?.acts.find(a => a.id === selectedPath.actId)?.scenes.find(s => s.id === selectedPath.sceneId)?.name} / {' '}
              {selectedPath.paraId}
            </span>
          )}
        </div>

        <div className="panel-body">
          <textarea
            className="script-edit-textarea"
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            placeholder="选择左侧目录中的段落开始编辑..."
          />
        </div>

        <div className="panel-footer">
          <button className="btn-secondary" onClick={() => setHasGeneratedToc(false)}>
            返回纯文本
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Sparkles size={14} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ 角色编辑器 ============
const CharacterEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog }) => {
  const [name, setName] = useState(asset.name || '');
  const [description, setDescription] = useState(asset.description || '');
  const [prompt, setPrompt] = useState(asset.prompt || '');

  const handleSave = () => {
    onUpdate?.(asset.id, { name, description, prompt });
  };

  return (
    <div className="detail-panel-content">
      <div className="panel-header">
        <User size={18} />
        <h3>角色设计</h3>
        <button className="btn-icon-danger" onClick={() => onDelete?.(asset.id)}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="panel-body">
        {/* 角色形象预览 */}
        <div className="asset-preview-large">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt={name} />
          ) : (
            <div className="preview-placeholder">
              <User size={48} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>角色名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入角色名称"
          />
        </div>

        <div className="form-group">
          <label>角色描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述角色的外貌、性格等特点"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>生成 Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="用于生成角色形象的描述词"
            rows={4}
          />
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-secondary" onClick={handleSave}>
          保存
        </button>
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
        </button>
        <button className="btn-secondary" onClick={() => onAIDialog?.(asset.id)}>
          <Sparkles size={14} />
          让 AI 帮你优化
        </button>
      </div>
    </div>
  );
};

// ============ 场景编辑器 ============
const SceneEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog }) => {
  const [name, setName] = useState(asset.name || '');
  const [description, setDescription] = useState(asset.description || '');
  const [prompt, setPrompt] = useState(asset.prompt || '');

  const handleSave = () => {
    onUpdate?.(asset.id, { name, description, prompt });
  };

  return (
    <div className="detail-panel-content">
      <div className="panel-header">
        <MapPin size={18} />
        <h3>场景设计</h3>
        <button className="btn-icon-danger" onClick={() => onDelete?.(asset.id)}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="panel-body">
        <div className="asset-preview-large">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt={name} />
          ) : (
            <div className="preview-placeholder">
              <MapPin size={48} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>场景名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入场景名称"
          />
        </div>

        <div className="form-group">
          <label>场景描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述场景的环境、光线、氛围等"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>生成 Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="用于生成场景的描述词"
            rows={4}
          />
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-secondary" onClick={handleSave}>
          保存
        </button>
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
        </button>
        <button className="btn-secondary" onClick={() => onAIDialog?.(asset.id)}>
          <Sparkles size={14} />
          让 AI 帮你优化
        </button>
      </div>
    </div>
  );
};

// ============ 道具编辑器 ============
const PropEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog }) => {
  const [name, setName] = useState(asset.name || '');
  const [description, setDescription] = useState(asset.description || '');
  const [prompt, setPrompt] = useState(asset.prompt || '');

  const handleSave = () => {
    onUpdate?.(asset.id, { name, description, prompt });
  };

  return (
    <div className="detail-panel-content">
      <div className="panel-header">
        <Box size={18} />
        <h3>道具设计</h3>
        <button className="btn-icon-danger" onClick={() => onDelete?.(asset.id)}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="panel-body">
        <div className="asset-preview-large">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt={name} />
          ) : (
            <div className="preview-placeholder">
              <Box size={48} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>道具名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入道具名称"
          />
        </div>

        <div className="form-group">
          <label>道具描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述道具的外观、材质、用途等"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>生成 Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="用于生成道具的描述词"
            rows={4}
          />
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-secondary" onClick={handleSave}>
          保存
        </button>
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
        </button>
        <button className="btn-secondary" onClick={() => onAIDialog?.(asset.id)}>
          <Sparkles size={14} />
          让 AI 帮你优化
        </button>
      </div>
    </div>
  );
};

// ============ 分镜编辑器 ============
const StoryboardEditor = ({ asset, onUpdate, onDelete, onGenerate }) => {
  const { stageAssets, stageAssets: allAssets } = useStageStore();

  // 分镜编辑状态
  const [selectedShot, setSelectedShot] = useState(asset);
  const [shotType, setShotType] = useState(asset.shotType || 'medium');
  const [cameraMovement, setCameraMovement] = useState(asset.cameraMovement || 'static');
  const [duration, setDuration] = useState(asset.duration || 5);
  const [prompt, setPrompt] = useState(asset.prompt || '');
  const [negativePrompt, setNegativePrompt] = useState(asset.negativePrompt || '');
  const [scriptParagraph, setScriptParagraph] = useState(asset.scriptParagraph || '');

  // 关联资产选择状态
  const [selectedCharacterIds, setSelectedCharacterIds] = useState(asset.characterIds || []);
  const [selectedSceneId, setSelectedSceneId] = useState(asset.sceneId || '');
  const [selectedPropIds, setSelectedPropIds] = useState(asset.propsIds || []);

  // 当 asset 变化时更新本地状态
  useEffect(() => {
    if (asset) {
      setSelectedShot(asset);
      setShotType(asset.shotType || 'medium');
      setCameraMovement(asset.cameraMovement || 'static');
      setDuration(asset.duration || 5);
      setPrompt(asset.prompt || '');
      setNegativePrompt(asset.negativePrompt || '');
      setScriptParagraph(asset.scriptParagraph || '');
      setSelectedCharacterIds(asset.characterIds || []);
      setSelectedSceneId(asset.sceneId || '');
      setSelectedPropIds(asset.propsIds || []);
    }
  }, [asset]);

  // 获取分镜列表（从 stageAssets）
  const storyboardShots = allAssets[STAGES.STORYBOARD] || [];

  // 处理保存
  const handleSave = useCallback(() => {
    onUpdate?.(selectedShot.id, {
      shotType,
      cameraMovement,
      duration,
      prompt,
      negativePrompt,
      scriptParagraph,
      characterIds: selectedCharacterIds,
      sceneId: selectedSceneId,
      propsIds: selectedPropIds,
    });
  }, [selectedShot, shotType, cameraMovement, duration, prompt, negativePrompt, scriptParagraph, selectedCharacterIds, selectedSceneId, selectedPropIds, onUpdate]);

  // 处理镜头选择
  const handleShotSelect = (shot) => {
    // 先保存当前镜头的修改
    if (selectedShot && selectedShot.id !== shot.id) {
      handleSave();
    }
    setSelectedShot(shot);
    setShotType(shot.shotType || 'medium');
    setCameraMovement(shot.cameraMovement || 'static');
    setDuration(shot.duration || 5);
    setPrompt(shot.prompt || '');
    setNegativePrompt(shot.negativePrompt || '');
    setScriptParagraph(shot.scriptParagraph || '');
    setSelectedCharacterIds(shot.characterIds || []);
    setSelectedSceneId(shot.sceneId || '');
    setSelectedPropIds(shot.propsIds || []);
  };

  // 角色选择切换
  const toggleCharacter = (charId) => {
    setSelectedCharacterIds(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    );
  };

  // 道具选择切换
  const toggleProp = (propId) => {
    setSelectedPropIds(prev =>
      prev.includes(propId)
        ? prev.filter(id => id !== propId)
        : [...prev, propId]
    );
  };

  // 获取资产名称
  const getCharacterName = (id) => allAssets[STAGES.CHARACTER]?.find(c => c.id === id)?.name || id;
  const getSceneName = (id) => allAssets[STAGES.SCENE]?.find(s => s.id === id)?.name || id;
  const getPropName = (id) => allAssets[STAGES.PROP]?.find(p => p.id === id)?.name || id;

  // 获取所有可用资产
  const availableCharacters = allAssets[STAGES.CHARACTER] || [];
  const availableScenes = allAssets[STAGES.SCENE] || [];
  const availableProps = allAssets[STAGES.PROP] || [];

  // 生成状态文本
  const getStatusBadge = (status) => {
    switch (status) {
      case 'synced':
        return <span className="status-badge synced">已生成</span>;
      case 'modified':
        return <span className="status-badge modified">已修改</span>;
      case 'running':
        return <span className="status-badge running">生成中</span>;
      case 'error':
        return <span className="status-badge error">错误</span>;
      default:
        return null;
    }
  };

  return (
    <div className="detail-panel-content storyboard-editor">
      {/* 左侧：镜头列表 */}
      <div className="shots-list-panel">
        <div className="shots-list-header">
          <h4>镜头序列</h4>
          <span className="shot-count">{storyboardShots.length} 个镜头</span>
        </div>
        <div className="shots-list">
          {storyboardShots.map((shot, index) => (
            <div
              key={shot.id}
              className={`shot-item ${selectedShot?.id === shot.id ? 'selected' : ''}`}
              onClick={() => handleShotSelect(shot)}
            >
              <div className="shot-thumbnail">
                {shot.thumbnail ? (
                  <img src={shot.thumbnail} alt={shot.label} />
                ) : (
                  <div className="shot-thumb-placeholder">
                    <Film size={16} />
                  </div>
                )}
              </div>
              <div className="shot-info-mini">
                <span className="shot-number">{index + 1}</span>
                <span className="shot-name">{shot.label || `镜头 ${index + 1}`}</span>
                {shot.status && getStatusBadge(shot.status)}
              </div>
              <div className="shot-meta">
                <span className="shot-duration">{shot.duration || 5}秒</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：分镜详情编辑 */}
      <div className="shot-detail-panel">
        <div className="panel-header">
          <Film size={18} />
          <h3>{selectedShot?.label || '分镜编辑'}</h3>
          {selectedShot?.status && getStatusBadge(selectedShot.status)}
        </div>

        <div className="panel-body">
          {/* 分镜预览 */}
          <div className="asset-preview-large">
            {selectedShot?.thumbnail ? (
              <img src={selectedShot.thumbnail} alt={selectedShot.label} />
            ) : (
              <div className="preview-placeholder">
                <Film size={48} />
                <span>点击"预览图"生成画面预览</span>
              </div>
            )}
          </div>

          {/* 关联剧本段落 */}
          <div className="form-group">
            <label>关联剧本</label>
            <textarea
              value={scriptParagraph}
              onChange={(e) => setScriptParagraph(e.target.value)}
              placeholder="输入或编辑关联的剧本段落..."
              rows={3}
              className="script-textarea"
            />
          </div>

          {/* 关联角色（多选） */}
          <div className="form-group">
            <label>关联角色</label>
            <div className="asset-selector">
              {availableCharacters.length > 0 ? (
                availableCharacters.map(char => (
                  <button
                    key={char.id}
                    className={`asset-selector-btn ${selectedCharacterIds.includes(char.id) ? 'selected' : ''}`}
                    onClick={() => toggleCharacter(char.id)}
                  >
                    <span className="selector-icon">👤</span>
                    <span className="selector-name">{char.name}</span>
                    {selectedCharacterIds.includes(char.id) && <span className="selector-check">✓</span>}
                  </button>
                ))
              ) : (
                <span className="no-assets">暂无角色，请先在角色阶段创建</span>
              )}
            </div>
          </div>

          {/* 关联场景（单选） */}
          <div className="form-group">
            <label>关联场景</label>
            <div className="asset-selector">
              {availableScenes.length > 0 ? (
                availableScenes.map(scene => (
                  <button
                    key={scene.id}
                    className={`asset-selector-btn ${selectedSceneId === scene.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSceneId(scene.id === selectedSceneId ? '' : scene.id)}
                  >
                    <span className="selector-icon">🏞️</span>
                    <span className="selector-name">{scene.name}</span>
                    {selectedSceneId === scene.id && <span className="selector-check">✓</span>}
                  </button>
                ))
              ) : (
                <span className="no-assets">暂无场景，请先在场景阶段创建</span>
              )}
            </div>
          </div>

          {/* 关联道具（多选） */}
          <div className="form-group">
            <label>关联道具</label>
            <div className="asset-selector">
              {availableProps.length > 0 ? (
                availableProps.map(prop => (
                  <button
                    key={prop.id}
                    className={`asset-selector-btn ${selectedPropIds.includes(prop.id) ? 'selected' : ''}`}
                    onClick={() => toggleProp(prop.id)}
                  >
                    <span className="selector-icon">🎭</span>
                    <span className="selector-name">{prop.name}</span>
                    {selectedPropIds.includes(prop.id) && <span className="selector-check">✓</span>}
                  </button>
                ))
              ) : (
                <span className="no-assets">暂无道具，请先在道具阶段创建</span>
              )}
            </div>
          </div>

          {/* 参数配置 */}
          <div className="form-row">
            <div className="form-group">
              <label>景别</label>
              <select value={shotType} onChange={(e) => setShotType(e.target.value)}>
                {SHOT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>运镜</label>
              <select value={cameraMovement} onChange={(e) => setCameraMovement(e.target.value)}>
                {CAMERA_MOVEMENTS.map(move => (
                  <option key={move.value} value={move.value}>{move.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 时长滑块 */}
          <div className="form-group">
            <label>时长：{duration} 秒</label>
            <div className="duration-slider">
              <input
                type="range"
                min="1"
                max="30"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <div className="duration-marks">
                <span>1秒</span>
                <span>15秒</span>
                <span>30秒</span>
              </div>
            </div>
          </div>

          {/* 画面描述 */}
          <div className="form-group">
            <label>画面描述</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述该镜头的画面内容、构图、色调等..."
              rows={3}
            />
          </div>

          {/* 负向 Prompt */}
          <div className="form-group">
            <label>负向 Prompt（不希望出现的元素）</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="描述不希望在该镜头中出现的元素..."
              rows={2}
              className="negative-prompt"
            />
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="panel-footer">
          <button className="btn-danger" onClick={() => onDelete?.(selectedShot.id)} title="删除镜头">
            <Trash2 size={14} />
          </button>
          <div className="footer-spacer" />
          <button className="btn-secondary" onClick={() => onGenerate?.(selectedShot.id, 'image')} title="生成预览图">
            <Image size={14} />
            预览图
          </button>
          <button className="btn-secondary" onClick={() => onGenerate?.(selectedShot.id, 'video')} title="生成视频">
            <Film size={14} />
            生成视频
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Sparkles size={14} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ 视频编辑器 ============
const VideoEditor = ({ asset, onUpdate, onGenerate }) => {
  return (
    <div className="detail-panel-content video-editor">
      <div className="panel-header">
        <Film size={18} />
        <h3>视频预览</h3>
      </div>

      <div className="panel-body">
        <div className="video-preview">
          {asset.videoUrl ? (
            <video
              src={asset.videoUrl}
              controls
              autoPlay
              poster={asset.thumbnail}
            />
          ) : (
            <div className="video-placeholder">
              <Film size={64} />
              <p>暂无视频</p>
              <button className="btn-primary" onClick={onGenerate}>
                <Play size={14} />
                生成视频
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ 默认编辑器 ============
const DefaultEditor = ({ asset }) => {
  return (
    <div className="detail-panel-content">
      <div className="panel-header">
        <Settings size={18} />
        <h3>资产详情</h3>
      </div>
      <div className="panel-body">
        <pre>{JSON.stringify(asset, null, 2)}</pre>
      </div>
    </div>
  );
};

export default AssetDetailPanel;
