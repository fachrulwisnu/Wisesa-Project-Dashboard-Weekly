import { ProjectRecord } from "../types";
import PlotlyPlot from "./PlotlyPlot";

interface Row2ChartsProps {
  filteredProjects: ProjectRecord[];
}

export default function Row2Charts({ filteredProjects }: Row2ChartsProps) {
  const totalCount = filteredProjects.length;

  // --- Left: Projects by Division (horizontal bar) ---
  const divCounts: { [key: string]: number } = {};
  filteredProjects.forEach((p) => {
    const div = p["Owner Div"] ? String(p["Owner Div"]).trim() : "Unknown";
    divCounts[div] = (divCounts[div] || 0) + 1;
  });

  // Sort descending by count
  const sortedDivsDesc = Object.entries(divCounts).sort((a, b) => b[1] - a[1]);
  // Reverse for Plotly horizontal bar display (so top items are at the top)
  const sortedDivsReversed = [...sortedDivsDesc].reverse();
  const divNames = sortedDivsReversed.map((e) => e[0]);
  const divValues = sortedDivsReversed.map((e) => e[1]);

  // Blue -> Teal gradient color palette
  const blueTealPalette = [
    "#0891b2", // Teal
    "#0e7490",
    "#115e59",
    "#1d4ed8",
    "#2563eb", // Blue
  ];

  const divColors = divValues.map((_, i) => {
    const pct = divValues.length > 1 ? i / (divValues.length - 1) : 1;
    const colorIdx = Math.min(
      Math.floor(pct * (blueTealPalette.length - 1)),
      blueTealPalette.length - 1
    );
    return blueTealPalette[colorIdx];
  });

  const divisionData = [
    {
      x: divValues,
      y: divNames,
      type: "bar",
      orientation: "h",
      marker: {
        color: divColors,
      },
      text: divValues.map(String),
      textposition: "inside",
      hovertemplate: divNames.map((name, i) => {
        const val = divValues[i];
        const pct = totalCount > 0 ? ((val / totalCount) * 100).toFixed(1) : "0.0";
        return `<b>${name}</b><br>Projects: ${val}<br>Share: ${pct}%<extra></extra>`;
      }),
    },
  ];

  const divisionLayout = {
    title: {
      text: "Portfolio Count by Division",
      font: { size: 13, weight: "bold", color: "#1e293b" },
      x: 0,
    },
    xaxis: {
      gridcolor: "#f1f5f9",
      tickfont: { size: 10, color: "#64748b" },
      zeroline: false,
    },
    yaxis: {
      tickfont: { size: 9, color: "#475569", weight: "bold" },
      gridlinecolor: "transparent",
    },
    margin: { t: 40, r: 15, b: 40, l: 150 },
    height: 310,
  };

  // --- Right: Project Status Distribution (donut, hole 0.58) ---
  const statusGroup: { [key: string]: number } = {};
  filteredProjects.forEach((p) => {
    const s = p["Last Status"] ? String(p["Last Status"]).trim() : "Other";
    statusGroup[s] = (statusGroup[s] || 0) + 1;
  });

  const statuses = Object.keys(statusGroup);
  const statusValues = Object.values(statusGroup);

  // Status mapping colors from data rules / design
  const statusColorsMap: { [key: string]: string } = {
    "Live": "#059669",             // Green
    "Live On Monitoring": "#0891b2", // Teal
    "Canceled": "#e11d48",         // Rose
    "On Progress": "#2563eb",      // Blue
    "On Queue": "#d97706",         // Amber
    "Hold": "#7c3aed",             // Violet
  };

  const donutColors = statuses.map((status) => {
    const s = status.trim();
    if (s.toLowerCase().includes("queue")) return statusColorsMap["On Queue"];
    if (s.toLowerCase().includes("monitoring")) return statusColorsMap["Live On Monitoring"];
    return statusColorsMap[s] || "#64748b"; // Default and other is gray
  });

  const donutData = [
    {
      values: statusValues,
      labels: statuses,
      type: "pie",
      hole: 0.58,
      marker: {
        colors: donutColors,
        line: { color: "#ffffff", width: 2 },
      },
      textinfo: "percent",
      textposition: "inside",
      hovertemplate: "<b>%{label}</b><br>Count: %{value}<br>Pct: %{percent}<extra></extra>",
    },
  ];

  const donutLayout = {
    title: {
      text: "Active Status Matrix",
      font: { size: 13, weight: "bold", color: "#1e293b" },
      x: 0,
    },
    showlegend: true,
    legend: {
      orientation: "h",
      x: 0,
      y: -0.2,
      font: { size: 9, color: "#64748b" },
    },
    margin: { t: 40, r: 10, b: 50, l: 10 },
    height: 310,
  };

  return (
    <div id="section-division-overview" className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mb-6 animate-fadeUp">
      
      {/* Title Header */}
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-slate-800">
          Division Overview & Status Distribution
        </h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Division allocation matrix and execution state tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Division bar graph */}
        <div className="w-full">
          <PlotlyPlot data={divisionData} layout={divisionLayout} />
        </div>

        {/* Status donut graph */}
        <div className="w-full">
          <PlotlyPlot data={donutData} layout={donutLayout} />
        </div>
      </div>

    </div>
  );
}
