import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { toast } from '../Toast/Toast';
import StageNavigation from './StageNavigation';
import AssetGrid from './AssetGrid';
import AssetDetailPanel from './AssetDetailPanel';
import EmptyGuide from './EmptyGuide';
import ScriptParser from './ScriptParser';
import ImpactToast from './ImpactToast';
import UploadModal from './UploadModal';
import { useStageStore, STAGES } from '../../stores/stageStore';
import { useChatStore } from '../../stores/chatStore';
import './StoryboardMainView.css';

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

  const {
    currentStage,
    stageAssets,
    selectedAssetId,
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

  // 获取 chatStore 的 context 切换函数
  const { switchContext } = useChatStore();

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
    // 切换聊天上下文到该资产
    if (asset) {
      switchContext('asset', asset.id, asset.name);
    }
  }, [selectAsset, switchContext]);

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
  const handleUpload = useCallback((file, mode) => {
    console.log('上传文件:', file.name, '模式:', mode);

    // 创建新资产
    const newAsset = {
      id: `${currentStage}-${Date.now()}`,
      type: currentStage,
      name: file.name.replace(/\.[^/.]+$/, ''), // 去掉扩展名作为初始名称
      description: '',
      prompt: '',
      thumbnail: null, // TODO: 实际上传后获取真实 URL
      // T062: AI 处理相关字段
      aiProcessed: mode === 'ai',
      aiDescription: mode === 'ai' ? `AI 处理后的 ${file.name}` : null,
    };

    // 添加到阶段资产
    addStageAsset(currentStage, newAsset);
    selectAsset(newAsset.id);

    if (mode === 'ai') {
      toast?.success?.(`已上传 ${file.name}，AI 处理中...`);
    } else {
      toast?.success?.(`已上传 ${file.name}`);
    }

    setUploadModal({ isOpen: false, accept: 'image' });
  }, [currentStage, addStageAsset, selectAsset]);

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

  // 项目为空且不在剧本阶段时显示 EmptyGuide
  if (projectIsEmpty && currentStage !== STAGES.SCRIPT) {
    return (
      <div className="storyboard-main">
        <StageNavigation onAIGenerate={handleStageAIGenerate} />
        <div className="storyboard-content">
          <EmptyGuide onComplete={handleEmptyGuideComplete} />
        </div>
      </div>
    );
  }

  // 剧本阶段特殊处理
  if (currentStage === STAGES.SCRIPT) {
    return (
      <div className="storyboard-main">
        <StageNavigation onAIGenerate={handleStageAIGenerate} />
        <div className="storyboard-content script-content">
          {/* T050: AI解析按钮 */}
          <div className="script-actions">
            <motion.button
              className="ai-parse-btn"
              onClick={handleAIParse}
              disabled={isParsing || currentAssets.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={16} />
              {isParsing ? '解析中...' : 'AI 解析剧本'}
            </motion.button>
          </div>

          <AssetDetailPanel
            asset={currentAssets[0] || {
              id: 'script-main',
              type: STAGES.SCRIPT,
              name: '剧本',
              content: '在此输入剧本内容...',
            }}
            onUpdate={handleUpdateAsset}
          />

          {/* T050: 剧本解析结果弹窗 */}
          <ScriptParser
            isOpen={showScriptParser}
            parseResult={parseResult}
            onConfirm={handleParseConfirm}
            onCancel={() => setShowScriptParser(false)}
            onRetry={handleParseRetry}
          />
        </div>
      </div>
    );
  }

  // T054: 分镜阶段特殊处理 - 显示 AI 生成分镜按钮
  if (currentStage === STAGES.STORYBOARD) {
    return (
      <div className="storyboard-main">
        <StageNavigation onAIGenerate={handleStageAIGenerate} />
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
                selectedId={selectedAssetId}
                onSelect={handleSelectAsset}
                onContextMenu={handleContextMenu}
                onAddNew={handleAddNew}
                onUpload={handleOpenUpload}
                onBatchGenerate={handleBatchGenerate}
              />
            </aside>

            {/* 右侧：详情面板 */}
            <section className="detail-panel">
              <AssetDetailPanel
                asset={selectedAsset}
                onUpdate={handleUpdateAsset}
                onDelete={handleDeleteAsset}
                onGenerate={handleGenerate}
              />
            </section>
          </div>
        </div>
      </div>
    );
  }

  // T057: 视频阶段特殊处理 - 显示导出按钮
  if (currentStage === STAGES.VIDEO) {
    return (
      <div className="storyboard-main">
        <StageNavigation onAIGenerate={handleStageAIGenerate} />
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
                selectedId={selectedAssetId}
                onSelect={handleSelectAsset}
                onContextMenu={handleContextMenu}
                onAddNew={handleAddNew}
                onUpload={handleOpenUpload}
                onBatchGenerate={handleBatchGenerate}
              />
            </aside>

            {/* 右侧：详情面板 */}
            <section className="detail-panel">
              <AssetDetailPanel
                asset={selectedAsset}
                onUpdate={handleUpdateAsset}
                onDelete={handleDeleteAsset}
                onGenerate={handleGenerate}
              />
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="storyboard-main">
      <StageNavigation onAIGenerate={handleStageAIGenerate} />

      <div className="storyboard-content">
        {/* 左侧：资产网格 */}
        <aside className="assets-panel">
          <AssetGrid
            assets={currentAssets}
            stage={currentStage}
            selectedId={selectedAssetId}
            onSelect={handleSelectAsset}
            onContextMenu={handleContextMenu}
            onAddNew={handleAddNew}
            onUpload={handleOpenUpload}
          />
        </aside>

        {/* 右侧：详情面板 */}
        <section className="detail-panel">
          <AssetDetailPanel
            asset={selectedAsset}
            onUpdate={handleUpdateAsset}
            onDelete={handleDeleteAsset}
            onGenerate={handleGenerate}
          />
        </section>
      </div>

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
        onAIGenerate={handleAIGenerate}
        accept={uploadModal.accept}
        title="上传资产"
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
