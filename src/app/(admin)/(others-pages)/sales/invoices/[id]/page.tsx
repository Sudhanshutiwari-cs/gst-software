"use client"

import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { Invoice, InvoiceProduct } from "../../../../.././../../types/invoice"
import { useEffect, useState, useRef } from "react"
import { sampleInvoice } from "@/components/data/sampleInvoice"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import {
  Download,
  Printer,
  Mail,
  MessageSquare,
  Copy,
  Edit,
  X,
  FileText,
  ShoppingBag,
  Image as ImageIcon,
  Banknote,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Thermometer,
  Sun,
  Moon,
  Monitor,
  Palette,
  Layout,
  File,
  Check,
  ChevronLeft
} from "lucide-react"

interface VendorProfile {
  id: number
  business_name: string
  shop_name: string
  owner_name: string
  address_line1: string
  address_line2: string
  signature_url: string
  city: string
  state: string
  pincode: string
  country: string
  contact_number: string
  logo_url: string
  banner_url: string
  gst_number: string
}

// Solution: Accept params as a Promise
interface PageProps {
  params: Promise<{ id: string }>
}

export interface VendorTemplate {
  id: number
  template_id: string
  template_name: string
  name: string
  notes: string
  terms_conditions: string
  bank_name: string
  ifsc_code: string
  acc_number: string
  upi_id: string
  qr_code: string
  signature: string
  vendor_id: string
  acc_holder_name: string
  status: number
  created_at: string
  updated_at: string
}

// Template types
type TemplateType = "classic" | "modern" | "minimal" | "professional" | "colorful" | "bold"

// Template definitions matching Code 2 style
interface Template {
  id: TemplateType
  name: string
  preview: string
  description: string
  icon: React.ReactNode
  color: string
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary design",
    preview: "https://res.cloudinary.com/doficc2yl/image/upload/v1764054365/Template_1_xleypm.png",
    icon: <Layout className="w-5 h-5" />,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional invoice layout",
    preview: "https://res.cloudinary.com/doficc2yl/image/upload/v1764054772/Template_2_uysbdz.png",
    icon: <File className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and distraction-free",
    preview: "https://via.placeholder.com/300x400/cccccc/666666?text=Minimal+Preview",
    icon: <Layout className="w-5 h-5" />,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  },
  {
    id: "professional",
    name: "Professional",
    description: "Formal business layout",
    preview: "https://via.placeholder.com/300x400/999999/ffffff?text=Professional+Preview",
    icon: <File className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
  },
  {
    id: "colorful",
    name: "Colorful",
    description: "Vibrant and eye-catching",
    preview: "https://via.placeholder.com/300x400/ffcccc/000000?text=Colorful+Preview",
    icon: <Palette className="w-5 h-5" />,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
  },
  {
    id: "bold",
    name: "Bold",
    description: "Strong and impactful design",
    preview: "https://via.placeholder.com/300x400/333333/ffffff?text=Bold+Preview",
    icon: <File className="w-5 h-5" />,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
  }
]

export default function InvoiceViewer({ params }: PageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("classic")
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [showActionsSidebar, setShowActionsSidebar] = useState(true)
  const [isPrintingThermal, setIsPrintingThermal] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [showThermalPreview, setShowThermalPreview] = useState(false)
  const [thermalPreviewHtml, setThermalPreviewHtml] = useState<string | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  const invoicePreviewRef = useRef<HTMLDivElement>(null)

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('invoice-theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  // Resolve theme based on system preference
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedTheme(systemDark ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()
   
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        updateResolvedTheme()
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  // Update body class when resolved theme changes
  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme')
    document.body.classList.add(`${resolvedTheme}-theme`)

    // Update data-theme attribute for CSS custom properties
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  const toggleTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('invoice-theme', newTheme)
  }
  
  
  // Helper function to parse invoice string values to numbers for calculations
  const parseInvoiceNumber = (value: string): number => {
    return parseFloat(value) || 0
  }

  // Helper to calculate totals from products array
  const calculateInvoiceTotals = (invoiceData: Invoice) => {
    let totalQty = 0
    let totalGrossAmt = 0
    let totalGst = 0
    let totalDiscount = 0
    let totalGrandTotal = 0

    console.log("🧮 Calculating invoice totals...")

    if (invoiceData.products && invoiceData.products.length > 0) {
      console.log(`Processing ${invoiceData.products.length} products`)

      invoiceData.products.forEach((product: InvoiceProduct, index: number) => {
        const productQty = product.qty || 0
        const productGrossAmt = parseFloat(product.gross_amt) || 0
        const productGst = parseFloat(product.gst || '0') || 0
        const productDiscount = parseFloat(product.discount || '0') || 0
        const productTotal = parseFloat(product.total) || 0

        console.log(`Product ${index + 1} (${product.product_name}):`, {
          qty: productQty,
          gross: productGrossAmt,
          gst: productGst,
          discount: productDiscount,
          total: productTotal
        })

        totalQty += productQty
        totalGrossAmt += productGrossAmt
        totalGst += productGst
        totalDiscount += productDiscount
        totalGrandTotal += productTotal
      })
    } else {
      // Single product fallback (legacy support)
      console.log("Using single product fallback")
      totalQty = invoiceData.qty || 0
      totalGrossAmt = parseFloat(invoiceData.gross_amt) || 0
      totalGst = parseFloat(invoiceData.gst) || 0
      totalDiscount = parseFloat(invoiceData.discount) || 0
      totalGrandTotal = parseFloat(invoiceData.grand_total) || 0
    }

    console.log("📊 Final totals:", {
      totalQty,
      totalGrossAmt,
      totalGst,
      totalDiscount,
      totalGrandTotal
    })

    return {
      totalQty,
      totalGrossAmt,
      totalGst,
      totalDiscount,
      totalGrandTotal
    }
  }

  // INTERNAL TEMPLATE SELECTOR COMPONENT - Updated to match Code 2 style
  const TemplateSelector = () => {
    return (
      <div className={`absolute left-4 top-16 z-50 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300 ${showTemplateSelector ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <span className="text-sm font-medium dark:text-white">Select your favourite template!</span>
          <button
            onClick={() => setShowTemplateSelector(false)}
            className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template.id)
                setShowTemplateSelector(false)
              }}
              className={`w-full rounded-lg border-2 p-2 transition-all hover:border-blue-500/50 dark:hover:border-blue-400/50 ${selectedTemplate === template.id
                ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700"
                }`}
            >
              <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-2">
                <img
                  src={template.preview || "/placeholder.svg"}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 dark:bg-blue-400 rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium flex items-center gap-1.5 justify-center dark:text-white">
                {template.name}
                {selectedTemplate === template.id && <Check className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Resolve params promise when component mounts
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setInvoiceId(resolvedParams.id)
      } catch (error) {
        console.error("Error resolving params:", error)
        setError("Failed to load invoice ID")
      }
    }

    resolveParams()
  }, [params])

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  }

  // Fetch vendor profile
  const generateThermalHTML = () => {
    if (!invoice || !vendor) return ''

    const formatDateSafe = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      } catch {
        return new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }
    }

    const formatCurrencySafe = (amount: number) =>
      new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)

    // Calculate totals from products array

    let totalGrossAmt = 0
    let totalGst = 0
    let totalDiscount = 0
    let totalAmount = 0

    let itemsHTML = ''

    if (invoice.products && invoice.products.length > 0) {
      invoice.products.forEach((product: InvoiceProduct) => {
        const productGrossAmt = parseFloat(product.gross_amt) || 0
        const productGst = parseFloat(product.gst || '0') || 0
        const productDiscount = parseFloat(product.discount || '0') || 0
        const productTotal = parseFloat(product.total) || 0
        const productQty = product.qty || 1

        itemsHTML += `
          <tr>
            <td>${product.product_name || 'Item'}</td>
            <td style="text-align: center;">${productQty}</td>
            <td style="text-align: right;">₹${formatCurrencySafe(productTotal)}</td>
          </tr>
        `


        totalGrossAmt += productGrossAmt
        totalGst += productGst
        totalDiscount += productDiscount
        totalAmount += productTotal
      })
    } else {
      // Single product fallback
      const totals = calculateInvoiceTotals(invoice)
      const grandTotalNum = totals.totalGrandTotal
      const singleQty = invoice.qty || 1

      itemsHTML = `
        <tr>
          <td>${invoice.product_name || 'Product/Service'}</td>
          <td style="text-align: center;">${singleQty}</td>
          <td style="text-align: right;">₹${formatCurrencySafe(grandTotalNum)}</td>
        </tr>
      `


      totalGrossAmt = totals.totalGrossAmt
      totalGst = totals.totalGst
      totalDiscount = totals.totalDiscount
      totalAmount = grandTotalNum
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { 
        width: 80mm; 
        margin: 0; 
        padding: 2mm; 
        font-family: 'Courier New', monospace; 
        font-size: 10px; 
        line-height: 1.2;
        color: black;
      }
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
      }
      .thermal-container {
        width: 100%;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-bold { font-weight: bold; }
      .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 3px; margin-bottom: 3px; }
      .border-top { border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; }
      table { width: 100%; border-collapse: collapse; margin: 5px 0; }
      th, td { padding: 2px 1px; }
      .dotted-line { border-bottom: 1px dotted #000; margin: 3px 0; }
      .separator { text-align: center; margin: 3px 0; }
    }
    
    /* Screen preview styles */
    body { 
      width: 80mm; 
      margin: 0 auto; 
      padding: 2mm; 
      font-family: 'Courier New', monospace; 
      font-size: 10px; 
      line-height: 1.2;
      color: black;
      border: 1px solid #ccc;
      background: white;
    }
    .thermal-container {
      width: 100%;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 3px; margin-bottom: 3px; }
    .border-top { border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin: 5px 0; }
    th, td { padding: 2px 1px; }
    .dotted-line { border-bottom: 1px dotted #000; margin: 3px 0; }
    .separator { text-align: center; margin: 3px 0; }
  </style>
</head>
<body>
<div style="height: 8mm;"></div>
  <div class="thermal-container">
  
    <!-- Header -->
    <div class="text-center text-bold">
      <div>${vendor.shop_name}</div>
      <div style="font-size: 9px;">${vendor.address_line1}</div>
      ${vendor.address_line2 ? `<div style="font-size: 9px;">${vendor.address_line2}</div>` : ''}
      <div style="font-size: 9px;">${vendor.city}, ${vendor.state} - ${vendor.pincode}</div>
      <div style="font-size: 9px;">Ph: ${vendor.contact_number}</div>
      ${vendor.gst_number ? `<div style="font-size: 8px;">GST: ${vendor.gst_number}</div>` : ''}
    </div>
    
    <div class="separator">-----------------------------</div>
    
    <!-- Invoice Info -->
    <div class="text-center text-bold">TAX INVOICE</div>
    <div class="border-bottom">
      <div>Invoice #: ${invoice.invoice_number || invoice.invoice_id || 'N/A'}</div>
      <div>Date: ${formatDateSafe(invoice.issue_date)}</div>
      <div>Time: ${new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
    </div>
    
    <!-- Customer Info -->
    <div class="border-bottom">
      <div class="text-bold">Customer Details:</div>
      <div>${invoice.billing_to || 'Customer Name'}</div>
      ${invoice.mobile ? `<div>Ph: ${invoice.mobile}</div>` : ''}
      ${invoice.email ? `<div>${invoice.email}</div>` : ''}
    </div>
    
    <!-- Items -->
    <table>
      <thead>
        <tr class="border-bottom">
          <th style="text-align: left;">Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
    
    <div class="dotted-line"></div>
    
    <!-- Totals -->
    <div>
      <div style="display: flex; justify-content: space-between;">
        <span>Subtotal:</span>
        <span>₹${formatCurrencySafe(totalGrossAmt)}</span>
      </div>
      ${totalGst > 0 ? `
      <div style="display: flex; justify-content: space-between;">
        <span>GST:</span>
        <span>₹${formatCurrencySafe(totalGst)}</span>
      </div>
      ` : ''}
      ${totalDiscount > 0 ? `
      <div style="display: flex; justify-content: space-between;">
        <span>Discount:</span>
        <span>-₹${formatCurrencySafe(totalDiscount)}</span>
      </div>
      ` : ''}
      <div class="border-top" style="display: flex; justify-content: space-between; font-weight: bold;">
        <span>TOTAL:</span>
        <span>₹${formatCurrencySafe(totalAmount)}</span>
      </div>
    </div>
    
    <div class="separator">-----------------------------</div>
    
    <!-- Payment Info -->
    <div style="font-size: 9px;">
      <div>Payment Status: <span class="text-bold">${invoice.payment_status?.toUpperCase() || 'PENDING'}</span></div>
      ${invoice.payment_mode ? `<div>Payment Mode: ${invoice.payment_mode}</div>` : ''}
      ${invoice.utr_number ? `<div>UTR: ${invoice.utr_number}</div>` : ''}
    </div>
    
    <div class="separator">*****************************</div>
    
    <!-- Footer -->
    <div class="text-center" style="font-size: 8px;">
      <div>Thank you for your business!</div>
      <div>${vendor.shop_name}</div>
      <div>Terms: Goods once sold will not be taken back</div>
      <div style="margin-top: 10px;">*** END OF RECEIPT ***</div>
    </div>
  </div>
  
  
</body>
</html>
`
  }

  const previewThermalInvoice = () => {
    const html = generateThermalHTML()
    setThermalPreviewHtml(html)
    setShowThermalPreview(true)
  }

  // Fetch vendor profile
  const fetchVendorTemplate = async () => {
  try {
    const token = getAuthToken()
    if (!token) {
      console.error("No auth token found")
      return null
    }

    const response = await fetch(
      "https://manhemdigitalsolutions.com/pos-admin/api/vendor/templates/view/classic",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      console.error("Failed to fetch vendor template", response.status)
      return null
    }

    const Classicdata = await response.json()

    // ✅ PRINT RESPONSE
    

    return Classicdata
  } catch (error) {
    console.error("Error fetching vendor template:", error)
    return null
  }
}



  const fetchVendorProfile = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        console.error("No auth token found")
        return null
      }

      const response = await fetch(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        console.error(`Vendor profile fetch failed: ${response.status}`)
        return null
      }

      const data = await response.json()
      const vendorData = data.data || data

      const vendorProfile: VendorProfile = {
        id: vendorData.id,
        business_name: vendorData.business_name || '',
        shop_name: vendorData.shop_name || '',
        owner_name: vendorData.owner_name || '',
        address_line1: vendorData.address_line1 || '',
        signature_url: vendorData.signature_url || '',
        address_line2: vendorData.address_line2 || '',
        city: vendorData.city || '',
        state: vendorData.state || '',
        pincode: vendorData.pincode || '',
        country: vendorData.country || '',
        contact_number: vendorData.contact_number || '',
        logo_url: vendorData.logo_url || '',
        banner_url: vendorData.banner_url || '',
        gst_number: vendorData.gst_number || ''
      }

      console.log("✅ Vendor profile loaded:", vendorProfile)
      setVendor(vendorProfile)

      // Load logo via server proxy - don't await, let it happen in background
      if (vendorProfile.logo_url) {
        console.log("🔄 Starting logo load via server proxy...")
        loadImageAsBase64(vendorProfile.logo_url).catch(err => {
          console.warn("Logo loading warning:", err)
        })
      }

      return vendorProfile
    } catch (err) {
      console.error('❌ Error fetching vendor profile:', err)
      return null
    }
  }

  // Load image via server-side proxy
  const loadImageAsBase64 = async (url: string): Promise<void> => {
    try {
      setLogoError(null)
      console.log("🔄 Loading vendor logo via server proxy...")

      if (!url || url.trim() === '') {
        console.log("No logo URL provided")
        setLogoBase64(null)
        return
      }

      // Make sure URL is absolute
      let imageUrl = url
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://manhemdigitalsolutions.com${imageUrl}`
      }

      console.log("Absolute URL for proxy:", imageUrl)

      // Use our server-side API route
      const encodedUrl = encodeURIComponent(imageUrl)
      const proxyUrl = `/api/vendor/logo?url=${encodedUrl}`

      console.log("📤 Calling proxy:", proxyUrl)

      const response = await fetch(proxyUrl)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Proxy fetch failed: ${response.status}`, errorText)
        setLogoBase64(null)
        setLogoError(`Proxy failed: ${response.status}`)
        return
      }

      const blob = await response.blob()
      console.log("✅ Proxy response - blob size:", blob.size, "type:", blob.type)

      if (blob.size === 0) {
        console.error("❌ Empty blob received from proxy")
        setLogoBase64(null)
        setLogoError("Empty image received")
        return
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          console.log("✅ Base64 conversion successful, length:", base64String.length)
          setLogoBase64(base64String)
          resolve()
        }
        reader.onerror = (error) => {
          console.error("❌ FileReader error:", error)
          setLogoBase64(null)
          setLogoError("Failed to convert image")
          reject(error)
        }
        reader.readAsDataURL(blob)
      })

    } catch (error) {
      console.error('🔥 Error loading image via proxy:', error)
      setLogoBase64(null)
      setLogoError("Network error loading logo")
    }
  }

  // Test the logo proxy
  const testLogoProxy = async () => {
    if (!vendor?.logo_url) return false

    console.log("🧪 Testing logo proxy...")

    try {
      const encodedUrl = encodeURIComponent(vendor.logo_url)
      const proxyUrl = `/api/vendor/logo?url=${encodedUrl}`

      console.log("Testing proxy URL:", proxyUrl)

      const response = await fetch(proxyUrl)
      console.log("Proxy response status:", response.status)

      if (response.ok) {
        const blob = await response.blob()
        console.log("✅ Proxy test successful - blob size:", blob.size, "type:", blob.type)
        return true
      } else {
        const errorText = await response.text()
        console.error("❌ Proxy test failed:", response.status, errorText)
        return false
      }
    } catch (error) {
      console.error("🔥 Proxy test error:", error)
      return false
    }
  }

  // Fetch invoice data from API
  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch vendor profile first
      await fetchVendorProfile()

      const token = getAuthToken()
      const response = await fetch(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices/${invoiceId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status}`)
      }

      const data = await response.json()

      // Validate the response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid invoice data received')
      }

      // Extract the actual invoice data from the nested structure
      const invoiceData = data.data || data
      console.log("📦 Invoice data received:", invoiceData)
      console.log("📦 Invoice data structure:", invoiceData.invoice.invoice_id)
      console.log("✅ Invoice API Response:", invoiceData)
      console.log("📦 Products array:", invoiceData.products)

      // Check if we have products array
      const hasProductsArray = Array.isArray(invoiceData.products) && invoiceData.products.length > 0

      // Calculate totals if we have products array
      let totalQty = 0
      let totalGrossAmt = 0
      let totalGst = 0
      let totalDiscount = 0
      let totalGrandTotal = 0

      if (hasProductsArray) {
        console.log("🔄 Calculating totals from products array...")
        invoiceData.products.forEach((product: InvoiceProduct, index: number) => {
          const productQty = product.qty || 0
          const productGrossAmt = parseFloat(product.gross_amt) || 0
          const productGst = parseFloat(product.gst || '0') || 0
          const productDiscount = parseFloat(product.discount || '0') || 0
          const productTotal = parseFloat(product.total) || 0

          console.log(`Product ${index + 1}:`, {
            name: product.product_name,
            qty: productQty,
            gross: productGrossAmt,
            gst: productGst,
            discount: productDiscount,
            total: productTotal
          })

          totalQty += productQty
          totalGrossAmt += productGrossAmt
          totalGst += productGst
          totalDiscount += productDiscount
          totalGrandTotal += productTotal
        })

        console.log("📊 Calculated totals:", {
          totalQty,
          totalGrossAmt,
          totalGst,
          totalDiscount,
          totalGrandTotal
        })
      }

      // Map API fields to your invoice structure with all required fields
      // Map API fields to your invoice structure with all required fields
const mappedInvoice: Invoice = {

  id: parseInt(invoiceData.id) || parseInt(invoiceData.invoice_id) || 0,
  invoice_id: invoiceData.invoice.invoice_id || '',
  invoice_number: invoiceData.invoice_id || invoiceData.invoice_number || '',
  vendor_id: invoiceData.vendor_id?.toString() || '',
  currency: invoiceData.currency || 'INR',
  biller_name: invoiceData.biller_name || '',
  issue_date: invoiceData.created_at || invoiceData.issue_date || new Date().toISOString(),
  from_name: '',
  description: invoiceData.product_name || (hasProductsArray ?
    `${invoiceData.products.length} items` : ''),
  due_date: invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  billing_to: invoiceData.invoice.billing_to || '',
  to_email: invoiceData.invoice.email || '',
  from_address: '',
  from_email: '',
  billing_address: invoiceData.billing_address || '',
  mobile: invoiceData.mobile || null,
  to_name: invoiceData.billing_to || '',
  to_address: invoiceData.shipping_address || null,
  email: invoiceData.email || '',
  whatsapp_number: invoiceData.whatsapp_number || null,
  product_name: hasProductsArray ?
    `${invoiceData.products[0]?.product_name}${invoiceData.products.length > 1 ? ` + ${invoiceData.products.length - 1} more` : ''}` :
    invoiceData.product_name || '',
  terms: invoiceData.terms || null,
  notes: invoiceData.notes || null,
  product_id: hasProductsArray ? parseInt(invoiceData.products[0]?.product_id?.toString() || '0') || 0 :
    parseInt(invoiceData.product_id) || 0,
  product_sku: hasProductsArray ? invoiceData.products[0]?.product_sku || '' :
    invoiceData.product_sku || '',
  qty: hasProductsArray ? totalQty : parseInt(invoiceData.qty) || 1,
  gross_amt: hasProductsArray ? totalGrossAmt.toString() :
    (parseFloat(invoiceData.gross_amt) || 0).toString(),
  gst: hasProductsArray ? totalGst.toString() :
    (parseFloat(invoiceData.gst) || 0).toString(),
  tax_inclusive: invoiceData.tax_inclusive || 0,
  discount: hasProductsArray ? totalDiscount.toString() :
    (parseFloat(invoiceData.discount) || 0).toString(),
  grand_total: hasProductsArray ? totalGrandTotal.toString() :
    (parseFloat(invoiceData.grand_total) || 0).toString(),
  payment_status: invoiceData.payment_status || 'pending',
  payment_mode: invoiceData.payment_mode || null,
  utr_number: invoiceData.utr_number || null,
  created_at: invoiceData.created_at || new Date().toISOString(),
  updated_at: invoiceData.updated_at || new Date().toISOString(),
  shipping_address: invoiceData.shipping_address || null,
  // Add products array - IMPORTANT: Map all product fields
  products: hasProductsArray ? invoiceData.products.map((product: InvoiceProduct) => ({
    id: parseInt(product.id?.toString() || '0') || 0,
    invoice_id: product.invoice_id || '',
    product_name: product.product_name || '',
    product_id: parseInt(product.product_id?.toString() || '0') || 0,
    product_sku: product.product_sku || '',
    qty: product.qty || 0,
    gross_amt: product.gross_amt || '0',
    gst: product.gst || '0',
    tax_inclusive: product.tax_inclusive || 0,
    discount: product.discount || '0',
    total: product.total || '0',
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString()
  })) : undefined
}

console.log("✅ Mapped Invoice:", mappedInvoice)
console.log("📦 Mapped Products:", mappedInvoice.products)

setInvoice(mappedInvoice)
return mappedInvoice
    } catch (err) {
      console.error('❌ Error fetching invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice')
      // Fallback to sample data if API fails
      const fallbackInvoice = {
        ...sampleInvoice,
        payment_status: sampleInvoice.payment_status || 'pending'
      }

      setInvoice(fallbackInvoice)
      return fallbackInvoice
    } finally {
      setLoading(false)
    }
  }
  // THERMAL PRINT FUNCTION
  const printThermalInvoice = async () => {
    if (!invoice || !vendor) {
      setError("No invoice data available for thermal printing")
      return
    }

    try {
      setIsPrintingThermal(true)

      // Parse numeric values from products array or single product
      const totals = calculateInvoiceTotals(invoice)
      const grossAmtNum = totals.totalGrossAmt
      const gstNum = totals.totalGst
      const discountNum = totals.totalDiscount
      const grandTotalNum = totals.totalGrandTotal

      // Format date
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        } catch {
          return new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        }
      }

      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount)
      }

      // Generate items HTML for multiple products
      let itemsHTML = ''


      if (invoice.products && invoice.products.length > 0) {
        invoice.products.forEach((product: InvoiceProduct) => {


          const productTotal = parseFloat(product.total) || 0
          const productQty = product.qty || 1

          itemsHTML += `
            <tr>
              <td>${product.product_name || 'Item'}</td>
              <td style="text-align: center;">${productQty}</td>
              <td style="text-align: right;">₹${formatCurrency(productTotal)}</td>
            </tr>
          `

        })
      } else {
        // Single product fallback
        const totals = calculateInvoiceTotals(invoice)
        const grandTotalNum = totals.totalGrandTotal
        const singleQty = invoice.qty || 1

        itemsHTML = `
          <tr>
            <td>${invoice.product_name || 'Product/Service'}</td>
            <td style="text-align: center;">${singleQty}</td>
            <td style="text-align: right;">₹${formatCurrency(grandTotalNum)}</td>
          </tr>
        `

      }

      // Create thermal receipt HTML
      const thermalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { 
                width: 80mm; 
                margin: 0; 
                padding: 2mm; 
                font-family: 'Courier New', monospace; 
                font-size: 10px; 
                line-height: 1.2;
                color: black;
              }
              * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
              }
              .thermal-container {
                width: 100%;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-bold { font-weight: bold; }
              .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 3px; margin-bottom: 3px; }
              .border-top { border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; }
              table { width: 100%; border-collapse: collapse; margin: 5px 0; }
              th, td { padding: 2px 1px; }
              .dotted-line { border-bottom: 1px dotted #000; margin: 3px 0; }
              .separator { text-align: center; margin: 3px 0; }
            }
            
            /* Screen preview styles */
            body { 
              width: 80mm; 
              margin: 0 auto; 
              padding: 2mm; 
              font-family: 'Courier New', monospace; 
              font-size: 10px; 
              line-height: 1.2;
              color: black;
              border: 1px solid #ccc;
              background: white;
            }
            .thermal-container {
              width: 100%;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-bold { font-weight: bold; }
            .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 3px; margin-bottom: 3px; }
            .border-top { border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            th, td { padding: 2px 1px; }
            .dotted-line { border-bottom: 1px dotted #000; margin: 3px 0; }
            .separator { text-align: center; margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="thermal-container">
            <!-- Header -->
            <div class="text-center text-bold">
              <div>${vendor.shop_name}</div>
              <div style="font-size: 9px;">${vendor.address_line1}</div>
              ${vendor.address_line2 ? `<div style="font-size: 9px;">${vendor.address_line2}</div>` : ''}
              <div style="font-size: 9px;">${vendor.city}, ${vendor.state} - ${vendor.pincode}</div>
              <div style="font-size: 9px;">Ph: ${vendor.contact_number}</div>
              ${vendor.gst_number ? `<div style="font-size: 8px;">GST: ${vendor.gst_number}</div>` : ''}
            </div>
            
            <div class="separator">-----------------------------</div>
            
            <!-- Invoice Info -->
            <div class="text-center text-bold">TAX INVOICE</div>
            <div class="border-bottom">
              <div>Invoice #: ${invoice.invoice_number || invoice.invoice_id || 'N/A'}</div>
              <div>Date: ${formatDate(invoice.issue_date)}</div>
              <div>Time: ${new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            
            <!-- Customer Info -->
            <div class="border-bottom">
              <div class="text-bold">Customer Details:</div>
              <div>${invoice.billing_to || 'Customer Name'}</div>
              ${invoice.mobile ? `<div>Ph: ${invoice.mobile}</div>` : ''}
              ${invoice.email ? `<div>${invoice.email}</div>` : ''}
            </div>
            
            <!-- Items -->
            <table>
              <thead>
                <tr class="border-bottom">
                  <th style="text-align: left;">Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div class="dotted-line"></div>
            
            <!-- Totals -->
            <div>
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>₹${formatCurrency(grossAmtNum)}</span>
              </div>
              ${gstNum > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>GST:</span>
                <span>₹${formatCurrency(gstNum)}</span>
              </div>
              ` : ''}
              ${discountNum > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Discount:</span>
                <span>-₹${formatCurrency(discountNum)}</span>
              </div>
              ` : ''}
              <div class="border-top" style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>TOTAL:</span>
                <span>₹${formatCurrency(grandTotalNum)}</span>
              </div>
            </div>
            
            <div class="separator">-----------------------------</div>
            
            <!-- Payment Info -->
            <div style="font-size: 9px;">
              <div>Payment Status: <span class="text-bold">${invoice.payment_status?.toUpperCase() || 'PENDING'}</span></div>
              ${invoice.payment_mode ? `<div>Payment Mode: ${invoice.payment_mode}</div>` : ''}
              ${invoice.utr_number ? `<div>UTR: ${invoice.utr_number}</div>` : ''}
            </div>
            
            <div class="separator">*****************************</div>
            
            <!-- Footer -->
            <div class="text-center" style="font-size: 8px;">
              <div>Thank you for your business!</div>
              <div>${vendor.shop_name}</div>
              <div>Terms: Goods once sold will not be taken back</div>
              <div style="margin-top: 10px;">*** END OF RECEIPT ***</div>
            </div>
          </div>
          
          <script>
            // Auto-print when loaded
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            }
          </script>
        </body>
        </html>
      `

      // Open thermal receipt in new window for printing
      const printWindow = window.open('', '_blank', 'width=320,height=500')
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for thermal printing.')
      }

      printWindow.document.write(thermalHtml)
      printWindow.document.close()

    } catch (err) {
      console.error('Error printing thermal receipt:', err)
      setError(err instanceof Error ? err.message : 'Failed to print thermal receipt')
    } finally {
      setIsPrintingThermal(false)
    }
  }

  // Template-based PDF generation
  const generatePDFByTemplate = async (invoiceData: Invoice, template: TemplateType): Promise<string | null> => {
    switch (template) {
      case "modern":
        return generateModernTemplatePDF(invoiceData)
      case "minimal":
        return generateMinimalTemplatePDF(invoiceData)
      case "professional":
        return generateProfessionalTemplatePDF(invoiceData)
      case "colorful":
        return generateColorfulTemplatePDF(invoiceData)
      case "bold":
        return generateBoldTemplatePDF(invoiceData)
      case "classic":
      default:
        return generateClassicTemplatePDF(invoiceData)
    }
  }

  // Modern Template PDF
  const generateModernTemplatePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      setIsGeneratingPDF(true);

      // Calculate totals from products array or single product
      const totals = calculateInvoiceTotals(invoiceData);
      const grossAmtNum = totals.totalGrossAmt;
      const gstNum = totals.totalGst;
      const discountNum = totals.totalDiscount;
      const grandTotalNum = totals.totalGrandTotal;

      // Format date
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } catch {
          return new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        }
      };

      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      };

      // Number to words function (simplified)
      
      // Use vendor data for company info
      const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company';
      const vendorAddress = vendor?.address_line1 ?
        `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}, ${vendor.state}, ${vendor.pincode}`
        : '123 Business St, City, State, PIN';
      const vendorPhone = vendor?.contact_number || '+91 9856314765';

      // Create a simple placeholder logo
      const createPlaceholderLogo = () => {
        const initial = (vendorName || 'V').charAt(0).toUpperCase();
        const colors = ['#FF9900', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
        const colorIndex = vendorName ? vendorName.charCodeAt(0) % colors.length : 0;
        const color = colors[colorIndex];

        const svg = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="${color}"/>
        <text x="30" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="bold">
          ${initial}
        </text>
      </svg>`;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
      };

      // Determine logo source
      let logoSrc = '';
      if (logoBase64 && logoBase64.startsWith('data:image/') && logoBase64.length > 1000) {
        logoSrc = logoBase64;
      } else if (vendor?.logo_url) {
        const encodedUrl = encodeURIComponent(vendor.logo_url);
        logoSrc = `/api/vendor/logo?url=${encodedUrl}`;
      } else {
        logoSrc = createPlaceholderLogo();
      }

      // Invoice data
      const invoiceDate = formatDate(invoiceData.issue_date);
      const dueDate = formatDate(invoiceData.due_date);
      const totalAmount = formatCurrency(grandTotalNum);
      const discountAmount = formatCurrency(discountNum);
      const gstAmount = formatCurrency(gstNum);
      const grossAmount = formatCurrency(grossAmtNum);
      

      // Generate products table rows
      let tableRows = '';
      let totalItems = 0;
      let totalQuantity = 0;

      if (invoiceData.products && invoiceData.products.length > 0) {
        invoiceData.products.forEach((product: InvoiceProduct, index: number) => {
          const productGrossAmt = parseFloat(product.gross_amt) || 0;

          const productTotal = parseFloat(product.total) || 0;
          const productQty = product.qty || 1;
          const unitPrice = productGrossAmt / productQty;

          tableRows += `
          <tr>
            <td>${index + 1}</td>
            <td>
              <div class="item-name">${product.product_name || 'Product/Service'}</div>
              ${product.product_sku ? `<div class="item-details">SKU: ${product.product_sku}</div>` : ''}
            </td>
            <td>${product.product_sku || 'N/A'}</td>
            <td>₹${formatCurrency(unitPrice)}</td>
            <td>${productQty} ${productQty > 1 ? 'PCS' : 'PC'}</td>
            <td>₹${formatCurrency(productTotal)}</td>
          </tr>
        `;
          totalItems++;
          totalQuantity += productQty;
        });
      } else {
        // Single product fallback
        const totals = calculateInvoiceTotals(invoiceData);
        const grandTotalNum = totals.totalGrandTotal;
        const unitPrice = totals.totalGrossAmt / (invoiceData.qty || 1);

        tableRows = `
        <tr>
          <td>1</td>
          <td>
            <div class="item-name">${invoiceData.product_name || 'Product/Service'}</div>
            ${invoiceData.product_sku ? `<div class="item-details">SKU: ${invoiceData.product_sku}</div>` : ''}
          </td>
          <td>${invoiceData.product_sku || 'N/A'}</td>
          <td>₹${formatCurrency(unitPrice)}</td>
          <td>${invoiceData.qty || 1} ${(invoiceData.qty || 1) > 1 ? 'PCS' : 'PC'}</td>
          <td>₹${formatCurrency(grandTotalNum)}</td>
        </tr>
      `;
        totalItems = 1;
        totalQuantity = invoiceData.qty || 1;
      }

      // Create iframe for rendering
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      height: 297mm;
      border: none;
      visibility: hidden;
    `;
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not create iframe document');
      }

      // Write HTML with modern template
      iframeDoc.open();
      iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Invoice</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .header-left h1 {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 15px;
            color: #1e40af;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #1f2937;
          }
          .gstin {
            margin-bottom: 5px;
            font-size: 13px;
          }
          .gstin span {
            font-weight: bold;
            color: #666;
          }
          .address {
            line-height: 1.4;
            max-width: 400px;
            font-size: 13px;
            color: #666;
            margin-bottom: 5px;
          }
          .contact {
            margin-top: 5px;
            font-size: 13px;
          }
          .contact span {
            font-weight: bold;
            color: #666;
          }
          .header-right {
            text-align: right;
          }
          .header-right .original {
            font-size: 11px;
            letter-spacing: 1px;
            color: #666;
            margin-bottom: 5px;
          }
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
            padding: 10px 0;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
          }
          .invoice-details div strong {
            display: block;
            margin-bottom: 5px;
            color: #666;
          }
          .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .customer-section .label {
            color: #666;
            margin-bottom: 5px;
            font-size: 13px;
          }
          .customer-section .name {
            font-weight: bold;
            margin-bottom: 5px;
          }
          table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  margin: 0;
  padding: 0;
}

        
          th:nth-child(1) { width: 30px; }
          th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: right; }
          td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
          }
          td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: right; }
          .item-name {
            font-weight: 600;
          }
          .item-details {
            color: #666;
            font-size: 13px;
            margin-top: 5px;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
           
          }
          .totals-table {
            width: 300px;
          }
          .totals-table tr td {
            
            border: none;
          }
          .totals-table tr td:first-child {
            text-align: right;
            color: #666;
          }
          .totals-table tr td:last-child {
            text-align: right;
            font-weight: bold;
          }
          .totals-table .total-row {
            font-size: 18px;
            
          }
          .amount-words {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
            margin-top: 20px;
          }
          .amount-payable {
            display: flex;
            justify-content: flex-end;
            
            padding-bottom: 15px;
            background: #f5f5f5;
            font-weight: bold;
          
          }
          .amount-payable span:last-child {
            margin-left: 50px;
            margin-right: 10px;
            font-size: 18px;
            color: #1e40af;
          }
          .payment-section {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 30px;
            margin: 30px 0;
            padding: 20px 0;
            border-top: 1px solid #ddd;
          }
          .bank-details h4, .signature-section h4 {
            margin-bottom: 10px;
            color: #1e40af;
          }
          .bank-details table {
            margin: 0;
          }
          .bank-details td {
            padding: 3px 10px 3px 0;
            border: none;
          }
          .bank-details td:last-child {
            font-weight: bold;
          }
          .signature-section {
            text-align: right;
          }
          .signature-section .for-company {
            margin-bottom: 10px;
            font-weight: bold;
          }
          .signature-box {
            width: 150px;
            height: 50px;
            margin: 20px auto 10px;
            border-bottom: 1px solid #333;
          }
          .terms {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          .terms h4 {
            margin-bottom: 10px;
            color: #1e40af;
          }
          .terms ol {
            padding-left: 20px;
            font-size: 13px;
            color: #555;
          }
          .terms li {
            margin-bottom: 3px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 24px;

  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;

  border-radius: 4px;
  letter-spacing: 0.4px;
}

/* PENDING */
.status-pending {
  background-color: #fff3cd;
  color: #8a5a00;
  border: 1px solid #ffe08a;
}

/* PAID */
.status-paid {
  background-color: #e7f6ec;
  color: #1e7e34;
  border: 1px solid #bfe5cb;
}

/* UNPAID */
.status-unpaid {
  background-color: #fdecea;
  color: #9b1c1c;
  border: 1px solid #f5c2c7;
}

        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>TAX INVOICE</h1>
            <div class="company-name">${vendorName}</div>
            ${vendor?.gst_number ? `<div class="gstin"><span>GSTIN</span> ${vendor.gst_number}</div>` : ''}
            <div class="address">${vendorAddress}</div>
            <div class="contact">
              <span>Mobile</span> ${vendorPhone}
              ${invoiceData.email ? `&nbsp; <span>Email</span> ${invoiceData.email}` : ''}
            </div>
          </div>
          <div class="header-right">
            <div class="original">ORIGINAL FOR RECIPIENT</div>
            <img src="${logoSrc}" 
                 alt="Company Logo" 
                 style="width: 60px; height: 60px; object-fit: contain; margin-top: 10px;"
                 crossorigin="anonymous"
                 onerror="this.src='${createPlaceholderLogo()}'">
          </div>
        </div>

        <div class="invoice-details">
          <div>
            <strong>Invoice #:</strong>
            ${invoiceData.invoice_number || invoiceData.invoice_id || 'N/A'}
          </div>
          <div>
            <strong>Invoice Date:</strong>
            ${invoiceDate}
          </div>
          <div>
            <strong>Due Date:</strong>
            ${dueDate}
          </div>
        </div>

        <div class="customer-section">
          <div>
            <div class="label">Customer Details:</div>
            <div class="name">${invoiceData.billing_to || 'Customer Name'}</div>
            ${invoiceData.to_email ? `<div> ${invoiceData.to_email}</div>` : ''}
          </div>
          <div>
            <div class="label">Status:</div>
      
              ${(invoiceData.payment_status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>

        <table>
         <thead style="background-color:#f97316; color:#ffffff; margin:0; padding:0;">
  <tr style="height:36px; margin:0; padding:0;">
    <th style="padding:6px 8px 6px 4px; line-height:16px; vertical-align:middle;">#</th>
    <th style="padding:6px 8px; line-height:16px; vertical-align:middle;">Item</th>
    <th style="padding:6px 8px; line-height:16px; text-align:center; vertical-align:middle;">HSN/SAC</th>
    <th style="padding:6px 8px; line-height:16px; text-align:right; vertical-align:middle;">Rate/Item</th>
    <th style="padding:6px 8px; line-height:16px; text-align:center; vertical-align:middle;">Qty</th>
    <th style="padding:6px 8px; line-height:16px; text-align:right; vertical-align:middle;">Amount</th>
  </tr>
</thead>

          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="width: 100%; margin-top: 10px; display: flex; justify-content: flex-end;">
  <table style="width: 45%; border-collapse: collapse; font-size: 13px; border: none;">
    
    <!-- Subtotal -->
    <tr style="border: none;">
      <td style="padding: 6px 0; color: #444; border: none;">
        Subtotal
      </td>
      <td style="padding: 6px 0; text-align: right; color: #444; border: none;">
        ₹${grossAmount}
      </td>
    </tr>

    <!-- GST -->
    ${gstNum > 0 ? `
    <tr style="border: none;">
      <td style="padding: 6px 0; color: #444; border: none;">
        GST
      </td>
      <td style="padding: 6px 0; text-align: right; color: #444; border: none;">
        ₹${gstAmount}
      </td>
    </tr>
    ` : ''}

    <!-- Discount -->
    ${discountNum > 0 ? `
    <tr style="border: none;">
      <td style="padding: 6px 0; color: #b91c1c; border: none;">
        Discount
      </td>
      <td style="padding: 6px 0; text-align: right; color: #b91c1c; border: none;">
        -₹${discountAmount}
      </td>
    </tr>
    ` : ''}

    <!-- Spacer (gap before total border) -->
    <tr style="border: none;">
      <td colspan="2" style="height: 6px; border: none;"></td>
    </tr>

    <!-- TOTAL (ONLY border in entire table) -->
    <tr style="border: none;">
      <td style="padding-top: 8px; font-weight: bold; border-top: 2px solid #333;">
        Total
      </td>
      <td style="padding-top: 8px; text-align: right; font-weight: bold; border-top: 2px solid #333;">
        ₹${totalAmount}
      </td>
    </tr>

  </table>
</div>


        <div class="amount-words">
          <span>Total Items / Qty : ${totalItems} / ${totalQuantity}</span>
     
        </div>

        <div class="amount-payable">
          <span>Amount Payable:</span>
          <span>₹${totalAmount}</span>
        </div>

        <div class="payment-section">
          <div class="bank-details">
            <h4>Bank Details:</h4>
            <table>
              <tr><td>Account #:</td><td>234000991111899</td></tr>
              <tr><td>Bank:</td><td>ICICI</td></tr>
              <tr><td>IFSC:</td><td>ICICI560000078</td></tr>
              <tr><td>Branch:</td><td>Meerut</td></tr>
              <tr><td>Account Name:</td><td>Kamal</td></tr>
            </table>
          </div>
          <div class="signature-section">
            <h4>For ${vendorName}</h4>
            <div class="signature-box"></div>
            <div>Authorized Signatory</div>
          </div>
        </div>

        <div class="terms">
          <h4>Terms and Conditions:</h4>
          <ol>
            <li>Goods once sold will not be taken back.</li>
            <li>Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.</li>
            <li>Subject to 'Delhi' Jurisdiction only.</li>
            <li>This is a computer generated invoice.</li>
          </ol>
        </div>

        <div class="footer">
          Page 1 / 1 &nbsp;&nbsp;&nbsp; Generated on ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `);
      iframeDoc.close();

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78,
        height: 297 * 3.78,
        windowWidth: 210 * 3.78,
        windowHeight: 297 * 3.78,
      });

      // Clean up
      document.body.removeChild(iframe);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      console.log("✅ Modern template PDF generated successfully");
      return pdfUrl;

    } catch (err) {
      console.error('❌ Error generating modern template PDF:', err);
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Minimal Template PDF
  const generateMinimalTemplatePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      setIsGeneratingPDF(true)

      // Calculate totals from products array or single product
      const totals = calculateInvoiceTotals(invoiceData)
      const grossAmtNum = totals.totalGrossAmt
      const gstNum = totals.totalGst
      const discountNum = totals.totalDiscount
      const grandTotalNum = totals.totalGrandTotal

      // Format date
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace(/ /g, ' ')
        } catch {
          return new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        }
      }

      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount)
      }

      // Use vendor data for company info
      const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company'
      const vendorAddress = vendor?.address_line1 ?
        `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}`
        : '123 Business St, City'

      // Generate products table rows
      let tableRows = ''



      if (invoiceData.products && invoiceData.products.length > 0) {
        invoiceData.products.forEach((product: InvoiceProduct) => {
          const productGrossAmt = parseFloat(product.gross_amt) || 0

          const productTotal = parseFloat(product.total) || 0
          const productQty = product.qty || 1
          const unitPrice = productGrossAmt / productQty

          tableRows += `
            <tr>
              <td>${product.product_name || 'Product/Service'}</td>
              <td>${productQty}</td>
              <td>₹${formatCurrency(unitPrice)}</td>
              <td>₹${formatCurrency(productTotal)}</td>
            </tr>
          `


        })
      } else {
        // Single product fallback
        const totals = calculateInvoiceTotals(invoiceData)
        const grandTotalNum = totals.totalGrandTotal
        const unitPrice = totals.totalGrossAmt / (invoiceData.qty || 1)

        tableRows = `
          <tr>
            <td>${invoiceData.product_name || 'Product/Service'}</td>
            <td>${invoiceData.qty || 1}</td>
            <td>₹${formatCurrency(unitPrice)}</td>
            <td>₹${formatCurrency(grandTotalNum)}</td>
          </tr>
        `


      }

      // Create a temporary iframe for perfect rendering
      const iframe = document.createElement('iframe')
      iframe.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 210mm;
        height: 297mm;
        border: none;
        visibility: hidden;
      `
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not create iframe document')
      }

      // Write minimal template HTML
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            body { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 25mm 25mm 15mm 25mm; 
              background: white; 
              color: #111827;
              line-height: 1.5;
            }
            .invoice-container {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .company-name {
              font-size: 20px;
              font-weight: 600;
              letter-spacing: -0.5px;
              margin-bottom: 8px;
              color: #111827;
            }
            .company-address {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 20px;
            }
            .invoice-number {
              font-size: 12px;
              color: #6b7280;
              margin-top: 30px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: 300;
              letter-spacing: 2px;
              color: #111827;
              margin-bottom: 10px;
            }
            .divider {
              height: 1px;
              background: #e5e7eb;
              margin: 30px 0;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-block {
              flex: 1;
            }
            .info-block:first-child {
              margin-right: 20px;
            }
            .info-label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .info-value {
              font-size: 14px;
              color: #111827;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            .table th {
              text-align: left;
              padding: 12px 0;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              border-bottom: 1px solid #e5e7eb;
            }
            .table td {
              padding: 16px 0;
              font-size: 14px;
              color: #374151;
              border-bottom: 1px solid #f3f4f6;
            }
            .table tr:last-child td {
              border-bottom: none;
            }
            .total-section {
              margin-top: 40px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.grand-total {
              font-size: 16px;
              font-weight: 600;
              padding-top: 12px;
              margin-top: 12px;
              border-top: 1px solid #e5e7eb;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
            .status {
              display: inline-block;
              padding: 4px 12px;
              font-size: 11px;
              font-weight: 600;
              border-radius: 12px;
              background: #f3f4f6;
              color: #374151;
            }
            .status-paid {
              background: #d1fae5;
              color: #065f46;
            }
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-name">${vendorName}</div>
              <div class="company-address">${vendorAddress}</div>
              <div class="invoice-number">Invoice #${invoiceData.invoice_id || 'N/A'}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-section">
              <div class="info-block">
                <div class="info-label">Bill To</div>
                <div class="info-value">
                  <div>${invoiceData.billing_to || 'Customer Name'}</div>
                  ${invoiceData.email ? `<div>${invoiceData.email}</div>` : ''}
                  ${invoiceData.mobile ? `<div>${invoiceData.mobile}</div>` : ''}
                </div>
              </div>
              
              <div class="info-block">
                <div class="info-label">Invoice Details</div>
                <div class="info-value">
                  <div>Date: ${formatDate(invoiceData.issue_date)}</div>
                  <div>Due: ${formatDate(invoiceData.due_date)}</div>
                  <div style="margin-top: 8px;">
                    <span class="status status-${invoiceData.payment_status}">
                      ${invoiceData.payment_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <div class="divider"></div>
            
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal</span>
                <span>₹${formatCurrency(grossAmtNum)}</span>
              </div>
              ${gstNum > 0 ? `
              <div class="total-row">
                <span>GST</span>
                <span>₹${formatCurrency(gstNum)}</span>
              </div>
              ` : ''}
              ${discountNum > 0 ? `
              <div class="total-row">
                <span>Discount</span>
                <span>-₹${formatCurrency(discountNum)}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>Total Amount</span>
                <span>₹${formatCurrency(grandTotalNum)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business.</p>
              <p style="margin-top: 8px;">Please make payment by the due date.</p>
            </div>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for iframe to render
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate PDF from iframe
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78,
        height: 297 * 3.78,
        windowWidth: 210 * 3.78,
        windowHeight: 297 * 3.78
      })

      // Clean up
      document.body.removeChild(iframe)

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      console.log("✅ Minimal PDF generated successfully")
      return pdfUrl

    } catch (err) {
      console.error('❌ Error generating minimal template PDF:', err)
      return await generateClassicTemplatePDF(invoiceData)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Professional Template PDF
  const generateProfessionalTemplatePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      setIsGeneratingPDF(true)

      // Calculate totals from products array or single product
      const totals = calculateInvoiceTotals(invoiceData)
      const grossAmtNum = totals.totalGrossAmt
      const gstNum = totals.totalGst
      const discountNum = totals.totalDiscount
      const grandTotalNum = totals.totalGrandTotal

      // Format date
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace(/ /g, ' ')
        } catch {
          return new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        }
      }

      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount)
      }

      // Use vendor data for company info
      const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company'
      const vendorAddress = vendor?.address_line1 ?
        `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}, ${vendor.state} ${vendor.pincode}`
        : '123 Business Street, City, State 12345'
      const vendorPhone = vendor?.contact_number || '+1 (555) 123-4567'

      // Generate products table rows
      let tableRows = ''
     


      if (invoiceData.products && invoiceData.products.length > 0) {
        invoiceData.products.forEach((product: InvoiceProduct) => {
          const productGrossAmt = parseFloat(product.gross_amt) || 0

          const productTotal = parseFloat(product.total) || 0
          const productQty = product.qty || 1
          const unitPrice = productGrossAmt / productQty

          tableRows += `
            <tr>
              <td>${product.product_name || 'Product/Service'}</td>
              <td>${productQty}</td>
              <td>₹${formatCurrency(unitPrice)}</td>
              <td>₹${formatCurrency(productTotal)}</td>
            </tr>
          `

        })
      } else {
        // Single product fallback
        const totals = calculateInvoiceTotals(invoiceData)
        const grandTotalNum = totals.totalGrandTotal
        const unitPrice = totals.totalGrossAmt / (invoiceData.qty || 1)

        tableRows = `
          <tr>
            <td>${invoiceData.product_name || 'Product/Service'}</td>
            <td>${invoiceData.qty || 1}</td>
            <td>₹${formatCurrency(unitPrice)}</td>
            <td>₹${formatCurrency(grandTotalNum)}</td>
          </tr>
        `
      
        
      }

      // Create a temporary iframe for perfect rendering
      const iframe = document.createElement('iframe')
      iframe.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 210mm;
        height: 297mm;
        border: none;
        visibility: hidden;
      `
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not create iframe document')
      }

      // Write professional template HTML
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: 'Georgia', 'Times New Roman', serif;
            }
            body { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 20mm 20mm 10mm 20mm; 
              background: #fafafa; 
              color: #333333;
              line-height: 1.6;
            }
            .letterhead {
              border-bottom: 3px double #1a365d;
              padding-bottom: 20px;
              margin-bottom: 30px;
              position: relative;
            }
            .letterhead::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              right: 0;
              height: 1px;
              background: #1a365d;
            }
            .company-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .company-details h1 {
              font-size: 28px;
              font-weight: normal;
              color: #1a365d;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .company-details p {
              font-size: 12px;
              color: #666666;
              font-style: italic;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-number {
              font-size: 18px;
              font-weight: bold;
              color: #1a365d;
            }
            .document-title {
              font-size: 36px;
              font-weight: bold;
              color: #1a365d;
              text-align: center;
              margin: 30px 0;
              letter-spacing: 2px;
            }
            .content-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin: 30px 0;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #1a365d;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
            }
            .address-block {
              line-height: 1.8;
            }
            .address-block p {
              margin-bottom: 5px;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              border: 1px solid #cbd5e1;
            }
            .details-table th {
              background: #1e40af;
              color: white;
              padding: 12px 15px;
              text-align: left;
              font-weight: normal;
              font-size: 13px;
            }
            .details-table td {
              padding: 12px 15px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
            }
            .details-table tr:last-child td {
              border-bottom: none;
            }
            .totals-section {
              margin-left: auto;
              width: 300px;
              border: 1px solid #cbd5e1;
              padding: 20px;
              background: white;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #e2e8f0;
            }
            .total-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .grand-total {
              font-size: 18px;
              font-weight: bold;
              color: #1a365d;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #1a365d;
            }
            .payment-terms {
              margin-top: 30px;
              padding: 20px;
              background: #f7fafc;
              border-left: 4px solid #1a365d;
            }
            .payment-terms h4 {
              color: #1a365d;
              margin-bottom: 10px;
            }
            .payment-terms p {
              font-size: 13px;
              line-height: 1.6;
            }
            .signature-section {
              margin-top: 50px;
              text-align: right;
            }
            .signature-line {
              border-top: 1px solid #333333;
              width: 200px;
              margin-left: auto;
              margin-top: 30px;
              padding-top: 10px;
              text-align: center;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 11px;
              color: #666666;
              text-align: center;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-paid {
              background: #c6f6d5;
              color: #22543d;
            }
            .status-pending {
              background: #fed7d7;
              color: #742a2a;
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="company-header">
              <div class="company-details">
                <h1>${vendorName}</h1>
                <p>${vendorAddress}</p>
                <p>Phone: ${vendorPhone} ${vendor?.gst_number ? `| GST: ${vendor.gst_number}` : ''}</p>
              </div>
              <div class="invoice-meta">
                <div class="invoice-number">INVOICE #${invoiceData.invoice_id || 'N/A'}</div>
                <div style="margin-top: 10px; font-size: 13px;">
                  Date: ${formatDate(invoiceData.issue_date)}<br>
                  Due: ${formatDate(invoiceData.due_date)}
                </div>
              </div>
            </div>
          </div>
          
          <div class="document-title">TAX INVOICE</div>
          
          <div class="content-section">
            <div>
              <div class="section-title">Bill To</div>
              <div class="address-block">
                <p><strong>${invoiceData.billing_to || 'Customer Name'}</strong></p>
                ${invoiceData.email ? `<p>${invoiceData.email}</p>` : ''}
                ${invoiceData.mobile ? `<p>Phone: ${invoiceData.mobile}</p>` : ''}
              </div>
            </div>
            
            <div>
              <div class="section-title">Payment Status</div>
              <div style="margin-top: 15px;">
                <span class="status-badge status-${invoiceData.payment_status}">
                  ${invoiceData.payment_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
          
          <table class="details-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${formatCurrency(grossAmtNum)}</span>
            </div>
            ${gstNum > 0 ? `
            <div class="total-row">
              <span>GST:</span>
              <span>₹${formatCurrency(gstNum)}</span>
            </div>
            ` : ''}
            ${discountNum > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-₹${formatCurrency(discountNum)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Total Amount:</span>
              <span>₹${formatCurrency(grandTotalNum)}</span>
            </div>
          </div>
          
          <div class="payment-terms">
            <h4>Payment Terms</h4>
            <p>Payment is due within 30 days of invoice date. Please include the invoice number with your payment. A 1.5% monthly service charge will be applied to overdue balances.</p>
          </div>
          
          <div class="signature-section">
            <div>Sincerely,</div>
            <div class="signature-line">Authorized Signature</div>
          </div>
          
          <div class="footer">
            <p>${vendorName} | ${vendorAddress} | ${vendorPhone}</p>
            <p style="margin-top: 10px;">Thank you for your business.</p>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for iframe to render
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate PDF from iframe
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78,
        height: 297 * 3.78,
        windowWidth: 210 * 3.78,
        windowHeight: 297 * 3.78
      })

      // Clean up
      document.body.removeChild(iframe)

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      console.log("✅ Professional PDF generated successfully")
      return pdfUrl

    } catch (err) {
      console.error('❌ Error generating professional template PDF:', err)
      return await generateClassicTemplatePDF(invoiceData)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Colorful Template PDF
  const generateColorfulTemplatePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      setIsGeneratingPDF(true)

      // Calculate totals from products array or single product
      const totals = calculateInvoiceTotals(invoiceData)
      const grossAmtNum = totals.totalGrossAmt
      const gstNum = totals.totalGst
      const discountNum = totals.totalDiscount
      const grandTotalNum = totals.totalGrandTotal

      // Format date
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace(/ /g, ' ')
        } catch {
          return new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        }
      }

      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount)
      }

      // Use vendor data for company info
      const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company'
      const vendorAddress = vendor?.address_line1 ?
        `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}`
        : '123 Business Street, City'

      // Generate products table rows
      let tableRows = ''
  


      if (invoiceData.products && invoiceData.products.length > 0) {
        invoiceData.products.forEach((product: InvoiceProduct) => {
          const productGrossAmt = parseFloat(product.gross_amt) || 0

          const productTotal = parseFloat(product.total) || 0
          const productQty = product.qty || 1
          const unitPrice = productGrossAmt / productQty

          tableRows += `
            <tr>
              <td>${product.product_name || 'Product/Service'}</td>
              <td>${product.product_sku || 'N/A'}</td>
              <td>${productQty}</td>
              <td>₹${formatCurrency(unitPrice)}</td>
              <td><strong>₹${formatCurrency(productTotal)}</strong></td>
            </tr>
          `
        
         
        })
      } else {
        // Single product fallback
        const totals = calculateInvoiceTotals(invoiceData)
        const grandTotalNum = totals.totalGrandTotal
        const unitPrice = totals.totalGrossAmt / (invoiceData.qty || 1)

        tableRows = `
          <tr>
            <td>${invoiceData.product_name || 'Product/Service'}</td>
            <td>${invoiceData.product_sku || 'N/A'}</td>
            <td>${invoiceData.qty || 1}</td>
            <td>₹${formatCurrency(unitPrice)}</td>
            <td><strong>₹${formatCurrency(grandTotalNum)}</strong></td>
          </tr>
        `
       
 
      }

      // Create a temporary iframe for perfect rendering
      const iframe = document.createElement('iframe')
      iframe.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 210mm;
        height: 297mm;
        border: none;
        visibility: hidden;
      `
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not create iframe document')
      }

      // Write colorful template HTML
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: 'Arial Rounded MT Bold', 'Arial', sans-serif;
            }
            body { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 15mm 15mm 5mm 15mm; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333333;
              line-height: 1.5;
            }
            .invoice-container {
              background: white;
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
            }
            .invoice-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 10px;
              background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
            }
            .company-info h1 {
              font-size: 28px;
              background: linear-gradient(90deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-info p {
              color: #666666;
              font-size: 13px;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h2 {
              font-size: 32px;
              color: #764ba2;
              font-weight: 800;
              margin-bottom: 5px;
            }
            .invoice-title p {
              color: #667eea;
              font-size: 14px;
              font-weight: bold;
            }
            .info-cards {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .info-card {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 20px;
              border-radius: 15px;
              box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            .info-card:nth-child(2) {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
            .info-card:nth-child(3) {
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            }
            .info-card h3 {
              font-size: 14px;
              margin-bottom: 10px;
              opacity: 0.9;
            }
            .info-card p {
              font-size: 16px;
              font-weight: bold;
            }
            .products-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin: 30px 0;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            .products-table thead {
              background: linear-gradient(90deg, #667eea, #764ba2);
            }
            .products-table th {
              color: white;
              padding: 15px;
              text-align: left;
              font-weight: bold;
              font-size: 14px;
            }
            .products-table tbody tr:nth-child(even) {
              background: #f8f9fa;
            }
            .products-table tbody tr:nth-child(odd) {
              background: white;
            }
            .products-table td {
              padding: 15px;
              font-size: 14px;
              color: #333333;
            }
            .totals-section {
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
              padding: 25px;
              border-radius: 15px;
              margin-top: 30px;
              box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 2px dashed rgba(255,255,255,0.5);
            }
            .total-row:last-child {
              border-bottom: none;
            }
            .grand-total {
              font-size: 20px;
              font-weight: bold;
              color: #764ba2;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #764ba2;
            }
            .payment-status {
              margin-top: 30px;
              text-align: center;
            }
            .status-circle {
              display: inline-block;
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background: conic-gradient(#667eea 0% ${invoiceData.payment_status === 'paid' ? '100%' : '50%'}, #f0f0f0 ${invoiceData.payment_status === 'paid' ? '0%' : '50%'} 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
              color: white;
              box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            .status-circle-inner {
              width: 100px;
              height: 100px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
              color: #764ba2;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666666;
              font-size: 12px;
            }
            .footer p {
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-info">
                <h1>${vendorName}</h1>
                <p>${vendorAddress}</p>
                <p style="color: #667eea; font-weight: bold;">${vendor?.contact_number || '+91 9856314765'}</p>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>#${invoiceData.invoice_number || invoiceData.invoice_id || 'N/A'}</p>
              </div>
            </div>
            
            <div class="info-cards">
              <div class="info-card">
                <h3>Bill To</h3>
                <p>${invoiceData.billing_to || 'Customer Name'}</p>
                ${invoiceData.email ? `<p style="font-size: 12px; margin-top: 5px;">${invoiceData.email}</p>` : ''}
              </div>
              <div class="info-card">
                <h3>Invoice Date</h3>
                <p>${formatDate(invoiceData.issue_date)}</p>
                <h3 style="margin-top: 15px;">Due Date</h3>
                <p>${formatDate(invoiceData.due_date)}</p>
              </div>
              <div class="info-card">
                <h3>Total Amount</h3>
                <p style="font-size: 24px;">₹${formatCurrency(grandTotalNum)}</p>
              </div>
            </div>
            
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product/Service</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <div class="totals-section">
              <div class="total-row">
                <span>Subtotal</span>
                <span>₹${formatCurrency(grossAmtNum)}</span>
              </div>
              ${gstNum > 0 ? `
              <div class="total-row">
                <span>GST</span>
                <span>₹${formatCurrency(gstNum)}</span>
              </div>
              ` : ''}
              ${discountNum > 0 ? `
              <div class="total-row">
                <span>Discount</span>
                <span>-₹${formatCurrency(discountNum)}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>GRAND TOTAL</span>
                <span>₹${formatCurrency(grandTotalNum)}</span>
              </div>
            </div>
            
            <div class="payment-status">
              <div class="status-circle">
                <div class="status-circle-inner">
                  <div style="font-size: 16px; color: #764ba2;">PAYMENT</div>
                  <div style="font-size: 20px; font-weight: bold; margin-top: 5px;">${invoiceData.payment_status?.toUpperCase() || 'PENDING'}</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing ${vendorName}!</p>
              <p>Please contact us if you have any questions about this invoice.</p>
              <p style="margin-top: 20px; color: #667eea; font-weight: bold;">${vendorName} | ${vendorAddress}</p>
            </div>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for iframe to render
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate PDF from iframe
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78,
        height: 297 * 3.78,
        windowWidth: 210 * 3.78,
        windowHeight: 297 * 3.78
      })

      // Clean up
      document.body.removeChild(iframe)

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      console.log("✅ Colorful PDF generated successfully")
      return pdfUrl

    } catch (err) {
      console.error('❌ Error generating colorful template PDF:', err)
      return await generateClassicTemplatePDF(invoiceData)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Bold Template PDF
  const generateBoldTemplatePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      setIsGeneratingPDF(true)

      // Calculate totals from products array or single product
      const totals = calculateInvoiceTotals(invoiceData)
      const grossAmtNum = totals.totalGrossAmt
      const gstNum = totals.totalGst
      const discountNum = totals.totalDiscount
      const grandTotalNum = totals.totalGrandTotal

      // Format date
      const formatDate = (dateString: string) => {
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace(/ /g, ' ')
        } catch {
          return new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        }
      }

      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount)
      }

      // Use vendor data for company info
      const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company'
      const vendorAddress = vendor?.address_line1 ?
        `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}`
        : '123 Business Street, City'

      // Generate products table rows
      let tableRows = ''
     
     


      if (invoiceData.products && invoiceData.products.length > 0) {
        invoiceData.products.forEach((product: InvoiceProduct) => {
          const productGrossAmt = parseFloat(product.gross_amt) || 0

          const productTotal = parseFloat(product.total) || 0
          const productQty = product.qty || 1
          const unitPrice = productGrossAmt / productQty

          tableRows += `
            <tr>
              <td>${product.product_name || 'Product/Service'}</td>
              <td>${product.product_sku || 'N/A'}</td>
              <td>${productQty}</td>
              <td>₹${formatCurrency(unitPrice)}</td>
              <td>₹${formatCurrency(productTotal)}</td>
            </tr>
          `
        

        })
      } else {
        // Single product fallback
        const totals = calculateInvoiceTotals(invoiceData)
        const grandTotalNum = totals.totalGrandTotal
        const unitPrice = totals.totalGrossAmt / (invoiceData.qty || 1)

        tableRows = `
          <tr>
            <td>${invoiceData.product_name || 'Product/Service'}</td>
            <td>${invoiceData.product_sku || 'N/A'}</td>
            <td>${invoiceData.qty || 1}</td>
            <td>₹${formatCurrency(unitPrice)}</td>
            <td>₹${formatCurrency(grandTotalNum)}</td>
          </tr>
        `
      
      
      }

      // Create a temporary iframe for perfect rendering
      const iframe = document.createElement('iframe')
      iframe.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 210mm;
        height: 297mm;
        border: none;
        visibility: hidden;
      `
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not create iframe document')
      }

      // Write bold template HTML
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: 'Montserrat', 'Arial Black', sans-serif;
            }
            body { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 10mm 10mm 5mm 10mm; 
              background: #0a0a0a; 
              color: #ffffff;
              line-height: 1.4;
            }
            .invoice-container {
              background: #111111;
              border: 3px solid #ff4757;
              position: relative;
              min-height: 270mm;
            }
            .header-stripe {
              height: 15px;
              background: linear-gradient(90deg, #ff4757, #ff6b81, #ffa502, #ff4757);
              margin-bottom: 30px;
            }
            .header-content {
              padding: 0 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
            }
            .company-name {
              font-size: 36px;
              font-weight: 900;
              color: #ffffff;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .company-name span {
              color: #ff4757;
            }
            .company-details {
              font-size: 12px;
              color: #aaaaaa;
              line-height: 1.6;
            }
            .invoice-header {
              text-align: right;
            }
            .invoice-title {
              font-size: 48px;
              font-weight: 900;
              color: #ff4757;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 3px;
            }
            .invoice-number {
              font-size: 18px;
              color: #ffffff;
              font-weight: bold;
              background: #ff4757;
              padding: 5px 15px;
              display: inline-block;
            }
            .grid-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              padding: 0 40px;
              margin: 40px 0;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #ff4757;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 20px;
              border-bottom: 2px solid #ff4757;
              padding-bottom: 10px;
            }
            .customer-info p {
              font-size: 14px;
              color: #dddddd;
              margin-bottom: 8px;
            }
            .invoice-details p {
              font-size: 14px;
              color: #dddddd;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            .invoice-details span {
              color: #ffffff;
              font-weight: bold;
            }
            .products-section {
              padding: 0 40px;
              margin: 40px 0;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
            }
            .products-table thead {
              background: #ff4757;
            }
            .products-table th {
              padding: 15px;
              text-align: left;
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .products-table tbody tr {
              border-bottom: 1px solid #333333;
            }
            .products-table tbody tr:hover {
              background: #222222;
            }
            .products-table td {
              padding: 15px;
              font-size: 14px;
              color: #dddddd;
            }
            .products-table td:last-child {
              color: #ffffff;
              font-weight: bold;
            }
            .totals-section {
              padding: 0 40px;
              margin: 40px 0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #333333;
              font-size: 16px;
            }
            .grand-total {
              font-size: 24px;
              font-weight: 900;
              color: #ff4757;
              border-bottom: 3px solid #ff4757;
              margin-top: 20px;
              padding-top: 20px;
            }
            .footer {
              margin-top: 60px;
              padding: 30px 40px;
              background: #222222;
              text-align: center;
            }
            .footer-title {
              font-size: 14px;
              font-weight: 700;
              color: #ff4757;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 15px;
            }
            .footer-text {
              font-size: 12px;
              color: #aaaaaa;
              line-height: 1.6;
            }
            .status-indicator {
              display: inline-block;
              padding: 8px 20px;
              background: #ff4757;
              color: #ffffff;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-radius: 3px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header-stripe"></div>
            
            <div class="header-content">
              <div>
                <div class="company-name">${vendorName.split(' ')[0] || 'COMPANY'}<span>${vendorName.split(' ').slice(1).join(' ') || ''}</span></div>
                <div class="company-details">
                  <p>${vendorAddress}</p>
                  <p>${vendor?.contact_number || '+91 9856314765'}</p>
                  ${vendor?.gst_number ? `<p>GST: ${vendor.gst_number}</p>` : ''}
                </div>
              </div>
              
              <div class="invoice-header">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#${invoiceData.invoice_number || invoiceData.invoice_id || 'N/A'}</div>
              </div>
            </div>
            
            <div class="grid-section">
              <div>
                <div class="section-title">Bill To</div>
                <div class="customer-info">
                  <p><strong>${invoiceData.billing_to || 'Customer Name'}</strong></p>
                  ${invoiceData.email ? `<p>${invoiceData.email}</p>` : ''}
                  ${invoiceData.mobile ? `<p>${invoiceData.mobile}</p>` : ''}
                </div>
              </div>
              
              <div>
                <div class="section-title">Invoice Details</div>
                <div class="invoice-details">
                  <p>Invoice Date: <span>${formatDate(invoiceData.issue_date)}</span></p>
                  <p>Due Date: <span>${formatDate(invoiceData.due_date)}</span></p>
                  <p>Status: <span class="status-indicator">${invoiceData.payment_status?.toUpperCase() || 'PENDING'}</span></p>
                </div>
              </div>
            </div>
            
            <div class="products-section">
              <div class="section-title">Products & Services</div>
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
            
            <div class="totals-section">
              <div class="section-title">Amount Summary</div>
              <div class="total-row">
                <span>Subtotal</span>
                <span>₹${formatCurrency(grossAmtNum)}</span>
              </div>
              ${gstNum > 0 ? `
              <div class="total-row">
                <span>GST</span>
                <span>₹${formatCurrency(gstNum)}</span>
              </div>
              ` : ''}
              ${discountNum > 0 ? `
              <div class="total-row">
                <span>Discount</span>
                <span>-₹${formatCurrency(discountNum)}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>GRAND TOTAL</span>
                <span>₹${formatCurrency(grandTotalNum)}</span>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-title">Thank You For Your Business</div>
              <div class="footer-text">
                <p>Payment is due upon receipt. Please contact us with any questions regarding this invoice.</p>
                <p style="margin-top: 10px;">${vendorName} | ${vendorAddress} | ${vendor?.contact_number || '+91 9856314765'}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for iframe to render
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate PDF from iframe
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78,
        height: 297 * 3.78,
        windowWidth: 210 * 3.78,
        windowHeight: 297 * 3.78
      })

      // Clean up
      document.body.removeChild(iframe)

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      console.log("✅ Bold PDF generated successfully")
      return pdfUrl

    } catch (err) {
      console.error('❌ Error generating bold template PDF:', err)
      return await generateClassicTemplatePDF(invoiceData)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Classic Template PDF (existing code)
  const generateClassicTemplatePDF = async (invoiceData: Invoice): Promise<string | null> => {
  try {
    // ✅ AUTO CALL (Client Side Only)
    const classicTemplate = await fetchVendorTemplate()
    
    setIsGeneratingPDF(true);
    console.log("📦 Invoice data for PDF:", invoiceData);
    console.log("📦 Vendor Template Response:", classicTemplate.data.template_name)
    console.log("🔄 Starting PDF generation for invoice:", invoiceData.invoice_id);
    console.log("📦 Products data for PDF:", invoiceData.products);
    console.log("📊 Invoice totals from calculateInvoiceTotals:", calculateInvoiceTotals(invoiceData));
    
    // Calculate totals from products array or single product
    const totals = calculateInvoiceTotals(invoiceData);
    const grossAmtNum = totals.totalGrossAmt;
    const gstNum = totals.totalGst;
    const discountNum = totals.totalDiscount;
    const grandTotalNum = totals.totalGrandTotal;

    // Format date
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    // Use vendor data for company info
    const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company';
    const vendorAddress = vendor?.address_line1 ?
      `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}, ${vendor.state}, ${vendor.pincode}`
      : '123 Business St, City, State, PIN';
    const vendorPhone = vendor?.contact_number || '+91 9856314765';

    console.log("=== PDF LOGO DEBUG ===");
    console.log("logoBase64 available:", logoBase64 ? "Yes" : "No");
    console.log("logoBase64 is data URL?", logoBase64?.startsWith('data:image'));
    console.log("logoBase64 length:", logoBase64?.length);
    console.log("Vendor logo URL:", vendor?.logo_url);

    // Helper function to create a placeholder logo
    const createPlaceholderLogo = () => {
      const initial = (vendorName || 'V').charAt(0).toUpperCase();
      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
      const colorIndex = vendorName ? vendorName.charCodeAt(0) % colors.length : 0;
      const color = colors[colorIndex];

      const svg = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="${color}" stroke="#e5e7eb" stroke-width="2"/>
        <text x="30" y="38" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
          ${initial}
        </text>
      </svg>`;

      return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    // Helper function to create a placeholder signature
    const createPlaceholderSignature = () => {
  

      


      const svg = `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" fill="#10B981" stroke="#047857" stroke-width="2"/>
        <circle cx="40" cy="40" r="34" fill="white" stroke="#059669" stroke-width="1"/>
        <path d="M25 40 L35 50 L55 30" stroke="#059669" stroke-width="4" fill="none" stroke-linecap="round"/>
        <text x="40" y="70" text-anchor="middle" fill="#047857" font-family="Arial, sans-serif" font-size="8" font-weight="bold">
          APPROVED
        </text>
      </svg>`;

      return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    // Get direct URL with cache busting
    const getDirectLogoUrl = (url: string): string => {
      const timestamp = new Date().getTime();
      return `${url}?t=${timestamp}`;
    };

    // Helper function to generate QR code placeholder HTML
    
    // YOUR STATIC QR CODE URL
    const staticQRCodeUrl = "https://res.cloudinary.com/doficc2yl/image/upload/v1766860481/QRCode_xpgmka.png";
    
    // Create placeholder signature as fallback
    const placeholderSignature = createPlaceholderSignature();
    
    // Use a more reliable signature URL (the provided URL might have CORS issues)
    // Alternative reliable green checkmark signature

    
    // Or use a data URL for guaranteed loading
    const signatureDataUrl = `data:image/svg+xml;base64,${btoa(`
      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" fill="#10B981" opacity="0.1"/>
        <circle cx="40" cy="40" r="36" fill="white" stroke="#10B981" stroke-width="2"/>
        <circle cx="40" cy="40" r="32" fill="#10B981" fill-opacity="0.2"/>
        <path d="M30 40 L38 48 L52 32" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M30 40 L38 48 L52 32" stroke="#059669" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="40" y="70" text-anchor="middle" fill="#065F46" font-family="Arial, sans-serif" font-size="7" font-weight="bold">
          APPROVED
        </text>
      </svg>
    `)}`;

    // Generate QR code HTML based on available data
    let qrCodeHTML = '';
    
    // Always use the static QR code URL you've provided
    qrCodeHTML = `
      <img
        src="${staticQRCodeUrl}"
        alt="Payment QR Code"
        style="width: 120px; height: 120px; object-fit: contain; border: 1px solid #eee;"
        crossorigin="anonymous"
      />
      <p style="font-size: 9px; margin-top: 4px; color: #666;">
        Scan to Pay via UPI
      </p>
    `;

    console.log("📱 Using static QR code URL:", staticQRCodeUrl);
    console.log("✍️ Using data URL signature for guaranteed loading");

    // Determine which logo to use
    let logoSrc = '';
    let useBase64 = false;
    let useProxy = false;

    if (logoBase64 && logoBase64.startsWith('data:image/') && logoBase64.length > 1000) {
      // Use the base64 we already have
      logoSrc = logoBase64;
      useBase64 = true;
      console.log("✅ Using existing base64 logo");
    } else if (vendor?.logo_url) {
      // Use server proxy for the vendor URL
      const encodedUrl = encodeURIComponent(vendor.logo_url);
      logoSrc = `/api/vendor/logo?url=${encodedUrl}`;
      useProxy = true;
      console.log("⚠️ Using server proxy for vendor logo");
    } else {
      // Create placeholder
      logoSrc = createPlaceholderLogo();
      console.log("❌ No logo available, using placeholder");
    }

    // Create the signature HTML with fallback
    const signatureHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <img src="${signatureDataUrl}" 
             alt="Authorized Signature" 
             style="width: 80px; height: 80px; object-fit: contain;"
             crossorigin="anonymous"
             onerror="
               console.error('Signature image failed to load');
               this.onerror = null;
               this.src = '${placeholderSignature}';
             ">
      </div>
    `;

    console.log("Final logo HTML using:", useBase64 ? "Base64" : useProxy ? "Proxy" : "Placeholder");
    console.log("Signature HTML using data URL");

    // Invoice data
    const invoiceDate = formatDate(invoiceData.issue_date);
    const dueDate = formatDate(invoiceData.due_date);

    // Generate products table rows
    let tableRows = '';
    let totalItems = 0;
    let totalQuantity = 0;
    let subtotalAmount = 0;

    console.log("📝 Generating PDF table rows for products:", invoiceData.products?.length || 0);

    if (invoiceData.products && invoiceData.products.length > 0) {
      console.log(`Processing ${invoiceData.products.length} products`);

      invoiceData.products.forEach((product: InvoiceProduct, index: number) => {
        const productGrossAmt = parseFloat(product.gross_amt) || 0;
        const productGst = parseFloat(product.gst || '0') || 0;
        const productDiscount = parseFloat(product.discount || '0') || 0;
        const productTotal = parseFloat(product.total) || 0;
        const productQty = product.qty || 1;
        const unitPrice = productGrossAmt / productQty;
        const originalPrice = productGrossAmt + productDiscount;

        console.log(`Product ${index + 1} (${product.product_name}):`, {
          qty: productQty,
          unitPrice,
          gross: productGrossAmt,
          gst: productGst,
          discount: productDiscount,
          total: productTotal
        });

        tableRows += `
          <tr>
            <td style="border: none; border-bottom: 1px solid #666; padding: 8px;">${index + 1}</td>
            <td>
              <div style="font-weight: bold; margin-bottom: 2px;">${product.product_name || 'Product/Service'}</div>
              ${product.product_sku ? `<div style="font-size: 10px; color: #666;">SKU: ${product.product_sku}</div>` : ''}
            </td>
            <td>${product.product_sku || 'N/A'}</td>
            <td>
              ₹${formatCurrency(unitPrice)}<br>
              ${productDiscount > 0 ?
                `<span style="font-size: 9px; color: #666;">₹${formatCurrency(originalPrice)} (Disc: -₹${formatCurrency(productDiscount)})</span>`
                : ''}
            </td>
            <td>
              <div>${productQty}</div>
            </td>
            <td>
              <div style="font-weight: bold;">₹${formatCurrency(productTotal)}</div>
            </td>
          </tr>
        `;
        totalItems++;
        totalQuantity += productQty;
        subtotalAmount += productTotal;
      });

      console.log("📊 Table totals:", {
        totalItems,
        totalQuantity,
        subtotalAmount
      });
    } else {
      // Single product fallback
      console.log("Using single product fallback");
      const unitPrice = grossAmtNum / (invoiceData.qty || 1);
      const originalPrice = grossAmtNum + discountNum;

      tableRows = `
        <tr>
          <td>1</td>
          <td>
            <div style="font-weight: bold; margin-bottom: 2px;">${invoiceData.product_name || 'Product/Service'}</div>
            ${invoiceData.product_sku ? `<div style="font-size: 10px; color: #666;">SKU: ${invoiceData.product_sku}</div>` : ''}
          </td>
          <td>${invoiceData.product_sku || 'N/A'}</td>
          <td>
            ₹${formatCurrency(unitPrice)}<br>
            ${discountNum > 0 ?
              `<span style="font-size: 9px; color: #666;">₹${formatCurrency(originalPrice)} (Disc: -₹${formatCurrency(discountNum)})</span>`
              : ''}
          </td>
          <td>
            <div>${invoiceData.qty || 1}</div>
            <div style="font-size: 9px; color: #666;">${(invoiceData.qty || 1) > 1 ? 'PCS' : 'PC'}</div>
          </td>
          <td>
            <div style="font-weight: bold;">₹${formatCurrency(grandTotalNum)}</div>
            ${gstNum > 0 ? `<div style="font-size: 9px; color: #666;">GST: ₹${formatCurrency(gstNum)}</div>` : ''}
          </td>
        </tr>
      `;
      totalItems = 1;
      totalQuantity = invoiceData.qty || 1;
      subtotalAmount = grandTotalNum;
    }

    // Create the logo HTML with fallback
    let logoHTML = '';

    if (useBase64) {
      logoHTML = `<img src="${logoSrc}" 
                alt="Vendor Logo" 
                style="width: 60px; height: 60px; object-fit: contain; border-radius: 4px;"
                crossorigin="anonymous">`;
    } else if (useProxy) {
      const directUrl = getDirectLogoUrl(vendor!.logo_url);
      const placeholder = createPlaceholderLogo();

      logoHTML = `<img src="${logoSrc}" 
                alt="Vendor Logo" 
                style="width: 60px; height: 60px; object-fit: contain;  border-radius: 4px;"
                crossorigin="anonymous"
                onerror="
                  this.onerror=null;
                  console.log('Proxy failed, trying direct URL');
                  this.src='${directUrl}';
                  this.onerror=function() {
                    console.log('Direct URL also failed, using placeholder');
                    this.src='${placeholder}';
                    this.onerror=null;
                  }
                ">`;
    } else {
      logoHTML = `<img src="${logoSrc}" 
                alt="Vendor Logo" 
                style="width: 60px; height: 60px; object-fit: contain;">`;
    }

    console.log("Final logo HTML using:", useBase64 ? "Base64" : useProxy ? "Proxy" : "Placeholder");

    // Create a temporary iframe for perfect rendering
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      height: 297mm;
      border: none;
      visibility: hidden;
    `;
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Could not create iframe document');
    }

    // Write the exact HTML structure with API data
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: Arial, Helvetica, sans-serif;
            }
            body { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 7mm 7mm 7mm 7mm; 
              background: white; 
              color: black;
              line-height: 1.4;
              position: relative;
            }
            .invoice-container {
              width: 100%;
              background: white;
              border: 1px solid #666;
              position: relative;
              min-height: 280mm;
              padding-bottom: 40mm; /* Space for fixed footer */
            }
            .border-bottom {
              border-bottom: 1px solid #666;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .text-center { text-align: center; padding: -4px 0 important; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 12px; }
            .text-base { font-size: 13px; }
            .text-lg { font-size: 14px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 12px;
              border-top: 1px solid #666;
            }
            th, td {
              border-bottom: 1px solid #666;
              border-left: 1px solid #666;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              text-align: center;
            }
            .invoice-table th,
            .invoice-table td {
            }
            .invoice-table td:nth-child(1),
            .invoice-table td:nth-child(3),
            .invoice-table td:nth-child(4),
            .invoice-table td:nth-child(5),
            .invoice-table td:nth-child(6) {
              text-align: center;
            }
            .invoice-table th:nth-child(2),
            .invoice-table td:nth-child(2) {
              text-align: left;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              margin: 15px 0;
            }
            .border-all {
              border: 1px solid #666;
              padding-bottom: 10px;
            }
            .flex-between {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signature-box {
              margin-top: 20px;
              text-align: right;
            }
            .logo {
              width: 60px;
              height: 60px;
              object-fit: contain;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .logo-placeholder {
              width: 60px;
              height: 60px;
              background: #f5f5f5;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              color: #666;
              border-radius: 4px;
            }
            .status-paid { color: green; }
            .status-pending { color: orange; }
            .status-unpaid { color: red; }
            
            /* Footer Styles */
            .footer-fixed {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              border-top: 2px solid #666;
              background: white;
              padding: 0;
              height: 115px;
              display: flex;
              align-items: stretch;
            }
            .footer-title {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 12px;
              color: #1e40af;
            }
            .bank-details {
              font-size: 11px;
              line-height: 1.4;
            }
            .terms-conditions {
              font-size: 10px;
              line-height: 1.2;
            }
            .final-signature {
              margin-top: 20px;
              text-align: right;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .page-break {
              page-break-inside: avoid;
            }
            .footer-columns {
              display: flex;
              width: 100%;
              height: 100%;
            }
            .terms-column {
              flex: 1;
              border-right: 1px solid #666;
              padding: 10px 15px 10px 10px;
            }
            .bank-column {
              flex: 1;
              padding: 10px 10px 10px 15px;
            }
            
            /* Bank & Signature Section Styles */
            .bank-signature-section {
              margin: 20px 0 25px 0;
              border-top: 1px solid #666;
              border-bottom: 1px solid #666;
              padding: 0;
              background-color: #fff;
              page-break-inside: avoid;
              display: flex;
            }
            .bank-details-column {
              flex: 1;
              border-right: 1px solid #666;
              padding: 15px;
            }
            .signature-column {
              flex: 1;
              padding: 15px;
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            .thank-you-note {
              font-size: 11px;
              line-height: 1.4;
              color: #1e40af;
              text-align: center;
              padding: 10px;
              font-style: italic;
              border: 1px dashed #1e40af;
              background-color: #f0f8ff;
              margin-bottom: 10px;
            }
            .signature-space {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
            }
            .signature-line {
              width: 100%;
              border-top: 1px solid #000;
              margin-top: 10px;
              padding-top: 5px;
              text-align: center;
            }
            .signature-image-container {
              text-align: center;
              margin-bottom: 10px;
            }
            .signature-image {
              width: 80px;
              height: 80px;
              object-fit: contain;
              margin: 0 auto 10px auto;
              display: block;
            }
            
            /* Remove old footer styles */
            .footer-section {
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Invoice Title -->
            <div class="text-center">
              <h1
                class="text-lg font-bold"
                style="
                  color: #1e40af;
                  letter-spacing: 2px;
                  margin: 0;
                  padding: -4px 0px important;
                "
              >
                TAX INVOICE
              </h1>
            </div>

            <!-- Header Section -->
            <div class="grid-2" style="border-bottom: 1px solid #666; border-top: 1px solid #666; margin-top: 15px;">
              <!-- Left Box -->
              <div style="border-right: 1px solid #666; padding: 10px;">
                <!-- Logo and Details -->
                <div style="display: flex; align-items: start; gap: 10px; margin-bottom: 10px;">
                  ${logoHTML}
                
                  <div>
                    <h2 class="font-bold text-base">${vendorName}</h2>
                    <p class="text-sm">${vendorAddress}</p>
                    <p class="text-sm">Mobile: ${vendorPhone}</p>
                    ${vendor?.gst_number ? `<p class="text-sm">GST: ${vendor.gst_number}</p>` : ''}
                  </div>
                </div>
                
                <div style="border-top: 1px solid #666; margin: 0 -10px; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;">
                  <p class="font-bold text-sm">Customer Details:</p>
                  <p class="text-sm">${invoiceData.billing_to || 'Customer Name'}</p>
                  ${invoiceData.mobile ? `<p class="text-sm">Ph: ${invoiceData.mobile}</p>` : ''}
                  ${invoiceData.to_email ? `<p class="text-sm">${invoiceData.to_email}</p>` : ''}
                </div>
              </div>

              <!-- Right Box -->
              <div style="
                padding-right: 0px;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                font-size: 12px;
              ">
                <!-- Invoice Number -->
                <div style="padding: 6px; border-right: 1px solid #666; border-bottom: 1px solid #666;">
                  <div class="font-bold">Invoice #</div>
                  <div>
                    ${invoiceData.invoice_number || invoiceData.invoice_id || 'N/A'}
                  </div>
                </div>

                <!-- Invoice Date -->
                <div style="padding: 6px; border-bottom: 1px solid #666;">
                  <div class="font-bold">Invoice Date</div>
                  <div>${invoiceDate}</div>
                </div>

                <!-- Due Date -->
                <div style="padding: 6px; border-right: 1px solid #666;">
                  <div class="font-bold">Due Date</div>
                  <div>${dueDate}</div>
                </div>

                <!-- Status -->
                <div style="padding: 6px;">
                  <div class="font-bold">Status</div>
                  <div class="status-${invoiceData.payment_status}">
                    ${invoiceData.payment_status?.toUpperCase() || 'PENDING'}
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table class="invoice-table page-break">
              <thead>
                <tr>
                  <th style="width: 40px; padding: 8px; border: none; border-bottom: 1px solid #666;">#</th>
                  <th style="padding: 8px;">Item Description</th>
                  <th style="width: 80px; padding: 8px;">HSN/SAC</th>
                  <th style="width: 100px; padding: 8px;">Rate / Item</th>
                  <th style="width: 70px; padding: 8px;">Qty</th>
                  <th style="width: 120px; padding: 8px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <p class="text-sm" style="margin-top: 15px; padding-left: 5px; font-weight: bold;">
              Total Items / Qty : ${totalItems} / ${totalQuantity}
            </p>

            <!-- Totals Box -->
            <div class="page-break" style="border-top: 1px solid #666; margin-top: 20px;">
              <div class="flex-between border-bottom">
                <div class="font-bold text-sm" style="padding-left: 5px;">Subtotal</div>
                <div class="text-sm" style="padding-right: 5px;">₹${formatCurrency(subtotalAmount)}</div>
              </div>
              ${gstNum > 0 ? `
              <div class="flex-between border-bottom" style="margin-top: 8px;">
                <div class="font-bold text-sm" style="padding-left: 5px;">GST</div>
                <div class="text-sm" style="padding-right: 5px;">₹${formatCurrency(gstNum)}</div>
              </div>
              ` : ''}
              ${discountNum > 0 ? `
              <div class="flex-between border-bottom" style= " padding-left: 5px;  padding-right: 5px; margin-top: 8px;">
                <span class="font-bold text-sm">Total Discount</span>
                <span class="text-sm">-₹${formatCurrency(discountNum)}</span>
              </div>
              ` : ''}
              
              <div class="flex-between" style="padding-top: 2px;">
                <div class="font-bold text-lg" style="padding-left: 5px;">Amount Payable:</div>
                <div class="font-bold text-lg" style="padding-right: 5px;">₹${formatCurrency(grandTotalNum)}</div>
              </div>
            </div>

            <!-- Bank Details & Authorized Signatory Section -->
            <div class="bank-signature-section page-break">
              <!-- Left Column: Bank Details -->
              <div style="display: flex; border-right: 1px solid #666;">

                <!-- Left: Bank Details -->
                <div style="width: 80%; font-size: 13px; padding: 10px;">
                  <div style="font-weight: bold; margin-bottom: 6px;">
                    Bank Details
                  </div>
                  <div>
                    <p><b>Account Number:</b> ${classicTemplate.data.acc_number || 'N/A'}</p>
                    <p><b>Bank:</b> ${classicTemplate.data.bank_name || 'N/A'}</p>
                    <p><b>IFSC:</b> ${classicTemplate.data.ifsc_code || 'N/A'}</p>
                    <p><b>UPI:</b> ${classicTemplate.data.upi_id || 'N/A'}</p>
                    <p><b>Account Name:</b> ${classicTemplate.data.acc_holder_name || 'N/A'}</p>
                  </div>
                </div>

                <!-- Right: QR Code -->
                <div style="
                  width: 50%;
                  padding: 10px;
                  border-left: 1px solid #666;
                  text-align: center;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                ">
                  
                  ${qrCodeHTML}
                </div>
              </div>
              
              <!-- Right Column: Signature -->
              <div class="signature-column">
                <!-- Signature Space -->
                <div class="signature-space">
                  <!-- Signature Image -->
                  ${signatureHTML}
                  
                  <div class="signature-line">
                    <p class="text-sm font-bold" style="margin-bottom: 2px;">For ${vendorName}</p>
                    <p class="text-sm">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fixed Footer Section with Terms & Conditions -->
            <div class="footer-fixed page-break">
              <!-- Two-column layout for Terms & Conditions -->
              <div class="footer-columns">
                <!-- Terms and Conditions -->
                <div class="terms-column">
                  <div class="footer-title">Terms and Conditions</div>
                  <div class="terms-conditions">
                    <p><b>E & O.E</b></p>
                    <p>1. Goods once sold will not be taken back.</p>
                    <p>2. Interest @ 18% p.a. will be charged if the payment for ${vendorName} is not made within the stipulated time.</p>
                    <p>3. Subject to 'Delhi' Jurisdiction only.</p>
                  </div>
                </div>

                <!-- Empty column for alignment -->
                <div class="bank-column" style="background-color: #f9f9f9;">
                  <div class="thank-you-note">
                    Thank you for your business! We appreciate your trust in us and look forward to serving you again.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for iframe to render and images to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if images are loaded in the iframe
    const images = iframeDoc.images;
    let allImagesLoaded = true;

    for (let i = 0; i < images.length; i++) {
      if (!images[i].complete) {
        allImagesLoaded = false;
        console.log(`Image ${i} not yet loaded:`, images[i].src);
      }
    }

    if (!allImagesLoaded) {
      console.log("Waiting additional time for images to load...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Generate PDF from iframe with improved settings
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 210 * 3.78,
      height: 297 * 3.78,
      windowWidth: 210 * 3.78,
      windowHeight: 297 * 3.78,
      logging: true,
      imageTimeout: 15000,
      onclone: (clonedDoc, element) => {
        // Ensure all images have crossOrigin attribute
        const images = element.getElementsByTagName('img');
        Array.from(images).forEach(img => {
          img.setAttribute('crossOrigin', 'anonymous');

          // If image is from our proxy, add enhanced error handling
          if (img.src.includes('/api/vendor/logo')) {
            console.log('🔗 Found proxy image, adding enhanced error handler');

            const initial = (vendorName || 'V').charAt(0).toUpperCase();
            const placeholderSvg = `data:image/svg+xml;base64,${btoa(`<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#3B82F6" stroke="#e5e7eb" stroke-width="2"/><text x="30" y="38" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${initial}</text></svg>`)}`;

            img.onerror = function () {
              console.log('❌ Proxy image failed in clone');
              this.src = placeholderSvg;
              this.onerror = null;
            };
          }
        });
      }
    });

    // Clean up
    document.body.removeChild(iframe);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    console.log("✅ Classic template PDF generated successfully");
    console.log("📄 PDF details:", {
      totalItems,
      totalQuantity,
      subtotalAmount,
      gst: gstNum,
      discount: discountNum,
      grandTotal: grandTotalNum
    });

    return pdfUrl;

  } catch (err) {
    console.error('❌ Error generating classic template PDF:', err);
    // Fallback: generate PDF without logo
    return await generateSimplePDF(invoiceData);
  } finally {
    setIsGeneratingPDF(false);
  }
};
  // Simple fallback PDF
  const generateSimplePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Parse string values to numbers for calculations
      const totals = calculateInvoiceTotals(invoiceData)
      const grossAmtNum = totals.totalGrossAmt
      const gstNum = totals.totalGst
      const discountNum = totals.totalDiscount
      const grandTotalNum = totals.totalGrandTotal

      // Format date
      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        } catch {
          return new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        }
      }

      // Use vendor data
      const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company'
      const vendorAddress = vendor?.address_line1 ?
        `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}`
        : '123 Business St, City'

      // Simple PDF with API data
      let y = 20

      pdf.setFontSize(16)
      pdf.setTextColor(30, 64, 175)
      pdf.text('TAX INVOICE', 105, y, { align: 'center' })

      y += 10
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      pdf.text(`Invoice #: ${invoiceData.invoice_id || 'N/A'}`, 20, y)
      pdf.text(`Date: ${formatDate(invoiceData.issue_date)}`, 150, y)

      y += 15
      pdf.setFontSize(12)
      pdf.text('From:', 20, y)
      pdf.setFontSize(10)
      y += 7
      pdf.text(vendorName, 20, y)
      y += 5
      pdf.text(vendorAddress, 20, y)
      y += 5
      pdf.text(vendor?.contact_number || '+91 XXXXX XXXXX', 20, y)

      y += 10
      pdf.setFontSize(12)
      pdf.text('To:', 20, y)
      pdf.setFontSize(10)
      y += 7
      pdf.text(invoiceData.billing_to || 'Customer Name', 20, y)
      y += 5
      pdf.text(invoiceData.email || 'N/A', 20, y)
      y += 5
      pdf.text(`Ph: ${invoiceData.mobile || 'N/A'}`, 20, y)

      y += 15

      // Table header
      pdf.setFontSize(11)
      pdf.text('#', 20, y)
      pdf.text('Item', 30, y)
      pdf.text('SKU', 120, y)
      pdf.text('Qty', 150, y)
      pdf.text('Amount', 180, y)

      y += 8
      pdf.line(20, y, 190, y)

      y += 10
      pdf.setFontSize(10)

      // Add products
      if (invoiceData.products && invoiceData.products.length > 0) {
        invoiceData.products.forEach((product: InvoiceProduct, index: number) => {
          const productTotal = parseFloat(product.total) || 0
          const productQty = product.qty || 1

          pdf.text((index + 1).toString(), 20, y)
          pdf.text(product.product_name || 'Product/Service', 30, y)
          pdf.text(product.product_sku || 'N/A', 120, y)
          pdf.text(productQty.toString(), 150, y)
          pdf.text(`₹${productTotal.toFixed(2)}`, 180, y)
          y += 8
        })
      } else {
        // Single product fallback
        const totals = calculateInvoiceTotals(invoiceData)
        const grandTotalNum = totals.totalGrandTotal
        const singleQty = invoiceData.qty || 1

        pdf.text('1', 20, y)
        pdf.text(invoiceData.product_name || 'Product/Service', 30, y)
        pdf.text(invoiceData.product_sku || 'N/A', 120, y)
        pdf.text(singleQty.toString(), 150, y)
        pdf.text(`₹${grandTotalNum.toFixed(2)}`, 180, y)
        y += 8
      }

      y += 12
      pdf.text(`Total Items / Qty : ${invoiceData.products?.length || 1} / ${invoiceData.qty || 1}`, 20, y)

      y += 15
      pdf.text(`Subtotal: ₹${grossAmtNum.toFixed(2)}`, 150, y)
      y += 8
      if (gstNum > 0) {
        pdf.text(`GST: ₹${gstNum.toFixed(2)}`, 150, y)
        y += 8
      }
      if (discountNum > 0) {
        pdf.text(`Discount: -₹${discountNum.toFixed(2)}`, 150, y)
        y += 8
      }
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Amount Payable: ₹${grandTotalNum.toFixed(2)}`, 150, y)

      y += 25

      // Footer with Terms and Conditions
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Terms and Conditions', 20, y)

      y += 7
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('E & O.E', 20, y)

      y += 5
      pdf.text('1. Goods once sold will not be taken back.', 20, y)

      y += 4
      pdf.text(`2. Interest @ 18% p.a. will be charged if the payment for ${vendorName}`, 20, y)
      y += 4
      pdf.text('   is not made within the stipulated time.', 20, y)

      y += 4
      pdf.text('3. Subject to Delhi Jurisdiction only.', 20, y)

      y += 10
      pdf.setFont('helvetica', 'bold')
      pdf.text('Bank Details:', 20, y)

      y += 6
      pdf.setFont('helvetica', 'normal')
      pdf.text('Account Number: 234000991111899', 20, y)
      y += 4
      pdf.text('Bank: ICICI', 20, y)
      y += 4
      pdf.text('IFSC: ICICI560000078', 20, y)
      y += 4
      pdf.text('Branch: Meerut', 20, y)
      y += 4
      pdf.text('Name: Kamal', 20, y)

      y += 15
      pdf.setFont('helvetica', 'bold')
      pdf.text(`For ${vendorName}`, 150, y)
      y += 15
      pdf.text('S', 150, y)

      const pdfBlob = pdf.output('blob')
      return URL.createObjectURL(pdfBlob)

    } catch (err) {
      console.error('Error generating simple PDF:', err)
      return null
    }
  }

  // Download PDF with selected template
  const downloadPDF = async () => {
    if (!invoice) return

    let pdfUrl = pdfPreviewUrl

    if (!pdfUrl) {
      pdfUrl = await generatePDFByTemplate(invoice, selectedTemplate)
      if (!pdfUrl) {
        setError('Failed to generate PDF for download')
        return
      }
    }

    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `invoice-${selectedTemplate}-${invoice.invoice_number || invoice.invoice_id || invoice.id || 'unknown'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Generate PDF automatically when invoice data is loaded
  useEffect(() => {
    const generateAndShowPDF = async () => {
      // Wait for invoice, vendor, and check if logo is loaded
      if (invoice && vendor && !pdfPreviewUrl && !isGeneratingPDF) {
        console.log("🔄 Starting PDF generation...")
        console.log("Invoice:", invoice.invoice_number)
        console.log("Vendor:", vendor.shop_name)
        console.log("Logo base64 loaded:", logoBase64 ? "Yes" : "No")
        console.log("Selected Template:", selectedTemplate)

        // Small delay to ensure logo is loaded
        await new Promise(resolve => setTimeout(resolve, 800))

        const pdfUrl = await generatePDFByTemplate(invoice, selectedTemplate)
        if (pdfUrl) {
          setPdfPreviewUrl(pdfUrl)
        }
      }
    }

    generateAndShowPDF()
  }, [invoice, vendor, logoBase64, pdfPreviewUrl, isGeneratingPDF, selectedTemplate])

  // Regenerate PDF when template changes
  useEffect(() => {
    if (invoice && vendor && pdfPreviewUrl) {
      // Revoke old URL
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }

      // Regenerate with new template
      const regeneratePDF = async () => {
        setPdfPreviewUrl(null)
        const pdfUrl = await generatePDFByTemplate(invoice, selectedTemplate)
        if (pdfUrl) {
          setPdfPreviewUrl(pdfUrl)
        }
      }

      regeneratePDF()
    }
  }, [selectedTemplate])

  // Test proxy when vendor loads
  useEffect(() => {
    if (vendor?.logo_url) {
      testLogoProxy()
    }
  }, [vendor?.logo_url])

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  // Fetch invoice data when invoiceId is available
  useEffect(() => {
    const fetchData = async () => {
      if (invoiceId) {
        await fetchInvoice(invoiceId)
      }
    }

    fetchData()
  }, [invoiceId])

  // INTERNAL ACTIONS SIDEBAR COMPONENT
  const InternalActionsSidebar = () => {
    const actionButtons = [
      {
        icon: <Download size={18} />,
        label: "Download PDF",
        onClick: downloadPDF,
        variant: "primary" as const,
        loading: isGeneratingPDF
      },
      {
        icon: <Thermometer size={18} />,
        label: "Thermal Print",
        onClick: printThermalInvoice,
        variant: "secondary" as const,
        loading: isPrintingThermal
      },
      {
        icon: <Thermometer size={18} />,
        label: "Thermal Preview",
        onClick: previewThermalInvoice,
        variant: "secondary" as const
      },
      {
        icon: <Printer size={18} />,
        label: "Print",
        onClick: () => window.print(),
        variant: "secondary" as const
      },
      {
        icon: <Mail size={18} />,
        label: "Email",
        onClick: () => alert("Email functionality would be implemented here"),
        variant: "secondary" as const
      },
      {
        icon: <MessageSquare size={18} />,
        label: "WhatsApp",
        onClick: () => alert("WhatsApp functionality would be implemented here"),
        variant: "secondary" as const
      },
      {
        icon: <Copy size={18} />,
        label: "Duplicate",
        onClick: () => alert("Duplicate functionality would be implemented here"),
        variant: "secondary" as const
      },
      {
        icon: <Edit size={18} />,
        label: "Edit",
        onClick: () => alert("Edit functionality would be implemented here"),
        variant: "secondary" as const
      },
      {
        icon: <FileText size={18} />,
        label: "Convert to Sale",
        onClick: () => alert("Convert to Sale functionality would be implemented here"),
        variant: "secondary" as const
      },
      {
        icon: <ImageIcon size={18} />,
        label: "Add Logo",
        onClick: () => alert("Add Logo functionality would be implemented here"),
        variant: "secondary" as const
      },
      {
        icon: <Banknote size={18} />,
        label: "Bank Details",
        onClick: () => alert("Bank Details functionality would be implemented here"),
        variant: "secondary" as const
      }
    ]

    const statusConfig = {
      'paid': {
        icon: <CheckCircle size={16} className="text-green-500" />,
        label: 'Paid',
        color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
      },
      'pending': {
        icon: <Clock size={16} className="text-yellow-500" />,
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
      },
      'unpaid': {
        icon: <AlertCircle size={16} className="text-red-500" />,
        label: 'Unpaid',
        color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      }
    }

    const status = invoice?.payment_status || 'pending'
    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <div className={`w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ${showActionsSidebar ? '' : 'hidden'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-lg dark:text-white">Invoice Actions</h3>
          <button
            onClick={() => setShowActionsSidebar(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Template Selection in Sidebar - Updated to match Code 2 style */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Template</div>
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              Change
            </button>
          </div>

          <div className="space-y-3">
            {templates
              .filter(t => ['modern', 'classic', 'minimal'].includes(t.id))
              .map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full rounded-lg border-2 p-2 transition-all hover:border-primary/50 ${selectedTemplate === template.id
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative bg-gray-100 dark:bg-gray-800 rounded overflow-hidden" style={{ width: '60px', height: '80px' }}>
                      <img
                        src={template.preview || "/placeholder.svg"}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedTemplate === template.id && (
                        <div className="absolute top-1 right-1 bg-blue-500 dark:bg-blue-400 rounded-full p-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium flex items-center gap-1.5 dark:text-white">
                        {template.name}
                        {selectedTemplate === template.id && <Check className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Invoice Info */}
        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Actions
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {actionButtons.slice(0, 6).map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.loading}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors
          ${action.variant === 'primary'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
          disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {action.loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  action.icon
                )}
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Invoice Status
            </div>
            <div
              className={`px-3 py-1 rounded-full border flex items-center gap-1 text-xs font-medium ${currentStatus.color}`}
            >
              {currentStatus.icon}
              {currentStatus.label}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Invoice #</span>
              <span className="font-medium dark:text-white">
                {invoice?.invoice_number || invoice?.invoice_id || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Customer</span>
              <span className="font-medium dark:text-white">
                {invoice?.billing_to || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount</span>
              <span className="font-medium dark:text-white">
                ₹{parseInvoiceNumber(invoice?.grand_total || '0').toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-medium dark:text-white">
                {invoice?.issue_date
                  ? new Date(invoice.issue_date).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>


        {/* More Actions */}
        <div className="p-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
            More Actions
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {actionButtons.slice(6).map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700
                   flex items-center gap-3
                   hover:bg-gray-50 dark:hover:bg-gray-800
                   transition-colors text-sm dark:text-gray-300"
              >
                {action.icon}
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>


        {/* Footer */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => alert("Going to sales page...")}
            className="w-full p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors dark:text-gray-300"
          >
            <ShoppingBag size={16} />
            Go to Sales
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background dark:bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg dark:text-white">Loading invoice data...</div>
        </div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="flex h-screen bg-background dark:bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg text-red-500 dark:text-red-400">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background dark:bg-gray-950">
      {/* Center - Only PDF Preview */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Toggle Button */}
        <div className="flex justify-between items-center p-4 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowActionsSidebar(!showActionsSidebar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-gray-300"
            >
              <Settings size={20} />
            </button>

            {/* Template Selector Button */}
            <div className="relative">
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 dark:text-gray-300"
                title="Change Template"
              >
                <Palette size={18} />
                <span className="text-xs hidden sm:inline">
                  Template: {templates.find(t => t.id === selectedTemplate)?.name}
                </span>
              </button>

              {/* Template Selector Dropdown */}
              <TemplateSelector />
            </div>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
                  const currentIndex = themes.indexOf(theme)
                  const nextTheme = themes[(currentIndex + 1) % themes.length]
                  toggleTheme(nextTheme)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 dark:text-gray-300"
                title={`Theme: ${theme} (${resolvedTheme})`}
              >
                {theme === 'light' && <Sun size={18} />}
                {theme === 'dark' && <Moon size={18} />}
                {theme === 'system' && <Monitor size={18} />}
                <span className="text-xs hidden sm:inline">
                  {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
                </span>
              </button>

              {/* Theme dropdown for desktop */}
              <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <button
                    onClick={() => toggleTheme('light')}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <Sun size={16} />
                    Light
                  </button>
                  <button
                    onClick={() => toggleTheme('dark')}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <Moon size={16} />
                    Dark
                  </button>
                  <button
                    onClick={() => toggleTheme('system')}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <Monitor size={16} />
                    System
                  </button>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Invoice: {invoice?.invoice_number || invoice?.invoice_id || 'N/A'}</span>
              <span className="ml-4">Vendor: {vendor?.shop_name || invoice?.biller_name || 'My Company'}</span>
              <span className="ml-4">Status:
                <span className={`ml-1 font-semibold ${invoice?.payment_status === 'paid' ? 'text-green-600 dark:text-green-400' :
                  invoice?.payment_status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                  {invoice?.payment_status?.toUpperCase() || 'PENDING'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {isGeneratingPDF ? (
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </button>
            ) : (
              <>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Download PDF
                </button>

              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Logo Error Display */}
        {logoError && (
          <div className="mx-4 mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-700 dark:text-yellow-400 text-sm">Logo: {logoError}</span>
              <button
                onClick={() => setLogoError(null)}
                className="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* PDF Preview Only */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
          {showThermalPreview && thermalPreviewHtml ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <iframe
                  srcDoc={thermalPreviewHtml}
                  className="w-[320px] h-[600px] border"
                  title="Thermal Preview"
                />
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    const w = window.open('', '_blank')
                    w?.document.write(thermalPreviewHtml)
                    w?.document.close()
                    w?.print()
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Print Thermal
                </button>

                <button
                  onClick={() => setShowThermalPreview(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            pdfPreviewUrl && (
              <div className="h-full flex items-center justify-center">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full min-h-[600px]"
                  title="PDF Preview"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Internal Right Sidebar - Actions */}
      <InternalActionsSidebar />

      {/* Hidden HTML preview for PDF generation (not shown to user) */}
      <div style={{ display: 'none' }}>
        <div ref={invoicePreviewRef}>
          {invoice && (
            <InvoicePreview
              invoice={invoice}
              template={selectedTemplate}
            />
          )}
        </div>
      </div>
    </div>
  )
}