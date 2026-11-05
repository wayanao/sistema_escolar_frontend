import { useState } from "react";

// Diseño del usuario (2026-11-05), con sus ajustes del mismo día: formulario
// "burbuja" (`burbuja-login` en index.css), con campos y botón en forma de
// píldora y una burbuja con birrete arriba. "Acceso solo para personal
// autorizado" va debajo de la burbuja, en Login.jsx, para que el formulario
// sea más bajito que el aula. Sin la casilla "Recordarme" del
// diseño: la sesión dura siempre lo mismo y el código del colegio ya se
// recuerda solo (decisión del usuario).
const inputClassName =
  "login-field peer h-11 w-full min-w-0 rounded-full border border-white/25 bg-white/10 pl-12 pr-4 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.15)] transition-[border-color,background-color,box-shadow] duration-200 placeholder:font-normal placeholder:text-purple-100/55 hover:border-white/40 hover:bg-white/[0.13] focus:border-[#bef264]/80 focus:bg-white/[0.16] focus:outline-none focus:ring-4 focus:ring-[#bef264]/20 disabled:cursor-wait disabled:opacity-70";

// La burbujita del ícono, dentro del campo a la izquierda: se pone lima al
// escribir en el campo.
const iconoClassName =
  "pointer-events-none absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-purple-50 ring-1 ring-white/25 transition-colors duration-200 peer-focus:bg-[#bef264] peer-focus:text-[#2a1150] peer-focus:ring-[#bef264]";

const labelClassName = "pl-4 text-[13px] font-extrabold text-white/90";

const ID_AYUDA_OLVIDO = "ayuda-olvido-contrasena";

function Icono({ children }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function LoginFormView({
  email,
  password,
  codigoColegio,
  formError,
  isSubmitting,
  isTakingLong,
  loginSucceeded,
  actualizarEmail,
  actualizarPassword,
  actualizarCodigoColegio,
  iniciarSesion,
}) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  // No hay recuperación de contraseña: la cambia el administrador del colegio
  // al editar al profesor. "¿La olvidaste?" solo dice a quién pedirla.
  const [mostrarAyudaOlvido, setMostrarAyudaOlvido] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        iniciarSesion();
      }}
      className="burbuja-login login-entrada relative w-full px-7 pb-7 pt-10"
      style={{ animationDelay: "150ms" }}
    >
      {/* Burbuja con birrete, montada sobre el borde de arriba. */}
      <span
        aria-hidden="true"
        className="gota-flotar absolute -top-8 left-1/2 z-10 -ml-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#e4fcb3] to-[#a3e635] text-[#2a1150] shadow-[0_14px_30px_-8px_rgba(163,230,53,0.65),inset_0_-4px_8px_rgba(77,124,15,0.35),inset_0_3px_4px_rgba(255,255,255,0.85)] ring-4 ring-white/20"
      >
        <span className="absolute left-3 top-2 h-3 w-6 -rotate-12 rounded-full bg-white/70" />
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" />
          <path d="M22 10v6" />
          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
        </svg>
      </span>

      {/* Encima del reflejo y del borde de la burbuja (`::before`, `::after`). */}
      <div className="relative flex flex-col gap-3">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="login-titulo m-0 text-[30px] font-extrabold leading-[1.05] text-white drop-shadow-[0_2px_10px_rgba(42,17,80,0.45)]">
            ¡Hola de <span className="text-[#bef264]">nuevo</span>!
          </h1>
          <p className="m-0 text-sm leading-normal text-purple-100/80">
            Ingresa con los datos que te asignó tu colegio.
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-amber-300/50 bg-amber-400/15 px-4 py-2.5 text-sm font-bold text-amber-100"
          >
            <span aria-hidden="true">!</span>
            <span>{formError}</span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="codigo-colegio" className={labelClassName}>
            Código del colegio
          </label>
          <div className="relative">
            <input
              id="codigo-colegio"
              type="text"
              placeholder="Ej. colegio123"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`${inputClassName} tracking-[0.04em]`}
              value={codigoColegio}
              onChange={(event) => actualizarCodigoColegio(event.target.value)}
              disabled={isSubmitting}
            />
            <span className={iconoClassName}>
              <Icono>
                <path d="M3 21h18M5 21V9l7-4 7 4v12" />
                <path d="M10 21v-5h4v5" />
              </Icono>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="correo-login" className={labelClassName}>
            Correo electrónico
          </label>
          <div className="relative">
            <input
              id="correo-login"
              type="email"
              placeholder="nombre@colegio.edu.co"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className={inputClassName}
              value={email}
              onChange={(event) => actualizarEmail(event.target.value)}
              disabled={isSubmitting}
            />
            <span className={iconoClassName}>
              <Icono>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </Icono>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <label htmlFor="password-login" className={labelClassName}>
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => setMostrarAyudaOlvido((actual) => !actual)}
              aria-expanded={mostrarAyudaOlvido}
              aria-controls={ID_AYUDA_OLVIDO}
              className="rounded pr-3 text-[13px] font-extrabold text-[#bef264] underline underline-offset-2 transition hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#bef264]"
            >
              ¿La olvidaste?
            </button>
          </div>
          <div className="relative">
            <input
              id="password-login"
              type={mostrarPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${inputClassName} pr-12`}
              value={password}
              onChange={(event) => actualizarPassword(event.target.value)}
              disabled={isSubmitting}
            />
            <span className={iconoClassName}>
              <Icono>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </Icono>
            </span>
            <button
              type="button"
              onClick={() => setMostrarPassword((actual) => !actual)}
              disabled={isSubmitting}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-purple-100 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#bef264] disabled:cursor-wait"
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={mostrarPassword}
            >
              {mostrarPassword ? (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2" />
                  <path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  <path d="m2 2 20 20" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <p
            id={ID_AYUDA_OLVIDO}
            hidden={!mostrarAyudaOlvido}
            className="m-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-[13px] font-semibold text-purple-50"
          >
            Pídele al administrador de tu colegio que te asigne una nueva.
          </p>
        </div>

        <div className="mt-1 flex flex-col gap-1.5">
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="login-titulo group relative flex h-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#dcfba4] to-[#a3e635] px-14 text-lg font-extrabold text-[#2a1150] shadow-[0_14px_30px_-10px_rgba(163,230,53,0.7),inset_0_-3px_0_rgba(77,124,15,0.35),inset_0_2px_0_rgba(255,255,255,0.75)] transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-10px_rgba(163,230,53,0.85),inset_0_-3px_0_rgba(77,124,15,0.35),inset_0_2px_0_rgba(255,255,255,0.75)] hover:brightness-105 active:translate-y-0.5 focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white disabled:translate-y-0 disabled:cursor-wait disabled:opacity-80"
          >
            {/* Reflejo de burbuja en la mitad de arriba del botón. */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-1 h-[40%] rounded-full bg-gradient-to-b from-white/70 to-transparent" />
            {isSubmitting && !loginSucceeded && (
              <span className="relative mr-2.5 h-5 w-5 animate-spin rounded-full border-2 border-[#2a1150]/25 border-t-[#2a1150]" aria-hidden="true" />
            )}
            <span className="relative">
              {loginSucceeded ? "Acceso correcto" : isSubmitting ? "Verificando acceso..." : "Entrar a Auligo"}
            </span>
            {!isSubmitting && !loginSucceeded && (
              <span aria-hidden="true" className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#2a1150] text-[#bef264] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform duration-200 group-hover:translate-x-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            )}
          </button>

          <div className="text-center text-[13px] font-semibold text-purple-100/80" aria-live="polite">
            {isTakingLong && !loginSucceeded
              ? "Estamos conectando con el servidor. Puede tardar un momento."
              : ""}
          </div>
        </div>

      </div>
    </form>
  );
}

export default LoginFormView;
