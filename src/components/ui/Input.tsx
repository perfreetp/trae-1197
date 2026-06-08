import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 输入框变体类型
 * default: 默认边框
 * filled: 填充背景
 * underlined: 下划线风格
 */
export type InputVariant = 'default' | 'filled' | 'underlined';

/**
 * 输入框尺寸类型
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * 输入框组件属性接口
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** 变体样式 */
  variant?: InputVariant;
  /** 尺寸 */
  size?: InputSize;
  /** 是否显示错误状态 */
  error?: boolean;
  /** 错误提示文字 */
  errorMessage?: string;
  /** 前缀图标 */
  prefix?: ReactNode;
  /** 后缀图标/元素 */
  suffix?: ReactNode;
  /** 容器类名 */
  wrapperClassName?: string;
  /** 标签文字 */
  label?: string;
  /** 是否必填（显示星号） */
  required?: boolean;
}

/**
 * 变体样式映射
 */
const variantClasses: Record<InputVariant, { base: string; focused: string; error: string }> = {
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
  underlined: {
    base: 'border-0 border-b border-gray-200 rounded-none bg-transparent px-0',
    focused: 'focus:border-primary-400 focus:ring-0',
    error: 'border-b-danger-400 focus:border-danger-400 focus:ring-0',
  },
};

/**
 * 尺寸样式映射
 */
const sizeClasses: Record<InputSize, { input: string; prefix: string }> = {
  sm: { input: 'h-8 px-3 text-xs rounded-lg', prefix: 'pl-8' },
  md: { input: 'h-10 px-3.5 text-sm rounded-xl', prefix: 'pl-10' },
  lg: { input: 'h-12 px-4 text-base rounded-xl', prefix: 'pl-11' },
};

/**
 * 输入框组件
 * 支持多种变体、尺寸、错误状态、前后缀、标签等
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      errorMessage,
      prefix,
      suffix,
      wrapperClassName,
      label,
      required,
      className,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const v = variantClasses[variant];
    const s = sizeClasses[size];
    const inputId = id || props.name || `input-${Math.random().toString(36).slice(2, 8)}`;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 select-none"
          >
            {label}
            {required && <span className="text-danger-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative w-full">
          {prefix && (
            <div
              className={cn(
                'absolute inset-y-0 flex items-center pointer-events-none text-gray-400',
                size === 'sm' ? 'left-2.5' : size === 'md' ? 'left-3' : 'left-3.5',
              )}
            >
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full outline-none transition-all duration-200',
              'placeholder:text-gray-400',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              s.input,
              v.base,
              error ? v.error : v.focused,
              prefix && v.base.includes('rounded-none') ? 'pl-0' : prefix && s.prefix,
              suffix && (size === 'sm' ? 'pr-8' : size === 'md' ? 'pr-10' : 'pr-11'),
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
Input.displayName = 'Input';

export default Input;
