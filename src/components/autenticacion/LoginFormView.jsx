import { useState } from "react";
import auligoLoginLogo from "../../assets/auligo-login-logo.png";

const inputClassName =
  "login-field peer w-full rounded-2xl border border-white/90 bg-white/60 py-3.5 pl-[3.65rem] pr-4 text-[15px] font-semibold text-slate-900 shadow-[0_8px_24px_rgba(51,24,83,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-purple-300/80 hover:bg-white/75 focus:border-purple-500 focus:bg-white/90 focus:ring-4 focus:ring-purple-500/10 disabled:cursor-wait disabled:bg-white/40";

const iconContainerClassName =
  "pointer-events-none absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-purple-200/70 bg-gradient-to-br from-purple-100/95 to-white/80 text-purple-700 shadow-[0_4px_12px_rgba(109,40,217,0.09)] transition-all duration-200 peer-focus:border-purple-300 peer-focus:text-purple-800 peer-focus:shadow-[0_5px_16px_rgba(109,40,217,0.16)]";

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
      <div className="mb-4 flex flex-col items-center">
        <img
          src={auligoLoginLogo}
          alt="Auligo"
          className="h-auto w-44 object-contain drop-shadow-[0_8px_14px_rgba(79,23,145,0.12)] sm:w-48"
        />
        <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.7)]" />
          Acceso institucional
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-[25px] font-bold leading-tight tracking-[-0.015em] text-slate-800 sm:text-[27px]">
          Qué bueno tenerte <span className="text-purple-700">aquí</span>
        </h2>
        <p className="mt-1.5 text-sm leading-5 text-slate-600">
          Ingresa con los datos asignados por tu institución para continuar.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-900"
        >
          <span aria-hidden="true">!</span>
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="codigo-colegio" className="mb-2 block text-[13px] font-extrabold tracking-[0.01em] text-slate-800">
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
          <label htmlFor="correo-login" className="mb-2 block text-[13px] font-extrabold tracking-[0.01em] text-slate-800">
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
          <label htmlFor="password-login" className="mb-2 block text-[13px] font-extrabold tracking-[0.01em] text-slate-800">
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
              className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-purple-100/70 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300/70 disabled:cursor-wait"
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
        className="group relative mt-6 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-800 via-violet-600 to-purple-700 px-4 py-3.5 text-[15px] font-extrabold text-white shadow-[0_14px_30px_rgba(107,33,168,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(107,33,168,0.38),inset_0_1px_0_rgba(255,255,255,0.28)] focus:outline-none focus:ring-4 focus:ring-purple-500/20 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-80 disabled:shadow-none"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent opacity-80" />
        {isSubmitting && !loginSucceeded && (
          <span className="relative h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
        )}
        <span className="relative">
          {loginSucceeded ? "Acceso correcto" : isSubmitting ? "Verificando acceso..." : "Entrar a Auligo"}
        </span>
        {!isSubmitting && !loginSucceeded && (
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </span>
        )}
      </button>

      <div className="mt-3 min-h-5 text-center text-sm font-medium text-slate-500" aria-live="polite">
        {isTakingLong && !loginSucceeded
          ? "Estamos conectando con el servidor. Puede tardar un momento."
          : ""}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-200 pt-5 text-center text-xs font-semibold text-slate-500">
        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V8a5 5 0 0 1 10 0v2m-10 0h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Z" />
        </svg>
        Acceso exclusivo para personal autorizado
      </div>
    </form>
  );
}

export default LoginFormView;
