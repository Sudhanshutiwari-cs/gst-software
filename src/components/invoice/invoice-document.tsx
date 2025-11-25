export function InvoiceDocument() {
  return (
    <div className="bg-white shadow-2xl w-[595px] min-h-[842px] relative">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <span className="text-[180px] font-bold text-zinc-400 rotate-[-30deg]">Swipe</span>
      </div>

      <div className="p-8 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-red-600 font-bold text-lg tracking-wider">TAX INVOICE</h1>
          <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">ORIGINAL FOR RECIPIENT</span>
        </div>

        {/* Company & Invoice Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="font-bold text-blue-600 text-lg">Shyam CMYK</h2>
            <p className="text-xs text-zinc-600">Tamil market, Dehradun</p>
            <p className="text-xs text-zinc-600">Kanpur City, UTTAR PRADESH, 208015</p>
            <p className="text-xs text-zinc-600">Mobile: +91 9856314765</p>
          </div>
          <div className="border border-zinc-300 rounded overflow-hidden">
            <div className="grid grid-cols-2 text-xs">
              <div className="border-r border-b border-zinc-300 p-2">
                <span className="text-zinc-500">Invoice #:</span>
                <p className="font-semibold">INV-1180</p>
              </div>
              <div className="border-b border-zinc-300 p-2">
                <span className="text-zinc-500">Invoice Date:</span>
                <p className="font-semibold">16 Nov 2025</p>
              </div>
              <div className="border-r border-zinc-300 p-2">
                <span className="text-zinc-500">Due Date:</span>
                <p className="font-semibold">16 Nov 2025</p>
              </div>
              <div className="p-2"></div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-6 border-b border-zinc-200 pb-4">
          <h3 className="text-xs font-semibold text-zinc-700 mb-1 border-b border-zinc-300 pb-1">Customer Details:</h3>
          <p className="font-semibold text-sm">Sudhanshu Tiwari</p>
          <p className="text-xs text-zinc-600">Ph: 9140048553</p>
          <p className="text-xs text-zinc-600">tiwarisudhanshu561@gmail.com</p>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs mb-6">
          <thead>
            <tr className="bg-zinc-100 border border-zinc-300">
              <th className="border-r border-zinc-300 p-2 text-left w-8">#</th>
              <th className="border-r border-zinc-300 p-2 text-left">Item</th>
              <th className="border-r border-zinc-300 p-2 text-center w-20">HSN/SAC</th>
              <th className="border-r border-zinc-300 p-2 text-right w-20">Rate / Item</th>
              <th className="border-r border-zinc-300 p-2 text-center w-16">Qty</th>
              <th className="p-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-x border-zinc-300">
              <td className="border-r border-zinc-300 p-2">1</td>
              <td className="border-r border-zinc-300 p-2 font-medium">PVR ID CARD COLOR</td>
              <td className="border-r border-zinc-300 p-2 text-center">113569</td>
              <td className="border-r border-zinc-300 p-2 text-right">40.00</td>
              <td className="border-r border-zinc-300 p-2 text-center">100 PCS</td>
              <td className="p-2 text-right">4,000.00</td>
            </tr>
            {/* Empty rows */}
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-x border-zinc-300 h-6">
                <td className="border-r border-zinc-300"></td>
                <td className="border-r border-zinc-300"></td>
                <td className="border-r border-zinc-300"></td>
                <td className="border-r border-zinc-300"></td>
                <td className="border-r border-zinc-300"></td>
                <td></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border border-zinc-300 bg-zinc-50">
              <td colSpan={4} className="p-2 text-xs text-zinc-500 border-r border-zinc-300">
                Total Items / Qty : 1 / 100
              </td>
              <td className="p-2 text-right font-semibold border-r border-zinc-300">Total</td>
              <td className="p-2 text-right font-bold">₹4,000.00</td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div className="text-xs mb-4 border-b border-zinc-200 pb-2">
          <span className="text-zinc-500">Total amount (in words): </span>
          <span className="font-medium">INR Four Thousand Rupees Only.</span>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-xs">
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Amount Payable:</span>
              <span className="font-bold">₹4,000.00</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-2">For Shyam CMYK</p>
            <div className="h-16 flex items-end justify-end">
              <img src="/handwritten-signature.png" alt="Signature" className="h-12 opacity-80" />
            </div>
            <p className="text-xs text-zinc-500 border-t border-zinc-300 pt-1 mt-1">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  )
}
