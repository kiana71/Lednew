/**
 * Media Player Import Utility
 * 
 * Utilities for importing media player data from Google Sheets (CSV/TSV format)
 */

import { MediaPlayer } from '../types';
import { parseCSV, csvToObjects, ImportResult } from './sheetsImport';

export interface GoogleSheetsMediaPlayerRow {
  'MFG. PART': string;
  'Make': string;
  'Height': string;
  'Width': string;
  'Depth': string;
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
 * Import media players from Google Sheets data
 */
export function importMediaPlayersFromGoogleSheets(csvText: string, delimiter: string = '\t'): ImportResult {
  const errors: string[] = [];
  const players: Partial<MediaPlayer>[] = [];

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

    const objects = csvToObjects<GoogleSheetsMediaPlayerRow>(rows);

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

        const height = parseDimensionValue(row.Height || '0');
        const width = parseDimensionValue(row.Width || '0');
        const depth = parseDimensionValue(row.Depth || '0');

        const player: Partial<MediaPlayer> = {
          type: 'mediaPlayer',
          alias: row.Pseudonym.trim(),
          model: row['MFG. PART']?.trim() || 'Unknown',
          manufacturer: row.Make?.trim() || 'Unknown',
          dimensions: {
            height,
            width,
            depth,
            unit: 'in',
          },
        };

        players.push(player);
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });

    return {
      success: players.length > 0,
      data: players as any,
      errors: errors.length > 0 ? errors : undefined,
      totalRows: objects.length,
      successfulRows: players.length,
      failedRows: objects.length - players.length,
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
 * Download template TSV for media players
 */
export function downloadMediaPlayersTemplate() {
  const headers = [
    'MFG. PART',
    'Make',
    'Height',
    'Width',
    'Depth',
    'Pseudonym',
  ];
  const exampleRow = [
    'XT1144',
    'BrightSign',
    '1.0',
    '4.5',
    '4.5',
    'BrightSign 4K Player',
  ];

  const csv = [
    headers.join('\t'),
    exampleRow.join('\t'),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'media-players-import-template.tsv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
