import { Award, Ban, ClipboardList, Star, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState, useEffect } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '../components/ChartCard';
import { StatCard } from '../components/StatCard';
import { StateMessage } from '../components/StateMessage';
import { PartnerCompany, SurveyResponse, SurveyType } from '../types/survey';
import { formatNumber, getKpiSummary, monthlyTrend, questionPerformance, ratingDistribution, getMaxRatingForResponses } from '../utils/analytics';

interface DashboardPageProps {
  responses: SurveyResponse[];
  allResponses: SurveyResponse[];
  partnerCompanies: PartnerCompany[];
  isLoading: boolean;
  error: string | null;
  surveyTypeFilter: SurveyType[];
}

const chartColors = ['#2563eb', '#10b981', '#f97316', '#64748b', '#172033', '#e11d48'];

const categoryColors: Record<string, {
  text: string;
  bg: string;
  border: string;
  stroke: string;
  badgeBg: string;
  borderT: string;
  borderClass: string;
  label: string;
}> = {
  Contractor: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/40 dark:bg-blue-950/10',
    border: 'border-blue-100 dark:border-blue-900/30',
    stroke: 'stroke-blue-600 dark:stroke-blue-400',
    badgeBg: 'bg-blue-100 text-blue-850 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
    borderT: 'border-t-blue-500',
    borderClass: 'border-blue-500',
    label: 'Contractor',
  },
  Supplier: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/10',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-850 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-850',
    borderT: 'border-t-emerald-500',
    borderClass: 'border-emerald-500',
    label: 'Supplier',
  },
  Subcontractor: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50/40 dark:bg-orange-950/10',
    border: 'border-orange-100 dark:border-orange-900/30',
    stroke: 'stroke-orange-600 dark:stroke-orange-400',
    badgeBg: 'bg-orange-100 text-orange-850 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-200 dark:border-orange-800',
    borderT: 'border-t-orange-500',
    borderClass: 'border-orange-500',
    label: 'Subcontractor',
  },
  'N/A': {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50/40 dark:bg-slate-950/10',
    border: 'border-slate-100 dark:border-slate-800/30',
    stroke: 'stroke-slate-600 dark:stroke-slate-400',
    badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200 border border-slate-200 dark:border-slate-800',
    borderT: 'border-t-slate-500',
    borderClass: 'border-slate-500',
    label: 'Overall',
  }
};

function getSatisfactionColor(p: number) {
  if (p < 50) {
    return {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900/40',
      stroke: 'stroke-red-500 dark:stroke-red-400',
      fill: 'fill-red-500 dark:fill-red-400',
      label: 'Critical Status',
      badgeBg: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      description: 'Satisfaction levels are critical. Immediate attention to partner performance and remediation is highly recommended.'
    };
  } else if (p < 65) {
    return {
      text: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-900/40',
      stroke: 'stroke-orange-500 dark:stroke-orange-400',
      fill: 'fill-orange-500 dark:fill-orange-400',
      label: 'Needs Improvement',
      badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
      description: 'Average performance with noticeable gaps. Several operational or communication areas require corrective feedback.'
    };
  } else if (p < 75) {
    return {
      text: 'text-yellow-500 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-900/40',
      stroke: 'stroke-yellow-500 dark:stroke-yellow-400',
      fill: 'fill-yellow-500 dark:fill-yellow-400',
      label: 'Satisfactory Performance',
      badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      description: 'Acceptable standards met. Consistent results overall, with opportunity to optimize delivery timelines and invoices.'
    };
  } else if (p < 85) {
    return {
      text: 'text-lime-600 dark:text-lime-400',
      bg: 'bg-lime-50 dark:bg-lime-950/20',
      border: 'border-lime-200 dark:border-lime-900/40',
      stroke: 'stroke-lime-500 dark:stroke-lime-400',
      fill: 'fill-lime-500 dark:fill-lime-400',
      label: 'Good Quality Service',
      badgeBg: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200',
      description: 'Solid performance. Partners are highly responsive, maintaining high quality outputs with minimal transaction discrepancies.'
    };
  } else {
    return {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-900/40',
      stroke: 'stroke-green-600 dark:stroke-green-400',
      fill: 'fill-green-600 dark:fill-green-400',
      label: 'Excellent Standing',
      badgeBg: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      description: 'Outstanding partnership. Prominent operational quality, competitive pricing terms, and proactive stakeholder engagement.'
    };
  }
}

export function DashboardPage({ responses, allResponses = [], partnerCompanies = [], isLoading, error, surveyTypeFilter = [] }: DashboardPageProps) {
  const [selectedChampionType, setSelectedChampionType] = useState<'Overall' | 'Contractor' | 'Supplier' | 'Subcontractor'>('Overall');

  const activeCategory = useMemo(() => {
    return surveyTypeFilter && surveyTypeFilter.length === 1 ? surveyTypeFilter[0] : 'All';
  }, [surveyTypeFilter]);

  // Sync category state with page category filter changes
  useEffect(() => {
    if (activeCategory === 'All') {
      setSelectedChampionType('Overall');
    } else {
      setSelectedChampionType(activeCategory);
    }
  }, [activeCategory]);

  if (isLoading) {
    return <StateMessage title="Loading analytics" message="Reading centralized survey list records." />;
  }

  if (error) {
    return <StateMessage title="Unable to load dashboard" message={error} />;
  }

  if (!responses.length) {
    return <StateMessage title="No responses match the current filters" message="Reset filters or broaden the date range to restore analytics." />;
  }

  const summary = getKpiSummary(responses);
  const trend = monthlyTrend(responses);
  const questions = questionPerformance(responses);

  // Compute precise top and bottom rated scores directly
  const sortedQuestions = [...questions].sort((left, right) => right.average - left.average);
  const highestScore = sortedQuestions[0]?.average ?? 4.0;
  const lowestScore = sortedQuestions[sortedQuestions.length - 1]?.average ?? 0.0;

  const portfolioMaxRating = useMemo(() => {
    return getMaxRatingForResponses(allResponses);
  }, [allResponses]);

  // Calculate satisfaction averages per company across all surveys combined (unfiltered/constant responses!)
  const companyAverages = useMemo(() => {
    const companyMap: Record<string, { name: string; sum: number; count: number; type: string }> = {};
    
    // Create map of company name to type from partnerCompanies
    const typeMap = new Map<string, string>();
    partnerCompanies.forEach((c) => typeMap.set(c.name, c.type));

    allResponses.forEach((r) => {
      if (r.rating === 'N/A') return;
      if (!companyMap[r.company]) {
        const type = typeMap.get(r.company) || r.surveyType;
        companyMap[r.company] = { name: r.company, sum: 0, count: 0, type };
      }
      companyMap[r.company].sum += r.rating as number;
      companyMap[r.company].count += 1;
    });

    // Make sure all registered companies are represented even if they have 0 responses
    partnerCompanies.forEach((c) => {
      if (!companyMap[c.name]) {
        companyMap[c.name] = { name: c.name, sum: 0, count: 0, type: c.type };
      }
    });

    return Object.values(companyMap)
      .map((c) => {
        const average = c.count > 0 ? c.sum / c.count : 0;
        const scorePercentage = (average / portfolioMaxRating) * 100;
        return {
          name: c.name,
          average,
          scorePercentage,
          count: c.count,
          type: c.type,
        };
      })
      .sort((a, b) => b.average - a.average);
  }, [allResponses, partnerCompanies, portfolioMaxRating]);

  const topCompany = useMemo(() => {
    return companyAverages[0] || { name: 'No Registered Partners', average: 0, scorePercentage: 0, type: 'N/A', count: 0 };
  }, [companyAverages]);

  const topContractor = useMemo(() => companyAverages.find((c) => c.type === 'Contractor'), [companyAverages]);
  const topSupplier = useMemo(() => companyAverages.find((c) => c.type === 'Supplier'), [companyAverages]);
  const topSubcontractor = useMemo(() => companyAverages.find((c) => c.type === 'Subcontractor'), [companyAverages]);

  const displayedCompany = useMemo(() => {
    if (selectedChampionType === 'Overall') return topCompany;
    if (selectedChampionType === 'Contractor') return topContractor || { name: 'No Registered Contractors', average: 0, scorePercentage: 0, type: 'Contractor', count: 0 };
    if (selectedChampionType === 'Supplier') return topSupplier || { name: 'No Registered Suppliers', average: 0, scorePercentage: 0, type: 'Supplier', count: 0 };
    if (selectedChampionType === 'Subcontractor') return topSubcontractor || { name: 'No Registered Subcontractors', average: 0, scorePercentage: 0, type: 'Subcontractor', count: 0 };
    return topCompany;
  }, [selectedChampionType, topCompany, topContractor, topSupplier, topSubcontractor]);

  const score = displayedCompany.scorePercentage;
  const activeColor = categoryColors[displayedCompany.type] || categoryColors['N/A'];
  const standingDetails = getSatisfactionColor(score);

  // Averages for companies under the currently active category (for Performance Highlights)
  const categoryCompanyAverages = useMemo(() => {
    return companyAverages.filter((c) => {
      if (activeCategory === 'All') return true;
      return c.type === activeCategory;
    });
  }, [companyAverages, activeCategory]);

  const highestCompany = useMemo(() => {
    return categoryCompanyAverages[0] || { name: 'No Registered Partners', average: 0, count: 0, type: 'N/A' };
  }, [categoryCompanyAverages]);

  const lowestCompany = useMemo(() => {
    return categoryCompanyAverages[categoryCompanyAverages.length - 1] || { name: 'No Registered Partners', average: 0, count: 0, type: 'N/A' };
  }, [categoryCompanyAverages]);

  // Performance highlights texts based on company ratings
  const highestLabel = activeCategory === 'All' 
    ? 'Highest Rated Company' 
    : `Highest Rated ${activeCategory}`;

  const lowestLabel = activeCategory === 'All' 
    ? 'Lowest Rated Company' 
    : `Lowest Rated ${activeCategory}`;

  return (
    <div className="space-y-6">
      {/* Prominent KPI Section: Overall Satisfaction */}
      <div className={`panel flex flex-col md:flex-row items-center justify-between p-6 md:p-8 border-2 border-slate-100 dark:border-slate-800/40 shadow-lg relative overflow-hidden bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/40 gap-6 md:gap-10`}>
        
        {/* Left Side: Circular Gauge */}
        <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Underlay Track */}
            <circle
              cx="96"
              cy="96"
              r="75"
              className="stroke-slate-100 dark:stroke-slate-800/50 fill-none"
              strokeWidth="10"
            />
            {/* Animated Segment Progress */}
            <motion.circle
              cx="96"
              cy="96"
              r="75"
              className={`${activeColor.stroke} fill-none`}
              strokeWidth="10"
              strokeDasharray="471.2"
              initial={{ strokeDashoffset: 471.2 }}
              animate={{ strokeDashoffset: 471.2 - (471.2 * score) / 100 }}
              key={displayedCompany.name}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Centered Number Overlay */}
          <div className="absolute flex flex-col items-center justify-center text-center px-4">
            <motion.span
              className={`text-4xl font-light tracking-tight ${activeColor.text}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={displayedCompany.name}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {formatNumber(score, 0)}%
            </motion.span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1 block max-w-[120px] truncate" title={displayedCompany.name}>
              {displayedCompany.name}
            </span>
          </div>
        </div>

        {/* Right Side: Overall Satisfaction Texts on its Side */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {activeCategory === 'All' ? 'Top Performing Partner' : `Top Performing ${activeCategory}`}
            </span>
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeColor.badgeBg}`}>
              {displayedCompany.type} Champion
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {displayedCompany.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              {displayedCompany.name === 'No Registered Partners' || displayedCompany.name.startsWith('No Registered')
                ? 'No evaluations are registered. Employees can submit evaluations using the published survey forms.'
                : `${displayedCompany.name} is recognized as the top-performing ${displayedCompany.type.toLowerCase()} partner, earning the highest combined satisfaction score of ${formatNumber(displayedCompany.average, 2)} out of ${portfolioMaxRating.toFixed(2)} across all survey categories from Microgenesis employees.`
              }
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Combined average:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNumber(displayedCompany.average, 2)} / {portfolioMaxRating.toFixed(2)}</span>
            </div>
            <span className="hidden sm:inline text-slate-200 dark:text-slate-800">|</span>
            <div className="flex items-center gap-1.5">
              <span>Evaluations:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{displayedCompany.count} answers</span>
            </div>
            <span className="hidden sm:inline text-slate-200 dark:text-slate-800">|</span>
            <div className="flex items-center gap-1.5">
              <span>Standing category:</span>
              <span className={`font-semibold ${activeColor.text}`}>{standingDetails.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Champions Section (Interactive toggle, ONLY shown on "All" view) */}
      {activeCategory === 'All' && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {/* Contractor Champion Card */}
          <div
            onClick={() => setSelectedChampionType(selectedChampionType === 'Contractor' ? 'Overall' : 'Contractor')}
            className={`panel p-4 flex flex-col justify-between border-t-4 border-blue-500 bg-blue-50/5 dark:bg-slate-900/10 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
              selectedChampionType === 'Contractor' ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Top Contractor</span>
                <Award className="text-blue-500 shrink-0" size={16} />
              </div>
              {topContractor ? (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{topContractor.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Based on {topContractor.count} evaluation answers</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No evaluations submitted yet.</p>
              )}
            </div>
            {topContractor && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                <span className="text-xs font-semibold text-slate-500">Employee Rating</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {topContractor.average.toFixed(2)} / {portfolioMaxRating.toFixed(2)} ({Math.round(topContractor.scorePercentage)}%)
                </span>
              </div>
            )}
          </div>

          {/* Supplier Champion Card */}
          <div
            onClick={() => setSelectedChampionType(selectedChampionType === 'Supplier' ? 'Overall' : 'Supplier')}
            className={`panel p-4 flex flex-col justify-between border-t-4 border-emerald-500 bg-emerald-50/5 dark:bg-slate-900/10 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
              selectedChampionType === 'Supplier' ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Top Supplier</span>
                <Award className="text-emerald-500 shrink-0" size={16} />
              </div>
              {topSupplier ? (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{topSupplier.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Based on {topSupplier.count} evaluation answers</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No evaluations submitted yet.</p>
              )}
            </div>
            {topSupplier && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                <span className="text-xs font-semibold text-slate-500">Employee Rating</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {topSupplier.average.toFixed(2)} / {portfolioMaxRating.toFixed(2)} ({Math.round(topSupplier.scorePercentage)}%)
                </span>
              </div>
            )}
          </div>

          {/* Subcontractor Champion Card */}
          <div
            onClick={() => setSelectedChampionType(selectedChampionType === 'Subcontractor' ? 'Overall' : 'Subcontractor')}
            className={`panel p-4 flex flex-col justify-between border-t-4 border-orange-500 bg-orange-50/5 dark:bg-slate-900/10 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
              selectedChampionType === 'Subcontractor' ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-slate-950' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Top Subcontractor</span>
                <Award className="text-orange-500 shrink-0" size={16} />
              </div>
              {topSubcontractor ? (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{topSubcontractor.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Based on {topSubcontractor.count} evaluation answers</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No evaluations submitted yet.</p>
              )}
            </div>
            {topSubcontractor && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                <span className="text-xs font-semibold text-slate-500">Employee Rating</span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  {topSubcontractor.average.toFixed(2)} / {portfolioMaxRating.toFixed(2)} ({Math.round(topSubcontractor.scorePercentage)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Stats Row - Total Responses and Portfolio Average Rating */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <StatCard
          label="Total Responses"
          value={String(summary.totalResponses)}
          detail="Consolidated response records extracted directly from Microsoft Forms platforms."
          icon={ClipboardList}
        />
        <StatCard
          label="Portfolio Average Rating"
          value={`${formatNumber(summary.averageRating, 2)} / ${portfolioMaxRating.toFixed(2)}`}
          detail="Total average performance score across all partner evaluations combined, excluding N/A."
          icon={Star}
        />
      </div>

      {/* Secondary Stats Row - Performance Highlights & N/A Percentage */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <article className="panel md:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Performance Highlights</span>
              <span className="rounded bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-bold text-azure">Extremes</span>
            </div>
            
            <div className="space-y-5">
              {/* Highest Rated Partner Row */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/40">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    <TrendingUp size={14} className="shrink-0" />
                    <span>{highestLabel}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate mt-1" title={highestCompany.name}>
                    {highestCompany.name}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Rating: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{highestCompany.average.toFixed(2)}</span> / {portfolioMaxRating.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Based on {highestCompany.count} evaluations
                  </p>
                </div>
                {/* Right side circular progress */}
                <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-slate-100 dark:stroke-slate-800/40 fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-emerald-500 dark:stroke-emerald-400 fill-none"
                      strokeWidth="6"
                      strokeDasharray="238.76"
                      strokeDashoffset={238.76 - (238.76 * (highestCompany.average / portfolioMaxRating))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round((highestCompany.average / portfolioMaxRating) * 100)}%
                  </div>
                </div>
              </div>

              {/* Lowest Rated Partner Row */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400 whitespace-nowrap">
                    <Users size={14} className="shrink-0" />
                    <span>{lowestLabel}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate mt-1" title={lowestCompany.name}>
                    {lowestCompany.name}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Rating: <span className="text-rose-500 dark:text-rose-400 font-bold">{lowestCompany.average.toFixed(2)}</span> / {portfolioMaxRating.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Based on {lowestCompany.count} evaluations
                  </p>
                </div>
                {/* Right side circular progress */}
                <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-slate-100 dark:stroke-slate-800/40 fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      className="stroke-rose-500 dark:stroke-rose-400 fill-none"
                      strokeWidth="6"
                      strokeDasharray="238.76"
                      strokeDashoffset={238.76 - (238.76 * (lowestCompany.average / portfolioMaxRating))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-sm font-bold text-rose-500 dark:text-rose-400">
                    {Math.round((lowestCompany.average / portfolioMaxRating) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
        <div className="md:col-span-1">
          <StatCard
            label="N/A Percentage"
            value={`${formatNumber(summary.naPercentage, 1)}%`}
            detail="Share of evaluated criteria marked as Not Applicable by respondents."
            icon={Ban}
          />
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1">
        <ChartCard title="Monthly Trend" subtitle="Average score and response volume over time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" domain={[0, portfolioMaxRating]} />
              <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={3} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="responses" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Question Performance"
        subtitle="All questions, ranked by average rating (highest to lowest)"
        contentClassName="max-h-[32rem] overflow-y-auto pr-1"
      >
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {questions.map((item, index) => {
            const pct = Math.max(0, Math.min(100, (item.average / portfolioMaxRating) * 100));
            const norm = item.average / portfolioMaxRating;
            const tone =
              norm >= 0.75
                ? { text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' }
                : norm >= 0.50
                  ? { text: 'text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500' }
                  : norm >= 0.25
                    ? { text: 'text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' }
                    : { text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500' };

            return (
              <li key={item.question} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-200">{item.question}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-1.5 rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{item.responses} responses</span>
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone.text}`}>{item.average.toFixed(1)}</span>
              </li>
            );
          })}
        </ol>
      </ChartCard>
    </div>
  );
}
