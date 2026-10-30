import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { SaleOrderWithItems } from '@/lib/types';

// How many copies to produce per print. Sale Orders are always printed 2 up
// (customer + file copy). We bake the copies into the PDF as extra pages rather
// than relying on the print dialog's "copies" field — on Windows the native
// dialog ignores the value Electron passes and always shows 1, which is why the
// client saw a default of 1. Baking it in makes 2 the true default.
const PRINT_COPIES = 2;

// Draws one complete Sale Order onto the current page(s) of `doc`.
function drawSaleOrder(doc: jsPDF, order: SaleOrderWithItems) {
  doc.setFontSize(18);
  doc.text('Sale Order', 5, 20);

  doc.setFontSize(10);
  doc.text(`Serial No: ${order.serial_no}`, 5, 30);
  doc.text(
    `Date: ${format(new Date(order.order_date), 'dd MMM yyyy')}`,
    5,
    36
  );
  doc.text(`Party: ${order.party_name}`, 5, 42);

  const tableData = order.items.map((it, i) => [
    String(i + 1),
    it.item_name,
    it.marka || '—',
    it.unit ? `${it.quantity} ${it.unit}` : String(it.quantity),
    String(it.rate),
    it.discount_percent != null ? `${it.discount_percent}%` : '—',
  ]);

  autoTable(doc, {
    startY: 50,
    margin: { left: 5, right: 5 },
    tableWidth: 'auto',
    head: [['#', 'Item Name', 'Marka', 'Quantity', 'Rate', '(-)%']],
    body: tableData,
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'center',
    },
    headStyles: {
      fillColor: [255, 179, 45],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      fontSize: 10,
      cellPadding: 3,
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 40 },
    },
    didParseCell: (data) => {
      // Force alignment defensively: column 1 = left everywhere, everything else = center.
      // Guards against any theme/style override that might slip past columnStyles.
      if (data.column.index === 1) {
        data.cell.styles.halign = 'left';
      } else {
        data.cell.styles.halign = 'center';
      }
    },
  });

  let cursorY = (doc as any).lastAutoTable.finalY + 8;

  if (order.notes && order.notes.trim().length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 5, cursorY);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(order.notes, 190);
    doc.text(lines, 5, cursorY + 5);
  }
}

export function exportSaleOrderToPDF(order: SaleOrderWithItems) {
  const doc = new jsPDF('p', 'mm', 'a4');

  for (let copy = 0; copy < PRINT_COPIES; copy++) {
    if (copy > 0) doc.addPage();
    drawSaleOrder(doc, order);
  }

  // Build a clean `data:application/pdf;base64,…` URL. A bare content type
  // (no filename parameter) is what Chromium's PDF viewer needs to render it.
  const dataUrl = 'data:application/pdf;base64,' + btoa(doc.output());
  // Copies are already baked into the PDF, so ask the print layer for 1.
  window.electronAPI.printPDF(dataUrl, { copies: 1, autoPrint: true });
}
