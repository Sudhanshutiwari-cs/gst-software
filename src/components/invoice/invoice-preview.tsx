// components/invoice/invoice-preview.tsx
import { Invoice } from "../../../types/invoice"

interface InvoicePreviewProps {
  invoice: Invoice
  template: string
}

export function InvoicePreview({ invoice, template }: InvoicePreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Invoice #{invoice.invoice_id}</h1>
      </div>
      
      <div className="bg-white p-8 shadow-lg mx-auto max-w-4xl">
        {/* Modern Template */}
        {template === 'modern' && (
          <div className="modern-template">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                <p className="text-gray-600">#{invoice.invoice_id}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  invoice.payment_status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.payment_status.toUpperCase()}
                </div>
                <p className="text-gray-600 mt-2">Date: {formatDate(invoice.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">From:</h3>
                <p className="text-gray-800 font-medium">{invoice.biller_name}</p>
                <p className="text-gray-600">Vendor ID: {invoice.vendor_id}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
                <p className="text-gray-800 font-medium">{invoice.billing_to}</p>
                <p className="text-gray-600">{invoice.email}</p>
                {invoice.mobile && <p className="text-gray-600">{invoice.mobile}</p>}
              </div>
            </div>

            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800">{invoice.product_name}</h4>
                  <p className="text-gray-600 text-sm">SKU: {invoice.product_sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-800">Qty: {invoice.qty}</p>
                  <p className="text-gray-800 font-semibold">₹{invoice.grand_total}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-6">
              <div>
                <p className="text-gray-600">Gross Amount: ₹{invoice.gross_amt}</p>
                {parseFloat(invoice.gst) > 0 && (
                  <p className="text-gray-600">GST: ₹{invoice.gst}</p>
                )}
                {parseFloat(invoice.discount) > 0 && (
                  <p className="text-gray-600">Discount: -₹{invoice.discount}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">Total: ₹{invoice.grand_total}</p>
              </div>
            </div>
          </div>
        )}

        {/* Classic Template */}
        {template === 'classic' && (
          <div className="classic-template border-2 border-gray-800">
            {/* Header */}
            <div className="text-black py-4 px-6">
              <h1 className="text-2xl font-bold text-center">INVOICE</h1>
              <p className="text-black text-sm text-center">ORIGINAL FOR RECIPIENT</p>
              <hr className="border-t border-black mt-4" />
            </div>

            {/* Company Details */}
            <div className="p-6 border-b border-gray-300">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{invoice.biller_name}</h2>
                <p className="text-gray-600">Tatmil market, Ghantaghar</p>
                <p className="text-gray-600">Kanpur City, UTTAR PRADESH, 208015</p>
                {invoice.mobile && (
                  <p className="text-gray-600">Mobile: {invoice.mobile}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Details */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 font-medium">Invoice #:</span>
                    <span className="text-gray-800">{invoice.invoice_id}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 font-medium">Invoice Date:</span>
                    <span className="text-gray-800">{formatDate(invoice.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Due Date:</span>
                    <span className="text-gray-800">{formatDate(invoice.created_at)}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-700 mb-2">Customer Details:</h3>
                  <p className="text-gray-800 font-medium">{invoice.billing_to}</p>
                  {invoice.mobile && (
                    <p className="text-gray-600">Ph: {invoice.mobile}</p>
                  )}
                  {invoice.email && (
                    <p className="text-gray-600">{invoice.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border border-gray-300"># Item</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border border-gray-300">HSN/SAC</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border border-gray-300">Rate / Item</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border border-gray-300">Qty</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border border-gray-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 px-4 border border-gray-300 text-gray-800">
                        {invoice.product_name}
                        {invoice.product_id && (
                          <span className="text-gray-500 text-sm block">ID: {invoice.product_id}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 border border-gray-300 text-gray-600">
                        {invoice.product_sku || 'N/A'}
                      </td>
                      <td className="py-3 px-4 border border-gray-300 text-gray-600">
                        ₹{new Intl.NumberFormat('en-IN').format(Number(invoice.gross_amt) / Number(invoice.qty))}
                      </td>
                      <td className="py-3 px-4 border border-gray-300 text-gray-600">
                        {invoice.qty} PCS
                      </td>
                      <td className="py-3 px-4 border border-gray-300 text-gray-800 font-semibold">
                        ₹{new Intl.NumberFormat('en-IN').format(Number(invoice.gross_amt))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-sm text-gray-600">
                  <p>Total Items / Qty : 1 / {invoice.qty}</p>
                  <div className="mt-3 space-y-1">
                    {invoice.discount && Number(invoice.discount) > 0 && (
                      <p>Discount: ₹{new Intl.NumberFormat('en-IN').format(Number(invoice.discount))}</p>
                    )}
                    {invoice.gst && Number(invoice.gst) > 0 && (
                      <p>GST: {invoice.gst}%</p>
                    )}
                    <p className={`font-semibold ${
                      invoice.payment_status === 'paid' ? 'text-green-600' : 
                      invoice.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Payment Status: {invoice.payment_status.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Gross Amount:</span>
                    <span className="text-gray-800">₹{new Intl.NumberFormat('en-IN').format(Number(invoice.gross_amt))}</span>
                  </div>
                  
                  {invoice.discount && Number(invoice.discount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-₹{new Intl.NumberFormat('en-IN').format(Number(invoice.discount))}</span>
                    </div>
                  )}
                  
                  {invoice.gst && Number(invoice.gst) > 0 && (
                    <div className="flex justify-between">
                      <span>GST ({invoice.gst}%):</span>
                      <span>+₹{new Intl.NumberFormat('en-IN').format((Number(invoice.gross_amt) * Number(invoice.gst)) / 100)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="font-semibold text-gray-800">
                      ₹{new Intl.NumberFormat('en-IN').format(Number(invoice.grand_total))}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-2">
                    <p className="text-sm text-gray-600">
                      Total amount (in words): <span className="font-semibold">INR {new Intl.NumberFormat('en-IN').format(Number(invoice.grand_total))} Rupees Only</span>
                    </p>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                    <span>Amount Payable:</span>
                    <span>₹{new Intl.NumberFormat('en-IN').format(Number(invoice.grand_total))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 border-t border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-gray-700 font-medium">For {invoice.biller_name}</p>
                  <p className="text-gray-500 text-sm mt-4">Authorized Signatory</p>
                </div>
              </div>

              <div className="text-center text-gray-500 text-sm border-t border-gray-300 pt-4">
                <p className="font-medium">Powered By</p>
                <p className="text-blue-600 mt-1">Swipe | Simple Invoicing, Billing and Payments</p>
                <p className="mt-2">Page 1 / 1 • This is a digitally signed document.</p>
                <p className="mt-2 font-medium text-green-600">Ab Business karo tension free</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}