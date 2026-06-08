import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpFromLine,
  ArrowLeft,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  Building2,
  FileText,
  Package,
  Boxes,
  FlaskConical,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Truck,
  ShoppingCart,
  History,
  Snowflake,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useUIStore } from '@/stores/uiStore';
import { db } from '@/services/mock/database';
import { cn } from '@/lib/utils';
const OPERATORS = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆'];
const SHIPPING_METHODS = [
  { id: 'express', name: '快递配送', desc: '次日达' },
  { id: 'logistics', name: '物流托运', desc: '3-5天' },
  { id: 'self', name: '自提', desc: '门店自取' },
  { id: 'cold', name: '冷链专车', desc: '控温运输' },
];
const dName = (d: any) => d.dealerName || d.name || '';
const dRegion = (d: any) => d.city || d.region || '';
const dContact = (d: any) => d.contactPerson || d.contact || '';

export default function WarehouseOutPage() {
  const navigate = useNavigate();
  const { recentScans, scanOutbound, scanning, clearRecentScans } = useWarehouseStore();
  const { toastSuccess, toastError, toastWarning, setPageTitle } = useUIStore();
  const [dealerSearch, setDealerSearch] = useState('');
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [orderNo, setOrderNo] = useState('');
  const [shipping, setShipping] = useState(SHIPPING_METHODS[0].id);
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [codeInput, setCodeInput] = useState('');
  const [scanFlash, setScanFlash] = useState(false);
  const [lastRecord, setLastRecord] = useState<any>(null);
  const [showFrozenAlert, setShowFrozenAlert] = useState<{batchNo: string; reason: string} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dealers = db.getRawDealers() as any[];
  const filteredDealers = dealers.filter(d =>
    dName(d).includes(dealerSearch) || String(d.id || '').includes(dealerSearch) || dRegion(d).includes(dealerSearch)
  );

  useEffect(() => {
    setPageTitle('扫码出库');
    inputRef.current?.focus();
  }, [setPageTitle]);

  useEffect(() => {
    setOrderNo(`SO${dayjs().format('YYYYMMDD')}${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const outbounds = recentScans.filter(s => s.type === '出库');
  const todayCount = outbounds.length;
  const successCount = outbounds.filter(s => s.status === 'success').length;
  const totalQty = outbounds.reduce((s, r) => s + r.quantity, 0);
  const successRate = todayCount > 0 ? Math.round((successCount / todayCount) * 100) : 100;

  const handleScan = async (manualCode?: string) => {
    const code = manualCode || codeInput.trim();
    if (!code) { toastError('请输入追溯码'); inputRef.current?.focus(); return; }
    if (!selectedDealer) { toastWarning('请选择经销商'); return; }

    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 400);

    const batches = db.getRawBatches() as any[];
    const traceCodes = db.getRawTraceCodes() as any[];
    const traceCode = traceCodes.find(tc => tc.code === code);
    const batch = batches.find(b => b.batchNo === code || b.batchId === code || b.code === code) || batches.find(b => traceCode?.batchId === b.id);
    if (batch && (batch as any).frozen) {
      setShowFrozenAlert({ batchNo: batch.batchNo, reason: (batch as any).freezeReason || '质量异常' });
      toastError('出库失败', `批次 ${batch.batchNo} 已冻结，禁止出库`);
      return;
    }

    const ok = await scanOutbound(code, String(selectedDealer.id), orderNo, operator);
    if (ok) {
      const record = recentScans[0];
      const relBatch = batches.find(b => b.id === (traceCode as any)?.batchId);
      const inRecords = (db.getRawWarehouseRecords() as any[]).filter(
        r => r.traceCode === code || r.code === code || (traceCode && r.batchId === traceCode.batchId)
      );
      setLastRecord({
        code,
        productName: relBatch?.productName || record?.productName,
        batchNo: relBatch?.batchNo,
        productionDate: relBatch?.productionDate,
        expiryDate: relBatch?.expiryDate,
        level: traceCode?.level,
        dealer: selectedDealer,
        orderNo,
        shipping: SHIPPING_METHODS.find(s => s.id === shipping)?.name,
        operator,
        inRecords: inRecords.slice(0, 5),
      });
      toastSuccess('出库成功', `${traceCode?.level || '产品'}已登记出库至${selectedDealer.name}`);
      setCodeInput('');
    } else {
      toastError('出库失败', '追溯码不存在、未入库、批次冻结或已出库');
    }
    inputRef.current?.focus();
  };

  const sampleCodes = db.getRawTraceCodes().slice(20, 30);

  return (
    <div className="space-y-5">
      {showFrozenAlert && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fadeInUp">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                <Snowflake className="w-6 h-6 text-danger-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">批次已冻结</h3>
                <p className="text-sm text-gray-600 mt-1">以下批次存在异常，禁止出库流通</p>
              </div>
              <button onClick={() => setShowFrozenAlert(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">批次号</span>
                <code className="font-mono text-danger-700 font-medium">{showFrozenAlert.batchNo}</code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">冻结原因</span>
                <span className="text-danger-700 font-medium">{showFrozenAlert.reason}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">如需解冻，请在「异常召回 → 批次冻结解冻」模块操作，或联系质量部处理。</p>
              </div>
            </div>
            <button onClick={() => setShowFrozenAlert(null)} className="w-full mt-5 btn-danger py-2.5">我已了解</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/warehouse')} className="btn-secondary text-sm gap-1.5 py-1.5">
          <ArrowLeft className="w-4 h-4" /> 返回总览
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowUpFromLine className="w-6 h-6 text-primary" />
            扫码出库
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">扫描追溯码完成产品出库发货登记</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Boxes className="w-6 h-6" />} label="今日出库量" value={totalQty} color="primary" />
        <StatCard icon={<QrCode className="w-6 h-6" />} label="扫码次数" value={todayCount} color="info" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="成功次数" value={successCount} color="success" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="扫码成功率" value={`${successRate}%`} color={successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'danger'} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              出库信息配置
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">经销商</label>
                {selectedDealer ? (
                  <div className="input-base p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-primary-50 border-b border-primary-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
                          {dName(selectedDealer).charAt(0) || 'D'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{dName(selectedDealer)}</div>
                          <div className="text-xs text-gray-500">{dRegion(selectedDealer)} · {dContact(selectedDealer)}</div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedDealer(null)} className="text-xs text-gray-500 hover:text-danger">更换</button>
                    </div>
                    <div className="p-3 grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-500">资质等级</span><p className="font-medium text-trust-600 mt-0.5">{selectedDealer.level || 'A级'}</p></div>
                      <div><span className="text-gray-500">合作状态</span><p className="font-medium text-primary-600 mt-0.5">{selectedDealer.status || '正常合作'}</p></div>
                      <div><span className="text-gray-500">联系电话</span><p className="font-medium text-gray-700 mt-0.5">{selectedDealer.phone}</p></div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      className="input-base pl-10"
                      placeholder="搜索经销商名称/编号/区域..."
                      value={dealerSearch}
                      onChange={e => setDealerSearch(e.target.value)}
                    />
                    {dealerSearch && filteredDealers.length > 0 && (
                      <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white rounded-xl border shadow-xl max-h-72 overflow-auto scrollbar-thin">
                        {filteredDealers.slice(0, 8).map(d => (
                          <button
                            key={d.id}
                            onClick={() => { setSelectedDealer(d); setDealerSearch(''); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary flex items-center justify-center font-bold text-sm">{dName(d).charAt(0) || 'D'}</div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-800 text-sm">{dName(d)}</div>
                              <div className="text-xs text-gray-500">{d.id} · {dRegion(d)} · {dContact(d)}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="form-label flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> 销售订单号
                </label>
                <input className="input-base font-mono text-xs" value={orderNo} onChange={e => setOrderNo(e.target.value)} />
              </div>
              <div>
                <label className="form-label flex items-center gap-1">
                  <Truck className="w-3 h-3" /> 发货方式
                </label>
                <select className="input-base" value={shipping} onChange={e => setShipping(e.target.value)}>
                  {SHIPPING_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}（{m.desc}）</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label flex items-center gap-1">
                  <User className="w-3 h-3" /> 发货操作员
                </label>
                <select className="input-base" value={operator} onChange={e => setOperator(e.target.value)}>
                  {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={cn(
            'card p-8 transition-all duration-300',
            scanFlash && 'ring-4 ring-primary-300 bg-primary-50/30 scale-[1.01]'
          )}>
            <div className="flex flex-col items-center">
              <div className="relative w-72 h-72 mb-8">
                <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-gray-200" />
                <div className="absolute inset-5 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scanLine shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                  <div className="relative z-10 text-center">
                    <QrCode className="w-24 h-24 text-indigo-500/40 mx-auto mb-3" />
                    <p className="text-sm text-indigo-600/70 font-medium">对准追溯码扫描</p>
                    <p className="text-xs text-gray-400 mt-1">出库前将自动校验批次状态</p>
                  </div>
                </div>
                <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl" />
                <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl" />
                <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl" />
                <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl" />
                {scanning && (
                  <div className="absolute inset-0 rounded-3xl border-4 border-indigo-500 animate-pulseGlow pointer-events-none" />
                )}
              </div>

              <div className="w-full max-w-xl flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    className="input-base pl-12 pr-4 py-3 text-base"
                    placeholder="输入或扫描追溯码，回车确认..."
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScan()}
                    disabled={scanning}
                  />
                </div>
                <button
                  onClick={() => handleScan()}
                  disabled={scanning || !selectedDealer}
                  className="btn-primary px-8 gap-2 text-base disabled:opacity-50"
                >
                  {scanning ? <Clock className="w-5 h-5 animate-spin" /> : <ArrowUpFromLine className="w-5 h-5" />}
                  确认出库
                </button>
              </div>

              {!selectedDealer && (
                <p className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 请先选择经销商后再扫码出库
                </p>
              )}

              {sampleCodes.length > 0 && (
                <div className="mt-6 w-full max-w-xl">
                  <p className="text-xs text-gray-500 mb-2">💡 快速测试（点击填入）：</p>
                  <div className="flex flex-wrap gap-2">
                    {sampleCodes.slice(0, 6).map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => { setCodeInput(c.code); inputRef.current?.focus(); }}
                        className={cn(
                          'px-3 py-1 rounded-lg border text-xs font-mono transition-all hover:scale-105',
                          idx % 3 === 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                          idx % 3 === 1 ? 'bg-purple-50 border-purple-200 text-purple-700' :
                          'bg-pink-50 border-pink-200 text-pink-700'
                        )}
                      >
                        {c.level === '箱' ? <Boxes className="w-3 h-3 inline mr-1" /> :
                         c.level === '盒' ? <Package className="w-3 h-3 inline mr-1" /> :
                         <FlaskConical className="w-3 h-3 inline mr-1" />}
                        {c.code.slice(-10)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          {lastRecord && (
            <div className="card border-2 border-trust-200 bg-gradient-to-br from-trust-50/50 to-white overflow-hidden animate-fadeInUp">
              <div className="px-5 py-3 bg-trust-100/60 border-b border-trust-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-trust-600" />
                  追溯链路信息
                </h3>
                <span className="badge-status-success">出库成功</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{lastRecord.code}</code>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      lastRecord.level === '箱' ? 'bg-blue-100 text-blue-700' :
                      lastRecord.level === '盒' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    )}>{lastRecord.level}级码</span>
                  </div>
                  <p className="text-base font-bold text-gray-800">{lastRecord.productName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">批次号</span>
                    <code className="block mt-1 text-sm font-mono text-gray-800">{lastRecord.batchNo}</code>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">生产日期</span>
                    <p className="mt-1 text-sm font-medium text-gray-800">{lastRecord.productionDate}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">有效期</span>
                    <p className="mt-1 text-sm font-medium text-trust-600">{lastRecord.expiryDate}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">发货方式</span>
                    <p className="mt-1 text-sm font-medium text-gray-800">{lastRecord.shipping}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-dashed border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">📍 流转链路</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
                      <div className="flex-1"><span className="text-gray-500">生产</span> <span className="font-medium text-gray-700">批次 {lastRecord.batchNo}</span></div>
                      <span className="text-gray-400">{lastRecord.productionDate}</span>
                    </div>
                    {lastRecord.inRecords?.slice(0, 2).map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-trust-100 text-trust flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</div>
                        <div className="flex-1"><span className="text-gray-500">入库</span> <span className="font-medium text-gray-700">{r.warehouseName} {r.location}</span></div>
                        <span className="text-gray-400">{dayjs(r.createTime).format('MM-DD')}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</div>
                      <div className="flex-1"><span className="text-gray-500">出库</span> <span className="font-medium text-gray-700">{lastRecord.dealer.name}</span></div>
                      <span className="text-primary-600 font-medium">刚刚</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                扫码出库记录
              </h3>
              <div className="flex gap-2">
                {todayCount > 0 && (
                  <button
                    onClick={() => { clearRecentScans(); toastSuccess('已清空', '出库记录已清空'); setLastRecord(null); }}
                    className="text-xs text-gray-500 hover:text-danger flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 清空
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[420px] overflow-auto scrollbar-thin">
              {outbounds.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <QrCode className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm">暂无扫码出库记录</p>
                  <p className="text-xs text-gray-400 mt-1">选择经销商后开始扫码</p>
                </div>
              ) : (
                [...outbounds].slice(0, 20).map((scan, idx) => (
                  <div
                    key={scan.id}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all stagger-item',
                      scan.status === 'success'
                        ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-white'
                        : 'border-danger-200 bg-gradient-to-r from-danger-50/60 to-white'
                    )}
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {scan.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-trust-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-danger-600 flex-shrink-0" />
                          )}
                          <code className="text-xs font-mono text-gray-700 truncate bg-white px-2 py-0.5 rounded border border-gray-200 flex-1">{scan.code}</code>
                          <span className={scan.status === 'success' ? 'badge-status-success' : 'badge-status-danger'}>
                            {scan.status === 'success' ? '成功' : '失败'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium truncate">{scan.message}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                          <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{scan.operator}</span>
                          <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{selectedDealer?.name?.slice(0, 8) || '经销商'}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{dayjs(scan.time).format('HH:mm:ss')}</span>
                        </div>
                      </div>
                      {scan.quantity > 0 && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-indigo-600">-{scan.quantity}</div>
                          <div className="text-[10px] text-gray-400">件数</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: 'primary' | 'success' | 'warning' | 'danger' | 'info' }) {
  const colorMap: any = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-700', icon: 'text-primary', ring: 'ring-primary-100' },
    success: { bg: 'bg-trust-50', text: 'text-trust-700', icon: 'text-trust', ring: 'ring-trust-100' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-700', icon: 'text-warning', ring: 'ring-warning-100' },
    danger: { bg: 'bg-danger-50', text: 'text-danger-700', icon: 'text-danger', ring: 'ring-danger-100' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', ring: 'ring-blue-100' },
  }[color];
  return (
    <div className={cn('card p-5 flex items-center gap-4 ring-1', colorMap.bg, colorMap.ring)}>
      <div className={cn('p-3 rounded-xl bg-white shadow-sm', colorMap.icon)}>{icon}</div>
      <div>
        <div className={cn('text-2xl font-bold', colorMap.text)}>{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
