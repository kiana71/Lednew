/**
 * Receptacle Box Import Utility
 * 
 * Utilities for importing receptacle box data from Google Sheets (CSV/TSV format)
 */

import { ReceptacleBox } from '../types';
import { parseCSV, csvToObjects, ImportResult } from './sheetsImport';

export interface GoogleSheetsReceptacleBoxRow {
  'MFG. PART': string;
  'Brand': string;
  'Width (in)': string;
  'Height (in)': string;
  'Depth (in)': string;
  'Pseudonym': string;
}

/**
 * Parse a numeric dimension value from a string (e.g., "4.5", "4.5 in")
 */
function parseDimensionValue(value: string): number {
  const cleaned = value.trim();
  const numberMatch = cleaned.match(/[\d.]+/);
  if (!numberMatch) return 0;
  return parseFloat(numberMatch[0]) || 0;
}

/**
 * Import receptacle boxes from Google Sheets data
 */
export function importReceptacleBoxesFromGoogleSheets(csvText: string, delimiter: string = '\t'): ImportResult {
  const errors: string[] = [];
  const boxes: Partial<ReceptacleBox>[] = [];

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

    const objects = csvToObjects<GoogleSheetsReceptacleBoxRow>(rows);

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

        if (!row.Pseudonym?.trim()) {
          errors.push(`Row ${rowNumber}: Pseudonym is required`);
          return;
        }

        const width = parseDimensionValue(row['Width (in)'] || '0');
        const height = parseDimensionValue(row['Height (in)'] || '0');
        const depth = parseDimensionValue(row['Depth (in)'] || '0');

        const box: Partial<ReceptacleBox> = {
          type: 'receptacleBox',
          alias: row.Pseudonym.trim(),
          model: row['MFG. PART']?.trim() || 'Unknown',
          manufacturer: row.Brand?.trim() || 'Unknown',
          dimensions: {
            width,
            height,
            depth,
            unit: 'in',
          },
        };

        boxes.push(box);
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });

    return {
      success: boxes.length > 0,
      data: boxes as any,
      errors: errors.length > 0 ? errors : undefined,
      totalRows: objects.length,
      successfulRows: boxes.length,
      failedRows: objects.length - boxes.length,
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
 * Download template TSV for receptacle boxes
 */
export function downloadReceptacleBoxesTemplate() {
  const headers = [
    'MFG. PART',
    'Brand',
    'Width (in)',
    'Height (in)',
    'Depth (in)',
    'Pseudonym',
  ];
  const exampleRow = [
    'WB-100',
    'Datacomm',
    '6',
    '4.5',
    '3.5',
    'Recessed Power Box',
  ];

  const csv = [
    headers.join('\t'),
    exampleRow.join('\t'),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'receptacle-boxes-import-template.tsv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
