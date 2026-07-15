import { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Building, 
  Info, 
  Calendar, 
  Hash, 
  Briefcase, 
  ClipboardList, 
  Award, 
  X,
  List,
  LayoutGrid,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { PartnerCompany, SurveyResponse, SurveyType } from '../types/survey';
import { getMaxRatingForResponses } from '../utils/analytics';
import { computeCompanyComposite } from '../utils/scoring';

interface PartnerCompaniesPageProps {
  partnerCompanies: PartnerCompany[];
  responses: SurveyResponse[];
  onAddCompany: (name: string, type: SurveyType, affiliation?: string) => void;
  onRemoveCompany: (id: string) => void;
  isAdmin?: boolean;
}

export function PartnerCompaniesPage({
  partnerCompanies,
  responses,
  onAddCompany,
  onRemoveCompany,
  isAdmin,
}: PartnerCompaniesPageProps) {
  const [activeTab, setActiveTab] = useState<SurveyType | 'All'>('All');
  const [viewMode, setViewMode] = useState<'general' | 'simplified'>('general');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const maxRating = useMemo(() => {
    return getMaxRatingForResponses(responses);
  }, [responses]);
  
  // Registration Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SurveyType>('Contractor');
  const [newAffiliation, setNewAffiliation] = useState('');
  
  // Feedback Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Passcode modal state
  const [companyToDelete, setCompanyToDelete] = useState<PartnerCompany | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  type SortKey = 'name' | 'type' | 'createdAt';
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const adminPasscode = 'mgenesis2026';

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Calculate statistics for each company based on responses
  const companyStats = useMemo(() => {
    const stats: Record<string, { totalResponses: number; sumRating: number; countRating: number }> = {};

    responses.forEach((r) => {
      if (!stats[r.company]) {
        stats[r.company] = { totalResponses: 0, sumRating: 0, countRating: 0 };
      }
      stats[r.company].totalResponses += 1;
      if (r.rating !== 'N/A') {
        stats[r.company].sumRating += r.rating as number;
        stats[r.company].countRating += 1;
      }
    });

    return stats;
  }, [responses]);

  const getCompanyScoreDetails = (companyName: string, companyType: SurveyType) => {
    const composite = computeCompanyComposite(companyName, companyType, responses);
    if (!composite) {
      return { rating: 'N/A', pct: 0, count: 0, label: 'Unrated' };
    }
    return {
      rating: `${composite.compositeScore.toFixed(1)}%`,
      pct: Math.round(composite.compositeScore),
      count: composite.evaluationCount, // number of evaluations/audits completed
      label: composite.band.label,
    };
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newName.trim()) {
      setErrorMessage('Company name cannot be blank.');
      return;
    }

    const exists = partnerCompanies.some(
      (c) => c.name.toLowerCase() === newName.trim().toLowerCase()
    );
    if (exists) {
      setErrorMessage(`"${newName.trim()}" is already in the partner list.`);
      return;
    }

    onAddCompany(newName, newType, newAffiliation);
    setSuccessMessage(`"${newName.trim()}" successfully added as a Partner ${newType}.`);
    setNewName('');
    setNewAffiliation('');
    setIsRegisterOpen(false);

    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const startDelete = (company: PartnerCompany) => {
    setCompanyToDelete(company);
    setPasscodeInput('');
    setPasscodeError('');
  };

  const confirmDelete = () => {
    if (passcodeInput !== adminPasscode) {
      setPasscodeError('Invalid administrative passcode. Please try again.');
      return;
    }
    if (companyToDelete) {
      onRemoveCompany(companyToDelete.id);
      setSuccessMessage(`Successfully removed partner "${companyToDelete.name}".`);
      setCompanyToDelete(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const filteredCompanies = useMemo(() => {
    let result = partnerCompanies;
    if (activeTab !== 'All') {
      result = partnerCompanies.filter((c) => c.type === activeTab);
    }
    
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return result;
  }, [partnerCompanies, activeTab, sortConfig]);

  return (
    <div className="space-y-6" id="partner-companies-page">
      {/* Page Header */}
      <div className="panel bg-[#0063a9]/5 border-blue-100 dark:border-blue-900/30 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-[#0063a9] p-2 text-white shrink-0 mt-0.5">
            <Building size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0063a9] dark:text-blue-300">Administrative Partner Registry</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Define and monitor the master roster of contractors, suppliers, and subcontractors. Microgenesis employees from different departments evaluate these partner companies via published Microsoft Forms.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-xs font-semibold flex items-center gap-2 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400">
          <Sparkles size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose px-4 py-3 text-xs font-semibold flex items-center gap-2 dark:bg-rose-950/20 dark:border-rose-900">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Options Bar (Tabs + Add Button) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-nowrap overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950 sm:max-w-md w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
          {(['All', 'Contractor', 'Supplier', 'Subcontractor'] as const).map((tab) => (
            <button
              key={tab}
              className={`shrink-0 whitespace-nowrap rounded-md py-2 px-4 text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#0063a9] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'All' ? 'All' : `${tab}s`}
            </button>
          ))}
        </div>

        {/* Register Button (admin-only; registration is an admin-managed capability, no restriction notice needed for others) */}
        {isAdmin && (
          <button
            onClick={() => {
              setErrorMessage('');
              setIsRegisterOpen(true);
            }}
            className="bg-[#0063a9] hover:bg-[#00528c] text-white flex items-center justify-center gap-1.5 py-2 px-5 text-xs font-bold rounded-lg shadow-xs transition duration-150 cursor-pointer"
            type="button"
          >
            <Plus size={16} />
            <span>Register New Partner</span>
          </button>
        )}
      </div>

      {/* Expanded Partners list */}
      <div className="panel p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Registered Partner Companies ({filteredCompanies.length})
          </span>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setViewMode('general')}
              className={`flex items-center gap-1.5 rounded-md py-1.5 px-3 text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                viewMode === 'general'
                  ? 'bg-[#0063a9] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={12} />
              <span>General</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('simplified')}
              className={`flex items-center gap-1.5 rounded-md py-1.5 px-3 text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                viewMode === 'simplified'
                  ? 'bg-[#0063a9] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List size={12} />
              <span>Simplified</span>
            </button>
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">No companies registered under this classification.</p>
            <p className="text-xs mt-1 text-slate-400">Click "Register New Partner" to add one.</p>
          </div>
        ) : viewMode === 'simplified' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/60">
                  <th 
                    className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Company Name
                      {sortConfig?.key === 'name' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      {sortConfig?.key === 'type' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Date Registered
                      {sortConfig?.key === 'createdAt' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="px-5 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{c.name}</td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        c.type === 'Contractor'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20'
                          : c.type === 'Supplier'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20'
                          : 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/20'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCompanies.map((c) => {
              const score = getCompanyScoreDetails(c.name, c.type);
              
              // Satisfaction Standing Badges
              let standingColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
              let progressColor = 'bg-slate-400';
              
              if (score.label === 'Excellent' || score.label === 'Top Performer') {
                standingColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30';
                progressColor = 'bg-emerald-500';
              } else if (score.label === 'Good' || score.label === 'Good Performer') {
                standingColor = 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/30 dark:text-lime-400 dark:border-lime-900/30';
                progressColor = 'bg-lime-500';
              } else if (score.label === 'Satisfactory' || score.label === 'Marginal Performer') {
                standingColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30';
                progressColor = 'bg-[#0063a9]';
              } else if (score.label === 'Needs Imp.') {
                standingColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30';
                progressColor = 'bg-amber-500';
              } else if (score.label === 'Critical' || score.label === 'Unsatisfactory' || score.label === 'Poor Performer') {
                standingColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30';
                progressColor = 'bg-rose-500';
              }

              return (
                <div key={c.id} className="p-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition">
                  {/* Top segment: Title, pill badges and Action */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {c.name}
                        </h4>
                        
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          c.type === 'Contractor' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20' 
                            : c.type === 'Supplier'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20'
                            : 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/20'
                        }`}>
                          {c.type}
                        </span>
                      </div>

                      {/* Meta Tags Bar */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Hash size={13} className="text-slate-300 dark:text-slate-600" />
                          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                            {c.id.toUpperCase()}
                          </span>
                        </span>

                        <span className="text-slate-200 dark:text-slate-800">|</span>

                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-300 dark:text-slate-600" />
                          <span>Registered: <strong className="text-slate-600 dark:text-slate-400">{formatDate(c.createdAt)}</strong></span>
                        </span>
                      </div>
                    </div>

                    {/* Delete action button */}
                    {isAdmin && (
                      <button
                        onClick={() => startDelete(c)}
                        className="text-slate-300 hover:text-rose-600 dark:text-slate-700 dark:hover:text-rose-400 transition p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg shrink-0 cursor-pointer self-start sm:self-center"
                        title="Remove Partner Company"
                        type="button"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>

                  {/* Multi-column specs details grid */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 border-t border-slate-100 pt-5 dark:border-slate-800/60">
                    
                    {/* Column 1: Scope & Affiliation details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Briefcase size={12} />
                        <span>Scope & Classification</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="text-slate-600 dark:text-slate-300 font-medium">
                          {c.affiliation || 'General specialization scope'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Category level: {c.type} affiliation unit
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Audit response metrics */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <ClipboardList size={12} />
                        <span>Survey Volume</span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">
                          {score.count} {score.count === 1 ? 'audit evaluation' : 'audits completed'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Submitted by internal Microgenesis departments
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Quality rating scorecard */}
                    <div className="space-y-2 col-span-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Award size={12} />
                        <span>Satisfaction Index</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-white">
                              {score.rating}
                            </span>
                            {score.rating !== 'N/A' && (
                              <span className="text-[10px] text-slate-400">/ {maxRating.toFixed(2)}</span>
                            )}
                          </div>
                          
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${standingColor}`}>
                            {score.label}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {score.rating !== 'N/A' ? (
                          <div className="space-y-1">
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${progressColor}`} 
                                style={{ width: `${score.pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Satisfaction rate</span>
                              <span className="font-bold text-slate-600 dark:text-slate-300">{score.pct}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Awaiting evaluation results
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REGISTER PARTNER MODAL DIALOG */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              title="Close dialog"
              type="button"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-[#0063a9]">
              <div className="rounded-lg bg-[#0063a9]/10 p-2 text-[#0063a9]">
                <Building size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register Partner Company</h3>
                <p className="text-xs text-slate-500">Add a new contractor, supplier, or subcontractor to the master registry</p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 mt-6">
              <div>
                <label htmlFor="modal-reg-name" className="field-label">Company Name *</label>
                <input
                  id="modal-reg-name"
                  type="text"
                  className="field text-xs py-2.5"
                  placeholder="e.g. Peak Electrical Contractors Ltd."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-reg-type" className="field-label">Affiliation Category *</label>
                  <select
                    id="modal-reg-type"
                    className="field text-xs py-2.5"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as SurveyType)}
                  >
                    <option value="Contractor">Contractor (Courier, Logistics, etc.)</option>
                    <option value="Supplier">Supplier (Material, Assets, etc.)</option>
                    <option value="Subcontractor">Subcontractor (On-site Labor, MEP, etc.)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-reg-aff" className="field-label">Specialization Scope</label>
                  <input
                    id="modal-reg-aff"
                    type="text"
                    className="field text-xs py-2.5"
                    placeholder="e.g. Structural Steel / MEP Services"
                    value={newAffiliation}
                    onChange={(e) => setNewAffiliation(e.target.value)}
                  />
                </div>
              </div>

              {/* Informational Policy */}
              <div className="bg-blue-50/50 dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Registered partners instantly become eligible to receive audits and ratings across our active employee survey channels.
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  onClick={() => setIsRegisterOpen(false)}
                  className="secondary-button py-2 px-4 text-xs"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0063a9] hover:bg-[#00528c] text-white flex items-center justify-center gap-1.5 py-2 px-5 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Register Company</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Passcode Modal */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-500">
              <ShieldCheck size={24} className="shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Security Verification</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              You are attempting to remove <strong className="text-slate-800 dark:text-slate-200">"{companyToDelete.name}"</strong> from the registry list. This is a critical security action. Please input the administrative passcode to authorize this transaction.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 mt-3 font-mono">
              Hint: Enter <strong>mgenesis2026</strong> to authorize the removal.
            </div>

            <div className="mt-4">
              <label htmlFor="auth-passcode" className="field-label">Administrative Passcode</label>
              <input
                id="auth-passcode"
                type="password"
                className="field text-sm mt-1"
                placeholder="••••••••"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                autoFocus
              />
              {passcodeError && (
                <p className="text-[11px] text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{passcodeError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={() => setCompanyToDelete(null)}
                className="secondary-button"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer"
                type="button"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
