
import React, { useRef, useState } from 'react';
import { DrawingProvider, useDrawingContext } from './DrawingContext';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { BOMTable } from './BOMTable';
import { NotesEditor } from './NotesEditor';
import { Button } from '../../ui/button';
import { Download, Save, ArrowLeft, Loader2, Printer } from 'lucide-react';
import { AppState } from './types';
import { exportToPDF } from './pdfUtils';
import { toast } from 'sonner';

interface DrawingBuilderProps {
  initialState?: Partial<AppState>;
  onSave?: (state: AppState, title: string) => void;
  onBack?: () => void;
  title?: string;
  onTitleChange?: (title: string) => void;
}

export function DrawingBuilder({ initialState, onSave, onBack, title = 'Drawing Builder', onTitleChange }: DrawingBuilderProps) {
  return (
    <DrawingProvider initialState={initialState}>
      <DrawingBuilderContent 
        onSave={onSave} 
        onBack={onBack} 
        title={title}
        onTitleChange={onTitleChange}
      />
    </DrawingProvider>
  );
}

function DrawingBuilderContent({ 
  onSave, 
  onBack, 
  title,
  onTitleChange,
}: { 
  onSave?: (state: AppState, title: string) => void; 
  onBack?: () => void; 
  title: string;
  onTitleChange?: (title: string) => void;
}) {
  const { state, updateSettings } = useDrawingContext();
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Track if we've already incremented the revision during this specific editor session
  const [hasIncrementedRevisionThisSession, setHasIncrementedRevisionThisSession] = useState(false);
  
  const handleSave = () => {
    let newRev = state.settings.revision;

    // Only increment revision ONCE per editor session (when they first open and save it)
    if (!hasIncrementedRevisionThisSession) {
      const currentRev = parseFloat(state.settings.revision);
      // If it's a brand new drawing (NaN or title is 'New Drawing'), keep it at 1.0. Otherwise, increment.
      if (isNaN(currentRev) || title === 'New Drawing') {
        newRev = "1.0";
      } else {
        newRev = (currentRev + 1.0).toFixed(1);
      }
      
      updateSettings({ revision: newRev });
      setHasIncrementedRevisionThisSession(true);
    }
    
    // Pass the updated state and current title to the onSave callback
    onSave?.({
      ...state,
      settings: {
        ...state.settings,
        revision: newRev
      }
    }, title);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      // Find the actual canvas container that holds the drawing
      const canvasElement = canvasRef.current.querySelector('.canvas-container') as HTMLElement;
      if (!canvasElement) throw new Error("Canvas container not found");

      // Temporarily remove transforms (zoom/pan) to capture a clean, full-resolution image
      const originalTransform = canvasElement.style.transform;
      canvasElement.style.transform = 'none';

      // Hide smart guides temporarily for export
      const guides = canvasElement.querySelectorAll('.smart-guide');
      guides.forEach(g => (g as HTMLElement).style.display = 'none');
      
      // Small delay to ensure the DOM layout is fully updated before capture
      await new Promise(resolve => setTimeout(resolve, 50));

      await exportToPDF(title, canvasElement);
      
      // Restore transforms and guides
      canvasElement.style.transform = originalTransform;
      guides.forEach(g => (g as HTMLElement).style.display = '');

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Header */}
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <div className="h-8 w-px bg-border" />
          <input
            className="font-semibold bg-transparent border-0 outline-none focus:ring-0 p-0 w-64 placeholder:text-muted-foreground"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            placeholder="Untitled Drawing"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 size-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
            Export PDF
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-2 size-4" />
            Save
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden print:overflow-visible print:block print:w-full print:h-full">
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 print:block print:w-full print:h-full print:p-0 print:m-0">
          {/* Toolbar */}
          <div className="border-b bg-white p-2 flex justify-center shadow-sm z-10 print:hidden">
            <Toolbar />
          </div>

          {/* Canvas Area */}
          <div 
            ref={canvasRef}
            className="flex-1 bg-slate-100 overflow-hidden relative print:overflow-visible print:bg-white print:h-[8.5in] print:w-[11in] print:p-0 print:m-0 flex items-center justify-center"
          >
            <Canvas />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 border-l bg-white flex flex-col overflow-y-auto print:hidden hidden">
          <Sidebar />
        </aside>
      </div>
      
      <style>{`
        @media print {
          @page { 
            size: letter landscape; 
            margin: 0; 
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
            background: white;
          }
          /* Hide everything except the canvas */
          body > *:not(#root) { display: none !important; }
          
          .canvas-container {
            transform: none !important;
            box-shadow: none !important;
            width: 11in !important;
            height: 8.5in !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide visual dragging guides during print */
          .smart-guide { display: none !important; }
        }
      `}</style>
    </div>
  );
}
