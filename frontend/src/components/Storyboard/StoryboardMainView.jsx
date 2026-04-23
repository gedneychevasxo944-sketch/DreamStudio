import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
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
import { useProjectStore } from '../../stores/projectStore';
import { ASSISTANT_AGENT_ID } from '../../constants/ComponentType';
import { assetApi } from '../../services/api';
import './StoryboardMainView.css';

// Stage components
import ScriptStageView from './stages/ScriptStageView';
import AssetStageView from './stages/AssetStageView';
import StoryboardStageView from './stages/StoryboardStageView';
import VideoStageView from './stages/VideoStageView';
import ClipStageView from './stages/ClipStageView';

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

  // 草稿保存状态（固定位置显示）
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const saveDebounceRef = useRef(null); // API 保存 debounce 定时器
  const pendingSaveRef = useRef(null); // 追踪待保存的资产 { assetId, updates }
  const prevStageRef = useRef(null); // 追踪上一个阶段

  // T072: 资产修改影响提示状态
  const [impactToast, setImpactToast] = useState(null);

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
    selectAsset,
    addStageAsset,
    updateStageAsset,
    deleteStageAsset,
    getSelectedAsset,
    isProjectEmpty,
    importParseResult,
    getImpactedStoryboards,
  } = useStageStore();

  // 切换阶段时重置保存状态
  useEffect(() => {
    if (prevStageRef.current !== null && prevStageRef.current !== currentStage) {
      // 如果有 pending 的保存，立即触发
      if (pendingSaveRef.current) {
        const pending = pendingSaveRef.current;
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;

        // 立即执行保存
        const doSave = async () => {
          const currentAsset = useStageStore.getState().stageAssets[pending.stage]?.find(a => a.id === pending.assetId);
          const projectId = useProjectStore.getState().currentProjectId;
          if (projectId && currentAsset?.serverId) {
            try {
              setSaveStatus('saving');
              await assetApi.updateAsset(projectId, currentAsset.serverId, {
                name: pending.updates.name,
                description: pending.updates.description,
                prompt: pending.updates.prompt,
                thumbnail: pending.updates.thumbnail,
                status: pending.updates.status,
                content: pending.updates.content,
              });
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 3000);
            } catch (error) {
              console.error('Failed to save on stage switch:', error);
              setSaveStatus('idle');
            }
          }
          pendingSaveRef.current = null;
        };
        doSave();
      } else {
        setSaveStatus('idle');
      }
    }
    prevStageRef.current = currentStage;
  }, [currentStage]);

  // 获取当前阶段的资产
  const currentAssets = useMemo(() => stageAssets[currentStage] || [], [stageAssets, currentStage]);
  const selectedAsset = getSelectedAsset();

  // 检查项目是否为空
  const projectIsEmpty = isProjectEmpty();

  // T057: 剪辑阶段相关状态
  const [clipCurrentTime, setClipCurrentTime] = useState(0);
  const [clipIsPlaying, setClipIsPlaying] = useState(false);
  const [clipZoom, setClipZoom] = useState(1);
  const [clipAssets, setClipAssets] = useState([]);
  const [draggedClipId, setDraggedClipId] = useState(null);
  const [, setTrimState] = useState({ clipId: null, edge: null, startX: 0 });
  const clipVideoRef = useRef(null);
  const clipInitRef = useRef(false);

  // 获取 chatStore 的 context 切换函数
  const { switchContext } = useChatStore();

  // 获取当前项目 ID
  const currentProjectId = useProjectStore(state => state.currentProjectId);

  // T057: 初始化剪辑资产（从VIDEO阶段导入或使用模拟数据）
  useEffect(() => {
    if (currentStage === STAGES.CLIP && !clipInitRef.current) {
      clipInitRef.current = true;
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
      } else {
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
  const handleEmptyGuideComplete = useCallback(async () => {
    // 从空白开始后，切换到剧本阶段
    setCurrentStage(STAGES.SCRIPT);

    // 如果有项目ID，为剧本资产创建 serverId
    if (currentProjectId) {
      const scriptAssets = useStageStore.getState().stageAssets[STAGES.SCRIPT] || [];
      const scriptAsset = scriptAssets[0];
      if (scriptAsset && !scriptAsset.serverId) {
        try {
          const response = await assetApi.createAsset(currentProjectId, {
            name: scriptAsset.name,
            type: 'script',
            description: scriptAsset.description || '',
            prompt: '',
          });
          if (response?.data?.id) {
            updateStageAsset(STAGES.SCRIPT, scriptAsset.id, { serverId: response.data.id });
          }
        } catch (error) {
          console.error('Failed to create script asset on server:', error);
        }
      }
    }
  }, [currentProjectId, setCurrentStage, updateStageAsset]);

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
  const handleAddNew = useCallback(async () => {
    const localId = `${currentStage}-${Date.now()}`;
    const newAsset = {
      id: localId,
      type: currentStage,
      name: `新${currentStage === STAGES.STORYBOARD ? '镜头' : '资产'}`,
      description: '',
      prompt: '',
      thumbnail: null,
    };
    // 先添加到本地 store（用于 UI 立即显示）
    addStageAsset(currentStage, newAsset);
    selectAsset(newAsset.id);

    // 如果有项目ID，调用后端 API 创建资产
    if (currentProjectId) {
      try {
        const response = await assetApi.createAsset(currentProjectId, {
          name: newAsset.name,
          type: currentStage,
          description: '',
          prompt: '',
        });
        if (response?.data?.id) {
          // 用后端返回的 ID 更新本地资产的 serverId
          updateStageAsset(currentStage, localId, { serverId: response.data.id });
        }
      } catch (error) {
        console.error('Failed to create asset on server:', error);
      }
    }
  }, [currentStage, currentProjectId, addStageAsset, selectAsset, updateStageAsset]);

  // T072: 处理资产更新并检查影响
  const handleUpdateAsset = useCallback((assetId, updates) => {
    // 清除之前的 debounce 定时器
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    // 先获取受影响分镜（在更新前）- 立即执行
    const impacted = getImpactedStoryboards(assetId);
    if (impacted.length > 0) {
      // 延迟显示 toast，在资产更新后显示
      setTimeout(() => {
        const asset = useStageStore.getState().stageAssets[currentStage]?.find(a => a.id === assetId);
        setImpactToast({
          assetName: asset?.name || '该资产',
          assetId,
          impactedStoryboards: impacted,
        });
      }, 0);
    }

    // 执行更新（先更新本地，UI 立即响应）
    updateStageAsset(currentStage, assetId, updates);

    // 追踪待保存的资产
    pendingSaveRef.current = { assetId, updates, stage: currentStage };

    // 5秒 debounce 后调用后端 API
    saveDebounceRef.current = setTimeout(async () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      pendingSaveRef.current = null;

      // 在 debounce 执行时获取最新的资产数据
      const currentAsset = useStageStore.getState().stageAssets[pending.stage]?.find(a => a.id === pending.assetId);
      const projectId = useProjectStore.getState().currentProjectId;

      // 只有已有 serverId 的资产才调用 API（包括剧本）
      if (projectId && currentAsset?.serverId) {
        try {
          setSaveStatus('saving');
          const apiUpdates = {
            name: pending.updates.name,
            description: pending.updates.description,
            prompt: pending.updates.prompt,
            thumbnail: pending.updates.thumbnail,
            status: pending.updates.status,
            content: pending.updates.content,
          };
          await assetApi.updateAsset(projectId, currentAsset.serverId, apiUpdates);
          setSaveStatus('saved');
        } catch (error) {
          console.error('Failed to update asset on server:', error);
          setSaveStatus('idle');
        }
      }

      // 3秒后恢复 idle
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 5000);
  }, [currentStage, updateStageAsset, getImpactedStoryboards]);

  // 处理资产删除
  const handleDeleteAsset = useCallback(async (assetId) => {
    if (!window.confirm('确定要删除这个资产吗？')) {
      return;
    }

    // 调用后端 API 删除（如果有 serverId）
    if (currentProjectId) {
      const asset = stageAssets[currentStage]?.find(a => a.id === assetId);
      if (asset?.serverId) {
        try {
          await assetApi.deleteAsset(currentProjectId, asset.serverId);
        } catch (error) {
          console.error('Failed to delete asset on server:', error);
        }
      }
    }

    // 删除本地资产
    deleteStageAsset(currentStage, assetId);
  }, [currentStage, currentProjectId, deleteStageAsset, stageAssets]);

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
      case 'duplicate': {
        const newAsset = {
          ...asset,
          id: `${currentStage}-${Date.now()}`,
          name: `${asset.name} (副本)`,
        };
        addStageAsset(currentStage, newAsset);
        toast?.success?.(`已复制 "${asset.name}"`);
        break;
      }
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

  // T058: 处理文本剧本提交
  const handleTextSubmit = useCallback(async (text) => {
    console.log('提交剧本文本，长度:', text.length);

    const newAssetId = `${STAGES.SCRIPT}-${Date.now()}`;
    const newAsset = {
      id: newAssetId,
      type: STAGES.SCRIPT,
      name: '剧本',
      content: text,
      status: 'synced',
    };

    // 添加到阶段资产
    addStageAsset(STAGES.SCRIPT, newAsset);
    selectAsset(newAssetId);

    toast?.success?.('剧本已保存');
    setUploadModal({ isOpen: false, accept: 'image' });
  }, [addStageAsset, selectAsset]);

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
  }, []);

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
    const clipIndex = clipAssets.findIndex(c => c.id === clip.id);
    if (clipIndex !== -1) {
      const newClip1 = { ...clip, id: `${clip.id}-a`, endTime: splitTime };
      const newClip2 = { ...clip, id: `${clip.id}-b`, startTime: splitTime, name: clip.name + ' (2)', thumbnail: clip.thumbnail };
      const newClips = [...clipAssets.slice(0, clipIndex), newClip1, newClip2, ...clipAssets.slice(clipIndex + 1)];
      setClipAssets(newClips);
      toast?.success?.(`在 ${splitTime.toFixed(1)}s 处切割`);
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

  // 渲染阶段内容
  const renderStageContent = () => {
    switch (currentStage) {
      case STAGES.SCRIPT:
        return (
          <ScriptStageView
            scriptAsset={currentAssets[0]}
            scriptAssistantOpen={scriptAssistantOpen}
            onOpenScriptAssistant={() => setScriptAssistantOpen(true)}
            onCloseScriptAssistant={() => setScriptAssistantOpen(false)}
            onUpdateAsset={handleUpdateAsset}
            onAIParse={handleAIParse}
            isParsing={isParsing}
            showScriptParser={showScriptParser}
            parseResult={parseResult}
            onParseConfirm={handleParseConfirm}
            onParseCancel={() => setShowScriptParser(false)}
            onParseRetry={handleParseRetry}
            saveStatus={saveStatus}
          />
        );

      case STAGES.STORYBOARD:
        return (
          <StoryboardStageView
            assets={currentAssets}
            selectedAsset={selectedAsset}
            selectedAssetId={selectedAssetIds[currentStage]}
            onSelectAsset={handleSelectAsset}
            onContextMenu={handleContextMenu}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
            onGenerate={handleGenerate}
            onAIDialog={handleAIDialog}
            onAddNew={handleAddNew}
            onUpload={handleOpenUpload}
            onBatchGenerate={handleBatchGenerate}
            onAIGenerate={handleAIGenerateStoryboard}
            isParsing={isParsing}
            saveStatus={saveStatus}
          />
        );

      case STAGES.VIDEO:
        return (
          <VideoStageView
            assets={currentAssets}
            selectedAsset={selectedAsset}
            selectedAssetId={selectedAssetIds[currentStage]}
            onSelectAsset={handleSelectAsset}
            onContextMenu={handleContextMenu}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
            onGenerate={handleGenerate}
            onAIDialog={handleAIDialog}
            onAddNew={handleAddNew}
            onUpload={handleOpenUpload}
            onBatchGenerate={handleBatchGenerate}
            onExportVideos={handleExportVideos}
            saveStatus={saveStatus}
          />
        );

      case STAGES.CLIP:
        return (
          <ClipStageView
            clipAssets={clipAssets}
            selectedClipId={selectedAssetIds[currentStage]}
            clipCurrentTime={clipCurrentTime}
            clipIsPlaying={clipIsPlaying}
            clipZoom={clipZoom}
            videoRef={clipVideoRef}
            currentClipIndex={currentClipIndex}
            onClipSelect={handleClipSelect}
            onClipDoubleClick={handleClipDoubleClick}
            onTogglePlay={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onSplitAtPlayhead={handleSplitAtPlayhead}
            onDeleteClip={handleDeleteClip}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onTrimDrag={handleTrimDrag}
            onZoomIn={() => setClipZoom(clipZoom + 0.25)}
            onZoomOut={() => setClipZoom(Math.max(0.5, clipZoom - 0.25))}
            onSeek={seekTo}
          />
        );

      case STAGES.CHARACTER:
      case STAGES.SCENE:
      case STAGES.PROP:
        return (
          <AssetStageView
            stage={currentStage}
            assets={currentAssets}
            selectedAsset={selectedAsset}
            aiDialog={aiDialogs[currentStage]}
            onSelectAsset={handleSelectAsset}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
            onGenerate={handleGenerate}
            onAIDialog={handleAIDialog}
            onAIMessagesChange={handleAIMessagesChange}
            onCloseAIDialog={handleCloseAIDialog}
            onAddNew={handleAddNew}
            onUpload={handleOpenUpload}
            saveStatus={saveStatus}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="storyboard-main">
      <StageNavigation />
      {renderStageContent()}

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
        onTextSubmit={handleTextSubmit}
        accept={uploadModal.accept}
        title={currentStage === STAGES.SCRIPT ? '上传剧本' : '上传资产'}
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
