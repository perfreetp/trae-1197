import { useState, useMemo, useEffect } from 'react';
import {
  Package,
  QrCode,
  Palette,
  Printer,
  Search,
  Plus,
  Eye,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight,
  Package2,
  Boxes,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
  TrendingUp,
  Layers,
  FileText,
  Calendar,
  Hash,
  Settings,
  Type,
  Image as ImageIcon,
  CalendarDays,
  ShieldCheck,
  GripVertical,
  Trash2,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
import { useBatchStore } from '@/stores/batchStore';
import { useUIStore } from '@/stores/uiStore';
import { db } from '@/services/mock/database';
import { TraceCode, Batch } from '@/services/mock/generators';
import { cn } from '@/lib/utils';

const CODING_TABS = [
  { key: 'pool', label: '📦 码池管理', icon: Package },
  { key: 'batch', label: '⚙️ 批量赋码', icon: QrCode },
  { key: 'template', label: '🎨 标签模板', icon: Palette },
  { key: 'print', label: '🖨️ 打印中心', icon: Printer },
] as const;

type CodingTab = typeof CODING_TABS[number]['key'];

interface CodeRule {
  prefix: string;
  casePerBox: number;
  boxPerBottle: number;
}

interface LabelField {
  id: string;
  name: string;
  icon: typeof Type;
  type: 'text' | 'qrcode' | 'image' | 'date';
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
}

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  fields: LabelField[];
}

interface PrintRecord {
  id: string;
  time: string;
  batchNo: string;
  copies: number;
  status: 'success' | 'failed' | 'printing';
}

const PRESET_TEMPLATES: LabelTemplate[] = [
  {
    id: 'standard',
    name: '标准模板',
    description: '包含产品名、批号、规格、二维码',
    thumbnail: '标准',
    fields: [
      { id: 'f1', name: '产品名称', icon: FileText, type: 'text', x: 10, y: 10, width: 180, height: 24, value: '阿莫西林胶囊' },
      { id: 'f2', name: '批号', icon: Hash, type: 'text', x: 10, y: 40, width: 120, height: 20, value: 'B20250101' },
      { id: 'f3', name: '规格', icon: Layers, type: 'text', x: 140, y: 40, width: 80, height: 20, value: '0.25g*24粒' },
      { id: 'f4', name: '二维码', icon: QrCode, type: 'qrcode', x: 140, y: 70, width: 60, height: 60, value: 'TRACE-CODE-001' },
      { id: 'f5', name: '生产日期', icon: CalendarDays, type: 'date', x: 10, y: 70, width: 120, height: 20, value: '2025-01-01' },
      { id: 'f6', name: '有效期至', icon: ShieldCheck, type: 'date', x: 10, y: 95, width: 120, height: 20, value: '2027-01-01' },
    ],
  },
  {
    id: 'simple',
    name: '精简模板',
    description: '核心信息+二维码，适合小包装',
    thumbnail: '精简',
    fields: [
      { id: 'f1', name: '产品名称', icon: FileText, type: 'text', x: 10, y: 8, width: 100, height: 20, value: '阿莫西林胶囊' },
      { id: 'f2', name: '批号', icon: Hash, type: 'text', x: 10, y: 32, width: 80, height: 16, value: 'B20250101' },
      { id: 'f3', name: '二维码', icon: QrCode, type: 'qrcode', x: 100, y: 8, width: 50, height: 50, value: 'TRACE-CODE-001' },
    ],
  },
  {
    id: 'detail',
    name: '详情模板',
    description: '全字段+Logo，适合外箱',
    thumbnail: '详情',
    fields: [
      { id: 'f1', name: 'Logo', icon: ImageIcon, type: 'image', x: 10, y: 10, width: 50, height: 30, value: 'LOGO' },
      { id: 'f2', name: '产品名称', icon: FileText, type: 'text', x: 70, y: 10, width: 200, height: 28, value: '阿莫西林胶囊' },
      { id: 'f3', name: '规格', icon: Layers, type: 'text', x: 70, y: 42, width: 100, height: 20, value: '0.25g*24粒' },
      { id: 'f4', name: '批号', icon: Hash, type: 'text', x: 10, y: 50, width: 90, height: 20, value: 'B20250101' },
      { id: 'f5', name: '生产日期', icon: CalendarDays, type: 'date', x: 105, y: 50, width: 90, height: 20, value: '2025-01-01' },
      { id: 'f6', name: '有效期至', icon: ShieldCheck, type: 'date', x: 200, y: 50, width: 90, height: 20, value: '2027-01-01' },
      { id: 'f7', name: '生产厂家', icon: Settings, type: 'text', x: 10, y: 78, width: 200, height: 18, value: '华北制药股份有限公司' },
      { id: 'f8', name: '二维码', icon: QrCode, type: 'qrcode', x: 220, y: 75, width: 70, height: 70, value: 'TRACE-CODE-001' },
    ],
  },
];

const AVAILABLE_FIELDS = [
  { id: 'product', name: '产品名称', icon: FileText, type: 'text' as const, default: '阿莫西林胶囊' },
  { id: 'batch', name: '批号', icon: Hash, type: 'text' as const, default: 'B20250101' },
  { id: 'spec', name: '规格', icon: Layers, type: 'text' as const, default: '0.25g*24粒' },
  { id: 'qrcode', name: '二维码', icon: QrCode, type: 'qrcode' as const, default: 'TRACE-CODE-001' },
  { id: 'proddate', name: '生产日期', icon: CalendarDays, type: 'date' as const, default: '2025-01-01' },
  { id: 'expdate', name: '有效期', icon: ShieldCheck, type: 'date' as const, default: '2027-01-01' },
  { id: 'logo', name: 'Logo', icon: ImageIcon, type: 'image' as const, default: 'LOGO' },
];

const PRINTERS = ['HP LaserJet Pro', 'Zebra ZT410 标签打印机', 'Brother QL-820NWB', 'EPSON L3253'];

export default function Coding() {
  const [activeTab, setActiveTab] = useState<CodingTab>('pool');
  const { toastSuccess, toastError, setPageTitle } = useUIStore();
  const { batches, genCodes, lastGeneratedCodes, submitting } = useBatchStore();

  useEffect(() => {
    setPageTitle('赋码贴标');
  }, [setPageTitle]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">赋码贴标</h1>
          <p className="text-sm text-gray-500 mt-1">追溯码生成、标签模板设计与批量打印</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50 px-2">
          {CODING_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all',
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
          {activeTab === 'pool' && <CodePoolTab batches={batches} />}
          {activeTab === 'batch' && (
            <BatchCodeTab batches={batches} genCodes={genCodes} lastGeneratedCodes={lastGeneratedCodes} submitting={submitting} toastSuccess={toastSuccess} toastError={toastError} />
          )}
          {activeTab === 'template' && <TemplateTab toastSuccess={toastSuccess} />}
          {activeTab === 'print' && <PrintTab toastSuccess={toastSuccess} />}
        </div>
      </div>
    </div>
  );
}

function TabContainer({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function CodePoolTab({ batches }: { batches: Batch[] }) {
  const [rule, setRule] = useState<CodeRule>({ prefix: 'YP', casePerBox: 20, boxPerBottle: 10 });
  const searchRef = useState('');

  const allCodes = useMemo(() => db.getRawTraceCodes(), []);
  const totalCapacity = 1000000;
  const usedCodes = allCodes.length;
  const remainingCodes = totalCapacity - usedCodes;
  const percent = Math.round((remainingCodes / totalCapacity) * 100);
  const percentColor = percent < 20 ? '#EF4444' : percent < 50 ? '#F59E0B' : '#10B981';

  const trendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 30, right: 10, top: 10, bottom: 20 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')),
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#F1F5F9' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: [2300, 3100, 2800, 4500, 5200, 3900, 4200],
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#1E6FDB' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: 18,
    }],
  }), []);

  const ringOption = useMemo(() => ({
    series: [{
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      pointer: { show: false },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: { color: percentColor },
      },
      axisLine: {
        lineStyle: {
          width: 20,
          color: [[1, '#E2E8F0']],
        },
      },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      data: [{ value: percent }],
      detail: { show: false },
    }],
  }), [percent, percentColor]);

  const levelBadge = (level: string) => {
    const styles: Record<string, string> = {
      '箱': 'bg-blue-50 text-blue-700 border-blue-200',
      '盒': 'bg-green-50 text-green-700 border-green-200',
      '瓶': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return <span className={cn('badge-status border', styles[level] || 'badge-status-default')}>{level}</span>;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      '未使用': 'badge-status-default',
      '已入库': 'badge-status-info',
      '已出库': 'badge-status-success',
      '经销商签收': 'badge-status-warning',
      '门店收货': 'badge-status-success',
      '已验真': 'badge-status-success',
    };
    return <span className={map[status] || 'badge-status-default'}>{status}</span>;
  };

  return (
    <TabContainer>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-gray-800">规则配置</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">编码前缀</label>
                <input
                  className="input-base"
                  value={rule.prefix}
                  onChange={e => setRule({ ...rule, prefix: e.target.value })}
                  placeholder="如 YP / NP"
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-700">编码规则说明</p>
                <p>格式：<code className="text-primary bg-white px-1.5 py-0.5 rounded">{rule.prefix}</code>{`{层级}{批次后6位}{流水号}`}</p>
                <p className="text-xs text-gray-500">例：{rule.prefix}X20250100001（X=箱,H=盒,P=瓶）</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">每箱盒数</label>
                  <input
                    type="number"
                    className="input-base"
                    value={rule.casePerBox}
                    onChange={e => setRule({ ...rule, casePerBox: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label">每盒瓶数</label>
                  <input
                    type="number"
                    className="input-base"
                    value={rule.boxPerBottle}
                    onChange={e => setRule({ ...rule, boxPerBottle: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg border border-primary-100">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary-700">
                  1箱 = {rule.casePerBox}盒 = {rule.casePerBox * rule.boxPerBottle}瓶
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-gray-800">近7日生成趋势</h3>
            </div>
            <ReactECharts option={trendOption} style={{ height: 180 }} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-gray-800">码池余量监控</h3>
              </div>
              <div className="flex gap-2">
                <span className={cn('badge-status border', percent < 20 ? 'badge-status-danger' : percent < 50 ? 'badge-status-warning' : 'badge-status-success')}>
                  {percent < 20 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {percent < 20 ? '余量不足' : percent < 50 ? '库存偏低' : '余量充足'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  <ReactECharts option={ringOption} style={{ width: '100%', height: '100%' }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: percentColor }}>{percent}%</span>
                    <span className="text-xs text-gray-500 mt-1">可用率</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 text-center">
                  <div className="text-xs text-gray-500 mb-1">总容量</div>
                  <div className="text-2xl font-bold text-gray-800">{totalCapacity.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded-xl bg-trust-50 text-center">
                  <div className="text-xs text-gray-500 mb-1">已使用</div>
                  <div className="text-2xl font-bold text-trust-700">{usedCodes.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded-xl bg-primary-50 text-center">
                  <div className="text-xs text-gray-500 mb-1">剩余数量</div>
                  <div className="text-2xl font-bold text-primary-700">{remainingCodes.toLocaleString()}</div>
                </div>
                <div className="col-span-3 grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">箱级码</span>
                    </div>
                    <span className="font-semibold text-blue-700">
                      {allCodes.filter(c => c.level === '箱').length.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">盒级码</span>
                    </div>
                    <span className="font-semibold text-green-700">
                      {allCodes.filter(c => c.level === '盒').length.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600">瓶级码</span>
                    </div>
                    <span className="font-semibold text-purple-700">
                      {allCodes.filter(c => c.level === '瓶').length.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-gray-800">追溯码列表</h3>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input-base pl-9 pr-3"
                  placeholder="搜索追溯码/批次号..."
                  value={searchRef[0]}
                  onChange={e => { /* search */ }}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left px-5 py-3 font-medium">追溯码</th>
                    <th className="text-left px-5 py-3 font-medium">批次</th>
                    <th className="text-left px-5 py-3 font-medium">级别</th>
                    <th className="text-left px-5 py-3 font-medium">状态</th>
                    <th className="text-left px-5 py-3 font-medium">生成时间</th>
                    <th className="text-left px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allCodes.slice(0, 10).map(code => (
                    <tr key={code.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <code className="text-primary bg-primary-50 px-2 py-1 rounded text-xs font-mono">{code.code}</code>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{code.batchNo}</td>
                      <td className="px-5 py-3">{levelBadge(code.level)}</td>
                      <td className="px-5 py-3">{statusBadge(code.status)}</td>
                      <td className="px-5 py-3 text-gray-500">{code.generatedAt}</td>
                      <td className="px-5 py-3">
                        <button className="text-primary hover:text-primary-700 text-sm inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>共 {allCodes.length.toLocaleString()} 条记录</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50">上一页</button>
                <button className="px-3 py-1 rounded bg-primary text-white">1</button>
                <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50">2</button>
                <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50">下一页</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
}

function BatchCodeTab({
  batches,
  genCodes,
  lastGeneratedCodes,
  submitting,
  toastSuccess,
  toastError,
}: {
  batches: Batch[];
  genCodes: (batchId: string, qty: number) => Promise<TraceCode[]>;
  lastGeneratedCodes: TraceCode[];
  submitting: boolean;
  toastSuccess: (t: string, d?: string) => void;
  toastError: (t: string, d?: string) => void;
}) {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [caseCount, setCaseCount] = useState(10);
  const [startSerial, setStartSerial] = useState(1);
  const [generated, setGenerated] = useState<TraceCode[]>([]);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set());

  const casePerBox = 20;
  const boxPerBottle = 10;
  const totalCodes = caseCount * (1 + casePerBox + casePerBox * boxPerBottle);
  const batch = batches.find(b => b.id === selectedBatch);

  const handleGenerate = async () => {
    if (!selectedBatch) {
      toastError('请选择批次');
      return;
    }
    const codes = await genCodes(selectedBatch, caseCount);
    if (codes.length > 0) {
      setGenerated(codes);
      toastSuccess(`生成成功`, `共生成 ${codes.length} 个追溯码`);
    }
  };

  const displayCodes = generated.length > 0 ? generated : lastGeneratedCodes;
  const caseCodes = displayCodes.filter(c => c.level === '箱');
  const successCount = displayCodes.length;
  const failCount = 0;

  const toggleCase = (code: string) => {
    setExpandedCases(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleBox = (code: string) => {
    setExpandedBoxes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  return (
    <TabContainer>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-gray-800">赋码配置</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">选择批次 <span className="text-danger">*</span></label>
                <select
                  className="input-base"
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                >
                  <option value="">请选择生产批次</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batchNo} - {b.productName} ({b.spec})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">赋码数量（箱）</label>
                  <input
                    type="number"
                    min={1}
                    className="input-base"
                    value={caseCount}
                    onChange={e => setCaseCount(Math.max(1, Number(e.target.value)))}
                  />
                </div>
                <div>
                  <label className="form-label">起始流水号</label>
                  <input
                    type="number"
                    min={1}
                    className="input-base"
                    value={startSerial}
                    onChange={e => setStartSerial(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-100">
                <div className="text-sm font-medium text-primary-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  码层级预览
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-700"><Package2 className="w-4 h-4 text-blue-600" />箱级码</span>
                    <span className="font-semibold text-blue-700">{caseCount} 个</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pl-6">
                    <span className="flex items-center gap-2 text-gray-700"><Boxes className="w-4 h-4 text-green-600" />盒级码 (×{casePerBox})</span>
                    <span className="font-semibold text-green-700">{caseCount * casePerBox} 个</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pl-12">
                    <span className="flex items-center gap-2 text-gray-700"><FlaskConical className="w-4 h-4 text-purple-600" />瓶级码 (×{boxPerBottle})</span>
                    <span className="font-semibold text-purple-700">{caseCount * casePerBox * boxPerBottle} 个</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-primary-200 flex items-center justify-between">
                  <span className="text-sm text-gray-700">总码数合计</span>
                  <span className="text-xl font-bold text-primary">{totalCodes.toLocaleString()}</span>
                </div>
                {batch && (
                  <div className="mt-3 p-2 bg-white rounded-lg text-xs text-gray-600">
                    <p>选中批次：<span className="font-medium">{batch.batchNo}</span></p>
                    <p>产品：{batch.productName} {batch.spec}</p>
                    <p>计划产量：{batch.planQty.toLocaleString()} {batch.unit}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={submitting}
                className="btn-primary w-full py-2.5 gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? '正在生成...' : '生成追溯码'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-trust mx-auto mb-2" />
              <div className="text-2xl font-bold text-trust-700">{successCount.toLocaleString()}</div>
              <div className="text-sm text-gray-500">成功数量</div>
            </div>
            <div className="card p-5 text-center">
              <XCircle className="w-8 h-8 text-danger mx-auto mb-2" />
              <div className="text-2xl font-bold text-danger-700">{failCount}</div>
              <div className="text-sm text-gray-500">失败数量</div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="card h-full">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-gray-800">生成结果预览</h3>
              </div>
              {displayCodes.length > 0 && (
                <div className="flex gap-2">
                  <button className="btn-secondary text-sm gap-1.5 py-1.5">
                    <Download className="w-3.5 h-3.5" />
                    导出Excel
                  </button>
                </div>
              )}
            </div>
            <div className="p-5 max-h-[600px] overflow-auto scrollbar-thin">
              {displayCodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <QrCode className="w-16 h-16 mb-3 opacity-40" />
                  <p className="text-sm">配置左侧参数后点击「生成追溯码」</p>
                  <p className="text-xs mt-1">生成的三级码结构将在此展示</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {caseCodes.map(caseCode => {
                    const boxCodes = displayCodes.filter(c => c.parentCode === caseCode.code);
                    const isCaseOpen = expandedCases.has(caseCode.code);
                    return (
                      <div key={caseCode.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => toggleCase(caseCode.code)}
                        >
                          {isCaseOpen ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-blue-600" />}
                          <Package2 className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <code className="text-xs font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">{caseCode.code}</code>
                          </div>
                          <span className="text-xs text-gray-500">{boxCodes.length} 盒</span>
                        </div>
                        {isCaseOpen && (
                          <div className="border-t border-blue-100 pl-8 bg-white">
                            {boxCodes.map(boxCode => {
                              const bottleCodes = displayCodes.filter(c => c.parentCode === boxCode.code);
                              const isBoxOpen = expandedBoxes.has(boxCode.code);
                              return (
                                <div key={boxCode.id} className="border-b border-gray-100 last:border-0">
                                  <div
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50/50 cursor-pointer"
                                    onClick={() => toggleBox(boxCode.code)}
                                  >
                                    {isBoxOpen ? <ChevronDown className="w-3.5 h-3.5 text-green-600" /> : <ChevronRight className="w-3.5 h-3.5 text-green-600" />}
                                    <Boxes className="w-4 h-4 text-green-600" />
                                    <div className="flex-1">
                                      <code className="text-xs font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded">{boxCode.code}</code>
                                    </div>
                                    <span className="text-xs text-gray-500">{bottleCodes.length} 瓶</span>
                                  </div>
                                  {isBoxOpen && (
                                    <div className="border-t border-green-100 pl-8 py-2 bg-gray-50/30 grid grid-cols-5 gap-1.5">
                                      {bottleCodes.slice(0, 10).map(bCode => (
                                        <div key={bCode.id} className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-100">
                                          <FlaskConical className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                          <code className="text-[10px] font-mono text-purple-700 truncate">{bCode.code.slice(-8)}</code>
                                        </div>
                                      ))}
                                      {bottleCodes.length > 10 && (
                                        <div className="px-2 py-1 text-[10px] text-gray-500 text-center">+{bottleCodes.length - 10} 更多</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
}

function TemplateTab({ toastSuccess }: { toastSuccess: (t: string, d?: string) => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);
  const [fields, setFields] = useState<LabelField[]>([]);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const handleSelectTemplate = (tpl: LabelTemplate) => {
    setSelectedTemplate(tpl);
    setFields(tpl.fields.map(f => ({ ...f })));
    setSelectedFieldId(null);
  };

  const addField = (fieldDef: typeof AVAILABLE_FIELDS[number]) => {
    const newField: LabelField = {
      id: `field_${Date.now()}`,
      name: fieldDef.name,
      icon: fieldDef.icon,
      type: fieldDef.type,
      x: 20,
      y: 80 + fields.length * 25,
      width: fieldDef.type === 'qrcode' ? 60 : fieldDef.type === 'image' ? 50 : 120,
      height: fieldDef.type === 'qrcode' ? 60 : fieldDef.type === 'image' ? 30 : 20,
      value: fieldDef.default,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<LabelField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  if (!selectedTemplate) {
    return (
      <TabContainer>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">选择标签模板</h3>
            <p className="text-sm text-gray-500 mt-1">选择一个预设模板开始编辑，或创建自定义模板</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRESET_TEMPLATES.map(tpl => (
            <div
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className="card-hover p-5 cursor-pointer group"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center mb-4 group-hover:border-primary-300 transition-colors relative overflow-hidden">
                <div className="absolute inset-0 p-3">
                  <div className="w-full h-full bg-white rounded border border-gray-200 shadow-sm p-2 flex flex-col gap-1 text-[8px] overflow-hidden">
                    {tpl.fields.slice(0, 6).map((f, i) => (
                      f.type === 'qrcode' ? (
                        <div key={i} className="absolute right-1 bottom-1 w-6 h-6 bg-gray-100 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-gray-500" />
                        </div>
                      ) : f.type === 'image' ? (
                        <div key={i} className="w-10 h-5 bg-primary-100 rounded flex items-center justify-center text-primary-600 font-bold text-[8px]">LOGO</div>
                      ) : (
                        <div key={i} className="h-2 bg-gray-200 rounded" style={{ width: `${40 + Math.random() * 50}%` }} />
                      )
                    ))}
                  </div>
                </div>
                <span className="relative z-10 text-3xl font-bold text-gray-300 group-hover:text-primary-400 transition-colors">{tpl.thumbnail}</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">{tpl.name}</h4>
              <p className="text-xs text-gray-500">{tpl.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">{tpl.fields.length} 个字段</span>
                <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  进入编辑 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </TabContainer>
    );
  }

  return (
    <TabContainer>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTemplate(null)} className="btn-secondary text-sm gap-1.5 py-1.5">
            ← 返回模板列表
          </button>
          <div>
            <h3 className="font-semibold text-gray-800">编辑：{selectedTemplate.name}</h3>
            <p className="text-xs text-gray-500">拖拽字段调整位置，点击选中可编辑属性</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm gap-1.5 py-1.5">
            <Save className="w-3.5 h-3.5" />
            另存为模板
          </button>
          <button onClick={() => toastSuccess('保存成功', '模板已更新')} className="btn-primary text-sm gap-1.5 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            保存模板
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-2 space-y-3">
          <div className="card p-4">
            <h4 className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5" />
              可用字段
            </h4>
            <div className="space-y-1.5">
              {AVAILABLE_FIELDS.map(f => (
                <div
                  key={f.id}
                  onClick={() => addField(f)}
                  draggable
                  onDragStart={() => setDraggedField(f.id)}
                  onDragEnd={() => setDraggedField(null)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-move text-sm transition-colors"
                >
                  <f.icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-700">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="card p-6 bg-gray-100">
            <div className="flex justify-center">
              <div
                className="relative bg-white rounded-lg shadow-xl border border-gray-300"
                style={{ width: 320, height: 180 }}
                onClick={() => setSelectedFieldId(null)}
              >
                {fields.map(field => (
                  <div
                    key={field.id}
                    onClick={e => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                    onMouseDown={e => {
                      if (selectedFieldId !== field.id) return;
                      e.stopPropagation();
                      const startX = e.clientX - field.x;
                      const startY = e.clientY - field.y;
                      const onMove = (ev: MouseEvent) => {
                        updateField(field.id, {
                          x: Math.max(0, Math.min(320 - field.width, ev.clientX - startX)),
                          y: Math.max(0, Math.min(180 - field.height, ev.clientY - startY)),
                        });
                      };
                      const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                    }}
                    className={cn(
                      'absolute cursor-move rounded border-2 transition-all text-xs overflow-hidden flex items-center justify-center',
                      selectedFieldId === field.id
                        ? 'border-primary bg-primary-50/50 shadow-md z-10'
                        : 'border-transparent hover:border-gray-300 bg-white/30'
                    )}
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.width,
                      height: field.height,
                    }}
                  >
                    {field.type === 'qrcode' && field.value && (
                      <QRCodeSVG value={field.value} size={Math.min(field.width, field.height) - 4} />
                    )}
                    {field.type === 'image' && (
                      <div className="w-full h-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center rounded">
                        {field.value}
                      </div>
                    )}
                    {(field.type === 'text' || field.type === 'date') && (
                      <div className="w-full text-left px-1 text-gray-700 text-[10px] truncate">
                        {field.value}
                      </div>
                    )}
                    {selectedFieldId === field.id && (
                      <>
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700 text-sm flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                图层列表
              </h4>
              <span className="text-xs text-gray-400">{fields.length} 项</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-auto scrollbar-thin">
              {fields.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors',
                    selectedFieldId === f.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <f.icon className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-700">{f.name}</span>
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteField(f.id); }}
                    className="text-gray-400 hover:text-danger p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedField && (
            <div className="card p-4">
              <h4 className="font-medium text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                字段属性
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs">名称</label>
                  <input
                    className="input-base text-xs py-1.5"
                    value={selectedField.name}
                    onChange={e => updateField(selectedField.id, { name: e.target.value })}
                  />
                </div>
                {(selectedField.type === 'text' || selectedField.type === 'date') && (
                  <div>
                    <label className="form-label text-xs">内容</label>
                    <input
                      className="input-base text-xs py-1.5"
                      value={selectedField.value || ''}
                      onChange={e => updateField(selectedField.id, { value: e.target.value })}
                    />
                  </div>
                )}
                {selectedField.type === 'qrcode' && (
                  <div>
                    <label className="form-label text-xs">二维码值</label>
                    <input
                      className="input-base text-xs py-1.5"
                      value={selectedField.value || ''}
                      onChange={e => updateField(selectedField.id, { value: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label text-xs">X 坐标</label>
                    <input
                      type="number"
                      className="input-base text-xs py-1.5"
                      value={selectedField.x}
                      onChange={e => updateField(selectedField.id, { x: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">Y 坐标</label>
                    <input
                      type="number"
                      className="input-base text-xs py-1.5"
                      value={selectedField.y}
                      onChange={e => updateField(selectedField.id, { y: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">宽度</label>
                    <input
                      type="number"
                      className="input-base text-xs py-1.5"
                      value={selectedField.width}
                      onChange={e => updateField(selectedField.id, { width: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">高度</label>
                    <input
                      type="number"
                      className="input-base text-xs py-1.5"
                      value={selectedField.height}
                      onChange={e => updateField(selectedField.id, { height: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TabContainer>
  );
}

function PrintTab({ toastSuccess }: { toastSuccess: (t: string, d?: string) => void }) {
  const [printer, setPrinter] = useState(PRINTERS[0]);
  const [copies, setCopies] = useState(1);
  const [paperType, setPaperType] = useState<'A4' | 'label'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState(100);
  const [labelCount, setLabelCount] = useState(12);

  const records: PrintRecord[] = [
    { id: '1', time: '2025-06-09 14:32:18', batchNo: 'B20250601001', copies: 50, status: 'success' },
    { id: '2', time: '2025-06-09 11:20:05', batchNo: 'B20250601002', copies: 120, status: 'success' },
    { id: '3', time: '2025-06-08 16:45:33', batchNo: 'B20250531003', copies: 200, status: 'printing' },
    { id: '4', time: '2025-06-08 10:15:42', batchNo: 'B20250531001', copies: 80, status: 'failed' },
    { id: '5', time: '2025-06-07 09:30:11', batchNo: 'B20250530002', copies: 150, status: 'success' },
  ];

  const statusBadge = (s: PrintRecord['status']) => ({
    success: <span className="badge-status-success"><CheckCircle2 className="w-3 h-3" />成功</span>,
    failed: <span className="badge-status-danger"><XCircle className="w-3 h-3" />失败</span>,
    printing: <span className="badge-status-info"><Loader2 className="w-3 h-3 animate-spin" />打印中</span>,
  }[s]);

  const a4Labels = paperType === 'A4' ? Array.from({ length: Math.min(labelCount, copies > 1 ? copies * 12 : 12) }) : [];
  const pages = paperType === 'A4' ? Math.ceil(copies / 1) : Math.ceil(copies / 1);

  return (
    <TabContainer>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="card p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              打印参数
            </h4>
            <div className="space-y-4">
              <div>
                <label className="form-label">打印机</label>
                <select className="input-base" value={printer} onChange={e => setPrinter(e.target.value)}>
                  {PRINTERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">打印份数</label>
                  <input
                    type="number"
                    min={1}
                    className="input-base"
                    value={copies}
                    onChange={e => setCopies(Math.max(1, Number(e.target.value)))}
                  />
                </div>
                <div>
                  <label className="form-label">单页标签数</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    className="input-base"
                    value={labelCount}
                    onChange={e => setLabelCount(Math.max(1, Math.min(24, Number(e.target.value))))}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">纸张类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['A4', 'label'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setPaperType(t)}
                      className={cn(
                        'py-2 rounded-lg border text-sm font-medium transition-all',
                        paperType === t
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {t === 'A4' ? 'A4 纸张' : '标签纸'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">打印方向</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <button
                      key={o}
                      onClick={() => setOrientation(o)}
                      className={cn(
                        'py-2 rounded-lg border text-sm font-medium transition-all',
                        orientation === o
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {o === 'portrait' ? '纵向' : '横向'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                纸张预览
              </h4>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-1.5 rounded hover:bg-white transition-colors"
                >
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs font-medium text-gray-700 w-14 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="p-1.5 rounded hover:bg-white transition-colors"
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-8 min-h-[500px] flex flex-col items-center gap-6 overflow-auto scrollbar-thin">
              {Array.from({ length: Math.min(pages, 3) }).map((_, pageIdx) => (
                <div
                  key={pageIdx}
                  className="bg-white shadow-2xl rounded-sm transition-transform origin-top"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    width: orientation === 'portrait' ? 420 : 594,
                    height: orientation === 'portrait' ? 594 : 420,
                    marginBottom: pageIdx < Math.min(pages, 3) - 1 ? `calc(-${zoom}% + 40px)` : 0,
                  }}
                >
                  <div className="w-full h-full p-8 border border-gray-200">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                      <div>
                        <div className="text-sm font-bold text-gray-800">产品标签 - B20250601001</div>
                        <div className="text-xs text-gray-400">第 {pageIdx + 1} / {pages} 页</div>
                      </div>
                      <QRCodeSVG value={`BATCH-B20250601001-${pageIdx}`} size={36} />
                    </div>
                    <div
                      className={cn(
                        'grid gap-3',
                        labelCount <= 6 ? 'grid-cols-2' : labelCount <= 12 ? 'grid-cols-3' : 'grid-cols-4'
                      )}
                      style={{ gridAutoRows: paperType === 'A4' ? 'auto' : undefined }}
                    >
                      {a4Labels.slice(0, labelCount).map((__, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-2.5 bg-white">
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-gray-800 truncate">阿莫西林胶囊</div>
                              <div className="text-[9px] text-gray-500 mt-0.5">B20250601001</div>
                              <div className="text-[9px] text-gray-500">0.25g*24粒</div>
                              <div className="text-[9px] text-gray-400 mt-1">效期: 2027-06</div>
                            </div>
                            <QRCodeSVG value={`TRACE-${pageIdx}-${idx}`} size={28} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {pages > 3 && (
                <div className="text-xs text-gray-400 mt-2">... 还有 {pages - 3} 页未显示</div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => toastSuccess('任务已提交', `共 ${copies} 份打印任务已发送至 ${printer}`)}
              className="btn-primary gap-2 px-6 py-2.5"
            >
              <Printer className="w-4 h-4" />
              立即打印
            </button>
            <button
              onClick={() => toastSuccess('导出成功', 'PDF 文件已生成并下载')}
              className="btn-secondary gap-2 px-6 py-2.5"
            >
              <Download className="w-4 h-4" />
              导出 PDF
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="card h-full">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                最近打印记录
              </h4>
            </div>
            <div className="p-3 space-y-2 max-h-[520px] overflow-auto scrollbar-thin">
              {records.map(r => (
                <div
                  key={r.id}
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    r.status === 'success' ? 'border-trust-200 bg-trust-50/30' :
                    r.status === 'failed' ? 'border-danger-200 bg-danger-50/30' :
                    'border-primary-200 bg-primary-50/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-[11px] font-mono text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      {r.batchNo}
                    </code>
                    {statusBadge(r.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{r.time.slice(5)}</span>
                    <span>{r.copies} 份</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TabContainer>
  );
}
