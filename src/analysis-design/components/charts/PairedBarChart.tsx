import React, { useState } from 'react';

export interface PairedBarItem {
  programTitle: string;
  pretest: number;
  posttest: number;
  delta: number;
  validCount: number;
}

interface PairedBarChartProps {
  title: string;
  subtitle?: string;
  unit?: string;
  data: PairedBarItem[];
  passingGrade?: number;
  onItemClick?: (item: PairedBarItem) => void;
}

export const PairedBarChart: React.FC<PairedBarChartProps> = ({
  title,
  subtitle,
  unit = 'Skala 0 - 100 Poin',
  data,
  passingGrade = 75,
  onItemClick,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
        <div className="h-52 flex items-center justify-center text-slate-400 text-xs">
          <span>Tidak ada data pretest-posttest valid</span>
        </div>
      </div>
    );
  }

  const height = 230;
  const paddingTop = 25;
  const paddingBottom = 45;
  const availableHeight = height - paddingTop - paddingBottom;
  const maxScore = 100;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-400" />
            <span>Pretest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-600" />
            <span>Posttest</span>
          </div>
          <span className="text-red-600">· Ambang Lulus: {passingGrade}</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(data.length * 125, 480)} ${height}`}
          className="w-full h-56 min-w-[460px]"
        >
          {/* Grid lines: 0, 25, 50, 75, 100 */}
          {[0, 25, 50, 75, 100].map((score) => {
            const y = paddingTop + availableHeight * (1 - score / maxScore);
            return (
              <g key={score}>
                <line
                  x1="40"
                  y1={y}
                  x2={Math.max(data.length * 125, 480) - 20}
                  y2={y}
                  stroke={score === passingGrade ? '#fca5a5' : '#f1f5f9'}
                  strokeDasharray={score === passingGrade ? '4 2' : '0'}
                />
                <text
                  x="32"
                  y={y + 4}
                  textAnchor="end"
                  className={`text-[10px] font-mono-numbers ${
                    score === passingGrade ? 'fill-red-500 font-semibold' : 'fill-slate-400'
                  }`}
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const groupX = 55 + idx * 115;
            const barW = 20;

            const preH = (item.pretest / maxScore) * availableHeight;
            const postH = (item.posttest / maxScore) * availableHeight;

            const preY = paddingTop + availableHeight - preH;
            const postY = paddingTop + availableHeight - postH;

            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onClick={() => onItemClick?.(item)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Background highlight */}
                {isHovered && (
                  <rect
                    x={groupX - 8}
                    y={paddingTop}
                    width={barW * 2 + 20}
                    height={availableHeight + 25}
                    fill="#f8fafc"
                    rx="4"
                  />
                )}

                {/* Pretest bar */}
                <rect
                  x={groupX}
                  y={preY}
                  width={barW}
                  height={Math.max(preH, 2)}
                  fill="#94a3b8"
                  rx="2"
                />

                {/* Posttest bar */}
                <rect
                  x={groupX + barW + 3}
                  y={postY}
                  width={barW}
                  height={Math.max(postH, 2)}
                  fill="#059669"
                  rx="2"
                />

                {/* Delta indicator pill badge or text */}
                <text
                  x={groupX + barW + 2}
                  y={Math.min(preY, postY) - 6}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-emerald-800 font-mono-numbers"
                >
                  +{item.delta}
                </text>

                {/* Hover labels */}
                {isHovered && (
                  <>
                    <text
                      x={groupX + barW / 2}
                      y={preY - 18}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-600 font-mono-numbers"
                    >
                      Pre: {item.pretest}
                    </text>
                    <text
                      x={groupX + barW + 3 + barW / 2}
                      y={postY - 18}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-emerald-700 font-mono-numbers"
                    >
                      Post: {item.posttest}
                    </text>
                  </>
                )}

                {/* Program label */}
                <text
                  x={groupX + barW + 2}
                  y={height - 22}
                  textAnchor="middle"
                  className="text-[10px] font-medium fill-slate-700"
                >
                  {item.programTitle.length > 13
                    ? item.programTitle.slice(0, 12) + '…'
                    : item.programTitle}
                </text>
                <text
                  x={groupX + barW + 2}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-mono-numbers"
                >
                  {item.validCount} psg valid
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>*Hanya menghitung peserta yang memiliki pasangan nilai pretest & posttest lengkap</span>
        <span>Klik program untuk melihat sebaran nilai per orang</span>
      </div>
    </div>
  );
};
