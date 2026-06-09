import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileCode, AlertTriangle, Database } from "lucide-react";
import { ProjectRecord } from "../types";
import { demoProjects } from "../demoData";

interface UploadScreenProps {
  onDataLoaded: (data: ProjectRecord[]) => void;
}

export default function UploadScreen({ onDataLoaded }: UploadScreenProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processJsonText = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error("Invalid structure: The JSON must be an array of project records.");
      }
      
      if (parsed.length === 0) {
        throw new Error("The uploaded JSON array is empty.");
      }

      const sample = parsed[0];
      const requiredKeys = ["Project Name", "Owner Div", "Type Project", "Last Status"];
      const missingKeys = requiredKeys.filter(k => !(k in sample));

      if (missingKeys.length > 0) {
        throw new Error(`Data format warning: Missing required fields (e.g. ${missingKeys.join(", ")}). Please check your schema.`);
      }

      onDataLoaded(parsed as ProjectRecord[]);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to parse JSON. Please make sure the file is valid JSON.");
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
  };

  const readFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setError("Only JSON files are supported. Please upload a project management JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        processJsonText(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setError("An error occurred while reading the file.");
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    onDataLoaded(demoProjects);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-16">
      {/* Header section (strictly centered and styled with Poppins 800) */}
      <div className="flex flex-col items-center mb-8 text-center animate-fadeUp">
        <div className="bg-[#eff6ff] text-[#2563eb] px-4 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest mb-3 uppercase border border-blue-100">
          WISESA PROJECT MANAGEMENT
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1e293b]">
          WISESA <span className="text-[#2563eb]">Project</span> DASHBOARD
        </h1>
        <p className="text-[#64748b] text-sm font-medium mt-2 max-w-md">
          Strategic Performance & SLA Monitoring
        </p>
        <div className="w-[60px] h-1 bg-gradient-to-r from-[#2563eb] to-[#0891b2] mt-4 rounded-full mx-auto" />
      </div>

      {/* Main Upload Dropzone Card */}
      <div
        id="upload-dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative bg-white rounded-2xl border-2 border-dashed p-10 md:p-14 text-center cursor-pointer transition-all duration-300 animate-fadeUp ${
          isDragActive
            ? "border-[#2563eb] bg-[#eff6ff] shadow-lg scale-[1.02] ring-4 ring-[#2563eb]/10"
            : "border-[#e2e8f0] hover:border-[#2563eb] hover:bg-[#eff6ff] hover:shadow-md hover:translate-y-[-2px]"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full mb-6 bg-[#eff6ff] text-[#2563eb]">
            <Upload className="w-10 h-10 animate-bounce" />
          </div>

          <h3 className="text-xl font-extrabold text-slate-800 mb-2">
            Upload Project JSON
          </h3>
          <p className="text-sm text-[#475569] max-w-md mb-6 font-semibold">
            Drop your MASTER Summary JSON file here
          </p>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-md hover:shadow-lg focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <FileCode className="w-4 h-4" />
            Pick JSON Master File
          </button>
        </div>
      </div>

      {/* Error Feedback message */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm animate-shake">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Upload Failed</h4>
            <p className="text-sm mt-0.5 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Launch Area (Load Sample Data) */}
      <div className="mt-8 text-center bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm max-w-xl mx-auto animate-fadeUp">
        <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-widest mb-2">
          No dataset ready?
        </h4>
        <p className="text-xs text-[#64748b] mb-4 font-semibold max-w-sm mx-auto leading-relaxed">
          Load our preconfigured PMO dataset to preview all SLA metrics, horizontal breakdown bar charts, and UAT reschedule flows.
        </p>
        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg active:scale-95 transition-all shadow-sm focus:outline-none"
        >
          <Database className="w-4 h-4" />
          Load Demo Dataset
        </button>
      </div>
    </div>
  );
}
