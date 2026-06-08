
import { db, PaginationParams, FilterCondition, PaginatedResult } from './mock/database';
import { Batch, RawMaterial, ProcessStep, QCReport, TraceCode } from './mock/generators';

/**
 * 模拟网络延时 100-400ms
 */
function delay<T>(data: T, min = 100, max = 400): Promise<T> {
  return new Promise(resolve => {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(() => resolve(data), ms);
  });
}

/**
 * 批次查询筛选参数
 */
export interface BatchQueryParams extends PaginationParams {
  keyword?: string;
  status?: string;
  productName?: string;
  batchNo?: string;
}

/**
 * 批次相关服务 API
 */
export const batchService = {
  /**
   * 分页查询批次列表
   */
  async fetchBatches(params: BatchQueryParams = {}): Promise<PaginatedResult<Batch>> {
    const filters: FilterCondition<Batch> = {};
    if (params.status) filters.status = params.status;
    if (params.batchNo) filters.batchNo = params.batchNo;
    if (params.productName) filters.productName = params.productName;
    if (params.keyword) {
      const result = db.listBatches({} as FilterCondition<Batch>, { page: params.page, pageSize: params.pageSize });
      const kw = params.keyword.toLowerCase();
      const filtered = result.data.filter(
        b => b.productName.toLowerCase().includes(kw) ||
          b.batchNo.toLowerCase().includes(kw) ||
          b.manufacturer.toLowerCase().includes(kw)
      );
      return delay({
        data: filtered,
        total: filtered.length,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      });
    }
    return delay(db.listBatches(filters, { page: params.page, pageSize: params.pageSize }));
  },

  /**
   * 根据 ID 获取单个批次详情
   */
  async fetchBatch(id: string): Promise<Batch | null> {
    return delay(db.getBatch(id));
  },

  /**
   * 创建新批次
   */
  async createBatch(data: Partial<Batch>): Promise<Batch> {
    const result = db.createBatch(data);
    db.createOperationLog({
      module: '批次管理',
      action: '创建批次',
      targetId: result.id,
      targetName: `${result.productName}（${result.batchNo}）`,
      operator: '当前用户',
      ip: '127.0.0.1',
      remark: `计划产量：${result.planQty}${result.unit}`,
    });
    return delay(result);
  },

  /**
   * 更新批次信息
   */
  async updateBatch(id: string, data: Partial<Batch>): Promise<Batch | null> {
    const result = db.updateBatch(id, data);
    if (result) {
      db.createOperationLog({
        module: '批次管理',
        action: '更新批次',
        targetId: result.id,
        targetName: `${result.productName}（${result.batchNo}）`,
        operator: '当前用户',
        ip: '127.0.0.1',
      });
    }
    return delay(result);
  },

  /**
   * 向批次添加原料
   */
  async addRawMaterial(batchId: string, data: Partial<RawMaterial>): Promise<RawMaterial | null> {
    const result = db.addRawMaterial(batchId, data);
    if (result) {
      const batch = db.getBatch(batchId);
      db.createOperationLog({
        module: '批次管理',
        action: '新增原料',
        targetId: batchId,
        targetName: batch ? `${batch.productName}（${batch.batchNo}）` : batchId,
        operator: '当前用户',
        ip: '127.0.0.1',
        remark: `原料名称：${result.name}，数量：${result.quantity}${result.unit}`,
      });
    }
    return delay(result);
  },

  /**
   * 更新批次的工序步骤
   */
  async updateProcessStep(batchId: string, stepId: string, data: Partial<ProcessStep>): Promise<ProcessStep | null> {
    const result = db.updateProcessStep(batchId, stepId, data);
    if (result) {
      const batch = db.getBatch(batchId);
      db.createOperationLog({
        module: '批次管理',
        action: '更新工序状态',
        targetId: batchId,
        targetName: batch ? `${batch.productName}（${batch.batchNo}）` : batchId,
        operator: result.operator,
        ip: '127.0.0.1',
        remark: `工序：${result.stepName}，状态：${result.status}`,
      });
    }
    return delay(result);
  },

  /**
   * 提交质检报告
   */
  async submitQCReport(batchId: string, data: Partial<QCReport>): Promise<QCReport | null> {
    const result = db.submitQCReport(batchId, data);
    if (result) {
      const batch = db.getBatch(batchId);
      db.createOperationLog({
        module: '质量管理',
        action: '提交质检报告',
        targetId: batchId,
        targetName: batch ? `${batch.productName}（${batch.batchNo}）` : batchId,
        operator: result.inspector,
        ip: '127.0.0.1',
        remark: `检验结果：${result.overallResult}，报告编号：${result.reportNo}`,
      });
      if (result.overallResult === '合格' && batch) {
        db.updateBatch(batchId, { status: '已完成' });
      }
    }
    return delay(result);
  },

  /**
   * 为指定批次生成追溯码
   * @param batchId 批次ID
   * @param qty 箱数量
   */
  async generateCodes(batchId: string, qty: number): Promise<TraceCode[]> {
    const result = db.generateTraceCodesByBatch(batchId, qty);
    const batch = db.getBatch(batchId);
    db.createOperationLog({
      module: '追溯码管理',
      action: '生成追溯码',
      targetId: batchId,
      targetName: batch ? `${batch.productName}（${batch.batchNo}）` : batchId,
      operator: '当前用户',
      ip: '127.0.0.1',
      remark: `生成${qty}箱追溯码，共${result.length}条`,
    });
    return delay(result);
  },
};

export default batchService;
