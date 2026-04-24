import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, Trash2, Play, Settings,
  Image, Film, FileText, User, MapPin, Box,
  Scissors, Download, Plus
} from 'lucide-react';
import { useStageStore, STAGES, STAGE_CONFIG, SHOT_TYPES, CAMERA_MOVEMENTS } from '../../stores/stageStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
  saveStatus = 'idle', // 'idle' | 'saving' | 'saved'
}) => {
  const { currentStage } = useStageStore();

  // 没选中资产时返回 null，不渲染详情面板
  if (!asset) {
    return null;
  }

  // 根据阶段渲染不同的编辑器
  // 使用 key={asset.id} 确保切换资产时重新挂载编辑器，以同步新资产的数据
  switch (currentStage) {
    case STAGES.SCRIPT:
      return <ScriptEditor key={asset.id} asset={asset} onUpdate={onUpdate} saveStatus={saveStatus} />;
    case STAGES.CHARACTER:
      return <CharacterEditor key={asset.id} asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} saveStatus={saveStatus} />;
    case STAGES.SCENE:
      return <SceneEditor key={asset.id} asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} saveStatus={saveStatus} />;
    case STAGES.PROP:
      return <PropEditor key={asset.id} asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} saveStatus={saveStatus} />;
    case STAGES.STORYBOARD:
      return <StoryboardEditor key={asset.id} asset={asset} onUpdate={onUpdate} onDelete={onDelete} onGenerate={onGenerate} onAIDialog={onAIDialog} saveStatus={saveStatus} />;
    case STAGES.VIDEO:
      return <VideoEditor key={asset.id} asset={asset} onUpdate={onUpdate} onGenerate={onGenerate} onAIDialog={onAIDialog} saveStatus={saveStatus} />;
    case STAGES.CLIP:
      return <ClipEditor key={asset.id} asset={asset} onUpdate={onUpdate} onDelete={onDelete} saveStatus={saveStatus} />;
    default:
      return <DefaultEditor key={asset.id} asset={asset} />;
  }
};

// ============ 剧本编辑器 ============
const ScriptEditor = ({ asset, onUpdate, saveStatus }) => {
  const [showToc, setShowToc] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeChapterId, setActiveChapterId] = useState(null);
  const editorWrapRef = useRef(null);

  // 初始化 Tiptap 编辑器
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(asset.id, { content: html });
    },
  });

  // 解析目录
  const { toc, title: scriptTitle } = useMemo(() => {
    if (!asset.content) return { toc: [], title: null };
    return parseScriptTocFull(asset.content);
  }, [asset.content]);

  // 初始化编辑器内容
  useEffect(() => {
    if (editor && asset.content) {
      const html = markdownToHtml(asset.content);
      editor.commands.setContent(html, true);
    }
  }, [editor, asset.id]);

  // 跳转到章节
  const scrollToChapter = useCallback((chapterId) => {
    if (!editor) return;
    const chapterIndex = toc.findIndex(ch => ch.id === chapterId);
    if (chapterIndex === -1) return;

    // 收集所有 h2 heading 的位置
    const headingPositions = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.attrs.level === 2) {
        headingPositions.push({ pos, text: node.textContent });
      }
    });

    if (chapterIndex >= headingPositions.length) return;

    const target = headingPositions[chapterIndex];
    editor.chain().focus().setTextSelection(target.pos).run();

    // 直接操作 DOM 滚动
    setTimeout(() => {
      const editorDom = editor.view.dom;
      const headings = editorDom.querySelectorAll('h2');
      for (const h of headings) {
        if (h.textContent === target.text) {
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
      }
    }, 100);

    setActiveChapterId(chapterId);
  }, [editor, toc]);

  // 监听编辑器滚动，同步高亮目录
  useEffect(() => {
    if (!editor) return;

    const handleScroll = () => {
      const editorDom = editor.view.dom;
      const scrollContainer = editorDom.closest('.tiptap-body') || editorDom;

      // 收集所有 h2 heading 的 DOM 位置
      const h2Headings = editorDom.querySelectorAll('h2');
      if (h2Headings.length === 0) return;

      let activeIdx = 0;
      for (let i = 0; i < h2Headings.length; i++) {
        const rect = h2Headings[i].getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        if (rect.top - containerRect.top < 100) {
          activeIdx = i;
        }
      }

      if (toc[activeIdx] && toc[activeIdx].id !== activeChapterId) {
        setActiveChapterId(toc[activeIdx].id);
        if (!expandedChapters[toc[activeIdx].id]) {
          setExpandedChapters(prev => ({ ...prev, [toc[activeIdx].id]: true }));
        }
      }
    };

    const editorDom = editor.view.dom;
    const scrollContainer = editorDom.closest('.tiptap-body');
    const targetEl = scrollContainer || editorDom;
    targetEl.addEventListener('scroll', handleScroll);

    return () => targetEl.removeEventListener('scroll', handleScroll);
  }, [editor, toc, activeChapterId, expandedChapters]);

  // 全选/全收
  const toggleAll = (expand) => {
    const allExpanded = {};
    toc.forEach(ch => { allExpanded[ch.id] = expand; });
    setExpandedChapters(allExpanded);
  };

  return (
    <div className="detail-panel-content script-editor">
      {/* 左侧目录面板 */}
      <div className={`script-toc-panel ${!showToc ? 'collapsed' : ''}`}>
        <div className="script-toc-header">
          <div className="script-toc-title-row">
            <FileText size={16} />
            <h4>{scriptTitle || '剧本目录'}</h4>
          </div>
          <button
            className="toc-toggle-btn"
            onClick={() => setShowToc(!showToc)}
            title={showToc ? '收起目录' : '展开目录'}
          >
            {showToc ? '◀' : '▶'}
          </button>
        </div>

        {showToc && (
          <>
            <div className="script-toc-content">
              {toc.length === 0 ? (
                <div className="toc-empty">暂无目录</div>
              ) : (
                toc.map((chapter) => (
                  <div key={chapter.id} className="toc-chapter">
                    <div
                      className={`toc-chapter-header ${activeChapterId === chapter.id ? 'active' : ''}`}
                      onClick={() => scrollToChapter(chapter.id)}
                    >
                      <span className={`toc-expand-icon ${expandedChapters[chapter.id] ? 'expanded' : ''}`}>
                        ▶
                      </span>
                      <span className="toc-chapter-title">{chapter.title}</span>
                    </div>

                    {expandedChapters[chapter.id] && chapter.scenes?.length > 0 && (
                      <div className="toc-scenes">
                        {chapter.scenes.map((scene) => (
                          <div key={scene.id} className="toc-scene">
                            <span className="toc-scene-title">{scene.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {toc.length > 1 && (
              <div className="toc-actions">
                <button className="toc-action-btn" onClick={() => toggleAll(true)}>全部展开</button>
                <button className="toc-action-btn" onClick={() => toggleAll(false)}>全部收起</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 收起时显示的展开按钮 */}
      {!showToc && (
        <button
          className="toc-expand-btn"
          onClick={() => setShowToc(true)}
          title="展开目录"
        >
          ▶
        </button>
      )}

      {/* 右侧编辑区 */}
      <div className="script-edit-panel">
        <div className="panel-header">
          <FileText size={18} />
          <h3>剧本编辑</h3>
          {saveStatus !== 'idle' && (
            <span className="save-status">{saveStatus === 'saving' ? '保存中...' : '已保存'}</span>
          )}
        </div>

        <div className="panel-body tiptap-body" ref={editorWrapRef}>
          <EditorContent editor={editor} className="tiptap-editor" />
        </div>
      </div>
    </div>
  );
};

// Markdown 转 HTML
function markdownToHtml(markdown) {
  if (!markdown) return '';
  // 如果已经是 HTML（包含标签），直接返回
  if (markdown.includes('<') && markdown.includes('>')) {
    return markdown;
  }
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const title = trimmed.slice(2);
      html += `<h1>${title}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const title = trimmed.slice(3);
      html += `<h2>${title}</h2>`;
    } else if (trimmed.match(/^[-\*]\s/) || trimmed.match(/^\d+\.\s/)) {
      if (!inList) { html += '<ul>'; inList = true; }
      const text = trimmed.replace(/^[-\*]\s/, '').replace(/^\d+\.\s/, '');
      html += `<li>${text}</li>`;
    } else if (trimmed.match(/^(场景|Scene)\s*\d+/i)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p class="scene-marker">${trimmed}</p>`;
    } else if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${trimmed}</p>`;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

// HTML 转 Markdown（简化版）
function htmlToMarkdown(html) {
  if (!html) return '';
  let result = html;

  // 将 HTML 标签替换为带换行的标记
  result = result.replace(/<h1[^>]*>([^<]*)<\/h1>/gi, '# $1\n\n');
  result = result.replace(/<h2[^>]*>([^<]*)<\/h2>/gi, '## $1\n\n');
  result = result.replace(/<h3[^>]*>([^<]*)<\/h3>/gi, '### $1\n\n');
  result = result.replace(/<p[^>]*class="scene-marker"[^>]*>([^<]*)<\/p>/gi, '$1\n\n');
  result = result.replace(/<p[^>]*>([^<]*)<\/p>/gi, '$1\n\n');
  result = result.replace(/<li[^>]*>([^<]*)<\/li>/gi, '- $1\n');
  result = result.replace(/<ul[^>]*>/gi, '\n');
  result = result.replace(/<\/ul>/gi, '\n\n');

  // 移除剩余的 HTML 标签
  result = result.replace(/<[^>]+>/g, '');

  // 处理 HTML 实体
  result = result.replace(/&nbsp;/g, ' ');
  result = result.replace(/&lt;/g, '<');
  result = result.replace(/&gt;/g, '>');

  // 清理多余空行
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

// 解析剧本目录（完整版，返回目录和标题）
function parseScriptTocFull(content) {
  if (!content) return { toc: [], title: null };

  // 如果是 HTML，先转为 Markdown
  let text = content;
  if (content.includes('<') && content.includes('>')) {
    text = htmlToMarkdown(content);
  }

  const lines = text.split('\n');
  const toc = [];
  let scriptTitle = null;
  let currentChapter = null;
  let chapterIndex = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Markdown 一级标题 -> 剧本标题
    if (!scriptTitle && trimmed.startsWith('# ')) {
      scriptTitle = trimmed.slice(2).trim();
      continue;
    }

    // Markdown 二级标题 -> 章节
    if (trimmed.startsWith('## ')) {
      chapterIndex++;
      currentChapter = {
        id: `chapter-${chapterIndex}`,
        title: trimmed.slice(3).trim(),
        scenes: [],
      };
      toc.push(currentChapter);
      continue;
    }

    // 普通章节格式
    const chapterPatterns = [
      /^(第[一二三四五六七八九十百千万\d]+[章节集部话篇])\s*[:：]?\s*(.*)/i,
      /^(Chapter|Chapter\s*\d+)\s*[:：]?\s*(.*)/i,
    ];

    let matched = false;
    for (const pattern of chapterPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        chapterIndex++;
        currentChapter = {
          id: `chapter-${chapterIndex}`,
          title: match[0],
          scenes: [],
        };
        toc.push(currentChapter);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 场景（归属于当前章节）
    if (currentChapter) {
      const sceneMatch = trimmed.match(/^(场景[境]?\d+)\s*[:：]\s*(.*)/i);
      if (sceneMatch) {
        currentChapter.scenes.push({
          id: `scene-${lineIdx}`,
          title: sceneMatch[1],
          content: sceneMatch[2] || '',
        });
        continue;
      }

      // 数字列表
      const numMatch = trimmed.match(/^(\d+)[\.、:：]\s*(.*)/);
      if (numMatch) {
        currentChapter.scenes.push({
          id: `scene-${lineIdx}`,
          title: numMatch[1],
          content: numMatch[2] || '',
        });
        continue;
      }

      // 普通段落（归属于最后一个场景）
      if (currentChapter.scenes.length > 0) {
        const lastScene = currentChapter.scenes[currentChapter.scenes.length - 1];
        if (lastScene.content) {
          lastScene.content += '\n' + trimmed;
        } else {
          lastScene.content = trimmed;
        }
      }
    }
  }

  // 如果没有匹配到任何结构，按段落分隔
  if (toc.length === 0 && content.length > 0) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length > 0) {
      toc.push({
        id: 'chapter-1',
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

// ============ 角色编辑器 ============
const CharacterEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog, saveStatus }) => {
  const [name, setName] = useState(asset.name || '');
  const [description, setDescription] = useState(asset.description || '');
  const [prompt, setPrompt] = useState(asset.generatePrompt || '');
  const initialNameRef = useRef(asset.name || '');
  const initialDescRef = useRef(asset.description || '');
  const initialPromptRef = useRef(asset.generatePrompt || '');
  const skipFirstSave = useRef(true); // 跳过首次挂载时的检查

  // 立即触发保存（debounce 在 handleUpdateAsset 中统一处理）
  useEffect(() => {
    // 跳过首次挂载时的检查（首次挂载时 name/description/prompt 与 initialRef 应该相等）
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    // 只有真正变化了才触发保存
    if (name !== initialNameRef.current || description !== initialDescRef.current || prompt !== initialPromptRef.current) {
      onUpdate?.(asset.id, { name, description, prompt });
      initialNameRef.current = name;
      initialDescRef.current = description;
      initialPromptRef.current = prompt;
    }
  }, [name, description, prompt, asset.id, onUpdate]);

  return (
    <div className="detail-panel-content">
      <div className="panel-header">
        <User size={18} />
        <h3>角色设计</h3>
        {saveStatus !== 'idle' && (
          <span className="save-status">{saveStatus === 'saving' ? '保存中...' : '已保存'}</span>
        )}
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
          <label>生图 Prompt</label>
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
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
        </button>
      </div>
    </div>
  );
};

// ============ 场景编辑器 ============
const SceneEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog, saveStatus }) => {
  const [name, setName] = useState(asset.name || '');
  const [description, setDescription] = useState(asset.description || '');
  const [prompt, setPrompt] = useState(asset.generatePrompt || '');
  const initialNameRef = useRef(asset.name || '');
  const initialDescRef = useRef(asset.description || '');
  const initialPromptRef = useRef(asset.generatePrompt || '');
  const skipFirstSave = useRef(true); // 跳过首次挂载时的检查

  // 立即触发保存（debounce 在 handleUpdateAsset 中统一处理）
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    if (name !== initialNameRef.current || description !== initialDescRef.current || prompt !== initialPromptRef.current) {
      onUpdate?.(asset.id, { name, description, prompt });
      initialNameRef.current = name;
      initialDescRef.current = description;
      initialPromptRef.current = prompt;
    }
  }, [name, description, prompt, asset.id, onUpdate]);

  return (
    <div className="detail-panel-content">
      <div className="panel-header">
        <MapPin size={18} />
        <h3>场景设计</h3>
        {saveStatus !== 'idle' && (
          <span className="save-status">{saveStatus === 'saving' ? '保存中...' : '已保存'}</span>
        )}
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
          <label>生图 Prompt</label>
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
        <button className="btn-primary" onClick={() => onGenerate?.(asset.id)}>
          <Sparkles size={14} />
          生成图片
        </button>
      </div>
    </div>
  );
};

// ============ 道具编辑器 ============
const PropEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog, saveStatus }) => {
  const [name, setName] = useState(asset.name || '');
  const [description, setDescription] = useState(asset.description || '');
  const [prompt, setPrompt] = useState(asset.generatePrompt || '');
  const initialNameRef = useRef(asset.name || '');
  const initialDescRef = useRef(asset.description || '');
  const initialPromptRef = useRef(asset.generatePrompt || '');
  const skipFirstSave = useRef(true); // 跳过首次挂载时的检查

  // 立即触发保存（debounce 在 handleUpdateAsset 中统一处理）
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    if (name !== initialNameRef.current || description !== initialDescRef.current || prompt !== initialPromptRef.current) {
      onUpdate?.(asset.id, { name, description, prompt });
      initialNameRef.current = name;
      initialDescRef.current = description;
      initialPromptRef.current = prompt;
    }
  }, [name, description, prompt, asset.id, onUpdate]);

  return (
    <div className="detail-panel-content">
      <div className="panel-header">
        <Box size={18} />
        <h3>道具设计</h3>
        {saveStatus !== 'idle' && (
          <span className="save-status">{saveStatus === 'saving' ? '保存中...' : '已保存'}</span>
        )}
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
          <label>生图 Prompt</label>
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

const StoryboardEditor = ({ asset, onUpdate, onDelete, onGenerate, onAIDialog, saveStatus }) => {
  const { stageAssets: allAssets } = useStageStore();

  // 分镜编辑状态 - 初始化自 asset，仅在 asset.id 变化时重新创建（通过 key）
  const [style, setStyle] = useState(asset.style || 'realistic');
  const [cameraMovement, setCameraMovement] = useState(asset.cameraMovement || 'static');
  const [shotType, setShotType] = useState(asset.shotType || 'medium');
  const [duration, setDuration] = useState(asset.duration || 5);
  const [prompt, setPrompt] = useState(asset.prompt || '');
  const [scriptParagraph, _setScriptParagraph] = useState(asset.scriptParagraph || '');

  // 关联资产选择状态
  const [selectedCharacterIds, _setSelectedCharacterIds] = useState(asset.characterIds || []);
  const [selectedSceneId, _setSelectedSceneId] = useState(asset.sceneId || '');
  const [selectedPropIds, _setSelectedPropIds] = useState(asset.propsIds || []);

  // 预览帧状态 (首帧/关键帧/尾帧)
  const [frames, _setFrames] = useState({
    first: asset.frames?.first || null,
    key: asset.frames?.key || null,
    last: asset.frames?.last || null,
  });

  // 初始值 refs
  const initialRef = useRef({ style: asset.style, cameraMovement: asset.cameraMovement, shotType: asset.shotType, duration: asset.duration, prompt: asset.prompt, scriptParagraph: asset.scriptParagraph, characterIds: asset.characterIds, sceneId: asset.sceneId, propsIds: asset.propsIds, frames: asset.frames });
  const skipFirstSave = useRef(true); // 跳过首次挂载时的检查

  // 立即触发保存（debounce 在 handleUpdateAsset 中统一处理）
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    const current = { style, cameraMovement, shotType, duration, prompt, scriptParagraph, characterIds: selectedCharacterIds, sceneId: selectedSceneId, propsIds: selectedPropIds, frames };
    const initial = initialRef.current;
    if (JSON.stringify(current) !== JSON.stringify(initial)) {
      onUpdate?.(asset.id, current);
      initialRef.current = current;
    }
  }, [style, cameraMovement, shotType, duration, prompt, scriptParagraph, selectedCharacterIds, selectedSceneId, selectedPropIds, frames, asset.id, onUpdate]);

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
        {saveStatus !== 'idle' && (
          <span className="save-status">{saveStatus === 'saving' ? '保存中...' : '已保存'}</span>
        )}
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
          <div className="asset-row" title={getCharacterNames() || '点击选择'}>
            <span className="asset-row-icon">👤</span>
            <span className="asset-row-label">角色</span>
            <span className="asset-row-names">{getCharacterNames() || '未选择'}</span>
          </div>
          <div className="asset-row" title={getSceneName() || '点击选择'}>
            <span className="asset-row-icon">🏞</span>
            <span className="asset-row-label">场景</span>
            <span className="asset-row-names">{getSceneName() || '未选择'}</span>
          </div>
          <div className="asset-row" title={getPropNames() || '点击选择'}>
            <span className="asset-row-icon">🎭</span>
            <span className="asset-row-label">道具</span>
            <span className="asset-row-names">{getPropNames() || '未选择'}</span>
          </div>
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
        <button className="btn-secondary" onClick={() => onGenerate?.(asset.id, 'frames')} title="生成预览帧">
          <Image size={14} />
          生成预览帧
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

const VideoEditor = ({ asset, onUpdate, onGenerate, onAIDialog, saveStatus }) => {
  const { stageAssets: allAssets } = useStageStore();

  // 视频参数状态
  const [aspectRatio, setAspectRatio] = useState(asset.aspectRatio || '16:9');
  const [duration, setDuration] = useState(asset.duration || 5);
  const [quality, setQuality] = useState(asset.quality || 'medium');
  const [prompt, setPrompt] = useState(asset.prompt || '');

  // 关联资产ID
  const [scriptParagraph, _setScriptParagraph] = useState(asset.scriptParagraph || '');
  const [characterIds, _setCharacterIds] = useState(asset.characterIds || []);
  const [sceneId, _setSceneId] = useState(asset.sceneId || '');
  const [propIds, _setPropIds] = useState(asset.propIds || []);

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

  // 初始值 refs
  const initialRef = useRef({ aspectRatio: asset.aspectRatio, duration: asset.duration, quality: asset.quality, prompt: asset.prompt, scriptParagraph: asset.scriptParagraph, characterIds: asset.characterIds, sceneId: asset.sceneId, propIds: asset.propIds });
  const skipFirstSave = useRef(true); // 跳过首次挂载时的检查

  // 立即触发保存（debounce 在 handleUpdateAsset 中统一处理）
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    const current = { aspectRatio, duration, quality, prompt, scriptParagraph, characterIds, sceneId, propIds };
    const initial = initialRef.current;
    if (JSON.stringify(current) !== JSON.stringify(initial)) {
      onUpdate?.(asset.id, current);
      initialRef.current = current;
    }
  }, [aspectRatio, duration, quality, prompt, scriptParagraph, characterIds, sceneId, propIds, asset.id, onUpdate]);

  return (
    <div className="detail-panel-content video-editor-v2">
      <div className="panel-header">
        <Film size={18} />
        <h3>{asset?.label || asset?.name || '视频预览'}</h3>
        {saveStatus !== 'idle' && (
          <span className="save-status">{saveStatus === 'saving' ? '保存中...' : '已保存'}</span>
        )}
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
          <div className="asset-row">
            <span className="asset-row-icon">👤</span>
            <span className="asset-row-label">角色</span>
            <span className={`asset-row-names ${!getCharacterNames() ? 'empty' : ''}`}>{getCharacterNames() || '未选择'}</span>
          </div>
          <div className="asset-row">
            <span className="asset-row-icon">🏞</span>
            <span className="asset-row-label">场景</span>
            <span className={`asset-row-names ${!getSceneName() ? 'empty' : ''}`}>{getSceneName() || '未选择'}</span>
          </div>
          <div className="asset-row">
            <span className="asset-row-icon">🎭</span>
            <span className="asset-row-label">道具</span>
            <span className={`asset-row-names ${!getPropNames() ? 'empty' : ''}`}>{getPropNames() || '未选择'}</span>
          </div>
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
const ClipEditor = ({ asset, onUpdate, onDelete, saveStatus }) => {
  // 裁剪状态 - 初始化自 asset
  const [startTime, setStartTime] = useState(asset.startTime || 0);
  const [endTime, setEndTime] = useState(asset.endTime || 5);

  // 获取总时长
  const totalDuration = asset.duration || 5;
  const clipDuration = endTime - startTime;

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
        {saveStatus !== 'idle' && (
          <span className="save-status">{saveStatus === 'saving' ? '保存中...' : '已保存'}</span>
        )}
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
