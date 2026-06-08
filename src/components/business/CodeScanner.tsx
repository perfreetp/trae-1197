import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  ScanLine,
  QrCode,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  History,
  X,
  Camera,
} from 'lucide-react';

export interface ScanHistoryItem {
  id: string;
  code: string;
  timestamp: Date;
  success: boolean;
  message?: string;
}

interface CodeScannerProps {
  onScanSuccess?: (code: string) => void;
  onScanFail?: (code: string, error?: string) => void;
  validateCode?: (code: string) => Promise<boolean> | boolean;
  placeholder?: string;
  simulateLatency?: number;
  maxHistory?: number;
  className?: string;
}

function generateCodeId() {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const RIPPLE_KEYFRAMES = `
  @keyframes ripple-success {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-10px); }
    40% { transform: translateX(10px); }
    60% { transform: translateX(-8px); }
    80% { transform: translateX(8px); }
  }
`;

export default function CodeScanner({
  onScanSuccess,
  onScanFail,
  validateCode,
  placeholder = '请输入或扫描追溯码',
  simulateLatency = 800,
  maxHistory = 10,
  className,
}: CodeScannerProps) {
  const [inputCode, setInputCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'fail' | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const scanBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('scan_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((h: ScanHistoryItem) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        }));
        setHistory(parsed.slice(0, maxHistory));
      } catch {
        /* ignore */
      }
    }
  }, [maxHistory]);

  const saveHistory = (newHistory: ScanHistoryItem[]) => {
    localStorage.setItem('scan_history', JSON.stringify(newHistory.slice(0, maxHistory)));
  };

  const addToHistory = (code: string, success: boolean, message?: string) => {
    const item: ScanHistoryItem = {
      id: generateCodeId(),
      code,
      timestamp: new Date(),
      success,
      message,
    };
    const next = [item, ...history].slice(0, maxHistory);
    setHistory(next);
    saveHistory(next);
  };

  const handleRemoveHistory = (id: string) => {
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('scan_history');
  };

  const retryScan = (item: ScanHistoryItem) => {
    setInputCode(item.code);
    performScan(item.code);
  };

  const performScan = async (code: string) => {
    if (!code.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    await new Promise(resolve => setTimeout(resolve, simulateLatency));

    let valid = true;
    let errorMsg: string | undefined;

    if (validateCode) {
      try {
        valid = await validateCode(code);
      } catch (e) {
        valid = false;
        errorMsg = (e as Error).message;
      }
    } else {
      valid = code.trim().length >= 6;
      if (!valid) errorMsg = '追溯码长度不足';
    }

    setIsScanning(false);

    if (valid) {
      setScanResult('success');
      addToHistory(code, true);
      onScanSuccess?.(code);
    } else {
      setScanResult('fail');
      addToHistory(code, false, errorMsg);
      onScanFail?.(code, errorMsg);
    }

    setTimeout(() => setScanResult(null), 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performScan(inputCode);
  };

  const handleSimulateScan = () => {
    const randomCode = `P${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setInputCode(randomCode);
    performScan(randomCode);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className={cn('w-full', className)}>
      <style>{RIPPLE_KEYFRAMES}</style>

      <div
        ref={scanBoxRef}
        className={cn(
          'relative mx-auto w-full max-w-sm aspect-square rounded-3xl bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6 overflow-hidden shadow-2xl',
          scanResult === 'fail' && ''
        )}
        style={
          scanResult === 'fail'
            ? { animation: 'shake 0.5s ease-in-out' }
            : undefined
        }
      >
        <div className="absolute top-4 left-4 right-4 h-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-white/60">
            <Camera className="w-4 h-4" />
            <span className="text-xs font-medium">扫码区域</span>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              isScanning ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/50'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', isScanning ? 'bg-green-400 animate-pulse' : 'bg-white/30')} />
            {isScanning ? '扫描中' : '待机'}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none">
              <path d="M10 50 L10 10 Q10 10 50 10" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M150 10 L190 10 Q190 10 190 50" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M190 150 L190 190 Q190 190 150 190" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M50 190 L10 190 Q10 190 10 150" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>

            {isScanning && (
              <div
                className="absolute left-2 right-2 h-1 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
                  animation: 'scanLine 1.8s linear infinite',
                  boxShadow: '0 0 20px #34d399',
                }}
              />
            )}

            {!isScanning && !scanResult && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">将二维码对准框内</p>
                </div>
              </div>
            )}

            {scanResult === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full bg-green-400"
                    style={{ animation: 'ripple-success 1s ease-out infinite' }}
                  />
                  <div
                    className="absolute inset-0 rounded-full bg-green-400"
                    style={{ animation: 'ripple-success 1s ease-out 0.3s infinite' }}
                  />
                  <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                    <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            )}

            {scanResult === 'fail' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                  <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <ScanLine className="w-5 h-5 mx-auto text-white/20 animate-pulse" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 font-mono text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <button
            type="button"
            onClick={handleSimulateScan}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            模拟
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="submit"
            disabled={isScanning || !inputCode.trim()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-medium transition-all duration-200 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <Search className="w-5 h-5" />
            查询追溯
          </button>
          <button
            type="button"
            onClick={() => setInputCode('')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-gray-700 font-medium border border-gray-200 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
          >
            <X className="w-5 h-5" />
            清空
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <History className="w-4 h-4 text-gray-500" />
            <span>扫描历史</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">{history.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(s => !s)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showHistory ? '收起' : '展开'}
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                清空
              </button>
            )}
          </div>
        </div>

        {showHistory && (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
            {history.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">暂无扫描记录</p>
              </div>
            ) : (
              history.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm',
                    item.success
                      ? 'bg-green-50/50 border-green-100 hover:bg-green-50'
                      : 'bg-red-50/50 border-red-100 hover:bg-red-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                      item.success ? 'bg-green-100' : 'bg-red-100'
                    )}
                  >
                    {item.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-gray-800 truncate">{item.code}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.timestamp)}
                      {item.message && <span className="text-red-500">· {item.message}</span>}
                    </p>
                  </div>

                  <button
                    onClick={() => retryScan(item)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    重试
                  </button>

                  <button
                    onClick={() => handleRemoveHistory(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { CodeScanner };
