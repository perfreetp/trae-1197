import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import useBatchStore from '@/stores/batchStore';
import useUIStore from '@/stores/uiStore';
import {
  FileText,
  PackagePlus,
  Cog,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Info,
  Factory,
  User,
  Wrench,
  Check,
  AlertCircle,
} from 'lucide-react';

const PRODUCT_LIST = [
  '阿莫西林胶囊',
  '布洛芬片',
  '感冒灵颗粒',
  '头孢克洛片',
  '布洛芬缓释胶囊',
  '复方氨酚烷胺片',
  '盐酸左氧氟沙星片',
  '连花清瘟胶囊',
  '甲硝唑片',
  '板蓝根颗粒',
];

const DEFAULT_PROCESS_STEPS = [
  { stepOrder: 1, stepName: '预处理', equipment: '清洗机-01', operator: '张工' },
  { stepOrder: 2, stepName: '称量', equipment: '电子秤-A03', operator: '李工' },
  { stepOrder: 3, stepName: '制粒', equipment: '制粒机-GH-200', operator: '王工' },
  { stepOrder: 4, stepName: '干燥', equipment: '流化床干燥机', operator: '赵工' },
  { stepOrder: 5, stepName: '整粒', equipment: '整粒机-ZL-300', operator: '钱工' },
  { stepOrder: 6, stepName: '混合', equipment: '三维混合机', operator: '孙工' },
  { stepOrder: 7, stepName: '压片', equipment: '高速压片机', operator: '周工' },
  { stepOrder: 8, stepName: '包装', equipment: '自动包装线', operator: '吴工' },
];

const PROCESS_ROUTES = ['常规口服固体制剂线A', '常规口服固体制剂线B', '缓释制剂专用线', '颗粒剂专用线'];
const OPERATORS = ['张工', '李工', '王工', '赵工', '钱工', '孙工', '周工', '吴工', '郑工', '冯工'];

const STEPS = [
  { id: 1, title: '基础信息', icon: FileText },
  { id: 2, title: '原料登记', icon: PackagePlus },
  { id: 3, title: '工序配置', icon: Cog },
  { id: 4, title: '质检提交', icon: CheckCircle2 },
];

const baseInfoSchema = z.object({
  productName: z.string().min(1, '请选择产品'),
  spec: z.string().min(2, '规格不能为空(至少2字符)').max(50),
  planQty: z.coerce.number().int().min(100, '计划产量至少100单位').max(9999999),
  productionDate: z.string().min(1, '请选择生产日期'),
  expiryDate: z.string().min(1, '请选择有效期至'),
  processRoute: z.string().min(1, '请选择工艺路线'),
  manager: z.string().min(2, '负责人姓名不少于2字').max(20),
  manufacturer: z.string().min(2, '生产厂家不少于2字').max(50),
  unit: z.string().min(1, '请选择单位'),
}).refine(data => data.expiryDate > data.productionDate, {
  message: '有效期必须晚于生产日期',
  path: ['expiryDate'],
});

const materialSchema = z.object({
  supplierName: z.string().min(2, '供应商不少于2字').max(50),
  rawMaterialNo: z.string().min(3, '原料批号不少于3字符').max(30),
  rawMaterialName: z.string().min(2, '原料名称不少于2字').max(50),
  inboundDate: z.string().min(1, '请选择进厂日期'),
  qcCertNo: z.string().min(3, '质检证号不少于3字符').max(30),
});

const processStepSchema = z.object({
  stepOrder: z.number().int().min(1),
  stepName: z.string().min(1, '工序名称不能为空'),
  operator: z.string().min(1, '请选择责任人'),
  equipment: z.string().min(1, '请指定设备'),
});

const formSchema = z.object({
  baseInfo: baseInfoSchema,
  materials: z.array(materialSchema).min(1, '至少添加1个原料记录'),
  processSteps: z.array(processStepSchema).min(1, '至少配置1道工序'),
});

type FormValues = z.infer<typeof formSchema>;

function StepperHeader({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 relative',
                    isDone
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200 scale-105'
                      : isActive
                      ? 'bg-gradient-to-br from-primary to-indigo-500 text-white shadow-lg shadow-primary/30 scale-105'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  {isActive && (
                    <span className="absolute inset-0 rounded-2xl border-2 border-primary-300 animate-ping opacity-40" />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      'text-xs font-semibold transition-colors',
                      isDone || isActive ? 'text-gray-800' : 'text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Step 0{step.id}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-4 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      isDone
                        ? 'w-full bg-gradient-to-r from-green-400 to-emerald-500'
                        : isActive
                        ? 'w-1/2 bg-gradient-to-r from-primary to-indigo-400'
                        : 'w-0'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NewProduction() {
  const navigate = useNavigate();
  const { createBatch } = useBatchStore();
  const { setPageTitle, toastSuccess, toastError, toastInfo } = useUIStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 2);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    trigger,
    getValues,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      baseInfo: {
        productName: '',
        spec: '',
        planQty: 10000,
        productionDate: today,
        expiryDate: nextYear.toISOString().split('T')[0],
        processRoute: PROCESS_ROUTES[0],
        manager: '',
        manufacturer: '国药集团健康药业有限公司',
        unit: '粒',
      },
      materials: [
        {
          supplierName: '国药集团化学试剂有限公司',
          rawMaterialNo: `RM${Date.now().toString().slice(-6)}-1`,
          rawMaterialName: '药用淀粉',
          inboundDate: today,
          qcCertNo: `QC${Date.now().toString().slice(-6)}`,
        },
      ],
      processSteps: DEFAULT_PROCESS_STEPS,
    },
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({ control, name: 'materials' });

  useEffect(() => {
    setPageTitle('新建批次');
  }, [setPageTitle]);

  const goNext = async () => {
    const stepValid = await trigger(
      currentStep === 1 ? 'baseInfo' : currentStep === 2 ? 'materials' : 'processSteps'
    );
    if (!stepValid) {
      toastError('请完善当前步骤中的必填信息');
      return;
    }
    setCurrentStep(s => Math.min(4, s + 1));
  };

  const goPrev = () => setCurrentStep(s => Math.max(1, s - 1));

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const batchNo = `P${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const batch = await createBatch({
        batchNo,
        productName: data.baseInfo.productName,
        spec: data.baseInfo.spec,
        planQty: data.baseInfo.planQty,
        actualQty: Math.floor(data.baseInfo.planQty * (0.92 + Math.random() * 0.07)),
        productionDate: data.baseInfo.productionDate,
        expiryDate: data.baseInfo.expiryDate,
        manufacturer: data.baseInfo.manufacturer,
        status: '待生产',
        unit: data.baseInfo.unit,
        manager: data.baseInfo.manager,
        processRoute: data.baseInfo.processRoute,
      });

      await new Promise(r => setTimeout(r, 800));
      toastSuccess(`批次 ${batchNo} 创建成功！`);
      setTimeout(() => navigate(`/production/${batch.id}`), 600);
    } catch (e) {
      toastError('创建批次失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/production')}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新建生产批次</h1>
            <p className="text-sm text-gray-500 mt-0.5">按步骤填写批次信息、原料和生产工序配置</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
          <Info className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-amber-700">提交后不可修改核心信息</span>
        </div>
      </div>

      <div className="card p-8">
        <StepperHeader currentStep={currentStep} />

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <div className="animate-fadeInUp space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-sm shadow-primary/30">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">基础信息</h3>
                  <p className="text-xs text-gray-500">填写批次的基本生产资料</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  label="产品名称"
                  required
                  error={errors.baseInfo?.productName?.message}
                >
                  <select
                    {...register('baseInfo.productName')}
                    className="input-base bg-white cursor-pointer"
                  >
                    <option value="">请选择产品</option>
                    {PRODUCT_LIST.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="规格"
                  required
                  placeholder="如：0.25g*24粒/盒"
                  error={errors.baseInfo?.spec?.message}
                >
                  <input {...register('baseInfo.spec')} className="input-base" />
                </FormField>

                <FormField
                  label="计划产量"
                  required
                  error={errors.baseInfo?.planQty?.message}
                  suffix={
                    <select
                      {...register('baseInfo.unit')}
                      className="h-full px-3 bg-gray-50 rounded-r-xl border-0 border-l border-gray-200 text-sm cursor-pointer focus:outline-none"
                    >
                      <option value="粒">粒</option>
                      <option value="片">片</option>
                      <option value="袋">袋</option>
                      <option value="盒">盒</option>
                      <option value="瓶">瓶</option>
                    </select>
                  }
                >
                  <input
                    type="number"
                    min={100}
                    {...register('baseInfo.planQty')}
                    className="input-base"
                  />
                </FormField>

                <FormField
                  label="工艺路线"
                  required
                  error={errors.baseInfo?.processRoute?.message}
                >
                  <select
                    {...register('baseInfo.processRoute')}
                    className="input-base bg-white cursor-pointer"
                  >
                    {PROCESS_ROUTES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="生产日期"
                  required
                  error={errors.baseInfo?.productionDate?.message}
                >
                  <input
                    type="date"
                    {...register('baseInfo.productionDate')}
                    className="input-base"
                  />
                </FormField>

                <FormField
                  label="有效期至"
                  required
                  error={errors.baseInfo?.expiryDate?.message}
                >
                  <input
                    type="date"
                    {...register('baseInfo.expiryDate')}
                    className="input-base"
                  />
                </FormField>

                <FormField
                  label="生产负责人"
                  required
                  error={errors.baseInfo?.manager?.message}
                  icon={<User className="w-4 h-4 text-gray-400" />}
                >
                  <input {...register('baseInfo.manager')} className="input-base pl-10" />
                </FormField>

                <FormField
                  label="生产厂家"
                  required
                  error={errors.baseInfo?.manufacturer?.message}
                  icon={<Factory className="w-4 h-4 text-gray-400" />}
                >
                  <input {...register('baseInfo.manufacturer')} className="input-base pl-10" />
                </FormField>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-fadeInUp space-y-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-sm shadow-green-200">
                    <PackagePlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">原料登记</h3>
                    <p className="text-xs text-gray-500">登记本批次使用的所有原料信息（共 {materialFields.length} 条）</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    appendMaterial({
                      supplierName: '',
                      rawMaterialNo: `RM${Date.now().toString().slice(-6)}-${materialFields.length + 1}`,
                      rawMaterialName: '',
                      inboundDate: today,
                      qcCertNo: `QC${Date.now().toString().slice(-6)}${materialFields.length + 1}`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 border border-emerald-100 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  添加原料
                </button>
              </div>

              {errors.materials?.root?.message && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.materials.root.message}
                </div>
              )}

              <div className="space-y-4">
                {materialFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative border border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50/30 hover:shadow-md hover:shadow-gray-100/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700">
                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-green-500 text-white flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        原料 #{index + 1}
                      </span>
                      {materialFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        label="供应商名称"
                        required
                        compact
                        error={errors.materials?.[index]?.supplierName?.message}
                      >
                        <input {...register(`materials.${index}.supplierName`)} className="input-base" />
                      </FormField>

                      <FormField
                        label="原料批号"
                        required
                        compact
                        error={errors.materials?.[index]?.rawMaterialNo?.message}
                      >
                        <input {...register(`materials.${index}.rawMaterialNo`)} className="input-base font-mono" />
                      </FormField>

                      <FormField
                        label="原料名称"
                        required
                        compact
                        error={errors.materials?.[index]?.rawMaterialName?.message}
                      >
                        <input {...register(`materials.${index}.rawMaterialName`)} className="input-base" />
                      </FormField>

                      <FormField
                        label="进厂日期"
                        required
                        compact
                        error={errors.materials?.[index]?.inboundDate?.message}
                      >
                        <input
                          type="date"
                          {...register(`materials.${index}.inboundDate`)}
                          className="input-base"
                        />
                      </FormField>

                      <FormField
                        label="质检证号"
                        required
                        compact
                        error={errors.materials?.[index]?.qcCertNo?.message}
                      >
                        <input {...register(`materials.${index}.qcCertNo`)} className="input-base font-mono" />
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-fadeInUp space-y-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm shadow-blue-200">
                    <Cog className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">工序配置</h3>
                    <p className="text-xs text-gray-500">配置本批次需要经过的生产工序（共 {getValues('processSteps').length} 道）</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  可编辑责任人与设备
                </div>
              </div>

              <div className="space-y-3">
                {getValues('processSteps').map((step, index) => (
                  <div
                    key={`${step.stepOrder}-${step.stepName}`}
                    className="relative grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-sm hover:shadow-blue-50 transition-all group"
                  >
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">工序号</label>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-blue-200">
                          {String(step.stepOrder).padStart(2, '0')}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4">
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">工序名称</label>
                      <Controller
                        control={control}
                        name={`processSteps.${index}.stepName`}
                        render={({ field }) => (
                          <input {...field} readOnly className="input-base bg-gray-50 text-gray-700 font-medium" />
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">责任人</label>
                      <Controller
                        control={control}
                        name={`processSteps.${index}.operator`}
                        render={({ field }) => (
                          <select {...field} className="input-base bg-white cursor-pointer">
                            <option value="">请选择</option>
                            {OPERATORS.map(op => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.processSteps?.[index]?.operator?.message && (
                        <p className="text-[11px] text-red-500 mt-1">
                          {errors.processSteps[index].operator.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">设备编号</label>
                      <Controller
                        control={control}
                        name={`processSteps.${index}.equipment`}
                        render={({ field }) => (
                          <input {...field} className="input-base" />
                        )}
                      />
                      {errors.processSteps?.[index]?.equipment?.message && (
                        <p className="text-[11px] text-red-500 mt-1">
                          {errors.processSteps[index].equipment.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-fadeInUp space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">提交预览</h3>
                  <p className="text-xs text-gray-500">请核对所有信息，确认无误后提交</p>
                </div>
              </div>

              <PreviewSection title="基础信息" icon={<FileText className="w-4 h-4" />} color="blue">
                <PreviewGrid
                  items={[
                    ['产品名称', getValues('baseInfo.productName')],
                    ['规格', getValues('baseInfo.spec')],
                    ['计划产量', `${getValues('baseInfo.planQty').toLocaleString()} ${getValues('baseInfo.unit')}`],
                    ['工艺路线', getValues('baseInfo.processRoute')],
                    ['生产日期', getValues('baseInfo.productionDate')],
                    ['有效期至', getValues('baseInfo.expiryDate')],
                    ['生产负责人', getValues('baseInfo.manager')],
                    ['生产厂家', getValues('baseInfo.manufacturer')],
                  ]}
                />
              </PreviewSection>

              <PreviewSection
                title={`原料登记（共 ${getValues('materials').length} 条）`}
                icon={<PackagePlus className="w-4 h-4" />}
                color="green"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 text-xs text-gray-500 border-b border-gray-100">
                        <th className="text-left font-medium px-3 py-2.5">#</th>
                        <th className="text-left font-medium px-3 py-2.5">供应商</th>
                        <th className="text-left font-medium px-3 py-2.5">原料批号</th>
                        <th className="text-left font-medium px-3 py-2.5">原料名称</th>
                        <th className="text-left font-medium px-3 py-2.5">进厂日期</th>
                        <th className="text-left font-medium px-3 py-2.5">质检证号</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getValues('materials').map((m, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="px-3 py-2.5 text-xs text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2.5 text-gray-700">{m.supplierName}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{m.rawMaterialNo}</td>
                          <td className="px-3 py-2.5 text-gray-700">{m.rawMaterialName}</td>
                          <td className="px-3 py-2.5 text-gray-600">{m.inboundDate}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{m.qcCertNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PreviewSection>

              <PreviewSection
                title={`工序配置（共 ${getValues('processSteps').length} 道）`}
                icon={<Cog className="w-4 h-4" />}
                color="sky"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {getValues('processSteps').map(s => (
                    <div
                      key={s.stepOrder}
                      className="p-3 rounded-xl bg-gray-50/60 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center">
                          {s.stepOrder}
                        </span>
                        <p className="text-sm font-semibold text-gray-700">{s.stepName}</p>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        <User className="w-3 h-3 inline mr-1 -mt-0.5" />
                        {s.operator}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate" title={s.equipment}>
                        <Wrench className="w-3 h-3 inline mr-1 -mt-0.5" />
                        {s.equipment}
                      </p>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            </div>
          )}

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              第 <span className="font-semibold text-gray-700">{currentStep}</span> / 4 步
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-105 transition-all active:scale-95"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:brightness-105 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      提交并创建批次
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
  icon,
  suffix,
  compact,
  placeholder,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  compact?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className={cn('text-xs font-medium text-gray-600', compact ? '' : 'mb-1 block')}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className={cn('relative flex', suffix && 'pr-0')}>
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            {icon}
          </span>
        )}
        {children}
        {suffix}
      </div>
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function PreviewSection({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'sky' | 'amber';
  children: React.ReactNode;
}) {
  const colorMap = {
    blue: 'from-blue-500 to-indigo-500 bg-blue-50 text-blue-600 border-blue-100',
    green: 'from-green-500 to-emerald-500 bg-green-50 text-green-600 border-green-100',
    sky: 'from-sky-500 to-cyan-500 bg-sky-50 text-sky-600 border-sky-100',
    amber: 'from-amber-500 to-orange-500 bg-amber-50 text-amber-600 border-amber-100',
  };
  const [grad, bg, text, border] = colorMap[color].split(' ');
  return (
    <div className={cn('rounded-2xl border overflow-hidden', border)}>
      <div className={cn('flex items-center gap-2 px-4 py-3', bg)}>
        <div className={cn('w-7 h-7 rounded-lg bg-gradient-to-br text-white flex items-center justify-center shadow-sm', grad)}>
          {icon}
        </div>
        <h4 className={cn('text-sm font-semibold', text)}>{title}</h4>
      </div>
      <div className="p-4 bg-white">{children}</div>
    </div>
  );
}

function PreviewGrid({ items }: { items: [string, string | number][] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50/60 border border-gray-100">
          <span className="text-xs text-gray-500 min-w-[90px] shrink-0 pt-0.5">{k}</span>
          <span className="text-sm font-medium text-gray-800 break-all">{v || '—'}</span>
        </div>
      ))}
    </div>
  );
}
