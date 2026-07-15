import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileBarChart, FileSpreadsheet, FileText, Printer, Table2 } from 'lucide-react';
import { SurveyResponse } from '../types/survey';
import { averageBySurveyType, formatNumber, getKpiSummary, questionPerformance } from '../utils/analytics';
import { ExportTable, exportTablesAsCSV, exportTablesAsExcel, exportTablesAsPDF } from '../utils/exporters';

interface ReportsPageProps {
  responses: SurveyResponse[];
  isAdmin?: boolean;
}

type ExportFormat = 'pdf' | 'csv' | 'excel';

function runExport(format: ExportFormat, reportTitle: string, tables: ExportTable[], filenameBase: string) {
  if (format === 'csv') exportTablesAsCSV(tables, filenameBase);
  else if (format === 'excel') exportTablesAsExcel(tables, filenameBase);
  else exportTablesAsPDF(reportTitle, tables, filenameBase);
}

export function ReportsPage({ responses, isAdmin }: ReportsPageProps) {
  const summary = getKpiSummary(responses);
  const allQuestionRows = questionPerformance(responses);
  const questionRows = allQuestionRows.slice(0, 5);
  const surveyRows = averageBySurveyType(responses);

  // --- Table builders: same underlying data the page renders, reshaped
  // into the generic { title, columns, rows } shape the export utils need.
  const summaryTable: ExportTable = {
    title: 'Summary Report',
    columns: ['Metric', 'Value'],
    rows: [
      ['Total Responses', summary.totalResponses],
      ['Average Rating', formatNumber(summary.averageRating)],
      ['Overall Satisfaction', `${formatNumber(summary.overallSatisfactionScore)}%`],
      ['N/A Rate', `${formatNumber(summary.naPercentage)}%`],
      ['Highest Rated Question', summary.highestRatedQuestion],
      ['Lowest Rated Question', summary.lowestRatedQuestion],
    ],
  };

  const questionHighlightsTable: ExportTable = {
    title: 'Question Highlights (Top 5)',
    columns: ['Question', 'Average Rating', 'Responses'],
    rows: questionRows.map((row) => [row.question, formatNumber(row.average), row.responses]),
  };

  const questionReportTable: ExportTable = {
    title: 'Question Report (All Questions)',
    columns: ['Question', 'Average Rating', 'Responses'],
    rows: allQuestionRows.map((row) => [row.question, formatNumber(row.average), row.responses]),
  };

  const surveyReportTable: ExportTable = {
    title: 'Survey Report',
    columns: ['Survey Type', 'Average Rating', 'Responses'],
    rows: surveyRows.map((row) => [row.surveyType, formatNumber(row.average), row.responses]),
  };

  const handleExecutiveExport = (format: ExportFormat) => {
    runExport(format, 'Executive Summary', [summaryTable, questionHighlightsTable, surveyReportTable], 'executive_summary');
  };

  const handleCardExport = (format: ExportFormat, card: 'summary' | 'question' | 'survey') => {
    if (card === 'summary') runExport(format, 'Summary Report', [summaryTable], 'summary_report');
    else if (card === 'question') runExport(format, 'Question Report', [questionReportTable], 'question_report');
    else runExport(format, 'Survey Report', [surveyReportTable], 'survey_report');
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <ReportCard
          title="Summary Report"
          detail={`${responses.length} responses, ${formatNumber(summary.averageRating)} average rating`}
          icon={FileBarChart}
          isAdmin={isAdmin}
          onExport={(format) => handleCardExport(format, 'summary')}
        />
        <ReportCard
          title="Question Report"
          detail={`${allQuestionRows.length} ranked question groups`}
          icon={FileSpreadsheet}
          isAdmin={isAdmin}
          onExport={(format) => handleCardExport(format, 'question')}
        />
        <ReportCard
          title="Survey Report"
          detail="Contractor, Supplier, and Subcontractor comparison"
          icon={Printer}
          isAdmin={isAdmin}
          onExport={(format) => handleCardExport(format, 'survey')}
        />
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Executive Summary</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Prototype report view for stakeholder briefings.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin ? (
              <>
                <button className="primary-button" type="button" onClick={() => handleExecutiveExport('pdf')}>
                  <Download size={16} />
                  Export PDF
                </button>
                <button className="secondary-button" type="button" onClick={() => handleExecutiveExport('csv')}>
                  <Download size={16} />
                  Export CSV
                </button>
                <button className="secondary-button" type="button" onClick={() => handleExecutiveExport('excel')}>
                  <Download size={16} />
                  Export Excel
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 px-3 py-2 rounded-lg">
                ⚠️ Exporting restricted to Admin
              </span>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="font-semibold">Question Highlights</h4>
            <div className="mt-3 space-y-3">
              {questionRows.map((row) => (
                <div key={row.question} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{row.question}</span>
                  <span className="badge">{formatNumber(row.average)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="font-semibold">Survey Summary</h4>
            <div className="mt-3 space-y-3">
              {surveyRows.map((row) => (
                <div key={row.surveyType} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{row.surveyType}</span>
                  <span className="text-slate-500 dark:text-slate-400">{row.responses} responses, {formatNumber(row.average)} avg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportCard({
  title,
  detail,
  icon: Icon,
  isAdmin,
  onExport,
}: {
  title: string;
  detail: string;
  icon: typeof FileBarChart;
  isAdmin?: boolean;
  onExport: (format: ExportFormat) => void;
}) {
  return (
    <article className="panel">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-azure dark:bg-blue-950/60">
        <Icon size={20} />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      {isAdmin ? (
        <ExportMenu onExport={onExport} />
      ) : (
        <p className="mt-4 text-[11px] font-bold text-slate-400 select-none">⚠️ Export restricted</p>
      )}
    </article>
  );
}

/** Compact "Export ▾" trigger that reveals PDF / CSV / Excel choices, used on each report card. */
function ExportMenu({ onExport }: { onExport: (format: ExportFormat) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const choose = (format: ExportFormat) => {
    onExport(format);
    setOpen(false);
  };

  return (
    <div className="relative mt-4 inline-block" ref={containerRef}>
      <button className="ghost-button" type="button" onClick={() => setOpen((v) => !v)}>
        <Download size={15} />
        Export
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="absolute left-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => choose('pdf')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileText size={14} /> PDF
          </button>
          <button
            type="button"
            onClick={() => choose('csv')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Table2 size={14} /> CSV
          </button>
          <button
            type="button"
            onClick={() => choose('excel')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      ) : null}
    </div>
  );
}
