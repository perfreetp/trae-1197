import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Modal 组件属性接口
 */
export interface ModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: ReactNode;
  /** 副标题/描述 */
  description?: ReactNode;
  /** 主体内容 */
  children?: ReactNode;
  /** 底部按钮区内容 */
  footer?: ReactNode;
  /** 是否显示底部操作区 */
  showFooter?: boolean;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认回调（返回 Promise 时自动 loading） */
  onConfirm?: () => void | Promise<unknown>;
  /** 确认按钮变体 */
  confirmVariant?: 'primary' | 'success' | 'warning' | 'danger';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否可点击背景关闭 */
  maskClosable?: boolean;
  /** 是否可按 ESC 关闭 */
  escClosable?: boolean;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 遮罩透明度（0-1） */
  maskOpacity?: number;
  /** 是否居中对齐 */
  centered?: boolean;
  /** 容器滚动/内容滚动 */
  scroll?: 'body' | 'container';
  /** 自定义容器类名 */
  className?: string;
  /** 自定义遮罩类名 */
  maskClassName?: string;
  /** 自定义内容区类名 */
  contentClassName?: string;
}

/**
 * 尺寸映射（max-width）
 */
const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

/**
 * Modal 弹窗组件
 * 基于 div + fixed 实现，不依赖 headless UI
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  showFooter = true,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  confirmVariant = 'primary',
  size = 'md',
  maskClosable = true,
  escClosable = true,
  closable = true,
  mask = true,
  maskOpacity = 0.5,
  centered = true,
  scroll = 'body',
  className,
  maskClassName,
  contentClassName,
}: ModalProps) {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    if (dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length > 0) focusable[0].focus();
    }

    return () => {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !escClosable) return;
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, escClosable, onClose]);

  if (!open) return null;

  async function handleConfirm() {
    if (!onConfirm) {
      onClose();
      return;
    }
    try {
      setConfirmLoading(true);
      const result = onConfirm();
      if (result instanceof Promise) await result;
      onClose();
    } finally {
      setConfirmLoading(false);
    }
  }

  function handleMaskClick(e: MouseEvent<HTMLDivElement>) {
    if (maskClosable && e.target === e.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[1000] flex',
        centered ? 'items-center justify-center' : 'items-start justify-center pt-12',
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {mask && (
        <div
          onClick={handleMaskClick}
          className={cn(
            'absolute inset-0 bg-gray-900 transition-opacity duration-300 animate-fadeIn',
            maskClassName,
          )}
          style={{ opacity: maskOpacity }}
        />
      )}

      <div
        ref={dialogRef}
        onClick={handleMaskClick}
        className={cn(
          'relative z-10 w-full mx-4 bg-white rounded-2xl shadow-2xl outline-none overflow-hidden',
          'animate-modal-in',
          sizeClasses[size],
        )}
      >
        <div
          className={cn(
            scroll === 'body' ? 'max-h-[calc(100vh-4rem)] flex flex-col' : '',
          )}
        >
          {(title || closable) && (
            <div className="px-6 pt-6 pb-4 flex items-start gap-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900 leading-tight"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{description}</p>
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

          <div
            className={cn(
              'px-6 py-5 overflow-auto scrollbar-thin',
              scroll === 'body' ? 'flex-1' : '',
              contentClassName,
            )}
          >
            {children}
          </div>

          {showFooter && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
              {footer ?? (
                <>
                  <Button variant="secondary" size="md" onClick={onClose}>
                    {cancelText}
                  </Button>
                  <Button
                    variant={confirmVariant}
                    size="md"
                    loading={confirmLoading}
                    onClick={handleConfirm}
                  >
                    {confirmText}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 确认弹窗属性 */
export interface ConfirmDialogProps extends Omit<ModalProps, 'open' | 'onClose' | 'children'> {
  /** 弹窗图标类型 */
  icon?: 'info' | 'success' | 'warning' | 'danger';
  /** 内容描述 */
  content?: ReactNode;
}

/** 确认弹窗包装器（受控显示） */
export function ConfirmDialog({ icon = 'warning', open, onClose, content, description, ...rest }: ConfirmDialogProps & { open: boolean; onClose: () => void }) {
  const iconConfig = {
    info: { color: 'text-primary-600 bg-primary-50', emoji: 'ℹ️' },
    success: { color: 'text-trust-600 bg-trust-50', emoji: '✅' },
    warning: { color: 'text-warning-600 bg-warning-50', emoji: '⚠️' },
    danger: { color: 'text-danger-600 bg-danger-50', emoji: '❌' },
  }[icon];

  return (
    <Modal
      open={open}
      onClose={onClose}
      confirmVariant={icon === 'danger' ? 'danger' : icon === 'success' ? 'success' : 'primary'}
      {...rest}
    >
      <div className="flex items-start gap-4">
        <div className={cn('shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl', iconConfig.color)}>
          {iconConfig.emoji}
        </div>
        <div className="flex-1 text-sm text-gray-600 leading-relaxed">{content || description}</div>
      </div>
    </Modal>
  );
}
