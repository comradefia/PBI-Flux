import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileUp,
  BarChart3,
  Smartphone,
  Sparkles,
  RefreshCw,
  Radio,
  FileCheck,
  ChevronRight,
  Database,
  Menu,
  X,
  AlertTriangle,
  Flame,
  TrendingUp,
  Monitor,
  Heart,
} from "lucide-react";
import FileUploader from "./components/FileUploader";
import ReportSelector from "./components/ReportSelector";
import ReportSlicer from "./components/ReportSlicer";
import ReportVisualCard from "./components/ReportVisualCard";
import ReportHeader from "./components/ReportHeader";
import { ServerReportResponse, PowerBiReport } from "./types";

export default function App() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("iot_telemetry");
  const [report, setReport] = useState<PowerBiReport | null>(null);
  const [activePage, setActivePage] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(3); // 3 seconds default
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [slicerFilters, setSlicerFilters] = useState<Record<string, { column: string; value: string }>>({});
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true); // Desktop preview shell

  // Fetch report list
  const fetchReports = async (selectNewId?: string) => {
    try {
      const response = await fetch("/api/reports");
      const data = await response.json();
      setReports(data);
      if (selectNewId) {
        setSelectedId(selectNewId);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

  // Fetch detailed report
  const fetchReportDetails = async (id: string) => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/reports/${id}`);
      const data = (await response.json()) as ServerReportResponse;
      setReport(data);

      // Set active page to the first page if not set
      if (data.pages && data.pages.length > 0) {
        setActivePage(data.pages[0].name);
      }

      // Initialize slicer filters
      const initialFilters: Record<string, { column: string; value: string }> = {};
      Object.entries(data.slicers || {}).forEach(([vid, slicer]: any) => {
        initialFilters[vid] = { column: slicer.column, value: slicer.selectedValue || slicer.options[0] };
      });
      setSlicerFilters(initialFilters);
    } catch (error) {
      console.error("Failed to fetch report details:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger manual live refresh tick
  const triggerRefresh = async () => {
    if (!report) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/reports/${report.id}/refresh`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setReport(data.report);
        // Alert user dynamically
        setLiveAlert("⚡ Real-time Stream Synced");
        setTimeout(() => setLiveAlert(null), 1200);
      }
    } catch (error) {
      console.error("Failed to refresh report:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchReportDetails(selectedId);
    }
  }, [selectedId]);

  // Real-Time Refresh Loop Engine
  useEffect(() => {
    let timer: any = null;
    if (isLive && report) {
      timer = setInterval(() => {
        triggerRefresh();
      }, refreshInterval * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLive, report, refreshInterval]);

  const handleSlicerChange = (slicerId: string, value: string) => {
    setSlicerFilters((prev) => ({
      ...prev,
      [slicerId]: { ...prev[slicerId], value },
    }));
    // Flash status
    setLiveAlert(`Filtered by: ${value}`);
    setTimeout(() => setLiveAlert(null), 1000);
  };

  const handleUploadSuccess = (newReportId: string) => {
    setShowUploadModal(false);
    fetchReports(newReportId);
  };

  // Switch pages cleanly
  const currentPagedVisuals = () => {
    if (!report || !activePage) return [];
    const p = report.pages.find((page) => page.name === activePage);
    return p ? p.visuals : [];
  };

  const activePageDisplay = () => {
    if (!report || !activePage) return "";
    const p = report.pages.find((page) => page.name === activePage);
    return p ? p.displayName : "";
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Banner Header - Bento Grid Styled */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-xs">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-none flex items-center gap-1.5">
              PBI Flux <span className="text-blue-600 font-black">Mobile Hub</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">Mobile Porting Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Sync Active</span>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200"></div>

          {/* Desktop Preview Toggler */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => setIsMobileFrame(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                isMobileFrame ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile Simulator</span>
            </button>
            <button
              onClick={() => setIsMobileFrame(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                !isMobileFrame ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Full Dashboard</span>
            </button>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-colors md:hidden border border-slate-200"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-grow flex relative overflow-hidden">
        {/* Sidebar Panel - Desktop persistent, Mobile toggle-drawer */}
        <aside
          className={`absolute inset-y-0 left-0 w-72 bg-white border-r border-slate-200 p-5 z-40 transform transition-transform duration-300 md:relative md:transform-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between md:hidden">
              <span className="font-bold text-slate-800 text-sm">Main Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick overview of uploads */}
            <ReportSelector
              reports={reports}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setSidebarOpen(false);
              }}
              onOpenUpload={() => {
                setShowUploadModal(true);
                setSidebarOpen(false);
              }}
              loadingId={isRefreshing ? selectedId : undefined}
            />

            <div className="border-t border-slate-100 my-4"></div>

            {/* Bento Widget 1: Operational Sentry */}
            <div className="space-y-2.5 bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-xl pointer-events-none"></div>
              <span className="text-xs font-extrabold text-blue-400 flex items-center space-x-1.5 uppercase tracking-wider">
                <Flame className="h-4 w-4 text-blue-400 shrink-0 animate-pulse" />
                <span>Operational Sentry</span>
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                Slicers filter charts locally on touch, while the server coordinates background streaming ticks to push telemetry changes tick-by-tick.
              </p>
              <div className="pt-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-800">
                <span>Active Core</span>
                <span className="text-emerald-400 flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                  Live Stream Online
                </span>
              </div>
            </div>

            {/* Bento Widget 2: Connected Endpoints Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Connected Endpoints</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span className="text-xs text-slate-700 font-bold">Azure SQL</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span className="text-xs text-slate-700 font-bold">Data Lake Store</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span className="text-xs text-slate-700 font-bold">SharePoint Online</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full">SYNCED</span>
                </div>
              </div>
            </div>

            {/* Bento Widget 3: Data Health Monitor */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Uptime Score</div>
                <div className="text-xs font-bold text-slate-800">Healthy Data Refresh</div>
                <div className="text-[9px] text-slate-400 font-semibold">Automatic background cycles</div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-emerald-600 italic leading-none">100</span>
              </div>
            </div>

            <div className="flex-grow"></div>

            {/* Footer */}
            <div className="pt-2 text-center text-[10px] text-slate-400 font-semibold flex items-center justify-center space-x-1">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
              <span>for Mobile Operational Excellence</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for sidebar on mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-xs"
          ></div>
        )}

        {/* Primary View Canvas */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col items-center">
          {/* Floating Action Alert Toast */}
          <AnimatePresence>
            {liveAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1.5 backdrop-blur-md border border-slate-800"
              >
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                <span>{liveAlert}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conditional Layout: Wrapper Mockup for Desktop */}
          <div className={`w-full ${isMobileFrame ? "max-w-md bg-white border border-slate-200 rounded-[40px] shadow-2xl p-6 relative overflow-hidden" : "max-w-5xl"}`}>
            {isMobileFrame && (
              <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 flex items-center justify-center pointer-events-none rounded-t-[40px] z-20">
                <div className="w-24 h-4 bg-black rounded-b-xl absolute top-0"></div>
              </div>
            )}

            <div className={`space-y-4 ${isMobileFrame ? "mt-4 max-h-[82vh] overflow-y-auto pr-1 no-scrollbar pb-6" : ""}`}>
              {/* Report Loading Indicator / Report Canvas */}
              {report ? (
                <>
                  {/* Report Header Component */}
                  <ReportHeader
                    name={report.name}
                    isLive={isLive}
                    onToggleLive={setIsLive}
                    refreshInterval={refreshInterval}
                    onChangeInterval={setRefreshInterval}
                    onManualRefresh={triggerRefresh}
                    isRefreshing={isRefreshing}
                    isCustomUpload={report.isCustomUpload}
                  />

                  {/* Multi-Page Tab Controls */}
                  {report.pages && report.pages.length > 1 && (
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                      {report.pages.map((p) => {
                        const isCurrent = p.name === activePage;
                        return (
                          <button
                            key={p.name}
                            onClick={() => setActivePage(p.name)}
                            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                              isCurrent
                                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {p.displayName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Slicers / Filters Row */}
                  {Object.entries(report.slicers || {}).map(([vid, slicer]: any) => {
                    // Only show slicers belonging to the active page
                    const pageVisualIds = currentPagedVisuals().map((v) => v.id);
                    if (!pageVisualIds.includes(vid)) return null;

                    const SlicerComponent = ReportSlicer as any;
                    return (
                      <SlicerComponent
                        key={vid}
                        slicerId={vid}
                        title={slicer.column}
                        column={slicer.column}
                        options={slicer.options}
                        selectedValue={slicerFilters[vid]?.value || ""}
                        onChange={(val: string) => handleSlicerChange(vid, val)}
                      />
                    );
                  })}

                  {/* Bento Column Visual Widgets Grid */}
                  <div className={`grid gap-5 ${isMobileFrame ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                    {currentPagedVisuals()
                      .filter((visual) => visual.type !== "slicer") // Slicers rendered separately
                      .map((visual) => {
                        // Gather active slicer values to filter the data row
                        const pageSlicer = Object.entries(slicerFilters).find(([vid]) => {
                          const pVis = currentPagedVisuals().find((v) => v.id === vid);
                          return !!pVis;
                        });

                        const slicerFilter = pageSlicer
                          ? { column: (pageSlicer[1] as any).column, value: (pageSlicer[1] as any).value }
                          : undefined;

                        // Dynamic col-span for beautiful Bento arrangement in full-width mode
                        const colSpanClass = isMobileFrame
                          ? "col-span-1"
                          : visual.type === "card" || visual.type === "gauge"
                          ? "col-span-1"
                          : "col-span-1 md:col-span-2";

                        return (
                          <div key={visual.id} className={colSpanClass}>
                            <ReportVisualCard
                              id={visual.id}
                              title={visual.title}
                              type={visual.type}
                              data={report.datasets[visual.id] || []}
                              slicerFilter={slicerFilter}
                            />
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Compiling Operational Workspace</p>
                    <p className="text-xs text-slate-400">Syncing live server configurations...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Upload Modal Dialog */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-800 text-lg">Upload Prebuilt Report</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Upload any real Microsoft Power BI <span className="font-bold text-slate-600">.pbix</span> file.
                    Our engine will extract the zipped Layout configuration, identify pages, coordinates, and visual charts,
                    and trigger Gemini AI to auto-synthesize perfectly matching live operational datasets!
                  </p>
                </div>

                <FileUploader onUploadSuccess={handleUploadSuccess} />

                <div className="flex items-center space-x-2 text-[10px] text-blue-700 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/30">
                  <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-semibold">
                    The report layout will automatically reflow into a clean, modern, single-column scroll optimized for responsive mobile browsers.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
