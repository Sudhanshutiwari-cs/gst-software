"use client"

import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { TemplateSidebar } from "@/components/invoice/template-sidebar"
import { Invoice } from "../../../../.././../../types/invoice"
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
  Thermometer
} from "lucide-react"

interface VendorProfile {
  id: number
  business_name: string
  shop_name: string
  owner_name: string
  address_line1: string
  address_line2: string
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

export default function InvoiceViewer({ params }: PageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("classic")
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

  const invoicePreviewRef = useRef<HTMLDivElement>(null)

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

      console.log("✅ Invoice API Response:", invoiceData)

      // Parse numeric values
      const qty = parseInt(invoiceData.qty) || 1
      const grossAmt = parseFloat(invoiceData.gross_amt) || 0
      const gstAmt = parseFloat(invoiceData.gst) || 0
      const discountAmt = parseFloat(invoiceData.discount) || 0
      const grandTotalAmt = parseFloat(invoiceData.grand_total) || 0

      // Map API fields to your invoice structure with all required fields
      const mappedInvoice: Invoice = {
        id: parseInt(invoiceData.id) || parseInt(invoiceData.invoice_id) || 0,
        invoice_id: invoiceData.invoice_id || '',
        invoice_number: invoiceData.invoice_id || invoiceData.invoice_number || '',
        vendor_id: invoiceData.vendor_id?.toString() || '',
        currency: invoiceData.currency || 'INR',
        biller_name: invoiceData.biller_name || '',
        issue_date: invoiceData.created_at || invoiceData.issue_date || new Date().toISOString(),
        from_name: '',
        description: invoiceData.product_name || null,
        due_date: invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        billing_to: invoiceData.billing_to || '',
        to_email: invoiceData.email || '',
        from_address: '',
        from_email: '',
        billing_address: invoiceData.billing_address || '',
        mobile: invoiceData.mobile || null,
        to_name: invoiceData.billing_to || '',
        to_address: invoiceData.shipping_address || null,
        email: invoiceData.email || '',
        whatsapp_number: invoiceData.whatsapp_number || null,
        product_name: invoiceData.product_name || '',
        terms: invoiceData.terms || null,
        notes: invoiceData.notes || null,
        product_id: parseInt(invoiceData.product_id) || 0,
        product_sku: invoiceData.product_sku || '',
        qty: qty,
        gross_amt: grossAmt.toString() || '0',
        gst: gstAmt.toString() || '0',
        tax_inclusive: invoiceData.tax_inclusive || 0,
        discount: discountAmt.toString() || '0',
        grand_total: grandTotalAmt.toString() || '0',
        payment_status: invoiceData.payment_status || 'pending',
        payment_mode: invoiceData.payment_mode || null,
        utr_number: invoiceData.utr_number || null,
        created_at: invoiceData.created_at || new Date().toISOString(),
        updated_at: invoiceData.updated_at || new Date().toISOString(),
        shipping_address: invoiceData.shipping_address || null
      }

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

  // Helper function to parse invoice string values to numbers for calculations
  const parseInvoiceNumber = (value: string): number => {
    return parseFloat(value) || 0
  }

  // THERMAL PRINT FUNCTION
  const printThermalInvoice = async () => {
    if (!invoice || !vendor) {
      setError("No invoice data available for thermal printing")
      return
    }

    try {
      setIsPrintingThermal(true)

      // Parse numeric values
      const grossAmtNum = parseInvoiceNumber(invoice.gross_amt)
      const gstNum = parseInvoiceNumber(invoice.gst)
      const discountNum = parseInvoiceNumber(invoice.discount)
      const grandTotalNum = parseInvoiceNumber(invoice.grand_total)

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
              <div>Time: ${new Date().toLocaleTimeString('en-IN', {hour12: false, hour: '2-digit', minute:'2-digit'})}</div>
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
                <tr>
                  <td>${invoice.product_name || 'Product/Service'}</td>
                  <td style="text-align: center;">${invoice.qty}</td>
                  <td style="text-align: right;">₹${formatCurrency(grossAmtNum)}</td>
                </tr>
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

  // Specialized PDF generation for classic template with API data
  const generateClassicTemplatePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      setIsGeneratingPDF(true)

      // Parse string values to numbers for calculations
      const grossAmtNum = parseInvoiceNumber(invoiceData.gross_amt)
      const gstNum = parseInvoiceNumber(invoiceData.gst)
      const discountNum = parseInvoiceNumber(invoiceData.discount)
      const grandTotalNum = parseInvoiceNumber(invoiceData.grand_total)

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

      // Number to words function
      const numberToWords = (num: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
          'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
          'Eighteen', 'Nineteen']
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

        if (num === 0) return 'Zero'

        let words = ''

        if (num >= 10000000) {
          words += numberToWords(Math.floor(num / 10000000)) + ' Crore '
          num %= 10000000
        }

        if (num >= 100000) {
          words += numberToWords(Math.floor(num / 100000)) + ' Lakh '
          num %= 100000
        }

        if (num >= 1000) {
          words += numberToWords(Math.floor(num / 1000)) + ' Thousand '
          num %= 1000
        }

        if (num >= 100) {
          words += numberToWords(Math.floor(num / 100)) + ' Hundred '
          num %= 100
        }

        if (num > 0) {
          if (words !== '') words += 'and '

          if (num < 20) {
            words += ones[num]
          } else {
            words += tens[Math.floor(num / 10)]
            if (num % 10 > 0) {
              words += ' ' + ones[num % 10]
            }
          }
        }

        return words.trim() + ' Rupees Only.'
      }

      // Use vendor data for company info
      const vendorName = vendor?.shop_name || invoiceData.biller_name || 'My Company'
      const vendorAddress = vendor?.address_line1 ?
        `${vendor.address_line1}${vendor.address_line2 ? ', ' + vendor.address_line2 : ''}, ${vendor.city}, ${vendor.state}, ${vendor.pincode}`
        : '123 Business St, City, State, PIN'
      const vendorPhone = vendor?.contact_number || '+91 9856314765'

      console.log("=== PDF LOGO DEBUG ===")
      console.log("logoBase64 available:", logoBase64 ? "Yes" : "No")
      console.log("logoBase64 is data URL?", logoBase64?.startsWith('data:image'))
      console.log("logoBase64 length:", logoBase64?.length)
      console.log("Vendor logo URL:", vendor?.logo_url)

      // Helper function to create a placeholder logo
      const createPlaceholderLogo = () => {
        const initial = (vendorName || 'V').charAt(0).toUpperCase()
        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']
        const colorIndex = vendorName ? vendorName.charCodeAt(0) % colors.length : 0
        const color = colors[colorIndex]
        
        const svg = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="${color}" stroke="#e5e7eb" stroke-width="2"/>
          <text x="30" y="38" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
            ${initial}
          </text>
        </svg>`
        
        return `data:image/svg+xml;base64,${btoa(svg)}`
      }

      // Get direct URL with cache busting
      const getDirectLogoUrl = (url: string): string => {
        const timestamp = new Date().getTime()
        return `${url}?t=${timestamp}`
      }

      // Determine which logo to use
      let logoSrc = ''
      let useBase64 = false
      let useProxy = false

      if (logoBase64 && logoBase64.startsWith('data:image/') && logoBase64.length > 1000) {
        // Use the base64 we already have
        logoSrc = logoBase64
        useBase64 = true
        console.log("✅ Using existing base64 logo")
      } else if (vendor?.logo_url) {
        // Use server proxy for the vendor URL
        const encodedUrl = encodeURIComponent(vendor.logo_url)
        logoSrc = `/api/vendor/logo?url=${encodedUrl}`
        useProxy = true
        console.log("⚠️ Using server proxy for vendor logo")
      } else {
        // Create placeholder
        logoSrc = createPlaceholderLogo()
        console.log("❌ No logo available, using placeholder")
      }

      // Invoice data
      const invoiceDate = formatDate(invoiceData.issue_date)
      const dueDate = formatDate(invoiceData.due_date)
      const totalAmount = formatCurrency(grandTotalNum)
      const discountAmount = formatCurrency(discountNum)
      const gstAmount = formatCurrency(gstNum)
      const grossAmount = formatCurrency(grossAmtNum)
      const amountInWords = numberToWords(grandTotalNum)
      const originalPrice = grossAmtNum + discountNum

      // Create the logo HTML with fallback
      let logoHTML = ''
      
      if (useBase64) {
        logoHTML = `<img src="${logoSrc}" 
                        alt="Vendor Logo" 
                        style="width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;"
                        crossorigin="anonymous">`
      } else if (useProxy) {
        const directUrl = getDirectLogoUrl(vendor!.logo_url)
        const placeholder = createPlaceholderLogo()
        
        logoHTML = `<img src="${logoSrc}" 
                        alt="Vendor Logo" 
                        style="width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;"
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
                        ">`
      } else {
        logoHTML = `<img src="${logoSrc}" 
                        alt="Vendor Logo" 
                        style="width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;">`
      }

      console.log("Final logo HTML using:", useBase64 ? "Base64" : useProxy ? "Proxy" : "Placeholder")

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

      // Write the exact HTML structure with API data
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
        font-family: Arial, Helvetica, sans-serif;
      }
      body { 
        width: 210mm; 
        min-height: 297mm; 
        padding: 15mm 15mm 5mm 15mm; 
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
        min-height: 260mm;
        padding-bottom: 40mm; /* Space for fixed footer */
      }
      .border-bottom {
        border-bottom: 1px solid #666;
        padding-bottom: 8px;
        margin-bottom: 8px;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
      .text-sm { font-size: 11px; }
      .text-base { font-size: 12px; }
      .text-lg { font-size: 14px; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 11px;
      }
      th, td {
        border: 1px solid #666;
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background-color: #f5f5f5;
        font-weight: bold;
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
        font-size: 11px;
        color: #1e40af;
      }
      .bank-details {
        font-size: 10px;
        line-height: 1.4;
      }
      .terms-conditions {
        font-size: 9px;
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
        border: 1px solid #666;
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
        justify-content: space-between;
      }
      .thank-you-note {
        font-size: 10px;
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
        margin-top: 20px;
        padding-top: 5px;
        text-align: center;
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
        <h1 class="text-lg font-bold" style="color: #1e40af; letter-spacing: 2px;">TAX INVOICE</h1>
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
          
          <div style="border-top: 1px solid #666;margin: 0 -10px; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 10px;">
            <p class="font-bold text-sm">Customer Details:</p>
            <p class="text-sm">${invoiceData.billing_to || 'Customer Name'}</p>
            ${invoiceData.mobile ? `<p class="text-sm">Ph: ${invoiceData.mobile}</p>` : ''}
            ${invoiceData.email ? `<p class="text-sm">${invoiceData.email}</p>` : ''}
          </div>
        </div>

        <!-- Right Box -->
        <div style="padding-right: 0px;">
  <div class="flex-between border-bottom ">
    <div class="font-bold  text-sm" style="padding-left: 5px;">Invoice #:</div>
    <div class="text-sm " style="padding-right: 5px;">${invoiceData.invoice_number || invoiceData.invoice_id || 'N/A'}</div>
  </div>

  <div class="flex-between border-bottom" style="margin-top: 8px;">
    <div class="font-bold text-sm" style="padding-left: 5px;">Invoice Date:</div>
    <div class="text-sm" style="padding-right: 5px;">${invoiceDate}</div>
  </div>

  <div class="flex-between border-bottom" style="margin-top: 8px;">
    <div class="font-bold text-sm"  style="padding-left: 5px;">Due Date:</div>
    <div class="text-sm"  style="padding-right: 5px;">${dueDate}</div>
  </div>

  <div class="flex-between border-bottom" style="margin-top: 8px;">
    <div class="font-bold text-sm"  style="padding-left: 5px;">Status:</div>
    <div class="text-sm status-${invoiceData.payment_status}" style="padding-right: 5px;">
      ${invoiceData.payment_status?.toUpperCase() || 'PENDING'}
    </div>
  </div>
</div>

      </div>

      <!-- Items Table -->
      <table style="margin-top: 20px;" class="page-break">
        <thead>
          <tr>
            <th style="width: 30px; padding: 6px; text-align: center; vertical-align: middle;">#</th>
            <th>Item</th>
            <th style="width: 80px;padding: 6px; text-align: center; vertical-align: middle;">HSN/SAC</th>
            <th style="width: 100px;padding: 6px; text-align: center; vertical-align: middle;">Rate / Item</th>
            <th style="width: 70px;padding: 6px; text-align: center; vertical-align: middle;">Qty</th>
            <th style="width: 100px;padding: 6px; text-align: center; vertical-align: middle;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>${invoiceData.product_name || 'Product/Service'}</td>
            <td>${invoiceData.product_sku || 'N/A'}</td>
            <td>
              ₹${grossAmount}<br>
              ${discountNum > 0 ?
          `₹${formatCurrency(originalPrice)} (Discount: ₹${formatCurrency(discountNum)})`
          : ''}
            </td>
            <td>${invoiceData.qty} ${invoiceData.qty > 1 ? 'PCS' : 'PC'}</td>
            <td>₹${totalAmount}</td>
          </tr>
        </tbody>
      </table>

      <p class="text-sm" style="margin-top: 8px; padding-left: 5px;">
        Total Items / Qty : <b>1 / ${invoiceData.qty}</b>
      </p>

      <!-- Totals Box -->
      <div class="border-all page-break" style="margin-top: 15px;">
        <div class="flex-between border-bottom">
          <div class="font-bold text-sm" style="padding-left: 5px;">Subtotal</div>
          <div class="text-sm" style="padding-right: 5px;">₹${grossAmount}</div>
        </div>
        ${gstNum > 0 ? `
        <div class="flex-between border-bottom" style="margin-top: 8px;">
          <div class="font-bold text-sm" style="padding-left: 5px;">GST</div>
          <div class="text-sm" style="padding-right: 5px;">₹${gstAmount}</div>
        </div>
        ` : ''}
        ${discountNum > 0 ? `
        <div class="flex-between border-bottom" style="margin-top: 8px;">
          <span class="font-bold text-sm">Total Discount</span>
          <span class="text-sm">-₹${discountAmount}</span>
        </div>
        ` : ''}
        
        <p class="text-sm" style="margin-top: 15px; padding-left: 5px;">
          <b>Total amount (in words):</b> ${amountInWords}
        </p>
        
        <div class="flex-between" style="margin-top: 15px; padding-top: 10px; border-top: 2px solid #000;">
          <div class="font-bold text-lg" style="padding-left: 5px;">Amount Payable:</div>
          <div class="font-bold text-lg" style="padding-right: 5px;">₹${totalAmount}</div>
        </div>
      </div>

      <!-- Bank Details & Authorized Signatory Section (NEW) -->
      <div class="bank-signature-section page-break">
        <!-- Left Column: Bank Details -->
        <div class="bank-details-column">
          <div class="footer-title">Bank Details</div>
          <div class="bank-details">
            <p><b>Account Number:</b> 234000991111899</p>
            <p><b>Bank:</b> ICICI</p>
            <p><b>IFSC:</b> ICICI560000078</p>
            <p><b>Branch:</b> Meerut</p>
            <p><b>Account Name:</b> Kamal</p>
          </div>
        </div>
        
        <!-- Right Column: Signature -->
        <div class="signature-column">
          <!-- Thank You Note -->
          
          
          <!-- Signature Space -->
          <div class="signature-space">
            <div class="signature-line">
              <p class="text-sm font-bold">For ${vendorName}</p>
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

          <!-- Empty column for alignment (can be used for additional info if needed) -->
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
      `)
      iframeDoc.close()

      // Wait for iframe to render and images to load
      await new Promise(resolve => setTimeout(resolve, 3000))

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
              
              img.onerror = function() {
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

      console.log("✅ PDF generated successfully");
      return pdfUrl;

    } catch (err) {
      console.error('❌ Error generating classic template PDF:', err);
      // Fallback: generate PDF without logo
      return await generateSimplePDF(invoiceData);
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  // Simple fallback PDF
  const generateSimplePDF = async (invoiceData: Invoice): Promise<string | null> => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Parse string values to numbers for calculations
      const grossAmtNum = parseInvoiceNumber(invoiceData.gross_amt)
      const gstNum = parseInvoiceNumber(invoiceData.gst)
      const discountNum = parseInvoiceNumber(invoiceData.discount)
      const grandTotalNum = parseInvoiceNumber(invoiceData.grand_total)

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
      pdf.text(`Invoice #: ${invoiceData.invoice_number || invoiceData.invoice_id || 'N/A'}`, 20, y)
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
      pdf.text('1', 20, y)
      pdf.text(invoiceData.product_name || 'Product/Service', 30, y)
      pdf.text(invoiceData.product_sku || 'N/A', 120, y)
      pdf.text(invoiceData.qty.toString(), 150, y)
      pdf.text(`₹${grandTotalNum.toFixed(2)}`, 180, y)

      y += 20
      pdf.text(`Total Items / Qty : 1 / ${invoiceData.qty}`, 20, y)

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

  // Download PDF
  const downloadPDF = async () => {
    if (!invoice) return

    let pdfUrl = pdfPreviewUrl

    if (!pdfUrl) {
      pdfUrl = await generateClassicTemplatePDF(invoice)
      if (!pdfUrl) {
        setError('Failed to generate PDF for download')
        return
      }
    }

    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `invoice-${invoice.invoice_number || invoice.invoice_id || invoice.id || 'unknown'}.pdf`
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
        
        // Small delay to ensure logo is loaded
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const pdfUrl = await generateClassicTemplatePDF(invoice)
        if (pdfUrl) {
          setPdfPreviewUrl(pdfUrl)
        }
      }
    }

    generateAndShowPDF()
  }, [invoice, vendor, logoBase64, pdfPreviewUrl, isGeneratingPDF])

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
        color: 'bg-green-100 text-green-800 border-green-300'
      },
      'pending': {
        icon: <Clock size={16} className="text-yellow-500" />,
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      'unpaid': {
        icon: <AlertCircle size={16} className="text-red-500" />,
        label: 'Unpaid',
        color: 'bg-red-100 text-red-800 border-red-300'
      }
    }

    const status = invoice?.payment_status || 'pending'
    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <div className={`w-80 bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${showActionsSidebar ? '' : 'hidden'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Invoice Actions</h3>
          <button
            onClick={() => setShowActionsSidebar(false)}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">Invoice Status</div>
            <div className={`px-3 py-1 rounded-full border flex items-center gap-1 text-xs font-medium ${currentStatus.color}`}>
              {currentStatus.icon}
              {currentStatus.label}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice #</span>
              <span className="font-medium">{invoice?.invoice_number || invoice?.invoice_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer</span>
              <span className="font-medium">{invoice?.billing_to || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">₹{parseInvoiceNumber(invoice?.grand_total || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">
                {invoice?.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {actionButtons.slice(0, 6).map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.loading}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${action.variant === 'primary' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
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

        {/* More Actions */}
        <div className="p-4">
          <h4 className="font-medium text-gray-700 mb-3">More Actions</h4>
          <div className="space-y-2">
            {actionButtons.slice(6).map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="w-full p-3 rounded-lg border border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-colors text-sm"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <button
            onClick={() => alert("Going to sales page...")}
            className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
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
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg">Loading invoice data...</div>
        </div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg text-red-500">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Template Selection (optional) */}
      <TemplateSidebar
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
      />

      {/* Center - Only PDF Preview */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Toggle Button */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowActionsSidebar(!showActionsSidebar)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Settings size={20} />
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Invoice: {invoice?.invoice_number || invoice?.invoice_id || 'N/A'}</span>
              <span className="ml-4">Vendor: {vendor?.shop_name || invoice?.biller_name || 'My Company'}</span>
              <span className="ml-4">Status:
                <span className={`ml-1 font-semibold ${invoice?.payment_status === 'paid' ? 'text-green-600' :
                  invoice?.payment_status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                  {invoice?.payment_status?.toUpperCase() || 'PENDING'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {isGeneratingPDF ? (
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2">
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
                <button
                  onClick={printThermalInvoice}
                  disabled={isPrintingThermal}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPrintingThermal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Thermometer size={16} />
                  )}
                  Thermal Print
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-700 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Logo Error Display */}
        {logoError && (
          <div className="mx-4 mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-700 text-sm">Logo: {logoError}</span>
              <button
                onClick={() => setLogoError(null)}
                className="text-yellow-500 hover:text-yellow-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* PDF Preview Only */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {pdfPreviewUrl ? (
            // PDF Preview
            <div className="h-full flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full h-full">
                <div className="flex flex-col h-full">
                  <div className="flex-1 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                    <iframe
                      src={pdfPreviewUrl}
                      className="w-full h-full min-h-[600px]"
                      title="PDF Preview"
                    />
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-600">
                    <p>Invoice #{invoice?.invoice_number || invoice?.invoice_id} | Generated from API data</p>
                    <p className="text-xs mt-1">Includes Terms & Conditions and Bank Details</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Loading or error state for PDF
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                {isGeneratingPDF ? (
                  <>
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-lg">Generating PDF...</div>
                    <div className="text-sm text-gray-500">Loading vendor logo and invoice data</div>
                  </>
                ) : (
                  <div className="text-lg text-gray-500">Preparing PDF preview...</div>
                )}
              </div>
            </div>
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