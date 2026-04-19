import { useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, Plus, Film, Trash2, Play, Download, Pause, Scissors } from 'lucide-react';
import { toast } from '../Toast/Toast';
import StageNavigation from './StageNavigation';
import AssetGrid from './AssetGrid';
import AssetDetailPanel from './AssetDetailPanel';
import EmptyGuide from './EmptyGuide';
import ScriptParser from './ScriptParser';
import ScriptAssistantPanel from './ScriptAssistantPanel';
import AssetAIDialog from './AssetAIDialog';
import ImpactToast from './ImpactToast';
import UploadModal from './UploadModal';
import { useStageStore, STAGES } from '../../stores/stageStore';
import { useChatStore } from '../../stores/chatStore';
import { ASSISTANT_AGENT_ID } from '../../constants/ComponentType';
import './StoryboardMainView.css';

// 剧本助手专用 agent ID（固定为 3）
const SCRIPT_AGENT_ID = 3;

// 格式化时间显示 (秒 -> MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化时间码显示 (秒 -> HH:MM:SS:FF)
const formatTimecode = (seconds, fps = 30) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

// 解析时间码为秒
const parseTimecode = (timecode) => {
  const parts = timecode.split(':').map(Number);
  if (parts.length === 4) {
    const [h, m, s, f] = parts;
    return h * 3600 + m * 60 + s + f / 30;
  } else if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return null;
};

/**
 * StoryboardMainView - 故事板主视图
 *
 * PRD 2.0 的核心组件，整合阶段导航、资产网格、详情面板
 */
const StoryboardMainView = () => {
  // T050: 剧本解析相关状态
  const [showScriptParser, setShowScriptParser] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  // T072: 资产修改影响提示状态
  const [impactToast, setImpactToast] = useState(null);
  const [pendingAssetUpdate, setPendingAssetUpdate] = useState(null);

  // T058: 上传弹窗状态
  const [uploadModal, setUploadModal] = useState({ isOpen: false, accept: 'image' });

  // P1: 右键菜单状态
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, asset: null });

  // 剧本助手面板状态
  const [scriptAssistantOpen, setScriptAssistantOpen] = useState(false);

  // AI 对话面板状态 - 按阶段独立存储
  const [aiDialogs, setAiDialogs] = useState({
    [STAGES.CHARACTER]: { isOpen: false, asset: null, messages: [] },
    [STAGES.SCENE]: { isOpen: false, asset: null, messages: [] },
    [STAGES.PROP]: { isOpen: false, asset: null, messages: [] },
  });

  const {
    currentStage,
    stageAssets,
    selectedAssetIds,
    setCurrentStage,
    setStageAssets,
    selectAsset,
    addStageAsset,
    updateStageAsset,
    deleteStageAsset,
    getSelectedAsset,
    isProjectEmpty,
    importParseResult,
    getImpactedStoryboards,
  } = useStageStore();

  // 获取当前阶段的资产
  const currentAssets = stageAssets[currentStage] || [];
  const selectedAsset = getSelectedAsset();

  // 检查项目是否为空
  const projectIsEmpty = isProjectEmpty();

  // T057: 剪辑阶段相关状态
  const [clipCurrentTime, setClipCurrentTime] = useState(0);
  const [clipIsPlaying, setClipIsPlaying] = useState(false);
  const [clipZoom, setClipZoom] = useState(1);
  const [clipAssets, setClipAssets] = useState([]);
  const [draggedClipId, setDraggedClipId] = useState(null);
  const [trimState, setTrimState] = useState({ clipId: null, edge: null, startX: 0 });
  const clipVideoRef = useRef(null);

  // 获取 chatStore 的 context 切换函数
  const { switchContext } = useChatStore();

  // T057: 初始化剪辑资产（从VIDEO阶段导入或使用模拟数据）
  useEffect(() => {
    if (currentStage === STAGES.CLIP) {
      const videoAssets = stageAssets[STAGES.VIDEO] || [];
      if (videoAssets.length > 0) {
        // 从视频阶段导入
        const imported = videoAssets.map((v, i) => ({
          ...v,
          id: `clip-${v.id}`,
          name: v.name || `片段${i + 1}`,
          order: i + 1,
          startTime: 0,
          endTime: v.duration || 5,
          clipStartTime: 0,
          clipEndTime: v.duration || 5,
        }));
        setClipAssets(imported);
      } else if (clipAssets.length === 0) {
        // 使用模拟数据
        setClipAssets([
          { id: 'clip-1', name: '开场镜头', order: 1, duration: 5, startTime: 0, endTime: 5, clipStartTime: 0, clipEndTime: 5, thumbnail: 'https://picsum.photos/seed/clip1/320/180', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { id: 'clip-2', name: '咖啡馆内景', order: 2, duration: 8, startTime: 0, endTime: 8, clipStartTime: 0, clipEndTime: 8, thumbnail: 'https://picsum.photos/seed/clip2/320/180', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { id: 'clip-3', name: '对话场景', order: 3, duration: 12, startTime: 0, endTime: 12, clipStartTime: 0, clipEndTime: 12, thumbnail: 'https://picsum.photos/seed/clip3/320/180', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        ]);
      }
    }
  }, [currentStage, stageAssets]);

  // P0: 监听导出事件（来自 TopBar）
  useEffect(() => {
    const handleExportVideosEvent = async () => {
      // 从 store 获取当前视频资产
      const { stageAssets: assets } = useStageStore.getState();
      const videos = (assets[STAGES.VIDEO] || []).filter(a => a.videoUrl);
      if (videos.length === 0) {
        toast?.warning?.('暂无可导出的视频');
        return;
      }

      toast?.info?.(`正在导出 ${videos.length} 个视频...`);
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const folder = zip.folder('videos');

        await Promise.all(videos.map(async (video, index) => {
          try {
            const response = await fetch(video.videoUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${video.videoUrl}`);
            const blob = await response.blob();
            const extension = video.videoUrl.split('.').pop() || 'mp4';
            const filename = `${video.name || `video_${index + 1}`}.${extension}`;
            folder.file(filename, blob);
          } catch (error) {
            console.error(`Failed to add ${video.name}:`, error);
          }
        }));

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `videos_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast?.success?.(`已导出 ${videos.length} 个视频`);
      } catch (error) {
        console.error('导出失败:', error);
        toast?.error?.('导出失败，请重试');
      }
    };

    const handleExportStoryboardEvent = () => {
      // 从 store 获取分镜数据
      const { stageAssets: assets } = useStageStore.getState();
      const storyboards = assets[STAGES.STORYBOARD] || [];
      if (storyboards.length === 0) {
        toast?.warning?.('暂无可导出的分镜');
        return;
      }
      const exportData = {
        exportTime: new Date().toISOString(),
        stage: STAGES.STORYBOARD,
        assets: storyboards,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storyboard_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast?.success?.(`已导出 ${storyboards.length} 个分镜`);
    };

    document.addEventListener('exportVideos', handleExportVideosEvent);
    document.addEventListener('exportStoryboard', handleExportStoryboardEvent);

    return () => {
      document.removeEventListener('exportVideos', handleExportVideosEvent);
      document.removeEventListener('exportStoryboard', handleExportStoryboardEvent);
    };
  }, []);

  // 处理 EmptyGuide 完成
  const handleEmptyGuideComplete = useCallback(() => {
    // 从空白开始后，切换到剧本阶段
    setCurrentStage(STAGES.SCRIPT);
  }, [setCurrentStage]);

  // 处理资产选择 - 同时切换聊天上下文
  const handleSelectAsset = useCallback((asset) => {
    selectAsset(asset.id);

    // 如果 AI 对话已打开，更新对话资产并开启新会话
    const currentDialog = aiDialogs[currentStage];
    if (currentDialog?.isOpen && currentDialog?.asset?.id !== asset.id) {
      setAiDialogs(prev => ({
        ...prev,
        [currentStage]: {
          ...prev[currentStage],
          asset,
          messages: [] // 切换资产开启新对话
        }
      }));
    }

    // 切换聊天上下文到该资产
    if (asset) {
      switchContext('asset', asset.id, asset.name);
    }
  }, [selectAsset, switchContext, aiDialogs, currentStage]);

  // 处理添加新资产
  const handleAddNew = useCallback(() => {
    const newAsset = {
      id: `${currentStage}-${Date.now()}`,
      type: currentStage,
      name: `新${currentStage === STAGES.STORYBOARD ? '镜头' : '资产'}`,
      description: '',
      prompt: '',
      thumbnail: null,
    };
    addStageAsset(currentStage, newAsset);
    selectAsset(newAsset.id);
  }, [currentStage, addStageAsset, selectAsset]);

  // T072: 处理资产更新并检查影响
  const handleUpdateAsset = useCallback((assetId, updates) => {
    // 先获取受影响分镜（在更新前）
    const impacted = getImpactedStoryboards(assetId);

    // 执行更新
    updateStageAsset(currentStage, assetId, updates);

    // T072: 如果有受影响分镜，显示提示
    if (impacted.length > 0) {
      const asset = stageAssets[currentStage]?.find(a => a.id === assetId);
      setImpactToast({
        assetName: asset?.name || '该资产',
        assetId,
        impactedStoryboards: impacted,
      });
    }
  }, [currentStage, updateStageAsset, getImpactedStoryboards, stageAssets]);

  // 处理资产删除
  const handleDeleteAsset = useCallback((assetId) => {
    if (window.confirm('确定要删除这个资产吗？')) {
      deleteStageAsset(currentStage, assetId);
    }
  }, [currentStage, deleteStageAsset]);

  // 处理生成（图片/视频）
  const handleGenerate = useCallback((assetId, type = 'image') => {
    console.log(`生成 ${type} for asset ${assetId}`);
    // TODO: 调用 AI 生成接口
    updateStageAsset(currentStage, assetId, {
      status: 'running',
      thumbnail: type === 'video' ? null : `https://picsum.photos/seed/${assetId}/400/225`,
      videoUrl: type === 'video' ? `https://example.com/video/${assetId}.mp4` : null,
    });
    // 模拟生成完成
    setTimeout(() => {
      updateStageAsset(currentStage, assetId, {
        status: 'synced',
      });
    }, 2000);
  }, [currentStage, updateStageAsset]);

  // P1: 批量生成 - 为当前阶段所有资产生成
  const handleBatchGenerate = useCallback(() => {
    if (currentAssets.length === 0) {
      toast?.warning?.('没有可生成的资产');
      return;
    }

    toast?.info?.(`正在批量生成 ${currentAssets.length} 个资产...`);

    // 为每个资产触发生成
    currentAssets.forEach((asset, index) => {
      setTimeout(() => {
        handleGenerate(asset.id, 'image');
      }, index * 500); // 间隔 500ms 避免请求过于密集
    });

    toast?.success?.(`已触发 ${currentAssets.length} 个资产生成`);
  }, [currentAssets, handleGenerate]);

  // AI 对话
  const handleAIDialog = useCallback((assetId) => {
    const asset = stageAssets[currentStage]?.find(a => a.id === assetId);
    if (asset) {
      setAiDialogs(prev => {
        const currentDialog = prev[currentStage];
        // 如果是同一个资产，保持对话；如果是不同资产，开启新对话
        const isSameAsset = currentDialog?.asset?.id === assetId;
        return {
          ...prev,
          [currentStage]: {
            isOpen: true,
            asset,
            messages: isSameAsset ? (currentDialog?.messages || []) : []
          }
        };
      });
    }
  }, [stageAssets, currentStage]);

  // 关闭 AI 对话（保留 asset 和消息）
  const handleCloseAIDialog = useCallback(() => {
    setAiDialogs(prev => ({
      ...prev,
      [currentStage]: { ...prev[currentStage], isOpen: false }
    }));
  }, [currentStage]);

  // 更新 AI 对话消息
  const handleAIMessagesChange = useCallback((newMessages) => {
    setAiDialogs(prev => ({
      ...prev,
      [currentStage]: { ...prev[currentStage], messages: newMessages }
    }));
  }, [currentStage]);

  // P1: 右键菜单
  const handleContextMenu = useCallback((e, asset) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, asset });
  }, []);

  // P1: 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, asset: null });
  }, []);

  // P1: 点击其他地方关闭右键菜单
  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleClick = () => closeContextMenu();
    // 延迟添加监听，避免触发当前的右键点击
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu.visible, closeContextMenu]);

  // P1: 右键菜单操作
  const handleContextMenuAction = useCallback((action) => {
    const { asset } = contextMenu;
    if (!asset) return;

    switch (action) {
      case 'edit':
        selectAsset(asset.id);
        break;
      case 'delete':
        if (window.confirm(`确定要删除 "${asset.name}" 吗？`)) {
          deleteStageAsset(currentStage, asset.id);
        }
        break;
      case 'duplicate':
        const newAsset = {
          ...asset,
          id: `${currentStage}-${Date.now()}`,
          name: `${asset.name} (副本)`,
        };
        addStageAsset(currentStage, newAsset);
        toast?.success?.(`已复制 "${asset.name}"`);
        break;
      case 'generate':
        handleGenerate(asset.id, 'image');
        break;
      case 'generateVideo':
        handleGenerate(asset.id, 'video');
        break;
      default:
        break;
    }
    closeContextMenu();
  }, [contextMenu, currentStage, deleteStageAsset, addStageAsset, selectAsset, handleGenerate, closeContextMenu]);

  // T058: 处理打开上传弹窗
  const handleOpenUpload = useCallback(() => {
    setUploadModal({ isOpen: true, accept: 'image' });
  }, []);

  // T058/T062: 处理实际上传
  // options: { enableAI: boolean }
  const handleUpload = useCallback(async (file, options = {}) => {
    console.log('上传文件:', file.name, '选项:', options);

    const { enableAI = false } = options;
    const newAssetId = `${currentStage}-${Date.now()}`;

    // 创建新资产
    const newAsset = {
      id: newAssetId,
      type: currentStage,
      name: file.name.replace(/\.[^/.]+$/, ''), // 去掉扩展名作为初始名称
      description: '',
      prompt: '',
      thumbnail: null, // TODO: 实际上传后获取真实 URL
      status: enableAI ? 'pending' : 'synced', // pending=骨架屏, synced=有内容
      // T062: AI 处理相关字段
      aiProcessed: enableAI,
    };

    // 添加到阶段资产
    addStageAsset(currentStage, newAsset);
    selectAsset(newAssetId);

    if (enableAI) {
      toast?.success?.(`已上传 ${file.name}，AI 解析中...`);

      // 关闭上传弹窗
      setUploadModal({ isOpen: false, accept: 'image' });

      // TODO: 调用实际的 AI 图片解析 API
      // AI 解析接口: parseImageAsset(file, currentStage)
      // 返回: { name, description, prompt, thumbnail? }

      // 模拟 AI 解析（1.5秒后更新资产）
      setTimeout(() => {
        // 模拟解析结果
        const parsedDescriptions = {
          [STAGES.CHARACTER]: '红发女黑客，智能机械义肢，赛博朋克风格服装，眼神坚定而锐利',
          [STAGES.SCENE]: '高科技数据中心，蓝色全息显示屏，悬浮操作界面，霓虹灯光效果',
          [STAGES.PROP]: '便携式黑客终端，透明全息投影，集成神经网络接口',
        };

        const parsedNames = {
          [STAGES.CHARACTER]: file.name.replace(/\.[^/.]+$/, ''),
          [STAGES.SCENE]: '赛博城市夜景',
          [STAGES.PROP]: '黑客终端设备',
        };

        // 更新资产状态为 running（生成中）
        updateStageAsset(currentStage, newAssetId, {
          status: 'running',
          description: parsedDescriptions[currentStage] || 'AI 解析完成',
          name: parsedNames[currentStage] || file.name.replace(/\.[^/.]+$/, ''),
        });

        // 再过 2 秒完成生成
        setTimeout(() => {
          updateStageAsset(currentStage, newAssetId, {
            status: 'synced',
          });
          toast?.success?.(`AI 解析完成！`);
        }, 2000);
      }, 1500);
    } else {
      toast?.success?.(`已上传 ${file.name}`);
      setUploadModal({ isOpen: false, accept: 'image' });
    }
  }, [currentStage, addStageAsset, selectAsset, updateStageAsset]);

  // T058/T062: 处理 AI 生成主题
  const handleAIGenerate = useCallback((topic) => {
    console.log('AI 生成主题:', topic);

    // 创建新资产
    const newAsset = {
      id: `${currentStage}-${Date.now()}`,
      type: currentStage,
      name: topic.substring(0, 20), // 截取前20字符作为名称
      description: '',
      prompt: topic,
      thumbnail: null,
      // T062: AI 处理相关字段
      aiProcessed: true,
      aiDescription: `AI 根据 "${topic}" 生成的资产`,
    };

    // 添加到阶段资产
    addStageAsset(currentStage, newAsset);
    selectAsset(newAsset.id);

    toast?.info?.(`正在生成 "${topic}"...`);
    setUploadModal({ isOpen: false, accept: 'image' });
  }, [currentStage, addStageAsset, selectAsset]);

  // T072: 处理重新生成受影响分镜
  const handleRegenerateImpacted = useCallback(() => {
    if (!impactToast) return;

    // 对每个受影响分镜触发重新生成
    impactToast.impactedStoryboards.forEach(storyboard => {
      handleGenerate(storyboard.id, 'image');
    });

    toast?.success?.(`已重新生成 ${impactToast.impactedStoryboards.length} 个分镜`);
    setImpactToast(null);
  }, [impactToast, handleGenerate]);

  // T072: 处理忽略提示
  const handleDismissImpact = useCallback(() => {
    setImpactToast(null);
  }, []);

  // T050: 处理 AI 解析剧本
  const handleAIParse = useCallback(async () => {
    setIsParsing(true);
    try {
      // TODO: 调用实际的 AI 解析接口
      // 模拟解析结果
      await new Promise(resolve => setTimeout(resolve, 1500));

      const scriptContent = currentAssets[0]?.content || '';
      // 简单的关键词匹配模拟解析
      const mockParseResult = {
        characters: [
          { id: 'parsed-char-1', name: '零', description: '红发女黑客，主角' },
          { id: 'parsed-char-2', name: '安保人员A', description: '男性安保人员' },
          { id: 'parsed-char-3', name: 'AI管理员', description: '数据中心中控AI' },
        ],
        scenes: [
          { id: 'parsed-scene-1', name: '数据中心', description: '高科技数据中心场景' },
          { id: 'parsed-scene-2', name: '霓虹雨夜街道', description: '赛博朋克风格雨夜街道' },
        ],
        props: [
          { id: 'parsed-prop-1', name: '黑客终端', description: '便携式黑客设备' },
          { id: 'parsed-prop-2', name: '干扰器', description: '电磁脉冲干扰装置' },
        ],
      };

      setParseResult(mockParseResult);
      setShowScriptParser(true);
    } catch (error) {
      console.error('解析失败:', error);
      alert('剧本解析失败，请重试');
    } finally {
      setIsParsing(false);
    }
  }, [currentAssets]);

  // T050: 处理解析结果确认导入
  const handleParseConfirm = useCallback((importData) => {
    importParseResult(importData);
    setShowScriptParser(false);
    setParseResult(null);
    // 切换到角色阶段查看导入结果
    setCurrentStage(STAGES.CHARACTER);
  }, [importParseResult, setCurrentStage]);

  // T050: 处理重新解析
  const handleParseRetry = useCallback(() => {
    setShowScriptParser(false);
    setParseResult(null);
    handleAIParse();
  }, [handleAIParse]);

  // T054: 处理 AI 生成分镜
  const handleAIGenerateStoryboard = useCallback(async () => {
    setIsParsing(true);
    try {
      // TODO: 调用实际的 AI 分镜生成接口
      // 模拟生成
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 基于现有角色和场景生成分镜
      const characters = stageAssets[STAGES.CHARACTER] || [];
      const scenes = stageAssets[STAGES.SCENE] || [];

      // 生成 3 个示例镜头
      const newShots = [];
      for (let i = 0; i < 3; i++) {
        newShots.push({
          id: `shot-gen-${Date.now()}-${i}`,
          type: STAGES.STORYBOARD,
          name: `镜头 ${i + 1}`,
          description: `自动生成的分镜描述 ${i + 1}`,
          thumbnail: `https://picsum.photos/seed/shot${Date.now()}${i}/400/225`,
          duration: 5 + i * 2,
          status: 'pending',
          characterIds: characters.slice(0, 1).map(c => c.id),
          sceneId: scenes[i % scenes.length]?.id || null,
          shotType: 'medium',
          cameraMovement: 'static',
          prompt: `A cinematic shot of ${characters[0]?.name || 'character'} in ${scenes[0]?.name || 'scene'}`,
        });
      }

      // 添加到分镜阶段
      newShots.forEach(shot => {
        addStageAsset(STAGES.STORYBOARD, shot);
      });

      toast?.success?.(`已生成 ${newShots.length} 个分镜`);
    } catch (error) {
      console.error('生成分镜失败:', error);
      alert('生成分镜失败，请重试');
    } finally {
      setIsParsing(false);
    }
  }, [stageAssets, addStageAsset]);

  // T055: 处理阶段导航的 AI 生成按钮
  const handleStageAIGenerate = useCallback((stage) => {
    console.log('StageNavigation AI 生成:', stage);

    switch (stage) {
      case STAGES.SCRIPT:
        // 剧本阶段：提示功能开发中，或调用剧本生成接口
        toast?.info?.('剧本生成功能开发中，敬请期待');
        break;
      case STAGES.CHARACTER:
      case STAGES.SCENE:
      case STAGES.PROP:
        // 这三个阶段都是 AI 解析生成
        handleAIParse();
        break;
      case STAGES.STORYBOARD:
        // 分镜阶段
        handleAIGenerateStoryboard();
        break;
      case STAGES.VIDEO:
        // 视频阶段：为所有分镜生成视频
        toast?.info?.('正在生成视频...');
        // 模拟视频生成
        const storyboards = stageAssets[STAGES.STORYBOARD] || [];
        storyboards.forEach((sb, i) => {
          setTimeout(() => {
            updateStageAsset(STAGES.VIDEO, sb.id, {
              videoUrl: `https://example.com/video/${sb.id}.mp4`,
              status: 'synced',
            });
          }, i * 500);
        });
        toast?.success?.(`已触发 ${storyboards.length} 个视频生成`);
        break;
      default:
        toast?.warning?.('该阶段暂不支持 AI 生成');
    }
  }, [handleAIParse, handleAIGenerateStoryboard, stageAssets, updateStageAsset]);

  // T057: 剪辑阶段辅助函数
  const totalDuration = clipAssets.reduce((sum, clip) => sum + (clip.endTime - clip.startTime), 0) || 1;

  const currentClipIndex = (() => {
    let acc = 0;
    for (let i = 0; i < clipAssets.length; i++) {
      const clipDur = clipAssets[i].endTime - clipAssets[i].startTime;
      if (acc + clipDur > clipCurrentTime) return i;
      acc += clipDur;
    }
    return clipAssets.length - 1;
  })();

  const handleTimeUpdate = (e) => {
    setClipCurrentTime(e.target.currentTime);
  };

  const seekTo = (time) => {
    if (clipVideoRef.current) {
      clipVideoRef.current.currentTime = time;
      setClipCurrentTime(time);
    }
  };

  const handleSplitAtPlayhead = () => {
    if (clipAssets.length === 0) return;
    const splitTime = clipCurrentTime;
    let acc = 0;
    for (let i = 0; i < clipAssets.length; i++) {
      const clip = clipAssets[i];
      const clipDur = clip.endTime - clip.startTime;
      if (acc + clipDur > splitTime && splitTime > acc) {
        const splitPoint = splitTime - acc;
        const clipStart = clip.startTime;
        const clipEnd = clip.endTime;
        const newClip1 = { ...clip, id: `${clip.id}-a`, endTime: clipStart + splitPoint };
        const newClip2 = { ...clip, id: `${clip.id}-b`, startTime: clipStart + splitPoint, name: clip.name + ' (2)' };
        const newClips = [...clipAssets.slice(0, i), newClip1, newClip2, ...clipAssets.slice(i + 1)];
        setClipAssets(newClips);
        toast?.success?.(`在 ${splitTime.toFixed(2)}s 处切割成功`);
        return;
      }
      acc += clipDur;
    }
    toast?.info?.('请将播放头移动到片段上再切割');
  };

  const togglePlay = () => {
    if (clipVideoRef.current) {
      if (clipIsPlaying) {
        clipVideoRef.current.pause();
      } else {
        clipVideoRef.current.play();
      }
      setClipIsPlaying(!clipIsPlaying);
    }
  };

  const handleClipSelect = (clipId) => {
    selectAsset(clipId);
    let acc = 0;
    for (const clip of clipAssets) {
      if (clip.id === clipId) {
        seekTo(acc);
        break;
      }
      acc += clip.endTime - clip.startTime;
    }
  };

  const handleDeleteClip = (clipId) => {
    setClipAssets(prev => prev.filter(c => c.id !== clipId));
    toast?.info?.('已删除片段');
  };

  const handleDragStart = (e, clipId) => {
    setDraggedClipId(clipId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedClipId(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedClipId) return;
    const draggedIndex = clipAssets.findIndex(c => c.id === draggedClipId);
    if (draggedIndex === targetIndex) return;
    const newClips = [...clipAssets];
    const [draggedClip] = newClips.splice(draggedIndex, 1);
    newClips.splice(targetIndex, 0, draggedClip);
    setClipAssets(newClips);
    setDraggedClipId(null);
  };

  const handleClipDoubleClick = (e, clip) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const splitOffset = (clip.endTime - clip.startTime) * clickRatio;
    const splitTime = clip.startTime + splitOffset;
    let offset = 0;
    for (let i = 0; i < clipAssets.length; i++) {
      if (clipAssets[i].id === clip.id) {
        const timelineSplitTime = offset + splitOffset;
        const newClip1 = { ...clip, id: `${clip.id}-a`, endTime: splitTime };
        const newClip2 = { ...clip, id: `${clip.id}-b`, startTime: splitTime, name: clip.name + ' (2)', thumbnail: clip.thumbnail };
        const newClips = [...clipAssets.slice(0, i), newClip1, newClip2, ...clipAssets.slice(i + 1)];
        setClipAssets(newClips);
        toast?.success?.(`在 ${splitTime.toFixed(1)}s 处切割`);
        return;
      }
      offset += clipAssets[i].endTime - clipAssets[i].startTime;
    }
  };

  const handleTrimDrag = (e, clipId, edge) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startTrimState = { clipId, edge, startX };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const trackWidth = 800;
      const pixelsPerSecond = trackWidth / totalDuration;
      const deltaTime = deltaX / pixelsPerSecond / clipZoom;

      setClipAssets(prev => prev.map(clip => {
        if (clip.id !== clipId) return clip;
        if (edge === 'left') {
          const newStartTime = Math.max(0, Math.min(clip.endTime - 0.5, clip.startTime + deltaTime));
          return { ...clip, startTime: newStartTime };
        } else {
          const newEndTime = Math.max(clip.startTime + 0.5, Math.min(clip.duration || 30, clip.endTime + deltaTime));
          return { ...clip, endTime: newEndTime };
        }
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setTrimState({ clipId: null, edge: null, startX: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    setTrimState(startTrimState);
  };

  // T057: 处理批量导出视频
  const handleExportVideos = useCallback(async () => {
    const videos = currentAssets.filter(a => a.videoUrl);
    if (videos.length === 0) {
      toast?.warning?.('暂无可导出的视频');
      return;
    }

    toast?.info?.(`正在导出 ${videos.length} 个视频...`);

    try {
      // 动态导入 JSZip（延迟加载，减少初始包大小）
      const JSZip = (await import('jszip')).default;

      const zip = new JSZip();
      const folder = zip.folder('videos');

      // 获取每个视频并添加到 ZIP
      const videoPromises = videos.map(async (video, index) => {
        try {
          const response = await fetch(video.videoUrl);
          if (!response.ok) throw new Error(`Failed to fetch ${video.videoUrl}`);

          const blob = await response.blob();
          const extension = video.videoUrl.split('.').pop() || 'mp4';
          const filename = `${video.name || `video_${index + 1}`}.${extension}`;

          folder.file(filename, blob);
        } catch (error) {
          console.error(`Failed to add ${video.name}:`, error);
          // 即使单个失败也继续处理其他的
        }
      });

      await Promise.all(videoPromises);

      // 生成 ZIP 文件并触发下载
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `videos_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast?.success?.(`已导出 ${videos.length} 个视频`);
    } catch (error) {
      console.error('导出失败:', error);
      toast?.error?.('导出失败，请重试');
    }
  }, [currentAssets]);

  // 项目为空时显示 EmptyGuide（新项目默认进入剧本阶段）
  if (projectIsEmpty) {
    return (
      <div className="storyboard-main">
        <StageNavigation />
        <div className="storyboard-content">
          <EmptyGuide onComplete={handleEmptyGuideComplete} />
        </div>
      </div>
    );
  }

  // 剧本阶段特殊处理
  if (currentStage === STAGES.SCRIPT) {
    const scriptAsset = currentAssets[0];
    const isScriptEmpty = !scriptAsset?.content;

    // 剧本助手面板回调
    const handleScriptAccept = (content) => {
      handleUpdateAsset(scriptAsset?.id || 'script-main', { content });
      setScriptAssistantOpen(false);
    };

    const handleScriptReject = () => {
      // 拒绝后可以继续对话，不需要关闭面板
    };

    return (
      <div className="storyboard-main">
        <StageNavigation />
        <div className="script-stage-layout">
          {/* 左侧主区域 70% */}
          <div className="script-main-area">
            {/* 剧本引导提示 - 仅内容为空时显示 */}
            {isScriptEmpty && (
              <motion.div
                className="script-guidance"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="guidance-icon">💡</div>
                <div className="guidance-text">
                  <strong>开始创作你的剧本</strong>
                  <p>在下方编辑剧本，或让AI帮你生成 / 提取素材</p>
                </div>
              </motion.div>
            )}

            <AssetDetailPanel
              asset={currentAssets[0] || {
                id: 'script-main',
                type: STAGES.SCRIPT,
                name: '剧本',
                content: '',
              }}
              onUpdate={handleUpdateAsset}
            />

            {/* 底部按钮栏 */}
            <div className="script-bottom-actions">
              <div className="left-actions">
                <button
                  className="action-btn"
                  onClick={() => setScriptAssistantOpen(true)}
                  disabled={isScriptEmpty}
                >
                  <FileText size={16} className="icon" />
                  生成目录
                </button>
                <button
                  className="action-btn"
                  onClick={handleAIParse}
                  disabled={isScriptEmpty || isParsing}
                >
                  <Sparkles size={16} className="icon" />
                  {isParsing ? '提取中...' : 'AI提取素材'}
                </button>
              </div>
              <div className="right-actions">
                <button
                  className="action-btn primary"
                  onClick={() => setScriptAssistantOpen(true)}
                >
                  <Sparkles size={16} className="icon" />
                  AI生成剧本
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleUpdateAsset(scriptAsset?.id, { content: scriptAsset?.content })}
                  disabled={!scriptAsset?.content}
                >
                  保存
                </button>
              </div>
            </div>
          </div>

          {/* 右侧助手面板 30% */}
          <AnimatePresence>
            {scriptAssistantOpen && (
              <div className="script-assistant-area">
                <ScriptAssistantPanel
                  isOpen={scriptAssistantOpen}
                  onClose={() => setScriptAssistantOpen(false)}
                  onAccept={handleScriptAccept}
                  onReject={handleScriptReject}
                  scriptContent={scriptAsset?.content || ''}
                  agentId={SCRIPT_AGENT_ID}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* T050: 剧本解析结果弹窗 */}
        <ScriptParser
          isOpen={showScriptParser}
          parseResult={parseResult}
          onConfirm={handleParseConfirm}
          onCancel={() => setShowScriptParser(false)}
          onRetry={handleParseRetry}
        />
      </div>
    );
  }

  // T054: 分镜阶段特殊处理 - 显示 AI 生成分镜按钮
  if (currentStage === STAGES.STORYBOARD) {
    return (
      <div className="storyboard-main">
        <StageNavigation />
        <div className="storyboard-content storyboard-stage-content">
          {/* AI 生成分镜按钮 */}
          <div className="stage-action-bar">
            <motion.button
              className="ai-generate-btn"
              onClick={handleAIGenerateStoryboard}
              disabled={isParsing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={16} />
              {isParsing ? '生成中...' : 'AI 生成分镜'}
            </motion.button>
          </div>

          <div className="storyboard-split-view">
            {/* 左侧：资产网格 */}
            <aside className="assets-panel">
              <AssetGrid
                assets={currentAssets}
                stage={currentStage}
                selectedId={selectedAssetIds[currentStage]}
                onSelect={handleSelectAsset}
                onContextMenu={handleContextMenu}
                onAddNew={handleAddNew}
                onUpload={handleOpenUpload}
                onBatchGenerate={handleBatchGenerate}
              />
            </aside>

            {/* 右侧：详情面板 - 仅当选中资产时渲染 */}
            {selectedAsset && (
              <section className="detail-panel">
                <AssetDetailPanel
                  asset={selectedAsset}
                  onUpdate={handleUpdateAsset}
                  onDelete={handleDeleteAsset}
                  onGenerate={handleGenerate}
                  onAIDialog={handleAIDialog}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  // T057: 视频阶段特殊处理 - 显示导出按钮
  if (currentStage === STAGES.VIDEO) {
    return (
      <div className="storyboard-main">
        <StageNavigation />
        <div className="storyboard-content storyboard-stage-content">
          {/* 导出按钮 */}
          <div className="stage-action-bar">
            <motion.button
              className="export-btn"
              onClick={handleExportVideos}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              导出所有视频
            </motion.button>
          </div>

          <div className="storyboard-split-view">
            {/* 左侧：资产网格 */}
            <aside className="assets-panel">
              <AssetGrid
                assets={currentAssets}
                stage={currentStage}
                selectedId={selectedAssetIds[currentStage]}
                onSelect={handleSelectAsset}
                onContextMenu={handleContextMenu}
                onAddNew={handleAddNew}
                onUpload={handleOpenUpload}
                onBatchGenerate={handleBatchGenerate}
              />
            </aside>

            {/* 右侧：详情面板 - 仅当选中资产时渲染 */}
            {selectedAsset && (
              <section className="detail-panel">
                <AssetDetailPanel
                  asset={selectedAsset}
                  onUpdate={handleUpdateAsset}
                  onDelete={handleDeleteAsset}
                  onGenerate={handleGenerate}
                  onAIDialog={handleAIDialog}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  // T057: 剪辑阶段布局 - 上方预览 + 下方时间线+片段列表
  if (currentStage === STAGES.CLIP) {
    const playheadPosition = (clipCurrentTime / totalDuration) * 100;
    const zoomedDuration = totalDuration * clipZoom;
    const timelineScale = zoomedDuration > 0 ? (800 / zoomedDuration) : 0;

    return (
      <div className="storyboard-main">
        <StageNavigation />
        <div className="storyboard-content storyboard-stage-content">
          <div className="clip-stage-layout">
            {/* 顶部工具栏 */}
            <div className="clip-toolbar">
              <div className="clip-toolbar-left">
                <span className="clip-title">视频剪辑</span>
              </div>
              <div className="clip-toolbar-center">
                <button className="clip-tool-btn" onClick={togglePlay} title={clipIsPlaying ? '暂停' : '播放'}>
                  {clipIsPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button className="clip-tool-btn" onClick={handleSplitAtPlayhead} title="切割">
                  <Scissors size={18} />
                </button>
                <div className="clip-time-display">
                  {formatTime(clipCurrentTime)} / {formatTime(totalDuration)}
                </div>
              </div>
              <div className="clip-toolbar-right">
                <button className="clip-tool-btn" onClick={() => setClipZoom(Math.max(0.5, clipZoom - 0.25))} title="缩小">
                  -
                </button>
                <span className="clip-zoom-label">{Math.round(clipZoom * 100)}%</span>
                <button className="clip-tool-btn" onClick={() => setClipZoom(clipZoom + 0.25)} title="放大">
                  +
                </button>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="clip-content-area">
              {/* 视频预览区 */}
              <div className="clip-preview-area">
                <div className="clip-video-wrapper">
                  <video
                    ref={clipVideoRef}
                    src={clipAssets[currentClipIndex]?.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setClipIsPlaying(false)}
                    onClick={togglePlay}
                  />
                  {/* 播放头指示器 */}
                  <div
                    className="clip-playhead-indicator"
                    style={{ left: `${playheadPosition}%` }}
                  />
                </div>
              </div>

              {/* 底部区域 */}
              <div className="clip-bottom-area">
                {/* 时间线 */}
                <div className="clip-timeline-area">
                  {/* 时间刻度 */}
                  <div className="clip-timeline-scale">
                    {Array.from({ length: Math.ceil(zoomedDuration) + 1 }, (_, i) => (
                      <div key={i} className="clip-time-mark" style={{ left: `${i * timelineScale}px` }}>
                        <span className="clip-time-label">{formatTime(i)}</span>
                      </div>
                    ))}
                  </div>

                  {/* 播放头 */}
                  <div
                    className="clip-timeline-playhead"
                    style={{ left: `${clipCurrentTime * timelineScale}px` }}
                  />

                  {/* 片段轨道 */}
                  <div className="clip-timeline-track">
                    {clipAssets.map((clip, index) => {
                      const clipDuration = clip.endTime - clip.startTime;
                      const clipWidth = clipDuration * timelineScale;
                      let offset = 0;
                      for (let i = 0; i < index; i++) {
                        offset += (clipAssets[i].endTime - clipAssets[i].startTime) * timelineScale;
                      }
                      return (
                        <div
                          key={clip.id}
                          className={`clip-timeline-clip ${selectedAssetIds[currentStage] === clip.id ? 'selected' : ''}`}
                          style={{ left: `${offset}px`, width: `${clipWidth}px` }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, clip.id)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => handleClipSelect(clip.id)}
                          onDoubleClick={(e) => handleClipDoubleClick(e, clip)}
                        >
                          {/* 左侧裁剪手柄 */}
                          <div
                            className="clip-trim-handle clip-trim-left"
                            onMouseDown={(e) => handleTrimDrag(e, clip.id, 'left')}
                          />
                          {/* 片段内容 */}
                          <div className="clip-timeline-clip-content">
                            <span className="clip-timeline-clip-name">{clip.name}</span>
                          </div>
                          {/* 右侧裁剪手柄 */}
                          <div
                            className="clip-trim-handle clip-trim-right"
                            onMouseDown={(e) => handleTrimDrag(e, clip.id, 'right')}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 片段资产面板 */}
                <div className="clip-assets-panel">
                  <div className="clip-assets-header">
                    <span>片段列表 ({clipAssets.length})</span>
                  </div>
                  <div className="clip-assets-list">
                    {clipAssets.map((clip) => (
                      <div
                        key={clip.id}
                        className={`clip-asset-item ${selectedAssetIds[currentStage] === clip.id ? 'selected' : ''}`}
                        onClick={() => handleClipSelect(clip.id)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, clip.id)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, clipAssets.indexOf(clip))}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <div className="clip-asset-thumb">
                          {clip.thumbnail ? (
                            <img src={clip.thumbnail} alt={clip.name} />
                          ) : (
                            <Film size={24} />
                          )}
                        </div>
                        <div className="clip-asset-info">
                          <span className="clip-asset-name">{clip.name}</span>
                          <span className="clip-asset-duration">{formatTime(clip.endTime - clip.startTime)}</span>
                        </div>
                        <button
                          className="clip-asset-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClip(clip.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 角色/场景/道具阶段布局 - 和剧本阶段一样用 70:30 布局
  const renderAssetStageContent = () => (
    <div className="asset-stage-layout">
      {/* 左侧主区域 */}
      <div className="asset-main-area">
        {/* 资产网格 */}
        <aside className="assets-panel">
          <AssetGrid
            assets={currentAssets}
            stage={currentStage}
            selectedId={selectedAssetIds[currentStage]}
            onSelect={handleSelectAsset}
            onContextMenu={handleContextMenu}
            onAddNew={handleAddNew}
            onUpload={handleOpenUpload}
          />
        </aside>

        {/* 详情面板 */}
        <section className="detail-panel">
          {selectedAsset && (
            <AssetDetailPanel
              asset={selectedAsset}
              onUpdate={handleUpdateAsset}
              onDelete={handleDeleteAsset}
              onGenerate={handleGenerate}
              onAIDialog={handleAIDialog}
            />
          )}
        </section>
      </div>

      {/* 右侧 AI 对话面板 */}
      <AnimatePresence>
        {aiDialogs[currentStage]?.isOpen && (
          <div className="asset-ai-assistant-area">
            <AssetAIDialog
              isOpen={aiDialogs[currentStage].isOpen}
              asset={aiDialogs[currentStage].asset}
              messages={aiDialogs[currentStage].messages}
              onMessagesChange={handleAIMessagesChange}
              onClose={handleCloseAIDialog}
              onGenerate={(assetId) => {
                handleGenerate(assetId);
                handleCloseAIDialog();
              }}
              onSave={(assetId) => {
                toast?.success?.('Prompt 已保存');
                handleCloseAIDialog();
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="storyboard-main">
      <StageNavigation />
      {renderAssetStageContent()}

      {/* T072: 资产修改影响提示 */}
      {impactToast && (
        <ImpactToast
          message={`${impactToast.assetName} 已更新，${impactToast.impactedStoryboards.length} 个分镜使用了该资产`}
          impactedAssets={impactToast.impactedStoryboards}
          onRegenerate={handleRegenerateImpacted}
          onDismiss={handleDismissImpact}
        />
      )}

      {/* T058: 上传弹窗 */}
      <UploadModal
        isOpen={uploadModal.isOpen}
        onClose={() => setUploadModal({ isOpen: false, accept: 'image' })}
        onUpload={handleUpload}
        accept={uploadModal.accept}
        title="上传资产"
        stage={currentStage}
      />

      {/* P1: 右键菜单 */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="context-menu-item" onClick={() => handleContextMenuAction('edit')}>
            编辑
          </button>
          <button className="context-menu-item" onClick={() => handleContextMenuAction('duplicate')}>
            复制
          </button>
          <button className="context-menu-item" onClick={() => handleContextMenuAction('generate')}>
            生成图片
          </button>
          {currentStage === STAGES.STORYBOARD && (
            <button className="context-menu-item" onClick={() => handleContextMenuAction('generateVideo')}>
              生成视频
            </button>
          )}
          <div className="context-menu-divider" />
          <button className="context-menu-item danger" onClick={() => handleContextMenuAction('delete')}>
            删除
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryboardMainView;
