import {
  ESTADOS_REVISION_PROFESOR,
  formatearFechaSeguimiento,
  obtenerEstadoRevisionVisual,
} from "../../../utils/planeaciones/profesor";
import EstadoRevisionBadge from "./EstadoRevisionBadge";

export default function SeguimientoPlanProfesor({
  seguimiento,
  observaciones,
  abierto,
  cargando,
  error,
  onAlternar,
}) {
  const estado = seguimiento.estado_revision || "pendiente";
  const noVistas = Number(seguimiento.observaciones_no_vistas) || 0;
  const totalObservaciones = Number(seguimiento.total_observaciones) || 0;
  const estadoVisual = obtenerEstadoRevisionVisual(
    estado,
    totalObservaciones,
  );
  const config = ESTADOS_REVISION_PROFESOR[estadoVisual];
  const fechaPrincipal = seguimiento.revisado_at
    ? `Revisado ${formatearFechaSeguimiento(seguimiento.revisado_at)}`
    : seguimiento.admin_visto_at
      ? `Visto ${formatearFechaSeguimiento(seguimiento.admin_visto_at)}`
      : seguimiento.enviado_at
        ? `Enviado ${formatearFechaSeguimiento(seguimiento.enviado_at)}`
        : "";

  return (
    <section className="overflow-hidden rounded-xl border border-l-4 border-violet-200 border-l-violet-500 bg-violet-50/70 shadow-sm">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <IconoSeguimiento estado={estadoVisual} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
                Seguimiento administrativo
              </p>
              <EstadoRevisionBadge
                estado={estado}
                totalObservaciones={totalObservaciones}
                compact
              />
              <span className="text-xs font-semibold text-violet-600">
                Versión {seguimiento.version_revision || 1}
              </span>
            </div>
            <div className="mt-1 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
              <h2 className="shrink-0 text-sm font-bold text-violet-950">
                {config.title}
              </h2>
              <p className="min-w-0 truncate text-xs text-slate-600">
                {config.detail}
              </p>
              {fechaPrincipal && (
                <span className="shrink-0 text-xs font-semibold text-violet-400">
                  {fechaPrincipal}
                </span>
              )}
            </div>
          </div>
        </div>

        {totalObservaciones > 0 && (
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={abierto}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition lg:w-auto ${
              noVistas > 0
                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border-violet-200 bg-white/80 text-violet-700 hover:bg-white"
            }`}
          >
            <IconoComentario />
            {abierto
              ? "Ocultar comentarios"
              : noVistas > 0
                ? `Ver ${noVistas} nuevo${noVistas === 1 ? "" : "s"}`
                : `Comentarios (${totalObservaciones})`}
          </button>
        )}
      </div>

      {abierto && (
        <div className="border-t border-violet-200 bg-white/65 p-4 sm:px-5">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-violet-950">
              Comentarios de administración
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Aquí encontrarás reconocimientos e indicaciones conservados por
              cada versión de la planeación.
            </p>
          </div>
          {cargando ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600">
              <SpinnerComentarios /> Cargando comentarios...
            </div>
          ) : (
            <HistorialObservacionesProfesor
              observaciones={observaciones}
              versionActual={seguimiento.version_revision}
              error={error}
            />
          )}
        </div>
      )}
    </section>
  );
}

function HistorialObservacionesProfesor({
  observaciones,
  versionActual,
  error,
}) {
  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {error}
        </div>
      )}
      {!error && observaciones.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600">
          No hay comentarios registrados para este plan.
        </div>
      )}
      {observaciones.map((item) => {
        const esVersionActual =
          Number(item.plan_version) === Number(versionActual);

        return (
          <article
            key={item.id}
            className={`rounded-xl border p-4 ${
              esVersionActual
                ? "border-violet-200 bg-white shadow-sm"
                : "border-slate-200 bg-white/75"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-slate-800">
                  {item.admin || "Administración"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    esVersionActual
                      ? "bg-violet-100 text-violet-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Versión {item.plan_version}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {formatearFechaSeguimiento(item.creada_at)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {item.observacion}
            </p>
            {!item.vista_por_profesor_at && (
              <p className="mt-3 text-xs font-bold text-amber-700">
                No fue posible confirmar la lectura.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function IconoSeguimiento({ estado }) {
  if (estado === "revisado") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          d="m5 12 4 4L19 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (estado === "revisado_con_observacion") return <IconoComentario />;
  if (estado === "visto") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="m4 12 16-8-5 16-3-6-8-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoComentario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M5 5h14v11H9l-4 3V5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 9h8M8 12h5" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerComentarios() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden="true"
    />
  );
}
