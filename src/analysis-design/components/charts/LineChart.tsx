import React, { useState } from 'react';

export interface LineDataPoint {
  label: string;
  value: number;
  subvalue?: string;
}

interface LineChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  data: LineDataPoint[];
  lineColor?: string;
  formatValue?: (val: number) => string;
  minY?: number;
  maxY?: number;
  metricToggle?: {
    activeMetric: string;
    options: Array<{ id: string; label: string }>;
    onChange: (id: string) => void;
  };
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  subtitle,
  unit,
  data,
  lineColor = '#059669', // Corporate Green
  formatValue = (v) => v.toLocaleString('id-ID'),
  minY,
  maxY,
  metricToggle,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
        <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
          <span>Data tren tidak tersedia</span>
        </div>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = minY !== undefined ? minY : Math.min(...values, 0);
  const maxVal = maxY !== undefined ? maxY : Math.max(...values, 1) * 1.15;
  const valRange = maxVal - minVal || 1;

  const width = 500;
  const height = 220;
  const paddingTop = 25;
  const paddingBottom = 40;
  const paddingLeft = 55;
  const paddingRight = 30;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, idx) => {
    const x = paddingLeft + (idx / Math.max(data.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.value - minVal) / valRange) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${
          points[0].x
        } ${paddingTop + chartHeight} Z`
      : '';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {metricToggle && (
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
              {metricToggle.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => metricToggle.onChange(opt.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    metricToggle.activeMetric === opt.id
                      ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <span className="text-xs text-slate-400 font-medium">Unit: {unit}</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 min-w-[380px]">
          {/* Y Axis Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = minVal + valRange * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono-numbers"
                >
                  {formatValue(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && (
            <path
              d={areaD}
              fill={lineColor}
              fillOpacity="0.08"
            />
          )}

          {/* Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke={lineColor}
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                />

                {/* Hover value label */}
                {isHovered && (
                  <g>
                    <rect
                      x={pt.x - 35}
                      y={pt.y - 30}
                      width="70"
                      height="20"
                      fill="#0f172a"
                      rx="3"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 16}
                      textAnchor="middle"
                      className="text-[10px] fill-white font-mono-numbers font-medium"
                    >
                      {formatValue(pt.value)}
                    </text>
                  </g>
                )}

                {/* X Axis label */}
                {(() => {
                  const stride = data.length > 12 ? Math.ceil(data.length / 8) : 1;
                  const show = idx % stride === 0 || idx === data.length - 1;
                  if (!show) return null;
                  const m = pt.label.match(/^(\d{4})-(\d{2})$/);
                  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
                  const displayLabel = m ? (months[Number(m[2])-1] + " '" + m[1].slice(2)) : pt.label;
                  return (
                    <text
                      x={pt.x}
                      y={height - 15}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-600 font-medium"
                    >
                      {displayLabel}
                    </text>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
