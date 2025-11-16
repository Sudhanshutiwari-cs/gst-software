'use client';

import { useState } from 'react';
import { ChevronDown, Play, Settings, Plus, Eye, Send, MoreVertical, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'draft';
  mode?: string;
  billNumber: string;
  customer: string;
  phone: string;
  date: string;
  time: string;
  daysSincePending?: number;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 4000.0,
    status: 'pending',
    billNumber: 'INV-1180',
    customer: 'Sudhanshu Tiwari',
    phone: '+919140048553',
    date: '16 Nov 2025',
    time: '12 hours ago',
  },
  {
    id: '2',
    amount: 9500.0,
    status: 'pending',
    billNumber: 'INV-1179',
    customer: 'Sudhanshu Tiwari',
    phone: '+919140048553',
    date: '15 Nov 2025',
    time: 'Yesterday, 8:57 PM',
    daysSincePending: 1,
  },
];

type TabType = 'all' | 'pending' | 'paid' | 'cancelled' | 'drafts';

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const allTransactionCount = mockTransactions.length;

  const filteredTransactions =
    activeTab === 'all'
      ? mockTransactions
      : mockTransactions.filter((t) => t.status === activeTab);

  const total = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const paid = mockTransactions.filter((t) => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
  const pending = mockTransactions.filter((t) => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Sales</h1>
            <Play className="h-6 w-6 fill-pink-500 text-pink-500" />
          </div>

          {/* Replaced ShadCN Buttons */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900">
              <Settings className="h-5 w-5" />
              <span>Document Settings</span>
            </button>

            <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium">
              POS Billing
            </button>

            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border px-6">
          <div className="flex gap-8">
            {[
              { id: 'all' as TabType, label: 'All Transactions', count: allTransactionCount },
              { id: 'pending' as TabType, label: 'Pending', count: 0 },
              { id: 'paid' as TabType, label: 'Paid', count: 0 },
              { id: 'cancelled' as TabType, label: 'Cancelled', count: 0 },
              { id: 'drafts' as TabType, label: 'Drafts', count: 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-0 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.id === 'all' && <span className="ml-2 text-gray-500">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="p-6">
        {/* Search + Filters */}
        <div className="mb-6 flex gap-4">
          <input
            placeholder="Search by transaction, customers, invoice #..."
            className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg"
          />

          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200">
              This Year
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200">
              Actions
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Card → Replaced with plain div */}
        <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  {['Amount', 'Status', 'Mode', 'Bill #', 'Customer', 'Date', 'Actions'].map((head) => (
                    <th key={head} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        {head}
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows */}
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold">₹{t.amount.toFixed(2)}</td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                          {t.status}
                        </span>
                        <span className="text-red-500">⚠</span>
                      </div>
                      {t.daysSincePending && (
                        <p className="text-xs text-red-500">since {t.daysSincePending} day</p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">-</td>
                    <td className="px-6 py-4 text-sm font-medium">{t.billNumber}</td>

                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium">{t.customer}</p>
                      <p className="text-xs text-gray-500">{t.phone}</p>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium">{t.date}</p>
                      <p className="text-xs text-gray-500">{t.time}</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded bg-yellow-100 p-1 text-yellow-700 hover:bg-yellow-200">
                          <span className="text-xs font-medium">₹</span>
                        </button>

                        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                          <Send className="h-4 w-4" />
                          Send
                        </button>

                        <button className="p-1 text-gray-600 hover:text-gray-900">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary + Pagination */}
        <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 px-6 py-4">
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-bold">₹{total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-lg font-bold">₹{paid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-lg font-bold text-orange-600">₹{pending.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-1 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button className="h-8 w-8 rounded bg-blue-600 text-white font-semibold">1</button>

            <button className="p-1 text-gray-600 hover:text-gray-900">
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="rounded border border-gray-200 px-2 py-1 text-sm bg-background cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">/ page</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
