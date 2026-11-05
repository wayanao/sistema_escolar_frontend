import { useState } from "react";

// Diseño del usuario (2026-11-05): tarjeta blanca con campos lila. Sin la
// casilla "Recordarme" del diseño: la sesión dura siempre lo mismo y el código
// del colegio ya se recuerda solo (decisión del usuario).
const inputClassName =
  "login-campo h-[52px] w-full min-w-0 rounded-[14px] border-2 border-[#cbb8ec] bg-[#faf7ff] px-4 text-[17px] text-[#1e1530] transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-[#8a7fa3] hover:border-[#a78bfa] focus:border-[#562897] focus:bg-white focus:shadow-[0_0_0_6px_rgba(190,242,100,0.35)] focus:outline focus:outline-[3px] focus:outline-offset-1 focus:outline-[#bef264] disabled:cursor-wait disabled:opacity-70";

const labelClassName = "text-[15px] font-extrabold";

const ID_AYUDA_OLVIDO = "ayuda-olvido-contrasena";

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
      className="login-entrada flex w-full max-w-[420px] flex-col gap-5 rounded-[24px] border-2 border-[#e3d6f7] bg-white px-6 pb-8 pt-8 shadow-[0_10px_0_#e3d6f7] sm:px-9 sm:pt-10"
      style={{ animationDelay: "150ms" }}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="login-titulo m-0 text-[38px] font-extrabold leading-[1.05] text-[#36195f]">
          ¡Hola de nuevo!
        </h1>
        <p className="m-0 text-base leading-normal text-[#4b4160]">
          Ingresa con los datos que te asignó tu colegio.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[14px] border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
        >
          <span aria-hidden="true">!</span>
          <span>{formError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="codigo-colegio" className={labelClassName}>
          Código del colegio
        </label>
        <input
          id="codigo-colegio"
          type="text"
          placeholder="Ej. colegio123"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${inputClassName} tracking-[0.06em]`}
          value={codigoColegio}
          onChange={(event) => actualizarCodigoColegio(event.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="correo-login" className={labelClassName}>
          Correo electrónico
        </label>
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
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <label htmlFor="password-login" className={labelClassName}>
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => setMostrarAyudaOlvido((actual) => !actual)}
            aria-expanded={mostrarAyudaOlvido}
            aria-controls={ID_AYUDA_OLVIDO}
            className="rounded text-sm font-extrabold text-[#562897] underline underline-offset-2 transition hover:text-[#36195f] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#562897]"
          >
            ¿La olvidaste?
          </button>
        </div>
        <div className="relative flex">
          <input
            id="password-login"
            type={mostrarPassword ? "text" : "password"}
            autoComplete="current-password"
            className={`${inputClassName} flex-auto pr-14`}
            value={password}
            onChange={(event) => actualizarPassword(event.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((actual) => !actual)}
            disabled={isSubmitting}
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-[10px] text-[#562897] transition hover:bg-[#f3edfc] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#562897] disabled:cursor-wait"
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={mostrarPassword}
          >
            {mostrarPassword ? (
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2" />
                <path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                <path d="m2 2 20 20" />
              </svg>
            ) : (
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <p
          id={ID_AYUDA_OLVIDO}
          hidden={!mostrarAyudaOlvido}
          className="m-0 rounded-xl bg-[#f3edfc] px-3 py-2 text-sm font-semibold text-[#36195f]"
        >
          Pídele al administrador de tu colegio que te asigne una nueva.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="login-titulo group flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#562897] text-xl font-extrabold text-white shadow-[0_5px_0_#36195f] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[#36195f] hover:shadow-[0_7px_0_#241040] active:translate-y-[3px] active:shadow-[0_2px_0_#241040] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#562897] disabled:translate-y-0 disabled:cursor-wait disabled:bg-[#562897] disabled:opacity-80 disabled:shadow-[0_5px_0_#36195f]"
        >
          {isSubmitting && !loginSucceeded && (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
          )}
          <span>
            {loginSucceeded ? "Acceso correcto" : isSubmitting ? "Verificando acceso..." : "Entrar a Auligo"}
          </span>
          {!isSubmitting && !loginSucceeded && (
            <svg aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bef264" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          )}
        </button>

        <div className="min-h-5 text-center text-sm font-semibold text-[#4b4160]" aria-live="polite">
          {isTakingLong && !loginSucceeded
            ? "Estamos conectando con el servidor. Puede tardar un momento."
            : ""}
        </div>
      </div>

      <p className="m-0 flex items-center gap-2 text-[13px] text-[#4b4160]">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Acceso solo para personal autorizado
      </p>
    </form>
  );
}

export default LoginFormView;
