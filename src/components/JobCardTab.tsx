import React, { useState, useMemo, useEffect } from 'react';
import { JobCardRecord } from '../types';
import {
  cleanJob,
  cleanText,
  num,
  formatCurrency,
  dateDisplay,
  monthOnly,
  matchesJobCard,
  stripAlphanumeric,
  extractDigits
} from '../services/formatters';
import { exportJobCardToXLSX } from '../services/excel';
import { downloadJobCardPdf } from '../services/pdf';
import { ELEGANCIA_LOGO } from '../constants/logo';
import { Search, X, FileSpreadsheet, FileText, Printer, ToggleLeft, ToggleRight, AlertTriangle, Layers, Image as ImageIcon, RotateCcw } from 'lucide-react';

interface JobCardTabProps {
  jcData: JobCardRecord[];
  jcSheetName?: string;
  sheetNames?: string[];
}

export const JobCardTab: React.FC<JobCardTabProps> = ({ jcData, jcSheetName, sheetNames }) => {
  const [jobInput, setJobInput] = useState('');
  const [selectedRows, setSelectedRows] = useState<JobCardRecord[]>([]);
  const [searchedId, setSearchedId] = useState<string>('');
  const [showProfit, setShowProfit] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [customLogo, setCustomLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('elegancia_custom_logo') || '';
    } catch {
      return '';
    }
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomLogo(reader.result);
          try {
            localStorage.setItem('elegancia_custom_logo', reader.result);
          } catch {
            // storage quota full
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setCustomLogo('');
    try {
      localStorage.removeItem('elegancia_custom_logo');
    } catch {
      // ignore
    }
  };

  // List of all unique Job Card numbers present in the loaded dataset
  const uniqueJobCards = useMemo(() => {
    const set = new Set<string>();
    jcData.forEach((r) => {
      const c = cleanJob(r['JOBCARD NO:']);
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [jcData]);

  // Execute search using intelligent multi-tier matching
  const executeSearch = (targetQuery: string) => {
    const q = cleanJob(targetQuery);
    if (!q) {
      setSearchedId('');
      setSelectedRows([]);
      return;
    }

    // 1. Exact match
    let matches = jcData.filter((r) => cleanJob(r['JOBCARD NO:']) === q);

    // 2. Alphanumeric match (ignoring dashes, spaces, slashes)
    if (matches.length === 0) {
      const qAlpha = stripAlphanumeric(q);
      matches = jcData.filter((r) => stripAlphanumeric(r['JOBCARD NO:']) === qAlpha);
    }

    // 3. Digits match if query contains digits
    if (matches.length === 0) {
      const qDigits = extractDigits(q);
      if (qDigits.length >= 3) {
        matches = jcData.filter((r) => {
          const rDigits = extractDigits(r['JOBCARD NO:']);
          return rDigits === qDigits || rDigits.endsWith(qDigits) || qDigits.endsWith(rDigits);
        });
      }
    }

    // 4. Intelligent helper matching
    if (matches.length === 0) {
      matches = jcData.filter((r) => matchesJobCard(r['JOBCARD NO:'], q));
    }

    setSearchedId(q);
    setSelectedRows(matches);
  };

  const handleSearch = () => {
    executeSearch(jobInput);
  };

  const handleSelectCard = (cardNo: string) => {
    setJobInput(cardNo);
    executeSearch(cardNo);
  };

  const handleClear = () => {
    setJobInput('');
    setSearchedId('');
    setSelectedRows([]);
  };

  // Auto-select initial Job Card if none selected yet and cards exist
  useEffect(() => {
    if (selectedRows.length === 0 && uniqueJobCards.length > 0 && !searchedId) {
      // Prioritize 83263 if available, otherwise pick the first one
      const target = uniqueJobCards.includes('83263') ? '83263' : uniqueJobCards[0];
      setJobInput(target);
      executeSearch(target);
    }
  }, [uniqueJobCards, selectedRows.length, searchedId]);

  // Find similar suggestions if searchedId was not found
  const suggestions = useMemo(() => {
    if (!searchedId || selectedRows.length > 0) return [];
    const qAlpha = stripAlphanumeric(searchedId);
    const qDigits = extractDigits(searchedId);
    return uniqueJobCards
      .filter((jc) => {
        const jcAlpha = stripAlphanumeric(jc);
        const jcDigits = extractDigits(jc);
        if (qDigits && jcDigits.includes(qDigits)) return true;
        if (qAlpha && (jcAlpha.includes(qAlpha) || qAlpha.includes(jcAlpha))) return true;
        return false;
      })
      .slice(0, 6);
  }, [searchedId, selectedRows.length, uniqueJobCards]);

  const handleExportXlsx = () => {
    if (!selectedRows.length) return;
    exportJobCardToXLSX(selectedRows, showProfit);
  };

  const handleDownloadPdf = async () => {
    if (!selectedRows.length) return;
    setIsExportingPdf(true);
    setPdfError(null);
    try {
      await downloadJobCardPdf('job-card-printable-content', searchedId);
    } catch (err) {
      console.error('PDF export failed:', err);
      setPdfError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!selectedRows.length) return;
    window.print();
  };

  const firstRow = selectedRows[0];
  const totalAmount = selectedRows.reduce((a, r) => a + num(r['Total amount']), 0);
  const totalWithPercentage = selectedRows.reduce((a, r) => a + num(r['Total amount w Percntage']), 0);
  const totalProfit = selectedRows.reduce((a, r) => a + num(r['Profit']), 0);

  return (
    <div className="space-y-6">
      {/* Search & Status Box */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Job Card Preview &amp; Export</h2>
            <p className="text-xs text-slate-400">
              Search by Job Card number (e.g. <strong className="text-sky-400">83263</strong>, <strong className="text-sky-400">JC-83263</strong>) to inspect the official company invoice.
            </p>
          </div>
          {jcSheetName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-sky-950/70 border border-sky-800 text-sky-300 self-start sm:self-auto">
              <Layers className="w-3.5 h-3.5" />
              Sheet: {jcSheetName}
            </span>
          )}
        </div>

        {/* Search input with native HTML datalist autocomplete */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-2xl mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-jobcard-search"
              type="text"
              list="jobcard-datalist"
              placeholder="e.g. 83263, JC-83263..."
              value={jobInput}
              onChange={(e) => setJobInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-sky-400 focus:outline-none"
            />
            {/* Datalist provides auto-suggestions as user types */}
            <datalist id="jobcard-datalist">
              {uniqueJobCards.map((id) => (
                <option key={id} value={id}>
                  Job Card #{id}
                </option>
              ))}
            </datalist>
          </div>

          <button
            id="btn-search-jobcard"
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Search Job Card
          </button>

          {jobInput && (
            <button
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Quick select chips for available Job Cards */}
        {uniqueJobCards.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1 font-medium">Available in sheet ({uniqueJobCards.length}):</span>
            {uniqueJobCards.slice(0, 10).map((id) => {
              const isSelected = cleanJob(searchedId) === cleanJob(id);
              return (
                <button
                  key={id}
                  onClick={() => handleSelectCard(id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  #{id}
                </button>
              );
            })}
            {uniqueJobCards.length > 10 && (
              <span className="text-slate-500 text-[11px] ml-1">+{uniqueJobCards.length - 10} more</span>
            )}
          </div>
        )}

        {/* Status and Diagnostics */}
        <div className="text-xs mt-3">
          {jcData.length === 0 ? (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-amber-300 flex items-start gap-2.5 mt-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">No Job Card records detected in the current file.</p>
                <p className="text-[11px] text-amber-400/90 mt-0.5">
                  Make sure your Excel workbook contains a sheet named <strong>JCDATA</strong> or <strong>JC DATA</strong> with columns for Job Card No, Description, Price, and Total.
                </p>
                {sheetNames && sheetNames.length > 0 && (
                  <p className="text-[11px] text-amber-200 mt-1 font-mono">
                    Sheets found in your workbook: {sheetNames.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ) : !searchedId ? (
            <span className="text-slate-500">No Job Card selected. Choose an available number above or search by ID.</span>
          ) : selectedRows.length > 0 ? (
            <span className="text-emerald-400 font-semibold">
              ✓ Found {selectedRows.length} item line(s) for Job Card #{cleanJob(firstRow?.['JOBCARD NO:'] || searchedId)}
            </span>
          ) : (
            <div className="space-y-2 mt-1">
              <span className="text-rose-400 font-semibold block">
                No matching detail records found for Job Card #{searchedId}.
              </span>
              {suggestions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-xs">Did you mean:</span>
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleSelectCard(sug)}
                      className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800 text-xs font-mono font-medium cursor-pointer"
                    >
                      #{sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar (Shown when job card is selected) */}
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-750 rounded-xl p-3.5 shadow-md">
          {/* Profit toggle */}
          <button
            onClick={() => setShowProfit(!showProfit)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-750 cursor-pointer"
          >
            {showProfit ? (
              <ToggleRight className="w-5 h-5 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-500" />
            )}
            <span>Show Profit Columns: <strong className={showProfit ? 'text-emerald-400' : 'text-slate-400'}>{showProfit ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* Export and logo buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Custom Logo Upload option */}
            <label
              title="Upload your company logo image"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>{customLogo ? 'Change Logo' : 'Upload Logo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>

            {customLogo && (
              <button
                onClick={handleResetLogo}
                title="Reset to official Elegancia Resources logo"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Logo</span>
              </button>
            )}

            <button
              id="btn-export-jobcard-xlsx"
              onClick={handleExportXlsx}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export XLSX
            </button>

            <button
              id="btn-download-jobcard-pdf"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>

            <button
              id="btn-print-jobcard"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      )}

      {/* PDF Error Notification */}
      {pdfError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Could not generate PDF: {pdfError}</span>
          </div>
          <button
            onClick={() => setPdfError(null)}
            className="text-rose-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Official Job Card Document Preview */}
      {selectedRows.length > 0 && firstRow && (
        <div className="bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800 overflow-x-auto">
          <div
            id="job-card-printable-content"
            className="w-full max-w-4xl mx-auto bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-300 font-sans text-xs"
          >
            {/* Header with official Elegancia Resources logo */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-b-2 border-slate-900 bg-white">
              <div className="flex items-center">
                <img
                  src={customLogo || ELEGANCIA_LOGO}
                  alt="Elegancia Resources"
                  className="h-12 sm:h-14 md:h-16 w-auto max-w-[280px] sm:max-w-[340px] object-contain"
                />
              </div>
              <div className="text-center sm:text-right">
                <h2 className="text-sm sm:text-base font-black tracking-wide text-slate-900 uppercase">
                  Automotive &amp; Commercial Equipment Division
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Fleet Maintenance &amp; Technical Services</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Official Service Invoice &amp; Work Order</p>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-slate-100 px-5 py-3 border-b border-slate-300 flex items-center justify-between">
              <span className="text-sm font-black tracking-wider text-slate-800">OFFICIAL JOB CARD PREVIEW</span>
              <span className="text-xs font-mono font-bold text-sky-700">JOB CARD #{cleanJob(firstRow['JOBCARD NO:'])}</span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-b border-slate-300 text-xs">
              <div className="p-3 border-r border-b sm:border-b-0 border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Transaction Month</div>
                <div className="font-bold text-slate-800 mt-0.5">{monthOnly(firstRow['Transaction Date'] || firstRow['Date']) || 'N/A'}</div>
              </div>
              <div className="p-3 border-r border-b sm:border-b-0 border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Service / Cluster</div>
                <div className="font-bold text-slate-800 mt-0.5">{cleanText(firstRow['Service']) || 'N/A'}</div>
              </div>
              <div className="p-3 border-b sm:border-b-0 border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Company Name / BU</div>
                <div className="font-bold text-slate-800 mt-0.5">{cleanText(firstRow['Company name']) || 'N/A'}</div>
              </div>
              <div className="p-3 border-r border-t sm:border-t-0 border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Transaction Date</div>
                <div className="font-bold text-slate-800 mt-0.5 font-mono">{dateDisplay(firstRow['Date'] || firstRow['Transaction Date']) || 'N/A'}</div>
              </div>
              <div className="p-3 border-r border-t sm:border-t-0 border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Vehicle / Equipment Plate</div>
                <div className="font-bold text-slate-800 mt-0.5 font-mono">{cleanText(firstRow['Plate']) || 'N/A'}</div>
              </div>
              <div className="p-3 border-t sm:border-t-0 border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Job Card No.</div>
                <div className="font-bold text-sky-700 mt-0.5 font-mono">#{cleanJob(firstRow['JOBCARD NO:']) || 'N/A'}</div>
              </div>
            </div>

            {/* Line Items Detail Table */}
            <div className="p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[10.5px] uppercase">
                    <th className="p-2 border border-slate-900">Material Code</th>
                    <th className="p-2 border border-slate-900">Description</th>
                    <th className="p-2 border border-slate-900 text-right">Price</th>
                    <th className="p-2 border border-slate-900 text-right">QTY</th>
                    <th className="p-2 border border-slate-900 text-right">Total Amount</th>
                    <th className="p-2 border border-slate-900 text-right">Service%</th>
                    <th className="p-2 border border-slate-900 text-right">Total Amount w %</th>
                    {showProfit && (
                      <th className="p-2 border border-slate-900 text-right bg-slate-800">Profit</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {selectedRows.map((r, i) => {
                    const ta = num(r['Total amount']);
                    const tw = num(r['Total amount w Percntage']);
                    const servicePercent = ta ? ((tw - ta) / ta) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-medium text-slate-600 border border-slate-200 whitespace-nowrap">
                          {r['Material code'] || '–'}
                        </td>
                        <td className="p-2 font-medium border border-slate-200">
                          {r['Description'] || 'General Service Item'}
                        </td>
                        <td className="p-2 font-mono text-right border border-slate-200 whitespace-nowrap">
                          {formatCurrency(r['Price'])}
                        </td>
                        <td className="p-2 font-mono text-right border border-slate-200">
                          {r['QTY']}
                        </td>
                        <td className="p-2 font-mono text-right font-semibold border border-slate-200 whitespace-nowrap">
                          {formatCurrency(ta)}
                        </td>
                        <td className="p-2 font-mono text-right font-bold text-sky-700 border border-slate-200">
                          {servicePercent.toFixed(2)}%
                        </td>
                        <td className="p-2 font-mono text-right font-bold border border-slate-200 whitespace-nowrap">
                          {formatCurrency(tw)}
                        </td>
                        {showProfit && (
                          <td className={`p-2 font-mono text-right font-bold border border-slate-200 whitespace-nowrap ${num(r['Profit']) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {formatCurrency(r['Profit'])}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Total Summary Box */}
              <div className="mt-4 flex justify-end">
                <div className="w-full sm:w-96 border-t-2 border-slate-900 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-700 py-0.5">
                    <span>TOTAL AMOUNT:</span>
                    <span className="font-mono text-slate-900">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-800 py-0.5 border-t border-slate-200">
                    <span>TOTAL AMOUNT W PERCENTAGE:</span>
                    <span className="font-mono text-slate-900">{formatCurrency(totalWithPercentage)}</span>
                  </div>
                  {showProfit && (
                    <div className="flex justify-between font-black py-0.5 border-t border-slate-200 text-emerald-700">
                      <span>TOTAL PROFIT:</span>
                      <span className="font-mono">{formatCurrency(totalProfit)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Signatures Area */}
            <div className="border-t border-slate-300 p-4 bg-slate-50 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <span className="font-semibold text-slate-700">Prepared By:</span> _____________________
              </div>
              <div>
                <span className="font-semibold text-slate-700">Customer Signature:</span> _____________________
              </div>
              <div>
                <span className="font-semibold text-slate-700">Authorized Signatory:</span> _____________________
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
