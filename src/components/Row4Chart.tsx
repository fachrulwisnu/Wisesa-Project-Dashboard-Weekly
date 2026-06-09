import { ProjectRecord } from "../types";
import { getGroupingCategory } from "../utils/dataProcessing";
import PlotlyPlot from "./PlotlyPlot";

interface Row4ChartProps {
  filteredProjects: ProjectRecord[];
}

export default function Row4Chart({ filteredProjects }: Row4ChartProps) {
  const categories = ["Enhance Kecil", "Project Utama", "Approval Digital"] as const;
  const years = [2021, 2022, 2023, 2024, 2025, 2026];

  const categoryConfigs = {
    "Enhance Kecil": {
      color: "#0891b2", // Teal
      bgLight: "bg-[#ecfeff]",
      borderLight: "border-[#cffafe]",
    },
    "Project Utama": {
      color: "#2563eb", // Blue
      bgLight: "bg-[#eff6ff]",
      borderLight: "border-[#bfdbfe]",
    },
    "Approval Digital": {
      color: "#7c3aed", // Violet
      bgLight: "bg-[#f5f3ff]",
      borderLight: "border-[#ddd6fe]",
    },
  };

  const statusColors: { [key: string]: string } = {
    Live: "#059669",
    Canceled: "#e11d48",
    "On Progress": "#2563eb",
    "On Queue": "#d97706",
    Hold: "#7c3aed",
    Other: "#64748b",
  };

  const getSlaStats = (projects: ProjectRecord[], field: string) => {
    let achieved = 0;
    let notAchieved = 0;
    let without = 0;

    projects.forEach((p) => {
      const val = p[field as keyof ProjectRecord];
      if (val === "Achieved") achieved++;
      else if (val === "Not Achieved") notAchieved++;
      else without++;
    });

    const evaluated = achieved + notAchieved;
    const isGreen = evaluated > 0 && (achieved / evaluated) > 0.8;
    const isRose = evaluated > 0 && (notAchieved / evaluated) > 0.2;

    return { achieved, notAchieved, without, isGreen, isRose };
  };

  return (
    <div id="section-category-breakdown" className="mb-6">
      {/* Title Header */}
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-slate-800">
          Project Category Breakdown
        </h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Segregations of portfolio status distributions, SLA success lists, and trends
        </p>
      </div>

      {/* 3 columns grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((catName) => {
          const config = categoryConfigs[catName];
          const categoryProjects = filteredProjects.filter(
            (p) => getGroupingCategory(p["Type Project"]) === catName
          );

          // STATUS DONUT GROUPING
          const statusCount: { [key: string]: number } = {
            Live: 0,
            Canceled: 0,
            "On Progress": 0,
            "On Queue": 0,
            Hold: 0,
            Other: 0,
          };

          categoryProjects.forEach((p) => {
            const s = p["Last Status"] ? String(p["Last Status"]).trim() : "Other";
            if (s === "Live" || s === "Live On Monitoring") {
              statusCount["Live"]++;
            } else if (s === "Canceled") {
              statusCount["Canceled"]++;
            } else if (s === "On Progress") {
              statusCount["On Progress"]++;
            } else if (s.toLowerCase().includes("queue")) {
              statusCount["On Queue"]++;
            } else if (s === "Hold") {
              statusCount["Hold"]++;
            } else {
              statusCount["Other"]++;
            }
          });

          const activeDonutLabels = Object.keys(statusCount).filter((k) => statusCount[k] > 0);
          const activeDonutValues = activeDonutLabels.map((k) => statusCount[k]);
          const activeDonutColors = activeDonutLabels.map((k) => statusColors[k]);

          const donutData = [
            {
              values: activeDonutValues,
              labels: activeDonutLabels,
              type: "pie",
              hole: 0.58,
              marker: {
                colors: activeDonutColors,
                line: { color: "#ffffff", width: 1.5 },
              },
              textinfo: "none",
              hovertemplate: "<b>%{label}</b><br>Count: %{value}<br>Ratio: %{percent}<extra></extra>",
            },
          ];

          const donutLayout = {
            showlegend: true,
            legend: {
              orientation: "h" as const,
              x: 0,
              y: -0.15,
              font: { size: 9, color: "#64748b" },
            },
            margin: { t: 5, r: 5, b: 35, l: 5 },
            height: 180,
          };

          // SLA STATS
          const slaPhases = [
            { label: "FSD", field: "FSD SLA" },
            { label: "DEV", field: "DEV SLA" },
            { label: "SIT", field: "SIT SLA" },
            { label: "UAT", field: "UAT SLA" },
            { label: "Live", field: "Live SLA" },
          ];

          // SPARKLINE D — Year over Year Volume Sparkline
          const sparklineY = years.map((yr) => {
            return filteredProjects.filter(
              (p) => getGroupingCategory(p["Type Project"]) === catName && p["Year"] === yr
            ).length;
          });

          const sparklineData = [
            {
              x: years.map(String),
              y: sparklineY,
              type: "scatter" as const,
              mode: "lines+markers" as const,
              line: { color: config.color, width: 2.5 },
              marker: { size: 5, color: config.color },
              hovertemplate: `<b>Year %{x}</b><br>Count: %{y}<extra></extra>`,
            },
          ];

          const sparklineLayout = {
            xaxis: { visible: false, showgrid: false },
            yaxis: { visible: false, showgrid: false },
            margin: { t: 5, b: 5, l: 5, r: 5 },
            height: 60,
          };

          return (
            <div
              key={catName}
              className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-md transition-all duration-300"
            >
              {/* Top Row: Category Label and Count Badge (A) */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  {catName}
                </span>
                <span
                  style={{ color: config.color }}
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-wider ${config.bgLight} border ${config.borderLight}`}
                >
                  {categoryProjects.length} Projects
                </span>
              </div>

              {/* Status Donut (B) */}
              <div className="w-full mb-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status Allocation donut
                </div>
                {categoryProjects.length > 0 ? (
                  <PlotlyPlot data={donutData} layout={donutLayout} />
                ) : (
                  <div className="h-[180px] flex items-center justify-center border border-dashed border-slate-100 rounded-xl text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                    No active statistics
                  </div>
                )}
              </div>

              {/* SLA Summary Mini-Table (C) */}
              <div className="mb-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  SLA Compliance status
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-center text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-400 font-bold uppercase border-b border-slate-200">
                        <th className="py-2 px-1 text-left font-black pl-3">Phase</th>
                        <th className="py-2 px-1 text-[#059669]">Achieved</th>
                        <th className="py-2 px-1 text-[#e11d48]">Not Ach</th>
                        <th className="py-2 px-1 text-slate-400">Without</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {slaPhases.map((phase) => {
                        const stats = getSlaStats(categoryProjects, phase.field);
                        return (
                          <tr key={phase.label}>
                            <td className="py-1.5 px-1 text-left font-bold text-slate-700 pl-3">
                              {phase.label}
                            </td>
                            {/* Achieved col with dynamic high score highlight */}
                            <td
                              className={`py-1.5 px-1 font-mono font-bold ${
                                stats.isGreen
                                  ? "bg-emerald-50 text-[#059669] font-black border border-emerald-100"
                                  : ""
                              }`}
                            >
                              {stats.achieved}
                            </td>
                            {/* Not Achieved col with dynamic danger count highlight */}
                            <td
                              className={`py-1.5 px-1 font-mono font-bold ${
                                stats.isRose
                                  ? "bg-rose-50/80 text-[#e11d48] font-black border border-rose-100"
                                  : ""
                              }`}
                            >
                              {stats.notAchieved}
                            </td>
                            {/* Without column */}
                            <td className="py-1.5 px-1 font-mono text-slate-400 font-medium">
                              {stats.without}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Year over Year Volume Sparkline (D) */}
              <div className="mt-2 border-t border-slate-50 pt-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>Year-Over-Year Volume</span>
                  <span className="font-mono text-slate-500 font-bold">21 &rarr; 26</span>
                </div>
                <div className="w-full h-14 overflow-hidden rounded-lg bg-slate-50/50 p-1">
                  <PlotlyPlot data={sparklineData} layout={sparklineLayout} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
