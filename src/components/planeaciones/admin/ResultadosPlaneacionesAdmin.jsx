import { formatearFecha } from "../../../utils/planeaciones/admin";
import {
  CLASE_CAMPO_PLANEACION_ADMIN,
  EstadoPlaneacionAdminBadge,
  MensajeEstadoPlaneacionAdmin,
  SpinnerPlaneacionAdmin,
} from "./ElementosPlaneacionAdmin";

function ResultadosPlaneacionesAdmin({
  planes,
  total,
  vista,
  estado,
  pagina,
  busqueda,
  busquedaAplicada,
  cargando,
  error,
  seleccionCompleta,
  totalPaginas,
  desde,
  hasta,
  onCambiarBusqueda,
  onLimpiarBusqueda,
  onLimpiarFiltros,
  onCambiarPagina,
  onAbrirPlan,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CabeceraResultados
        total={total}
        vista={vista}
        estado={estado}
        pagina={pagina}
        cargando={cargando}
        seleccionCompleta={seleccionCompleta}
        totalPaginas={totalPaginas}
        desde={desde}
        hasta={hasta}
      />

      <BusquedaPlaneacionesAdmin
        busqueda={busqueda}
        busquedaAplicada={busquedaAplicada}
        onCambiarBusqueda={onCambiarBusqueda}
        onLimpiarBusqueda={onLimpiarBusqueda}
      />

      {!seleccionCompleta ? (
        <SeleccionPendiente vista={vista} estado={estado} />
      ) : error ? (
        <MensajeEstadoPlaneacionAdmin tono="error" mensaje={error} />
      ) : cargando ? (
        <CargandoListado estado={estado} />
      ) : planes.length === 0 ? (
        <VacioListado
          tieneBusqueda={Boolean(busquedaAplicada)}
          onLimpiar={busquedaAplicada ? onLimpiarBusqueda : onLimpiarFiltros}
        />
      ) : (
        <ListadoPlaneaciones planes={planes} onAbrirPlan={onAbrirPlan} />
      )}

      {seleccionCompleta && (
        <Paginacion
          pagina={pagina}
          totalPaginas={totalPaginas}
          onChange={onCambiarPagina}
          disabled={cargando}
        />
      )}
    </section>
  );
}

function CabeceraResultados({
  total,
  vista,
  estado,
  pagina,
  cargando,
  seleccionCompleta,
  totalPaginas,
  desde,
  hasta,
}) {
  const titulo = !seleccionCompleta
    ? "Consulta de planeaciones"
    : vista === "realizadas"
      ? "Clases anteriores"
      : vista === "programadas"
        ? "Clases de hoy y próximas"
        : "Todas las planeaciones";

  const descripcion = !seleccionCompleta
    ? "Selecciona una vista por fecha y un estado para cargar las clases."
    : cargando
      ? estado === "pendiente"
        ? "Actualizando planeaciones pendientes..."
        : "Actualizando planeaciones revisadas..."
      : total
        ? `Mostrando ${desde}–${hasta} de ${total}`
        : "Sin resultados para los filtros seleccionados";

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-black text-slate-900">{titulo}</h2>
        <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
      </div>
      {seleccionCompleta && (
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Página {pagina} de {totalPaginas}
        </span>
      )}
    </div>
  );
}

function BusquedaPlaneacionesAdmin({
  busqueda,
  busquedaAplicada,
  onCambiarBusqueda,
  onLimpiarBusqueda,
}) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
      <label
        htmlFor="buscar-historial-planeaciones"
        className="text-xs font-black uppercase tracking-[0.12em] text-slate-500"
      >
        Buscar dentro del historial
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          id="buscar-historial-planeaciones"
          value={busqueda}
          onChange={(event) => onCambiarBusqueda(event.target.value)}
          className={`${CLASE_CAMPO_PLANEACION_ADMIN} flex-1`}
          placeholder="Escribe: mate, fracciones, tercero..."
          autoComplete="off"
          aria-describedby="ayuda-busqueda-planeaciones"
        />
        <button
          type="button"
          onClick={onLimpiarBusqueda}
          disabled={!busqueda && !busquedaAplicada}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Limpiar
        </button>
      </div>
      <p
        id="ayuda-busqueda-planeaciones"
        className="mt-2 text-xs font-semibold text-slate-500"
      >
        {busqueda.trim().length === 1
          ? "Escribe al menos 2 caracteres para comenzar a filtrar."
          : "Los resultados se actualizan automáticamente mientras escribes."}
      </p>
    </div>
  );
}

function ListadoPlaneaciones({ planes, onAbrirPlan }) {
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-[14%] px-5 py-3">Fecha</th>
              <th className="w-[31%] px-4 py-3">Planeación</th>
              <th className="w-[22%] px-4 py-3">Docente</th>
              <th className="w-[18%] px-4 py-3">Estado</th>
              <th className="w-[15%] px-5 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {planes.map((plan) => (
              <tr
                key={plan.id}
                className="group transition hover:bg-violet-50/45"
              >
                <td className="px-5 py-4 align-top">
                  <p className="text-sm font-bold text-slate-800">
                    {formatearFecha(plan.fecha)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Periodo {plan.periodo || 1}
                  </p>
                </td>
                <td className="px-4 py-4 align-top">
                  <button
                    type="button"
                    onClick={() => onAbrirPlan(plan.id)}
                    className="w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                  >
                    <p className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-violet-800">
                      {plan.tema || "Plan sin tema"}
                    </p>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-800">
                        <span className="truncate font-semibold">
                          {plan.materia || "Sin materia"}
                        </span>
                      </span>
                      <span className="truncate text-xs font-medium text-slate-500">
                        Curso: {plan.curso || "Sin curso"}
                      </span>
                    </div>
                    {(plan.imagen1 || plan.imagen2) && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <IconoEvidencia /> Con evidencia
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {plan.profesor || "Sin docente"}
                  </p>
                  <RevisionPlan version={plan.version_revision} />
                </td>
                <td className="px-4 py-4 align-top">
                  <EstadoPlaneacionAdminBadge estado={plan.estado_revision} />
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <button
                    type="button"
                    onClick={() => onAbrirPlan(plan.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-sm font-bold text-violet-800 transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    Abrir <IconoFlecha />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {planes.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onAbrirPlan(plan.id)}
            className="block w-full p-4 text-left transition hover:bg-violet-50/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {plan.tema || "Plan sin tema"}
                </p>
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-800">
                    <span className="truncate font-semibold">
                      {plan.materia || "Sin materia"}
                    </span>
                  </span>
                  <span className="truncate text-xs font-medium text-slate-500">
                    Curso: {plan.curso || "Sin curso"}
                  </span>
                </div>
              </div>
              <span className="mt-1 text-slate-400">
                <IconoFlecha />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EstadoPlaneacionAdminBadge estado={plan.estado_revision} />
              <span className="text-xs font-semibold text-slate-500">
                {formatearFecha(plan.fecha)}
              </span>
              <RevisionPlan version={plan.version_revision} />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {plan.profesor || "Sin docente"}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}

function RevisionPlan({ version }) {
  const numero = version || 1;

  return (
    <span
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-2.5 py-1 text-xs font-semibold text-violet-700"
      title={`Esta planeación está en su revisión número ${numero}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-violet-500"
        aria-hidden="true"
      />
      Revisión {numero}
    </span>
  );
}

function Paginacion({ pagina, totalPaginas, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:justify-end">
      <button
        type="button"
        onClick={() => onChange((actual) => Math.max(1, actual - 1))}
        disabled={disabled || pagina <= 1}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-sm font-bold text-slate-600">
        {pagina} / {totalPaginas}
      </span>
      <button
        type="button"
        onClick={() =>
          onChange((actual) => Math.min(totalPaginas, actual + 1))
        }
        disabled={disabled || pagina >= totalPaginas}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

function CargandoListado({ estado }) {
  const mensaje =
    estado === "pendiente"
      ? "Actualizando planeaciones pendientes..."
      : "Actualizando planeaciones revisadas...";

  return (
    <div
      className="flex min-h-64 items-center justify-center px-5 py-14"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
          <SpinnerPlaneacionAdmin className="h-7 w-7 border-[3px]" />
        </div>
        <h3 className="mt-4 text-sm font-black text-slate-900">{mensaje}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Estamos consultando la información más reciente.
        </p>
      </div>
    </div>
  );
}

function VacioListado({ onLimpiar, tieneBusqueda }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        <IconoDocumento />
      </div>
      <h3 className="mt-4 font-black text-slate-900">
        No encontramos planeaciones
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Prueba otra vista, estado, profesor, materia o tema.
      </p>
      <button
        type="button"
        onClick={onLimpiar}
        className="mt-4 text-sm font-black text-violet-700 hover:text-violet-900"
      >
        {tieneBusqueda ? "Quitar búsqueda" : "Limpiar filtros"}
      </button>
    </div>
  );
}

function SeleccionPendiente({ vista, estado }) {
  const pasos = [
    { numero: 1, label: "Vista por fecha", completo: Boolean(vista) },
    { numero: 2, label: "Estado de revisión", completo: Boolean(estado) },
  ];

  return (
    <div className="px-5 py-12 text-center sm:py-14">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        <IconoCalendario />
      </div>
      <h3 className="mt-4 text-base font-black text-slate-900">
        Elige fecha y estado para comenzar
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        La bandeja permanecerá vacía hasta que definas qué periodo y qué estado
        deseas revisar.
      </p>
      <div className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
        {pasos.map((paso) => (
          <div
            key={paso.numero}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold ${
              paso.completo
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                paso.completo
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {paso.completo ? "✓" : paso.numero}
            </span>
            {paso.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function IconoFlecha() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoEvidencia() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <path
        d="m5.5 13 3-3 2.5 2 2-2 2.5 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoDocumento() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M7 3h7l4 4v14H7z" strokeLinejoin="round" />
      <path d="M14 3v5h4M10 12h5M10 16h5" strokeLinecap="round" />
    </svg>
  );
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path
        d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default ResultadosPlaneacionesAdmin;
