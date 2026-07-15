import { useMemo, useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  CartesianGrid,
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
import { FilterState, SurveyResponse, SurveyType } from '../types/survey';
import { surveyTypeDisplayLabel } from '../data/questionWeights';
import { getCompanyTrend, getLeaderboard, getOutliers, getSectionPeerAverages } from '../utils/scoring';

interface CompanyPerformancePanelProps {
  responses: SurveyResponse[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

const surveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];

export function CompanyPerformancePanel({ responses, filters, setFilters }: CompanyPerformancePanelProps) {
  const isMobile = useIsMobile();
  const [surveyType, setSurveyType] = useState<SurveyType>('Contractor');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const leaderboard = useMemo(() => getLeaderboard(responses, surveyType), [responses, surveyType]);
  const outliers = useMemo(() => getOutliers(leaderboard), [leaderboard]);
  const outlierMap = useMemo(() => new Map(outliers.map((o) => [o.company, o])), [outliers]);
  const peerAverages = useMemo(() => getSectionPeerAverages(responses, surveyType), [responses, surveyType]);

  const activeCompany = selectedCompany;
  const activeComposite = leaderboard.find((c) => c.company === activeCompany) ?? null;

  const radarData = useMemo(() => {
    if (!activeComposite) return [];
    return activeComposite.sections.map((section) => {
      const peer = peerAverages.find((p) => p.section === section.section);
      return {
        section: section.section,
        [activeComposite.company]: section.percent,
        'Peer average': peer?.average ?? 0,
      };
    });
  }, [activeComposite, peerAverages]);

  const trendData = useMemo(() => {
    if (!activeCompany) return [];
    return getCompanyTrend(responses, activeCompany, surveyType);
  }, [responses, activeCompany, surveyType]);

  if (!responses.length) return null;

  return (
    <section className="panel space-y-4">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold">Company Performance</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Composite scores weighted to match each form's actual point values, ranked within their own peer group.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 w-full">
          <div className="segmented-control flex-1 w-full md:w-auto grid grid-cols-3">
            {surveyTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`py-2 text-center w-full flex-1 ${surveyType === type ? 'segmented-active font-bold text-[#0063a9] dark:text-blue-400 shadow-sm' : ''}`}
                onClick={() => {
                  setSurveyType(type);
                  setSelectedCompany(null);
                }}
              >
                {surveyTypeDisplayLabel[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 mt-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Leaderboard ({leaderboard.length} companies)
          </h4>
          <ol className="max-h-[26rem] xl:max-h-[38rem] divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-slate-800">
            {leaderboard.map((composite, index) => {
              const outlier = outlierMap.get(composite.company);
              const isActive = composite.company === activeCompany;
              return (
                <li key={composite.company} className={`transition ${isActive ? 'bg-blue-50 dark:bg-blue-950/60 rounded-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg'}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(isActive ? null : composite.company)}
                    className="flex w-full items-center gap-3 px-2 py-2.5 text-left"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 pr-2">
                        <p className="truncate w-[180px] sm:w-[240px] md:w-[280px] xl:w-[200px] text-sm text-slate-700 dark:text-slate-200">{composite.company}</p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-left" style={{ color: composite.band.hex }}>
                          {composite.compositeScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-1 hidden xl:flex flex-wrap items-center gap-1.5">
                        <span
                          className="badge"
                          style={{ backgroundColor: `${composite.band.hex}1a`, color: composite.band.hex }}
                        >
                          {composite.band.label}
                        </span>
                        {composite.stdDev >= 20 ? (
                          <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            Inconsistent (±{composite.stdDev})
                          </span>
                        ) : null}
                        {outlier?.isLowOutlier ? (
                          <span className="badge bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                            Below peer average
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {composite.evaluationCount} evaluation{composite.evaluationCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </button>
                  {isActive && (
                    <div className="px-2 pb-4 xl:hidden">
                       <div className="mt-1 mb-4 flex flex-wrap items-center gap-1.5 pl-9">
                        <span
                          className="badge"
                          style={{ backgroundColor: `${composite.band.hex}1a`, color: composite.band.hex }}
                        >
                          {composite.band.label}
                        </span>
                        {composite.stdDev >= 20 ? (
                          <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            Inconsistent (±{composite.stdDev})
                          </span>
                        ) : null}
                        {outlier?.isLowOutlier ? (
                          <span className="badge bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                            Below peer average
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {composite.evaluationCount} evaluation{composite.evaluationCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
                            Section breakdown vs peer average
                          </h4>
                          <div className="h-64 w-full overflow-hidden">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart
                                data={radarData}
                                outerRadius="55%"
                                margin={{ top: 8, right: 28, bottom: 8, left: 28 }}
                              >
                                <PolarGrid />
                                <PolarAngleAxis dataKey="section" tick={{ fontSize: 9 }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Radar
                                  name={activeComposite?.company}
                                  dataKey={activeComposite?.company ?? ''}
                                  stroke="#2563eb"
                                  fill="#2563eb"
                                  fillOpacity={0.35}
                                />
                                <Radar name="Peer average" dataKey="Peer average" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="flex flex-col items-center w-full">
                          <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">Score trend</h4>
                          <div className="h-40 w-full max-w-sm">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 justify-center">
                          <span>{activeComposite?.ratedQuestionCount} rated criteria</span>
                          <span>{activeComposite?.naRate}% marked N/A</span>
                          <span>Consistency: ±{activeComposite?.stdDev} pts std dev</span>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="hidden xl:block space-y-4">
          {activeComposite ? (
            <>
              <div>
                <h4 className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {activeComposite.company} — section breakdown vs peer average
                </h4>
                <div className="h-64 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarData}
                      outerRadius={isMobile ? '55%' : '75%'}
                      margin={isMobile ? { top: 8, right: 28, bottom: 8, left: 28 } : undefined}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="section" tick={{ fontSize: isMobile ? 9 : 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name={activeComposite.company}
                        dataKey={activeComposite.company}
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.35}
                      />
                      <Radar name="Peer average" dataKey="Peer average" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Score trend</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>{activeComposite.ratedQuestionCount} rated criteria</span>
                <span>{activeComposite.naRate}% marked N/A</span>
                <span>Consistency: ±{activeComposite.stdDev} pts std dev per question</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a company from the leaderboard.</p>
          )}
        </div>
      </div>
    </section>
  );
}
