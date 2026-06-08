
import { db, PaginationParams, PaginatedResult, FilterCondition } from './mock/database';
import { OperationLog, Batch } from './mock/generators';
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

// ==================== 公众查询验真相关类型与 API ====================

/**
 * 验真结果状态
 */
export type VerifyStatus = 'authentic' | 'suspicious' | 'not_found';

/**
 * 追溯链路节点
 */
export interface TraceNode {
  id: string;
  name: string;
  type: 'raw_material' | 'factory' | 'warehouse' | 'dealer' | 'store';
  operator: string;
  location: string;
  time: string;
  details: Record<string, string | number>;
}

/**
 * 质检项目
 */
export interface QCPublicItem {
  itemName: string;
  standardValue: string;
  actualValue: string;
  conclusion: '合格' | '不合格';
}

/**
 * 用药提示
 */
export interface MedicationTips {
  usage: string;
  contraindications: string;
  storage: string;
  precautions: string;
}

/**
 * 验真记录
 */
export interface VerifyRecord {
  id: string;
  verifyTime: string;
  location: string;
  channel: string;
  count: number;
}

/**
 * 验真查询结果
 */
export interface PublicVerifyResult {
  status: VerifyStatus;
  verifyCount: number;
  traceCode: string;
  product?: {
    productName: string;
    spec: string;
    batchNo: string;
    productionDate: string;
    expiryDate: string;
    manufacturer: string;
    daysToExpiry: number;
    isExpiring: boolean;
    isRecalled: boolean;
    recallInfo?: {
      orderNo: string;
      reason: string;
      level: string;
      detailUrl: string;
    };
  };
  traceFlow?: TraceNode[];
  qcItems?: QCPublicItem[];
  medicationTips?: MedicationTips;
  verifyRecords?: VerifyRecord[];
}

/**
 * 示例追溯码（用于演示填充）
 */
export const SAMPLE_TRACE_CODES = [
  'P20241200010001001001',
  'H20241100020005003',
  'P20241000030002005002',
  'H20240900040008007',
  'P20240800050003002008',
];

/**
 * 公众查询：根据追溯码查询验真信息
 */
export const publicQueryService = {
  async queryByTraceCode(traceCode: string): Promise<PublicVerifyResult> {
    const trimmedCode = traceCode.trim();
    if (!trimmedCode) {
      return delay({ status: 'not_found', verifyCount: 0, traceCode });
    }

    const verifies = db.getRawConsumerVerifies().filter(v => v.traceCode.startsWith(trimmedCode.slice(0, 8)) || trimmedCode.startsWith(v.traceCode.slice(0, 8)));
    const verifyCount = verifies.length || Math.floor(Math.random() * 5) + 1;

    const code = db.getTraceCodeByCode(trimmedCode);
    let batch: Batch | null = null;
    if (code) {
      batch = db.getBatch(code.batchId);
    } else {
      const batches = db.getRawBatches();
      if (batches.length > 0) {
        batch = batches[Math.floor(Math.random() * Math.min(3, batches.length))];
      }
    }

    if (!batch) {
      return delay({ status: 'not_found', verifyCount: 0, traceCode });
    }

    let status: VerifyStatus = 'authentic';
    if (verifyCount > 3) {
      status = 'suspicious';
    }

    const daysToExpiry = dayjs(batch.expiryDate).diff(dayjs(), 'day');
    const isExpiring = daysToExpiry < 90 && daysToExpiry > 0;
    const recallOrders = db.getRawRecallOrders().filter(r => r.batchId === batch.id);
    const isRecalled = recallOrders.length > 0 && recallOrders[0].status !== '已取消';

    const traceFlow: TraceNode[] = [
      {
        id: 'rm',
        name: '原料供应商',
        type: 'raw_material',
        operator: batch.rawMaterials[0]?.supplier || '山东聊城阿华制药',
        location: '山东省聊城市',
        time: dayjs(batch.productionDate).subtract(10, 'day').format('YYYY-MM-DD'),
        details: { '原料批次': batch.rawMaterials[0]?.batchNo || 'RM20241201', '原料数量': `${batch.rawMaterials[0]?.quantity || 200}kg`, '质检结果': batch.rawMaterials[0]?.inspectionResult || '合格' },
      },
      {
        id: 'factory',
        name: '生产工厂',
        type: 'factory',
        operator: batch.manufacturer,
        location: '生产车间A',
        time: batch.productionDate,
        details: { '工艺路线': '标准口服固体制剂工艺', '工序数': batch.processSteps.length, '产量': `${batch.actualQty}${batch.unit}`, '合格率': '98.6%' },
      },
      {
        id: 'wh',
        name: '仓储中心',
        type: 'warehouse',
        operator: '一号成品仓',
        location: 'A-02-03',
        time: dayjs(batch.productionDate).add(2, 'day').format('YYYY-MM-DD'),
        details: { '入库单号': 'IN202412010001', '库位': 'A-02-03', '入库量': `${batch.actualQty}${batch.unit}`, '环境温度': '20-25℃' },
      },
      {
        id: 'dealer',
        name: '经销商',
        type: 'dealer',
        operator: '北京华康医药有限公司',
        location: '北京市朝阳区',
        time: dayjs(batch.productionDate).add(8, 'day').format('YYYY-MM-DD'),
        details: { '出库单号': 'OUT202412080005', '经销商资质': 'GSP认证', '配送方式': '冷链物流' },
      },
      {
        id: 'store',
        name: '零售门店',
        type: 'store',
        operator: '北京同仁堂大药房（中心店）',
        location: '北京市东城区王府井大街',
        time: dayjs(batch.productionDate).add(12, 'day').format('YYYY-MM-DD'),
        details: { '门店资质': '药品经营许可证', '收货确认': '已签收', '营业员': '张美玲' },
      },
    ];

    const qcItems: QCPublicItem[] = batch.qcReport?.items.map(item => ({
      itemName: item.itemName,
      standardValue: item.standard,
      actualValue: item.testResult,
      conclusion: item.isPass ? '合格' : '不合格',
    })) || [
      { itemName: '性状', standardValue: '符合规定', actualValue: '符合规定', conclusion: '合格' },
      { itemName: '鉴别', standardValue: '呈正反应', actualValue: '呈正反应', conclusion: '合格' },
      { itemName: '含量测定', standardValue: '95.0%-105.0%', actualValue: '99.32%', conclusion: '合格' },
      { itemName: '溶出度', standardValue: '≥80%', actualValue: '92.15%', conclusion: '合格' },
      { itemName: '重量差异', standardValue: '±5%', actualValue: '±2.3%', conclusion: '合格' },
      { itemName: '微生物限度', standardValue: '符合规定', actualValue: '符合规定', conclusion: '合格' },
    ];

    const medicationTips: MedicationTips = {
      usage: '口服。成人一次0.5g（2粒），每6-8小时1次，一日剂量不超过4g（16粒）。小儿一日剂量按体重20-40mg/kg，每8小时1次。',
      contraindications: '青霉素过敏者禁用；肾功能严重损害者慎用；孕妇及哺乳期妇女慎用。',
      storage: '遮光，密封，在干燥处保存。温度不超过25℃。',
      precautions: '用药前必须详细询问药物过敏史；长期或大剂量服用应定期检查肝、肾功能和血常规；与其他药物同时使用请咨询医师。',
    };

    const verifyRecords: VerifyRecord[] = verifies.length > 0
      ? verifies.slice(0, 10).map(v => ({
          id: v.id,
          verifyTime: v.verifyTime,
          location: v.verifyLocation,
          channel: v.verifyChannel,
          count: verifyCount,
        }))
      : [
          { id: '1', verifyTime: dayjs().subtract(0, 'hour').format('YYYY-MM-DD HH:mm:ss'), location: '本次查询 · 北京市朝阳区', channel: '官网', count: verifyCount },
          { id: '2', verifyTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'), location: '上海市浦东新区', channel: '微信小程序', count: verifyCount },
          { id: '3', verifyTime: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'), location: '广州市天河区', channel: 'APP', count: verifyCount },
        ];

    return delay({
      status,
      verifyCount,
      traceCode,
      product: {
        productName: batch.productName,
        spec: batch.spec,
        batchNo: batch.batchNo,
        productionDate: batch.productionDate,
        expiryDate: batch.expiryDate,
        manufacturer: batch.manufacturer,
        daysToExpiry: Math.max(0, daysToExpiry),
        isExpiring,
        isRecalled,
        recallInfo: isRecalled && recallOrders[0] ? {
          orderNo: recallOrders[0].orderNo,
          reason: recallOrders[0].reason,
          level: recallOrders[0].level,
          detailUrl: '/recall',
        } : undefined,
      },
      traceFlow,
      qcItems,
      medicationTips,
      verifyRecords,
    });
  },
};


/**
 * 生产统计
 */
export interface ProductionStats {
  totalBatches: number;
  totalPlanQty: number;
  totalActualQty: number;
  qualifiedRate: number;
  byStatus: { status: string; count: number; qty: number }[];
  byProduct: { productName: string; count: number; qty: number }[];
  trend: { date: string; count: number; qty: number }[];
}

/**
 * 库存统计
 */
export interface InventoryStats {
  totalSKU: number;
  totalStockQty: number;
  totalStockValue: number;
  warehouseDistribution: { warehouse: string; qty: number; count: number }[];
  expiryDistribution: { range: string; qty: number; count: number }[];
  topProducts: { productName: string; qty: number; daysToExpiry: number }[];
}

/**
 * 流通统计
 */
export interface CirculationStats {
  totalInbound: number;
  totalOutbound: number;
  totalDealers: number;
  totalStores: number;
  totalVerifies: number;
  verifyPassRate: number;
  channelDistribution: { channel: string; count: number }[];
  regionDistribution: { city: string; count: number }[];
  monthlyTrend: { month: string; inbound: number; outbound: number }[];
}

/**
 * 召回统计
 */
export interface RecallStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalAffectedQty: number;
  totalRecalledQty: number;
  recallProgressRate: number;
  byLevel: { level: string; count: number; qty: number }[];
  byReason: { reason: string; count: number }[];
}

/**
 * 合规报告
 */
export interface ComplianceReport {
  reportNo: string;
  generatedAt: string;
  batch: {
    batchNo: string;
    productName: string;
    spec: string;
    manufacturer: string;
    productionDate: string;
    expiryDate: string;
    actualQty: number;
    status: string;
  };
  rawMaterials: {
    name: string;
    batchNo: string;
    supplier: string;
    quantity: number;
    inspectionResult: string;
  }[];
  processSteps: {
    stepName: string;
    startTime: string;
    endTime: string | null;
    operator: string;
    status: string;
  }[];
  qcReport: {
    reportNo: string;
    reportDate: string;
    inspector: string;
    overallResult: string;
    items: { itemName: string; standard: string; testResult: string; isPass: boolean }[];
    remark: string;
  } | null;
  warehouseTrack: {
    type: string;
    warehouse: string;
    location: string;
    quantity: number;
    operator: string;
    operateTime: string;
  }[];
  circulationTrack: {
    stage: string;
    location: string;
    operator: string;
    time: string;
  }[];
}

/**
 * 日期范围
 */
export interface DateRange {
  startDate?: string;
  endDate?: string;
}

/**
 * 报表相关服务 API
 */
export const reportService = {
  /**
   * 生产统计报表
   */
  async fetchProductionStats(range: DateRange = {}): Promise<ProductionStats> {
    const batches = db.getRawBatches();
    const now = dayjs();

    const start = range.startDate ? dayjs(range.startDate) : now.subtract(6, 'month');
    const end = range.endDate ? dayjs(range.endDate) : now;

    const filtered = batches.filter(b =>
      dayjs(b.productionDate).isAfter(start.subtract(1, 'day')) &&
      dayjs(b.productionDate).isBefore(end.add(1, 'day'))
    );

    const totalBatches = filtered.length;
    const totalPlanQty = filtered.reduce((s, b) => s + b.planQty, 0);
    const totalActualQty = filtered.reduce((s, b) => s + b.actualQty, 0);

    const passedCount = filtered.filter(b => b.qcReport?.overallResult === '合格').length;
    const inspectedCount = filtered.filter(b => b.qcReport).length;
    const qualifiedRate = inspectedCount > 0 ? (passedCount / inspectedCount) * 100 : 95;

    const statusMap = new Map<string, { count: number; qty: number }>();
    for (const b of filtered) {
      const curr = statusMap.get(b.status) || { count: 0, qty: 0 };
      curr.count += 1;
      curr.qty += b.actualQty;
      statusMap.set(b.status, curr);
    }
    const byStatus = Array.from(statusMap.entries()).map(([status, v]) => ({ status, ...v }));

    const productMap = new Map<string, { count: number; qty: number }>();
    for (const b of filtered) {
      const curr = productMap.get(b.productName) || { count: 0, qty: 0 };
      curr.count += 1;
      curr.qty += b.actualQty;
      productMap.set(b.productName, curr);
    }
    const byProduct = Array.from(productMap.entries())
      .map(([productName, v]) => ({ productName, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    const trend: { date: string; count: number; qty: number }[] = [];
    const daysDiff = end.diff(start, 'day');
    const step = Math.max(1, Math.floor(daysDiff / 10));
    for (let i = 0; i <= daysDiff; i += step) {
      const d = start.add(i, 'day').format('MM-DD');
      const dayBatches = filtered.filter(b => dayjs(b.productionDate).format('MM-DD') === d);
      trend.push({
        date: d,
        count: dayBatches.length,
        qty: dayBatches.reduce((s, b) => s + b.actualQty, 0),
      });
    }

    return delay({
      totalBatches,
      totalPlanQty,
      totalActualQty,
      qualifiedRate: Math.round(qualifiedRate * 100) / 100,
      byStatus,
      byProduct,
      trend,
    });
  },

  /**
   * 库存统计报表
   */
  async fetchInventoryStats(): Promise<InventoryStats> {
    const batches = db.getRawBatches();
    const records = db.getRawWarehouseRecords();
    const now = dayjs();

    const inventoryItems: {
      batchId: string;
      productName: string;
      stockQty: number;
      warehouse: string;
      location: string;
      expiryDate: string;
      daysToExpiry: number;
    }[] = [];

    for (const batch of batches) {
      const rel = records.filter(r => r.batchId === batch.id);
      const inbound = rel.filter(r => r.type === '入库').reduce((s, r) => s + r.quantity, 0);
      const outbound = rel.filter(r => r.type === '出库').reduce((s, r) => s + r.quantity, 0);
      const stock = inbound - outbound;
      if (stock > 0) {
        const lastIn = rel.filter(r => r.type === '入库').sort((a, b) =>
          dayjs(b.operateTime).valueOf() - dayjs(a.operateTime).valueOf()
        )[0];
        inventoryItems.push({
          batchId: batch.id,
          productName: batch.productName,
          stockQty: stock,
          warehouse: lastIn?.warehouse || '一号成品仓',
          location: lastIn?.location || '',
          expiryDate: batch.expiryDate,
          daysToExpiry: dayjs(batch.expiryDate).diff(now, 'day'),
        });
      }
    }

    const totalSKU = inventoryItems.length;
    const totalStockQty = inventoryItems.reduce((s, i) => s + i.stockQty, 0);
    const totalStockValue = Math.round(totalStockQty * (15 + Math.random() * 50));

    const whMap = new Map<string, { qty: number; count: number }>();
    for (const i of inventoryItems) {
      const curr = whMap.get(i.warehouse) || { qty: 0, count: 0 };
      curr.qty += i.stockQty;
      curr.count += 1;
      whMap.set(i.warehouse, curr);
    }
    const warehouseDistribution = Array.from(whMap.entries()).map(([warehouse, v]) => ({ warehouse, ...v }));

    const expiryRanges = [
      { range: '已过期', min: -Infinity, max: 0 },
      { range: '30天内', min: 0, max: 30 },
      { range: '31-90天', min: 30, max: 90 },
      { range: '91-180天', min: 90, max: 180 },
      { range: '180天以上', min: 180, max: Infinity },
    ];
    const expiryDistribution = expiryRanges.map(r => {
      const list = inventoryItems.filter(i => i.daysToExpiry > r.min && i.daysToExpiry <= r.max);
      return {
        range: r.range,
        qty: list.reduce((s, i) => s + i.stockQty, 0),
        count: list.length,
      };
    });

    const productMap = new Map<string, { qty: number; minDays: number }>();
    for (const i of inventoryItems) {
      const curr = productMap.get(i.productName) || { qty: 0, minDays: Infinity };
      curr.qty += i.stockQty;
      curr.minDays = Math.min(curr.minDays, i.daysToExpiry);
      productMap.set(i.productName, curr);
    }
    const topProducts = Array.from(productMap.entries())
      .map(([productName, v]) => ({ productName, qty: v.qty, daysToExpiry: v.minDays }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    return delay({
      totalSKU,
      totalStockQty,
      totalStockValue,
      warehouseDistribution,
      expiryDistribution,
      topProducts,
    });
  },

  /**
   * 流通统计报表
   */
  async fetchCirculationStats(): Promise<CirculationStats> {
    const records = db.getRawWarehouseRecords();
    const dealers = db.getRawDealers();
    const stores = db.getRawStores();
    const verifies = db.getRawConsumerVerifies();
    const now = dayjs();

    const totalInbound = records.filter(r => r.type === '入库').reduce((s, r) => s + r.quantity, 0);
    const totalOutbound = records.filter(r => r.type === '出库').reduce((s, r) => s + r.quantity, 0);
    const totalDealers = dealers.filter(d => d.status === '正常').length;
    const totalStores = stores.filter(s => s.status === '正常').length;
    const totalVerifies = verifies.length;
    const verifyPassRate = verifies.length > 0
      ? (verifies.filter(v => v.isAuthentic).length / verifies.length) * 100
      : 98;

    const channelMap = new Map<string, number>();
    for (const v of verifies) {
      channelMap.set(v.verifyChannel, (channelMap.get(v.verifyChannel) || 0) + 1);
    }
    const channelDistribution = Array.from(channelMap.entries())
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);

    const cityMap = new Map<string, number>();
    for (const v of verifies) {
      const city = v.verifyLocation.slice(0, 3);
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
    }
    const regionDistribution = Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const monthlyTrend: { month: string; inbound: number; outbound: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, 'month').format('YYYY-MM');
      const inb = records.filter(r => r.type === '入库' && dayjs(r.operateTime).format('YYYY-MM') === month)
        .reduce((s, r) => s + r.quantity, 0);
      const outb = records.filter(r => r.type === '出库' && dayjs(r.operateTime).format('YYYY-MM') === month)
        .reduce((s, r) => s + r.quantity, 0);
      monthlyTrend.push({ month, inbound: inb, outbound: outb });
    }

    return delay({
      totalInbound,
      totalOutbound,
      totalDealers,
      totalStores,
      totalVerifies,
      verifyPassRate: Math.round(verifyPassRate * 100) / 100,
      channelDistribution,
      regionDistribution,
      monthlyTrend,
    });
  },

  /**
   * 召回统计报表
   */
  async fetchRecallStats(): Promise<RecallStats> {
    const orders = db.getRawRecallOrders();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === '待启动').length;
    const processingOrders = orders.filter(o => o.status === '召回中').length;
    const completedOrders = orders.filter(o => o.status === '已完成').length;
    const totalAffectedQty = orders.reduce((s, o) => s + o.affectedQty, 0);
    const totalRecalledQty = orders.reduce((s, o) => s + o.recalledQty, 0);
    const recallProgressRate = totalAffectedQty > 0 ? (totalRecalledQty / totalAffectedQty) * 100 : 0;

    const levelMap = new Map<string, { count: number; qty: number }>();
    for (const o of orders) {
      const curr = levelMap.get(o.level) || { count: 0, qty: 0 };
      curr.count += 1;
      curr.qty += o.affectedQty;
      levelMap.set(o.level, curr);
    }
    const byLevel = Array.from(levelMap.entries()).map(([level, v]) => ({ level, ...v }));

    const reasonMap = new Map<string, number>();
    for (const o of orders) {
      reasonMap.set(o.reason, (reasonMap.get(o.reason) || 0) + 1);
    }
    const byReason = Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count }));

    return delay({
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      totalAffectedQty,
      totalRecalledQty,
      recallProgressRate: Math.round(recallProgressRate * 100) / 100,
      byLevel,
      byReason,
    });
  },

  /**
   * 操作日志查询
   */
  async fetchOperationLogs(params: PaginationParams & { keyword?: string; module?: string; status?: string } = {}): Promise<PaginatedResult<OperationLog>> {
    const filters: FilterCondition<OperationLog> = {};
    if (params.module) filters.module = params.module;
    if (params.status) filters.status = params.status;

    const result = db.listOperationLogs(filters, { page: params.page, pageSize: params.pageSize });

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      result.data = result.data.filter(
        l => l.operator.includes(params.keyword as string) ||
          l.targetName.toLowerCase().includes(kw) ||
          l.action.includes(params.keyword as string) ||
          l.remark.includes(params.keyword as string)
      );
      result.total = result.data.length;
    }

    return delay(result);
  },

  /**
   * 导出批次合规报告
   */
  async exportComplianceReport(batchId: string): Promise<ComplianceReport | null> {
    const batch = db.getBatch(batchId);
    if (!batch) return delay(null);

    const records = db.getRawWarehouseRecords().filter(r => r.batchId === batchId);
    const warehouseTrack = records.map(r => ({
      type: r.type,
      warehouse: r.warehouse,
      location: r.location,
      quantity: r.quantity,
      operator: r.operator,
      operateTime: r.operateTime,
    }));

    const circulationTrack: ComplianceReport['circulationTrack'] = [];
    if (records.some(r => r.type === '入库')) {
      const inb = records.filter(r => r.type === '入库')[0];
      circulationTrack.push({ stage: '成品入库', location: inb.warehouse, operator: inb.operator, time: inb.operateTime });
    }
    if (records.some(r => r.type === '出库')) {
      const out = records.filter(r => r.type === '出库')[0];
      const dealer = db.getDealer(out.relatedDealerId || '');
      circulationTrack.push({
        stage: '出库配送',
        location: dealer ? `发往${dealer.city} - ${dealer.dealerName}` : out.location,
        operator: out.operator,
        time: out.operateTime,
      });
    }

    const report: ComplianceReport = {
      reportNo: `CP${dayjs().format('YYYYMMDD')}${batch.batchNo.slice(-6)}`,
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      batch: {
        batchNo: batch.batchNo,
        productName: batch.productName,
        spec: batch.spec,
        manufacturer: batch.manufacturer,
        productionDate: batch.productionDate,
        expiryDate: batch.expiryDate,
        actualQty: batch.actualQty,
        status: batch.status,
      },
      rawMaterials: batch.rawMaterials.map(m => ({
        name: m.name,
        batchNo: m.batchNo,
        supplier: m.supplier,
        quantity: m.quantity,
        inspectionResult: m.inspectionResult,
      })),
      processSteps: batch.processSteps.map(s => ({
        stepName: s.stepName,
        startTime: s.startTime,
        endTime: s.endTime,
        operator: s.operator,
        status: s.status,
      })),
      qcReport: batch.qcReport ? {
        reportNo: batch.qcReport.reportNo,
        reportDate: batch.qcReport.reportDate,
        inspector: batch.qcReport.inspector,
        overallResult: batch.qcReport.overallResult,
        items: batch.qcReport.items,
        remark: batch.qcReport.remark,
      } : null,
      warehouseTrack,
      circulationTrack,
    };

    db.createOperationLog({
      module: '质量管理',
      action: '导出合规报告',
      targetId: batchId,
      targetName: `${batch.productName}（${batch.batchNo}）`,
      operator: '当前用户',
      ip: '127.0.0.1',
      remark: `报告编号：${report.reportNo}`,
    });

    return delay(report);
  },
};

export default reportService;
