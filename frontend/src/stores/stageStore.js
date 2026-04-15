import { create } from 'zustand';

// 阶段定义
export const STAGES = {
  SCRIPT: 'script',           // 剧本
  CHARACTER: 'character',      // 角色
  SCENE: 'scene',             // 场景
  PROP: 'prop',               // 道具
  STORYBOARD: 'storyboard',   // 分镜
  VIDEO: 'video',             // 视频
};

export const STAGE_ORDER = [
  STAGES.SCRIPT,
  STAGES.CHARACTER,
  STAGES.SCENE,
  STAGES.PROP,
  STAGES.STORYBOARD,
  STAGES.VIDEO,
];

export const STAGE_LABELS = {
  [STAGES.SCRIPT]: '剧本',
  [STAGES.CHARACTER]: '角色',
  [STAGES.SCENE]: '场景',
  [STAGES.PROP]: '道具',
  [STAGES.STORYBOARD]: '分镜',
  [STAGES.VIDEO]: '视频',
};

export const STAGE_ICONS = {
  [STAGES.SCRIPT]: '📝',
  [STAGES.CHARACTER]: '👤',
  [STAGES.SCENE]: '🏞️',
  [STAGES.PROP]: '🎭',
  [STAGES.STORYBOARD]: '🎬',
  [STAGES.VIDEO]: '🎥',
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
  currentStage: STAGES.CHARACTER,

  // 各阶段资产
  stageAssets: {
    [STAGES.SCRIPT]: [],
    [STAGES.CHARACTER]: [],
    [STAGES.SCENE]: [],
    [STAGES.PROP]: [],
    [STAGES.STORYBOARD]: [],
    [STAGES.VIDEO]: [],
  },

  // 选中的资产ID
  selectedAssetId: null,

  // 阶段完成状态（用于显示✓）
  stageCompletion: {
    [STAGES.SCRIPT]: false,
    [STAGES.CHARACTER]: false,
    [STAGES.SCENE]: false,
    [STAGES.PROP]: false,
    [STAGES.STORYBOARD]: false,
    [STAGES.VIDEO]: false,
  },

  // Actions
  setCurrentStage: (stage) => set({ currentStage: stage }),

  setStageAssets: (stage, assets) => set((state) => ({
    stageAssets: { ...state.stageAssets, [stage]: assets }
  })),

  addStageAsset: (stage, asset) => set((state) => ({
    stageAssets: {
      ...state.stageAssets,
      [stage]: [...(state.stageAssets[stage] || []), asset]
    }
  })),

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
    // 如果删除的是选中的资产，清除选择
    selectedAssetId: state.selectedAssetId === assetId ? null : state.selectedAssetId
  })),

  selectAsset: (assetId) => set({ selectedAssetId: assetId }),

  clearSelection: () => set({ selectedAssetId: null }),

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
    if (!state.selectedAssetId) return null;
    const assets = state.stageAssets[state.currentStage] || [];
    return assets.find(a => a.id === state.selectedAssetId) || null;
  },

  // 重置所有状态
  reset: () => set({
    currentStage: STAGES.CHARACTER,
    stageAssets: {
      [STAGES.SCRIPT]: [],
      [STAGES.CHARACTER]: [],
      [STAGES.SCENE]: [],
      [STAGES.PROP]: [],
      [STAGES.STORYBOARD]: [],
      [STAGES.VIDEO]: [],
    },
    selectedAssetId: null,
    stageCompletion: {
      [STAGES.SCRIPT]: false,
      [STAGES.CHARACTER]: false,
      [STAGES.SCENE]: false,
      [STAGES.PROP]: false,
      [STAGES.STORYBOARD]: false,
      [STAGES.VIDEO]: false,
    },
  }),
}));
