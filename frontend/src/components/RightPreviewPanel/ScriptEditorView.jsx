import { useState } from 'react';
import { Edit3, Sparkles, Download, Lightbulb, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import './RightPreviewPanel.css';

/**
 * ScriptEditorView - 剧本编辑器视图
 */
const ScriptEditorView = ({
  script,
  onGenerateStoryboard,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [scriptContent, setScriptContent] = useState(
    script?.content || ''
  );
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [expandedScenes, setExpandedScenes] = useState({});

  // 默认剧本内容（演示用）
  const defaultScript = {
    title: '第1集：潜入开始',
    episodes: [
      {
        id: 'ep1',
        title: '第1集：潜入开始',
        scenes: [
          {
            id: 'scene-1',
            title: '场景1：数据中心办公室 - 夜',
            content: '红发女黑客轻手轻脚地绕过监控摄像头，屏幕上闪烁着密密麻麻的代码。她的目标是三层加密的财务数据库。',
            location: '数据中心办公室',
            time: '夜',
          },
        ],
      },
    ],
  };

  // 兼容旧格式（单集）
  const episodes = script?.episodes || (script?.content ? [{
    id: 'default',
    title: script?.title || '默认剧本',
    scenes: [{
      id: 'single',
      title: '剧本内容',
      content: script?.content,
      location: '',
      time: '',
    }],
  }] : defaultScript.episodes);

  const currentEpisode = episodes[selectedEpisode] || episodes[0];

  const toggleScene = (sceneId) => {
    setExpandedScenes(prev => ({
      ...prev,
      [sceneId]: !prev[sceneId],
    }));
  };

  return (
    <div className="script-editor-view">
      {/* 剧集选择标签 */}
      {episodes.length > 1 && (
        <div className="script-episodes-tabs">
          {episodes.map((ep, index) => (
            <button
              key={ep.id}
              className={`script-episode-tab ${index === selectedEpisode ? 'active' : ''}`}
              onClick={() => setSelectedEpisode(index)}
            >
              {ep.title}
            </button>
          ))}
        </div>
      )}

      {/* 剧本内容 */}
      <div className="script-content">
        <h2 className="script-title">{currentEpisode.title}</h2>

        {isEditing ? (
          <textarea
            className="script-text"
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '300px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              lineHeight: '1.8',
              resize: 'vertical',
            }}
          />
        ) : (
          <div className="script-scenes">
            {currentEpisode.scenes.map((scene) => (
              <div key={scene.id} className="script-scene-item">
                <div
                  className="script-scene-header"
                  onClick={() => toggleScene(scene.id)}
                >
                  <span className="script-scene-toggle">
                    {expandedScenes[scene.id] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </span>
                  <span className="script-scene-title">{scene.title}</span>
                  {scene.location && (
                    <span className="script-scene-meta">
                      📍 {scene.location} · 🕐 {scene.time}
                    </span>
                  )}
                </div>
                {expandedScenes[scene.id] && (
                  <pre className="script-scene-content">{scene.content}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="script-actions">
        {isEditing ? (
          <>
            <button
              className="asset-action-btn primary"
              onClick={() => {
                setIsEditing(false);
              }}
            >
              <Edit3 size={14} />
              <span>保存</span>
            </button>
            <button
              className="asset-action-btn"
              onClick={() => setIsEditing(false)}
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              className="asset-action-btn primary"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={14} />
              <span>编辑</span>
            </button>
            <button className="asset-action-btn">
              <Sparkles size={14} />
              <span>AI润色</span>
            </button>
            <button className="asset-action-btn">
              <Download size={14} />
              <span>导出</span>
            </button>
          </>
        )}
      </div>

      {/* 提示信息 */}
      {!isEditing && (
        <div className="script-hint">
          <Lightbulb size={14} className="script-hint-icon" />
          <span>点击「生成分镜」可将此剧本转换为故事板序列</span>
        </div>
      )}

      {/* 生成分镜按钮 */}
      {!isEditing && (
        <button
          className="asset-action-btn primary"
          style={{
            marginTop: 12,
            width: '100%',
            justifyContent: 'center',
          }}
          onClick={onGenerateStoryboard}
        >
          <Sparkles size={14} />
          <span>生成分镜</span>
        </button>
      )}
    </div>
  );
};

export default ScriptEditorView;
