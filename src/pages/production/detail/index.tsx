import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useBatchStore from '@/stores/batchStore';
import useUIStore from '@/stores/uiStore';
import BatchStatusTimeline from '@/components/business/BatchStatusTimeline';
import TraceTimeline, { type ProcessStepData } from '@/components/business/TraceTimeline';
import QRCodeWithLabel from '@/components/business/QRCodeWithLabel';
import {
  ArrowLeft,
  BarChart3,
  FlaskConical,
  Settings,
  CheckSquare,
  Package,
  CalendarDays,
  Factory,
  User,
  Hash,
  CalendarClock,
  TrendingUp,
  Activity,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Plus,
  Upload,
  FileText,
  Trash2,
  Download,
  Send,
  ClipboardList,
  ShieldCheck,
  ScanLine,
  Printer,
  Edit3,
  Clock,
  BadgeCheck,
  Eye,
} from 'lucide-react';

type TabKey = 'overview' | 'materials' | 'process' | 'qc';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: '概览', icon: BarChart3 },
  { key: 'materials', label: '原料信息', icon: FlaskConical },
  { key: 'process', label: '工序进度', icon: Settings },
  { key: 'qc', label: '质检报告', icon: CheckSquare },
];

const QC_ITEMS_META: { id: string; name: string; standard: string; passResult: string }[] = [
  { id: '1', name: '外观性状', standard: '本品为白色或类白色片', passResult: '本品为白色片，色泽均匀，符合规定' },
  { id: '2', name: '重量差异', standard: '±7.5%以内', passResult: '平均片重0.2512g，RSD=1.23%，在±7.5%范围内' },
  { id: '3', name: '崩解时限', standard: '≤30分钟', passResult: '12.5分钟全部崩解，远低于30分钟上限' },
  { id: '4', name: '溶出度', standard: '≥80%（30min）', passResult: '平均溶出度92.3%，达到标准要求' },
  { id: '5', name: '含量测定', standard: '标示量的95.0%~105.0%', passResult: '平均含量99.62%，落在95.0%~105.0%区间内' },
  { id: '6', name: '微生物限度', standard: '细菌总数≤1000cfu/g', passResult: '细菌总数<10cfu/g，霉菌、酵母菌均未检出' },
  { id: '7', name: '有关物质', standard: '单个杂质≤0.5%，总杂质≤1.5%', passResult: '单个最大杂质0.12%，总杂质0.28%，符合规定' },
];

const QC_ITEMS: { id: string; name: string; standard: string; result: string; resultType: 'pass' | 'pending' | 'fail'; inspector: string; inspectTime: string }[] = [
  { id: '1', name: '外观性状', standard: '本品为白色或类白色片', result: '符合规定', resultType: 'pass', inspector: '赵质检', inspectTime: '2024-03-16 10:23' },
  { id: '2', name: '重量差异', standard: '±7.5%以内', result: '平均重量0.2512g，RSD=1.23%', resultType: 'pass', inspector: '赵质检', inspectTime: '2024-03-16 10:45' },
  { id: '3', name: '崩解时限', standard: '≤30分钟', result: '12.5分钟全部崩解', resultType: 'pass', inspector: '钱质检', inspectTime: '2024-03-16 11:12' },
  { id: '4', name: '溶出度', standard: '≥80%（30min）', result: '平均溶出度92.3%', resultType: 'pass', inspector: '钱质检', inspectTime: '2024-03-16 13:34' },
  { id: '5', name: '含量测定', standard: '标示量的95.0%~105.0%', result: '99.62%', resultType: 'pass', inspector: '孙质检', inspectTime: '2024-03-16 15:08' },
  { id: '6', name: '微生物限度', standard: '细菌总数≤1000cfu/g', result: '检出1200cfu/g，超标', resultType: 'fail', inspector: '周质检', inspectTime: '2024-03-16 17:20' },
  { id: '7', name: '有关物质', standard: '单个杂质≤0.5%，总杂质≤1.5%', result: '单个最大杂质0.12%，总杂质0.28%', resultType: 'pass', inspector: '孙质检', inspectTime: '2024-03-16 16:40' },
];

const MOCK_MATERIALS = [
  { id: 'm1', supplierName: '国药集团化学试剂有限公司', rawMaterialNo: 'RM20240315-1', rawMaterialName: '药用淀粉', inboundDate: '2024-03-12', qcCertNo: 'QC2024031201', qty: 250, unit: 'kg' },
  { id: 'm2', supplierName: '江苏恩华药业股份有限公司', rawMaterialNo: 'RM20240310-A', rawMaterialName: '阿莫西林原料药', inboundDate: '2024-03-10', qcCertNo: 'QC2024031008', qty: 125, unit: 'kg' },
  { id: 'm3', supplierName: '山东聊城阿华制药有限公司', rawMaterialNo: 'RM20240308-2', rawMaterialName: '交联聚维酮', inboundDate: '2024-03-08', qcCertNo: 'QC2024030815', qty: 18, unit: 'kg' },
  { id: 'm4', supplierName: '安徽山河药用辅料股份有限公司', rawMaterialNo: 'RM20240305-7', rawMaterialName: '硬脂酸镁', inboundDate: '2024-03-05', qcCertNo: 'QC2024030522', qty: 6, unit: 'kg' },
  { id: 'm5', supplierName: '浙江仙琚制药股份有限公司', rawMaterialNo: 'RM20240301-4', rawMaterialName: '药用乳糖', inboundDate: '2024-03-01', qcCertNo: 'QC2024030107', qty: 80, unit: 'kg' },
];

const DEFAULT_QC_ITEMS = QC_ITEMS;

export default function ProductionDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { batches, loadBatches, loadBatch, currentBatch, updateBatch, submitQC, loading, detailLoading } = useBatchStore();
  const { setPageTitle, toastSuccess, toastError } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [qcModalOpen, setQcModalOpen] = useState(false);

  const batch = currentBatch?.id === id ? currentBatch : batches.find(b => b.id === id);

  const qcConclusionFromReport: 'qualified' | 'unqualified' | 'pending' =
    batch?.qcReport?.overallResult === '合格'
      ? 'qualified'
      : batch?.qcReport?.overallResult === '不合格'
      ? 'unqualified'
      : 'pending';
  const [qcConclusion, setQcConclusion] = useState<'qualified' | 'unqualified' | 'pending'>(qcConclusionFromReport);
  const [qcRemarks, setQcRemarks] = useState(batch?.qcReport?.remark ?? '');
  const [abnormalItemIds, setAbnormalItemIds] = useState<Set<string>>(new Set());
  const [abnormalFields, setAbnormalFields] = useState<Record<string, { result: string; handleRemark: string }>>({});

  const toggleAbnormalItem = (id: string) => {
    setAbnormalItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!abnormalFields[id]) {
          setAbnormalFields(pf => ({ ...pf, [id]: { result: '', handleRemark: '' } }));
        }
      }
      return next;
    });
  };

  const updateAbnormalField = (id: string, key: 'result' | 'handleRemark', value: string) => {
    setAbnormalFields(prev => ({
      ...prev,
      [id]: {
        result: prev[id]?.result ?? '',
        handleRemark: prev[id]?.handleRemark ?? '',
        [key]: value,
      },
    }));
  };

  const resetQcState = () => {
    setQcConclusion(qcConclusionFromReport);
    setQcRemarks(batch?.qcReport?.remark ?? '');
    setAbnormalItemIds(new Set());
    setAbnormalFields({});
  };

  useEffect(() => {
    setPageTitle('批次详情');
    if (id) loadBatch(id);
    else if (batches.length === 0) loadBatches({ page: 1, pageSize: 100 });
  }, [setPageTitle, loadBatch, loadBatches, batches.length, id]);

  useEffect(() => {
    if (batch?.qcReport) {
      setQcConclusion(qcConclusionFromReport);
      setQcRemarks(batch.qcReport.remark ?? '');
    }
  }, [batch?.qcReport, qcConclusionFromReport]);

  const statusBadgeConfig: Record<string, string> = {
    待生产: 'bg-slate-100 text-slate-700 border-slate-200',
    生产中: 'bg-blue-50 text-blue-600 border-blue-200',
    已完成: 'bg-green-50 text-green-600 border-green-200',
    质检中: 'bg-amber-50 text-amber-600 border-amber-200',
    已入库: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    已出库: 'bg-teal-50 text-teal-600 border-teal-200',
  };

  const mockProcessSteps: ProcessStepData[] = [
    {
      id: 'p1',
      stepOrder: 1,
      stepName: '预处理',
      operator: '张工',
      equipment: '清洗机-01',
      startTime: '2024-03-14 08:00',
      endTime: '2024-03-14 09:30',
      status: 'completed',
      parameters: { '清洗温度': '40℃', '清洗时间': '15min', '饮用水流速': '2.5L/s' },
      remark: '原料清洗干净，无可见异物',
    },
    {
      id: 'p2',
      stepOrder: 2,
      stepName: '称量',
      operator: '李工',
      equipment: '电子秤-A03',
      startTime: '2024-03-14 09:45',
      endTime: '2024-03-14 11:20',
      status: 'completed',
      parameters: { '称量精度': '0.01g', '双人复核': '是', '环境温度': '22℃' },
      remark: '原料双人称量复核完成，偏差<0.1%',
    },
    {
      id: 'p3',
      stepOrder: 3,
      stepName: '制粒',
      operator: '王工',
      equipment: '制粒机-GH-200',
      startTime: '2024-03-14 13:00',
      endTime: '2024-03-14 15:40',
      status: 'completed',
      parameters: { '粘合剂浓度': '8%PVPK30', '搅拌转速': '250rpm', '制粒时间': '8min' },
      remark: '颗粒成型良好，粒度分布符合要求',
    },
    {
      id: 'p4',
      stepOrder: 4,
      stepName: '干燥',
      operator: '赵工',
      equipment: '流化床干燥机',
      startTime: '2024-03-14 16:00',
      endTime: '2024-03-14 18:30',
      status: 'completed',
      parameters: { '进风温度': '65℃', '干燥终点水分': '<3%', '物料温度': '≤55℃' },
      remark: '水分实测2.13%，合格',
    },
    {
      id: 'p5',
      stepOrder: 5,
      stepName: '整粒',
      operator: '钱工',
      equipment: '整粒机-ZL-300',
      startTime: '2024-03-15 08:00',
      endTime: '2024-03-15 09:00',
      status: 'completed',
      parameters: { '筛网目数': '20目', '过筛速度': '中等' },
      remark: '颗粒粒度均匀',
    },
    {
      id: 'p6',
      stepOrder: 6,
      stepName: '混合',
      operator: '孙工',
      equipment: '三维混合机',
      startTime: '2024-03-15 09:15',
      endTime: '2024-03-15 10:15',
      status: 'completed',
      parameters: { '混合转速': '15rpm', '混合时间': '30min', '装量系数': '65%' },
      remark: '混合均匀度RSD=1.02%，合格',
    },
    {
      id: 'p7',
      stepOrder: 7,
      stepName: '压片',
      operator: '周工',
      equipment: '高速压片机',
      startTime: '2024-03-15 13:00',
      endTime: '2024-03-15 19:20',
      status: 'processing',
      parameters: { '冲头规格': 'φ9mm浅凹', '转速': '28rpm', '主压力': '15kN' },
      remark: '目前已压片约85%，重量差异稳定',
    },
    {
      id: 'p8',
      stepOrder: 8,
      stepName: '包装',
      operator: '吴工',
      equipment: '自动包装线',
      startTime: undefined,
      endTime: undefined,
      status: 'pending',
      parameters: { '包装规格': '24粒/盒', '铝塑膜材质': 'PVC/PVDC' },
      remark: '待压片完成后开始',
    },
  ];

  const handleSubmitQC = async () => {
    if (qcConclusion === 'pending') {
      toastError('请选择质检结论');
      return;
    }
    if (qcConclusion === 'unqualified') {
      if (abnormalItemIds.size === 0) {
        toastError('请至少勾选 1 个不合格检验项');
        return;
      }
      let allFilled = true;
      abnormalItemIds.forEach(id => {
        const f = abnormalFields[id];
        if (!f?.result?.trim() || !f?.handleRemark?.trim()) allFilled = false;
      });
      if (!allFilled) {
        toastError('请完整填写勾选项的异常结果与处理说明');
        return;
      }
    }
    const overallResult = qcConclusion === 'qualified' ? '合格' : '不合格';
    const inspectorName = '当前质检员';
    const reportDate = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const items: { itemName: string; standard: string; testResult: string; isPass: boolean }[] = QC_ITEMS_META.map(meta => {
      const isAbnormal = abnormalItemIds.has(meta.id);
      if (qcConclusion === 'qualified' || !isAbnormal) {
        return {
          itemName: meta.name,
          standard: meta.standard,
          testResult: meta.passResult,
          isPass: true,
        };
      }
      const f = abnormalFields[meta.id] ?? { result: '', handleRemark: '' };
      return {
        itemName: meta.name,
        standard: meta.standard,
        testResult: f.result.trim() || '不符合标准规定',
        isPass: false,
      };
    });

    let finalRemark = qcRemarks.trim();
    if (qcConclusion === 'unqualified') {
      const prefixParts: string[] = [];
      abnormalItemIds.forEach(id => {
        const meta = QC_ITEMS_META.find(m => m.id === id);
        const f = abnormalFields[id];
        if (meta && f) {
          prefixParts.push(`【${meta.name}】异常结果：${f.result.trim()}；处理：${f.handleRemark.trim()}`);
        }
      });
      const prefix = prefixParts.join(' | ');
      finalRemark = finalRemark ? `${prefix}。备注：${finalRemark}` : `${prefix}。`;
    }

    const result = await submitQC(id, {
      reportNo: `QC${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      reportDate,
      inspector: inspectorName,
      overallResult,
      items,
      remark: finalRemark || (qcConclusion === 'qualified' ? '全项检验合格，准予放行。' : ''),
    } as any);
    if (result) {
      toastSuccess(`批次 ${batch?.batchNo} 质检结论：${overallResult}，已提交`);
      setQcModalOpen(false);
      resetQcState();
    } else {
      toastError('质检结论提交失败，请重试');
    }
  };

  if ((loading || detailLoading) && !batch) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">批次详情加载中...</span>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="card p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">批次不存在</h3>
          <p className="text-sm text-gray-500 mb-6">未找到 ID 为 "{id}" 的批次信息</p>
          <button
            onClick={() => navigate('/production')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回生产记录
          </button>
        </div>
      </div>
    );
  }

  const planQty = batch.planQty ?? 0;
  const actualQty = batch.actualQty ?? 0;
  const passRate = planQty > 0 ? Math.min(100, Math.round((actualQty / planQty) * 100)) : 0;

  const realMaterials = (batch.rawMaterials?.length ? batch.rawMaterials : (MOCK_MATERIALS as any)).map((m: any, i: number) => ({
    id: m.id || `m${i}`,
    supplierName: m.supplierName || m.supplier || '未知供应商',
    rawMaterialNo: m.rawMaterialNo || m.batchNo || 'N/A',
    rawMaterialName: m.rawMaterialName || m.name || '未知原料',
    inboundDate: m.inboundDate || m.receiveDate || m.receivedDate || '',
    qcCertNo: m.qcCertNo || m.qcCert || '-',
    qty: m.qty ?? m.quantity ?? 0,
    unit: m.unit ?? 'kg',
    inspectionResult: m.inspectionResult,
  }));

  const realSteps: ProcessStepData[] = batch.processSteps?.length
    ? batch.processSteps.map((s: any) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        stepName: s.stepName,
        operator: s.operator || '—',
        equipment: s.equipment || (s.parameters as any)?.设备 || '-',
        startTime: s.startTime || undefined,
        endTime: s.endTime || undefined,
        status: s.status === '已完成' ? 'completed' : s.status === '进行中' ? 'processing' : 'pending',
        parameters: s.parameters || {},
        remark: s.remark || '',
      }))
    : mockProcessSteps;

  const processProgress = realSteps.length
    ? Math.round(realSteps.filter(s => s.status === 'completed').length / realSteps.length * 100)
    : 0;

  const realQCItems: {
    id: string;
    name: string;
    standard: string;
    result: string;
    resultType: 'pending' | 'pass' | 'fail';
    inspector: string;
    inspectTime: string;
  }[] = batch.qcReport?.items?.length
    ? batch.qcReport.items.map((it: any, idx: number) => ({
        id: String(idx + 1),
        name: it.itemName || it.name || `检验项${idx + 1}`,
        standard: it.standard || '—',
        result: it.testResult || it.actual || '已检验',
        resultType: ((it.isPass === true || it.result === true) ? 'pass' : it.isPass === false ? 'fail' : 'pending') as 'pending' | 'pass' | 'fail',
        inspector: batch.qcReport?.inspector || '质检员',
        inspectTime: batch.qcReport?.reportDate || '',
      }))
    : DEFAULT_QC_ITEMS;

  const qcProgress = realQCItems.length
    ? Math.round(realQCItems.filter((i: any) => i.resultType !== 'pending').length / realQCItems.length * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => navigate('/production')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center group-hover:border-primary group-hover:bg-primary-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          返回生产记录列表
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            打印报表
          </button>
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出PDF
          </button>
          <button
            onClick={() => navigate('/production/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            新建批次
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/5 via-indigo-500/5 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{batch.productName}</h2>
                  <p className="font-mono text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Hash className="w-3.5 h-3.5" />
                    {batch.batchNo}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border',
                  statusBadgeConfig[batch.status] ?? statusBadgeConfig['待生产']
                )}
              >
                {batch.status === '生产中' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                {batch.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              <InfoItem icon={<CalendarDays className="w-4 h-4" />} label="规格" value={batch.spec} />
              <InfoItem icon={<Factory className="w-4 h-4" />} label="生产厂家" value={batch.manufacturer} compact />
              <InfoItem icon={<User className="w-4 h-4" />} label="负责人" value={batch.manager ?? '—'} />
              <InfoItem icon={<CalendarClock className="w-4 h-4" />} label="工艺路线" value={(batch as any).processRoute ?? '常规口服固体制剂线A'} compact />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              <InfoItem icon={<Activity className="w-4 h-4 text-blue-500" />} label="生产日期" value={batch.productionDate} highlight="blue" />
              <InfoItem icon={<BadgeCheck className="w-4 h-4 text-amber-500" />} label="有效期至" value={batch.expiryDate} highlight="amber" />
              <InfoItem icon={<TrendingUp className="w-4 h-4 text-green-500" />} label="计划产量" value={`${planQty.toLocaleString()} ${batch.unit}`} highlight="green" />
              <InfoItem icon={<ClipboardList className="w-4 h-4 text-indigo-500" />} label="实际产量" value={`${actualQty.toLocaleString()} ${batch.unit}`} highlight="indigo" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ProgressCard label="生产进度" value={processProgress} color="blue" hint={`${realSteps.filter(s => s.status === 'completed').length}/${realSteps.length} 道工序`} />
              <ProgressCard label="合格率" value={passRate} color={passRate >= 95 ? 'green' : passRate >= 90 ? 'amber' : 'red'} hint={`实际 ${actualQty.toLocaleString()} / 计划 ${planQty.toLocaleString()}`} />
              <ProgressCard label="质检进度" value={qcProgress} color="purple" hint={`${realQCItems.filter((i: any) => i.resultType !== 'pending').length}/${realQCItems.length} 项已检`} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <QRCodeWithLabel
              value={`TMS://BATCH/${batch.batchNo}/${encodeURIComponent(batch.productName)}`}
              labelData={{
                batchNo: batch.batchNo ?? '',
                productName: batch.productName,
                spec: batch.spec,
                productionDate: batch.productionDate?.toString(),
                expiryDate: batch.expiryDate?.toString(),
                manufacturer: batch.manufacturer,
              }}
              template="standard"
              title="追溯二维码"
              subtitle={batch.batchNo}
              batchInfo={{ productName: batch.productName, spec: batch.spec, productionDate: batch.productionDate?.toString() ?? '' }}
              size={160}
            />
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary text-xs font-medium hover:bg-primary-100 transition-colors">
                <ScanLine className="w-3.5 h-3.5" />
                扫码核验
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                <Edit3 className="w-3.5 h-3.5" />
                编辑信息
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-100 px-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 sm:px-5 py-4 text-sm font-medium whitespace-nowrap transition-all',
                    isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className={cn('w-4 h-4 transition-transform', isActive && 'scale-110')} />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-indigo-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 md:p-7">
          {activeTab === 'overview' && <OverviewTab batch={batch} />}
          {activeTab === 'materials' && <MaterialsTab materials={realMaterials} />}
          {activeTab === 'process' && <ProcessTab steps={realSteps} />}
          {activeTab === 'qc' && (
            <QCTab
              batchNo={batch.batchNo}
              onOpenSubmit={() => setQcModalOpen(true)}
              conclusion={qcConclusionFromReport}
              items={realQCItems}
              qcReport={batch.qcReport as any}
            />
          )}
        </div>
      </div>

      {qcModalOpen && (
        <QCModal
          batchNo={batch.batchNo}
          open
          onClose={() => {
            setQcModalOpen(false);
            resetQcState();
          }}
          conclusion={qcConclusion}
          setConclusion={setQcConclusion}
          remarks={qcRemarks}
          setRemarks={setQcRemarks}
          onSubmit={handleSubmitQC}
          abnormalItemIds={abnormalItemIds}
          toggleAbnormalItem={toggleAbnormalItem}
          abnormalFields={abnormalFields}
          updateAbnormalField={updateAbnormalField}
        />
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  highlight,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: 'blue' | 'amber' | 'green' | 'indigo';
  compact?: boolean;
}) {
  const bgMap = {
    blue: 'bg-blue-50 text-blue-500',
    amber: 'bg-amber-50 text-amber-500',
    green: 'bg-green-50 text-green-500',
    indigo: 'bg-indigo-50 text-indigo-500',
  };
  return (
    <div className={cn('rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-3.5 shadow-sm')}>
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
            highlight ? bgMap[highlight] : 'bg-gray-50 text-gray-400'
          )}
        >
          {icon}
        </div>
        <span className="text-[11px] text-gray-500">{label}</span>
      </div>
      <p className={cn('font-medium text-gray-800 leading-tight', compact ? 'text-sm truncate' : 'text-base')} title={value}>
        {value}
      </p>
    </div>
  );
}

function ProgressCard({ label, value, color, hint }: { label: string; value: number; color: 'blue' | 'green' | 'amber' | 'red' | 'purple'; hint: string }) {
  const colorMap = {
    blue: 'from-blue-400 to-blue-500',
    green: 'from-green-400 to-emerald-500',
    amber: 'from-amber-400 to-orange-500',
    red: 'from-red-400 to-rose-500',
    purple: 'from-purple-400 to-fuchsia-500',
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xl font-bold text-gray-800">
          {value}<span className="text-sm text-gray-400 ml-0.5">%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div
          className={cn('h-full bg-gradient-to-r transition-all duration-1000 rounded-full', colorMap[color])}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-400">{hint}</p>
    </div>
  );
}

function OverviewTab({ batch }: { batch: any }) {
  const { toastSuccess } = useUIStore();
  const passRate = batch.planQty > 0 ? Math.round((batch.actualQty / batch.planQty) * 100) : 0;
  const statusList = [
    {
      key: 'created',
      label: '批次创建',
      status: 'completed' as const,
      operator: '系统/李经理',
      time: batch.productionDate + ' 08:00',
      remark: '批次基础信息录入',
    },
    {
      key: 'producing',
      label: '开始生产',
      status: 'completed' as const,
      operator: batch.manager ?? '王主管',
      time: batch.productionDate + ' 08:30',
      remark: '按工艺路线启动生产',
    },
    {
      key: 'qc',
      label: '生产完成',
      status: 'current' as const,
      operator: batch.manager ?? '王主管',
      time: '预计 ' + batch.productionDate.slice(0, 8) + '18 19:30',
      remark: '压片工序进行中，完成度85%',
    },
    {
      key: 'stored',
      label: '质量检验',
      status: 'upcoming' as const,
      operator: '质检部',
      time: '',
      remark: '待生产完成后启动',
    },
    {
      key: 'transit',
      label: '入库上架',
      status: 'upcoming' as const,
      operator: '仓储组',
      time: '',
      remark: '',
    },
    {
      key: 'sold',
      label: '流通待售',
      status: 'upcoming' as const,
      operator: '销售部',
      time: '',
      remark: '',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={<Hash />} color="blue" label="批次号" value={batch.batchNo} mono sub="唯一追溯码" />
        <MetricCard icon={<CheckSquare />} color="green" label="状态" value={batch.status} sub="当前生产阶段" />
        <MetricCard icon={<Package />} color="purple" label="规格" value={batch.spec} sub={batch.unit} />
        <MetricCard icon={<TrendingUp />} color="indigo" label="合格率" value={passRate + '%'} sub={`${batch.actualQty}/${batch.planQty}${batch.unit}`} />
        <MetricCard icon={<Clock />} color="amber" label="生产天数" value="3天" sub="3/14-3/16" />
        <MetricCard icon={<User />} color="sky" label="负责人" value={batch.manager ?? '—'} sub="生产主管" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            批次流转状态时间轴
          </h3>
          <button
            onClick={() => toastSuccess('流转详情已刷新')}
            className="text-xs text-primary hover:text-primary-600 font-medium"
          >
            刷新状态
          </button>
        </div>
        <BatchStatusTimeline
          batchStatus="qc"
          events={statusList}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  color,
  label,
  value,
  sub,
  mono,
}: {
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'indigo' | 'sky';
  label: string;
  value: string | number;
  sub?: string;
  mono?: boolean;
}) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200/50',
    green: 'from-emerald-500 to-green-600 shadow-green-200/50',
    purple: 'from-purple-500 to-fuchsia-600 shadow-purple-200/50',
    amber: 'from-amber-500 to-orange-600 shadow-amber-200/50',
    indigo: 'from-indigo-500 to-violet-600 shadow-indigo-200/50',
    sky: 'from-sky-500 to-cyan-600 shadow-sky-200/50',
  };
  return (
    <div className="relative group rounded-2xl bg-white border border-gray-100 p-4 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300 overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md', colorMap[color])}>
          {Icon}
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <p className={cn('text-base font-bold text-gray-800 leading-tight break-all', mono && 'font-mono text-sm')}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MaterialsTab({ materials }: { materials: any[] }) {
  const { toastSuccess } = useUIStore();
  const totalQty = materials.reduce((a: number, b: any) => a + (Number(b.qty) || 0), 0);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          原料清单（共 {materials.length} 种）
        </h3>
        <button
          onClick={() => toastSuccess('请在批次创建时登记完整原料信息')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加原料
        </button>
      </div>

      <div className="overflow-x-auto -mx-6 md:-mx-7 scrollbar-thin">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/80 text-xs text-gray-500 border-y border-gray-100">
              <th className="text-left font-medium px-6 md:px-7 py-3">#</th>
              <th className="text-left font-medium px-3 py-3">供应商</th>
              <th className="text-left font-medium px-3 py-3">原料名称</th>
              <th className="text-left font-medium px-3 py-3">原料批号</th>
              <th className="text-left font-medium px-3 py-3">数量</th>
              <th className="text-left font-medium px-3 py-3">进厂日期</th>
              <th className="text-left font-medium px-3 py-3">质检证号</th>
              <th className="text-center font-medium px-6 md:px-7 py-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m: any, i: number) => (
              <tr key={m.id || i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="px-6 md:px-7 py-4 text-xs text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-3 py-4">
                  <p className="text-sm font-medium text-gray-800">{m.supplierName}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">合格供应商</p>
                </td>
                <td className="px-3 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-medium">
                    <FlaskConical className="w-3 h-3" />
                    {m.rawMaterialName}
                  </span>
                </td>
                <td className="px-3 py-4 font-mono text-xs text-gray-600">{m.rawMaterialNo}</td>
                <td className="px-3 py-4">
                  <p className="text-sm font-semibold text-gray-800">{m.qty} <span className="text-xs text-gray-400 font-normal">{m.unit}</span></p>
                </td>
                <td className="px-3 py-4 text-sm text-gray-600 font-mono">{m.inboundDate}</td>
                <td className="px-3 py-4 font-mono text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    {m.qcCertNo}
                  </span>
                </td>
                <td className="px-6 md:px-7 py-4 text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold",
                    m.inspectionResult === '不合格'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-green-50 text-green-600 border-green-100'
                  )}>
                    {m.inspectionResult === '不合格' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {m.inspectionResult || '已核验'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
          <p className="text-xs text-sky-600 mb-1">原料种类</p>
          <p className="text-2xl font-bold text-sky-700">{materials.length}<span className="text-xs font-normal ml-1">种</span></p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
          <p className="text-xs text-emerald-600 mb-1">总投料量</p>
          <p className="text-2xl font-bold text-emerald-700">{totalQty.toLocaleString()}<span className="text-xs font-normal ml-1">kg</span></p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          <p className="text-xs text-indigo-600 mb-1">质检状态</p>
          <p className="text-2xl font-bold text-indigo-700">
            {materials.length ? Math.round(materials.filter((m: any) => m.inspectionResult !== '不合格').length / materials.length * 100) : 0}%
            <span className="text-xs font-normal ml-1">合格</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProcessTab({ steps }: { steps: ProcessStepData[] }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          生产工序进度详情
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" />待开始</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />进行中</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />已完成</span>
        </div>
      </div>

      <TraceTimeline steps={steps} />
    </div>
  );
}

function QCTab({
  batchNo,
  onOpenSubmit,
  conclusion,
  items,
  qcReport,
}: {
  batchNo: string;
  onOpenSubmit: () => void;
  conclusion: 'qualified' | 'unqualified' | 'pending';
  items: typeof DEFAULT_QC_ITEMS;
  qcReport?: {
    reportNo?: string;
    reportDate?: string;
    inspector?: string;
    remark?: string;
  } | null;
}) {
  const { toastSuccess } = useUIStore();
  const attachments = [
    { id: 'f1', name: '批生产记录.pdf', size: '2.4MB', uploader: '张工', time: '2024-03-16 17:05' },
    { id: 'f2', name: '含量测定色谱图.png', size: '860KB', uploader: '孙质检', time: '2024-03-16 16:42' },
    { id: 'f3', name: '微生物限度报告.pdf', size: '1.1MB', uploader: '赵质检', time: '2024-03-16 15:30' },
  ];

  const passCount = items.filter((i: any) => i.resultType === 'pass').length;

  const conclusionBadge =
    conclusion === 'qualified' ? (
      <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-green-200">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-green-600 mb-0.5">质检总结论</p>
          <p className="text-lg font-bold text-green-700">合格</p>
        </div>
      </div>
    ) : conclusion === 'unqualified' ? (
      <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-200">
          <X className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-red-600 mb-0.5">质检总结论</p>
          <p className="text-lg font-bold text-red-700">不合格</p>
        </div>
      </div>
    ) : (
      <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-amber-600 mb-0.5">质检总结论</p>
          <p className="text-lg font-bold text-amber-700">待出具</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {conclusionBadge}
        <button
          onClick={onOpenSubmit}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-105 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          提交质检结论
        </button>
      </div>

      {qcReport && (qcReport.reportNo || qcReport.remark) && (
                <div className={cn(
                  "rounded-2xl border-2 p-4 space-y-2",
                  conclusion === 'unqualified'
                    ? "bg-red-50/50 border-red-200"
                    : "bg-indigo-50/50 border-indigo-200"
                )}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {qcReport.reportNo && (
                      <div>
                        <span className="text-gray-500">报告编号：</span>
                        <span className="font-mono font-semibold text-gray-800">{qcReport.reportNo}</span>
                      </div>
                    )}
                    {qcReport.reportDate && (
                      <div>
                        <span className="text-gray-500">质检日期：</span>
                        <span className="font-medium text-gray-800">{qcReport.reportDate}</span>
                      </div>
                    )}
                    {qcReport.inspector && (
                      <div>
                        <span className="text-gray-500">质检员：</span>
                        <span className="font-medium text-gray-800">{qcReport.inspector}</span>
                      </div>
                    )}
                  </div>
                  {qcReport.remark && (
                    <div>
                      <p className={cn(
                        "text-xs font-medium mb-1",
                        conclusion === 'unqualified' ? "text-red-600" : "text-indigo-600"
                      )}>
                        {conclusion === 'unqualified' ? '不合格说明 / 处理建议' : '质检备注'}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed bg-white/60 rounded-xl px-3 py-2 border border-gray-100">
                        {qcReport.remark}
                      </p>
                    </div>
                  )}
                </div>
              )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCardMini title="总检验项" value={items.length} color="blue" />
        <StatCardMini title="合格项" value={passCount} color="green" />
        <StatCardMini title="不合格项" value={items.filter((i: any) => i.resultType === 'fail').length || 0} color="red" />
        <StatCardMini title="待检项" value={items.filter((i: any) => i.resultType === 'pending').length} color="amber" />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          检验项目明细
        </h4>
        <div className="overflow-x-auto -mx-6 md:-mx-7 scrollbar-thin">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="bg-gray-50/80 text-xs text-gray-500 border-y border-gray-100">
                <th className="text-left font-medium px-6 md:px-7 py-3">#</th>
                <th className="text-left font-medium px-3 py-3">检验项目</th>
                <th className="text-left font-medium px-3 py-3">标准规定</th>
                <th className="text-left font-medium px-3 py-3">检验结果</th>
                <th className="text-center font-medium px-3 py-3">判定</th>
                <th className="text-left font-medium px-3 py-3">检验人</th>
                <th className="text-left font-medium px-3 py-3">时间</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 md:px-7 py-3.5 text-xs text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-3 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-gray-600 max-w-[220px]">{item.standard}</td>
                  <td className="px-3 py-3.5 text-sm text-gray-700 max-w-[260px]">
                    {item.result || <span className="text-gray-400 italic">— 待检测 —</span>}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {item.resultType === 'pass' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 text-[11px] font-semibold">
                        <Check className="w-3 h-3" />合格
                      </span>
                    ) : item.resultType === 'fail' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-[11px] font-semibold">
                        <X className="w-3 h-3" />不合格
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[11px] font-semibold">
                        <Clock className="w-3 h-3" />待检
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-sm text-gray-600">{item.inspector || '—'}</td>
                  <td className="px-3 py-3.5 text-sm text-gray-500 font-mono text-xs">{item.inspectTime || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            附件与记录 <span className="text-xs font-normal text-gray-400">({attachments.length} 个文件)</span>
          </h4>
          <button
            onClick={() => toastSuccess('请选择需要上传的质检附件')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-primary-300 bg-primary-50/50 text-primary text-xs font-medium hover:bg-primary-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            上传附件
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {attachments.map(f => (
            <div
              key={f.id}
              className="group relative p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:shadow-blue-50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{f.name}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{f.size} · {f.time}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">上传人：{f.uploader}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <button className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-[11px] font-medium hover:bg-gray-100 transition-colors">
                  <Download className="w-3 h-3" />下载
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-[11px] font-medium hover:bg-gray-100 transition-colors">
                  <Eye className="w-3 h-3" />预览
                </button>
                <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => toastSuccess('选择文件上传')}
            className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/30 transition-all min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:border-primary-300 transition-all">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 group-hover:text-primary">点击上传</p>
              <p className="text-[10px] text-gray-400 mt-0.5">或拖拽文件到此处</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCardMini({ title, value, color }: { title: string; value: number; color: 'blue' | 'green' | 'red' | 'amber' }) {
  const map = {
    blue: 'from-blue-50 to-indigo-50 text-blue-600 border-blue-100',
    green: 'from-emerald-50 to-green-50 text-green-600 border-green-100',
    red: 'from-red-50 to-rose-50 text-red-600 border-red-100',
    amber: 'from-amber-50 to-orange-50 text-amber-600 border-amber-100',
  };
  return (
    <div className={cn('p-4 rounded-2xl border bg-gradient-to-br', map[color])}>
      <p className="text-[11px] opacity-80 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QCModal({
  open,
  onClose,
  conclusion,
  setConclusion,
  remarks,
  setRemarks,
  onSubmit,
  batchNo,
  abnormalItemIds,
  toggleAbnormalItem,
  abnormalFields,
  updateAbnormalField,
}: {
  open: boolean;
  onClose: () => void;
  conclusion: 'qualified' | 'unqualified' | 'pending';
  setConclusion: (c: 'qualified' | 'unqualified' | 'pending') => void;
  remarks: string;
  setRemarks: (s: string) => void;
  onSubmit: () => void;
  batchNo: string;
  abnormalItemIds: Set<string>;
  toggleAbnormalItem: (id: string) => void;
  abnormalFields: Record<string, { result: string; handleRemark: string }>;
  updateAbnormalField: (id: string, key: 'result' | 'handleRemark', value: string) => void;
}) {
  if (!open) return null;
  const options: { key: 'qualified' | 'unqualified'; label: string; desc: string; icon: React.ReactNode; activeClass: string; borderClass: string }[] = [
    {
      key: 'qualified',
      label: '合格',
      desc: '全部检验项目符合标准规定',
      icon: <ShieldCheck className="w-7 h-7" />,
      activeClass: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-700 shadow-lg shadow-green-100',
      borderClass: 'border-green-200 hover:border-green-300 hover:bg-green-50/50',
    },
    {
      key: 'unqualified',
      label: '不合格',
      desc: '存在不符合标准规定的项目',
      icon: <AlertTriangle className="w-7 h-7" />,
      activeClass: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400 text-red-700 shadow-lg shadow-red-100',
      borderClass: 'border-red-200 hover:border-red-300 hover:bg-red-50/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl animate-fadeInUp overflow-hidden flex flex-col">
        <div className="relative p-6 bg-gradient-to-br from-primary via-indigo-500 to-purple-500 text-white shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs text-white/70 mb-1">{batchNo}</p>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Send className="w-5 h-5" />
                提交质检总结论
              </h3>
              <p className="text-xs text-white/80 mt-1">
                {conclusion === 'unqualified'
                  ? '请勾选异常检验项并填写异常结果与处理说明'
                  : '请选择该批次的最终质检结论'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {options.map(opt => {
              const active = conclusion === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setConclusion(opt.key)}
                  className={cn(
                    'p-5 rounded-2xl border-2 text-left transition-all relative',
                    active ? opt.activeClass : `text-gray-600 ${opt.borderClass}`
                  )}
                >
                  {active && (
                    <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white text-green-600 flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className={cn('mb-2', active ? '' : 'text-gray-400')}>{opt.icon}</div>
                  <p className={cn('text-base font-bold mb-0.5', active ? '' : 'text-gray-700')}>{opt.label}</p>
                  <p className={cn('text-xs', active ? 'opacity-80' : 'text-gray-400')}>{opt.desc}</p>
                </button>
              );
            })}
          </div>

          {conclusion === 'unqualified' && (
            <div className="space-y-3 rounded-2xl border-2 border-red-100 bg-red-50/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-semibold">不合格检验项明细</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                  已勾选 {abnormalItemIds.size} / {QC_ITEMS_META.length} 项
                </span>
              </div>
              <p className="text-[11px] text-red-600/80 leading-relaxed">
                勾选存在异常的检验项（至少 1 项），并为每项填写 <b>异常结果描述</b> 与 <b>处理说明</b>；
                未勾选的项目将自动视为合格。
              </p>
              <div className="space-y-2.5">
                {QC_ITEMS_META.map((meta, idx) => {
                  const checked = abnormalItemIds.has(meta.id);
                  const f = abnormalFields[meta.id] ?? { result: '', handleRemark: '' };
                  return (
                    <div
                      key={meta.id}
                      className={cn(
                        'rounded-xl border-2 bg-white transition-all overflow-hidden',
                        checked ? 'border-red-300 shadow-sm' : 'border-gray-100'
                      )}
                    >
                      <label
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 cursor-pointer select-none',
                          checked ? 'bg-red-50/60' : 'hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAbnormalItem(meta.id)}
                            className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">#{String(idx + 1).padStart(2, '0')}</span>
                            <span className={cn('text-sm font-semibold', checked ? 'text-red-800' : 'text-gray-800')}>
                              {meta.name}
                            </span>
                            {checked && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                                异常
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">标准：{meta.standard}</p>
                        </div>
                      </label>
                      {checked && (
                        <div className="border-t border-red-100 p-3 pt-3.5 space-y-2.5 bg-red-50/30">
                          <div className="space-y-1">
                            <label className="flex items-center gap-1 text-[11px] font-medium text-red-700">
                              <AlertCircle className="w-3 h-3" />
                              异常结果描述 <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={f.result}
                              onChange={e => updateAbnormalField(meta.id, 'result', e.target.value)}
                              placeholder={`例：${meta.name}实测值为 xxx，超出标准规定`}
                              className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="flex items-center gap-1 text-[11px] font-medium text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              处理说明 <span className="text-red-400">*</span>
                            </label>
                            <textarea
                              value={f.handleRemark}
                              onChange={e => updateAbnormalField(meta.id, 'handleRemark', e.target.value)}
                              rows={2}
                              placeholder="请填写针对本项异常的处理方式、处置建议或后续行动..."
                              className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              备注/说明
              {conclusion === 'unqualified' && <span className="text-gray-400 ml-0.5">（可选，整体补充说明）</span>}
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder={conclusion === 'unqualified'
                ? '整体补充说明（如批次总处置建议、责任人等，非必填）'
                : '请填写质检备注、异常情况说明或不合格处理建议等...'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/80 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-105 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            确认提交
          </button>
        </div>
      </div>
    </div>
  );
}
