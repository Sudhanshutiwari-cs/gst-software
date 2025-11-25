// components/invoice-templates/ClassicTemplate.tsx
import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface ClassicTemplateProps {
  invoiceData: InvoiceData | null;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ invoiceData }) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '16 Nov 2025';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '16 Nov 2025';
    }
  };

  const formatCurrency = (amount?: number): string => {
    return (amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="bg-white p-8 border-2 border-gray-800">
      {/* Header with border */}
      <div className="border-b-4 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-600 text-sm mt-1 uppercase tracking-wide">ORIGINAL FOR RECIPIENT</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">INVOICE #: {invoiceData?.invoice_number || 'INV-1180'}</p>
            <p className="text-sm">Date: {formatDate(invoiceData?.invoice_date)}</p>
            <p className="text-sm">Due: {formatDate(invoiceData?.due_date)}</p>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Shyam CMYK</h2>
        <p className="text-gray-700">Tatmil market, Ghantaghar</p>
        <p className="text-gray-700">Kanpur City, UTTAR PRADESH, 208015</p>
        <p className="text-gray-700">Mobile: +91 9856314765</p>
      </div>

      {/* Customer Info */}
      <div className="mb-6 p-4 bg-gray-100 border-l-4 border-gray-600">
        <h3 className="font-bold text-lg mb-2">Customer Details:</h3>
        <p className="text-gray-800">{invoiceData?.customer?.name || 'Sudhanshu Tiwari'}</p>
        <p className="text-gray-700">Ph: {invoiceData?.customer?.phone || '9140048553'}</p>
        <p className="text-gray-700">{invoiceData?.customer?.email || 'tiwarisudhanshu861@gmail.com'}</p>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-700 p-3 text-left font-bold">Item Description</th>
              <th className="border border-gray-700 p-3 text-center font-bold">HSN/SAC</th>
              <th className="border border-gray-700 p-3 text-right font-bold">Rate</th>
              <th className="border border-gray-700 p-3 text-center font-bold">Qty</th>
              <th className="border border-gray-700 p-3 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items?.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 p-3">{item.description || 'PVR ID CARD COLOR'}</td>
                <td className="border border-gray-300 p-3 text-center">{item.hsn_sac || '113569'}</td>
                <td className="border border-gray-300 p-3 text-right">₹{formatCurrency(item.rate)}</td>
                <td className="border border-gray-300 p-3 text-center">{item.quantity || '100'} PCS</td>
                <td className="border border-gray-300 p-3 text-right">₹{formatCurrency((item.rate || 0) * (item.quantity || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="border-t-4 border-gray-800 pt-4">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Total Items / Qty:</span>
          <span>{invoiceData?.total_items || 1} / {invoiceData?.total_quantity || 100}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Total:</span>
          <span className="font-semibold">₹{formatCurrency(invoiceData?.total_amount || 4000)}</span>
        </div>
        <div className="mb-4 p-3 bg-gray-100 border">
          <p className="text-sm">
            <strong>Total amount (in words):</strong> INR {invoiceData?.amount_in_words || 'Four Thousand Rupees Only'}.
          </p>
        </div>
        <div className="flex justify-between items-center border-t border-gray-600 pt-3">
          <span className="text-lg font-bold">Amount Payable:</span>
          <span className="text-lg font-bold">₹{formatCurrency(invoiceData?.amount_payable || 4000)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-gray-600 pt-4 text-center">
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <p className="text-sm">For Shyam CMYK</p>
            <p className="text-sm font-semibold mt-4">Authorized Signatory</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Powered By</p>
            <p className="text-sm font-semibold">Swipe</p>
            <p className="text-xs text-blue-600">Visit getswipe.in</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Page 1 / 1 • This is a digitally signed document.</p>
        <p className="text-sm text-green-600 font-semibold mt-2">Ab Business karo tension free</p>
      </div>
    </div>
  );
};

export default ClassicTemplate;