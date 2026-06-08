import { useState, useEffect, useMemo } from 'react';
import {
  FileWarning, Target, Snowflake, BarChart3, Map as MapIcon, Plus, ChevronDown, ChevronRight, X,
  Eye, Edit, AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Clock, Download,
  Search, Building2, Calendar, User, RotateCcw, Upload, TrendingUp, EyeOff, ZoomIn, Package,
  Boxes, FlaskConical,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useRecallStore } from '@/stores/recallStore';
import { useUIStore } from '@/stores/uiStore';
import { db } from '@/services/mock/database';
import { cn } from '@/lib/utils';
const RECALL_TABS = [
  { key: 'tickets', icon: FileWarning, label: '异常工单' },
  { key: 'scope', icon: Target, label: '召回范围' },
  { key: 'freeze', icon: Snowflake, label: '批次冻结解冻' },
  { key: 'progress', icon: BarChart3, label: '召回进度' },
  { key: 'channeling', icon: MapIcon, label: '窜货分析' },
] as const;

type TabKey = typeof RECALL_TABS[number]['key'];

const ANOMALY_TYPES = [
  { id: 'quality', name: '质量异常' }, { id: 'packaging', name: '包装缺陷' },
  { id: 'labeling', name: '标识错误' }, { id: 'expiry', name: '效期问题' },
  { id: 'complaint', name: '客户投诉' }, { id: 'other', name: '其他异常' },
];

const LEVEL_LABELS: Record<string, string> = {
  urgent: '一级召回', important: '二级召回', general: '三级召回',
  '一级召回': '一级召回', '二级召回': '二级召回', '三级召回': '三级召回',
};
const LEVEL_COLORS: Record<string, string> = {
  urgent: 'bg-danger-100 text-danger-700 border-danger-200',
  '一级召回': 'bg-danger-100 text-danger-700 border-danger-200',
  important: 'bg-warning-100 text-warning-700 border-warning-200',
  '二级召回': 'bg-warning-100 text-warning-700 border-warning-200',
  general: 'bg-primary-100 text-primary-700 border-primary-200',
  '三级召回': 'bg-primary-100 text-primary-700 border-primary-200',
};

const STATUS_LABELS: Record<string, string> = {
  investigating: '调查中', recalling: '召回中', completed: '已完成', cancelled: '已取消',
  待启动: '待启动', 召回中: '召回中', 已完成: '已完成', 已取消: '已取消',
};
const STATUS_COLORS: Record<string, string> = {
  investigating: 'bg-amber-100 text-amber-700 border-amber-200',
  待启动: 'bg-amber-100 text-amber-700 border-amber-200',
  recalling: 'bg-primary-100 text-primary-700 border-primary-200',
  召回中: 'bg-primary-100 text-primary-700 border-primary-200',
  completed: 'bg-trust-100 text-trust-700 border-trust-200',
  已完成: 'bg-trust-100 text-trust-700 border-trust-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  已取消: 'bg-gray-100 text-gray-600 border-gray-200',
};

const RECALL_STAGES = ['notify', 'feedback', 'recover', 'destroy'] as const;
const RecallStageLabel: Record<string, string> = {
  notify: '通知下发', feedback: '经销商反馈', recover: '产品回收', destroy: '销毁处理',
};
const RecallProgressStatusLabel: Record<string, string> = {
  pending: '待处理', doing: '进行中', done: '已完成',
  待处理: '待处理', 进行中: '进行中', 已完成: '已完成',
};
const PROVINCES = ['北京','上海','广东','江苏','浙江','山东','河南','四川','湖北','湖南','河北','福建','安徽','辽宁','陕西','江西','重庆','广西','云南','山西','贵州','黑龙江','吉林','新疆','甘肃','内蒙古','海南','宁夏','青海','西藏','天津'];

export default function RecallPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('tickets');
  const { setPageTitle } = useUIStore();
  useEffect(() => { setPageTitle('异常召回中心'); }, [setPageTitle]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-danger" /> 异常召回中心
        </h1>
        <p className="text-sm text-gray-500 mt-1">质量异常处理、批次追溯召回、窜货监控分析</p>
      </div>
      <div className="flex gap-2 p-1 bg-gray-100/70 rounded-xl overflow-x-auto scrollbar-thin">
        {RECALL_TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all',
              active ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
            )}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === 'tickets' && <TicketsTab />}
      {activeTab === 'scope' && <ScopeTab />}
      {activeTab === 'freeze' && <FreezeTab />}
      {activeTab === 'progress' && <ProgressTab />}
      {activeTab === 'channeling' && <ChannelingTab />}
    </div>
  );
}

/* ================== Tab1 异常工单 ================== */
function TicketsTab() {
  const { orders, loadOrders, createOrder, submitting, updateStatus, currentOrder, loadOrder, progress } = useRecallStore();
  const { toastSuccess, toastError } = useUIStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', type: 'quality', level: 'general', reason: '', batches: [] as string[] });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const batches = db.getRawBatches();
  useEffect(() => { loadOrders(); }, [loadOrders]);
  const filtered = orders.filter(o => filterStatus === 'all' || o.status === filterStatus);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.reason.trim() || form.batches.length === 0) {
      toastError('请完整填写表单', '标题、原因、涉事批次为必填项'); return;
    }
    const affectedBatchDetails = form.batches.map(id => {
      const b = batches.find(x => x.id === id) as any;
      return { batchId: id, batchNo: b?.batchNo || '', productName: b?.productName || '', spec: '', productionDate: '', affectedQty: 0 };
    });
    const r = await createOrder({
      title: form.title, reason: form.reason, level: form.level,
      affectedBatches: form.batches, affectedRegions: [], initiator: '系统管理员',
      status: 'investigating', description: `异常类型：${ANOMALY_TYPES.find(t => t.id === form.type)?.name}`,
      affectedBatchDetails, recallNo: `RC${dayjs().format('YYYYMMDD')}${Math.floor(1000 + Math.random() * 9000)}`,
    } as any);
    if (r) {
      toastSuccess('工单已创建', `召回单号 ${((r as any).recallNo || (r as any).orderNo)}`);
      setShowCreate(false);
      setForm({ title: '', type: 'quality', level: 'general', reason: '', batches: [] });
    }
  };

  const openDetail = async (id: string) => { await loadOrder(id); setShowDetail(id); };
  const statusMatches = (s: any, t: string) => {
    if (t === 'all') return true;
    if (s === t) return true;
    const map: Record<string, string> = { investigating: '调查中', recalling: '召回中', completed: '已完成', cancelled: '已取消' };
    return map[t] === s;
  };
  const updateTicketStatus = async (id: string, next: string) => {
    const ok = await updateStatus(id, next as any);
    if (ok) toastSuccess('状态已更新', `工单状态：${STATUS_LABELS[next]}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'investigating', 'recalling', 'completed', 'cancelled'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
              filterStatus === s ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
            )}>
              {s === 'all' ? '全部工单' : STATUS_LABELS[s]}
              <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded', filterStatus === s ? 'bg-white/20' : 'bg-gray-100')}>
                {s === 'all' ? orders.length : orders.filter(o => statusMatches(o.status, s)).length}
              </span>
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2"><Plus className="w-4 h-4" /> 新建工单</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3.5 font-medium text-gray-700">工单号</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-700">标题</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-700">等级</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-700">涉事批次</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-700">状态</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-700">发起时间</th>
              <th className="text-right px-5 py-3.5 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-gray-400"><FileWarning className="w-12 h-12 mx-auto mb-2 opacity-30" />暂无工单</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="hover:bg-primary-50/40 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-primary-700 font-bold">{((o as any).recallNo || (o as any).orderNo)}</td>
                <td className="px-5 py-3.5"><div className="font-medium text-gray-800 max-w-xs truncate">{((o as any).title || (o as any).productName || '未命名工单')}</div><div className="text-xs text-gray-500 truncate">{o.reason}</div></td>
                <td className="px-5 py-3.5"><span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', LEVEL_COLORS[o.level])}>{LEVEL_LABELS[o.level]}</span></td>
                <td className="px-5 py-3.5 text-xs font-mono text-gray-600 max-w-[100px] truncate">{(((o as any).affectedBatchDetails || []) || []).map(b => b.batchNo).slice(0, 2).join('、')}{(((o as any).affectedBatchDetails || []) || []).length > 2 ? `+${(((o as any).affectedBatchDetails || []) || []).length - 2}` : ''}</td>
                <td className="px-5 py-3.5"><span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS[o.status])}>{STATUS_LABELS[o.status]}</span></td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{dayjs(o.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                  <button onClick={() => openDetail(o.id)} className="btn-ghost text-xs py-1 px-2"><Eye className="w-3.5 h-3.5 inline mr-1" />详情</button>
                  {statusMatches(o.status, 'investigating') && <button onClick={() => updateTicketStatus(o.id, 'recalling')} className="btn-ghost text-xs py-1 px-2 text-primary">发起召回</button>}
                  {statusMatches(o.status, 'recalling') && <button onClick={() => updateTicketStatus(o.id, 'completed')} className="btn-ghost text-xs py-1 px-2 text-trust-600">完成</button>}
                  {statusMatches(o.status, 'investigating') && <button onClick={() => updateTicketStatus(o.id, 'cancelled')} className="btn-ghost text-xs py-1 px-2 text-gray-500">取消</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-fadeInUp overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> 新建异常工单</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5 overflow-auto">
              <div><label className="form-label">工单标题 *</label><input className="input-base" placeholder="例：2024年05月批次布洛芬片溶出度异常" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">异常类型</label><select className="input-base" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{ANOMALY_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                <div>
                  <label className="form-label">严重等级</label>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['general', 'important', 'urgent'] as const).map(l => (
                      <label key={l} className={cn('flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all', form.level === l ? cn(LEVEL_COLORS[l], 'ring-2') : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}>
                        <input type="radio" className="hidden" checked={form.level === l} onChange={() => setForm({ ...form, level: l })} />{LEVEL_LABELS[l]}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div><label className="form-label">原因描述 *</label><textarea className="input-base min-h-[80px]" placeholder="请详细描述异常情况..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
              <div>
                <label className="form-label">涉事批次 * <span className="text-xs text-gray-400 ml-2">已选 {form.batches.length} 个</span></label>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-auto scrollbar-thin divide-y divide-gray-100">
                  {batches.map((b: any) => (
                    <label key={b.id} className={cn('flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 cursor-pointer', form.batches.includes(b.id) && 'bg-primary-50')}>
                      <input type="checkbox" checked={form.batches.includes(b.id)} onChange={e => setForm({ ...form, batches: e.target.checked ? [...form.batches, b.id] : form.batches.filter(x => x !== b.id) })} className="w-4 h-4" />
                      <code className="text-xs font-mono text-primary-700">{b.batchNo}</code>
                      <span className="text-sm text-gray-700 flex-1">{b.productName}</span>
                      <span className="text-xs text-gray-500">{b.productionDate}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">取消</button>
              <button onClick={handleCreate} disabled={submitting} className="btn-primary gap-2">{submitting && <Clock className="w-4 h-4 animate-spin" />}确认创建</button>
            </div>
          </div>
        </div>
      )}

      {showDetail && currentOrder && currentOrder.id === showDetail && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeInUp">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetail(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">工单详情</h3>
              <button onClick={() => setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className={cn('p-4 rounded-xl border', LEVEL_COLORS[currentOrder.level])}>
                <div className="flex items-center justify-between mb-2"><code className="text-sm font-mono font-bold">{((currentOrder as any).recallNo || (currentOrder as any).orderNo)}</code><span className="text-xs font-medium">{LEVEL_LABELS[currentOrder.level]}</span></div>
                <h4 className="text-base font-bold text-gray-800 mb-1">{((currentOrder as any).title || (currentOrder as any).productName || '未命名工单')}</h4>
                <p className="text-xs opacity-80">{currentOrder.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">状态</span><p className="text-sm font-bold mt-1 text-primary-600">{STATUS_LABELS[currentOrder.status]}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">发起人</span><p className="text-sm font-bold mt-1 text-gray-800">{currentOrder.initiator}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">发起时间</span><p className="text-sm font-medium mt-1 text-gray-800">{dayjs(currentOrder.createdAt).format('YYYY-MM-DD HH:mm')}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-500">批次</span><p className="text-sm font-bold mt-1 text-primary-600">{(Array.isArray((currentOrder as any).affectedBatches) ? (currentOrder as any).affectedBatches.length : ((currentOrder as any).batchId ? 1 : 0))} 个</p></div>
              </div>
              <div>
                <h5 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> 涉事批次详情</h5>
                <div className="space-y-2">
                  {(((currentOrder as any).affectedBatchDetails || []) || []).map(b => (
                    <div key={String(b.batchId)} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1"><code className="text-xs font-mono text-primary-700 font-bold">{b.batchNo}</code><span className="text-xs text-gray-500">{String(b.productionDate).slice(0, 10)}</span></div>
                      <p className="text-sm text-gray-800 font-medium">{b.productName}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-warning" /> 操作历史</h5>
                <div className="relative pl-5 border-l-2 border-gray-200 space-y-4">
                  {[
                    { time: currentOrder.createdAt, title: '工单创建', desc: `由 ${currentOrder.initiator} 发起，涉事批次 ${(Array.isArray((currentOrder as any).affectedBatches) ? (currentOrder as any).affectedBatches.length : ((currentOrder as any).batchId ? 1 : 0))} 个`, color: 'primary' },
                    ...(progress.length > 0 ? [{ time: new Date(), title: '通知已下发', desc: `通知 ${progress.length} 家经销商/门店`, color: 'info' as const }] : []),
                    { time: new Date(), title: '状态更新', desc: `当前状态：${STATUS_LABELS[currentOrder.status]}`, color: 'warning' as const },
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={cn('absolute -left-[26px] top-0.5 w-4 h-4 rounded-full border-2 border-white', step.color === 'primary' ? 'bg-primary' : step.color === 'info' ? 'bg-blue-500' : 'bg-warning')} />
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1"><p className="text-sm font-medium text-gray-800">{step.title}</p><span className="text-[10px] text-gray-500">{dayjs(step.time).format('MM-DD HH:mm')}</span></div>
                        <p className="text-xs text-gray-600">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50"><button onClick={() => setShowDetail(null)} className="btn-secondary">关闭</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== Tab2 召回范围 ================== */
function ScopeTab() {
  const { createOrder, submitting } = useRecallStore();
  const { toastSuccess, toastWarning, toastError } = useUIStore();
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [dateEnd, setDateEnd] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedDealers, setSelectedDealers] = useState<string[]>([]);
  const [dealerSearch, setDealerSearch] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [title, setTitle] = useState(''); const [level, setLevel] = useState<string>('important'); const [reason, setReason] = useState('');
  const batches = db.getRawBatches();
  const allDealers = db.getRawDealers();
  const filteredDealers = allDealers.filter(d => !dealerSearch || ((d as any).dealerName || (d as any).name).includes(dealerSearch) || ((d as any).city || (d as any).region).includes(dealerSearch));

  const provinceHeatOption: any = useMemo(() => ({
    tooltip: { trigger: 'axis' }, grid: { top: 15, right: 15, bottom: 30, left: 40 },
    xAxis: { type: 'category', data: PROVINCES.slice(0, 12), axisLabel: { rotate: 35, fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: PROVINCES.slice(0, 12).map((p, i) => ({ value: Math.floor(Math.random() * 200 + 20), itemStyle: { color: selectedProvinces.includes(p) ? '#ef4444' : '#60a5fa' } })), barWidth: '65%' }],
  }), [selectedProvinces]);

  const stats = useMemo(() => {
    const codes = db.getRawTraceCodes().filter(tc => selectedBatches.length === 0 || selectedBatches.includes((tc as any).batchId));
    const related = selectedDealers.length > 0 ? allDealers.filter(d => selectedDealers.includes(d.id))
      : selectedProvinces.length > 0 ? allDealers.filter(d => selectedProvinces.some(p => ((d as any).city || (d as any).region).includes(p))) : allDealers;
    const stores = db.getRawStores().filter(s => selectedProvinces.length === 0 || selectedProvinces.some(p => (s as any).region?.includes(p)));
    return { totalCodes: codes.length, products: new Set(codes.map(c => (c as any).batchId).filter(Boolean)).size || batches.length, dealers: related.length, stores: stores.length };
  }, [selectedBatches, selectedProvinces, selectedDealers, batches, allDealers]);

  const toggleProvince = (p: string) => setSelectedProvinces(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const launchRecall = async () => {
    if (selectedBatches.length === 0) { toastWarning('请选择涉事批次'); return; }
    if (!title.trim() || !reason.trim()) { toastWarning('请填写标题和原因'); return; }
    const affectedBatchDetails = selectedBatches.map(id => { const b = batches.find(x => x.id === id) as any; return { batchId: id, batchNo: b?.batchNo, productName: b?.productName, spec: '', productionDate: b?.productionDate, affectedQty: 0 }; });
    const r = await createOrder({ title, reason, level, affectedBatches: selectedBatches, affectedRegions: selectedProvinces, initiator: '系统管理员', status: 'recalling', description: `召回覆盖：${stats.dealers}家经销商`, affectedBatchDetails, recallNo: `RC${dayjs().format('YYYYMMDD')}${Math.floor(1000 + Math.random() * 9000)}` } as any);
    if (r) { toastSuccess('召回已发起', `单号 ${((r as any).recallNo || (r as any).orderNo)}`); setShowConfirm(false); setSelectedBatches([]); setSelectedProvinces([]); setSelectedDealers([]); setTitle(''); setReason(''); }
    else toastError('召回发起失败');
  };
  const exportList = () => toastSuccess('导出成功', `召回清单.xlsx 已生成（${selectedBatches.length}个批次）`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '追溯码总数', value: stats.totalCodes.toLocaleString(), icon: Target, color: 'from-primary-500 to-blue-600' },
          { label: '产品数量', value: `${stats.products} 款`, icon: Package, color: 'from-blue-500 to-indigo-600' },
          { label: '覆盖经销商', value: `${stats.dealers} 家`, icon: Building2, color: 'from-trust-500 to-emerald-600' },
          { label: '覆盖门店', value: `${stats.stores} 家`, icon: MapIcon, color: 'from-warning-500 to-amber-600' },
        ].map((s, i) => { const SC = s.icon; return (
          <div key={i} className="card p-5 relative overflow-hidden">
            <div className={cn('absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-gradient-to-br', s.color)} />
            <div className="relative flex items-start justify-between">
              <div><div className="text-xs text-gray-500 mb-1">{s.label}</div><div className="text-3xl font-bold text-gray-800">{s.value}</div></div>
              <div className={cn('p-2.5 rounded-xl bg-gradient-to-br text-white', s.color)}><SC className="w-5 h-5" /></div>
            </div>
          </div>
        ); })}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-primary" /> 批次多选 <span className="ml-auto text-xs text-gray-400 font-normal">已选 {selectedBatches.length}</span></h3>
          <div className="max-h-60 overflow-auto scrollbar-thin divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {batches.map((b: any) => (
              <label key={b.id} className={cn('flex items-center gap-2 px-3 py-2 hover:bg-primary-50 cursor-pointer text-xs', selectedBatches.includes(b.id) && 'bg-primary-50')}>
                <input type="checkbox" checked={selectedBatches.includes(b.id)} onChange={e => setSelectedBatches(e.target.checked ? [...selectedBatches, b.id] : selectedBatches.filter(x => x !== b.id))} className="w-3.5 h-3.5" />
                <code className="font-mono text-primary-700">{b.batchNo.slice(-6)}</code>
                <span className="text-gray-700 flex-1 truncate">{b.productName}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> 日期范围</h3>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-500">开始</label><input type="date" className="input-base mt-1 text-sm" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div>
            <div><label className="text-xs text-gray-500">结束</label><input type="date" className="input-base mt-1 text-sm" value={dateEnd} onChange={e => setDateEnd(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-100">
              {[['7天', 7], ['30天', 30], ['90天', 90], ['本季', 120]].map(([n, d]) => (
                <button key={n as string} onClick={() => { setDateStart(dayjs().subtract(d as number, 'day').format('YYYY-MM-DD')); setDateEnd(dayjs().format('YYYY-MM-DD')); }} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50">{n as string}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5"><MapIcon className="w-4 h-4 text-primary" /> 省份 <span className="ml-auto text-xs text-gray-400 font-normal">已选 {selectedProvinces.length}</span></h3>
          <div className="mb-2"><ReactECharts option={provinceHeatOption} style={{ height: 160 }} /></div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto scrollbar-thin">
            {PROVINCES.slice(0, 20).map(p => (
              <button key={p} onClick={() => toggleProvince(p)} className={cn('text-xs px-2 py-1 rounded-md border transition-all', selectedProvinces.includes(p) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300')}>{p}</button>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> 经销商 <span className="ml-auto text-xs text-gray-400 font-normal">已选 {selectedDealers.length}</span></h3>
          <div className="relative mb-2"><Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" /><input className="input-base pl-9 py-2 text-sm" placeholder="搜索..." value={dealerSearch} onChange={e => setDealerSearch(e.target.value)} /></div>
          <div className="max-h-56 overflow-auto scrollbar-thin divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {filteredDealers.slice(0, 30).map(d => (
              <label key={d.id} className={cn('flex items-center gap-2 px-3 py-2 hover:bg-primary-50 cursor-pointer text-xs', selectedDealers.includes(d.id) && 'bg-primary-50')}>
                <input type="checkbox" checked={selectedDealers.includes(d.id)} onChange={e => setSelectedDealers(e.target.checked ? [...selectedDealers, d.id] : selectedDealers.filter(x => x !== d.id))} className="w-3.5 h-3.5" />
                <span className="text-gray-800 flex-1 truncate">{((d as any).dealerName || (d as any).name)}</span><span className="text-gray-400 text-[10px]">{((d as any).city || (d as any).region)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> 召回清单</h3>
          <div className="flex gap-2">
            <button onClick={exportList} className="btn-secondary text-xs gap-1.5 py-1.5"><Download className="w-3.5 h-3.5" /> 导出</button>
            <button onClick={() => setShowConfirm(true)} disabled={selectedBatches.length === 0} className="btn-danger text-xs gap-1.5 py-1.5 disabled:opacity-50"><Target className="w-3.5 h-3.5" /> 发起召回</button>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200"><tr>
            <th className="w-10 px-4 py-2.5 text-left"><input type="checkbox" className="w-3.5 h-3.5" /></th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-700">批次号</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-700">产品名</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-700">生产日</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-700">有效期</th>
            <th className="text-right px-4 py-2.5 font-medium text-gray-700">追溯码数</th>
            <th className="text-right px-4 py-2.5 font-medium text-gray-700">经销商</th>
            <th className="text-right px-4 py-2.5 font-medium text-gray-700">门店</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {batches.slice(0, 12).map((b: any, idx) => {
              const n = db.getRawTraceCodes().filter(tc => (tc as any).batchId === b.id).length;
              return (
                <tr key={b.id} className={cn('hover:bg-primary-50/40', selectedBatches.includes(b.id) && 'bg-primary-50/60')}>
                  <td className="px-4 py-2.5"><input type="checkbox" checked={selectedBatches.includes(b.id)} onChange={e => setSelectedBatches(e.target.checked ? [...selectedBatches, b.id] : selectedBatches.filter(x => x !== b.id))} className="w-3.5 h-3.5" /></td>
                  <td className="px-4 py-2.5 font-mono text-primary-700 font-medium">{b.batchNo}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{b.productName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.productionDate}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.expiryDate}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-gray-700">{n}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-trust-600">{3 + (idx % 5)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-warning-600">{10 + (idx % 15)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fadeInUp overflow-hidden">
            <div className="bg-gradient-to-r from-danger-500 to-red-600 px-6 py-5 text-white"><h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> 发起召回确认</h3><p className="text-xs mt-1 opacity-80">召回通知将立即下发至所有涉及经销商</p></div>
            <div className="p-6 space-y-4">
              <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 space-y-2 text-sm">
                {[['涉事批次', `${selectedBatches.length} 个`], ['涉及区域', `${selectedProvinces.length} 个省份`], ['通知经销商', `${stats.dealers} 家`], ['追溯码总数', stats.totalCodes.toLocaleString()]].map(([l, v]) => (
                  <div key={l} className="flex justify-between"><span className="text-gray-600">{l}</span><span className="font-bold text-gray-800">{v}</span></div>
                ))}
              </div>
              <div><label className="form-label">召回标题 *</label><input className="input-base" placeholder="例：关于BP2024批次产品紧急召回的通知" value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div>
                <label className="form-label">召回级别</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['general', 'important', 'urgent'] as const).map(l => (
                    <button key={l} onClick={() => setLevel(l)} className={cn('px-3 py-2 rounded-lg border text-sm font-medium', level === l ? LEVEL_COLORS[l] : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}>{LEVEL_LABELS[l]}</button>
                  ))}
                </div>
              </div>
              <div><label className="form-label">召回原因 *</label><textarea className="input-base min-h-[72px]" placeholder="问题描述、风险说明、处理要求..." value={reason} onChange={e => setReason(e.target.value)} /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">取消</button>
              <button onClick={launchRecall} disabled={submitting} className="btn-danger gap-2">{submitting && <Clock className="w-4 h-4 animate-spin" />}确认发起</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== Tab3 批次冻结解冻 ================== */
function FreezeTab() {
  const { freezeBatch, unfreezeBatch, submitting } = useRecallStore();
  const { toastSuccess } = useUIStore();
  const [batches, setBatches] = useState(() => db.getRawBatches().map((b: any, i: number) => ({
    ...b, frozen: i % 7 === 0 || i % 11 === 0,
    freezeTime: i % 7 === 0 ? dayjs().subtract(1 + i, 'day').format('YYYY-MM-DD HH:mm') : null,
    freezeReason: i % 7 === 0 ? '客户投诉：产品存在变色沉淀' : i % 11 === 0 ? '质量抽检不合格：含量超标' : '',
    freezeBy: i % 7 === 0 ? '质量部-王丽' : i % 11 === 0 ? 'QA-李明' : '',
    freezing: false, unfreezing: false,
  })));
  const [showFreeze, setShowFreeze] = useState<string | null>(null);
  const [freezeReasonInput, setFreezeReasonInput] = useState('');
  const [showUnfreeze, setShowUnfreeze] = useState<string | null>(null);
  const [filterFrozen, setFilterFrozen] = useState<'all' | 'frozen' | 'normal'>('all');
  const filtered = batches.filter(b => filterFrozen === 'all' ? true : filterFrozen === 'frozen' ? b.frozen : !b.frozen);
  const frozenCount = batches.filter(b => b.frozen).length;

  const doFreeze = async (id: string) => {
    if (!freezeReasonInput.trim()) return;
    setBatches(prev => prev.map(b => b.id === id ? { ...b, freezing: true } : b));
    await new Promise(r => setTimeout(r, 900));
    await freezeBatch(id);
    setBatches(prev => prev.map(b => b.id === id ? { ...b, frozen: true, freezing: false, freezeReason: freezeReasonInput, freezeTime: dayjs().format('YYYY-MM-DD HH:mm'), freezeBy: '当前操作员' } : b));
    setShowFreeze(null); toastSuccess('批次已冻结', `冻结原因：${freezeReasonInput}`);
  };
  const doUnfreeze = async (id: string) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, unfreezing: true } : b));
    await new Promise(r => setTimeout(r, 600));
    await unfreezeBatch(id);
    setBatches(prev => prev.map(b => b.id === id ? { ...b, frozen: false, unfreezing: false, freezeReason: '', freezeTime: null, freezeBy: '' } : b));
    setShowUnfreeze(null); toastSuccess('批次已解冻');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {[['all', '全部', batches.length], ['frozen', '已冻结', frozenCount], ['normal', '正常', batches.length - frozenCount]].map(([k, l, c]) => (
            <button key={k as string} onClick={() => setFilterFrozen(k as any)} className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-all', filterFrozen === k ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300')}>
              {l as string}<span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded', filterFrozen === k ? 'bg-white/20' : 'bg-gray-100')}>{c as number}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1"><Snowflake className="w-3.5 h-3.5" /> 冻结批次将禁止任何出库操作</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((b: any) => (
          <div key={b.id} className={cn('card relative overflow-hidden transition-all duration-500', b.freezing && 'animate-pulseGlow border-danger-400', b.unfreezing && 'animate-pulseGlow border-trust-400')}>
            {(b.frozen || b.freezing) && (
              <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none bg-gradient-to-br from-blue-100/30 via-cyan-100/20 to-indigo-100/30">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute animate-freezeDrop" style={{ left: `${(i * 8.3 + 5) % 100}%`, top: `${-10 - (i * 7) % 30}%`, fontSize: `${10 + (i % 4) * 4}px`, animationDelay: `${(i * 0.12) % 3}s`, animationDuration: `${3.5 + (i % 3)}s`, opacity: 0.7 }}>❄️</div>
                ))}
              </div>
            )}
            <div className={cn('px-4 py-2.5 flex items-center justify-between border-b', b.frozen ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-blue-200' : 'bg-gradient-to-r from-trust-50 to-emerald-50 border-trust-200')}>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-bold text-gray-800">{b.batchNo}</code>
                {b.frozen ? <span className="badge-status-danger flex items-center gap-1"><Snowflake className="w-3 h-3" />已冻结</span> : <span className="badge-status-success flex items-center gap-1"><ShieldCheck className="w-3 h-3" />正常</span>}
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">{b.level}</span>
            </div>
            <div className="p-4 space-y-2 relative z-20">
              <div className="flex items-start gap-3">
                <div className="flex-1"><h4 className="font-bold text-gray-800">{b.productName}</h4><p className="text-xs text-gray-500 mt-0.5">{b.spec}</p></div>
                <div className="text-right"><div className="text-[10px] text-gray-500">数量</div><div className="text-sm font-bold text-gray-800">{(b.quantity || 0).toLocaleString()}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                <div><span className="text-gray-500">生产日</span><p className="font-medium text-gray-700 mt-0.5">{b.productionDate}</p></div>
                <div><span className="text-gray-500">有效期</span><p className="font-medium text-trust-600 mt-0.5">{b.expiryDate}</p></div>
              </div>
              {b.frozen && (
                <div className="mt-2 rounded-lg p-2.5 bg-cyan-50 border border-cyan-200 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-cyan-700">原因</span><span className="font-medium text-danger-700">{b.freezeReason}</span></div>
                  <div className="flex justify-between"><span className="text-cyan-700">时间</span><span className="text-gray-700">{b.freezeTime}</span></div>
                  <div className="flex justify-between"><span className="text-cyan-700">操作人</span><span className="text-gray-700">{b.freezeBy}</span></div>
                </div>
              )}
              <div className="pt-2 flex gap-2">
                {b.frozen ? (
                  <button onClick={() => setShowUnfreeze(b.id)} disabled={submitting || b.unfreezing} className="flex-1 btn-success text-xs gap-1.5 py-1.5 disabled:opacity-60">
                    {b.unfreezing ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}批次解冻
                  </button>
                ) : (
                  <button onClick={() => { setShowFreeze(b.id); setFreezeReasonInput(''); }} disabled={submitting || b.freezing} className="flex-1 btn-danger text-xs gap-1.5 py-1.5 disabled:opacity-60">
                    {b.freezing ? <Snowflake className="w-3.5 h-3.5 animate-spin" /> : <Snowflake className="w-3.5 h-3.5" />}批次冻结
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showFreeze && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fadeInUp overflow-hidden">
            <div className="bg-gradient-to-r from-danger-500 to-rose-600 px-6 py-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Snowflake className="w-5 h-5" /></div>
              <div><h3 className="font-bold">批次冻结确认</h3><p className="text-xs opacity-80">冻结后批次将无法出库</p></div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5">
                {(() => {
                  const b = batches.find(x => x.id === showFreeze) as any;
                  return (
                    <>
                      <SimpleRow k="批次号" v={b?.batchNo} />
                      <SimpleRow k="产品" v={b?.productName} />
                      <SimpleRow k="数量" v={`${(b?.quantity || 0).toLocaleString()} 件`} />
                    </>
                  );
                })()}
              </div>
              <div>
                <label className="form-label">冻结原因 *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['质量抽检不合格', '客户投诉异常', '工艺偏差问题', '标签标识错误'].map(r => (
                    <button key={r} onClick={() => setFreezeReasonInput(r)} className={cn('text-xs px-2.5 py-1.5 rounded-lg border text-left transition-all', freezeReasonInput === r ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300')}>{r}</button>
                  ))}
                </div>
                <textarea className="input-base min-h-[72px]" placeholder="或手动输入..." value={freezeReasonInput} onChange={e => setFreezeReasonInput(e.target.value)} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowFreeze(null)} className="btn-secondary">取消</button>
              <button onClick={() => doFreeze(showFreeze)} disabled={!freezeReasonInput.trim() || submitting} className="btn-danger gap-1.5 disabled:opacity-60"><Snowflake className="w-4 h-4" />确认冻结</button>
            </div>
          </div>
        </div>
      )}

      {showUnfreeze && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fadeInUp overflow-hidden">
            <div className="bg-gradient-to-r from-trust-500 to-emerald-600 px-6 py-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
              <div><h3 className="font-bold">批次解冻确认</h3><p className="text-xs opacity-80">解冻后批次可正常出库</p></div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-trust-50 border border-trust-200 rounded-xl p-4 text-xs space-y-2">
                {(() => {
                  const b = batches.find(x => x.id === showUnfreeze) as any;
                  return (
                    <>
                      <SimpleRow k="批次号" v={b?.batchNo} />
                      <SimpleRow k="产品" v={b?.productName} />
                      <SimpleRow k="原冻结原因" v={<span className="text-danger-700">{b?.freezeReason}</span>} />
                      <SimpleRow k="已冻结" v={`${dayjs().diff(dayjs(b?.freezeTime), 'day') + 1} 天`} />
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-200 flex gap-2 items-start"><AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />解冻前请确认质量已重新评估合格，并完成相关审批流程。</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowUnfreeze(null)} className="btn-secondary">取消</button>
              <button onClick={() => doUnfreeze(showUnfreeze)} disabled={submitting} className="btn-success gap-1.5"><ShieldCheck className="w-4 h-4" />确认解冻</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleRow({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{k}</span>
      <span className="font-bold text-gray-800">{v}</span>
    </div>
  );
}

/* ================== Tab4 召回进度 ================== */
function ProgressTab() {
  const { orders, progress, loadProgress, loadOrders, submitting, updateStatus } = useRecallStore();
  const { toastSuccess, toastInfo } = useUIStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) setSelectedOrderId(orders[0].id);
    if (selectedOrderId) loadProgress(selectedOrderId);
  }, [selectedOrderId, orders, loadProgress]);

  const currentOrder = orders.find(o => o.id === selectedOrderId);
  const displayProgress = progress.length > 0 ? progress : (currentOrder as any)?.progressList || [];

  const mockProgress = useMemo(() => {
    if (displayProgress.length > 0) return displayProgress;
    const dealers = db.getRawDealers().slice(0, 8);
    const stages: any[] = ['notify', 'feedback', 'recover', 'destroy'];
    return dealers.flatMap((d, di) => stages.map((stage, si) => ({
      id: `${d.id}-${stage}`,
      dealerId: d.id, dealerName: ((d as any).dealerName || (d as any).name),
      stage, totalQty: [1200, 1200, 1200, 1200][si],
      receivedQty: si < di % 4 ? 1200 : si === di % 4 ? Math.floor(1200 * (0.3 + (di % 5) * 0.15)) : 0,
      status: (si < di % 4 ? 'done' : si === di % 4 ? 'processing' : 'pending') ,
    })));
  }, [displayProgress]);

  const stageStats = useMemo(() => {
    const s: Record<string, { total: number; done: number; pct: number }> = {};
    (['notify', 'feedback', 'recover', 'destroy'] as typeof RECALL_STAGES).forEach(st => {
      const arr = mockProgress.filter(p => p.stage === st);
      const total = arr.reduce((a, b) => a + b.totalQty, 0);
      const done = arr.reduce((a, b) => a + b.receivedQty, 0);
      s[st] = { total, done, pct: total ? Math.round(done * 100 / total) : 0 };
    });
    return s;
  }, [mockProgress]);

  const totalPct = Math.round(
    Object.values(stageStats).reduce((s, x) => s + x.pct, 0) / Object.keys(stageStats).length
  );

  const dealerSummary = useMemo(() => {
    const map: Record<string, any> = {};
    mockProgress.forEach(p => {
      if (!map[p.dealerId]) map[p.dealerId] = { id: p.dealerId, name: p.dealerName, stages: {} as any, total: 0, done: 0 };
      map[p.dealerId].stages[p.stage] = p;
      map[p.dealerId].total = Math.max(map[p.dealerId].total, p.totalQty);
      if (p.stage === 'recover') map[p.dealerId].done = p.receivedQty;
    });
    return Object.values(map);
  }, [mockProgress]);

  const ganttOption: any = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: (['notify', 'feedback', 'recover', 'destroy'] as typeof RECALL_STAGES).map(s => RecallStageLabel[s]), top: 0, right: 10, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 11 } },
    grid: { left: 100, right: 30, top: 40, bottom: 30 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', fontSize: 10 }, splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } } },
    yAxis: { type: 'category', data: dealerSummary.map((d: any) => ((d as any).dealerName || (d as any).name).length > 8 ? ((d as any).dealerName || (d as any).name).slice(0, 8) + '…' : ((d as any).dealerName || (d as any).name)), axisLabel: { fontSize: 10, width: 80, overflow: 'truncate' } },
    series: (['notify', 'feedback', 'recover', 'destroy'] as typeof RECALL_STAGES).map((stage, idx) => {
      const colors = ['#60a5fa', '#f59e0b', '#ef4444', '#10b981'];
      return {
        name: RecallStageLabel[stage],
        type: 'bar',
        stack: 'stages',
        barWidth: 14,
        label: { show: idx === 3, position: 'right', formatter: (p: any) => `${p.value}%`, fontSize: 10, color: '#374151' },
        itemStyle: { color: colors[idx], borderRadius: idx === 0 ? [4, 0, 0, 4] : idx === 3 ? [0, 4, 4, 0] : undefined, opacity: 0.92 },
        data: dealerSummary.map((d: any) => d.stages[stage]?.receivedQty ? Math.round(d.stages[stage].receivedQty * 100 / (d.stages[stage].totalQty || 1)) : 0)
      };
    })
  }), [dealerSummary]);

  const gaugeOption: any = useMemo(() => ({
    series: [{
      type: 'gauge', radius: '90%', startAngle: 220, endAngle: -40,
      progress: { show: true, width: 22, itemStyle: { color: totalPct >= 80 ? '#10b981' : totalPct >= 50 ? '#f59e0b' : '#ef4444' } },
      axisLine: { lineStyle: { width: 22, color: [[1, '#e5e7eb']] } },
      pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      detail: {
        valueAnimation: true, fontSize: 36, fontWeight: 'bold', color: '#111827',
        formatter: '{value}%', offsetCenter: [0, '0%']
      },
      title: { offsetCenter: [0, '35%'], fontSize: 12, color: '#6b7280' },
      data: [{ value: totalPct, name: '总体完成率' }]
    }]
  }), [totalPct]);

  const handleUpload = async (progressId: string) => {
    setUploading(progressId);
    await new Promise(r => setTimeout(r, 1200));
    setUploading(null);
    toastInfo('凭证上传成功', '等待质量部审核');
  };

  const markComplete = async (orderId: string) => {
    const ok = await updateStatus(orderId, '已完成' as any);
    if (ok) toastSuccess('召回已完成', '所有产品已完成回收销毁');
  };

  const titleOf = (o: any) => ((o as any).title || (o as any).productName || '未命名工单');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">召回工单：</span>
          <div className="relative">
            <select className="input-base pr-10" value={selectedOrderId || ''} onChange={e => setSelectedOrderId(e.target.value)}>
              {orders.map(o => { const t = titleOf(o); return <option key={o.id} value={o.id}>[{((o as any).recallNo || (o as any).orderNo)}] {t.slice(0, 22)}{t.length > 22 ? '…' : ''}</option>; })}
              {orders.length === 0 && <option value="">（暂无工单，请先创建）</option>}
            </select>
          </div>
          {currentOrder && <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', STATUS_COLORS[currentOrder.status])}>{STATUS_LABELS[currentOrder.status]}</span>}
        </div>
        {currentOrder && ((currentOrder.status as any) === 'recalling' || (currentOrder.status as any) === '召回中') && (
          <button onClick={() => markComplete(currentOrder.id)} disabled={submitting} className="btn-success gap-2 text-sm"><CheckCircle2 className="w-4 h-4" /> 标记召回完成</button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-1">总体召回进度</h3>
          <p className="text-xs text-gray-500 mb-3">{titleOf(currentOrder)}</p>
          <ReactECharts option={gaugeOption} style={{ height: 220 }} />
          <div className="grid grid-cols-4 gap-2 mt-2 pt-4 border-t border-gray-100">
            {(['notify', 'feedback', 'recover', 'destroy'] as typeof RECALL_STAGES).map(st => {
              const s = stageStats[st];
              return (
                <div key={st} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{RecallStageLabel[st]}</div>
                  <div className="text-lg font-bold text-primary-700">{s.pct}%</div>
                  <div className="text-[10px] text-gray-400">{s.done.toLocaleString()}/{s.total.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-8 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> 各经销商召回进度甘特图</h3>
            <div className="flex gap-2 text-[11px]">
              {[['notify', '#60a5fa'], ['feedback', '#f59e0b'], ['recover', '#ef4444'], ['destroy', '#10b981']].map(([k, c]) => (
                <span key={k} className="inline-flex items-center gap-1.5 text-gray-600"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: c }} />{RecallStageLabel[k ]}</span>
              ))}
            </div>
          </div>
          <ReactECharts option={ganttOption} style={{ height: 320 }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> 经销商执行明细</h3>
          <span className="text-xs text-gray-500">共 {dealerSummary.length} 家经销商</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-700">经销商</th>
              <th className="text-center px-5 py-3 font-medium text-gray-700">通知</th>
              <th className="text-center px-5 py-3 font-medium text-gray-700">反馈</th>
              <th className="text-center px-5 py-3 font-medium text-gray-700">应回收</th>
              <th className="text-center px-5 py-3 font-medium text-gray-700">已回收</th>
              <th className="text-left px-5 py-3 font-medium text-gray-700 w-[200px]">完成率</th>
              <th className="text-center px-5 py-3 font-medium text-gray-700">状态</th>
              <th className="text-right px-5 py-3 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dealerSummary.map((d: any) => {
              const pct = d.total ? Math.round(d.done * 100 / d.total) : 0;
              const overall = d.stages.destroy?.status === 'done' ? 'done' : d.stages.recover?.status === 'processing' ? 'processing' : d.stages.notify?.status === 'pending' ? 'pending' : (d.stages.feedback?.status || 'pending');
              return (
                <tr key={d.id} className="hover:bg-primary-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800">{((d as any).dealerName || (d as any).name)}</div>
                    <div className="text-xs text-gray-500">{d.id}</div>
                  </td>
                  <td className="px-5 py-3 text-center">{renderProgressStatusBadge(d.stages.notify?.status || 'pending')}</td>
                  <td className="px-5 py-3 text-center">{renderProgressStatusBadge(d.stages.feedback?.status || 'pending')}</td>
                  <td className="px-5 py-3 text-center font-mono font-medium text-gray-700">{d.total.toLocaleString()}</td>
                  <td className="px-5 py-3 text-center font-mono font-bold text-trust-600">{d.done.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-500', pct >= 80 ? 'bg-trust-500' : pct >= 50 ? 'bg-warning-500' : 'bg-danger-500')} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={cn('text-xs font-bold w-10 text-right', pct >= 80 ? 'text-trust-600' : pct >= 50 ? 'text-warning-600' : 'text-danger-600')}>{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">{renderProgressStatusBadge(overall , true)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => handleUpload(d.id)} disabled={uploading === d.id} className="btn-ghost text-xs py-1 px-2 gap-1 disabled:opacity-60">
                      {uploading === d.id ? <Clock className="w-3.5 h-3.5 inline animate-spin" /> : <Upload className="w-3.5 h-3.5 inline" />}
                      {uploading === d.id ? '上传中' : '上传凭证'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderProgressStatusBadge(status: string, withText = false) {
  const map: Record<string, { cls: string; text: string }> = {
    pending: { cls: 'bg-gray-100 text-gray-600 border-gray-200', text: '待处理' },
    processing: { cls: 'bg-primary-100 text-primary-700 border-primary-200', text: '处理中' },
    进行中: { cls: 'bg-primary-100 text-primary-700 border-primary-200', text: '处理中' },
    done: { cls: 'bg-trust-100 text-trust-700 border-trust-200', text: '已完成' },
    已完成: { cls: 'bg-trust-100 text-trust-700 border-trust-200', text: '已完成' },
    exception: { cls: 'bg-danger-100 text-danger-700 border-danger-200', text: '异常' },
    待处理: { cls: 'bg-gray-100 text-gray-600 border-gray-200', text: '待处理' },
  };
  const m = map[status] || map.pending;
  if (withText) return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', m.cls)}>{m.text}</span>;
  return <span className={cn('inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border', m.cls)}>{m.text.charAt(0)}</span>;
}

/* ================== Tab5 窜货分析 ================== */
function ChannelingTab() {
  const { channelingList, loadChanneling, orders, loadOrders } = useRecallStore();
  const { toastSuccess } = useUIStore();
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => { loadChanneling(); loadOrders(); }, [loadChanneling, loadOrders]);

  const mockData = useMemo(() => {
    if (channelingList.length > 0) return channelingList as any[];
    const batches = db.getRawBatches();
    const regions = ['华东', '华南', '华北', '华中', '西南', '西北', '东北'];
    return batches.slice(0, 15).map((b: any, i) => ({
      id: b.id,
      batchNo: b.batchNo,
      productName: b.productName,
      originalRegion: regions[i % regions.length],
      abnormalRegion: regions[(i + 3) % regions.length],
      diffCount: 8 + (i * 7) % 50,
      totalChecks: 120 + (i * 13) % 200,
      anomalyRate: Math.round((8 + (i * 7) % 50) * 1000 / (120 + (i * 13) % 200)) / 10,
      severity: i % 4,
      records: [...Array(Math.min(5, (i % 5) + 1))].map((_, j) => ({
        code: `${b.batchNo}${(1000 + j * 53).toString()}`,
        originalProvince: regions[i % regions.length] + ['省', '市'][j % 2],
        checkProvince: regions[(i + 3) % regions.length] + ['省', '市'][j % 2],
        checkTime: dayjs().subtract(j + 1, 'day').subtract(i % 5, 'hour').format('YYYY-MM-DD HH:mm'),
        storeName: `验真门店-${String.fromCharCode(65 + j)}${100 + i}`,
      })),
    }));
  }, [channelingList]);

  const provinceDistribution = useMemo(() => {
    return PROVINCES.slice(0, 20).map(p => [p, Math.floor(Math.random() * 40 + (Math.random() > 0.85 ? 80 : 0))]);
  }, []);

  const totalCases = mockData.reduce((s, m) => s + m.diffCount, 0);
  const highSeverity = mockData.filter(m => m.severity >= 2).length;
  const affectedBatchCount = new Set(mockData.map(m => m.id)).size;

  const mapOption: any = useMemo(() => ({
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>窜货次数：<b style="color:#ef4444">${p[0].value}</b>` },
    visualMap: { min: 0, max: 100, left: 10, bottom: 10, text: ['严重', '轻微'], calculable: true, inRange: { color: ['#dcfce7', '#fef3c7', '#fde68a', '#fecaca', '#dc2626'] }, textStyle: { fontSize: 10 } },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: provinceDistribution.map((x: any) => x[0]), axisLabel: { rotate: 40, fontSize: 10 } },
    yAxis: { type: 'value', name: '窜货次数', axisLabel: { fontSize: 10 } },
    series: [{
      type: 'bar', data: provinceDistribution.map((x: any) => ({ value: x[1], itemStyle: { color: x[1] > 70 ? '#dc2626' : x[1] > 40 ? '#f59e0b' : x[1] > 15 ? '#86efac' : '#e5e7eb' }, borderRadius: [4, 4, 0, 0] })),
      barWidth: '60%', emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(239,68,68,0.3)' } }
    }]
  }), [provinceDistribution]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '疑似窜货总数', value: totalCases.toLocaleString(), icon: AlertTriangle, color: 'from-danger-500 to-rose-600', big: true },
          { label: '高危嫌疑批次', value: highSeverity, icon: ShieldAlert, color: 'from-orange-500 to-amber-600' },
          { label: '涉事批次数量', value: affectedBatchCount, icon: Package, color: 'from-violet-500 to-purple-600' },
          { label: '覆盖省份', value: `${new Set(mockData.map(m => m.abnormalRegion)).size} 省`, icon: MapIcon, color: 'from-blue-500 to-primary-600' },
        ].map((s, i) => { const SC = s.icon; return (
          <div key={i} className={cn('card p-5 relative overflow-hidden', s.big && 'ring-2 ring-danger-200')}>
            <div className={cn('absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-15 bg-gradient-to-br', s.color)} />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">{s.big && <span className="inline-flex items-center text-[10px] bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded-full gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />高危</span>}{s.label}</div>
                <div className={cn('font-bold text-gray-800', s.big ? 'text-4xl' : 'text-2xl', s.big && 'text-danger-600')}>{s.value}</div>
              </div>
              <div className={cn('p-2.5 rounded-xl bg-gradient-to-br text-white', s.color)}><SC className="w-5 h-5" /></div>
            </div>
          </div>
        ); })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><MapIcon className="w-4 h-4 text-primary" /> 全国窜货热力分布（省份）</h3>
          <ReactECharts option={mapOption} style={{ height: 320 }} />
        </div>
        <div className="col-span-5 card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> 窜货等级分布</h3>
          <ReactECharts option={{
            tooltip: { trigger: 'item', formatter: '{b}: {c} 批次 ({d}%)' },
            legend: { bottom: 0, textStyle: { fontSize: 11 } },
            series: [{
              type: 'pie', radius: ['45%', '70%'], center: ['50%', '42%'],
              label: { formatter: '{b}\n{d}%', fontSize: 10 },
              data: [
                { value: mockData.filter(m => m.severity === 3).length, name: '严重', itemStyle: { color: '#dc2626' } },
                { value: mockData.filter(m => m.severity === 2).length, name: '较高', itemStyle: { color: '#f59e0b' } },
                { value: mockData.filter(m => m.severity === 1).length, name: '一般', itemStyle: { color: '#60a5fa' } },
                { value: mockData.filter(m => m.severity === 0).length, name: '轻微', itemStyle: { color: '#86efac' } },
              ]
            }]
          }} style={{ height: 320 }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-danger" /> 嫌疑批次清单</h3>
          <span className="text-xs text-gray-500">共 {mockData.length} 条记录</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-700 w-16">等级</th>
              <th className="text-left px-5 py-3 font-medium text-gray-700">批次号</th>
              <th className="text-left px-5 py-3 font-medium text-gray-700">产品名</th>
              <th className="text-center px-5 py-3 font-medium text-gray-700">原流向区域</th>
              <th className="text-center px-5 py-3 font-medium text-gray-700">验真异常区域</th>
              <th className="text-right px-5 py-3 font-medium text-gray-700">差异次数</th>
              <th className="text-right px-5 py-3 font-medium text-gray-700">异常率</th>
              <th className="text-right px-5 py-3 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockData.map(m => (
              <tr key={m.id} className={cn('hover:bg-danger-50/30 transition-colors cursor-pointer', m.severity >= 2 && 'bg-danger-50/40')} onClick={() => setDetail(m)}>
                <td className="px-5 py-3">{renderSeverity(m.severity)}</td>
                <td className="px-5 py-3 font-mono font-bold text-primary-700">{m.batchNo}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{m.productName}</td>
                <td className="px-5 py-3 text-center text-sm"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-trust-50 text-trust-700 border border-trust-200">{m.originalRegion}</span></td>
                <td className="px-5 py-3 text-center text-sm"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger-50 text-danger-700 border border-danger-200">{m.abnormalRegion}</span></td>
                <td className="px-5 py-3 text-right font-mono font-bold text-danger-600">{m.diffCount}</td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-danger-500" style={{ width: `${Math.min(100, m.anomalyRate * 5)}%` }} /></div>
                    <span className="text-xs font-bold text-danger-600 w-12 text-right">{m.anomalyRate}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={e => { e.stopPropagation(); setDetail(m); }} className="btn-ghost text-xs py-1 px-2 gap-1"><ZoomIn className="w-3.5 h-3.5 inline" />详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-fadeInUp overflow-hidden max-h-[85vh] flex flex-col">
            <div className={cn('px-6 py-4 flex items-center justify-between', detail.severity >= 2 ? 'bg-gradient-to-r from-danger-500 to-rose-600 text-white' : 'bg-gradient-to-r from-warning-500 to-amber-600 text-white')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold flex items-center gap-2">窜货嫌疑详情 <span className="ml-2 text-xs px-2 py-0.5 rounded bg-white/20">{detail.batchNo}</span></h3>
                  <p className="text-xs opacity-80">{detail.productName} · 差异 {detail.diffCount} 次 · 异常率 {detail.anomalyRate}%</p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className="grid grid-cols-4 gap-3">
                {[['原流向', detail.originalRegion, 'trust'], ['异常区域', detail.abnormalRegion, 'danger'], ['差异次数', detail.diffCount, 'warning'], ['验真总数', detail.totalChecks, 'primary']].map(([l, v, c]) => (
                  <div key={l as string} className={cn('rounded-xl border p-3', c === 'trust' && 'bg-trust-50 border-trust-200', c === 'danger' && 'bg-danger-50 border-danger-200', c === 'warning' && 'bg-warning-50 border-warning-200', c === 'primary' && 'bg-primary-50 border-primary-200')}>
                    <div className={cn('text-[11px]', c === 'trust' && 'text-trust-700', c === 'danger' && 'text-danger-700', c === 'warning' && 'text-warning-700', c === 'primary' && 'text-primary-700')}>{l as string}</div>
                    <div className="text-lg font-bold text-gray-800 mt-0.5">{v as any}</div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><EyeOff className="w-4 h-4 text-danger" /> 异常验真明细</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-700">追溯码</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-700">原应销售区域</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-700">实际验真区域</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-700">验真门店</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-700">验真时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.records.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-primary-50/40">
                          <td className="px-4 py-2 font-mono text-primary-700">{r.code}</td>
                          <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded bg-trust-50 text-trust-700 border border-trust-200">{r.originalProvince}</span></td>
                          <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded bg-danger-50 text-danger-700 border border-danger-200">{r.checkProvince}</span></td>
                          <td className="px-4 py-2 text-gray-700">{r.storeName}</td>
                          <td className="px-4 py-2 text-gray-500 font-mono">{r.checkTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-medium">建议处置措施：</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li>立即冻结嫌疑批次 {detail.batchNo}，暂停下游出库</li>
                    <li>联系原流向经销商 {detail.originalRegion} 核查出货记录</li>
                    <li>调查异常区域经销商 {detail.abnormalRegion} 的进货渠道</li>
                    <li>加大该批次后续验真监控，扩大样本量</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setDetail(null)} className="btn-secondary">关闭</button>
              <button onClick={() => { toastSuccess('已转工单', '已生成异常工单并关联批次'); setDetail(null); }} className="btn-primary gap-2"><Plus className="w-4 h-4" />转异常工单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderSeverity(s: number) {
  const cfg = [
    { label: '轻微', cls: 'bg-trust-100 text-trust-700 border-trust-200', dots: '●○○○' },
    { label: '一般', cls: 'bg-primary-100 text-primary-700 border-primary-200', dots: '●●○○' },
    { label: '较高', cls: 'bg-warning-100 text-warning-700 border-warning-200', dots: '●●●○' },
    { label: '严重', cls: 'bg-danger-100 text-danger-700 border-danger-200', dots: '●●●●' },
  ];
  const c = cfg[s] || cfg[0];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', c.cls)}>{c.label}</span>
      <span className={cn('text-[10px] tracking-widest', s >= 2 ? 'text-danger-500' : s === 1 ? 'text-primary-500' : 'text-trust-500')}>{c.dots}</span>
    </div>
  );
}
