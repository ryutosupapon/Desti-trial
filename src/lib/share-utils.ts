import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function generatePDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const imgWidth = 210
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= 297

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= 297
  }

  pdf.save(filename)
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

export function generateShareableLink(tripId: string) {
  return `${window.location.origin}/shared/${tripId}`
}
