"use client"

import { ActionsSidebar } from "@/components/invoice/actions-sidebar"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { TemplateSidebar } from "@/components/invoice/template-sidebar"
import { Invoice } from "../../../../.././../../types/invoice"
import { useEffect, useState, use, useRef } from "react"
import { sampleInvoice } from "@/components/data/sampleInvoice"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

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

export default function InvoiceViewer({ params }: { params: Promise<{ id: string }> }) {
  const [selectedTemplate, setSelectedTemplate] = useState("classic")
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  
  const invoicePreviewRef = useRef<HTMLDivElement>(null)

  // Unwrap the params promise
  const unwrappedParams = use(params)
  const { id } = unwrappedParams

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
      
      console.log("Vendor profile loaded:", vendorProfile)
      setVendor(vendorProfile)
      return vendorProfile
    } catch (err) {
      console.error('Error fetching vendor profile:', err)
      return null
    }
  }

  // Test if image loads
  const testImageLoad = async (url: string): Promise<boolean> => {
    if (!url) return false
    
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        console.log(`Image loaded successfully: ${url}`)
        resolve(true)
      }
      img.onerror = () => {
        console.log(`Failed to load image: ${url}`)
        resolve(false)
      }
      img.src = url
      // Timeout after 5 seconds
      setTimeout(() => {
        console.log(`Image load timeout: ${url}`)
        resolve(false)
      }, 5000)
    })
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
      
      console.log("Invoice API Response:", invoiceData)
      
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
      console.error('Error fetching invoice:', err)
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
      
      // Test logo URL
      const logoUrl = vendor?.logo_url || 'https://manhemdigitalsolutions.com/pos-admin/storage/app/public/vendor-logos/vepQupycfoL4Q2hANrVQKuvI8xiFhtZSo8RuqLgq.png'
      const logoLoads = await testImageLoad(logoUrl)
      console.log(`Logo URL loads: ${logoLoads}`)
      
      // Invoice data
      const invoiceDate = formatDate(invoiceData.issue_date)
      const dueDate = formatDate(invoiceData.due_date)
      const totalAmount = formatCurrency(grandTotalNum)
      const discountAmount = formatCurrency(discountNum)
      const gstAmount = formatCurrency(gstNum)
      const grossAmount = formatCurrency(grossAmtNum)
      const amountInWords = numberToWords(grandTotalNum)
      const originalPrice = grossAmtNum + discountNum

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
              }
              .invoice-container {
                width: 100%;
                background: white;
                border: 1px solid #666;
                padding: 15px;
                position: relative;
                min-height: 260mm;
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
                gap: 15px;
                margin: 15px 0;
              }
              .border-all {
                border: 1px solid #666;
                padding: 10px;
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
              }
              .logo-placeholder {
                width: 60px;
                height: 60px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #666;
              }
              .status-paid { color: green; }
              .status-pending { color: orange; }
              .status-unpaid { color: red; }
              .footer-section {
                margin-top: 30px;
                border-top: 1px solid #666;
                padding-top: 15px;
                font-size: 10px;
                line-height: 1.3;
              }
              .footer-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 10px;
              }
              .footer-title {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 11px;
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
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <!-- Invoice Title -->
              <div class="border-bottom text-center">
                <h1 class="text-lg font-bold" style="color: #1e40af; letter-spacing: 2px;">TAX INVOICE</h1>
              </div>

              <!-- Header Section -->
              <div class="grid-2" style="border: 1px solid #666; margin-top: 15px;">
                <!-- Left Box -->
                <div style="border-right: 1px solid #666; padding: 10px;">
                  <!-- Logo and Details -->
                  <div style="display: flex; align-items: start; gap: 10px; margin-bottom: 10px;">
                    ${logoLoads ? 
                      `<img src="${logoUrl}" 
                           alt="Vendor Logo" 
                           class="logo"
                           crossorigin="anonymous">` 
                      : 
                      `<div class="logo-placeholder">LOGO</div>`
                    }
                    <div>
                      <h2 class="font-bold text-base">${vendorName}</h2>
                      <p class="text-sm">${vendorAddress}</p>
                      <p class="text-sm">Mobile: ${vendorPhone}</p>
                      ${vendor?.gst_number ? `<p class="text-sm">GST: ${vendor.gst_number}</p>` : ''}
                    </div>
                  </div>
                  
                  <div style="border-top: 1px solid #666; margin: 10px 0; padding-top: 10px;">
                    <p class="font-bold text-sm">Customer Details:</p>
                    <p class="text-sm">${invoiceData.billing_to || 'Customer Name'}</p>
                    ${invoiceData.mobile ? `<p class="text-sm">Ph: ${invoiceData.mobile}</p>` : ''}
                    ${invoiceData.email ? `<p class="text-sm">${invoiceData.email}</p>` : ''}
                  </div>
                </div>

                <!-- Right Box -->
                <div style="padding: 10px;">
                  <div class="flex-between border-bottom">
                    <span class="font-bold text-sm">Invoice #:</span>
                    <span class="text-sm">${invoiceData.invoice_number || invoiceData.invoice_id || 'N/A'}</span>
                  </div>
                  <div class="flex-between border-bottom" style="margin-top: 8px;">
                    <span class="font-bold text-sm">Invoice Date:</span>
                    <span class="text-sm">${invoiceDate}</span>
                  </div>
                  <div class="flex-between" style="margin-top: 8px;">
                    <span class="font-bold text-sm">Due Date:</span>
                    <span class="text-sm">${dueDate}</span>
                  </div>
                  <div class="flex-between" style="margin-top: 8px;">
                    <span class="font-bold text-sm">Status:</span>
                    <span class="text-sm status-${invoiceData.payment_status}">
                      ${invoiceData.payment_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Items Table -->
              <table style="margin-top: 20px;" class="page-break">
                <thead>
                  <tr>
                    <th style="width: 30px;">#</th>
                    <th>Item</th>
                    <th style="width: 80px;">HSN/SAC</th>
                    <th style="width: 100px;">Rate / Item</th>
                    <th style="width: 70px;">Qty</th>
                    <th style="width: 100px;">Amount</th>
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

              <p class="text-sm" style="margin-top: 8px;">
                Total Items / Qty : <b>1 / ${invoiceData.qty}</b>
              </p>

              <!-- Totals Box -->
              <div class="border-all page-break" style="margin-top: 15px;">
                <div class="flex-between border-bottom">
                  <span class="font-bold text-sm">Subtotal</span>
                  <span class="text-sm">₹${grossAmount}</span>
                </div>
                ${gstNum > 0 ? `
                <div class="flex-between border-bottom" style="margin-top: 8px;">
                  <span class="font-bold text-sm">GST</span>
                  <span class="text-sm">₹${gstAmount}</span>
                </div>
                ` : ''}
                ${discountNum > 0 ? `
                <div class="flex-between border-bottom" style="margin-top: 8px;">
                  <span class="font-bold text-sm">Total Discount</span>
                  <span class="text-sm">-₹${discountAmount}</span>
                </div>
                ` : ''}
                
                <p class="text-sm" style="margin-top: 15px;">
                  <b>Total amount (in words):</b> ${amountInWords}
                </p>
                
                <div class="flex-between" style="margin-top: 15px; padding-top: 10px; border-top: 2px solid #000;">
                  <span class="font-bold text-lg">Amount Payable:</span>
                  <span class="font-bold text-lg">₹${totalAmount}</span>
                </div>
              </div>

              <!-- Signature Box -->
              <div class="signature-box page-break">
                <p class="font-bold text-base">For ${vendorName}</p>
                <div style="height: 50px; margin: 10px 0; display: flex; justify-content: flex-end;">
                  <div style="width: 150px; border-bottom: 1px solid #000; height: 50px;"></div>
                </div>
                <p class="text-sm">Authorized Signatory</p>
              </div>

              <!-- Footer Section with Terms & Conditions and Bank Details -->
              <div class="footer-section page-break">
                <div class="footer-grid">
                  <!-- Terms and Conditions -->
                  <div>
                    <div class="footer-title">Terms and Conditions</div>
                    <div class="terms-conditions">
                      <p><b>E & O.E</b></p>
                      <p>1. Goods once sold will not be taken back.</p>
                      <p>2. Interest @ 18% p.a. will be charged if the payment for ${vendorName} is not made within the stipulated time.</p>
                      <p>3. Subject to 'Delhi' Jurisdiction only.</p>
                    </div>
                  </div>
                  
                  <!-- Bank Details -->
                  <div>
                    <div class="footer-title">Bank Details</div>
                    <div class="bank-details">
                      <p><b>Account Number:</b> 234000991111899</p>
                      <p><b>Bank:</b> ICICI</p>
                      <p><b>IFSC:</b> ICICI560000078</p>
                      <p><b>Branch:</b> Meerut</p>
                      <p><b>Name:</b> Kamal</p>
                    </div>
                  </div>
                </div>
                
                <!-- Final Signature -->
                <div class="final-signature">
                  <p class="font-bold text-base">For ${vendorName}</p>
                  <div style="height: 40px; margin: 5px 0;"></div>
                  <p class="text-sm">S</p>
                </div>
              </div>

              <!-- Footer Note -->
              <p class="text-center text-sm" style="margin-top: 10px; color: #666; font-size: 9px;">
                Generated by Manhem Digital Solutions | Visit manhemdigitalsolutions.com
              </p>
            </div>
          </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for iframe to render and images to load
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Generate PDF from iframe
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78,
        height: 297 * 3.78,
        windowWidth: 210 * 3.78,
        windowHeight: 297 * 3.78,
        
        logging: false,
        onclone: (clonedDoc, element) => {
          // Force images to load
          const images = element.getElementsByTagName('img')
          Array.from(images).forEach(img => {
            if (!img.complete) {
              img.crossOrigin = 'anonymous'
            }
          })
        }
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
      
      console.log("PDF generated successfully")
      return pdfUrl

    } catch (err) {
      console.error('Error generating classic template PDF:', err)
      return await generateSimplePDF(invoiceData)
    } finally {
      setIsGeneratingPDF(false)
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
      if (invoice && !pdfPreviewUrl && !isGeneratingPDF) {
        console.log("Generating PDF with invoice data:", invoice)
        console.log("Vendor data:", vendor)
        const pdfUrl = await generateClassicTemplatePDF(invoice)
        if (pdfUrl) {
          setPdfPreviewUrl(pdfUrl)
        }
      }
    }

    generateAndShowPDF()
  }, [invoice, vendor])

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl])

  // Fetch invoice data on component mount
  useEffect(() => {
    if (id) {
      fetchInvoice(id)
    }
  }, [id])

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

  // Only show PDF preview (no HTML preview option)
  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Template Selection (optional) */}
      <TemplateSidebar 
        selectedTemplate={selectedTemplate} 
        onSelectTemplate={setSelectedTemplate} 
      />

      {/* Center - Only PDF Preview */}
      <div className="flex-1 flex flex-col">
        {/* PDF Controls */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Invoice: {invoice?.invoice_number || invoice?.invoice_id || 'N/A'}</span>
              <span className="ml-4">Vendor: {vendor?.shop_name || invoice?.biller_name || 'My Company'}</span>
              <span className="ml-4">Status: 
                <span className={`ml-1 font-semibold ${
                  invoice?.payment_status === 'paid' ? 'text-green-600' : 
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
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Download PDF
              </button>
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

      {/* Right Sidebar - Actions */}
      {invoice && (
        <ActionsSidebar 
          invoice={invoice}
          onSave={() => console.log('Saving invoice changes...')}
          onExport={downloadPDF}
          onEdit={() => {}}
          onDuplicate={() => {}}
          onConvert={() => {}}
          onCancel={() => {}}
          onPrint={() => {}}
          onEmail={() => {}}
          onWhatsapp={() => {}}
          onAddLogo={() => {}}
          onAddBankDetails={() => {}}
          onClose={() => {}}
          onGoToSales={() => {}}
        />
      )}

      {/* Hidden HTML preview for PDF generation (not shown to user) */}
      <div style={{ display: 'none' }}>
        <div ref={invoicePreviewRef}>
          {invoice && (
            <InvoicePreview 
              invoice={invoice} 
              template={selectedTemplate}
              zoom={100}
              onZoomChange={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  )
}