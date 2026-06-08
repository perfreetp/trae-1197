import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2,
  Factory,
  Warehouse,
  Truck,
  Store,
  ChevronRight,
  X,
  MapPin,
  User,
  Phone,
  FileText,
  Clock,
} from 'lucide-react';

export type FlowNodeType = 'supplier' | 'factory' | 'warehouse' | 'dealer' | 'store';

export type NodeStatus = 'normal' | 'warning' | 'danger' | 'pending';

export interface FlowNodeDetail {
  id: string;
  name: string;
  address?: string;
  contact?: string;
  phone?: string;
  license?: string;
  operator?: string;
  operateTime?: string;
  quantity?: number | string;
  extra?: Record<string, string | number>;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  status: NodeStatus;
  detail?: FlowNodeDetail;
}

interface TraceFlowDiagramProps {
  nodes?: FlowNode[];
  defaultNodes?: boolean;
  className?: string;
}

const NODE_CONFIG: Record<
  FlowNodeType,
  {
    title: string;
    icon: typeof Building2;
    baseColor: string;
    bgClass: string;
    iconColorClass: string;
  }
> = {
  supplier: {
    title: '原料供应商',
    icon: Building2,
    baseColor: '#8B5CF6',
    bgClass: 'from-violet-50 to-violet-100 border-violet-200',
    iconColorClass: 'text-violet-600',
  },
  factory: {
    title: '生产工厂',
    icon: Factory,
    baseColor: '#3B82F6',
    bgClass: 'from-blue-50 to-blue-100 border-blue-200',
    iconColorClass: 'text-blue-600',
  },
  warehouse: {
    title: '成品仓',
    icon: Warehouse,
    baseColor: '#10B981',
    bgClass: 'from-emerald-50 to-emerald-100 border-emerald-200',
    iconColorClass: 'text-emerald-600',
  },
  dealer: {
    title: '经销商',
    icon: Truck,
    baseColor: '#F59E0B',
    bgClass: 'from-amber-50 to-amber-100 border-amber-200',
    iconColorClass: 'text-amber-600',
  },
  store: {
    title: '终端门店',
    icon: Store,
    baseColor: '#EF4444',
    bgClass: 'from-rose-50 to-rose-100 border-rose-200',
    iconColorClass: 'text-rose-600',
  },
};

const STATUS_CONFIG: Record<
  NodeStatus,
  {
    label: string;
    dotClass: string;
    ringClass: string;
    borderClass: string;
  }
> = {
  normal: {
    label: '正常',
    dotClass: 'bg-green-500',
    ringClass: 'ring-green-400/30',
    borderClass: 'border-green-400',
  },
  warning: {
    label: '注意',
    dotClass: 'bg-amber-500',
    ringClass: 'ring-amber-400/30',
    borderClass: 'border-amber-400',
  },
  danger: {
    label: '异常',
    dotClass: 'bg-red-500',
    ringClass: 'ring-red-400/30',
    borderClass: 'border-red-400',
  },
  pending: {
    label: '待处理',
    dotClass: 'bg-gray-400',
    ringClass: 'ring-gray-400/30',
    borderClass: 'border-gray-300',
  },
};

function getDefaultNodes(): FlowNode[] {
  return [
    {
      id: 'n1',
      type: 'supplier',
      label: '山东聊城阿华制药',
      status: 'normal',
      detail: {
        id: 'SUP001',
        name: '山东聊城阿华制药有限公司',
        address: '山东省聊城市经济开发区',
        contact: '王经理',
        phone: '138****5678',
        license: '鲁药生许字第2024001号',
        operator: '张伟',
        operateTime: '2024-01-15 08:30:00',
        quantity: '5,000 kg',
      },
    },
    {
      id: 'n2',
      type: 'factory',
      label: '华北制药一厂',
      status: 'normal',
      detail: {
        id: 'FAC001',
        name: '华北制药股份有限公司一厂',
        address: '河北省石家庄市经济技术开发区',
        contact: '李主任',
        phone: '0311-8888****',
        license: '冀药生许字第2023001号',
        operator: '李娜',
        operateTime: '2024-01-16 09:00:00',
        quantity: '10,000盒',
      },
    },
    {
      id: 'n3',
      type: 'warehouse',
      label: '一号成品仓',
      status: 'normal',
      detail: {
        id: 'WH001',
        name: '中心仓一号成品仓库',
        address: '石家庄市高新区A区01库位',
        contact: '仓管员王强',
        phone: '139****1234',
        license: 'GSMP认证仓库',
        operator: '王强',
        operateTime: '2024-01-18 14:20:00',
        quantity: '9,850盒',
      },
    },
    {
      id: 'n4',
      type: 'dealer',
      label: '北京华康医药',
      status: 'warning',
      detail: {
        id: 'DLR001',
        name: '北京华康医药有限公司',
        address: '北京市朝阳区建国路88号',
        contact: '赵总',
        phone: '010-6666****',
        license: '京药经营许字第2023056号',
        operator: '刘洋',
        operateTime: '2024-01-20 10:00:00',
        quantity: '5,000盒',
      },
    },
    {
      id: 'n5',
      type: 'store',
      label: '百姓大药房朝阳店',
      status: 'normal',
      detail: {
        id: 'STR001',
        name: '百姓大药房（朝阳旗舰店）',
        address: '北京市朝阳区朝阳北路156号',
        contact: '店长陈静',
        phone: '010-8888****',
        license: '京药零许字第2023123号',
        operator: '陈静',
        operateTime: '2024-01-22 09:30:00',
        quantity: '200盒',
      },
    },
  ];
}

export default function TraceFlowDiagram({
  nodes,
  defaultNodes = true,
  className,
}: TraceFlowDiagramProps) {
  const displayNodes = nodes ?? (defaultNodes ? getDefaultNodes() : []);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  return (
    <div className={cn('w-full', className)}>
      <div className="relative w-full overflow-x-auto pb-4 scrollbar-thin">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            {displayNodes.slice(0, -1).map((_, i) => {
              const startColor = NODE_CONFIG[displayNodes[i].type].baseColor;
              const endColor = NODE_CONFIG[displayNodes[i + 1].type].baseColor;
              return (
                <linearGradient
                  key={i}
                  id={`flow-grad-${i}`}
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                >
                  <stop offset="0%" stopColor={startColor} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={endColor} stopOpacity="0.6" />
                </linearGradient>
              );
            })}
          </defs>
        </svg>

        <div className="relative flex items-center justify-between gap-2 md:gap-4 min-w-max px-4 py-8">
          {displayNodes.map((node, index) => {
            const config = NODE_CONFIG[node.type];
            const statusCfg = STATUS_CONFIG[node.status];
            const Icon = config.icon;
            const isLast = index === displayNodes.length - 1;

            return (
              <div key={node.id} className="relative flex items-center">
                <button
                  onClick={() => setSelectedNode(node)}
                  className={cn(
                    'group relative flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br border-2 transition-all duration-300 cursor-pointer',
                    config.bgClass,
                    statusCfg.borderClass,
                    'hover:shadow-xl hover:-translate-y-1 hover:scale-105'
                  )}
                >
                  <div
                    className={cn(
                      'absolute -top-1 -right-1 w-4 h-4 rounded-full ring-4',
                      statusCfg.dotClass,
                      statusCfg.ringClass
                    )}
                    title={statusCfg.label}
                  />

                  <div
                    className={cn(
                      'relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow'
                    )}
                  >
                    <Icon className={cn('w-7 h-7 md:w-8 md:h-8', config.iconColorClass)} />
                  </div>

                  <div className="text-center space-y-0.5">
                    <p className={cn('text-xs font-medium', config.iconColorClass)}>
                      {config.title}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 max-w-[120px] truncate">
                      {node.label}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                      node.status === 'normal' && 'bg-green-100 text-green-700',
                      node.status === 'warning' && 'bg-amber-100 text-amber-700',
                      node.status === 'danger' && 'bg-red-100 text-red-700',
                      node.status === 'pending' && 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {statusCfg.label}
                  </span>
                </button>

                {!isLast && (
                  <div className="flex items-center mx-1 md:mx-2">
                    <svg width="40" height="4" className="flex-shrink-0">
                      <defs>
                        <linearGradient
                          id={`arrow-grad-${index}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="0%"
                            stopColor={NODE_CONFIG[displayNodes[index].type].baseColor}
                          />
                          <stop
                            offset="100%"
                            stopColor={NODE_CONFIG[displayNodes[index + 1].type].baseColor}
                          />
                        </linearGradient>
                      </defs>
                      <line
                        x1="0"
                        y1="2"
                        x2="32"
                        y2="2"
                        stroke={`url(#arrow-grad-${index})`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={
                          displayNodes[index + 1].status === 'pending' ? '4 3' : undefined
                        }
                      />
                      <polygon
                        points="32,-2 40,2 32,6"
                        fill={NODE_CONFIG[displayNodes[index + 1].type].baseColor}
                      />
                    </svg>
                    <ChevronRight
                      className={cn(
                        '-ml-2 w-4 h-4 animate-pulse',
                        displayNodes[index + 1].status === 'pending'
                          ? 'text-gray-400'
                          : 'text-primary'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedNode && selectedNode.detail && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div
              className={cn(
                'relative p-6 bg-gradient-to-br border-b',
                NODE_CONFIG[selectedNode.type].bgClass
              )}
            >
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
                  {(() => {
                    const Icon = NODE_CONFIG[selectedNode.type].icon;
                    return (
                      <Icon
                        className={cn('w-7 h-7', NODE_CONFIG[selectedNode.type].iconColorClass)}
                      />
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-medium mb-0.5',
                      NODE_CONFIG[selectedNode.type].iconColorClass
                    )}
                  >
                    {NODE_CONFIG[selectedNode.type].title}
                  </p>
                  <h3 className="text-lg font-bold text-gray-800 truncate">
                    {selectedNode.detail.name}
                  </h3>
                  <div className="mt-1">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        selectedNode.status === 'normal' &&
                          'bg-green-100 text-green-700 border border-green-200',
                        selectedNode.status === 'warning' &&
                          'bg-amber-100 text-amber-700 border border-amber-200',
                        selectedNode.status === 'danger' &&
                          'bg-red-100 text-red-700 border border-red-200',
                        selectedNode.status === 'pending' &&
                          'bg-gray-100 text-gray-600 border border-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full mr-1.5',
                          STATUS_CONFIG[selectedNode.status].dotClass
                        )}
                      />
                      {STATUS_CONFIG[selectedNode.status].label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 gap-3">
                {selectedNode.detail.address && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">地址</p>
                      <p className="text-sm text-gray-800">{selectedNode.detail.address}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedNode.detail.contact && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <User className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">联系人</p>
                        <p className="text-sm font-medium text-gray-800">
                          {selectedNode.detail.contact}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedNode.detail.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">联系电话</p>
                        <p className="text-sm font-medium text-gray-800 font-mono">
                          {selectedNode.detail.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedNode.detail.license && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">资质证件</p>
                      <p className="text-sm text-gray-800 font-mono">
                        {selectedNode.detail.license}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedNode.detail.operator && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">操作人</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedNode.detail.operator}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedNode.detail.operateTime && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">操作时间</p>
                        <p className="text-xs font-mono text-gray-800">
                          {selectedNode.detail.operateTime}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedNode.detail.quantity !== undefined && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100">
                    <p className="text-xs text-gray-500 mb-1">流转数量</p>
                    <p className="text-2xl font-bold text-primary">
                      {String(selectedNode.detail.quantity)}
                    </p>
                  </div>
                )}

                {selectedNode.detail.extra && Object.keys(selectedNode.detail.extra).length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">附加信息</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedNode.detail.extra).map(([k, v]) => (
                        <div key={k} className="p-2 rounded-lg bg-white border border-gray-100">
                          <p className="text-[10px] text-gray-400">{k}</p>
                          <p className="text-xs font-medium text-gray-700 truncate">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { TraceFlowDiagram };
