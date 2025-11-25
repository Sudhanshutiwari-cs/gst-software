import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Function to remove unsupported CSS before capturing
const prepareForPDFCapture = (element: HTMLElement): void => {
  // Add a class to remove problematic styles
  element.classList.add('pdf-capture-mode');
  
  // Force remove any oklch colors and modern CSS
  const style = document.createElement('style');
  style.innerHTML = `
    .pdf-capture-mode * {
      color: #000000 !important;
      background-color: #ffffff !important;
      border-color: #cccccc !important;
    }
    .pdf-capture-mode .bg-gray-100 {
      background-color: #f8f9fa !important;
    }
    .pdf-capture-mode .bg-gray-50 {
      background-color: #f9fafb !important;
    }
    .pdf-capture-mode .bg-blue-50 {
      background-color: #eff6ff !important;
    }
    .pdf-capture-mode .bg-yellow-50 {
      background-color: #fefce8 !important;
    }
    .pdf-capture-mode .bg-green-100 {
      background-color: #dcfce7 !important;
    }
    .pdf-capture-mode .bg-red-600 {
      background-color: #dc2626 !important;
    }
    .pdf-capture-mode .text-green-600 {
      color: #059669 !important;
    }
    .pdf-capture-mode .text-red-600 {
      color: #dc2626 !important;
    }
    .pdf-capture-mode .text-blue-600 {
      color: #2563eb !important;
    }
    .pdf-capture-mode .border-gray-300 {
      border-color: #d1d5db !important;
    }
    .pdf-capture-mode .border-gray-400 {
      border-color: #9ca3af !important;
    }
    .pdf-capture-mode .border-black {
      border-color: #000000 !important;
    }
  `;
  document.head.appendChild(style);
  
  setTimeout(() => {
    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
  }, 5000);
};

const cleanupAfterPDFCapture = (element: HTMLElement): void => {
  element.classList.remove('pdf-capture-mode');
};

// Helper function to download PDF
const downloadPDF = (pdfBlob: Blob, filename: string): void => {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateInvoicePDF = async (
  element: HTMLElement,
  filename: string = 'invoice.pdf',
  forPreview: boolean = false
): Promise<Blob> => {
  try {
    // Prepare element for capture
    prepareForPDFCapture(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Remove any problematic styles from the cloned document
        const clonedElement = clonedDoc.querySelector('.pdf-capture-mode');
        if (clonedElement) {
          // Add inline styles to override problematic CSS
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color: #000000 !important;
              background-image: none !important;
            }
            .bg-\\[oklch\\(.*\\)\\] {
              background-color: #ffffff !important;
            }
            .text-\\[oklch\\(.*\\)\\] {
              color: #000000 !important;
            }
            .border-\\[oklch\\(.*\\)\\] {
              border-color: #cccccc !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    const pdfBlob = pdf.output('blob');
    
    if (!forPreview) {
      downloadPDF(pdfBlob, filename);
    }
    
    return pdfBlob;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    // Cleanup
    cleanupAfterPDFCapture(element);
  }
};

export const generateHighQualityPDF = async (
  element: HTMLElement,
  filename: string = 'invoice.pdf',
  forPreview: boolean = false
): Promise<Blob> => {
  try {
    prepareForPDFCapture(element);

    const canvas = await html2canvas(element, {
      scale: 2, // Reduced from 3 to improve compatibility
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      removeContainer: false, // Changed to false for better compatibility
      width: element.scrollWidth,
      height: element.scrollHeight,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            color: #000000 !important;
            background-color: #ffffff !important;
          }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-yellow-50 { background-color: #fefce8 !important; }
          .bg-green-100 { background-color: #dcfce7 !important; }
          .text-green-600 { color: #059669 !important; }
          .text-red-600 { color: #dc2626 !important; }
          .border-gray-300 { border-color: #d1d5db !important; }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG for better compression
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const widthRatio = pageWidth / canvas.width;
    const heightRatio = pageHeight / canvas.height;
    const ratio = Math.min(widthRatio, heightRatio);

    const canvasWidth = canvas.width * ratio;
    const canvasHeight = canvas.height * ratio;

    const marginX = (pageWidth - canvasWidth) / 2;
    const marginY = (pageHeight - canvasHeight) / 2;

    pdf.addImage(imgData, 'JPEG', marginX, marginY, canvasWidth, canvasHeight);
    
    const pdfBlob = pdf.output('blob');
    
    if (!forPreview) {
      downloadPDF(pdfBlob, filename);
    }
    
    return pdfBlob;

  } catch (error) {
    console.error('Error generating high quality PDF:', error);
    throw new Error('Failed to generate high quality PDF');
  } finally {
    cleanupAfterPDFCapture(element);
  }
};

// Simple PDF generator with minimal styling
export const generateSimplePDF = async (
  element: HTMLElement,
  filename: string = 'invoice.pdf',
  forPreview: boolean = false
): Promise<Blob> => {
  try {
    // Create a simplified version by modifying the original element temporarily
    const originalHTML = element.innerHTML;
    const originalClasses = element.className;
    
    // Apply simple styling
    element.className = 'pdf-simple-mode';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#000000';
    element.style.backgroundColor = '#ffffff';
    
    // Create a style element for simple mode
    const style = document.createElement('style');
    style.innerHTML = `
      .pdf-simple-mode * {
        color: #000000 !important;
        background-color: #ffffff !important;
        border: 1px solid #cccccc !important;
        font-family: Arial, sans-serif !important;
      }
      .pdf-simple-mode table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      .pdf-simple-mode th, 
      .pdf-simple-mode td {
        border: 1px solid #000000 !important;
        padding: 8px !important;
      }
    `;
    document.head.appendChild(style);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Restore original element
    element.innerHTML = originalHTML;
    element.className = originalClasses;
    element.style.fontFamily = '';
    element.style.color = '';
    element.style.backgroundColor = '';
    document.head.removeChild(style);

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    const pdfBlob = pdf.output('blob');
    
    if (!forPreview) {
      downloadPDF(pdfBlob, filename);
    }
    
    return pdfBlob;

  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw new Error('Failed to generate simple PDF');
  }
};

// Alternative: Generate PDF without html2canvas (basic text PDF)
export const generateBasicPDF = async (
  invoiceData: any,
  filename: string = 'invoice.pdf',
  forPreview: boolean = false
): Promise<Blob> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set font
    pdf.setFont('helvetica');
    pdf.setFontSize(16);
    
    // Title
    pdf.text('TAX INVOICE', 105, 20, { align: 'center' });
    
    // Company Info
    pdf.setFontSize(10);
    pdf.text('Shyam CMYK', 20, 40);
    pdf.text('Tatmil market, Ghantaghar', 20, 45);
    pdf.text('Kanpur City, UTTAR PRADESH, 208015', 20, 50);
    pdf.text('Mobile: +91 9856314765', 20, 55);
    
    // Invoice Details
    pdf.text(`Invoice #: ${invoiceData?.invoiceNumber || 'INV-1180'}`, 150, 40, { align: 'right' });
    pdf.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 150, 45, { align: 'right' });
    
    // Customer Details
    pdf.text('Customer Details:', 20, 70);
    pdf.text(`Name: ${invoiceData?.customer?.name || 'Sudhanshu Tiwari'}`, 20, 75);
    pdf.text(`Phone: ${invoiceData?.customer?.phone || '9140048553'}`, 20, 80);
    
    // Simple table header
    pdf.text('Item', 20, 100);
    pdf.text('Quantity', 100, 100);
    pdf.text('Amount', 150, 100);
    
    // Draw line
    pdf.line(20, 102, 190, 102);
    
    // Items
    let yPosition = 110;
    const items = invoiceData?.items || [{ description: 'PVR ID CARD COLOR', quantity: 100, rate: 40 }];
    
    items.forEach((item: any, index: number) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(item.description || 'PVR ID CARD COLOR', 20, yPosition);
      pdf.text(`${item.quantity || 100} PCS`, 100, yPosition);
      pdf.text(`₹${((item.rate || 40) * (item.quantity || 100)).toFixed(2)}`, 150, yPosition);
      yPosition += 10;
    });
    
    // Total
    pdf.line(20, yPosition + 5, 190, yPosition + 5);
    pdf.setFontSize(12);
    pdf.text('Total Amount:', 100, yPosition + 15);
    pdf.text(`₹${invoiceData?.total_amount || 4000}`, 150, yPosition + 15);
    
    // Footer
    pdf.setFontSize(8);
    pdf.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    const pdfBlob = pdf.output('blob');
    
    if (!forPreview) {
      downloadPDF(pdfBlob, filename);
    }
    
    return pdfBlob;

  } catch (error) {
    console.error('Error generating basic PDF:', error);
    throw new Error('Failed to generate basic PDF');
  }
};

export const generateMultiPagePDF = async (
  element: HTMLElement,
  filename: string = 'invoice.pdf',
  forPreview: boolean = false
): Promise<Blob> => {
  try {
    prepareForPDFCapture(element);

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    let heightLeft = imgHeight;
    let position = 0;
    const imgRatio = imgWidth / imgHeight;
    const pageRatio = pdfWidth / pdfHeight;

    if (imgRatio > pageRatio) {
      const width = pdfWidth;
      const height = width / imgRatio;
      pdf.addImage(imgData, 'PNG', 0, position, width, height);
      heightLeft -= height;
    } else {
      const width = pdfHeight * imgRatio;
      const height = pdfHeight;
      pdf.addImage(imgData, 'PNG', 0, position, width, height);
      heightLeft -= height;
    }

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const pdfBlob = pdf.output('blob');
    
    if (!forPreview) {
      downloadPDF(pdfBlob, filename);
    }
    
    return pdfBlob;

  } catch (error) {
    console.error('Error generating multi-page PDF:', error);
    throw new Error('Failed to generate multi-page PDF');
  } finally {
    cleanupAfterPDFCapture(element);
  }
};

// Utility function to generate PDF preview URL
export const generatePDFPreview = async (
  element: HTMLElement,
  quality: 'standard' | 'high' | 'simple' | 'basic' = 'standard',
  invoiceData?: any
): Promise<string> => {
  try {
    let blob: Blob;

    switch (quality) {
      case 'high':
        blob = await generateHighQualityPDF(element, 'preview.pdf', true);
        break;
      case 'simple':
        blob = await generateSimplePDF(element, 'preview.pdf', true);
        break;
      case 'basic':
        if (!invoiceData) {
          throw new Error('Invoice data required for basic PDF');
        }
        blob = await generateBasicPDF(invoiceData, 'preview.pdf', true);
        break;
      default:
        blob = await generateInvoicePDF(element, 'preview.pdf', true);
    }

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw new Error('Failed to generate PDF preview');
  }
};