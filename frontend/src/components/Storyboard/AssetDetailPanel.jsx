import { useState, useCallback, useEffect } from 'react';
import {
  Sparkles, Trash2, Play, Settings,
  Image, Film, FileText, User, MapPin, Box,
  Scissors, Download, Plus
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
      return <StoryboardEditor asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} />;
    case STAGES.VIDEO:
      return <VideoEditor asset={asset} onUpdate={onUpdate} onGenerate={onGenerate} onAIDialog={onAIDialog} />;
    case STAGES.CLIP:
      return <ClipEditor asset={asset} onUpdate={onUpdate} onDelete={onDelete} />;
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
        <button className="btn-secondary" onClick={() => onAIDialog?.(asset.id)}>
          <Sparkles size={14} />
          让 AI 帮你优化
        </button>
        <div className="footer-spacer" />
        <button className="btn-secondary" onClick={handleSave}>
          保存
        </button>
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
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
        <button className="btn-secondary" onClick={() => onAIDialog?.(asset.id)}>
          <Sparkles size={14} />
          让 AI 帮你优化
        </button>
        <div className="footer-spacer" />
        <button className="btn-secondary" onClick={handleSave}>
          保存
        </button>
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
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
        <button className="btn-secondary" onClick={() => onAIDialog?.(asset.id)}>
          <Sparkles size={14} />
          让 AI 帮你优化
        </button>
        <div className="footer-spacer" />
        <button className="btn-secondary" onClick={handleSave}>
          保存
        </button>
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
        </button>
      </div>
    </div>
  );
};

// ============ 分镜编辑器 ============
// 风格选项
const STYLE_OPTIONS = [
  { value: 'realistic', label: '写实' },
  { value: 'anime', label: '动漫' },
  { value: 'oil_painting', label: '油画' },
  { value: 'ink_wash', label: '水墨' },
  { value: 'sketch', label: '素描' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'fantasy', label: '奇幻' },
  { value: 'sci-fi', label: '科幻' },
];

const StoryboardEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog }) => {
  const { stageAssets: allAssets } = useStageStore();

  // 分镜编辑状态
  const [style, setStyle] = useState(asset.style || 'realistic');
  const [cameraMovement, setCameraMovement] = useState(asset.cameraMovement || 'static');
  const [shotType, setShotType] = useState(asset.shotType || 'medium');
  const [duration, setDuration] = useState(asset.duration || 5);
  const [prompt, setPrompt] = useState(asset.prompt || '');
  const [scriptParagraph, setScriptParagraph] = useState(asset.scriptParagraph || '');

  // 关联资产选择状态
  const [selectedCharacterIds, setSelectedCharacterIds] = useState(asset.characterIds || []);
  const [selectedSceneId, setSelectedSceneId] = useState(asset.sceneId || '');
  const [selectedPropIds, setSelectedPropIds] = useState(asset.propsIds || []);

  // 预览帧状态 (首帧/关键帧/尾帧)
  const [frames, setFrames] = useState({
    first: asset.frames?.first || null,
    key: asset.frames?.key || null,
    last: asset.frames?.last || null,
  });

  // 当 asset 变化时更新本地状态
  useEffect(() => {
    if (asset) {
      setStyle(asset.style || 'realistic');
      setCameraMovement(asset.cameraMovement || 'static');
      setShotType(asset.shotType || 'medium');
      setDuration(asset.duration || 5);
      setPrompt(asset.prompt || '');
      setScriptParagraph(asset.scriptParagraph || '');
      setSelectedCharacterIds(asset.characterIds || []);
      setSelectedSceneId(asset.sceneId || '');
      setSelectedPropIds(asset.propsIds || []);
      setFrames({
        first: asset.frames?.first || null,
        key: asset.frames?.key || null,
        last: asset.frames?.last || null,
      });
    }
  }, [asset]);

  // 处理保存
  const handleSave = useCallback(() => {
    onUpdate?.(asset.id, {
      style,
      cameraMovement,
      shotType,
      duration,
      prompt,
      scriptParagraph,
      characterIds: selectedCharacterIds,
      sceneId: selectedSceneId,
      propsIds: selectedPropIds,
      frames,
    });
  }, [asset, style, cameraMovement, shotType, duration, prompt, scriptParagraph, selectedCharacterIds, selectedSceneId, selectedPropIds, frames, onUpdate]);

  // 处理预览帧点击（生成单个帧）
  const handleFrameGenerate = (frameType) => {
    onGenerate?.(asset.id, 'frame', frameType);
  };

  // 获取所有可用资产
  const availableCharacters = allAssets[STAGES.CHARACTER] || [];
  const availableScenes = allAssets[STAGES.SCENE] || [];
  const availableProps = allAssets[STAGES.PROP] || [];

  // 获取选中资产的名称（用于合并显示）
  const getCharacterNames = () => selectedCharacterIds.map(id => {
    const char = availableCharacters.find(c => c.id === id);
    return char?.name || '';
  }).filter(Boolean).join('、');

  const getSceneName = () => {
    const scene = availableScenes.find(s => s.id === selectedSceneId);
    return scene?.name || '';
  };

  const getPropNames = () => selectedPropIds.map(id => {
    const prop = availableProps.find(p => p.id === id);
    return prop?.name || '';
  }).filter(Boolean).join('、');

  // 合并资产行组件
  const AssetRow = ({ label, icon, names, assetType, onClick }) => (
    <div className="asset-row" onClick={onClick} title={names || '点击选择'}>
      <span className="asset-row-icon">{icon}</span>
      <span className="asset-row-label">{label}</span>
      <span className="asset-row-names">{names || '未选择'}</span>
    </div>
  );

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

  // 渲染单个预览帧
  const renderFrame = (type, label, frameUrl) => (
    <div className="preview-frame" onClick={() => handleFrameGenerate(type)}>
      {frameUrl ? (
        <img src={frameUrl} alt={label} />
      ) : (
        <div className="frame-placeholder">
          <Film size={24} />
          <span>{label}</span>
        </div>
      )}
      <span className="frame-label">{label}</span>
    </div>
  );

  return (
    <div className="detail-panel-content storyboard-editor-v2">
      <div className="panel-header">
        <Film size={18} />
        <h3>{asset?.label || asset?.name || '分镜编辑'}</h3>
        {asset?.status && getStatusBadge(asset.status)}
      </div>

      <div className="panel-body">
        {/* 三帧预览 */}
        <div className="preview-frames-container">
          {renderFrame('first', '首帧', frames.first)}
          {renderFrame('key', '关键帧', frames.key)}
          {renderFrame('last', '尾帧', frames.last)}
        </div>

        {/* 原剧本段落引用块 */}
        <div className="script-reference-block">
          <div className="script-reference-header">
            <span className="script-reference-icon">📄</span>
            <span className="script-reference-title">原剧本段落</span>
          </div>
          <div className="script-reference-content">
            {scriptParagraph && scriptParagraph.trim() ? (
              <blockquote className="script-quote">{scriptParagraph}</blockquote>
            ) : (
              <span className="script-reference-empty">未关联剧本段落</span>
            )}
          </div>
        </div>

        {/* 资产行：角色/场景/道具 */}
        <div className="asset-rows-container">
          <AssetRow label="角色" icon="👤" names={getCharacterNames()} assetType="character" />
          <AssetRow label="场景" icon="🏞️" names={getSceneName()} assetType="scene" />
          <AssetRow label="道具" icon="🎭" names={getPropNames()} assetType="prop" />
        </div>

        {/* 4列参数配置 */}
        <div className="form-row params-4-col">
          <div className="form-group">
            <label>风格</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>运动</label>
            <select value={cameraMovement} onChange={(e) => setCameraMovement(e.target.value)}>
              {CAMERA_MOVEMENTS.map(move => (
                <option key={move.value} value={move.value}>{move.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>景别</label>
            <select value={shotType} onChange={(e) => setShotType(e.target.value)}>
              {SHOT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>时长</label>
            <div className="duration-input">
              <input
                type="number"
                min="1"
                max="30"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <span className="duration-unit">秒</span>
            </div>
          </div>
        </div>

        {/* 镜头 Prompt */}
        <div className="form-group">
          <div className="prompt-header">
            <label>镜头 Prompt</label>
            <button
              className="ai-optimize-btn"
              onClick={() => onAIDialog?.(asset.id)}
              title="AI 优化描述"
            >
              <Sparkles size={12} />
              AI优化
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述该镜头的画面内容、构图、色调等..."
            rows={3}
          />
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="panel-footer">
        <button className="btn-danger" onClick={() => onDelete?.(asset.id)} title="删除镜头">
          <Trash2 size={14} />
        </button>
        <div className="footer-spacer" />
        <button className="btn-secondary" onClick={() => onAIDialog?.(asset.id)} title="AI 优化描述">
          <Sparkles size={14} />
          AI优化
        </button>
        <button className="btn-secondary" onClick={() => onGenerate?.(asset.id, 'frames')} title="生成预览帧">
          <Image size={14} />
          生成预览帧
        </button>
        <button className="btn-primary" onClick={handleSave}>
          保存
        </button>
      </div>
    </div>
  );
};

// ============ 视频编辑器 ============
// 画面比例选项
const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 横版' },
  { value: '9:16', label: '9:16 竖版' },
  { value: '1:1', label: '1:1 方版' },
  { value: '4:3', label: '4:3' },
  { value: '21:9', label: '21:9 宽银幕' },
];

// 画质选项
const QUALITY_OPTIONS = [
  { value: 'low', label: '流畅' },
  { value: 'medium', label: '均衡' },
  { value: 'high', label: '清晰' },
  { value: 'ultra', label: '高清' },
];

const VideoEditor = ({ asset, onUpdate, onGenerate, onAIDialog }) => {
  const { stageAssets: allAssets } = useStageStore();

  // 视频参数状态
  const [aspectRatio, setAspectRatio] = useState(asset.aspectRatio || '16:9');
  const [duration, setDuration] = useState(asset.duration || 5);
  const [quality, setQuality] = useState(asset.quality || 'medium');
  const [prompt, setPrompt] = useState(asset.prompt || '');

  // 关联资产ID
  const [scriptParagraph, setScriptParagraph] = useState(asset.scriptParagraph || '');
  const [characterIds, setCharacterIds] = useState(asset.characterIds || []);
  const [sceneId, setSceneId] = useState(asset.sceneId || '');
  const [propIds, setPropIds] = useState(asset.propIds || []);

  // 当 asset 变化时更新本地状态
  useEffect(() => {
    if (asset) {
      setAspectRatio(asset.aspectRatio || '16:9');
      setDuration(asset.duration || 5);
      setQuality(asset.quality || 'medium');
      setPrompt(asset.prompt || '');
      setScriptParagraph(asset.scriptParagraph || '');
      setCharacterIds(asset.characterIds || []);
      setSceneId(asset.sceneId || '');
      setPropIds(asset.propIds || []);
    }
  }, [asset]);

  // 获取所有可用资产
  const availableCharacters = allAssets[STAGES.CHARACTER] || [];
  const availableScenes = allAssets[STAGES.SCENE] || [];
  const availableProps = allAssets[STAGES.PROP] || [];

  // 获取选中资产的名称
  const getCharacterNames = () => characterIds.map(id => {
    const char = availableCharacters.find(c => c.id === id);
    return char?.name || '';
  }).filter(Boolean).join('、');

  const getSceneName = () => {
    const scene = availableScenes.find(s => s.id === sceneId);
    return scene?.name || '';
  };

  const getPropNames = () => propIds.map(id => {
    const prop = availableProps.find(p => p.id === id);
    return prop?.name || '';
  }).filter(Boolean).join('、');

  // 合并资产行组件
  const AssetRow = ({ label, icon, names }) => (
    <div className="asset-row">
      <span className="asset-row-icon">{icon}</span>
      <span className="asset-row-label">{label}</span>
      <span className={`asset-row-names ${!names ? 'empty' : ''}`}>{names || '未选择'}</span>
    </div>
  );

  // 处理保存参数
  const handleSave = useCallback(() => {
    onUpdate?.(asset.id, {
      aspectRatio,
      duration,
      quality,
      prompt,
      scriptParagraph,
      characterIds,
      sceneId,
      propIds,
    });
  }, [asset, aspectRatio, duration, quality, prompt, scriptParagraph, characterIds, sceneId, propIds, onUpdate]);

  return (
    <div className="detail-panel-content video-editor-v2">
      <div className="panel-header">
        <Film size={18} />
        <h3>{asset?.label || asset?.name || '视频预览'}</h3>
      </div>

      <div className="panel-body">
        {/* 视频预览区 */}
        <div className="video-preview-large">
          {asset.videoUrl ? (
            <video
              src={asset.videoUrl}
              controls
              autoPlay
              poster={asset.thumbnail}
            />
          ) : (
            <div className="video-placeholder">
              <Film size={48} />
              <p>暂无视频</p>
              <span className="video-placeholder-hint">点击"生成此视频"开始生成</span>
            </div>
          )}
        </div>

        {/* 原剧本段落引用块 */}
        <div className="script-reference-block">
          <div className="script-reference-header">
            <span className="script-reference-icon">📄</span>
            <span className="script-reference-title">原剧本段落</span>
          </div>
          <div className="script-reference-content">
            {scriptParagraph && scriptParagraph.trim() ? (
              <blockquote className="script-quote">{scriptParagraph}</blockquote>
            ) : (
              <span className="script-reference-empty">未关联剧本段落</span>
            )}
          </div>
        </div>

        {/* 资产行：角色/场景/道具 */}
        <div className="asset-rows-container">
          <AssetRow label="角色" icon="👤" names={getCharacterNames()} />
          <AssetRow label="场景" icon="🏞️" names={getSceneName()} />
          <AssetRow label="道具" icon="🎭" names={getPropNames()} />
        </div>

        {/* 视频参数 - 3列 */}
        <div className="form-row params-3-col">
          <div className="form-group">
            <label>画面比例</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              {ASPECT_RATIO_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>时长</label>
            <div className="duration-input">
              <input
                type="number"
                min="5"
                max="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <span className="duration-unit">秒</span>
            </div>
          </div>

          <div className="form-group">
            <label>画质</label>
            <select value={quality} onChange={(e) => setQuality(e.target.value)}>
              {QUALITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 视频 Prompt */}
        <div className="form-group">
          <div className="prompt-header">
            <label>视频 Prompt</label>
            <button
              className="ai-optimize-btn"
              onClick={() => onAIDialog?.(asset.id)}
              title="AI 优化描述"
            >
              <Sparkles size={12} />
              AI优化
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述该视频的画面内容、动作、色调等..."
            rows={3}
          />
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="panel-footer">
        <button className="btn-secondary" onClick={handleSave} title="保存参数">
          保存参数
        </button>
        <div className="footer-spacer" />
        <button className="btn-primary" onClick={onGenerate} title="生成视频">
          <Play size={14} />
          生成此视频
        </button>
      </div>
    </div>
  );
};

// ============ 剪辑编辑器 ============
const ClipEditor = ({ asset, onUpdate, onDelete }) => {
  const { stageAssets } = useStageStore();

  // 裁剪状态
  const [startTime, setStartTime] = useState(asset.startTime || 0);
  const [endTime, setEndTime] = useState(asset.endTime || 5);

  // 获取总时长
  const totalDuration = asset.duration || 5;
  const clipDuration = endTime - startTime;

  // 当 asset 变化时更新本地状态
  useEffect(() => {
    if (asset) {
      setStartTime(asset.startTime || 0);
      setEndTime(asset.endTime || asset.duration || 5);
    }
  }, [asset]);

  // 处理保存
  const handleSave = useCallback(() => {
    onUpdate?.(asset.id, {
      startTime,
      endTime,
    });
  }, [asset, startTime, endTime, onUpdate]);

  // 处理删除
  const handleDelete = useCallback(() => {
    onDelete?.(asset.id);
  }, [asset, onDelete]);

  return (
    <div className="detail-panel-content clip-editor">
      <div className="panel-header">
        <Scissors size={18} />
        <h3>{asset?.label || asset?.name || '视频片段'}</h3>
      </div>

      <div className="panel-body">
        {/* 视频预览 */}
        <div className="clip-preview">
          {asset.videoUrl ? (
            <video
              src={asset.videoUrl}
              controls
              poster={asset.thumbnail}
            />
          ) : (
            <div className="video-placeholder">
              <Film size={48} />
              <p>暂无视频</p>
            </div>
          )}
        </div>

        {/* 片段信息 */}
        <div className="clip-info">
          <div className="clip-info-row">
            <span className="clip-info-label">片段序号</span>
            <span className="clip-info-value">#{asset?.order || 1}</span>
          </div>
          <div className="clip-info-row">
            <span className="clip-info-label">总时长</span>
            <span className="clip-info-value">{totalDuration}s</span>
          </div>
        </div>

        {/* 裁剪控制 */}
        <div className="clip-trim-section">
          <label className="clip-trim-label">裁剪起止时间</label>
          <div className="clip-trim-controls">
            <div className="clip-trim-input">
              <span className="trim-input-label">起始</span>
              <input
                type="number"
                min="0"
                max={endTime - 1}
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
              />
              <span className="trim-input-unit">秒</span>
            </div>
            <div className="clip-trim-range">
              <input
                type="range"
                min="0"
                max={totalDuration}
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
              />
              <div className="trim-range-track">
                <div
                  className="trim-range-selected"
                  style={{
                    left: `${(startTime / totalDuration) * 100}%`,
                    width: `${((endTime - startTime) / totalDuration) * 100}%`
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={totalDuration}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
              />
            </div>
            <div className="clip-trim-input">
              <span className="trim-input-label">结束</span>
              <input
                type="number"
                min={startTime + 1}
                max={totalDuration}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
              />
              <span className="trim-input-unit">秒</span>
            </div>
          </div>
          <div className="clip-trim-result">
            裁剪后时长：<strong>{clipDuration}s</strong>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="panel-footer">
        <button className="btn-danger" onClick={handleDelete} title="删除片段">
          <Trash2 size={14} />
        </button>
        <div className="footer-spacer" />
        <button className="btn-secondary" onClick={handleSave} title="保存裁剪">
          保存
        </button>
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
