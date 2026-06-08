import { cn } from '@/lib/utils';
import {
  FilePlus2,
  Factory,
  ClipboardCheck,
  Warehouse,
  Truck,
  ShoppingBag,
  Snowflake,
  CheckCircle2,
  Clock,
  User,
  type LucideIcon,
} from 'lucide-react';

export type BatchFlowStatus =
  | 'created'
  | 'producing'
  | 'qc'
  | 'stored'
  | 'transit'
  | 'sold'
  | 'frozen';

export interface BatchStatusStep {
  status: BatchFlowStatus;
  label: string;
  arriveTime?: string | Date;
  operator?: string;
  remark?: string;
}

interface BatchStatusTimelineProps {
  steps?: any[];
  events?: any[];
  currentStatus?: BatchFlowStatus;
  batchStatus?: string;
  className?: string;
}

const STATUS_ORDER: BatchFlowStatus[] = [
  'created',
  'producing',
  'qc',
  'stored',
  'transit',
  'sold',
  'frozen',
];

const STATUS_INFO: Record<
  BatchFlowStatus,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    lightBg: string;
    lightText: string;
    borderColor: string;
  }
> = {
  created: {
    label: '创建批次',
    icon: FilePlus2,
    color: '#6366F1',
    lightBg: 'bg-indigo-50',
    lightText: 'text-indigo-600',
    borderColor: 'border-indigo-300',
  },
  producing: {
    label: '生产中',
    icon: Factory,
    color: '#3B82F6',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-600',
    borderColor: 'border-blue-300',
  },
  qc: {
    label: '质检',
    icon: ClipboardCheck,
    color: '#10B981',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-600',
    borderColor: 'border-emerald-300',
  },
  stored: {
    label: '入库',
    icon: Warehouse,
    color: '#14B8A6',
    lightBg: 'bg-teal-50',
    lightText: 'text-teal-600',
    borderColor: 'border-teal-300',
  },
  transit: {
    label: '运输中',
    icon: Truck,
    color: '#F59E0B',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-600',
    borderColor: 'border-amber-300',
  },
  sold: {
    label: '已销售',
    icon: ShoppingBag,
    color: '#06B6D4',
    lightBg: 'bg-cyan-50',
    lightText: 'text-cyan-600',
    borderColor: 'border-cyan-300',
  },
  frozen: {
    label: '已冻结',
    icon: Snowflake,
    color: '#EF4444',
    lightBg: 'bg-red-50',
    lightText: 'text-red-600',
    borderColor: 'border-red-300',
  },
};

function formatTime(date?: string | Date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function getStepsWithDefaults(
  inputSteps: any[],
  current: BatchFlowStatus
): (BatchStatusStep & { order: number; isActive: boolean; isPassed: boolean })[] {
  const currentIdx = STATUS_ORDER.indexOf(current);

  let stepsToShow: BatchFlowStatus[];
  if (current === 'frozen') {
    stepsToShow = ['created', 'producing', 'qc', 'stored', 'frozen'];
  } else {
    stepsToShow = STATUS_ORDER.slice(0, Math.max(currentIdx + 1, 1));
    if (stepsToShow.length < 4) {
      stepsToShow = STATUS_ORDER.slice(0, 4);
    }
  }

  return stepsToShow.map((s, i) => {
    const idx = STATUS_ORDER.indexOf(s);
    const input = inputSteps.find(st => (st.status === s || st.key === s));
    const isActive = s === current;
    const isPassed = idx < currentIdx;
    const arriveTime = input?.arriveTime ?? input?.time;
    return {
      status: s,
      label: input?.label ?? STATUS_INFO[s].label,
      arriveTime,
      operator: input?.operator,
      remark: input?.remark,
      order: i,
      isActive,
      isPassed,
    };
  });
}

export default function BatchStatusTimeline({
  steps,
  events,
  currentStatus,
  batchStatus,
  className,
}: BatchStatusTimelineProps) {
  const actualSteps = steps ?? events ?? [];
  const actualStatus: BatchFlowStatus = (currentStatus ?? batchStatus ?? 'created') as BatchFlowStatus;
  const displaySteps = getStepsWithDefaults(actualSteps, actualStatus);

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <div className="flex items-start justify-between overflow-x-auto pb-8 pt-2 scrollbar-thin">
          {displaySteps.map((step, index) => {
            const info = STATUS_INFO[step.status];
            const Icon = info.icon;
            const isLast = index === displaySteps.length - 1;

            return (
              <div key={step.status} className="relative flex flex-col items-center flex-shrink-0" style={{ minWidth: '100px' }}>
                {!isLast && (
                  <div className="absolute top-6 left-1/2 w-full h-1">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        step.isPassed
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                          : step.isActive
                          ? 'bg-gradient-to-r from-green-400 via-blue-400 to-blue-200'
                          : 'bg-gray-200'
                      )}
                    />
                    {step.isActive && (
                      <div
                        className="absolute top-0 h-full w-6 bg-gradient-to-r from-white to-transparent animate-pulse"
                        style={{ animation: 'shimmer 1.5s linear infinite' }}
                      />
                    )}
                  </div>
                )}

                <div className="relative z-10 group">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 cursor-pointer',
                      step.isPassed && 'bg-white border-green-400 shadow-lg shadow-green-500/20',
                      step.isActive && 'bg-white border-blue-500 shadow-xl shadow-blue-500/40 animate-pulseGlow scale-110',
                      !step.isPassed && !step.isActive && 'bg-gray-50 border-gray-300 opacity-70'
                    )}
                    style={step.isActive ? { borderColor: info.color, boxShadow: `0 0 20px ${info.color}40` } : undefined}
                  >
                    {step.isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" strokeWidth={3} />
                    ) : (
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          step.isActive
                            ? ''
                            : !step.isPassed
                            ? 'text-gray-400'
                            : ''
                        )}
                        style={step.isActive ? { color: info.color } : step.isPassed ? { color: info.color } : undefined}
                      />
                    )}
                  </div>

                  <div
                    className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                    <p
                      className={cn(
                        'text-xs font-semibold text-center',
                        step.isActive ? 'text-gray-900' : step.isPassed ? 'text-gray-700' : 'text-gray-400'
                      )}
                      style={step.isActive ? { color: info.color } : undefined}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'mt-14 rounded-xl p-3 border transition-all duration-200 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible z-20',
                    'absolute top-8 left-1/2 -translate-x-1/2 min-w-[180px] bg-white shadow-xl border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn('w-6 h-6 rounded-md flex items-center justify-center', info.lightBg)}
                    >
                      <Icon className={cn('w-3.5 h-3.5', info.lightText)} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{info.label}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>到达时间：</span>
                      <span className="font-mono text-gray-800">{formatTime(step.arriveTime)}</span>
                    </div>
                    {step.operator && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>操作人：</span>
                        <span className="text-gray-800">{step.operator}</span>
                      </div>
                    )}
                    {step.remark && (
                      <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                        <p className="text-gray-500 line-clamp-2">{step.remark}</p>
                      </div>
                    )}
                  </div>

                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { BatchStatusTimeline };
