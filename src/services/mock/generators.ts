
import dayjs from 'dayjs';

/**
 * 工具函数：生成指定范围内的随机整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 工具函数：从数组中随机选取一个元素
 */
function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * 工具函数：生成近半年范围内的随机日期
 */
function randomDate(): string {
  const now = dayjs();
  const start = now.subtract(6, 'month');
  const diffDays = now.diff(start, 'day');
  const randomDays = randomInt(0, diffDays);
  return start.add(randomDays, 'day').format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 工具函数：基于基准日期生成偏移日期
 */
function offsetDate(base: string, days: number, hours: number = 0): string {
  return dayjs(base).add(days, 'day').add(hours, 'hour').format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 工具函数：生成UUID格式ID（简化版）
 */
function genId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// ===== 产品与药品名称库 =====
const PRODUCT_NAMES = [
  { name: '阿莫西林胶囊', spec: '0.25g*24粒', manufacturer: '华北制药股份有限公司' },
  { name: '布洛芬片', spec: '0.2g*20片', manufacturer: '中美天津史克制药有限公司' },
  { name: '感冒灵颗粒', spec: '10g*9袋', manufacturer: '三九医药股份有限公司' },
  { name: '头孢克洛片', spec: '0.25g*12片', manufacturer: '石药集团欧意药业有限公司' },
  { name: '布洛芬缓释胶囊', spec: '0.3g*20粒', manufacturer: '中美天津史克制药有限公司' },
  { name: '复方氨酚烷胺片', spec: '12片/盒', manufacturer: '吉林省吴太感康药业有限公司' },
  { name: '盐酸左氧氟沙星片', spec: '0.5g*6片', manufacturer: '扬子江药业集团有限公司' },
  { name: '连花清瘟胶囊', spec: '0.35g*48粒', manufacturer: '石家庄以岭药业股份有限公司' },
  { name: '甲硝唑片', spec: '0.2g*100片', manufacturer: '山东齐都药业有限公司' },
  { name: '板蓝根颗粒', spec: '10g*20袋', manufacturer: '白云山和记黄埔中药有限公司' },
];

const STATUS_LIST = ['待生产', '生产中', '已完成', '质检中', '已入库', '已出库'] as const;
const QC_STATUS = ['待送检', '检测中', '合格', '不合格'] as const;
const PROCESS_STEPS = ['原料验收', '配料称重', '混合制粒', '干燥整粒', '总混', '压片/灌装', '内包装', '外包装'] as const;

// 经销商名称前缀
const DEALER_PREFIXES = ['华康', '仁信', '天和', '万通', '泰和', '康源', '盛达', '恒信', '荣泰', '益民', '和谐', '顺天'];
const DEALER_SUFFIXES = ['医药有限公司', '药业有限公司', '医疗器械有限公司', '生物科技有限公司'];

// 门店前缀
const STORE_PREFIXES = ['百姓', '益丰', '大参林', '同仁堂', '一心堂', '张仲景', '国大', '成大方圆', '华氏', '众友'];

// 仓库和操作人
const WAREHOUSES = ['一号成品仓', '二号成品仓', '冷链仓库', '原料仓库A区', '原料仓库B区'];
const LOCATIONS = ['A-01-01', 'A-02-03', 'B-01-05', 'B-03-02', 'C-02-04', 'C-04-01', 'D-01-02', 'D-02-03'];
const OPERATORS = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵敏', '孙磊'];

// 城市列表
const CITIES = ['北京', '上海', '广州', '深圳', '成都', '武汉', '杭州', '南京', '西安', '重庆', '天津', '苏州', '郑州', '长沙', '沈阳', '青岛'];

// ===== 类型定义 =====
export interface RawMaterial {
  id: string;
  name: string;
  batchNo: string;
  supplier: string;
  quantity: number;
  unit: string;
  receiveDate: string;
  inspectionResult: '合格' | '不合格' | '待检';
}

export interface ProcessStep {
  id: string;
  stepName: typeof PROCESS_STEPS[number];
  stepOrder: number;
  startTime: string;
  endTime: string | null;
  operator: string;
  parameters: Record<string, string | number>;
  status: '待开始' | '进行中' | '已完成';
}

export interface QCItem {
  itemName: string;
  standard: string;
  testResult: string;
  isPass: boolean;
}

export interface QCReport {
  id: string;
  reportNo: string;
  reportDate: string;
  inspector: string;
  overallResult: '合格' | '不合格' | '待判定';
  items: QCItem[];
  remark: string;
}

export interface Batch {
  id: string;
  batchNo: string;
  productName: string;
  spec: string;
  manufacturer: string;
  manager?: string;
  planQty: number;
  actualQty: number;
  unit: string;
  status: typeof STATUS_LIST[number];
  productionDate: string;
  expiryDate: string;
  processRoute?: string;
  rawMaterials: RawMaterial[];
  processSteps: ProcessStep[];
  qcReport: QCReport | null;
  createdAt: string;
  updatedAt: string;
  isFrozen: boolean;
}

export interface TraceCode {
  id: string;
  batchId: string;
  batchNo: string;
  level: '箱' | '盒' | '瓶';
  code: string;
  parentCode: string | null;
  productName: string;
  generatedAt: string;
  status: '未使用' | '已入库' | '已出库' | '经销商签收' | '门店收货' | '已验真';
  location: string;
}

export interface Dealer {
  id: string;
  dealerName: string;
  contactPerson: string;
  phone: string;
  city: string;
  address: string;
  licenseNo: string;
  level: '一级' | '二级' | '三级';
  status: '正常' | '暂停' | '注销';
  createdAt: string;
}

export interface Store {
  id: string;
  storeName: string;
  dealerId: string;
  contactPerson: string;
  phone: string;
  city: string;
  address: string;
  businessHours: string;
  level: '标准店' | '旗舰店' | '社区店';
  status: '正常' | '暂停' | '注销';
  createdAt: string;
}

export interface WarehouseRecord {
  id: string;
  recordNo: string;
  traceCode: string;
  batchId: string;
  batchNo: string;
  productName: string;
  type: '入库' | '出库';
  warehouse: string;
  location: string;
  quantity: number;
  relatedOrderId: string | null;
  relatedDealerId: string | null;
  operator: string;
  operateTime: string;
  remark: string;
}

export interface RecallProgress {
  id: string;
  step: string;
  description: string;
  status: '待处理' | '进行中' | '已完成';
  operator: string;
  completeTime: string | null;
  remark: string;
}

export interface RecallOrder {
  id: string;
  orderNo: string;
  batchId: string;
  batchNo: string;
  productName: string;
  reason: string;
  level: '一级召回' | '二级召回' | '三级召回';
  status: '待启动' | '召回中' | '已完成' | '已取消';
  initiator: string;
  affectedQty: number;
  recalledQty: number;
  createdAt: string;
  expectCompleteDate: string;
  progressList: RecallProgress[];
}

export interface OperationLog {
  id: string;
  logNo: string;
  operator: string;
  module: string;
  action: string;
  targetId: string;
  targetName: string;
  operateTime: string;
  ip: string;
  remark: string;
  status: '成功' | '失败';
}

export interface ConsumerVerify {
  id: string;
  verifyNo: string;
  traceCode: string;
  batchId: string;
  batchNo: string;
  productName: string;
  verifyTime: string;
  consumerPhone: string;
  verifyLocation: string;
  verifyChannel: '微信小程序' | 'APP' | '官网' | '短信';
  isFirst: boolean;
  isAuthentic: boolean;
  remark: string;
}

// ===== 生成函数 =====

/**
 * 生成 n 个批次（含嵌套的 rawMaterials、processSteps、qcReport）
 */
export function generateBatches(n: number): Batch[] {
  const batches: Batch[] = [];
  for (let i = 0; i < n; i++) {
    const product = randomPick(PRODUCT_NAMES);
    const planQty = randomInt(5000, 30000);
    const actualQty = Math.round(planQty * (randomInt(92, 100) / 100));
    const productionDate = randomDate();
    const expiryDate = dayjs(productionDate).add(randomInt(18, 36), 'month').format('YYYY-MM-DD');
    const status = randomPick(STATUS_LIST as unknown as string[]);

    const rawMaterials: RawMaterial[] = [];
    const materialCount = randomInt(3, 6);
    const materialNames = ['微晶纤维素', '乳糖', '硬脂酸镁', '玉米淀粉', '羟丙甲纤维素', '二氧化钛', '聚乙烯吡咯烷酮', '羧甲淀粉钠'];
    const suppliers = ['山东聊城阿华制药有限公司', '安徽山河药用辅料股份有限公司', '湖州展望药业有限公司', '山东赫达股份有限公司', '国药集团化学试剂有限公司'];

    for (let j = 0; j < materialCount; j++) {
      rawMaterials.push({
        id: genId('mat_'),
        name: materialNames[j % materialNames.length],
        batchNo: `RM${dayjs(productionDate).format('YYYYMMDD')}${randomInt(1000, 9999)}`,
        supplier: randomPick(suppliers),
        quantity: randomInt(50, 500),
        unit: 'kg',
        receiveDate: offsetDate(productionDate, -randomInt(7, 15)),
        inspectionResult: Math.random() > 0.1 ? '合格' : '待检',
      });
    }

    const processSteps: ProcessStep[] = PROCESS_STEPS.map((stepName, idx) => {
      const stepStart = offsetDate(productionDate, 0, idx * 2);
      const stepEnd = idx < 4 ? offsetDate(stepStart, 0, randomInt(1, 3)) : null;
      let stepStatus: ProcessStep['status'] = '待开始';
      if (stepEnd) {
        stepStatus = '已完成';
      } else if (idx < 7) {
        stepStatus = '进行中';
      }
      return {
        id: genId('step_'),
        stepName,
        stepOrder: idx + 1,
        startTime: stepStart,
        endTime: stepEnd,
        operator: randomPick(OPERATORS),
        parameters: {
          温度: `${randomInt(18, 28)}℃`,
          湿度: `${randomInt(40, 65)}%`,
          压力: `${randomInt(10, 20)}kPa`,
        },
        status: stepStatus,
      };
    });

    let qcReport: QCReport | null = null;
    if (status === '已完成' || status === '质检中' || status === '已入库') {
      const qcItems: QCItem[] = [
        { itemName: '性状', standard: '符合规定', testResult: '符合规定', isPass: true },
        { itemName: '鉴别', standard: '呈正反应', testResult: '呈正反应', isPass: true },
        { itemName: '含量测定', standard: `95.0%-105.0%`, testResult: `${(95 + Math.random() * 8).toFixed(2)}%`, isPass: true },
        { itemName: '溶出度', standard: '≥80%', testResult: `${(80 + Math.random() * 15).toFixed(2)}%`, isPass: true },
        { itemName: '重量差异', standard: '±5%', testResult: '±2.3%', isPass: true },
        { itemName: '微生物限度', standard: '符合规定', testResult: '符合规定', isPass: true },
      ];

      const overallResult = Math.random() > 0.1 ? '合格' : '待判定';
      qcReport = {
        id: genId('qc_'),
        reportNo: `QC${dayjs(productionDate).format('YYYYMMDD')}${randomInt(1000, 9999)}`,
        reportDate: offsetDate(productionDate, randomInt(1, 3)),
        inspector: randomPick(['李工', '王工', '张工', '刘工']),
        overallResult: overallResult as QCReport['overallResult'],
        items: qcItems,
        remark: overallResult === '合格' ? '全项检验合格' : '待补充稳定性考察数据',
      };
    }

    batches.push({
      id: genId('bat_'),
      batchNo: `B${dayjs(productionDate).format('YYYYMMDD')}${String(i + 1).padStart(3, '0')}`,
      productName: product.name,
      spec: product.spec,
      manufacturer: product.manufacturer,
      planQty,
      actualQty,
      unit: '盒',
      status: status as Batch['status'],
      productionDate: dayjs(productionDate).format('YYYY-MM-DD'),
      expiryDate,
      rawMaterials,
      processSteps,
      qcReport,
      createdAt: productionDate,
      updatedAt: offsetDate(productionDate, randomInt(1, 10)),
      isFrozen: false,
    });
  }
  return batches;
}

/**
 * 生成箱-盒-瓶三级码（1箱=20盒，1盒=10瓶）
 * caseCount：箱数
 */
export function generateTraceCodes(batchId: string, caseCount: number = 10): TraceCode[] {
  const codes: TraceCode[] = [];
  const batchNoStr = batchId.slice(-6);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  for (let c = 0; c < caseCount; c++) {
    const caseCode = `X${batchNoStr}${String(c + 1).padStart(4, '0')}`;
    codes.push({
      id: genId('tc_'),
      batchId,
      batchNo: batchNoStr,
      level: '箱',
      code: caseCode,
      parentCode: null,
      productName: '',
      generatedAt: now,
      status: '未使用',
      location: '生产车间',
    });

    for (let b = 0; b < 20; b++) {
      const boxCode = `H${batchNoStr}${String(c + 1).padStart(4, '0')}${String(b + 1).padStart(3, '0')}`;
      codes.push({
        id: genId('tc_'),
        batchId,
        batchNo: batchNoStr,
        level: '盒',
        code: boxCode,
        parentCode: caseCode,
        productName: '',
        generatedAt: now,
        status: '未使用',
        location: '生产车间',
      });

      for (let p = 0; p < 10; p++) {
        const bottleCode = `P${batchNoStr}${String(c + 1).padStart(4, '0')}${String(b + 1).padStart(3, '0')}${String(p + 1).padStart(3, '0')}`;
        codes.push({
          id: genId('tc_'),
          batchId,
          batchNo: batchNoStr,
          level: '瓶',
          code: bottleCode,
          parentCode: boxCode,
          productName: '',
          generatedAt: now,
          status: '未使用',
          location: '生产车间',
        });
      }
    }
  }
  return codes;
}

/**
 * 生成 12 个经销商
 */
export function generateDealers(): Dealer[] {
  const dealers: Dealer[] = [];
  const contactSurnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫'];
  const contactNames = ['总', '经理', '经理', '主管', '主任', '经理'];

  for (let i = 0; i < 12; i++) {
    const prefix = DEALER_PREFIXES[i % DEALER_PREFIXES.length];
    const suffix = randomPick(DEALER_SUFFIXES);
    const city = CITIES[i % CITIES.length];
    const level: Dealer['level'] = i < 3 ? '一级' : i < 8 ? '二级' : '三级';

    dealers.push({
      id: genId('dlr_'),
      dealerName: `${city}${prefix}${suffix}`,
      contactPerson: `${contactSurnames[i % contactSurnames.length]}${randomPick(contactNames)}`,
      phone: `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999))}`,
      city,
      address: `${city}${randomPick(['朝阳', '海淀', '浦东', '天河', '鼓楼', '西湖', '武侯'])}区${randomPick(['建国路', '中山路', '人民大道', '长江大道', '解放路', '建设路'])}${randomInt(1, 888)}号`,
      licenseNo: `${city.slice(0, 1)}药经营许字第${randomInt(100000, 999999)}号`,
      level,
      status: Math.random() > 0.08 ? '正常' : '暂停',
      createdAt: randomDate(),
    });
  }
  return dealers;
}

/**
 * 生成 30 个门店
 */
export function generateStores(): Store[] {
  const stores: Store[] = [];
  const contactNames = ['小玲', '大伟', '秀华', '建国', '美玲', '志强', '丽华', '小军'];

  for (let i = 0; i < 30; i++) {
    const prefix = STORE_PREFIXES[i % STORE_PREFIXES.length];
    const city = CITIES[i % CITIES.length];
    const level: Store['level'] = i % 10 === 0 ? '旗舰店' : i % 3 === 0 ? '社区店' : '标准店';

    stores.push({
      id: genId('str_'),
      storeName: `${city}${prefix}大药房（${randomPick(['中心', '社区', '旗舰', '连锁', '便民'])}店${i + 1}）`,
      dealerId: '',
      contactPerson: `${randomPick(['张', '李', '王', '刘', '陈', '杨', '赵', '黄'])}${randomPick(contactNames)}`,
      phone: `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999))}`,
      city,
      address: `${city}${randomPick(['XX区', '开发区', '高新区'])}${randomPick(['中山', '人民', '建设', '解放', '和平'])}路${randomInt(1, 999)}号${randomInt(1, 20)}栋`,
      businessHours: `0${randomInt(7, 9)}:00 - ${randomInt(20, 22)}:00`,
      level,
      status: Math.random() > 0.1 ? '正常' : '暂停',
      createdAt: randomDate(),
    });
  }
  return stores;
}

/**
 * 生成出入库记录
 */
export function generateWarehouseRecords(batches: Batch[]): WarehouseRecord[] {
  const records: WarehouseRecord[] = [];

  for (const batch of batches) {
    const inboundCount = randomInt(1, 3);
    for (let i = 0; i < inboundCount; i++) {
      records.push({
        id: genId('wh_'),
        recordNo: `IN${dayjs().format('YYYYMMDD')}${randomInt(100000, 999999)}`,
        traceCode: '',
        batchId: batch.id,
        batchNo: batch.batchNo,
        productName: batch.productName,
        type: '入库',
        warehouse: randomPick(WAREHOUSES),
        location: randomPick(LOCATIONS),
        quantity: Math.round(batch.actualQty / inboundCount),
        relatedOrderId: null,
        relatedDealerId: null,
        operator: randomPick(OPERATORS),
        operateTime: offsetDate(batch.productionDate, randomInt(1, 5), randomInt(8, 18)),
        remark: '成品入库',
      });
    }

    if (batch.status === '已出库') {
      const outboundCount = randomInt(1, 2);
      for (let i = 0; i < outboundCount; i++) {
        records.push({
          id: genId('wh_'),
          recordNo: `OUT${dayjs().format('YYYYMMDD')}${randomInt(100000, 999999)}`,
          traceCode: '',
          batchId: batch.id,
          batchNo: batch.batchNo,
          productName: batch.productName,
          type: '出库',
          warehouse: randomPick(WAREHOUSES),
          location: randomPick(LOCATIONS),
          quantity: Math.round(batch.actualQty * randomInt(30, 70) / 100),
          relatedOrderId: `SO${dayjs().format('YYYYMMDD')}${randomInt(1000, 9999)}`,
          relatedDealerId: null,
          operator: randomPick(OPERATORS),
          operateTime: offsetDate(batch.productionDate, randomInt(10, 30), randomInt(8, 18)),
          remark: '销售出库',
        });
      }
    }
  }
  return records;
}

/**
 * 生成 5 个召回工单 + 进度
 */
export function generateRecallOrders(batches: Batch[]): RecallOrder[] {
  const reasons = [
    '产品包装标识印刷错误',
    '药物稳定性考察数据异常',
    '客户投诉药品色泽差异',
    '供应商原料质量问题',
    '国家药监局抽检需召回',
  ];
  const progressSteps = [
    { step: '启动召回', description: '发起召回申请并审批' },
    { step: '通知经销商', description: '向相关经销商发出召回通知' },
    { step: '产品回收', description: '从渠道回收问题产品' },
    { step: '原因调查', description: '调查问题产生原因' },
    { step: '处置方案', description: '确定产品处置方式' },
    { step: '结案报告', description: '提交召回总结报告' },
  ];

  const targetBatches = batches.slice(0, 5);
  const orders: RecallOrder[] = [];

  for (let i = 0; i < targetBatches.length; i++) {
    const batch = targetBatches[i];
    const affectedQty = Math.round(batch.actualQty * randomInt(30, 80) / 100);
    const recallStatus: RecallOrder['status'] = i === 0 ? '已完成' : i < 3 ? '召回中' : '待启动';

    const progressList: RecallProgress[] = progressSteps.map((ps, idx) => {
      let status: RecallProgress['status'] = '待处理';
      let completeTime: string | null = null;
      if (recallStatus === '已完成') {
        status = '已完成';
        completeTime = offsetDate(batch.productionDate, randomInt(5, 20));
      } else if (recallStatus === '召回中') {
        if (idx < 2) {
          status = '已完成';
          completeTime = offsetDate(batch.productionDate, randomInt(1, 5));
        } else if (idx === 2) {
          status = '进行中';
        }
      }
      return {
        id: genId('rp_'),
        step: ps.step,
        description: ps.description,
        status,
        operator: randomPick(OPERATORS),
        completeTime,
        remark: status === '已完成' ? '正常完成' : '',
      };
    });

    const recalledQty = recallStatus === '已完成' ? affectedQty :
      recallStatus === '召回中' ? Math.round(affectedQty * randomInt(20, 60) / 100) : 0;

    orders.push({
      id: genId('rc_'),
      orderNo: `RC${dayjs(batch.productionDate).format('YYYYMMDD')}${String(i + 1).padStart(3, '0')}`,
      batchId: batch.id,
      batchNo: batch.batchNo,
      productName: batch.productName,
      reason: reasons[i],
      level: (['一级召回', '二级召回', '三级召回'] as const)[i % 3],
      status: recallStatus,
      initiator: randomPick(OPERATORS),
      affectedQty,
      recalledQty,
      createdAt: offsetDate(batch.productionDate, randomInt(2, 10)),
      expectCompleteDate: offsetDate(batch.productionDate, randomInt(30, 60)),
      progressList,
    });
  }
  return orders;
}

/**
 * 生成 50 条操作日志
 */
export function generateOperationLogs(batches: Batch[], dealers: Dealer[]): OperationLog[] {
  const logs: OperationLog[] = [];
  const modules = ['批次管理', '质量管理', '仓储管理', '经销商管理', '门店管理', '追溯码管理', '召回管理', '系统设置'];
  const actionsMap: Record<string, string[]> = {
    '批次管理': ['创建批次', '更新批次', '提交质检报告', '新增原料', '更新工序状态'],
    '质量管理': ['生成质检报告', '审核质检结果', '提交偏差报告', '签发放行单'],
    '仓储管理': ['入库扫码', '出库扫码', '库存盘点', '库位调整', '库存预警处理'],
    '经销商管理': ['新增经销商', '更新经销商', '停用经销商', '经销商考核'],
    '门店管理': ['新增门店', '更新门店', '门店收货确认'],
    '追溯码管理': ['生成追溯码', '打印追溯码', '关联批次', '验真查询'],
    '召回管理': ['创建召回单', '启动召回', '更新召回进度', '完成召回'],
    '系统设置': ['修改参数配置', '新增用户', '分配角色权限', '导出数据'],
  };

  for (let i = 0; i < 50; i++) {
    const module = randomPick(modules);
    const action = randomPick(actionsMap[module]);
    const now = randomDate();
    const batch = randomPick(batches);
    const dealer = randomPick(dealers);

    let targetId = batch.id;
    let targetName = `${batch.productName}（${batch.batchNo}）`;
    if (module === '经销商管理') {
      targetId = dealer.id;
      targetName = dealer.dealerName;
    } else if (module === '门店管理') {
      targetName = `${dealer.city}大药房（${randomInt(1, 50)}号店）`;
    } else if (module === '系统设置') {
      targetId = `sys_${i + 1}`;
      targetName = action;
    }

    logs.push({
      id: genId('log_'),
      logNo: `LOG${dayjs(now).format('YYYYMMDD')}${String(i + 1).padStart(5, '0')}`,
      operator: randomPick(OPERATORS),
      module,
      action,
      targetId,
      targetName,
      operateTime: now,
      ip: `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`,
      remark: i % 7 === 0 ? '系统自动记录' : '手动操作',
      status: Math.random() > 0.05 ? '成功' : '失败',
    });
  }

  logs.sort((a, b) => dayjs(b.operateTime).valueOf() - dayjs(a.operateTime).valueOf());
  return logs;
}

/**
 * 生成消费者验真记录
 */
export function generateConsumerVerifies(batches: Batch[]): ConsumerVerify[] {
  const records: ConsumerVerify[] = [];
  const channels: ConsumerVerify['verifyChannel'][] = ['微信小程序', 'APP', '官网', '短信'];
  const locations = ['北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区', '成都市武侯区', '武汉市洪山区', '杭州市西湖区', '南京市鼓楼区'];

  const count = randomInt(80, 150);
  for (let i = 0; i < count; i++) {
    const batch = randomPick(batches);
    const now = randomDate();

    records.push({
      id: genId('cv_'),
      verifyNo: `VF${dayjs(now).format('YYYYMMDD')}${String(i + 1).padStart(6, '0')}`,
      traceCode: `P${batch.batchNo.slice(-6)}${String(randomInt(1, 9999)).padStart(4, '0')}${String(randomInt(1, 999)).padStart(3, '0')}${String(randomInt(1, 999)).padStart(3, '0')}`,
      batchId: batch.id,
      batchNo: batch.batchNo,
      productName: batch.productName,
      verifyTime: now,
      consumerPhone: `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999))}`,
      verifyLocation: randomPick(locations),
      verifyChannel: randomPick(channels),
      isFirst: Math.random() > 0.25,
      isAuthentic: Math.random() > 0.02,
      remark: '',
    });
  }

  records.sort((a, b) => dayjs(b.verifyTime).valueOf() - dayjs(a.verifyTime).valueOf());
  return records;
}

export { randomInt, randomPick, randomDate, offsetDate, genId };
