
import { create } from 'zustand';
import { warehouseService, InventoryItem, WarehouseQueryParams, InventoryQueryParams, ScanInboundFail, ScanOutboundFail } from '../services/warehouseService';
import { WarehouseRecord } from '../services/mock/generators';
import { PaginatedResult } from '../services/mock/database';

export type ScanFailReason =
  | 'code_not_found'
  | 'status_conflict'
  | 'batch_frozen';

/**
 * 扫码结果项
 */
export interface ScanResult {
  id: string;
  code: string;
  type: '入库' | '出库';
  productName: string;
  batchNo: string;
  quantity: number;
  operator: string;
  time: string;
  status: 'success' | 'error';
  message: string;
  failReason?: ScanFailReason;
  codeStatus?: string;
  frozenBatchNo?: string;
}

/**
 * 仓储管理 Store 状态接口
 */
interface WarehouseState {
  /** 出入库记录列表 */
  records: WarehouseRecord[];
  /** 库存列表 */
  inventory: InventoryItem[];
  /** 临期预警列表 */
  expiryItems: InventoryItem[];
  /** 出入库记录分页信息 */
  recordPagination: { page: number; pageSize: number; total: number };
  /** 库存分页信息 */
  inventoryPagination: { page: number; pageSize: number; total: number };
  /** 列表加载状态 */
  loading: boolean;
  /** 扫码操作状态 */
  scanning: boolean;
  /** 最近 10 条扫码记录 */
  recentScans: ScanResult[];
  /** 错误信息 */
  error: string | null;

  // ========== Actions ==========

  /** 入库扫码 */
  scanInbound: (traceCode: string, warehouse: string, location: string, operator: string) => Promise<boolean>;
  /** 出库扫码 */
  scanOutbound: (traceCode: string, dealerId: string, orderId: string, operator: string) => Promise<boolean>;
  /** 加载出入库记录 */
  loadRecords: (params?: WarehouseQueryParams) => Promise<void>;
  /** 经销商签收 */
  dealerSign: (traceCode: string, dealerId: string, signer: string, remark?: string) => Promise<boolean>;
  /** 门店到货确认 */
  storeArrival: (traceCode: string, storeId: string, confirmer: string) => Promise<boolean>;
  /** 加载库存列表 */
  loadInventory: (params?: InventoryQueryParams) => Promise<void>;
  /** 加载临期预警 */
  loadExpiryWarning: (days?: number) => Promise<void>;
  /** 设置记录分页 */
  setRecordPagination: (page: number, pageSize?: number) => void;
  /** 设置库存分页 */
  setInventoryPagination: (page: number, pageSize?: number) => void;
  /** 清空最近扫码 */
  clearRecentScans: () => void;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 仓储管理 Zustand Store
 */
export const useWarehouseStore = create<WarehouseState>((set, get) => ({
  records: [],
  inventory: [],
  expiryItems: [],
  recordPagination: { page: 1, pageSize: 10, total: 0 },
  inventoryPagination: { page: 1, pageSize: 10, total: 0 },
  loading: false,
  scanning: false,
  recentScans: [],
  error: null,

  /** 入库扫码 */
  scanInbound: async (traceCode: string, warehouse: string, location: string, operator: string) => {
    set({ scanning: true, error: null });
    try {
      const result = await warehouseService.scanInbound(traceCode, warehouse, location, operator);
      if (result.success) {
        const { record } = result;
        const scan: ScanResult = {
          id: record.id,
          code: traceCode,
          type: '入库',
          productName: record.productName,
          batchNo: record.batchNo,
          quantity: record.quantity,
          operator,
          time: record.operateTime,
          status: 'success',
          message: `入库成功：${record.productName} x${record.quantity}`,
        };
        const scans = [scan, ...get().recentScans].slice(0, 10);
        set({ recentScans: scans });
        return true;
      } else {
        const fail = result as ScanInboundFail;
        const scan: ScanResult = {
          id: Date.now().toString(),
          code: traceCode,
          type: '入库',
          productName: '',
          batchNo: '',
          quantity: 0,
          operator,
          time: new Date().toISOString(),
          status: 'error',
          message: fail.message,
          failReason: fail.reason,
          codeStatus: fail.codeStatus,
        };
        const scans = [scan, ...get().recentScans].slice(0, 10);
        set({ recentScans: scans, error: scan.message });
        return false;
      }
    } catch (e) {
      set({ error: (e as Error).message || '入库扫码失败' });
      return false;
    } finally {
      set({ scanning: false });
    }
  },

  /** 出库扫码 */
  scanOutbound: async (traceCode: string, dealerId: string, orderId: string, operator: string) => {
    set({ scanning: true, error: null });
    try {
      const result = await warehouseService.scanOutbound(traceCode, dealerId, orderId, operator);
      if (result.success) {
        const { record } = result;
        const scan: ScanResult = {
          id: record.id,
          code: traceCode,
          type: '出库',
          productName: record.productName,
          batchNo: record.batchNo,
          quantity: record.quantity,
          operator,
          time: record.operateTime,
          status: 'success',
          message: `出库成功：${record.productName} x${record.quantity}`,
        };
        const scans = [scan, ...get().recentScans].slice(0, 10);
        set({ recentScans: scans });
        return true;
      } else {
        const fail = result as ScanOutboundFail;
        const scan: ScanResult = {
          id: Date.now().toString(),
          code: traceCode,
          type: '出库',
          productName: '',
          batchNo: '',
          quantity: 0,
          operator,
          time: new Date().toISOString(),
          status: 'error',
          message: fail.message,
          failReason: fail.reason,
          codeStatus: fail.codeStatus,
          frozenBatchNo: fail.batchNo,
        };
        const scans = [scan, ...get().recentScans].slice(0, 10);
        set({ recentScans: scans, error: scan.message });
        return false;
      }
    } catch (e) {
      set({ error: (e as Error).message || '出库扫码失败' });
      return false;
    } finally {
      set({ scanning: false });
    }
  },

  /** 加载出入库记录 */
  loadRecords: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { page, pageSize } = get().recordPagination;
      const result: PaginatedResult<WarehouseRecord> = await warehouseService.fetchWarehouseRecords({
        page,
        pageSize,
        ...params,
      });
      set({
        records: result.data,
        recordPagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        },
      });
    } catch (e) {
      set({ error: (e as Error).message || '加载仓储记录失败' });
    } finally {
      set({ loading: false });
    }
  },

  /** 经销商签收 */
  dealerSign: async (traceCode: string, dealerId: string, signer: string, remark: string = '') => {
    set({ scanning: true, error: null });
    try {
      const result = await warehouseService.dealerSign(traceCode, dealerId, signer, remark);
      if (!result) {
        set({ error: '签收失败：追溯码状态不正确' });
      }
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '签收失败' });
      return false;
    } finally {
      set({ scanning: false });
    }
  },

  /** 门店到货确认 */
  storeArrival: async (traceCode: string, storeId: string, confirmer: string) => {
    set({ scanning: true, error: null });
    try {
      const result = await warehouseService.storeArrival(traceCode, storeId, confirmer);
      if (!result) {
        set({ error: '确认失败：追溯码状态不正确' });
      }
      return result;
    } catch (e) {
      set({ error: (e as Error).message || '确认失败' });
      return false;
    } finally {
      set({ scanning: false });
    }
  },

  /** 加载库存列表 */
  loadInventory: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { page, pageSize } = get().inventoryPagination;
      const result = await warehouseService.fetchInventory({
        page,
        pageSize,
        ...params,
      });
      set({
        inventory: result.data,
        inventoryPagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        },
      });
    } catch (e) {
      set({ error: (e as Error).message || '加载库存失败' });
    } finally {
      set({ loading: false });
    }
  },

  /** 加载临期预警 */
  loadExpiryWarning: async (days: number = 90) => {
    set({ loading: true, error: null });
    try {
      const result = await warehouseService.expiryWarning(days);
      set({ expiryItems: result });
    } catch (e) {
      set({ error: (e as Error).message || '加载临期预警失败' });
    } finally {
      set({ loading: false });
    }
  },

  /** 设置记录分页 */
  setRecordPagination: (page: number, pageSize?: number) => {
    const curr = get().recordPagination;
    set({
      recordPagination: {
        page,
        pageSize: pageSize ?? curr.pageSize,
        total: curr.total,
      },
    });
  },

  /** 设置库存分页 */
  setInventoryPagination: (page: number, pageSize?: number) => {
    const curr = get().inventoryPagination;
    set({
      inventoryPagination: {
        page,
        pageSize: pageSize ?? curr.pageSize,
        total: curr.total,
      },
    });
  },

  /** 清空最近扫码 */
  clearRecentScans: () => set({ recentScans: [] }),

  /** 清除错误 */
  clearError: () => set({ error: null }),
}));

export default useWarehouseStore;
