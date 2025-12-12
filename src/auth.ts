const AUTH_FRONT_BASE =
  import.meta.env.VITE_AUTH_FRONT_BASE || 'https://localhost:5173'; // FRONT FamilyApp

const AUTH_API_BASE =
  import.meta.env.VITE_AUTH_API_BASE || 'https://localhost:7288/api';   // API FamilyApp

const RETURN_URL =
  import.meta.env.VITE_RETURN_URL || window.location.origin;         // InvoiceEasy

function buildReturnUrl() {
  // URL COMPLETA donde está el usuario en Invoice (incluye ruta y query)
  return encodeURIComponent(window.location.href);
}

export async function getCurrentUser() {
  const res = await fetch(`${AUTH_API_BASE}/Auth/me`, 
    { credentials: 'include', 
      cache: 'no-store' 
    });
  if (!res.ok) return null;
  return await res.json();
}


export function goLogin() {
  // const returnUrl = encodeURIComponent(window.location.origin);
  const returnUrl = buildReturnUrl();
  window.location.href = `${AUTH_FRONT_BASE}/login?returnUrl=${returnUrl}`;
}

export function goRegister() {
  const returnUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${AUTH_FRONT_BASE}/register?returnUrl=${returnUrl}`;
}

export async function doLogout() {
  await fetch(`${AUTH_API_BASE}/auth/logout`, 
    {   method: 'POST', 
        credentials: 'include' 
    });
  window.location.reload();
}

// (Opcional) debug rápido:
console.log("env.production: ", {
  AUTH_FRONT_BASE,
  AUTH_API_BASE,
  RETURN_URL,
});
