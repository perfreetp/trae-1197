import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';
import {
  Download,
  Printer,
  Copy,
  QrCode,
  Package,
  Pill,
  Calendar,
  Barcode,
} from 'lucide-react';
import useUIStore from '@/stores/uiStore';

export type QRCodeTemplate = 'standard' | 'compact' | 'detailed';

interface QRCodeLabelData {
  batchNo: string;
  productName: string;
  spec?: string;
  productionDate?: string;
  expiryDate?: string;
  manufacturer?: string;
  code?: string;
  extra?: Record<string, string>;
}

interface QRCodeWithLabelProps {
  value: string;
  labelData: QRCodeLabelData;
  template?: QRCodeTemplate;
  size?: number;
  className?: string;
  showActions?: boolean;
  level?: 'L' | 'M' | 'Q' | 'H';
  fgColor?: string;
  bgColor?: string;
  title?: string;
  subtitle?: string;
  batchInfo?: { productName: string; spec: string; productionDate: string };
}

function downloadCanvasAsImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL(`image/${format}`, 0.95);
  link.click();
}

async function copyCanvasToClipboard(canvas: HTMLCanvasElement) {
  try {
    const blob: Blob = await new Promise(resolve => {
      canvas.toBlob(b => resolve(b!), 'image/png');
    });
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

function StandardTemplate({ labelData, size }: { labelData: QRCodeLabelData; size: number }) {
  return (
    <div className="text-center w-full" style={{ maxWidth: size }}>
      <div className="flex items-center justify-center gap-1.5 mb-2 pb-2 border-b border-gray-200">
        <Pill className="w-3.5 h-3.5 text-primary" />
        <p className="font-bold text-xs text-gray-800 truncate">
          {labelData.productName}
        </p>
      </div>
      <div className="space-y-1 mt-2">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Package className="w-2.5 h-2.5" />
            批号
          </span>
          <span className="font-mono font-semibold text-gray-700 truncate max-w-[60%]">
            {labelData.batchNo}
          </span>
        </div>
        {labelData.spec && (
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>规格</span>
            <span className="font-medium text-gray-700 truncate max-w-[60%]">
              {labelData.spec}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            效期
          </span>
          <span className="font-mono text-gray-700">
            {labelData.expiryDate ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function CompactTemplate({ labelData, size }: { labelData: QRCodeLabelData; size: number }) {
  return (
    <div className="text-center w-full" style={{ maxWidth: size }}>
      <p className="text-[10px] font-bold text-gray-800 truncate mb-1">
        {labelData.productName}
      </p>
      <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-500">
        <Barcode className="w-2.5 h-2.5" />
        <span className="font-mono font-semibold text-gray-700 truncate">
          {labelData.batchNo}
        </span>
        <span className="text-gray-300">|</span>
        <span className="truncate">{labelData.expiryDate?.slice(2) ?? '—'}</span>
      </div>
    </div>
  );
}

function DetailedTemplate({ labelData, size }: { labelData: QRCodeLabelData; size: number }) {
  return (
    <div className="w-full" style={{ maxWidth: size }}>
      <div className="text-center mb-2 pb-2 border-b-2 border-dashed border-gray-300">
        <p className="text-[11px] font-bold text-primary mb-0.5">{labelData.productName}</p>
        {labelData.manufacturer && (
          <p className="text-[8px] text-gray-500 truncate">{labelData.manufacturer}</p>
        )}
      </div>
      <div className="space-y-1 text-[9px]">
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <span className="text-gray-500">产品批号</span>
          <span className="font-mono font-semibold text-gray-800 text-right truncate">
            {labelData.batchNo}
          </span>
          {labelData.spec && (
            <>
              <span className="text-gray-500">包装规格</span>
              <span className="text-gray-800 text-right truncate">{labelData.spec}</span>
            </>
          )}
          {labelData.productionDate && (
            <>
              <span className="text-gray-500">生产日期</span>
              <span className="font-mono text-gray-800 text-right">
                {labelData.productionDate}
              </span>
            </>
          )}
          {labelData.expiryDate && (
            <>
              <span className="text-gray-500">有效期至</span>
              <span className="font-mono font-semibold text-red-600 text-right">
                {labelData.expiryDate}
              </span>
            </>
          )}
        </div>
        {labelData.code && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex items-center justify-between">
            <span className="text-gray-500">追溯码</span>
            <span className="font-mono text-[8px] font-bold text-primary truncate max-w-[65%]">
              {labelData.code}
            </span>
          </div>
        )}
        {labelData.extra && (
          <div className="mt-1 pt-1 border-t border-gray-100 grid grid-cols-2 gap-x-2">
            {Object.entries(labelData.extra).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-gray-400">{k}</span>
                <span className="text-gray-700 font-medium truncate max-w-[60%] text-right">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QRCodeWithLabel({
  value,
  labelData,
  template = 'standard',
  size = 160,
  className,
  showActions = true,
  level = 'M',
  fgColor = '#0F172A',
  bgColor = '#FFFFFF',
}: QRCodeWithLabelProps) {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const { toastSuccess, toastError } = useUIStore();

  const qrSize = Math.round(size * 0.65);

  const handleDownload = () => {
    if (!canvasWrapperRef.current) return;
    const canvas = canvasWrapperRef.current.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      toastError('二维码未生成');
      return;
    }

    const scale = 3;
    const totalHeight = canvasWrapperRef.current.offsetHeight * scale;
    const totalWidth = size * scale;

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = totalWidth;
    mergedCanvas.height = totalHeight;
    const ctx = mergedCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    const html2canvas = canvasWrapperRef.current;
    const wrapperCanvas = document.createElement('canvas');
    wrapperCanvas.width = totalWidth;
    wrapperCanvas.height = totalHeight;
    const wctx = wrapperCanvas.getContext('2d');
    if (wctx) {
      wctx.fillStyle = '#FFFFFF';
      wctx.fillRect(0, 0, totalWidth, totalHeight);

      const qrCanvas = canvas.cloneNode() as HTMLCanvasElement;
      qrCanvas.width = canvas.width;
      qrCanvas.height = canvas.height;
      const qctx = qrCanvas.getContext('2d');
      if (qctx) {
        qctx.drawImage(canvas, 0, 0);
      }
      const qrScaledSize = qrSize * scale;
      const qrLeft = (totalWidth - qrScaledSize) / 2;
      wctx.drawImage(qrCanvas, qrLeft, 20 * scale, qrScaledSize, qrScaledSize);
    }

    downloadCanvasAsImage(mergedCanvas, `${labelData.batchNo || 'qrcode'}_${template}.png`);
    toastSuccess('二维码已下载');
  };

  const handlePrint = () => {
    if (!canvasWrapperRef.current) return;
    const canvas = canvasWrapperRef.current.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      toastError('二维码未生成');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toastError('无法打开打印窗口');
      return;
    }

    const labelHtml =
      template === 'standard'
        ? `<div style="font-family:sans-serif;text-align:center;margin-top:10px;"><div style="display:flex;align-items:center;justify-content:center;gap:6px;padding-bottom:8px;border-bottom:1px solid #ddd;margin-bottom:8px;"><span style="font-weight:bold;font-size:12px;">${labelData.productName}</span></div><div style="font-size:10px;color:#666;line-height:1.6;"><div>批号: <span style="font-family:monospace;font-weight:bold;">${labelData.batchNo}</span></div>${labelData.spec ? `<div>规格: ${labelData.spec}</div>` : ''}${labelData.expiryDate ? `<div>效期: ${labelData.expiryDate}</div>` : ''}</div></div>`
        : template === 'compact'
        ? `<div style="font-family:sans-serif;text-align:center;margin-top:8px;"><div style="font-size:10px;font-weight:bold;">${labelData.productName}</div><div style="font-size:9px;color:#666;margin-top:2px;">${labelData.batchNo} | ${labelData.expiryDate?.slice(2) ?? '—'}</div></div>`
        : `<div style="font-family:sans-serif;font-size:9px;padding:10px 0;"><div style="text-align:center;padding-bottom:8px;border-bottom:2px dashed #ddd;margin-bottom:8px;"><div style="font-size:11px;font-weight:bold;color:#1E6FDB;">${labelData.productName}</div>${labelData.manufacturer ? `<div style="font-size:8px;color:#999;margin-top:2px;">${labelData.manufacturer}</div>` : ''}</div><div style="line-height:1.8;"><div style="display:flex;justify-content:space-between;"><span style="color:#999;">产品批号</span><span style="font-family:monospace;font-weight:bold;">${labelData.batchNo}</span></div>${labelData.spec ? `<div style="display:flex;justify-content:space-between;"><span style="color:#999;">包装规格</span><span>${labelData.spec}</span></div>` : ''}${labelData.expiryDate ? `<div style="display:flex;justify-content:space-between;"><span style="color:#999;">有效期至</span><span style="color:#EF4444;font-weight:bold;">${labelData.expiryDate}</span></div>` : ''}${labelData.code ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;display:flex;justify-content:space-between;"><span style="color:#999;">追溯码</span><span style="font-family:monospace;color:#1E6FDB;font-size:8px;">${labelData.code}</span></div>` : ''}</div></div>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>打印标签 - ${labelData.batchNo}</title>
          <style>
            @media print { @page { margin: 0; size: auto; } }
            body { margin: 0; padding: 20px; display: flex; justify-content: center; }
            .qr-label { width: ${size}px; }
          </style>
        </head>
        <body>
          <div class="qr-label">
            <div style="display:flex;justify-content:center;">
              <img src="${dataUrl}" style="width:${qrSize}px;height:${qrSize}px;" />
            </div>
            ${labelHtml}
          </div>
          <script>setTimeout(() => { window.print(); }, 300);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toastSuccess('已发送到打印');
  };

  const handleCopy = async () => {
    if (!canvasWrapperRef.current) return;
    const canvas = canvasWrapperRef.current.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      toastError('二维码未生成');
      return;
    }
    const ok = await copyCanvasToClipboard(canvas);
    if (ok) {
      toastSuccess('二维码已复制到剪贴板');
    } else {
      try {
        await navigator.clipboard.writeText(value);
        toastSuccess('二维码内容已复制');
      } catch {
        toastError('复制失败，请手动操作');
      }
    }
  };

  return (
    <div className={cn('inline-block', className)}>
      <div
        ref={canvasWrapperRef}
        className={cn(
          'bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm transition-all duration-300 hover:shadow-md',
          template === 'detailed' ? 'w-56' : 'w-48'
        )}
        style={{ width: template === 'detailed' ? size + 40 : size + 32 }}
      >
        <div className="flex flex-col items-center gap-3">
          {template === 'compact' ? null : (
            <div className="flex items-center gap-1.5 w-full justify-center pb-2 border-b border-gray-100">
              <QrCode className={cn('w-4 h-4', template === 'detailed' ? 'text-primary' : 'text-gray-400')} />
              <span
                className={cn(
                  'text-xs font-medium',
                  template === 'detailed' ? 'text-primary' : 'text-gray-500'
                )}
              >
                药品追溯码
              </span>
            </div>
          )}

          <div
            className="p-2 rounded-lg bg-white border border-gray-100 shadow-inner"
            style={{ width: qrSize + 16, height: qrSize + 16 }}
          >
            <QRCodeCanvas
              value={value}
              size={qrSize}
              level={level}
              fgColor={fgColor}
              bgColor={bgColor}
              includeMargin={false}
              imageSettings={undefined}
            />
          </div>

          {template === 'standard' && <StandardTemplate labelData={labelData} size={size} />}
          {template === 'compact' && <CompactTemplate labelData={labelData} size={size} />}
          {template === 'detailed' && <DetailedTemplate labelData={labelData} size={size} />}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center justify-center gap-1 mt-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 transition-colors border border-gray-200"
            title="下载图片"
          >
            <Download className="w-3 h-3" />
            下载
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 transition-colors border border-gray-200"
            title="打印标签"
          >
            <Printer className="w-3 h-3" />
            打印
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 transition-colors border border-gray-200"
            title="复制图片"
          >
            <Copy className="w-3 h-3" />
            复制
          </button>
        </div>
      )}
    </div>
  );
}

export { QRCodeWithLabel };
