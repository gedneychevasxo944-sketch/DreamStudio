import { create } from 'zustand';
import { assetApi } from '../services/api';

// 阶段定义
export const STAGES = {
  SCRIPT: 'script',           // 剧本
  CHARACTER: 'character',      // 角色
  SCENE: 'scene',             // 场景
  PROP: 'prop',               // 道具
  STORYBOARD: 'storyboard',   // 分镜
  VIDEO: 'video',             // 视频
  CLIP: 'clip',               // 剪辑
};

export const STAGE_ORDER = [
  STAGES.SCRIPT,
  STAGES.CHARACTER,
  STAGES.SCENE,
  STAGES.PROP,
  STAGES.STORYBOARD,
  STAGES.VIDEO,
  STAGES.CLIP,
];

export const STAGE_LABELS = {
  [STAGES.SCRIPT]: '剧本',
  [STAGES.CHARACTER]: '角色',
  [STAGES.SCENE]: '场景',
  [STAGES.PROP]: '道具',
  [STAGES.STORYBOARD]: '分镜',
  [STAGES.VIDEO]: '视频',
  [STAGES.CLIP]: '剪辑',
};

export const STAGE_ICONS = {
  [STAGES.SCRIPT]: '📝',
  [STAGES.CHARACTER]: '👤',
  [STAGES.SCENE]: '🏞️',
  [STAGES.PROP]: '🎭',
  [STAGES.STORYBOARD]: '🎬',
  [STAGES.VIDEO]: '🎥',
  [STAGES.CLIP]: '✂️',
};

// 阶段颜色（用于 UI 展示）
export const STAGE_COLORS = {
  [STAGES.SCRIPT]: { day: '#3B82F6', night: '#60A5FA' },
  [STAGES.CHARACTER]: { day: '#EC4899', night: '#F472B6' },
  [STAGES.SCENE]: { day: '#10B981', night: '#34D399' },
  [STAGES.PROP]: { day: '#F59E0B', night: '#FBBF24' },
  [STAGES.STORYBOARD]: { day: '#8B5CF6', night: '#A78BFA' },
  [STAGES.VIDEO]: { day: '#EF4444', night: '#F87171' },
  [STAGES.CLIP]: { day: '#06B6D4', night: '#22D3EE' },
};

// 阶段配置
export const STAGE_CONFIG = {
  [STAGES.SCRIPT]: {
    label: '剧本',
    icon: '📝',
    assetType: 'script',
    hasGrid: false,  // 剧本阶段不需要网格
  },
  [STAGES.CHARACTER]: {
    label: '角色',
    icon: '👤',
    assetType: 'character',
    hasGrid: true,
  },
  [STAGES.SCENE]: {
    label: '场景',
    icon: '🏞️',
    assetType: 'scene',
    hasGrid: true,
  },
  [STAGES.PROP]: {
    label: '道具',
    icon: '🎭',
    assetType: 'prop',
    hasGrid: true,
  },
  [STAGES.STORYBOARD]: {
    label: '分镜',
    icon: '🎬',
    assetType: 'storyboard',
    hasGrid: true,
  },
  [STAGES.VIDEO]: {
    label: '视频',
    icon: '🎥',
    assetType: 'video',
    hasGrid: true,
  },
  [STAGES.CLIP]: {
    label: '剪辑',
    icon: '✂️',
    assetType: 'clip',
    hasGrid: true,
  },
};

// 景别选项
export const SHOT_TYPES = [
  { value: 'wide', label: '全景' },
  { value: 'medium', label: '中景' },
  { value: 'close_up', label: '特写' },
  { value: 'extreme_close_up', label: '大特写' },
  { value: 'cowboy', label: '牛仔镜头' },
  { value: 'over_shoulder', label: '过肩镜头' },
  { value: 'two_shot', label: '双人镜头' },
];

// 运镜选项
export const CAMERA_MOVEMENTS = [
  { value: 'static', label: '静止' },
  { value: 'pan_left', label: '左摇' },
  { value: 'pan_right', label: '右摇' },
  { value: 'tilt_up', label: '上摇' },
  { value: 'tilt_down', label: '下摇' },
  { value: 'zoom_in', label: '推进' },
  { value: 'zoom_out', label: '拉远' },
  { value: 'dolly', label: '移动' },
  { value: 'tracking', label: '跟踪' },
  { value: 'crane', label: '升降' },
];

export const useStageStore = create((set, get) => ({
  // 当前阶段
  currentStage: STAGES.SCRIPT,

  // 各阶段资产
  stageAssets: {
    [STAGES.SCRIPT]: [],
    [STAGES.CHARACTER]: [],
    [STAGES.SCENE]: [],
    [STAGES.PROP]: [],
    [STAGES.STORYBOARD]: [],
    [STAGES.VIDEO]: [],
    [STAGES.CLIP]: [],
  },

  // 选中的资产ID - 按阶段独立存储
  selectedAssetIds: {
    [STAGES.SCRIPT]: null,
    [STAGES.CHARACTER]: null,
    [STAGES.SCENE]: null,
    [STAGES.PROP]: null,
    [STAGES.STORYBOARD]: null,
    [STAGES.VIDEO]: null,
    [STAGES.CLIP]: null,
  },

  // 阶段完成状态（用于显示✓）
  stageCompletion: {
    [STAGES.SCRIPT]: false,
    [STAGES.CHARACTER]: false,
    [STAGES.SCENE]: false,
    [STAGES.PROP]: false,
    [STAGES.STORYBOARD]: false,
    [STAGES.VIDEO]: false,
    [STAGES.CLIP]: false,
  },

  // 已保存的资产状态（用于脏检测）
  savedStageAssets: null,

  // 是否有未保存到后端的资产（新增但无 serverId）
  hasPendingAssets: false,

  // Actions
  setCurrentStage: (stage) => set({ currentStage: stage }),

  setStageAssets: (stage, assets) => set((state) => ({
    stageAssets: { ...state.stageAssets, [stage]: assets }
  })),

  // 标记所有资产已保存（保存成功后调用）
  markAssetsSaved: () => set((state) => ({
    savedStageAssets: JSON.parse(JSON.stringify(state.stageAssets)),
    hasPendingAssets: false,
  })),

  // 标记有新增资产（未保存到后端）
  markPendingAssets: () => set({ hasPendingAssets: true }),

  // 重置所有阶段资产（用于新项目）
  resetAllStageAssets: () => set({
    currentStage: STAGES.SCRIPT,
    stageAssets: {
      [STAGES.SCRIPT]: [],
      [STAGES.CHARACTER]: [],
      [STAGES.SCENE]: [],
      [STAGES.PROP]: [],
      [STAGES.STORYBOARD]: [],
      [STAGES.VIDEO]: [],
      [STAGES.CLIP]: [],
    },
    selectedAssetIds: {
      [STAGES.SCRIPT]: null,
      [STAGES.CHARACTER]: null,
      [STAGES.SCENE]: null,
      [STAGES.PROP]: null,
      [STAGES.STORYBOARD]: null,
      [STAGES.VIDEO]: null,
      [STAGES.CLIP]: null,
    },
    stageCompletion: {
      [STAGES.SCRIPT]: false,
      [STAGES.CHARACTER]: false,
      [STAGES.SCENE]: false,
      [STAGES.PROP]: false,
      [STAGES.STORYBOARD]: false,
      [STAGES.VIDEO]: false,
      [STAGES.CLIP]: false,
    },
    savedStageAssets: null,
    hasPendingAssets: false,
  }),

  addStageAsset: (stage, asset) => set((state) => {
    const newAssets = [...(state.stageAssets[stage] || []), asset];
    const newStageAssets = { ...state.stageAssets, [stage]: newAssets };

    // 如果新增资产没有 serverId，标记有待保存资产
    const hasPending = !asset.serverId ? true : state.hasPendingAssets;

    // T070b: 自动建立引用关系
    // 当添加引用其他资产的资产（如分镜）时，更新被引用资产的 referencedBy
    if (stage === STAGES.STORYBOARD && asset.characterIds) {
      // 更新被分镜引用的角色的 referencedBy
      const updateReferences = (assets, reference) => {
        return assets.map(a => {
          if (reference.assetIds.includes(a.id)) {
            const existingRefs = a.referencedBy || [];
            const alreadyRefed = existingRefs.some(r => r.assetId === reference.assetId);
            if (!alreadyRefed) {
              return {
                ...a,
                referencedBy: [...existingRefs, {
                  assetId: reference.assetId,
                  stage: reference.stage,
                  context: reference.context,
                }],
              };
            }
          }
          return a;
        });
      };

      const reference = {
        assetId: asset.id,
        stage,
        context: '被分镜引用',
        assetIds: [
          ...(asset.characterIds || []),
          asset.sceneId,
          ...(asset.propsIds || []),
        ].filter(Boolean),
      };

      // 更新角色
      newStageAssets[STAGES.CHARACTER] = updateReferences(
        state.stageAssets[STAGES.CHARACTER] || [],
        reference
      );
      // 更新场景
      newStageAssets[STAGES.SCENE] = updateReferences(
        state.stageAssets[STAGES.SCENE] || [],
        reference
      );
      // 更新道具
      newStageAssets[STAGES.PROP] = updateReferences(
        state.stageAssets[STAGES.PROP] || [],
        reference
      );
    }

    return { stageAssets: newStageAssets, hasPendingAssets: hasPending };
  }),

  updateStageAsset: (stage, assetId, updates) => set((state) => ({
    stageAssets: {
      ...state.stageAssets,
      [stage]: state.stageAssets[stage].map(a =>
        a.id === assetId ? { ...a, ...updates } : a
      )
    }
  })),

  deleteStageAsset: (stage, assetId) => set((state) => ({
    stageAssets: {
      ...state.stageAssets,
      [stage]: state.stageAssets[stage].filter(a => a.id !== assetId)
    },
    // 如果删除的是当前阶段选中的资产，清除选择
    selectedAssetIds: {
      ...state.selectedAssetIds,
      [stage]: state.selectedAssetIds[stage] === assetId ? null : state.selectedAssetIds[stage]
    }
  })),

  selectAsset: (assetId) => set((state) => ({
    selectedAssetIds: {
      ...state.selectedAssetIds,
      [state.currentStage]: assetId
    }
  })),

  clearSelection: () => set((state) => ({
    selectedAssetIds: {
      ...state.selectedAssetIds,
      [state.currentStage]: null
    }
  })),

  setStageCompletion: (stage, completed) => set((state) => ({
    stageCompletion: { ...state.stageCompletion, [stage]: completed }
  })),

  // 获取当前阶段的资产
  getCurrentAssets: () => {
    const state = get();
    return state.stageAssets[state.currentStage] || [];
  },

  // 获取选中资产
  getSelectedAsset: () => {
    const state = get();
    const selectedId = state.selectedAssetIds[state.currentStage];
    if (!selectedId) return null;
    const assets = state.stageAssets[state.currentStage] || [];
    return assets.find(a => a.id === selectedId) || null;
  },

  // 重置所有状态
  reset: () => set({
    currentStage: STAGES.SCRIPT,
    stageAssets: {
      [STAGES.SCRIPT]: [],
      [STAGES.CHARACTER]: [],
      [STAGES.SCENE]: [],
      [STAGES.PROP]: [],
      [STAGES.STORYBOARD]: [],
      [STAGES.VIDEO]: [],
      [STAGES.CLIP]: [],
    },
    selectedAssetIds: {
      [STAGES.SCRIPT]: null,
      [STAGES.CHARACTER]: null,
      [STAGES.SCENE]: null,
      [STAGES.PROP]: null,
      [STAGES.STORYBOARD]: null,
      [STAGES.VIDEO]: null,
      [STAGES.CLIP]: null,
    },
    stageCompletion: {
      [STAGES.SCRIPT]: false,
      [STAGES.CHARACTER]: false,
      [STAGES.SCENE]: false,
      [STAGES.PROP]: false,
      [STAGES.STORYBOARD]: false,
      [STAGES.VIDEO]: false,
      [STAGES.CLIP]: false,
    },
  }),

  // 检查项目是否为空（所有阶段都没有资产）
  isProjectEmpty: () => {
    const state = get();
    return Object.values(state.stageAssets).every(assets => assets.length === 0);
  },

  // T049: 从剧本解析结果导入资产到各阶段
  // parseResult: { characters: [{name, description}], scenes: [{name, description}], props: [{name, description}] }
  importParseResult: (parseResult) => {
    const state = get();
    const newAssets = {
      [STAGES.CHARACTER]: [],
      [STAGES.SCENE]: [],
      [STAGES.PROP]: [],
    };

    // 生成唯一 ID
    const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 转换角色
    if (parseResult.characters) {
      newAssets[STAGES.CHARACTER] = parseResult.characters.map(c => ({
        id: generateId('char'),
        name: c.name,
        description: c.description || '',
        generatePrompt: c.generatePrompt || '',
        thumbnail: c.thumbnail || null,
        status: 'pending', // pending | generated | error
        createdAt: new Date().toISOString(),
      }));
    }

    // 转换场景
    if (parseResult.scenes) {
      newAssets[STAGES.SCENE] = parseResult.scenes.map(s => ({
        id: generateId('scene'),
        name: s.name,
        description: s.description || '',
        generatePrompt: s.generatePrompt || '',
        thumbnail: s.thumbnail || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));
    }

    // 转换道具
    if (parseResult.props) {
      newAssets[STAGES.PROP] = parseResult.props.map(p => ({
        id: generateId('prop'),
        name: p.name,
        description: p.description || '',
        generatePrompt: p.generatePrompt || '',
        thumbnail: p.thumbnail || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));
    }

    // 合并到现有资产
    set({
      stageAssets: {
        ...state.stageAssets,
        [STAGES.CHARACTER]: [...state.stageAssets[STAGES.CHARACTER], ...newAssets[STAGES.CHARACTER]],
        [STAGES.SCENE]: [...state.stageAssets[STAGES.SCENE], ...newAssets[STAGES.SCENE]],
        [STAGES.PROP]: [...state.stageAssets[STAGES.PROP], ...newAssets[STAGES.PROP]],
      },
      // 标记对应阶段为完成
      stageCompletion: {
        ...state.stageCompletion,
        [STAGES.CHARACTER]: newAssets[STAGES.CHARACTER].length > 0 ? true : state.stageCompletion[STAGES.CHARACTER],
        [STAGES.SCENE]: newAssets[STAGES.SCENE].length > 0 ? true : state.stageCompletion[STAGES.SCENE],
        [STAGES.PROP]: newAssets[STAGES.PROP].length > 0 ? true : state.stageCompletion[STAGES.PROP],
      },
    });
  },

  // T070c: 获取引用了指定资产的所有资产
  // 通过查询各资产的 referencedBy 字段找到引用关系
  // 返回：[{id, name, type, context}]
  getImpactedAssets: (assetId) => {
    const state = get();
    const results = [];

    Object.entries(state.stageAssets).forEach(([stage, assets]) => {
      assets.forEach(asset => {
        const refs = asset.referencedBy || [];
        if (refs.some(ref => ref.assetId === assetId)) {
          results.push({
            id: asset.id,
            name: asset.name || asset.label,
            type: STAGE_LABELS[stage] || stage,
            context: refs.find(ref => ref.assetId === assetId)?.context,
          });
        }
      });
    });

    return results;
  },

  // T070: 获取使用某资产的受影响的分镜列表
  // 返回：[{id, name, type, assetIds: [使用的资产ID列表]}]
  getImpactedStoryboards: (assetId) => {
    const state = get();
    const storyboards = state.stageAssets[STAGES.STORYBOARD] || [];

    return storyboards.filter(shot => {
      // 检查角色引用
      if (shot.characterIds?.includes(assetId)) return true;
      // 检查场景引用
      if (shot.sceneId === assetId) return true;
      // 检查道具引用
      if (shot.propsIds?.includes(assetId)) return true;
      return false;
    }).map(shot => ({
      id: shot.id,
      name: shot.name || shot.label,
      type: '分镜',
      assetIds: [
        ...(shot.characterIds || []),
        shot.sceneId,
        ...(shot.propsIds || []),
      ].filter(id => id),
    }));
  },

  // 加载项目资产（从 config.nodes 提取 assetIds，从 Asset API 获取详情）
  loadProjectAssets: async (projectId, config) => {
    console.log('[stageStore] loadProjectAssets called:', { projectId, config });
    try {
      // 1. 从 config.nodes 收集所有 storyboard 节点的 assetIds
      const assetIds = config.nodes
        ?.filter(n => n.layer === 'storyboard' && n.data?.assetId)
        ?.map(n => n.data.assetId) || [];

      console.log('[stageStore] Extracted assetIds:', assetIds);

      if (assetIds.length === 0) {
        // 没有故事板节点，清空所有阶段资产
        console.log('[stageStore] No assetIds found, clearing all stage assets');
        set({
          stageAssets: {
            [STAGES.SCRIPT]: [],
            [STAGES.CHARACTER]: [],
            [STAGES.SCENE]: [],
            [STAGES.PROP]: [],
            [STAGES.STORYBOARD]: [],
            [STAGES.VIDEO]: [],
            [STAGES.CLIP]: [],
          },
        });
        return;
      }

      // 2. 批量获取资产详情
      const response = await assetApi.getAssetsByIds(projectId, assetIds);
      const assets = response?.data?.assets || [];
      console.log('[stageStore] Fetched assets:', assets);
      const assetsMap = new Map(assets.map(a => [a.serverId, a]));

      // 3. 构建 nodeId -> asset 映射
      const nodeAssetMap = {};
      config.nodes
        ?.filter(n => n.layer === 'storyboard' && n.data?.assetId)
        ?.forEach(node => {
          nodeAssetMap[node.id] = assetsMap.get(node.data.assetId);
        });

      // 4. 按 type 分类填充 stageAssets
      const stageAssets = {
        [STAGES.SCRIPT]: [],
        [STAGES.CHARACTER]: [],
        [STAGES.SCENE]: [],
        [STAGES.PROP]: [],
        [STAGES.STORYBOARD]: [],
        [STAGES.VIDEO]: [],
        [STAGES.CLIP]: [],
      };

      config.nodes
        ?.filter(n => n.layer === 'storyboard')
        ?.forEach(node => {
          const asset = nodeAssetMap[node.id];
          if (asset) {
            const stageAsset = {
              id: node.id,
              serverId: asset.serverId,
              name: asset.name,
              type: asset.type,
              description: asset.description,
              prompt: asset.prompt,
              content: asset.content,
              thumbnail: asset.thumbnail,
              videoUrl: asset.videoUrl,
              metadata: asset.metadata || {},
              // 节点特有引用
              characterIds: node.data.characterIds || [],
              sceneId: node.data.sceneId,
              propsIds: node.data.propsIds || [],
            };
            stageAssets[asset.type]?.push(stageAsset);
          }
        });

      console.log('[stageStore] Built stageAssets:', JSON.stringify(stageAssets));

      // 5. 更新 store，并初始化 savedStageAssets
      set({
        stageAssets,
        savedStageAssets: JSON.parse(JSON.stringify(stageAssets)),
        hasPendingAssets: false,
      });

      console.log('[stageStore] Loaded project assets:', stageAssets);
    } catch (error) {
      console.error('[stageStore] Failed to load project assets:', error);
    }
  },
}));
