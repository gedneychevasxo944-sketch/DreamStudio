import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Theme Store - 主题状态管理
 * 支持浅色/深色/跟随系统三种模式
 */
const useThemeStore = create(
  persist(
    (set, get) => ({
      // 主题模式: 'day' | 'night' | 'system'
      mode: 'day',
      // 解析后的主题（实际应用的主题）
      resolved: 'day',

      // 设置主题模式
      setMode: (mode) => {
        const resolved = mode === 'system'
          ? getSystemTheme()
          : mode;
        set({ mode, resolved });
        applyTheme(resolved);
      },

      // 切换主题
      toggle: () => {
        const { mode } = get();
        const newMode = mode === 'day' ? 'night' : 'day';
        get().setMode(newMode);
      },

      // 跟随系统
      followSystem: () => {
        set({ mode: 'system' });
        const resolved = getSystemTheme();
        set({ resolved });
        applyTheme(resolved);
      },
    }),
    {
      name: 'dreamstudio-theme',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

// 获取系统主题
function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
  }
  return 'day';
}

// 应用主题到 DOM
function applyTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// 初始化主题
export function initializeTheme() {
  const { mode } = useThemeStore.getState();
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  useThemeStore.setState({ resolved });
  applyTheme(resolved);

  // 监听系统主题变化
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { mode } = useThemeStore.getState();
      if (mode === 'system') {
        const resolved = e.matches ? 'night' : 'day';
        useThemeStore.setState({ resolved });
        applyTheme(resolved);
      }
    });
  }
}

export { useThemeStore };  // named export for consistency
export default useThemeStore;
