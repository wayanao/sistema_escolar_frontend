import {
  nombreCompletoEstudiante,
  obtenerInfoCumpleanos,
  ordenarCumpleanos,
} from "../../../utils/dashboards/cumpleanos";

function CumpleanosDeLaSemana({ estudiantes, loading, error, ahora }) {
  if (loading) {
    return <p className="text-sm text-slate-500">Buscando cumpleaños de la semana…</p>;
  }
  if (error) {
    return <p className="text-sm font-semibold text-red-700">{error}</p>;
  }
  if (!estudiantes.length) {
    return <p className="text-sm text-slate-500">Esta semana no hay cumpleaños en tus cursos.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Cumpleaños de la semana">
      {ordenarCumpleanos(estudiantes, ahora).map((estudiante) => {
        const info = obtenerInfoCumpleanos(estudiante.fecha_nacimiento, ahora);
        const esHoy = info?.dias === 0;
        return (
          <li
            key={estudiante.estudiante_id || estudiante.id}
            className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              esHoy ? "border-amber-300 bg-amber-100 text-amber-950 shadow-sm" : "border-amber-200 bg-white/90 text-slate-800 shadow-sm"
            }`}
          >
            <span aria-hidden="true">{esHoy ? "🎉" : "🎈"}</span>
            <span className="truncate font-semibold" translate="no">{nombreCompletoEstudiante(estudiante)}</span>
            <span className="shrink-0 text-xs font-medium text-slate-500">
              {estudiante.curso ? `${estudiante.curso} · ` : ""}
              {info?.etiqueta || ""}
              {info?.edad ? ` · ${info.edad} años` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Lo primero del panel del profesor (2026-11-10): el saludo, el día de hoy,
 * el período con el que está trabajando y los cumpleaños de la semana, en una
 * va suelto sobre el fondo de la app (`fondo-aula`), sin caja: a la
 * izquierda el saludo y la fecha, a la derecha el período en una tarjeta
 * flotante y, debajo, los cumpleaños. Solo presenta: todo llega por props.
 */
function EncabezadoPanelProfesor({
  nombreProfesor,
  fechaDeHoy,
  periodo,
  cumpleanos = [],
  loadingCumpleanos = false,
  errorCumpleanos = "",
  ahora,
}) {
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

      <div className="mt-5 text-slate-800">
        <div className="flex flex-col gap-2 min-[600px]:flex-row min-[600px]:items-start min-[600px]:gap-3">
          <p className="flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1.5 text-sm font-bold text-amber-900">
            <span aria-hidden="true">🎂</span> Cumpleaños de la semana
          </p>
          <CumpleanosDeLaSemana
            estudiantes={cumpleanos}
            loading={loadingCumpleanos}
            error={errorCumpleanos}
            ahora={ahora}
          />
        </div>
      </div>
    </header>
  );
}

export default EncabezadoPanelProfesor;
