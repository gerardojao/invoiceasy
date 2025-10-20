// src/lib/iban.ts

/** Longitud IBAN España */
export const SPANISH_IBAN_LENGTH = 24; // "ES" + 22 dígitos

/** Quita espacios y no alfanuméricos, pone mayúsculas */
export function normalizeIBAN(raw: string): string {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Agrupa en bloques de 4 para lectura humana */
export function formatIBAN(raw: string): string {
  const clean = normalizeIBAN(raw);
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

/** Sanea entrada de usuario y limita a 24 chars (ES) */
export function sanitizeSpanishIBANInput(raw: string): string {
  let s = normalizeIBAN(raw);
  if (s.length > SPANISH_IBAN_LENGTH) s = s.slice(0, SPANISH_IBAN_LENGTH);
  return formatIBAN(s);
}

/** Valida IBAN ES: prefijo, longitud, mod-97 y CCC español */
export function isValidSpanishIBAN(raw: string): boolean {
  const iban = normalizeIBAN(raw);
  // 1) Prefijo ES + 22 dígitos
  if (!/^ES\d{22}$/.test(iban)) return false;

  // 2) IBAN mod-97
  if (!ibanMod97(iban)) return false;

  // 3) CCC nacional (20 dígitos internos del IBAN español)
  // ESkk + (20 dígitos CCC)
  const ccc = iban.slice(4); // 20 dígitos
  return isValidSpanishCCC(ccc);
}

/** ---------- Auxiliares ---------- */

/** IBAN mod-97 (oficial). true si resto == 1 */
function ibanMod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((ch) => (/[A-Z]/.test(ch) ? (ch.charCodeAt(0) - 55).toString() : ch))
    .join("");

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const part = remainder.toString() + numeric.slice(i, i + 7);
    remainder = Number(part) % 97;
  }
  return remainder === 1;
}

/**
 * Valida CCC (Código Cuenta Cliente) español:
 * Estructura: BBBB GGGG KK CCCCCCCCCC  (20 dígitos)
 * - Primer dígito de control (K1) para "00 + BBBB + GGGG" (10 dígitos)
 * - Segundo dígito de control (K2) para "CCCCCCCCCC" (10 dígitos)
 * Pesos: [1,2,4,8,5,10,9,7,3,6]
 * Transformación: 11 - (sum % 11), 10 -> 1, 11 -> 0
 */
export function isValidSpanishCCC(ccc: string): boolean {
  if (!/^\d{20}$/.test(ccc)) return false;

  const bank = ccc.slice(0, 4);
  const branch = ccc.slice(4, 8);
  const k1 = Number(ccc[8]);
  const k2 = Number(ccc[9]);
  const acct = ccc.slice(10); // 10 dígitos

  const weights = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];

  // Para K1 se usa "00" + bank + branch (10 dígitos)
  const block1 = "00" + bank + branch; // length 10
  const calcK1 = calcSpanishCCCCheckDigit(block1, weights);

  // Para K2 se usa la cuenta (10 dígitos)
  const calcK2 = calcSpanishCCCCheckDigit(acct, weights);

  return k1 === calcK1 && k2 === calcK2;
}

function calcSpanishCCCCheckDigit(block10: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(block10[i]) * weights[i];
  }
  let res = 11 - (sum % 11);
  if (res === 10) res = 1;
  if (res === 11) res = 0;
  return res;
}
