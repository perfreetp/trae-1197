import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';
import {
  Package,
  Factory,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';

type StatVariant = 'blue' | 'green' | 'orange' | 'purple';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  description: string;
  trend?: number;
  variant?: StatVariant;
  icon?: LucideIcon;
  sparklineData?: number[];
  decimals?: number;
  duration?: number;
}

const variantConfig: Record<
  StatVariant,
  {
    gradient: string;
    textLight: string;
    textWhite: string;
    iconBg: string;
    sparkline: string;
  }
> = {
  blue: {
    gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600',
    textLight: 'text-blue-100',
    textWhite: 'text-white',
    iconBg: 'bg-white/20',
    sparkline: '#93c5fd',
  },
  green: {
    gradient: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600',
    textLight: 'text-green-100',
    textWhite: 'text-white',
    iconBg: 'bg-white/20',
    sparkline: '#86efac',
  },
  orange: {
    gradient: 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700',
    textLight: 'text-orange-100',
    textWhite: 'text-white',
    iconBg: 'bg-white/20',
    sparkline: '#fcd34d',
  },
  purple: {
    gradient: 'bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600',
    textLight: 'text-purple-100',
    textWhite: 'text-white',
    iconBg: 'bg-white/20',
    sparkline: '#c4b5fd',
  },
};

const defaultIcons: Record<string, LucideIcon> = {
  batch: Package,
  production: Factory,
  warehouse: Warehouse,
  alert: AlertTriangle,
};

function MiniSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3 2" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  description,
  trend = 0,
  variant = 'blue',
  icon,
  sparklineData,
  decimals = 0,
  duration = 2000,
}: StatCardProps) {
  const config = variantConfig[variant];
  const Icon = icon ?? defaultIcons[title] ?? Package;

  const { display } = useCountUp({
    end: value,
    duration,
    decimals,
    formatter: (v) => {
      const formatted = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('zh-CN');
      return `${prefix}${formatted}${suffix}`;
    },
  });

  const trendIsPositive = trend > 0.001;
  const trendIsNegative = trend < -0.001;

  const TrendIcon = trendIsPositive ? TrendingUp : trendIsNegative ? TrendingDown : Minus;
  const trendColor = trendIsPositive ? 'text-green-200' : trendIsNegative ? 'text-red-300' : 'text-white/80';
  const trendText = trendIsPositive ? `↑ ${Math.abs(trend).toFixed(1)}%` : trendIsNegative ? `↓ ${Math.abs(trend).toFixed(1)}%` : '— 持平';

  const sparkData = sparklineData ?? [65, 72, 68, 80, 75, 88, 82, 90, 85, 95];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        config.gradient
      )}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

      <div className="relative flex items-start justify-between mb-4">
        <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl backdrop-blur-sm', config.iconBg)}>
          <Icon className={cn('w-6 h-6', config.textWhite)} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <MiniSparkline data={sparkData} color={config.sparkline} />
        </div>
      </div>

      <div className="relative">
        <p className={cn('text-sm font-medium mb-1', config.textLight)}>{title}</p>
        <p className={cn('text-3xl font-bold tracking-tight mb-3', config.textWhite)}>{display}</p>

        <div className="flex items-center justify-between">
          <p className={cn('text-xs', config.textLight, 'opacity-90')}>{description}</p>
          <div className={cn('flex items-center gap-1 text-xs font-semibold', trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trendText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { StatCard, MiniSparkline, defaultIcons };
