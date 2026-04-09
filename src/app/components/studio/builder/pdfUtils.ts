
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportToPDF = async (title: string, canvasRef: HTMLElement) => {
  // Create a new jsPDF instance (Landscape, Letter size)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: 'letter',
  });

  try {
    // 1. Capture the Canvas
    if (canvasRef) {
      // For best quality, we might want to temporarily scale up or reset zoom
      // But capturing "as seen" is usually what users expect for WYSIWYG
      
      const canvasImage = await html2canvas(canvasRef, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvasImage.toDataURL('image/png');
      
      // Calculate aspect ratio to fit in PDF
      // Letter Landscape is 11 x 8.5.
      // We want to fill the page mostly.
      const pdfWidth = 11;
      const pdfHeight = 8.5;
      
      // Center the image horizontally
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(`${title.replace(/\s+/g, '_')}_Drawing.pdf`);
      return true;
      
    }
  } catch (error) {
    console.error('PDF Export failed', error);
    throw error;
  }
};
