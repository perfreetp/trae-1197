import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { QrCode, ArrowRight, ShieldCheck, Building2, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type ToastItem, type ToastType } from '@/stores/uiStore';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

/**
 * Toast 图标映射
 */
const toastIcons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Toast 颜色映射
 */
const toastColors: Record<ToastType, string> = {
  success: 'bg-trust-50 border-trust-200 text-trust-800',
  error: 'bg-danger-50 border-danger-200 text-danger-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
};

/**
 * 单条 Toast 组件
 */
function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
  const Icon = toastIcons[toast.type];
  return (
    <div
      key={toast.id}
      className={cn(
        'relative min-w-[300px] max-w-sm animate-toast-in border rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm',
        toastColors[toast.type],
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Icon size={20} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm leading-tight">{toast.title}</div>
          {toast.description && (
            <div className="mt-0.5 text-xs opacity-80 leading-relaxed">{toast.description}</div>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors opacity-60 hover:opacity-100"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/**
 * 全局 Toast 容器
 */
function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}

/**
 * 特性亮点数据
 */
const highlights = [
  {
    Icon: ShieldCheck,
    title: '数据安全可靠',
    desc: '国密算法加密，数据不可篡改',
    color: 'from-trust-500 to-trust-600',
  },
  {
    Icon: FileCheck,
    title: '全链路追溯',
    desc: '从生产到消费全程可查',
    color: 'from-primary-500 to-primary-600',
  },
  {
    Icon: Building2,
    title: '监管合规',
    desc: '符合国家药品监管要求',
    color: 'from-purple-500 to-purple-600',
  },
];

/**
 * 公众查询布局 Header
 */
function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm'
          : 'bg-white/60 backdrop-blur-md border-b border-gray-200/30',
      )}
    >
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-6 md:px-8">
        <Link to="/query" className="flex items-center gap-3 group min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-primary-500 to-primary-400 shadow-lg shadow-primary/25 flex items-center justify-center text-white group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:-translate-y-0.5">
            <QrCode size={20} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="font-bold text-base md:text-lg text-gradient-primary truncate leading-tight">
              药品全链路追溯
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 mt-0.5 truncate">
              国家药品监督管理局认证平台
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 md:gap-6">
          <Link
            to="/query"
            className="hidden md:inline-flex text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            查询说明
          </Link>
          <a
            href="https://www.nmpa.gov.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            国家药监局
          </a>
          <div className="h-5 w-px bg-gray-200 hidden md:block" />
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200 hover:text-primary-700 transition-all duration-200"
          >
            <span className="hidden sm:inline">企业入口</span>
            <span className="sm:hidden">企业</span>
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

/**
 * 公众查询布局 Footer
 */
function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200/50 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
        {/* 特性亮点区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-100">
          {highlights.map(({ Icon, title, desc, color }, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={cn(
                  'shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md',
                  color,
                )}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-gray-900 leading-tight">{title}</h4>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 主体区 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-400 flex items-center justify-center text-white">
                <QrCode size={16} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-base text-gradient-primary">
                药品全链路追溯管理平台
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-md">
              本平台提供药品生产、流通、使用全过程追溯服务，实现"来源可查、去向可追、责任可究"，
              切实保障公众用药安全，助力健康中国建设。
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-800 mb-3">快速链接</h5>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-xs text-gray-500 hover:text-primary-600 transition-colors">
                  药品追溯查询
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-gray-500 hover:text-primary-600 transition-colors">
                  查询操作指南
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-gray-500 hover:text-primary-600 transition-colors">
                  常见问题 FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-gray-500 hover:text-primary-600 transition-colors">
                  投诉举报通道
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-800 mb-3">监管链接</h5>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://www.nmpa.gov.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
                >
                  国家药品监督管理局
                </a>
              </li>
              <li>
                <a
                  href="https://www.nhc.gov.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
                >
                  国家卫生健康委员会
                </a>
              </li>
              <li>
                <a
                  href="https://www.samr.gov.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
                >
                  国家市场监督管理总局
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-gray-500 hover:text-primary-600 transition-colors">
                  中国药品电子监管网
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 版权声明 */}
        <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-gray-400 leading-relaxed text-center md:text-left">
            © 2026 药品全链路追溯管理平台 · 国家药品监督管理局认证 · 保障公众用药安全
            <br className="md:hidden" />
            <span className="hidden md:inline"> · </span>
            京ICP备XXXXXXXX号-1 · 京公网安备 XXXXXXXXXXXXX 号
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <a href="#" className="hover:text-primary-600 transition-colors">
              隐私政策
            </a>
            <a href="#" className="hover:text-primary-600 transition-colors">
              使用条款
            </a>
            <a href="#" className="hover:text-primary-600 transition-colors">
              联系我们
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * 页面切换动画包裹
 */
function AnimatedOutlet() {
  const location = useLocation();
  const [staggerKey, setStaggerKey] = useState(0);

  useEffect(() => {
    setStaggerKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div key={staggerKey} className="w-full animate-stagger-child">
      <Outlet />
    </div>
  );
}

/**
 * 全局 Loading 遮罩
 */
function GlobalLoading() {
  const loading = useUIStore((s) => s.globalLoading);
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[3000] bg-white/70 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-primary-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin-slow" />
        </div>
        <div className="text-sm font-medium text-primary-700">加载中...</div>
      </div>
    </div>
  );
}

/**
 * 公众查询布局组件
 * 简洁居中布局，顶部简洁 Header，内容区自适应宽度，页脚版权+监管链接
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50/40 via-gray-50 to-trust-50/40">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-trust-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <PublicHeader />

      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <AnimatedOutlet />
        </div>
      </main>

      <PublicFooter />

      <ToastContainer />
      <GlobalLoading />
    </div>
  );
}
