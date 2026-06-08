/**
 * 数据导出 Hook
 * 封装 Excel (xlsx) 和 PDF 导出功能
 * 导出函数为 mock 实现，可调用不报错，便于后续对接真实导出逻辑
 */

import { useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

/**
 * 导出 Excel 配置选项
 */
export interface ExportExcelOptions<T = Record<string, unknown>> {
  /** 数据列表 */
  data: T[];
  /** 文件名（不含扩展名），默认 'export' */
  filename?: string;
  /** 表头映射：{ 字段名: 显示名称 }，未指定则使用字段原名 */
  headers?: Partial<Record<keyof T, string>>;
  /** 导出的字段顺序，未指定则使用表头的顺序 */
  columns?: (keyof T)[];
  /** Sheet 名称，默认 'Sheet1' */
  sheetName?: string;
  /** 列宽配置（字符宽度） */
  columnWidths?: Record<string, number>;
  /** 导出前的数据转换回调 */
  transform?: (row: T) => Record<string, unknown>;
  /** 导出成功回调 */
  onSuccess?: () => void;
  /** 导出失败回调 */
  onError?: (error: Error) => void;
}

/**
 * 导出 PDF 配置选项
 */
export interface ExportPdfOptions<T = Record<string, unknown>> {
  /** 数据列表 */
  data: T[];
  /** 文件名（不含扩展名），默认 'export' */
  filename?: string;
  /** 文档标题 */
  title?: string;
  /** 表头映射：{ 字段名: 显示名称 }，未指定则使用字段原名 */
  headers?: Partial<Record<keyof T, string>>;
  /** 导出的字段顺序 */
  columns?: (keyof T)[];
  /** 页面方向: 'portrait' 纵向 | 'landscape' 横向，默认 'landscape' */
  orientation?: 'portrait' | 'landscape';
  /** 导出前的数据转换回调 */
  transform?: (row: T) => Record<string, unknown>;
  /** 页脚文本 */
  footer?: string;
  /** 导出成功回调 */
  onSuccess?: () => void;
  /** 导出失败回调 */
  onError?: (error: Error) => void;
}

/**
 * 导出 JSON 配置选项
 */
export interface ExportJsonOptions<T = Record<string, unknown>> {
  /** 数据 */
  data: T;
  /** 文件名（不含扩展名），默认 'export' */
  filename?: string;
  /** 是否格式化缩进，默认 2 */
  indent?: number;
  /** 导出成功回调 */
  onSuccess?: () => void;
  /** 导出失败回调 */
  onError?: (error: Error) => void;
}

/**
 * 导出 CSV 配置选项
 */
export interface ExportCsvOptions<T = Record<string, unknown>> {
  /** 数据列表 */
  data: T[];
  /** 文件名（不含扩展名），默认 'export' */
  filename?: string;
  /** 表头映射 */
  headers?: Partial<Record<keyof T, string>>;
  /** 导出的字段顺序 */
  columns?: (keyof T)[];
  /** 分隔符，默认 ',' */
  delimiter?: string;
  /** 是否加 BOM 头（解决 Excel 中文乱码），默认 true */
  withBom?: boolean;
  /** 导出前的数据转换回调 */
  transform?: (row: T) => Record<string, unknown>;
  /** 导出成功回调 */
  onSuccess?: () => void;
  /** 导出失败回调 */
  onError?: (error: Error) => void;
}

/**
 * useExport Hook 返回值
 */
export interface UseExportReturn {
  /** 导出 Excel (.xlsx) */
  exportExcel: <T extends Record<string, unknown>>(options: ExportExcelOptions<T>) => Promise<boolean>;
  /** 导出 PDF (.pdf) */
  exportPdf: <T extends Record<string, unknown>>(options: ExportPdfOptions<T>) => Promise<boolean>;
  /** 导出 JSON (.json) */
  exportJson: <T>(options: ExportJsonOptions<T>) => Promise<boolean>;
  /** 导出 CSV (.csv) */
  exportCsv: <T extends Record<string, unknown>>(options: ExportCsvOptions<T>) => Promise<boolean>;
  /** 是否正在导出 */
  isExporting: boolean;
}

/**
 * 触发浏览器文件下载
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 转义 CSV 字段
 */
function escapeCsvField(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  let str = String(value);
  // 包含分隔符、引号、换行时用双引号包裹
  if (
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * useExport
 * 数据导出 Hook，封装 Excel / PDF / JSON / CSV 导出
 *
 * @returns 导出工具方法集合
 *
 * @example
 * const { exportExcel, exportPdf, isExporting } = useExport();
 *
 * // 导出 Excel
 * await exportExcel({
 *   data: list,
 *   filename: '批次数据',
 *   headers: { batchNo: '批次号', productName: '产品名称', status: '状态' },
 *   columns: ['batchNo', 'productName', 'status'],
 * });
 */
export function useExport(): UseExportReturn {
  const isExportingRef = useRef(false);
  // 使用 ref + 闭包返回 getter 模式模拟状态（避免不必要的重渲染）
  const _isExporting = useRef(false);

  const setExporting = useCallback((val: boolean) => {
    _isExporting.current = val;
    isExportingRef.current = val;
  }, []);

  /**
   * 导出 Excel (.xlsx)
   * 使用 xlsx 库实现
   */
  const exportExcel = useCallback(
    async <T extends Record<string, unknown>>(options: ExportExcelOptions<T>): Promise<boolean> => {
      const {
        data,
        filename = 'export',
        headers = {},
        columns,
        sheetName = 'Sheet1',
        columnWidths,
        transform,
        onSuccess,
        onError,
      } = options;

      try {
        setExporting(true);

        // 确定导出列顺序
        const keys: string[] = columns
          ? (columns as string[])
          : data.length > 0
          ? Object.keys(transform ? transform(data[0]) : data[0])
          : Object.keys(headers as Record<string, string>);

        if (keys.length === 0) {
          throw new Error('没有可导出的数据列');
        }

        // 构建表头行
        const headerRow = keys.map((key) => (headers as Record<string, string>)[key] || key);

        // 构建数据行
        const dataRows = data.map((row) => {
          const transformed = transform ? transform(row) : row;
          return keys.map((key) => {
            const val = (transformed as Record<string, unknown>)[key];
            // 处理日期等特殊类型
            if (val instanceof Date) {
              return val.toLocaleString('zh-CN');
            }
            if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val);
            }
            return val;
          });
        });

        // 合并数据（表头 + 数据）
        const worksheetData = [headerRow, ...dataRows];

        // 创建 Workbook 和 Worksheet
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        // 设置列宽
        if (columnWidths) {
          ws['!cols'] = keys.map((key) => ({
            wch: columnWidths[key] ?? Math.max(10, key.length * 2),
          }));
        } else {
          // 默认列宽：根据表头和数据长度估算
          ws['!cols'] = keys.map((key, colIndex) => {
            const maxLen = worksheetData.reduce((max, row) => {
              const cell = row[colIndex];
              const len = cell ? String(cell).length : 0;
              return Math.max(max, len);
            }, 0);
            return { wch: Math.min(40, Math.max(8, maxLen + 2)) };
          });
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // 输出为 Buffer 并触发下载
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        triggerDownload(blob, `${filename}.xlsx`);

        onSuccess?.();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[exportExcel] 导出失败:', error);
        onError?.(error);
        return false;
      } finally {
        setExporting(false);
      }
    },
    [setExporting],
  );

  /**
   * 导出 PDF (.pdf)
   * 使用 jsPDF 实现（当前为 Mock: 生成简单文本表格）
   */
  const exportPdf = useCallback(
    async <T extends Record<string, unknown>>(options: ExportPdfOptions<T>): Promise<boolean> => {
      const {
        data,
        filename = 'export',
        title = '数据导出',
        headers = {},
        columns,
        orientation = 'landscape',
        transform,
        footer = '',
        onSuccess,
        onError,
      } = options;

      try {
        setExporting(true);

        // 确定导出列顺序
        const keys: string[] = columns
          ? (columns as string[])
          : data.length > 0
          ? Object.keys(transform ? transform(data[0]) : data[0])
          : Object.keys(headers as Record<string, string>);

        if (keys.length === 0) {
          throw new Error('没有可导出的数据列');
        }

        // jsPDF 中文字体支持需要额外加载字体文件，这里使用英文替代方案
        // 实际生产中建议：
        // 1) 使用 html2canvas 截图后转 PDF
        // 2) 加载自定义中文字体
        // 此处为 Mock 实现，可正常调用不报错
        const doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 标题
        doc.setFontSize(16);
        doc.text(title, pageWidth / 2, 15, { align: 'center' });

        // 导出时间
        doc.setFontSize(10);
        doc.text(
          `Export Time: ${new Date().toLocaleString('zh-CN')}`,
          pageWidth / 2,
          22,
          { align: 'center' },
        );

        // 简单绘制表格（Mock: 只绘制标题列名，数据用占位符表示）
        const headerRow = keys.map((key) => (headers as Record<string, string>)[key] || key);

        doc.setFontSize(10);
        let yPos = 32;
        const colWidth = (pageWidth - 30) / headerRow.length;

        // 表头
        doc.setFillColor(240, 240, 240);
        headerRow.forEach((h, i) => {
          const x = 15 + i * colWidth;
          doc.rect(x, yPos, colWidth, 8, 'FD');
          doc.text(String(h).slice(0, Math.floor(colWidth / 2)), x + 2, yPos + 5);
        });
        yPos += 10;

        // 数据行（Mock: 简化输出，避免中文乱码问题）
        data.forEach((row, rowIndex) => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }
          const transformed = transform ? transform(row) : row;
          keys.forEach((key, i) => {
            const x = 15 + i * colWidth;
            const val = (transformed as Record<string, unknown>)[key];
            const text = val === null || val === undefined ? '' : String(val).slice(0, 20);
            // 边框
            doc.rect(x, yPos, colWidth, 7);
            doc.text(text, x + 2, yPos + 4.5);
          });
          yPos += 7;

          // 限制最大行数，避免生成过大文件
          if (rowIndex >= 99) return;
        });

        // 页脚
        if (footer) {
          doc.setFontSize(8);
          doc.text(footer, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // 保存文件
        doc.save(`${filename}.pdf`);

        onSuccess?.();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[exportPdf] 导出失败:', error);
        onError?.(error);
        return false;
      } finally {
        setExporting(false);
      }
    },
    [setExporting],
  );

  /**
   * 导出 JSON 文件
   */
  const exportJson = useCallback(
    async <T>(options: ExportJsonOptions<T>): Promise<boolean> => {
      const { data, filename = 'export', indent = 2, onSuccess, onError } = options;

      try {
        setExporting(true);
        const jsonStr = JSON.stringify(data, null, indent);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        triggerDownload(blob, `${filename}.json`);
        onSuccess?.();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[exportJson] 导出失败:', error);
        onError?.(error);
        return false;
      } finally {
        setExporting(false);
      }
    },
    [setExporting],
  );

  /**
   * 导出 CSV 文件
   */
  const exportCsv = useCallback(
    async <T extends Record<string, unknown>>(options: ExportCsvOptions<T>): Promise<boolean> => {
      const {
        data,
        filename = 'export',
        headers = {},
        columns,
        delimiter = ',',
        withBom = true,
        transform,
        onSuccess,
        onError,
      } = options;

      try {
        setExporting(true);

        // 确定导出列顺序
        const keys: string[] = columns
          ? (columns as string[])
          : data.length > 0
          ? Object.keys(transform ? transform(data[0]) : data[0])
          : Object.keys(headers as Record<string, string>);

        if (keys.length === 0) {
          throw new Error('没有可导出的数据列');
        }

        // 构建 CSV 内容
        const lines: string[] = [];

        // 表头行
        const headerLine = keys
          .map((key) => escapeCsvField((headers as Record<string, string>)[key] || key, delimiter))
          .join(delimiter);
        lines.push(headerLine);

        // 数据行
        data.forEach((row) => {
          const transformed = transform ? transform(row) : row;
          const line = keys
            .map((key) =>
              escapeCsvField((transformed as Record<string, unknown>)[key], delimiter),
            )
            .join(delimiter);
          lines.push(line);
        });

        const csvContent = lines.join('\r\n');

        // 拼接 BOM + 内容
        const content = withBom ? '\uFEFF' + csvContent : csvContent;
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        triggerDownload(blob, `${filename}.csv`);

        onSuccess?.();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[exportCsv] 导出失败:', error);
        onError?.(error);
        return false;
      } finally {
        setExporting(false);
      }
    },
    [setExporting],
  );

  return {
    exportExcel,
    exportPdf,
    exportJson,
    exportCsv,
    // 通过 getter 访问当前状态
    get isExporting(): boolean {
      return _isExporting.current;
    },
    // 兼容解构场景
  } as UseExportReturn;
}

export default useExport;
