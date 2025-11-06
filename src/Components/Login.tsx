// src/components/LoginWithFamilyApp.tsx
export default function Login() {
  const goLogin = () => {
    const returnUrl = encodeURIComponent('https://invoice.familyapp.store');
    window.location.href = `https://familyapp.store/login?returnUrl=${returnUrl}`;
  };
  return <button onClick={goLogin}>Iniciar sesión</button>;
}
