import { ProjectRecord, FilterState } from "../types";

export const parsePeriodToDate = (period: string): Date => {
  if (!period) return new Date(0);
  const parts = period.split("-");
  if (parts.length !== 2) return new Date();
  
  const monthStr = parts[0].toLowerCase().substring(0, 3);
  const yrStr = parts[1];
  
  const months: { [key: string]: number } = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  
  const month = months[monthStr] !== undefined ? months[monthStr] : 0;
  
  let year = parseInt(yrStr, 10);
  if (isNaN(year)) return new Date();
  
  if (year < 100) {
    year += 2000;
  }
  
  return new Date(year, month, 1);
};

export const getSortedPeriods = (periods: string[]): string[] => {
  return [...new Set(periods)].sort((a, b) => {
    return parsePeriodToDate(a).getTime() - parsePeriodToDate(b).getTime();
  });
};

// Data Rule #4: Parse Late Days from string
export const parseLateDays = (val: string | null | undefined): number | null => {
  if (val === null || val === undefined) return null;
  const trimmed = String(val).trim();
  const match = trimmed.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

// Data Rule #5: Categorize Project Category
export const getGroupingCategory = (typeProject: string): "Enhance Kecil" | "Project Utama" | "Approval Digital" | "Other" => {
  const tp = String(typeProject || "").trim();
  if (["Enhance Kecil", "Hold Enhance Kecil", "Antrian Enhance Kecil"].includes(tp)) {
    return "Enhance Kecil";
  }
  if (["Project Utama", "Hold Project Utama", "Antrian Project Utama"].includes(tp)) {
    return "Project Utama";
  }
  if (["Approval Digital"].includes(tp)) {
    return "Approval Digital";
  }
  return "Other";
};

// Data Rule #6: Check if On Queue
export const isOnQueueStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  return String(status).toLowerCase().includes("queue");
};

// Data Rule #1 & #2: Exclude Internal IT and INFORMATION TECHNOLOGY
export const getBaseFilteredProjects = (rawList: ProjectRecord[]): ProjectRecord[] => {
  if (!Array.isArray(rawList)) return [];

  return rawList.filter((item) => {
    // Rule 1: Exclude "Internal IT"
    const typeProj = item["Type Project"] ? String(item["Type Project"]).trim() : "";
    if (typeProj === "Internal IT") return false;

    // Rule 2: Exclude Owner Div === "INFORMATION TECHNOLOGY"
    const ownerDiv = item["Owner Div"] ? String(item["Owner Div"]).trim() : "";
    if (ownerDiv === "INFORMATION TECHNOLOGY") return false;

    return true;
  });
};

export const getFilteredData = (
  baseList: ProjectRecord[],
  filters: FilterState
): ProjectRecord[] => {
  return baseList.filter((item) => {
    // 1. Year filter
    if (filters.year !== "All" && String(item["Year"]) !== filters.year) {
      return false;
    }

    // 2. Month/Period filter
    if (filters.period !== "All" && item["Period"] !== filters.period) {
      return false;
    }

    // 3. Quarter filter
    if (filters.quarter !== "All" && item["Kuartal"] !== filters.quarter) {
      return false;
    }

    // 4. Project Type filter (group category)
    if (filters.projectType !== "All") {
      const cat = getGroupingCategory(item["Type Project"]);
      if (cat !== filters.projectType) {
        return false;
      }
    }

    // 5. UAT Reschedule filter
    if (filters.uatRescheduledOnly) {
      const resCount = item["Reschedule UAT"];
      const hasRescheduled = resCount !== null && resCount !== undefined && Number(resCount) > 0;
      if (!hasRescheduled) return false;
    }

    return true;
  });
};
