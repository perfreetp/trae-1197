/**
 * 召回相关类型定义
 * 包含召回通知单、召回进度跟踪等类型
 */

import type { BaseEntity } from './common';

/**
 * 召回级别
 * general: 一般召回（产品存在轻微缺陷）
 * important: 重要召回（产品可能造成暂时性健康危害）
 * urgent: 紧急召回（产品可能造成严重健康危害或死亡）
 */
export type RecallLevel = 'general' | 'important' | 'urgent';

/**
 * 召回级别中文映射
 */
export const RecallLevelLabel: Record<RecallLevel, string> = {
  general: '一般召回',
  important: '重要召回',
  urgent: '紧急召回',
};

/**
 * 召回状态
 * investigating: 调查中（问题调查阶段）
 * recalling: 召回中（召回执行阶段）
 * completed: 已完成（召回完成）
 * cancelled: 已取消（召回取消）
 */
export type RecallStatus = 'investigating' | 'recalling' | 'completed' | 'cancelled';

/**
 * 召回状态中文映射
 */
export const RecallStatusLabel: Record<RecallStatus, string> = {
  investigating: '调查中',
  recalling: '召回中',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * 召回进度阶段
 * notify: 通知阶段（通知经销商/门店）
 * feedback: 反馈阶段（经销商/门店反馈库存）
 * recover: 回收阶段（产品回收）
 * destroy: 销毁阶段（产品销毁）
 */
export type RecallStage = 'notify' | 'feedback' | 'recover' | 'destroy';

/**
 * 召回进度阶段中文映射
 */
export const RecallStageLabel: Record<RecallStage, string> = {
  notify: '通知',
  feedback: '反馈',
  recover: '回收',
  destroy: '销毁',
};

/**
 * 召回进度状态
 */
export type RecallProgressStatus = 'pending' | 'processing' | 'done' | 'exception';

/**
 * 召回进度状态中文映射
 */
export const RecallProgressStatusLabel: Record<RecallProgressStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  done: '已完成',
  exception: '异常',
};

/**
 * 召回通知单接口
 */
export interface RecallOrder extends BaseEntity {
  /** 召回通知单标题 */
  title: string;
  /** 召回原因 */
  reason: string;
  /** 召回级别 */
  level: RecallLevel;
  /** 受影响的批次ID列表 */
  affectedBatches: string[];
  /** 受影响的地区列表 */
  affectedRegions: string[];
  /** 召回状态 */
  status: RecallStatus;
  /** 发起召回人 */
  initiator: string;
  /** 召回发起时间 */
  createdAt: string | Date;
  /** 召回编号 */
  recallNo?: string;
  /** 问题描述/详细说明 */
  description?: string;
  /** 处理措施 */
  measures?: string;
  /** 预计完成时间 */
  expectedCompleteDate?: string | Date;
  /** 实际完成时间 */
  actualCompleteDate?: string | Date;
  /** 附件列表 */
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
  /** 受影响批次详情（冗余，方便展示） */
  affectedBatchDetails?: Array<{
    batchId: string | number;
    batchNo: string;
    productName: string;
    spec: string;
    productionDate: string | Date;
    affectedQty: number;
  }>;
  /** 涉及经销商数量 */
  affectedDealerCount?: number;
  /** 涉及门店数量 */
  affectedStoreCount?: number;
}

/**
 * 召回进度跟踪接口
 * 按阶段+经销商维度跟踪召回执行情况
 */
export interface RecallProgress extends BaseEntity {
  /** 关联召回通知单ID */
  recallId: string | number;
  /** 召回阶段 */
  stage: RecallStage;
  /** 关联经销商ID（如为全局阶段则为空） */
  dealerId?: string | number;
  /** 应召回/回收总数量 */
  totalQty: number;
  /** 已完成数量 */
  receivedQty: number;
  /** 当前状态 */
  status: RecallProgressStatus;
  /** 截止期限 */
  deadline?: string | Date;
  /** 经销商名称（冗余字段，方便展示） */
  dealerName?: string;
  /** 负责人 */
  personInCharge?: string;
  /** 联系电话 */
  phone?: string;
  /** 进度备注说明 */
  remark?: string;
  /** 完成时间 */
  completedAt?: string | Date;
  /** 异常说明（状态为异常时必填） */
  exceptionReason?: string;
}

/**
 * 召回产品回收记录
 */
export interface RecallRecoveryRecord extends BaseEntity {
  /** 关联召回通知单ID */
  recallId: string | number;
  /** 追溯码 */
  traceCode: string;
  /** 回收来源类型 */
  sourceType: 'dealer' | 'store' | 'consumer';
  /** 来源ID */
  sourceId?: string | number;
  /** 来源名称 */
  sourceName?: string;
  /** 回收人 */
  receiver: string;
  /** 回收时间 */
  recoveryTime: string | Date;
  /** 回收地点 */
  location?: string;
  /** 产品状态 */
  productCondition?: 'intact' | 'damaged' | 'used' | 'unknown';
  /** 备注 */
  remark?: string;
}

/**
 * 召回销毁记录
 */
export interface RecallDestroyRecord extends BaseEntity {
  /** 关联召回通知单ID */
  recallId: string | number;
  /** 销毁批次号（内部销毁单） */
  destroyNo: string;
  /** 销毁方式 */
  destroyMethod: string;
  /** 销毁数量 */
  quantity: number;
  /** 监销人 */
  supervisor: string;
  /** 执行人 */
  executor: string;
  /** 销毁时间 */
  destroyTime: string | Date;
  /** 销毁地点 */
  location: string;
  /** 附件（销毁现场照片、视频等） */
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
  /** 销毁清单（追溯码列表） */
  traceCodes?: string[];
  /** 备注 */
  remark?: string;
}

/**
 * 创建召回通知单请求参数
 */
export interface CreateRecallOrderRequest {
  title: string;
  reason: string;
  level: RecallLevel;
  affectedBatches: string[];
  affectedRegions: string[];
  initiator: string;
  description?: string;
  measures?: string;
  expectedCompleteDate?: string | Date;
  attachments?: RecallOrder['attachments'];
}

/**
 * 更新召回进度请求参数
 */
export interface UpdateRecallProgressRequest {
  progressId: string | number;
  receivedQty?: number;
  status?: RecallProgressStatus;
  remark?: string;
  exceptionReason?: string;
}
