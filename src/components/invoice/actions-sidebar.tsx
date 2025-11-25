// components/invoice/actions-sidebar.tsx
import { Invoice } from "../../../types/invoice"

interface ActionsSidebarProps {
  invoice: Invoice
  onSave: () => void
  onExport: () => void
}

export function ActionsSidebar({ invoice, onSave, onExport }: ActionsSidebarProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <h3 className="font-semibold text-lg mb-6">Invoice Actions</h3>
      
      <div className="space-y-4">
        <button 
          onClick={onSave}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
        
        <button 
          onClick={onExport}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
        >
          Export as PDF
        </button>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Invoice Details</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Status:</span> {invoice.payment_status}</p>
            <p><span className="font-medium">Created:</span> {new Date(invoice.created_at).toLocaleDateString()}</p>
            <p><span className="font-medium">Total:</span> ₹{invoice.grand_total}</p>
          </div>
        </div>
      </div>
    </div>
  )
}