import { useState, useMemo } from 'react';
import { Edit3, Sparkles, Download, Lightbulb, ChevronDown, ChevronRight, FileText, List, RefreshCw } from 'lucide-react';
import './RightPreviewPanel.css';

/**
 * 解析剧本目录的正则表达式
 * 支持格式：
 * - # 标题 / ## 标题（Markdown）
 * - 第X集、第X章、第X部分
 * - 场景X：描述 / 场景X-描述
 * - [场景X] 描述
 * - X. 场景描述（数字开头）
 */
function parseScriptToc(content) {
  if (!content) return { toc: [], title: null };

  const lines = content.split('\n');
  const toc = [];

  let scriptTitle = null;
  let currentEpisode = null;
  let episodeIndex = 0;
  let inSceneContent = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const trimmed = line.trim();
    if (!trimmed) {
      inSceneContent = false;
      continue;
    }

    // Markdown 一级标题 -> 剧本标题
    const mdTitleMatch = trimmed.match(/^#\s+(.+)/);
    if (mdTitleMatch && !scriptTitle) {
      scriptTitle = mdTitleMatch[1].trim();
      continue;
    }

    // Markdown 二级标题 -> 集/章
    const mdEpisodeMatch = trimmed.match(/^##\s+(.+)/);
    if (mdEpisodeMatch) {
      episodeIndex++;
      currentEpisode = {
        id: `ep-${episodeIndex}`,
        title: mdEpisodeMatch[1].trim(),
        subtitle: '',
        scenes: [],
      };
      toc.push(currentEpisode);
      inSceneContent = false;
      continue;
    }

    // 普通集/章格式
    const episodePatterns = [
      /^(第[一二三四五六七八九十百千万\d]+[集章节部话篇])\s*[:：]?\s*(.*)/i,
      /^(EP\d+|[Ee]pisode\s*\d+)\s*[:：]?\s*(.*)/i,
      /^(\d+[集章节])\s*[:：]?\s*(.*)/i,
    ];

    let matched = false;
    for (const pattern of episodePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        episodeIndex++;
        currentEpisode = {
          id: `ep-${episodeIndex}`,
          title: match[1],
          subtitle: match[2]?.trim() || '',
          scenes: [],
        };
        toc.push(currentEpisode);
        matched = true;
        inSceneContent = false;
        break;
      }
    }
    if (matched) continue;

    // 场景格式
    const scenePatterns = [
      /^(场景[境]?\d+)\s*[:：]\s*(.*)/i,
      /^(Scene\s*\d+)\s*[:：]\s*(.*)/i,
      /^\[?(场景|Scene|S)\s*(\d+)\]?\s*[:：\-\.]*\s*(.*)/i,
    ];

    for (const pattern of scenePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const scene = {
          id: `scene-${lineIdx}-${Math.random().toString(36).substr(2, 5)}`,
          title: match[0],
          content: match[2] || match[3] || '',
        };

        if (currentEpisode) {
          currentEpisode.scenes.push(scene);
        } else {
          if (!toc.length) {
            episodeIndex++;
            currentEpisode = {
              id: `ep-${episodeIndex}`,
              title: '剧本内容',
              scenes: [],
            };
            toc.push(currentEpisode);
          }
          currentEpisode.scenes.push(scene);
        }
        inSceneContent = true;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 数字列表开头
    const numListMatch = trimmed.match(/^(\d+)[\.、:：]\s*(.+)/);
    if (numListMatch) {
      const scene = {
        id: `scene-${lineIdx}-${Math.random().toString(36).substr(2, 5)}`,
        title: numListMatch[1],
        content: numListMatch[2],
      };
      if (currentEpisode) {
        currentEpisode.scenes.push(scene);
      } else {
        if (!toc.length) {
          episodeIndex++;
          currentEpisode = {
            id: `ep-${episodeIndex}`,
            title: '剧本内容',
            scenes: [],
          };
          toc.push(currentEpisode);
        }
        currentEpisode.scenes.push(scene);
      }
      inSceneContent = true;
      continue;
    }

    // 普通段落，作为场景内容处理
    if (inSceneContent && currentEpisode && currentEpisode.scenes.length > 0) {
      const lastScene = currentEpisode.scenes[currentEpisode.scenes.length - 1];
      if (lastScene.content) {
        lastScene.content += '\n' + trimmed;
      } else {
        lastScene.content = trimmed;
      }
    }
  }

  // 如果没有匹配到任何结构
  if (toc.length === 0) {
    // 按空行分段作为场景
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length > 0) {
      toc.push({
        id: 'ep-1',
        title: '剧本内容',
        scenes: paragraphs.map((p, i) => ({
          id: `scene-${i}`,
          title: `段落 ${i + 1}`,
          content: p.trim(),
        })),
      });
    }
  }

  return { toc, title: scriptTitle };
}

/**
 * ScriptEditorView - 剧本编辑器视图
 */
const ScriptEditorView = ({
  script,
  onGenerateStoryboard,
  onContentChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [scriptContent, setScriptContent] = useState(script?.content || '');
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [expandedScenes, setExpandedScenes] = useState({});

  // 解析目录
  const { toc: parsedEpisodes, title: parsedTitle } = useMemo(() => {
    if (!scriptContent && !script?.content) {
      return { toc: [], title: null };
    }
    const content = scriptContent || script?.content || '';
    const result = parseScriptToc(content);
    return result;
  }, [scriptContent, script?.content]);

  const episodes = parsedEpisodes.length > 0 ? parsedEpisodes : [{
    id: 'default',
    title: '剧本内容',
    scenes: [{
      id: 'single',
      title: '剧本内容',
      content: scriptContent || script?.content || '',
      location: '',
      time: '',
    }],
  }];

  const scriptTitle = parsedTitle || script?.title || '未命名剧本';
  const currentEpisode = episodes[selectedEpisode] || episodes[0];
  const hasToc = parsedEpisodes.length > 0 && parsedEpisodes[0].scenes?.length > 0;

  const toggleScene = (sceneId) => {
    setExpandedScenes(prev => ({
      ...prev,
      [sceneId]: !prev[sceneId],
    }));
  };

  const handleContentChange = (newContent) => {
    setScriptContent(newContent);
    onContentChange?.(newContent);
  };

  const handleRefreshToc = () => {
    // 强制刷新目录
    setSelectedEpisode(0);
    setExpandedScenes({});
  };

  return (
    <div className="script-editor-view">
      {/* 目录识别提示 */}
      {hasToc && (
        <div className="script-toc-hint">
          <List size={14} />
          <span>已识别 {episodes.length} 个章节，{episodes.reduce((acc, ep) => acc + ep.scenes.length, 0)} 个场景</span>
          <button className="toc-refresh-btn" onClick={handleRefreshToc} title="刷新目录">
            <RefreshCw size={12} />
          </button>
        </div>
      )}

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
              {ep.scenes?.length > 0 && (
                <span className="episode-scene-count">{ep.scenes.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 剧本标题 */}
      <div className="script-display-title">
        <h3>{scriptTitle}</h3>
        {parsedTitle && <span className="title-detected">已识别</span>}
      </div>

      {/* 剧本内容 */}
      <div className="script-content">
        <h2 className="script-title">{currentEpisode.title}</h2>

        {isEditing ? (
          <textarea
            className="script-text"
            value={scriptContent}
            onChange={(e) => handleContentChange(e.target.value)}
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
        ) : hasToc ? (
          /* 目录视图 */
          <div className="script-scenes">
            {currentEpisode.scenes?.map((scene) => (
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
                </div>
                {expandedScenes[scene.id] && scene.content && (
                  <pre className="script-scene-content">{scene.content}</pre>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* 无目录时显示纯文本 */
          <div className="script-plain-content">
            <pre>{scriptContent || script?.content || '暂无剧本内容'}</pre>
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