// components/invoice/actions-sidebar.tsx
"use client"

import { X, Plus, Mail, Pencil, Download, Printer, Copy, ArrowRightLeft, XCircle, ArrowRight } from "lucide-react"
import { Invoice } from "../../../types/invoice"

interface ActionsSidebarProps {
  invoice: Invoice
  onSave: () => void
  onExport: () => void
  onEdit: () => void
  onDuplicate: () => void
  onConvert: () => void
  onCancel: () => void
  onPrint: () => void
  onEmail: () => void
  onWhatsapp: () => void
  onAddLogo: () => void
  onAddBankDetails: () => void
  onClose: () => void
  onGoToSales: () => void
}

export function ActionsSidebar({ 
  invoice, 
  onSave, 
  onExport, 
  onEdit,
  onDuplicate,
  onConvert,
  onCancel,
  onPrint,
  onEmail,
  onWhatsapp,
  onAddLogo,
  onAddBankDetails,
  onClose,
  onGoToSales
}: ActionsSidebarProps) {
  return (
    <div className="w-80 border-l border-gray-300 bg-white flex flex-col shadow-lg h-[85vh]">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 flex items-start justify-between flex-shrink-0">
        <div>
          <h2 className="font-semibold text-lg text-gray-900">Invoice #{invoice.invoice_number} has been saved!</h2>
          <p className="text-sm text-gray-600">
            Review your saved invoice. Here are some next steps you can take.
          </p>
        </div>
        <button 
          className="h-6 w-6 -mr-2 -mt-1 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button 
            className="flex items-center text-xs bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-md transition-colors"
            onClick={onAddLogo}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Logo
          </button>
          <button 
            className="flex items-center text-xs bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-md transition-colors"
            onClick={onAddBankDetails}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Bank Details
          </button>
        </div>

        {/* Send Via */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Send Via</p>
          <div className="flex gap-2">
            <button 
              className="flex items-center bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-full text-sm transition-colors"
              onClick={onEmail}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </button>
            <button 
              className="flex items-center bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-full text-sm transition-colors"
              onClick={onWhatsapp}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1.5 fill-green-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Whatsapp
            </button>
          </div>
        </div>

        {/* Actions */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Actions</p>
          <div className="space-y-1">
            <button 
              className="flex items-center w-full justify-start h-9 text-sm text-gray-700 hover:bg-gray-100 px-3 rounded-md transition-colors"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button 
              className="flex items-center w-full justify-start h-9 text-sm text-gray-700 hover:bg-gray-100 px-3 rounded-md transition-colors"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
            <button 
              className="flex items-center w-full justify-start h-9 text-sm text-gray-700 hover:bg-gray-100 px-3 rounded-md transition-colors"
              onClick={onPrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Thermal Print
            </button>
            <button 
              className="flex items-center w-full justify-start h-9 text-sm text-gray-700 hover:bg-gray-100 px-3 rounded-md transition-colors"
              onClick={onDuplicate}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </button>
            <button 
              className="flex items-center w-full justify-start h-9 text-sm text-gray-700 hover:bg-gray-100 px-3 rounded-md transition-colors"
              onClick={onConvert}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Convert
            </button>
            <button
              className="flex items-center w-full justify-start h-9 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 rounded-md transition-colors"
              onClick={onCancel}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Invoice
            </button>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="border-t border-gray-300 pt-4">
          <h4 className="font-medium mb-2 text-sm text-gray-900">Invoice Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900 capitalize">{invoice.payment_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium text-gray-900">₹{invoice.grand_total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions - Fixed at bottom */}
      <div className="p-4 border-t border-gray-300 space-y-3 flex-shrink-0">
        <button 
          className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md transition-colors font-medium"
          onClick={onSave}
        >
          <Printer className="h-4 w-4 mr-2" />
          Save & Print Invoice
        </button>
        <button 
          className="flex items-center justify-center w-full text-blue-600 hover:text-blue-700 py-2.5 px-4 rounded-md transition-colors font-medium"
          onClick={onGoToSales}
        >
          Go to Sales
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  )
}