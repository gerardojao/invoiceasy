// src/auth.ts
const isDev = import.meta.env.DEV;

const AUTH_FRONT_BASE =
  import.meta.env.VITE_AUTH_FRONT_BASE ?? (isDev ? "https://localhost:5173" : undefined);

const AUTH_API_BASE =
  import.meta.env.VITE_AUTH_API_BASE ?? (isDev ? "https://localhost:7288/api" : undefined);

const RETURN_URL =
  import.meta.env.VITE_RETURN_URL ?? window.location.origin;

  console.log("Nueva Prueba", {AUTH_FRONT_BASE, AUTH_API_BASE, RETURN_URL});
  

// En prod, si faltara algo, rompe temprano (mejor que compilar con localhost)
if (!isDev) {
  for (const [k,v] of Object.entries({ AUTH_FRONT_BASE, AUTH_API_BASE, RETURN_URL })) {
    if (!v || String(v).includes("localhost")) {
      throw new Error(`ENV inválida en producción: ${k}=${v}`);
    }
  }
}

export async function getCurrentUser() {
  const res = await fetch(`${AUTH_API_BASE}/Auth/me`, { credentials: 'include', 
  cache: 'no-store' });
  if (!res.ok) return null;
  return await res.json();
}

export function goLogin() {
  const returnUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${AUTH_FRONT_BASE}/login?returnUrl=${returnUrl}`;
}

export async function doLogout() {
  await fetch(`${AUTH_API_BASE}/auth/logout`, 
    {   method: 'POST', 
        credentials: 'include' 
    });
  window.location.reload();
}

// (Opcional) debug rápido:
console.log({
  AUTH_FRONT_BASE,
  AUTH_API_BASE,
  RETURN_URL,
});
