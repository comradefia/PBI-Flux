import React, { useState, useRef } from "react";
import { Upload, FileCheck, Loader2, AlertCircle, Sparkles } from "lucide-react";

interface FileUploaderProps {
  onUploadSuccess: (reportId: string) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".pbix")) {
      setError("Only prebuilt Power BI (.pbix) files are supported.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("Uploading file...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step-by-step progress simulation to delight the user
      setTimeout(() => setStep("Decompressing ZIP archive..."), 800);
      setTimeout(() => setStep("Parsing Power BI Report Layout..."), 1600);
      setTimeout(() => setStep("Synthesizing dynamic dataset via Gemini AI..."), 2600);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process the report file.");
      }

      setStep("Mobile Dashboard Compiled Successfully!");
      setTimeout(() => {
        setLoading(false);
        onUploadSuccess(data.reportId);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while processing.");
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50/50 shadow-xs"
            : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-slate-50"
        } ${loading ? "pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pbix"
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-sm">Processing Power BI Report</p>
              <p className="text-xs text-slate-500 font-medium animate-pulse">{step}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-sm">
                Tap to select or drag a <span className="text-blue-600 font-extrabold">.pbix</span> file
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Extracted layout will be converted and optimized for mobile browser dashboards
              </p>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-100">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>Real-Time Data Synthesis & Refreshing</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start space-x-2 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs border border-rose-100">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
