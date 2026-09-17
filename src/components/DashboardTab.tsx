import React, { useMemo } from 'react';
import { FinancialRecord, FilterState, KpiSummary } from '../types';
import { MONTH_ORDER } from '../constants/logo';
import { cleanText, normalizeMonth, num, formatCurrency, shortNum, truncate } from '../services/formatters';

interface DashboardTabProps {
  rawData: FinancialRecord[];
  filteredData: FinancialRecord[];
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, val: string) => void;
  kpis: KpiSummary;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  rawData,
  filteredData,
  filters,
  onFilterChange,
  kpis
}) => {
  // Available filter options
  const years = useMemo(() => {
    const list = Array.from(new Set<string>(rawData.map((d) => String(d.Year)).filter(Boolean)));
    return ['All', ...list.sort((a, b) => num(a) - num(b))];
  }, [rawData]);

  const months = useMemo(() => {
    const list = Array.from(new Set<string>(rawData.map((d) => normalizeMonth(d.Month)).filter(Boolean)));
    return ['All', ...list.sort((a, b) => (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99))];
  }, [rawData]);

  const clusters = useMemo(() => {
    const list = Array.from(new Set<string>(rawData.map((d) => cleanText(d.Cluster)).filter(Boolean)));
    return ['All', ...list.sort((a, b) => a.localeCompare(b))];
  }, [rawData]);

  // Business Units are dynamically dependent on the selected Cluster
  const businessUnits = useMemo(() => {
    const sourceData = filters.cluster === 'All'
      ? rawData
      : rawData.filter((d) => cleanText(d.Cluster) === cleanText(filters.cluster));
    const list = Array.from(new Set<string>(sourceData.map((d) => cleanText(d['Business Units'])).filter(Boolean)));
    return ['All', ...list.sort((a, b) => a.localeCompare(b))];
  }, [rawData, filters.cluster]);

  const categories = useMemo(() => {
    const list = Array.from(new Set<string>(rawData.map((d) => cleanText(d.Category)).filter(Boolean)));
    return ['All', ...list.sort((a, b) => a.localeCompare(b))];
  }, [rawData]);

  const sources = useMemo(() => {
    const list = Array.from(new Set<string>(rawData.map((d) => cleanText(d.Source)).filter(Boolean)));
    return ['All', ...list.sort((a, b) => a.localeCompare(b))];
  }, [rawData]);

  // Chart 1: Revenue vs Cost Trend by Month
  const trendData = useMemo(() => {
    const map: Record<string, { r: number; c: number }> = {};
    filteredData.forEach((d) => {
      const m = normalizeMonth(d.Month) || 'UNKNOWN';
      if (!map[m]) map[m] = { r: 0, c: 0 };
      map[m].r += num(d.Revenue);
      map[m].c += num(d.Cost);
    });
    const sortedKeys = Object.keys(map).sort((a, b) => (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99));
    return {
      labels: sortedKeys,
      revs: sortedKeys.map((k) => map[k].r),
      costs: sortedKeys.map((k) => map[k].c)
    };
  }, [filteredData]);

  // Chart 2: Profit by Cluster
  const clusterProfit = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((d) => {
      const k = cleanText(d.Cluster) || 'UNKNOWN';
      map[k] = (map[k] || 0) + num(d.Profit);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map((e) => e[0]),
      values: entries.map((e) => e[1])
    };
  }, [filteredData]);

  // Chart 3: Revenue Share by Category
  const categoryRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((d) => {
      const k = cleanText(d.Category) || 'UNKNOWN';
      map[k] = (map[k] || 0) + num(d.Revenue);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map((e) => e[0]),
      values: entries.map((e) => e[1])
    };
  }, [filteredData]);

  // Chart 4: Top 5 Business Units by Profit
  const topBusinessUnits = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((d) => {
      const k = cleanText(d['Business Units']) || 'UNKNOWN';
      map[k] = (map[k] || 0) + num(d.Profit);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      labels: entries.map((e) => e[0]),
      values: entries.map((e) => e[1])
    };
  }, [filteredData]);

  // Chart 5: Revenue vs Cost by Source
  const sourceComparison = useMemo(() => {
    const map: Record<string, { r: number; c: number }> = {};
    filteredData.forEach((d) => {
      const k = cleanText(d.Source) || 'UNKNOWN';
      if (!map[k]) map[k] = { r: 0, c: 0 };
      map[k].r += num(d.Revenue);
      map[k].c += num(d.Cost);
    });
    const entries = Object.entries(map);
    return {
      labels: entries.map((e) => e[0]),
      revs: entries.map((e) => e[1].r),
      costs: entries.map((e) => e[1].c)
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Slicers / Filters Bar */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Year */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Timeline: Year
            </label>
            <select
              id="select-filter-year"
              value={filters.year}
              onChange={(e) => onFilterChange('year', e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:border-sky-400 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y === 'All' ? 'All Years' : y}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Timeline: Month
            </label>
            <select
              id="select-filter-month"
              value={filters.month}
              onChange={(e) => onFilterChange('month', e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:border-sky-400 focus:outline-none"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All Months' : m}
                </option>
              ))}
            </select>
          </div>

          {/* Cluster */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Cluster
            </label>
            <select
              id="select-filter-cluster"
              value={filters.cluster}
              onChange={(e) => {
                onFilterChange('cluster', e.target.value);
                onFilterChange('businessUnit', 'All');
              }}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:border-sky-400 focus:outline-none"
            >
              {clusters.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Clusters' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Business Unit (dependent) */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Business Unit
            </label>
            <select
              id="select-filter-bu"
              value={filters.businessUnit}
              onChange={(e) => onFilterChange('businessUnit', e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:border-sky-400 focus:outline-none"
            >
              {businessUnits.map((bu) => (
                <option key={bu} value={bu}>
                  {bu === 'All' ? 'All Business Units' : bu}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Category
            </label>
            <select
              id="select-filter-category"
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:border-sky-400 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Source
            </label>
            <select
              id="select-filter-source"
              value={filters.source}
              onChange={(e) => onFilterChange('source', e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:border-sky-400 focus:outline-none"
            >
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src === 'All' ? 'All Sources' : src}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div id="kpi-card-revenue" className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Revenue</div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1.5">{formatCurrency(kpis.revenue)}</div>
          <div className="text-[11px] font-semibold text-sky-400 mt-1">Gross Performance</div>
        </div>

        <div id="kpi-card-cost" className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Cost</div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1.5">{formatCurrency(kpis.cost)}</div>
          <div className="text-[11px] font-semibold text-rose-400 mt-1">Operational Outflow</div>
        </div>

        <div id="kpi-card-profit" className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Net Profit</div>
          <div className={`text-xl sm:text-2xl font-black mt-1.5 ${kpis.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(kpis.profit)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 mt-1">Bottom Line</div>
        </div>

        <div id="kpi-card-margin" className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Profit Margin</div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1.5">{kpis.margin.toFixed(1)}%</div>
          <div className="text-[11px] font-semibold text-amber-400 mt-1">Efficiency Rate</div>
        </div>

        <div id="kpi-card-units" className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5 col-span-2 md:col-span-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Units</div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 mt-1.5">{kpis.activeUnits}</div>
          <div className="text-[11px] font-semibold text-purple-400 mt-1">Business Count</div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* 1. Revenue vs Cost Timeline Trend (Span 8) */}
        <div id="chart-trend-card" className="lg:col-span-8 bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100">1. Revenue vs Cost Timeline Trend</h3>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Revenue</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Cost</span>
            </div>
          </div>
          <div className="h-[280px] sm:h-[300px] w-full">
            <LineChart labels={trendData.labels} a={trendData.revs} b={trendData.costs} />
          </div>
        </div>

        {/* 2. Profit by Cluster (Span 4) */}
        <div id="chart-cluster-card" className="lg:col-span-4 bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-3">2. Profit by Cluster</h3>
          <div className="h-[280px] sm:h-[300px] w-full">
            <VerticalBarChart labels={clusterProfit.labels} values={clusterProfit.values} color="#a78bfa" />
          </div>
        </div>

        {/* 3. Revenue Share by Category (Span 4) */}
        <div id="chart-category-card" className="lg:col-span-4 bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-3">3. Revenue Share by Category</h3>
          <div className="h-[280px] sm:h-[300px] w-full">
            <DonutChart labels={categoryRevenue.labels} values={categoryRevenue.values} />
          </div>
        </div>

        {/* 4. Top 5 Business Units by Profit (Span 4) */}
        <div id="chart-bu-card" className="lg:col-span-4 bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-100 mb-3">4. Top 5 Business Units by Profit</h3>
          <div className="h-[280px] sm:h-[300px] w-full">
            <HorizontalBarChart labels={topBusinessUnits.labels} values={topBusinessUnits.values} color="#34d399" />
          </div>
        </div>

        {/* 5. Revenue vs Cost by Source (Span 4) */}
        <div id="chart-source-card" className="lg:col-span-4 bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100">5. Revenue vs Cost by Source</h3>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-sky-400" /> Rev</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-400" /> Cost</span>
            </div>
          </div>
          <div className="h-[280px] sm:h-[300px] w-full">
            <GroupedBarChart labels={sourceComparison.labels} a={sourceComparison.revs} b={sourceComparison.costs} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Responsive SVG Chart Subcomponents --- */

const LineChart: React.FC<{ labels: string[]; a: number[]; b: number[] }> = ({ labels, a, b }) => {
  if (!labels.length) {
    return <div className="h-full flex items-center justify-center text-xs text-slate-500">No data for selected filters</div>;
  }
  const w = 900;
  const h = 300;
  const L = 60;
  const R = 25;
  const T = 20;
  const B = 45;
  const iw = w - L - R;
  const ih = h - T - B;
  const max = Math.max(1, ...a, ...b);
  const step = labels.length > 1 ? iw / (labels.length - 1) : iw / 2;

  const y = (v: number) => T + ih - (v / max) * ih;
  const x = (i: number) => (labels.length > 1 ? L + i * step : L + iw / 2);
  const pathA = a.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join(' ');
  const pathB = b.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Gridlines */}
      {[0, 1, 2, 3, 4].map((i) => {
        const yy = T + (ih * i) / 4;
        const val = max * (1 - i / 4);
        return (
          <g key={i}>
            <line x1={L} y1={yy} x2={w - R} y2={yy} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <text x={8} y={yy + 4} fill="#64748b" fontSize="11" fontFamily="sans-serif">
              {shortNum(val)}
            </text>
          </g>
        );
      })}

      {/* Lines */}
      <path d={pathA} fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
      <path d={pathB} fill="none" stroke="#f87171" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />

      {/* Circles */}
      {a.map((v, i) => (
        <circle key={'a' + i} cx={x(i)} cy={y(v)} r="4.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
      ))}
      {b.map((v, i) => (
        <circle key={'b' + i} cx={x(i)} cy={y(v)} r="4" fill="#f87171" stroke="#0f172a" strokeWidth="1.5" />
      ))}

      {/* X Labels */}
      {labels.map((lab, i) => (
        <text key={lab + i} x={x(i)} y={h - 14} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600">
          {lab}
        </text>
      ))}
    </svg>
  );
};

const VerticalBarChart: React.FC<{ labels: string[]; values: number[]; color: string }> = ({ labels, values, color }) => {
  if (!labels.length) {
    return <div className="h-full flex items-center justify-center text-xs text-slate-500">No data for selected filters</div>;
  }
  const w = 450;
  const h = 300;
  const L = 48;
  const R = 18;
  const T = 25;
  const B = 45;
  const iw = w - L - R;
  const ih = h - T - B;
  const max = Math.max(1, ...values);
  const n = labels.length;
  const gap = 12;
  const bw = Math.max(12, (iw - gap * (n - 1)) / n);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      {[0, 1, 2, 3].map((i) => {
        const yy = T + (ih * i) / 3;
        const val = max * (1 - i / 3);
        return (
          <g key={i}>
            <line x1={L} y1={yy} x2={w - R} y2={yy} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <text x={4} y={yy + 4} fill="#64748b" fontSize="10">
              {shortNum(val)}
            </text>
          </g>
        );
      })}

      {labels.map((lab, i) => {
        const x = L + i * (bw + gap);
        const bh = Math.max(2, (ih * values[i]) / max);
        const y = T + ih - bh;
        return (
          <g key={lab + i}>
            <rect x={x} y={y} width={bw} height={bh} rx="4" fill={color} />
            <text x={x + bw / 2} y={Math.max(T + 12, y - 6)} textAnchor="middle" fill="#f8fafc" fontSize="10.5" fontWeight="700">
              {shortNum(values[i])}
            </text>
            <text x={x + bw / 2} y={h - 14} textAnchor="middle" fill="#94a3b8" fontSize="10">
              {truncate(lab, 10)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const HorizontalBarChart: React.FC<{ labels: string[]; values: number[]; color: string }> = ({ labels, values, color }) => {
  if (!labels.length) {
    return <div className="h-full flex items-center justify-center text-xs text-slate-500">No data for selected filters</div>;
  }
  const w = 450;
  const h = 300;
  const L = 140;
  const R = 45;
  const T = 20;
  const B = 20;
  const iw = w - L - R;
  const ih = h - T - B;
  const max = Math.max(1, ...values);
  const gap = 10;
  const barH = Math.max(16, (ih - gap * (labels.length - 1)) / labels.length);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      {labels.map((lab, i) => {
        const y = T + i * (barH + gap);
        const bw = Math.max(4, (iw * values[i]) / max);
        return (
          <g key={lab + i}>
            <text x={L - 8} y={y + barH * 0.7} textAnchor="end" fill="#94a3b8" fontSize="11" fontWeight="600">
              {truncate(lab, 16)}
            </text>
            <rect x={L} y={y} width={bw} height={barH} rx="4" fill={color} />
            <text x={L + bw + 6} y={y + barH * 0.72} fill="#f8fafc" fontSize="10.5" fontWeight="700">
              {shortNum(values[i])}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const DonutChart: React.FC<{ labels: string[]; values: number[] }> = ({ labels, values }) => {
  if (!labels.length) {
    return <div className="h-full flex items-center justify-center text-xs text-slate-500">No data for selected filters</div>;
  }
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const w = 450;
  const h = 300;
  const cx = 135;
  const cy = 150;
  const r = 85;
  const inner = 52;
  const colors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#fb7185', '#22c55e'];

  let angle = -Math.PI / 2;
  const slices = labels.map((lab, i) => {
    const frac = values[i] / total;
    const a2 = angle + frac * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    angle = a2;
    return { d, color: colors[i % colors.length], frac, lab, val: values[i] };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Slices */}
      {slices.map((s, idx) => (
        <path key={idx} d={s.d} fill="none" stroke={s.color} strokeWidth={r - inner} />
      ))}

      {/* Center text */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#f8fafc" fontSize="17" fontWeight="900">
        {shortNum(total)}
      </text>
      <text x={cx} y={cy + 17} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700">
        REVENUE
      </text>

      {/* Legend */}
      {slices.slice(0, 6).map((s, idx) => {
        const y = 50 + idx * 28;
        return (
          <g key={s.lab + idx}>
            <circle cx={250} cy={y - 4} r="5" fill={s.color} />
            <text x={262} y={y} fill="#94a3b8" fontSize="11" fontWeight="600">
              {truncate(s.lab, 16)}
            </text>
            <text x={430} y={y} textAnchor="end" fill="#f8fafc" fontSize="11" fontWeight="700">
              {(s.frac * 100).toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const GroupedBarChart: React.FC<{ labels: string[]; a: number[]; b: number[] }> = ({ labels, a, b }) => {
  if (!labels.length) {
    return <div className="h-full flex items-center justify-center text-xs text-slate-500">No data for selected filters</div>;
  }
  const w = 450;
  const h = 300;
  const L = 48;
  const R = 18;
  const T = 25;
  const B = 45;
  const iw = w - L - R;
  const ih = h - T - B;
  const max = Math.max(1, ...a, ...b);
  const n = labels.length;
  const groupW = iw / n;
  const bw = Math.max(6, groupW * 0.3);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      {[0, 1, 2, 3].map((i) => {
        const yy = T + (ih * i) / 3;
        const val = max * (1 - i / 3);
        return (
          <g key={i}>
            <line x1={L} y1={yy} x2={w - R} y2={yy} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <text x={4} y={yy + 4} fill="#64748b" fontSize="10">
              {shortNum(val)}
            </text>
          </g>
        );
      })}

      {labels.map((lab, i) => {
        const x = L + i * groupW + (groupW - bw * 2 - 4) / 2;
        const bh1 = Math.max(2, (ih * a[i]) / max);
        const bh2 = Math.max(2, (ih * b[i]) / max);
        return (
          <g key={lab + i}>
            <rect x={x} y={T + ih - bh1} width={bw} height={bh1} rx="3" fill="#38bdf8" />
            <rect x={x + bw + 4} y={T + ih - bh2} width={bw} height={bh2} rx="3" fill="#f87171" />
            <text x={x + (bw * 2 + 4) / 2} y={h - 14} textAnchor="middle" fill="#94a3b8" fontSize="10.5">
              {truncate(lab, 10)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
