import type jsPDF from "jspdf";

// utils/savePdf.ts
export async function savePdf(doc: jsPDF, suggested = "Factura.pdf") {
  const blob = doc.output("blob");

  // Si el navegador soporta el “Guardar como…” nativo:
  if ("showSaveFilePicker" in window) {
    try {
      // @ts-ignore - tipos no en TS estándar
      const handle = await window.showSaveFilePicker({
        suggestedName: suggested,
        types: [
          {
            description: "PDF",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      // cancelado o error → cae al prompt
    }
  }

  // Fallback universal
  const name = (window.prompt("Nombre del archivo:", suggested) || "").trim();
  const filename = name
    ? name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`
    : suggested;
    if(!name) return; // si se cancela el prompt no hacer nada
    doc.save(filename);
}
