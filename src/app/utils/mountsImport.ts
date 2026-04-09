/**
 * Mount Import Utility
 * 
 * Utilities for importing mount data from Google Sheets (CSV/TSV format)
 */

import { Mount } from '../types';
import { parseCSV, csvToObjects, ImportResult } from './sheetsImport';

export interface GoogleSheetsMountRow {
  'MFG. PART': string;
  'Brand': string;
  'Maximum Load (lbs)': string;
  'Width (in)': string;
  'Height (in)': string;
  'Depth (in)': string;
  'Clearance needed around screen': string;
  'Alias': string;
}

/**
 * Parse a numeric dimension value from a string (e.g., "24.5", "24.5 in")
 */
function parseDimensionValue(value: string): number {
  const cleaned = value.trim();
  const numberMatch = cleaned.match(/[\d.]+/);
  if (!numberMatch) return 0;
  return parseFloat(numberMatch[0]) || 0;
}

/**
 * Import mounts from Google Sheets data
 */
export function importMountsFromGoogleSheets(csvText: string, delimiter: string = '\t'): ImportResult {
  const errors: string[] = [];
  const mounts: Partial<Mount>[] = [];

  try {
    const rows = parseCSV(csvText, delimiter);

    if (rows.length === 0) {
      return {
        success: false,
        errors: ['No data found in the file'],
        totalRows: 0,
        successfulRows: 0,
        failedRows: 0,
      };
    }

    const objects = csvToObjects<GoogleSheetsMountRow>(rows);

    if (objects.length === 0) {
      return {
        success: false,
        errors: ['No valid rows found after header'],
        totalRows: rows.length - 1,
        successfulRows: 0,
        failedRows: rows.length - 1,
      };
    }

    objects.forEach((row, index) => {
      try {
        const rowNumber = index + 2;

        // Validate required fields — Alias is required
        if (!row.Alias?.trim()) {
          errors.push(`Row ${rowNumber}: Alias is required`);
          return;
        }

        // Parse dimensions
        const width = parseDimensionValue(row['Width (in)'] || '0');
        const height = parseDimensionValue(row['Height (in)'] || '0');
        const depth = parseDimensionValue(row['Depth (in)'] || '0');

        // Parse max load
        const maxLoadStr = row['Maximum Load (lbs)'] || '0';
        const maxLoadLbs = parseFloat(maxLoadStr.replace(/[^0-9.]/g, '')) || undefined;

        const mount: Partial<Mount> = {
          type: 'mount',
          alias: row.Alias.trim(),
          model: row['MFG. PART']?.trim() || 'Unknown',
          manufacturer: row.Brand?.trim() || 'Unknown',
          maxLoadLbs,
          clearance: row['Clearance needed around screen']?.trim() || undefined,
          dimensions: {
            width,
            height,
            depth,
            unit: 'in',
          },
        };

        mounts.push(mount);
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });

    return {
      success: mounts.length > 0,
      data: mounts as any,
      errors: errors.length > 0 ? errors : undefined,
      totalRows: objects.length,
      successfulRows: mounts.length,
      failedRows: objects.length - mounts.length,
    };
  } catch (err) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : 'Unknown error occurred'],
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
    };
  }
}

/**
 * Download template TSV for mounts
 */
export function downloadMountsTemplate() {
  const headers = [
    'MFG. PART',
    'Brand',
    'Maximum Load (lbs)',
    'Width (in)',
    'Height (in)',
    'Depth (in)',
    'Clearance needed around screen',
    'Alias',
  ];
  const exampleRow = [
    'SF650',
    'Peerless-AV',
    '150',
    '23.62',
    '15.75',
    '1.03',
    '2" top, 2" sides',
    'Peerless Flat Wall Mount',
  ];

  const csv = [
    headers.join('\t'),
    exampleRow.join('\t'),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mounts-import-template.tsv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
