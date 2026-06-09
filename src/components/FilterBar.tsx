import { Filter, RotateCcw, HelpCircle } from "lucide-react";
import { ProjectRecord, FilterState } from "../types";
import { getSortedPeriods, getGroupingCategory } from "../utils/dataProcessing";

interface FilterBarProps {
  baseProjects: ProjectRecord[];
  filteredProjects: ProjectRecord[];
  filters: FilterState;
  onFilterChange: (updater: (prev: FilterState) => FilterState) => void;
  onResetFilters: () => void;
}

export default function FilterBar({
  baseProjects,
  filteredProjects,
  filters,
  onFilterChange,
  onResetFilters,
}: FilterBarProps) {
  
  // Extract unique years from BASE projects
  const availableYears = Array.from(
    new Set(baseProjects.map((p) => p["Year"]))
  )
    .filter((yr) => yr !== "Unscheduled" && yr != null)
    .sort((a, b) => Number(b) - Number(a)); // descending

  const unscheduledCountTotal = baseProjects.filter(
    (p) => p["Year"] === "Unscheduled"
  ).length;

  // Extract periods (months) from BASE projects.
  // When a year is selected, show only months from that year.
  let filteredPeriodsSource = baseProjects;
  if (filters.year !== "All") {
    filteredPeriodsSource = baseProjects.filter(
      (p) => String(p["Year"]) === filters.year
    );
  }
  const uniquePeriods = Array.from(
    new Set(filteredPeriodsSource.map((p) => p["Period"]))
  ).filter((p) => p !== "Unscheduled" && p != null);

  const sortedPeriods = getSortedPeriods(uniquePeriods);

  // Compute UAT reschedule statistics for the current filtered scope
  const uatRescheduledList = filteredProjects.filter((p) => {
    const count = p["Reschedule UAT"];
    return count !== null && count !== undefined && Number(count) > 0;
  });

  const rescheduledCount = uatRescheduledList.length;
  const avgReschedule =
    rescheduledCount > 0
      ? (
          uatRescheduledList.reduce((sum, p) => sum + Number(p["Reschedule UAT"] || 0), 0) /
          rescheduledCount
        ).toFixed(1)
      : "0.0";

  // Build active chips list
  const activeChips: { key: keyof FilterState; label: string; defaultVal: any }[] = [];
  if (filters.year !== "All") {
    activeChips.push({ key: "year", label: `Year: ${filters.year}`, defaultVal: "All" });
  }
  if (filters.period !== "All") {
    activeChips.push({ key: "period", label: `Month: ${filters.period}`, defaultVal: "All" });
  }
  if (filters.quarter !== "All") {
    activeChips.push({ key: "quarter", label: `Quarter: ${filters.quarter}`, defaultVal: "All" });
  }
  if (filters.projectType !== "All") {
    activeChips.push({ key: "projectType", label: `Type: ${filters.projectType}`, defaultVal: "All" });
  }
  if (filters.uatRescheduledOnly) {
    activeChips.push({ key: "uatRescheduledOnly", label: "UAT Rescheduled Only", defaultVal: false });
  }

  const handleRemoveChip = (key: keyof FilterState, defaultVal: any) => {
    onFilterChange((prev) => ({
      ...prev,
      [key]: defaultVal,
    }));
  };

  return (
    <div id="filter-panel" className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mb-6 animate-fadeUp">
      
      {/* FILTER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* DROPDOWNS BLOCK (takes 3/4 columns on large views) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          {/* Year Dropdown */}
          <div>
            <label htmlFor="year-select" className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Budget Year
            </label>
            <select
              id="year-select"
              value={filters.year}
              onChange={(e) => {
                const val = e.target.value;
                onFilterChange((prev) => ({
                  ...prev,
                  year: val,
                  period: "All", // Reset month to prevent mismatch
                }));
              }}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer"
            >
              <option value="All">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  Year {yr}
                </option>
              ))}
              <option value="Unscheduled">Unscheduled</option>
            </select>
          </div>

          {/* Month Dropdown */}
          <div>
            <label htmlFor="month-select" className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Month Period
            </label>
            <select
              id="month-select"
              value={filters.period}
              onChange={(e) => {
                onFilterChange((prev) => ({ ...prev, period: e.target.value }));
              }}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer"
            >
              <option value="All">All Months</option>
              {sortedPeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Quarter Dropdown */}
          <div>
            <label htmlFor="quarter-select" className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Quarter
            </label>
            <select
              id="quarter-select"
              value={filters.quarter}
              onChange={(e) => {
                onFilterChange((prev) => ({ ...prev, quarter: e.target.value }));
              }}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer"
            >
              <option value="All">All Quarters</option>
              {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Project Type Dropdown */}
          <div>
            <label htmlFor="project-type-select" className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Project Type
            </label>
            <select
              id="project-type-select"
              value={filters.projectType}
              onChange={(e) => {
                onFilterChange((prev) => ({ ...prev, projectType: e.target.value }));
              }}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Enhance Kecil">Enhance Kecil</option>
              <option value="Project Utama">Project Utama</option>
              <option value="Approval Digital">Approval Digital</option>
            </select>
          </div>

        </div>

        {/* UAT RESCHEDULE TOGGLE COLUMN */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
          filters.uatRescheduledOnly
            ? "bg-[#fff1f2] border-[#fecdd3] text-[#e11d48]"
            : "bg-[#f8fafc] border-[#e2e8f0]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 block">
              UAT Rescheduled Only
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.uatRescheduledOnly}
                onChange={(e) => {
                  const val = e.target.checked;
                  onFilterChange((prev) => ({ ...prev, uatRescheduledOnly: val }));
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:width-4 after:transition-all peer-checked:bg-[#e11d48]"></div>
            </label>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5 mb-1">
            UAT Reschedule Status
          </p>

          {/* When ON: show a beautiful summary pill */}
          {filters.uatRescheduledOnly && (
            <div className="mt-2.5 bg-white border border-[#fecdd3] px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-[#e11d48] shadow-sm animate-fadeIn">
              {rescheduledCount} projects rescheduled · Avg: {avgReschedule}×
            </div>
          )}
        </div>

      </div>

      {/* FILTER METADATA, ACTIVE CHIPS AND CONTROLS (ROW BELOW FILTERS) */}
      <div className="mt-6 pt-4 border-t border-[#f1f5f9] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Dynamic / Summary Pills */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Count Pill */}
          <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] py-1.5 px-3 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-extrabold text-slate-700 font-mono">
              {filteredProjects.length} Projects
            </span>
          </div>

          {/* Persistent Unscheduled Pill */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            </span>
            <span className="text-xs font-extrabold text-slate-500 font-mono">
              ● {unscheduledCountTotal} projects unscheduled (no timeline)
            </span>
          </div>
        </div>

        {/* Active chips list */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {activeChips.length > 0 ? (
            <>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
                Active:
              </span>
              {activeChips.map((chip) => (
                <div
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] border border-blue-100 text-[#2563eb] animate-fadeIn"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(chip.key, chip.defaultVal)}
                    className="hover:bg-blue-100 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center transition-all font-bold shrink-0 cursor-pointer text-[10px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-400 italic">
              Showing full master scope.
            </span>
          )}
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#2563eb] bg-slate-100 hover:bg-[#eff6ff] border border-slate-200 hover:border-blue-200 px-4 py-1.5 rounded-xl transition-all active:scale-[0.98] outline-none shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>

      </div>

    </div>
  );
}
