import React, { useState, useMemo } from 'react';
import { FinancialRecord } from '../types';
import { cleanText, normalizeMonth, formatCurrency } from '../services/formatters';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Download } from 'lucide-react';

interface DataTableTabProps {
  filteredData: FinancialRecord[];
}

type SortKey = keyof FinancialRecord;

export const DataTableTab: React.FC<DataTableTabProps> = ({ filteredData }) => {
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<SortKey>('Revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter by search query
  const searchedRows = useMemo(() => {
    const q = cleanText(search);
    if (!q) return filteredData;
    return filteredData.filter((r) =>
      Object.values(r).some((v) => cleanText(v).includes(q))
    );
  }, [filteredData, search]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...searchedRows].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [searchedRows, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * rowsPerPage;
  const pageRows = sortedRows.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    if (!sortedRows.length) return;
    const headers = ['Source', 'Category', 'Month', 'Year', 'Cluster', 'Business Unit', 'Revenue', 'Cost', 'Profit'];
    const lines = [headers.join(',')];
    sortedRows.forEach((r) => {
      lines.push([
        `"${r.Source}"`,
        `"${r.Category}"`,
        `"${normalizeMonth(r.Month)}"`,
        `"${r.Year}"`,
        `"${r.Cluster}"`,
        `"${r['Business Units']}"`,
        r.Revenue,
        r.Cost,
        r.Profit
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Elegancia_DataTable_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="table-search-input"
            type="text"
            placeholder="Search data records..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm focus:border-sky-400 focus:outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Export CSV
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Rows:</span>
            <select
              id="select-rows-per-page"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-sky-400 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10.5px] border-b border-slate-800 select-none">
              <th onClick={() => handleSort('Source')} className="py-3 px-3.5 cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">Source <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Category')} className="py-3 px-3.5 cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Month')} className="py-3 px-3.5 cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">Month <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Year')} className="py-3 px-3.5 cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">Year <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Cluster')} className="py-3 px-3.5 cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">Cluster <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Business Units')} className="py-3 px-3.5 cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">Business Unit <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Revenue')} className="py-3 px-3.5 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end gap-1">Revenue <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Cost')} className="py-3 px-3.5 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end gap-1">Cost <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
              <th onClick={() => handleSort('Profit')} className="py-3 px-3.5 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end gap-1">Profit <ArrowUpDown className="w-3 h-3 opacity-60" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No matching data records found.
                </td>
              </tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-300">{r.Source}</td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">{r.Category}</td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-mono">{normalizeMonth(r.Month)}</td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-mono">{r.Year}</td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">{r.Cluster}</td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-300">{r['Business Units']}</td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono font-semibold text-white">
                    {formatCurrency(r.Revenue)}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono font-semibold text-rose-400">
                    {formatCurrency(r.Cost)}
                  </td>
                  <td className={`py-2.5 px-3.5 whitespace-nowrap text-right font-mono font-bold ${r.Profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(r.Profit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div>
          Showing {sortedRows.length ? startIndex + 1 : 0} to{' '}
          {Math.min(startIndex + rowsPerPage, sortedRows.length)} of {sortedRows.length} entries
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="px-2 font-mono font-medium text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
