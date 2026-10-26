import { useState } from "react";
// Logo claro: el formulario va sobre el vidrio oscuro del login.
import auligoLogoNav from "../../assets/auligo-logo-nav.png";

const inputClassName =
  "login-field peer w-full rounded-2xl border border-white/15 bg-white/[0.07] py-3 pl-[3.25rem] pr-4 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.18)] outline-none transition-all duration-200 placeholder:font-normal placeholder:text-purple-100/50 hover:border-white/25 hover:bg-white/[0.1] focus:border-lime-300/70 focus:bg-white/[0.12] focus:ring-4 focus:ring-lime-300/15 disabled:cursor-wait disabled:opacity-70";

const iconContainerClassName =
  "pointer-events-none absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-purple-100/80 transition-all duration-200 peer-focus:border-lime-300/50 peer-focus:text-lime-200";

const labelClassName = "mb-1.5 block text-[13px] font-bold text-purple-50/90";

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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        iniciarSesion();
      }}
      className="w-full"
    >
      <div className="mb-5 flex flex-col items-center text-center">
        <img src={auligoLogoNav} alt="Auligo" className="nav-brand-logo h-10 w-auto object-contain" />
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-purple-50/90">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
          Acceso institucional
        </div>
        <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white">
          Qué bueno tenerte <span className="text-lime-300">aquí</span>
        </h1>
        <p className="mt-1.5 text-sm leading-5 text-purple-100/75">
          Ingresa con los datos asignados por tu institución para continuar.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-amber-300/40 bg-amber-400/15 px-3.5 py-3 text-sm font-medium text-amber-100"
        >
          <span aria-hidden="true">!</span>
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-3.5">
        <div>
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
              className={inputClassName}
              value={codigoColegio}
              onChange={(event) => actualizarCodigoColegio(event.target.value)}
              disabled={isSubmitting}
            />
            <span className={iconContainerClassName}>
              <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9l7-4 7 4v12M9 13h2v2H9v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Z" />
              </svg>
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="correo-login" className={labelClassName}>
            Correo electrónico
          </label>
          <div className="relative">
            <input
              id="correo-login"
              type="email"
              placeholder="correo@colegio.edu"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className={inputClassName}
              value={email}
              onChange={(event) => actualizarEmail(event.target.value)}
              disabled={isSubmitting}
            />
            <span className={iconContainerClassName}>
              <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 12 13l9-5.5M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
              </svg>
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="password-login" className={labelClassName}>
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password-login"
              type={mostrarPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              className={`${inputClassName} pr-12`}
              value={password}
              onChange={(event) => actualizarPassword(event.target.value)}
              disabled={isSubmitting}
            />
            <span className={iconContainerClassName}>
              <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V8a5 5 0 0 1 10 0v2m-10 0h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Zm5 4v2" />
              </svg>
            </span>
            <button
              type="button"
              onClick={() => setMostrarPassword((actual) => !actual)}
              disabled={isSubmitting}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-purple-100/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-lime-300/50 disabled:cursor-wait"
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={mostrarPassword}
            >
              {mostrarPassword ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9 5 9 7a10.8 10.8 0 0 1-2.2 3.3M6.2 6.2C4.2 7.5 3 10.1 3 12c0 2 3.8 7 9 7 1 0 2-.2 2.9-.5" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0-2 3.8-7 9-7s9 5 9 7-3.8 7-9 7-9-5-9-7Zm9 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="group relative mt-5 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-b from-lime-200 to-lime-400 px-4 py-3.5 text-[15px] font-extrabold text-slate-950 shadow-[0_14px_34px_rgba(163,230,53,0.3),inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-2px_0_rgba(77,124,15,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(163,230,53,0.42),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(77,124,15,0.25)] focus:outline-none focus:ring-4 focus:ring-lime-300/30 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-80"
      >
        {/* Reflejo de gota en la mitad de arriba del botón. */}
        <span className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-70" />
        {isSubmitting && !loginSucceeded && (
          <span className="relative h-5 w-5 animate-spin rounded-full border-2 border-slate-950/25 border-t-slate-950" aria-hidden="true" />
        )}
        <span className="relative">
          {loginSucceeded ? "Acceso correcto" : isSubmitting ? "Verificando acceso..." : "Entrar a Auligo"}
        </span>
        {!isSubmitting && !loginSucceeded && (
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-slate-950/15 bg-slate-950/10 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </span>
        )}
      </button>

      <div className="mt-3 min-h-5 text-center text-sm font-medium text-purple-100/70" aria-live="polite">
        {isTakingLong && !loginSucceeded
          ? "Estamos conectando con el servidor. Puede tardar un momento."
          : ""}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-center text-xs font-semibold text-purple-100/60">
        <svg className="h-4 w-4 text-lime-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V8a5 5 0 0 1 10 0v2m-10 0h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Z" />
        </svg>
        Acceso exclusivo para personal autorizado
      </div>
    </form>
  );
}

export default LoginFormView;
