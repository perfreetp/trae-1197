/**
 * 批次相关类型定义
 * 包含生产批次、原材料、工序步骤、质检报告、追溯码等类型
 */

import type { BaseEntity } from './common';

/**
 * 批次状态枚举
 * producing: 生产中
 * qualified: 已质检合格
 * stored: 已入库
 * transit: 运输中
 * sold: 已销售
 * frozen: 已冻结
 */
export type BatchStatus = 'producing' | 'qualified' | 'stored' | 'transit' | 'sold' | 'frozen';

/**
 * 批次状态中文映射
 */
export const BatchStatusLabel: Record<BatchStatus, string> = {
  producing: '生产中',
  qualified: '质检合格',
  stored: '已入库',
  transit: '运输中',
  sold: '已销售',
  frozen: '已冻结',
};

/**
 * 工序步骤状态
 */
export type ProcessStepStatus = 'pending' | 'processing' | 'completed' | 'paused' | 'abnormal';

/**
 * 工序步骤状态中文映射
 */
export const ProcessStepStatusLabel: Record<ProcessStepStatus, string> = {
  pending: '待开始',
  processing: '进行中',
  completed: '已完成',
  paused: '已暂停',
  abnormal: '异常',
};

/**
 * 质检结论类型
 */
export type QCConclusion = 'qualified' | 'unqualified' | 'pending';

/**
 * 质检结论中文映射
 */
export const QCConclusionLabel: Record<QCConclusion, string> = {
  qualified: '合格',
  unqualified: '不合格',
  pending: '待检',
};

/**
 * 追溯码级别
 */
export type TraceCodeLevel = 'case' | 'box' | 'bottle';

/**
 * 追溯码级别中文映射
 */
export const TraceCodeLevelLabel: Record<TraceCodeLevel, string> = {
  case: '箱',
  box: '盒',
  bottle: '瓶',
};

/**
 * 追溯码状态
 */
export type TraceCodeStatus =
  | 'unused'
  | 'assigned'
  | 'inbound'
  | 'outbound'
  | 'signed'
  | 'sold'
  | 'recalled';

/**
 * 追溯码状态中文映射
 */
export const TraceCodeStatusLabel: Record<TraceCodeStatus, string> = {
  unused: '未使用',
  assigned: '已赋码',
  inbound: '已入库',
  outbound: '已出库',
  signed: '已签收',
  sold: '已销售',
  recalled: '已召回',
};

/**
 * 原材料接口
 */
export interface RawMaterial extends BaseEntity {
  /** 批次ID */
  batchId: string | number;
  /** 供应商 */
  supplier: string;
  /** 原料批次号 */
  materialBatch: string;
  /** 原料名称 */
  materialName: string;
  /** 收货日期 */
  receivedDate: string | Date;
  /** 质检证书 */
  qcCert?: string;
  /** 质检证书附件URL */
  qcCertUrl?: string;
  /** 数量 */
  quantity?: number;
  /** 单位 */
  unit?: string;
}

/**
 * 工序步骤接口
 */
export interface ProcessStep extends BaseEntity {
  /** 批次ID */
  batchId: string | number;
  /** 步骤顺序（从1开始） */
  stepOrder: number;
  /** 步骤名称 */
  stepName: string;
  /** 操作人 */
  operator?: string;
  /** 设备编号/名称 */
  equipment?: string;
  /** 开始时间 */
  startTime?: string | Date;
  /** 结束时间 */
  endTime?: string | Date;
  /** 工艺参数（JSON格式存储） */
  params?: Record<string, unknown>;
  /** 步骤状态 */
  status: ProcessStepStatus;
  /** 备注 */
  remark?: string;
}

/**
 * 质检项目明细
 */
export interface QCItem {
  /** 检测项名称 */
  name: string;
  /** 标准值 */
  standard: string;
  /** 实际检测值 */
  actual: string;
  /** 检测结果：合格/不合格 */
  result: boolean;
  /** 检测方法 */
  method?: string;
  /** 检测设备 */
  equipment?: string;
}

/**
 * 质检报告接口
 */
export interface QCReport extends BaseEntity {
  /** 批次ID */
  batchId: string | number;
  /** 质检结论 */
  conclusion: QCConclusion;
  /** 质检员 */
  inspector: string;
  /** 质检日期 */
  inspectDate: string | Date;
  /** 质检项目列表 */
  items: QCItem[];
  /** 附件列表 */
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
  /** 质检报告编号 */
  reportNo?: string;
  /** 质检意见/备注 */
  opinion?: string;
}

/**
 * 追溯码接口
 */
export interface TraceCode extends BaseEntity {
  /** 追溯码（唯一标识） */
  code: string;
  /** 所属批次ID */
  batchId: string | number;
  /** 码级别 */
  level: TraceCodeLevel;
  /** 父级追溯码（如箱码是盒码的父码） */
  parentCode?: string;
  /** 码状态 */
  status: TraceCodeStatus;
  /** 当前位置 */
  currentLocation?: string;
  /** 生成时间 */
  generatedAt: string | Date;
  /** 关联药品信息 */
  productInfo?: {
    productName: string;
    spec: string;
  };
}

/**
 * 批次接口（生产批次）
 */
export interface Batch extends BaseEntity {
  /** 产品名称 */
  productName: string;
  /** 规格型号 */
  spec: string;
  /** 批次号 */
  batchNo?: string;
  /** 计划产量 */
  plannedQty: number;
  /** 计划产量别名 */
  planQty?: number;
  /** 实际产量 */
  actualQty?: number;
  /** 生产日期 */
  productionDate: string | Date;
  /** 有效期至 */
  expiryDate: string | Date;
  /** 批次状态 */
  status: BatchStatus;
  /** 工艺路线名称 */
  processRoute: string;
  /** 创建人 */
  createdBy: string;
  /** 生产负责人 */
  manager?: string;
  /** 计量单位 */
  unit?: string;
  /** 生产厂家 */
  manufacturer?: string;
  /** 原材料清单 */
  rawMaterials: RawMaterial[];
  /** 工序步骤清单 */
  processSteps: ProcessStep[];
  /** 质检报告 */
  qcReport?: QCReport;
  /** 产品编号 */
  productCode?: string;
  /** 生产车间 */
  workshop?: string;
  /** 生产线 */
  productionLine?: string;
  /** 备注说明 */
  remark?: string;
  /** 追溯码数量统计 */
  traceCodeStats?: {
    total: number;
    caseCount: number;
    boxCount: number;
    bottleCount: number;
  };
}

/**
 * 创建批次请求参数
 */
export interface CreateBatchRequest {
  productName: string;
  spec: string;
  plannedQty?: number;
  planQty?: number;
  productionDate: string | Date;
  expiryDate: string | Date;
  processRoute: string;
  manager?: string;
  unit?: string;
  manufacturer?: string;
  batchNo?: string;
  actualQty?: number;
  status?: string;
  rawMaterials?: Omit<RawMaterial, 'id' | 'batchId' | 'createdAt'>[];
  processSteps?: Omit<ProcessStep, 'id' | 'batchId' | 'createdAt'>[];
  productCode?: string;
  workshop?: string;
  productionLine?: string;
  remark?: string;
}

/**
 * 更新批次状态请求
 */
export interface UpdateBatchStatusRequest {
  batchId: string | number;
  status: BatchStatus;
  remark?: string;
}
