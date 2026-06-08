import {
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/**
 * Drawer 滑出方向
 */
export type DrawerPlacement = 'right' | 'left' | 'top' | 'bottom';

/**
 * Drawer 抽屉组件属性接口
 */
export interface DrawerProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 滑出方向 */
  placement?: DrawerPlacement;
  /** 宽度（水平方向时生效） */
  width?: string | number;
  /** 高度（垂直方向时生效） */
  height?: string | number;
  /** 标题 */
  title?: ReactNode;
  /** 副标题 */
  description?: ReactNode;
  /** 内容 */
  children?: ReactNode;
  /** 底部操作区 */
  footer?: ReactNode;
  /** 是否显示底部 */
  showFooter?: boolean;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 是否可点击遮罩关闭 */
  maskClosable?: boolean;
  /** 是否可按 ESC 关闭 */
  escClosable?: boolean;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 内容类名 */
  contentClassName?: string;
  /** 容器类名 */
  className?: string;
  /** 遮罩类名 */
  maskClassName?: string;
  /** 自定义样式 */
  style?: CSSProperties;
}

/**
 * Drawer 抽屉组件
 * 从指定方向滑出，常用于详情页、表单、筛选面板等
 */
export default function Drawer({
  open,
  onClose,
  placement = 'right',
  width = 480,
  height = 400,
  title,
  description,
  children,
  footer,
  showFooter = false,
  mask = true,
  maskClosable = true,
  escClosable = true,
  closable = true,
  contentClassName,
  className,
  maskClassName,
  style,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevActive.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      prevActive.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !escClosable) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, escClosable, onClose]);

  if (!open) return null;

  const isHorizontal = placement === 'left' || placement === 'right';
  const sizeStyle: CSSProperties = isHorizontal
    ? { width: typeof width === 'number' ? `${width}px` : width }
    : { height: typeof height === 'number' ? `${height}px` : height };

  const placementClasses: Record<DrawerPlacement, string> = {
    right: 'top-0 right-0 h-full animate-drawer-right-in rounded-l-3xl',
    left: 'top-0 left-0 h-full animate-drawer-left-in rounded-r-3xl',
    top: 'top-0 left-0 w-full animate-drawer-top-in rounded-b-3xl',
    bottom: 'bottom-0 left-0 w-full animate-drawer-bottom-in rounded-t-3xl',
  };

  function handleMaskClick(e: React.MouseEvent) {
    if (maskClosable && e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[1000]', className)}
      role="dialog"
      aria-modal="true"
    >
      {mask && (
        <div
          onClick={handleMaskClick}
          className={cn(
            'absolute inset-0 bg-gray-900/50 animate-fadeIn',
            maskClassName,
          )}
        />
      )}

      <div
        ref={panelRef}
        onClick={handleMaskClick}
        className={cn(
          'absolute z-10 bg-white shadow-2xl outline-none flex flex-col overflow-hidden',
          placementClasses[placement],
        )}
        style={{ ...sizeStyle, ...style }}
      >
        {(title || closable) && (
          <div className="px-6 pt-6 pb-4 flex items-start gap-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{description}</p>
              )}
            </div>
            {closable && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1.5 -mt-1 -mr-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="关闭"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            )}
          </div>
        )}

        <div className={cn('flex-1 overflow-auto scrollbar-thin p-6', contentClassName)}>
          {children}
        </div>

        {showFooter && footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
