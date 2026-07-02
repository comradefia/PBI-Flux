import React, { useState, useRef } from "react";
import { Upload, FileCheck, Loader2, AlertCircle, Sparkles } from "lucide-react";
import JSZip from "jszip";

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
    setStep("Loading file...");

    try {
      setStep("Reading ZIP structure...");
      const zip = await JSZip.loadAsync(file);
      
      setStep("Locating Report Layout...");
      const layoutFile = zip.file("Report/Layout");
      if (!layoutFile) {
        throw new Error("Invalid Power BI file structure. Could not locate 'Report/Layout' file inside the zipped package.");
      }

      setStep("Extracting layout data...");
      const layoutBuffer = await layoutFile.async("uint8array");
      
      setStep("Decoding UTF-16 content...");
      const decoder = new TextDecoder("utf-16le");
      const layoutText = decoder.decode(layoutBuffer);
      
      setStep("Parsing layout JSON...");
      const layoutJson = JSON.parse(layoutText);

      if (!layoutJson.sections || !Array.isArray(layoutJson.sections)) {
        throw new Error("PBIX Layout file is missing sections.");
      }

      setStep("Mapping mobile visuals...");
      // Filter out inactive sections and map visuals
      const pages = layoutJson.sections
        .filter((sec: any) => sec.config || sec.visualContainers)
        .map((sec: any) => {
          const visuals = (sec.visualContainers || [])
            .filter((container: any) => {
              // Skip pure backgrounds, shapes, and buttons that aren't charts
              if (!container.config) return false;
              try {
                const cfg = JSON.parse(container.config);
                return !!cfg.singleVisual;
              } catch {
                return false;
              }
            })
            .map((container: any) => {
              let config: any = {};
              try {
                config = JSON.parse(container.config || "{}");
              } catch (e) {
                // ignore
              }

              const singleVisual = config.singleVisual || {};
              const visualType = singleVisual.visualType || "card";

              // Determine Title
              let title = "";
              try {
                const titleObj = singleVisual.objects?.title?.[0];
                if (titleObj?.properties?.text?.expr?.Literal?.value) {
                  title = titleObj.properties.text.expr.Literal.value;
                } else if (titleObj?.properties?.text?.expr?.Resource?.value) {
                  title = titleObj.properties.text.expr.Resource.value;
                } else {
                  title = `${visualType.replace("Chart", "")} Report`;
                }
              } catch {
                title = `${visualType.charAt(0).toUpperCase() + visualType.slice(1)}`;
              }

              // Map visualType to our supported list
              let mappedType: string = "card";
              if (["barChart", "clusteredBarChart", "stackedBarChart"].includes(visualType)) {
                mappedType = "barChart";
              } else if (["columnChart", "clusteredColumnChart", "stackedColumnChart", "comboChart"].includes(visualType)) {
                mappedType = "columnChart";
              } else if (["lineChart"].includes(visualType)) {
                mappedType = "lineChart";
              } else if (["areaChart", "stackedAreaChart"].includes(visualType)) {
                mappedType = "areaChart";
              } else if (["pieChart"].includes(visualType)) {
                mappedType = "pieChart";
              } else if (["donutChart"].includes(visualType)) {
                mappedType = "donutChart";
              } else if (["card", "multiRowCard"].includes(visualType)) {
                mappedType = "card";
              } else if (["table", "matrix"].includes(visualType)) {
                mappedType = "table";
              } else if (["gauge"].includes(visualType)) {
                mappedType = "gauge";
              } else if (["slicer"].includes(visualType)) {
                mappedType = "slicer";
              } else if (["map", "filledMap"].includes(visualType)) {
                mappedType = "map";
              }

              return {
                id: container.id?.toString() || Math.random().toString(),
                title: title,
                type: mappedType,
                x: container.x || 0,
                y: container.y || 0,
                width: container.width || 200,
                height: container.height || 150,
                queryFields: [],
              };
            });

          return {
            name: sec.name,
            displayName: sec.displayName || "Report Sheet",
            visuals: visuals,
          };
        })
        .filter((page: any) => page.visuals.length > 0);

      if (pages.length === 0) {
        throw new Error("The uploaded Power BI file contains no active visual containers.");
      }

      setStep("Synthesizing dynamic dataset via Gemini AI...");
      const reportName = file.name.replace(".pbix", "");

      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: reportName,
          pages: pages,
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to compile the mobile dashboard.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          } else {
            const text = await response.text();
            errorMsg = `Server error (${response.status}): ${text.substring(0, 100)}`;
          }
        } catch (e) {
          errorMsg = `Server error code ${response.status}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

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
