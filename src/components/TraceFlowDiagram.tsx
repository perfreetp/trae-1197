import { useState } from 'react';
import { Factory, Package, Warehouse, Truck, Store, ShieldCheck, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TraceNode } from '@/services/reportService';

interface TraceFlowDiagramProps {
  nodes: TraceNode[];
  className?: string;
}

const nodeIconMap: Record<TraceNode['type'], typeof Factory> = {
  raw_material: Package,
  factory: Factory,
  warehouse: Warehouse,
  dealer: Truck,
  store: Store,
};

const nodeColorMap: Record<TraceNode['type'], { bg: string; border: string; text: string; dot: string }> = {
  raw_material: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
  factory: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-500' },
  warehouse: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-500' },
  dealer: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  store: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-500' },
};

export default function TraceFlowDiagram({ nodes, className }: TraceFlowDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<TraceNode | null>(null);

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center justify-between gap-0 overflow-x-auto pb-4 pt-2 scrollbar-thin">
        {nodes.map((node, index) => {
          const Icon = nodeIconMap[node.type];
          const colors = nodeColorMap[node.type];
          const isLast = index === nodes.length - 1;

          return (
            <div key={node.id} className="flex items-center shrink-0">
              <button
                onClick={() => setSelectedNode(node)}
                className={cn(
                  'relative flex flex-col items-center group',
                  'transition-all duration-300 hover:-translate-y-1'
                )}
              >
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center border-2',
                  colors.bg, colors.border,
                  'shadow-sm group-hover:shadow-md transition-shadow duration-300'
                )}>
                  <Icon className={cn('w-7 h-7', colors.text)} strokeWidth={2} />
                  <div className={cn('absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white', colors.dot)} />
                </div>
                <div className="mt-3 text-center w-24">
                  <div className="text-sm font-semibold text-gray-800">{node.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{node.time}</div>
                </div>
              </button>

              {!isLast && (
                <div className="flex items-center px-2 shrink-0">
                  <div className="flex items-center">
                    <div className="w-12 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400" />
                    <ChevronRight className="w-4 h-4 text-gray-400 -ml-1" strokeWidth={3} />
                    <div className="w-12 h-0.5 bg-gradient-to-r from-gray-400 to-gray-300" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeInUp" onClick={() => setSelectedNode(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn('px-6 py-5 border-b', nodeColorMap[selectedNode.type].bg, nodeColorMap[selectedNode.type].border)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', 'bg-white', nodeColorMap[selectedNode.type].border, 'border-2 shadow-sm')}>
                    {(() => {
                      const Icon = nodeIconMap[selectedNode.type];
                      return <Icon className={cn('w-6 h-6', nodeColorMap[selectedNode.type].text)} strokeWidth={2} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedNode.name}</h3>
                    <p className="text-sm text-gray-600">{selectedNode.operator}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/60 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheck className="w-4 h-4 text-trust-600" />
                <span>节点核验通过 · 数据可信</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">地点</span>
                  <span className="text-gray-800 font-medium">{selectedNode.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">时间</span>
                  <span className="text-gray-800 font-medium">{selectedNode.time}</span>
                </div>
                {Object.entries(selectedNode.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{key}</span>
                    <span className="text-gray-800 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
