import { useState } from "react";
import { ProjectRecord } from "../types";
import { parseLateDays, getGroupingCategory } from "../utils/dataProcessing";
import PlotlyPlot from "./PlotlyPlot";

interface Row3ChartsProps {
  filteredProjects: ProjectRecord[];
}

type TabType = "UAT" | "FSD" | "DEV" | "SIT" | "LIVE";

export default function Row3Charts({ filteredProjects }: Row3ChartsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("UAT");

  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  const categories = ["Enhance Kecil", "Project Utama", "Approval Digital"];

  const tabConfigs = {
    UAT: {
      label: "UAT Reschedule",
      field: "Reschedule UAT",
      baseColor: "#e11d48", // Rose
      title: "UAT Reschedules by Year",
    },
    FSD: {
      label: "FSD Late",
      field: "(FSD) Late Days",
      baseColor: "#7c3aed", // Violet
      title: "FSD Late Projects by Year",
      slaField: "FSD SLA",
    },
    DEV: {
      label: "DEV Late",
      field: "(Dev) Late Days",
      baseColor: "#2563eb", // Blue
      title: "DEV Late Projects by Year",
      slaField: "DEV SLA",
    },
    SIT: {
      label: "SIT Late",
      field: "(SIT) Late Days",
      baseColor: "#0891b2", // Teal
      title: "SIT Late Projects by Year",
      slaField: "SIT SLA",
    },
    LIVE: {
      label: "Live Late",
      field: "Live (Late Days)",
      baseColor: "#d97706", // Amber
      title: "Live Late Projects by Year",
      slaField: "Live SLA",
    },
  };

  // Helper to color/tint stacks based on tab's core branding hex
  const getStackColor = (tab: TabType, cat: string) => {
    const config = tabConfigs[tab];
    const hex = config.baseColor;
    if (cat === "Enhance Kecil") return hex;
    
    // Tints
    if (hex === "#e11d48") {
      return cat === "Project Utama" ? "#fb7185" : "#fecdd3";
    }
    if (hex === "#7c3aed") {
      return cat === "Project Utama" ? "#a78bfa" : "#ddd6fe";
    }
    if (hex === "#2563eb") {
      return cat === "Project Utama" ? "#60a5fa" : "#bfdbfe";
    }
    if (hex === "#0891b2") {
      return cat === "Project Utama" ? "#22d3ee" : "#cffafe";
    }
    if (hex === "#d97706") {
      return cat === "Project Utama" ? "#fbbf24" : "#fef3c7";
    }
    return hex;
  };

  const isProjectLateInPhase = (p: ProjectRecord, tab: TabType): boolean => {
    if (tab === "UAT") {
      const uatVal = p["Reschedule UAT"];
      return uatVal !== null && uatVal !== undefined && Number(uatVal) > 0;
    }
    const fieldName = tabConfigs[tab].field;
    const val = p[fieldName as keyof ProjectRecord];
    const parsed = parseLateDays(val as string | null | undefined);
    return parsed !== null && parsed > 0;
  };

  // --- PART A: Summary Chart Traces ---
  const traceA = categories.map((cat) => {
    return {
      x: years.map(String),
      y: years.map((yr) => {
        return filteredProjects.filter((p) => {
          const belongsToCat = getGroupingCategory(p["Type Project"]) === cat;
          const isYearMatch = p["Year"] === yr;
          return belongsToCat && isYearMatch && isProjectLateInPhase(p, activeTab);
        }).length;
      }),
      type: "bar" as const,
      name: cat,
      marker: { color: getStackColor(activeTab, cat) },
      hovertemplate: `<b>Year %{x}</b><br>${cat}: %{y} Project(s)<extra></extra>`,
    };
  });

  const layoutA = {
    title: {
      text: tabConfigs[activeTab].title,
      font: { size: 13, weight: "bold", color: "#1e293b" },
      x: 0,
    },
    barmode: "stack" as const,
    xaxis: {
      gridcolor: "#f1f5f9",
      tickfont: { size: 10, color: "#64748b" },
      zeroline: false,
    },
    yaxis: {
      gridcolor: "#e2e8f0",
      tickfont: { size: 10, color: "#64748b" },
      zeroline: false,
    },
    legend: {
      orientation: "h" as const,
      x: 0,
      y: -0.22,
      font: { size: 9, color: "#64748b" },
    },
    margin: { t: 40, r: 10, b: 65, l: 30 },
    height: 300,
  };

  // --- PART B: Detail Table Data Extraction ---
  interface ProcessedDetailRow {
    projectName: string;
    ownerDiv: string;
    typeProject: string;
    year: number | string;
    period: string;
    metricVal: number; // Late Days or Reschedule Count
    metricStr: string; // Sourced string for Late Days
    slaStatus: string;
    lastStatus: string;
  }

  const detailRows: ProcessedDetailRow[] = filteredProjects
    .map((p) => {
      const cat = tabConfigs[activeTab];
      if (activeTab === "UAT") {
        const resVal = p["Reschedule UAT"];
        return {
          projectName: p["Project Name"],
          ownerDiv: p["Owner Div"],
          typeProject: p["Type Project"],
          year: p["Year"],
          period: p["Period"],
          metricVal: resVal !== null ? Number(resVal) : 0,
          metricStr: resVal !== null ? `${resVal}×` : "0×",
          slaStatus: "N/A",
          lastStatus: p["Last Status"],
        };
      } else {
        const lateDaysStr = p[cat.field as keyof ProjectRecord] as string | null | undefined;
        const parsedVal = parseLateDays(lateDaysStr) ?? 0;
        const slaStatus = (p[cat.slaField as keyof ProjectRecord] as string) || "Without";
        return {
          projectName: p["Project Name"],
          ownerDiv: p["Owner Div"],
          typeProject: p["Type Project"],
          year: p["Year"],
          period: p["Period"],
          metricVal: parsedVal,
          metricStr: lateDaysStr || "0 (Tepat Waktu)",
          slaStatus: slaStatus,
          lastStatus: p["Last Status"],
        };
      }
    })
    .filter((row) => row.metricVal >= 0) // Keep valid
    .sort((a, b) => b.metricVal - a.metricVal); // Sort descending

  // Color helper for rows
  const getRowBgClass = (row: ProcessedDetailRow) => {
    if (activeTab === "UAT") {
      // Highlight reschedule cases
      if (row.metricVal > 2) return "bg-rose-50/50 hover:bg-rose-100/30 text-rose-900 border-l-4 border-l-[#e11d48]";
      if (row.metricVal > 0) return "bg-amber-50/50 hover:bg-amber-100/30 text-amber-900 border-l-4 border-l-[#d97706]";
      return "bg-emerald-50/20 hover:bg-emerald-100/10 text-slate-800 border-l-4 border-l-[#059669]";
    } else {
      if (row.metricVal > 14) return "bg-rose-50/50 hover:bg-rose-100/30 text-rose-900 border-l-4 border-l-[#e11d48]";
      if (row.metricVal >= 4) return "bg-amber-50/50 hover:bg-amber-100/30 text-amber-900 border-l-4 border-l-[#d97706]";
      return "bg-emerald-50/20 hover:bg-emerald-100/10 text-emerald-900 border-l-4 border-l-[#059669]";
    }
  };

  return (
    <div id="section-sla-tabs" className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mb-6 animate-fadeUp">
      {/* Tab Header & Title */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">
            SLA Performance & Late Project Detail
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Phase SLA evaluation matrices and late projection logs
          </p>
        </div>

        {/* Dynamic Buttons */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(Object.keys(tabConfigs) as TabType[]).map((tabKey) => {
            const config = tabConfigs[tabKey];
            const isSelected = activeTab === tabKey;
            
            // Map hover states border
            const activeStyle = isSelected
              ? {
                  backgroundColor: config.baseColor,
                  color: "#ffffff",
                }
              : {};

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                style={activeStyle}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider outline-none cursor-pointer ${
                  isSelected ? "shadow-sm" : "hover:bg-slate-200 text-slate-500"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Left Part A, Right Part B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* PART A: SUMMARY GRAPH */}
        <div className="w-full">
          <PlotlyPlot data={traceA} layout={layoutA} />
        </div>

        {/* PART B: DYNAMIC HTML DETAIL TABLE */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Phase Logs Breakdown ({detailRows.length} filtered)
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">
              Sorted Descending
            </span>
          </div>

          <div className="overflow-y-auto max-h-[300px] rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-light-200/50 text-slate-500 font-extrabold uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-3 font-extrabold text-[10px]">Project Name</th>
                  <th className="py-2.5 px-3 font-extrabold text-[10px]">Owner Div</th>
                  <th className="py-2.5 px-2 font-extrabold text-[10px] text-center">Year</th>
                  <th className="py-2.5 px-2 font-extrabold text-[10px] text-center">Period</th>
                  <th className="py-2.5 px-3 font-extrabold text-[10px]">
                    {activeTab === "UAT" ? "Reschedules" : "Late Info"}
                  </th>
                  {activeTab !== "UAT" && (
                    <th className="py-2.5 px-3 font-extrabold text-[10px] text-center">SLA Status</th>
                  )}
                  <th className="py-2.5 px-3 font-extrabold text-[10px]">Last Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {detailRows.length > 0 ? (
                  detailRows.map((row, idx) => (
                    <tr
                      key={`${row.projectName}-${idx}`}
                      className={`transition-colors border-l-4 ${getRowBgClass(row)}`}
                    >
                      <td className="py-2 px-3 font-bold max-w-[150px] truncate" title={row.projectName}>
                        {row.projectName}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{row.ownerDiv}</td>
                      <td className="py-2 px-2 text-center font-mono">{row.year}</td>
                      <td className="py-2 px-2 text-center font-mono">{row.period}</td>
                      <td className="py-2 px-3 font-mono font-bold">{row.metricStr}</td>
                      {activeTab !== "UAT" && (
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            row.slaStatus === "Achieved"
                              ? "bg-emerald-100 text-[#059669]"
                              : row.slaStatus === "Not Achieved"
                              ? "bg-rose-100 text-[#e11d48]"
                              : "bg-slate-100 text-[#64748b]"
                          }`}>
                            {row.slaStatus}
                          </span>
                        </td>
                      )}
                      <td className="py-2 px-3 text-slate-500 max-w-[110px] truncate" title={row.lastStatus}>
                        {row.lastStatus}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs font-bold text-slate-400 uppercase">
                      No matching records exist in this phase
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
