export interface FinancialRecord {
  Source: string;
  Category: string;
  Month: string;
  Year: string | number;
  Cluster: string;
  'Business Units': string;
  Revenue: number;
  Cost: number;
  Profit: number;
}

export interface JobCardRecord {
  'Transaction Date': string | number | Date;
  Service: string;
  'Company name': string;
  Date: string | number | Date;
  Plate: string;
  'JOBCARD NO:': string;
  'Material code': string;
  Description: string;
  Price: number;
  QTY: number;
  'Total amount': number;
  'Total amount w Percntage': number;
  Profit: number;
}

export interface FilterState {
  year: string;
  month: string;
  cluster: string;
  businessUnit: string;
  category: string;
  source: string;
}

export interface KpiSummary {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  activeUnits: number;
}

export interface StoredFileMeta {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  powerBiRows: number;
  jcRows: number;
  isSample: boolean;
  sheetNames?: string[];
  powerBiSheetName?: string;
  jcSheetName?: string;
}

export type ActiveTab = 'dashboard' | 'table' | 'jobcard';
