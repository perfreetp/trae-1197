import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Info } from 'lucide-react';

export interface ProvinceData {
  code: string;
  name: string;
  value: number;
  extra?: Record<string, string | number>;
}

interface ChinaMapHeatProps {
  data?: ProvinceData[];
  className?: string;
  title?: string;
  onSelect?: (province: ProvinceData | null) => void;
  selectedCode?: string | null;
}

const PROVINCE_MATRIX: { code: string; name: string; row: number; col: number }[] = [
  { code: 'HL', name: '黑龙江', row: 0, col: 10 },
  { code: 'JL', name: '吉林', row: 1, col: 10 },
  { code: 'LN', name: '辽宁', row: 2, col: 9 },
  { code: 'NM', name: '内蒙古', row: 1, col: 6 },
  { code: 'XJ', name: '新疆', row: 2, col: 1 },
  { code: 'GS', name: '甘肃', row: 3, col: 3 },
  { code: 'QH', name: '青海', row: 3, col: 2 },
  { code: 'XZ', name: '西藏', row: 4, col: 1 },
  { code: 'NX', name: '宁夏', row: 3, col: 4 },
  { code: 'SX', name: '陕西', row: 3, col: 5 },
  { code: 'SX2', name: '山西', row: 2, col: 7 },
  { code: 'HB', name: '河北', row: 2, col: 8 },
  { code: 'BJ', name: '北京', row: 1, col: 8 },
  { code: 'TJ', name: '天津', row: 2, col: 8.5 },
  { code: 'SD', name: '山东', row: 3, col: 9 },
  { code: 'HA', name: '河南', row: 4, col: 7 },
  { code: 'JS', name: '江苏', row: 4, col: 9 },
  { code: 'SH', name: '上海', row: 5, col: 10 },
  { code: 'AH', name: '安徽', row: 5, col: 8 },
  { code: 'ZJ', name: '浙江', row: 6, col: 9.5 },
  { code: 'FJ', name: '福建', row: 7, col: 9 },
  { code: 'JX', name: '江西', row: 6, col: 8 },
  { code: 'HUB', name: '湖北', row: 5, col: 7 },
  { code: 'HUN', name: '湖南', row: 6, col: 7 },
  { code: 'GD', name: '广东', row: 7, col: 7.5 },
  { code: 'GX', name: '广西', row: 7, col: 6 },
  { code: 'HI', name: '海南', row: 9, col: 6.5 },
  { code: 'SC', name: '四川', row: 4, col: 4 },
  { code: 'CQ', name: '重庆', row: 5, col: 5 },
  { code: 'GZ', name: '贵州', row: 6, col: 5 },
  { code: 'YN', name: '云南', row: 7, col: 4 },
  { code: 'TW', name: '台湾', row: 8, col: 10 },
  { code: 'HK', name: '香港', row: 7.5, col: 8 },
  { code: 'MO', name: '澳门', row: 7.5, col: 7.8 },
];

const COLOR_LEVELS = [
  { threshold: 0, bg: 'bg-blue-50', text: 'text-gray-400', border: 'border-blue-100' },
  { threshold: 1, bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  { threshold: 10, bg: 'bg-blue-200', text: 'text-blue-700', border: 'border-blue-300' },
  { threshold: 50, bg: 'bg-cyan-300', text: 'text-white', border: 'border-cyan-400' },
  { threshold: 100, bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' },
  { threshold: 500, bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
  { threshold: 1000, bg: 'bg-red-700', text: 'text-white', border: 'border-red-800' },
];

function getDefaultData(): ProvinceData[] {
  const rng = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * 800);
  };

  return PROVINCE_MATRIX.map((p, i) => ({
    code: p.code,
    name: p.name,
    value: rng(i + 1) + (i % 7 === 0 ? 200 : 0),
    extra: {
      批次: Math.floor(rng(i + 100) / 10) + 1,
      预警: Math.floor(rng(i + 200) / 80),
    },
  }));
}

function getColorLevel(value: number) {
  for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
    if (value >= COLOR_LEVELS[i].threshold) {
      return COLOR_LEVELS[i];
    }
  }
  return COLOR_LEVELS[0];
}

export default function ChinaMapHeat({
  data,
  className,
  title = '全国分布热力图',
  onSelect,
  selectedCode,
}: ChinaMapHeatProps) {
  const mapData = useMemo(() => data ?? getDefaultData(), [data]);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const dataMap = useMemo(() => {
    const m = new Map<string, ProvinceData>();
    mapData.forEach(d => m.set(d.code, d));
    return m;
  }, [mapData]);

  const total = useMemo(() => mapData.reduce((s, d) => s + d.value, 0), [mapData]);
  const maxValue = useMemo(() => Math.max(...mapData.map(d => d.value), 1), [mapData]);

  const hoveredProvince = hoveredCode ? dataMap.get(hoveredCode) ?? null : null;
  const selectedProvince = selectedCode ? dataMap.get(selectedCode) ?? null : null;

  const rows = 10;
  const cols = 12;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>总计：</span>
          <span className="text-lg font-bold text-primary">{total.toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div className="relative">
        <div
          className="relative w-full mx-auto p-4"
          style={{ aspectRatio: `${cols}/${rows}` }}
          onMouseLeave={() => setHoveredCode(null)}
        >
          <div className="absolute inset-4 grid" style={{ gridTemplateColumns: `repeat(${cols * 2}, 1fr)`, gridTemplateRows: `repeat(${rows * 2}, 1fr)` }}>
            {PROVINCE_MATRIX.map(p => {
              const provData = dataMap.get(p.code) ?? { value: 0, name: p.name };
              const level = getColorLevel(provData.value);
              const isHovered = hoveredCode === p.code;
              const isSelected = selectedCode === p.code;
              const intensity = provData.value / maxValue;

              return (
                <button
                  key={p.code}
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-md border transition-all duration-200 cursor-pointer overflow-hidden',
                    level.bg,
                    level.border,
                    'border',
                    isHovered && 'z-20 scale-125 shadow-xl ring-2 ring-primary',
                    isSelected && 'ring-2 ring-primary ring-offset-2'
                  )}
                  style={{
                    gridColumn: `${Math.floor(p.col * 2) + 1} / span 2`,
                    gridRow: `${Math.floor(p.row * 2) + 1} / span 2`,
                    margin: '2px',
                  }}
                  onMouseEnter={e => {
                    setHoveredCode(p.code);
                    const rect = (e.currentTarget.parentElement!.parentElement as HTMLElement).getBoundingClientRect();
                    setHoverPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseMove={e => {
                    const rect = (e.currentTarget.parentElement!.parentElement as HTMLElement).getBoundingClientRect();
                    setHoverPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onClick={() => {
                    const fullData = dataMap.get(p.code);
                    if (fullData) {
                      onSelect?.(isSelected ? null : fullData);
                    }
                  }}
                >
                  <span className={cn('text-[10px] font-bold leading-tight', level.text)}>
                    {p.name.slice(0, 2)}
                  </span>
                  {provData.value > 0 && (
                    <span className={cn('text-[9px] font-mono mt-0.5 opacity-90', level.text)}>
                      {provData.value >= 1000 ? `${(provData.value / 1000).toFixed(1)}k` : provData.value}
                    </span>
                  )}

                  {isHovered && (
                    <div
                      className="absolute inset-0 bg-white/20 pointer-events-none"
                      style={{ boxShadow: `inset 0 0 20px rgba(30,111,219,${intensity * 0.3 + 0.1})` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {hoveredProvince && (
          <div
            className="absolute z-50 pointer-events-none bg-gray-900 text-white rounded-xl px-4 py-3 shadow-2xl min-w-[160px]"
            style={{
              left: Math.min(Math.max(hoverPos.x + 16, 0), 500),
              top: Math.min(Math.max(hoverPos.y + 16, 0), 600),
            }}
          >
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold">{hoveredProvince.name}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400">数量</span>
                <span className="text-sm font-mono font-bold text-blue-300">
                  {hoveredProvince.value.toLocaleString('zh-CN')}
                </span>
              </div>
              {hoveredProvince.extra && Object.entries(hoveredProvince.extra).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-400">{k}</span>
                  <span className="text-xs font-mono text-white">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {COLOR_LEVELS.slice(0, 6).map((level, i) => (
            <div key={i} className="flex items-center">
              <div
                className={cn('w-8 h-5 rounded-sm border', level.bg, level.border)}
                title={`${level.threshold}+`}
              />
              {i < 5 && <span className="mx-0.5 text-[10px] text-gray-400">→</span>}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <span className="text-gray-600 font-medium">低</span>
            <Info className="w-3 h-3" />
            <span className="text-gray-600 font-medium">高</span>
          </div>
        </div>
      </div>

      {selectedProvince && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-gray-800">{selectedProvince.name}</h4>
              </div>
              <p className="text-2xl font-bold text-primary mb-2">
                {selectedProvince.value.toLocaleString('zh-CN')}
                <span className="text-sm font-normal text-gray-500 ml-1">件</span>
              </p>
              {selectedProvince.extra && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedProvince.extra).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center px-2 py-1 rounded-full bg-white text-xs text-gray-600 border border-gray-200"
                    >
                      {k}: <span className="font-semibold text-gray-800 ml-1">{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onSelect?.(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { ChinaMapHeat };
