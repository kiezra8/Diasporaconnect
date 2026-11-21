import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Categorical palette (fixed order, never cycled) — light / dark steps chosen per surface
const SERIES_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const SERIES_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'];

export type ValueFormat = 'ugx' | 'number' | 'litres' | 'kg' | 'percent';

export const formatValue = (v: number, f: ValueFormat = 'number', compact = false): string => {
  const n = Number(v) || 0;
  const short = (x: number) =>
    Math.abs(x) >= 1_000_000_000 ? `${(x / 1_000_000_000).toFixed(1)}B`
    : Math.abs(x) >= 1_000_000 ? `${(x / 1_000_000).toFixed(1)}M`
    : Math.abs(x) >= 1_000 ? `${(x / 1_000).toFixed(0)}K`
    : `${Math.round(x * 10) / 10}`;
  const body = compact ? short(n) : n.toLocaleString();
  switch (f) {
    case 'ugx': return `UGX ${body}`;
    case 'litres': return `${body} L`;
    case 'kg': return `${body} kg`;
    case 'percent': return `${Math.round(n * 10) / 10}%`;
    default: return body;
  }
};

function useIsDark() {
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export interface BarSeries {
  key: string;
  label: string;
}

interface Props {
  title: string;
  subtitle?: string;
  data: Array<Record<string, any>>;
  xKey: string;
  series: BarSeries[];
  format?: ValueFormat;
  height?: number;
  /** horizontal bars — better when category labels are long or numerous */
  horizontal?: boolean;
  emptyText?: string;
  className?: string;
}

/**
 * Card with a bar chart + a toggleable table view of the same numbers.
 * Used by every report section so all reports read the same way.
 */
export default function ReportBarChart({
  title,
  subtitle,
  data,
  xKey,
  series,
  format = 'number',
  height = 260,
  horizontal = false,
  emptyText = 'No data recorded for this report yet.',
  className = '',
}: Props) {
  const isDark = useIsDark();
  const [showTable, setShowTable] = useState(false);
  const palette = isDark ? SERIES_DARK : SERIES_LIGHT;
  const ink = isDark ? '#c3c2b7' : '#52514e';
  const grid = isDark ? '#2e2e2c' : '#e7e6e2';
  const surface = isDark ? '#0f172a' : '#ffffff';
  const hasData = data.length > 0 && data.some(d => series.some(s => Number(d[s.key]) > 0));
  const autoHeight = horizontal ? Math.max(height, data.length * 34 + 40) : height;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {hasData && (
          <button
            type="button"
            onClick={() => setShowTable(v => !v)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {showTable ? 'CHART' : 'TABLE'}
          </button>
        )}
      </div>

      {!hasData ? (
        <p className="text-xs text-slate-400 text-center py-10 font-semibold">{emptyText}</p>
      ) : showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/50">
              <tr><th className="py-2 px-3 dark:text-slate-300 uppercase text-[11px] w-10">#</th>
                <th className="text-left py-2 px-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">{xKey}</th>
                {series.map(s => (
                  <th key={s.key} className="text-right py-2 px-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {data.map((d, i) => (
                <tr key={i}><td className="py-1.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{i + 1}</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{d[xKey]}</td>
                  {series.map(s => (
                    <td key={s.key} className="py-1.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{formatValue(d[s.key], format)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ width: '100%', height: autoHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={horizontal ? 'vertical' : 'horizontal'}
              margin={{ top: 8, right: 16, bottom: 4, left: horizontal ? 8 : 0 }}
              barGap={2}
              barCategoryGap="22%"
            >
              <CartesianGrid stroke={grid} strokeDasharray="0" vertical={horizontal} horizontal={!horizontal} />
              {horizontal ? (
                <>
                  <XAxis type="number" tick={{ fill: ink, fontSize: 11 }} tickFormatter={v => formatValue(v, format, true)} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey={xKey} width={130} tick={{ fill: ink, fontSize: 11 }} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis dataKey={xKey} tick={{ fill: ink, fontSize: 11 }} axisLine={{ stroke: grid }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: ink, fontSize: 11 }} tickFormatter={v => formatValue(v, format, true)} axisLine={false} tickLine={false} width={64} />
                </>
              )}
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.05)' }}
                contentStyle={{ background: surface, border: `1px solid ${grid}`, borderRadius: 10, fontSize: 12, color: isDark ? '#f0efec' : '#0b0b0b' }}
                labelStyle={{ fontWeight: 700, color: isDark ? '#f0efec' : '#0b0b0b' }}
                formatter={(value: any, name: any) => [formatValue(Number(value), format), name]}
              />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: ink }} iconType="square" />}
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={palette[i % palette.length]}
                  stroke={surface}
                  strokeWidth={1}
                  radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                  maxBarSize={horizontal ? 22 : 36}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
