import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { BatchStatus, ProcessStepStatus, QCConclusion, TraceCodeStatus } from '@/types/batch';
import type { RecallLevel, RecallStatus, RecallProgressStatus, RecallStage } from '@/types/recall';
import type { WarehouseOperationType, DealerLevel } from '@/types/warehouse';
import { BatchStatusLabel, ProcessStepStatusLabel, QCConclusionLabel, TraceCodeStatusLabel } from '@/types/batch';
import { RecallLevelLabel, RecallStatusLabel, RecallProgressStatusLabel, RecallStageLabel } from '@/types/recall';
import { WarehouseOperationTypeLabel, DealerLevelLabel } from '@/types/warehouse';

/**
 * 徽章风格类型
 * dot: 小圆点风格
 * pill: 胶囊风格
 */
export type BadgeStyle = 'dot' | 'pill';

/**
 * 徽章语义化颜色类型
 */
export type BadgeColor =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'default'
  | 'purple'
  | 'pink';

/**
 * 状态徽章属性接口
 */
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** 状态值 */
  value: string;
  /** 状态类别（自动映射颜色和文案） */
  category?:
    | 'batch'
    | 'process-step'
    | 'qc'
    | 'trace-code'
    | 'recall-level'
    | 'recall-status'
    | 'recall-progress'
    | 'recall-stage'
    | 'warehouse-op'
    | 'dealer-level'
    | 'custom';
  /** 自定义显示文案 */
  label?: string;
  /** 自定义颜色（category=custom时生效） */
  color?: BadgeColor;
  /** 徽章风格 */
  styleType?: BadgeStyle;
  /** 是否显示脉冲动画（表示进行中） */
  pulse?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 颜色样式映射（pill 风格）
 */
const pillColorClasses: Record<BadgeColor, string> = {
  success: 'bg-trust-50 text-trust-700 border border-trust-200',
  warning: 'bg-warning-50 text-warning-700 border border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border border-danger-200',
  info: 'bg-primary-50 text-primary-700 border border-primary-200',
  primary: 'bg-primary-50 text-primary-700 border border-primary-200',
  default: 'bg-gray-50 text-gray-700 border border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  pink: 'bg-pink-50 text-pink-700 border border-pink-200',
};

/**
 * Dot 颜色样式
 */
const dotColorClasses: Record<BadgeColor, string> = {
  success: 'bg-trust-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-primary-500',
  primary: 'bg-primary-500',
  default: 'bg-gray-400',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};

/**
 * 尺寸映射
 */
const sizeConfig = {
  sm: { pill: 'h-5 px-1.5 text-[10px]', dot: 'w-1.5 h-1.5' },
  md: { pill: 'h-6 px-2 text-xs', dot: 'w-2 h-2' },
  lg: { pill: 'h-7 px-2.5 text-sm', dot: 'w-2.5 h-2.5' },
};

/**
 * 状态 -> 颜色 映射表
 */
const statusColorMap: Record<string, BadgeColor> = {
  producing: 'warning',
  qualified: 'success',
  stored: 'info',
  transit: 'primary',
  sold: 'success',
  frozen: 'danger',

  pending: 'default',
  processing: 'warning',
  completed: 'success',
  paused: 'info',
  abnormal: 'danger',

  unqualified: 'danger',
  'qc-pending': 'warning',

  unused: 'default',
  assigned: 'primary',
  inbound: 'info',
  outbound: 'primary',
  signed: 'success',
  recalled: 'danger',

  general: 'warning',
  important: 'danger',
  urgent: 'danger',

  investigating: 'warning',
  recalling: 'danger',
  cancelled: 'default',

  'rp-pending': 'default',
  'rp-processing': 'warning',
  done: 'success',
  exception: 'danger',

  notify: 'primary',
  feedback: 'info',
  recover: 'warning',
  destroy: 'danger',

  'warehouse-in': 'success',
  'warehouse-out': 'primary',

  L1: 'purple',
  L2: 'primary',
  L3: 'info',
};

/**
 * 脉冲动画类
 */
const pulseAnimation =
  'relative before:absolute before:inset-0 before:rounded-full before:animate-ping before:opacity-40';

/**
 * 获取类别对应的标签和颜色映射
 */
function resolveStatus(
  value: string,
  category: StatusBadgeProps['category'],
): { label: string; color: BadgeColor; pulse: boolean } {
  let label: string = value;
  let colorKey: string = value;
  let pulse = false;

  switch (category) {
    case 'batch':
      label = BatchStatusLabel[value as BatchStatus] ?? value;
      pulse = value === 'producing';
      break;
    case 'process-step':
      label = ProcessStepStatusLabel[value as ProcessStepStatus] ?? value;
      colorKey = value;
      pulse = value === 'processing';
      break;
    case 'qc':
      label = QCConclusionLabel[value as QCConclusion] ?? value;
      if (value === 'pending') colorKey = 'qc-pending';
      break;
    case 'trace-code':
      label = TraceCodeStatusLabel[value as TraceCodeStatus] ?? value;
      break;
    case 'recall-level':
      label = RecallLevelLabel[value as RecallLevel] ?? value;
      pulse = value === 'urgent';
      break;
    case 'recall-status':
      label = RecallStatusLabel[value as RecallStatus] ?? value;
      pulse = value === 'investigating' || value === 'recalling';
      break;
    case 'recall-progress':
      label = RecallProgressStatusLabel[value as RecallProgressStatus] ?? value;
      if (value === 'pending') colorKey = 'rp-pending';
      if (value === 'processing') colorKey = 'rp-processing';
      pulse = value === 'processing';
      break;
    case 'recall-stage':
      label = RecallStageLabel[value as RecallStage] ?? value;
      break;
    case 'warehouse-op':
      label = WarehouseOperationTypeLabel[value as WarehouseOperationType] ?? value;
      colorKey = value === 'in' ? 'warehouse-in' : 'warehouse-out';
      break;
    case 'dealer-level':
      label = DealerLevelLabel[value as DealerLevel] ?? value;
      break;
    case 'custom':
    default:
      break;
  }

  const color = statusColorMap[colorKey] ?? 'default';
  return { label, color, pulse };
}

/**
 * 状态徽章组件
 * 支持多种业务状态自动映射颜色和文案，支持 dot/pill 两种风格
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      value,
      category = 'custom',
      label: customLabel,
      color: customColor,
      styleType = 'pill',
      pulse: pulseProp,
      size = 'md',
      className,
      ...props
    },
    ref,
  ) => {
    const resolved = resolveStatus(value, category);
    const label = customLabel ?? resolved.label;
    const color: BadgeColor = category === 'custom' ? customColor ?? 'default' : resolved.color;
    const pulse = pulseProp ?? resolved.pulse;

    if (styleType === 'dot') {
      return (
        <span
          ref={ref}
          className={cn(
            'inline-flex items-center gap-1.5 font-medium text-gray-700',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
            className,
          )}
          {...props}
        >
          <span
            className={cn(
              'shrink-0 rounded-full inline-block',
              dotColorClasses[color],
              sizeConfig[size].dot,
              pulse && pulseAnimation,
              pulse && dotColorClasses[color],
            )}
          />
          <span>{label}</span>
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-xl',
          pillColorClasses[color],
          sizeConfig[size].pill,
          className,
        )}
        {...props}
      >
        {pulse && (
          <span
            className={cn(
              'shrink-0 rounded-full inline-block relative',
              dotColorClasses[color],
              size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2',
              pulseAnimation,
            )}
          />
        )}
        <span>{label}</span>
      </span>
    );
  },
);
StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
