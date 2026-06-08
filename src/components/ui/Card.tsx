import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 卡片变体类型
 * default: 默认白色卡片
 * glass: 毛玻璃效果卡片
 * gradient: 渐变背景卡片
 */
export type CardVariant = 'default' | 'glass' | 'gradient';

/**
 * 卡片组件属性接口
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 卡片变体样式 */
  variant?: CardVariant;
  /** 是否可悬停（阴影+微上浮效果） */
  hoverable?: boolean;
}

/**
 * 变体样式映射
 */
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200',
  glass: 'bg-white/70 backdrop-blur-xl border border-white/40',
  gradient:
    'bg-gradient-to-br from-primary-50 via-white to-trust-50 border border-primary-100/50',
};

/**
 * 卡片组件
 * 包含 CardHeader、CardTitle、CardDescription、CardContent、CardFooter 子组件
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hoverable = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl shadow-sm transition-all duration-300',
          variantClasses[variant],
          hoverable && 'hover:shadow-xl hover:-translate-y-1 hover:border-primary-200/50 cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

/**
 * 卡片头部组件
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pb-4 flex flex-col gap-1.5', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
CardHeader.displayName = 'CardHeader';

/**
 * 卡片标题组件
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-gray-900 leading-tight', className)}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

/**
 * 卡片描述组件
 */
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  ),
);
CardDescription.displayName = 'CardDescription';

/**
 * 卡片内容组件
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  ),
);
CardContent.displayName = 'CardContent';

/**
 * 卡片底部组件
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** 是否显示分隔线 */
  bordered?: boolean;
}
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'p-6 pt-4 flex items-center',
        bordered && 'mt-2 border-t border-gray-100',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = 'CardFooter';

export default Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});
