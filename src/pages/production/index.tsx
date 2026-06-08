import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useBatchStore from '@/stores/batchStore';
import useUIStore from '@/stores/uiStore';
import {
  Factory,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  FileText,
  CalendarDays,
  ClipboardList,
  Eye,
  Sparkles,
} from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
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

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: '待生产', label: '待生产' },
  { value: '生产中', label: '生产中' },
  { value: '已完成', label: '已完成' },
  { value: '质检中', label: '质检中' },
  { value: '已入库', label: '已入库' },
  { value: '已出库', label: '已出库' },
];

const PRODUCT_OPTIONS = [
  { value: '', label: '全部产品' },
  { value: '阿莫西林胶囊', label: '阿莫西林胶囊' },
  { value: '布洛芬片', label: '布洛芬片' },
  { value: '感冒灵颗粒', label: '感冒灵颗粒' },
  { value: '头孢克洛片', label: '头孢克洛片' },
  { value: '布洛芬缓释胶囊', label: '布洛芬缓释胶囊' },
  { value: '复方氨酚烷胺片', label: '复方氨酚烷胺片' },
  { value: '盐酸左氧氟沙星片', label: '盐酸左氧氟沙星片' },
  { value: '连花清瘟胶囊', label: '连花清瘟胶囊' },
  { value: '甲硝唑片', label: '甲硝唑片' },
  { value: '板蓝根颗粒', label: '板蓝根颗粒' },
];

export default function ProductionList() {
  const navigate = useNavigate();
  const { loadBatches, batches, loading } = useBatchStore();
  const { setPageTitle, toastInfo } = useUIStore();

  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPageTitle('生产记录');
    loadBatches({ page: 1, pageSize: 100 });
  }, [loadBatches, setPageTitle]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (productFilter && b.productName !== productFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (
          !b.batchNo.toLowerCase().includes(kw) &&
          !b.productName.toLowerCase().includes(kw) &&
          !b.manufacturer?.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (dateRange.start && b.productionDate < dateRange.start) return false;
      if (dateRange.end && b.productionDate > dateRange.end) return false;
      return true;
    });
  }, [batches, statusFilter, productFilter, keyword, dateRange]);

  const totalFiltered = filteredBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const pageData = filteredBatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, productFilter, keyword, dateRange]);

  const calcPassRate = (plan: number, actual: number) => {
    if (plan <= 0) return 0;
    return Math.min(100, Math.round((actual / plan) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            生产记录
          </h1>
          <p className="text-sm text-gray-500 mt-1">查看和管理所有生产批次的完整记录</p>
        </div>
        <button
          onClick={() => {
            navigate('/production/new');
            toastInfo('开始创建新的生产批次');
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/20 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          新建批次
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">总记录数</p>
            <p className="text-xl font-bold text-gray-800">{batches.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Factory className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">生产中</p>
            <p className="text-xl font-bold text-gray-800">
              {batches.filter(b => b.status === '生产中' || b.status === '待生产').length}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">已完成</p>
            <p className="text-xl font-bold text-gray-800">
              {batches.filter(b => b.status === '已完成' || b.status === '已入库' || b.status === '已出库').length}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">质检中</p>
            <p className="text-xl font-bold text-gray-800">
              {batches.filter(b => b.status === '质检中').length}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索批次号、产品名称、生产厂家"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 appearance-none cursor-pointer max-w-[160px]"
            >
              {PRODUCT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))}
                className="px-2.5 py-2 rounded-xl border border-gray-200 text-sm"
              />
              <span className="text-gray-300">—</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))}
                className="px-2.5 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5 scrollbar-thin">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 border-y border-gray-100">
                <th className="text-left font-medium px-5 py-3.5 whitespace-nowrap">批次号</th>
                <th className="text-left font-medium px-3 py-3.5 whitespace-nowrap">产品</th>
                <th className="text-left font-medium px-3 py-3.5 whitespace-nowrap">规格</th>
                <th className="text-left font-medium px-3 py-3.5 whitespace-nowrap">状态</th>
                <th className="text-right font-medium px-3 py-3.5 whitespace-nowrap">计划产量</th>
                <th className="text-right font-medium px-3 py-3.5 whitespace-nowrap">实际产量</th>
                <th className="text-right font-medium px-3 py-3.5 whitespace-nowrap">合格率</th>
                <th className="text-left font-medium px-3 py-3.5 whitespace-nowrap">创建日期</th>
                <th className="text-center font-medium px-5 py-3.5 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400">生产记录加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">暂无生产记录</p>
                        <p className="text-xs text-gray-400">调整筛选条件或点击右上角"新建批次"创建新记录</p>
                      </div>
                      <button
                        onClick={() => navigate('/production/new')}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        立即创建
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map(batch => {
                  const passRate = calcPassRate(batch.planQty, batch.actualQty);
                  const isLowPass = passRate < 90;
                  return (
                    <tr
                      key={batch.id}
                      className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/production/${batch.id}`)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm font-bold text-gray-800">{batch.batchNo}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[120px]">
                          {batch.manufacturer}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                          {batch.productName}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-sm text-gray-600">{batch.spec}</p>
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-3 py-4 text-right">
                        <p className="text-sm text-gray-700 font-medium font-mono">
                          {batch.planQty.toLocaleString('zh-CN')}
                        </p>
                        <p className="text-[10px] text-gray-400">{batch.unit}</p>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-800 font-mono">
                          {batch.actualQty.toLocaleString('zh-CN')}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  isLowPass ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-green-400 to-emerald-500'
                                )}
                                style={{ width: `${passRate}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                'text-sm font-bold font-mono',
                                isLowPass ? 'text-red-500' : 'text-green-600'
                              )}
                            >
                              {passRate}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-sm text-gray-600 font-mono">{batch.productionDate}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/production/${batch.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 hover:shadow-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              显示 <span className="font-semibold text-gray-700">{(currentPage - 1) * pageSize + 1}</span> -{' '}
              <span className="font-semibold text-gray-700">{Math.min(currentPage * pageSize, totalFiltered)}</span> 条，
              共 <span className="font-semibold text-primary">{totalFiltered}</span> 条
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 7) {
                  if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;
                }
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
  );
}
