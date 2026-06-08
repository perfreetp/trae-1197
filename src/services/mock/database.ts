
import {
  Batch,
  TraceCode,
  Dealer,
  Store,
  WarehouseRecord,
  RecallOrder,
  OperationLog,
  ConsumerVerify,
  RawMaterial,
  QCReport,
  ProcessStep,
  generateBatches,
  generateTraceCodes,
  generateDealers,
  generateStores,
  generateWarehouseRecords,
  generateRecallOrders,
  generateOperationLogs,
  generateConsumerVerifies,
  genId,
  randomPick,
} from './generators';
import dayjs from 'dayjs';

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 分页查询结果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 通用筛选条件
 */
export type FilterCondition<T> = Partial<Record<keyof T, string | number | boolean | null | undefined>>;

/**
 * 内存数据库类
 */
class MockDatabase {
  private batches: Batch[] = [];
  private traceCodes: TraceCode[] = [];
  private dealers: Dealer[] = [];
  private stores: Store[] = [];
  private warehouseRecords: WarehouseRecord[] = [];
  private recallOrders: RecallOrder[] = [];
  private operationLogs: OperationLog[] = [];
  private consumerVerifies: ConsumerVerify[] = [];
  private initialized = false;

  /**
   * 初始化数据库，首次加载时调用
   */
  public init(): void {
    if (this.initialized) return;

    this.batches = generateBatches(15);
    this.dealers = generateDealers();

    this.stores = generateStores().map((store, idx) => ({
      ...store,
      dealerId: this.dealers[idx % this.dealers.length].id,
    }));

    for (const batch of this.batches) {
      const caseCount = Math.ceil(batch.actualQty / 200);
      const codes = generateTraceCodes(batch.id, caseCount).map(code => ({
        ...code,
        productName: batch.productName,
      }));
      this.traceCodes.push(...codes);
    }

    this.warehouseRecords = generateWarehouseRecords(this.batches).map(record => {
      if (record.type === '出库' && this.dealers.length > 0) {
        return {
          ...record,
          relatedDealerId: randomPick(this.dealers).id,
        };
      }
      return record;
    });

    this.recallOrders = generateRecallOrders(this.batches);
    this.operationLogs = generateOperationLogs(this.batches, this.dealers);
    this.consumerVerifies = generateConsumerVerifies(this.batches);

    this.initialized = true;
  }

  /**
   * 通用：筛选 + 分页
   */
  private filterAndPaginate<T>(
    list: T[],
    filters?: FilterCondition<T>,
    pagination?: PaginationParams,
    customMatch?: (item: T, flt: FilterCondition<T>) => boolean
  ): PaginatedResult<T> {
    let result = list;

    if (filters && Object.keys(filters).length > 0) {
      result = result.filter(item => {
        for (const key of Object.keys(filters) as Array<keyof T>) {
          const filterValue = filters[key];
          if (filterValue === undefined || filterValue === null || filterValue === '') continue;
          const itemValue = item[key];
          if (customMatch) {
            if (!customMatch(item, filters)) return false;
          } else {
            if (typeof filterValue === 'string' && typeof itemValue === 'string') {
              if (!itemValue.includes(filterValue)) return false;
            } else {
              if (itemValue !== filterValue) return false;
            }
          }
        }
        return true;
      });
    }

    const total = result.length;
    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const pageSize = pagination?.pageSize && pagination.pageSize > 0 ? pagination.pageSize : 10;
    const start = (page - 1) * pageSize;
    const data = result.slice(start, start + pageSize);

    return { data, total, page, pageSize };
  }

  // ========== 批次相关 ==========

  public listBatches(filters?: FilterCondition<Batch>, pagination?: PaginationParams): PaginatedResult<Batch> {
    return this.filterAndPaginate(this.batches, filters, pagination, (item, flt) => {
      for (const key of Object.keys(flt) as Array<keyof Batch>) {
        const fv = flt[key];
        if (fv === undefined || fv === null || fv === '') continue;
        const iv = item[key];
        if (typeof fv === 'string' && typeof iv === 'string') {
          if (!iv.toLowerCase().includes(fv.toLowerCase())) return false;
        } else {
          if (iv !== fv) return false;
        }
      }
      return true;
    });
  }

  public getBatch(id: string): Batch | null {
    return this.batches.find(b => b.id === id) || null;
  }

  public createBatch(data: Partial<Batch>): Batch {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newBatch: Batch = {
      id: genId('bat_'),
      batchNo: data.batchNo || `B${dayjs().format('YYYYMMDD')}${String(this.batches.length + 1).padStart(3, '0')}`,
      productName: data.productName || '未命名产品',
      spec: data.spec || '',
      manufacturer: data.manufacturer || '',
      planQty: data.planQty || 0,
      actualQty: data.actualQty || 0,
      unit: data.unit || '盒',
      status: data.status || '待生产',
      productionDate: data.productionDate || dayjs().format('YYYY-MM-DD'),
      expiryDate: data.expiryDate || dayjs().add(24, 'month').format('YYYY-MM-DD'),
      rawMaterials: data.rawMaterials || [],
      processSteps: data.processSteps || [],
      qcReport: data.qcReport || null,
      createdAt: now,
      updatedAt: now,
      isFrozen: data.isFrozen || false,
    };
    this.batches.unshift(newBatch);
    return newBatch;
  }

  public updateBatch(id: string, data: Partial<Batch>): Batch | null {
    const idx = this.batches.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.batches[idx] = {
      ...this.batches[idx],
      ...data,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    return this.batches[idx];
  }

  public deleteBatch(id: string): boolean {
    const idx = this.batches.findIndex(b => b.id === id);
    if (idx === -1) return false;
    this.batches.splice(idx, 1);
    return true;
  }

  /**
   * 批次：添加原料
   */
  public addRawMaterial(batchId: string, data: Partial<RawMaterial>): RawMaterial | null {
    const batch = this.getBatch(batchId);
    if (!batch) return null;
    const newMaterial: RawMaterial = {
      id: genId('mat_'),
      name: data.name || '',
      batchNo: data.batchNo || '',
      supplier: data.supplier || '',
      quantity: data.quantity || 0,
      unit: data.unit || 'kg',
      receiveDate: data.receiveDate || dayjs().format('YYYY-MM-DD HH:mm:ss'),
      inspectionResult: data.inspectionResult || '待检',
    };
    batch.rawMaterials.push(newMaterial);
    batch.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return newMaterial;
  }

  /**
   * 批次：更新工序步骤
   */
  public updateProcessStep(batchId: string, stepId: string, data: Partial<ProcessStep>): ProcessStep | null {
    const batch = this.getBatch(batchId);
    if (!batch) return null;
    const stepIdx = batch.processSteps.findIndex(s => s.id === stepId);
    if (stepIdx === -1) return null;
    batch.processSteps[stepIdx] = { ...batch.processSteps[stepIdx], ...data };
    batch.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return batch.processSteps[stepIdx];
  }

  /**
   * 批次：提交质检报告
   */
  public submitQCReport(batchId: string, data: Partial<QCReport>): QCReport | null {
    const batch = this.getBatch(batchId);
    if (!batch) return null;
    const qcReport: QCReport = {
      id: genId('qc_'),
      reportNo: data.reportNo || `QC${dayjs().format('YYYYMMDD')}${randomInt(1000, 9999)}`,
      reportDate: data.reportDate || dayjs().format('YYYY-MM-DD HH:mm:ss'),
      inspector: data.inspector || '',
      overallResult: data.overallResult || '待判定',
      items: data.items || [],
      remark: data.remark || '',
    };
    batch.qcReport = qcReport;
    batch.status = '质检中';
    batch.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return qcReport;
  }

  // ========== 追溯码相关 ==========

  public listTraceCodes(filters?: FilterCondition<TraceCode>, pagination?: PaginationParams): PaginatedResult<TraceCode> {
    return this.filterAndPaginate(this.traceCodes, filters, pagination);
  }

  public getTraceCodeByCode(code: string): TraceCode | null {
    return this.traceCodes.find(t => t.code === code) || null;
  }

  public createTraceCodes(codes: TraceCode[]): TraceCode[] {
    this.traceCodes.push(...codes);
    return codes;
  }

  public updateTraceCode(code: string, data: Partial<TraceCode>): TraceCode | null {
    const idx = this.traceCodes.findIndex(t => t.code === code);
    if (idx === -1) return null;
    this.traceCodes[idx] = { ...this.traceCodes[idx], ...data };
    return this.traceCodes[idx];
  }

  /**
   * 根据批次生成追溯码
   */
  public generateTraceCodesByBatch(batchId: string, caseCount: number): TraceCode[] {
    const batch = this.getBatch(batchId);
    if (!batch) return [];
    const codes = generateTraceCodes(batchId, caseCount).map(c => ({
      ...c,
      productName: batch.productName,
    }));
    this.traceCodes.push(...codes);
    return codes;
  }

  // ========== 经销商相关 ==========

  public listDealers(filters?: FilterCondition<Dealer>, pagination?: PaginationParams): PaginatedResult<Dealer> {
    return this.filterAndPaginate(this.dealers, filters, pagination, (item, flt) => {
      for (const key of Object.keys(flt) as Array<keyof Dealer>) {
        const fv = flt[key];
        if (fv === undefined || fv === null || fv === '') continue;
        const iv = item[key];
        if (typeof fv === 'string' && typeof iv === 'string') {
          if (!iv.toLowerCase().includes(fv.toLowerCase())) return false;
        } else {
          if (iv !== fv) return false;
        }
      }
      return true;
    });
  }

  public getDealer(id: string): Dealer | null {
    return this.dealers.find(d => d.id === id) || null;
  }

  // ========== 门店相关 ==========

  public listStores(filters?: FilterCondition<Store>, pagination?: PaginationParams): PaginatedResult<Store> {
    return this.filterAndPaginate(this.stores, filters, pagination, (item, flt) => {
      for (const key of Object.keys(flt) as Array<keyof Store>) {
        const fv = flt[key];
        if (fv === undefined || fv === null || fv === '') continue;
        const iv = item[key];
        if (typeof fv === 'string' && typeof iv === 'string') {
          if (!iv.toLowerCase().includes(fv.toLowerCase())) return false;
        } else {
          if (iv !== fv) return false;
        }
      }
      return true;
    });
  }

  public getStore(id: string): Store | null {
    return this.stores.find(s => s.id === id) || null;
  }

  // ========== 仓储记录相关 ==========

  public listWarehouseRecords(filters?: FilterCondition<WarehouseRecord>, pagination?: PaginationParams): PaginatedResult<WarehouseRecord> {
    return this.filterAndPaginate(this.warehouseRecords, filters, pagination, (item, flt) => {
      for (const key of Object.keys(flt) as Array<keyof WarehouseRecord>) {
        const fv = flt[key];
        if (fv === undefined || fv === null || fv === '') continue;
        const iv = item[key];
        if (typeof fv === 'string' && typeof iv === 'string') {
          if (!iv.toLowerCase().includes(fv.toLowerCase())) return false;
        } else {
          if (iv !== fv) return false;
        }
      }
      return true;
    });
  }

  public createWarehouseRecord(data: Partial<WarehouseRecord>): WarehouseRecord {
    const record: WarehouseRecord = {
      id: genId('wh_'),
      recordNo: data.recordNo || `${(data.type || 'IN')}${dayjs().format('YYYYMMDD')}${randomInt(100000, 999999)}`,
      traceCode: data.traceCode || '',
      batchId: data.batchId || '',
      batchNo: data.batchNo || '',
      productName: data.productName || '',
      type: data.type || '入库',
      warehouse: data.warehouse || '',
      location: data.location || '',
      quantity: data.quantity || 0,
      relatedOrderId: data.relatedOrderId || null,
      relatedDealerId: data.relatedDealerId || null,
      operator: data.operator || '',
      operateTime: data.operateTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: data.remark || '',
    };
    this.warehouseRecords.unshift(record);
    return record;
  }

  // ========== 召回工单相关 ==========

  public listRecallOrders(filters?: FilterCondition<RecallOrder>, pagination?: PaginationParams): PaginatedResult<RecallOrder> {
    return this.filterAndPaginate(this.recallOrders, filters, pagination, (item, flt) => {
      for (const key of Object.keys(flt) as Array<keyof RecallOrder>) {
        const fv = flt[key];
        if (fv === undefined || fv === null || fv === '') continue;
        const iv = item[key];
        if (typeof fv === 'string' && typeof iv === 'string') {
          if (!iv.toLowerCase().includes(fv.toLowerCase())) return false;
        } else {
          if (iv !== fv) return false;
        }
      }
      return true;
    });
  }

  public getRecallOrder(id: string): RecallOrder | null {
    return this.recallOrders.find(r => r.id === id) || null;
  }

  public createRecallOrder(data: Partial<RecallOrder>): RecallOrder {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const order: RecallOrder = {
      id: genId('rc_'),
      orderNo: data.orderNo || `RC${dayjs().format('YYYYMMDD')}${String(this.recallOrders.length + 1).padStart(3, '0')}`,
      batchId: data.batchId || '',
      batchNo: data.batchNo || '',
      productName: data.productName || '',
      reason: data.reason || '',
      level: data.level || '二级召回',
      status: data.status || '待启动',
      initiator: data.initiator || '',
      affectedQty: data.affectedQty || 0,
      recalledQty: data.recalledQty || 0,
      createdAt: now,
      expectCompleteDate: data.expectCompleteDate || dayjs().add(30, 'day').format('YYYY-MM-DD'),
      progressList: data.progressList || [],
    };
    this.recallOrders.unshift(order);
    return order;
  }

  public updateRecallOrder(id: string, data: Partial<RecallOrder>): RecallOrder | null {
    const idx = this.recallOrders.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.recallOrders[idx] = { ...this.recallOrders[idx], ...data };
    return this.recallOrders[idx];
  }

  // ========== 操作日志相关 ==========

  public listOperationLogs(filters?: FilterCondition<OperationLog>, pagination?: PaginationParams): PaginatedResult<OperationLog> {
    return this.filterAndPaginate(this.operationLogs, filters, pagination);
  }

  public createOperationLog(data: Partial<OperationLog>): OperationLog {
    const log: OperationLog = {
      id: genId('log_'),
      logNo: data.logNo || `LOG${dayjs().format('YYYYMMDD')}${String(this.operationLogs.length + 1).padStart(5, '0')}`,
      operator: data.operator || '',
      module: data.module || '',
      action: data.action || '',
      targetId: data.targetId || '',
      targetName: data.targetName || '',
      operateTime: data.operateTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
      ip: data.ip || '127.0.0.1',
      remark: data.remark || '',
      status: data.status || '成功',
    };
    this.operationLogs.unshift(log);
    return log;
  }

  // ========== 消费者验真相关 ==========

  public listConsumerVerifies(filters?: FilterCondition<ConsumerVerify>, pagination?: PaginationParams): PaginatedResult<ConsumerVerify> {
    return this.filterAndPaginate(this.consumerVerifies, filters, pagination);
  }

  /**
   * 获取原始数据引用（用于报表统计计算）
   */
  public getRawBatches(): Batch[] { return this.batches; }
  public getRawDealers(): Dealer[] { return this.dealers; }
  public getRawStores(): Store[] { return this.stores; }
  public getRawWarehouseRecords(): WarehouseRecord[] { return this.warehouseRecords; }
  public getRawRecallOrders(): RecallOrder[] { return this.recallOrders; }
  public getRawOperationLogs(): OperationLog[] { return this.operationLogs; }
  public getRawConsumerVerifies(): ConsumerVerify[] { return this.consumerVerifies; }
  public getRawTraceCodes(): TraceCode[] { return this.traceCodes; }
}

/**
 * 随机整数工具函数（从generators导出的可能未使用，这里局部定义）
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 数据库单例实例
 */
const db = new MockDatabase();
db.init();

export { db };
export default db;
