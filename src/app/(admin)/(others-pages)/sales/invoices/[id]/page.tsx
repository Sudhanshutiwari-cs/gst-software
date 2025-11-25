"use client"

import { ActionsSidebar } from "@/components/invoice/actions-sidebar"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { TemplateSidebar } from "@/components/invoice/template-sidebar"
import { Invoice } from "../../../../.././../../types/invoice"
import { useEffect, useState } from "react"
import { sampleInvoice } from "@/components/data/sampleInvoice"

export default function InvoiceViewer({ params }: { params: { id: string } }) {
  const [selectedTemplate, setSelectedTemplate] = useState("modern")
  const [zoom, setZoom] = useState(50)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch invoice data
  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') // or your preferred token storage
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
      setInvoice(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice')
      // Fallback to sample data if API fails
      setInvoice(sampleInvoice)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id)
    }
  }, [params.id])

  if (loading) {
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
        invoice={invoice!} 
        template={selectedTemplate}
        zoom={zoom} 
        onZoomChange={setZoom}
      />

      {/* Right Sidebar - Actions */}
      <ActionsSidebar 
        invoice={invoice!}
        onSave={() => {/* Implement save logic */}}
        onExport={() => {/* Implement export logic */}}
      />
    </div>
  )
}