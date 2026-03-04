import * as XLSX from 'xlsx';

interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  const headers = columns.map(c => c.header);
  const rows = data.map(row => columns.map(c => c.accessor(row)));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-size columns
  ws['!cols'] = headers.map((h, i) => ({
    wch: Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)) + 2
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
