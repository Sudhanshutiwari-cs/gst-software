"use client"

import { ActionsSidebar } from "@/components/invoice/actions-sidebar"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { TemplateSidebar } from "@/components/invoice/template-sidebar"
import { Invoice } from "../../../../.././../../types/invoice"
import { useEffect, useState, use } from "react"
import { sampleInvoice } from "@/components/data/sampleInvoice"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export default function InvoiceViewer({ params }: { params: Promise<{ id: string }> }) {
  const [selectedTemplate, setSelectedTemplate] = useState("modern")
  const [zoom, setZoom] = useState(50)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"live" | "pdf">("live")

  // Unwrap the params promise
  const unwrappedParams = use(params)
  const { id } = unwrappedParams

  // Fetch invoice data
  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      const response = await fetch(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices/${invoiceId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status}`)
      }

      const data = await response.json()
      
      // DEBUG: Log the fetched invoice data
      console.log("🔍 DEBUG - Fetched Invoice Data:", {
        invoiceId,
        rawResponse: data,
        timestamp: new Date().toISOString(),
        url: `https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices/${invoiceId}`
      })

      // Validate the response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid invoice data received')
      }

      // Extract the actual invoice data from the nested structure
      const invoiceData = data.data || data
      
      // Ensure payment_status has a default value if missing
      const validatedInvoice = {
        ...invoiceData,
        payment_status: invoiceData.payment_status || 'unknown',
        created_at: invoiceData.created_at || new Date().toISOString(),
        // Ensure numeric fields are properly formatted
        grand_total: parseFloat(invoiceData.grand_total) || 0,
        gross_amt: parseFloat(invoiceData.gross_amt) || 0,
        gst: parseFloat(invoiceData.gst) || 0,
        discount: parseFloat(invoiceData.discount) || 0,
        qty: parseInt(invoiceData.qty) || 1
      }
      
      // DEBUG: Log the validated invoice
      console.log("✅ DEBUG - Validated Invoice:", validatedInvoice)
      
      setInvoice(validatedInvoice)
    } catch (err) {
      console.error('Error fetching invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice')
      // Fallback to sample data if API fails
      const fallbackInvoice = {
        ...sampleInvoice,
        payment_status: sampleInvoice.payment_status || 'unknown'
      }
      
      // DEBUG: Log fallback invoice
      console.log("🔄 DEBUG - Using Fallback Invoice:", fallbackInvoice)
      
      setInvoice(fallbackInvoice)
    } finally {
      setLoading(false)
      
      // DEBUG: Log final state
      console.log("🏁 DEBUG - Fetch completed:", {
        loading: false,
        hasInvoice: !!invoice,
        error: error
      })
    }
  }

  // Clean colors from styles to fix oklch issue
  const cleanStylesForPDF = (element: HTMLElement) => {
    // Remove problematic CSS classes that might contain oklch
    element.classList.forEach(className => {
      if (className.includes('gradient') || className.includes('shadow') || className.includes('bg-')) {
        element.classList.remove(className)
      }
    })

    // Apply safe inline styles
    element.style.backgroundColor = '#ffffff'
    element.style.color = '#000000'
    element.style.borderColor = '#cccccc'
    element.style.fontFamily = 'Arial, sans-serif'
    
    // Process all child elements
    const allElements = element.querySelectorAll('*')
    allElements.forEach((el: Element) => {
      const childEl = el as HTMLElement
      
      // Remove problematic classes from children
      childEl.classList.forEach(className => {
        if (className.includes('bg-') || className.includes('text-') || className.includes('border-')) {
          childEl.classList.remove(className)
        }
      })

      // Apply safe styles
      childEl.style.backgroundColor = childEl.tagName === 'BODY' ? '#ffffff' : 'transparent'
      childEl.style.color = '#000000'
      childEl.style.borderColor = '#cccccc'
      
      // Handle specific element types
      if (childEl.tagName === 'TABLE') {
        childEl.style.border = '1px solid #cccccc'
        childEl.style.borderCollapse = 'collapse'
      }
      
      if (childEl.tagName === 'TH' || childEl.tagName === 'TD') {
        childEl.style.border = '1px solid #cccccc'
        childEl.style.padding = '8px'
      }
      
      if (childEl.tagName === 'H1' || childEl.tagName === 'H2' || childEl.tagName === 'H3') {
        childEl.style.color = '#000000'
        childEl.style.fontWeight = 'bold'
      }
    })
  }

  // Generate PDF preview with color fix
  const generatePDFPreview = async (): Promise<string | null> => {
    if (!invoice) return null

    try {
      setIsGeneratingPDF(true)
      setError(null)
      
      // Get the invoice preview element
      const invoiceElement = document.getElementById('invoice-preview-content')
      if (!invoiceElement) {
        throw new Error('Invoice preview element not found')
      }

      // Create a deep clone of the element
      const clone = invoiceElement.cloneNode(true) as HTMLElement
      
      // Apply PDF-safe styles and positioning
      clone.style.position = 'fixed'
      clone.style.left = '0'
      clone.style.top = '0'
      clone.style.width = '210mm'
      clone.style.minHeight = '297mm'
      clone.style.transform = 'scale(1)'
      clone.style.transformOrigin = 'top left'
      clone.style.zIndex = '9999'
      clone.style.backgroundColor = '#ffffff'
      
      // Clean all styles to remove oklch colors
      cleanStylesForPDF(clone)
      
      // Add to document
      document.body.appendChild(clone)

      // Use html2canvas with safe configuration
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        onclone: (clonedDoc) => {
          // Additional cleanup on the cloned documents
          const allClonedElements = clonedDoc.querySelectorAll('*')
          allClonedElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement
            
            // Force safe colors
            const computedStyle = window.getComputedStyle(htmlEl)
            
            // Check and replace oklch colors
            if (computedStyle.color.includes('oklch')) {
              htmlEl.style.color = '#000000'
            }
            if (computedStyle.backgroundColor.includes('oklch')) {
              htmlEl.style.backgroundColor = htmlEl.tagName === 'BODY' ? '#ffffff' : 'transparent'
            }
            if (computedStyle.borderColor.includes('oklch')) {
              htmlEl.style.borderColor = '#cccccc'
            }
            
            // Remove any remaining problematic classes
            const classList = Array.from(htmlEl.classList)
            classList.forEach(className => {
              if (className.includes('oklch') || className.includes('gradient')) {
                htmlEl.classList.remove(className)
              }
            })
          })
        }
      })

      // Clean up the clone
      document.body.removeChild(clone)

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      
      // Generate PDF blob for preview
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      setPdfPreviewUrl(pdfUrl)
      setActiveView('pdf')
      
      console.log("✅ PDF generated successfully")
      return pdfUrl
      
    } catch (err) {
      console.error('Error generating PDF preview:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to generate PDF preview: ${errorMessage}`)
      
      // Fallback: Create a simple text-based PDF
      try {
        return await generateSimplePDF()
      } catch (fallbackErr) {
        console.error('Fallback PDF generation also failed:', fallbackErr)
        return null
      }
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Fallback PDF generation without html2canvas
  const generateSimplePDF = async (): Promise<string | null> => {
    if (!invoice) return null

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Add simple text content
      let yPosition = 20
      
      // Header
      pdf.setFontSize(20)
      pdf.setTextColor(0, 0, 0)
      pdf.text('INVOICE', 20, yPosition)
      
      yPosition += 10
      pdf.setFontSize(12)
      pdf.text(`Invoice #: ${invoice.invoice_number || 'N/A'}`, 20, yPosition)
      
      yPosition += 8
      pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, yPosition)
      
      yPosition += 15
      
      // From/To sections
      pdf.setFontSize(14)
      pdf.text('From:', 20, yPosition)
      pdf.setFontSize(10)
      yPosition += 7
      pdf.text(invoice.from_name || 'Your Company', 20, yPosition)
      yPosition += 5
      pdf.text(invoice.from_address || '123 Business St', 20, yPosition)
      yPosition += 5
      pdf.text(invoice.from_email || 'email@company.com', 20, yPosition)
      
      yPosition += 10
      pdf.setFontSize(14)
      pdf.text('To:', 20, yPosition)
      pdf.setFontSize(10)
      yPosition += 7
      pdf.text(invoice.to_name || 'Client Name', 20, yPosition)
      yPosition += 5
      pdf.text(invoice.to_address || '123 Client St', 20, yPosition)
      yPosition += 5
      pdf.text(invoice.to_email || 'client@email.com', 20, yPosition)
      
      yPosition += 15
      
      // Items table header
      pdf.setFontSize(12)
      pdf.text('Description', 20, yPosition)
      pdf.text('Qty', 120, yPosition)
      pdf.text('Price', 150, yPosition)
      pdf.text('Amount', 180, yPosition)
      
      yPosition += 8
      pdf.line(20, yPosition, 190, yPosition)
      
      yPosition += 10
      
      // Item row
      pdf.setFontSize(10)
      pdf.text(invoice.description || 'Product/Service', 20, yPosition)
      pdf.text((invoice.qty || 1).toString(), 120, yPosition)
      pdf.text(`$${Number(invoice.gross_amt || 0).toFixed(2)}`, 150, yPosition)
      pdf.text(`$${Number(invoice.grand_total || 0).toFixed(2)}`, 180, yPosition)
      
      yPosition += 20
      
      // Totals
      pdf.setFontSize(12)
      pdf.text(`Subtotal: $${Number(invoice.gross_amt || 0).toFixed(2)}`, 150, yPosition)
      yPosition += 8
      pdf.text(`Tax: $${Number(invoice.gst || 0).toFixed(2)}`, 150, yPosition)
      yPosition += 8
      pdf.text(`Discount: -$${Number(invoice.discount || 0).toFixed(2)}`, 150, yPosition)
      yPosition += 8
      pdf.setFontSize(14)
      pdf.setFont('', 'bold') // Empty string for default font
      pdf.text(`Total: $${Number(invoice.grand_total || 0).toFixed(2)}`, 150, yPosition)
      
      // Generate PDF blob
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      setPdfPreviewUrl(pdfUrl)
      setActiveView('pdf')
      
      console.log("✅ Simple PDF generated as fallback")
      return pdfUrl
      
    } catch (err) {
      console.error('Error generating simple PDF:', err)
      return null
    }
  }

  // Download PDF
  const downloadPDF = async () => {
    let pdfUrl = pdfPreviewUrl

    // Generate PDF if not already generated
    if (!pdfUrl) {
      pdfUrl = await generatePDFPreview()
      if (!pdfUrl) {
        setError('Failed to generate PDF for download')
        return
      }
    }

    // Trigger download
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `invoice-${invoice?.id || invoice?.invoice_number || 'unknown'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Switch to live preview
  const switchToLivePreview = () => {
    setActiveView('live')
  }

  // Clear PDF preview when template or invoice changes
  useEffect(() => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(null)
    }
  }, [selectedTemplate, invoice])

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  useEffect(() => {
    if (id) {
      console.log("🚀 DEBUG - Starting invoice fetch for ID:", id)
      fetchInvoice(id)
    }
  }, [id])

  // Debug effect to log when invoice state changes
  useEffect(() => {
    if (invoice) {
      console.log("📄 DEBUG - Invoice state updated:", invoice)
    }
  }, [invoice])

  // Add additional loading check to ensure invoice is ready
  if (loading || !invoice) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-lg">Loading invoice...</div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Template Selection */}
      <TemplateSidebar 
        selectedTemplate={selectedTemplate} 
        onSelectTemplate={setSelectedTemplate} 
      />

      {/* Center - Invoice Preview */}
      <div className="flex-1 flex flex-col">
        {/* Preview Controls */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <div className="flex gap-2">
            <button
              onClick={switchToLivePreview}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeView === 'live' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Live Preview
            </button>
            <button
              onClick={() => generatePDFPreview()}
              disabled={isGeneratingPDF}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeView === 'pdf' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                'PDF Preview'
              )}
            </button>
          </div>

          {activeView === 'pdf' && pdfPreviewUrl && (
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Download PDF
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-700 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {activeView === 'pdf' && pdfPreviewUrl ? (
            // PDF Preview
            <div className="h-full flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">PDF Preview</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={switchToLivePreview}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      Back to Live Preview
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[600px]"
                    title="PDF Preview"
                  />
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  This is a preview of how your PDF will look when downloaded.
                  {pdfPreviewUrl.includes('blob') && " (Fallback PDF - Some styling may be simplified)"}
                </div>
              </div>
            </div>
          ) : (
            // Live Preview
            <div className="h-full flex items-center justify-center">
              <div id="invoice-preview-content">
                <InvoicePreview 
                  invoice={invoice} 
                  template={selectedTemplate}
                  zoom={zoom} 
                  onZoomChange={setZoom}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Actions */}
      <ActionsSidebar 
        invoice={invoice}
        onSave={() => {
          // Implement save logic
          console.log('Saving invoice changes...')
        }}
        onExport={downloadPDF}
        isGeneratingPDF={isGeneratingPDF}
        hasPDFPreview={!!pdfPreviewUrl}
      />
    </div>
  )
}