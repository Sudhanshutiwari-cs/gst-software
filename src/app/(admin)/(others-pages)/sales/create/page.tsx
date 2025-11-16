'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, AlertCircle, Search, X } from 'lucide-react'

// Mock data types
interface Customer {
  id: string
  name: string
  company: string
  gstin: string
  email: string
  phone: string
  address: string
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  hsnCode: string
  taxRate: number
}

interface InvoiceItem {
  id: string
  product: Product
  quantity: number
  unitPrice: number
  total: number
}

interface Bank {
  id: string
  name: string
  accountNumber: string
  ifsc: string
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    company: 'ABC Corporation',
    gstin: '07AABCU9603R1ZM',
    email: 'john@abccorp.com',
    phone: '+91 9876543210',
    address: '123 Business Street, New Delhi'
  },
  {
    id: '2',
    name: 'Jane Smith',
    company: 'XYZ Industries',
    gstin: '08BXYZS9603R1ZN',
    email: 'jane@xyz.com',
    phone: '+91 9876543211',
    address: '456 Industrial Area, Mumbai'
  }
]

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Laptop Computer',
    category: 'Electronics',
    price: 75000,
    stock: 15,
    hsnCode: '84713000',
    taxRate: 18
  },
  {
    id: '2',
    name: 'Office Chair',
    category: 'Furniture',
    price: 12000,
    stock: 25,
    hsnCode: '94013000',
    taxRate: 12
  },
  {
    id: '3',
    name: 'Printer',
    category: 'Electronics',
    price: 25000,
    stock: 8,
    hsnCode: '84433100',
    taxRate: 18
  }
]

const mockBanks: Bank[] = [
  {
    id: '1',
    name: 'HDFC Bank',
    accountNumber: 'XXXXXX1234',
    ifsc: 'HDFC0000123'
  },
  {
    id: '2',
    name: 'ICICI Bank',
    accountNumber: 'XXXXXX5678',
    ifsc: 'ICIC0000567'
  }
]

export default function CreateInvoice() {
  // Header & Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState('1181')
  const [invoiceType, setInvoiceType] = useState('regular')
  
  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  
  // Products State
  const [selectedProducts, setSelectedProducts] = useState<InvoiceItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productQuantity, setProductQuantity] = useState(1)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // Section Expansion State
  const [expandedNotes, setExpandedNotes] = useState(true)
  const [expandedTerms, setExpandedTerms] = useState(false)
  
  // Payment State
  const [isRoundedOff, setIsRoundedOff] = useState(true)
  const [selectedBank, setSelectedBank] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState('cash')
  
  // Notes & Terms
  const [notes, setNotes] = useState('')
  const [createEWaybill, setCreateEWaybill] = useState(false)
  const [createEInvoice, setCreateEInvoice] = useState(false)

  // Calculations
  const taxableAmount = selectedProducts.reduce((sum, item) => sum + item.total, 0)
  const totalTax = selectedProducts.reduce((sum, item) => sum + (item.total * item.product.taxRate / 100), 0)
  const totalAmount = taxableAmount + totalTax
  const roundedAmount = isRoundedOff ? Math.round(totalAmount) : totalAmount
  const roundOff = roundedAmount - totalAmount

  // Filter customers based on search
  useEffect(() => {
    if (customerSearch) {
      const filtered = mockCustomers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.company.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.gstin.toLowerCase().includes(customerSearch.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(mockCustomers)
    }
  }, [customerSearch])

  // Filter products based on search
  useEffect(() => {
    if (productSearch) {
      const filtered = mockProducts.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.category.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.hsnCode.toLowerCase().includes(productSearch.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(mockProducts)
    }
  }, [productSearch])

  // Mock API functions
  const saveInvoice = async () => {
    // Simulate API call
    console.log('Saving invoice...', {
      invoiceNumber,
      invoiceType,
      customer: selectedCustomer,
      items: selectedProducts,
      totalAmount: roundedAmount,
      payment: {
        notes: paymentNotes,
        amount: paymentAmount,
        mode: paymentMode
      }
    })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    alert('Invoice saved successfully!')
  }

  const saveAsDraft = async () => {
    console.log('Saving as draft...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('Draft saved successfully!')
  }

  const saveAndPrint = async () => {
    console.log('Saving and printing...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('Invoice saved and sent to printer!')
  }

  const addProductToBill = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.product.id === product.id)
    
    if (existingItem) {
      // Update quantity if product already exists
      setSelectedProducts(prev =>
        prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + productQuantity,
                total: (item.quantity + productQuantity) * item.unitPrice
              }
            : item
        )
      )
    } else {
      // Add new product
      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        product,
        quantity: productQuantity,
        unitPrice: product.price,
        total: productQuantity * product.price
      }
      setSelectedProducts(prev => [...prev, newItem])
    }
    
    // Reset search and quantity
    setProductSearch('')
    setProductQuantity(1)
    setShowProductDropdown(false)
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== productId))
  }

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setSelectedProducts(prev =>
      prev.map(item =>
        item.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.unitPrice
            }
          : item
      )
    )
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer.id)
    setCustomerSearch(customer.company)
    setShowCustomerDropdown(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-slate-600" />
            <h1 className="text-lg font-semibold text-slate-900">Create Invoice</h1>
            <span className="text-sm text-slate-600">Shriram Claryx</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-xs font-medium text-slate-600">INV-</span>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-16 border-0 bg-slate-100 text-center text-sm font-semibold rounded-md px-2 py-1"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={saveAsDraft}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Save as Draft
              </button>
              <button 
                onClick={saveAndPrint}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Save and Print
              </button>
              <button 
                onClick={saveInvoice}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6 p-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-4">
          {/* Type Selector */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">Type</span>
              <select 
                value={invoiceType} 
                onChange={(e) => setInvoiceType(e.target.value)}
                className="w-32 border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="regular">Regular</option>
                <option value="proforma">Proforma</option>
              </select>
            </div>
          </div>

          {/* Customer Section */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-slate-600" />
                <h2 className="font-semibold text-slate-900">Customer details</h2>
                <AlertCircle className="h-4 w-4 text-slate-400" />
              </div>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                + Add new Customer?
              </button>
            </div>

            <div className="mb-6 space-y-3">
              <label className="block text-xs font-medium text-slate-600">Select Customer</label>
              <div className="relative">
                <input
                  placeholder="Search your Customers, Company Name, GSTIN, tags..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setShowCustomerDropdown(true)
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
                {showCustomerDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium text-slate-900">{customer.company}</div>
                        <div className="text-xs text-slate-600">{customer.name} • {customer.gstin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  Custom Headers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Vehicle No', 'PO Number', 'Chalan No', 'Delivery Date', 'Sales Person', 'Dispatch Number'].map(
                    (header) => (
                      <button
                        key={header}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        + {header}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">Products & Services</h2>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">?</span>
              </div>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                + Add new Product?
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex gap-3">
              <div className="flex-1">
                <div className="mb-2 text-xs font-medium text-slate-600">All Categories</div>
                <div className="relative">
                  <input 
                    placeholder="Search or scan barcode for existing products" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      setShowProductDropdown(true)
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                  />
                  {showProductDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                          onClick={() => addProductToBill(product)}
                        >
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-600">
                            {product.category} • ₹{product.price} • Stock: {product.stock}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-20">
                <div className="mb-2 text-xs font-medium text-slate-600">Qty</div>
                <input 
                  placeholder="0" 
                  type="number" 
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex gap-2">
              <button 
                onClick={() => {
                  if (filteredProducts.length > 0) {
                    addProductToBill(filteredProducts[0])
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add to Bill
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                ⚡ Create Invoices with AI
                <span className="rounded bg-blue-100 px-1 text-xs font-medium text-blue-600">BETA</span>
              </button>
            </div>

            {/* Products Table */}
            {selectedProducts.length > 0 ? (
              <>
                <div className="mb-4 border-b border-slate-200 pb-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-700">
                    <div className="col-span-5">Product Name</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>
                </div>

                {selectedProducts.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 py-3 border-b border-slate-100 last:border-b-0">
                    <div className="col-span-5">
                      <div className="font-medium text-slate-900">{item.product.name}</div>
                      <div className="text-xs text-slate-600">HSN: {item.product.hsnCode} • Tax: {item.product.taxRate}%</div>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="col-span-2 text-slate-900">₹{item.unitPrice.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-medium text-slate-900">₹{item.total.toFixed(2)}</div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => removeProduct(item.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 h-16 w-16 rounded-lg bg-slate-100"></div>
                <p className="mb-4 text-sm text-slate-600">
                  Search existing products to add to this list or add new product to get started! 🎯
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  Add New Product
                </button>
              </div>
            )}

            {/* Additional Charges */}
            <div className="mt-6 flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                ⚙️ Additional Charges
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">Taxable Amount</span>
                <span className="font-semibold text-slate-900">₹ {taxableAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">Total Tax</span>
                <span className="font-semibold text-slate-900">₹ {totalTax.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-700">Round Off</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRoundedOff}
                    onChange={(e) => setIsRoundedOff(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="h-5 w-9 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-medium text-slate-600">{roundOff.toFixed(2)}</span>
                </label>
              </div>

              <div className="border-t border-green-200 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">₹ {roundedAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Total Discount</span>
                  <span>₹ 0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Selection */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Select Bank</h3>
              <AlertCircle className="h-4 w-4 text-slate-400" />
            </div>
            <select 
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Bank</option>
              {mockBanks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} - {bank.accountNumber}
                </option>
              ))}
            </select>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors mt-3">
              🏦 Add Bank to Invoice (Optional)
            </button>
          </div>

          {/* Payment Notes */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-slate-900">Add payment (Payment Notes, Amount and Mode)</h3>
            <div className="space-y-3 mt-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Notes</label>
                <textarea 
                  placeholder="Advance received, UTR number etc..." 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Amount</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Mode</label>
                  <select 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <button className="text-xs font-medium text-slate-700 hover:text-slate-900">
                💚 Split Payment
              </button>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Select Signature</h3>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                + Add New Signature
              </button>
            </div>

            <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="none">No Signature</option>
              <option value="sig1">Signature 1</option>
            </select>

            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-pink-200 bg-pink-50 mt-3">
              <span className="text-sm text-slate-600">Signature on the document</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Sections */}
      <div className="space-y-4 px-6 pb-6">
        {/* Notes & Terms */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {/* Notes */}
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <button
                onClick={() => setExpandedNotes(!expandedNotes)}
                className="mb-3 flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={`h-4 w-4 text-slate-600 transition-transform ${!expandedNotes ? '-rotate-90' : ''}`}
                  />
                  <h3 className="font-semibold text-slate-900">Notes</h3>
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                </div>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  + New Notes
                </button>
              </button>

              {expandedNotes && (
                <div className="space-y-3">
                  <textarea 
                    placeholder="Enter your notes, say thanks, or anything else" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-purple-100 text-center text-xs font-bold text-purple-600">✨</span>
                    <span className="text-xs text-slate-600">AI</span>
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <button
                onClick={() => setExpandedTerms(!expandedTerms)}
                className="mb-3 flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={`h-4 w-4 text-slate-600 transition-transform ${expandedTerms ? 'rotate-90' : ''}`}
                  />
                  <h3 className="font-semibold text-slate-900">Terms & Conditions</h3>
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                </div>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  + New Term
                </button>
              </button>

              {expandedTerms && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="ewaybill"
                        checked={createEWaybill}
                        onChange={(e) => setCreateEWaybill(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Create E-Waybill</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="einvoice"
                        checked={createEInvoice}
                        onChange={(e) => setCreateEInvoice(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Create E-Invoice</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700">Attach files</h4>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                      📎 Attach Files (Max: 5)
                    </button>
                  </div>

                  <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    Use Coupons FT14
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}