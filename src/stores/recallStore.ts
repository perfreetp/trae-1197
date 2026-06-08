
import { create } from 'zustand';
import { recallService, RecallQueryParams, ChannelingItem } from '../services/recallService';
import { RecallOrder, RecallProgress } from '../services/mock/generators';
import { PaginatedResult } from '../services/mock/database';
import { RecallStats } from '../services/reportService';
import { reportService } from '../services/reportService';

/**
 * 召回管理 Store 状态接口
 */
interface RecallState {
  /** 召回工单列表 */
  orders: RecallOrder[];
  /** 当前选中的召回工单 */
  currentOrder: RecallOrder | null;
  /** 召回工单进度 */
  progress: RecallProgress[];
  /** 窜货分析结果 */
  channelingList: ChannelingItem[];
  /** 召回统计数据 */
  stats: RecallStats | null;
  /** 分页信息 */
  pagination: { page: number; pageSize: number; total: number };
  /** 加载状态 */
  loading: boolean;
  /** 详情加载状态 */
  detailLoading: boolean;
  /** 提交操作加载状态 */
  submitting: boolean;
  /** 统计加载状态 */
  statsLoading: boolean;
  /** 错误信息 */
  error: string | null;

  // ========== Actions ==========

  /** 加载召回工单列表 */
  loadOrders: (params?: RecallQueryParams) => Promise<void>;
  /** 加载单个召回工单详情 */
  loadOrder: (id: string) => Promise<void>;
  /** 加载召回进度 */
  loadProgress: (recallId: string) => Promise<void>;
  /** 创建召回工单 */
  createOrder: (data: Partial<RecallOrder>) => Promise<RecallOrder | null>;
  /** 更新召回工单状态 */
  updateStatus: (id: string, status: RecallOrder['status']) => Promise<boolean>;
  /** 冻结批次 */
  freezeBatch: (batchId: string) => Promise<boolean>;
  /** 解冻批次 */
  unfreezeBatch: (batchId: string) => Promise<boolean>;
  /** 加载窜货分析 */
  loadChanneling: () => Promise<void>;
  /** 加载召回统计 */
  loadStats: () => Promise<void>;
  /** 设置分页 */
  setPagination: (page: number, pageSize?: number) => void;
  /** 清空当前工单 */
  clearCurrentOrder: () => void;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 召回管理 Zustand Store
 */
export const useRecallStore = create<RecallState>((set, get) => ({
  orders: [],
  currentOrder: null,
  progress: [],
  channelingList: [],
  stats: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  loading: false,
  detailLoading: false,
  submitting: false,
  statsLoading: false,
  error: null,

  /** 加载召回工单列表 */
  loadOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { page, pageSize } = get().pagination;
      const result: PaginatedResult<RecallOrder> = await recallService.fetchRecallOrders({
        page,
        pageSize,
        ...params,
      });
      set({
        orders: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        },
      });
    } catch (e) {
      set({ error: (e as Error).message || '加载召回工单失败' });
    } finally {
      set({ loading: false });
    }
  },

  /** 加载单个召回工单详情 */
  loadOrder: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      // 从列表中找，找不到再刷新列表
      const found = get().orders.find(o => o.id === id);
      if (found) {
        set({ currentOrder: found });
        set({ progress: found.progressList });
      } else {
        // 重新加载进度
        await get().loadProgress(id);
      }
    } catch (e) {
      set({ error: (e as Error).message || '加载召回详情失败' });
    } finally {
      set({ detailLoading: false });
    }
  },

  /** 加载召回进度 */
  loadProgress: async (recallId: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await recallService.fetchRecallProgress(recallId);
      if (result) {
        set({ progress: result });
      }
    } catch (e) {
      set({ error: (e as Error).message || '加载召回进度失败' });
    } finally {
      set({ detailLoading: false });
    }
  },

  /** 创建召回工单 */
  createOrder: async (data: Partial<RecallOrder>) => {
    set({ submitting: true, error: null });
    try {
      const result = await recallService.createRecallOrder(data);
      const { orders, pagination } = get();
      set({
        orders: [result, ...orders].slice(0, pagination.pageSize),
        pagination: { ...pagination, total: pagination.total + 1 },
        currentOrder: result,
        progress: result.progressList,
      });
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '创建召回工单失败' });
      return null;
    } finally {
      set({ submitting: false });
    }
  },

  /** 更新召回工单状态 */
  updateStatus: async (id: string, status: RecallOrder['status']) => {
    set({ submitting: true, error: null });
    try {
      const result = await recallService.updateRecallStatus(id, status);
      if (result) {
        const { orders, currentOrder } = get();
        set({
          orders: orders.map(o => (o.id === id ? result : o)),
          currentOrder: currentOrder?.id === id ? result : currentOrder,
          progress: result.progressList,
        });
        return true;
      }
      return false;
    } catch (e) {
      set({ error: (e as Error).message || '更新召回状态失败' });
      return false;
    } finally {
      set({ submitting: false });
    }
  },

  /** 冻结批次 */
  freezeBatch: async (batchId: string) => {
    set({ submitting: true, error: null });
    try {
      const result = await recallService.freezeBatch(batchId);
      if (!result) {
        set({ error: '冻结批次失败' });
      }
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '冻结批次失败' });
      return false;
    } finally {
      set({ submitting: false });
    }
  },

  /** 解冻批次 */
  unfreezeBatch: async (batchId: string) => {
    set({ submitting: true, error: null });
    try {
      const result = await recallService.unfreezeBatch(batchId);
      if (!result) {
        set({ error: '解冻批次失败' });
      }
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '解冻批次失败' });
      return false;
    } finally {
      set({ submitting: false });
    }
  },

  /** 加载窜货分析 */
  loadChanneling: async () => {
    set({ loading: true, error: null });
    try {
      const result = await recallService.suspiciousChanneling();
      set({ channelingList: result });
    } catch (e) {
      set({ error: (e as Error).message || '加载窜货分析失败' });
    } finally {
      set({ loading: false });
    }
  },

  /** 加载召回统计 */
  loadStats: async () => {
    set({ statsLoading: true, error: null });
    try {
      const result = await reportService.fetchRecallStats();
      set({ stats: result });
    } catch (e) {
      set({ error: (e as Error).message || '加载召回统计失败' });
    } finally {
      set({ statsLoading: false });
    }
  },

  /** 设置分页 */
  setPagination: (page: number, pageSize?: number) => {
    const curr = get().pagination;
    set({
      pagination: {
        page,
        pageSize: pageSize ?? curr.pageSize,
        total: curr.total,
      },
    });
  },

  /** 清空当前工单 */
  clearCurrentOrder: () => {
    set({ currentOrder: null, progress: [] });
  },

  /** 清除错误 */
  clearError: () => set({ error: null }),
}));

export default useRecallStore;
