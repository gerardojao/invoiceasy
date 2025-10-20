// src/App.tsx
import { useMemo, useState } from "react";
import { type LineItem, calcTotals, fmtEUR } from "./lib/invoice";
import { savePdf } from "./lib/savePdf";
import { buildInvoicePDF } from "./lib/pdf";
import { formatIBAN, isValidSpanishIBAN, normalizeIBAN, sanitizeSpanishIBANInput, SPANISH_IBAN_LENGTH } from "./lib/normalizeIBAN.ts";
import logoImagen from "./assets/invoiceeasy-logo.png";



/** ─────────────────────────────────────────────────────────────
 *   Estado inicial
 *  ───────────────────────────────────────────────────────────── */
const initialItems: LineItem[] = [
  { descripcion: "Servicio profesional", cantidad: 1, precio: 0 },
];

/** Modal mínimo */
function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
          <div className="px-5 pt-5">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="mt-2 text-sm text-slate-700">{children}</div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [emisor, setEmisor] = useState({ nombre: "", nif: "", dir: "", telef: "", seguridadsocial: "", email: "" });
  const [cliente, setCliente] = useState({ nombre: "", nif: "", dir: "", telef: "" });
  const [numero, setNumero] = useState("F-2025-0001");
  const [fecha, setFecha] = useState<string>(() =>
    new Date().toISOString().slice(0, 10) // yyyy-mm-dd para <input type="date">
  );

  const [items, setItems] = useState<LineItem[]>(initialItems);

  // Impuestos
  const [ivaPct, setIvaPct] = useState<number>(21); // general 21%
  const [irpfPct, setIrpfPct] = useState<number>(0); // 0 / 1 / 7 / 15

  // Pago (IBAN)
  const [iban, setIban] = useState<string>("");

  // Modal de error IBAN
  const [ibanModalOpen, setIbanModalOpen] = useState(false);
  const [ibanModalMsg, setIbanModalMsg] = useState<string>("");

  const totals = useMemo(() => calcTotals(items, ivaPct, irpfPct), [items, ivaPct, irpfPct]);

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { descripcion: "", cantidad: 1, precio: 0 }]);
  };

  const rmItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  /** Validación centralizada de IBAN (si hay IBAN escrito) */
  const ensureValidIBANOrExplain = (): boolean => {
    const clean = normalizeIBAN(iban);
    if (!clean) return true; // si está vacío, no bloqueamos
    if (clean.length !== SPANISH_IBAN_LENGTH) {
      setIbanModalMsg(
        `El IBAN debe tener ${SPANISH_IBAN_LENGTH} caracteres (ES + 22 dígitos). Actualmente tiene ${clean.length}.`
      );
      setIbanModalOpen(true);
      return false;
    }
    if (!isValidSpanishIBAN(clean)) {
      setIbanModalMsg("El IBAN no es válido. Revisa los dígitos de control.");
      setIbanModalOpen(true);
      return false;
    }
    return true;
  };

  /** PDF */
  const handlePDF = () => {
    if (!ensureValidIBANOrExplain()) return;

    const doc = buildInvoicePDF({
      numero,
      fecha: new Date(fecha).toLocaleDateString("es-ES"),
      emisor,
      cliente,
      items,
      ivaPct,
      irpfPct,
      iban: formatIBAN(iban) || undefined, 
      
    });
    savePdf(doc, `Factura-${numero}.pdf`);
  };

  /** Compartir (móvil) */
  const handleShare = async () => {
    if (!ensureValidIBANOrExplain()) return;

    const doc = buildInvoicePDF({
      numero,
      fecha: new Date(fecha).toLocaleDateString("es-ES"),
      emisor,
      cliente,
      items,
      ivaPct,
      irpfPct,
      iban: formatIBAN(iban) || undefined,
      
    });
    const blob = doc.output("blob");
    const file = new File([blob], `${numero}.pdf`, { type: "application/pdf" });

    // Web Share API nivel 2
    if ((navigator as any).canShare?.({ files: [file] })) {
      try {
        await (navigator as any).share({
          title: numero,
          text: `Factura ${numero}`,
          files: [file],
        });
      } catch {
        // si cancela, no hacemos nada
      }
    } else {
      // Fallback: descarga
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          
            {/* Reemplazado por una etiqueta img */}
           <div className="flex flex-col items-start"> 
      {/* Logo (ahora centrado o alineado con el texto inferior si no ocupa todo el espacio) */}
      <img 
        // ⚠️ Nota: He cambiado 'logoImagen' a 'logoImage' para seguir el estándar de las respuestas anteriores.
        // Asegúrate de usar la variable correcta que definiste en tu archivo (logoImage o logoImagen).
        src={logoImagen} 
        alt="Tu Factura al Instante - Logo de InvoiceEasy" 
        className="h-24" // Altura grande (h-12) y un pequeño margen inferior (mb-1)
      />
      
      {/* Slogan */}
      <h1 className="text-xl font-semibold leading-none">
        Tu <span className="text-emerald-600">Factura</span> al Instante
      </h1>
    </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="rounded-xl bg-sky-600 text-white px-4 py-2 hover:bg-sky-700"
            >
              Compartir / Descargar
            </button>
            <button
              onClick={handlePDF}
              className="rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
            >
              Guardar PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid gap-6">
        {/* ── Datos generales ───────────────────────────── */}
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Factura</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Número</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ── Emisor / Cliente ───────────────────────────── */}
        <section className="bg-white border rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emisor */}
            <div>
              <h3 className="text-sm font-medium mb-2">Datos del Emisor</h3>
              <div className="grid gap-2">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Nombre / Empresa"
                  required
                  value={emisor.nombre}
                  onChange={(e) => setEmisor({ ...emisor, nombre: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="NIF / CIF (requerido)"
                  required
                  value={emisor.nif.toLocaleUpperCase()}
                  onChange={(e) => setEmisor({ ...emisor, nif: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Seguridad Social"
                  required
                  value={emisor.seguridadsocial}
                  onChange={(e) => setEmisor({ ...emisor, seguridadsocial: e.target.value })}
                />
                  <input
                  className="border rounded px-3 py-2"
                  placeholder="Dirección (opcional)"
                  value={emisor.dir}
                  onChange={(e) => setEmisor({ ...emisor, dir: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Teléfono (opcional)"
                  value={emisor.telef}
                  onChange={(e) => setEmisor({ ...emisor, telef: e.target.value })}
                />
                 <input
                  className="border rounded px-3 py-2"
                  placeholder="Email (opcional)"
                  value={emisor.email}
                  onChange={(e) => setEmisor({ ...emisor, email: e.target.value })}
                />
              </div>
            </div>
            {/* Cliente */}
            <div>
              <h3 className="text-sm font-medium mb-2">Datos del Cliente</h3>
              <div className="grid gap-2">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Nombre / Empresa"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="NIF / CIF (requerido)"
                  required
                  value={cliente.nif.toLocaleUpperCase()}
                  onChange={(e) => setCliente({ ...cliente, nif: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Dirección (opcional)"
                  value={cliente.dir}
                  onChange={(e) => setCliente({ ...cliente, dir: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Teléfono (opcional)"
                  value={cliente.telef}
                  onChange={(e) => setCliente({ ...cliente, telef: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Conceptos ──────────────────────────────────── */}
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Conceptos</h2>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <label className="block text-xs text-slate-500 mb-1">Descripción</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={it.descripcion}
                    onChange={(e) => updateItem(i, { descripcion: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2 text-right"
                    value={it.cantidad}
                    onChange={(e) => updateItem(i, { cantidad: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Precio (sin IVA)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2 text-right"
                    value={it.precio.toFixed(2)}
                    onChange={(e) => updateItem(i, { precio: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button onClick={() => rmItem(i)} className="text-rose-600 text-sm">✕</button>
                </div>
              </div>
            ))}
            <button
              onClick={addItem}
              className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
            >
              + Añadir línea
            </button>
          </div>
        </section>

        {/* ── Impuestos ──────────────────────────────────── */}
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Impuestos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">IVA</label>
              <select
                value={ivaPct}
                onChange={(e) => setIvaPct(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={0}>0% (exento)</option>
                <option value={21}>21% (general)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Se aplica sobre la Base Imponible.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium">Retención IRPF</label>
              <select
                value={irpfPct}
                onChange={(e) => setIrpfPct(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={0}>0% (sin retención)</option>
                <option value={1}>1% (retención a usar)</option>
                <option value={7}>7% (inicio actividad)</option>
                <option value={15}>15% (general)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Se descuenta de la Base Imponible (no lleva IVA).
              </p>
            </div>
          </div>
        </section>

        {/* ── Pago (IBAN) ────────────────────────────────── */}
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Pago</h2>
          <div className="grid max-w-md gap-2">
            <label className="block text-xs text-slate-500">IBAN (España)</label>
            <input
              className={`border rounded px-3 py-2 ${
                (() => {
                  const clean = normalizeIBAN(iban);
                  if (!clean) return "border-slate-300";
                  if (clean.length < SPANISH_IBAN_LENGTH) return "border-amber-400";
                  return isValidSpanishIBAN(clean) ? "border-emerald-400" : "border-rose-400";
                })()
              }`}
              placeholder="ES00 0000 0000 00 0000000000"
              value={formatIBAN(iban)}
              onChange={(e) => setIban(sanitizeSpanishIBANInput(e.target.value))}
              autoComplete="off"
              inputMode="text"
            />
            <p className="text-xs text-slate-500">
              Se mostrará en el PDF en la sección “Datos de pago”.
            </p>
          </div>
        </section>

        {/* ── Totales ────────────────────────────────────── */}
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Totales</h2>
          <div className="grid gap-2 max-w-md ml-auto">
            <Row label="Base imponible" value={fmtEUR(totals.baseImponible)} />
            <Row label={`IVA (${ivaPct}%)`} value={fmtEUR(totals.iva)} />
            <Row label={`IRPF (${irpfPct}%)`} value={`${fmtEUR(totals.irpf)}`} red />
            <hr className="my-2" />
            <Row label="TOTAL" value={fmtEUR(totals.total)} big />
          </div>
        </section>
      </main>

      <Modal
        open={ibanModalOpen}
        title="IBAN inválido"
        onClose={() => setIbanModalOpen(false)}
      >
        <p>{ibanModalMsg}</p>
      </Modal>
    </div>
  );
}

function Row({
  label,
  value,
  red = false,
  big = false,
}: {
  label: string;
  value: string;
  red?: boolean;
  big?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${big ? "text-lg" : ""}`}>
      <span>{label}</span>
      <strong className={red ? "text-rose-600" : ""}>{value}</strong>
    </div>
  );
}
