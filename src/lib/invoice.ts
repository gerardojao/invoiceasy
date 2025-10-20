export type LineItem = {
  descripcion: string;
  cantidad: number; // unidades
  precio: number;   // unitario sin IVA
};

export type Totals = {
  baseImponible: number;
  iva: number;
  irpf: number;
  total: number;
};

export function calcBase(items: LineItem[]): number {
  return items.reduce((acc, it) => acc + (it.cantidad || 0) * (it.precio || 0), 0);
}

// ivaPct e irpfPct en porcentaje (21 => 21)
export function calcTotals(items: LineItem[], ivaPct: number, irpfPct: number): Totals {
  const baseImponible = round2(calcBase(items));
  const iva = round2(baseImponible * (ivaPct / 100));
  const irpf = round2(baseImponible * (irpfPct / 100)); // retención sobre base
  const total = round2(baseImponible + iva - irpf);
  return { baseImponible, iva, irpf, total };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmtEUR(n: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}
