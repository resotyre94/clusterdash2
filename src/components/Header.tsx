import React, { useRef } from 'react';
import { StoredFileMeta, ActiveTab } from '../types';
import { Upload, RotateCcw, Database, BarChart3, Table, ReceiptText } from 'lucide-react';

interface HeaderProps {
  meta: StoredFileMeta;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onFileUpload: (file: File) => void;
  onResetSample: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  meta,
  activeTab,
  onTabChange,
  onFileUpload,
  onResetSample,
  isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="border-b border-slate-700/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30 pb-3 pt-3 px-4 sm:px-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div id="header-branding">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span className="inline-block w-0 h-0 border-y-[9px] border-y-transparent border-l-[14px] border-l-[#e30613] shrink-0" />
              <span className="text-white font-extrabold tracking-tight">elegancia</span>
              <span className="text-[#e30613] font-bold text-lg sm:text-xl tracking-tight">resources</span>
              <span className="text-slate-600 font-light text-base hidden sm:inline">|</span>
              <span className="text-slate-300 font-medium text-sm sm:text-base hidden sm:inline">Executive Dashboard</span>
            </h1>
            {!meta.isSample && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                <Database className="w-3 h-3" />
                Shared Cloud Data
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {meta.isSample ? (
              <span>Showing Sample Dataset | Financial Insights &amp; Job Card Preview</span>
            ) : (
              <>
                <span className="text-sky-300 font-medium">{meta.fileName}</span>
                <span className="text-slate-500">•</span>
                <span>PowerBI_Data: <strong className="text-white">{meta.powerBiRows.toLocaleString()}</strong> rows</span>
                <span className="text-slate-500">•</span>
                <span>JCData: <strong className="text-white">{meta.jcRows.toLocaleString()}</strong> rows</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-medium">Shared until the next upload</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {!meta.isSample && (
            <button
              id="btn-reset-sample"
              onClick={onResetSample}
              disabled={isLoading}
              title="Show the sample dataset on this device only; do not remove the shared dataset"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Reset Sample (This Device)
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.xlsm,.csv"
            className="hidden"
            id="excel-file-input"
          />

          <button
            id="btn-upload-file"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm hover:shadow-sky-500/25 border border-sky-400/40 transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isLoading ? 'Processing File...' : 'Upload Excel / CSV'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800 overflow-x-auto">
        <button
          id="tab-btn-dashboard"
          onClick={() => onTabChange('dashboard')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <BarChart3 className="w-4 h-4" />
          Visual Dashboard
        </button>
        <button
          id="tab-btn-table"
          onClick={() => onTabChange('table')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'table' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Table className="w-4 h-4" />
          Data Table
        </button>
        <button
          id="tab-btn-jobcard"
          onClick={() => onTabChange('jobcard')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'jobcard' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <ReceiptText className="w-4 h-4" />
          Job Card
        </button>
      </div>
    </header>
  );
};
