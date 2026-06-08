import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Info,
  Circle,
} from 'lucide-react';

/**
 * 时间轴节点状态
 */
export type TimelineStatus = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'pending';

/**
 * 时间轴节点类型
 */
export interface TimelineItem {
  /** 节点标题 */
  title: ReactNode;
  /** 节点描述内容 */
  description?: ReactNode;
  /** 时间戳 */
  time?: ReactNode;
  /** 节点状态（决定颜色/图标） */
  status?: TimelineStatus;
  /** 自定义图标（覆盖默认） */
  icon?: ReactNode;
  /** 自定义节点颜色 */
  color?: string;
  /** 附加内容（卡片区域内显示） */
  extra?: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 节点唯一 key */
  key?: string | number;
  /** 操作人/标签（右上） */
  tag?: ReactNode;
}

/**
 * 时间轴组件属性
 */
export interface TimelineProps {
  /** 节点列表 */
  items: TimelineItem[];
  /** 时间戳位置 */
  timestampPlacement?: 'left' | 'right';
  /** 是否倒序（最新在上） */
  reverse?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 连线颜色 */
  lineColor?: string;
  /** 容器类名 */
  className?: string;
  /** 是否有 hover 动画 */
  hoverable?: boolean;
}

/**
 * 状态颜色与图标映射
 */
const statusConfig: Record<
  TimelineStatus,
  { dot: string; ring: string; bg: string; Icon: typeof CheckCircle2; iconSize: number }
> = {
  default: {
    dot: 'bg-gray-400',
    ring: 'ring-gray-200',
    bg: 'bg-gray-50',
    Icon: Circle,
    iconSize: 16,
  },
  info: {
    dot: 'bg-primary-500',
    ring: 'ring-primary-200',
    bg: 'bg-primary-50',
    Icon: Info,
    iconSize: 16,
  },
  success: {
    dot: 'bg-trust-500',
    ring: 'ring-trust-200',
    bg: 'bg-trust-50',
    Icon: CheckCircle2,
    iconSize: 16,
  },
  warning: {
    dot: 'bg-warning-500',
    ring: 'ring-warning-200',
    bg: 'bg-warning-50',
    Icon: AlertCircle,
    iconSize: 16,
  },
  danger: {
    dot: 'bg-danger-500',
    ring: 'ring-danger-200',
    bg: 'bg-danger-50',
    Icon: XCircle,
    iconSize: 16,
  },
  pending: {
    dot: 'bg-gray-300',
    ring: 'ring-gray-100',
    bg: 'bg-gray-50',
    Icon: Clock,
    iconSize: 16,
  },
};

/**
 * 尺寸配置
 */
const sizeConfig = {
  sm: {
    lineLeft: 'left-3',
    dot: 'w-6 h-6',
    ml: 'ml-10',
    contentPad: 'p-3',
    time: 'text-xs',
    title: 'text-sm',
    desc: 'text-xs',
  },
  md: {
    lineLeft: 'left-3.5',
    dot: 'w-7 h-7',
    ml: 'ml-12',
    contentPad: 'p-4',
    time: 'text-xs',
    title: 'text-sm',
    desc: 'text-sm',
  },
  lg: {
    lineLeft: 'left-4',
    dot: 'w-8 h-8',
    ml: 'ml-14',
    contentPad: 'p-5',
    time: 'text-sm',
    title: 'text-base',
    desc: 'text-base',
  },
};

/**
 * 时间轴组件
 * 左侧竖线 + 节点图标 + 内容卡片布局
 */
export default function Timeline({
  items,
  timestampPlacement = 'right',
  reverse = false,
  size = 'md',
  className,
  hoverable = true,
}: TimelineProps) {
  const sc = sizeConfig[size];
  const displayItems = reverse ? [...items].reverse() : items;

  return (
    <div className={cn('w-full relative py-2', className)}>
      {/* 垂直连接线 */}
      <div
        className={cn(
          'absolute top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-100 rounded-full',
          sc.lineLeft,
          'translate-x-[-50%]',
        )}
      />

      <div className="relative space-y-6">
        {displayItems.map((item, index) => {
          const key = item.key ?? index;
          const status: TimelineStatus = item.status ?? 'default';
          const cfg = statusConfig[status];
          const isLast = index === displayItems.length - 1;

          return (
            <div key={key} className="relative w-full">
              {/* 节点圆点 */}
              <div
                className={cn(
                  'absolute flex items-center justify-center rounded-full ring-4 z-10',
                  sc.dot,
                  cfg.dot,
                  cfg.ring,
                  sc.lineLeft,
                  'translate-x-[-50%] top-1',
                )}
                style={item.color ? { backgroundColor: item.color, boxShadow: `0 0 0 4px ${item.color}33` } : undefined}
              >
                {item.icon ?? (
                  <cfg.Icon size={cfg.iconSize} className="text-white" strokeWidth={2.5} />
                )}
              </div>

              {/* 内容卡片 */}
              <div className={sc.ml}>
                {timestampPlacement === 'left' && item.time && (
                  <div className={cn('mb-1.5 text-gray-400 font-medium', sc.time)}>
                    {item.time}
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200',
                    hoverable && !isLast && 'hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5',
                    sc.contentPad,
                    item.className,
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                    <h4 className={cn('font-semibold text-gray-900 leading-tight', sc.title)}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.tag}
                      {timestampPlacement === 'right' && item.time && (
                        <span className={cn('text-gray-400 font-medium shrink-0', sc.time)}>
                          {item.time}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className={cn('text-gray-600 leading-relaxed mb-2', sc.desc)}>
                      {item.description}
                    </p>
                  )}

                  {item.extra && (
                    <div className="mt-3 pt-3 border-t border-gray-100">{item.extra}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Timeline };
