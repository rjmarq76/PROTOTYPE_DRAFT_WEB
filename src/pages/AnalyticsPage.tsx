import { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '../components/ChartCard';
import { CompanyPerformancePanel } from '../components/CompanyPerformancePanel';
import { StateMessage } from '../components/StateMessage';
import { useIsMobile } from '../hooks/useIsMobile';
import { FilterState, SurveyResponse, SurveyType } from '../types/survey';
import { averageBySurveyType, naFrequency, questionPerformance, responseVolume } from '../utils/analytics';
import { computeCompanyComposite } from '../utils/scoring';

interface AnalyticsPageProps {
  responses: SurveyResponse[];
  activeSurveyTypes: SurveyType[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

const surveyTypeColors: Record<SurveyType, string> = {
  Contractor: '#2563eb',
  Supplier: '#10b981',
  Subcontractor: '#f97316',
};

function truncateQuestion(text: string, max = 44) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function AnalyticsPage({ responses, activeSurveyTypes, filters, setFilters }: AnalyticsPageProps) {
  const isMobile = useIsMobile();

  if (!responses.length) {
    return <StateMessage title="No analytics available" message="Adjust filters to compare survey groups." />;
  }

  const comparableResponses = responses;

  const [limit, setLimit] = useState<5 | 10>(5);
  const [performanceMode, setPerformanceMode] = useState<'highest' | 'lowest'>('highest');

  const truncateCompanyName = (name: string, maxLen = 14) => {
    return name.length > maxLen ? `${name.substring(0, maxLen)}…` : name;
  };

  const topCompaniesData = useMemo(() => {
    const activeTypes = activeSurveyTypes.length ? activeSurveyTypes : (['Contractor', 'Supplier', 'Subcontractor'] as SurveyType[]);
    const companiesInActiveTypes = [...new Set(comparableResponses
      .filter((r) => activeTypes.includes(r.surveyType))
      .map((r) => r.company)
    )];

    const stats = companiesInActiveTypes
      .map((company) => {
        const activeTypesForCompany = activeTypes.filter((type) =>
          comparableResponses.some((r) => r.company === company && r.surveyType === type)
        );
        if (activeTypesForCompany.length === 0) return null;

        const composites = activeTypesForCompany
          .map((type) => computeCompanyComposite(company, type, comparableResponses))
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
  }, [comparableResponses, activeSurveyTypes, performanceMode, limit]);

  const rankedQuestions = questionPerformance(comparableResponses);
  const topQuestions = rankedQuestions.slice(0, 5);
  const remainingQuestions = rankedQuestions.slice(5);
  const bottomQuestions = remainingQuestions.slice(-5);
  const spreadQuestions = [...topQuestions, ...bottomQuestions];

  const toggleSurveyType = (type: SurveyType) => {
    let newTypes = [...filters.surveyType];
    if (newTypes.includes(type)) {
      newTypes = newTypes.filter((t) => t !== type);
    } else {
      newTypes.push(type);
    }
    setFilters({ ...filters, surveyType: newTypes });
  };

  const allSurveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];

  return (
    <div className="space-y-5">
      <CompanyPerformancePanel responses={comparableResponses} filters={filters} setFilters={setFilters} />

      <section className="panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Survey Comparison</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compare satisfaction patterns across stakeholder groups.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {allSurveyTypes.map((type) => {
                const isActive = activeSurveyTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleSurveyType(type)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                      isActive ? 'border-transparent text-white shadow-sm' : 'border-slate-200 bg-transparent text-slate-600 dark:border-slate-700 dark:text-slate-400'
                    }`}
                    style={isActive ? { backgroundColor: surveyTypeColors[type] } : {}}
                  >
                    {isActive && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }} />}
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title={performanceMode === 'highest' ? `Top ${limit} Best Performing Companies` : `Top ${limit} Underperforming Companies`}
          subtitle={`Based on ${activeSurveyTypes.map(t => t + 's').join(' & ')} ratings`}
          action={
            <div className="flex items-center gap-2 text-xs">
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setPerformanceMode('highest')}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    performanceMode === 'highest'
                      ? 'bg-white dark:bg-slate-800 text-[#0063a9] dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Best
                </button>
                <button
                  type="button"
                  onClick={() => setPerformanceMode('lowest')}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    performanceMode === 'lowest'
                      ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Lowest
                </button>
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setLimit(5)}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    limit === 5
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  5
                </button>
                <button
                  type="button"
                  onClick={() => setLimit(10)}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    limit === 10
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  10
                </button>
              </div>
            </div>
          }
        >
          {topCompaniesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompaniesData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="company"
                  tickFormatter={(v) => truncateCompanyName(v, isMobile ? 8 : 12)}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={isMobile ? 24 : 40}>
                  <LabelList
                    dataKey="score"
                    position="top"
                    style={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                  />
                  {topCompaniesData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={surveyTypeColors[entry.surveyType]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
              No company data fits the filters.
            </div>
          )}
        </ChartCard>
        <ChartCard title="Response Volume" subtitle="Filtered response counts by survey">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responseVolume(comparableResponses, activeSurveyTypes)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="surveyType" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="responses" radius={[6, 6, 0, 0]}>
                {responseVolume(comparableResponses, activeSurveyTypes).map((entry) => (
                  <Cell key={entry.surveyType} fill={surveyTypeColors[entry.surveyType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="N/A Frequency" subtitle="Non-applicable responses by category" contentClassName="h-[26rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={naFrequency(comparableResponses)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Top and Bottom Questions"
          subtitle="5 highest and 5 lowest scoring questions"
          contentClassName="h-[26rem]"
        >
          <div className="mb-2 flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Top 5
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Bottom 5
            </span>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={spreadQuestions} layout="vertical" margin={{ left: 4, right: isMobile ? 16 : 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 4]} tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis
                dataKey="question"
                type="category"
                width={isMobile ? 96 : 190}
                tick={{ fontSize: isMobile ? 9 : 12 }}
                tickFormatter={(value: string) => truncateQuestion(value, isMobile ? 16 : 44)}
                interval={0}
              />
              <Tooltip labelFormatter={(value: string) => value} wrapperStyle={{ maxWidth: 320, whiteSpace: 'normal' }} />
              <Bar dataKey="average" radius={[0, 6, 6, 0]}>
                {spreadQuestions.map((entry, index) => (
                  <Cell key={entry.question} fill={index < topQuestions.length ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
