import React from "react";
import { Filter, ChevronRight } from "lucide-react";

interface SlicerProps {
  slicerId: string;
  title: string;
  column: string;
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export default function ReportSlicer({
  slicerId,
  title,
  column,
  options,
  selectedValue,
  onChange,
}: SlicerProps) {
  return (
    <div className="w-full bg-slate-50/75 border border-slate-200 rounded-3xl p-5">
      <div className="flex items-center space-x-2 mb-3">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-xs font-bold text-slate-700">{title || `Filter by ${column}`}</span>
      </div>

      {/* Swipeable Horizontal Chip List - perfect for mobile touch browsers */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {options.map((option) => {
          const isSelected = selectedValue === option || (!selectedValue && option.startsWith("All"));
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
