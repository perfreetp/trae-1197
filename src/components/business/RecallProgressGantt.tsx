import { cn } from '@/lib/utils';
import {
  Bell,
  MessageSquare,
  PackageMinus,
  Microscope,
  Trash2,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export type RecallStage = 'notify' | 'feedback' | 'recycle' | 'inspect' | 'destroy' | 'close';
export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'delayed';

export interface RecallStageData {
  stage: RecallStage;
  label: string;
  status: StageStatus;
  progress: number;
  plannedStart?: string | Date;
  plannedEnd?: string | Date;
  actualStart?: string | Date;
  actualEnd?: string | Date;
  operator?: string;
  remark?: string;
}

interface RecallProgressGanttProps {
  stages?: RecallStageData[];
  className?: string;
  showLegend?: boolean;
}

const STAGE_CONFIG: Record<
  RecallStage,
  {
    label: string;
    icon: typeof Bell;
    color: string;
  }
> = {
  notify: { label: '通知阶段', icon: Bell, color: '#6366F1' },
  feedback: { label: '反馈阶段', icon: MessageSquare, color: '#3B82F6' },
  recycle: { label: '回收阶段', icon: PackageMinus, color: '#F59E0B' },
  inspect: { label: '检验阶段', icon: Microscope, color: '#10B981' },
  destroy: { label: '销毁阶段', icon: Trash2, color: '#EF4444' },
  close: { label: '结案阶段', icon: FileCheck, color: '#8B5CF6' },
};

const STAGE_ORDER: RecallStage[] = ['notify', 'feedback', 'recycle', 'inspect', 'destroy', 'close'];

const STATUS_STYLE: Record<
  StageStatus,
  {
    label: string;
    barClass: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: '待开始',
    barClass: 'bg-gray-200',
    textClass: 'text-gray-500',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    icon: Clock,
  },
  in_progress: {
    label: '进行中',
    barClass: 'bg-gradient-to-r from-blue-500 to-blue-400',
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    icon: Clock,
  },
  completed: {
    label: '已完成',
    barClass: 'bg-gradient-to-r from-green-500 to-emerald-500',
    textClass: 'text-green-600',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    icon: CheckCircle2,
  },
  overdue: {
    label: '已超期',
    barClass: 'bg-gradient-to-r from-red-500 to-rose-500',
    textClass: 'text-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    icon: AlertTriangle,
  },
  delayed: {
    label: '延期中',
    barClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
    textClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    icon: AlertTriangle,
  },
};

function getDefaultStages(): RecallStageData[] {
  return [
    {
      stage: 'notify',
      label: '召回通知',
      status: 'completed',
      progress: 100,
      actualStart: '2024-01-15 09:00:00',
      actualEnd: '2024-01-15 14:30:00',
      operator: '张伟',
    },
    {
      stage: 'feedback',
      label: '渠道反馈',
      status: 'completed',
      progress: 100,
      actualStart: '2024-01-15 14:00:00',
      actualEnd: '2024-01-17 18:00:00',
      operator: '李娜',
    },
    {
      stage: 'recycle',
      label: '产品回收',
      status: 'in_progress',
      progress: 68,
      actualStart: '2024-01-18 08:00:00',
      operator: '王强',
      remark: '已回收 3,400 盒，剩余 1,600 盒待回收',
    },
    {
      stage: 'inspect',
      label: '原因检验',
      status: 'pending',
      progress: 0,
      operator: '质检部',
    },
    {
      stage: 'destroy',
      label: '产品销毁',
      status: 'pending',
      progress: 0,
    },
    {
      stage: 'close',
      label: '结案归档',
      status: 'pending',
      progress: 0,
    },
  ];
}

function formatDate(date?: string | Date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function RecallProgressGantt({
  stages,
  className,
  showLegend = true,
}: RecallProgressGanttProps) {
  const data = stages ?? getDefaultStages();
  const sorted = [...data].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
  );
  const overallProgress = Math.round(
    sorted.reduce((sum, s) => sum + s.progress, 0) / sorted.length
  );
  const hasOverdue = sorted.some(s => s.status === 'overdue');
  const hasDelayed = sorted.some(s => s.status === 'delayed');

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              hasOverdue ? 'bg-red-100' : hasDelayed ? 'bg-amber-100' : 'bg-green-100'
            )}
          >
            {hasOverdue ? (
              <XCircle className="w-6 h-6 text-red-600" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">整体召回进度</p>
            <p className="text-2xl font-bold text-gray-900">
              {overallProgress}
              <span className="text-base text-gray-500 font-medium ml-1">%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">已完成阶段</p>
            <p className="text-lg font-bold text-green-600">
              {sorted.filter(s => s.status === 'completed').length}
              <span className="text-gray-400 text-sm font-normal"> / {sorted.length}</span>
            </p>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 mb-6 px-1">
          {(['completed', 'in_progress', 'pending', 'overdue'] as StageStatus[]).map(s => {
            const style = STATUS_STYLE[s];
            const Icon = style.icon;
            return (
              <div key={s} className="flex items-center gap-1.5 text-xs">
                <div className={cn('w-3 h-3 rounded-sm', style.barClass)} />
                <Icon className={cn('w-3 h-3', style.textClass)} />
                <span className="text-gray-600">{style.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((stage, index) => {
          const config = STAGE_CONFIG[stage.stage];
          const style = STATUS_STYLE[stage.status];
          const Icon = config.icon;
          const StatusIcon = style.icon;
          const isOverdue = stage.status === 'overdue';

          return (
            <div
              key={stage.stage}
              className={cn(
                'group relative rounded-xl border p-4 transition-all duration-300 hover:shadow-md',
                isOverdue
                  ? 'bg-red-50/50 border-red-200 shadow-red-500/5'
                  : stage.status === 'completed'
                  ? 'bg-white border-gray-200 hover:border-green-200'
                  : 'bg-white border-gray-200 hover:border-primary-200'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shadow-sm',
                      style.bgClass,
                      style.borderClass,
                      'border'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', style.textClass)} style={{ color: config.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 mt-1">
                    0{index + 1}
                  </span>
                </div>

                <div className="flex-shrink-0 w-28">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{config.label}</p>
                    {isOverdue && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white animate-pulse">
                        超期
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusIcon className={cn('w-3 h-3', style.textClass)} />
                    <span className={cn('text-xs', style.textClass)}>{style.label}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="relative h-7 rounded-lg overflow-hidden bg-gray-100">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out',
                        style.barClass,
                        stage.status === 'in_progress' && 'animate-pulseGlow'
                      )}
                      style={{
                        width: `${Math.max(stage.progress, stage.progress > 0 ? 4 : 0)}%`,
                      }}
                    />

                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-[11px] font-medium text-gray-600 mix-blend-multiply">
                        {stage.actualStart && formatDate(stage.actualStart)}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-bold drop-shadow-sm',
                          stage.progress > 50 ? 'text-white' : 'text-gray-700'
                        )}
                      >
                        {stage.progress}%
                      </span>
                      <span className="text-[11px] font-medium text-gray-600 mix-blend-multiply">
                        {stage.actualEnd ? formatDate(stage.actualEnd) : '预计完成'}
                      </span>
                    </div>
                  </div>

                  {stage.remark && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500">{stage.remark}</p>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 w-24 text-right">
                  {stage.operator && (
                    <div>
                      <p className="text-[10px] text-gray-400">负责人</p>
                      <p className="text-xs font-medium text-gray-700">{stage.operator}</p>
                    </div>
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

export { RecallProgressGantt };
