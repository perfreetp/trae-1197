
import { create } from 'zustand';
import { batchService, BatchQueryParams } from '../services/batchService';
import { Batch, RawMaterial, ProcessStep, QCReport, TraceCode } from '../services/mock/generators';
import { PaginatedResult } from '../services/mock/database';

/**
 * 批次管理 Store 状态接口
 */
interface BatchState {
  /** 批次列表数据 */
  batches: Batch[];
  /** 当前选中的批次详情 */
  currentBatch: Batch | null;
  /** 分页信息 */
  pagination: { page: number; pageSize: number; total: number };
  /** 列表加载状态 */
  loading: boolean;
  /** 详情加载状态 */
  detailLoading: boolean;
  /** 提交操作加载状态 */
  submitting: boolean;
  /** 最近一次生成的追溯码 */
  lastGeneratedCodes: TraceCode[];
  /** 错误信息 */
  error: string | null;

  // ========== Actions ==========

  /** 加载批次列表（分页筛选） */
  loadBatches: (params?: BatchQueryParams) => Promise<void>;
  /** 加载单个批次详情 */
  loadBatch: (id: string) => Promise<void>;
  /** 清空当前批次 */
  clearCurrentBatch: () => void;
  /** 创建新批次 */
  createBatch: (data: Partial<Batch>) => Promise<Batch | null>;
  /** 更新批次 */
  updateBatch: (id: string, data: Partial<Batch>) => Promise<boolean>;
  /** 向批次添加原料 */
  addMaterial: (batchId: string, data: Partial<RawMaterial>) => Promise<RawMaterial | null>;
  /** 更新工序步骤 */
  updateStep: (batchId: string, stepId: string, data: Partial<ProcessStep>) => Promise<ProcessStep | null>;
  /** 提交质检报告 */
  submitQC: (batchId: string, data: Partial<QCReport>) => Promise<QCReport | null>;
  /** 生成追溯码 */
  genCodes: (batchId: string, qty: number) => Promise<TraceCode[]>;
  /** 设置分页 */
  setPagination: (page: number, pageSize?: number) => void;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 批次管理 Zustand Store
 */
export const useBatchStore = create<BatchState>((set, get) => ({
  batches: [],
  currentBatch: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  loading: false,
  detailLoading: false,
  submitting: false,
  lastGeneratedCodes: [],
  error: null,

  /** 加载批次列表 */
  loadBatches: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { page, pageSize } = get().pagination;
      const result: PaginatedResult<Batch> = await batchService.fetchBatches({
        page,
        pageSize,
        ...params,
      });
      set({
        batches: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        },
      });
    } catch (e) {
      set({ error: (e as Error).message || '加载批次列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  /** 加载单个批次详情 */
  loadBatch: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const batch = await batchService.fetchBatch(id);
      set({ currentBatch: batch });
    } catch (e) {
      set({ error: (e as Error).message || '加载批次详情失败' });
    } finally {
      set({ detailLoading: false });
    }
  },

  /** 清空当前批次 */
  clearCurrentBatch: () => {
    set({ currentBatch: null });
  },

  /** 创建新批次 */
  createBatch: async (data: Partial<Batch>) => {
    set({ submitting: true, error: null });
    try {
      const result = await batchService.createBatch(data);
      const { batches, pagination } = get();
      set({
        batches: [result, ...batches].slice(0, pagination.pageSize),
        pagination: { ...pagination, total: pagination.total + 1 },
      });
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '创建批次失败' });
      return null;
    } finally {
      set({ submitting: false });
    }
  },

  /** 更新批次 */
  updateBatch: async (id: string, data: Partial<Batch>) => {
    set({ submitting: true, error: null });
    try {
      const result = await batchService.updateBatch(id, data);
      if (result) {
        const { batches, currentBatch } = get();
        set({
          batches: batches.map(b => (b.id === id ? result : b)),
          currentBatch: currentBatch?.id === id ? result : currentBatch,
        });
        return true;
      }
      return false;
    } catch (e) {
      set({ error: (e as Error).message || '更新批次失败' });
      return false;
    } finally {
      set({ submitting: false });
    }
  },

  /** 向批次添加原料 */
  addMaterial: async (batchId: string, data: Partial<RawMaterial>) => {
    set({ submitting: true, error: null });
    try {
      const result = await batchService.addRawMaterial(batchId, data);
      if (result) {
        const currentBatch = get().currentBatch;
        if (currentBatch?.id === batchId) {
          set({
            currentBatch: {
              ...currentBatch,
              rawMaterials: [...currentBatch.rawMaterials, result],
            },
          });
        }
      }
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '添加原料失败' });
      return null;
    } finally {
      set({ submitting: false });
    }
  },

  /** 更新工序步骤 */
  updateStep: async (batchId: string, stepId: string, data: Partial<ProcessStep>) => {
    set({ submitting: true, error: null });
    try {
      const result = await batchService.updateProcessStep(batchId, stepId, data);
      if (result) {
        const currentBatch = get().currentBatch;
        if (currentBatch?.id === batchId) {
          set({
            currentBatch: {
              ...currentBatch,
              processSteps: currentBatch.processSteps.map(s =>
                s.id === stepId ? result : s
              ),
            },
          });
        }
      }
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '更新工序失败' });
      return null;
    } finally {
      set({ submitting: false });
    }
  },

  /** 提交质检报告 */
  submitQC: async (batchId: string, data: Partial<QCReport>) => {
    set({ submitting: true, error: null });
    try {
      const result = await batchService.submitQCReport(batchId, data);
      if (result) {
        const currentBatch = get().currentBatch;
        if (currentBatch?.id === batchId) {
          set({
            currentBatch: {
              ...currentBatch,
              qcReport: result,
              status: result.overallResult === '合格' ? '已完成' : '质检中',
            },
          });
        }
        const { batches } = get();
        set({
          batches: batches.map(b =>
            b.id === batchId
              ? { ...b, qcReport: result, status: result.overallResult === '合格' ? '已完成' : '质检中' }
              : b
          ),
        });
      }
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '提交质检报告失败' });
      return null;
    } finally {
      set({ submitting: false });
    }
  },

  /** 生成追溯码 */
  genCodes: async (batchId: string, qty: number) => {
    set({ submitting: true, error: null });
    try {
      const result = await batchService.generateCodes(batchId, qty);
      set({ lastGeneratedCodes: result });
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '生成追溯码失败' });
      return [];
    } finally {
      set({ submitting: false });
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

  /** 清除错误 */
  clearError: () => set({ error: null }),
}));

export default useBatchStore;
