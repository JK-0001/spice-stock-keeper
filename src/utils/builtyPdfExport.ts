import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { BuiltyWithItems } from '@/lib/types';

export function exportBuiltyToPDF(builty: BuiltyWithItems) {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(18);
  doc.text('Builty / Dispatch Copy', 5, 20);

  doc.setFontSize(10);
  doc.text(`Serial No: ${builty.serial_no}`, 5, 30);
  doc.text(`Date: ${format(new Date(builty.builty_date), 'dd MMM yyyy')}`, 5, 36);
  doc.text(`Party: ${builty.party_name}`, 5, 42);

  const total = builty.items.reduce((s, it) => s + Number(it.quantity || 0), 0);

  // Totals across units only make sense when every row shares one unit.
  // Otherwise show the number alone — the per-row cells already carry units.
  const units = new Set(builty.items.map((it) => (it.unit ?? '').trim()).filter(Boolean));
  const totalText = units.size === 1 ? `${total} ${[...units][0]}` : String(total);

  const body = builty.items.map((it, i) => [
    String(i + 1),
    it.item_name,
    it.marka || '—',
    it.unit ? `${it.quantity} ${it.unit}` : String(it.quantity),
  ]);

  autoTable(doc, {
    startY: 50,
    margin: { left: 5, right: 5 },
    tableWidth: 'auto',
    head: [['#', 'Item Name', 'Marka', 'Quantity']],
    body,
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
      0: { cellWidth: 12 },
      1: { cellWidth: 90, halign: 'left' },
      2: { cellWidth: 55 },
      3: { cellWidth: 40 },
    },
    foot: [['', 'Total', '', totalText]],
    footStyles: {
      fillColor: [255, 179, 45],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 3,
      halign: 'center',
    },
    didParseCell: (data) => {
      // Foot row: everything centered (Total label + number).
      // Head + body: column 1 (Item Name) left, everything else centered.
      if (data.section === 'foot') {
        data.cell.styles.halign = 'center';
        return;
      }
      data.cell.styles.halign = data.column.index === 1 ? 'left' : 'center';
    },
  });

  let cursorY = (doc as any).lastAutoTable.finalY + 8;

  if (builty.notes && builty.notes.trim().length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 5, cursorY);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(builty.notes, 190);
    doc.text(lines, 5, cursorY + 5);
  }

  const dataUrl = doc.output('dataurl') as unknown as string;
  // Builtys are always printed 2 up (one for the office, one for the driver).
  // The main process opens the OS print dialog with copies pre-set to 2.
  window.electronAPI.printPDF(dataUrl, { copies: 2, autoPrint: true });
}
