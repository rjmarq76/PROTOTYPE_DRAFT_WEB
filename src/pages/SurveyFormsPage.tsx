import { useMemo, useState } from 'react';
import { ClipboardList, Plus, Search, Eye, FormInput, X, Check, Award, Building2, CalendarClock } from 'lucide-react';
import { CustomForm, SurveyType, PartnerCompany } from '../types/survey';
import { StateMessage } from '../components/StateMessage';
import { CompletionStatusBar } from '../components/CompletionStatusBar';

interface SurveyFormsPageProps {
  surveys: CustomForm[];
  responses: any[];
  partnerCompanies?: PartnerCompany[];
  userEmail?: string;
  onSelectSurvey: (id: string) => void;
  onNavigateToCreate: () => void;
  onFillForm: (id: string) => void;
  onUpdateSurvey?: (survey: CustomForm) => void;
  isAdmin?: boolean;
}

const surveyTypeOptions: Array<'All' | SurveyType> = ['All', 'Contractor', 'Supplier', 'Subcontractor'];

const surveyTypeColors: Record<SurveyType, string> = {
  Contractor: '#2563eb',
  Supplier: '#10b981',
  Subcontractor: '#f97316',
};

const surveyTypeBadges: Record<SurveyType, string> = {
  Contractor: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20',
  Supplier: 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20',
  Subcontractor: 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/20',
};

export function SurveyFormsPage({
  surveys,
  responses,
  partnerCompanies = [],
  userEmail = '',
  onSelectSurvey,
  onNavigateToCreate,
  onFillForm,
  onUpdateSurvey,
  isAdmin
}: SurveyFormsPageProps) {
  const [surveyType, setSurveyType] = useState<'All' | SurveyType>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<CustomForm | null>(null);

  // Identify unique set of evaluated companies for this user
  const userEvaluations = useMemo(() => {
    if (!userEmail) return new Set<string>();
    const set = new Set<string>();
    const normalizedUserEmail = userEmail.trim().toLowerCase();
    responses.forEach((resp) => {
      if (resp.respondentEmail && resp.respondentEmail.trim().toLowerCase() === normalizedUserEmail) {
        set.add(resp.company.trim().toLowerCase());
      }
    });
    return set;
  }, [responses, userEmail]);

  // Group pending partner companies
  const groupedPendingCompanies = useMemo(() => {
    const pending: Record<SurveyType, PartnerCompany[]> = {
      Contractor: [],
      Supplier: [],
      Subcontractor: [],
    };

    partnerCompanies.forEach((company) => {
      const isEvaluated = userEvaluations.has(company.name.trim().toLowerCase());
      if (!isEvaluated) {
        if (pending[company.type]) {
          pending[company.type].push(company);
        }
      }
    });

    return pending;
  }, [partnerCompanies, userEvaluations]);

  const totalCompanies = partnerCompanies.length;
  const pendingCount =
    groupedPendingCompanies.Contractor.length +
    groupedPendingCompanies.Supplier.length +
    groupedPendingCompanies.Subcontractor.length;
  const evaluatedCount = totalCompanies - pendingCount;
  const completionPercentage = totalCompanies > 0 ? Math.round((evaluatedCount / totalCompanies) * 100) : 0;

  // Per-category totals and completed counts, used to show a per-survey completion status for non-admins.
  const companyTotalsByType = useMemo(() => {
    const totals: Record<SurveyType, number> = { Contractor: 0, Supplier: 0, Subcontractor: 0 };
    partnerCompanies.forEach((company) => {
      totals[company.type] = (totals[company.type] || 0) + 1;
    });
    return totals;
  }, [partnerCompanies]);

  const companyCompletedByType = useMemo(() => {
    const completed: Record<SurveyType, number> = { Contractor: 0, Supplier: 0, Subcontractor: 0 };
    (['Contractor', 'Supplier', 'Subcontractor'] as SurveyType[]).forEach((type) => {
      completed[type] = (companyTotalsByType[type] || 0) - (groupedPendingCompanies[type]?.length || 0);
    });
    return completed;
  }, [companyTotalsByType, groupedPendingCompanies]);

  const formatDeadline = (deadlineDate?: string) => {
    if (!deadlineDate) return 'No deadline set';
    return deadlineDate;
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      if (surveyType !== 'All' && survey.surveyType !== surveyType) return false;

      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = `${survey.title} ${survey.description} ${survey.surveyType}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [surveys, surveyType, search]);

  return (
    <div className="space-y-5">
      {/* Cards Row */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Active Templates</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{surveys.length}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Configured forms for Microgenesis evaluations</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3.5 text-[#0063a9] dark:bg-blue-950/40 dark:text-blue-300">
            <ClipboardList size={22} />
          </div>
        </div>

        {!isAdmin ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="panel p-5 flex items-center justify-between hover:border-[#0063a9] dark:hover:border-blue-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition cursor-pointer group text-left w-full border border-slate-100 dark:border-slate-800"
            type="button"
          >
            <div className="space-y-1 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0063a9] dark:text-blue-400">Your Evaluation Progress</span>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-[#0063a9] dark:group-hover:text-blue-400 transition">
                {evaluatedCount} of {totalCompanies} Partners Evaluated
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {completionPercentage === 100 ? '🎉 All evaluations completed!' : 'Click to view pending companies by type'}
              </p>
            </div>
            
            <div className="relative flex items-center justify-center shrink-0 ml-4">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  className="stroke-[#0063a9] dark:stroke-blue-500 transition-all duration-500 ease-out"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - completionPercentage / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black text-[#0063a9] dark:text-blue-400">
                {completionPercentage}%
              </span>
            </div>
          </button>
        ) : (
          <div className="panel p-5 flex items-center justify-between border-dashed border-2 border-slate-200 dark:border-slate-800/80 bg-slate-50/25 dark:bg-transparent">
            <div className="space-y-1 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Template Engine</span>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Custom Microsoft Forms</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Instantly generate feedback schemas</p>
            </div>
            <button
              onClick={onNavigateToCreate}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
              type="button"
            >
              <Plus size={15} />
              <span>Create Form</span>
            </button>
          </div>
        )}
      </section>

      {/* Main List Section */}
      <section className="panel">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold">Active Survey Forms</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interactive forms for evaluating performance metrics, contracts, and service level agreements.
            </p>
          </div>
          <div className="segmented-control">
            {surveyTypeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={surveyType === option ? 'segmented-active' : ''}
                onClick={() => setSurveyType(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <label className="field-label">
            Search Templates
            <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white pl-3 pr-3 transition focus-within:border-azure focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:ring-blue-950">
              <Search size={16} className="shrink-0 text-[#0063a9] dark:text-blue-300" />
              <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
              <input
                className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
                placeholder="Search survey title or description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
        </div>

        {filteredSurveys.length === 0 ? (
          <StateMessage
            title="No survey forms found"
            message={
              surveys.length === 0
                ? "No custom survey forms have been created yet."
                : "Try adjusting the filters or search to find what you're looking for."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th className="px-4 py-3.5">Survey Title</th>
                  <th className="px-4 py-3.5">Category Type</th>
                  {isAdmin ? (
                    <>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Deadline Date</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3.5">Deadline Date</th>
                      <th className="px-4 py-3.5">Status</th>
                    </>
                  )}
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSurveys.map((survey) => {
                  const deadlineLabel = formatDeadline(survey.deadlineDate);
                  const totalForType = companyTotalsByType[survey.surveyType] || 0;
                  const completedForType = companyCompletedByType[survey.surveyType] || 0;

                  return (
                    <tr key={survey.id} className="align-middle hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 max-w-sm">
                          <span className="font-bold text-slate-850 dark:text-slate-100 hover:text-[#0063a9] dark:hover:text-blue-400 cursor-pointer" onClick={() => onSelectSurvey(survey.id)}>
                            {survey.title}
                          </span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1" title={survey.description}>
                            {survey.description || 'No description provided.'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${surveyTypeBadges[survey.surveyType]}`}>
                          {survey.surveyType}
                        </span>
                      </td>
                      {isAdmin ? (
                        <>
                          <td className="px-4 py-3.5">
                            <CompletionStatusBar completed={completedForType} total={totalForType} />
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock size={13} className="text-slate-400" />
                              {deadlineLabel}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock size={13} className="text-slate-400" />
                              {deadlineLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <CompletionStatusBar completed={completedForType} total={totalForType} />
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3.5 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => onSelectSurvey(survey.id)}
                              className="inline-flex items-center justify-center gap-2 w-36 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 text-sm font-semibold transition cursor-pointer"
                              type="button"
                              title="Manage questions and details"
                            >
                              <Eye size={16} />
                              <span>Manage</span>
                            </button>
                            <button
                              onClick={() => setEditingSurvey(survey)}
                              className="inline-flex items-center justify-center gap-2 w-36 rounded-lg bg-[#0063a9] text-white hover:bg-[#00528c] dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 text-sm font-bold transition cursor-pointer"
                              type="button"
                              title="Modify Survey"
                            >
                              <ClipboardList size={16} />
                              <span>Modify</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => onSelectSurvey(survey.id)}
                              className="inline-flex items-center justify-center gap-2 w-36 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 px-4 py-2 text-sm font-semibold transition cursor-pointer"
                              type="button"
                              title="View survey details"
                            >
                              <Eye size={16} />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => onFillForm(survey.id)}
                              className="inline-flex items-center justify-center gap-2 w-36 rounded-lg bg-[#0063a9] text-white hover:bg-[#00528c] dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 text-sm font-bold transition cursor-pointer"
                              type="button"
                              title="Answer Survey"
                            >
                              <FormInput size={16} />
                              <span>Answer Survey</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pending Companies Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Panel */}
          <div className="relative bg-white dark:bg-slate-950 rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-850 flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Building2 size={18} className="text-[#0063a9] dark:text-blue-400" />
                  <span>Pending Partner Evaluations</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Workers must complete evaluations for all registered partners.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable List */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Overall Stat banner */}
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800/60">
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      className="stroke-[#0063a9] dark:stroke-blue-500"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - completionPercentage / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-extrabold text-[#0063a9] dark:text-blue-400">
                    {completionPercentage}%
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Current progress: {evaluatedCount} / {totalCompanies} companies
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {completionPercentage === 100 
                      ? "Awesome job! You have fully evaluated all active companies."
                      : `You still have ${totalCompanies - evaluatedCount} partners left to evaluate.`
                    }
                  </p>
                </div>
              </div>

              {completionPercentage === 100 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
                    <Award size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">All Completed!</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Thank you! You have evaluated all Contractor, Supplier, and Subcontractor companies.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {(['Contractor', 'Supplier', 'Subcontractor'] as SurveyType[]).map((type) => {
                    const pendingList = groupedPendingCompanies[type] || [];
                    const typeColors = {
                      Contractor: 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30',
                      Supplier: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30',
                      Subcontractor: 'text-orange-600 bg-orange-50 border-orange-100 dark:text-orange-400 dark:bg-orange-950/20 dark:border-orange-900/30',
                    };

                    return (
                      <div key={type} className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColors[type]}`}>
                            {type}s
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {pendingList.length} pending
                          </span>
                        </div>

                        {pendingList.length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50/50 border border-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-950/10 dark:border-emerald-900/20 rounded-lg p-3">
                            <Check size={14} className="shrink-0" />
                            <span>All {type}s evaluated! Excellent work.</span>
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {pendingList.map((company) => (
                              <div
                                key={company.id}
                                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-100 bg-slate-50/30 dark:border-slate-900 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                                <span className="truncate" title={company.name}>{company.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-[#0063a9] hover:bg-[#00528c] text-white px-4 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
                type="button"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modify Survey Modal */}
      {editingSurvey && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-bold mb-4">Modify Survey Properties</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select 
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                  value={editingSurvey.status || 'Running'}
                  onChange={(e) => setEditingSurvey({ ...editingSurvey, status: e.target.value as any })}
                >
                  <option value="Running">Running</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Deadline Date</label>
                <input 
                  type="date"
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                  value={editingSurvey.deadlineDate || ''}
                  onChange={(e) => setEditingSurvey({ ...editingSurvey, deadlineDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingSurvey(null)}
                className="secondary-button"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onUpdateSurvey) {
                    onUpdateSurvey(editingSurvey);
                  }
                  setEditingSurvey(null);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-[#0063a9] text-white hover:bg-[#00528c] px-4 py-2 text-sm font-semibold transition cursor-pointer"
                type="button"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
