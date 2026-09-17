import * as XLSX from 'xlsx';
import { FinancialRecord, JobCardRecord } from '../types';
import { cleanText, cleanJob, normalizeMonth, num, monthOnly, dateDisplay, stripAlphanumeric } from './formatters';

function keyNorm(v: unknown): string {
  return cleanText(v).replace(/[^A-Z0-9]/g, '');
}

function getField(row: Record<string, unknown>, names: string[]): unknown {
  const wanted = names.map(keyNorm);
  const keys = Object.keys(row);
  
  // 1. Exact match of normalized key
  const matched = keys.find((k) => wanted.includes(keyNorm(k)));
  if (matched !== undefined && row[matched] !== undefined && String(row[matched]).trim() !== '') {
    return row[matched];
  }

  // 2. Substring or keyword match
  const matchedSub = keys.find((k) => {
    const kn = keyNorm(k);
    return wanted.some((w) => kn === w || (w.length >= 4 && kn.includes(w)));
  });
  if (matchedSub !== undefined && row[matchedSub] !== undefined && String(row[matchedSub]).trim() !== '') {
    return row[matchedSub];
  }

  return undefined;
}

export function mapDashboardRow(r: Record<string, unknown>): FinancialRecord {
  const rev = num(getField(r, ['Revenue', 'REVENUE', 'Total Revenue', 'Sales', 'Gross Revenue']));
  const cost = num(getField(r, ['Cost', 'COST', 'Total Cost', 'Expense', 'Expenses']));
  const p = getField(r, ['Profit', 'PROFIT', 'Net Profit', 'Margin']);
  return {
    Source: cleanText(getField(r, ['Source', 'Channel', 'Origin'])) || 'DIRECT',
    Category: cleanText(getField(r, ['Category', 'Type', 'Service Type', 'Sector'])) || 'GENERAL',
    Month: normalizeMonth(getField(r, ['Month', 'Timeline Month', 'Posting Month', 'Trx Month'])) || 'JAN',
    Year: cleanText(getField(r, ['Year', 'Timeline Year', 'Posting Year', 'Trx Year'])) || '2026',
    Cluster: cleanText(getField(r, ['Cluster', 'Service', 'Division', 'Dept', 'Department', 'Region'])) || 'GENERAL',
    'Business Units': cleanText(getField(r, ['Business Units', 'Business Unit', 'BusinessUnits', 'Company Name', 'CompanyName', 'Company', 'Customer', 'Client'])) || 'GENERAL BU',
    Revenue: rev,
    Cost: cost,
    Profit: p === undefined ? rev - cost : num(p)
  };
}

export function mapJCRow(r: Record<string, unknown>): JobCardRecord {
  // Comprehensive aliases for Job Card number
  const jcNoVal = getField(r, [
    'JOBCARD NO:', 'JOBCARD NO.', 'JOBCARD NO', 'JOBCARDNO',
    'JOB CARD NO:', 'JOB CARD NO.', 'JOB CARD NO', 'JOB CARD',
    'JOBCARD', 'JOB CARD #', 'JOBCARD #', 'JOB CARD NUMBER',
    'JOBCARD NUMBER', 'JOB NO', 'JOB NO.', 'JOB #', 'JOB NUMBER',
    'JC NO', 'JC NO.', 'JC NUMBER', 'JC #', 'JC',
    'JOBCARDID', 'JOB CARD ID', 'JOB ID', 'JOB',
    'CARD NO', 'CARD NO.', 'CARD #'
  ]);

  // Fallback check: any key in row containing JOBCARD, JCNO, JOBNO, or CARDNO
  let finalJcNo = cleanJob(jcNoVal);
  if (!finalJcNo) {
    const keys = Object.keys(r);
    const fallbackKey = keys.find((k) => {
      const kn = keyNorm(k);
      return kn.includes('JOBCARD') || (kn.includes('JC') && kn.includes('NO')) || (kn.includes('JOB') && kn.includes('NO'));
    });
    if (fallbackKey && r[fallbackKey]) {
      finalJcNo = cleanJob(r[fallbackKey]);
    }
  }

  const price = num(getField(r, ['Price', 'Unit Price', 'UnitPrice', 'Rate', 'Cost', 'Unit Cost']));
  const qty = num(getField(r, ['QTY', 'Quantity', 'Qty', 'Units', 'Count', 'Volume'])) || 1;
  let totalAmount = num(getField(r, ['Total amount', 'Total Amount', 'TotalAmount', 'Amount', 'Gross Amount', 'Total']));
  if (!totalAmount && price && qty) {
    totalAmount = price * qty;
  }

  let totalWithPercentage = num(getField(r, [
    'Total amount w Percntage', 'Total Amount w Percntage', 'Total Amount with Percentage',
    'Total Amount w Percentage', 'Total Amount with Markup', 'Total Amount w/ %',
    'Total Amount w/ Percentage', 'Total with Percentage', 'Total w Percentage',
    'Net Amount', 'Total (with %)', 'Total w/ %'
  ]));

  let profit = num(getField(r, ['Profit', 'Net Profit', 'Margin', 'Profit Amount', 'Markup']));

  // Fallback calculations for profit and marked-up totals
  if (!totalWithPercentage && totalAmount && profit) {
    totalWithPercentage = totalAmount + profit;
  } else if (!totalWithPercentage) {
    totalWithPercentage = totalAmount;
  }

  if (!profit && totalWithPercentage > totalAmount) {
    profit = totalWithPercentage - totalAmount;
  }

  return {
    'Transaction Date': (getField(r, ['Transaction Date', 'TransactionDate', 'Trx Date', 'Txn Date', 'Posting Date', 'Date']) as string) ?? '',
    Service: cleanText(getField(r, ['Service', 'Cluster', 'Service Name', 'ServiceName', 'Department', 'Dept', 'Service/Cluster', 'Service / Cluster', 'Category'])) || '',
    'Company name': cleanText(getField(r, ['Company name', 'Company Name', 'CompanyName', 'Business Unit', 'Business Units', 'BusinessUnit', 'Customer', 'Client', 'BU', 'Company'])) || '',
    Date: (getField(r, ['Date', 'Job Date', 'JobDate', 'Doc Date', 'Created Date', 'Invoice Date', 'Transaction Date']) as string) ?? '',
    Plate: cleanText(getField(r, ['Plate', 'Plate No', 'Plate No.', 'Plate Number', 'PlateNo', 'Vehicle', 'Vehicle No', 'Equipment', 'Reg No', 'Plate#', 'Asset'])) || '',
    'JOBCARD NO:': finalJcNo,
    'Material code': cleanText(getField(r, ['Material code', 'Material Code', 'MaterialCode', 'Item Code', 'ItemCode', 'Part Number', 'Part No', 'PartNo', 'Item', 'Code', 'Part#', 'Item#'])) || '',
    Description: cleanText(getField(r, ['Description', 'Material Description', 'Item Description', 'Desc', 'Details', 'Particulars', 'Item Name', 'Service Description', 'Item'])) || '',
    Price: price,
    QTY: qty,
    'Total amount': totalAmount,
    'Total amount w Percntage': totalWithPercentage,
    Profit: profit
  };
}

/**
 * Scans the first 15 rows of a sheet to detect the real header row index.
 * Handles Excel files with title headers, metadata banners, or empty initial rows.
 */
function findHeaderRowIndex(ws: XLSX.WorkSheet, keywords: string[]): number {
  const normKeywords = keywords.map(keyNorm);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
  let bestIndex = 0;
  let bestScore = 0;

  const maxRows = Math.min(rows.length, 15);
  for (let i = 0; i < maxRows; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    let score = 0;
    for (const cell of row) {
      const cellNorm = keyNorm(cell);
      if (!cellNorm) continue;
      if (normKeywords.some((k) => cellNorm === k || (k.length >= 4 && cellNorm.includes(k)))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

const DASHBOARD_KEYWORDS = ['REVENUE', 'COST', 'PROFIT', 'CLUSTER', 'CATEGORY', 'SOURCE', 'BUSINESS', 'MONTH', 'YEAR'];
const JC_KEYWORDS = ['JOBCARD', 'JOB', 'CARD', 'JC', 'PLATE', 'MATERIAL', 'DESCRIPTION', 'QTY', 'AMOUNT', 'PRICE', 'SERVICE', 'PERCENTAGE'];

export interface ParsedWorkbookResult {
  rawData: FinancialRecord[];
  jcData: JobCardRecord[];
  sheetNames: string[];
  powerBiSheetName?: string;
  jcSheetName?: string;
}

export async function parseExcelFile(file: File): Promise<ParsedWorkbookResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });

  const sheetNames = wb.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    return { rawData: [], jcData: [], sheetNames: [] };
  }

  // Helper to match sheet name variants
  const findSheet = (targets: string[]): string | undefined => {
    const normalizedTargets = targets.map(keyNorm);
    // 1. Exact normalized match
    for (const name of sheetNames) {
      if (normalizedTargets.includes(keyNorm(name))) return name;
    }
    // 2. Substring match
    for (const name of sheetNames) {
      const k = keyNorm(name);
      if (normalizedTargets.some((t) => k.includes(t) || (t.length >= 4 && t.includes(k)))) return name;
    }
    return undefined;
  };

  let pName = findSheet(['POWERBI_DATA', 'POWERBIDATA', 'POWERBI', 'DASHBOARD_DATA', 'DASHBOARDDATA', 'DASHBOARD', 'FINANCIALS', 'FINANCIAL_DATA', 'DATA']);
  let jcName = findSheet(['JCDATA', 'JC_DATA', 'JC-DATA', 'JC DATA', 'JOB CARD DATA', 'JOBCARD DATA', 'JOBCARDDATA', 'JOB_CARD_DATA', 'JOB CARD', 'JOB CARDS', 'JOBCARD', 'JOBCARDS', 'JC', 'JOB_CARD']);

  // If either sheet is still unidentified, inspect content heuristics of each sheet
  if (!pName || !jcName) {
    const sheetScores: { name: string; dashScore: number; jcScore: number }[] = [];

    for (const name of sheetNames) {
      const ws = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
      let dashScore = 0;
      let jcScore = 0;

      const maxRows = Math.min(rows.length, 10);
      for (let i = 0; i < maxRows; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          const c = keyNorm(cell);
          if (!c) continue;
          if (DASHBOARD_KEYWORDS.some((k) => c === k || (k.length >= 4 && c.includes(k)))) dashScore++;
          if (JC_KEYWORDS.some((k) => c === k || (k.length >= 4 && c.includes(k)))) jcScore++;
        }
      }
      sheetScores.push({ name, dashScore, jcScore });
    }

    if (!jcName) {
      const candidate = sheetScores.slice().sort((a, b) => b.jcScore - a.jcScore)[0];
      if (candidate && candidate.jcScore >= 2 && candidate.name !== pName) {
        jcName = candidate.name;
      }
    }

    if (!pName) {
      const candidate = sheetScores.slice().sort((a, b) => b.dashScore - a.dashScore)[0];
      if (candidate && candidate.dashScore >= 2 && candidate.name !== jcName) {
        pName = candidate.name;
      }
    }

    // If 2 sheets exist and one is identified, assign the other
    if (sheetNames.length === 2) {
      if (pName && !jcName) {
        jcName = sheetNames.find((s) => s !== pName);
      } else if (jcName && !pName) {
        pName = sheetNames.find((s) => s !== jcName);
      }
    }
  }

  // Parse Job Card data
  let jcData: JobCardRecord[] = [];
  if (jcName) {
    const ws = wb.Sheets[jcName];
    const headerRow = findHeaderRowIndex(ws, JC_KEYWORDS);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: headerRow, defval: '' });
    jcData = rows
      .map(mapJCRow)
      .filter((r) => r['JOBCARD NO:'] !== '' || r.Description !== '' || r.Plate !== '');
  }

  // Parse Dashboard / PowerBI data
  let rawData: FinancialRecord[] = [];
  if (pName) {
    const ws = wb.Sheets[pName];
    const headerRow = findHeaderRowIndex(ws, DASHBOARD_KEYWORDS);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: headerRow, defval: '' });
    rawData = rows
      .map(mapDashboardRow)
      .filter((r) => r.Revenue !== 0 || r.Cost !== 0 || (r.Cluster !== 'UNKNOWN' && r.Source !== 'UNKNOWN'));
  } else if (sheetNames.length === 1 && jcData.length === 0) {
    // Single sheet workbook fallback
    const ws = wb.Sheets[sheetNames[0]];
    const headerRow = findHeaderRowIndex(ws, DASHBOARD_KEYWORDS);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: headerRow, defval: '' });
    rawData = rows
      .map(mapDashboardRow)
      .filter((r) => r.Revenue !== 0 || r.Cost !== 0);
  }

  // If only Job Card sheet was uploaded, synthesize dashboard records from JC data so analytics tab works
  if (rawData.length === 0 && jcData.length > 0) {
    const aggMap = new Map<string, FinancialRecord>();
    for (const r of jcData) {
      const month = monthOnly(r['Transaction Date'] || r.Date) || 'JAN';
      const cluster = r.Service || 'FLEET';
      const bu = r['Company name'] || 'OPERATIONS';
      const key = `${month}_${cluster}_${bu}`;
      const rev = num(r['Total amount w Percntage']) || num(r['Total amount']);
      const profit = num(r.Profit);
      const cost = Math.max(0, rev - profit);

      if (!aggMap.has(key)) {
        aggMap.set(key, {
          Source: 'JOB_CARD',
          Category: cluster,
          Month: month,
          Year: 2026,
          Cluster: cluster,
          'Business Units': bu,
          Revenue: rev,
          Cost: cost,
          Profit: profit
        });
      } else {
        const item = aggMap.get(key)!;
        item.Revenue += rev;
        item.Cost += cost;
        item.Profit += profit;
      }
    }
    rawData = Array.from(aggMap.values());
  }

  return {
    rawData,
    jcData,
    sheetNames,
    powerBiSheetName: pName,
    jcSheetName: jcName
  };
}

export function exportJobCardToXLSX(rows: JobCardRecord[], showProfit: boolean = false): void {
  if (!rows || rows.length === 0) return;
  const f = rows[0];
  const totalAmount = rows.reduce((a, r) => a + num(r['Total amount']), 0);
  const totalPercentage = rows.reduce((a, r) => a + num(r['Total amount w Percntage']), 0);
  const totalProfit = rows.reduce((a, r) => a + num(r['Profit']), 0);

  const headers = ['Material code', 'Description', 'Price', 'QTY', 'Total amount', 'Service%', 'Total amount w Percntage'];
  if (showProfit) {
    headers.push('Profit');
  }

  const aoa: (string | number)[][] = [
    ['ELEGANCIA RESOURCES'],
    ['JOB CARD PREVIEW'],
    ['Transaction Month', monthOnly(f['Transaction Date']), 'Service / Cluster', f['Service'], 'Company Name / Business Unit', f['Company name']],
    ['Date', dateDisplay(f['Date']), 'Plate', f['Plate'], 'JOBCARD NO:', f['JOBCARD NO:']],
    [],
    headers
  ];

  rows.forEach((r) => {
    const ta = num(r['Total amount']);
    const tw = num(r['Total amount w Percntage']);
    const servicePercent = ta ? ((tw - ta) / ta) * 100 : 0;
    const rowData: (string | number)[] = [
      r['Material code'],
      r['Description'],
      r['Price'],
      r['QTY'],
      ta,
      `${servicePercent.toFixed(2)}%`,
      tw
    ];
    if (showProfit) {
      rowData.push(r['Profit']);
    }
    aoa.push(rowData);
  });

  aoa.push([]);
  if (showProfit) {
    aoa.push(['TOTAL', '', '', '', totalAmount, '', totalPercentage, totalProfit]);
  } else {
    aoa.push(['TOTAL', '', '', '', totalAmount, '', totalPercentage]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const cols = [{ wch: 18 }, { wch: 42 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 25 }];
  if (showProfit) {
    cols.push({ wch: 16 });
  }
  ws['!cols'] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Job Card');
  XLSX.writeFile(wb, `JobCard_${cleanJob(f['JOBCARD NO:']) || 'Export'}.xlsx`);
}
