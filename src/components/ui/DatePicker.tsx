import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

/**
 * 日期选择器变体类型
 */
export type DatePickerVariant = 'default' | 'filled';

/**
 * 日期选择器尺寸类型
 */
export type DatePickerSize = 'sm' | 'md' | 'lg';

/**
 * 日期选择器组件属性接口
 */
export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'prefix'> {
  /** 变体样式 */
  variant?: DatePickerVariant;
  /** 尺寸 */
  size?: DatePickerSize;
  /** 错误状态 */
  error?: boolean;
  /** 错误提示 */
  errorMessage?: string;
  /** 标签 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 容器类名 */
  wrapperClassName?: string;
  /** 自定义前缀 */
  prefix?: ReactNode;
  /** 自定义后缀 */
  suffix?: ReactNode;
}

/**
 * 变体样式
 */
const variantClasses = {
  default: {
    base: 'border border-gray-200 bg-white',
    focused: 'focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
    error: 'border-danger-300 bg-danger-50 focus:border-danger-400 focus:ring-2 focus:ring-danger-100',
  },
  filled: {
    base: 'border border-transparent bg-gray-50',
    focused: 'focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100',
    error: 'border-danger-200 bg-danger-50 focus:border-danger-400 focus:ring-2 focus:ring-danger-100',
  },
};

/**
 * 尺寸样式
 */
const sizeClasses: Record<DatePickerSize, { input: string; prefix: string; icon: number }> = {
  sm: { input: 'h-8 pl-8 pr-3 text-xs rounded-lg', prefix: 'left-2.5', icon: 14 },
  md: { input: 'h-10 pl-10 pr-3.5 text-sm rounded-xl', prefix: 'left-3', icon: 16 },
  lg: { input: 'h-12 pl-11 pr-4 text-base rounded-xl', prefix: 'left-3.5', icon: 18 },
};

/**
 * 日期选择器组件
 * 基于原生 input[type=date] 包装，美化样式
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      errorMessage,
      label,
      required,
      wrapperClassName,
      prefix,
      suffix,
      className,
      disabled,
      id,
      min,
      max,
      ...props
    },
    ref,
  ) => {
    const v = variantClasses[variant];
    const s = sizeClasses[size];
    const pickerId = id || `date-${Math.random().toString(36).slice(2, 8)}`;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={pickerId} className="text-sm font-medium text-gray-700 select-none">
            {label}
            {required && <span className="text-danger-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative w-full">
          <div
            className={cn(
              'absolute inset-y-0 flex items-center pointer-events-none text-gray-400',
              s.prefix,
            )}
          >
            {prefix ?? <Calendar size={s.icon} strokeWidth={2} />}
          </div>

          <input
            ref={ref}
            id={pickerId}
            type="date"
            disabled={disabled}
            min={min}
            max={max}
            className={cn(
              'w-full outline-none transition-all duration-200 text-gray-900',
              'appearance-none',
              '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
              s.input,
              v.base,
              error ? v.error : v.focused,
              disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
              className,
            )}
            {...props}
          />

          {suffix && (
            <div
              className={cn(
                'absolute inset-y-0 flex items-center text-gray-400',
                size === 'sm' ? 'right-2.5' : size === 'md' ? 'right-3' : 'right-3.5',
              )}
            >
              {suffix}
            </div>
          )}
        </div>

        {error && errorMessage && (
          <p className="text-xs text-danger-500 flex items-center gap-1">{errorMessage}</p>
        )}
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';

/**
 * 日期范围选择器组件属性
 */
export interface DateRangePickerProps {
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
  /** 日期变化回调：[start, end] */
  onChange?: (range: [string, string]) => void;
  /** 变体 */
  variant?: DatePickerVariant;
  /** 尺寸 */
  size?: DatePickerSize;
  /** 开始日期占位 */
  startPlaceholder?: string;
  /** 结束日期占位 */
  endPlaceholder?: string;
  /** 标签 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 容器类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最小日期 */
  min?: string;
  /** 最大日期 */
  max?: string;
}

/**
 * 日期范围选择器
 */
export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  variant = 'default',
  size = 'md',
  label,
  required,
  className,
  disabled,
  min,
  max,
}: DateRangePickerProps) {
  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700 select-none">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </span>
      )}
      <div className="flex items-center gap-2">
        <DatePicker
          variant={variant}
          size={size}
          value={startDate}
          onChange={(e) => onChange?.([e.target.value, endDate ?? ''])}
          disabled={disabled}
          min={min}
          max={max}
          wrapperClassName="flex-1 !gap-0"
        />
        <span className="text-gray-400 text-sm shrink-0">至</span>
        <DatePicker
          variant={variant}
          size={size}
          value={endDate}
          onChange={(e) => onChange?.([startDate ?? '', e.target.value])}
          disabled={disabled}
          min={startDate || min}
          max={max}
          wrapperClassName="flex-1 !gap-0"
        />
      </div>
    </div>
  );
}

export default DatePicker;
