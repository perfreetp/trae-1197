import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useBatchStore from '@/stores/batchStore';
import useUIStore from '@/stores/uiStore';
import StatCard from '@/components/business/StatCard';
import { Batch } from '@/services/mock/generators';
import {
  Package,
  Factory,
  Warehouse,
  AlertTriangle,
  Plus,
  Scan,
  Barcode,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Truck,
  AlertOctagon,
  Eye,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

type AlertType = 'expiry' | 'diversion' | 'recall';

interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  content: string;
  time: string;
  batchId?: string;
  batchNo?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: '待生产', label: '待生产' },
  { value: '生产中', label: '生产中' },
  { value: '已完成', label: '已完成' },
  { value: '质检中', label: '质检中' },
  { value: '已入库', label: '已入库' },
  { value: '已出库', label: '已出库' },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    待生产: 'badge-status-default',
    生产中: 'badge-status-info',
    已完成: 'badge-status-success',
    质检中: 'badge-status-warning',
    已入库: 'badge-status-info',
    已出库: 'badge-status-success',
  };
  return <span className={config[status] ?? 'badge-status-default'}>{status}</span>;
}

function generateMockAlerts(batches: Batch[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (batches.length > 0) {
    alerts.push({
      id: 'a1',
      type: 'expiry',
      title: '批次临近效期',
      content: `${batches[0]?.batchNo ?? 'B20240101'} 还有 30 天到期，请尽快处理库存`,
      time: '10 分钟前',
      batchId: batches[0]?.id,
      batchNo: batches[0]?.batchNo,
    });
  }

  if (batches.length > 1) {
    alerts.push({
      id: 'a2',
      type: 'recall',
      title: '召回工单进行中',
      content: `批次 ${batches[1]?.batchNo ?? 'B20240102'} 召回进度 68%，回收中`,
      time: '1 小时前',
      batchId: batches[1]?.id,
      batchNo: batches[1]?.batchNo,
    });
  }

  if (batches.length > 2) {
    alerts.push({
      id: 'a3',
      type: 'diversion',
      title: '疑似窜货预警',
      content: `追溯码 P${Date.now().toString().slice(-6)} 流通区域异常：发往北京却在上海扫码`,
      time: '2 小时前',
    });
  }

  alerts.push({
    id: 'a4',
    type: 'expiry',
    title: '原料效期提醒',
    content: '微晶纤维素批次 RM202401001 还有 45 天到期，剩余库存 1,200 kg',
    time: '3 小时前',
  });

  alerts.push({
    id: 'a5',
    type: 'diversion',
    title: '消费者重复扫码',
    content: `追溯码 P20240112345678 在 24 小时内被扫码 5 次，请关注`,
    time: '昨天 18:30',
  });

  alerts.push({
    id: 'a6',
    type: 'recall',
    title: '召回计划待审批',
    content: '布洛芬缓释胶囊召回工单需要您的审批，请及时处理',
    time: '昨天 15:20',
  });

  return alerts;
}

const ALERT_CONFIG: Record<
  AlertType,
  { label: string; borderClass: string; iconClass: string; bgClass: string; icon: typeof AlertTriangle }
> = {
  expiry: {
    label: '过期预警',
    borderClass: 'border-l-orange-500',
    iconClass: 'text-orange-500',
    bgClass: 'bg-orange-50',
    icon: Clock,
  },
  diversion: {
    label: '窜货预警',
    borderClass: 'border-l-blue-500',
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50',
    icon: Truck,
  },
  recall: {
    label: '召回预警',
    borderClass: 'border-l-red-500',
    iconClass: 'text-red-500',
    bgClass: 'bg-red-50',
    icon: AlertOctagon,
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { loadBatches, batches, loading, pagination, setPagination } = useBatchStore();
  const { setPageTitle, toastInfo } = useUIStore();

  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setPageTitle('批次看板');
    loadBatches({ page: 1, pageSize: 50 });
  }, [loadBatches, setPageTitle]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (
          !b.batchNo.toLowerCase().includes(kw) &&
          !b.productName.toLowerCase().includes(kw) &&
          !b.id.toString().toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (dateRange.start && b.productionDate < dateRange.start) return false;
      if (dateRange.end && b.productionDate > dateRange.end) return false;
      return true;
    });
  }, [batches, statusFilter, keyword, dateRange]);

  const totalFiltered = filteredBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const pageData = filteredBatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, keyword, dateRange]);

  const stats = useMemo(() => {
    const total = batches.length;
    const producing = batches.filter(b => b.status === '生产中' || b.status === '待生产').length;
    const stored = batches.filter(b => b.status === '已入库').reduce((s, b) => s + b.actualQty, 0);
    const alerts = Math.floor(batches.length * 0.08) + 3;
    return { total, producing, stored, alerts };
  }, [batches]);

  const alerts = useMemo(() => generateMockAlerts(batches), [batches]);

  const quickActions = [
    {
      key: 'new',
      label: '新建批次',
      desc: '创建新生产批次',
      icon: Plus,
      variant: 'from-blue-500 to-indigo-600',
      route: '/production/new',
    },
    {
      key: 'scan',
      label: '扫码入库',
      desc: '扫描追溯码入库',
      icon: Scan,
      variant: 'from-emerald-500 to-teal-600',
      route: '/warehouse/in',
    },
    {
      key: 'code',
      label: '生成追溯码',
      desc: '批量生成追溯码',
      icon: Barcode,
      variant: 'from-violet-500 to-purple-600',
      route: '/coding',
    },
    {
      key: 'recall',
      label: '发起召回',
      desc: '创建产品召回工单',
      icon: AlertTriangle,
      variant: 'from-orange-500 to-red-500',
      route: '/recall',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            批次看板
          </h1>
          <p className="text-sm text-gray-500 mt-1">实时监控批次生产、库存与预警状态</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>数据更新于 {new Date().toLocaleTimeString('zh-CN')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stagger-item">
          <StatCard
            title="总批次数"
            value={stats.total}
            description="系统全部生产批次"
            trend={5.2}
            variant="blue"
            icon={Package}
            sparklineData={[12, 18, 15, 22, 28, 25, 32, 30, 35, 38]}
          />
        </div>
        <div className="stagger-item" style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="在产批次"
            value={stats.producing}
            suffix=" 批"
            description="正在进行生产"
            trend={2.1}
            variant="green"
            icon={Factory}
            sparklineData={[5, 7, 6, 9, 8, 12, 10, 14, 11, 13]}
          />
        </div>
        <div className="stagger-item" style={{ animationDelay: '0.2s' }}>
          <StatCard
            title="在库单品"
            value={stats.stored}
            suffix=" 盒"
            description="仓库当前库存"
            trend={-1.5}
            variant="orange"
            icon={Warehouse}
            sparklineData={[80, 75, 90, 85, 100, 95, 110, 105, 102, 98]}
          />
        </div>
        <div className="stagger-item" style={{ animationDelay: '0.3s' }}>
          <StatCard
            title="预警条数"
            value={stats.alerts}
            suffix=" 条"
            description="待处理预警通知"
            trend={0.8}
            variant="purple"
            icon={AlertTriangle}
            sparklineData={[2, 3, 5, 4, 6, 8, 5, 7, 6, 8]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 space-y-4 stagger-item" style={{ animationDelay: '0.4s' }}>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                批次列表
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">共</span>
                <span className="font-bold text-primary">{totalFiltered}</span>
                <span className="text-gray-400">条</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="搜索批次号/产品名"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 appearance-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CalendarDays className="w-4 h-4" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                  />
                  <span className="text-gray-300">—</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 scrollbar-thin">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-y border-gray-100">
                    <th className="text-left font-medium px-5 py-3 whitespace-nowrap">批次号</th>
                    <th className="text-left font-medium px-3 py-3 whitespace-nowrap">产品名称</th>
                    <th className="text-left font-medium px-3 py-3 whitespace-nowrap">状态</th>
                    <th className="text-left font-medium px-3 py-3 whitespace-nowrap">数量</th>
                    <th className="text-left font-medium px-3 py-3 whitespace-nowrap">生产日期</th>
                    <th className="text-left font-medium px-3 py-3 whitespace-nowrap">效期</th>
                    <th className="text-right font-medium px-5 py-3 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-gray-400">加载中...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pageData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-10 h-10 text-gray-300" />
                          <span className="text-sm text-gray-400">暂无匹配的批次数据</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageData.map(batch => (
                      <tr
                        key={batch.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/production/${batch.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-sm font-semibold text-gray-800">{batch.batchNo}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-sm text-gray-800 truncate max-w-[180px]">{batch.productName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{batch.spec}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={batch.status} />
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-sm text-gray-800 font-medium">
                            {batch.actualQty.toLocaleString('zh-CN')}
                            <span className="text-xs text-gray-400 ml-1">{batch.unit}</span>
                          </p>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-sm text-gray-600 font-mono">{batch.productionDate}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-sm font-mono text-gray-600">{batch.expiryDate}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/production/${batch.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-primary hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            查看
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  第 <span className="font-semibold text-gray-700">{currentPage}</span> / {totalPages} 页
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                          page === currentPage
                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="card p-5 stagger-item" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                预警通知
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {alerts.length}
                </span>
              </h2>
            </div>

            <div className="relative max-h-[340px] overflow-y-auto scrollbar-thin pr-1 space-y-2">
              {alerts.map((alert, idx) => {
                const config = ALERT_CONFIG[alert.type];
                const Icon = config.icon;
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'group relative p-3.5 rounded-xl border border-gray-100 border-l-4 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5 bg-white',
                      config.borderClass,
                      'hover:bg-gray-50/50'
                    )}
                    onClick={() => {
                      if (alert.batchId) {
                        navigate(`/production/${alert.batchId}`);
                      } else {
                        navigate('/recall');
                      }
                      toastInfo(`查看预警详情：${alert.title}`);
                    }}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center', config.bgClass)}>
                        <Icon className={cn('w-4.5 h-4.5', config.iconClass)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', config.bgClass, config.iconClass)}>
                              {config.label}
                            </span>
                            <h4 className="text-sm font-semibold text-gray-800 truncate">{alert.title}</h4>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{alert.content}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5 stagger-item" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              快捷操作
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    onClick={() => {
                      navigate(action.route);
                      toastInfo(`即将跳转：${action.label}`);
                    }}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                      `bg-gradient-to-br ${action.variant}`
                    )}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                      </div>
                      <p className="text-sm font-bold text-white mb-0.5">{action.label}</p>
                      <p className="text-xs text-white/80">{action.desc}</p>
                    </div>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-white/70" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
