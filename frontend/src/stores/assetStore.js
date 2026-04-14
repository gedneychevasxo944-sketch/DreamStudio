import { create } from 'zustand';
import { eventBus, EVENT_TYPES } from '../utils/eventBus';

/**
 * 资产类型
 */
export const ASSET_TYPES = {
  CHARACTER: 'character',
  SCENE: 'scene',
  PROP: 'prop',
  SHOT: 'shot',
  VIDEO: 'video',
};

/**
 * Asset Store
 * 管理所有资产（角色、场景、道具、镜头等）
 */
export const useAssetStore = create((set, get) => ({
  // 资产列表
  assets: [],

  // 当前选中的资产ID
  selectedAssetId: null,

  // 资产版本历史（用于对比）
  assetVersions: {},

  // Actions - 资产管理

  // 添加资产
  addAsset: (asset) => {
    const newAsset = {
      ...asset,
      id: asset.id || `asset_${Date.now()}`,
      createdAt: asset.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: asset.version || 1,
    };
    set((state) => ({
      assets: [...state.assets, newAsset]
    }));
    eventBus.emit(EVENT_TYPES.ASSET_GENERATED, { asset: newAsset });
    return newAsset;
  },

  // 更新资产
  updateAsset: (assetId, updates) => set((state) => {
    const existingAsset = state.assets.find(a => a.id === assetId);
    if (!existingAsset) return state;

    // 保存旧版本到历史
    const newVersions = { ...state.assetVersions };
    if (!newVersions[assetId]) {
      newVersions[assetId] = [];
    }
    newVersions[assetId].push({ ...existingAsset, savedAt: new Date().toISOString() });

    return {
      assets: state.assets.map(a =>
        a.id === assetId ? {
          ...a,
          ...updates,
          updatedAt: new Date().toISOString(),
          version: (a.version || 1) + 1,
        } : a
      ),
      assetVersions: newVersions
    };
  }),

  // 删除资产
  removeAsset: (assetId) => set((state) => ({
    assets: state.assets.filter(a => a.id !== assetId),
    selectedAssetId: state.selectedAssetId === assetId ? null : state.selectedAssetId
  })),

  // 根据ID获取资产
  getAssetById: (assetId) => {
    return get().assets.find(a => a.id === assetId);
  },

  // 根据类型获取资产
  getAssetsByType: (type) => {
    return get().assets.filter(a => a.type === type);
  },

  // 获取资产的最新版本
  getAssetVersion: (assetId) => {
    const versions = get().assetVersions[assetId] || [];
    return versions[versions.length - 1];
  },

  // Actions - 选择状态

  // 设置选中的资产
  setSelectedAsset: (assetId) => {
    set({ selectedAssetId: assetId });
    const asset = get().assets.find(a => a.id === assetId);
    eventBus.emit(EVENT_TYPES.FOCUS_CHANGED, {
      type: 'asset',
      assetId,
      subgraphId: asset?.subgraphId
    });
  },

  // 清除选择
  clearSelection: () => {
    set({ selectedAssetId: null });
    eventBus.emit(EVENT_TYPES.FOCUS_CHANGED, {
      type: 'none',
      assetId: null,
      subgraphId: null
    });
  },

  // Actions - 批量操作

  // 加载资产列表
  loadAssets: (assets) => set({ assets }),

  // 清空所有资产
  clearAllAssets: () => set({
    assets: [],
    selectedAssetId: null,
    assetVersions: {}
  }),

  // 重置状态
  reset: () => set({
    assets: [],
    selectedAssetId: null,
    assetVersions: {}
  }),
}));

export default useAssetStore;
