import { useState } from 'react';
import { ChevronRight, FileText, Users } from 'lucide-react';
import './RightPreviewPanel.css';

/**
 * SequenceModeView - 序列模式视图（故事板微缩版）
 */
const SequenceModeView = ({
  shots = [],
  characters = [],
  script = null,
  selectedIndex = 0,
  onSceneSelect,
  onShotClick,
  onSwitchToAsset,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    script: true,
    characters: true,
  });

  // 使用传入的shots数据，如果没有则使用空数组（会显示空状态）
  const scenes = shots;

  // 剧本摘要
  const scriptSummary = script?.content?.substring(0, 100) + '...' || '暂无剧本摘要';

  // 切换折叠状态
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const currentScene = scenes[selectedIndex] || scenes[0];

  // 空状态
  if (scenes.length === 0) {
    return (
      <div className="sequence-mode-view">
        <div className="empty-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div className="empty-icon">🎬</div>
          <p className="empty-title">暂无镜头序列</p>
          <p className="empty-desc">在对话中生成故事板后，这里将显示镜头序列</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sequence-mode-view">
      {/* 场景横向滚动标签 */}
      <div className="sequence-scenes">
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            className={`scene-tab ${selectedIndex === index ? 'active' : ''}`}
            onClick={() => onSceneSelect?.(index)}
          >
            <span className="scene-tab-dot" />
            <span>{scene.name}</span>
          </button>
        ))}
      </div>

      {/* 当前场景的镜头序列 */}
      <div className="sequence-current-scene">
        <h3 className="current-scene-title">{currentScene?.name}</h3>
        <div className="shots-grid">
          {currentScene?.shots?.map((shot) => (
            <div key={shot.id} className="shot-row">
              <div
                className={`shot-item ${shot.type === 'video' ? 'video' : ''}`}
                onClick={() => onShotClick?.(shot)}
              >
                {shot.thumbnail ? (
                  <img src={shot.thumbnail} alt={shot.label} />
                ) : (
                  <div className="shot-item-placeholder">
                    {shot.type === 'video' ? '🎬' : '🖼️'}
                  </div>
                )}
                <div className="shot-item-label">{shot.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 剧本摘要（可折叠） */}
      <div className="sequence-collapsible">
        <div
          className="collapsible-header"
          onClick={() => toggleSection('script')}
        >
          <ChevronRight
            size={14}
            className={`collapsible-icon ${expandedSections.script ? 'expanded' : ''}`}
          />
          <FileText size={14} />
          <span className="collapsible-title">剧本摘要</span>
        </div>
        {expandedSections.script && (
          <div className="collapsible-content">
            <p className="script-summary">{scriptSummary}</p>
          </div>
        )}
      </div>

      {/* 角色卡片（可折叠） */}
      <div className="sequence-collapsible">
        <div
          className="collapsible-header"
          onClick={() => toggleSection('characters')}
        >
          <ChevronRight
            size={14}
            className={`collapsible-icon ${expandedSections.characters ? 'expanded' : ''}`}
          />
          <Users size={14} />
          <span className="collapsible-title">角色卡片</span>
          <span className="collapsible-badge">{characters.length}</span>
        </div>
        {expandedSections.characters && (
          <div className="collapsible-content">
            {characters.length > 0 ? (
              <div className="characters-grid">
                {characters.map((char) => (
                  <div key={char.id} className="character-card">
                    <div className="character-avatar">
                      {char.avatar ? (
                        <img src={char.avatar} alt={char.name} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '18px' }}>
                          👤
                        </div>
                      )}
                    </div>
                    <div className="character-info">
                      <div className="character-name">{char.name}</div>
                      <div className="character-role">{char.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-desc" style={{ padding: '8px 0' }}>暂无角色数据</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SequenceModeView;
