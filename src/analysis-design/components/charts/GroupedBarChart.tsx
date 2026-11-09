import React, { useState } from 'react';

interface GroupedBarDataPoint {
  label: string;
  sublabel?: string;
  seriesA: number;
  seriesB: number;
  id?: string;
}

interface GroupedBarChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  seriesAName: string;
  seriesBName: string;
  seriesAColor?: string;
  seriesBColor?: string;
  data: GroupedBarDataPoint[];
  formatValue?: (val: number) => string;
  onItemClick?: (item: GroupedBarDataPoint) => void;
  targetLine?: {
    value: number;
    label: string;
  };
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  title,
  subtitle,
  unit,
  seriesAName,
  seriesBName,
  seriesAColor = '#059669', // Corporate Green
  seriesBColor = '#0284c7', // Professional Blue
  data,
  formatValue = (v) => v.toLocaleString('id-ID'),
  onItemClick,
  targetLine,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
          <span>Data tidak tersedia untuk kombinasi filter saat ini</span>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.seriesA, d.seriesB]),
    targetLine ? targetLine.value : 0,
    1
  );
  // Round up max to nice upper bound
  const chartMax = Math.ceil(maxValue * 1.15);

  const height = 240;
  const paddingTop = 25;
  const paddingBottom = 45;
  const availableHeight = height - paddingTop - paddingBottom;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: seriesAColor }} />
            <span>{seriesAName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: seriesBColor }} />
            <span>{seriesBName}</span>
          </div>
          <span className="text-slate-400">· Unit: {unit}</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(data.length * 110, 520)} ${height}`}
          className="w-full h-60 min-w-[500px]"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + availableHeight * (1 - ratio);
            const val = Math.round(chartMax * ratio);
            return (
              <g key={ratio}>
                <line
                  x1="55"
                  y1={y}
                  x2={Math.max(data.length * 110, 520) - 20}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray={ratio === 0 ? '0' : '4 4'}
                />
                <text
                  x="48"
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono-numbers"
                >
                  {formatValue(val)}
                </text>
              </g>
            );
          })}

          {/* Optional Target Line */}
          {targetLine && (
            <g>
              <line
                x1="55"
                y1={paddingTop + availableHeight * (1 - targetLine.value / chartMax)}
                x2={Math.max(data.length * 110, 520) - 20}
                y2={paddingTop + availableHeight * (1 - targetLine.value / chartMax)}
                stroke="#dc2626"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x={Math.max(data.length * 110, 520) - 25}
                y={paddingTop + availableHeight * (1 - targetLine.value / chartMax) - 5}
                textAnchor="end"
                className="text-[10px] fill-red-600 font-medium"
              >
                Target: {targetLine.label}
              </text>
            </g>
          )}

          {/* Bars */}
          {data.map((item, index) => {
            const groupWidth = 80;
            const barWidth = 24;
            const groupX = 65 + index * 105;

            const heightA = (item.seriesA / chartMax) * availableHeight;
            const heightB = (item.seriesB / chartMax) * availableHeight;

            const yA = paddingTop + availableHeight - heightA;
            const yB = paddingTop + availableHeight - heightB;

            const isHovered = hoveredIdx === index;

            return (
              <g
                key={index}
                className="cursor-pointer transition-opacity"
                onClick={() => onItemClick?.(item)}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={groupX - 10}
                    y={paddingTop}
                    width={groupWidth + 10}
                    height={availableHeight + 25}
                    fill="#f8fafc"
                    rx="4"
                  />
                )}

                {/* Series A Bar */}
                <rect
                  x={groupX}
                  y={yA}
                  width={barWidth}
                  height={Math.max(heightA, 2)}
                  fill={seriesAColor}
                  rx="2"
                  className="transition-all duration-200"
                  opacity={isHovered ? 1 : 0.9}
                />

                {/* Series B Bar */}
                <rect
                  x={groupX + barWidth + 4}
                  y={yB}
                  width={barWidth}
                  height={Math.max(heightB, 2)}
                  fill={seriesBColor}
                  rx="2"
                  className="transition-all duration-200"
                  opacity={isHovered ? 1 : 0.9}
                />

                {/* Values on top of bars */}
                {isHovered && (
                  <>
                    <text
                      x={groupX + barWidth / 2}
                      y={yA - 4}
                      textAnchor="middle"
                      className="text-[9px] font-semibold fill-slate-700 font-mono-numbers"
                    >
                      {formatValue(item.seriesA)}
                    </text>
                    <text
                      x={groupX + barWidth + 4 + barWidth / 2}
                      y={yB - 4}
                      textAnchor="middle"
                      className="text-[9px] font-semibold fill-slate-700 font-mono-numbers"
                    >
                      {formatValue(item.seriesB)}
                    </text>
                  </>
                )}

                {/* X-axis Label */}
                <text
                  x={groupX + barWidth + 2}
                  y={height - 22}
                  textAnchor="middle"
                  className="text-[10px] font-medium fill-slate-700"
                >
                  {item.label.length > 14 ? item.label.slice(0, 13) + '…' : item.label}
                </text>
                {item.sublabel && (
                  <text
                    x={groupX + barWidth + 2}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400"
                  >
                    {item.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 text-[11px] text-slate-400 text-right">
        Klik batang atau label untuk melihat rincian sesi & peserta
      </div>
    </div>
  );
};
