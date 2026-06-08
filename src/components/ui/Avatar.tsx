import { forwardRef, type ImgHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

/**
 * 头像尺寸类型
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 头像变体类型
 * circle: 圆形
 * rounded: 圆角方形
 */
export type AvatarVariant = 'circle' | 'rounded';

/**
 * 头像颜色主题
 */
export type AvatarFallbackColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'pink'
  | 'cyan'
  | 'gray';

/**
 * 头像组件属性接口
 */
export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  /** 头像尺寸 */
  size?: AvatarSize;
  /** 头像形状 */
  variant?: AvatarVariant;
  /** 当图片加载失败或未提供时的回退内容 */
  fallback?: ReactNode;
  /** 回退背景色（当fallback为文字时生效） */
  fallbackColor?: AvatarFallbackColor;
  /** 边框宽度 */
  bordered?: boolean;
  /** 边框颜色 */
  borderColor?: string;
}

/**
 * 尺寸样式映射（高度/宽度 + 字体大小 + 图标大小）
 */
const sizeConfig: Record<AvatarSize, { box: string; text: string; icon: number }> = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]', icon: 12 },
  sm: { box: 'w-8 h-8', text: 'text-xs', icon: 16 },
  md: { box: 'w-10 h-10', text: 'text-sm', icon: 20 },
  lg: { box: 'w-12 h-12', text: 'text-base', icon: 24 },
  xl: { box: 'w-16 h-16', text: 'text-lg', icon: 32 },
  '2xl': { box: 'w-20 h-20', text: 'text-xl', icon: 40 },
};

/**
 * 变体样式映射
 */
const variantClasses: Record<AvatarVariant, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
};

/**
 * 回退背景色映射
 */
const fallbackColorClasses: Record<AvatarFallbackColor, string> = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-trust-100 text-trust-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  purple: 'bg-purple-100 text-purple-700',
  pink: 'bg-pink-100 text-pink-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  gray: 'bg-gray-100 text-gray-600',
};

/**
 * 提取文字头像（取首字或前两个字符）
 */
function extractFallbackText(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const chars = Array.from(trimmed);
  return chars[0] || '';
}

/**
 * 头像组件
 * 支持图片头像、文字头像、默认图标头像三种形式
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      size = 'md',
      variant = 'circle',
      fallback,
      fallbackColor = 'primary',
      bordered = false,
      borderColor = 'border-white',
      className,
      src,
      alt = '',
      onError,
      children,
      ...imgProps
    },
    ref,
  ) => {
    const config = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none',
          config.box,
          variantClasses[variant],
          bordered && `ring-2 ${borderColor}`,
          className,
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            onError={onError}
            className="w-full h-full object-cover"
            {...imgProps}
          />
        ) : null}

        {!src && (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center font-semibold',
              fallbackColorClasses[fallbackColor],
            )}
          >
            {fallback ? (
              typeof fallback === 'string' ? (
                <span className={config.text}>{extractFallbackText(fallback)}</span>
              ) : (
                fallback
              )
            ) : (
              <User size={config.icon} strokeWidth={2} />
            )}
          </div>
        )}
      </div>
    );
  },
);
Avatar.displayName = 'Avatar';

/**
 * 头像组组件属性
 */
export interface AvatarGroupProps {
  children: ReactNode;
  /** 头像最大显示数量 */
  max?: number;
  /** 头像尺寸 */
  size?: AvatarSize;
  /** 组容器类名 */
  className?: string;
  /** 超出部分点击回调 */
  onMoreClick?: () => void;
}

/**
 * 头像组组件
 * 用于展示多个头像，超出max时显示剩余数量
 */
export function AvatarGroup({
  children,
  max = 5,
  size = 'md',
  className,
  onMoreClick,
}: AvatarGroupProps) {
  const variant = 'circle';
  const childArray = Array.isArray(children) ? children : [children];
  const visible = childArray.slice(0, max);
  const restCount = childArray.length - max;

  const overlapClasses = {
    xs: '-space-x-2',
    sm: '-space-x-2.5',
    md: '-space-x-3',
    lg: '-space-x-4',
    xl: '-space-x-5',
    '2xl': '-space-x-6',
  }[size];

  return (
    <div className={cn('inline-flex items-center', overlapClasses, className)}>
      {visible}
      {restCount > 0 && (
        <div
          onClick={onMoreClick}
          className={cn(
            'relative inline-flex items-center justify-center shrink-0 ring-2 ring-white bg-gray-200 text-gray-600 font-semibold cursor-pointer hover:bg-gray-300 transition-colors',
            sizeConfig[size].box,
            sizeConfig[size].text,
            variant === 'circle' ? 'rounded-full' : 'rounded-xl',
          )}
        >
          +{restCount}
        </div>
      )}
    </div>
  );
}

export default Object.assign(Avatar, { Group: AvatarGroup });
