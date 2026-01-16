
import { DiveLog } from '../types';

const SHEET_ID = '1Xn4HTnQ_i8YgqCD_jdNcO8odXTznGstFVNZzvnoVAX0';
const GID = '887794739'; 

export async function fetchDiveLogs(): Promise<DiveLog[]> {
  try {
    // Append a timestamp to the URL to prevent browser/CDN caching
    const cacheBuster = `&t=${Date.now()}`;
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}${cacheBuster}`;

    const response = await fetch(CSV_URL);

    if (!response.ok) {
      if (response.status === 404) throw new Error('Sheet not found.');
      if (response.status === 403 || response.status === 401) throw new Error('Access Denied. Ensure the Sheet is shared.');
      throw new Error(`Google Sheets error: ${response.status}`);
    }
    
    const text = await response.text();
    
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('Access Denied: The spreadsheet is not public.');
    }

    const rows = parseCSV(text);
    
    if (rows.length <= 1) return [];

    // Map rows to DiveLog objects (starting from row index 1 to skip headers)
    return rows.slice(1).map((row) => ({
      timestamp: row[0] || '',
      date: row[1] || '',
      pointName: row[2] || '',
      diveTime: row[3] || '',
      maxDepth: row[4] || '',
      avgDepth: row[5] || '',
      waterTemp: row[6] || '',
      visibility: row[7] || '',
      current: row[8] || '',
      waves: row[9] || '',
      guide: row[10] || '',
    })).filter(log => log.date && log.date.trim() !== '');
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') inQuotes = false;
      else currentField += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') {
        row.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        row.push(currentField);
        if (row.length > 0) result.push(row);
        row = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else currentField += char;
    }
  }
  if (row.length > 0 || currentField !== '') {
    row.push(currentField);
    result.push(row);
  }
  return result;
}
