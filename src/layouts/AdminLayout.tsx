import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
  Link,
} from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  QrCode,
  Package,
  AlertTriangle,
  Search,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Home,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type ToastItem, type ToastType } from '@/stores/uiStore';
import Avatar from '@/components/ui/Avatar';

/**
 * 菜单项接口
 */
interface MenuItem {
  /** 路由路径 */
  path: string;
  /** 显示名称 */
  label: string;
  /** 图标组件 */
  Icon: typeof LayoutDashboard;
  /** 是否为外链（跳转样式） */
  external?: boolean;
}

/**
 * 菜单配置
 */
const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '批次看板', Icon: LayoutDashboard },
  { path: '/production', label: '生产记录', Icon: ClipboardList },
  { path: '/coding', label: '赋码贴标', Icon: QrCode },
  { path: '/warehouse', label: '仓储流转', Icon: Package },
  { path: '/recall', label: '异常召回', Icon: AlertTriangle },
  { path: '/query', label: '公众查询', Icon: Search, external: true },
  { path: '/reports', label: '报表中心', Icon: BarChart3 },
];

/**
 * 路由 -> 面包屑映射
 */
const breadcrumbMap: Record<string, { label: string; icon?: typeof Home }[]> = {
  '/dashboard': [{ label: '批次看板', icon: Home }],
  '/production': [{ label: '生产管理', icon: Home }, { label: '生产记录' }],
  '/production/new': [{ label: '生产管理' }, { label: '生产记录' }, { label: '新建批次' }],
  '/coding': [{ label: '赋码管理', icon: Home }, { label: '赋码贴标' }],
  '/warehouse': [{ label: '仓储管理', icon: Home }, { label: '仓储流转' }],
  '/warehouse/in': [{ label: '仓储管理' }, { label: '仓储流转' }, { label: '入库登记' }],
  '/warehouse/out': [{ label: '仓储管理' }, { label: '仓储流转' }, { label: '出库登记' }],
  '/recall': [{ label: '召回管理', icon: Home }, { label: '异常召回' }],
  '/reports': [{ label: '数据分析', icon: Home }, { label: '报表中心' }],
};

/**
 * 通知项接口
 */
interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

/**
 * 模拟通知数据
 */
const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'warning',
    title: '批次 B202606008 即将到达有效期',
    description: '距离过期还有 15 天，请及时处理库存',
    time: '2 分钟前',
    read: false,
  },
  {
    id: 'n2',
    type: 'success',
    title: '批次 B202606007 质检已完成',
    description: '质检结论：合格，已自动入库',
    time: '1 小时前',
    read: false,
  },
  {
    id: 'n3',
    type: 'danger',
    title: '召回单 R2026003 进度异常',
    description: '二级经销商反馈超时，请跟进处理',
    time: '3 小时前',
    read: false,
  },
  {
    id: 'n4',
    type: 'info',
    title: '系统已完成每日自动备份',
    description: '备份文件：backup_20260609.zip',
    time: '今天 02:00',
    read: true,
  },
];

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
      <div className="absolute left-0 bottom-0 right-0 h-1 bg-black/10 overflow-hidden">
        <div
          className="h-full bg-current opacity-30"
          style={{
            animation: `shrinkWidth ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
      <style>{`@keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }`}</style>
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
 * 全局 Loading 遮罩
 */
function GlobalLoading() {
  const loading = useUIStore((s) => s.globalLoading);
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[3000] bg-white/70 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin-slow" />
          <Loader2
            size={24}
            className="absolute inset-0 m-auto text-primary-500 animate-spin"
            strokeWidth={2.5}
          />
        </div>
        <div className="text-sm font-medium text-primary-700">加载中，请稍候...</div>
      </div>
    </div>
  );
}

/**
 * 侧边栏组件
 */
function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-out',
        collapsed ? 'w-16' : 'w-[256px]',
      )}
    >
      {/* 顶部 Logo 区 */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-gray-100 shrink-0',
          collapsed ? 'justify-center px-2' : 'px-5 justify-between',
        )}
      >
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary-500 to-primary-400 shadow-lg shadow-primary/25 flex items-center justify-center text-white">
            <QrCode size={18} strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base text-gradient-primary truncate leading-tight">
                药品追溯平台
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 truncate">
                Drug Traceability
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className={cn(
            'shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors',
            collapsed && 'hidden',
          )}
          aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
        >
          {collapsed ? <PanelLeftOpen size={16} strokeWidth={2.2} /> : <PanelLeftClose size={16} strokeWidth={2.2} />}
        </button>
      </div>

      {/* 折叠状态下也显示切换按钮 */}
      {collapsed && (
        <div className="px-2 py-2 border-b border-gray-100 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="展开侧栏"
          >
            <PanelLeftOpen size={16} strokeWidth={2.2} />
          </button>
        </div>
      )}

      {/* 菜单项 */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2.5 space-y-1">
        {menuItems.map((item, idx) => {
          const { path, label, Icon, external } = item;
          const isActive = external
            ? location.pathname === path
            : location.pathname === path || location.pathname.startsWith(path + '/');

          const handleClick = (e: React.MouseEvent) => {
            if (external) {
              e.preventDefault();
              navigate(path);
            }
          };

          return (
            <NavLink
              key={path}
              to={path}
              end={!external && !path.includes('/:')}
              onClick={handleClick}
              className={({ isActive: navActive }) => {
                const active = external ? isActive : navActive || location.pathname.startsWith(path + '/');
                return cn(
                  'group relative flex items-center gap-3 rounded-xl transition-all duration-200',
                  collapsed ? 'h-11 justify-center px-0' : 'h-11 px-3.5',
                  active
                    ? 'bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-primary-700 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                );
              }}
              style={{ animationDelay: `${idx * 30}ms` }}
              title={collapsed ? label : undefined}
            >
              {({ isActive: navActive }) => {
                const active = external ? isActive : navActive || location.pathname.startsWith(path + '/');
                return (
                  <>
                    {active && (
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-primary-400 to-primary-600',
                          collapsed ? 'h-5' : 'h-6',
                        )}
                      />
                    )}
                    <Icon
                      size={collapsed ? 20 : 18}
                      strokeWidth={active ? 2.4 : 2}
                      className={cn(
                        'shrink-0 transition-transform duration-200',
                        active && 'scale-110',
                      )}
                    />
                    {!collapsed && (
                      <span className="flex-1 truncate text-sm">{label}</span>
                    )}
                    {!collapsed && external && (
                      <ExternalLink size={12} className="shrink-0 text-gray-400" strokeWidth={2} />
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* 底部信息区 */}
      <div
        className={cn(
          'shrink-0 border-t border-gray-100 p-3',
          collapsed ? 'flex justify-center' : '',
        )}
      >
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-trust-500/10 to-primary-500/10 border border-gray-200 flex items-center justify-center text-gray-400">
            <SlidersHorizontal size={16} />
          </div>
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-trust-50 border border-primary-100/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary-500">
                <BarChart3 size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">系统状态</div>
                <div className="text-[10px] text-trust-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-trust-500 animate-pulse" />
                  运行正常
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/50">
              <div>
                <div className="text-[10px] text-gray-500">今日生产</div>
                <div className="text-xs font-semibold text-gray-800">128 批次</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">追溯码</div>
                <div className="text-xs font-semibold text-gray-800">2.4 万</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * 面包屑组件
 */
function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  const crumbs = breadcrumbMap[location.pathname] || [
    { label: '首页', icon: Home },
    { label: useUIStore.getState().pageTitle || '' },
  ];

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="breadcrumb">
      {crumbs.map((c, i) => {
        const Icon = c.icon;
        const isLast = i === crumbs.length - 1;
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300 text-xs">/</span>}
            {isLast ? (
              <span className={cn('flex items-center gap-1.5', Icon && 'font-medium text-gray-800')}>
                {Icon && <Icon size={14} strokeWidth={2} className="text-primary-500" />}
                {c.label}
              </span>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition-colors"
              >
                {Icon && <Icon size={14} strokeWidth={2} />}
                {c.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * 通知铃铛下拉
 */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications] = useState<NotificationItem[]>(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const bellColor = unreadCount > 0 ? 'text-warning-500' : 'text-gray-500';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
          open
            ? 'bg-primary-50 text-primary-600'
            : `${bellColor} hover:bg-gray-100`,
        )}
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 animate-fadeInUp">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div>
              <h3 className="font-semibold text-gray-900">消息通知</h3>
              <p className="text-xs text-gray-500 mt-0.5">共 {notifications.length} 条，{unreadCount} 条未读</p>
            </div>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
              全部已读
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto scrollbar-thin divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'p-4 cursor-pointer transition-colors hover:bg-gray-50',
                  !n.read && 'bg-primary-50/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
                      n.type === 'success' && 'bg-trust-100 text-trust-600',
                      n.type === 'warning' && 'bg-warning-100 text-warning-600',
                      n.type === 'danger' && 'bg-danger-100 text-danger-600',
                      n.type === 'info' && 'bg-primary-100 text-primary-600',
                    )}
                  >
                    {n.type === 'success' && <CheckCircle2 size={16} />}
                    {n.type === 'warning' && <AlertTriangle size={16} />}
                    {n.type === 'danger' && <AlertCircle size={16} />}
                    {n.type === 'info' && <Info size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                      {!n.read && <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500" />}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {n.description}
                    </p>
                    <p className="mt-2 text-[10px] text-gray-400">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button className="w-full h-9 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors">
              查看全部通知
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 用户头像下拉
 */
function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2.5 h-10 pl-1.5 pr-3 rounded-xl transition-all duration-200',
          open ? 'bg-primary-50' : 'hover:bg-gray-100',
        )}
      >
        <Avatar size="sm" fallback="管" fallbackColor="primary" bordered />
        <div className="text-left hidden sm:block min-w-0">
          <div className="text-sm font-medium text-gray-800 leading-tight">管理员</div>
          <div className="text-[10px] text-gray-400 leading-tight">超级管理员</div>
        </div>
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-gray-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 animate-fadeInUp">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-white">
            <div className="flex items-center gap-3">
              <Avatar size="md" fallback="管" fallbackColor="primary" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">系统管理员</div>
                <div className="text-xs text-gray-500 mt-0.5">admin@example.com</div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <DropdownItem Icon={User} label="个人中心" />
            <DropdownItem Icon={Settings} label="系统设置" />
            <div className="my-1.5 h-px bg-gray-100 mx-3" />
            <DropdownItem Icon={LogOut} label="退出登录" danger />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 下拉菜单项
 */
function DropdownItem({
  Icon,
  label,
  danger = false,
}: {
  Icon: typeof User;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={cn(
        'w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors',
        danger ? 'text-danger-600 hover:bg-danger-50' : 'text-gray-700 hover:bg-gray-50',
      )}
    >
      <Icon size={16} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

/**
 * 头部 Header 组件
 */
function Header() {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center gap-6 px-6 shrink-0 sticky top-0 z-30">
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <Breadcrumb />
      </div>

      {/* 搜索框 */}
      <div className="hidden md:flex items-center w-72 h-10 rounded-xl bg-gray-50 border border-gray-100 px-3.5 gap-2 transition-all duration-200 focus-within:bg-white focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100">
        <Search size={16} className="shrink-0 text-gray-400" strokeWidth={2} />
        <input
          type="text"
          placeholder="搜索批次号、追溯码..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
        />
        <div className="shrink-0 h-5 px-1.5 rounded-md bg-white border border-gray-200 text-[10px] text-gray-500 flex items-center">
          ⌘K
        </div>
      </div>

      <NotificationBell />

      <div className="w-px h-8 bg-gray-200 shrink-0" />

      <UserDropdown />
    </header>
  );
}

/**
 * 页面切换动画包裹层
 */
function AnimatedOutlet() {
  const location = useLocation();
  const [staggerKey, setStaggerKey] = useState(0);

  useEffect(() => {
    setStaggerKey((k) => k + 1);
  }, [location.pathname]);

  return (
    <div key={staggerKey} className="w-full animate-stagger-child">
      <Outlet />
    </div>
  );
}

/**
 * 管理后台布局组件
 */
export default function AdminLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <Sidebar />

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-out',
          collapsed ? 'ml-16' : 'ml-[256px]',
        )}
      >
        <Header />

        <main className="flex-1 p-6 overflow-x-hidden scrollbar-thin">
          <AnimatedOutlet />
        </main>
      </div>

      <ToastContainer />
      <GlobalLoading />
    </div>
  );
}
