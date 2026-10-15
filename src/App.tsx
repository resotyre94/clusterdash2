import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FinancialRecord, JobCardRecord, FilterState, StoredFileMeta, ActiveTab, KpiSummary } from './types';
import { SAMPLE_DATA } from './constants/logo';
import { cleanText, normalizeMonth, num } from './services/formatters';
import { saveUploadedData, loadSavedData, clearSavedData, StoredPayload } from './services/storage';
import { loadCloudDataset, saveCloudDataset } from './services/cloudStorage';
import { parseExcelFile } from './services/excel';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { DataTableTab } from './components/DataTableTab';
import { JobCardTab } from './components/JobCardTab';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const INITIAL_FILTER: FilterState = {
  year: 'All',
  month: 'All',
  cluster: 'All',
  businessUnit: 'All',
  category: 'All',
  source: 'All'
};

const DEFAULT_META: StoredFileMeta = {
  fileName: 'Sample Dataset',
  fileSize: 0,
  uploadedAt: new Date().toISOString(),
  powerBiRows: SAMPLE_DATA.length,
  jcRows: 0,
  isSample: true
};

export default function App() {
  const [rawData, setRawData] = useState<FinancialRecord[]>(SAMPLE_DATA);
  const [jcData, setJcData] = useState<JobCardRecord[]>([]);
  const [meta, setMeta] = useState<StoredFileMeta>(DEFAULT_META);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // The cloud is authoritative across devices; IndexedDB is a local offline cache.
  useEffect(() => {
    let cancelled = false;

    async function initStorage() {
      try {
        let cloudDataset: StoredPayload | null = null;
        try {
          cloudDataset = await loadCloudDataset();
        } catch (error) {
          console.warn('Shared dataset could not be reached; checking local cache.', error);
        }

        if (cancelled) return;
        if (cloudDataset && cloudDataset.rawData.length + cloudDataset.jcData.length > 0) {
          setRawData(cloudDataset.rawData);
          setJcData(cloudDataset.jcData || []);
          setMeta(cloudDataset.meta);
          setFilters(INITIAL_FILTER);
          try {
            await saveUploadedData(cloudDataset);
          } catch (error) {
            console.warn('Could not refresh local dataset cache.', error);
          }
          showToast(`Loaded shared dataset "${cloudDataset.meta.fileName}"`, 'info');
          return;
        }

        const saved = await loadSavedData();
        if (cancelled) return;
        if (saved && saved.rawData && saved.rawData.length > 0) {
          setRawData(saved.rawData);
          setJcData(saved.jcData || []);
          setMeta(saved.meta);
          showToast(`Loaded local cached file "${saved.meta.fileName}"`, 'info');
        }
      } catch (error) {
        console.error('Failed loading saved dataset', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initStorage();
    return () => { cancelled = true; };
  }, [showToast]);

  // A replacement becomes active only after it has been published centrally.
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const { rawData: parsedRaw, jcData: parsedJc } = await parseExcelFile(file);
      if (parsedRaw.length === 0 && parsedJc.length === 0) {
        throw new Error('No valid records found in the uploaded workbook.');
      }

      const newMeta: StoredFileMeta = {
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        powerBiRows: parsedRaw.length,
        jcRows: parsedJc.length,
        isSample: false
      };
      const payload: StoredPayload = { meta: newMeta, rawData: parsedRaw, jcData: parsedJc };

      await saveCloudDataset(payload);
      await saveUploadedData(payload);
      setRawData(parsedRaw);
      setJcData(parsedJc);
      setMeta(newMeta);
      setFilters(INITIAL_FILTER);
      showToast(`Published "${file.name}" to shared storage (${parsedRaw.length.toLocaleString()} dashboard rows).`);
    } catch (error) {
      console.error('File upload failed:', error);
      showToast(error instanceof Error ? error.message : 'Could not upload the Excel file.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Sample is local to this browser. The shared dataset remains published until another upload.
  const handleResetSample = async () => {
    setIsLoading(true);
    try {
      await clearSavedData();
      setRawData(SAMPLE_DATA);
      setJcData([]);
      setMeta(DEFAULT_META);
      setFilters(INITIAL_FILTER);
      showToast('Showing the sample dataset on this device. The shared dataset remains available to other devices.', 'info');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const filteredData = useMemo(() => {
    const y = filters.year;
    const m = filters.month;
    const cluster = filters.cluster;
    const bu = filters.businessUnit;
    const cat = filters.category;
    const src = filters.source;

    return rawData.filter((d) => {
      const matchYear = y === 'All' || String(d.Year) === y;
      const matchMonth = m === 'All' || normalizeMonth(d.Month) === normalizeMonth(m);
      const matchCluster = cluster === 'All' || cleanText(d.Cluster) === cleanText(cluster);
      const matchBu = bu === 'All' || cleanText(d['Business Units']) === cleanText(bu);
      const matchCat = cat === 'All' || cleanText(d.Category) === cleanText(cat);
      const matchSrc = src === 'All' || cleanText(d.Source) === cleanText(src);
      return matchYear && matchMonth && matchCluster && matchBu && matchCat && matchSrc;
    });
  }, [rawData, filters]);

  const kpis = useMemo<KpiSummary>(() => {
    const rev = filteredData.reduce((a, d) => a + num(d.Revenue), 0);
    const cost = filteredData.reduce((a, d) => a + num(d.Cost), 0);
    const profit = filteredData.reduce((a, d) => a + num(d.Profit), 0);
    const margin = rev > 0 ? (profit / rev) * 100 : 0;
    const activeUnits = new Set(filteredData.map((d) => cleanText(d['Business Units'])).filter(Boolean)).size;
    return { revenue: rev, cost, profit, margin, activeUnits };
  }, [filteredData]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && /\.(xlsx|xls|xlsm|csv)$/i.test(file.name)) void handleFileUpload(file);
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white"
    >
      <Header
        meta={meta}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFileUpload={handleFileUpload}
        onResetSample={handleResetSample}
        isLoading={isLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-12">
        {activeTab === 'dashboard' && (
          <DashboardTab rawData={rawData} filteredData={filteredData} filters={filters} onFilterChange={handleFilterChange} kpis={kpis} />
        )}
        {activeTab === 'table' && <DataTableTab filteredData={filteredData} />}
        {activeTab === 'jobcard' && (
          <JobCardTab jcData={jcData} jcSheetName={meta?.jcSheetName} sheetNames={meta?.sheetNames} />
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in shadow-2xl">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold">
            {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
