export default function GuardadoPlanProfesor({
  guardando,
  cargando,
  buttonText,
  mensaje,
  onGuardar,
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-100 via-purple-50 to-emerald-50 p-1 shadow-lg shadow-violet-100/80">
      <span
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-500"
        aria-hidden="true"
      ></span>
      <div className="relative rounded-[0.8rem] bg-white/90 p-4 backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <IconoGuardado />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
                Último paso
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-slate-950 sm:text-xl">
                Guardar plan
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                Confirma tu planeación cuando esté lista. Los campos pueden
                guardarse aunque alguno permanezca vacío.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <button
              type="button"
              onClick={onGuardar}
              disabled={guardando || cargando}
              aria-busy={guardando}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:from-violet-800 hover:to-purple-800 hover:shadow-lg disabled:cursor-not-allowed disabled:from-violet-300 disabled:to-purple-300 disabled:shadow-none lg:w-auto lg:min-w-48"
            >
              {guardando ? <SpinnerGuardado /> : <IconoBotonGuardado />}
              {guardando ? "Guardando..." : buttonText}
            </button>
          </div>
        </div>

        {mensaje && <MensajeGuardado mensaje={mensaje} />}
      </div>
    </section>
  );
}

function IconoGuardado() {
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-200"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M5 4h12l2 2v14H5V4Z" strokeLinejoin="round" />
        <path d="M8 4v6h8V4M8 20v-6h8v6" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function IconoBotonGuardado() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M4 3h10l2 2v12H4V3Z" strokeLinejoin="round" />
      <path d="M7 3v5h6V3M7 17v-5h6v5" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerGuardado() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    ></span>
  );
}

function MensajeGuardado({ mensaje }) {
  return (
    <div
      className="mt-4 flex items-start gap-2.5 border-t border-violet-100 pt-3 text-sm text-slate-700"
      role="status"
    >
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 20 20"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10 6v4M10 14h.01" strokeLinecap="round" />
          <circle cx="10" cy="10" r="8" />
        </svg>
      </span>
      <p className="leading-5">{mensaje}</p>
    </div>
  );
}
