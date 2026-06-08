import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 按钮组件变体类型
 * primary: 蓝色渐变光晕主按钮
 * secondary: 白灰次要按钮
 * success: 绿色成功按钮
 * warning: 橙色警告按钮
 * danger: 红色危险按钮
 * ghost: 透明幽灵按钮
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';

/**
 * 按钮尺寸类型
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 按钮组件属性接口
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体样式 */
  variant?: ButtonVariant;
  /** 按钮尺寸 */
  size?: ButtonSize;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标 */
  rightIcon?: ReactNode;
}

/**
 * 变体样式映射
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary via-primary-500 to-primary-400 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus:ring-primary-400',
  secondary:
    'bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm focus:ring-gray-300',
  success:
    'bg-trust text-white shadow-lg shadow-trust/25 hover:bg-trust-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-trust/30 active:translate-y-0 active:shadow-md focus:ring-trust-400',
  warning:
    'bg-warning text-white shadow-lg shadow-warning/25 hover:bg-warning-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-warning/30 active:translate-y-0 active:shadow-md focus:ring-warning-400',
  danger:
    'bg-danger text-white shadow-lg shadow-danger/25 hover:bg-danger-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-danger/30 active:translate-y-0 active:shadow-md focus:ring-danger-400',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300',
};

/**
 * 尺寸样式映射
 */
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-xl gap-1',
  sm: 'h-8 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  xl: 'h-14 px-8 text-lg rounded-xl gap-2.5',
};

/**
 * 按钮组件
 * 支持多种变体、尺寸、加载状态、图标、全宽等特性
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 18 : 20} />
        ) : (
          leftIcon
        )}
        {children && <span className={loading ? 'opacity-70' : ''}>{children}</span>}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
