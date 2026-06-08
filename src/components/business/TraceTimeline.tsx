import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Circle,
  CircleDashed,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Cpu,
  Settings2,
  AlertCircle,
} from 'lucide-react';

export type ProcessStatus = 'pending' | 'processing' | 'completed' | 'paused' | 'abnormal';

export interface ProcessStepData {
  id: string;
  stepOrder: number;
  stepName: string;
  operator?: string;
  equipment?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  parameters?: Record<string, string | number | boolean>;
  status: ProcessStatus;
  remark?: string;
}

interface TraceTimelineProps {
  steps: ProcessStepData[];
  defaultExpandAll?: boolean;
  className?: string;
}

const statusConfig: Record<
  ProcessStatus,
  {
    label: string;
    badgeClass: string;
    iconBg: string;
    iconClass: string;
    lineClass: string;
  }
> = {
  pending: {
    label: '待开始',
    badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    iconBg: 'bg-gray-100 border-2 border-gray-300',
    iconClass: 'text-gray-400',
    lineClass: 'bg-gray-200',
  },
  processing: {
    label: '进行中',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    iconBg: 'bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/30',
    iconClass: 'text-blue-500',
    lineClass: 'bg-blue-200',
  },
  completed: {
    label: '已完成',
    badgeClass: 'bg-green-50 text-green-700 border border-green-200',
    iconBg: 'bg-green-500 shadow-lg shadow-green-500/30',
    iconClass: 'text-white',
    lineClass: 'bg-green-300',
  },
  paused: {
    label: '已暂停',
    badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200',
    iconBg: 'bg-orange-500 shadow-lg shadow-orange-500/30',
    iconClass: 'text-white',
    lineClass: 'bg-orange-200',
  },
  abnormal: {
    label: '异常',
    badgeClass: 'bg-red-50 text-red-700 border border-red-200',
    iconBg: 'bg-red-500 shadow-lg shadow-red-500/30',
    iconClass: 'text-white',
    lineClass: 'bg-red-200',
  },
};

function formatDate(date?: string | Date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatDuration(start?: string | Date, end?: string | Date) {
  if (!start || !end) return null;
  const s = typeof start === 'string' ? new Date(start).getTime() : start.getTime();
  const e = typeof end === 'string' ? new Date(end).getTime() : end.getTime();
  const diff = Math.max(0, e - s);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}小时${minutes}分`;
  return `${minutes}分钟`;
}

function StatusIcon({ status }: { status: ProcessStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 className="w-4 h-4" strokeWidth={3} />;
  }
  if (status === 'processing') {
    return (
      <div className="relative w-4 h-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        <Circle className="w-4 h-4 relative fill-blue-500" />
      </div>
    );
  }
  if (status === 'abnormal') {
    return <AlertCircle className="w-4 h-4" strokeWidth={2.5} />;
  }
  if (status === 'paused') {
    return <Circle className="w-4 h-4 fill-orange-500 stroke-orange-500" />;
  }
  return <CircleDashed className="w-4 h-4" strokeWidth={2} />;
}

export default function TraceTimeline({
  steps,
  defaultExpandAll = false,
  className,
}: TraceTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (defaultExpandAll) {
      return new Set(steps.filter(s => s.parameters && Object.keys(s.parameters).length > 0).map(s => s.id));
    }
    const current = steps.find(s => s.status === 'processing');
    return current ? new Set([current.id]) : new Set();
  });

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(steps.filter(s => s.parameters && Object.keys(s.parameters).length > 0).map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div className={className}>
      {steps.length > 0 && (
        <div className="flex items-center justify-end gap-2 mb-4 text-xs">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            展开全部
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            折叠全部
          </button>
        </div>
      )}

      <div className="relative">
        {sortedSteps.map((step, index) => {
          const config = statusConfig[step.status];
          const isLast = index === sortedSteps.length - 1;
          const isExpanded = expandedIds.has(step.id);
          const hasParams = step.parameters && Object.keys(step.parameters).length > 0;
          const duration = formatDuration(step.startTime, step.endTime);

          return (
            <div key={step.id} className="relative flex gap-4">
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-[22px] top-12 bottom-0 w-0.5',
                    config.lineClass,
                    step.status === 'processing' && 'opacity-60'
                  )}
                />
              )}

              <div className="relative z-10 flex-shrink-0 pt-1">
                <div
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center',
                    config.iconBg,
                    step.status === 'processing' && 'animate-pulseGlow'
                  )}
                >
                  <div className={config.iconClass}>
                    <StatusIcon status={step.status} />
                  </div>
                </div>

                <div className="mt-2 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                    {String(step.stepOrder).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="flex-1 pb-8">
                <div
                  className={cn(
                    'relative rounded-xl border bg-white transition-all duration-300 overflow-hidden',
                    step.status === 'processing'
                      ? 'border-blue-200 shadow-md shadow-blue-500/5'
                      : step.status === 'abnormal'
                      ? 'border-red-200 shadow-md shadow-red-500/5'
                      : step.status === 'completed'
                      ? 'border-green-100'
                      : 'border-gray-200 opacity-80'
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-semibold text-gray-800">{step.stepName}</h4>
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.badgeClass)}>
                            {config.label}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          {step.operator && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                <span className="text-gray-400 mr-1">责任人:</span>
                                {step.operator}
                              </span>
                            </div>
                          )}

                          {step.equipment && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Cpu className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                <span className="text-gray-400 mr-1">设备:</span>
                                {step.equipment}
                              </span>
                            </div>
                          )}

                          {step.startTime && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate font-mono text-xs">
                                {formatDate(step.startTime)}
                              </span>
                            </div>
                          )}

                          {duration && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Loader2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-green-600 font-medium text-xs">
                                耗时 {duration}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {hasParams && (
                        <button
                          onClick={() => toggleExpand(step.id)}
                          className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                      )}
                    </div>

                    {step.remark && step.status !== 'pending' && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 text-sm">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{step.remark}</span>
                      </div>
                    )}

                    {hasParams && isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Settings2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-gray-700">工艺参数</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.entries(step.parameters!).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-100"
                            >
                              <span className="text-xs text-gray-400">{key}</span>
                              <span className="text-sm font-mono font-semibold text-gray-800">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {step.status === 'processing' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-xl" />
                  )}
                  {step.status === 'abnormal' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600 rounded-l-xl" />
                  )}
                  {step.status === 'completed' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-l-xl" />
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

export { TraceTimeline };
