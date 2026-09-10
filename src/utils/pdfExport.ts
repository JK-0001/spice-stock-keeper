import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { InventoryWithStorage, Outgoing } from '@/lib/types';
import type { BillingCycle } from '@/lib/billing-cycles';

export type InventoryItem = InventoryWithStorage;

export function exportInventoryToPDF(data: InventoryItem[]) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Add title
  doc.setFontSize(18);
  doc.text('Inventory Report', 5, 20);

  // Add date
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Date: ${today}`, 5, 28);

  
  // Add total items count
  doc.setFontSize(10);
  doc.text(`Total Items: ${data.length}`, 5, 36);

  // Prepare table data
  const tableData = data.map((item) => {

    return [
      item.item_name,
      item.brand || '—',
      item.party_name,
      item.purchase_rate.toString(),
      item.cold_storages?.cold_storage_name || '—',
      item.lot_number,
      format(new Date(item.cold_storage_date), 'dd MMM yyyy'),
      item.current_balance_qty.toString(),
    ];
  });

  // Add table
  autoTable(doc, {
    startY: 45,
    margin: { left: 5, right: 5 },
    tableWidth: 'auto',
    head: [['Item Name', 'Brand Name', 'Party Name', 'Purc Rate', 'Cold Storage', 'Lot #',  'Cold Date', 'Bal. Qty']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [255, 179, 45],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      halign: 'center',
      fontSize: 10,
      cellPadding: 3,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 33, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
    },
  });

  // Output as data URL and open native print dialog
  const dataUrl = doc.output('dataurl');
  window.electronAPI.printPDF(dataUrl);
}

export function printItemDetail(item: InventoryWithStorage, outgoing: Outgoing[], billingCycles: BillingCycle[], totalStorageCost: number) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // ─── colours ────────────────────────────────────────────────
  const PRIMARY   = [255, 179, 45] as [number, number, number];   // blue – matches app primary
  const DARK      = [33, 37, 41]   as [number, number, number];   // near-black text
  const MUTED     = [100, 106, 112] as [number, number, number];  // muted foreground
  const CARD_BG   = [247, 248, 250] as [number, number, number];  // stat-card background
  const CARD_BRD  = [229, 232, 235] as [number, number, number];  // stat-card border
  const BAR_BG    = [229, 232, 235] as [number, number, number];  // progress bar track
  const BADGE_ACT = [255, 179, 45] as [number, number, number];   // Active badge bg
  const BADGE_TXT_ACT = [0, 0, 0]   as [number, number, number];
  const BADGE_SEC = [229, 232, 235] as [number, number, number];  // Secondary badge bg
  const BADGE_TXT_SEC = [0, 0, 0]   as [number, number, number];

  let y = 16; // current vertical cursor

  // ─── HEADER: item name + status badge + subtitle ───────────
  // Item name
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(item.item_name, margin, y);

  // Status badge — drawn next to the name
  const nameWidth = doc.getTextWidth(item.item_name);
  const badgeText = item.status;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const badgeTextWidth = doc.getTextWidth(badgeText);
  const badgePadX = 2.5;
  const badgePadY = 1.8;
  const badgeW = badgeTextWidth + badgePadX * 2;
  const badgeH = 5.5;
  const badgeX = margin + nameWidth + 5;
  const badgeY = y - 4.2; // vertically centre with title baseline

  // Badge background pill
  doc.setDrawColor(...(item.status === 'Active' ? BADGE_ACT : BADGE_SEC));
  doc.setFillColor(...(item.status === 'Active' ? BADGE_ACT : BADGE_SEC));
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2.5, 2.5, 'F');

  // Badge text
  doc.setTextColor(...(item.status === 'Active' ? BADGE_TXT_ACT : BADGE_TXT_SEC));
  doc.text(badgeText, badgeX + badgePadX, badgeY + badgePadY + 1.6, { baseline: 'middle' });

  // Subtitle: party • Lot
  y += 5.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(`${item.party_name}  •  Lot: ${item.lot_number || 'N/A'}`, margin, y);

  y += 7;

  // ─── STAT-CARDS GRID (3 columns × 2 rows) ─────────────────
  const cols = 3;
  const gapH = 3.5;   // horizontal gap between cards
  const gapV = 3.5;   // vertical gap between rows
  const cardW = (contentWidth - gapH * (cols - 1)) / cols;
  const cardH = 22;    // card height (enough for label + value + optional bar)
  const cardPad = 3;

  // Helper: draw one card background (rounded rect + border)
  function drawCard(cx: number, cy: number) {
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...CARD_BRD);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'FD');
  }

  // Helper: draw card label (small muted text)
  function drawLabel(cx: number, cy: number, label: string) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, cx + cardPad, cy + cardPad + 3.5);
  }

  // Helper: draw card value (bold dark text)
  function drawValue(cx: number, cy: number, value: string) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(value, cx + cardPad, cy + cardPad + 10);
  }

  // Row 1 cards
  const cards1: { label: string; value: string }[] = [
    { label: 'Purchase Date',  value: format(new Date(item.purchase_date), 'dd MMM yyyy') },
    { label: 'Cold Storage',   value: item.cold_storages?.cold_storage_name || 'Not assigned' },
    { label: 'Brand',          value: item.brand || 'N/A' },
  ];

  cards1.forEach((card, i) => {
    const cx = margin + i * (cardW + gapH);
    drawCard(cx, y);
    drawLabel(cx, y, card.label);
    drawValue(cx, y, card.value);
  });

  y += cardH + gapV;

  // Row 2 cards — Quantity card gets a progress bar
  const balancePercent = (Number(item.current_balance_qty) / Number(item.quantity_total)) * 100;

  // Card 0: Quantity (with progress bar)
  const qx = margin;
  drawCard(qx, y);
  drawLabel(qx, y, 'Quantity');
  drawValue(qx, y, `${item.current_balance_qty} / ${item.quantity_total} units`);
  // Progress bar track
  const barY = y + cardPad + 13.5;
  const barH = 1.8;
  const barX = qx + cardPad;
  const barW = cardW - cardPad * 2;
  doc.setFillColor(...BAR_BG);
  doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, 'F');
  // Progress bar fill
  doc.setFillColor(...PRIMARY);
  const fillW = (barW * balancePercent) / 100;
  if (fillW > 0.8) {
    doc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, 'F');
  }

  // Card 1: Weight
  const wx = margin + cardW + gapH;
  drawCard(wx, y);
  drawLabel(wx, y, 'Weight');
  drawValue(wx, y, `${item.weight_total} kg total`);

  // Card 2: Rates
  const rx = margin + (cardW + gapH) * 2;
  drawCard(rx, y);
  drawLabel(rx, y, 'Rates');
  // separate purchase rate and cold rate with a new line
  drawValue(rx, y, `Purchase: ${item.purchase_rate}/-`);
  y += 5;
  drawValue(rx, y, `Cold Rate: ${item.cold_rate}/day`);
  // drawValue(rx, y, `Purchase: ₹${item.purchase_rate}  •  Cold: ₹${item.cold_rate}/day`);

  y += cardH + 8;

  // ─── OUTGOING TIMELINE ──────────────────────────────────────
  // Section header inside a stat-card style container
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Outgoing Timeline', margin, y);
  y += 5;

  if (outgoing.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text('No outgoing records yet.', margin, y);
    y += 8;
  } else {
    const outgoingData = outgoing.map((o) => [
      format(new Date(o.outgoing_date), 'dd MMM yyyy'),
      o.quantity_out.toString(),
      `${o.weight_out} kg`,
      o.remarks || '',
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [['Date', 'Qty Out', 'Weight Out', 'Remarks']],
      body: outgoingData,
      theme: 'plain',
      headStyles: {
        fillColor: PRIMARY,
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        fontSize: 8,
        cellPadding: 2.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: { fillColor: CARD_BG },
      columnStyles: {
        0: { cellWidth: 38, halign: 'center' },
        1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: contentWidth - 92, halign: 'left' },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  y += 4;

  // ─── COLD STORAGE BILLING CYCLES ────────────────────────────
  // Check page space — if less than 50mm left, start new page
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 16;
  }

  // Section header with receipt icon text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Cold Storage Billing Cycles', margin, y);

  // "Completed" badge next to header if item is completed
  if (item.status === 'Completed') {
    const hdrWidth = doc.getTextWidth('Cold Storage Billing Cycles');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const cbText = 'Completed';
    const cbTxtW = doc.getTextWidth(cbText);
    const cbX = margin + hdrWidth + 4;
    const cbY = y - 3.5;
    doc.setFillColor(...BADGE_SEC);
    doc.roundedRect(cbX, cbY, cbTxtW + 5, 5, 2, 2, 'F');
    doc.setTextColor(...BADGE_TXT_SEC);
    doc.text(cbText, cbX + 2.5, cbY + 3.5);
  }

  y += 5;

  if (billingCycles.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text('No billing cycles generated yet.', margin, y);
    y += 8;
  } else {
    // Determine "current" cycle (today falls within startDate–endDate)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cyclesData = billingCycles.map((cycle) => {
      const isCurrent =
        today >= cycle.startDate && today <= cycle.endDate;
      let statusText = cycle.isFinal ? 'Final' : isCurrent ? 'Current' : 'Completed';
      return [
        cycle.cycleNumber.toString(),
        format(cycle.startDate, 'dd MMM yyyy'),
        format(cycle.endDate, 'dd MMM yyyy'),
        cycle.openingQuantity.toString(),
        `${cycle.rate.toLocaleString()}/-`,
        `${cycle.storageCharge.toLocaleString()}/-`,
        statusText,
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [['Cycle', 'Start Date', 'End Date', 'Opening Qty', 'Rate', 'Charge', 'Status']],
      body: cyclesData,
      theme: 'plain',
      headStyles: {
        fillColor: PRIMARY,
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        fontSize: 7.5,
        cellPadding: 2,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: { fillColor: CARD_BG },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 26, halign: 'center' },
        5: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: contentWidth - 154, halign: 'center' },
      },
      // Highlight current cycle row with light blue background (set before cell is drawn)
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const cycle = billingCycles[data.row.index];
          if (cycle) {
            const isCurrent = today >= cycle.startDate && today <= cycle.endDate;
            if (isCurrent) {
              data.cell.styles.fillColor = [255, 232, 190];
            }
          }
        }
      },
      // Footer row: Total Cost
      foot: [['', '', '', '', '', '', '']],
      footStyles: {
        textColor: [255, 179, 45],
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 2.5,
        halign: 'center',
      },
      // Make "Total Cold Storage Cost" label appear below end date and span multiple columns
      didDrawCell: (data: any) => {
        if (data.section === 'foot' && data.column.index === 2) {
          const text = 'Total Cold Storage Cost:';
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          const textW = doc.getTextWidth(text);
          const x = data.cell.x - (data.cell.width - textW) / 2;
          const y = data.cell.y + data.cell.height / 2 + 2.5;
          doc.text(text, x, y);
        }
        if (data.section === 'foot' && data.column.index === 5) {
          // Center the total cost value in its cell
          const text = `${totalStorageCost.toLocaleString()}/-`;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 170, 19);
          const textW = doc.getTextWidth(text);
          const x = data.cell.x + (data.cell.width - textW) / 2;
          const y = data.cell.y + data.cell.height / 2 + 2.5;
          doc.text(text, x, y);
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  y += 5;

  // ─── BILLING LOGIC NOTE (matches the info box on the page) ─
  if (y > pageHeight - 30) {
    doc.addPage();
    y = 16;
  }

  const noteBoxX = margin;
  const noteBoxW = contentWidth;
  // Estimate note box height
  const noteLines = [
    'Billing Logic:',
    '• Fixed 30-day cycles starting from incoming date',
    '• Charge = Opening Quantity × Rate per cycle',
    '• Outgoing affects next cycle only (no mid-cycle adjustments)',
    '• Final cycle fully charged even if cleared mid-cycle',
  ];
  const noteLineH = 3.2;
  const notePad = 3;
  const noteBoxH = noteLines.length * noteLineH + notePad * 2;

  // Note box background
  doc.setFillColor(243, 244, 246); // muted/50 equivalent
  doc.setDrawColor(...CARD_BRD);
  doc.setLineWidth(0.2);
  doc.roundedRect(noteBoxX, y, noteBoxW, noteBoxH, 2, 2, 'FD');

  // Note text
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  noteLines.forEach((line, i) => {
    if (i === 0) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(line, noteBoxX + notePad + 1, y + notePad + 3 + i * noteLineH);
  });

  // ─── OUTPUT ─────────────────────────────────────────────────
  const dataUrl = doc.output('dataurl');
  window.electronAPI.printPDF(dataUrl);
}
