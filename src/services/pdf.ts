import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { cleanJob } from './formatters';

export async function downloadJobCardPdf(elementId: string, jobCardNo: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Preview element not found');
  }

  // Clone element to render off-screen with clean white background and exact dimensions
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '210mm';
  clone.style.maxWidth = '210mm';
  clone.style.boxSizing = 'border-box';
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.zIndex = '99999';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.padding = '16px';
  clone.style.borderRadius = '0';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 12; // 6mm margin
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 6;

    pdf.addImage(imgData, 'JPEG', 6, position, imgWidth, Math.min(imgHeight, pdfHeight - 12));
    heightLeft -= (pdfHeight - 12);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 6, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 12);
    }

    const cleanNo = cleanJob(jobCardNo) || 'JobCard';
    pdf.save(`JobCard_${cleanNo}.pdf`);
  } finally {
    document.body.removeChild(clone);
  }
}
