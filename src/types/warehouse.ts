/**
 * 仓储相关类型定义
 * 包含仓储出入库记录、经销商、签收、门店、消费者验证等类型
 */

import type { BaseEntity } from './common';

/**
 * 仓储操作类型
 * in: 入库
 * out: 出库
 */
export type WarehouseOperationType = 'in' | 'out';

/**
 * 仓储操作类型中文映射
 */
export const WarehouseOperationTypeLabel: Record<WarehouseOperationType, string> = {
  in: '入库',
  out: '出库',
};

/**
 * 经销商级别
 */
export type DealerLevel = 'L1' | 'L2' | 'L3';

/**
 * 经销商级别中文映射
 */
export const DealerLevelLabel: Record<DealerLevel, string> = {
  L1: '一级经销商',
  L2: '二级经销商',
  L3: '三级经销商',
};

/**
 * 仓储记录接口（入库/出库记录）
 */
export interface WarehouseRecord extends BaseEntity {
  /** 关联批次ID */
  batchId: string | number;
  /** 追溯码（可存储多个，以逗号分隔或JSON数组） */
  traceCode: string | string[];
  /** 操作类型 */
  type: WarehouseOperationType;
  /** 仓库名称 */
  warehouse: string;
  /** 库位 */
  location: string;
  /** 操作人 */
  operator: string;
  /** 操作数量 */
  quantity: number;
  /** 关联单据号（采购单号/销售单号等） */
  relatedOrder?: string;
  /** 关联经销商ID */
  dealerId?: string | number;
  /** 操作时间 */
  operateTime: string | Date;
  /** 关联批次号（冗余存储，方便查询） */
  batchNo?: string;
  /** 产品名称（冗余存储，方便查询） */
  productName?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 经销商接口
 */
export interface Dealer extends BaseEntity {
  /** 经销商名称 */
  name: string;
  /** 所在区域/地区 */
  region: string;
  /** 联系人 */
  contact: string;
  /** 联系电话 */
  phone: string;
  /** 经销商级别 */
  level: DealerLevel;
  /** 详细地址 */
  address?: string;
  /** 营业执照号 */
  licenseNo?: string;
  /** 经营许可证号 */
  businessLicense?: string;
  /** 邮箱 */
  email?: string;
  /** 状态 */
  status?: 'active' | 'frozen';
}

/**
 * 经销商签收记录接口
 * 记录经销商对追溯码商品的签收确认
 */
export interface DealerSign extends BaseEntity {
  /** 追溯码 */
  traceCode: string;
  /** 签收经销商ID */
  dealerId: string | number;
  /** 签收人姓名 */
  signer: string;
  /** 签收时间 */
  signTime: string | Date;
  /** 签收备注 */
  remark?: string;
  /** 签收地点 */
  location?: string;
  /** 关联出库单号 */
  outboundOrderNo?: string;
}

/**
 * 门店/药店接口
 */
export interface Store extends BaseEntity {
  /** 门店名称 */
  name: string;
  /** 详细地址 */
  address: string;
  /** 所属区域 */
  region: string;
  /** 所属经销商ID */
  dealerId?: string | number;
  /** 联系人 */
  contact?: string;
  /** 联系电话 */
  phone?: string;
  /** 经营许可证号 */
  licenseNo?: string;
  /** 状态 */
  status?: 'active' | 'frozen';
}

/**
 * 门店到货确认接口
 * 记录商品到达门店的确认信息
 */
export interface StoreArrival extends BaseEntity {
  /** 追溯码 */
  traceCode: string;
  /** 门店ID */
  storeId: string | number;
  /** 确认人 */
  confirmer: string;
  /** 确认时间 */
  confirmTime: string | Date;
  /** 关联配送单号 */
  deliveryOrderNo?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 消费者验证记录接口
 * 记录消费者扫码验证追溯码的行为
 */
export interface ConsumerVerify extends BaseEntity {
  /** 追溯码 */
  traceCode: string;
  /** 验证时间 */
  verifyTime: string | Date;
  /** 验证地点（可通过IP解析） */
  location?: string;
  /** 验证次数（同一个码被多次扫描时累计） */
  verifyCount: number;
  /** 验证IP */
  ip?: string;
  /** 验证设备信息 */
  userAgent?: string;
  /** 关联门店ID（通过关联推断） */
  storeId?: string | number;
}

/**
 * 仓库库存统计
 */
export interface WarehouseInventory {
  /** 批次ID */
  batchId: string | number;
  /** 批次号 */
  batchNo: string;
  /** 产品名称 */
  productName: string;
  /** 规格 */
  spec: string;
  /** 仓库 */
  warehouse: string;
  /** 库位 */
  location: string;
  /** 库存数量 */
  quantity: number;
  /** 生产日期 */
  productionDate: string | Date;
  /** 有效期至 */
  expiryDate: string | Date;
  /** 距离过期天数 */
  daysToExpiry?: number;
}

/**
 * 创建仓储记录请求参数
 */
export interface CreateWarehouseRecordRequest {
  batchId: string | number;
  traceCode: string | string[];
  type: WarehouseOperationType;
  warehouse: string;
  location: string;
  operator: string;
  quantity: number;
  relatedOrder?: string;
  dealerId?: string | number;
  remark?: string;
}
