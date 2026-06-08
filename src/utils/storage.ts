/**
 * LocalStorage 封装工具
 * 提供带 JSON 序列化的安全存取操作，支持命名空间前缀
 */

/**
 * 默认命名空间前缀（用于区分不同项目的存储数据）
 */
const DEFAULT_NAMESPACE = 'drug_trace_';

/**
 * 存储值类型（用于泛型约束）
 */
type StorageValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

/**
 * 拼接带命名空间的完整 key
 * @param key 原始 key
 * @param namespace 命名空间，默认使用 DEFAULT_NAMESPACE
 */
function getFullKey(key: string, namespace?: string): string {
  const ns = namespace ?? DEFAULT_NAMESPACE;
  return ns ? `${ns}${key}` : key;
}

/**
 * 从 localStorage 获取数据
 * 自动进行 JSON 反序列化，读取失败时返回默认值
 *
 * @param key 存储键
 * @param defaultValue 读取失败或不存在时的默认值
 * @param namespace 命名空间前缀
 * @returns 解析后的值，或 defaultValue
 */
export function getStorage<T extends StorageValue>(
  key: string,
  defaultValue?: T,
  namespace?: string,
): T | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  try {
    const fullKey = getFullKey(key, namespace);
    const raw = window.localStorage.getItem(fullKey);
    if (raw === null) {
      return defaultValue;
    }
    // 尝试 JSON 解析
    return JSON.parse(raw) as T;
  } catch {
    // JSON 解析失败，返回原始字符串（兼容旧数据）
    try {
      const fullKey = getFullKey(key, namespace);
      const raw = window.localStorage.getItem(fullKey);
      return raw as unknown as T;
    } catch {
      return defaultValue;
    }
  }
}

/**
 * 将数据保存到 localStorage
 * 自动进行 JSON 序列化
 *
 * @param key 存储键
 * @param value 要存储的值
 * @param namespace 命名空间前缀
 * @returns 是否保存成功
 */
export function setStorage<T extends StorageValue>(
  key: string,
  value: T,
  namespace?: string,
): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const fullKey = getFullKey(key, namespace);
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(fullKey, serialized);
    return true;
  } catch {
    // 存储空间已满或序列化失败
    console.warn('[storage] 设置 localStorage 失败，可能是存储空间已满');
    return false;
  }
}

/**
 * 从 localStorage 删除指定 key 的数据
 *
 * @param key 存储键
 * @param namespace 命名空间前缀
 * @returns 是否删除成功
 */
export function removeStorage(key: string, namespace?: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const fullKey = getFullKey(key, namespace);
    window.localStorage.removeItem(fullKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查指定 key 是否存在
 *
 * @param key 存储键
 * @param namespace 命名空间前缀
 */
export function hasStorage(key: string, namespace?: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  const fullKey = getFullKey(key, namespace);
  return window.localStorage.getItem(fullKey) !== null;
}

/**
 * 清空指定命名空间下的所有存储
 * 若未指定 namespace，则清空 DEFAULT_NAMESPACE 下的所有数据
 *
 * @param namespace 命名空间前缀
 * @returns 清除的条数
 */
export function clearStorage(namespace?: string): number {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }
  const ns = namespace ?? DEFAULT_NAMESPACE;
  const keysToRemove: string[] = [];

  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(ns)) {
      keysToRemove.push(k);
    }
  }

  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  return keysToRemove.length;
}

/**
 * 清空全部 localStorage（慎用！）
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.clear();
}

/**
 * 获取命名空间下所有存储的 key
 *
 * @param namespace 命名空间前缀
 * @returns key 数组（已去除命名空间前缀）
 */
export function getStorageKeys(namespace?: string): string[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  const ns = namespace ?? DEFAULT_NAMESPACE;
  const result: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(ns)) {
      result.push(k.slice(ns.length));
    }
  }
  return result;
}

/**
 * 获取命名空间下的全部存储
 *
 * @param namespace 命名空间前缀
 * @returns { [key]: value } 对象
 */
export function getAllStorage<T extends StorageValue = StorageValue>(
  namespace?: string,
): Record<string, T | undefined> {
  const keys = getStorageKeys(namespace);
  const result: Record<string, T | undefined> = {};
  keys.forEach((k) => {
    result[k] = getStorage<T>(k, undefined, namespace);
  });
  return result;
}

/**
 * 带过期时间的存储设置
 *
 * @param key 存储键
 * @param value 要存储的值
 * @param ttlMs 过期时间（毫秒），如 1 小时为 3600 * 1000
 * @param namespace 命名空间前缀
 */
export function setStorageWithExpiry<T extends StorageValue>(
  key: string,
  value: T,
  ttlMs: number,
  namespace?: string,
): boolean {
  const wrapper = {
    value,
    _expireAt: Date.now() + ttlMs,
  };
  return setStorage(key, wrapper as unknown as T, namespace);
}

/**
 * 读取带过期时间的存储
 * 过期自动删除并返回默认值
 *
 * @param key 存储键
 * @param defaultValue 读取失败或已过期时的默认值
 * @param namespace 命名空间前缀
 */
export function getStorageWithExpiry<T extends StorageValue>(
  key: string,
  defaultValue?: T,
  namespace?: string,
): T | undefined {
  const wrapper = getStorage<{ value: T; _expireAt: number }>(key, undefined, namespace);
  if (!wrapper) {
    return defaultValue;
  }
  // 检查是否过期
  if (typeof wrapper._expireAt === 'number' && wrapper._expireAt < Date.now()) {
    removeStorage(key, namespace);
    return defaultValue;
  }
  return wrapper.value;
}

/**
 * 获取 localStorage 已使用空间（字节）
 */
export function getStorageUsedSize(): number {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k) {
      const v = window.localStorage.getItem(k) ?? '';
      // 简单估算：key + value 的 UTF-16 码元数 × 2 字节
      total += (k.length + v.length) * 2;
    }
  }
  return total;
}
