import { useState, useEffect, useRef } from 'react';
import {
  ArrowDownToLine,
  MapPin,
  User,
  Package,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Trash2,
  FileText,
  ArrowLeft,
  Boxes,
  FlaskConical,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useUIStore } from '@/stores/uiStore';
import { db } from '@/services/mock/database';
import { cn } from '@/lib/utils';

const OPERATORS = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆'];
const WAREHOUSES = ['一号成品仓', '二号成品仓', '冷链仓库', '原料仓库A区', '原料仓库B区'];
const LOCATIONS = ['A-01-01', 'A-02-03', 'A-03-05', 'B-01-02', 'B-02-04', 'B-03-01', 'C-01-03', 'C-02-01', 'D-01-02', 'D-02-04'];

export default function WarehouseInPage() {
  const navigate = useNavigate();
  const { recentScans, scanInbound, scanning, clearRecentScans } = useWarehouseStore();
  const { toastSuccess, toastError, setPageTitle } = useUIStore();
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [operator, setOperator] = useState(OPERATORS[0]);
  const [codeInput, setCodeInput] = useState('');
  const [scanFlash, setScanFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageTitle('扫码入库');
    inputRef.current?.focus();
  }, [setPageTitle]);

  const inbounds = recentScans.filter(s => s.type === '入库');
  const todayCount = inbounds.length;
  const successCount = inbounds.filter(s => s.status === 'success').length;
  const totalQty = inbounds.reduce((s, r) => s + r.quantity, 0);
  const successRate = todayCount > 0 ? Math.round((successCount / todayCount) * 100) : 100;

  const handleScan = async (manualCode?: string) => {
    const code = manualCode || codeInput.trim();
    if (!code) {
      toastError('请输入追溯码');
      inputRef.current?.focus();
      return;
    }
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 400);
    const ok = await scanInbound(code, warehouse, location, operator);
    if (ok) {
      toastSuccess('入库成功', `追溯码 ${code.slice(-10)} 已入库至 ${warehouse}/${location}`);
      setCodeInput('');
    } else {
      toastError('入库失败', '追溯码不存在、已入库或状态异常');
    }
    inputRef.current?.focus();
  };

  const sampleCodes = db.getRawTraceCodes().slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/warehouse')} className="btn-secondary text-sm gap-1.5 py-1.5">
          <ArrowLeft className="w-4 h-4" /> 返回总览
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowDownToLine className="w-6 h-6 text-primary" />
            扫码入库
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">扫描追溯码完成成品入库登记</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Package className="w-6 h-6" />} label="今日入库量" value={totalQty} color="primary" />
        <StatCard icon={<QrCode className="w-6 h-6" />} label="扫码次数" value={todayCount} color="info" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="成功次数" value={successCount} color="success" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="扫码成功率" value={`${successRate}%`} color={successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'danger'} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              入库信息配置
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">目标仓库</label>
                <select className="input-base" value={warehouse} onChange={e => setWarehouse(e.target.value)}>
                  {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">存放库位</label>
                <select className="input-base" value={location} onChange={e => setLocation(e.target.value)}>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">操作人员</label>
                <select className="input-base" value={operator} onChange={e => setOperator(e.target.value)}>
                  {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={cn(
            'card p-8 transition-all duration-300',
            scanFlash && 'ring-4 ring-trust-300 bg-trust-50/30 scale-[1.01]'
          )}>
            <div className="flex flex-col items-center">
              <div className="relative w-72 h-72 mb-8">
                <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-gray-200" />
                <div className="absolute inset-5 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary-50/60 to-blue-50/40 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scanLine shadow-[0_0_20px_rgba(30,111,219,0.5)]" />
                  <div className="relative z-10 text-center">
                    <QrCode className="w-24 h-24 text-primary/40 mx-auto mb-3" />
                    <p className="text-sm text-primary/70 font-medium">对准追溯码扫描</p>
                    <p className="text-xs text-gray-400 mt-1">或在下方手动输入</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
                </div>
                <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                {scanning && (
                  <div className="absolute inset-0 rounded-3xl border-4 border-primary animate-pulseGlow pointer-events-none" />
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
                  disabled={scanning}
                  className="btn-primary px-8 gap-2 text-base"
                >
                  {scanning ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  确认入库
                </button>
              </div>

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
                          idx % 3 === 0 ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          idx % 3 === 1 ? 'bg-green-50 border-green-200 text-green-700' :
                          'bg-purple-50 border-purple-200 text-purple-700'
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
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                扫码入库记录
              </h3>
              <div className="flex gap-2">
                {todayCount > 0 && (
                  <button
                    onClick={() => { clearRecentScans(); toastSuccess('已清空', '入库记录已清空'); }}
                    className="text-xs text-gray-500 hover:text-danger flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 清空
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[560px] overflow-auto scrollbar-thin">
              {inbounds.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <QrCode className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm">暂无扫码入库记录</p>
                  <p className="text-xs text-gray-400 mt-1">使用扫码枪或手动输入追溯码</p>
                </div>
              ) : (
                [...inbounds].slice(0, 20).map((scan, idx) => (
                  <div
                    key={scan.id}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all stagger-item',
                      scan.status === 'success'
                        ? 'border-trust-200 bg-gradient-to-r from-trust-50/60 to-white'
                        : 'border-danger-200 bg-gradient-to-r from-danger-50/60 to-white'
                    )}
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {scan.status === 'success' ? (
                            <div className="w-7 h-7 rounded-full bg-trust-100 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-trust-600" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                              <XCircle className="w-4 h-4 text-danger-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <code className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded border border-gray-200 truncate block w-fit">
                              {scan.code}
                            </code>
                          </div>
                          <span className={scan.status === 'success' ? 'badge-status-success' : 'badge-status-danger'}>
                            {scan.status === 'success' ? '成功' : '失败'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium truncate">{scan.message}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />{scan.operator}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{warehouse} {location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />{dayjs(scan.time).format('HH:mm:ss')}
                          </span>
                        </div>
                      </div>
                      {scan.quantity > 0 && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-primary">+{scan.quantity}</div>
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
