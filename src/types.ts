export type VisualType =
  | "barChart"
  | "columnChart"
  | "lineChart"
  | "areaChart"
  | "pieChart"
  | "donutChart"
  | "card"
  | "table"
  | "gauge"
  | "slicer"
  | "map";

export interface ReportVisual {
  id: string;
  title: string;
  type: VisualType;
  x: number;
  y: number;
  width: number;
  height: number;
  queryFields: string[];
  config?: any;
}

export interface ReportPage {
  name: string;
  displayName: string;
  visuals: ReportVisual[];
}

export interface PowerBiReport {
  id: string;
  name: string;
  pages: ReportPage[];
  datasets: Record<string, any[]>; // Maps visual ID to its specific series of records
  slicers: Record<string, { column: string; options: string[]; selectedValue?: string }>; // Page slicer configs
  createdAt: string;
}

export interface ServerReportResponse {
  id: string;
  name: string;
  pages: ReportPage[];
  datasets: Record<string, any[]>;
  slicers: Record<string, { column: string; options: string[]; selectedValue?: string }>;
  createdAt: string;
}
