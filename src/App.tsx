// src/App.tsx
import { useMemo, useState, useEffect } from "react";
import { type LineItem, calcTotals, fmtEUR } from "./lib/invoice";
import { savePdf } from "./lib/savePdf";
import { buildInvoicePDF } from "./lib/pdf";
import {
  formatIBAN,
  isValidSpanishIBAN,
  normalizeIBAN,
  sanitizeSpanishIBANInput,
  SPANISH_IBAN_LENGTH,
} from "./lib/normalizeIBAN";
import MobileTabs from "./Components/MobileTabs";
import StickyActions from "./Components/StickyActions";
import { getCurrentUser, goLogin, doLogout, goRegister } from "./auth";
import { LogIn, UserPlus } from "lucide-react";


// ───────────────── Estado inicial
const initialItems: LineItem[] = [
  { descripcion: "Servicio profesional", cantidad: 1, precio: 0 },
];

/** Modal mínimo reutilizable */
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
 
  const [user, setUser] = useState<any | null | undefined>(undefined); // undef=cargando, null=sin sesión

  
useEffect(() => {
  let cancelled = false;
  const load = async () => {
    const u1 = await getCurrentUser();
    if (!cancelled && u1) return setUser(u1);
    setTimeout(async () => {
      if (cancelled) return;
      const u2 = await getCurrentUser();
      setUser(u2 ?? null);
    }, 400);
  };
  load();
  return () => { cancelled = true; };
}, []);

  // useEffect(() => {
  //   getCurrentUser().then(setUser).catch(() => setUser(null));
  // }, []);



  const [emisor, setEmisor] = useState({ nombre: "", nif: "", dir: "", telef: "" });
  const [cliente, setCliente] = useState({ nombre: "", nif: "", dir: "", telef: "" });
  const [numero, setNumero] = useState("F-2025-0001");
  const [fecha, setFecha] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [items, setItems] = useState<LineItem[]>(initialItems);

  // Impuestos
  const [ivaPct, setIvaPct] = useState<number>(21);
  const [irpfPct, setIrpfPct] = useState<number>(0);

  // Pago
  const [iban, setIban] = useState<string>("");

  // Tabs móvil
  const [activeTab, setActiveTab] =
    useState<"factura" | "datos" | "conceptos" | "impuestos">("factura");
  const tabs = [
    { key: "factura", label: "Factura" },
    { key: "datos", label: "Datos" },
    { key: "conceptos", label: "Conceptos" },
    { key: "impuestos", label: "Impuestos" },
  ] as const;

  const showActions = activeTab === "impuestos";

const nextTab = () => {
  const i = tabs.findIndex((t) => t.key === activeTab);
  if (i >= 0 && i < tabs.length - 1) {
    setActiveTab(tabs[i + 1].key);
  } else {
    // En la última pestaña puedes, por ejemplo, hacer scroll a Totales o abrir acciones
    document.getElementById("totales")?.scrollIntoView({ behavior: "smooth" });
  }
};

const isFacturaOk = () => numero.trim().length > 0 && fecha.trim().length > 0;

const isDatosOk = () =>
  emisor.nombre.trim().length > 0 &&
  emisor.nif.trim().length > 0 &&
  cliente.nombre.trim().length > 0 &&
  cliente.nif.trim().length > 0;

const isConceptosOk = () =>
  items.length > 0 &&
  items.every(
    (it) =>
      (it.descripcion || "").trim().length > 0 &&
      typeof it.cantidad === "number" &&
      it.cantidad > 0 &&
      typeof it.precio === "number" &&
      it.precio > 0
  );

  const canNext =
  activeTab === "factura"
    ? isFacturaOk()
    : activeTab === "datos"
    ? Boolean(isDatosOk())
    : activeTab === "conceptos"
    ? Boolean(isConceptosOk())
    : true; // en "impuestos" siempre true (o pon tu regla)




  // ── Modales
  const [ibanModalOpen, setIbanModalOpen] = useState(false);
  const [ibanModalMsg, setIbanModalMsg] = useState<string>("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertErrors, setAlertErrors] = useState<string[]>([]);

  const totals = useMemo(
    () => calcTotals(items, ivaPct, irpfPct),
    [items, ivaPct, irpfPct]
  );

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const addItem = () =>
    setItems((prev) => [...prev, { descripcion: "", cantidad: 1, precio: 0 }]);
  const rmItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  // ───────────────── Validaciones
  const isBlank = (s?: string) => !s || s.trim().length === 0;

  const validateRequired = (): string[] => {
    const errors: string[] = [];
    // Emisor
    if (isBlank(emisor.nombre)) errors.push("Emisor: Nombre / Empresa es obligatorio.");
    if (isBlank(emisor.nif)) errors.push("Emisor: NIF/CIF es obligatorio.");
    // Cliente
    if (isBlank(cliente.nombre)) errors.push("Cliente: Nombre / Empresa es obligatorio.");
    if (isBlank(cliente.nif)) errors.push("Cliente: NIF/CIF es obligatorio.");
    // Factura
    if (isBlank(numero)) errors.push("Factura: Número es obligatorio.");
    if (isBlank(fecha)) errors.push("Factura: Fecha es obligatoria.");
    // Conceptos
    if (items.length === 0) {
      errors.push("Conceptos: Debes añadir al menos una línea.");
    } else {
      items.forEach((it, idx) => {
        if (isBlank(it.descripcion)) {
          errors.push(`Conceptos: la línea ${idx + 1} necesita una descripción.`);
        }
        if (!(it.cantidad! > 0)) {
          errors.push(`Conceptos: la línea ${idx + 1} debe tener cantidad mayor a 0.`);
        }
        if (!(it.precio! > 0)) {
          errors.push(`Conceptos: El precio debe ser mayor a 0.`);
        }
      });
    }
    return errors;
  };

  const showErrors = (title: string, errs: string[]) => {
    setAlertTitle(title);
    setAlertErrors(errs);
    setAlertOpen(true);
  };

  /** Validación centralizada de IBAN (si hay IBAN escrito) */
  const ensureValidIBANOrExplain = (): boolean => {
    const clean = normalizeIBAN(iban);
    if (!clean) return true; // vacío: no bloquea
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

  // ───────────────── Acciones
  const handlePDF = () => {
    // 1) requeridos
    const errs = validateRequired();
    if (errs.length > 0) return showErrors("Faltan datos obligatorios", errs);
    // 2) IBAN si existe
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

  const handleShare = async () => {
    const errs = validateRequired();
    if (errs.length > 0) return showErrors("Faltan datos obligatorios", errs);
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

    if ((navigator as any).canShare?.({ files: [file] })) {
      try {
        await (navigator as any).share({ title: numero, text: `Factura ${numero}`, files: [file] });
      } catch {
        // cancelado
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ───────────────── Guards de autenticación (early returns)
if (user === undefined) {
  return (
    <div className="min-h-[100svh] bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Tu <span className="text-emerald-600">Factura</span> al Instante
          </h1>
          <span className="text-sm text-slate-500">Comprobando sesión…</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">Cargando…</main>
    </div>
  );
}

if (!user) {
  return (
    <div className="min-h-[100svh] bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Tu <span className="text-emerald-600">Factura</span> al Instante
          </h1>
          
          {/* <button
            onClick={goLogin}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Iniciar sesión con FamilyApp
          </button> */}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        
        {/* <p className="mb-4">
          Para usar InvoicEasy, inicia sesión con tu cuenta de FamilyApp.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={goLogin}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          > <span className="inline-flex items-center gap-2"><LogIn size={16} />
            Iniciar sesión con FamilyApp</span>
          </button>
          <button   className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-800 text-sm font-medium text-white hover:bg-slate-900" >
                      <span className="inline-flex items-center gap-2"><UserPlus size={16} /> Crear cuenta</span>
                    </button>
                    </div> */}
      </div>

      <main className="flex-grow flex items-center justify-center p-4">
    <div className="w-full max-w-lg text-center p-8 md:p-12 bg-slate-50 rounded-3xl shadow-lg border border-slate-200">

<h2 className="text-4xl font-extrabold text-slate-900 mb-4">
 Crea tu <span className="text-emerald-600">Factura</span> en Segundos 📝
</h2>
<p className="text-lg text-slate-600 mb-8">
<span className="font-extrabold">✨ Tu <span className="text-emerald-600">Factura</span>  al Instante</span> te permite generar facturas profesionales con IVA, IRPF e IBAN en un clic. Rápido, fácil y listo para compartir.
 </p>


<div className="flex flex-col gap-4">
 <button
 onClick={goLogin}
className="rounded-xl bg-emerald-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-emerald-700 transition duration-150 ease-in-out"
>
 <span className="inline-flex items-center gap-2">
<LogIn size={20} /> Iniciar Sesión con FamilyApp
 </span>
</button>
{/* <button 
 onClick={goLogin} 
className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-lg font-medium text-slate-800 bg-white hover:bg-slate-100 transition duration-150 ease-in-out" 
 > */}
 <button  onClick={goRegister}   className="inline-flex items-center justify-center gap-2 rounded-xl order-slate-300 px-6 py-3 bg-slate-800 text-lg font-medium text-white hover:bg-slate-900" >
 <UserPlus size={20} /> ¿No tienes cuenta? Regístrate
 </button>
 </div>
</div>
 </main>
    </div>
  );
}




  return (
    <div className="min-h-[100svh] bg-slate-50 pb-24 md:pb-0">      
      {/* Header (botones solo desktop) */}

      {/* <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Tu <span className="text-emerald-600">Factura</span> al Instante
          </h1>
          <div className="hidden md:flex gap-2">
            <button onClick={handleShare} className="rounded-xl bg-sky-600 text-white px-4 py-2 hover:bg-sky-700">
              Compartir / Descargar
            </button>
            <button onClick={handlePDF} className="rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700">
              Guardar PDF
            </button>
          </div>
        </div>
      </header> */}

      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Tu <span className="text-emerald-600">Factura</span> al Instante
          </h1>

          {/* Derecha del header */}
          <div className="flex gap-2 items-center">
            {/* Auth UI */}
            {user === undefined ? (
              <span className="text-sm text-slate-500">Comprobando sesión…</span>
            ) : user ? (
              <>
                <span className="hidden md:inline text-sm text-slate-600">
                  {user.email ?? user.name ?? "Sesión iniciada"}
                </span>
                <button
                  onClick={doLogout}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                onClick={goLogin}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Iniciar sesión con FamilyApp
              </button>
            )}

            {/* Botones solo desktop (mantengo tu lógica) */}
            <div className="hidden md:flex gap-2">
              <button onClick={handleShare} className="rounded-xl bg-sky-600 text-white px-4 py-2 hover:bg-sky-700">
                Compartir / Descargar
              </button>
              <button onClick={handlePDF} className="rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700">
                Guardar PDF
              </button>
            </div>
          </div>
        </div>
      </header>


      {/* Tabs móvil */}
      <MobileTabs tabs={tabs as any} value={activeTab} onChange={(k) => setActiveTab(k as any)} />

      <main className="max-w-5xl mx-auto px-4 py-6 grid gap-6">
        {/* ===== Escritorio: TODO junto ===== */}
        <div className="hidden md:grid gap-6">
          {/* ── Datos generales ── */}
          {activeTab === "factura" && (
          <section className="bg-white border rounded-2xl p-4">
            <h2 className="font-semibold mb-1">Factura</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 md:place-items-center">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Número</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={numero}
                  required
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fecha</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 pr-10 text-base md:text-sm
                 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>            
          </section>          
    )}
          {/* ── Emisor / Cliente ── */}
          
          <section className="bg-white border rounded-2xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emisor */}
              <div>
                <h3 className="text-sm font-medium mb-2">Datos del Emisor</h3>
                <div className="grid gap-2">
                  <input className="border rounded px-3 py-2" placeholder="Nombre / Empresa" required
                    value={emisor.nombre} onChange={(e) => setEmisor({ ...emisor, nombre: e.target.value })}/>
                  <input className="border rounded px-3 py-2" placeholder="NIF / CIF (requerido)" required
                    value={emisor.nif.toLocaleUpperCase()} onChange={(e) => setEmisor({ ...emisor, nif: e.target.value })}/>
                  <input className="border rounded px-3 py-2" placeholder="Dirección (opcional)"
                    value={emisor.dir} onChange={(e) => setEmisor({ ...emisor, dir: e.target.value })}/>
                  <input className="border rounded px-3 py-2" placeholder="Teléfono (opcional)"
                    value={emisor.telef} onChange={(e) => setEmisor({ ...emisor, telef: e.target.value })}/>
                </div>
              </div>
              {/* Cliente */}
              <div>
                <h3 className="text-sm font-medium mb-2">Datos del Cliente</h3>
                <div className="grid gap-2">
                  <input className="border rounded px-3 py-2" placeholder="Nombre / Empresa" required
                    value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}/>
                  <input className="border rounded px-3 py-2" placeholder="NIF / CIF (requerido)" required
                    value={cliente.nif.toLocaleUpperCase()} onChange={(e) => setCliente({ ...cliente, nif: e.target.value })}/>
                  <input className="border rounded px-3 py-2" placeholder="Dirección (opcional)"
                    value={cliente.dir} onChange={(e) => setCliente({ ...cliente, dir: e.target.value })}/>
                  <input className="border rounded px-3 py-2" placeholder="Teléfono (opcional)"
                    value={cliente.telef} onChange={(e) => setCliente({ ...cliente, telef: e.target.value })}/>
                </div>
              </div>
            </div>
          </section> 

          {/* ── Conceptos ── */}
          <section className="bg-white border rounded-2xl p-4">
            <h2 className="font-semibold mb-3">Conceptos</h2>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <label className="block text-xs text-slate-500 mb-1">Descripción</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={it.descripcion} onChange={(e) => updateItem(i, { descripcion: e.target.value })}/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Cantidad</label>
                    <input type="number" step="0.00" className="w-full border rounded px-3 py-2 text-right"
                      value={it.cantidad} onChange={(e) => updateItem(i, { cantidad: Number(e.target.value) })}/>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">Precio (sin IVA)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`w-full border rounded px-3 py-2 text-right 
                        ${it.precio <= 0 ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-emerald-500"}`}
                      value={it.precio}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        updateItem(i, { precio: isNaN(v) ? 1 : Math.max(0.00, v) });
                      }}
                      required
                    />
                    {/* {it.precio <= 0 && (
                      <p className="text-xs text-rose-500 mt-1">Este valor debe ser mayor que cero</p>
                    )} */}
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => rmItem(i)} className="text-rose-600 text-sm">✕</button>
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">
                + Añadir línea
              </button>
            </div>
          </section>

          {/* ── Impuestos ── */}
          <section className="bg-white border rounded-2xl p-4">
            <h2 className="font-semibold mb-3">Impuestos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:place-items-center">
              <div className="w-full max-w-xs">
                <label className="block text-sm font-medium">IVA</label>
                <select
                  value={ivaPct}
                  onChange={(e) => setIvaPct(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value={0}>0% (exento)</option>
                  <option value={21}>21% (general)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Se aplica sobre la Base Imponible.</p>
              </div>

              <div className="w-full max-w-xs">
                <label className="block text-sm font-medium">Retención IRPF</label>
                <select
                  value={irpfPct}
                  onChange={(e) => setIrpfPct(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value={0}>0% (sin obligación)</option>
                  <option value={1}>1% (Módulos con obligación de retener)</option>
                  <option value={7}>7% (Inicio actividad)</option>
                  <option value={15}>15% (Alícuota General)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Se descuenta de la Base Imponible (no lleva IVA).</p>
              </div>
            </div>
          </section>

          {/* ── Pago (IBAN) ── */}
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
                required
                onChange={(e) => setIban(sanitizeSpanishIBANInput(e.target.value))}
                autoComplete="off"
                inputMode="text"
              />
              <p className="text-xs text-slate-500">Se mostrará en el PDF en “Datos de pago”.</p>
            </div>
          </section>

          {/* ── Totales ── */}
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
        </div>

        {/* ===== Móvil: por secciones ===== */}
        <div className="md:hidden grid gap-6">
          {activeTab === "factura" && (
            <section className="bg-white border rounded-2xl p-4">
              <h2 className="font-semibold mb-3">Factura</h2>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Número</label>
                  <input className="w-full border rounded px-3 py-2"
                    value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Fecha</label>
                  <input type="date" className="w-full border rounded px-3 py-2 pr-10 text-base md:text-sm
                 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
              </div>
            </section>
          )}

          {activeTab === "datos" && (
            <section className="bg-white border rounded-2xl p-4">
              <div className="grid grid-cols-1 gap-6">
                {/* Emisor */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Datos del Emisor</h3>
                  <div className="grid gap-2">
                    <input className="border rounded px-3 py-2" placeholder="Nombre / Empresa" required
                      value={emisor.nombre} onChange={(e) => setEmisor({ ...emisor, nombre: e.target.value })}/>
                    <input className="border rounded px-3 py-2" placeholder="NIF / CIF (requerido)" required
                      value={emisor.nif.toLocaleUpperCase()} onChange={(e) => setEmisor({ ...emisor, nif: e.target.value })}/>
                    <input className="border rounded px-3 py-2" placeholder="Dirección (opcional)"
                      value={emisor.dir} onChange={(e) => setEmisor({ ...emisor, dir: e.target.value })}/>
                    <input className="border rounded px-3 py-2" placeholder="Teléfono (opcional)"
                      value={emisor.telef} onChange={(e) => setEmisor({ ...emisor, telef: e.target.value })}/>
                  </div>
                </div>
                {/* Cliente */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Datos del Cliente</h3>
                  <div className="grid gap-2">
                    <input className="border rounded px-3 py-2" placeholder="Nombre / Empresa"
                      value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}/>
                    <input className="border rounded px-3 py-2" placeholder="NIF / CIF (requerido)" required
                      value={cliente.nif.toLocaleUpperCase()} onChange={(e) => setCliente({ ...cliente, nif: e.target.value })}/>
                    <input className="border rounded px-3 py-2" placeholder="Dirección (opcional)"
                      value={cliente.dir} onChange={(e) => setCliente({ ...cliente, dir: e.target.value })}/>
                    <input className="border rounded px-3 py-2" placeholder="Teléfono (opcional)"
                      value={cliente.telef} onChange={(e) => setCliente({ ...cliente, telef: e.target.value })}/>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "conceptos" && (
            <section className="bg-white border rounded-2xl p-4">
              <h2 className="font-semibold mb-3">Conceptos</h2>
              <div className="space-y-3">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                      <label className="block text-xs text-slate-500 mb-1">Descripción</label>
                      <input className="w-full border rounded px-3 py-2"
                        value={it.descripcion} onChange={(e) => updateItem(i, { descripcion: e.target.value })}/>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Cant.</label>
                      <input type="number" step="0.01" className="w-full border rounded px-3 py-2 text-right"
                        value={it.cantidad} onChange={(e) => updateItem(i, { cantidad: Number(e.target.value) })}/>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-slate-500 mb-1">Precio</label>
                      <input type="number" step="0.01" className="w-full border rounded px-3 py-2 text-right"
                        value={it.precio} onChange={(e) => updateItem(i, { precio: Number(e.target.value) })}/>
                    </div>
                    <div className="col-span-12 text-right">
                      <button onClick={() => rmItem(i)} className="text-rose-600 text-sm">Eliminar</button>
                    </div>
                  </div>
                ))}
                <button onClick={addItem} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">
                  + Añadir línea
                </button>
              </div>
            </section>
          )}

          {activeTab === "impuestos" && (
            <>
              <section className="bg-white border rounded-2xl p-4">
                <h2 className="font-semibold mb-3">Impuestos</h2>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium">IVA</label>
                    <select value={ivaPct} onChange={(e) => setIvaPct(Number(e.target.value))}
                            className="w-full border rounded px-3 py-2">
                      <option value={0}>0% (exento)</option>
                      <option value={21}>21% (general)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Se aplica sobre la Base Imponible.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Retención IRPF</label>
                    <select value={irpfPct} onChange={(e) => setIrpfPct(Number(e.target.value))}
                            className="w-full border rounded px-3 py-2">
                      <option value={0}>0% (sin retención)</option>
                      <option value={1}>1% (retención a usar)</option>
                      <option value={7}>7% (inicio actividad)</option>
                      <option value={15}>15% (general)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Se descuenta de la Base Imponible (no lleva IVA).</p>
                  </div>
                </div>
              </section>

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
                  <p className="text-xs text-slate-500">Se mostrará en el PDF en “Datos de pago”.</p>
                </div>
              </section>

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
            </>
          )}
        </div>
      </main>

      {/* Barra de acciones móvil (total + compartir + pdf) */}
      <StickyActions
        totalText={fmtEUR(totals.total)}
        onShare={handleShare}
        onPdf={handlePDF}
        showActions={showActions}          // true en "impuestos", false en las demás
        onNext={!showActions ? nextTab : undefined}
        nextDisabled={!canNext}
        nextLabel="Siguiente"
      />

      {/* Modales */}
      <Modal
        open={ibanModalOpen}
        title="IBAN inválido"
        onClose={() => setIbanModalOpen(false)}
      >
        <p>{ibanModalMsg}</p>
      </Modal>

      <Modal
        open={alertOpen}
        title={alertTitle || "Faltan datos"}
        onClose={() => setAlertOpen(false)}
      >
        <ul className="list-disc pl-5 space-y-1">
          {alertErrors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
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
