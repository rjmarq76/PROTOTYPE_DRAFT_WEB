import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  Trophy,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Slide } from '../utils/presentation';
import { exportSlidesAsPDF } from '../utils/presentationPdf';
import { SurveyResponse, SurveyType } from '../types/survey';
import { surveyTypeDisplayLabel } from '../data/questionWeights';
import { computeCompanyComposite, getCompanyTrend, getSectionPeerAverages } from '../utils/scoring';

interface SlideDeckProps {
  slides: Slide[];
  title: string;
  onExit: () => void;
  responses?: SurveyResponse[];
}

const surveyTypeColors: Record<string, string> = {
  Contractor: '#2563eb',
  Supplier: '#10b981',
  Subcontractor: '#f97316',
};

function slideTitleFor(slide: Slide, index: number): string {
  switch (slide.kind) {
    case 'title':
      return 'Cover';
    case 'agenda':
      return 'Contents';
    case 'overview':
      return 'Overview';
    case 'comparison':
      return 'Survey Comparison';
    case 'sections':
      return 'Category Breakdown';
    case 'leaderboard':
      return 'Leaderboard';
    case 'trends':
      return 'Trends';
    case 'questions':
      return 'Top & Bottom Questions';
    case 'spotlight':
      return 'Spotlight';
    case 'distribution':
      return 'Rating Distribution';
    case 'closing':
      return 'Key Takeaways';
    default:
      return `Slide ${index + 1}`;
  }
}

function ScoreBadge({ label, hex }: { label: string; hex: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
      style={{ backgroundColor: `${hex}1a`, color: hex }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Individual slide layouts                                            */
/* ------------------------------------------------------------------ */

function TitleSlide({ slide }: { slide: Extract<Slide, { kind: 'title' }> }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0063a9] via-[#005793] to-[#00335a] px-10 text-center text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-10 h-24 w-24 rounded-full border border-white/20" />
      <Sparkles className="mb-5 text-sky-200" size={32} />
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-200">{slide.subtitle}</p>
      <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">{slide.title}</h1>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {slide.meta.map((item) => (
          <span key={item} className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AgendaSlide({ slide }: { slide: Extract<Slide, { kind: 'agenda' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">What's inside</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Contents</h2>
      <div className="mt-6 flex-1 overflow-y-auto pr-1">
        <ol className="space-y-3">
          {slide.items.map((item, index) => (
            <li key={item.label} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0063a9] text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 sm:text-base">{item.label}</p>
                <p className="text-xs text-slate-500 sm:text-sm">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function OverviewSlide({
  slide,
  responses = [],
}: {
  slide: Extract<Slide, { kind: 'overview' }>;
  responses?: SurveyResponse[];
}) {
  const isSingleSurveyType = slide.surveyTypes?.length === 1;

  const parsedScoreMatch = slide.standout.score.match(/([\d.]+)\s*\/\s*([\d.]+)/);
  const scorePercent = parsedScoreMatch 
    ? (parseFloat(parsedScoreMatch[1]) / parseFloat(parsedScoreMatch[2])) * 100 
    : 0;

  const { radarData, trendData, bandColor } = useMemo(() => {
    if (!isSingleSurveyType || !slide.standout || !slide.standout.name || slide.standout.name === 'No data yet') {
      return { radarData: [], trendData: [], bandColor: '#0063a9' };
    }
    const company = slide.standout.name;
    const surveyType = slide.standout.type as SurveyType;

    const composite = computeCompanyComposite(company, surveyType, responses);
    const peerAverages = getSectionPeerAverages(responses, surveyType);

    const radar = composite
      ? composite.sections.map((section) => {
          const peer = peerAverages.find((p) => p.section === section.section);
          return {
            section: section.section,
            value: section.percent,
            peer: peer?.average ?? 0,
          };
        })
      : [];

    const trend = getCompanyTrend(responses, company, surveyType);

    return {
      radarData: radar,
      trendData: trend,
      bandColor: composite?.band.hex ?? '#0063a9',
    };
  }, [isSingleSurveyType, slide.standout, responses]);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-white to-blue-50/60 px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Overview</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Where things stand</h2>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slide.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{kpi.value}</p>
          </div>
        ))}
      </div>

      {isSingleSurveyType ? (
        <div className="mt-4 flex flex-col gap-4 min-h-0 flex-1">
          {/* Top Performer Banner */}
          <div className="rounded-xl border-2 border-[#0063a9]/15 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center gap-2 text-[#0063a9] justify-center sm:justify-start">
                  <Trophy size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Top Performer Overall</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl truncate">{slide.standout.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-[#0063a9]">
                    {slide.standout.type}
                  </span>
                  <span className="mx-1.5">·</span>
                  <span className="font-semibold text-slate-700">{slide.standout.score}</span>
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  Highest scoring criterion: <span className="font-medium text-slate-600 italic">"{slide.highlight}"</span>
                </p>
              </div>

              {/* Circular Gauge */}
              {scorePercent > 0 && (
                <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="5"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="32"
                      className="stroke-[#0063a9] fill-none"
                      strokeWidth="5"
                      strokeDasharray="201.06"
                      initial={{ strokeDashoffset: 201.06 }}
                      animate={{ strokeDashoffset: 201.06 - (201.06 * scorePercent) / 100 }}
                      key={slide.standout.name}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-base font-bold text-[#0063a9]">{Math.round(scorePercent)}%</span>
                    <span className="text-[6px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Rating</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Two side-by-side graphs */}
          <div className="grid grid-cols-2 gap-4 h-52">
            {/* Left Graph: Radar Chart */}
            <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Section Breakdown vs Peer Average
              </p>
              <div className="flex-1 min-h-0 relative">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="55%">
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="section" tick={{ fontSize: 7, fill: '#475569' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 6, fill: '#94a3b8' }} />
                      <Radar
                        name={slide.standout.name}
                        dataKey="value"
                        stroke={bandColor}
                        fill={bandColor}
                        fillOpacity={0.2}
                      />
                      <Radar name="Peer Average" dataKey="peer" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} />
                      <Tooltip wrapperStyle={{ fontSize: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    No breakdown data available.
                  </div>
                )}
              </div>
            </div>

            {/* Right Graph: Trend Line Chart */}
            <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Score Trend Over Time
              </p>
              <div className="flex-1 min-h-0">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 7, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 7, fill: '#64748b' }} />
                      <Tooltip wrapperStyle={{ fontSize: 8 }} />
                      <Line
                        type="monotone"
                        name="Score"
                        dataKey="score"
                        stroke={bandColor}
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    Insufficient data for monthly trend.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr,1fr]">
          <div className="rounded-xl border-2 border-[#0063a9]/15 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center gap-2 text-[#0063a9] justify-center sm:justify-start">
                  <Trophy size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Top Performer Overall</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl truncate">{slide.standout.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-[#0063a9]">
                    {slide.standout.type}
                  </span>
                  <span className="mx-2">·</span>
                  <span className="font-semibold text-slate-700">{slide.standout.score}</span>
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Highest scoring criterion: <span className="font-medium text-slate-600 italic">"{slide.highlight}"</span>
                </p>
              </div>

              {/* Circular Gauge */}
              {scorePercent > 0 && (
                <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="50"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="50"
                      className="stroke-[#0063a9] fill-none"
                      strokeWidth="8"
                      strokeDasharray="314.16"
                      initial={{ strokeDashoffset: 314.16 }}
                      animate={{ strokeDashoffset: 314.16 - (314.16 * scorePercent) / 100 }}
                      key={slide.standout.name}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-[#0063a9]">{Math.round(scorePercent)}%</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Rating</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {slide.topPerformers.map((performer) => (
              <div
                key={performer.type}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top {performer.type}</p>
                  <p className="truncate text-sm font-bold text-slate-800">{performer.name}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#0063a9]">{performer.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonSlide({ slide, responses = [] }: { slide: Extract<Slide, { kind: 'comparison' }>; responses?: SurveyResponse[] }) {
  const [limit, setLimit] = useState<5 | 10>(5);
  const [performanceMode, setPerformanceMode] = useState<'highest' | 'lowest'>('highest');

  // Let's get the active survey types from the unique types present in the responses
  const activeSurveyTypes = useMemo(() => {
    return [...new Set(responses.map((r) => r.surveyType))] as SurveyType[];
  }, [responses]);

  const truncateCompanyName = (name: string, maxLen = 14) => {
    return name.length > maxLen ? `${name.substring(0, maxLen)}…` : name;
  };

  const topCompaniesData = useMemo(() => {
    const activeTypes = activeSurveyTypes.length ? activeSurveyTypes : (['Contractor', 'Supplier', 'Subcontractor'] as SurveyType[]);
    const companiesInActiveTypes = [...new Set(responses
      .filter((r) => activeTypes.includes(r.surveyType))
      .map((r) => r.company)
    )];

    const stats = companiesInActiveTypes
      .map((company) => {
        const activeTypesForCompany = activeTypes.filter((type) =>
          responses.some((r) => r.company === company && r.surveyType === type)
        );
        if (activeTypesForCompany.length === 0) return null;

        const composites = activeTypesForCompany
          .map((type) => computeCompanyComposite(company, type, responses))
          .filter((c): c is NonNullable<typeof c> => c !== null);

        if (composites.length === 0) return null;

        const avgScore = composites.reduce((sum, c) => sum + c.compositeScore, 0) / composites.length;
        const mainType = composites[0].surveyType;

        return {
          company,
          score: Number(avgScore.toFixed(1)),
          surveyType: mainType,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (performanceMode === 'highest') {
      stats.sort((a, b) => b.score - a.score);
    } else {
      stats.sort((a, b) => a.score - b.score);
    }

    return stats.slice(0, limit);
  }, [responses, activeSurveyTypes, performanceMode, limit]);

  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-6 sm:px-14 sm:py-8 text-slate-900">
      {/* Slide Header with Interactive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Performance Insight</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl leading-tight">
            {performanceMode === 'highest' ? 'Top Rated Companies' : 'Underperforming Companies'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compare stakeholder satisfaction rating of your partner companies.
          </p>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 text-xs shrink-0 self-start sm:self-center">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setPerformanceMode('highest')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                performanceMode === 'highest'
                  ? 'bg-white text-[#0063a9] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Best
            </button>
            <button
              type="button"
              onClick={() => setPerformanceMode('lowest')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                performanceMode === 'lowest'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lowest
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setLimit(5)}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                limit === 5
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              5
            </button>
            <button
              type="button"
              onClick={() => setLimit(10)}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                limit === 10
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              10
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="mt-5 grid flex-1 min-h-0 gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 flex flex-col min-h-0">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            {performanceMode === 'highest' ? 'Highest Rating Scores' : 'Lowest Rating Scores'} (0–100)
          </p>
          <div className="flex-1 min-h-0">
            {topCompaniesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCompaniesData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="company"
                    tickFormatter={(v) => truncateCompanyName(v, limit === 10 ? 10 : 14)}
                    tick={{ fontSize: 9, fill: '#475569', fontWeight: 'bold' }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={limit === 10 ? 24 : 36}>
                    <LabelList
                      dataKey="score"
                      position="top"
                      style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }}
                    />
                    {topCompaniesData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={surveyTypeColors[entry.surveyType] ?? '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                No company data fits the current filters.
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Ranked List View */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 flex flex-col min-h-0 justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Ranked List View</p>
            <div className="space-y-1.5 overflow-y-auto max-h-[180px] sm:max-h-[220px] pr-1">
              {topCompaniesData.map((item, idx) => (
                <div key={item.company} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-100/50">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate flex-1">{item.company}</span>
                  <span className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-md" style={{ backgroundColor: `${surveyTypeColors[item.surveyType] || '#2563eb'}1a`, color: surveyTypeColors[item.surveyType] || '#2563eb' }}>
                    {item.score.toFixed(1)}
                  </span>
                </div>
              ))}
              {topCompaniesData.length === 0 && (
                <p className="text-xs text-slate-400 italic">No partners found.</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-3">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              * Normalized composite index scores (0 to 100). Colors indicate stakeholder types:
              <span className="inline-flex items-center gap-1.5 ml-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Contractor
              </span>
              <span className="inline-flex items-center gap-1.5 ml-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Supplier
              </span>
              <span className="inline-flex items-center gap-1.5 ml-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> Subcontractor
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionsSlide({ slide }: { slide: Extract<Slide, { kind: 'sections' }> }) {
  const max = Math.max(4, ...slide.data.map((d) => d.average));
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Category Breakdown</h2>
      <p className="mt-1 text-sm text-slate-500">Average rating by evaluation category, strongest to weakest.</p>
      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {slide.data.map((item, index) => (
          <div key={item.category} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-sm font-semibold text-slate-700 sm:w-40">{item.category}</span>
            <div className="h-3 flex-1 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${Math.min(100, (item.average / max) * 100)}%`,
                  backgroundColor: index === 0 ? '#10b981' : index === slide.data.length - 1 ? '#ef4444' : '#2563eb',
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-sm font-bold text-slate-800">{item.average.toFixed(2)}</span>
            <span className="w-20 shrink-0 text-right text-xs text-slate-400">{item.responses} resp.</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardSlide({ slide, responses = [] }: { slide: Extract<Slide, { kind: 'leaderboard' }>; responses?: SurveyResponse[] }) {
  const [selectedCompany, setSelectedCompany] = useState<{ company: string; surveyType: SurveyType } | null>(null);

  const composite = useMemo(() => {
    if (!selectedCompany) return null;
    return computeCompanyComposite(selectedCompany.company, selectedCompany.surveyType, responses);
  }, [selectedCompany, responses]);

  const peerAverages = useMemo(() => {
    if (!selectedCompany) return [];
    return getSectionPeerAverages(responses, selectedCompany.surveyType);
  }, [selectedCompany, responses]);

  const radarData = useMemo(() => {
    if (!composite) return [];
    return composite.sections.map((section) => {
      const peer = peerAverages.find((p) => p.section === section.section);
      return {
        section: section.section,
        value: section.percent,
        peer: peer?.average ?? 0,
      };
    });
  }, [composite, peerAverages]);

  const trendData = useMemo(() => {
    if (!selectedCompany) return [];
    return getCompanyTrend(responses, selectedCompany.company, selectedCompany.surveyType);
  }, [selectedCompany, responses]);

  if (selectedCompany) {
    return (
      <div className="flex h-full w-full flex-col bg-white px-8 py-5 sm:px-14 sm:py-6 text-slate-900">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 bg-white z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedCompany(null)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>Back to Leaderboard</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                {surveyTypeDisplayLabel[selectedCompany.surveyType]} Partner
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-tight truncate max-w-[220px] sm:max-w-xs md:max-w-md">
                {selectedCompany.company}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {composite && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: `${composite.band.hex}1a`, color: composite.band.hex }}
                  >
                    {composite.band.label}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {composite.evaluationCount} evaluation{composite.evaluationCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1 text-center min-w-[65px] shadow-2xs">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Score</p>
                  <p className="text-base font-bold leading-tight" style={{ color: composite.band.hex }}>
                    {composite.compositeScore.toFixed(1)}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedCompany(null)}
              title="Close and return"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Content Area: Two Columns */}
        <div className="mt-3.5 grid flex-1 min-h-0 gap-4 grid-cols-2">
          {/* Left Column: Radar Chart */}
          <div className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 min-h-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Section Breakdown vs Peer Average
            </p>
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="62%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="section" tick={{ fontSize: 8, fill: '#475569' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 7, fill: '#94a3b8' }} />
                  <Radar
                    name={selectedCompany.company}
                    dataKey="value"
                    stroke={composite?.band.hex ?? '#2563eb'}
                    fill={composite?.band.hex ?? '#2563eb'}
                    fillOpacity={0.25}
                  />
                  <Radar name="Peer Average" dataKey="peer" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.08} />
                  <Tooltip wrapperStyle={{ fontSize: 9 }} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Trend Chart / Stats */}
          <div className="flex flex-col gap-2.5 min-h-0">
            {/* Trend Chart Panel */}
            <div className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 flex-1 min-h-0">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Score Trend Over Time
              </p>
              <div className="flex-1 min-h-0">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 10, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} />
                      <Tooltip wrapperStyle={{ fontSize: 9 }} />
                      <Line
                        type="monotone"
                        name="Composite Score"
                        dataKey="score"
                        stroke={composite?.band.hex ?? '#2563eb'}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    Insufficient data to calculate monthly trend.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics Badge row */}
            {composite && (
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-1">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Rated Criteria</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{composite.ratedQuestionCount}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-1">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">N/A Rate</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{composite.naRate}%</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-1" title="Consistency signal (lower is more consistent)">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Deviation</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">±{composite.stdDev} pt</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10 text-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Company Leaderboard</h2>
      <p className="mt-1 text-sm text-slate-500">
        Top-ranked partners within each survey type. Click a company to view interactive breakdown & trends.
      </p>
      <div className="mt-5 grid flex-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-3">
        {slide.groups.map((group) => (
          <div key={group.surveyType} className="rounded-xl border border-slate-100 p-3 bg-slate-50/30">
            <p
              className="mb-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: surveyTypeColors[group.surveyType] }}
            >
              {group.surveyType}
            </p>
            {group.rows.length ? (
              <ol className="space-y-1.5">
                {group.rows.map((row) => (
                  <li key={row.company}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCompany({
                          company: row.company,
                          surveyType: group.surveyType,
                        })
                      }
                      title={`Click to view detailed metrics for ${row.company}`}
                      className="flex w-full items-center gap-2 rounded-lg p-1 text-left transition hover:bg-slate-100 group cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 group-hover:bg-[#0063a9]/10 group-hover:text-[#0063a9] transition-colors">
                        {row.rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 group-hover:text-[#0063a9] group-hover:underline transition-all">
                        {row.company}
                      </span>
                      <span className="shrink-0 text-xs font-bold transition-all group-hover:scale-105" style={{ color: row.hex }}>
                        {row.score.toFixed(0)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-slate-400">No data for this window.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendsSlide({ slide }: { slide: Extract<Slide, { kind: 'trends' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Trends Over Time</h2>
      <p className="mt-1 text-sm text-slate-500">Monthly average rating and response volume.</p>
      <div className="mt-6 min-h-[240px] flex-1 rounded-xl border border-slate-100 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={slide.data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" domain={[0, 4]} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" name="Average rating" dataKey="average" stroke="#2563eb" strokeWidth={3} dot={false} />
            <Line yAxisId="right" type="monotone" name="Responses" dataKey="responses" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function QuestionsSlide({ slide }: { slide: Extract<Slide, { kind: 'questions' }> }) {
  const maxValStr = (slide.maxRating ?? 4).toFixed(2);
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Top & Bottom Questions</h2>
      <div className="mt-5 grid flex-1 gap-5 overflow-y-auto pr-1 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-emerald-600">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Highest scoring</span>
          </div>
          <ol className="space-y-2">
            {slide.top.map((q, i) => (
              <li key={q.question} className="rounded-lg bg-emerald-50/60 px-3 py-2">
                <p className="text-xs text-slate-700">
                  <span className="font-bold text-emerald-700">{i + 1}. </span>
                  {q.question}
                </p>
                <p className="mt-0.5 text-xs font-bold text-emerald-600">{q.average.toFixed(2)} / {maxValStr}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-rose-600">
            <TrendingDown size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Lowest scoring</span>
          </div>
          <ol className="space-y-2">
            {slide.bottom.map((q, i) => (
              <li key={q.question} className="rounded-lg bg-rose-50/60 px-3 py-2">
                <p className="text-xs text-slate-700">
                  <span className="font-bold text-rose-700">{i + 1}. </span>
                  {q.question}
                </p>
                <p className="mt-0.5 text-xs font-bold text-rose-600">{q.average.toFixed(2)} / {maxValStr}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function SpotlightSlide({ slide }: { slide: Extract<Slide, { kind: 'spotlight' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Company Spotlight</h2>
      <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[1fr,1.1fr]">
        <div className="flex flex-col justify-center rounded-xl border-2 border-slate-100 p-5">
          <ScoreBadge label={slide.band} hex={slide.hex} />
          <h3 className="mt-3 text-xl font-bold text-slate-900">{slide.company}</h3>
          <p className="text-sm text-slate-500">{slide.surveyType}</p>
          <p className="mt-4 text-4xl font-bold" style={{ color: slide.hex }}>
            {slide.score.toFixed(1)}
            <span className="text-base font-medium text-slate-400"> / 100</span>
          </p>
          {slide.atRisk && (
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs">
                <span className="font-bold">{slide.atRisk.company}</span> is trailing its peer group at{' '}
                {slide.atRisk.score.toFixed(1)} / 100 and may need attention.
              </p>
            </div>
          )}
        </div>
        <div className="min-h-[220px] rounded-xl border border-slate-100 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={slide.radar} outerRadius="72%">
              <PolarGrid />
              <PolarAngleAxis dataKey="section" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name={slide.company} dataKey="value" stroke={slide.hex} fill={slide.hex} fillOpacity={0.35} />
              <Radar name="Peer average" dataKey="peer" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ClosingSlide({ slide }: { slide: Extract<Slide, { kind: 'closing' }> }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#172033] via-[#0f1a2e] to-[#0063a9] px-10 py-10 text-center text-white">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <Trophy className="mb-4 text-sky-200" size={30} />
      <h2 className="text-2xl font-bold sm:text-3xl">Key Takeaways</h2>
      <ul className="mx-auto mt-6 max-w-2xl space-y-3 text-left">
        {slide.takeaways.map((point) => (
          <li key={point} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
            <span className="text-sm text-blue-50">{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Thank you</p>
    </div>
  );
}

function SlideContent({ slide, responses = [] }: { slide: Slide; responses?: SurveyResponse[] }) {
  switch (slide.kind) {
    case 'title':
      return <TitleSlide slide={slide} />;
    case 'agenda':
      return <AgendaSlide slide={slide} />;
    case 'overview':
      return <OverviewSlide slide={slide} responses={responses} />;
    case 'comparison':
      return <ComparisonSlide slide={slide} responses={responses} />;
    case 'sections':
      return <SectionsSlide slide={slide} />;
    case 'leaderboard':
      return <LeaderboardSlide slide={slide} responses={responses} />;
    case 'trends':
      return <TrendsSlide slide={slide} />;
    case 'questions':
      return <QuestionsSlide slide={slide} />;
    case 'spotlight':
      return <SpotlightSlide slide={slide} />;

    case 'closing':
      return <ClosingSlide slide={slide} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Deck shell: thumbnails, controls, fullscreen, PDF export             */
/* ------------------------------------------------------------------ */

export function SlideDeck({ slides, title, onExit, responses = [] }: SlideDeckProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const goTo = (next: number) => {
    if (next < 0 || next >= slides.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goTo(index + 1);
      if (event.key === 'ArrowLeft') goTo(index - 1);
      if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, slides.length]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await stageRef.current.requestFullscreen();
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      exportSlidesAsPDF(slides, title);
    } finally {
      setIsExporting(false);
    }
  };

  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index, slides.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onExit} type="button" className="secondary-button">
          <ArrowLeft size={16} />
          <span>Back to setup</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} type="button" className="secondary-button" disabled={isExporting}>
            <Download size={16} />
            <span>{isExporting ? 'Exporting…' : 'Export PDF'}</span>
          </button>
          <button onClick={toggleFullscreen} type="button" className="secondary-button">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'Exit fullscreen' : 'Present fullscreen'}</span>
          </button>
        </div>
      </div>

      <div ref={stageRef} className="rounded-2xl border border-slate-200 bg-slate-950 p-3 dark:border-slate-800 sm:p-5">
        {/* Progress bar */}
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-1 rounded-full bg-[#2563eb] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Stage */}
          <div className="relative flex-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-2xl">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={index}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  <SlideContent slide={slides[index]} responses={responses} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Prev / Next */}
            <button
              onClick={() => goTo(index - 1)}
              type="button"
              disabled={index === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-0"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => goTo(index + 1)}
              type="button"
              disabled={index === slides.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-0"
            >
              <ChevronRight size={18} />
            </button>

            <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
              <span>
                Slide {index + 1} of {slides.length}
              </span>
              <span className="text-slate-500">·</span>
              <span>{slideTitleFor(slides[index], index)}</span>
            </div>
          </div>

          {/* Thumbnail rail */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:w-40 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0">
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                type="button"
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition lg:w-full ${
                  i === index
                    ? 'border-[#2563eb] bg-[#2563eb]/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px]">{i + 1}</span>
                <span className="truncate">{slideTitleFor(slide, i)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
