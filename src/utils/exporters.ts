import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Shared client-side export helpers. Everything here runs entirely in the
 * browser - there's no export API on the server, so these functions build
 * the file in memory and hand the browser a Blob/data URI to download.
 * Keeping the "shape" (title + column headers + row arrays) generic means
 * the same three functions can back every export button in the app instead
 * of each page hand-rolling its own CSV/XLSX/PDF logic.
 */

export interface ExportTable {
  /** Section heading shown above this table (CSV: a comment line, Excel: sheet name, PDF: a heading). */
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

/** One or more tables in a single CSV file, each preceded by a title line and a blank line separator. */
export function exportTablesAsCSV(tables: ExportTable[], filenameBase: string) {
  const chunks = tables.map((table) => {
    const csvBody = Papa.unparse({ fields: table.columns, data: table.rows });
    return `${table.title}\n${csvBody}`;
  });
  const blob = new Blob([chunks.join('\n\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filenameBase}_${timestamp()}.csv`);
}

/** One workbook, one sheet per table (sheet name = table title, truncated to Excel's 31-char limit). */
export function exportTablesAsExcel(tables: ExportTable[], filenameBase: string) {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  tables.forEach((table) => {
    const sheetData = [table.columns, ...table.rows];
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

    let sheetName = table.title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';
    let suffix = 2;
    while (usedNames.has(sheetName)) {
      sheetName = `${table.title.slice(0, 28)} ${suffix}`;
      suffix += 1;
    }
    usedNames.add(sheetName);

    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  XLSX.writeFile(workbook, `${filenameBase}_${timestamp()}.xlsx`);
}

/** One PDF, one heading + table per section, stacked vertically (auto page-breaks via autoTable). */
export function exportTablesAsPDF(reportTitle: string, tables: ExportTable[], filenameBase: string) {
  const doc = new jsPDF({ unit: 'pt' });
  const marginLeft = 40;
  let cursorY = 48;

  doc.setFontSize(16);
  doc.text(reportTitle, marginLeft, cursorY);
  cursorY += 14;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, marginLeft, cursorY);
  doc.setTextColor(0);
  cursorY += 20;

  tables.forEach((table) => {
    if (cursorY > 700) {
      doc.addPage();
      cursorY = 48;
    }
    doc.setFontSize(12);
    doc.text(table.title, marginLeft, cursorY);
    cursorY += 8;

    autoTable(doc, {
      startY: cursorY,
      head: [table.columns],
      body: table.rows.map((row) => row.map(String)),
      margin: { left: marginLeft, right: marginLeft },
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [0, 99, 169] },
      theme: 'striped',
    });

    // autoTable attaches the final Y position it landed on so the next
    // section starts below it instead of overlapping.
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  });

  doc.save(`${filenameBase}_${timestamp()}.pdf`);
}
