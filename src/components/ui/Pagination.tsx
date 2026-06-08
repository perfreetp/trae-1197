import { useMemo, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from './Button';
import Select from './Select';

/**
 * 分页组件属性接口
 */
export interface PaginationProps {
  /** 当前页码，从1开始 */
  current: number;
  /** 总条数 */
  total: number;
  /** 每页条数 */
  pageSize: number;
  /** 页码变化回调 */
  onChange: (page: number) => void;
  /** 每页条数变化回调 */
  onPageSizeChange?: (pageSize: number) => void;
  /** 可选的每页条数 */
  pageSizeOptions?: number[];
  /** 是否显示总条数信息 */
  showTotal?: boolean;
  /** 是否显示每页条数选择器 */
  showPageSize?: boolean;
  /** 是否显示快速跳转 */
  showJumper?: boolean;
  /** 是否显示首尾页按钮 */
  showFirstLast?: boolean;
  /** 最大显示的页码按钮数（不含首尾省略号） */
  maxVisiblePages?: number;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 容器类名 */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 总条数描述模板 */
  totalText?: (total: number, range: [number, number]) => string;
}

/**
 * 尺寸配置
 */
const sizeConfig = {
  sm: {
    btnSize: 'xs' as const,
    gap: 'gap-1',
    selectClass: '[&_div:nth-child(2)]:h-7 [&_div:nth-child(2)]:text-xs',
  },
  md: {
    btnSize: 'sm' as const,
    gap: 'gap-1.5',
    selectClass: '[&_div:nth-child(2)]:h-8 [&_div:nth-child(2)]:text-xs',
  },
  lg: {
    btnSize: 'md' as const,
    gap: 'gap-2',
    selectClass: '[&_div:nth-child(2)]:h-10 [&_div:nth-child(2)]:text-sm',
  },
};

/**
 * 计算显示的页码数组（包含省略号 null）
 */
function calculatePages(
  current: number,
  totalPages: number,
  maxVisible: number,
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  start = Math.max(1, end - maxVisible + 1);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('ellipsis');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return pages;
}

/**
 * 分页组件
 * 包含页码切换、上一页/下一页、首末页、每页条数选择、快速跳转、总条数显示
 */
export default function Pagination({
  current,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showTotal = true,
  showPageSize = true,
  showJumper = false,
  showFirstLast = true,
  maxVisiblePages = 7,
  size = 'md',
  className,
  style,
  totalText,
}: PaginationProps) {
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const pages = useMemo(
    () => calculatePages(current, totalPages, maxVisiblePages),
    [current, totalPages, maxVisiblePages],
  );
  const startRange = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const endRange = Math.min(current * pageSize, total);
  const config = sizeConfig[size];

  const handleJump = (input: string) => {
    const page = parseInt(input, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages && page !== current) {
      onChange(page);
    }
  };

  return (
    <div
      style={style}
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 w-full py-2',
        className,
      )}
    >
      {showTotal && (
        <div className="text-sm text-gray-500 shrink-0">
          {totalText
            ? totalText(total, [startRange, endRange])
            : `共 ${total.toLocaleString()} 条，显示 ${startRange}-${endRange}`}
        </div>
      )}

      <div className={cn('flex items-center flex-wrap', config.gap)}>
        {showFirstLast && (
          <Button
            size={config.btnSize}
            variant="secondary"
            disabled={current <= 1}
            onClick={() => onChange(1)}
            leftIcon={<ChevronsLeft size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
          />
        )}

        <Button
          size={config.btnSize}
          variant="secondary"
          disabled={current <= 1}
          onClick={() => onChange(Math.max(1, current - 1))}
          leftIcon={<ChevronLeft size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
        />

        <div className={cn('flex items-center', config.gap)}>
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                disabled={p === current}
                className={cn(
                  'rounded-xl font-medium transition-all duration-200',
                  size === 'sm'
                    ? 'min-w-[28px] h-7 px-2 text-xs'
                    : size === 'md'
                    ? 'min-w-[32px] h-8 px-2.5 text-sm'
                    : 'min-w-[40px] h-10 px-3 text-sm',
                  p === current
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary disabled:opacity-100',
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <Button
          size={config.btnSize}
          variant="secondary"
          disabled={current >= totalPages}
          onClick={() => onChange(Math.min(totalPages, current + 1))}
          rightIcon={<ChevronRight size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
        />

        {showFirstLast && (
          <Button
            size={config.btnSize}
            variant="secondary"
            disabled={current >= totalPages}
            onClick={() => onChange(totalPages)}
            rightIcon={<ChevronsRight size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
          />
        )}

        {showPageSize && onPageSizeChange && (
          <div className={cn('ml-2 min-w-[120px]', config.selectClass)}>
            <Select
              size={size === 'sm' ? 'sm' : size === 'md' ? 'sm' : 'md'}
              variant="filled"
              value={pageSize}
              onChange={(v) => {
                onPageSizeChange(Number(v));
                onChange(1);
              }}
              options={pageSizeOptions.map((n) => ({
                value: n,
                label: `${n} 条/页`,
              }))}
              wrapperClassName="!gap-0"
            />
          </div>
        )}

        {showJumper && (
          <div className="flex items-center gap-2 text-sm text-gray-600 ml-2">
            <span>跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={current}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJump((e.target as HTMLInputElement).value);
                }
              }}
              onBlur={(e) => handleJump(e.target.value)}
              className={cn(
                'w-14 text-center border border-gray-200 bg-white rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
                size === 'sm' ? 'h-7 text-xs' : size === 'md' ? 'h-8 text-sm' : 'h-10 text-base',
              )}
            />
            <span>页</span>
          </div>
        )}
      </div>
    </div>
  );
}
