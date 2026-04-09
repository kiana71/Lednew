/**
 * Screen Import Pane
 *
 * Slide-in side panel for importing screens from Google Sheets CSV/TSV files.
 */

import React, { useState, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { importScreensFromGoogleSheets, downloadScreensTemplate, ImportResult } from '../../utils/sheetsImport';
import { Screen } from '../../types';

interface ScreenImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (screens: Partial<Screen>[]) => Promise<void>;
}

export function ScreenImportDialog({ open, onOpenChange, onImport }: ScreenImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const delimiter = text.includes('\t') ? '\t' : ',';
      const importResult = importScreensFromGoogleSheets(text, delimiter);
      setResult(importResult);

      if (importResult.success && importResult.data && importResult.data.length > 0) {
        await onImport(importResult.data);
      }
    } catch (error) {
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to import file'],
        totalRows: 0,
        successfulRows: 0,
        failedRows: 0,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" />
            Import Screens
          </SheetTitle>
          <SheetDescription>
            Import screen data from a Google Sheets export (CSV or TSV format)
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1">
              <p className="text-sm font-medium">Need a template?</p>
              <p className="text-xs text-muted-foreground mt-1">Download our template to see the required format</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadScreensTemplate()} className="gap-2">
              <Download className="size-4" />
              Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Instructions</Label>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Open your Google Sheet with screen data</li>
              <li>Ensure columns match: Screen MFR, Make, Screen Size, Height, Width, Depth, Alias</li>
              <li>Go to File &rarr; Download &rarr; Tab-separated values (.tsv) or Comma-separated values (.csv)</li>
              <li>Upload the downloaded file below</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileChange}
              className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white hover:file:bg-slate-800"
            />
            {file && (
              <p className="text-xs text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
            )}
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {result.success ? <CheckCircle className="size-5 text-green-600 mt-0.5" /> : <AlertCircle className="size-5 mt-0.5" />}
                <AlertDescription>
                  <div className="space-y-2">
                    <div><strong>{result.success ? `Successfully imported ${result.successfulRows} of ${result.totalRows} rows` : 'Import failed'}</strong></div>
                    {result.failedRows > 0 && <div className="text-sm">Failed rows: {result.failedRows}</div>}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <p className="text-sm font-medium mb-1">Errors:</p>
                        <ul className="text-xs space-y-1">
                          {result.errors.slice(0, 10).map((err, idx) => (<li key={idx} className="text-red-700">&bull; {err}</li>))}
                          {result.errors.length > 10 && <li className="text-red-700 italic">... and {result.errors.length - 10} more errors</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>{result?.success ? 'Close' : 'Cancel'}</Button>
          {!result?.success && (
            <Button type="button" onClick={handleImport} disabled={!file || importing} className="gap-2">
              <Upload className="size-4" />
              {importing ? 'Importing...' : 'Import'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
