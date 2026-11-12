/**
 * Lo primero del panel del profesor (2026-11-10): el saludo, el día de hoy y
 * el período con el que está trabajando. Va suelto sobre el fondo de la app
 * (`fondo-aula`), sin caja: a la izquierda el saludo y la fecha, a la derecha
 * el período en una tarjeta flotante. Los cumpleaños de la semana salieron de
 * aquí el 2026-11-11: ahora van en el muro de cumpleaños, al final del panel.
 * Solo presenta: todo llega por props.
 */
function EncabezadoPanelProfesor({ nombreProfesor, fechaDeHoy, periodo }) {
  return (
    <header className="mb-7 px-1 pt-1 sm:pt-2">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Panel del profesor</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Hola, <span translate="no">{nombreProfesor}</span> <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">Que tengas una excelente jornada.</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-purple-900 shadow-sm sm:text-base">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
            </svg>
            {fechaDeHoy}
          </p>
        </div>

        <div className="flex w-fit items-center gap-4 rounded-2xl border border-purple-100 bg-white/80 px-4 py-3.5 shadow-lg shadow-purple-900/5 backdrop-blur-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-3xl font-black text-white shadow-sm" aria-hidden="true">
            {periodo}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Período de trabajo</p>
            <p className="text-lg font-extrabold text-slate-950">Período {periodo}</p>
            <p className="text-xs text-slate-500">El último que elegiste</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default EncabezadoPanelProfesor;
