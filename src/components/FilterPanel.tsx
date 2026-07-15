import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { FilterState, QuestionDefinition, Rating, SurveyType } from '../types/survey';

interface FilterPanelProps {
  filters: FilterState;
  questions: QuestionDefinition[];
  companies: string[];
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  isDashboard?: boolean;
  isFullDatasetActive?: boolean;
  clearResponses?: () => void;
  addSingleMockResponse?: () => void;
  toggleFullDataset?: (enable: boolean) => void;
}

const ratings: Array<'All' | Rating> = ['All', 0, 1, 2, 3, 4, 'N/A'];

const surveyTypeOptions: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];
const surveyTypeColors: Record<SurveyType, string> = {
  Contractor: '#2563eb',
  Supplier: '#10b981',
  Subcontractor: '#f97316',
};

export function FilterPanel({
  filters,
  questions,
  companies,
  onChange,
  onReset,
  isDashboard,
  isFullDatasetActive,
  clearResponses,
  addSingleMockResponse,
  toggleFullDataset,
}: FilterPanelProps) {
  const update = <Key extends keyof FilterState>(key: Key, value: FilterState[Key]) => onChange({ ...filters, [key]: value });

  const toggleSurveyType = (type: SurveyType) => {
    const next = filters.surveyType.includes(type)
      ? filters.surveyType.filter((value) => value !== type)
      : [...filters.surveyType, type];
    update('surveyType', next);
  };

  const filteredQuestions = useMemo(() => {
    if (filters.surveyType.length === 0) return questions;
    return questions.filter((question) => question.surveyTypes.some((type) => filters.surveyType.includes(type)));
  }, [questions, filters.surveyType]);

  return (
    <section className="panel sticky top-24">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Filters</h3>
        <button className="ghost-button" type="button" onClick={onReset}>
          <RotateCcw size={15} />
          Reset
        </button>
      </div>
      <div className="space-y-4">
        {isDashboard ? (
          <label className="field-label">
            Company Category
            <select
              className="field mt-1"
              value={filters.surveyType.length === 1 ? filters.surveyType[0] : 'All'}
              onChange={(event) => {
                const val = event.target.value;
                if (val === 'All') {
                  update('surveyType', []);
                } else {
                  update('surveyType', [val as SurveyType]);
                }
              }}
            >
              <option value="All">All Categories</option>
              <option value="Contractor">Contractor</option>
              <option value="Supplier">Supplier</option>
              <option value="Subcontractor">Subcontractor</option>
            </select>
          </label>
        ) : (
          <div className="field-label">
            Survey Type
            <div className="mt-1 space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              {surveyTypeOptions.map((type) => {
                const checked = filters.surveyType.includes(type);
                return (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2.5 text-sm font-normal text-slate-600 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-azure focus:ring-azure dark:border-slate-700 dark:bg-slate-900"
                      checked={checked}
                      onChange={() => toggleSurveyType(type)}
                    />
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: surveyTypeColors[type] }}
                    />
                    {type}
                  </label>
                );
              })}
            </div>
            {filters.surveyType.length === 0 && (
              <p className="mt-1 text-xs font-normal text-slate-400 dark:text-slate-500">None selected — showing all types.</p>
            )}
          </div>
        )}
        <label className="field-label">
          Question
          <select className="field" value={filters.questionId} onChange={(event) => update('questionId', event.target.value)}>
            <option value="">All questions</option>
            {filteredQuestions.map((question) => (
              <option key={question.questionId} value={question.questionId}>
                {question.questionId} - {question.questionCategory}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Rating
          <select className="field" value={String(filters.rating)} onChange={(event) => update('rating', event.target.value === 'All' ? 'All' : event.target.value === 'N/A' ? 'N/A' : Number(event.target.value) as Rating)}>
            {ratings.map((rating) => (
              <option key={String(rating)} value={String(rating)}>
                {rating}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Company
          <select className="field" value={filters.company} onChange={(event) => update('company', event.target.value)}>
            <option value="">All companies</option>
            {companies.map((company) => (
              <option key={company}>{company}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Search
          <input className="field" placeholder="Company, comment, question..." value={filters.search} onChange={(event) => update('search', event.target.value)} />
        </label>
      </div>

      {/* Test Controls / Database Test Suite */}
      {clearResponses && addSingleMockResponse && toggleFullDataset && (
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Database Test Suite</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Simulate evaluations to verify real-time charts and PDF report generators.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              className="button bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3 rounded-md transition-colors"
              onClick={addSingleMockResponse}
              type="button"
            >
              Add Single Evaluation
            </button>
            <label className="flex items-center gap-2.5 cursor-pointer select-none py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-azure focus:ring-azure dark:border-slate-700 dark:bg-slate-900"
                checked={!!isFullDatasetActive}
                onChange={(e) => toggleFullDataset(e.target.checked)}
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Bulk Seed All Non-Admin Accounts
              </span>
            </label>
            <button
              className="ghost-button border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs py-2 px-3 rounded-md text-center justify-center"
              onClick={clearResponses}
              type="button"
            >
              Clear All Responses
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
