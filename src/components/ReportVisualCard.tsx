import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Server,
  MapPin,
  CheckCircle,
  Clock,
  Gauge as GaugeIcon,
} from "lucide-react";

interface VisualProps {
  id: string;
  title: string;
  type: string;
  data: any[];
  slicerFilter?: { column: string; value: string };
}

// Color palettes for sleek modern presentation - Bento theme optimized
const COLORS = [
  "#2563EB", // Blue-600
  "#10B981", // Emerald-500
  "#F59E0B", // Amber-500
  "#6366F1", // Indigo-500
  "#06B6D4", // Cyan-500
  "#EC4899", // Pink-500
];

const GAUGE_COLORS = ["#2563EB", "#E2E8F0"];

export default function ReportVisualCard({ id, title, type, data, slicerFilter }: VisualProps) {
  // Apply Slicer filters client-side to simulate fully interactive slicing
  const getFilteredData = () => {
    if (!data || data.length === 0) return [];
    if (!slicerFilter || slicerFilter.value.startsWith("All")) return data;

    const { column, value } = slicerFilter;

    return data.filter((row) => {
      // Look for keys matching slicer column or category
      return Object.entries(row).some(([key, val]) => {
        if (typeof val === "string") {
          return val.toLowerCase() === value.toLowerCase();
        }
        return false;
      });
    });
  };

  const filteredData = getFilteredData();

  // Custom Card/KPI rendering
  const renderCard = () => {
    if (!data || data.length === 0) return null;
    const val = data[0]?.value ?? "N/A";
    const displayValue = typeof val === "number" ? val.toLocaleString() : val;

    // Check if there is simulated growth or sub-label based on title
    const isRevenue = title.toLowerCase().includes("sales") || title.toLowerCase().includes("revenue");
    const isMargin = title.toLowerCase().includes("margin") || title.toLowerCase().includes("score");

    return (
      <div className="flex flex-col justify-center h-full min-h-24 py-2 px-1">
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {isRevenue && typeof val === "number" ? `$${displayValue}` : displayValue}
            {isMargin && typeof val === "number" && "%"}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 mt-2">
          <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            <TrendingUp className="h-3 w-3 mr-0.5" />
            Live Refreshing
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Updated just now</span>
        </div>
      </div>
    );
  };

  // Custom Gauge/Meter rendering
  const renderGauge = () => {
    if (!data || data.length === 0) return null;
    const value = data[0]?.value || 75;
    const gaugeData = [
      { name: "Progress", value: value },
      { name: "Remaining", value: Math.max(0, 100 - value) },
    ];

    return (
      <div className="flex flex-col items-center justify-center h-48 relative">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill="#2563EB" />
              <Cell fill="#E2E8F0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-6 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800">{value}%</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Capacity</span>
        </div>
      </div>
    );
  };

  // Bar Chart (Horizontal)
  const renderBarChart = () => {
    if (filteredData.length === 0) return <NoDataPlaceholder />;
    const keys = Object.keys(filteredData[0]);
    const categoryKey = keys.find((k) => k !== "id") || "Category";
    const valueKey = keys.find((k) => k !== categoryKey && k !== "id") || "Value";

    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={filteredData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis dataKey={categoryKey} type="category" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} width={80} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E293B", color: "#FFF", borderRadius: "12px", border: "none" }}
            labelStyle={{ fontWeight: "bold" }}
          />
          <Bar dataKey={valueKey} radius={[0, 6, 6, 0]}>
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Column Chart (Vertical)
  const renderColumnChart = () => {
    if (filteredData.length === 0) return <NoDataPlaceholder />;
    const keys = Object.keys(filteredData[0]);
    const categoryKey = keys.find((k) => k !== "id") || "Category";
    const valueKey = keys.find((k) => k !== categoryKey && k !== "id") || "Value";

    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={filteredData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey={categoryKey} stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E293B", color: "#FFF", borderRadius: "12px", border: "none" }}
          />
          <Bar dataKey={valueKey} radius={[6, 6, 0, 0]}>
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Line Chart
  const renderLineChart = () => {
    if (filteredData.length === 0) return <NoDataPlaceholder />;
    const keys = Object.keys(filteredData[0]);
    const categoryKey = "Time";
    const valueKeys = keys.filter((k) => k !== categoryKey && k !== "id");

    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={filteredData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey={categoryKey} stroke="#94A3B8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E293B", color: "#FFF", borderRadius: "12px", border: "none" }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
          {valueKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Area Chart
  const renderAreaChart = () => {
    if (filteredData.length === 0) return <NoDataPlaceholder />;
    const keys = Object.keys(filteredData[0]);
    const categoryKey = "Time";
    const valueKeys = keys.filter((k) => k !== categoryKey && k !== "id");

    return (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={filteredData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
          <defs>
            {valueKeys.map((key, index) => (
              <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey={categoryKey} stroke="#94A3B8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E293B", color: "#FFF", borderRadius: "12px", border: "none" }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
          {valueKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // Pie/Donut Chart
  const renderPieChart = () => {
    if (filteredData.length === 0) return <NoDataPlaceholder />;
    const keys = Object.keys(filteredData[0]);
    const nameKey = keys.find((k) => k === "name" || k === "channel" || typeof filteredData[0][k] === "string") || "name";
    const valueKey = keys.find((k) => k === "value" || k === "Revenue" || typeof filteredData[0][k] === "number") || "value";

    return (
      <div className="flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={type === "donutChart" ? 45 : 0}
              outerRadius={65}
              paddingAngle={3}
              dataKey={valueKey}
              nameKey={nameKey}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1E293B", color: "#FFF", borderRadius: "12px", border: "none" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 px-2">
          {filteredData.map((entry: any, index: number) => (
            <div key={entry[nameKey]} className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              <span className="text-[10px] text-slate-500 font-semibold max-w-24 truncate">{entry[nameKey]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Table Data View
  const renderTable = () => {
    if (filteredData.length === 0) return <NoDataPlaceholder />;
    const columns = Object.keys(filteredData[0]).filter((k) => k !== "id");

    return (
      <div className="w-full overflow-x-auto border border-slate-100 rounded-xl max-h-56">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col) => (
                <th key={col} className="p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
            {filteredData.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50">
                {columns.map((col) => {
                  const val = row[col];
                  const valStr = String(val);

                  // Highlight statuses beautifully with badges
                  const isHealthy = valStr === "Healthy" || valStr.startsWith("+");
                  const isWarning = valStr === "Warning" || valStr.startsWith("-");

                  return (
                    <td key={col} className="p-2 whitespace-nowrap">
                      {isHealthy ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700">
                          {valStr}
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700">
                          {valStr}
                        </span>
                      ) : typeof val === "number" ? (
                        val > 1000 ? `$${val.toLocaleString()}` : val
                      ) : (
                        valStr
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Map representation
  const renderMap = () => {
    return (
      <div className="relative w-full h-44 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
        {/* Simple visual background resembling a mobile map */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Mock pin markers */}
          <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
            <div className="h-4 w-4 bg-amber-500 rounded-full flex items-center justify-center animate-ping absolute opacity-75"></div>
            <MapPin className="h-5 w-5 text-amber-500 relative z-10 drop-shadow-sm" />
            <span className="text-[8px] font-bold bg-white px-1 rounded shadow-sm border border-slate-100 mt-0.5">New York</span>
          </div>

          <div className="absolute top-1/3 left-2/3 flex flex-col items-center">
            <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center animate-ping absolute opacity-75"></div>
            <MapPin className="h-5 w-5 text-blue-500 relative z-10 drop-shadow-sm" />
            <span className="text-[8px] font-bold bg-white px-1 rounded shadow-sm border border-slate-100 mt-0.5">London</span>
          </div>

          <div className="absolute bottom-1/4 left-1/2 flex flex-col items-center">
            <div className="h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center animate-ping absolute opacity-75"></div>
            <MapPin className="h-5 w-5 text-emerald-500 relative z-10 drop-shadow-sm" />
            <span className="text-[8px] font-bold bg-white px-1 rounded shadow-sm border border-slate-100 mt-0.5">Sydney</span>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs border border-slate-100 px-2 py-1 rounded text-[8px] font-bold text-slate-500">
          Geospatial Map Canvas
        </div>
      </div>
    );
  };

  // Router for chart types
  const renderChart = () => {
    switch (type) {
      case "card":
        return renderCard();
      case "gauge":
        return renderGauge();
      case "barChart":
        return renderBarChart();
      case "columnChart":
        return renderColumnChart();
      case "pieChart":
      case "donutChart":
        return renderPieChart();
      case "lineChart":
        return renderLineChart();
      case "areaChart":
        return renderAreaChart();
      case "table":
        return renderTable();
      case "map":
        return renderMap();
      default:
        return <div className="text-xs text-slate-400 py-6">Unsupported visual layout ({type})</div>;
    }
  };

  return (
    <div id={`visual-${id}`} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h4 className="text-xs font-bold text-slate-700 truncate max-w-[85%]">{title}</h4>
        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">
          {type === "pieChart" || type === "donutChart" ? "share" : type}
        </span>
      </div>
      <div className="w-full flex-grow">{renderChart()}</div>
    </div>
  );
}

function NoDataPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertTriangle className="h-6 w-6 text-slate-300 mb-1" />
      <span className="text-[10px] text-slate-400 font-semibold">No data matching active filters</span>
    </div>
  );
}
