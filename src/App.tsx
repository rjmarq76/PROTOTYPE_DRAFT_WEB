import { useMemo, useState } from 'react';
import { BarChart3, Bell, FileText, LayoutDashboard, Moon, Search, Sun, Table2, FilePlus, ClipboardCheck, ArrowLeft, LogOut, ShieldAlert, Users, Presentation } from 'lucide-react';
import { AccountMenu } from './components/AccountMenu';
import { FilterPanel } from './components/FilterPanel';
import { NotificationBell } from './components/NotificationBell';
import { Shell } from './layouts/Shell';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationLogsPage } from './pages/NotificationLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SurveyExplorerPage } from './pages/SurveyExplorerPage';
import { CreateSurveyPage } from './pages/CreateSurveyPage';
import { SurveyDetailsPage } from './pages/SurveyDetailsPage';
import { SurveyFillerPage } from './pages/SurveyFillerPage';
import { PartnerCompaniesPage } from './pages/PartnerCompaniesPage';
import { SurveyFormsPage } from './pages/SurveyFormsPage';
import { PresentPage } from './pages/PresentPage';
import { useSurveyData } from './hooks/useSurveyData';
import { applyFilters, initialFilters } from './utils/analytics';
import { FilterState, SurveyType, CustomForm } from './types/survey';

const DEMO_ACCOUNTS = [
  {
    email: 'admin@mgenesis.com',
    role: 'Admin',
    designation: 'Executive',
    department: 'Business Solutions Manager'
  },
  {
    email: 'rankfile@mgenesis.com',
    role: 'Employee',
    designation: 'Rank & File',
    department: 'Accounts Payable - Trade'
  },
  {
    email: 'supervisory@mgenesis.com',
    role: 'Employee',
    designation: 'Supervisory',
    department: 'Logistics'
  },
  {
    email: 'managerial@mgenesis.com',
    role: 'Employee',
    designation: 'Managerial',
    department: 'Procurement Group'
  },
  {
    email: 'director@mgenesis.com',
    role: 'Employee',
    designation: 'Director',
    department: 'TASS'
  },
  {
    email: 'executive@mgenesis.com',
    role: 'Employee',
    designation: 'Executive',
    department: 'Business Solutions Manager'
  }
];

function getUserProfile(email: string | null) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const matched = DEMO_ACCOUNTS.find((acc) => acc.email === normalized);
  if (matched) return matched;
  return {
    email: normalized,
    role: 'Employee',
    designation: 'Rank & File',
    department: 'Logistics'
  };
}

type PageKey = 'dashboard' | 'partner-companies' | 'survey-forms' | 'analytics' | 'present' | 'explorer' | 'reports' | 'notifications' | 'create-form' | 'view-form' | 'fill-form';

const adminPages = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'partner-companies' as const, label: 'Partner Companies', icon: Users },
  { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  { key: 'present' as const, label: 'Present', icon: Presentation },
  { key: 'explorer' as const, label: 'Survey Explorer', icon: Table2 },
  { key: 'reports' as const, label: 'Reports', icon: FileText },
  { key: 'notifications' as const, label: 'Notification Logs', icon: Bell },
  { key: 'survey-forms' as const, label: 'Survey Forms', icon: ClipboardCheck, hasDropdown: true },
];

const allSurveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];

export default function App() {
  const {
    responses,
    surveys,
    questions,
    companies,
    partnerCompanies,
    addPartnerCompany,
    removePartnerCompany,
    isLoading,
    error,
    notifications,
    unreadCount,
    markNotificationsRead,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    submitResponse,
    resetAllData,
    isFullDatasetActive,
    clearResponses,
    addSingleMockResponse,
    toggleFullDataset,
  } = useSurveyData();

  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [darkMode, setDarkMode] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const filteredResponses = useMemo(() => applyFilters(responses, filters), [responses, filters]);
  const activeSurveyTypes = filters.surveyType.length ? filters.surveyType : allSurveyTypes;

  const activeTitle = useMemo(() => {
    if (activePage === 'partner-companies') return 'Administrative Partner Registry';
    if (activePage === 'create-form') return editingSurveyId ? 'Edit Survey Form' : 'Create Survey Form';
    if (activePage === 'view-form') {
      const selected = surveys.find((s) => s.id === selectedSurveyId);
      return selected ? `Survey: ${selected.title}` : 'Survey Details';
    }
    if (activePage === 'fill-form') return 'Fill Out Stakeholder Survey';
    return adminPages.find((page) => page.key === activePage)?.label ?? 'Dashboard';
  }, [activePage, selectedSurveyId, surveys, editingSurveyId]);

  const profile = useMemo(() => getUserProfile(account), [account]);
  const isAdmin = profile?.role === 'Admin';

  const visiblePages = useMemo(() => {
    if (isAdmin) return adminPages;
    return adminPages.filter((page) => page.key !== 'notifications' && page.key !== 'reports' && page.key !== 'explorer' && page.key !== 'present');
  }, [isAdmin]);

  const handleLogin = (email: string) => {
    setAccount(email);
    const prof = getUserProfile(email);
    if (prof && prof.role === 'Admin') {
      setActivePage('dashboard');
    } else {
      setActivePage('survey-forms');
    }
  };

  // Auth Guard
  if (!account) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Handler for custom survey submission
  const handleSurveySubmit = (
    surveyId: string,
    company: string,
    department: string,
    respondentType: string,
    address: string | undefined,
    answers: any[]
  ) => {
    submitResponse(surveyId, company, department, respondentType, address, answers, account || undefined);
  };

  // ----------------------------------------------------
  // ADMIN EXPERIENCE (ALL ANALYTICS SECURED HERE)
  // ----------------------------------------------------
  const pageContent = {
    dashboard: (
      <DashboardPage
        responses={filteredResponses}
        allResponses={responses}
        partnerCompanies={partnerCompanies}
        isLoading={isLoading}
        error={error}
        surveyTypeFilter={filters.surveyType}
      />
    ),
    'partner-companies': (
      <PartnerCompaniesPage
        partnerCompanies={partnerCompanies}
        responses={responses}
        onAddCompany={addPartnerCompany}
        onRemoveCompany={removePartnerCompany}
        isAdmin={isAdmin}
      />
    ),
    'survey-forms': (
      <SurveyFormsPage
        surveys={surveys}
        responses={responses}
        partnerCompanies={partnerCompanies}
        userEmail={account || ''}
        onUpdateSurvey={updateSurvey}
        onSelectSurvey={(id) => {
          setSelectedSurveyId(id);
          setActivePage('view-form');
        }}
        onNavigateToCreate={() => setActivePage('create-form')}
        onFillForm={(id) => {
          setSelectedSurveyId(id);
          setActivePage('fill-form');
        }}
        isAdmin={isAdmin}
      />
    ),
    analytics: <AnalyticsPage responses={filteredResponses} activeSurveyTypes={activeSurveyTypes} filters={filters} setFilters={setFilters} />,
    present: <PresentPage responses={responses} partnerCompanies={partnerCompanies} />,
    explorer: <SurveyExplorerPage responses={filteredResponses} surveys={surveys} />,
    reports: <ReportsPage responses={filteredResponses} isAdmin={isAdmin} />,
    notifications: <NotificationLogsPage notifications={notifications} unreadCount={unreadCount} />,
    'create-form': (
      <CreateSurveyPage
        onBack={() => {
          setEditingSurveyId(null);
          setActivePage('dashboard');
        }}
        surveyToEdit={editingSurveyId ? surveys.find(s => s.id === editingSurveyId) : undefined}
        onSave={(surveyData) => {
          if (editingSurveyId) {
            updateSurvey(editingSurveyId, surveyData);
            setEditingSurveyId(null);
            setActivePage('view-form');
          } else {
            const newSurvey = createSurvey(surveyData);
            if (newSurvey) {
              setSelectedSurveyId(newSurvey.id);
              setActivePage('view-form');
            }
          }
        }}
      />
    ),
    'view-form': (() => {
      const targetSurvey = surveys.find((s) => s.id === selectedSurveyId);
      if (!targetSurvey) {
        return (
          <div className="panel p-8 text-center text-slate-500">
            <ShieldAlert size={36} className="mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">Survey not found or was deleted.</p>
            <button onClick={() => setActivePage('dashboard')} className="primary-button mt-4">Return to Dashboard</button>
          </div>
        );
      }
      return (
        <SurveyDetailsPage
          survey={targetSurvey}
          responses={responses}
          partnerCompanies={partnerCompanies}
          userEmail={account || ''}
          onBack={() => setActivePage('dashboard')}
          onFillForm={(id) => {
            setSelectedSurveyId(id);
            setActivePage('fill-form');
          }}
          onDelete={(id) => {
            deleteSurvey(id);
            setActivePage('dashboard');
          }}
          onEdit={(id) => {
            setEditingSurveyId(id);
            setActivePage('create-form');
          }}
          isAdmin={isAdmin}
        />
      );
    })(),
    'fill-form': (
      <SurveyFillerPage
        surveys={surveys}
        partnerCompanies={partnerCompanies}
        initialSurveyId={selectedSurveyId}
        userEmail={account || ''}
        responses={responses}
        onSubmitted={handleSurveySubmit}
        onCancel={() => setActivePage('view-form')}
      />
    ),
  }[activePage];

  // Content shown when the "Survey Forms" nav item's dropdown toggle is expanded:
  // the current forms, followed by "Add New" as the last option.
  const renderSidebarDropdown = (key: string) => {
    if (key !== 'survey-forms') return null;

    return (
      <>
        {surveys.map((survey) => {
          const isViewing = activePage === 'view-form' && selectedSurveyId === survey.id;
          return (
            <button
              key={survey.id}
              onClick={() => {
                setSelectedSurveyId(survey.id);
                setActivePage('view-form');
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition ${
                isViewing
                  ? 'bg-blue-50 text-[#0063a9] font-bold dark:bg-blue-950/40 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-white'
              }`}
              type="button"
              title={survey.title}
            >
              <span
                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                  isViewing ? 'bg-[#0063a9] dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
              <span className="truncate">{survey.title}</span>
            </button>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => setActivePage('create-form')}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition cursor-pointer"
            type="button"
            id="btn-sidebar-create"
          >
            <FilePlus size={14} />
            <span>＋ Add New</span>
          </button>
        )}
      </>
    );
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Shell
        pages={visiblePages}
        activePage={activePage as any}
        onPageChange={(page) => {
          setActivePage(page as any);
          if (page === 'notifications') markNotificationsRead();
        }}
        title={activeTitle}
        renderDropdown={renderSidebarDropdown}
        action={
          <div className="flex items-center divide-x divide-blue-400/25">
            {isAdmin && (
              <div className="pr-3">
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onOpen={markNotificationsRead}
                  onViewAll={() => setActivePage('notifications')}
                />
              </div>
            )}
            <div className={isAdmin ? 'px-3' : 'pr-3'}>
              <button
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition cursor-pointer ${
                  darkMode ? 'bg-white/10 text-white' : 'text-blue-100 hover:text-white'
                }`}
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                title="Toggle dark mode"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            <div className="pl-3">
              <AccountMenu
                email={account}
                designation={profile?.designation}
                department={profile?.department}
                role={profile?.role}
                onLogout={() => setAccount(null)}
              />
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">{pageContent}</div>
            
            {/* Show Filter Panel only on Admin-view pages that need filters */}
            {activePage !== 'notifications' && activePage !== 'analytics' && activePage !== 'create-form' && activePage !== 'view-form' && activePage !== 'fill-form' && activePage !== 'partner-companies' && activePage !== 'survey-forms' && activePage !== 'present' && activePage !== 'explorer' && (
              <aside className="xl:w-80">
                <FilterPanel
                  filters={filters}
                  questions={questions}
                  companies={companies}
                  onChange={setFilters}
                  onReset={() => setFilters(initialFilters)}
                  isDashboard={activePage === 'dashboard'}
                  isFullDatasetActive={isFullDatasetActive}
                  clearResponses={clearResponses}
                  addSingleMockResponse={addSingleMockResponse}
                  toggleFullDataset={toggleFullDataset}
                />
              </aside>
            )}
          </div>
          
          {activePage !== 'notifications' && activePage !== 'create-form' && activePage !== 'fill-form' && activePage !== 'present' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-[#0063a9] dark:text-blue-400 shrink-0" />
                <span>
                  Data Engine: Local Microsoft Forms creation model. Submissions immediately refresh visual analytics in real-time.
                </span>
              </div>
              <button
                onClick={resetAllData}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline transition shrink-0 cursor-pointer"
                title="Re-seed standard reports and database values"
              >
                Reset System Database
              </button>
            </div>
          )}
        </div>
      </Shell>
    </div>
  );
}
