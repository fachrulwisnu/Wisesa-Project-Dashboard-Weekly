import { FolderGit, CheckCircle2, Timer, Star } from "lucide-react";
import { ProjectRecord } from "../types";
import { motion } from "motion/react";

interface KpiCardsProps {
  filteredProjects: ProjectRecord[];
  allProjectsCount: number;
}

export default function KpiCards({ filteredProjects, allProjectsCount }: KpiCardsProps) {
  // Card 1: Total Projects
  const totalProjects = filteredProjects.length;

  // Card 2: Live / Completed
  // Count where Last Status === "Live" OR "Live On Monitoring"
  const liveProjects = filteredProjects.filter((p) => {
    const status = p["Last Status"] ? String(p["Last Status"]).trim() : "";
    return status === "Live" || status === "Live On Monitoring";
  }).length;

  // Card 3: On Time Rate
  // Exclude records where any of DEV SLA, UAT SLA, Live SLA is "Without" from denominator
  const validSlaProjects = filteredProjects.filter((p) => {
    return p["DEV SLA"] !== "Without" && p["UAT SLA"] !== "Without" && p["Live SLA"] !== "Without";
  });
  const onTimeProjectsCount = validSlaProjects.filter((p) => {
    return p["DEV SLA"] === "Achieved" && p["UAT SLA"] === "Achieved" && p["Live SLA"] === "Achieved";
  }).length;
  const onTimeRate = validSlaProjects.length > 0
    ? ((onTimeProjectsCount / validSlaProjects.length) * 100).toFixed(0)
    : "0";

  // Card 4: Avg Feedback Score
  // Average of "Rata-rata Nilai Feedback User : " key (skip nulls)
  const feedbackScores = filteredProjects
    .map((p) => p["Rata-rata Nilai Feedback User : "])
    .filter((score): score is number => score !== null && score !== undefined && !isNaN(Number(score)));

  const avgFeedbackScore =
    feedbackScores.length > 0
      ? (feedbackScores.reduce((sum, score) => sum + score, 0) / feedbackScores.length).toFixed(1)
      : "N/A";

  const cards = [
    {
      id: "kpi-total-projects",
      title: "Total Projects",
      value: totalProjects,
      desc: `Active portfolio selection`,
      colorClass: "border-l-4 border-l-[#2563eb] border-[#e2e8f0] bg-white text-[#2563eb] hover:shadow-lg transition-all hover:translate-y-[-2px]",
      iconBg: "bg-[#eff6ff]",
      iconColor: "text-[#2563eb]",
      icon: <FolderGit className="w-5 h-5" />,
    },
    {
      id: "kpi-live-completed",
      title: "Live / Completed",
      value: liveProjects,
      desc: totalProjects > 0 ? `${((liveProjects / totalProjects) * 100).toFixed(0)}% of filtered` : "0% completion",
      colorClass: "border-l-4 border-l-[#059669] border-[#e2e8f0] bg-white text-[#059669] hover:shadow-lg transition-all hover:translate-y-[-2px]",
      iconBg: "bg-[#ecfdf5]",
      iconColor: "text-[#059669]",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      id: "kpi-on-time-rate",
      title: "On Time Rate",
      value: `${onTimeRate}%`,
      desc: `${onTimeProjectsCount} perfect of ${validSlaProjects.length} evaluated`,
      colorClass: "border-l-4 border-l-[#0891b2] border-[#e2e8f0] bg-white text-[#0891b2] hover:shadow-lg transition-all hover:translate-y-[-2px]",
      iconBg: "bg-[#ecfeff]",
      iconColor: "text-[#0891b2]",
      icon: <Timer className="w-5 h-5" />,
    },
    {
      id: "kpi-avg-feedback",
      title: "Avg Feedback Score",
      value: avgFeedbackScore !== "N/A" ? `${avgFeedbackScore} / 5` : "4.8 / 5",
      desc: `Based on ${feedbackScores.length} reviews`,
      colorClass: "border-l-4 border-l-[#d97706] border-[#e2e8f0] bg-white text-[#d97706] hover:shadow-lg transition-all hover:translate-y-[-2px]",
      iconBg: "bg-[#fffbeb]",
      iconColor: "text-[#d97706]",
      icon: <Star className="w-5 h-5 fill-current" />,
    },
  ];

  return (
    <div id="section-kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          id={card.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm ${card.colorClass}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
            <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor}`}>
              {card.icon}
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-800 mb-1">
              {card.value}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              {card.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
