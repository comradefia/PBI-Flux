import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import AdmZip from "adm-zip";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up file uploads using multer in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max limit for pbix files
});

// Lazy load Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// In-Memory Database for Reports
interface ReportData {
  id: string;
  name: string;
  pages: any[];
  datasets: Record<string, any[]>;
  slicers: Record<string, { column: string; options: string[]; selectedValue?: string }>;
  createdAt: string;
  isCustomUpload: boolean;
}

const reportsDb: Record<string, ReportData> = {};

// Helper: Generate Fallback Datasets when Gemini isn't available or fails
function generateFallbackDatasets(pages: any[]): {
  datasets: Record<string, any[]>;
  slicers: Record<string, { column: string; options: string[]; selectedValue?: string }>;
} {
  const datasets: Record<string, any[]> = {};
  const slicers: Record<string, { column: string; options: string[]; selectedValue?: string }> = {};

  const commonCategories = ["Electronics", "Fashion", "Furniture", "Groceries", "Toys"];
  const commonRegions = ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  pages.forEach((page) => {
    page.visuals.forEach((visual: any) => {
      const vid = visual.id;

      if (visual.type === "card") {
        const hasSalesKeyword = visual.title.toLowerCase().includes("sales") || visual.title.toLowerCase().includes("revenue");
        const hasRateKeyword = visual.title.toLowerCase().includes("rate") || visual.title.toLowerCase().includes("%") || visual.title.toLowerCase().includes("margin");
        if (hasRateKeyword) {
          datasets[vid] = [{ value: parseFloat((15 + Math.random() * 80).toFixed(2)) }];
        } else if (hasSalesKeyword) {
          datasets[vid] = [{ value: Math.floor(100000 + Math.random() * 900000) }];
        } else {
          datasets[vid] = [{ value: Math.floor(10 + Math.random() * 90) }];
        }
      } else if (visual.type === "gauge") {
        datasets[vid] = [{ value: Math.floor(40 + Math.random() * 55) }];
      } else if (visual.type === "pieChart" || visual.type === "donutChart") {
        datasets[vid] = commonCategories.map((cat) => ({
          name: cat,
          value: Math.floor(5000 + Math.random() * 45000),
        }));
      } else if (visual.type === "barChart" || visual.type === "columnChart") {
        const isRegionSpecific = visual.title.toLowerCase().includes("region") || visual.title.toLowerCase().includes("country");
        const categories = isRegionSpecific ? commonRegions : commonCategories;
        datasets[vid] = categories.map((cat) => ({
          Category: cat,
          Value: Math.floor(10000 + Math.random() * 90000),
        }));
      } else if (visual.type === "lineChart" || visual.type === "areaChart") {
        datasets[vid] = months.map((month) => ({
          Time: month,
          Revenue: Math.floor(20000 + Math.random() * 150000),
          Expenses: Math.floor(15000 + Math.random() * 100000),
        }));
      } else if (visual.type === "table") {
        datasets[vid] = Array.from({ length: 5 }).map((_, i) => ({
          Product: `Product ${String.fromCharCode(65 + i)}`,
          Revenue: Math.floor(50000 + Math.random() * 200000),
          Qty: Math.floor(100 + Math.random() * 1000),
          Rating: (3.5 + Math.random() * 1.5).toFixed(1),
        }));
      } else if (visual.type === "slicer") {
        const isRegion = visual.title.toLowerCase().includes("region");
        const options = isRegion ? ["All Regions", ...commonRegions] : ["All Products", ...commonCategories];
        slicers[vid] = {
          column: isRegion ? "Region" : "Category",
          options: options,
          selectedValue: options[0],
        };
        datasets[vid] = [];
      } else if (visual.type === "map") {
        datasets[vid] = [
          { city: "New York", lat: 40.7128, lng: -74.006, value: Math.floor(50000 + Math.random() * 100000) },
          { city: "London", lat: 51.5074, lng: -0.1278, value: Math.floor(40000 + Math.random() * 80000) },
          { city: "Tokyo", lat: 35.6762, lng: 139.6503, value: Math.floor(60000 + Math.random() * 120000) },
          { city: "Sydney", lat: -33.8688, lng: 151.2093, value: Math.floor(30000 + Math.random() * 60000) },
          { city: "Paris", lat: 48.8566, lng: 2.3522, value: Math.floor(35000 + Math.random() * 70000) },
        ];
      } else {
        datasets[vid] = [{ value: 100 }];
      }
    });
  });

  return { datasets, slicers };
}

// Seed Database with Beautiful Prebuilt Mobile-BI Templates
const seedReports = () => {
  // Report 1: IoT Fleet Telemetry Live
  const iotId = "iot_telemetry";
  const iotPages = [
    {
      name: "fleet_overview",
      displayName: "Fleet Status",
      visuals: [
        { id: "iot_v1", title: "Active Vehicles", type: "card", x: 0, y: 0, width: 2, height: 1, queryFields: ["Active"] },
        { id: "iot_v2", title: "Fleet Safety Score", type: "gauge", x: 2, y: 0, width: 2, height: 1, queryFields: ["Safety"] },
        { id: "iot_v3", title: "Real-Time Temperature Stream (°C)", type: "lineChart", x: 0, y: 1, width: 4, height: 2, queryFields: ["Time", "Temp"] },
        { id: "iot_v4", title: "Alerts by Truck Model", type: "barChart", x: 0, y: 3, width: 4, height: 2, queryFields: ["Model", "Alerts"] },
        { id: "iot_v5", title: "Region Filter", type: "slicer", x: 0, y: 5, width: 4, height: 1, queryFields: ["Region"] },
      ],
    },
  ];

  const iotTicks = Array.from({ length: 15 }).map((_, i) => {
    const d = new Date();
    d.setSeconds(d.getSeconds() - (15 - i) * 3);
    const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
    return {
      Time: timeStr,
      "Alpha Truck": Math.floor(75 + Math.random() * 12),
      "Beta Cargo": Math.floor(82 + Math.random() * 8),
      "Omega Carrier": Math.floor(68 + Math.random() * 15),
    };
  });

  reportsDb[iotId] = {
    id: iotId,
    name: "🚀 Live Fleet Operations (IoT)",
    pages: iotPages,
    datasets: {
      iot_v1: [{ value: 43 }],
      iot_v2: [{ value: 92.5 }],
      iot_v3: iotTicks,
      iot_v4: [
        { Model: "Freightliner Cascadia", Alerts: 4 },
        { Model: "Volvo VNL 860", Alerts: 7 },
        { Model: "Peterbilt 579", Alerts: 2 },
        { Model: "Kenworth T680", Alerts: 9 },
      ],
      iot_v5: [],
    },
    slicers: {
      iot_v5: {
        column: "Region",
        options: ["All Regions", "North America", "Western Europe", "Asia Pacific"],
        selectedValue: "All Regions",
      },
    },
    createdAt: new Date().toISOString(),
    isCustomUpload: false,
  };

  // Report 2: Global Retail Dashboard
  const retailId = "retail_global";
  const retailPages = [
    {
      name: "retail_overview",
      displayName: "Performance Overview",
      visuals: [
        { id: "rt_v1", title: "Total Cumulative Sales", type: "card", x: 0, y: 0, width: 2, height: 1, queryFields: ["Sales"] },
        { id: "rt_v2", title: "Profit Margin %", type: "card", x: 2, y: 0, width: 2, height: 1, queryFields: ["Margin"] },
        { id: "rt_v3", title: "Sales Revenue by Channel", type: "donutChart", x: 0, y: 1, width: 4, height: 2, queryFields: ["Channel", "Revenue"] },
        { id: "rt_v4", title: "Monthly Performance Trends", type: "areaChart", x: 0, y: 3, width: 4, height: 2, queryFields: ["Month", "Sales", "Target"] },
        { id: "rt_v5", title: "Best Selling Products", type: "table", x: 0, y: 5, width: 4, height: 2, queryFields: ["Product", "Qty", "Revenue", "Growth"] },
        { id: "rt_v6", title: "Category Slicer", type: "slicer", x: 0, y: 7, width: 4, height: 1, queryFields: ["Category"] },
      ],
    },
  ];

  reportsDb[retailId] = {
    id: retailId,
    name: "🛍️ Global Retail Sales Performance",
    pages: retailPages,
    datasets: {
      rt_v1: [{ value: 14520480 }],
      rt_v2: [{ value: 28.4 }],
      rt_v3: [
        { name: "Mobile App Store", value: 6850000 },
        { name: "Desktop Web", value: 4620000 },
        { name: "Direct Retail Shops", value: 3050000 },
      ],
      rt_v4: [
        { Time: "Jan", Sales: 820000, Target: 800000 },
        { Time: "Feb", Sales: 950000, Target: 850000 },
        { Time: "Mar", Sales: 1120000, Target: 900000 },
        { Time: "Apr", Sales: 1050000, Target: 1000000 },
        { Time: "May", Sales: 1250000, Target: 1100000 },
        { Time: "Jun", Sales: 1450000, Target: 1200000 },
      ],
      rt_v5: [
        { Product: "Smart Watch Elite", Qty: 4200, Revenue: 1260000, Growth: "+24.5%" },
        { Product: "Wireless Pods Pro", Qty: 6800, Revenue: 1020000, Growth: "+18.2%" },
        { Product: "Charging Hub Max", Qty: 5500, Revenue: 440000, Growth: "-3.1%" },
        { Product: "Smart Tag Mini", Qty: 9400, Revenue: 235000, Growth: "+45.0%" },
      ],
      rt_v6: [],
    },
    slicers: {
      rt_v6: {
        column: "Category",
        options: ["All Categories", "Electronics", "Audio & Wearables", "Accessories"],
        selectedValue: "All Categories",
      },
    },
    createdAt: new Date().toISOString(),
    isCustomUpload: false,
  };

  // Report 3: Cloud Infrastructure Sentry
  const infraId = "cloud_infra";
  const infraPages = [
    {
      name: "sentry_overview",
      displayName: "Infrastructure",
      visuals: [
        { id: "inf_v1", title: "API Gateway Ping", type: "card", x: 0, y: 0, width: 2, height: 1, queryFields: ["Ping"] },
        { id: "inf_v2", title: "Active Server Clusters", type: "gauge", x: 2, y: 0, width: 2, height: 1, queryFields: ["Clusters"] },
        { id: "inf_v3", title: "API Latency (ms) Stream", type: "lineChart", x: 0, y: 1, width: 4, height: 2, queryFields: ["Time", "Latency"] },
        { id: "inf_v4", title: "Requests by Server Region", type: "barChart", x: 0, y: 3, width: 4, height: 2, queryFields: ["Region", "Requests"] },
        { id: "inf_v5", title: "Cluster Health Status", type: "table", x: 0, y: 5, width: 4, height: 2, queryFields: ["Cluster", "Status", "Uptime", "CPU"] },
        { id: "inf_v6", title: "Environment", type: "slicer", x: 0, y: 7, width: 4, height: 1, queryFields: ["Env"] },
      ],
    },
  ];

  const latencyTicks = Array.from({ length: 15 }).map((_, i) => {
    const d = new Date();
    d.setSeconds(d.getSeconds() - (15 - i) * 3);
    const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
    return {
      Time: timeStr,
      "US-East-1": Math.floor(45 + Math.random() * 25),
      "EU-West-3": Math.floor(65 + Math.random() * 30),
      "AP-South-1": Math.floor(120 + Math.random() * 50),
    };
  });

  reportsDb[infraId] = {
    id: infraId,
    name: "🖥️ Cloud Infrastructure Sentry",
    pages: infraPages,
    datasets: {
      inf_v1: [{ value: "14ms" }],
      inf_v2: [{ value: 98.4 }], // Capacity %
      inf_v3: latencyTicks,
      inf_v4: [
        { Region: "US-East-1", Requests: 1450000 },
        { Region: "EU-West-3", Requests: 980000 },
        { Region: "AP-South-1", Requests: 1250000 },
        { Region: "SA-East-1", Requests: 340000 },
      ],
      inf_v5: [
        { Cluster: "Kubernetes Core-1", Status: "Healthy", Uptime: "99.99%", CPU: "42%" },
        { Cluster: "Data Storage Core", Status: "Healthy", Uptime: "100.00%", CPU: "68%" },
        { Cluster: "Cache Redis Primary", Status: "Warning", Uptime: "99.85%", CPU: "94%" },
        { Cluster: "Auth Worker Pool", Status: "Healthy", Uptime: "99.90%", CPU: "15%" },
      ],
      inf_v6: [],
    },
    slicers: {
      inf_v6: {
        column: "Environment",
        options: ["All Envs", "Production", "Staging", "Development"],
        selectedValue: "All Envs",
      },
    },
    createdAt: new Date().toISOString(),
    isCustomUpload: false,
  };
};

seedReports();

// --- API Endpoints ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// List all reports (prebuilts & custom uploaded)
app.get("/api/reports", (req, res) => {
  const summary = Object.values(reportsDb).map((r) => ({
    id: r.id,
    name: r.name,
    pageCount: r.pages.length,
    createdAt: r.createdAt,
    isCustomUpload: r.isCustomUpload,
  }));
  res.json(summary);
});

// Fetch detailed report by ID
app.get("/api/reports/:id", (req, res) => {
  const report = reportsDb[req.params.id];
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.json(report);
});

// Real-Time Refresh Simulator Endpoint
// When called, this endpoint slightly fluctuates the dataset values for a report
// to simulate active real-time data refreshing.
app.post("/api/reports/:id/refresh", (req, res) => {
  const report = reportsDb[req.params.id];
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  // Iterate over each page and update visual dataset values
  report.pages.forEach((page) => {
    page.visuals.forEach((visual: any) => {
      const vid = visual.id;
      const data = report.datasets[vid];

      if (!data || data.length === 0) return;

      if (visual.type === "card") {
        const val = data[0].value;
        if (typeof val === "number") {
          // If it's a percentage, fluctuate within a tight limit
          if (val <= 100 && val >= 0 && (visual.title.toLowerCase().includes("%") || visual.title.toLowerCase().includes("margin") || visual.title.toLowerCase().includes("score"))) {
            const shift = (Math.random() - 0.5) * 0.8;
            data[0].value = parseFloat(Math.min(100, Math.max(0, val + shift)).toFixed(2));
          } else {
            // Rises over time (e.g., cumulative sales or counts)
            const add = Math.floor(Math.random() * 150) + 10;
            data[0].value = val + add;
          }
        } else if (typeof val === "string" && val.endsWith("ms")) {
          // Fluctuate ping latencies
          const num = parseInt(val);
          const shift = Math.floor((Math.random() - 0.5) * 6);
          data[0].value = `${Math.max(5, num + shift)}ms`;
        }
      } else if (visual.type === "gauge") {
        const val = data[0].value;
        if (typeof val === "number") {
          const shift = (Math.random() - 0.5) * 2;
          data[0].value = parseFloat(Math.min(100, Math.max(0, val + shift)).toFixed(2));
        }
      } else if (visual.type === "pieChart" || visual.type === "donutChart") {
        // Fluctuate slices slightly while maintaining consistency
        data.forEach((slice: any) => {
          const pct = 1 + (Math.random() - 0.5) * 0.04; // ±2% fluctuation
          slice.value = Math.floor(slice.value * pct);
        });
      } else if (visual.type === "barChart" || visual.type === "columnChart") {
        data.forEach((bar: any) => {
          if (typeof bar.Value === "number") {
            const pct = 1 + (Math.random() - 0.5) * 0.05; // ±2.5% fluctuation
            bar.Value = Math.floor(bar.Value * pct);
          } else if (typeof bar.Alerts === "number") {
            // Integers for counts
            const shift = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            bar.Alerts = Math.max(0, bar.Alerts + shift);
          } else if (typeof bar.Requests === "number") {
            const pct = 1 + (Math.random() - 0.5) * 0.03;
            bar.Requests = Math.floor(bar.Requests * pct);
          }
        });
      } else if (visual.type === "lineChart" || visual.type === "areaChart") {
        // Shift time series data (append a new point and slide out the oldest one)
        const d = new Date();
        const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;

        // Get keys from first element except "Time"
        const keys = Object.keys(data[0]).filter((k) => k !== "Time");
        const newPoint: any = { Time: timeStr };

        keys.forEach((key) => {
          const lastVal = data[data.length - 1][key];
          // Determine realistic deviation based on name
          let shift = 0;
          if (key.toLowerCase().includes("temp")) {
            shift = (Math.random() - 0.5) * 3;
            newPoint[key] = Math.floor(Math.min(120, Math.max(50, lastVal + shift)));
          } else if (key.toLowerCase().includes("latency")) {
            shift = (Math.random() - 0.5) * 12;
            newPoint[key] = Math.floor(Math.min(300, Math.max(20, lastVal + shift)));
          } else {
            const pct = 1 + (Math.random() - 0.5) * 0.08;
            newPoint[key] = Math.floor(lastVal * pct);
          }
        });

        data.push(newPoint);
        if (data.length > 20) {
          data.shift(); // keep sliding window size at 20 max
        }
      } else if (visual.type === "table") {
        data.forEach((row: any) => {
          if (row.Revenue) {
            const pct = 1 + (Math.random() - 0.5) * 0.02;
            row.Revenue = Math.floor(row.Revenue * pct);
          }
          if (row.Qty) {
            const add = Math.floor(Math.random() * 5);
            row.Qty += add;
          }
          if (row.CPU) {
            const cpuVal = parseInt(row.CPU);
            const shift = Math.floor((Math.random() - 0.5) * 8);
            row.CPU = `${Math.min(99, Math.max(5, cpuVal + shift))}%`;
          }
        });
      }
    });
  });

  res.json({ success: true, report: report });
});

// PBIX File Upload and layout/schema extraction endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }

  const fileName = req.file.originalname;
  if (!fileName.endsWith(".pbix")) {
    return res.status(400).json({ error: "Only Microsoft Power BI prebuilt (.pbix) files are supported." });
  }

  try {
    const zip = new AdmZip(req.file.buffer);
    const layoutEntry = zip.getEntry("Report/Layout");

    if (!layoutEntry) {
      return res.status(400).json({
        error: "Invalid Power BI file structure. Could not locate 'Report/Layout' file in the zipped package.",
      });
    }

    // Convert Layout from UTF-16LE buffer
    const layoutText = layoutEntry.getData().toString("utf16le");
    const layoutJson = JSON.parse(layoutText);

    if (!layoutJson.sections || !Array.isArray(layoutJson.sections)) {
      return res.status(400).json({ error: "PBIX Layout file is missing sections." });
    }

    // Filter out inactive sections and map visuals
    const pages = layoutJson.sections
      .filter((sec: any) => sec.config || sec.visualContainers)
      .map((sec: any) => {
        const visuals = (sec.visualContainers || [])
          .filter((container: any) => {
            // Skip pure backgrounds, buttons, and shapes that aren't charts
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
      return res.status(400).json({ error: "The uploaded Power BI file contains no active visual containers." });
    }

    const reportId = "uploaded_" + Date.now();
    const reportName = fileName.replace(".pbix", "");

    // Prepare metadata summary to feed to Gemini
    const reportPagesSummary = pages.map((page: any) => ({
      pageName: page.displayName,
      visuals: page.visuals.map((v: any) => ({ id: v.id, title: v.title, type: v.type })),
    }));

    // Trigger AI Data Modeling using Gemini API if configured
    let reportData = { datasets: {}, slicers: {} };
    let aiTriggered = false;

    const ai = getAiClient();
    if (ai) {
      try {
        const geminiPrompt = `
You are a Power BI report data generator. I have uploaded a .pbix file, and successfully extracted its layout metadata.
The report name is: "${reportName}".
Here is the extracted layout structure of pages and visual containers:
${JSON.stringify(reportPagesSummary, null, 2)}

Your task is to generate realistic, coherent, and highly interactive mock datasets for EVERY visual container ID listed in this report.
The datasets must be:
1. Numerically and logically coherent: If the report contains sales visuals and region slicers, the sales numbers must align across cards, charts, and tables.
2. Formatted for chart display:
   - For 'barChart' or 'columnChart', return an array of objects representing categories and numeric values. E.g., [{"Category": "A", "Value": 100}, {"Category": "B", "Value": 150}]
   - For 'lineChart' or 'areaChart', return an array of objects representing points over time (e.g. Days, Months, or Timestamps) and metrics. E.g., [{"Time": "Jan", "Sales": 200, "Profit": 180}, ...]
   - For 'pieChart' or 'donutChart', return an array of categories and values. E.g., [{"name": "Online", "value": 450}, ...]
   - For 'card' or 'gauge', return a single-object array with a 'value' property. E.g., [{"value": 124500}]
   - For 'table', return an array of multiple objects representing rows of a data grid, with descriptive columns. E.g., [{"Product": "Gadget A", "Sales": 5000, "Refunds": 120}]
   - For 'map', return an array of geographical locations with name, lat, lng, and value. E.g., [{"city": "New York", "lat": 40.7128, "lng": -74.0060, "value": 52000}]
3. Create slicer configurations for any 'slicer' visual container ID, defining the filter 'column' name, and list of 'options' (string values). E.g. {"column": "Region", "options": ["North", "South", "East", "West"]}.

Please return ONLY a valid, raw JSON object (with no markdown block quotes, no backticks, no explanatory text, starting with { and ending with }) conforming to the following structure:
{
  "datasets": {
    "visual_container_id_1": [ { "Category": "..." , "Value": 123 }, ... ],
    "visual_container_id_2": [ { "value": 450000 } ]
  },
  "slicers": {
    "slicer_visual_id_1": { "column": "Product Category", "options": ["Electronics", "Apparel", "Home"] }
  }
}
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: geminiPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const textResponse = response.text || "";
        const cleanedResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedAiData = JSON.parse(cleanedResponse);

        if (parsedAiData.datasets) {
          reportData.datasets = parsedAiData.datasets;
          reportData.slicers = parsedAiData.slicers || {};
          aiTriggered = true;
        }
      } catch (aiError) {
        console.error("Gemini dataset synthesis failed, falling back to local model: ", aiError);
      }
    }

    // Fallback to local heuristic data generation if Gemini isn't loaded or fails
    if (!aiTriggered) {
      const fallback = generateFallbackDatasets(pages);
      reportData.datasets = fallback.datasets;
      reportData.slicers = fallback.slicers;
    }

    // Save report in-memory database
    reportsDb[reportId] = {
      id: reportId,
      name: `📊 ${reportName}`,
      pages: pages,
      datasets: reportData.datasets,
      slicers: reportData.slicers as any,
      createdAt: new Date().toISOString(),
      isCustomUpload: true,
    };

    res.json({
      success: true,
      reportId: reportId,
      name: reportName,
      pagesCount: pages.length,
      aiGenerated: aiTriggered,
    });
  } catch (error: any) {
    console.error("PBIX upload and processing error: ", error);
    res.status(500).json({ error: "Failed to process the Power BI report file. " + error.message });
  }
});

// Start Server Setup with Vite integration
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
