
import { create } from 'zustand';

/**
 * Toast 消息类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast 消息项
 */
export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark' | 'system';

/**
 * UI 全局 Store 状态接口
 */
interface UIState {
  /** 侧栏是否折叠 */
  sidebarCollapsed: boolean;
  /** 当前主题 */
  theme: ThemeType;
  /** 实际应用的主题（解析 system 后的结果） */
  resolvedTheme: 'light' | 'dark';
  /** 全局 Loading 数量（用于叠加请求） */
  loadingCount: number;
  /** 是否显示全局 Loading */
  globalLoading: boolean;
  /** Toast 消息队列 */
  toasts: ToastItem[];
  /** 页面标题 */
  pageTitle: string;

  // ========== Actions ==========

  /** 切换侧栏折叠状态 */
  toggleSidebar: () => void;
  /** 设置侧栏折叠状态 */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** 设置主题 */
  setTheme: (theme: ThemeType) => void;
  /** 解析系统主题（在应用启动时调用） */
  resolveTheme: () => void;
  /** 开始加载（+1 loading 计数） */
  startLoading: () => void;
  /** 结束加载（-1 loading 计数） */
  stopLoading: () => void;
  /** 强制设置全局 Loading */
  setGlobalLoading: (loading: boolean) => void;
  /** 添加 Toast */
  showToast: (type: ToastType, title: string, description?: string, duration?: number) => string;
  /** 移除指定 Toast */
  removeToast: (id: string) => void;
  /** 清除所有 Toast */
  clearToasts: () => void;
  /** 快捷：成功 Toast */
  toastSuccess: (title: string, description?: string) => string;
  /** 快捷：错误 Toast */
  toastError: (title: string, description?: string) => string;
  /** 快捷：警告 Toast */
  toastWarning: (title: string, description?: string) => string;
  /** 快捷：信息 Toast */
  toastInfo: (title: string, description?: string) => string;
  /** 设置页面标题 */
  setPageTitle: (title: string) => void;
}

/**
 * 生成 Toast ID
 */
function generateToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * UI 全局 Zustand Store
 */
export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  theme: 'light',
  resolvedTheme: 'light',
  loadingCount: 0,
  globalLoading: false,
  toasts: [],
  pageTitle: '药品追溯系统',

  /** 切换侧栏折叠状态 */
  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  /** 设置侧栏折叠状态 */
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  /** 设置主题 */
  setTheme: (theme: ThemeType) => {
    set({ theme });
    // 立即解析
    if (typeof window !== 'undefined') {
      let resolved: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      set({ resolvedTheme: resolved });
      const root = document.documentElement;
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  },

  /** 解析系统主题 */
  resolveTheme: () => {
    if (typeof window === 'undefined') return;
    const { theme } = get();
    let resolved: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }
    set({ resolvedTheme: resolved });
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  /** 开始加载（+1 loading 计数） */
  startLoading: () => {
    set(state => {
      const loadingCount = state.loadingCount + 1;
      return {
        loadingCount,
        globalLoading: loadingCount > 0,
      };
    });
  },

  /** 结束加载（-1 loading 计数） */
  stopLoading: () => {
    set(state => {
      const loadingCount = Math.max(0, state.loadingCount - 1);
      return {
        loadingCount,
        globalLoading: loadingCount > 0,
      };
    });
  },

  /** 强制设置全局 Loading */
  setGlobalLoading: (loading: boolean) => {
    set({ globalLoading: loading, loadingCount: loading ? 1 : 0 });
  },

  /** 添加 Toast */
  showToast: (type: ToastType, title: string, description?: string, duration: number = 3000) => {
    const id = generateToastId();
    const toast: ToastItem = {
      id,
      type,
      title,
      description,
      duration,
    };
    set(state => ({ toasts: [...state.toasts, toast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  /** 移除指定 Toast */
  removeToast: (id: string) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  /** 清除所有 Toast */
  clearToasts: () => {
    set({ toasts: [] });
  },

  /** 快捷：成功 Toast */
  toastSuccess: (title: string, description?: string) => {
    return get().showToast('success', title, description);
  },

  /** 快捷：错误 Toast */
  toastError: (title: string, description?: string) => {
    return get().showToast('error', title, description, 4000);
  },

  /** 快捷：警告 Toast */
  toastWarning: (title: string, description?: string) => {
    return get().showToast('warning', title, description, 3500);
  },

  /** 快捷：信息 Toast */
  toastInfo: (title: string, description?: string) => {
    return get().showToast('info', title, description);
  },

  /** 设置页面标题 */
  setPageTitle: (title: string) => {
    set({ pageTitle: title });
    if (typeof document !== 'undefined') {
      document.title = `${title} - 药品追溯系统`;
    }
  },
}));

export default useUIStore;
