import { useState } from "react";
import { ProjectRecord, FilterState } from "./types";
import { getBaseFilteredProjects, getFilteredData } from "./utils/dataProcessing";
import UploadScreen from "./components/UploadScreen";
import FilterBar from "./components/FilterBar";
import KpiCards from "./components/KpiCards";
import Row1Charts from "./components/Row1Charts";
import Row2Charts from "./components/Row2Charts";
import Row3Charts from "./components/Row3Charts";
import Row4Chart from "./components/Row4Chart";
import { HardDrive, RotateCcw } from "lucide-react";

export default function App() {
  const [rawData, setRawData] = useState<ProjectRecord[] | null>(null);

  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    year: "All",
    period: "All",
    quarter: "All",
    projectType: "All",
    uatRescheduledOnly: false,
  });

  const handleDataLoaded = (data: ProjectRecord[]) => {
    const normalized = data.map((d: any) => ({
      ...d,
      Year: d["Year"] != null ? d["Year"] : "Unscheduled",
      Period: d["Period"] != null ? d["Period"] : "Unscheduled"
    }));
    setRawData(normalized);
    // Reset filters on upload/select of new dataset
    setFilters({
      year: "All",
      period: "All",
      quarter: "All",
      projectType: "All",
      uatRescheduledOnly: false,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      year: "All",
      period: "All",
      quarter: "All",
      projectType: "All",
      uatRescheduledOnly: false,
    });
  };

  const handleClearSession = () => {
    setRawData(null);
  };

  if (!rawData) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10 bg-[#f0f4f8]">
        <UploadScreen onDataLoaded={handleDataLoaded} />
      </div>
    );
  }

  // Step 1 & 2: Process Base List (excl. 'Internal IT' always & Secondary Owner Div guard)
  const baseProjects = getBaseFilteredProjects(rawData);

  // Step 3, 4, 5, 6: Apply additive segments filters
  const filteredProjects = getFilteredData(baseProjects, filters);

  const isEmpty = filteredProjects.length === 0;

  return (
    <div className="min-h-screen bg-[#f0f4f8] py-8 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-300">
      {/* HEADER SECTION (Strictly centered, Poppins 800) */}
      <header className="flex flex-col items-center mb-6 text-center animate-fadeUp">
        <div className="bg-[#eff6ff] text-[#2563eb] px-4 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest mb-3 uppercase border border-blue-100">
          WISESA PROJECT MANAGEMENT
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">
          WISESA <span className="text-[#2563eb]">Project</span> DASHBOARD
        </h1>
        <p className="text-[#64748b] text-sm font-medium mt-1.5">
          Strategic Performance & SLA Monitoring
        </p>
        <div className="w-[60px] h-1.5 bg-gradient-to-r from-[#2563eb] to-[#0891b2] mt-4 rounded-full mx-auto"></div>
      </header>

      {/* RE-UPLOAD DATASET FLOATING BADGE */}
      <div className="flex justify-end mb-4 animate-fadeUp">
        <button
          type="button"
          onClick={handleClearSession}
          className="text-xs font-bold text-slate-500 hover:text-[#2563eb] hover:bg-[#eff6ff] bg-white border border-[#e2e8f0] px-4 py-2 rounded-xl shadow-sm transition-all active:scale-[0.98] outline-none cursor-pointer"
        >
          Change Source Dataset JSON
        </button>
      </div>

      {/* FILTER BAR (ALWAYS VISIBLE AT THE TOP) */}
      <FilterBar
        baseProjects={baseProjects}
        filteredProjects={filteredProjects}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
      />

      {/* CONDITIONAL CONTENT (Charts vs Empty State) */}
      {!isEmpty ? (
        <div className="space-y-6">
          {/* SECTION 1: KPI CARDS */}
          <KpiCards
            filteredProjects={filteredProjects}
            allProjectsCount={baseProjects.length}
          />

          {/* SECTION 2: ON QUEUE COMPARISON */}
          <Row1Charts filteredProjects={filteredProjects} />

          {/* SECTION 4: PROJECT CATEGORY BREAKDOWN */}
          <Row4Chart filteredProjects={filteredProjects} />

          {/* SECTION 3: SLA & LATE DETAIL (TABBED PANEL) */}
          <Row3Charts filteredProjects={filteredProjects} />

          {/* SECTION 5: DIVISION OVERVIEW */}
          <Row2Charts filteredProjects={filteredProjects} />
        </div>
      ) : (
        /* GORGEOUS EMPTY STATE FOR ZERO MATCHES */
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-12 text-center max-w-xl mx-auto my-12 animate-fadeUp">
          <div className="p-4 rounded-full bg-slate-50 border border-slate-100 text-slate-400 inline-flex mb-6">
            <HardDrive className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-extrabold text-[#1e293b] mb-2">
            No projects match your filters
          </h3>
          <p className="text-sm text-[#475569] font-medium leading-relaxed max-w-sm mx-auto mb-6">
            Try adjusting or resetting the filter criteria to match the project tracking records.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-md cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Filter Settings
          </button>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-bold uppercase border-t border-slate-200/60 pt-6">
        <div className="flex items-center gap-3">
          <span>Internal Use Only</span>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <span>Data Refreshed: Feb 26, 2025</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#2563eb]">Wisesa Group</span>
          <span>&copy; 2025 v2.35.2</span>
        </div>
      </footer>
    </div>
  );
}
