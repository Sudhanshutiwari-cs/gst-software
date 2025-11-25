'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Plus, AlertCircle, X, UserPlus, Loader2, Menu, ArrowLeft } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

// Vendor Profile interface
interface VendorProfile {
  id: string
  name: string
  email: string
  phone: string
  shop_name: string
  shop_address: string
  shop_logo?: string
  business_type?: string
  gst_number?: string
  pan_number?: string
  status: string
  created_at: string
  updated_at: string
}

// Customer interface
interface Customer {
  id: string
  name: string
  company: string
  gstin: string
  email: string
  phone: string
  address: string
  city?: string
  pincode?: string
}

// Product interface based on your API response
interface Product {
  id: string
  name: string
  category?: string
  price: number
  stock?: number
  hsnCode?: string
  taxRate?: number
  description?: string
  sku?: string
  product_image?: string
  vendor_id?: string
}

// Interface for API product response
interface ApiProduct {
  id?: string | number
  product_name?: string
  name?: string
  title?: string
  sale_price?: string | number
  price?: string | number
  cost_price?: string | number
  stock_quantity?: string | number
  stock?: string | number
  quantity?: string | number
  tax_rate?: string | number
  tax?: string | number
  gst_rate?: string | number
  hsn_code?: string
  hsn?: string
  hsn_number?: string
  category_name?: string
  category?: string
  product_category?: string
  description?: string
  product_description?: string
  sku?: string
  product_sku?: string
  product_image?: string
  vendor_id?: string
}

interface InvoiceItem {
  id: string
  product: Product
  quantity: number
  unitPrice: number
  total: number
  gst?: number
  discount?: number
}

interface Bank {
  id: string
  name: string
  accountNumber: string
  ifsc: string
}

// Add Customer Form Data interface
interface AddCustomerFormData {
  name: string
  mobile: string
  email: string
  gstin: string
  address: string
  city: string
  pincode: string
  company?: string
}

// Invoice Data interface for API
interface InvoiceData {
  biller_name: string
  billing_to: string
  mobile?: string
  email?: string
  whatapp_number?: string
  product_name: string
  product_id?: number
  product_sku?: string
  qty: number
  gross_amt: number
  gst?: number
  tax_inclusive?: boolean
  discount?: number
  grand_total: number
  payment_status: string
  payment_mode?: string
  utr_number?: string
}

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

export default function UpdateInvoice() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  // Header & Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceType, setInvoiceType] = useState('regular')
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  
  // Vendor Profile State
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  
  // Customer State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerError, setCustomerError] = useState('')
  
  // Add Customer Slider State
  const [showAddCustomerSlider, setShowAddCustomerSlider] = useState(false)
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [addCustomerError, setAddCustomerError] = useState('')
  const [addCustomerSuccess, setAddCustomerSuccess] = useState('')
  
  // Add Customer Form State
  const [customerFormData, setCustomerFormData] = useState<AddCustomerFormData>({
    name: '',
    mobile: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    pincode: '',
    company: ''
  })
  
  // Products State
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<InvoiceItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productQuantity, setProductQuantity] = useState(1)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productError, setProductError] = useState('')
  
  // Section Expansion State
  const [expandedNotes, setExpandedNotes] = useState(true)
  const [expandedTerms, setExpandedTerms] = useState(false)
  
  // Payment State
  const [isRoundedOff, setIsRoundedOff] = useState(true)
  const [selectedBank, setSelectedBank] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState('cash')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [utrNumber, setUtrNumber] = useState('')
  
  // Notes & Terms
  const [notes, setNotes] = useState('')
  const [createEWaybill, setCreateEWaybill] = useState(false)
  const [createEInvoice, setCreateEInvoice] = useState(false)

  // Loading states for API calls
  const [updatingInvoice, setUpdatingInvoice] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')

  // Existing invoice loading state
  const [loadingInvoice, setLoadingInvoice] = useState(true)
  const [invoiceError, setInvoiceError] = useState('')

  // Get JWT token helper function
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    }
    return null
  }

  // Helper function to safely format numbers
  const formatCurrency = (value: unknown): string => {
    if (value === null || value === undefined) return '0.00'
    const num = typeof value === 'number' ? value : parseFloat(value as string)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  // Helper function to calculate tax rate from GST amount and gross amount
  const calculateTaxRate = (gstAmount: number, grossAmount: number): number => {
    if (!grossAmount || grossAmount === 0) return 0
    return (gstAmount / grossAmount) * 100
  }

  // API function to fetch existing invoice - UPDATED
  const fetchInvoice = useCallback(async () => {
    setLoadingInvoice(true)
    setInvoiceError('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Invoice API Response:', data)
      
      if (data.success && data.data) {
        const invoice = data.data
        console.log('Invoice data:', invoice)
        
        // Parse all numeric values from strings
        const grossAmt = parseFloat(invoice.gross_amt) || 0
        const qty = parseInt(invoice.qty) || 1
        const gst = parseFloat(invoice.gst) || 0
        const discount = parseFloat(invoice.discount) || 0
        const grandTotal = parseFloat(invoice.grand_total) || 0
        
        // Set basic invoice info
        setInvoiceNumber(invoice.invoice_id || '')
        setPaymentStatus(invoice.payment_status || 'pending')
        setPaymentMode(invoice.payment_mode || 'cash')
        setUtrNumber(invoice.utr_number || '')
        setNotes(invoice.notes || '')
        setPaymentAmount(grandTotal)

        // Set customer data if available
        if (invoice.billing_to) {
          setCustomerSearch(invoice.billing_to)
        }

        // Create product item from the single product in the invoice
        const productItem: InvoiceItem = {
          id: invoice.id?.toString() || Date.now().toString(),
          product: {
            id: invoice.product_id?.toString() || '1',
            name: invoice.product_name || 'Product',
            price: grossAmt / qty,
            sku: invoice.product_sku,
            hsnCode: invoice.hsn_code,
            taxRate: calculateTaxRate(gst, grossAmt),
            category: invoice.category,
            stock: parseInt(invoice.stock) || 0,
            description: invoice.description
          },
          quantity: qty,
          unitPrice: grossAmt / qty,
          total: grossAmt,
          gst: gst,
          discount: discount
        }
        
        console.log('Created product item:', productItem)
        setSelectedProducts([productItem])
        
      } else {
        throw new Error('Invoice not found')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      setInvoiceError(error instanceof Error ? error.message : 'Failed to load invoice')
    } finally {
      setLoadingInvoice(false)
    }
  }, [invoiceId])

  // API function to fetch vendor profile
  const fetchVendorProfile = useCallback(async () => {
    setLoadingProfile(true)
    setProfileError('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch vendor profile: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Vendor Profile API Response:', data)
      
      if (data.success && data.data) {
        setVendorProfile(data.data)
      } else if (data.data) {
        setVendorProfile(data.data)
      } else if (data.profile) {
        setVendorProfile(data.profile)
      } else {
        setVendorProfile(data)
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error)
      setProfileError(error instanceof Error ? error.message : 'Failed to load vendor profile')
    } finally {
      setLoadingProfile(false)
    }
  }, [])

  // API function to fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true)
    setCustomerError('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Customers API Response:', data)
      
      if (data.success && data.data) {
        setCustomers(data.data)
      } else if (Array.isArray(data)) {
        setCustomers(data)
      } else if (data.data && Array.isArray(data.data)) {
        setCustomers(data.data)
      } else {
        throw new Error('Unexpected API response format for customers')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomerError(error instanceof Error ? error.message : 'Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }, [])

  // API function to add customer
  const addCustomer = async (formData: AddCustomerFormData) => {
    setAddingCustomer(true)
    setAddCustomerError('')
    setAddCustomerSuccess('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/add-customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          gstin: formData.gstin,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          ...(formData.company && { company: formData.company })
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to add customer: ${response.status}`)
      }

      if (data.success) {
        setAddCustomerSuccess('Customer added successfully!')
        setCustomerFormData({
          name: '',
          mobile: '',
          email: '',
          gstin: '',
          address: '',
          city: '',
          pincode: '',
          company: ''
        })
        setTimeout(() => {
          fetchCustomers()
          setShowAddCustomerSlider(false)
        }, 1500)
      } else {
        throw new Error(data.message || 'Failed to add customer')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      setAddCustomerError(error instanceof Error ? error.message : 'Failed to add customer')
    } finally {
      setAddingCustomer(false)
    }
  }

  // API function to fetch products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    setProductError('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Products API Response:', data)
      
      let productsData: ApiProduct[] = []

      if (data.success && data.data && Array.isArray(data.data)) {
        productsData = data.data
      } else if (Array.isArray(data)) {
        productsData = data
      } else if (data.data && Array.isArray(data.data)) {
        productsData = data.data
      } else if (data.products && Array.isArray(data.products)) {
        productsData = data.products
      } else {
        throw new Error('Unexpected API response format for products')
      }

      const transformedProducts: Product[] = productsData.map((item: ApiProduct) => {
        let price = 0
        if (item.sale_price !== undefined && item.sale_price !== null) {
          price = parseFloat(item.sale_price.toString())
        } else if (item.price !== undefined && item.price !== null) {
          price = parseFloat(item.price.toString())
        } else if (item.cost_price !== undefined && item.cost_price !== null) {
          price = parseFloat(item.cost_price.toString())
        }

        let stock = 0
        if (item.stock_quantity !== undefined && item.stock_quantity !== null) {
          stock = parseInt(item.stock_quantity.toString())
        } else if (item.stock !== undefined && item.stock !== null) {
          stock = parseInt(item.stock.toString())
        } else if (item.quantity !== undefined && item.quantity !== null) {
          stock = parseInt(item.quantity.toString())
        }

        let taxRate = 0
        if (item.tax_rate !== undefined && item.tax_rate !== null) {
          taxRate = parseFloat(item.tax_rate.toString())
        } else if (item.tax !== undefined && item.tax !== null) {
          taxRate = parseFloat(item.tax.toString())
        } else if (item.gst_rate !== undefined && item.gst_rate !== null) {
          taxRate = parseFloat(item.gst_rate.toString())
        }

        let hsnCode = ''
        if (item.hsn_code !== undefined && item.hsn_code !== null) {
          hsnCode = item.hsn_code
        } else if (item.hsn !== undefined && item.hsn !== null) {
          hsnCode = item.hsn
        } else if (item.hsn_number !== undefined && item.hsn_number !== null) {
          hsnCode = item.hsn_number
        }

        return {
          id: item.id?.toString() || Math.random().toString(),
          name: item.product_name || item.name || item.title || 'Unnamed Product',
          category: item.category_name || item.category || item.product_category || '',
          price: price,
          stock: stock,
          hsnCode: hsnCode,
          taxRate: taxRate,
          description: item.description || item.product_description || '',
          sku: item.sku || item.product_sku || '',
          product_image: item.product_image || undefined,
          vendor_id: item.vendor_id || ''
        }
      })

      console.log('Transformed Products:', transformedProducts)
      setProducts(transformedProducts)

    } catch (error) {
      console.error('Error fetching products:', error)
      setProductError(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  // API function to update invoice
  const updateInvoice = async (invoiceData: InvoiceData) => {
    setUpdatingInvoice(true)
    setUpdateError('')
    setUpdateSuccess('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices/update/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to update invoice: ${response.status}`)
      }

      if (data.success) {
        setUpdateSuccess('Invoice updated successfully!')
        return data
      } else {
        throw new Error(data.message || 'Failed to update invoice')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      setUpdateError(error instanceof Error ? error.message : 'Failed to update invoice')
      throw error
    } finally {
      setUpdatingInvoice(false)
    }
  }

  // Prepare and submit invoice data
  const prepareInvoiceData = (): InvoiceData => {
    if (selectedProducts.length === 0) {
      throw new Error('Please add at least one product to the invoice')
    }

    if (!selectedCustomerData && !customerSearch) {
      throw new Error('Please select a customer')
    }

    if (!vendorProfile) {
      throw new Error('Vendor profile not loaded')
    }

    const firstProduct = selectedProducts[0]
    const totalDiscount = selectedProducts.reduce((sum, item) => sum + (item.discount || 0), 0)
    const totalGST = selectedProducts.reduce((sum, item) => sum + (item.gst || 0), 0)

    return {
      biller_name: vendorProfile.shop_name || vendorProfile.name,
      billing_to: selectedCustomerData?.company || selectedCustomerData?.name || customerSearch,
      mobile: selectedCustomerData?.phone || undefined,
      email: selectedCustomerData?.email || undefined,
      whatapp_number: selectedCustomerData?.phone || undefined,
      product_name: firstProduct.product.name,
      product_id: parseInt(firstProduct.product.id) || undefined,
      product_sku: firstProduct.product.sku || undefined,
      qty: firstProduct.quantity,
      gross_amt: taxableAmount,
      gst: totalGST || undefined,
      tax_inclusive: false,
      discount: totalDiscount || undefined,
      grand_total: roundedAmount,
      payment_status: paymentStatus,
      payment_mode: paymentMode !== 'cash' ? paymentMode : undefined,
      utr_number: utrNumber || undefined
    }
  }

  // Update invoice function
  const handleUpdateInvoice = async () => {
    try {
      const invoiceData = prepareInvoiceData()
      const result = await updateInvoice(invoiceData)
      console.log('Invoice updated successfully:', result)
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }

  const updateAsDraft = async () => {
    try {
      const invoiceData = prepareInvoiceData()
      const draftData = { ...invoiceData, payment_status: 'draft' }
      const result = await updateInvoice(draftData)
      console.log('Draft updated successfully:', result)
    } catch (error) {
      console.error('Error updating draft:', error)
    }
  }

  const updateAndPrint = async () => {
    try {
      const invoiceData = prepareInvoiceData()
      const result = await updateInvoice(invoiceData)
      console.log('Invoice updated and ready for print:', result)
      alert('Invoice updated and sent to printer!')
    } catch (error) {
      console.error('Error updating and printing invoice:', error)
    }
  }

  // Check mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setShowMobileSidebar(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Fetch all data on component mount
  useEffect(() => {
    fetchInvoice()
    fetchVendorProfile()
    fetchCustomers()
    fetchProducts()
  }, [fetchInvoice, fetchVendorProfile, fetchCustomers, fetchProducts])

  // Filter customers based on search
  useEffect(() => {
    if (customerSearch) {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.company?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.gstin?.toLowerCase().includes(customerSearch.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [customerSearch, customers])

  // Filter products based on search
  useEffect(() => {
    if (productSearch) {
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.hsnCode?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearch.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [productSearch, products])

  // Calculations - UPDATED with safe number handling
  const taxableAmount = selectedProducts.reduce((sum, item) => {
    const itemTotal = typeof item.total === 'number' ? item.total : parseFloat(item.total as string) || 0
    return sum + itemTotal
  }, 0)

  const totalTax = selectedProducts.reduce((sum, item) => {
    const itemTax = typeof item.product.taxRate === 'number' ? item.product.taxRate : parseFloat(item.product.taxRate as string) || 0
    const itemTotal = typeof item.total === 'number' ? item.total : parseFloat(item.total as string) || 0
    return sum + (itemTotal * itemTax / 100)
  }, 0)

  const totalAmount = taxableAmount + totalTax
  const roundedAmount = isRoundedOff ? Math.round(totalAmount) : totalAmount
  const roundOff = roundedAmount - totalAmount

  const addProductToBill = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.product.id === product.id)
    
    if (existingItem) {
      setSelectedProducts(prev =>
        prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + productQuantity,
                total: (item.quantity + productQuantity) * item.unitPrice,
                gst: ((item.quantity + productQuantity) * item.unitPrice * (product.taxRate || 0)) / 100
              }
            : item
        )
      )
    } else {
      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        product,
        quantity: productQuantity,
        unitPrice: product.price,
        total: productQuantity * product.price,
        gst: (productQuantity * product.price * (product.taxRate || 0)) / 100
      }
      setSelectedProducts(prev => [...prev, newItem])
    }
    
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
              total: newQuantity * item.unitPrice,
              gst: (newQuantity * item.unitPrice * (item.product.taxRate || 0)) / 100
            }
          : item
      )
    )
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer.id)
    setSelectedCustomerData(customer)
    setCustomerSearch(customer.company || customer.name)
    setShowCustomerDropdown(false)
  }

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCustomer(customerFormData)
  }

  const handleCustomerFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCustomerFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const openAddCustomerSlider = () => {
    setShowAddCustomerSlider(true)
    setAddCustomerError('')
    setAddCustomerSuccess('')
  }

  const closeAddCustomerSlider = () => {
    setShowAddCustomerSlider(false)
    setCustomerFormData({
      name: '',
      mobile: '',
      email: '',
      gstin: '',
      address: '',
      city: '',
      pincode: '',
      company: ''
    })
    setAddCustomerError('')
    setAddCustomerSuccess('')
  }

  const retryFetchProfile = () => {
    fetchVendorProfile()
  }

  const retryFetchCustomers = () => {
    fetchCustomers()
  }

  const retryFetchProducts = () => {
    fetchProducts()
  }

  const retryFetchInvoice = () => {
    fetchInvoice()
  }

  // Mobile sidebar toggle
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar)
  }

  // Required field indicator component
  const RequiredStar = () => <span className="text-red-500 ml-1">*</span>

  // Show loading state while fetching invoice
  if (loadingInvoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  // Show error state if invoice fails to load
  if (invoiceError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{invoiceError}</p>
          <button
            onClick={retryFetchInvoice}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </button>
            {isMobile && (
              <button
                onClick={toggleMobileSidebar}
                className="p-2 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Menu className="h-4 w-4 text-slate-600" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 text-slate-600" />
            <h1 className="text-lg font-semibold text-slate-900">Update Invoice #{invoiceNumber}</h1>
            <span className="hidden sm:inline text-sm text-slate-600">
              {loadingProfile ? (
                'Loading...'
              ) : profileError ? (
                <span className="text-red-600">Error loading profile</span>
              ) : vendorProfile ? (
                vendorProfile.shop_name || 'Vendor Shop'
              ) : (
                'Shriram Claryx'
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-xs font-medium text-slate-600">INV-</span>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-16 border-0 bg-slate-100 text-center text-sm font-semibold rounded-md px-2 py-1"
              />
            </div>
            <div className="flex gap-1 md:gap-2">
              <button 
                onClick={updateAsDraft}
                disabled={updatingInvoice}
                className="px-2 py-2 text-xs md:px-3 md:text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {updatingInvoice ? 'Updating...' : (isMobile ? 'Draft' : 'Update as Draft')}
              </button>
              <button 
                onClick={updateAndPrint}
                disabled={updatingInvoice}
                className="px-2 py-2 text-xs md:px-3 md:text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {updatingInvoice ? 'Updating...' : (isMobile ? 'Print' : 'Update and Print')}
              </button>
              <button 
                onClick={handleUpdateInvoice}
                disabled={updatingInvoice || selectedProducts.length === 0 || (!selectedCustomer && !customerSearch)}
                className="px-2 py-2 text-xs md:px-3 md:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingInvoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {updatingInvoice ? 'Updating...' : (isMobile ? 'Update →' : 'Update →')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Banner */}
      {updateError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{updateError}</span>
            </div>
            <button 
              onClick={() => setUpdateError('')}
              className="text-sm font-medium text-red-700 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {updateSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600">{updateSuccess}</span>
            </div>
            <button 
              onClick={() => setUpdateSuccess('')}
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Invoice Error Banner */}
      {invoiceError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{invoiceError}</span>
            </div>
            <button 
              onClick={retryFetchInvoice}
              className="text-sm font-medium text-red-700 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Profile Error Banner */}
      {profileError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{profileError}</span>
            </div>
            <button 
              onClick={retryFetchProfile}
              className="text-sm font-medium text-red-700 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:gap-6 md:p-6">
        {/* Left Column */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          {/* Vendor Info Card */}
          {vendorProfile && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{vendorProfile.shop_name}</h3>
                  <p className="text-sm text-slate-600">
                    {vendorProfile.business_type && `${vendorProfile.business_type} • `}
                    {vendorProfile.gst_number && `GST: ${vendorProfile.gst_number}`}
                  </p>
                </div>
                <div className="text-left sm:text-right text-sm text-slate-600">
                  <p>{vendorProfile.name}</p>
                  <p>{vendorProfile.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Info Card */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Invoice Information</h2>
              <div className="text-sm text-slate-600">
                Status: <span className={`font-medium ${paymentStatus === 'paid' ? 'text-green-600' : paymentStatus === 'pending' ? 'text-orange-600' : 'text-slate-600'}`}>
                  {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Type</label>
                <select 
                  value={invoiceType} 
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="regular">Regular</option>
                  <option value="proforma">Proforma</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Section */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-slate-600" />
                <h2 className="font-semibold text-slate-900">Customer details</h2>
                <AlertCircle className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={retryFetchCustomers}
                  disabled={loadingCustomers}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {loadingCustomers ? 'Loading...' : 'Refresh'}
                </button>
                <button 
                  onClick={openAddCustomerSlider}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  {isMobile ? 'Add' : 'Add Customer'}
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                Select Customer <RequiredStar />
              </label>
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
                
                {customerError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                    {customerError}
                    <button 
                      onClick={retryFetchCustomers}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {showCustomerDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {loadingCustomers ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-600">
                        Loading customers...
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-600">
                        {customerSearch ? 'No customers found' : 'No customers available'}
                      </div>
                    ) : (
                      filteredCustomers.map(customer => (
                        <div
                          key={customer.id}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="font-medium text-slate-900">{customer.company || customer.name}</div>
                          <div className="text-xs text-slate-600">
                            {customer.name} 
                            {customer.gstin && ` • ${customer.gstin}`}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Display customer email from invoice if available */}
            {customerSearch && (
              <div className="mb-4 p-3 bg-slate-50 rounded-md">
                <div className="text-sm text-slate-700">
                  <strong>Current Customer:</strong> {customerSearch}
                </div>
              </div>
            )}

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
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        + {isMobile ? header.split(' ')[0] : header}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">Products & Services</h2>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">?</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={retryFetchProducts}
                  disabled={loadingProducts}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {loadingProducts ? 'Loading...' : 'Refresh'}
                </button>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  {isMobile ? '+ Add' : '+ Add Product'}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
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
                  
                  {productError && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                      {productError}
                      <button 
                        onClick={retryFetchProducts}
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {showProductDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {loadingProducts ? (
                        <div className="px-3 py-4 text-center text-sm text-slate-600">
                          Loading products...
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-slate-600">
                          {productSearch ? 'No products found' : 'No products available'}
                        </div>
                      ) : (
                        filteredProducts.map(product => (
                          <div
                            key={product.id}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                            onClick={() => addProductToBill(product)}
                          >
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="text-xs text-slate-600">
                              {product.sku && `SKU: ${product.sku} • `}
                              ₹{formatCurrency(product.price)} 
                              {product.stock !== undefined && ` • Stock: ${product.stock}`}
                              {product.hsnCode && ` • HSN: ${product.hsnCode}`}
                              {product.taxRate && ` • Tax: ${formatCurrency(product.taxRate)}%`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-20">
                <div className="mb-2 text-xs font-medium text-slate-600">
                  Qty <RequiredStar />
                </div>
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
            <div className="mb-6 flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => {
                  if (filteredProducts.length > 0) {
                    addProductToBill(filteredProducts[0])
                  }
                }}
                disabled={filteredProducts.length === 0 || loadingProducts}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Add to Bill
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                ⚡ {isMobile ? 'AI Create' : 'Create with AI'}
                <span className="rounded bg-blue-100 px-1 text-xs font-medium text-blue-600">BETA</span>
              </button>
            </div>

            {/* Products Table - UPDATED with safe formatting */}
            {selectedProducts.length > 0 ? (
              <>
                <div className="mb-4 border-b border-slate-200 pb-3">
                  <div className="grid grid-cols-12 gap-2 md:gap-4 text-xs font-semibold text-slate-700">
                    <div className="col-span-6 md:col-span-5">Product</div>
                    <div className="col-span-3 md:col-span-2">Qty</div>
                    <div className="col-span-2 md:col-span-2">Price</div>
                    <div className="col-span-1 md:col-span-2 text-right">Total</div>
                    <div className="col-span-1 text-right"></div>
                  </div>
                </div>

                {selectedProducts.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 md:gap-4 py-3 border-b border-slate-100 last:border-b-0">
                    <div className="col-span-6 md:col-span-5">
                      <div className="font-medium text-slate-900 text-sm">{item.product.name}</div>
                      <div className="text-xs text-slate-600">
                        {item.product.sku && `SKU: ${item.product.sku}`}
                        {item.product.sku && item.product.hsnCode && ' • '}
                        {item.product.hsnCode && `HSN: ${item.product.hsnCode}`}
                        {(item.product.sku || item.product.hsnCode) && item.product.taxRate && ' • '}
                        {item.product.taxRate && `Tax: ${formatCurrency(item.product.taxRate)}%`}
                        {!item.product.sku && !item.product.hsnCode && !item.product.taxRate && 'No additional info'}
                      </div>
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-2 text-slate-900 text-sm">₹{formatCurrency(item.unitPrice)}</div>
                    <div className="col-span-1 md:col-span-2 text-right font-medium text-slate-900 text-sm">₹{formatCurrency(item.total)}</div>
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
              <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center">
                <div className="mb-4 h-12 w-12 md:h-16 md:w-16 rounded-lg bg-slate-100"></div>
                <p className="mb-4 text-sm text-slate-600 px-4">
                  {loadingProducts 
                    ? 'Loading products...' 
                    : products.length === 0
                    ? 'No products available. Please check if products exist in your inventory.'
                    : 'Search existing products to add to this list or add new product to get started! 🎯'
                  }
                </p>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={loadingProducts}
                >
                  <Plus className="h-4 w-4" />
                  Add New Product
                </button>
              </div>
            )}

            {/* Additional Charges */}
            <div className="mt-6 flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                ⚙️ {isMobile ? 'Charges' : 'Additional Charges'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Summary */}
        <div className={`space-y-4 ${showMobileSidebar ? 'block' : 'hidden md:block'}`}>
          {/* Mobile Sidebar Toggle */}
          {isMobile && !showMobileSidebar && (
            <button
              onClick={toggleMobileSidebar}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              Show Summary
            </button>
          )}

          {(showMobileSidebar || !isMobile) && (
            <>
              {/* Summary Card - UPDATED with safe formatting */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Taxable Amount</span>
                    <span className="font-semibold text-slate-900">₹ {formatCurrency(taxableAmount)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Total Tax</span>
                    <span className="font-semibold text-slate-900">₹ {formatCurrency(totalTax)}</span>
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
                      <span className="text-xs font-medium text-slate-600">{formatCurrency(roundOff)}</span>
                    </label>
                  </div>

                  <div className="border-t border-green-200 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Total Amount</span>
                      <span className="text-lg font-bold text-slate-900">₹ {formatCurrency(roundedAmount)}</span>
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
                  🏦 {isMobile ? 'Add Bank' : 'Add Bank to Invoice (Optional)'}
                </button>
              </div>

              {/* Payment Details */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-slate-900">Payment Details</h3>
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Payment Status <RequiredStar />
                    </label>
                    <select 
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">UTR Number</label>
                    <input 
                      type="text"
                      placeholder="Enter UTR number if available"
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                  </div>

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
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Payment Mode <RequiredStar />
                      </label>
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
                    + Add New
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

              {/* Mobile close sidebar button */}
              {isMobile && showMobileSidebar && (
                <button
                  onClick={toggleMobileSidebar}
                  className="w-full py-3 bg-slate-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 mt-4"
                >
                  <ChevronDown className="h-4 w-4 rotate-180" />
                  Hide Summary
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Sections */}
      <div className="space-y-4 px-4 pb-4 md:px-6 md:pb-6">
        {/* Notes & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="col-span-1 md:col-span-2 space-y-4">
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
                      📎 {isMobile ? 'Attach Files' : 'Attach Files (Max: 5)'}
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

      {/* Add Customer Slider */}
      {showAddCustomerSlider && (
        <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={closeAddCustomerSlider}
        ></div>
        
        {/* Slider */}
        <div className={`fixed right-0 top-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMobile ? 'w-full' : 'w-96'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add New Customer</h2>
                <p className="text-sm text-slate-600">Fill in the customer details</p>
              </div>
              <button
                onClick={closeAddCustomerSlider}
                className="p-2 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {addCustomerSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm text-green-700">{addCustomerSuccess}</div>
                </div>
              )}

              {addCustomerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-sm text-red-700">{addCustomerError}</div>
                </div>
              )}

              <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name <RequiredStar />
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={customerFormData.name}
                    onChange={handleCustomerFormChange}
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mobile Number <RequiredStar />
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={customerFormData.mobile}
                    onChange={handleCustomerFormChange}
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address <RequiredStar />
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customerFormData.email}
                    onChange={handleCustomerFormChange}
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={customerFormData.company}
                    onChange={handleCustomerFormChange}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    GSTIN <RequiredStar />
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    value={customerFormData.gstin}
                    onChange={handleCustomerFormChange}
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter GSTIN number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address <RequiredStar />
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={customerFormData.address}
                    onChange={handleCustomerFormChange}
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City <RequiredStar />
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={customerFormData.city}
                      onChange={handleCustomerFormChange}
                      required
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Pincode <RequiredStar />
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={customerFormData.pincode}
                      onChange={handleCustomerFormChange}
                      required
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={closeAddCustomerSlider}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
                  disabled={addingCustomer}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomerSubmit}
                  disabled={addingCustomer}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingCustomer ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add Customer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}