import { useState } from 'react';
import {
  Search, ShieldCheck, AlertTriangle, XCircle, Globe, AlertCircle,
  Pill, Stethoscope, Clock, FileText, AlertOctagon, Calendar, Factory,
  Hash, RotateCcw, ChevronRight, MapPin, User, Info
} from 'lucide-react';
import CodeScanner from '@/components/CodeScanner';
import TraceFlowDiagram from '@/components/TraceFlowDiagram';
import {
  publicQueryService,
  SAMPLE_TRACE_CODES,
  PublicVerifyResult,
} from '@/services/reportService';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

type VerifyTab = 'qc' | 'medication' | 'records';

export default function PublicQuery() {
  const [traceCode, setTraceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicVerifyResult | null>(null);
  const [activeTab, setActiveTab] = useState<VerifyTab>('qc');
  const { toastError } = useUIStore();

  const handleQuery = async (forcedOrEvent?: string | React.MouseEvent) => {
    const codeToQuery = (typeof forcedOrEvent === 'string' ? forcedOrEvent : traceCode).trim();
    if (!codeToQuery) {
      toastError('请输入或扫描追溯码');
      return;
    }
    setLoading(true);
    try {
      const res = await publicQueryService.queryByTraceCode(codeToQuery);
      setResult(res);
      setActiveTab('qc');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (code: string) => {
    const trimmed = code?.trim();
    setTraceCode(trimmed || '');
    if (!trimmed) {
      toastError('未扫描到有效追溯码，请重试');
      return;
    }
    handleQuery(trimmed);
  };

  const handleReset = () => {
    setResult(null);
    setTraceCode('');
  };

  const handleSampleClick = (code: string) => {
    setTraceCode(code);
  };

  if (!result) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-full max-w-2xl animate-fadeInUp">
          <div className="card overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-300" />

            <div className="p-8 md:p-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 tracking-wide">
                  药品追溯 · 验真查询
                </h1>
                <p className="text-gray-500 text-base">
                  扫描或输入追溯码，查询药品全链路信息
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="flex flex-col items-center">
                  <CodeScanner onScan={handleScan} />
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    手动输入追溯码
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={traceCode}
                      onChange={(e) => setTraceCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                      placeholder="请输入20位药品追溯码"
                      className="w-full pl-11 pr-14 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-base font-mono"
                    />
                    <button
                      onClick={handleQuery}
                      disabled={loading || !traceCode.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-gradient-primary text-white flex items-center justify-center transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs text-gray-500 mb-2.5 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      热门示例码（点击填充）：
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SAMPLE_TRACE_CODES.map((code) => (
                        <button
                          key={code}
                          onClick={() => handleSampleClick(code)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-200 text-xs font-mono text-gray-600 transition-all duration-200"
                        >
                          {code.slice(0, 8)}...{code.slice(-4)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleQuery}
                    disabled={loading || !traceCode.trim()}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-primary text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    立即验真查询
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: '权威数据源',
                    desc: '国家药品监管局备案',
                    color: 'text-trust-600',
                    bg: 'bg-trust-50',
                    border: 'border-trust-200',
                  },
                  {
                    icon: Globe,
                    title: '全链路追溯',
                    desc: '从原料到门店一目了然',
                    color: 'text-primary-600',
                    bg: 'bg-primary-50',
                    border: 'border-primary-200',
                  },
                  {
                    icon: AlertCircle,
                    title: '异常预警',
                    desc: '过期/召回药品即时提示',
                    color: 'text-warning-600',
                    bg: 'bg-warning-50',
                    border: 'border-warning-200',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className={cn(
                        'rounded-xl border-2 p-5 transition-all duration-300 hover:shadow-md stagger-item',
                        item.bg, item.border
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <Icon className={cn('w-5 h-5', item.color)} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900">验真查询结果</h1>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-secondary text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          重新查询
        </button>
      </div>

      <div className="card p-8 overflow-hidden">
        <div className="flex flex-col items-center mb-8">
          {result.status === 'authentic' && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-trust-400 to-trust-600 flex items-center justify-center shadow-lg animate-pulseGlow" style={{ boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' }}>
                  <ShieldCheck className="w-16 h-16 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h2 className="mt-5 text-2xl font-serif font-bold text-trust-700">真品认证</h2>
              <p className="mt-2 text-gray-600">
                该追溯码系第 <span className="font-semibold text-primary-700">{result.verifyCount}</span> 次查询，请放心使用
              </p>
            </div>
          )}

          {result.status === 'suspicious' && (
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="mt-5 text-2xl font-serif font-bold text-warning-700">多次验真，谨防假冒</h2>
              <p className="mt-2 text-gray-600">
                该追溯码已被查询 <span className="font-semibold text-warning-700">{result.verifyCount}</span> 次，建议核对实物包装
              </p>
            </div>
          )}

          {result.status === 'not_found' && (
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-danger-400 to-danger-600 flex items-center justify-center shadow-lg">
                <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="mt-5 text-2xl font-serif font-bold text-danger-700">未查询到追溯信息</h2>
              <p className="mt-2 text-gray-600">请确认追溯码输入正确，或联系客服咨询</p>
            </div>
          )}
        </div>

        {result.status !== 'not_found' && result.product && (
          <>
            {result.product.isRecalled && result.product.recallInfo && (
              <div className="mb-6 rounded-xl border-2 border-danger-300 bg-danger-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-6 h-6 text-danger-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="flex-1">
                    <div className="font-bold text-danger-800 flex items-center gap-2">
                      产品召回公告
                      <span className="px-2 py-0.5 rounded text-xs bg-danger-200 text-danger-800 font-medium">
                        {result.product.recallInfo.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-danger-700">
                      召回原因：{result.product.recallInfo.reason}
                    </p>
                    <p className="mt-1 text-xs text-danger-600">
                      召回单号：{result.product.recallInfo.orderNo} · 请立即停止使用并联系购药门店
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result.product.isExpiring && !result.product.isRecalled && (
              <div className="mb-6 rounded-xl border-2 border-warning-300 bg-warning-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-warning-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="flex-1">
                    <div className="font-bold text-warning-800">近效期预警</div>
                    <p className="mt-1 text-sm text-warning-700">
                      该药品距有效期仅剩 <span className="font-semibold">{result.product.daysToExpiry}</span> 天，建议尽快使用
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-6 mb-8">
              <div className="flex items-center gap-2 mb-5 text-gray-700">
                <Pill className="w-5 h-5 text-primary-600" strokeWidth={2} />
                <span className="font-semibold">产品基础信息</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div className="col-span-2 md:col-span-3">
                  <div className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
                    {result.product.productName}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{result.product.spec}</div>
                </div>
                {[
                  { icon: Hash, label: '批号', value: result.product.batchNo },
                  { icon: Calendar, label: '生产日期', value: result.product.productionDate },
                  { icon: Calendar, label: '有效期至', value: result.product.expiryDate, danger: result.product.isExpiring },
                  { icon: Factory, label: '生产厂家', value: result.product.manufacturer, colSpan: true },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={cn('rounded-lg bg-white p-4 border border-gray-100', item.colSpan && 'col-span-2 md:col-span-3')}
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </div>
                      <div className={cn('font-medium', item.danger ? 'text-warning-700' : 'text-gray-800')}>
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5 text-gray-700">
                <Globe className="w-5 h-5 text-primary-600" strokeWidth={2} />
                <span className="font-semibold">追溯链路图</span>
                <span className="text-xs text-gray-500 ml-1">（点击节点查看详情）</span>
              </div>
              {result.traceFlow && (
                <div className="rounded-xl border border-gray-200 p-6 bg-white overflow-x-auto">
                  <TraceFlowDiagram nodes={result.traceFlow} />
                </div>
              )}
            </div>

            <div>
              <div className="flex border-b border-gray-200 mb-5">
                {[
                  { id: 'qc' as const, label: '质检报告', icon: FileText },
                  { id: 'medication' as const, label: '用药提示', icon: Stethoscope },
                  { id: 'records' as const, label: '验真记录', icon: Clock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all duration-200',
                        active
                          ? 'text-primary-600 border-primary-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeTab === 'qc' && result.qcItems && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3.5 font-semibold text-gray-700">项目名称</th>
                        <th className="px-5 py-3.5 font-semibold text-gray-700">标准值</th>
                        <th className="px-5 py-3.5 font-semibold text-gray-700">实测值</th>
                        <th className="px-5 py-3.5 font-semibold text-gray-700 text-center">结论</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.qcItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5 text-gray-800 font-medium">{item.itemName}</td>
                          <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{item.standardValue}</td>
                          <td className="px-5 py-3.5 text-gray-800 font-mono text-xs">{item.actualValue}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                              item.conclusion === '合格'
                                ? 'bg-trust-50 text-trust-700 border border-trust-200'
                                : 'bg-danger-50 text-danger-700 border border-danger-200'
                            )}>
                              {item.conclusion === '合格' ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {item.conclusion}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'medication' && result.medicationTips && (
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Pill,
                      title: '用法用量',
                      content: result.medicationTips.usage,
                      color: 'bg-primary-50 text-primary-700 border-primary-200',
                      iconBg: 'bg-primary-100',
                    },
                    {
                      icon: AlertOctagon,
                      title: '禁忌',
                      content: result.medicationTips.contraindications,
                      color: 'bg-danger-50 text-danger-700 border-danger-200',
                      iconBg: 'bg-danger-100',
                    },
                    {
                      icon: Factory,
                      title: '储存条件',
                      content: result.medicationTips.storage,
                      color: 'bg-purple-50 text-purple-700 border-purple-200',
                      iconBg: 'bg-purple-100',
                    },
                    {
                      icon: Stethoscope,
                      title: '注意事项',
                      content: result.medicationTips.precautions,
                      color: 'bg-warning-50 text-warning-700 border-warning-200',
                      iconBg: 'bg-warning-100',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className={cn('rounded-xl border p-5 transition-all hover:shadow-sm', item.color)}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.iconBg)}>
                            <Icon className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <h3 className="font-bold">{item.title}</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700">{item.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'records' && result.verifyRecords && (
                <div className="space-y-3">
                  {result.verifyRecords.map((record, idx) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
                    >
                      <div className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                        idx === 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        <User className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800">第 {result.verifyRecords.length - idx} 次验真</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {record.channel}
                          </span>
                          {idx === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                              本次
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {record.verifyTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {record.location}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
