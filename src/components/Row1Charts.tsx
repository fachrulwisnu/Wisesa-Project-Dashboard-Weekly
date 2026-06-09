import { useState, useMemo } from "react";
import { ProjectRecord } from "../types";
import { getSortedPeriods } from "../utils/dataProcessing";
import PlotlyPlot from "./PlotlyPlot";
import { Layers, Activity, Table } from "lucide-react";

interface Row1ChartsProps {
  filteredProjects: ProjectRecord[];
}

const STATUS_LIST = [
  "On Queue",
  "Dev On Queue",
  "UAT On Queue",
  "Live On Queue",
  "Dev On Progress",
  "FSD On Progress",
  "SIT On Progress",
  "UAT On Progress",
  "Change Request On Progress",
  "Hold By Owner",
  "Hold By Client/Vendor",
  "Hold By IT",
  "Live",
  "Canceled",
  "Live On Monitoring",
  "FPS"
];

const STATUS_TO_GROUP: { [key: string]: "Queue" | "In Progress" | "Hold" | "Completed" | "Canceled" } = {
  "On Queue": "Queue",
  "Dev On Queue": "Queue",
  "UAT On Queue": "Queue",
  "Live On Queue": "Queue",
  "Dev On Progress": "In Progress",
  "FSD On Progress": "In Progress",
  "SIT On Progress": "In Progress",
  "UAT On Progress": "In Progress",
  "Change Request On Progress": "In Progress",
  "Hold By Owner": "Hold",
  "Hold By Client/Vendor": "Hold",
  "Hold By IT": "Hold",
  "Live": "Completed",
  "Canceled": "Canceled",
  "Live On Monitoring": "Completed",
  "FPS": "Queue"
};

const STATUS_TO_COLOR: { [key: string]: string } = {
  "FPS": "#b45309",                      // amber-700
  "Dev On Queue": "#d97706",             // amber-600
  "UAT On Queue": "#fbbf24",             // amber-400
  "On Queue": "#fcd34d",                 // amber-300
  "Live On Queue": "#fef08a",            // amber-200
  
  "Dev On Progress": "#1d4ed8",          // blue-700
  "FSD On Progress": "#2563eb",          // blue-600
  "SIT On Progress": "#3b82f6",          // blue-500
  "UAT On Progress": "#60a5fa",          // blue-400
  "Change Request On Progress": "#93c5fd", // blue-300
  
  "Hold By Owner": "#6d28d9",            // violet-700
  "Hold By Client/Vendor": "#7c3aed",    // violet-600
  "Hold By IT": "#8b5cf6",                // violet-500
  
  "Live": "#059669",                     // emerald-600
  "Live On Monitoring": "#10b981",       // emerald-500
  
  "Canceled": "#e11d48"                  // rose-600
};

const normalizeStatusStr = (s: string | null | undefined): string => {
  if (!s) return "";
  const trimmed = String(s).trim();
  const matched = STATUS_LIST.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  return matched || trimmed;
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function Row1Charts({ filteredProjects }: Row1ChartsProps) {
  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  
  // State for Chart 2B line filter toggle
  const [activeGroups, setActiveGroups] = useState<string[]>([
    "Queue",
    "In Progress",
    "Hold",
    "Completed",
    "Canceled"
  ]);

  const toggleGroup = (grp: string) => {
    if (activeGroups.includes(grp)) {
      setActiveGroups(activeGroups.filter((g) => g !== grp));
    } else {
      setActiveGroups([...activeGroups, grp]);
    }
  };

  // --- CHART 2A CALCULATIONS ---
  const yearsAndUnscheduled = [2021, 2022, 2023, 2024, 2025, 2026, "Unscheduled"];

  const totalCountsByYearAndUnscheduled = useMemo(() => {
    return yearsAndUnscheduled.map((yr) => {
      return filteredProjects.filter((p) => p["Year"] === yr).length;
    });
  }, [filteredProjects]);

  const annotations2A = useMemo(() => {
    return yearsAndUnscheduled.map((yr, idx) => {
      const count = totalCountsByYearAndUnscheduled[idx];
      return {
        x: String(yr),
        y: count,
        text: count > 0 ? `<b>${count}</b>` : "",
        xanchor: "center" as const,
        yanchor: "bottom" as const,
        showarrow: false,
        font: { size: 11, color: "#1e293b", family: "Poppins" }
      };
    });
  }, [totalCountsByYearAndUnscheduled]);

  const trace2A = useMemo(() => {
    return STATUS_LIST.map((status) => {
      const baseColor = STATUS_TO_COLOR[status] || "#64748b";
      
      const yValues = yearsAndUnscheduled.map((yr) => {
        return filteredProjects.filter((p) => {
          return p["Year"] === yr && normalizeStatusStr(p["Last Status"]) === status;
        }).length;
      });

      const markerColors = yearsAndUnscheduled.map((yr) => {
        if (yr === "Unscheduled") {
          return "rgba(226, 232, 240, 0.75)"; // Gray fill
        }
        return baseColor;
      });

      const lineColors = yearsAndUnscheduled.map(() => baseColor);
      const borderWidths = yearsAndUnscheduled.map((yr) => {
        if (yr === "Unscheduled") {
          return 2.5; // thick border-like left stripe signal
        }
        return 0;
      });

      const hoverText = yearsAndUnscheduled.map((yr, idx) => {
        const count = yValues[idx];
        const total = totalCountsByYearAndUnscheduled[idx];
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
        if (yr === "Unscheduled") {
          return `<b>Unscheduled</b><br>Status: ${status}<br>Count: ${count}<extra></extra>`;
        }
        return `<b>Year ${yr}</b><br>Status: ${status}<br>Count: ${count}<br>Share: ${pct}%<extra></extra>`;
      });

      return {
        x: yearsAndUnscheduled.map(String),
        y: yValues,
        type: "bar" as const,
        name: status,
        marker: { 
          color: markerColors,
          line: {
            color: lineColors,
            width: borderWidths
          }
        },
        text: hoverText,
        hovertemplate: "%{text}"
      };
    });
  }, [filteredProjects, totalCountsByYearAndUnscheduled]);

  const layout2A = {
    title: {
      text: "Total Projects by Status per Year",
      font: { size: 14, weight: "bold", color: "#1e293b" },
      x: 0,
    },
    barmode: "stack" as const,
    xaxis: {
      gridcolor: "#e2e8f0",
      tickfont: { size: 11, color: "#475569" },
      zeroline: false,
    },
    yaxis: {
      gridcolor: "#e2e8f0",
      tickfont: { size: 11, color: "#475569" },
      zeroline: false,
    },
    legend: {
      orientation: "h" as const,
      x: 0.5,
      xanchor: "center" as const,
      y: -0.2,
      font: { size: 9, color: "#64748b" },
    },
    margin: { t: 50, r: 15, b: 90, l: 35 },
    height: 420,
    annotations: annotations2A,
    shapes: [
      {
        type: "line" as const,
        x0: 5.5,
        x1: 5.5,
        y0: 0,
        y1: 1,
        yref: "paper" as const,
        line: {
          color: "#94a3b8",
          width: 1.5,
          dash: "dash" as const
        }
      }
    ],
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Poppins, sans-serif" }
  };

  // --- CHART 2B CALCULATIONS ---
  const uniquePeriods = useMemo(() => {
    return getSortedPeriods(filteredProjects.map((p) => p["Period"]));
  }, [filteredProjects]);

  const trace2B = useMemo(() => {
    return STATUS_LIST.filter((status) => {
      const group = STATUS_TO_GROUP[status];
      return activeGroups.includes(group);
    }).map((status) => {
      const color = STATUS_TO_COLOR[status] || "#64748b";
      
      const totalStatusCount = filteredProjects.filter(
        (p) => normalizeStatusStr(p["Last Status"]) === status
      ).length;
      
      const isLowVolume = totalStatusCount < 3;

      const yValues = uniquePeriods.map((period) => {
        return filteredProjects.filter((p) => {
          return p["Period"] === period && normalizeStatusStr(p["Last Status"]) === status;
        }).length;
      });

      return {
        x: uniquePeriods,
        y: yValues,
        type: "scatter" as const,
        mode: "lines+markers" as const,
        name: status,
        line: {
          color,
          width: 2.2,
          dash: isLowVolume ? "dash" : undefined,
        },
        marker: { size: 5, color },
        hovertemplate: `<b>%{x}</b><br>Status: ${status}<br>Count: %{y}<extra></extra>`
      };
    });
  }, [filteredProjects, uniquePeriods, activeGroups]);

  const annotations2B = useMemo(() => {
    const activeUnscheduledCount = filteredProjects.filter(p => p["Year"] === "Unscheduled").length;
    if (activeUnscheduledCount === 0) return [];
    return [
      {
        xref: "paper" as const,
        yref: "paper" as const,
        x: 0.98,
        y: 0.98,
        text: `<i>${activeUnscheduledCount} projects unscheduled — not shown on timeline</i>`,
        showarrow: false,
        font: { size: 10.5, color: "#64748b", family: "Poppins" },
        bgcolor: "rgba(241, 245, 249, 0.75)",
        bordercolor: "#cbd5e1",
        borderwidth: 1,
        borderpad: 5
      }
    ];
  }, [filteredProjects]);

  const layout2B = {
    title: {
      text: "Monthly Status Trend",
      font: { size: 14, weight: "bold", color: "#1e293b" },
      x: 0,
    },
    xaxis: {
      gridcolor: "#e2e8f0",
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
      x: 0.5,
      xanchor: "center" as const,
      y: -0.22,
      font: { size: 9, color: "#64748b" },
    },
    margin: { t: 40, r: 15, b: 90, l: 35 },
    height: 400,
    annotations: annotations2B,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Poppins, sans-serif" }
  };

  // --- CHART 2D: QUEUE DEPTH OVER TIME ---
  const { pipelineValues, completedValues } = useMemo(() => {
    let runningActiveSum = 0;
    let runningCompletedSum = 0;

    const pipeline = uniquePeriods.map((period) => {
      const activeThisMonth = filteredProjects.filter((p) => {
        if (p["Period"] !== period) return false;
        const group = STATUS_TO_GROUP[normalizeStatusStr(p["Last Status"])];
        return group === "Queue" || group === "In Progress" || group === "Hold";
      }).length;
      runningActiveSum += activeThisMonth;
      return runningActiveSum;
    });

    const completed = uniquePeriods.map((period) => {
      const completedThisMonth = filteredProjects.filter((p) => {
        if (p["Period"] !== period) return false;
        const group = STATUS_TO_GROUP[normalizeStatusStr(p["Last Status"])];
        return group === "Completed";
      }).length;
      runningCompletedSum += completedThisMonth;
      return runningCompletedSum;
    });

    return { pipelineValues: pipeline, completedValues: completed };
  }, [filteredProjects, uniquePeriods]);

  const trace2D = useMemo(() => {
    if (uniquePeriods.length === 0) return [];
    
    const hoverTextPipeline = uniquePeriods.map((period, idx) => {
      return `<b>${period}</b><br>Pipeline depth: ${pipelineValues[idx]} Projects<br>Completed: ${completedValues[idx]}<extra></extra>`;
    });

    const hoverTextCompleted = uniquePeriods.map((period, idx) => {
      return `<b>${period}</b><br>Completed: ${completedValues[idx]} Projects<br>Pipeline depth: ${pipelineValues[idx]}<extra></extra>`;
    });

    return [
      {
        x: uniquePeriods,
        y: pipelineValues,
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Pipeline Depth (Active)",
        line: { color: "#2563eb", width: 3 },
        fill: "tozeroy" as const,
        fillcolor: "rgba(8, 145, 178, 0.25)", // Transluscency Area
        text: hoverTextPipeline,
        hovertemplate: "%{text}"
      },
      {
        x: uniquePeriods,
        y: completedValues,
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Completed (Cumulative)",
        line: { color: "#059669", width: 2.5 },
        text: hoverTextCompleted,
        hovertemplate: "%{text}"
      }
    ];
  }, [uniquePeriods, pipelineValues, completedValues]);

  const layout2D = {
    title: {
      text: "Queue Depth & pipeline Volume Over Time",
      font: { size: 14, weight: "bold", color: "#1e293b" },
      x: 0,
    },
    xaxis: {
      gridcolor: "#e2e8f0",
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
      x: 0.5,
      xanchor: "center" as const,
      y: -0.25,
      font: { size: 9, color: "#64748b" },
    },
    margin: { t: 40, r: 15, b: 60, l: 35 },
    height: 320,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Poppins, sans-serif" }
  };

  // --- CHART 2C: Heat Map Table Calculations ---
  const tableColumns = [2021, 2022, 2023, 2024, 2025, 2026, "Unscheduled"];

  const { maxCellValue, tableBodyRows, tableHeaderTotals, grandTotal } = useMemo(() => {
    let maxVal = 1;
    
    // Calculates Row and Column metrics
    const rows = STATUS_LIST.map((status) => {
      const countsByYear: { [key: string]: number } = {};
      let rowSum = 0;
      
      tableColumns.forEach((yr) => {
        const count = filteredProjects.filter((p) => {
          return p["Year"] === yr && normalizeStatusStr(p["Last Status"]) === status;
        }).length;
        countsByYear[String(yr)] = count;
        rowSum += count;
        if (count > maxVal) {
          maxVal = count;
        }
      });
      
      return {
        status,
        countsByYear,
        total: rowSum
      };
    });

    // Calculates Column Totals
    const colTotals: { [key: string]: number } = {};
    let sumAll = 0;
    tableColumns.forEach((yr) => {
      const countForYear = filteredProjects.filter((p) => p["Year"] === yr).length;
      colTotals[String(yr)] = countForYear;
      sumAll += countForYear;
    });

    return {
      maxCellValue: maxVal,
      tableBodyRows: rows,
      tableHeaderTotals: colTotals,
      grandTotal: sumAll
    };
  }, [filteredProjects]);

  const getRowBorderClass = (status: string) => {
    const group = STATUS_TO_GROUP[status];
    if (status === "Live") return "border-l-[5px] border-l-emerald-500";
    if (status === "Canceled") return "border-l-[5px] border-l-rose-500";
    if (group === "Completed") return "border-l-[5px] border-l-emerald-500";
    if (group === "Queue") return "border-l-[5px] border-l-amber-500";
    if (group === "In Progress") return "border-l-[5px] border-l-blue-500";
    if (group === "Hold") return "border-l-[5px] border-l-violet-500";
    return "border-l-[5px] border-l-slate-300";
  };

  const getPillStyle = (groupName: string, active: boolean) => {
    if (!active) {
      return "bg-slate-50 border border-slate-200/80 text-slate-400 hover:bg-slate-100/60 cursor-pointer transition-all";
    }
    switch (groupName) {
      case "Queue":
        return "bg-amber-500 border border-amber-500 text-white shadow-sm hover:bg-amber-600 cursor-pointer transition-all";
      case "In Progress":
        return "bg-blue-600 border border-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all";
      case "Hold":
        return "bg-violet-600 border border-violet-600 text-white shadow-sm hover:bg-violet-700 cursor-pointer transition-all";
      case "Completed":
        return "bg-emerald-600 border border-emerald-600 text-white shadow-sm hover:bg-emerald-700 cursor-pointer transition-all";
      case "Canceled":
        return "bg-rose-600 border border-rose-600 text-white shadow-sm hover:bg-rose-700 cursor-pointer transition-all";
      default:
        return "bg-slate-700 text-white cursor-pointer";
    }
  };

  return (
    <div id="section-status-pipeline" className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mb-6 animate-fadeUp">
      
      {/* Title Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Project Status Pipeline — Year & Month Comparison
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Strategic comparison of backlogs and development queue pipelines
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start bg-slate-50/80 border border-slate-200/40 p-1.5 rounded-2xl">
          <Layers className="w-4 h-4 text-slate-400 ml-1" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mr-1">
            Status Matrix Controls
          </span>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 gap-8 mb-6">
        
        {/* CHART 2A: Total Projects by Status per Year */}
        <div className="w-full bg-slate-50/30 p-4 border border-slate-100 rounded-2xl">
          <PlotlyPlot data={trace2A} layout={layout2A} />
        </div>

        {/* CHART 2B: Monthly Status Trend with multi-select buttons */}
        <div className="w-full bg-slate-50/30 p-4 border border-slate-100 rounded-2xl">
          {/* Legend toggle controllers */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Monthly Status Trend Filters
              </span>
            </div>
            {/* Multi-select Pills */}
            <div className="flex flex-wrap gap-1.5">
              {["Queue", "In Progress", "Hold", "Completed", "Canceled"].map((g) => {
                const isActive = activeGroups.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGroup(g)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest outline-none transition-all ${getPillStyle(g, isActive)}`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
          {uniquePeriods.length > 0 ? (
            <PlotlyPlot data={trace2B} layout={layout2B} />
          ) : (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 uppercase tracking-widest">
              No historical trend period data
            </div>
          )}
        </div>

        {/* CHART 2D: Queue Depth Over Time (Area chart) */}
        <div className="w-full bg-slate-50/30 p-4 border border-slate-100 rounded-2xl">
          {uniquePeriods.length > 0 ? (
            <PlotlyPlot data={trace2D} layout={layout2D} />
          ) : (
            <div className="h-[250px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 uppercase tracking-widest">
              No queue depth period records
            </div>
          )}
        </div>

      </div>

      {/* CHART 2C: YEAR-OVER-YEAR COMPARISON HEATMAP TABLE */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Table className="w-4 h-4 text-[#2563eb]" />
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
            Year-over-Year Status Comparison Grid
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-widest text-[10px] sticky top-0 z-10">
                <th className="py-3 px-4 border-r border-slate-200">Last Status</th>
                {tableColumns.map((col) => (
                  <th
                    key={col}
                    className={`py-3 px-3 text-center border-r border-slate-200 font-extrabold ${
                      col === "Unscheduled" ? "bg-slate-200/90 text-slate-700" : ""
                    }`}
                  >
                    {col}
                  </th>
                ))}
                <th className="py-3 px-4 text-center font-extrabold bg-slate-100/70">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-[#1e293b]">
              {tableBodyRows.map((row) => (
                <tr
                  key={row.status}
                  className={`hover:bg-slate-50/40 transition-colors ${getRowBorderClass(row.status)}`}
                >
                  <td className="py-2.5 px-4 font-extrabold text-slate-800 border-r border-slate-200/60 max-w-[190px] truncate">
                    {row.status}
                  </td>
                  {tableColumns.map((col) => {
                    const count = row.countsByYear[String(col)] || 0;
                    const baseColor = col === "Unscheduled" ? "#64748b" : (STATUS_TO_COLOR[row.status] || "#64748b");
                    const alpha = count === 0 ? 0 : 0.08 + (count / maxCellValue) * 0.52;
                    const cellStyle = {
                      backgroundColor: hexToRgba(baseColor, alpha),
                    };

                    return (
                      <td
                        key={col}
                        style={cellStyle}
                        className={`py-2.5 px-3 text-center border-r border-slate-200/40 font-mono text-xs transition-all ${
                          count > 0 ? "text-slate-900 font-black" : "text-slate-300 font-normal"
                        } ${col === "Unscheduled" ? "bg-slate-50/40" : ""}`}
                      >
                        {count}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-4 text-center font-mono font-black border-l bg-slate-50/60 text-slate-900 text-xs shadow-sm">
                    {row.total}
                  </td>
                </tr>
              ))}
              
              {/* TOTAL ROW AT THE BOTTOM */}
              <tr className="bg-slate-100/90 font-black text-slate-800 border-t border-slate-300">
                <td className="py-3 px-4 font-black text-[11px] uppercase tracking-wider border-r border-slate-300/80">
                  Total
                </td>
                {tableColumns.map((col) => (
                  <td
                    key={col}
                    className={`py-3 px-3 text-center font-mono font-black text-[11px] border-r border-slate-300/60 ${
                      col === "Unscheduled" ? "bg-slate-200/50 text-slate-700 font-extrabold" : "text-slate-900"
                    }`}
                  >
                    {tableHeaderTotals[String(col)] || 0}
                  </td>
                ))}
                <td className="py-3 px-4 text-center font-mono font-black text-[11px] bg-slate-200/80 text-blue-700 shadow-inner">
                  {grandTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
