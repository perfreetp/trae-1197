import { useState, useRef, useEffect } from 'react';
import { Camera, QrCode, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Html5Qrcode } from 'html5-qrcode';

interface CodeScannerProps {
  onScan: (code: string) => void;
  className?: string;
}

export default function CodeScanner({ onScan, className }: CodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrCodeRef.current && qrCodeRef.current.isScanning) {
        qrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    if (!scannerRef.current) return;

    try {
      if (!qrCodeRef.current) {
        qrCodeRef.current = new Html5Qrcode('qr-reader-region');
      }

      setIsScanning(true);
      await qrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {}
      );
    } catch (err) {
      setError('摄像头访问失败，请手动输入追溯码');
      setIsScanning(false);
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsScanning(false);
  };

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      <div
        ref={scannerRef}
        className="relative w-64 h-64 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center"
      >
        {isScanning ? (
          <div id="qr-reader-region" className="w-full h-full" />
        ) : (
          <div className="relative w-48 h-48">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <QrCode className="w-16 h-16 text-primary/40" strokeWidth={1.5} />
              <span className="text-sm text-gray-500">扫描区域</span>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scanLine" style={{ boxShadow: '0 0 10px #1E6FDB' }} />
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            启动扫码
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-200 active:scale-95"
          >
            <X className="w-4 h-4" />
            停止扫码
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger-600 bg-danger-50 px-3 py-1.5 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}
