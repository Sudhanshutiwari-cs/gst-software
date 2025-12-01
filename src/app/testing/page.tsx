"use client";
import React from "react";

export default function InvoicePage() {
    return (
        <>
            {/* Print Optimized CSS */}
            <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }

          /* Force A4 page size */
          @page {
            size: A4;
            margin: 15mm;
          }

          /* Container print width */
          .invoice-container {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Prevent table break */
          table,
          tr,
          td,
          th {
            page-break-inside: avoid !important;
          }

          /* Ensure borders print clearly */
          .border,
          .border-gray-400,
          .border-gray-300 {
            border-color: #000 !important;
          }

          /* Remove gray background for print */
          .bg-gray-100 {
            background-color: #f7f7f7 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

            {/* PAGE */}
            <div className="min-h-screen bg-gray-100 p-6 flex justify-center no-print">
                <button
                    className="mb-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
                    onClick={() => window.print()}
                >
                    Print Invoice
                </button>
            </div>

            <div className="min-h-screen bg-gray-100 p-6 flex justify-center print:p-0">
                <div className="invoice-container bg-white w-full max-w-4xl shadow-md p-6 border border-gray-400">

                    {/* Invoice Title */}
                    <div className="border-b border-gray-400 pb-2">
                        <h1 className="text-center text-blue-700 text-sm tracking-widest font-semibold">
                            TAX INVOICE
                        </h1>
                    </div>

                    {/* Header Section */}
                    <div className="grid grid-cols-2 mt-4 gap-4 border border-gray-400">

                        {/* Left Box */}
                        {/* Left Box (Vendor + Customer with dividing line) */}
                        <div className="p-4 border-r border-gray-400 text-sm">

  {/* Logo + Vendor Details Row */}
  <div className="flex items-start gap-4">

    {/* Vendor Logo */}
    <img
      src="https://manhemdigitalsolutions.com/pos-admin/storage/app/public/vendor-logos/vepQupycfoL4Q2hANrVQKuvI8xiFhtZSo8RuqLgq.png"   // keep logo inside /public/
      alt="Vendor Logo"
      className="h-14 w-14 object-contain"
    />

    {/* Vendor Details */}
    <div>
      <h2 className="font-bold">Shyam CMYK</h2>
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
                        <div className="p-4 text-sm">
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
                    <table className="w-full mt-6 border border-gray-400 border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-400 px-2 py-2 text-left w-10">#</th>
                                <th className="border border-gray-400 px-2 py-2 text-left">Item</th>
                                <th className="border border-gray-400 px-2 py-2 text-left w-24">HSN/SAC</th>
                                <th className="border border-gray-400 px-2 py-2 text-left w-28">Rate / Item</th>
                                <th className="border border-gray-400 px-2 py-2 text-left w-20">Qty</th>
                                <th className="border border-gray-400 px-2 py-2 text-left w-28">Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td className="border border-gray-400 px-2 py-3">1</td>
                                <td className="border border-gray-400 px-2 py-3">PVR ID CARD COLOR</td>
                                <td className="border border-gray-400 px-2 py-3">113569</td>
                                <td className="border border-gray-400 px-2 py-3">
                                    38.00 <br /> 40.00 (-5%)
                                </td>
                                <td className="border border-gray-400 px-2 py-3">250 PCS</td>
                                <td className="border border-gray-400 px-2 py-3">9,500.00</td>
                            </tr>
                        </tbody>
                    </table>

                    <p className="text-sm mt-2">
                        Total Items / Qty : <b>1 / 250</b>
                    </p>

                    {/* Totals Box */}
                    <div className="mt-4 border border-gray-400 p-4 text-sm">

                        <div className="flex justify-between border-b border-gray-300 pb-2">
                            <p className="font-semibold">Total</p>
                            <p>₹9,500.00</p>
                        </div>

                        <div className="flex justify-between border-b border-gray-300 py-2">
                            <p className="font-semibold">Total Discount</p>
                            <p>₹500.00</p>
                        </div>

                        <p className="mt-3">
                            <b>Total amount (in words):</b> INR Nine Thousand, Five Hundred Rupees Only.
                        </p>

                        <div className="flex justify-between mt-4 text-lg font-bold">
                            <p>Amount Payable:</p>
                            <p>₹9,500.00</p>
                        </div>

                    </div>

                    {/* Signature Box */}
                    <div className="mt-10 border border-gray-400 p-4 text-right">
                        <p className="font-semibold">For Shyam CMYK</p>

                        <div className="h-16 flex justify-end">
                            <img
                                src="/signature.png"
                                alt="signature"
                                className="h-full object-contain"
                            />
                        </div>

                        <p className="text-sm">Authorized Signatory</p>
                    </div>

                    <p className="text-center mt-6 text-xs text-gray-500">
                        Swipe | Simple Invoicing, Billing and Payments | Visit getswipe.in
                    </p>

                </div>
            </div>
        </>
    );
}
