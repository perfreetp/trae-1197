/**
 * 通用格式化工具函数
 * 包含数字、日期、货币、追溯码脱敏、状态中文映射等格式化方法
 */

import dayjs from 'dayjs';

import { StatusLabel, type StatusEnum } from '@/types/common';
import { BatchStatusLabel, type BatchStatus } from '@/types/batch';
import { TraceCodeStatusLabel, type TraceCodeStatus } from '@/types/batch';
import { QCConclusionLabel, type QCConclusion } from '@/types/batch';
import { ProcessStepStatusLabel, type ProcessStepStatus } from '@/types/batch';
import { WarehouseOperationTypeLabel, type WarehouseOperationType } from '@/types/warehouse';
import { DealerLevelLabel, type DealerLevel } from '@/types/warehouse';
import { RecallLevelLabel, type RecallLevel } from '@/types/recall';
import { RecallStatusLabel, type RecallStatus } from '@/types/recall';
import { RecallStageLabel, type RecallStage } from '@/types/recall';
import { RecallProgressStatusLabel, type RecallProgressStatus } from '@/types/recall';
import { UserRoleLabel, type UserRoleType } from '@/types/common';

/**
 * 数字格式化（千分位分隔）
 * @param num 目标数字
 * @param decimals 保留小数位数，默认 0
 * @param fallback 空值时的回退显示
 * @returns 格式化后的数字字符串
 */
export function formatNumber(
  num: number | string | null | undefined,
  decimals: number = 0,
  fallback: string = '-',
): string {
  if (num === null || num === undefined || num === '') {
    return fallback;
  }
  const n = typeof num === 'string' ? Number(num) : num;
  if (Number.isNaN(n)) {
    return fallback;
  }
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 日期格式化（YYYY-MM-DD）
 * @param date 日期对象/字符串/时间戳
 * @param fallback 空值时的回退显示
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  fallback: string = '-',
): string {
  if (!date) {
    return fallback;
  }
  const d = dayjs(date);
  if (!d.isValid()) {
    return fallback;
  }
  return d.format('YYYY-MM-DD');
}

/**
 * 日期时间格式化（YYYY-MM-DD HH:mm:ss）
 * @param date 日期对象/字符串/时间戳
 * @param fallback 空值时的回退显示
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(
  date: string | number | Date | null | undefined,
  fallback: string = '-',
): string {
  if (!date) {
    return fallback;
  }
  const d = dayjs(date);
  if (!d.isValid()) {
    return fallback;
  }
  return d.format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 货币格式化（人民币）
 * @param amount 金额
 * @param decimals 保留小数位数，默认 2
 * @param fallback 空值时的回退显示
 * @returns 格式化后的货币字符串，如 "¥1,234.56"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  decimals: number = 2,
  fallback: string = '-',
): string {
  if (amount === null || amount === undefined || amount === '') {
    return fallback;
  }
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) {
    return fallback;
  }
  return `¥${n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * 追溯码脱敏显示
 * 保留前 6 位和后 4 位，中间用 * 号替换
 * @param code 原始追溯码
 * @param startLen 前保留位数，默认 6
 * @param endLen 后保留位数，默认 4
 * @param fallback 空值时的回退显示
 * @returns 脱敏后的追溯码
 */
export function maskTraceCode(
  code: string | null | undefined,
  startLen: number = 6,
  endLen: number = 4,
  fallback: string = '-',
): string {
  if (!code) {
    return fallback;
  }
  const len = code.length;
  if (len <= startLen + endLen) {
    return code;
  }
  const start = code.slice(0, startLen);
  const end = code.slice(len - endLen);
  const mask = '*'.repeat(len - startLen - endLen);
  return `${start}${mask}${end}`;
}

/**
 * 手机号脱敏
 * @param phone 手机号
 * @param fallback 空值时的回退显示
 */
export function maskPhone(
  phone: string | null | undefined,
  fallback: string = '-',
): string {
  if (!phone) {
    return fallback;
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 身份证号脱敏
 * @param idCard 身份证号
 * @param fallback 空值时的回退显示
 */
export function maskIdCard(
  idCard: string | null | undefined,
  fallback: string = '-',
): string {
  if (!idCard) {
    return fallback;
  }
  return idCard.replace(/(\d{6})\d{8,11}(\d{3}[\dXx])/, '$1********$2');
}

/**
 * 通用状态中文映射函数
 * 根据传入的英文状态值自动匹配对应的中文显示
 * 支持多业务模块的状态映射，无法匹配时原样返回
 * @param status 英文状态值
 * @returns 中文状态名称
 */
export function cnStatus(status: string | null | undefined): string {
  if (!status) {
    return '-';
  }

  // 通用状态
  if (status in StatusLabel) {
    return StatusLabel[status as StatusEnum];
  }

  // 批次状态
  if (status in BatchStatusLabel) {
    return BatchStatusLabel[status as BatchStatus];
  }

  // 追溯码状态
  if (status in TraceCodeStatusLabel) {
    return TraceCodeStatusLabel[status as TraceCodeStatus];
  }

  // 质检结论
  if (status in QCConclusionLabel) {
    return QCConclusionLabel[status as QCConclusion];
  }

  // 工序步骤状态
  if (status in ProcessStepStatusLabel) {
    return ProcessStepStatusLabel[status as ProcessStepStatus];
  }

  // 仓储操作类型
  if (status in WarehouseOperationTypeLabel) {
    return WarehouseOperationTypeLabel[status as WarehouseOperationType];
  }

  // 经销商级别
  if (status in DealerLevelLabel) {
    return DealerLevelLabel[status as DealerLevel];
  }

  // 召回级别
  if (status in RecallLevelLabel) {
    return RecallLevelLabel[status as RecallLevel];
  }

  // 召回状态
  if (status in RecallStatusLabel) {
    return RecallStatusLabel[status as RecallStatus];
  }

  // 召回进度阶段
  if (status in RecallStageLabel) {
    return RecallStageLabel[status as RecallStage];
  }

  // 召回进度状态
  if (status in RecallProgressStatusLabel) {
    return RecallProgressStatusLabel[status as RecallProgressStatus];
  }

  // 用户角色
  if (status in UserRoleLabel) {
    return UserRoleLabel[status as UserRoleType];
  }

  // 未匹配到则返回原值
  return status;
}

/**
 * 百分比格式化
 * @param value 数值（0-1 或 0-100）
 * @param isDecimal 是否为小数格式（如 0.85 表示 85%），默认 true
 * @param decimals 保留小数位数
 * @param fallback 空值时的回退显示
 */
export function formatPercent(
  value: number | string | null | undefined,
  isDecimal: boolean = true,
  decimals: number = 2,
  fallback: string = '-',
): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) {
    return fallback;
  }
  const percent = isDecimal ? n * 100 : n;
  return `${percent.toFixed(decimals)}%`;
}

/**
 * 文件大小格式化
 * @param bytes 字节数
 * @param decimals 保留小数位数
 * @param fallback 空值时的回退显示
 */
export function formatFileSize(
  bytes: number | null | undefined,
  decimals: number = 2,
  fallback: string = '-',
): string {
  if (bytes === null || bytes === undefined) {
    return fallback;
  }
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * 时长格式化（秒 → HH:mm:ss 或 x天x小时x分）
 * @param seconds 秒数
 * @param format 格式：'standard' → HH:mm:ss, 'human' → 人性化显示
 */
export function formatDuration(
  seconds: number | null | undefined,
  format: 'standard' | 'human' = 'standard',
): string {
  if (seconds === null || seconds === undefined || seconds < 0) {
    return '-';
  }
  const s = Math.floor(seconds);

  if (format === 'standard') {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (parts.length === 0) {
    return `${s}秒`;
  }
  return parts.join('');
}
