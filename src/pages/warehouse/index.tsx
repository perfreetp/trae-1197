import { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  PackageSearch,
  AlertTriangle,
  CheckCheck,
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  User,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  Truck,
  FileText,
  ChevronRight,
  Eye,
  Package,
  Boxes,
  FlaskConical,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useWarehouseStore, ScanResult } from '@/stores/warehouseStore';
import { useUIStore } from '@/stores/uiStore';
import { db } from '@/services/mock/database';
import { InventoryItem } from '@/services/warehouseService';
import { cn } from '@/lib/utils';

const WH_TABS = [
  { key: 'in', label: '📥 扫码入库', icon: ArrowDownToLine },
  { key: 'out', label: '📤 扫码出库', icon: ArrowUpFromLine },
  { key: 'stock', label: '📦 库存查询', icon: PackageSearch },
  { key: 'expiry', label: '⚠️ 效期管理', icon: AlertTriangle },
  { key: 'sign', label: '✅ 签收确认', icon: CheckCheck },
] as const;

type WHTab = typeof WH_TABS[number]['key'];

const OPERATORS = ['张伟', '李娜', '王强', '刘洋', '陈静'];
const WAREHOUSES = ['一号成品仓', '二号成品仓', '冷链仓库', '原料仓库A区'];
const LOCATIONS = ['A-01-01', 'A-02-03', 'B-01-05', 'B-03-02', 'C-02-04', 'C-04-01'];
const DEALERS = db.getRawDealers();
const STORES = db.getRawStores();

export default function WarehouseIndex() {
  const [activeTab, setActiveTab] = useState<WHTab>('in');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle('仓储流转');
  }, [setPageTitle]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">仓储流转</h1>
          <p className="text-sm text-gray-500 mt-1">出入库扫码、库存管理、效期预警与签收确认</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50 px-2 overflow-x-auto">
          {WH_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'in') navigate('/warehouse/in');
                if (tab.key === 'out') navigate('/warehouse/out');
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-primary text-primary bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'in' && <InboundQuickTab />}
          {activeTab === 'out' && <OutboundQuickTab />}
          {activeTab === 'stock' && <StockQueryTab />}
          {activeTab === 'expiry' && <ExpiryTab />}
          {activeTab === 'sign' && <SignConfirmTab />}
        </div>
      </div>
    </div>
  );
}

function InboundQuickTab() {
  const { recentScans, scanInbound, scanning, clearRecentScans } = useWarehouseStore();
  const { toastSuccess, toastError } = useUIStore();
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [codeInput, setCodeInput] = useState('');
  const [scanAnim, setScanAnim] = useState(false);

  const todayScans = recentScans.filter(s => s.type === '入库');
  const successCount = todayScans.filter(s => s.status === 'success').length;
  const totalQty = todayScans.reduce((sum, s) => sum + s.quantity, 0);

  const handleScan = async (code?: string) => {
    const traceCode = code || codeInput;
    if (!traceCode) {
      toastError('请输入或扫描追溯码');
      return;
    }
    setScanAnim(true);
    setTimeout(() => setScanAnim(false), 500);
    const ok = await scanInbound(traceCode, warehouse, location, operator);
    if (ok) {
      toastSuccess('入库成功', `追溯码 ${traceCode.slice(-8)} 已入库`);
      setCodeInput('');
    } else {
      toastError('入库失败', '追溯码无效或已入库');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-6 space-y-4">
        <div className="card p-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-primary" />
            入库配置
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label flex items-center gap-1"><MapPin className="w-3 h-3" />仓库</label>
              <select className="input-base" value={warehouse} onChange={e => setWarehouse(e.target.value)}>
                {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><Package className="w-3 h-3" />库位</label>
              <select className="input-base" value={location} onChange={e => setLocation(e.target.value)}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><User className="w-3 h-3" />操作员</label>
              <select className="input-base" value={operator} onChange={e => setOperator(e.target.value)}>
                {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={cn('card p-8 transition-all', scanAnim && 'ring-4 ring-trust-200')}>
          <div className="flex flex-col items-center">
            <div className="relative w-56 h-56 mb-6">
              <div className="absolute inset-0 rounded-2xl border-4 border-dashed border-gray-200" />
              <div className="absolute inset-4 rounded-xl border-2 border-primary/30 bg-primary-50/30 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scanLine" />
                <QrCode className="w-20 h-20 text-primary/40" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
            <div className="w-full max-w-sm flex gap-2">
              <input
                className="input-base flex-1"
                placeholder="输入追溯码或扫描..."
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
              />
              <button onClick={() => handleScan()} disabled={scanning} className="btn-primary gap-1.5">
                {scanning ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                确认入库
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">示例码：{db.getRawTraceCodes()[0]?.code || 'X20250100001'}</p>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-primary">{totalQty}</div>
            <div className="text-xs text-gray-500">今日入库量</div>
          </div>
          <div className="card p-4 text-center">
            <QrCode className="w-6 h-6 text-trust mx-auto mb-1" />
            <div className="text-2xl font-bold text-trust-700">{todayScans.length}</div>
            <div className="text-xs text-gray-500">扫码次数</div>
          </div>
          <div className="card p-4 text-center">
            <CheckCheck className="w-6 h-6 text-trust mx-auto mb-1" />
            <div className="text-2xl font-bold text-trust-700">
              {todayScans.length ? Math.round((successCount / todayScans.length) * 100) : 100}%
            </div>
            <div className="text-xs text-gray-500">成功率</div>
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              最近扫码记录
            </h4>
            {todayScans.length > 0 && (
              <button onClick={clearRecentScans} className="text-xs text-gray-500 hover:text-danger">清空</button>
            )}
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-auto scrollbar-thin">
            {todayScans.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无扫码记录</p>
              </div>
            ) : (
              todayScans.slice(0, 10).map(s => (
                <div
                  key={s.id}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    s.status === 'success' ? 'border-trust-200 bg-trust-50/40' : 'border-danger-200 bg-danger-50/40'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {s.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-trust-600" /> : <XCircle className="w-4 h-4 text-danger-600" />}
                        <code className="text-xs font-mono text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200 truncate">
                          {s.code}
                        </code>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{s.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{dayjs(s.time).format('HH:mm:ss')} · {s.operator}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutboundQuickTab() {
  const { recentScans, scanOutbound, scanning } = useWarehouseStore();
  const { toastSuccess, toastError } = useUIStore();
  const [dealerId, setDealerId] = useState(DEALERS[0]?.id || '');
  const [orderId, setOrderId] = useState(`SO${dayjs().format('YYYYMMDD')}001`);
  const [shipMethod, setShipMethod] = useState('物流配送');
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [codeInput, setCodeInput] = useState('');
  const [dealerSearch, setDealerSearch] = useState('');

  const filteredDealers = DEALERS.filter(d =>
    d.dealerName.includes(dealerSearch) || d.city.includes(dealerSearch)
  );
  const selectedDealer = DEALERS.find(d => d.id === dealerId);

  const todayScans = recentScans.filter(s => s.type === '出库');

  const handleScan = async () => {
    if (!codeInput) { toastError('请输入追溯码'); return; }
    const ok = await scanOutbound(codeInput, dealerId, orderId, operator);
    if (ok) { toastSuccess('出库成功', `已发往 ${selectedDealer?.dealerName || '经销商'}`); setCodeInput(''); }
    else toastError('出库失败', '批次可能已冻结或码状态异常');
  };

  const sampleCode = db.getRawTraceCodes().find(c => c.status === '已入库')?.code || db.getRawTraceCodes()[0]?.code;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-6 space-y-4">
        <div className="card p-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            出库配置
          </h4>
          <div className="space-y-3">
            <div>
              <label className="form-label flex items-center gap-1"><Store className="w-3 h-3" />经销商（搜索）</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  className="input-base pl-8"
                  placeholder="搜索经销商名称/城市..."
                  value={dealerSearch}
                  onChange={e => setDealerSearch(e.target.value)}
                />
              </div>
              <select className="input-base" value={dealerId} onChange={e => setDealerId(e.target.value)}>
                {filteredDealers.map(d => (
                  <option key={d.id} value={d.id}>{d.city} - {d.dealerName} ({d.level})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label flex items-center gap-1"><FileText className="w-3 h-3" />销售订单号</label>
                <input className="input-base" value={orderId} onChange={e => setOrderId(e.target.value)} />
              </div>
              <div>
                <label className="form-label flex items-center gap-1"><Truck className="w-3 h-3" />发货方式</label>
                <select className="input-base" value={shipMethod} onChange={e => setShipMethod(e.target.value)}>
                  <option>物流配送</option><option>自提</option><option>冷链专车</option><option>快递</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><User className="w-3 h-3" />操作员</label>
              <select className="input-base" value={operator} onChange={e => setOperator(e.target.value)}>
                {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {selectedDealer && (
              <div className="p-3 bg-primary-50 rounded-lg text-xs space-y-0.5 text-gray-600 border border-primary-100">
                <p>🏢 {selectedDealer.dealerName}</p>
                <p>📍 {selectedDealer.city} {selectedDealer.address}</p>
                <p>📞 {selectedDealer.contactPerson} {selectedDealer.phone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpFromLine className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-gray-800">扫码出库</h4>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              className="input-base flex-1"
              placeholder="输入或扫描追溯码..."
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
            />
            <button onClick={handleScan} disabled={scanning} className="btn-primary gap-1.5">
              {scanning ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              出库
            </button>
          </div>
          <p className="text-xs text-gray-400">示例码（已入库）：{sampleCode}</p>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <Truck className="w-6 h-6 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-primary">{todayScans.length}</div>
            <div className="text-xs text-gray-500">今日出库次数</div>
          </div>
          <div className="card p-4 text-center">
            <Package className="w-6 h-6 text-trust mx-auto mb-1" />
            <div className="text-2xl font-bold text-trust-700">
              {todayScans.reduce((s, r) => s + r.quantity, 0)}
            </div>
            <div className="text-xs text-gray-500">出库数量</div>
          </div>
          <div className="card p-4 text-center">
            <Store className="w-6 h-6 text-warning mx-auto mb-1" />
            <div className="text-2xl font-bold text-warning-700">1</div>
            <div className="text-xs text-gray-500">经销商</div>
          </div>
        </div>

        <div className="card p-5">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            出库链路信息
          </h4>
          {todayScans.length > 0 ? (
            <div className="space-y-3">
              {todayScans.slice(0, 3).map(s => (
                <div key={s.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-xs font-mono text-primary bg-primary-50 px-2 py-0.5 rounded">{s.code}</code>
                    {s.status === 'success' ? <span className="badge-status-success">成功</span> : <span className="badge-status-danger">失败</span>}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2 items-start">
                      <span className="w-16 text-gray-500 flex-shrink-0">批次</span>
                      <span className="text-gray-700">{s.batchNo || '-'}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-16 text-gray-500 flex-shrink-0">产品</span>
                      <span className="text-gray-700">{s.productName || '-'}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-16 text-gray-500 flex-shrink-0">数量</span>
                      <span className="text-gray-700">{s.quantity}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-16 text-gray-500 flex-shrink-0">经销商</span>
                      <span className="text-gray-700">{selectedDealer?.dealerName || '-'}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-16 text-gray-500 flex-shrink-0">时间</span>
                      <span className="text-gray-700">{dayjs(s.time).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">扫码后显示完整链路信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StockQueryTab() {
  const { inventory, loadInventory, loading } = useWarehouseStore();
  const [keyword, setKeyword] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadInventory({ page: 1, pageSize: 50 }); }, [loadInventory]);

  const batches = db.getRawBatches();

  const filtered = useMemo(() => {
    return inventory.filter(i => {
      if (keyword && !i.productName.includes(keyword) && !i.batchNo.includes(keyword)) return false;
      if (batchFilter && i.batchNo !== batchFilter) return false;
      if (warehouseFilter && !i.warehouse.includes(warehouseFilter)) return false;
      return true;
    });
  }, [inventory, keyword, batchFilter, warehouseFilter]);

  const heatOption = useMemo(() => {
    const gridData = LOCATIONS.map((loc, idx) => ({
      name: loc,
      value: inventory.filter(i => i.location === loc).reduce((s, i) => s + i.stockQty, 0) || Math.random() * 1000 + 100,
    }));
    const maxVal = Math.max(...gridData.map(d => d.value));
    return {
      tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>库存: ${p.value}` },
      grid: { left: 10, right: 10, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'], axisLine: { lineStyle: { color: '#CBD5E1' } }, axisLabel: { color: '#64748B' } },
      yAxis: { type: 'category', data: ['01', '02', '03', '04'], axisLine: { lineStyle: { color: '#CBD5E1' } }, axisLabel: { color: '#64748B' } },
      series: [{
        type: 'heatmap',
        data: Array.from({ length: 16 }, (_, i) => {
          const x = i % 4, y = Math.floor(i / 4);
          const val = gridData[i]?.value || Math.random() * maxVal;
          return [x, y, Math.round(val)];
        }),
        label: { show: true, color: '#fff', fontSize: 10, formatter: (p: any) => p.value[2] },
        itemStyle: { borderRadius: 4 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
      }],
      visualMap: {
        min: 0, max: maxVal || 1000, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
        inRange: { color: ['#DBEAFE', '#3B82F6', '#1E40AF'] }, textStyle: { fontSize: 10, color: '#64748B' }
      }
    };
  }, [inventory]);

  const daysBadge = (days: number) => {
    if (days < 0) return <span className="badge-status-danger">已过期 {Math.abs(days)}天</span>;
    if (days <= 30) return <span className="badge-status-danger">剩 {days}天</span>;
    if (days <= 90) return <span className="badge-status-warning">剩 {days}天</span>;
    return <span className="badge-status-info">剩 {days}天</span>;
  };

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-base pl-9"
              placeholder="搜索产品/批次..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>
          <select className="input-base w-40" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
            <option value="">全部批次</option>
            {batches.slice(0, 10).map(b => <option key={b.id} value={b.batchNo}>{b.batchNo}</option>)}
          </select>
          <select className="input-base w-40" value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}>
            <option value="">全部仓库</option>
            {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className="input-base w-32" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            <option value="normal">正常</option>
            <option value="warning">临期</option>
            <option value="expired">过期</option>
          </select>
          <button className="btn-secondary gap-1.5 text-sm">
            <Filter className="w-3.5 h-3.5" /> 更多筛选
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <PackageSearch className="w-4 h-4 text-primary" />
                库存列表
              </h4>
              <span className="text-xs text-gray-500">共 {filtered.length} 条</span>
            </div>
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-gray-600">
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">产品名称</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">批次号</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">库位</th>
                    <th className="text-right px-5 py-3 font-medium whitespace-nowrap">数量</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">生产日期</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">有效期至</th>
                    <th className="text-center px-5 py-3 font-medium whitespace-nowrap">效期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">加载中...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">暂无库存数据</td></tr>
                  ) : (
                    filtered.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-gray-800 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-gray-400" />
                            {item.productName}
                            <span className="text-xs text-gray-400">{item.spec}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{item.batchNo}</code>
                        </td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3" />
                            {item.warehouse.split('仓')[0]}仓 / {item.location}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800">{item.stockQty.toLocaleString()}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{item.productionDate}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{item.expiryDate}</td>
                        <td className="px-5 py-3 text-center whitespace-nowrap">{daysBadge(item.daysToExpiry)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="card p-5">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              库位热力分布
            </h4>
            <ReactECharts option={heatOption} style={{ height: 280 }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center">
              <Package className="w-6 h-6 text-primary mx-auto mb-1" />
              <div className="text-xl font-bold text-primary">
                {inventory.reduce((s, i) => s + i.stockQty, 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">总库存</div>
            </div>
            <div className="card p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-1" />
              <div className="text-xl font-bold text-warning-700">
                {inventory.filter(i => i.daysToExpiry <= 90 && i.daysToExpiry > 0).length}
              </div>
              <div className="text-xs text-gray-500">临期品项</div>
            </div>
            <div className="card p-4 text-center">
              <XCircle className="w-6 h-6 text-danger mx-auto mb-1" />
              <div className="text-xl font-bold text-danger-700">
                {inventory.filter(i => i.daysToExpiry < 0).length}
              </div>
              <div className="text-xs text-gray-500">已过期</div>
            </div>
            <div className="card p-4 text-center">
              <Boxes className="w-6 h-6 text-trust mx-auto mb-1" />
              <div className="text-xl font-bold text-trust-700">{inventory.length}</div>
              <div className="text-xs text-gray-500">品项数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpiryTab() {
  const { expiryItems, loadExpiryWarning, loading } = useWarehouseStore();
  const { toastSuccess } = useUIStore();
  const [filter, setFilter] = useState<number | 'all'>('all');

  useEffect(() => { loadExpiryWarning(365); }, [loadExpiryWarning]);

  const quickFilters = [
    { label: '90天内', value: 90, color: 'warning' },
    { label: '60天内', value: 60, color: 'warning' },
    { label: '30天内', value: 30, color: 'danger' },
    { label: '已过期', value: -1, color: 'danger' },
  ] as const;

  const filtered = useMemo(() => {
    if (filter === 'all') return expiryItems;
    if (filter === -1) return expiryItems.filter(i => i.daysToExpiry < 0);
    return expiryItems.filter(i => i.daysToExpiry >= 0 && i.daysToExpiry <= filter);
  }, [expiryItems, filter]);

  const rowClass = (days: number) => cn(
    'hover:bg-gray-50/50 transition-colors',
    days < 0 && 'bg-danger-50/40 hover:bg-danger-50/60',
    days >= 0 && days <= 30 && 'bg-danger-50/20 hover:bg-danger-50/40',
    days > 30 && days <= 60 && 'bg-warning-50/30 hover:bg-warning-50/50'
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {quickFilters.map(qf => (
            <button
              key={qf.value}
              onClick={() => setFilter(qf.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                filter === qf.value
                  ? qf.color === 'danger'
                    ? 'bg-danger-50 border-danger-300 text-danger-700'
                    : 'bg-warning-50 border-warning-300 text-warning-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {qf.label}
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-white/60">
                {qf.value === -1
                  ? expiryItems.filter(i => i.daysToExpiry < 0).length
                  : expiryItems.filter(i => i.daysToExpiry >= 0 && i.daysToExpiry <= qf.value).length
                }
              </span>
            </button>
          ))}
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
              filter === 'all'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >全部</button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => toastSuccess('导出成功', `临期预警名单 (${filtered.length}条) 已导出`)}
          className="btn-primary gap-1.5 text-sm"
        >
          <Download className="w-3.5 h-3.5" />
          一键导出预警名单
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="90天内临期" value={expiryItems.filter(i => i.daysToExpiry > 0 && i.daysToExpiry <= 90).length} color="warning" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="30天内紧急" value={expiryItems.filter(i => i.daysToExpiry > 0 && i.daysToExpiry <= 30).length} color="danger" />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="已过期" value={expiryItems.filter(i => i.daysToExpiry < 0).length} color="danger" />
        <StatCard icon={<Package className="w-5 h-5" />} label="涉及总数量" value={filtered.reduce((s, i) => s + i.stockQty, 0).toLocaleString()} color="primary" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            临期品列表
          </h4>
          <span className="text-xs text-gray-500">共 {filtered.length} 条，按到期天数升序</span>
        </div>
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-gray-600">
                <th className="text-left px-5 py-3 font-medium">产品</th>
                <th className="text-left px-5 py-3 font-medium">批次号</th>
                <th className="text-left px-5 py-3 font-medium">规格</th>
                <th className="text-right px-5 py-3 font-medium">库存数量</th>
                <th className="text-left px-5 py-3 font-medium">生产日期</th>
                <th className="text-left px-5 py-3 font-medium">有效期至</th>
                <th className="text-center px-5 py-3 font-medium">距到期</th>
                <th className="text-left px-5 py-3 font-medium">仓库</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">加载中...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-trust/40" />
                  <p className="text-sm">当前筛选条件下暂无临期品 🎉</p>
                </td></tr>
              ) : (
                [...filtered].sort((a, b) => a.daysToExpiry - b.daysToExpiry).map(item => (
                  <tr key={item.id} className={rowClass(item.daysToExpiry)}>
                    <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-gray-400" />
                        {item.productName}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{item.batchNo}</code>
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{item.spec}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">{item.stockQty.toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{item.productionDate}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{item.expiryDate}</td>
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      {item.daysToExpiry < 0
                        ? <span className="badge-status-danger">已过期 {Math.abs(item.daysToExpiry)} 天</span>
                        : item.daysToExpiry <= 30
                          ? <span className="badge-status-danger">{item.daysToExpiry} 天</span>
                          : item.daysToExpiry <= 60
                            ? <span className="badge-status-warning">{item.daysToExpiry} 天</span>
                            : <span className="badge-status-info">{item.daysToExpiry} 天</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">{item.warehouse} / {item.location}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: 'primary' | 'success' | 'warning' | 'danger' }) {
  const colorMap = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-700', icon: 'text-primary' },
    success: { bg: 'bg-trust-50', text: 'text-trust-700', icon: 'text-trust' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-700', icon: 'text-warning' },
    danger: { bg: 'bg-danger-50', text: 'text-danger-700', icon: 'text-danger' },
  }[color];
  return (
    <div className={cn('card p-4 flex items-center gap-4', colorMap.bg)}>
      <div className={cn('p-2 rounded-lg bg-white', colorMap.icon)}>{icon}</div>
      <div>
        <div className={cn('text-2xl font-bold', colorMap.text)}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function SignConfirmTab() {
  const { dealerSign, storeArrival } = useWarehouseStore();
  const { toastSuccess, toastError } = useUIStore();

  const dealerSigns = [
    { id: 'd1', orderNo: 'OUT20250601001', batchNo: 'B20250528001', product: '阿莫西林胶囊', dealer: '北京华康医药有限公司', status: '待签收', qty: 500, time: '2025-06-09 08:30' },
    { id: 'd2', orderNo: 'OUT20250601002', batchNo: 'B20250528002', product: '布洛芬片', dealer: '上海仁信药业有限公司', status: '待签收', qty: 320, time: '2025-06-09 09:15' },
    { id: 'd3', orderNo: 'OUT20250531003', batchNo: 'B20250525003', product: '感冒灵颗粒', dealer: '广州天和医药公司', status: '已签收', qty: 200, time: '2025-06-08 14:22', signer: '赵总', signTime: '2025-06-09 10:30' },
    { id: 'd4', orderNo: 'OUT20250531004', batchNo: 'B20250525004', product: '连花清瘟胶囊', dealer: '深圳万通药业', status: '已签收', qty: 180, time: '2025-06-08 16:45', signer: '钱经理', signTime: '2025-06-09 08:15' },
  ];

  const storeArrivals = [
    { id: 's1', deliveryNo: 'DL20250609001', batchNo: 'B20250520001', product: '头孢克洛片', store: '北京百姓大药房（朝阳店）', dealer: '北京华康医药', status: '待确认', qty: 80, time: '2025-06-09 07:00' },
    { id: 's2', deliveryNo: 'DL20250609002', batchNo: 'B20250520002', product: '板蓝根颗粒', store: '上海益丰大药房（浦东店）', dealer: '上海仁信药业', status: '待确认', qty: 120, time: '2025-06-09 08:30' },
    { id: 's3', deliveryNo: 'DL20250608003', batchNo: 'B20250518001', product: '布洛芬缓释胶囊', store: '广州大参林药房（天河店）', dealer: '广州天和医药', status: '已确认', qty: 60, time: '2025-06-08 15:00', confirmer: '陈店长', confirmTime: '2025-06-09 09:00' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            经销商签收
          </h4>
          <span className="text-xs text-gray-500">{dealerSigns.filter(d => d.status === '待签收').length} 待处理</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-auto scrollbar-thin">
          {dealerSigns.map(d => (
            <div key={d.id} className="p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{d.orderNo}</code>
                    {d.status === '待签收' ? (
                      <span className="badge-status-warning"><Clock className="w-3 h-3" />待签收</span>
                    ) : (
                      <span className="badge-status-success"><CheckCircle2 className="w-3 h-3" />已签收</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-800">{d.product}</div>
                  <div className="text-xs text-gray-500 mt-0.5">批次：{d.batchNo} · 数量：{d.qty}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-500">发货</div>
                  <div className="text-xs text-gray-700">{d.time.slice(5)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 p-2.5 bg-gray-50 rounded-lg mb-3">
                <Store className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{d.dealer}</span>
                {d.status === '已签收' && d.signer && (
                  <>
                    <span className="mx-1 text-gray-300">|</span>
                    <span className="text-trust-600">签收人: {d.signer}</span>
                    <span className="mx-1 text-gray-300">·</span>
                    <span className="text-gray-500">{d.signTime?.slice(5)}</span>
                  </>
                )}
              </div>
              {d.status === '待签收' && (
                <div className="flex gap-2 justify-end">
                  <button className="btn-secondary text-xs py-1.5 gap-1"><Eye className="w-3 h-3" />查看单据</button>
                  <button
                    onClick={async () => {
                      const ok = await dealerSign(db.getRawTraceCodes()[0].code, DEALERS[0].id, '模拟签收人');
                      ok ? toastSuccess('签收确认成功') : toastError('签收失败');
                    }}
                    className="btn-primary text-xs py-1.5 gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />确认签收
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            门店到货确认
          </h4>
          <span className="text-xs text-gray-500">{storeArrivals.filter(s => s.status === '待确认').length} 待处理</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-auto scrollbar-thin">
          {storeArrivals.map(s => (
            <div key={s.id} className="p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{s.deliveryNo}</code>
                    {s.status === '待确认' ? (
                      <span className="badge-status-info"><Clock className="w-3 h-3" />待确认</span>
                    ) : (
                      <span className="badge-status-success"><CheckCircle2 className="w-3 h-3" />已确认</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-800">{s.product}</div>
                  <div className="text-xs text-gray-500 mt-0.5">批次：{s.batchNo} · 数量：{s.qty}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-500">到货</div>
                  <div className="text-xs text-gray-700">{s.time.slice(5)}</div>
                </div>
              </div>
              <div className="space-y-1 text-xs p-2.5 bg-gray-50 rounded-lg mb-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Store className="w-3.5 h-3.5 text-primary/60" />
                  <span className="truncate">{s.store}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 pl-5">
                  <ChevronRight className="w-3 h-3" />
                  来源经销商: {s.dealer}
                </div>
                {s.status === '已确认' && s.confirmer && (
                  <div className="flex items-center gap-2 text-trust-600 pl-5">
                    <CheckCircle2 className="w-3 h-3" />
                    确认人: {s.confirmer} · {s.confirmTime?.slice(5)}
                  </div>
                )}
              </div>
              {s.status === '待确认' && (
                <div className="flex gap-2 justify-end">
                  <button className="btn-secondary text-xs py-1.5 gap-1"><Eye className="w-3 h-3" />查看详情</button>
                  <button
                    onClick={async () => {
                      const ok = await storeArrival(db.getRawTraceCodes()[0].code, STORES[0].id, '模拟确认人');
                      ok ? toastSuccess('到货确认成功') : toastError('确认失败');
                    }}
                    className="btn-success text-xs py-1.5 gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />确认到货
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
