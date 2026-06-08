import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 标签变体类型
 */
export type TagVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'pink';

/**
 * 标签尺寸类型
 */
export type TagSize = 'sm' | 'md' | 'lg';

/**
 * 标签组件属性接口
 */
export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'prefix'> {
  /** 标签变体颜色 */
  variant?: TagVariant;
  /** 标签尺寸 */
  size?: TagSize;
  /** 是否实心填充 */
  solid?: boolean;
  /** 前缀图标 */
  prefix?: ReactNode;
  /** 后缀图标 */
  suffix?: ReactNode;
  /** 是否可关闭（显示关闭按钮） */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

/**
 * 变体样式映射（空心/实心）
 */
const variantClasses: Record<TagVariant, { outline: string; solid: string }> = {
  default: {
    outline: 'bg-gray-50 text-gray-700 border border-gray-200',
    solid: 'bg-gray-500 text-white border border-gray-500',
  },
  primary: {
    outline: 'bg-primary-50 text-primary-700 border border-primary-200',
    solid: 'bg-primary text-white border border-primary',
  },
  success: {
    outline: 'bg-trust-50 text-trust-700 border border-trust-200',
    solid: 'bg-trust text-white border border-trust',
  },
  warning: {
    outline: 'bg-warning-50 text-warning-700 border border-warning-200',
    solid: 'bg-warning text-white border border-warning',
  },
  danger: {
    outline: 'bg-danger-50 text-danger-700 border border-danger-200',
    solid: 'bg-danger text-white border border-danger',
  },
  info: {
    outline: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    solid: 'bg-cyan-500 text-white border border-cyan-500',
  },
  purple: {
    outline: 'bg-purple-50 text-purple-700 border border-purple-200',
    solid: 'bg-purple-500 text-white border border-purple-500',
  },
  pink: {
    outline: 'bg-pink-50 text-pink-700 border border-pink-200',
    solid: 'bg-pink-500 text-white border border-pink-500',
  },
};

/**
 * 尺寸样式映射
 */
const sizeClasses: Record<TagSize, string> = {
  sm: 'h-5 px-1.5 text-[10px] rounded-md gap-0.5',
  md: 'h-6 px-2 text-xs rounded-lg gap-1',
  lg: 'h-7 px-2.5 text-sm rounded-lg gap-1',
};

/**
 * 标签组件
 * 用于展示分类、状态、标记等信息
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      variant = 'default',
      size = 'md',
      solid = false,
      prefix,
      suffix,
      closable = false,
      onClose,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium transition-colors',
          solid ? variantClasses[variant].solid : variantClasses[variant].outline,
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {prefix && <span className="shrink-0">{prefix}</span>}
        {children}
        {suffix && <span className="shrink-0">{suffix}</span>}
        {closable && (
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'shrink-0 ml-0.5 rounded-full hover:bg-black/10 transition-colors',
              size === 'sm' ? 'p-0.5' : size === 'md' ? 'p-0.5' : 'p-1',
            )}
          >
            <svg
              className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-3.5 h-3.5'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  },
);
Tag.displayName = 'Tag';

export default Tag;
