"use client"

import { ActionsSidebar } from "@/components/invoice/actions-sidebar"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { TemplateSidebar } from "@/components/invoice/template-sidebar"
import { Invoice } from "../../../../.././../../types/invoice"
import { useEffect, useState, use } from "react"
import { sampleInvoice } from "@/components/data/sampleInvoice"

export default function InvoiceViewer({ params }: { params: Promise<{ id: string }> }) {
  const [selectedTemplate, setSelectedTemplate] = useState("modern")
  const [zoom, setZoom] = useState(50)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <InvoicePreview 
        invoice={invoice} 
        template={selectedTemplate}
        zoom={zoom} 
        onZoomChange={setZoom}
      />

      {/* Right Sidebar - Actions */}
      <ActionsSidebar 
        invoice={invoice}
        onSave={() => {/* Implement save logic */}}
        onExport={() => {/* Implement export logic */}}
      />
    </div>
  )
}