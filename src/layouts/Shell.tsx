import { LucideIcon, Menu, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface PageItem<T extends string> {
  key: T;
  label: string;
  icon: LucideIcon;
  hasDropdown?: boolean;
}

interface ShellProps<T extends string> {
  pages: PageItem<T>[];
  activePage: T;
  onPageChange: (page: T) => void;
  title: string;
  action: ReactNode;
  children: ReactNode;
  renderDropdown?: (key: T) => ReactNode;
}

export function Shell<T extends string>({ pages, activePage, onPageChange, title, action, children, renderDropdown }: ShellProps<T>) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedKey, setExpandedKey] = useState<T | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const activePageItem = pages.find((p) => p.key === activePage);
  const ActiveIcon = activePageItem?.icon ?? Menu;

  return (
    <div className="min-h-screen bg-cloud text-ink dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Header Layer */}
      <header className="sticky top-0 z-20 h-20 border-b border-[#00528c] bg-[#0063a9] flex items-center justify-between w-full lg:pr-8 shadow-sm">
        <div className="flex items-center h-full flex-1 min-w-0">
          {/* Brand Box / Logo Area - Fixed Width, unaffected by collapsing */}
          <div className="relative z-10 flex items-center justify-center h-full bg-[#0063a9] shrink-0 w-[220px] px-4">
            <button
               onClick={() => {
                 const homePage = pages.find((p) => p.key === ('dashboard' as any))?.key || pages[0]?.key;
                 if (homePage) onPageChange(homePage);
               }}
              className="group flex w-full h-full items-center justify-center outline-none transition cursor-pointer overflow-hidden"
              title="Go to Dashboard"
            >
              <img
                src="/microgenesis_logo.png"
                alt="Microgenesis Logo"
                className="transition duration-200 group-hover:opacity-90 shrink-0 h-10 max-w-full object-contain brightness-0 invert"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          {/* Title Area */}
          <div className="hidden sm:block pl-6">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-200 block leading-none">Microsoft Forms</span>
            <h1 className="text-base font-bold leading-tight flex items-center gap-1.5 mt-0.5 text-white">
              <span>Survey Analytics</span>
              <span className="text-blue-300/60">/</span>
              <span className="text-blue-100 font-medium">{title}</span>
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 px-4 shrink-0">
          {action}
        </div>
      </header>

      {/* Navigation for Smaller Screens: tap-to-open dropdown instead of a scrollable tab row */}
      <div className="sticky top-20 z-30 relative bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileNavOpen((value) => !value)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0063a9] transition dark:border-slate-800 dark:bg-slate-900 dark:text-blue-300"
        >
          <span className="flex items-center gap-2.5">
            <ActiveIcon size={16} className="shrink-0" />
            <span className="truncate">{activePageItem?.label ?? 'Menu'}</span>
          </span>
          <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMobileNavOpen && (
          <>
            {/* Backdrop: closes the menu on outside tap, sits above content but below the menu itself */}
            <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setIsMobileNavOpen(false)} />
            <div className="absolute left-4 right-4 top-full mt-1.5 z-40 max-h-[70vh] overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-lg dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
              {pages.map((page) => {
                const Icon = page.icon;
                const active = activePage === page.key;
                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => {
                      onPageChange(page.key);
                      setIsMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'bg-blue-50 text-[#0063a9] font-bold dark:bg-blue-950/40 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{page.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Main layout below header */}
      <div className="flex flex-1">
        {/* Sidebar - Below Header */}
        <div className={`relative sticky top-20 h-[calc(100vh-80px)] hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-16' : 'w-[220px]'}`}>
          {/* Toggle Sidebar Button on the right border, aligned lower down below menu items and fully visible */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-[180px] -right-3.5 z-30 h-7 w-7 rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md flex items-center justify-center text-slate-500 hover:text-[#0063a9] hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 transition-all cursor-pointer"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          <aside className={`h-full overflow-y-auto py-6 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            <nav className="space-y-1">
              {pages.map((page) => {
                const Icon = page.icon;
                const active = activePage === page.key;
                const isExpanded = expandedKey === page.key;

                return (
                  <div key={page.key}>
                    <div
                      className={`flex w-full items-stretch rounded-lg transition-all duration-200 ${
                        active ? 'bg-blue-50 text-[#0063a9] dark:bg-blue-950/60 dark:text-blue-200 shadow-sm font-bold' : ''
                      }`}
                    >
                      <button
                        className={`flex flex-1 min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                          active
                            ? 'text-[#0063a9] dark:text-blue-200 font-bold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                        } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
                        type="button"
                        onClick={() => onPageChange(page.key)}
                        title={isSidebarCollapsed ? page.label : undefined}
                      >
                        <Icon size={18} className="shrink-0" />
                        {!isSidebarCollapsed && <span className="truncate">{page.label}</span>}
                      </button>
                      {page.hasDropdown && !isSidebarCollapsed && (
                        <button
                          type="button"
                          onClick={() => setExpandedKey(isExpanded ? null : page.key)}
                          className={`flex shrink-0 items-center px-2.5 rounded-lg transition-colors ${
                            active
                              ? 'text-[#0063a9] dark:text-blue-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/40'
                              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                          }`}
                          title={isExpanded ? 'Collapse forms list' : 'Expand forms list'}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                    </div>

                    {page.hasDropdown && isExpanded && !isSidebarCollapsed && (
                      <div className="mt-1 pl-2.5 space-y-1.5 border-l border-slate-100 dark:border-slate-800">
                        {renderDropdown?.(page.key)}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>

        {/* Page Content - Below Header */}
        <main className="min-w-0 flex-1 transition-colors duration-300">
          <div className="px-4 py-6 lg:px-8">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-wider mb-1 text-slate-500 dark:text-slate-400">Centralized stakeholder satisfaction reporting</p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
