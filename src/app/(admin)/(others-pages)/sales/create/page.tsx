'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, AlertCircle, X, UserPlus, Loader2, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

// Add Product Form Data interface
interface AddProductFormData {
  sku: string
  product_name: string
  price: number
  barcode: string
  category_id: number
  brand: string
  hsn_sac: string
  unit: string
  qty: number
  reorder_level: number
  purchase_price: number
  sales_price: number
  discount_percent: number
  tax_percent: number
  tax_inclusive: boolean
  product_description: string
  is_active: boolean
}

interface ApiError {
  message?: string
  success?: boolean
  errors?: Record<string, string[]>
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

export default function CreateInvoice() {
  // Header & Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState('1181')
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
  
  // Add Product Slider State
  const [showAddProductSlider, setShowAddProductSlider] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [addProductError, setAddProductError] = useState('')
  const [addProductSuccess, setAddProductSuccess] = useState('')
  const [productFormData, setProductFormData] = useState<AddProductFormData>({
    sku: '',
    product_name: '',
    price: 0,
    barcode: '',
    category_id: 0,
    brand: '',
    hsn_sac: '',
    unit: 'pcs',
    qty: 0,
    reorder_level: 0,
    purchase_price: 0,
    sales_price: 0,
    discount_percent: 0,
    tax_percent: 0,
    tax_inclusive: false,
    product_description: '',
    is_active: true,
  })
  const [productImage, setProductImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
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
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const router = useRouter();

  // Check mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-close mobile sidebar when switching to desktop
      if (!mobile) {
        setShowMobileSidebar(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Get JWT token helper function
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    }
    return null
  }

  // API function to fetch vendor profile
  const fetchVendorProfile = async () => {
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
      
      // Handle different response formats
      if (data.success && data.data) {
        setVendorProfile(data.data)
      } else if (data.data) {
        setVendorProfile(data.data)
      } else if (data.profile) {
        setVendorProfile(data.profile)
      } else {
        // If the response is the profile object directly
        setVendorProfile(data)
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error)
      setProfileError(error instanceof Error ? error.message : 'Failed to load vendor profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  // API function to fetch customers
  const fetchCustomers = async () => {
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
      
      // Flexible response handling
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
  }

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
        // Reset form
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
        // Refresh customers list
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
  const fetchProducts = async () => {
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
      
      // Flexible response handling for products
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

      // Transform the data to match our Product interface based on the actual API response
      const transformedProducts: Product[] = productsData.map((item: ApiProduct) => {
        // Debug each product item
        console.log('Processing product:', item)
        
        // Find price - check multiple possible fields
        let price = 0
        if (item.sale_price !== undefined && item.sale_price !== null) {
          price = parseFloat(item.sale_price.toString())
        } else if (item.price !== undefined && item.price !== null) {
          price = parseFloat(item.price.toString())
        } else if (item.cost_price !== undefined && item.cost_price !== null) {
          price = parseFloat(item.cost_price.toString())
        }

        // Find stock - check multiple possible fields
        let stock = 0
        if (item.stock_quantity !== undefined && item.stock_quantity !== null) {
          stock = parseInt(item.stock_quantity.toString())
        } else if (item.stock !== undefined && item.stock !== null) {
          stock = parseInt(item.stock.toString())
        } else if (item.quantity !== undefined && item.quantity !== null) {
          stock = parseInt(item.quantity.toString())
        }

        // Find tax rate - check multiple possible fields
        let taxRate = 0
        if (item.tax_rate !== undefined && item.tax_rate !== null) {
          taxRate = parseFloat(item.tax_rate.toString())
        } else if (item.tax !== undefined && item.tax !== null) {
          taxRate = parseFloat(item.tax.toString())
        } else if (item.gst_rate !== undefined && item.gst_rate !== null) {
          taxRate = parseFloat(item.gst_rate.toString())
        }

        // Find HSN code - check multiple possible fields
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
  }

  // API function to add product
  const addProduct = async (formData: AddProductFormData, imageFile: File | null) => {
    setAddingProduct(true)
    setAddProductError('')
    setAddProductSuccess('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      if (!formData.product_name.trim()) {
        throw new Error('Product name is required')
      }

      if (!formData.sku.trim()) {
        throw new Error('SKU is required')
      }

      const formDataToSend = new FormData()
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'is_active' || key === 'tax_inclusive') {
            formDataToSend.append(key, value ? '1' : '0')
          } else if (typeof value === 'number') {
            formDataToSend.append(key, value.toString())
          } else {
            formDataToSend.append(key, value)
          }
        }
      })
      
      if (imageFile) {
        formDataToSend.append('product_image', imageFile)
      }

      console.log('Sending Product FormData:')
      for (const [key, value] of formDataToSend.entries()) {
        console.log(key, value)
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/add-products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to add product: ${response.status}`)
      }

      if (data.success) {
        setAddProductSuccess('Product added successfully!')
        // Reset form
        setProductFormData({
          sku: '',
          product_name: '',
          price: 0,
          barcode: '',
          category_id: 0,
          brand: '',
          hsn_sac: '',
          unit: 'pcs',
          qty: 0,
          reorder_level: 0,
          purchase_price: 0,
          sales_price: 0,
          discount_percent: 0,
          tax_percent: 0,
          tax_inclusive: false,
          product_description: '',
          is_active: true,
        })
        setProductImage(null)
        setImagePreview(null)
        
        // Refresh products list
        setTimeout(() => {
          fetchProducts()
          closeAddProductSlider()
        }, 1500)
      } else {
        throw new Error(data.message || 'Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      setAddProductError(error instanceof Error ? error.message : 'Failed to add product')
    } finally {
      setAddingProduct(false)
    }
  }

  // API function to create invoice
  const createInvoice = async (invoiceData: InvoiceData) => {
    setSavingInvoice(true)
    setSaveError('')
    setSaveSuccess('')
    
    try {
      const token = getAuthToken()
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices/store', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to create invoice: ${response.status}`)
      }

      if (data.success) {
        setSaveSuccess('Invoice created successfully!')
        return data
      } else {
        throw new Error(data.message || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to create invoice')
      throw error
    } finally {
      setSavingInvoice(false)
    }
  }

  // Prepare and submit invoice data
  const prepareInvoiceData = (): InvoiceData => {
    if (selectedProducts.length === 0) {
      throw new Error('Please add at least one product to the invoice')
    }

    if (!selectedCustomerData) {
      throw new Error('Please select a customer')
    }

    if (!vendorProfile) {
      throw new Error('Vendor profile not loaded')
    }

    // For now, we'll use the first product. You might want to handle multiple products differently
    const firstProduct = selectedProducts[0]
    const totalDiscount = selectedProducts.reduce((sum, item) => sum + (item.discount || 0), 0)
    const totalGST = selectedProducts.reduce((sum, item) => sum + (item.gst || 0), 0)

    return {
      biller_name: vendorProfile.shop_name || vendorProfile.name,
      billing_to: selectedCustomerData.company || selectedCustomerData.name,
      mobile: selectedCustomerData.phone || undefined,
      email: selectedCustomerData.email || undefined,
      whatapp_number: selectedCustomerData.phone || undefined,
      product_name: firstProduct.product.name,
      product_id: parseInt(firstProduct.product.id) || undefined,
      product_sku: firstProduct.product.sku || undefined,
      qty: firstProduct.quantity,
      gross_amt: taxableAmount,
      gst: totalGST || undefined,
      tax_inclusive: false, // You can make this configurable
      discount: totalDiscount || undefined,
      grand_total: roundedAmount,
      payment_status: paymentStatus,
      payment_mode: paymentMode !== 'cash' ? paymentMode : undefined,
      utr_number: utrNumber || undefined
    }
  }

  // Save invoice function
  const saveInvoice = async () => {
    try {
      const invoiceData = prepareInvoiceData()
      const result = await createInvoice(invoiceData)
      console.log('Invoice created successfully:', result)
      alert('Invoice created successfully!')
    } catch (error) {
      console.error('Error saving invoice:', error)
      // Error is already set in createInvoice function
    }
  }

  const saveAsDraft = async () => {
    try {
      const invoiceData = prepareInvoiceData()
      // For draft, you might want to set payment_status to 'draft'
      const draftData = { ...invoiceData, payment_status: 'draft' }
      const result = await createInvoice(draftData)
      console.log('Draft saved successfully:', result)
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

 const saveAndPrint = async () => {
  try {
    const invoiceData = prepareInvoiceData();
    const result = await createInvoice(invoiceData);

    if (result?.id) {
      console.log('Invoice created and ready for print:', result);

      // Redirect to the invoice page
      router.push(`/sales/invoices/${result.id}`);

      // Trigger print AFTER redirect (optional)
      // window.print();
    } else {
      alert("Failed to save invoice. Missing invoice ID.");
    }

  } catch (error) {
    console.error('Error saving and printing invoice:', error);
    alert("Error saving invoice!");
  }
};

  // Fetch all data on component mount
  useEffect(() => {
    fetchVendorProfile()
    fetchCustomers()
    fetchProducts()
  }, [])

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

  // Calculations
  const taxableAmount = selectedProducts.reduce((sum, item) => sum + item.total, 0)
  const totalTax = selectedProducts.reduce((sum, item) => {
    const itemTax = item.product.taxRate || 0
    return sum + (item.total * itemTax / 100)
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

  // Product Form Functions
  const generateSKU = () => {
    const prefix = productFormData.brand ? productFormData.brand.substring(0, 3).toUpperCase() : 'PRO'
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const sku = `${prefix}-${random}`
    setProductFormData(prev => ({ ...prev, sku }))
  }

  const calculateSalesPrice = () => {
    const { purchase_price, discount_percent, tax_percent, tax_inclusive } = productFormData
    
    if (purchase_price > 0) {
      let calculatedPrice = purchase_price
      
      if (discount_percent > 0) {
        calculatedPrice = purchase_price * (1 - discount_percent / 100)
      }
      
      if (!tax_inclusive && tax_percent > 0) {
        calculatedPrice = calculatedPrice * (1 + tax_percent / 100)
      }
      
      setProductFormData(prev => ({ ...prev, sales_price: parseFloat(calculatedPrice.toFixed(2)) }))
    }
  }

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setProductFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' 
          ? parseFloat(value) || 0
          : value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setAddProductError('Please select a valid image file (JPEG, PNG, GIF, WebP)')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setAddProductError('Image size should be less than 5MB')
        return
      }

      setProductImage(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setAddProductError('')
    }
  }

  const removeImage = () => {
    setProductImage(null)
    setImagePreview(null)
  }

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addProduct(productFormData, productImage)
  }

  const openAddProductSlider = () => {
    setShowAddProductSlider(true)
    setAddProductError('')
    setAddProductSuccess('')
  }

  const closeAddProductSlider = () => {
    setShowAddProductSlider(false)
    setProductFormData({
      sku: '',
      product_name: '',
      price: 0,
      barcode: '',
      category_id: 0,
      brand: '',
      hsn_sac: '',
      unit: 'pcs',
      qty: 0,
      reorder_level: 0,
      purchase_price: 0,
      sales_price: 0,
      discount_percent: 0,
      tax_percent: 0,
      tax_inclusive: false,
      product_description: '',
      is_active: true,
    })
    setProductImage(null)
    setImagePreview(null)
    setAddProductError('')
    setAddProductSuccess('')
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

  // Mobile sidebar toggle
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar)
  }

  // Required field indicator component
  const RequiredStar = () => <span className="text-red-500 ml-1">*</span>

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={toggleMobileSidebar}
                className="p-2 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Menu className="h-4 w-4 text-slate-600" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 text-slate-600" />
            <h1 className="text-lg font-semibold text-slate-900">Create Invoice</h1>
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
                onClick={saveAsDraft}
                disabled={savingInvoice}
                className="px-2 py-2 text-xs md:px-3 md:text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {savingInvoice ? 'Saving...' : (isMobile ? 'Draft' : 'Save as Draft')}
              </button>
              <button 
                onClick={saveAndPrint}
                disabled={savingInvoice}
                className="px-2 py-2 text-xs md:px-3 md:text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {savingInvoice ? 'Saving...' : (isMobile ? 'Print' : 'Save and Print')}
              </button>
              <button 
                onClick={saveInvoice}
                disabled={savingInvoice || selectedProducts.length === 0 || !selectedCustomer}
                className="px-2 py-2 text-xs md:px-3 md:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingInvoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {savingInvoice ? 'Saving...' : (isMobile ? 'Save →' : 'Save →')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{saveError}</span>
            </div>
            <button 
              onClick={() => setSaveError('')}
              className="text-sm font-medium text-red-700 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600">{saveSuccess}</span>
            </div>
            <button 
              onClick={() => setSaveSuccess('')}
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              <X className="h-4 w-4" />
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
                <button 
                  onClick={openAddProductSlider}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  {isMobile ? '+ Add' : '+ Add Product'}
                </button>
              </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-xs text-yellow-800">
                  <strong>Debug Info:</strong> {products.length} products loaded, 
                  {filteredProducts.length} filtered, 
                  {selectedProducts.length} in bill
                </div>
              </div>
            )}

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
                              ₹{product.price} 
                              {product.stock !== undefined && ` • Stock: ${product.stock}`}
                              {product.hsnCode && ` • HSN: ${product.hsnCode}`}
                              {product.taxRate && ` • Tax: ${product.taxRate}%`}
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

            {/* Products Table */}
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
                        {item.product.taxRate && `Tax: ${item.product.taxRate}%`}
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
                    <div className="col-span-2 md:col-span-2 text-slate-900 text-sm">₹{item.unitPrice.toFixed(2)}</div>
                    <div className="col-span-1 md:col-span-2 text-right font-medium text-slate-900 text-sm">₹{item.total.toFixed(2)}</div>
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
                  onClick={openAddProductSlider}
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
            className="fixed inset-0  transition-opacity z-40"
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

      {/* Add Product Slider */}
      {showAddProductSlider && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 transition-opacity z-40"
            onClick={closeAddProductSlider}
          ></div>
          
          {/* Slider */}
          <div className={`fixed right-0 top-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
            isMobile ? 'w-full' : 'w-full max-w-2xl'
          } overflow-y-auto`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 sticky top-0 bg-white">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Add New Product</h2>
                  <p className="text-sm text-slate-600">Fill in the product details</p>
                </div>
                <button
                  onClick={closeAddProductSlider}
                  className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 p-4 md:p-6">
                {addProductSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-sm text-green-700">{addProductSuccess}</div>
                  </div>
                )}

                {addProductError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-700">{addProductError}</div>
                  </div>
                )}

                <form onSubmit={handleAddProductSubmit} className="space-y-6">
                  {/* Product Image */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Product Image
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors cursor-pointer bg-slate-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label htmlFor="product-image-upload" className="cursor-pointer">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="py-4">
                            <div className="mx-auto h-12 w-12 text-slate-400 mb-2">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="font-medium text-slate-600">Click to upload product image</p>
                            <p className="text-sm text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Product Name <RequiredStar />
                      </label>
                      <input
                        type="text"
                        name="product_name"
                        value={productFormData.product_name}
                        onChange={handleProductFormChange}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        SKU <RequiredStar />
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="sku"
                          value={productFormData.sku}
                          onChange={handleProductFormChange}
                          required
                          className="flex-1 border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Product SKU"
                        />
                        <button
                          type="button"
                          onClick={generateSKU}
                          className="px-3 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors text-sm"
                        >
                          Generate
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={productFormData.brand}
                        onChange={handleProductFormChange}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brand name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        name="barcode"
                        value={productFormData.barcode}
                        onChange={handleProductFormChange}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Barcode number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        HSN/SAC Code
                      </label>
                      <input
                        type="text"
                        name="hsn_sac"
                        value={productFormData.hsn_sac}
                        onChange={handleProductFormChange}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="HSN or SAC code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Unit <RequiredStar />
                      </label>
                      <select
                        name="unit"
                        value={productFormData.unit}
                        onChange={handleProductFormChange}
                        required
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pcs">Pieces</option>
                        <option value="kg">Kilogram</option>
                        <option value="g">Gram</option>
                        <option value="l">Litre</option>
                        <option value="ml">Millilitre</option>
                        <option value="m">Meter</option>
                        <option value="cm">Centimeter</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                        <option value="set">Set</option>
                      </select>
                    </div>
                  </div>

                  {/* Inventory Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Quantity in Stock <RequiredStar />
                      </label>
                      <input
                        type="number"
                        name="qty"
                        value={productFormData.qty}
                        onChange={handleProductFormChange}
                        required
                        min="0"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        name="reorder_level"
                        value={productFormData.reorder_level}
                        onChange={handleProductFormChange}
                        min="0"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Purchase Price <RequiredStar />
                      </label>
                      <input
                        type="number"
                        name="purchase_price"
                        value={productFormData.purchase_price}
                        onChange={handleProductFormChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Base Price
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={productFormData.price}
                        onChange={handleProductFormChange}
                        min="0"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Discount Percentage
                      </label>
                      <input
                        type="number"
                        name="discount_percent"
                        value={productFormData.discount_percent}
                        onChange={handleProductFormChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tax Percentage
                      </label>
                      <input
                        type="number"
                        name="tax_percent"
                        value={productFormData.tax_percent}
                        onChange={handleProductFormChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Sales Price <RequiredStar />
                      </label>
                      <input
                        type="number"
                        name="sales_price"
                        value={productFormData.sales_price}
                        onChange={handleProductFormChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="tax_inclusive"
                        checked={productFormData.tax_inclusive}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, tax_inclusive: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded border-slate-300"
                      />
                      <label className="ml-2 text-sm text-slate-700">
                        Price includes tax
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={calculateSalesPrice}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Calculate Sales Price
                    </button>
                  </div>

                  {/* Product Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Product Description
                    </label>
                    <textarea
                      name="product_description"
                      value={productFormData.product_description}
                      onChange={handleProductFormChange}
                      rows={3}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product description"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Product Status
                    </label>
                    <select
                      name="is_active"
                      value={productFormData.is_active ? 'true' : 'false'}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-slate-200 sticky bottom-0 bg-white">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={closeAddProductSlider}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
                    disabled={addingProduct}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProductSubmit}
                    disabled={addingProduct}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {addingProduct ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add Product
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