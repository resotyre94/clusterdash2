import { FinancialRecord, JobCardRecord } from '../types';

export const SAMPLE_DATA: FinancialRecord[] = [
  { Source: 'DIRECT', Category: 'TECH', Month: 'JAN', Year: 2026, Cluster: 'NORTH', 'Business Units': 'BU-ALPHA', Revenue: 150000, Cost: 90000, Profit: 60000 },
  { Source: 'PARTNER', Category: 'TECH', Month: 'FEB', Year: 2026, Cluster: 'NORTH', 'Business Units': 'BU-BETA', Revenue: 180000, Cost: 110000, Profit: 70000 },
  { Source: 'DIRECT', Category: 'SERVICES', Month: 'JAN', Year: 2026, Cluster: 'SOUTH', 'Business Units': 'BU-GAMMA', Revenue: 120000, Cost: 70000, Profit: 50000 },
  { Source: 'ONLINE', Category: 'RETAIL', Month: 'MAR', Year: 2026, Cluster: 'EAST', 'Business Units': 'BU-DELTA', Revenue: 210000, Cost: 140000, Profit: 70000 },
  { Source: 'PARTNER', Category: 'SERVICES', Month: 'FEB', Year: 2026, Cluster: 'WEST', 'Business Units': 'BU-EPSILON', Revenue: 95000, Cost: 60000, Profit: 35000 },
  { Source: 'DIRECT', Category: 'RETAIL', Month: 'MAR', Year: 2026, Cluster: 'NORTH', 'Business Units': 'BU-ALPHA', Revenue: 230000, Cost: 130000, Profit: 100000 },
  { Source: 'ONLINE', Category: 'TECH', Month: 'APR', Year: 2026, Cluster: 'SOUTH', 'Business Units': 'BU-BETA', Revenue: 175000, Cost: 95000, Profit: 80000 }
];

export const SAMPLE_JC_DATA: JobCardRecord[] = [
  {
    'Transaction Date': '2026-03-15',
    Service: 'LIGHT VEHICLES',
    'Company name': 'ELEGANCIA CONT. & TRADING',
    Date: '2026-03-15',
    Plate: '74120',
    'JOBCARD NO:': '83263',
    'Material code': 'FLTR-OIL-01',
    Description: 'Engine Oil Filter Replacement & Synthetic Lube 5W-30',
    Price: 185,
    QTY: 2,
    'Total amount': 370,
    'Total amount w Percntage': 444,
    Profit: 74
  },
  {
    'Transaction Date': '2026-03-15',
    Service: 'LIGHT VEHICLES',
    'Company name': 'ELEGANCIA CONT. & TRADING',
    Date: '2026-03-15',
    Plate: '74120',
    'JOBCARD NO:': '83263',
    'Material code': 'BRK-PAD-FR',
    Description: 'Front Brake Pad Kit OEM Heavy Duty Ceramic',
    Price: 420,
    QTY: 1,
    'Total amount': 420,
    'Total amount w Percntage': 504,
    Profit: 84
  },
  {
    'Transaction Date': '2026-03-15',
    Service: 'LIGHT VEHICLES',
    'Company name': 'ELEGANCIA CONT. & TRADING',
    Date: '2026-03-15',
    Plate: '74120',
    'JOBCARD NO:': '83263',
    'Material code': 'SRV-LABOR-03',
    Description: 'Scheduled 40,000 KM Maintenance & Safety Inspection Labor',
    Price: 350,
    QTY: 1,
    'Total amount': 350,
    'Total amount w Percntage': 420,
    Profit: 70
  },
  {
    'Transaction Date': '2026-03-12',
    Service: 'HEAVY EQUIPMENT',
    'Company name': 'ELEGANCIA LANDSCAPE',
    Date: '2026-03-12',
    Plate: '98451',
    'JOBCARD NO:': '83264',
    'Material code': 'HYD-PUMP-HD',
    Description: 'Hydraulic Seal Overhaul & Pressure Valve Calibration',
    Price: 1250,
    QTY: 1,
    'Total amount': 1250,
    'Total amount w Percntage': 1500,
    Profit: 250
  },
  {
    'Transaction Date': '2026-03-10',
    Service: 'COMMERCIAL FLEET',
    'Company name': 'ELEGANCIA HOSPITALITY',
    Date: '2026-03-10',
    Plate: '51204',
    'JOBCARD NO:': '83265',
    'Material code': 'TYRE-MIC-225',
    Description: 'Commercial Tubeless Radial Tyre 225/75R16 with Computerized Balancing',
    Price: 580,
    QTY: 4,
    'Total amount': 2320,
    'Total amount w Percntage': 2784,
    Profit: 464
  },
  {
    'Transaction Date': '2026-03-08',
    Service: 'HEAVY VEHICLES',
    'Company name': 'ELEGANCIA MEP',
    Date: '2026-03-08',
    Plate: '63382',
    'JOBCARD NO:': '83266',
    'Material code': 'BAT-EXIDE-150',
    Description: 'Heavy Commercial Battery 12V 150Ah Maintenance-Free',
    Price: 650,
    QTY: 2,
    'Total amount': 1300,
    'Total amount w Percntage': 1560,
    Profit: 260
  }
];

export const MONTH_ORDER: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
};

// Official Elegancia Resources logo matching brand identity
export const ELEGANCIA_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 96" width="460" height="96">
  <!-- Brand Red Triangle Mark -->
  <polygon points="12,20 38,46 12,72" fill="#e30613" />
  
  <!-- "elegancia" wordmark (lowercase bold black) -->
  <text x="46" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="46" fill="#000000" letter-spacing="-1.2">elegancia</text>
  
  <!-- "resources" wordmark (lowercase bold red, aligned under right portion of elegancia) -->
  <text x="138" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="26" fill="#e30613" letter-spacing="-0.2">resources</text>
  
  <!-- Vertical Divider Separator Bar -->
  <line x1="288" y1="16" x2="288" y2="88" stroke="#262626" stroke-width="2.4" stroke-linecap="round" />
  
  <!-- Corporate Motto / Tagline -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="14.5" font-weight="500" fill="#525866" letter-spacing="0.1">
    <text x="302" y="37">Accountable,</text>
    <text x="302" y="58">Professional</text>
    <text x="302" y="79">and Skilled</text>
  </g>
</svg>
`);
