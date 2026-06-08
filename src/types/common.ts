/**
 * 通用类型定义
 * 包含分页参数、API响应、状态枚举、用户角色、操作日志等通用类型
 */

/**
 * 分页查询参数
 */
export interface PaginationParams {
  /** 当前页码，从1开始 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据
 */
export interface PaginationResult<T> {
  /** 数据列表 */
  list: T[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
}

/**
 * 通用 API 响应封装
 */
export interface ApiResponse<T = unknown> {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 响应时间戳 */
  timestamp?: number;
}

/**
 * 带分页的 API 响应
 */
export interface ApiPaginationResponse<T = unknown> extends ApiResponse<PaginationResult<T>> {}

/**
 * 通用状态枚举类型
 */
export type StatusEnum = 'pending' | 'active' | 'success' | 'warning' | 'danger' | 'frozen';

/**
 * 用户角色枚举
 */
export enum UserRole {
  /** 超级管理员 */
  SUPER_ADMIN = 'super_admin',
  /** 系统管理员 */
  ADMIN = 'admin',
  /** 生产管理员 */
  PRODUCTION_MANAGER = 'production_manager',
  /** 质检员 */
  QC_INSPECTOR = 'qc_inspector',
  /** 仓库管理员 */
  WAREHOUSE_MANAGER = 'warehouse_manager',
  /** 物流管理员 */
  LOGISTICS_MANAGER = 'logistics_manager',
  /** 经销商 */
  DEALER = 'dealer',
  /** 门店 */
  STORE = 'store',
  /** 普通用户 */
  USER = 'user',
}

/**
 * 用户角色类型（与 UserRole 枚举对应，用于类型标注）
 */
export type UserRoleType =
  | 'super_admin'
  | 'admin'
  | 'production_manager'
  | 'qc_inspector'
  | 'warehouse_manager'
  | 'logistics_manager'
  | 'dealer'
  | 'store'
  | 'user';

/**
 * 用户角色显示名称映射
 */
export const UserRoleLabel: Record<UserRoleType, string> = {
  super_admin: '超级管理员',
  admin: '系统管理员',
  production_manager: '生产管理员',
  qc_inspector: '质检员',
  warehouse_manager: '仓库管理员',
  logistics_manager: '物流管理员',
  dealer: '经销商',
  store: '门店',
  user: '普通用户',
};

/**
 * 操作日志接口
 */
export interface OperationLog {
  /** 日志ID */
  id: string | number;
  /** 操作人用户ID */
  userId: string | number;
  /** 操作人用户名 */
  userName: string;
  /** 操作人角色 */
  role: UserRoleType;
  /** 操作动作 */
  action: string;
  /** 所属模块 */
  module: string;
  /** 操作目标ID */
  targetId?: string | number;
  /** 操作IP地址 */
  ip?: string;
  /** 操作前数据 */
  beforeData?: Record<string, unknown> | string;
  /** 操作后数据 */
  afterData?: Record<string, unknown> | string;
  /** 创建时间 */
  createdAt: string | Date;
}

/**
 * 状态显示名称映射（通用）
 */
export const StatusLabel: Record<StatusEnum, string> = {
  pending: '待处理',
  active: '进行中',
  success: '成功',
  warning: '警告',
  danger: '危险',
  frozen: '已冻结',
};

/**
 * 基础实体接口，所有业务实体可继承此接口
 */
export interface BaseEntity {
  /** 主键ID */
  id: string | number;
  /** 创建时间 */
  createdAt?: string | Date;
  /** 更新时间 */
  updatedAt?: string | Date;
  /** 创建人 */
  createdBy?: string | number;
  /** 更新人 */
  updatedBy?: string | number;
}

/**
 * 键值对类型
 */
export interface KeyValue<T = unknown> {
  key: string | number;
  value: T;
  label?: string;
}

/**
 * 选项类型（用于下拉框等）
 */
export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  [key: string]: unknown;
}
