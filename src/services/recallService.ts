
import { db, PaginationParams, PaginatedResult, FilterCondition } from './mock/database';
import { RecallOrder, RecallProgress } from './mock/generators';
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
 * 窜货分析项
 */
export interface ChannelingItem {
  id: string;
  traceCode: string;
  batchId: string;
  batchNo: string;
  productName: string;
  expectedCity: string;
  actualCity: string;
  dealerId: string;
  dealerName: string;
  verifyTime: string;
  channel: string;
  status: '疑似窜货' | '已核实' | '已处理';
}

/**
 * 召回工单查询参数
 */
export interface RecallQueryParams extends PaginationParams {
  keyword?: string;
  status?: string;
  level?: string;
}

/**
 * 召回相关服务 API
 */
export const recallService = {
  /**
   * 分页查询召回工单列表
   */
  async fetchRecallOrders(params: RecallQueryParams = {}): Promise<PaginatedResult<RecallOrder>> {
    const filters: FilterCondition<RecallOrder> = {};
    if (params.status) filters.status = params.status;
    if (params.level) filters.level = params.level;

    let result = db.listRecallOrders(filters, { page: params.page, pageSize: params.pageSize });

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      result.data = result.data.filter(
        r => r.productName.toLowerCase().includes(kw) ||
          r.batchNo.toLowerCase().includes(kw) ||
          r.orderNo.toLowerCase().includes(kw) ||
          r.reason.includes(params.keyword as string)
      );
      result.total = result.data.length;
    }

    return delay(result);
  },

  /**
   * 创建召回工单
   */
  async createRecallOrder(data: Partial<RecallOrder>): Promise<RecallOrder> {
    const defaultProgress: RecallProgress[] = [
      { id: '1', step: '启动召回', description: '发起召回申请并审批', status: '进行中', operator: data.initiator || '当前用户', completeTime: null, remark: '' },
      { id: '2', step: '通知经销商', description: '向相关经销商发出召回通知', status: '待处理', operator: '', completeTime: null, remark: '' },
      { id: '3', step: '产品回收', description: '从渠道回收问题产品', status: '待处理', operator: '', completeTime: null, remark: '' },
      { id: '4', step: '原因调查', description: '调查问题产生原因', status: '待处理', operator: '', completeTime: null, remark: '' },
      { id: '5', step: '处置方案', description: '确定产品处置方式', status: '待处理', operator: '', completeTime: null, remark: '' },
      { id: '6', step: '结案报告', description: '提交召回总结报告', status: '待处理', operator: '', completeTime: null, remark: '' },
    ];

    const order = db.createRecallOrder({
      ...data,
      progressList: data.progressList || defaultProgress,
    });

    db.createOperationLog({
      module: '召回管理',
      action: '创建召回单',
      targetId: order.id,
      targetName: `${order.productName}（${order.batchNo}）`,
      operator: order.initiator,
      ip: '127.0.0.1',
      remark: `召回级别：${order.level}，原因：${order.reason}`,
    });

    return delay(order);
  },

  /**
   * 更新召回工单状态
   */
  async updateRecallStatus(id: string, status: RecallOrder['status']): Promise<RecallOrder | null> {
    const order = db.getRecallOrder(id);
    if (!order) return delay(null);

    const updatedProgress = order.progressList.map(p => {
      if (status === '召回中' && p.step === '启动召回') {
        return { ...p, status: '已完成' as const, completeTime: dayjs().format('YYYY-MM-DD HH:mm:ss') };
      }
      if (status === '召回中' && p.step === '通知经销商') {
        return { ...p, status: '进行中' as const };
      }
      if (status === '已完成') {
        return { ...p, status: '已完成' as const, completeTime: p.completeTime || dayjs().format('YYYY-MM-DD HH:mm:ss') };
      }
      return p;
    });

    const result = db.updateRecallOrder(id, {
      status,
      recalledQty: status === '已完成' ? order.affectedQty : order.recalledQty,
      progressList: updatedProgress,
    });

    db.createOperationLog({
      module: '召回管理',
      action: '更新召回进度',
      targetId: id,
      targetName: `${order.productName}（${order.batchNo}）`,
      operator: '当前用户',
      ip: '127.0.0.1',
      remark: `更新状态为：${status}`,
    });

    return delay(result);
  },

  /**
   * 冻结批次（召回时使用）
   */
  async freezeBatch(batchId: string): Promise<boolean> {
    const batch = db.updateBatch(batchId, { isFrozen: true });
    if (batch) {
      db.createOperationLog({
        module: '召回管理',
        action: '冻结批次',
        targetId: batchId,
        targetName: `${batch.productName}（${batch.batchNo}）`,
        operator: '当前用户',
        ip: '127.0.0.1',
        remark: '批次已冻结，禁止出库',
      });
      return delay(true);
    }
    return delay(false);
  },

  /**
   * 解冻批次
   */
  async unfreezeBatch(batchId: string): Promise<boolean> {
    const batch = db.updateBatch(batchId, { isFrozen: false });
    if (batch) {
      db.createOperationLog({
        module: '召回管理',
        action: '解冻批次',
        targetId: batchId,
        targetName: `${batch.productName}（${batch.batchNo}）`,
        operator: '当前用户',
        ip: '127.0.0.1',
        remark: '批次已解冻，可正常流通',
      });
      return delay(true);
    }
    return delay(false);
  },

  /**
   * 获取召回进度详情
   */
  async fetchRecallProgress(recallId: string): Promise<RecallProgress[] | null> {
    const order = db.getRecallOrder(recallId);
    if (!order) return delay(null);
    return delay(order.progressList);
  },

  /**
   * 窜货分析
   * 根据消费者验真记录的实际地点与经销商所在城市对比，发现疑似窜货
   */
  async suspiciousChanneling(): Promise<ChannelingItem[]> {
    const verifies = db.getRawConsumerVerifies();
    const records = db.getRawWarehouseRecords();
    const dealers = db.getRawDealers();
    const dealerMap = new Map(dealers.map(d => [d.id, d]));

    const channelingList: ChannelingItem[] = [];

    for (const v of verifies) {
      const outbound = records.find(r => r.batchId === v.batchId && r.type === '出库');
      if (!outbound || !outbound.relatedDealerId) continue;

      const dealer = dealerMap.get(outbound.relatedDealerId);
      if (!dealer) continue;

      const actualCity = v.verifyLocation.slice(0, 2);
      const expectedCity = dealer.city.slice(0, 2);

      if (actualCity !== expectedCity && Math.random() > 0.7) {
        channelingList.push({
          id: v.id,
          traceCode: v.traceCode,
          batchId: v.batchId,
          batchNo: v.batchNo,
          productName: v.productName,
          expectedCity: dealer.city,
          actualCity: v.verifyLocation,
          dealerId: dealer.id,
          dealerName: dealer.dealerName,
          verifyTime: v.verifyTime,
          channel: v.verifyChannel,
          status: Math.random() > 0.7 ? '已核实' : Math.random() > 0.5 ? '已处理' : '疑似窜货',
        });
      }
    }

    return delay(channelingList.slice(0, 30));
  },
};

export default recallService;
