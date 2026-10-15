import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { cleanJob } from './formatters';

/**
 * Captures the rendered Job Card preview at its current on-screen width and
 * slices that high-resolution capture into printable A4 pages. This avoids
 * forcing the preview into a different 210mm layout before rendering it.
 */
export async function downloadJobCardPdf(elementId: string, jobCardNo: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Preview element not found');

  const bounds = element.getBoundingClientRect();
  const captureWidth = Math.round(bounds.width || element.scrollWidth);
  if (!captureWidth) throw new Error('The Job Card preview has no measurable width');

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${captureWidth}px`;
  clone.style.maxWidth = 'none';
  clone.style.minWidth = '0';
  clone.style.boxSizing = 'border-box';
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '-100000px';
  clone.style.zIndex = '-1';
  clone.style.margin = '0';
  clone.style.transform = 'none';
  // Keep the preview's own padding, borders, typography, colors, and logo intact.
  document.body.appendChild(clone);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(images.map(async (image) => {
      if (typeof image.decode === 'function') {
        try { await image.decode(); } catch { /* html2canvas will attempt the image itself */ }
      }
    }));

    const canvas = await html2canvas(clone, {
      scale: 2.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: Math.max(1, window.innerWidth),
      windowHeight: Math.max(1, window.innerHeight),
      scrollX: 0,
      scrollY: 0,
    });

    if (!canvas.width || !canvas.height) throw new Error('The Job Card preview could not be rendered');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const pixelsPerMm = canvas.width / contentWidth;
    const pageSliceHeight = Math.max(1, Math.floor(contentHeight * pixelsPerMm));

    let pageIndex = 0;
    for (let sourceY = 0; sourceY < canvas.height; sourceY += pageSliceHeight) {
      const sliceHeight = Math.min(pageSliceHeight, canvas.height - sourceY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const context = pageCanvas.getContext('2d');
      if (!context) throw new Error('Could not prepare a PDF page');

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      if (pageIndex > 0) pdf.addPage('a4', 'portrait');
      const imageData = pageCanvas.toDataURL('image/png');
      const renderedHeight = sliceHeight / pixelsPerMm;
      pdf.addImage(imageData, 'PNG', margin, margin, contentWidth, renderedHeight, undefined, 'FAST');

      pageCanvas.width = 0;
      pageCanvas.height = 0;
      pageIndex += 1;
    }

    const cleanNo = cleanJob(jobCardNo) || 'JobCard';
    pdf.save(`JobCard_${cleanNo}.pdf`);
  } finally {
    clone.remove();
  }
}
