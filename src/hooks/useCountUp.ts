/**
 * 数字滚动动画 Hook
 * 数字从 0 平滑滚动动画到目标值
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * easeOutExpo 缓动函数
 * 让动画开始快、结束慢，视觉更自然
 */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * 缓动函数类型
 */
type EasingFn = (t: number) => number;

/**
 * useCountUp Hook 参数
 */
export interface UseCountUpOptions {
  /** 目标值 */
  end: number;
  /** 起始值，默认 0 */
  start?: number;
  /** 动画持续时间（毫秒），默认 2000 */
  duration?: number;
  /** 延迟启动时间（毫秒），默认 0 */
  delay?: number;
  /** 小数位数，默认 0 */
  decimals?: number;
  /** 缓动函数，默认 easeOutExpo */
  easing?: EasingFn;
  /** 是否自动开始，默认 true */
  autoStart?: boolean;
  /** 每帧更新回调（返回格式化后的数字） */
  onUpdate?: (current: number) => void;
  /** 动画结束回调 */
  onComplete?: (finalValue: number) => void;
  /** 格式化函数，返回展示字符串 */
  formatter?: (value: number) => string;
}

/**
 * useCountUp Hook 返回值
 */
export interface UseCountUpReturn {
  /** 当前数字值（格式化后的字符串，若提供了 formatter） */
  display: string;
  /** 当前数字值（未格式化的数值） */
  value: number;
  /** 是否正在播放动画 */
  isAnimating: boolean;
  /** 手动开始/重新开始动画 */
  start: (newEnd?: number) => void;
  /** 暂停动画 */
  pause: () => void;
  /** 继续播放（从暂停处继续） */
  resume: () => void;
  /** 重置为初始状态 */
  reset: () => void;
  /** 直接跳到结束值 */
  goToEnd: () => void;
}

/**
 * useCountUp
 * 数字从起始值滚动到目标值的动画 Hook
 *
 * @param options 配置选项
 * @returns 控制对象 { display, value, isAnimating, start, pause, resume, reset, goToEnd }
 *
 * @example
 * // 基础用法
 * const { display } = useCountUp({ end: 12345, duration: 2000 });
 *
 * @example
 * // 带格式化
 * const { display } = useCountUp({
 *   end: 9999.99,
 *   decimals: 2,
 *   formatter: (v) => `¥${v.toLocaleString('zh-CN')}`
 * });
 */
export function useCountUp(options: UseCountUpOptions): UseCountUpReturn {
  const {
    end,
    start = 0,
    duration = 2000,
    delay = 0,
    decimals = 0,
    easing = easeOutExpo,
    autoStart = true,
    onUpdate,
    onComplete,
    formatter,
  } = options;

  // 当前值
  const [currentValue, setCurrentValue] = useState<number>(start);
  // 动画状态
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // 动画相关引用
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const startValueRef = useRef<number>(start);
  const endValueRef = useRef<number>(end);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 取消动画帧
   */
  const cancelRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (delayTimerRef.current !== null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  /**
   * 执行单帧动画
   */
  const tick = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - pausedAtRef.current;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const newValue =
        startValueRef.current + (endValueRef.current - startValueRef.current) * easedProgress;

      // 四舍五入到指定小数位
      const rounded = Number(newValue.toFixed(decimals));
      setCurrentValue(rounded);
      onUpdate?.(rounded);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
        setIsAnimating(false);
        pausedAtRef.current = 0;
        onComplete?.(endValueRef.current);
      }
    },
    [duration, easing, decimals, onUpdate, onComplete],
  );

  /**
   * 开始动画
   */
  const startAnim = useCallback(
    (newEnd?: number) => {
      cancelRaf();
      startValueRef.current = start;
      endValueRef.current = typeof newEnd === 'number' ? newEnd : end;
      startTimeRef.current = 0;
      pausedAtRef.current = 0;
      setCurrentValue(start);
      setIsAnimating(true);

      if (delay > 0) {
        delayTimerRef.current = setTimeout(() => {
          rafIdRef.current = requestAnimationFrame(tick);
        }, delay);
      } else {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    },
    [start, end, delay, tick, cancelRaf],
  );

  /**
   * 暂停动画
   */
  const pause = useCallback(() => {
    if (!isAnimating) return;
    cancelRaf();
    pausedAtRef.current = performance.now() - startTimeRef.current;
    setIsAnimating(false);
  }, [isAnimating, cancelRaf]);

  /**
   * 继续动画
   */
  const resume = useCallback(() => {
    if (isAnimating || rafIdRef.current !== null) return;
    setIsAnimating(true);
    startTimeRef.current = 0;
    rafIdRef.current = requestAnimationFrame(tick);
  }, [isAnimating, tick]);

  /**
   * 重置动画
   */
  const reset = useCallback(() => {
    cancelRaf();
    setCurrentValue(start);
    setIsAnimating(false);
    startTimeRef.current = 0;
    pausedAtRef.current = 0;
    startValueRef.current = start;
    endValueRef.current = end;
  }, [start, end, cancelRaf]);

  /**
   * 直接跳到结束值
   */
  const goToEnd = useCallback(() => {
    cancelRaf();
    const finalValue = Number(end.toFixed(decimals));
    setCurrentValue(finalValue);
    setIsAnimating(false);
    pausedAtRef.current = 0;
    onUpdate?.(finalValue);
    onComplete?.(finalValue);
  }, [end, decimals, cancelRaf, onUpdate, onComplete]);

  // 自动启动动画
  useEffect(() => {
    if (autoStart) {
      startAnim();
    }
    return cancelRaf;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end]);

  // 格式化显示
  const display = formatter ? formatter(currentValue) : currentValue.toFixed(decimals);

  return {
    display,
    value: currentValue,
    isAnimating,
    start: startAnim,
    pause,
    resume,
    reset,
    goToEnd,
  };
}

export default useCountUp;
