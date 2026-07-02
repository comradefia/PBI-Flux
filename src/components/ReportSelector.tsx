import React from "react";
import { BarChart3, Database, Sparkles, PlusCircle, Check, Loader2 } from "lucide-react";

interface ReportSummary {
  id: string;
  name: string;
  pageCount: number;
  createdAt: string;
  isCustomUpload: boolean;
}

interface ReportSelectorProps {
  reports: ReportSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpenUpload: () => void;
  loadingId?: string;
}

export default function ReportSelector({
  reports,
  selectedId,
  onSelect,
  onOpenUpload,
  loadingId,
}: ReportSelectorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Dashboard</h3>
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors border border-blue-100"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Upload PBIX</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
        {reports.map((report) => {
          const isSelected = report.id === selectedId;
          const isLoading = report.id === loadingId;

          return (
            <button
              key={report.id}
              onClick={() => !isLoading && onSelect(report.id)}
              disabled={isLoading}
              className={`flex items-center justify-between w-full text-left p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50/70 shadow-sm"
                  : "border-slate-100 hover:border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                    {report.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {report.pageCount} {report.pageCount === 1 ? "page" : "pages"}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    {report.isCustomUpload ? (
                      <span className="flex items-center text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded-full">
                        <Sparkles className="h-2 w-2 mr-0.5" />
                        AI Synced
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full">
                        <Database className="h-2 w-2 mr-0.5" />
                        IoT Stream
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                ) : isSelected ? (
                  <div className="bg-blue-600 text-white p-0.5 rounded-full">
                    <Check className="h-3 w-3" />
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
