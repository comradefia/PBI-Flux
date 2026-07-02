import React, { useEffect, useState } from "react";
import { Clock, RefreshCw, Radio, Sparkles, Database, Wifi } from "lucide-react";

interface ReportHeaderProps {
  name: string;
  isLive: boolean;
  onToggleLive: (live: boolean) => void;
  refreshInterval: number; // in seconds
  onChangeInterval: (seconds: number) => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  isCustomUpload: boolean;
}

export default function ReportHeader({
  name,
  isLive,
  onToggleLive,
  refreshInterval,
  onChangeInterval,
  onManualRefresh,
  isRefreshing,
  isCustomUpload,
}: ReportHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-col space-y-4">
        {/* Title & Status Pin */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 max-w-[70%]">
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug">
              {name}
            </h2>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {isCustomUpload ? (
                <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
                  <Sparkles className="h-2.5 w-2.5 mr-1 animate-pulse" />
                  Gemini Synced
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 shrink-0">
                  <Database className="h-2.5 w-2.5 mr-1" />
                  Fleet Database
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">Local Time: {timeStr}</span>
            </div>
          </div>

          {/* Real-Time Pulse Indicator */}
          <button
            onClick={() => onToggleLive(!isLive)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border ${
              isLive
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${isLive ? "animate-pulse text-emerald-500" : ""}`} />
            <span>{isLive ? "LIVE SYNC" : "OFFLINE"}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100"></div>

        {/* Refresh Engine Controls */}
        <div className="flex items-center justify-between flex-wrap gap-y-2 pt-0.5">
          <div className="flex items-center space-x-2">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500">Live Rate:</span>
            <div className="inline-flex rounded-xl bg-slate-50 p-0.5 border border-slate-200">
              {[3, 5, 10].map((sec) => (
                <button
                  key={sec}
                  disabled={!isLive}
                  onClick={() => onChangeInterval(sec)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    !isLive
                      ? "text-slate-300 pointer-events-none"
                      : refreshInterval === sec
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 px-3.5 py-2 rounded-xl bg-white transition-all shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            <span>Force Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}
