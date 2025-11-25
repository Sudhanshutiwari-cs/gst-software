// components/invoice-templates/ModernTemplate.tsx
import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface ModernTemplateProps {
  invoiceData: InvoiceData | null;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ invoiceData }) => {
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
    <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-xl border border-blue-100">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">INVOICE</h1>
          <p className="text-blue-600 text-sm mt-1">ORIGINAL FOR RECIPIENT</p>
        </div>
        <div className="text-right">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            <p className="font-semibold">INVOICE #{invoiceData?.invoice_number || 'INV-1180'}</p>
          </div>
        </div>
      </div>

      {/* Company & Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-4">From</h3>
          <p className="font-semibold text-blue-700">Shyam CMYK</p>
          <p className="text-gray-600">Tatmil market, Ghantaghar</p>
          <p className="text-gray-600">Kanpur City, UTTAR PRADESH, 208015</p>
          <p className="text-gray-600">Mobile: +91 9856314765</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Bill To</h3>
          <p className="font-semibold text-gray-800">{invoiceData?.customer?.name || 'Sudhanshu Tiwari'}</p>
          <p className="text-gray-600">Ph: {invoiceData?.customer?.phone || '9140048553'}</p>
          <p className="text-gray-600">{invoiceData?.customer?.email || 'tiwarisudhanshu861@gmail.com'}</p>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Invoice Date</p>
            <p className="font-semibold">{formatDate(invoiceData?.invoice_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-semibold">{formatDate(invoiceData?.due_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="font-semibold">{invoiceData?.total_items || 1}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-semibold text-green-600">Paid</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <tr>
              <th className="p-4 text-left font-semibold">Item Description</th>
              <th className="p-4 text-center font-semibold">HSN/SAC</th>
              <th className="p-4 text-right font-semibold">Rate</th>
              <th className="p-4 text-center font-semibold">Qty</th>
              <th className="p-4 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items?.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-4 border-b border-gray-200">{item.description || 'PVR ID CARD COLOR'}</td>
                <td className="p-4 border-b border-gray-200 text-center">{item.hsn_sac || '113569'}</td>
                <td className="p-4 border-b border-gray-200 text-right">₹{formatCurrency(item.rate)}</td>
                <td className="p-4 border-b border-gray-200 text-center">{item.quantity || '100'} PCS</td>
                <td className="p-4 border-b border-gray-200 text-right">₹{formatCurrency((item.rate || 0) * (item.quantity || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-blue-800">
            ₹{formatCurrency(invoiceData?.total_amount || 4000)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Amount in words:</strong> INR {invoiceData?.amount_in_words || 'Four Thousand Rupees Only'}
        </p>
        <div className="flex justify-between items-center pt-4 border-t border-blue-200">
          <span className="text-lg font-bold">Amount Payable</span>
          <span className="text-xl font-bold text-green-600">
            ₹{formatCurrency(invoiceData?.amount_payable || 4000)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Thank you for your business! • This is a digitally signed document</p>
        <p className="mt-2 text-green-600 font-semibold">Ab Business karo tension free</p>
      </div>
    </div>
  );
};

export default ModernTemplate;