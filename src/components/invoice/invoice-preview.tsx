// components/invoice/invoice-preview.tsx
import { Invoice } from "../../../types/invoice"
import { useEffect } from "react"

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

  // Auto-adjust PDF preview on mount
  useEffect(() => {
    // Set viewport for PDF display
    const setPdfViewport = () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1')
      }
    }

    setPdfViewport()
  }, [])

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 print:p-0">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h1 className="text-xl md:text-2xl font-bold">Invoice #{invoice.invoice_id}</h1>
      </div>
      
      {/* PDF Container - Fixed width for consistent PDF rendering */}
      <div className="bg-white p-4 md:p-8 shadow-lg mx-auto w-full max-w-[210mm] print:shadow-none print:border-0 print:max-w-none" 
           style={{ 
             minHeight: '297mm',
             pageBreakInside: 'avoid'
           }}>
        
        {/* Modern Template */}
        {template === 'modern' && (
          <div className="modern-template">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
              <div className="w-full md:w-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">INVOICE</h1>
                <p className="text-gray-600">#{invoice.invoice_id}</p>
              </div>
              <div className="text-left md:text-right w-full md:w-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
              <div className="break-inside-avoid">
                <h3 className="font-semibold text-gray-700 mb-2">From:</h3>
                <p className="text-gray-800 font-medium">{invoice.biller_name}</p>
                <p className="text-gray-600">Vendor ID: {invoice.vendor_id}</p>
              </div>
              <div className="break-inside-avoid">
                <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
                <p className="text-gray-800 font-medium">{invoice.billing_to}</p>
                <p className="text-gray-600">{invoice.email}</p>
                {invoice.mobile && <p className="text-gray-600">{invoice.mobile}</p>}
              </div>
            </div>

            <div className="border-t border-b border-gray-200 py-4 mb-6 break-inside-avoid">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full">
                  <h4 className="font-semibold text-gray-800">{invoice.product_name}</h4>
                  <p className="text-gray-600 text-sm">SKU: {invoice.product_sku}</p>
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                  <p className="text-gray-800">Qty: {invoice.qty}</p>
                  <p className="text-gray-800 font-semibold">₹{invoice.grand_total}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-gray-200 pt-6 gap-4 break-inside-avoid">
              <div>
                <p className="text-gray-600">Gross Amount: ₹{invoice.gross_amt}</p>
                {parseFloat(invoice.gst) > 0 && (
                  <p className="text-gray-600">GST: ₹{invoice.gst}</p>
                )}
                {parseFloat(invoice.discount) > 0 && (
                  <p className="text-gray-600">Discount: -₹{invoice.discount}</p>
                )}
              </div>
              <div className="text-left md:text-right">
                <p className="text-lg font-bold text-gray-800">Total: ₹{invoice.grand_total}</p>
              </div>
            </div>
          </div>
        )}

        {/* Classic Template */}
        {template === 'classic' && (
          <div className="min-h-screen bg-white print:bg-white print:shadow-none">
            <div className="invoice-container bg-white w-full shadow-md p-4 md:p-6 border border-gray-400 print:border print:border-gray-400 print:p-6">
              
              {/* Invoice Title */}
              <div className="border-b border-gray-400 pb-2">
                <h1 className="text-center text-blue-700 text-sm tracking-widest font-semibold">
                  TAX INVOICE
                </h1>
              </div>

              {/* Header Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 mt-4 gap-4 border border-gray-400 break-inside-avoid">

                {/* Left Box */}
                <div className="p-3 md:p-4 border-b md:border-b-0 md:border-r border-gray-400 text-xs md:text-sm break-inside-avoid">
                  
                  {/* Logo + Vendor Details Row */}
                  <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                    
                    {/* Vendor Logo */}
                    <img
                      src="https://manhemdigitalsolutions.com/pos-admin/storage/app/public/vendor-logos/vepQupycfoL4Q2hANrVQKuvI8xiFhtZSo8RuqLgq.png"
                      alt="Vendor Logo"
                      className="h-12 w-12 md:h-14 md:w-14 object-contain mx-auto md:mx-0 print:h-12 print:w-12"
                    />

                    {/* Vendor Details */}
                    <div className="text-center md:text-left">
                      <h2 className="font-bold text-sm md:text-base">Shyam CMYK</h2>
                      <p>Tatmil market , Ghantaghar</p>
                      <p>Kanpur City, UTTAR PRADESH, 208015</p>
                      <p>Mobile: +91 9856314765</p>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-gray-400 my-3"></div>

                  {/* Customer Section */}
                  <p className="font-semibold">Customer Details:</p>
                  <p>Sudhanshu Tiwari</p>
                  <p>Ph: 9140048553</p>
                  <p>tiwarisudhanshu861@gmail.com</p>
                </div>

                {/* Right Box */}
                <div className="p-3 md:p-4 text-xs md:text-sm break-inside-avoid">
                  <div className="flex justify-between border-b border-gray-300 pb-2">
                    <p className="font-semibold">Invoice #:</p>
                    <p>INV-1179</p>
                  </div>

                  <div className="flex justify-between border-b border-gray-300 py-2">
                    <p className="font-semibold">Invoice Date:</p>
                    <p>15 Nov 2025</p>
                  </div>

                  <div className="flex justify-between py-2">
                    <p className="font-semibold">Due Date:</p>
                    <p>15 Nov 2025</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mt-6 print:overflow-visible">
                <table className="w-full border border-gray-400 border-collapse text-xs md:text-sm print:text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-2 py-2 text-left w-8 md:w-10">#</th>
                      <th className="border border-gray-400 px-2 py-2 text-left min-w-[150px]">Item</th>
                      <th className="border border-gray-400 px-2 py-2 text-left w-20 md:w-24">HSN/SAC</th>
                      <th className="border border-gray-400 px-2 py-2 text-left w-24 md:w-28">Rate / Item</th>
                      <th className="border border-gray-400 px-2 py-2 text-left w-16 md:w-20">Qty</th>
                      <th className="border border-gray-400 px-2 py-2 text-left w-24 md:w-28">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-2 md:py-3">1</td>
                      <td className="border border-gray-400 px-2 py-2 md:py-3">PVR ID CARD COLOR</td>
                      <td className="border border-gray-400 px-2 py-2 md:py-3">113569</td>
                      <td className="border border-gray-400 px-2 py-2 md:py-3">
                        38.00 <br /> 40.00 (-5%)
                      </td>
                      <td className="border border-gray-400 px-2 py-2 md:py-3">250 PCS</td>
                      <td className="border border-gray-400 px-2 py-2 md:py-3">9,500.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs md:text-sm mt-2 print:text-sm">
                Total Items / Qty : <b>1 / 250</b>
              </p>

              {/* Totals Box */}
              <div className="mt-4 border border-gray-400 p-3 md:p-4 text-xs md:text-sm break-inside-avoid print:p-4">
                <div className="flex justify-between border-b border-gray-300 pb-2">
                  <p className="font-semibold">Total</p>
                  <p>₹9,500.00</p>
                </div>

                <div className="flex justify-between border-b border-gray-300 py-2">
                  <p className="font-semibold">Total Discount</p>
                  <p>₹500.00</p>
                </div>

                <p className="mt-3 text-xs md:text-sm">
                  <b>Total amount (in words):</b> INR Nine Thousand, Five Hundred Rupees Only.
                </p>

                <div className="flex justify-between mt-4 text-base md:text-lg font-bold">
                  <p>Amount Payable:</p>
                  <p>₹9,500.00</p>
                </div>
              </div>

              {/* Signature Box */}
              <div className="mt-6 md:mt-10 border border-gray-400 p-3 md:p-4 text-right break-inside-avoid print:mt-8">
                <p className="font-semibold">For Shyam CMYK</p>

                <div className="h-12 md:h-16 flex justify-end mt-2">
                  <img
                    src="/signature.png"
                    alt="signature"
                    className="h-full object-contain print:h-14"
                  />
                </div>

                <p className="text-xs md:text-sm mt-2">Authorized Signatory</p>
              </div>

              <p className="text-center mt-4 md:mt-6 text-xs text-gray-500 print:text-xs">
                Swipe | Simple Invoicing, Billing and Payments | Visit getswipe.in
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}