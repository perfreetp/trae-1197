
import { db, PaginationParams, PaginatedResult, FilterCondition } from './mock/database';
import { WarehouseRecord } from './mock/generators';
import dayjs from 'dayjs';

/**
 * 模拟网络延时
 */
function delay<T>(data: T, min = 100, max = 400): Promise<T> {
  return new Promise(resolve => {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(() => resolve(data), ms);
  });
}

/**
 * 库存记录项
 */
export interface InventoryItem {
  id: string;
  batchId: string;
  batchNo: string;
  productName: string;
  spec: string;
  warehouse: string;
  location: string;
  stockQty: number;
  inboundQty: number;
  outboundQty: number;
  productionDate: string;
  expiryDate: string;
  daysToExpiry: number;
}

/**
 * 仓储查询参数
 */
export interface WarehouseQueryParams extends PaginationParams {
  type?: '入库' | '出库';
  keyword?: string;
  batchNo?: string;
  warehouse?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 库存查询参数
 */
export interface InventoryQueryParams extends PaginationParams {
  keyword?: string;
  warehouse?: string;
}

/**
 * 仓储相关服务 API
 */
export const warehouseService = {
  /**
   * 入库扫码
   */
  async scanInbound(traceCode: string, warehouse: string, location: string, operator: string): Promise<WarehouseRecord | null> {
    const code = db.getTraceCodeByCode(traceCode);
    if (!code) return delay(null);

    const batch = db.getBatch(code.batchId);
    const qty = code.level === '箱' ? 200 : code.level === '盒' ? 10 : 1;

    db.updateTraceCode(traceCode, { status: '已入库', location: `${warehouse} ${location}` });

    const record = db.createWarehouseRecord({
      traceCode,
      batchId: code.batchId,
      batchNo: batch?.batchNo || '',
      productName: code.productName,
      type: '入库',
      warehouse,
      location,
      quantity: qty,
      operator,
      remark: `扫码入库，追溯码层级：${code.level}`,
    });

    db.createOperationLog({
      module: '仓储管理',
      action: '入库扫码',
      targetId: record.id,
      targetName: `${code.productName}（${batch?.batchNo}）`,
      operator,
      ip: '127.0.0.1',
      remark: `${warehouse} ${location}`,
    });

    return delay(record);
  },

  /**
   * 出库扫码
   */
  async scanOutbound(traceCode: string, dealerId: string, orderId: string, operator: string): Promise<WarehouseRecord | null> {
    const code = db.getTraceCodeByCode(traceCode);
    if (!code) return delay(null);
    if (code.status !== '已入库') return delay(null);

    const batch = db.getBatch(code.batchId);
    const dealer = db.getDealer(dealerId);
    const qty = code.level === '箱' ? 200 : code.level === '盒' ? 10 : 1;

    db.updateTraceCode(traceCode, { status: '已出库', location: dealer ? `发往${dealer.city}` : '待配送' });

    const record = db.createWarehouseRecord({
      traceCode,
      batchId: code.batchId,
      batchNo: batch?.batchNo || '',
      productName: code.productName,
      type: '出库',
      warehouse: db.listWarehouseRecords({ traceCode } as FilterCondition<WarehouseRecord>)?.data[0]?.warehouse || '',
      location: dealer?.city || '',
      quantity: qty,
      relatedOrderId: orderId,
      relatedDealerId: dealerId,
      operator,
      remark: `出库配送至经销商，订单号：${orderId}`,
    });

    db.createOperationLog({
      module: '仓储管理',
      action: '出库扫码',
      targetId: record.id,
      targetName: `${code.productName}（${batch?.batchNo}）`,
      operator,
      ip: '127.0.0.1',
      remark: `经销商：${dealer?.dealerName || dealerId}，订单：${orderId}`,
    });

    return delay(record);
  },

  /**
   * 查询出入库记录（分页）
   */
  async fetchWarehouseRecords(params: WarehouseQueryParams = {}): Promise<PaginatedResult<WarehouseRecord>> {
    const filters: FilterCondition<WarehouseRecord> = {};
    if (params.type) filters.type = params.type;
    if (params.batchNo) filters.batchNo = params.batchNo;
    if (params.warehouse) filters.warehouse = params.warehouse;

    let result = db.listWarehouseRecords(filters, { page: params.page, pageSize: params.pageSize });

    if (params.startDate) {
      result.data = result.data.filter(r => dayjs(r.operateTime).isAfter(dayjs(params.startDate)));
    }
    if (params.endDate) {
      result.data = result.data.filter(r => dayjs(r.operateTime).isBefore(dayjs(params.endDate).add(1, 'day')));
    }
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      result.data = result.data.filter(
        r => r.productName.toLowerCase().includes(kw) ||
          r.batchNo.toLowerCase().includes(kw) ||
          r.recordNo.toLowerCase().includes(kw) ||
          r.operator.includes(params.keyword as string)
      );
    }
    result.total = result.data.length;

    return delay(result);
  },

  /**
   * 经销商签收
   */
  async dealerSign(traceCode: string, dealerId: string, signer: string, remark: string): Promise<boolean> {
    const code = db.getTraceCodeByCode(traceCode);
    if (!code || code.status !== '已出库') return delay(false);

    const dealer = db.getDealer(dealerId);
    db.updateTraceCode(traceCode, { status: '经销商签收', location: dealer?.dealerName || dealerId });

    db.createOperationLog({
      module: '经销商管理',
      action: '经销商签收',
      targetId: code.id,
      targetName: `${code.productName} 追溯码 ${code.code}`,
      operator: signer,
      ip: '127.0.0.1',
      remark: `经销商：${dealer?.dealerName || dealerId}，签收人：${signer}${remark ? '，备注：' + remark : ''}`,
    });

    return delay(true);
  },

  /**
   * 门店到货确认
   */
  async storeArrival(traceCode: string, storeId: string, confirmer: string): Promise<boolean> {
    const code = db.getTraceCodeByCode(traceCode);
    if (!code || code.status !== '经销商签收') return delay(false);

    const store = db.getStore(storeId);
    db.updateTraceCode(traceCode, { status: '门店收货', location: store?.storeName || storeId });

    db.createOperationLog({
      module: '门店管理',
      action: '门店收货确认',
      targetId: code.id,
      targetName: `${code.productName} 追溯码 ${code.code}`,
      operator: confirmer,
      ip: '127.0.0.1',
      remark: `门店：${store?.storeName || storeId}，确认人：${confirmer}`,
    });

    return delay(true);
  },

  /**
   * 库存查询
   */
  async fetchInventory(params: InventoryQueryParams = {}): Promise<PaginatedResult<InventoryItem>> {
    const batches = db.getRawBatches();
    const records = db.getRawWarehouseRecords();
    const now = dayjs();

    const inventoryMap = new Map<string, InventoryItem>();

    for (const batch of batches) {
      const key = batch.id;
      if (!inventoryMap.has(key)) {
        const daysToExpiry = dayjs(batch.expiryDate).diff(now, 'day');
        inventoryMap.set(key, {
          id: batch.id,
          batchId: batch.id,
          batchNo: batch.batchNo,
          productName: batch.productName,
          spec: batch.spec,
          warehouse: '',
          location: '',
          stockQty: 0,
          inboundQty: 0,
          outboundQty: 0,
          productionDate: batch.productionDate,
          expiryDate: batch.expiryDate,
          daysToExpiry,
        });
      }
      const item = inventoryMap.get(key)!;
      const relatedRecords = records.filter(r => r.batchId === batch.id);
      const inbound = relatedRecords
        .filter(r => r.type === '入库')
        .reduce((sum, r) => sum + r.quantity, 0);
      const outbound = relatedRecords
        .filter(r => r.type === '出库')
        .reduce((sum, r) => sum + r.quantity, 0);
      item.inboundQty = inbound;
      item.outboundQty = outbound;
      item.stockQty = inbound - outbound;
      const lastInbound = relatedRecords.filter(r => r.type === '入库').sort((a, b) =>
        dayjs(b.operateTime).valueOf() - dayjs(a.operateTime).valueOf()
      )[0];
      if (lastInbound) {
        item.warehouse = lastInbound.warehouse;
        item.location = lastInbound.location;
      }
    }

    let list = Array.from(inventoryMap.values()).filter(i => i.stockQty > 0);

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      list = list.filter(i =>
        i.productName.toLowerCase().includes(kw) ||
        i.batchNo.toLowerCase().includes(kw)
      );
    }
    if (params.warehouse) {
      list = list.filter(i => i.warehouse.includes(params.warehouse as string));
    }

    const total = list.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;

    return delay({
      data: list.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    });
  },

  /**
   * 临期预警
   * @param days 预警天数，默认90天
   */
  async expiryWarning(days: number = 90): Promise<InventoryItem[]> {
    const { data } = await this.fetchInventory({ page: 1, pageSize: 9999 });
    const result = data.filter(i => i.daysToExpiry <= days).sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    return delay(result);
  },
};

export default warehouseService;
