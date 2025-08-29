import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

type Organization = {
  id: number
  name: string
  category: string
  location: string
  address: string
  employees: string
  website: string
  phone: string
  email: string
  twitter: string
  linkedin: string
  description: string
  organizationType: string[]
  founded: number
}

export const exportToPDF = (organizations: Organization[], filters?: {
  searchTerm?: string
  category?: string
  employeeSize?: string
}) => {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(20)
  doc.text('Biogrofe - Biotechnology Organizations', 20, 20)
  
  // Add filters info if any
  let yPosition = 35
  if (filters) {
    doc.setFontSize(12)
    if (filters.searchTerm) {
      doc.text(`Search: ${filters.searchTerm}`, 20, yPosition)
      yPosition += 7
    }
    if (filters.category && filters.category !== 'All Categories') {
      doc.text(`Category: ${filters.category}`, 20, yPosition)
      yPosition += 7
    }
    if (filters.employeeSize && filters.employeeSize !== 'All Sizes') {
      doc.text(`Company Size: ${filters.employeeSize}`, 20, yPosition)
      yPosition += 7
    }
    yPosition += 5
  }
  
  // Add summary
  doc.setFontSize(12)
  doc.text(`Total Organizations: ${organizations.length}`, 20, yPosition)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 7)
  
  // Prepare table data
  const tableData = organizations.map(org => [
    org.name,
    org.category,
    org.location,
    org.employees,
    org.website,
    org.email,
    org.organizationType.join(', ')
  ])
  
  // Add table
  autoTable(doc, {
    head: [['Name', 'Category', 'Location', 'Size', 'Website', 'Email', 'Type']],
    body: tableData,
    startY: yPosition + 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 30 }, // Name
      1: { cellWidth: 25 }, // Category
      2: { cellWidth: 25 }, // Location
      3: { cellWidth: 15 }, // Size
      4: { cellWidth: 30 }, // Website
      5: { cellWidth: 30 }, // Email
      6: { cellWidth: 25 }  // Type
    },
    margin: { left: 10, right: 10 }
  })
  
  // Save the PDF
  const fileName = `biogrofe-organizations-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export const exportToExcel = async (organizations: Organization[], filters?: {
  searchTerm?: string
  category?: string
  employeeSize?: string
}) => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Organizations')
  
  // Prepare data for Excel
  const excelData = organizations.map(org => ({
    'Organization Name': org.name,
    'Category': org.category,
    'Location': org.location,
    'Address': org.address,
    'Company Size': org.employees,
    'Website': org.website,
    'Phone': org.phone,
    'Email': org.email,
    'Twitter': org.twitter,
    'LinkedIn': org.linkedin,
    'Description': org.description,
    'Organization Type': org.organizationType.join(', '),
    'Founded': org.founded
  }))
  
  // Add headers
  const headers = Object.keys(excelData[0])
  worksheet.addRow(headers)
  
  // Style the header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  }
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  
  // Add data rows
  excelData.forEach(row => {
    worksheet.addRow(Object.values(row))
  })
  
  // Set column widths
  const colWidths = [
    { width: 30 }, // Organization Name
    { width: 20 }, // Category
    { width: 20 }, // Location
    { width: 30 }, // Address
    { width: 15 }, // Company Size
    { width: 25 }, // Website
    { width: 15 }, // Phone
    { width: 25 }, // Email
    { width: 15 }, // Twitter
    { width: 20 }, // LinkedIn
    { width: 50 }, // Description
    { width: 25 }, // Organization Type
    { width: 10 }  // Founded
  ]
  
  colWidths.forEach((col, index) => {
    worksheet.getColumn(index + 1).width = col.width
  })
  
  // Add a summary sheet if filters are applied
  if (filters) {
    const summaryWorksheet = workbook.addWorksheet('Summary')
    
    const summaryData = [
      ['Export Summary', ''],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Total Organizations', organizations.length],
      ['', ''],
      ['Applied Filters', ''],
      ['Search Term', filters.searchTerm || 'None'],
      ['Category', filters.category === 'All Categories' ? 'None' : (filters.category || 'None')],
      ['Company Size', filters.employeeSize === 'All Sizes' ? 'None' : (filters.employeeSize || 'None')]
    ]
    
    summaryData.forEach(row => {
      summaryWorksheet.addRow(row)
    })
    
    // Style the summary sheet
    summaryWorksheet.getColumn(1).width = 20
    summaryWorksheet.getColumn(2).width = 30
    
    const summaryHeaderRow = summaryWorksheet.getRow(1)
    summaryHeaderRow.font = { bold: true }
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    }
    summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  }
  
  // Generate and download the file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `biogrofe-organizations-${new Date().toISOString().split('T')[0]}.xlsx`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportToCSV = (organizations: Organization[]) => {
  const csvData = organizations.map(org => ({
    'Organization Name': org.name,
    'Category': org.category,
    'Location': org.location,
    'Address': org.address,
    'Company Size': org.employees,
    'Website': org.website,
    'Phone': org.phone,
    'Email': org.email,
    'Twitter': org.twitter,
    'LinkedIn': org.linkedin,
    'Description': org.description,
    'Organization Type': org.organizationType.join(', '),
    'Founded': org.founded
  }))
  
  // Convert to CSV format manually
  const headers = Object.keys(csvData[0])
  const csvRows = [
    headers.join(','), // Header row
    ...csvData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escapedValue = String(value).replace(/"/g, '""')
        if (escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n')) {
          return `"${escapedValue}"`
        }
        return escapedValue
      }).join(',')
    )
  ]
  
  const csv = csvRows.join('\n')
  
  // Create and download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `biogrofe-organizations-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
