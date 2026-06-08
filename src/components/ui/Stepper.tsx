import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle, Loader2, X } from 'lucide-react';

/**
 * 步骤状态类型
 * wait: 等待中（未开始）
 * process: 进行中
 * finish: 已完成
 * error: 出错
 */
export type StepStatus = 'wait' | 'process' | 'finish' | 'error';

/**
 * 单个步骤配置
 */
export interface StepItem {
  /** 步骤标题 */
  title: ReactNode;
  /** 步骤描述（可选） */
  description?: ReactNode;
  /** 自定义图标（覆盖默认图标） */
  icon?: ReactNode;
  /** 强制指定状态（覆盖 current 推断） */
  status?: StepStatus;
}

/**
 * 步骤条组件属性
 */
export interface StepperProps {
  /** 步骤列表 */
  steps: StepItem[];
  /** 当前步骤索引（从0开始） */
  current: number;
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 点击步骤回调（可点击跳转时生效） */
  onChange?: (index: number) => void;
  /** 步骤状态自定义函数 */
  getStatus?: (index: number, current: number) => StepStatus;
  /** 容器类名 */
  className?: string;
  /** 每一步的附加内容（水平模式显示在下方） */
  children?: ReactNode[];
  /** 步骤内容区域类名 */
  contentClassName?: string;
}

/**
 * 推断步骤状态
 */
function inferStatus(index: number, current: number): StepStatus {
  if (index < current) return 'finish';
  if (index === current) return 'process';
  return 'wait';
}

/**
 * 尺寸配置
 */
const sizeConfig = {
  sm: {
    iconWrapper: 'w-7 h-7',
    icon: 14,
    title: 'text-sm',
    desc: 'text-xs',
    line: 'top-3.5',
    vline: 'left-3.5',
  },
  md: {
    iconWrapper: 'w-9 h-9',
    icon: 18,
    title: 'text-base',
    desc: 'text-xs',
    line: 'top-4.5',
    vline: 'left-4.5',
  },
  lg: {
    iconWrapper: 'w-11 h-11',
    icon: 22,
    title: 'text-lg',
    desc: 'text-sm',
    line: 'top-5.5',
    vline: 'left-5.5',
  },
};

/**
 * 步骤条组件
 * 支持水平/垂直两种方向，自动推断步骤状态
 */
export default function Stepper({
  steps,
  current,
  direction = 'horizontal',
  size = 'md',
  onChange,
  getStatus = inferStatus,
  className,
  children,
  contentClassName,
}: StepperProps) {
  const sc = sizeConfig[size];
  const isHorizontal = direction === 'horizontal';

  /**
   * 根据状态渲染图标
   */
  function renderIcon(status: StepStatus, index: number, customIcon?: ReactNode): ReactNode {
    if (customIcon) return customIcon;

    const baseIcon = (content: ReactNode, cls: string) => (
      <div
        className={cn(
          'shrink-0 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
          sc.iconWrapper,
          cls,
        )}
      >
        {content}
      </div>
    );

    switch (status) {
      case 'finish':
        return baseIcon(
          <Check size={sc.icon} strokeWidth={3} />,
          'bg-trust text-white shadow-md shadow-trust/30',
        );
      case 'process':
        return baseIcon(
          <div className="relative">
            <Loader2 size={sc.icon} strokeWidth={2.5} className="animate-spin text-primary-600" />
          </div>,
          'bg-primary-50 text-primary-600 ring-4 ring-primary-100 shadow-md shadow-primary/20',
        );
      case 'error':
        return baseIcon(
          <X size={sc.icon} strokeWidth={3} />,
          'bg-danger text-white shadow-md shadow-danger/30',
        );
      case 'wait':
      default:
        return baseIcon(
          <span className="text-gray-400 font-medium">{index + 1}</span>,
          'bg-gray-100 text-gray-500 border border-gray-200',
        );
    }
  }

  /**
   * 连接线样式
   */
  function renderLine(index: number, targetStatus: StepStatus, isLast: boolean) {
    if (isLast) return null;
    const active = targetStatus === 'finish';

    if (isHorizontal) {
      return (
        <div className="flex-1 h-0.5 mx-1 mt-1 relative overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              'absolute inset-y-0 left-0 transition-all duration-500 ease-out',
              active ? 'w-full bg-trust' : 'w-0',
            )}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'absolute left-0 flex-1 w-0.5 overflow-hidden rounded-full bg-gray-100',
          sc.vline,
          'top-10 bottom-0',
        )}
      >
        <div
          className={cn(
            'absolute inset-x-0 top-0 transition-all duration-500 ease-out',
            active ? 'h-full bg-trust' : 'h-0',
          )}
        />
      </div>
    );
  }

  const clickable = !!onChange;

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          isHorizontal ? 'flex items-start' : 'flex flex-col',
          isHorizontal && 'gap-1',
        )}
      >
        {steps.map((step, index) => {
          const status = step.status ?? getStatus(index, current);
          const isLast = index === steps.length - 1;
          const nextStatus = !isLast ? steps[index + 1].status ?? getStatus(index + 1, current) : 'wait';

          const titleColor =
            status === 'process'
              ? 'text-primary-700'
              : status === 'finish'
              ? 'text-gray-900'
              : status === 'error'
              ? 'text-danger-700'
              : 'text-gray-400';

          return (
            <div
              key={index}
              className={cn(
                'relative',
                isHorizontal ? 'flex-1 first:flex-none last:flex-none' : '',
                !isHorizontal ? 'pb-8 pl-0' : '',
              )}
            >
              <div
                className={cn(
                  'flex items-start',
                  !isHorizontal ? 'relative' : 'flex-col items-center',
                  clickable && 'cursor-pointer',
                )}
                onClick={() => clickable && onChange?.(index)}
              >
                {renderLine(index, nextStatus, isLast)}
                {renderIcon(status, index, step.icon)}

                <div
                  className={cn(
                    'min-w-0',
                    isHorizontal ? 'mt-2.5 text-center px-1' : 'ml-4 flex-1 pt-1',
                  )}
                >
                  <div className={cn('font-medium leading-tight', sc.title, titleColor)}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div
                      className={cn(
                        'mt-1 text-gray-500 leading-relaxed',
                        sc.desc,
                        isHorizontal ? 'max-w-xs mx-auto' : '',
                      )}
                    >
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {!isHorizontal && (
                <div className="relative ml-12 mt-3">
                  {children?.[index]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isHorizontal && children && (
        <div className={cn('mt-8 p-6 bg-gray-50 rounded-2xl', contentClassName)}>
          {children[current]}
        </div>
      )}
    </div>
  );
}

export { Stepper };
