/**
 * Receptacle Box Import Pane
 *
 * Slide-in side panel for importing receptacle boxes from Google Sheets CSV/TSV files.
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
import { importReceptacleBoxesFromGoogleSheets, downloadReceptacleBoxesTemplate } from '../../utils/receptacleBoxesImport';
import { ImportResult } from '../../utils/sheetsImport';
import { ReceptacleBox } from '../../types';

interface ReceptacleBoxImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (boxes: Partial<ReceptacleBox>[]) => Promise<void>;
}

export function ReceptacleBoxImportDialog({ open, onOpenChange, onImport }: ReceptacleBoxImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = e.target.files?.[0];
    if (sel) { setFile(sel); setResult(null); }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true); setResult(null);
    try {
      const text = await file.text();
      const delimiter = text.includes('\t') ? '\t' : ',';
      const importResult = importReceptacleBoxesFromGoogleSheets(text, delimiter);
      setResult(importResult);
      if (importResult.success && importResult.data && importResult.data.length > 0) {
        await onImport(importResult.data as Partial<ReceptacleBox>[]);
      }
    } catch (error) {
      setResult({ success: false, errors: [error instanceof Error ? error.message : 'Failed to import file'], totalRows: 0, successfulRows: 0, failedRows: 0 });
    } finally { setImporting(false); }
  };

  const handleClose = () => { setFile(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; onOpenChange(false); };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5" />Import Receptacle Boxes</SheetTitle>
          <SheetDescription>Import receptacle box data from a Google Sheets export (CSV or TSV format)</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1"><p className="text-sm font-medium">Need a template?</p><p className="text-xs text-muted-foreground mt-1">Download our template to see the required format</p></div>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadReceptacleBoxesTemplate()} className="gap-2"><Download className="size-4" />Template</Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rb-file-upload">Select File</Label>
            <input ref={fileInputRef} id="rb-file-upload" type="file" accept=".csv,.tsv,.txt" onChange={handleFileChange} className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white hover:file:bg-slate-800" />
            {file && <p className="text-xs text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>}
          </div>
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {result.success ? <CheckCircle className="size-5 text-green-600 mt-0.5" /> : <AlertCircle className="size-5 mt-0.5" />}
                <AlertDescription><strong>{result.success ? `Imported ${result.successfulRows} of ${result.totalRows} rows` : 'Import failed'}</strong></AlertDescription>
              </div>
            </Alert>
          )}
        </div>
        <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>{result?.success ? 'Close' : 'Cancel'}</Button>
          {!result?.success && <Button type="button" onClick={handleImport} disabled={!file || importing} className="gap-2"><Upload className="size-4" />{importing ? 'Importing...' : 'Import'}</Button>}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
