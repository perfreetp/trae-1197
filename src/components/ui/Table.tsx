import {
  forwardRef,
  createContext,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react';
import Empty from './Empty';
import Pagination from './Pagination';
import type { PaginationParams, PaginationResult } from '@/types/common';

/**
 * 表格上下文
 */
interface TableContextValue {
  /** 是否斑马纹 */
  striped: boolean;
  /** 是否悬浮高亮 */
  hoverable: boolean;
  /** 是否紧凑 */
  compact: boolean;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 排序变化回调 */
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const TableContext = createContext<TableContextValue>({
  striped: false,
  hoverable: true,
  compact: false,
});

/**
 * 表格变体类型
 */
export type TableVariant = 'default' | 'bordered' | 'minimal';

/**
 * 表格组件属性
 */
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** 表格变体 */
  variant?: TableVariant;
  /** 是否斑马纹 */
  striped?: boolean;
  /** 是否行悬浮高亮 */
  hoverable?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否固定表头（需要配合 maxHeight） */
  stickyHeader?: boolean;
  /** 最大高度（固定表头时生效） */
  maxHeight?: CSSProperties['maxHeight'];
  /** 当前排序字段 */
  sortBy?: string;
  /** 当前排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 排序变化回调 */
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  /** 外层容器类名 */
  wrapperClassName?: string;
}

/**
 * 表格外层包裹组件
 */
const TableOuter = forwardRef<HTMLDivElement, TableProps & { children: ReactNode }>(
  (
    {
      variant = 'default',
      striped = false,
      hoverable = true,
      compact = false,
      stickyHeader = false,
      maxHeight,
      sortBy,
      sortOrder,
      onSort,
      wrapperClassName,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const contextValue = useMemo(
      () => ({ striped, hoverable, compact, sortBy, sortOrder, onSort }),
      [striped, hoverable, compact, sortBy, sortOrder, onSort],
    );

    const variantClasses = {
      default: 'border border-gray-200',
      bordered: 'border border-gray-300',
      minimal: '',
    };

    return (
      <TableContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'w-full overflow-hidden rounded-2xl bg-white',
            variantClasses[variant],
            wrapperClassName,
          )}
        >
          <div
            className={cn('w-full overflow-auto scrollbar-thin', stickyHeader && 'relative')}
            style={stickyHeader ? { maxHeight, overflowY: 'auto' } : undefined}
          >
            <table className={cn('w-full border-collapse', className)} {...props}>
              {children}
            </table>
          </div>
        </div>
      </TableContext.Provider>
    );
  },
);
TableOuter.displayName = 'TableOuter';

/**
 * Table 根组件
 */
export const Table = Object.assign(TableOuter, { displayName: 'Table' });

/**
 * 表格标题组件
 */
export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {}
export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, children, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn(
        'p-4 text-left text-sm font-medium text-gray-700 bg-gray-50 border-b border-gray-100',
        className,
      )}
      {...props}
    >
      {children}
    </caption>
  ),
);
TableCaption.displayName = 'TableCaption';

/**
 * 表格头部组件
 */
export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}
export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const { stickyHeader } = useTableContextSticky();
    return (
      <thead
        ref={ref}
        className={cn(
          'bg-gray-50',
          stickyHeader && 'sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,231,235,1)]',
          className,
        )}
        {...props}
      >
        {children}
      </thead>
    );
  },
);
TableHeader.displayName = 'TableHeader';

function useTableContextSticky() {
  return { stickyHeader: false };
}

/**
 * 表格主体组件
 */
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-gray-100', className)} {...props}>
      {children}
    </tbody>
  ),
);
TableBody.displayName = 'TableBody';

/**
 * 表格尾部组件
 */
export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {}
export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, children, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('bg-gray-50 font-medium border-t-2 border-gray-200', className)}
      {...props}
    >
      {children}
    </tfoot>
  ),
);
TableFooter.displayName = 'TableFooter';

/**
 * 表格行组件
 */
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** 是否选中状态 */
  selected?: boolean;
  /** 行点击回调 */
  onClick?: () => void;
}
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, onClick, children, ...props }, ref) => {
    const ctx = useContext(TableContext);
    const isClickable = !!onClick;
    return (
      <tr
        ref={ref}
        onClick={onClick}
        className={cn(
          'transition-colors duration-150',
          ctx.hoverable && !selected && isClickable && 'hover:bg-primary-50/40 cursor-pointer',
          ctx.hoverable && !selected && !isClickable && 'hover:bg-gray-50',
          selected && 'bg-primary-50',
          className,
        )}
        {...props}
      >
        {children}
      </tr>
    );
  },
);
TableRow.displayName = 'TableRow';

/**
 * 表格头部单元格组件
 */
export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** 排序字段名（启用排序时需要） */
  sortKey?: string;
  /** 是否右对齐 */
  align?: 'left' | 'center' | 'right';
  /** 列宽度 */
  width?: string | number;
}
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortKey, align = 'left', width, ...props }, ref) => {
    const ctx = useContext(TableContext);
    const isSorted = sortKey && ctx.sortBy === sortKey;
    const sortDir = isSorted ? ctx.sortOrder : undefined;

    function handleClick() {
      if (!sortKey || !ctx.onSort) return;
      let newOrder: 'asc' | 'desc' = 'asc';
      if (isSorted) {
        newOrder = sortDir === 'asc' ? 'desc' : 'asc';
      }
      ctx.onSort(sortKey, newOrder);
    }

    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align];

    const padding = ctx.compact ? 'px-3 py-2' : 'px-4 py-3';

    return (
      <th
        ref={ref}
        style={width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : undefined}
        onClick={sortKey ? handleClick : undefined}
        className={cn(
          'font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap',
          padding,
          alignClass,
          sortKey && 'cursor-pointer select-none hover:text-primary-600 transition-colors',
          className,
        )}
        {...props}
      >
        <span className={cn('inline-flex items-center gap-1', align === 'right' && 'justify-end w-full')}>
          {children}
          {sortKey && (
            <span className="shrink-0 text-gray-400">
              {isSorted ? (
                sortDir === 'asc' ? (
                  <ChevronUp size={14} className="text-primary-600" strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={14} className="text-primary-600" strokeWidth={2.5} />
                )
              ) : (
                <ChevronsUpDown size={14} strokeWidth={2} />
              )}
            </span>
          )}
        </span>
      </th>
    );
  },
);
TableHead.displayName = 'TableHead';

/**
 * 表格单元格组件
 */
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
}
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, align = 'left', ...props }, ref) => {
    const ctx = useContext(TableContext);

    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align];

    const padding = ctx.compact ? 'px-3 py-2' : 'px-4 py-3.5';

    return (
      <td
        ref={ref}
        className={cn(
          'text-sm text-gray-700 align-middle',
          padding,
          alignClass,
          className,
        )}
        {...props}
      >
        {children}
      </td>
    );
  },
);
TableCell.displayName = 'TableCell';

/**
 * 表格空状态组件属性
 */
export interface TableEmptyProps {
  /** 列数（用于合并单元格） */
  colSpan: number;
  /** 空状态预设类型 */
  preset?: 'default' | 'no-results' | 'no-data' | 'no-records';
  /** 自定义标题 */
  title?: string;
  /** 自定义描述 */
  description?: string;
  /** 操作配置 */
  action?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' };
  /** 高度 */
  height?: number | string;
}

/**
 * 表格空状态组件
 */
export function TableEmpty({
  colSpan,
  preset = 'no-data',
  title,
  description,
  action,
  height = 240,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <Empty
          preset={preset}
          title={title}
          description={description}
          action={action}
          size="sm"
          padding="none"
          className="w-full"
          style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
        />
      </td>
    </tr>
  );
}

/**
 * 带分页的数据表格属性
 */
export interface DataTableProps<T> {
  /** 表格列配置（children） */
  children: ReactNode;
  /** 数据行渲染函数 */
  renderRow: (row: T, index: number) => ReactNode;
  /** 分页数据 */
  data: PaginationResult<T>;
  /** 分页参数变化回调 */
  onPaginationChange: (params: PaginationParams) => void;
  /** 列数（用于空状态） */
  colSpan: number;
  /** 表格变体 */
  variant?: TableVariant;
  /** 是否斑马纹 */
  striped?: boolean;
  /** 是否紧凑 */
  compact?: boolean;
  /** 最大高度 */
  maxHeight?: CSSProperties['maxHeight'];
  /** 标题 */
  caption?: ReactNode;
  /** 表格标题栏（自定义工具区） */
  toolbar?: ReactNode;
  /** 容器类名 */
  className?: string;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 排序回调 */
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  /** 空状态预设 */
  emptyPreset?: 'default' | 'no-data' | 'no-results' | 'no-records';
}

/**
 * 带分页的数据表格组件
 */
export function DataTable<T>({
  children,
  renderRow,
  data,
  onPaginationChange,
  colSpan,
  variant = 'default',
  striped = false,
  compact = false,
  maxHeight,
  caption,
  toolbar,
  className,
  sortBy,
  sortOrder,
  onSort,
  emptyPreset = 'no-data',
}: DataTableProps<T>) {
  const [localSortBy, setLocalSortBy] = useState<string | undefined>(sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc' | undefined>(sortOrder);

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setLocalSortBy(key);
    setLocalSortOrder(order);
    onSort?.(key, order);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {(toolbar || caption) && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {caption && <div className="text-sm font-semibold text-gray-800">{caption}</div>}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <Table
        variant={variant}
        striped={striped}
        compact={compact}
        hoverable
        stickyHeader={!!maxHeight}
        maxHeight={maxHeight}
        sortBy={localSortBy}
        sortOrder={localSortOrder}
        onSort={handleSort}
      >
        {caption && <TableCaption>{caption}</TableCaption>}
        {children}
        <TableBody>
          {data.list.length === 0 ? (
            <TableEmpty colSpan={colSpan} preset={emptyPreset} />
          ) : (
            data.list.map((row, i) => renderRow(row, i))
          )}
        </TableBody>
      </Table>

      <Pagination
        current={data.page}
        total={data.total}
        pageSize={data.pageSize}
        onChange={(page) =>
          onPaginationChange({ page, pageSize: data.pageSize, sortBy: localSortBy, sortOrder: localSortOrder })
        }
        onPageSizeChange={(pageSize) =>
          onPaginationChange({ page: 1, pageSize, sortBy: localSortBy, sortOrder: localSortOrder })
        }
      />
    </div>
  );
}

export default Object.assign(Table, {
  Caption: TableCaption,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Empty: TableEmpty,
});
