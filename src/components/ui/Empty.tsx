import { type ReactNode, type CSSProperties } from 'react';
import { Package, Search, FileQuestion, WifiOff, ShoppingCart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

/**
 * 空状态预设类型
 */
export type EmptyPreset =
  | 'default'
  | 'no-data'
  | 'no-results'
  | 'no-network'
  | 'no-cart'
  | 'no-tasks'
  | 'no-records';

/**
 * 空状态预设配置
 */
const presetConfig: Record<
  EmptyPreset,
  { Icon: typeof Package; title: string; description: string; iconColor: string }
> = {
  default: {
    Icon: Package,
    title: '暂无数据',
    description: '当前页面还没有任何内容',
    iconColor: 'text-gray-400',
  },
  'no-data': {
    Icon: ClipboardList,
    title: '暂无数据',
    description: '还没有创建任何记录，快去添加第一条吧',
    iconColor: 'text-gray-400',
  },
  'no-results': {
    Icon: Search,
    title: '未找到匹配结果',
    description: '请尝试调整筛选条件或关键词',
    iconColor: 'text-primary-400',
  },
  'no-network': {
    Icon: WifiOff,
    title: '网络连接异常',
    description: '请检查网络连接后刷新重试',
    iconColor: 'text-danger-400',
  },
  'no-cart': {
    Icon: ShoppingCart,
    title: '购物车是空的',
    description: '去逛逛，挑选心仪的商品吧',
    iconColor: 'text-warning-400',
  },
  'no-tasks': {
    Icon: ClipboardList,
    title: '暂无待办任务',
    description: '所有任务都已完成，干得漂亮！',
    iconColor: 'text-trust-400',
  },
  'no-records': {
    Icon: FileQuestion,
    title: '暂无相关记录',
    description: '没有找到符合条件的历史记录',
    iconColor: 'text-gray-400',
  },
};

/**
 * 空状态组件属性接口
 */
export interface EmptyProps {
  /** 预设类型 */
  preset?: EmptyPreset;
  /** 自定义图标（覆盖预设） */
  icon?: ReactNode;
  /** 自定义标题 */
  title?: string;
  /** 自定义描述文字 */
  description?: string;
  /** 操作按钮配置 */
  action?: {
    /** 按钮文字 */
    label: string;
    /** 点击回调 */
    onClick: () => void;
    /** 按钮变体 */
    variant?: 'primary' | 'secondary';
  };
  /** 自定义操作区域（完全替换按钮） */
  extra?: ReactNode;
  /** 容器内边距大小 */
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** 整体尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 容器类名 */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
}

/**
 * 尺寸映射
 */
const sizeConfig = {
  sm: {
    iconWrapper: 'w-16 h-16 mb-4',
    iconSize: 32,
    title: 'text-base',
    desc: 'text-xs',
  },
  md: {
    iconWrapper: 'w-24 h-24 mb-5',
    iconSize: 48,
    title: 'text-lg',
    desc: 'text-sm',
  },
  lg: {
    iconWrapper: 'w-32 h-32 mb-6',
    iconSize: 64,
    title: 'text-xl',
    desc: 'text-base',
  },
};

/**
 * 内边距映射
 */
const paddingClasses: Record<NonNullable<EmptyProps['padding']>, string> = {
  sm: 'p-6',
  md: 'py-12 px-6',
  lg: 'py-20 px-8',
  none: 'py-0',
};

/**
 * 空状态组件
 * 用于展示无数据、无搜索结果、网络异常等场景
 */
export default function Empty({
  preset = 'default',
  icon,
  title,
  description,
  action,
  extra,
  padding = 'md',
  size = 'md',
  className,
  style,
}: EmptyProps) {
  const presetData = presetConfig[preset];
  const config = sizeConfig[size];
  const displayTitle = title ?? presetData.title;
  const displayDescription = description ?? presetData.description;

  return (
    <div
      style={style}
      className={cn(
        'flex flex-col items-center justify-center text-center w-full',
        paddingClasses[padding],
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-gray-50',
          presetData.iconColor,
          config.iconWrapper,
        )}
      >
        {icon ?? <presetData.Icon size={config.iconSize} strokeWidth={1.5} />}
      </div>

      <h3 className={cn('font-semibold text-gray-800 mb-1.5', config.title)}>
        {displayTitle}
      </h3>

      <p
        className={cn(
          'text-gray-500 mb-6 max-w-sm leading-relaxed',
          config.desc,
        )}
      >
        {displayDescription}
      </p>

      {extra ? (
        extra
      ) : action ? (
        <Button
          size={size === 'sm' ? 'sm' : 'md'}
          variant={action.variant ?? 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
