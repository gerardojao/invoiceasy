// // lib/pdf.ts
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { type LineItem, calcTotals, fmtEUR } from "./invoice";

// type RGB = [number, number, number];

// export function buildInvoicePDF(opts: {
//   numero: string;
//   fecha: string; // ya formateada es-ES
//   emisor: { nombre: string; nif?: string; dir?: string; telef?: string; seguridadsocial?: string; email?: string };
//   cliente: { nombre: string; nif?: string; dir?: string; telef?: string };
//   items: LineItem[];
//   ivaPct: number;
//   irpfPct: number;
//   iban?: string;
// }) {
//   const { numero, fecha, emisor, cliente, items, ivaPct, irpfPct, iban } = opts;
//   const totals = calcTotals(items, ivaPct, irpfPct);

//   const doc = new jsPDF({ unit: "pt", format: "a4" });
//   const pageW = doc.internal.pageSize.getWidth();
//   const mx = 40;

//   // ===================== Encabezado =====================
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(18);
//   doc.text(`Factura ${numero}`, mx, 48);

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(11);
//   doc.text(`Fecha: ${fecha}`, pageW - mx, 48, { align: "right" });

//   // Línea horizontal separadora bajo el encabezado
//   doc.setDrawColor(222, 226, 233);
//   doc.setLineWidth(1);
//   doc.line(mx, 60, pageW - mx, 60);

//   // ===================== Cuadro Emisor / Cliente =====================
//   const boxY = 76;
//   const boxX = mx;
//   const boxW = pageW - 2 * mx;
//   const colPad = 14;
// const MAX_COL_TEXT_W = 220;
//   // Preparamos líneas a mostrar en cada columna
//   const emisorLines = [
//     { bold: true, text: `Emisor` },
//    { text: `Nombre: ${emisor.nombre}` || "-" },
//     emisor.nif ? { text: `NIF/CIF: ${emisor.nif}` } : null,
//     emisor.dir ? { text: `Dirección: ${emisor.dir}` } : null,
//     emisor.telef ? { text: `Teléfono: ${emisor.telef}` } : null,
//     emisor.seguridadsocial ? { text: `Seg. Social: ${emisor.seguridadsocial}` } : null,
//     emisor.email ? { text: `Email: ${emisor.email}` } : null
//   ].filter(Boolean) as { bold?: boolean; text: string }[];

//   const clienteLines = [
//     { bold: true, text: `Cliente` },
//     { text: `Nombre: ${cliente.nombre}` || "-" },
//     { text: `NIF/CIF: ${cliente.nif}` },
//     cliente.dir ? { text: `Dirección: ${cliente.dir}` } : null,
//     cliente.telef ? { text: `Teléfono: ${cliente.telef}` } : null,
//   ].filter(Boolean) as { bold?: boolean; text: string }[];

//   // Altura dinámica del cuadro
//   const lineH = 16; // alto por línea
//   const innerPadY = 14; // padding vertical interno
//   const maxLines = Math.max(emisorLines.length, clienteLines.length);
//   const boxH = innerPadY * 2 + maxLines * lineH;

//   // Caja con esquinas redondeadas
//   doc.setDrawColor(208, 213, 221); // borde suave
//   doc.setFillColor(247, 250, 252); // fondo muy claro
//   doc.roundedRect(boxX, boxY, boxW, boxH, 8, 8, "FD");

//   // Línea divisoria vertical (centro)
//   const midX = boxX + boxW / 2;
//   doc.setDrawColor(228, 231, 236);
//   doc.setLineWidth(0.8);
//   doc.line(midX, boxY, midX, boxY + boxH);

//   // Render texto columnas
//   doc.setFontSize(10);
//   const col1X = boxX + colPad;
//   const col2X = midX + colPad;
//   let y1 = boxY + innerPadY + 4;
//   let y2 = boxY + innerPadY + 4;

//   const drawLines = (x: number, yStart: number, lines: { bold?: boolean; text: string }[]) => {
//     let y = yStart;
//     for (const l of lines) {
//       doc.setFont("helvetica", l.bold ? "bold" : "normal");
//       const splitText = doc.splitTextToSize(l.text, MAX_COL_TEXT_W);
      
//       // Dibuja las líneas divididas
//       // El último parámetro es el line height para cada línea dibujada
//      doc.text(splitText, x, y, { lineHeightFactor: 1.2 }); 

//       // 💡 Aseguramos que la coordenada 'y' avance por CADA línea generada
//     y += splitText.length * lineH;
//     }
//     return y;
//   };

//   y1 = drawLines(col1X, y1, emisorLines);
//   y2 = drawLines(col2X, y2, clienteLines);

//   // ===================== Tabla de conceptos =====================
//   const startY = boxY + boxH + 20;

//   autoTable(doc, {
//     startY,
//     head: [["Descripción", "Cantidad", "Precio", "Importe"]],
//     body: items.map((it) => [
//       it.descripcion || "-",
//       String(it.cantidad ?? 0),
//       fmtEUR(it.precio ?? 0),
//       fmtEUR((it.cantidad || 0) * (it.precio || 0)),
//     ]),
//     styles: { fontSize: 10, cellPadding: 6, lineColor: [230, 232, 236] },
//     headStyles: { fillColor: [16, 185, 129], textColor: 255, halign: "left" }, // emerald-ish
//     columnStyles: {
//       1: { halign: "right" },
//       2: { halign: "right" },
//       3: { halign: "right" },
//     },
//     margin: { left: mx, right: mx },
//   });

//   // ===================== Totales con guías =====================
//   let y = (doc as any).lastAutoTable?.finalY ?? startY;
//   y += 22;

//   const drawGuide = (x1: number, y1: number, x2: number) => {
//     doc.setDrawColor(220, 223, 228);
//     const anyDoc = doc as any;
//     if (typeof anyDoc.setLineDash === "function") {
//       anyDoc.setLineDash([2, 2], 0);
//       doc.line(x1, y1, x2, y1);
//       anyDoc.setLineDash();
//     } else {
//       doc.setLineWidth(0.6);
//       doc.line(x1, y1, x2, y1);
//       doc.setLineWidth(0.2);
//     }
//   };

//   const drawAmountLine = (
//     label: string,
//     val: string,
//     opts: { bold?: boolean; color?: RGB } = {}
//   ) => {
//     const xLabel = 320;
//     const xVal = pageW - mx;

//     // guía entre label y valor
//     drawGuide(xLabel, y + 4, xVal - 60);

//     if (opts.color) doc.setTextColor(...opts.color);
//     doc.setFont("helvetica", opts.bold ? "bold" : "normal");
//     doc.setFontSize(10);

//     doc.text(label, xLabel, y);
//     doc.text(val, xVal, y, { align: "right" });

//     doc.setTextColor(0, 0, 0);
//     y += 18;
//   };

//   drawAmountLine("Base imponible", fmtEUR(totals.baseImponible));
//   drawAmountLine(`IVA (${ivaPct}%)`, fmtEUR(totals.iva));
//   drawAmountLine(`IRPF (${irpfPct}%)`, ` ${fmtEUR(totals.irpf)}`, { color: [220, 38, 38] });

//   doc.setFont("helvetica", "bold");
//   drawAmountLine("TOTAL", fmtEUR(totals.total), { bold: true });
//   doc.setFont("helvetica", "normal");

//   // ===================== Bloque IBAN (opcional) =====================
//   if (iban) {
//     y += 16;

//     const payBoxW = pageW - 2 * mx;
//     const payBoxH = 60;
//     const payBoxY = y;

//     doc.setDrawColor(208, 213, 221);
//     doc.setFillColor(249, 250, 251);
//     doc.roundedRect(mx, payBoxY, payBoxW, payBoxH, 8, 8, "FD");

//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("Datos de pago", mx + 14, payBoxY + 22);

//     doc.setFont("courier", "normal");
//     doc.setFontSize(12);
//     doc.text(`IBAN: ${iban}`, mx + 14, payBoxY + 42);

//     y = payBoxY + payBoxH;
//   }

//   return doc;
// }
// lib/pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type LineItem, calcTotals, fmtEUR } from "./invoice";

type RGB = [number, number, number];

export function buildInvoicePDF(opts: {
  numero: string;
  fecha: string; // ya formateada es-ES
  emisor: { nombre: string; nif?: string; dir?: string; telef?: string; seguridadsocial?: string; email?: string };
  cliente: { nombre: string; nif?: string; dir?: string; telef?: string };
  items: LineItem[];
  ivaPct: number;
  irpfPct: number;
  iban?: string;
}) {
  const { numero, fecha, emisor, cliente, items, ivaPct, irpfPct, iban } = opts;
  const totals = calcTotals(items, ivaPct, irpfPct);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const mx = 40;

  // ===================== Encabezado =====================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`Factura ${numero}`, mx, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Fecha: ${fecha}`, pageW - mx, 48, { align: "right" });

  // Línea horizontal separadora bajo el encabezado
  doc.setDrawColor(222, 226, 233);
  doc.setLineWidth(1);
  doc.line(mx, 60, pageW - mx, 60);

  // ===================== Cuadro Emisor / Cliente =====================
  const boxY = 76;
  const boxX = mx;
  const boxW = pageW - 2 * mx;
  const colPad = 14;
  const lineH = 16; // alto por línea
  const innerPadY = 14; // padding vertical interno
  // Ancho máximo del texto en la columna (ajustado para el padding)
  const MAX_COL_TEXT_W = 220; 

  // Preparamos líneas a mostrar en cada columna
  const emisorLines = [
    { bold: true, text: `Emisor` },
    { text: `Nombre: ${emisor.nombre}` || "-" },
    emisor.nif ? { text: `NIF/CIF: ${emisor.nif}` } : null,
    emisor.dir ? { text: `Dirección: ${emisor.dir}` } : null,
    emisor.telef ? { text: `Teléfono: ${emisor.telef}` } : null,
    emisor.seguridadsocial ? { text: `Seg. Social: ${emisor.seguridadsocial}` } : null,
    emisor.email ? { text: `Email: ${emisor.email}` } : null
  ].filter(Boolean) as { bold?: boolean; text: string }[];

  const clienteLines = [
    { bold: true, text: `Cliente` },
    { text: `Nombre: ${cliente.nombre}` || "-" },
    { text: `NIF/CIF: ${cliente.nif}` },
    cliente.dir ? { text: `Dirección: ${cliente.dir}` } : null,
    cliente.telef ? { text: `Teléfono: ${cliente.telef}` } : null,
  ].filter(Boolean) as { bold?: boolean; text: string }[];

  // 🚨 INICIO DE LAS CORRECCIONES PARA EL AJUSTE DE ALTURA
  
  /**
   * Calcula el número total de líneas de texto (incluyendo el word wrap)
   * para una columna dada.
   */
  const calculateTotalHeight = (lines: { bold?: boolean; text: string }[]) => {
    let lineCount = 0;
    // Debemos simular el splitTextToSize para obtener el número de líneas reales
    for (const l of lines) {
        // splitTextToSize devuelve un array de strings (cada elemento es una línea)
        const splitText = doc.splitTextToSize(l.text, MAX_COL_TEXT_W);
        lineCount += splitText.length; 
    }
    return lineCount;
  };

  const emisorLinesCount = calculateTotalHeight(emisorLines);
  const clienteLinesCount = calculateTotalHeight(clienteLines);
  
  // Altura dinámica del cuadro: usa el máximo de las líneas reales
  const maxActualLines = Math.max(emisorLinesCount, clienteLinesCount);
  const boxH = innerPadY * 2 + maxActualLines * lineH; // Altura basada en el contenido real

  // 🚨 FIN DE LAS CORRECCIONES PARA EL AJUSTE DE ALTURA

  // Caja con esquinas redondeadas
  doc.setDrawColor(208, 213, 221); // borde suave
  doc.setFillColor(247, 250, 252); // fondo muy claro
  doc.roundedRect(boxX, boxY, boxW, boxH, 8, 8, "FD");

  // Línea divisoria vertical (centro)
  const midX = boxX + boxW / 2;
  doc.setDrawColor(228, 231, 236);
  doc.setLineWidth(0.8);
  doc.line(midX, boxY, midX, boxY + boxH);

  // Render texto columnas
  doc.setFontSize(10);
  const col1X = boxX + colPad;
  const col2X = midX + colPad;
  // yStart debe alinearse al centro del padding superior
  let y1 = boxY + innerPadY + 4; 
  let y2 = boxY + innerPadY + 4;

  const drawLines = (x: number, yStart: number, lines: { bold?: boolean; text: string }[]) => {
    let y = yStart;
    for (const l of lines) {
      doc.setFont("helvetica", l.bold ? "bold" : "normal");
      
      // 🚨 CORRECCIÓN EN DRAWLINES: Divide el texto antes de dibujarlo
      const splitText = doc.splitTextToSize(l.text, MAX_COL_TEXT_W);
      
      // Dibuja las líneas divididas. lineHeightFactor es opcional, pero ayuda.
      doc.text(splitText, x, y, { lineHeightFactor: 1.2 }); 

      // 💡 Aseguramos que la coordenada 'y' avance por CADA línea generada
      y += splitText.length * lineH;
    }
    return y;
  };

  y1 = drawLines(col1X, y1, emisorLines);
  y2 = drawLines(col2X, y2, clienteLines);

  // ===================== Tabla de conceptos =====================
  // startY usa el boxH corregido
  const startY = boxY + boxH + 20;

  autoTable(doc, {
    startY,
    head: [["Descripción", "Cantidad", "Precio", "Importe"]],
    body: items.map((it) => [
      it.descripcion || "-",
      String(it.cantidad ?? 0),
      fmtEUR(it.precio ?? 0),
      fmtEUR((it.cantidad || 0) * (it.precio || 0)),
    ]),
    styles: { fontSize: 10, cellPadding: 6, lineColor: [230, 232, 236] },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, halign: "left" }, // emerald-ish
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: mx, right: mx },
  });

  // ===================== Totales con guías =====================
  let y = (doc as any).lastAutoTable?.finalY ?? startY;
  y += 22;

  const drawGuide = (x1: number, y1: number, x2: number) => {
    doc.setDrawColor(220, 223, 228);
    const anyDoc = doc as any;
    if (typeof anyDoc.setLineDash === "function") {
      anyDoc.setLineDash([2, 2], 0);
      doc.line(x1, y1, x2, y1);
      anyDoc.setLineDash();
    } else {
      doc.setLineWidth(0.6);
      doc.line(x1, y1, x2, y1);
      doc.setLineWidth(0.2);
    }
  };

  const drawAmountLine = (
    label: string,
    val: string,
    opts: { bold?: boolean; color?: RGB } = {}
  ) => {
    const xLabel = 320;
    const xVal = pageW - mx;

    // guía entre label y valor
    drawGuide(xLabel, y + 4, xVal - 60);

    if (opts.color) doc.setTextColor(...opts.color);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(10);

    doc.text(label, xLabel, y);
    doc.text(val, xVal, y, { align: "right" });

    doc.setTextColor(0, 0, 0);
    y += 18;
  };

  drawAmountLine("Base imponible", fmtEUR(totals.baseImponible));
  drawAmountLine(`IVA (${ivaPct}%)`, fmtEUR(totals.iva));
  drawAmountLine(`IRPF (${irpfPct}%)`, ` ${fmtEUR(totals.irpf)}`, { color: [220, 38, 38] });

  doc.setFont("helvetica", "bold");
  drawAmountLine("TOTAL", fmtEUR(totals.total), { bold: true });
  doc.setFont("helvetica", "normal");

  // ===================== Bloque IBAN (opcional) =====================
  if (iban) {
    y += 16;

    const payBoxW = pageW - 2 * mx;
    const payBoxH = 60;
    const payBoxY = y;

    doc.setDrawColor(208, 213, 221);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(mx, payBoxY, payBoxW, payBoxH, 8, 8, "FD");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Datos de pago", mx + 14, payBoxY + 22);

    doc.setFont("courier", "normal");
    doc.setFontSize(12);
    doc.text(`IBAN: ${iban}`, mx + 14, payBoxY + 42);

    y = payBoxY + payBoxH;
  }

  return doc;
}