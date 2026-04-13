import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { uiLogger } from '../../utils/logger';
import './VideoEditor.css';

const VideoEditor = ({ isOpen, onClose, projectId, onExport, videos = [] }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWebCutReady, setIsWebCutReady] = useState(false);

  // 默认视频数据
  const defaultVideos = [
    {
      id: 'video-1',
      name: '镜头1 - 城市夜景',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop',
      duration: 10
    },
    {
      id: 'video-2',
      name: '镜头2 - 人物特写',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      duration: 8
    },
    {
      id: 'video-3',
      name: '镜头3 - 动作场景',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop',
      duration: 12
    }
  ];

  const videoList = videos.length > 0 ? videos : defaultVideos;

  // 加载 WebCut Web Components
  useEffect(() => {
    if (!isOpen) return;

    const loadWebCut = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 检查是否已经加载过 WebCut
        if (!window.webcutLoaded) {
          uiLogger.debug('[VideoEditor] 开始加载 WebCut...');
          
          // 加载 CSS
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/webcut@0.2.9/webcomponents/bundle/style.css';
          document.head.appendChild(link);
          uiLogger.debug('[VideoEditor] CSS 已加载');

          // 加载 JS - 直接加载脚本
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://unpkg.com/webcut@0.2.9/webcomponents/bundle/index.js';
            script.onload = () => {
              uiLogger.debug('[VideoEditor] WebCut 脚本加载完成');
              resolve();
            };
            script.onerror = (e) => {
              uiLogger.error('[VideoEditor] WebCut 脚本加载失败', e);
              reject(e);
            };
            document.head.appendChild(script);
          });
          
          // 等待 WebCut 组件注册
          await new Promise((resolve) => {
            const checkWebCut = () => {
              if (customElements.get('webcut-editor')) {
                uiLogger.debug('[VideoEditor] WebCut 组件已注册');
                resolve();
              } else {
                uiLogger.debug('[VideoEditor] 等待 WebCut 组件注册...');
                setTimeout(checkWebCut, 100);
              }
            };
            checkWebCut();
          });
          
          window.webcutLoaded = true;
        }
        
        setIsWebCutReady(true);
        setIsLoading(false);
      } catch (err) {
        uiLogger.error('[VideoEditor] 加载 WebCut 失败:', err);
        setError('加载视频编辑器失败: ' + err.message);
        setIsLoading(false);
      }
    };

    loadWebCut();
  }, [isOpen]);

  // 创建 WebCut 编辑器
  useEffect(() => {
    if (!isOpen || isLoading || !isWebCutReady || !containerRef.current) return;

    uiLogger.debug('[VideoEditor] 创建 WebCut 编辑器', { videoCount: videoList.length });

    try {
      // 清空容器
      containerRef.current.innerHTML = '';

      // 准备项目数据
      const projectData = {
        id: projectId || `project-${Date.now()}`,
        name: '视频剪辑项目',
        videos: videoList.map(v => ({
          id: v.id || `video-${Date.now()}-${Math.random()}`,
          name: v.name || '未命名视频',
          url: v.url,
          thumbnail: v.thumbnail,
          duration: v.duration || 10
        })),
        timeline: {
          tracks: [
            {
              id: 'track-1',
              name: '主轨道',
              type: 'video',
              clips: videoList.map((v, index) => ({
                id: `clip-${index}`,
                videoId: v.id,
                startTime: index * 5,
                duration: v.duration || 5,
                offset: 0
              }))
            }
          ]
        }
      };

      uiLogger.debug('[VideoEditor] 项目数据:', projectData);

      // 创建 WebCut 编辑器元素
      const editor = document.createElement('webcut-editor');
      
      // 在添加到 DOM 之前设置所有属性
      editor.setAttribute('project-id', projectData.id);
      editor.project = projectData;
      editor.style.width = '100%';
      editor.style.height = '100%';
      
      // 监听事件
      editor.addEventListener('export', (e) => {
        uiLogger.debug('[VideoEditor] 导出视频:', e.detail);
        onExport?.(e.detail);
      });
      
      editor.addEventListener('error', (e) => {
        uiLogger.error('[VideoEditor] WebCut 错误:', e.detail);
      });

      // 添加到容器
      containerRef.current.appendChild(editor);
      editorRef.current = editor;
      
      uiLogger.debug('[VideoEditor] WebCut 编辑器已添加到 DOM');

      // 返回清理函数
      return () => {
        try {
          if (editorRef.current) {
            editorRef.current.removeEventListener('export', onExport);
            editorRef.current.removeEventListener('error', () => {});
            editorRef.current = null;
          }
        } catch (e) {
          // 忽略清理错误
        }
      };

    } catch (err) {
      uiLogger.error('[VideoEditor] 创建编辑器失败:', err);
      setError('创建编辑器失败: ' + err.message);
    }

  }, [isOpen, isLoading, isWebCutReady, projectId, videoList, onExport]);

  // 处理关闭
  const handleClose = () => {
    // 延迟关闭，让 WebCut 有机会清理
    setTimeout(() => {
      onClose();
    }, 100);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="video-editor-overlay">
      <div className="video-editor-container">
        <div className="video-editor-header">
          <h2>视频剪辑 - WebCut ({videoList.length} 个视频)</h2>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="video-editor-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>正在加载 WebCut 视频编辑器...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>重试</button>
            </div>
          ) : (
            <div ref={containerRef} className="webcut-container">
              {/* WebCut 编辑器将在这里渲染 */}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default VideoEditor;
