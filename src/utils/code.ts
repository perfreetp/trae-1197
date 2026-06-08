/**
 * 编码生成工具函数
 * 包含追溯码生成、批次号生成等
 */

import dayjs from 'dayjs';
import type { TraceCodeLevel } from '@/types/batch';

/**
 * 追溯码级别对应的编码前缀
 * case: 箱码（C开头）
 * box: 盒码（B开头）
 * bottle: 瓶码（P开头，取自Package）
 */
const LEVEL_CODE_PREFIX: Record<TraceCodeLevel, string> = {
  case: 'C',
  box: 'B',
  bottle: 'P',
};

/**
 * 追溯码格式校验正则
 * 格式: {前缀}{产品标识2位}{YYYYMMDD}{级别标识}{8位流水}{校验位1位}
 * 示例: AB8120260609P00000001X
 */
const TRACE_CODE_REGEX = /^[A-Z]{2}\d{8}[CBP]\d{8}[A-Z0-9]$/;

/**
 * 生成符合药品追溯码格式的随机码
 *
 * 格式说明:
 * - 产品标识前缀: 2位大写字母
 * - 日期: 8位 YYYYMMDD
 * - 级别标识: C(箱) / B(盒) / P(瓶)
 * - 流水号: 8位数字，自动补零
 * - 校验位: 1位大写字母或数字（简单取模生成）
 *
 * @param prefix 产品标识前缀（2位大写字母，如 'AB'）
 * @param level 追溯码级别 ('case' | 'box' | 'bottle')
 * @param count 生成数量，默认 1
 * @param startIndex 流水号起始值，默认 1
 * @returns 追溯码数组（长度为 count）
 */
export function generateTraceCode(
  prefix: string,
  level: TraceCodeLevel,
  count: number = 1,
  startIndex: number = 1,
): string[] {
  // 参数校验
  if (!/^[A-Z]{2}$/.test(prefix)) {
    throw new Error('prefix 必须是 2 位大写字母');
  }
  if (count <= 0 || !Number.isInteger(count)) {
    throw new Error('count 必须是正整数');
  }
  if (startIndex < 0 || !Number.isInteger(startIndex)) {
    throw new Error('startIndex 必须是非负整数');
  }

  const dateStr = dayjs().format('YYYYMMDD');
  const levelChar = LEVEL_CODE_PREFIX[level];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    const serial = String(startIndex + i).padStart(8, '0');
    const baseCode = `${prefix}${dateStr}${levelChar}${serial}`;

    // 计算简单校验位：基于 ASCII 码累加取模
    let sum = 0;
    for (let j = 0; j < baseCode.length; j++) {
      sum += baseCode.charCodeAt(j);
    }
    const checkChar = chars.charAt(sum % chars.length);

    results.push(`${baseCode}${checkChar}`);
  }

  return results;
}

/**
 * 生成单个追溯码（便捷函数）
 * @param prefix 产品标识前缀
 * @param level 追溯码级别
 * @param index 流水号，默认 1
 */
export function generateSingleTraceCode(
  prefix: string,
  level: TraceCodeLevel,
  index: number = 1,
): string {
  return generateTraceCode(prefix, level, 1, index)[0];
}

/**
 * 校验追溯码格式
 * @param code 追溯码
 * @returns 是否符合格式
 */
export function validateTraceCode(code: string): boolean {
  if (!code) return false;
  if (!TRACE_CODE_REGEX.test(code)) return false;

  // 校验最后一位校验位
  const baseCode = code.slice(0, -1);
  const checkChar = code.slice(-1);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sum = 0;
  for (let j = 0; j < baseCode.length; j++) {
    sum += baseCode.charCodeAt(j);
  }
  const expected = chars.charAt(sum % chars.length);
  return checkChar === expected;
}

/**
 * 解析追溯码信息
 * @param code 追溯码
 * @returns 解析出的信息（格式不正确时返回 null）
 */
export function parseTraceCode(code: string): {
  prefix: string;
  date: string;
  level: TraceCodeLevel;
  serial: string;
  checkChar: string;
} | null {
  if (!validateTraceCode(code)) {
    return null;
  }
  const levelChar = code.charAt(10) as 'C' | 'B' | 'P';
  const levelMap: Record<'C' | 'B' | 'P', TraceCodeLevel> = {
    C: 'case',
    B: 'box',
    P: 'bottle',
  };
  return {
    prefix: code.slice(0, 2),
    date: code.slice(2, 10),
    level: levelMap[levelChar],
    serial: code.slice(11, 19),
    checkChar: code.slice(19),
  };
}

/**
 * 生成批次号
 *
 * 格式: {产品前缀}{YYYYMMDD}-{3位流水号}
 * 示例: AB20260609-001
 *
 * @param productPrefix 产品前缀（2位大写字母，如 'AB'）
 * @param sequence 流水号（1-999），默认 1
 * @param customDate 自定义日期，默认当天
 * @returns 批次号字符串
 */
export function generateBatchCode(
  productPrefix: string,
  sequence: number = 1,
  customDate?: string | number | Date,
): string {
  // 参数校验
  if (!/^[A-Z]{2}$/.test(productPrefix)) {
    throw new Error('productPrefix 必须是 2 位大写字母');
  }
  if (sequence < 1 || sequence > 999 || !Number.isInteger(sequence)) {
    throw new Error('sequence 必须是 1-999 之间的整数');
  }

  const dateStr = dayjs(customDate).format('YYYYMMDD');
  const seqStr = String(sequence).padStart(3, '0');

  return `${productPrefix}${dateStr}-${seqStr}`;
}

/**
 * 解析批次号
 * @param batchCode 批次号
 * @returns 解析结果，格式不正确返回 null
 */
export function parseBatchCode(batchCode: string): {
  prefix: string;
  date: string;
  sequence: number;
} | null {
  const regex = /^([A-Z]{2})(\d{8})-(\d{3})$/;
  const match = batchCode.match(regex);
  if (!match) {
    return null;
  }
  return {
    prefix: match[1],
    date: match[2],
    sequence: Number(match[3]),
  };
}

/**
 * 生成入库单号
 * 格式: R{YYYYMMDD}{4位流水号}
 * 示例: R202606090001
 */
export function generateInboundOrderNo(sequence: number = 1, customDate?: string | number | Date): string {
  const dateStr = dayjs(customDate).format('YYYYMMDD');
  const seqStr = String(sequence).padStart(4, '0');
  return `R${dateStr}${seqStr}`;
}

/**
 * 生成出库单号
 * 格式: C{YYYYMMDD}{4位流水号}
 * 示例: C202606090001
 */
export function generateOutboundOrderNo(sequence: number = 1, customDate?: string | number | Date): string {
  const dateStr = dayjs(customDate).format('YYYYMMDD');
  const seqStr = String(sequence).padStart(4, '0');
  return `C${dateStr}${seqStr}`;
}

/**
 * 生成召回通知单号
 * 格式: ZH{YYYYMMDD}{3位流水号}
 * 示例: ZH20260609001
 */
export function generateRecallOrderNo(sequence: number = 1, customDate?: string | number | Date): string {
  const dateStr = dayjs(customDate).format('YYYYMMDD');
  const seqStr = String(sequence).padStart(3, '0');
  return `ZH${dateStr}${seqStr}`;
}

/**
 * 生成质检报告编号
 * 格式: QC{YYYYMMDD}{4位流水号}
 * 示例: QC202606090001
 */
export function generateQCReportNo(sequence: number = 1, customDate?: string | number | Date): string {
  const dateStr = dayjs(customDate).format('YYYYMMDD');
  const seqStr = String(sequence).padStart(4, '0');
  return `QC${dateStr}${seqStr}`;
}

/**
 * 生成随机ID（简单UUID风格，非标准）
 * 格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * @param useSimple 是否使用简单模式（无连字符），默认 false
 */
export function generateId(useSimple: boolean = false): string {
  const hex = '0123456789abcdef';
  const arr: string[] = [];
  for (let i = 0; i < 32; i++) {
    arr.push(hex.charAt(Math.floor(Math.random() * 16)));
  }
  if (useSimple) {
    return arr.join('');
  }
  return [
    arr.slice(0, 8).join(''),
    arr.slice(8, 12).join(''),
    arr.slice(12, 16).join(''),
    arr.slice(16, 20).join(''),
    arr.slice(20, 32).join(''),
  ].join('-');
}

/**
 * 生成指定长度的随机数字字符串
 * @param length 长度，默认 6
 */
export function generateRandomDigits(length: number = 6): string {
  if (length <= 0) return '';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

/**
 * 生成指定长度的随机字母数字字符串
 * @param length 长度
 * @param onlyUpper 是否只使用大写字母，默认 true
 */
export function generateRandomString(
  length: number,
  onlyUpper: boolean = true,
): string {
  if (length <= 0) return '';
  const chars = onlyUpper
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
