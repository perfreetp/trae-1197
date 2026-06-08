import { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  BarChart3, Package, Truck, AlertOctagon, FileCheck, ScrollText,
  CalendarRange, Download, ChevronDown, Printer, FileDown, Share2,
  X, Eye, Filter, ChevronLeft, ChevronRight,
  FactoryIcon, Box, Layers, CheckCircle2, Timer, MapPin, Users, Building2,
  LayoutGrid, CalendarClock, Percent, TrendingUp, Activity,
  User, Shield, SlidersHorizontal, Clock, AlertCircle
} from 'lucide-react';
import {
  reportService,
  ProductionStats,
  InventoryStats,
  CirculationStats,
  RecallStats,
  DateRange,
  ComplianceReport as ComplianceReportType,
} from '@/services/reportService';
import { OperationLog } from '@/services/mock/generators';
import { db } from '@/services/mock/database';
import useExport from '@/hooks/useExport';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

type ReportTab = 'production' | 'inventory' | 'circulation' | 'recall' | 'compliance' | 'logs';
type ProductionRange = 'current_month' | 'last_3_months' | 'last_6_months' | 'custom';
type LogModule = 'all' | '批次管理' | '生产' | '赋码' | '仓储' | '召回' | '报表';
type ReportType = 'gmp' | 'gsp' | 'full';

const TABS: { id: ReportTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'production', label: '生产报表', icon: BarChart3 },
  { id: 'inventory', label: '库存报表', icon: Package },
  { id: 'circulation', label: '流通报表', icon: Truck },
  { id: 'recall', label: '召回报表', icon: AlertOctagon },
  { id: 'compliance', label: '合规报告', icon: FileCheck },
  { id: 'logs', label: '操作日志', icon: ScrollText },
];

const CHINA_PROVINCES = [
  '北京', '上海', '广东', '江苏', '浙江', '山东', '四川', '河南', '湖北', '湖南',
  '福建', '安徽', '河北', '辽宁', '陕西', '江西', '重庆', '广西', '云南', '山西',
];

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(2) + '万';
  if (n >= 1000) return n.toLocaleString();
  return String(n);
}

function MetricCard({
  icon: Icon, label, value, suffix, trend, color,
}: {
  icon: typeof FactoryIcon;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: string;
  color: string;
}) {
  return (
    <div className="card p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1.5">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {suffix && <span className="text-sm font-medium text-gray-500 ml-1">{suffix}</span>}
          </p>
          {trend && (
            <p className="text-xs text-trust-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('production');
  const { exportExcel, exportJson } = useExport();

  return (
    <div className="p-2 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报表中心</h1>
          <p className="text-sm text-gray-500 mt-0.5">全链路业务数据分析与合规报告导出</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap shrink-0',
                  active
                    ? 'text-primary-600 border-primary-600 bg-primary-50/30'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {activeTab === 'production' && <ProductionReport exportExcel={exportExcel} />}
          {activeTab === 'inventory' && <InventoryReport exportExcel={exportExcel} />}
          {activeTab === 'circulation' && <CirculationReport />}
          {activeTab === 'recall' && <RecallReport exportExcel={exportExcel} />}
          {activeTab === 'compliance' && <ComplianceReportSection exportJson={exportJson} />}
          {activeTab === 'logs' && <OperationLogsTab exportExcel={exportExcel} />}
        </div>
      </div>
    </div>
  );
}

// ==================== Tab1: 生产报表 ====================
function ProductionReport({ exportExcel }: { exportExcel: ReturnType<typeof useExport>['exportExcel'] }) {
  const [range, setRange] = useState<ProductionRange>('last_6_months');
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);

  const dateRange = useMemo<DateRange>(() => {
    const now = dayjs();
    switch (range) {
      case 'current_month': return { startDate: now.startOf('month').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
      case 'last_3_months': return { startDate: now.subtract(3, 'month').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
      case 'last_6_months': return { startDate: now.subtract(6, 'month').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
      default: return {};
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    reportService.fetchProductionStats(dateRange)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [dateRange]);

  const trendOption = useMemo(() => {
    if (!stats) return {};
    const dates = stats.trend.map(t => t.date);
    const qty = stats.trend.map(t => t.qty);
    const rates = qty.map(() => 93 + Math.random() * 6);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['产量', '合格率'], right: 10, top: 0 },
      grid: { left: 50, right: 55, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      yAxis: [
        { type: 'value', name: '产量', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
        { type: 'value', name: '合格率(%)', min: 85, max: 100, splitLine: { show: false }, axisLabel: { color: '#64748B', fontSize: 11, formatter: '{value}%' } },
      ],
      series: [
        { name: '产量', type: 'bar', data: qty, barWidth: 20, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#60A5FA' }, { offset: 1, color: '#1E6FDB' }]), borderRadius: [4, 4, 0, 0] } },
        { name: '合格率', type: 'line', yAxisIndex: 1, data: rates, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#10B981', width: 2.5 }, itemStyle: { color: '#10B981' }, areaStyle: { color: 'rgba(16, 185, 129, 0.08)' } },
      ],
    };
  }, [stats]);

  const processPieOption = useMemo(() => {
    if (!stats) return {};
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11, color: '#64748B' } },
      color: ['#1E6FDB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
      series: [{
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: stats.byProduct.slice(0, 5).map(p => ({ name: p.productName.length > 6 ? p.productName.slice(0, 6) + '…' : p.productName, value: p.qty })),
      }],
    };
  }, [stats]);

  if (loading || !stats) {
    return <div className="py-20 text-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarRange className="w-4 h-4 text-gray-500" />
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { id: 'current_month', label: '本月' },
              { id: 'last_3_months', label: '近3月' },
              { id: 'last_6_months', label: '近半年' },
              { id: 'custom', label: '自定义' },
            ] as { id: ProductionRange; label: string }[]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setRange(opt.id)}
                className={cn(
                  'px-4 py-1.5 text-sm transition-all',
                  range === opt.id
                    ? 'bg-primary-600 text-white font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => exportExcel({
            data: stats.byProduct,
            filename: '生产报表_' + dayjs().format('YYYYMMDD'),
            headers: { productName: '产品名称', count: '批次数', qty: '产量' },
            columns: ['productName', 'count', 'qty'],
          })}
          className="inline-flex items-center gap-2 btn-primary text-sm"
        >
          <Download className="w-4 h-4" />
          导出 Excel
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Layers} label="总批次数" value={stats.totalBatches} trend="同比 +12.5%" color="bg-primary-500" />
        <MetricCard icon={Box} label="总产量" value={formatNumber(stats.totalActualQty)} suffix="盒" trend="同比 +8.3%" color="bg-blue-500" />
        <MetricCard icon={CheckCircle2} label="平均合格率" value={stats.qualifiedRate.toFixed(1)} suffix="%" color="bg-trust-500" />
        <MetricCard icon={Timer} label="总工时" value="1,286" suffix="h" trend="同比 -3.2%" color="bg-purple-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">产量 & 合格率趋势</h3>
          <ReactECharts option={trendOption} style={{ height: 320 }} />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">工艺路线分布</h3>
            <ReactECharts option={processPieOption} style={{ height: 200 }} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Top 产品产量排行</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-700">排名</th>
                <th className="px-5 py-3 font-semibold text-gray-700">产品名称</th>
                <th className="px-5 py-3 font-semibold text-gray-700 text-right">批次数</th>
                <th className="px-5 py-3 font-semibold text-gray-700 text-right">产量(盒)</th>
                <th className="px-5 py-3 font-semibold text-gray-700 text-right">占比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.byProduct.map((p, i) => {
                const pct = stats.totalActualQty > 0 ? ((p.qty / stats.totalActualQty) * 100).toFixed(1) : '0';
                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                        i === 0 ? 'bg-warning-100 text-warning-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      )}>{i + 1}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{p.productName}</td>
                    <td className="px-5 py-3.5 text-gray-700 text-right">{p.count}</td>
                    <td className="px-5 py-3.5 text-gray-800 font-semibold text-right">{p.qty.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${Math.min(100, parseFloat(pct))}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 w-12 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== Tab2: 库存报表 ====================
function InventoryReport({ exportExcel }: { exportExcel: ReturnType<typeof useExport>['exportExcel'] }) {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportService.fetchInventoryStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const warehousePieOption = useMemo(() => {
    if (!stats) return {};
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}件 ({d}%)' },
      legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { fontSize: 11, color: '#64748B' } },
      color: ['#1E6FDB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
      series: [{
        type: 'pie', radius: ['45%', '72%'], center: ['35%', '50%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
        data: stats.warehouseDistribution.map(w => ({ name: w.warehouse, value: w.qty })),
      }],
    };
  }, [stats]);

  const expiryBarOption = useMemo(() => {
    if (!stats) return {};
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['数量', '批次'], right: 10, top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 45, right: 20, top: 35, bottom: 25 },
      xAxis: {
        type: 'category',
        data: stats.expiryDistribution.map(e => e.range),
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11, interval: 0 },
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      series: [
        { name: '数量', type: 'bar', stack: 'total', data: stats.expiryDistribution.map(e => e.qty), itemStyle: { color: '#F59E0B', borderRadius: [0, 0, 0, 0] }, barWidth: 28 },
        { name: '批次', type: 'bar', stack: 'total', data: stats.expiryDistribution.map(e => e.count * 1000), itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] }, barWidth: 28 },
      ],
    };
  }, [stats]);

  const turnoverOption = useMemo(() => {
    const months = [];
    const data1 = [];
    const data2 = [];
    for (let i = 5; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').format('MM月'));
      data1.push(2.5 + Math.random() * 1.5);
      data2.push(30 + Math.random() * 15);
    }
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['周转率', '周转天数'], right: 10, top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 45, right: 50, top: 35, bottom: 25 },
      xAxis: { type: 'category', data: months, boundaryGap: false, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      yAxis: [
        { type: 'value', name: '周转率', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
        { type: 'value', name: '天数', splitLine: { show: false }, axisLabel: { color: '#64748B', fontSize: 11 } },
      ],
      series: [
        { name: '周转率', type: 'line', data: data1, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#1E6FDB', width: 2.5 }, itemStyle: { color: '#1E6FDB' }, areaStyle: { color: 'rgba(30, 111, 219, 0.08)' } },
        { name: '周转天数', type: 'line', yAxisIndex: 1, data: data2, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#8B5CF6', width: 2.5 }, itemStyle: { color: '#8B5CF6' } },
      ],
    };
  }, []);

  if (loading || !stats) return <div className="py-20 text-center text-gray-400">加载中...</div>;

  const turnoverDays = Math.round(stats.totalStockQty / (stats.totalStockQty / 45));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={LayoutGrid} label="SKU 种类" value={stats.totalSKU} color="bg-primary-500" />
        <MetricCard icon={Box} label="库存总量" value={formatNumber(stats.totalStockQty)} suffix="盒" trend="较上月 +5.1%" color="bg-trust-500" />
        <MetricCard icon={TrendingUp} label="库存价值" value={(stats.totalStockValue / 10000).toFixed(2)} suffix="万元" color="bg-blue-500" />
        <MetricCard icon={CalendarClock} label="周转天数" value={turnoverDays} suffix="天" trend="同比 -8.2%" color="bg-purple-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">仓库分布</h3>
          <ReactECharts option={warehousePieOption} style={{ height: 280 }} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">到期区间分布</h3>
          <ReactECharts option={expiryBarOption} style={{ height: 280 }} />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">库存周转率趋势</h3>
        </div>
        <ReactECharts option={turnoverOption} style={{ height: 260 }} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">库存明细</h3>
          <button
            onClick={() => exportExcel({
              data: stats.topProducts,
              filename: '库存明细_' + dayjs().format('YYYYMMDD'),
              headers: { productName: '产品名称', qty: '库存数量', daysToExpiry: '距效期(天)' },
              columns: ['productName', 'qty', 'daysToExpiry'],
            })}
            className="inline-flex items-center gap-2 btn-secondary text-sm"
          >
            <Download className="w-4 h-4" /> 导出
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-700">产品名称</th>
                <th className="px-5 py-3 font-semibold text-gray-700 text-right">库存数量</th>
                <th className="px-5 py-3 font-semibold text-gray-700 text-right">距效期</th>
                <th className="px-5 py-3 font-semibold text-gray-700">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.topProducts.map((p, i) => {
                const isNear = p.daysToExpiry < 90;
                const isExp = p.daysToExpiry <= 0;
                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 text-gray-800 font-medium">{p.productName}</td>
                    <td className="px-5 py-3.5 text-gray-800 text-right font-semibold">{p.qty.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn(isExp ? 'text-danger-600 font-semibold' : isNear ? 'text-warning-600 font-medium' : 'text-gray-600')}>
                        {p.daysToExpiry <= 0 ? '已过期' : `${p.daysToExpiry}天`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isExp ? (
                        <span className="badge-status-danger">已过期</span>
                      ) : isNear ? (
                        <span className="badge-status-warning">临期</span>
                      ) : (
                        <span className="badge-status-success">正常</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== Tab3: 流通报表 ====================
function CirculationReport() {
  const [stats, setStats] = useState<CirculationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportService.fetchCirculationStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const heatmapData = useMemo(() => {
    return CHINA_PROVINCES.map(p => [p, Math.floor(50 + Math.random() * 950)]);
  }, []);

  const heatmapOption = useMemo(() => {
    const maxVal = Math.max(...heatmapData.map(d => d[1] as number));
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 80, right: 30, top: 20, bottom: 30 },
      xAxis: { type: 'value', max: maxVal * 1.1, splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      yAxis: {
        type: 'category',
        data: heatmapData.map(d => d[0]).reverse(),
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
      visualMap: { show: false, min: 0, max: maxVal, inRange: { color: ['#DBEAFE', '#93C5FD', '#3B82F6', '#1E6FDB', '#1E40AF'] } },
      series: [{
        type: 'bar',
        data: heatmapData.map(d => d[1]).reverse(),
        barWidth: 18,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: (params) => {
            const ratio = (params as { value: number }).value / maxVal;
            if (ratio > 0.8) return '#1E40AF';
            if (ratio > 0.6) return '#1E6FDB';
            if (ratio > 0.4) return '#3B82F6';
            if (ratio > 0.2) return '#93C5FD';
            return '#DBEAFE';
          },
        },
      }],
    };
  }, [heatmapData]);

  const compareOption = useMemo(() => {
    if (!stats) return {};
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['入库', '出库'], right: 10, top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 45, right: 20, top: 35, bottom: 25 },
      xAxis: { type: 'category', data: stats.monthlyTrend.map(m => m.month.slice(5)), axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      series: [
        { name: '入库', type: 'bar', data: stats.monthlyTrend.map(m => m.inbound), barWidth: 20, itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } },
        { name: '出库', type: 'bar', data: stats.monthlyTrend.map(m => m.outbound), barWidth: 20, itemStyle: { color: '#1E6FDB', borderRadius: [4, 4, 0, 0] } },
      ],
    };
  }, [stats]);

  const dealerRankOption = useMemo(() => {
    const names = ['北京华康', '上海仁信', '广州天和', '深圳万通', '成都泰和', '杭州康源', '南京盛达', '武汉恒信', '西安荣泰', '重庆益民'];
    const values = names.map(() => Math.floor(200 + Math.random() * 1800)).sort((a, b) => a - b);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c} 件' },
      grid: { left: 90, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      yAxis: { type: 'category', data: names, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      series: [{
        type: 'bar',
        data: values,
        barWidth: 14,
        itemStyle: {
          borderRadius: [0, 7, 7, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#60A5FA' },
            { offset: 1, color: '#1E6FDB' },
          ]),
        },
        label: { show: true, position: 'right', color: '#475569', fontSize: 11, formatter: '{c}' },
      }],
    };
  }, []);

  if (loading || !stats) return <div className="py-20 text-center text-gray-400">加载中...</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Truck} label="出库总量" value={formatNumber(stats.totalOutbound)} suffix="盒" trend="同比 +15.3%" color="bg-primary-500" />
        <MetricCard icon={Box} label="入库总量" value={formatNumber(stats.totalInbound)} suffix="盒" trend="同比 +11.8%" color="bg-trust-500" />
        <MetricCard icon={Building2} label="经销商覆盖" value={stats.totalDealers} suffix="家" color="bg-blue-500" />
        <MetricCard icon={Users} label="门店覆盖" value={stats.totalStores} suffix="家" trend="新增 5 家" color="bg-purple-500" />
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-gray-800">全国销售热力分布（省份色阶）</h3>
        </div>
        <ReactECharts option={heatmapOption} style={{ height: 500 }} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">近6月出入库对比</h3>
          <ReactECharts option={compareOption} style={{ height: 280 }} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">经销商销量 Top10</h3>
          <ReactECharts option={dealerRankOption} style={{ height: 280 }} />
        </div>
      </div>
    </div>
  );
}

// ==================== Tab4: 召回报表 ====================
function RecallReport({ exportExcel }: { exportExcel: ReturnType<typeof useExport>['exportExcel'] }) {
  const [stats, setStats] = useState<RecallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const orders = db.getRawRecallOrders();

  useEffect(() => {
    setLoading(true);
    reportService.fetchRecallStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const reasonPieOption = useMemo(() => {
    if (!stats) return {};
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
      legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { fontSize: 11, color: '#64748B' } },
      color: ['#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#1E6FDB'],
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
        data: stats.byReason.map(r => ({ name: r.reason.length > 8 ? r.reason.slice(0, 8) + '…' : r.reason, value: r.count })),
      }],
    };
  }, [stats]);

  const levelBarOption = useMemo(() => {
    if (!stats) return {};
    const levels = stats.byLevel.map(l => l.level);
    const pending = levels.map(() => Math.floor(Math.random() * 30 + 5));
    const processing = levels.map(() => Math.floor(Math.random() * 40 + 10));
    const completed = levels.map((_, i) => Math.max(0, stats.byLevel[i].count - pending[i] - processing[i]));
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['待启动', '召回中', '已完成'], right: 10, top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 50, right: 20, top: 35, bottom: 25 },
      xAxis: { type: 'category', data: levels, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      series: [
        { name: '待启动', type: 'bar', stack: 'total', data: pending, barWidth: 32, itemStyle: { color: '#F59E0B' } },
        { name: '召回中', type: 'bar', stack: 'total', data: processing, barWidth: 32, itemStyle: { color: '#1E6FDB' } },
        { name: '已完成', type: 'bar', stack: 'total', data: completed, barWidth: 32, itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } },
      ],
    };
  }, [stats]);

  const boxplotOption = useMemo(() => {
    const stages = ['启动审批', '渠道通知', '产品回收', '原因调查', '处置结案'];
    return {
      tooltip: { trigger: 'item', axisPointer: { type: 'shadow' } },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: stages, axisLine: { lineStyle: { color: '#E2E8F0' } }, axisLabel: { color: '#64748B', fontSize: 11, interval: 0 } },
      yAxis: { type: 'value', name: '耗时(小时)', splitLine: { lineStyle: { color: '#F1F5F9' } }, axisLabel: { color: '#64748B', fontSize: 11 } },
      series: [{
        type: 'boxplot',
        data: stages.map(() => {
          const base = 1 + Math.random() * 3;
          return [base, base + 2, base + 5, base + 10, base + 18];
        }),
        itemStyle: { color: 'rgba(30, 111, 219, 0.7)', borderColor: '#1E6FDB', borderWidth: 1.5 },
      }],
    };
  }, []);

  if (loading || !stats) return <div className="py-20 text-center text-gray-400">加载中...</div>;

  const completionRate = stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : '0';
  const avgResponse = 4.5;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={AlertOctagon} label="总工单数" value={stats.totalOrders} color="bg-primary-500" />
        <MetricCard icon={Activity} label="进行中" value={stats.processingOrders} trend="较昨日 +1" color="bg-warning-500" />
        <MetricCard icon={Percent} label="完成率" value={completionRate} suffix="%" trend="同比 +6.5%" color="bg-trust-500" />
        <MetricCard icon={Timer} label="平均响应时长" value={avgResponse} suffix="h" color="bg-blue-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">召回原因分布</h3>
          <ReactECharts option={reasonPieOption} style={{ height: 280 }} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">按严重等级分布</h3>
          <ReactECharts option={levelBarOption} style={{ height: 280 }} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">召回时效箱线图（各阶段耗时，小时）</h3>
        <ReactECharts option={boxplotOption} style={{ height: 260 }} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">工单明细</h3>
          <button
            onClick={() => exportExcel({
              data: orders.map(o => ({ orderNo: o.orderNo, productName: o.productName, batchNo: o.batchNo, reason: o.reason, level: o.level, status: o.status, affectedQty: o.affectedQty, recalledQty: o.recalledQty, createdAt: o.createdAt })),
              filename: '召回报表_' + dayjs().format('YYYYMMDD'),
              headers: { orderNo: '工单号', productName: '产品', batchNo: '批次', reason: '原因', level: '等级', status: '状态', affectedQty: '受影响量', recalledQty: '已召回量', createdAt: '创建时间' },
              columns: ['orderNo', 'productName', 'batchNo', 'reason', 'level', 'status', 'affectedQty', 'recalledQty', 'createdAt'],
            })}
            className="inline-flex items-center gap-2 btn-secondary text-sm"
          >
            <Download className="w-4 h-4" /> 导出
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-700">工单号</th>
                <th className="px-5 py-3 font-semibold text-gray-700">产品/批次</th>
                <th className="px-5 py-3 font-semibold text-gray-700">召回原因</th>
                <th className="px-5 py-3 font-semibold text-gray-700">等级</th>
                <th className="px-5 py-3 font-semibold text-gray-700">状态</th>
                <th className="px-5 py-3 font-semibold text-gray-700 text-right">召回进度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => {
                const pct = o.affectedQty > 0 ? Math.round((o.recalledQty / o.affectedQty) * 100) : 0;
                return (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-primary-700 font-medium">{o.orderNo}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-800 font-medium">{o.productName}</div>
                      <div className="text-xs text-gray-500">{o.batchNo}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs">{o.reason}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('badge-status',
                        o.level === '一级召回' ? 'bg-danger-50 text-danger-700 border border-danger-200' :
                        o.level === '二级召回' ? 'bg-warning-50 text-warning-700 border border-warning-200' :
                        'bg-primary-50 text-primary-700 border border-primary-200'
                      )}>{o.level}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('badge-status',
                        o.status === '已完成' ? 'badge-status-success' :
                        o.status === '召回中' ? 'badge-status-info' :
                        o.status === '待启动' ? 'badge-status-default' : 'badge-status-danger'
                      )}>{o.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all',
                            pct >= 100 ? 'bg-trust-500' : pct >= 50 ? 'bg-primary-500' : 'bg-warning-500'
                          )} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-10 text-right">{pct}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 text-right">
                        {o.recalledQty.toLocaleString()} / {o.affectedQty.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== Tab5: 合规报告 ====================
function ComplianceReportSection({ exportJson }: { exportJson: ReturnType<typeof useExport>['exportJson'] }) {
  const batches = db.getRawBatches();
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([batches[0]?.id].filter(Boolean));
  const [reportType, setReportType] = useState<ReportType>('full');
  const [report, setReport] = useState<ComplianceReportType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<{ id: string; reportNo: string; batchNo: string; productName: string; type: string; time: string }[]>([]);

  const toggleBatch = (id: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedBatchIds.length === 0) return;
    setGenerating(true);
    try {
      const r = await reportService.exportComplianceReport(selectedBatchIds[0]);
      setReport(r);
      if (r) {
        setHistory(prev => [{
          id: r.reportNo,
          reportNo: r.reportNo,
          batchNo: r.batch.batchNo,
          productName: r.batch.productName,
          type: reportType === 'gmp' ? 'GMP合规' : reportType === 'gsp' ? 'GSP合规' : '完整档案',
          time: r.generatedAt,
        }, ...prev].slice(0, 10));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 批次选择（可多选）
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin p-2 border border-gray-200 rounded-xl bg-gray-50/50">
              {batches.map(b => {
                const checked = selectedBatchIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBatch(b.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      checked
                        ? 'bg-primary-100 text-primary-800 border-primary-300 ring-1 ring-primary-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
                    )}
                  >
                    <span className={cn('w-3 h-3 rounded border flex items-center justify-center', checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300')}>
                      {checked && <CheckCircle2 className="w-2 h-2 text-white" strokeWidth={4} />}
                    </span>
                    <span className="font-mono">{b.batchNo}</span>
                    <span className="text-gray-500">·</span>
                    <span>{b.productName.length > 8 ? b.productName.slice(0, 8) + '…' : b.productName}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" /> 报告类型
            </label>
            <div className="flex flex-col gap-2">
              {([
                { id: 'gmp' as const, label: 'GMP合规报告', desc: '药品生产质量管理规范' },
                { id: 'gsp' as const, label: 'GSP合规报告', desc: '药品经营质量管理规范' },
                { id: 'full' as const, label: '批次完整档案', desc: '全链路追溯完整档案' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setReportType(opt.id)}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2.5 rounded-xl text-left border transition-all',
                    reportType === opt.id
                      ? 'bg-primary-50 border-primary-300 ring-1 ring-primary-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={cn('w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0',
                    reportType === opt.id ? 'border-primary-600' : 'border-gray-300'
                  )}>
                    {reportType === opt.id && <div className="w-2 h-2 rounded-full bg-primary-600" />}
                  </div>
                  <div>
                    <div className={cn('text-sm font-medium', reportType === opt.id ? 'text-primary-800' : 'text-gray-800')}>{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={generating || selectedBatchIds.length === 0}
            className="inline-flex items-center gap-2 btn-primary text-sm"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileCheck className="w-4 h-4" />
            )}
            {generating ? '生成中...' : '生成报告预览'}
          </button>
          <button onClick={handlePrint} disabled={!report} className="inline-flex items-center gap-2 btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Printer className="w-4 h-4" /> 打印
          </button>
          <button
            onClick={() => report && exportJson({ data: report, filename: `合规报告_${report.reportNo}` })}
            disabled={!report}
            className="inline-flex items-center gap-2 btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4" /> 导出监管上报 XML
          </button>
          <button
            onClick={handlePrint}
            disabled={!report}
            className="inline-flex items-center gap-2 btn-success text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" /> 生成 PDF 下载
          </button>
        </div>
      </div>

      {report && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-800">报告预览 · A4格式</span>
            </div>
            <span className="text-xs text-gray-500 font-mono">报告编号: {report.reportNo}</span>
          </div>

          <div className="p-8 bg-gray-100">
            <div className="mx-auto max-w-2xl bg-white shadow-xl rounded-sm p-12 border border-gray-200" style={{ minHeight: '800px' }}>
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                <div className="text-sm text-gray-500 tracking-widest mb-2">DRUG TRACEABILITY</div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 tracking-wide">
                  {reportType === 'gmp' ? '药品 GMP 合规报告' : reportType === 'gsp' ? '药品 GSP 合规报告' : '批次完整档案报告'}
                </h2>
                <div className="mt-3 text-xs text-gray-500">
                  Report No. {report.reportNo} · 生成时间 {report.generatedAt}
                </div>
              </div>

              <section className="mb-6">
                <h3 className="text-base font-bold text-gray-800 border-l-4 border-primary-600 pl-3 mb-3">一、批次概览</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ['产品名称', report.batch.productName],
                    ['规格型号', report.batch.spec],
                    ['生产批次', report.batch.batchNo],
                    ['生产企业', report.batch.manufacturer],
                    ['生产日期', report.batch.productionDate],
                    ['有效期至', report.batch.expiryDate],
                    ['实际产量', `${report.batch.actualQty.toLocaleString()} 盒`],
                    ['当前状态', report.batch.status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex py-1 border-b border-dashed border-gray-200">
                      <span className="text-gray-500 w-24 shrink-0">{k}</span>
                      <span className="text-gray-900 font-medium flex-1">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-6">
                <h3 className="text-base font-bold text-gray-800 border-l-4 border-primary-600 pl-3 mb-3">二、原料溯源</h3>
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1.5">原料名称</th>
                      <th className="border border-gray-300 px-2 py-1.5">批号</th>
                      <th className="border border-gray-300 px-2 py-1.5">供应商</th>
                      <th className="border border-gray-300 px-2 py-1.5">质检</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rawMaterials.map((m, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-2 py-1.5">{m.name}</td>
                        <td className="border border-gray-300 px-2 py-1.5 font-mono">{m.batchNo}</td>
                        <td className="border border-gray-300 px-2 py-1.5">{m.supplier}</td>
                        <td className={cn('border border-gray-300 px-2 py-1.5 text-center font-medium',
                          m.inspectionResult === '合格' ? 'text-trust-700' : 'text-warning-700'
                        )}>{m.inspectionResult}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="mb-6">
                <h3 className="text-base font-bold text-gray-800 border-l-4 border-primary-600 pl-3 mb-3">三、生产记录</h3>
                <div className="space-y-1.5">
                  {report.processSteps.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs py-2 border-b border-dashed border-gray-200">
                      <div className={cn(
                        'w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white',
                        s.status === '已完成' ? 'bg-trust-500' : s.status === '进行中' ? 'bg-primary-500' : 'bg-gray-400'
                      )}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800">{s.stepName}</div>
                        <div className="text-gray-500">操作人: {s.operator} · {s.startTime}{s.endTime ? ` → ${s.endTime.slice(11)}` : ''}</div>
                      </div>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border',
                        s.status === '已完成' ? 'bg-trust-50 text-trust-700 border-trust-200' :
                        s.status === '进行中' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      )}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-6">
                <h3 className="text-base font-bold text-gray-800 border-l-4 border-primary-600 pl-3 mb-3">四、质量检验</h3>
                {report.qcReport ? (
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>报告编号: {report.qcReport.reportNo}</span>
                      <span>检验日期: {report.qcReport.reportDate}</span>
                      <span>检验员: {report.qcReport.inspector}</span>
                    </div>
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-2 py-1.5">检测项</th>
                          <th className="border border-gray-300 px-2 py-1.5">标准</th>
                          <th className="border border-gray-300 px-2 py-1.5">实测</th>
                          <th className="border border-gray-300 px-2 py-1.5">结论</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.qcReport.items.map((it, i) => (
                          <tr key={i}>
                            <td className="border border-gray-300 px-2 py-1.5">{it.itemName}</td>
                            <td className="border border-gray-300 px-2 py-1.5">{it.standard}</td>
                            <td className="border border-gray-300 px-2 py-1.5">{it.testResult}</td>
                            <td className={cn('border border-gray-300 px-2 py-1.5 text-center',
                              it.isPass ? 'text-trust-700 font-medium' : 'text-danger-700 font-medium'
                            )}>{it.isPass ? '合格' : '不合格'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 text-right">
                      <span className={cn('inline-block px-4 py-1 rounded text-sm font-bold',
                        report.qcReport.overallResult === '合格'
                          ? 'bg-trust-100 text-trust-800 border border-trust-300'
                          : 'bg-danger-100 text-danger-800 border border-danger-300'
                      )}>
                        综合结论: {report.qcReport.overallResult}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">质检报告待生成</div>
                )}
              </section>

              <section className="mb-6">
                <h3 className="text-base font-bold text-gray-800 border-l-4 border-primary-600 pl-3 mb-3">五、流通记录</h3>
                <ol className="space-y-2 text-sm relative pl-4 border-l-2 border-gray-200 ml-2">
                  {report.circulationTrack.map((c, i) => (
                    <li key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                      <div className="font-medium text-gray-800">{c.stage}</div>
                      <div className="text-xs text-gray-500">{c.location} · {c.operator} · {c.time}</div>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="pt-8 mt-8 border-t-2 border-dashed border-gray-300">
                <div className="flex justify-between text-xs text-gray-500">
                  <div>
                    <div className="mb-6">
                      <div className="mb-1">质量负责人签字:</div>
                      <div className="border-b border-gray-400 w-36" />
                    </div>
                    <div>日期: ____年____月____日</div>
                  </div>
                  <div className="text-right">
                    <div className="mb-6">
                      <div className="mb-1">企业公章:</div>
                      <div className="border border-gray-400 w-24 h-24 rounded-sm flex items-center justify-center text-gray-400 mx-auto">
                        盖章处
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 font-mono">
                  © 2026 药品全链路追溯管理平台 · 本报告由系统自动生成，具有电子凭证效力
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-800">最近生成报告历史</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {history.map((h) => (
              <div key={h.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <FileCheck className="w-5 h-5 text-primary-600 shrink-0" strokeWidth={1.8} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary-700 font-medium">{h.reportNo}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{h.type}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-0.5 truncate">{h.productName} · {h.batchNo}</div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">{h.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Tab6: 操作日志 ====================
function OperationLogsTab({ exportExcel }: { exportExcel: ReturnType<typeof useExport>['exportExcel'] }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [logs, setLogs] = useState<{ data: OperationLog[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ user: '', role: '', module: 'all' as LogModule, action: '', dateFrom: '', dateTo: '' });
  const [detailLog, setDetailLog] = useState<OperationLog | null>(null);

  const fetchData = useCallback(async (mod?: string, p?: number) => {
    setLoading(true);
    try {
      const result = await reportService.fetchOperationLogs({
        page: p ?? page, pageSize,
        module: mod === 'all' ? undefined : mod,
      });
      setLogs(result);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(filters.module, page); }, [fetchData, filters.module, page]);

  const totalPages = Math.max(1, Math.ceil(logs.total / pageSize));

  const moduleOptions: { id: LogModule; label: string }[] = [
    { id: 'all', label: '全部模块' },
    { id: '批次管理', label: '批次管理' },
    { id: '生产', label: '生产管理' },
    { id: '赋码', label: '赋码管理' },
    { id: '仓储', label: '仓储管理' },
    { id: '召回', label: '召回管理' },
    { id: '报表', label: '报表中心' },
  ];

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">用户</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={filters.user}
                onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}
                placeholder="操作人"
                className="input-base pl-8 text-sm py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">角色</label>
            <div className="relative">
              <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <select
                value={filters.role}
                onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                className="input-base pl-8 text-sm py-2 appearance-none pr-8"
              >
                <option value="">全部角色</option>
                <option>超级管理员</option>
                <option>生产管理员</option>
                <option>质检员</option>
                <option>仓库管理员</option>
                <option>物流管理员</option>
                <option>经销商</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">模块</label>
            <div className="relative">
              <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <select
                value={filters.module}
                onChange={e => { setFilters(f => ({ ...f, module: e.target.value as LogModule })); setPage(1); }}
                className="input-base pl-8 text-sm py-2 appearance-none pr-8"
              >
                {moduleOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">操作类型</label>
            <div className="relative">
              <Activity className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={filters.action}
                onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                placeholder="操作动作"
                className="input-base pl-8 text-sm py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              className="input-base text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">结束日期</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="input-base text-sm py-2 flex-1"
              />
              <button
                onClick={() => { setPage(1); fetchData(); }}
                className="btn-primary px-3 py-2 text-sm"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-800">操作日志</span>
            <span className="text-xs text-gray-500">共 {logs.total} 条</span>
          </div>
          <button
            onClick={() => exportExcel({
              data: logs.data.map(l => ({ time: l.operateTime, operator: l.operator, module: l.module, action: l.action, target: l.targetName, ip: l.ip, status: l.status, remark: l.remark })),
              filename: '操作日志_' + dayjs().format('YYYYMMDD'),
              headers: { time: '时间', operator: '操作人', module: '模块', action: '动作', target: '操作对象', ip: 'IP地址', status: '状态', remark: '备注' },
              columns: ['time', 'operator', 'module', 'action', 'target', 'ip', 'status', 'remark'],
            })}
            className="inline-flex items-center gap-2 btn-secondary text-sm"
          >
            <Download className="w-4 h-4" /> 导出
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">时间</th>
                <th className="px-4 py-3 font-semibold text-gray-700">用户名</th>
                <th className="px-4 py-3 font-semibold text-gray-700">模块</th>
                <th className="px-4 py-3 font-semibold text-gray-700">操作动作</th>
                <th className="px-4 py-3 font-semibold text-gray-700">操作对象</th>
                <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">IP地址</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">状态</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">加载中...</td></tr>
              ) : logs.data.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">暂无数据</td></tr>
              ) : logs.data.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap font-mono">{l.operateTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {l.operator.slice(0, 1)}
                      </div>
                      <span className="text-gray-800 font-medium text-sm">{l.operator}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-100">{l.module}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-sm">{l.action}</td>
                  <td className="px-4 py-3 text-gray-700 text-sm max-w-xs truncate" title={l.targetName}>{l.targetName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{l.ip}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={l.status === '成功' ? 'badge-status-success' : 'badge-status-danger'}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setDetailLog(l)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md text-primary-700 hover:bg-primary-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> 查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-gray-500">
            第 {page} / {totalPages} 页，共 {logs.total} 条
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(totalPages - 4, page - 2));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-all',
                    p === page ? 'bg-primary-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >{p}</button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetailLog(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">操作详情</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{detailLog.logNo}</p>
              </div>
              <button onClick={() => setDetailLog(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['操作时间', detailLog.operateTime],
                  ['操作人', detailLog.operator],
                  ['所属模块', detailLog.module],
                  ['操作动作', detailLog.action],
                  ['IP地址', detailLog.ip],
                  ['操作状态', detailLog.status, true],
                ].map(([k, v, isStatus]) => (
                  <div key={k as string} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                    <div className="text-xs text-gray-500 mb-1">{k as string}</div>
                    {isStatus ? (
                      <span className={(v as string) === '成功' ? 'badge-status-success' : 'badge-status-danger'}>{v as string}</span>
                    ) : (
                      <div className="text-sm font-medium text-gray-800">{v as string}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-primary-600" /> 操作对象
                </div>
                <div className="text-sm text-gray-700">{detailLog.targetName}</div>
                <div className="text-xs text-gray-500 mt-1 font-mono">ID: {detailLog.targetId}</div>
              </div>

              {detailLog.remark && (
                <div className="rounded-lg border border-gray-200 bg-primary-50/30 p-4">
                  <div className="text-sm font-medium text-gray-800 mb-2">备注说明</div>
                  <div className="text-sm text-gray-700">{detailLog.remark}</div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary-600" /> 数据变更对比 (Mock Diff)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-danger-200 overflow-hidden">
                    <div className="px-3 py-2 bg-danger-50 border-b border-danger-200 flex items-center gap-1.5 text-xs font-semibold text-danger-700">
                      操作前 (Before)
                    </div>
                    <pre className="p-3 text-xs font-mono text-gray-700 bg-white overflow-x-auto max-h-64 scrollbar-thin whitespace-pre-wrap">{JSON.stringify({
                      status: '待生产',
                      qty: 10000,
                      operator: '—',
                      updatedAt: '2024-11-01 08:00:00',
                    }, null, 2)}</pre>
                  </div>
                  <div className="rounded-xl border border-trust-200 overflow-hidden">
                    <div className="px-3 py-2 bg-trust-50 border-b border-trust-200 flex items-center gap-1.5 text-xs font-semibold text-trust-700">
                      操作后 (After)
                    </div>
                    <pre className="p-3 text-xs font-mono text-gray-700 bg-white overflow-x-auto max-h-64 scrollbar-thin whitespace-pre-wrap">{JSON.stringify({
                      status: detailLog.status === '成功' ? '已入库' : '生产中',
                      qty: 10000,
                      operator: detailLog.operator,
                      updatedAt: detailLog.operateTime,
                    }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
