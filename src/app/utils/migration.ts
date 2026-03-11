/**
 * Data Migration Utilities
 * 
 * Utilities for migrating data from Google Sheets to database
 */

import { Drawing, User, MigrationLog } from '../types';

/**
 * Google Sheets Data Mapper
 * Maps Google Sheets rows to application data structures
 */
export class GoogleSheetsMapper {
  /**
   * Map a Google Sheets row to a Drawing object
   * 
   * Expected columns:
   * - Drawing Number, Title, Description, Created By, Created At, 
   *   Updated At, Status, Project Name, Client Name, Canvas Data (JSON)
   */
  static mapToDrawing(row: any[]): Partial<Drawing> {
    return {
      drawingNumber: row[0] || '',
      title: row[1] || '',
      description: row[2] || '',
      createdBy: row[3] || '',
      createdByName: row[4] || '',
      createdAt: row[5] ? new Date(row[5]) : new Date(),
      updatedAt: row[6] ? new Date(row[6]) : new Date(),
      status: (row[7] as any) || 'draft',
      metadata: {
        version: '1.0',
        projectName: row[8] || '',
        clientName: row[9] || '',
      },
      canvasData: row[10] ? JSON.parse(row[10]) : {
        elements: [],
        settings: {
          backgroundColor: '#ffffff',
          gridEnabled: true,
          gridSize: 20,
          snapToGrid: true,
          zoom: 1.0,
        },
      },
      tags: row[11] ? row[11].split(',').map((t: string) => t.trim()) : [],
    };
  }

  /**
   * Map a Drawing object to Google Sheets row
   */
  static mapFromDrawing(drawing: Drawing): any[] {
    return [
      drawing.drawingNumber,
      drawing.title,
      drawing.description || '',
      drawing.createdBy,
      drawing.createdByName,
      drawing.createdAt.toISOString(),
      drawing.updatedAt.toISOString(),
      drawing.status,
      drawing.metadata.projectName || '',
      drawing.metadata.clientName || '',
      JSON.stringify(drawing.canvasData),
      drawing.tags?.join(', ') || '',
    ];
  }
}

/**
 * Database Migration Manager
 * Handles migration from Google Sheets to database
 */
export class MigrationManager {
  private logs: MigrationLog[] = [];

  /**
   * Migrate drawings from Google Sheets to database
   */
  async migrateDrawings(
    sheetsData: any[][],
    targetService: any
  ): Promise<MigrationLog> {
    const log: MigrationLog = {
      id: `migration-${Date.now()}`,
      sourceName: 'Google Sheets',
      targetName: 'Database',
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      startedAt: new Date(),
      status: 'running',
      errors: [],
    };

    try {
      // Skip header row
      const dataRows = sheetsData.slice(1);

      for (const row of dataRows) {
        log.recordsProcessed++;

        try {
          const drawing = GoogleSheetsMapper.mapToDrawing(row);
          
          // Validate required fields
          if (!drawing.drawingNumber || !drawing.title) {
            throw new Error('Missing required fields: drawingNumber or title');
          }

          // Create in target database
          await targetService.createDrawing(drawing);
          log.recordsSuccessful++;
        } catch (error) {
          log.recordsFailed++;
          log.errors?.push(`Row ${log.recordsProcessed}: ${error}`);
        }
      }

      log.status = 'completed';
      log.completedAt = new Date();
    } catch (error) {
      log.status = 'failed';
      log.errors?.push(`Migration failed: ${error}`);
    }

    this.logs.push(log);
    return log;
  }

  /**
   * Export drawings to Google Sheets format
   */
  exportToSheetsFormat(drawings: Drawing[]): any[][] {
    const headers = [
      'Drawing Number',
      'Title',
      'Description',
      'Created By (ID)',
      'Created By (Name)',
      'Created At',
      'Updated At',
      'Status',
      'Project Name',
      'Client Name',
      'Canvas Data (JSON)',
      'Tags',
    ];

    const rows = drawings.map(d => GoogleSheetsMapper.mapFromDrawing(d));

    return [headers, ...rows];
  }

  /**
   * Get migration logs
   */
  getLogs(): MigrationLog[] {
    return this.logs;
  }

  /**
   * Generate migration report
   */
  generateReport(log: MigrationLog): string {
    const duration = log.completedAt
      ? log.completedAt.getTime() - log.startedAt.getTime()
      : 0;

    return `
Migration Report
================
Status: ${log.status}
Source: ${log.sourceName}
Target: ${log.targetName}
Started: ${log.startedAt.toLocaleString()}
Completed: ${log.completedAt?.toLocaleString() || 'N/A'}
Duration: ${duration}ms

Records Processed: ${log.recordsProcessed}
Records Successful: ${log.recordsSuccessful}
Records Failed: ${log.recordsFailed}

${log.errors && log.errors.length > 0 ? `Errors:\n${log.errors.join('\n')}` : 'No errors'}
    `.trim();
  }
}

/**
 * CSV Export Utility
 * Export drawings to CSV format
 */
export class CSVExporter {
  static exportDrawings(drawings: Drawing[]): string {
    const headers = [
      'Drawing Number',
      'Title',
      'Description',
      'Created By',
      'Created At',
      'Updated At',
      'Status',
      'Project Name',
      'Client Name',
      'Tags',
    ];

    const rows = drawings.map(d => [
      d.drawingNumber,
      d.title,
      d.description || '',
      d.createdByName,
      d.createdAt.toISOString(),
      d.updatedAt.toISOString(),
      d.status,
      d.metadata.projectName || '',
      d.metadata.clientName || '',
      d.tags?.join('; ') || '',
    ]);

    const csvRows = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );

    return csvRows.join('\n');
  }

  static downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
