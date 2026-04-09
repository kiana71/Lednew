/**
 * Google Sheets Import Utility
 * 
 * Utilities for importing data from Google Sheets (CSV/TSV format)
 */

import { Screen } from '../types';

export interface GoogleSheetsScreenRow {
  'Screen MFR': string;
  'Make': string;
  'Screen Size': string;
  'Height': string;
  'Width': string;
  'Depth': string;
  'Alias': string;
}

export interface ImportResult {
  success: boolean;
  data?: Partial<Screen>[];
  errors?: string[];
  totalRows: number;
  successfulRows: number;
  failedRows: number;
}

/**
 * Parse CSV/TSV text from Google Sheets
 */
export function parseCSV(text: string, delimiter: string = '\t'): string[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    // Handle quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    fields.push(current.trim());
    
    return fields;
  });
}

/**
 * Convert parsed CSV to objects with headers
 */
export function csvToObjects<T>(rows: string[][]): T[] {
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  const data: T[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(cell => !cell.trim())) continue; // Skip empty rows
    
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = row[index]?.trim() || '';
    });
    data.push(obj);
  }
  
  return data;
}

/**
 * Parse dimension string (e.g., "24.5", "24.5 in", "62.23cm")
 */
function parseDimension(value: string): { value: number; unit: 'in' | 'cm' | 'mm' } {
  const cleaned = value.trim().toLowerCase();
  
  // Extract number
  const numberMatch = cleaned.match(/[\d.]+/);
  if (!numberMatch) {
    return { value: 0, unit: 'in' };
  }
  
  const numValue = parseFloat(numberMatch[0]);
  
  // Detect unit
  let unit: 'in' | 'cm' | 'mm' = 'in'; // default
  if (cleaned.includes('mm')) {
    unit = 'mm';
  } else if (cleaned.includes('cm')) {
    unit = 'cm';
  } else if (cleaned.includes('in') || cleaned.includes('"')) {
    unit = 'in';
  }
  
  return { value: numValue, unit };
}

/**
 * Parse screen size (e.g., "55", "55\"", "55 inch")
 */
function parseScreenSize(value: string): number {
  const cleaned = value.trim().replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Import screens from Google Sheets data
 */
export function importScreensFromGoogleSheets(csvText: string, delimiter: string = '\t'): ImportResult {
  const errors: string[] = [];
  const screens: Partial<Screen>[] = [];
  
  try {
    // Parse CSV
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
    
    // Convert to objects
    const objects = csvToObjects<GoogleSheetsScreenRow>(rows);
    
    if (objects.length === 0) {
      return {
        success: false,
        errors: ['No valid rows found after header'],
        totalRows: rows.length - 1,
        successfulRows: 0,
        failedRows: rows.length - 1,
      };
    }
    
    // Process each row
    objects.forEach((row, index) => {
      try {
        const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
        
        // Validate required fields
        if (!row.Alias?.trim()) {
          errors.push(`Row ${rowNumber}: Alias is required`);
          return;
        }
        
        // Parse dimensions
        const heightData = parseDimension(row.Height || '0');
        const widthData = parseDimension(row.Width || '0');
        const depthData = parseDimension(row.Depth || '0');
        
        // Determine unit (use the first non-default unit found, or 'in' as default)
        let unit: 'in' | 'cm' | 'mm' = 'in';
        if (heightData.unit !== 'in') unit = heightData.unit;
        else if (widthData.unit !== 'in') unit = widthData.unit;
        else if (depthData.unit !== 'in') unit = depthData.unit;
        
        // Parse screen size
        const sizeInInch = parseScreenSize(row['Screen Size'] || '0');
        
        const screen: Partial<Screen> = {
          type: 'screen',
          alias: row.Alias.trim(),
          manufacturer: row['Screen MFR']?.trim() || 'Unknown',
          model: row.Make?.trim() || 'Unknown',
          sizeInInch: sizeInInch > 0 ? sizeInInch : undefined,
          dimensions: {
            height: heightData.value,
            width: widthData.value,
            depth: depthData.value,
            unit,
          },
        };
        
        screens.push(screen);
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
    
    return {
      success: screens.length > 0,
      data: screens,
      errors: errors.length > 0 ? errors : undefined,
      totalRows: objects.length,
      successfulRows: screens.length,
      failedRows: objects.length - screens.length,
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
 * Download template CSV for screens
 */
export function downloadScreensTemplate() {
  const headers = ['Screen MFR', 'Make', 'Screen Size', 'Height', 'Width', 'Depth', 'Alias'];
  const exampleRow = ['Samsung', 'QN55Q80C', '55', '27.2 in', '48.4 in', '1.2 in', 'Office Display 55"'];
  
  const csv = [
    headers.join('\t'),
    exampleRow.join('\t'),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'screens-import-template.tsv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
