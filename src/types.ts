export interface ProjectRecord {
  "Project Name": string;
  "Owner Div": string;
  "Type Project": string;
  "Last Status": string;
  "Year": number | string;
  "Period": string; // e.g. "Jan-25"
  "Kuartal": string; // e.g. "Q1" / "Q2" / "Q3" / "Q4"
  "Reschedule UAT": number | null;
  "(Dev) Late Days": string | null;
  "(FSD) Late Days": string | null;
  "(SIT) Late Days": string | null;
  "(UAT) Late Days": string | null;
  "Live (Late Days)": string | null;
  "DEV SLA": string;
  "FSD SLA": string;
  "SIT SLA": string;
  "UAT SLA": string;
  "Live SLA": string;
  "Rata-rata Nilai Feedback User : ": number | null; // Note trailing space
  "PIC Name": string;
  "Owner Name": string;
}

export interface FilterState {
  year: string; // "All" or a specific year
  period: string; // "All" or a specific period like "Jan-25"
  quarter: string; // "All" or "Q1"/"Q2"/"Q3"/"Q4"
  projectType: string; // "All" or "Enhance Kecil" / "Project Utama" / "Approval Digital"
  uatRescheduledOnly: boolean;
}
