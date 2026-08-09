import { formatearMomentoNotificacion } from "../../utils/planeaciones/notificacionesContratos";

function NotificacionesPlaneadoresVista({
  rol,
  abierto,
  total,
  totalProfesores,
  items,
  gruposAdmin,
  cargando,
  error,
  contenedorRef,
  onAlternar,
  onReintentar,
  onAbrirGrupo,
  onAbrirNotificacion,
  onVerTodos,
}) {
  return (
    <div ref={contenedorRef} className="static shrink-0 lg:relative">
      <button
        type="button"
        onClick={onAlternar}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={total ? `Notificaciones de planeadores: ${total} sin leer` : "Notificaciones de planeadores"}
        aria-expanded={abierto}
      >
        <IconoCampana />
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-purple-700 bg-rose-500 px-1 text-[10px] font-black leading-none text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute left-3 right-3 top-[3.75rem] z-[80] flex max-h-[calc(100dvh-4.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl sm:left-auto sm:right-6 sm:w-[390px] lg:left-auto lg:right-0 lg:top-12 lg:max-h-none">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
            <div>
              <p className="text-sm font-black text-slate-950">Notificaciones</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {rol === "admin" ? "Nuevas planeaciones docentes" : "Comentarios de administración"}
              </p>
            </div>
            {total > 0 && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">{total} nueva{total === 1 ? "" : "s"}</span>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-[min(420px,62vh)]">
            {cargando ? (
              <div className="flex items-center gap-2 p-5 text-sm font-semibold text-slate-500"><Spinner /> Actualizando...</div>
            ) : error ? (
              <div className="p-5">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
                <button type="button" onClick={onReintentar} className="mt-3 text-sm font-black text-violet-700">Reintentar</button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><IconoCheck /></div>
                <p className="mt-3 text-sm font-black text-slate-800">Todo está al día</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">No tienes notificaciones nuevas de planeaciones.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rol === "admin"
                  ? gruposAdmin.map((grupo) => (
                      <GrupoNotificacionesAdmin
                        key={grupo.id}
                        grupo={grupo}
                        onAbrir={() => onAbrirGrupo(grupo)}
                      />
                    ))
                  : items.map((item) => (
                      <NotificacionProfesor
                        key={`${item.tipo}-${item.id}`}
                        item={item}
                        onAbrir={() => onAbrirNotificacion(item)}
                      />
                    ))}
                {rol === "admin" && totalProfesores > gruposAdmin.length && (
                  <p className="bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                    Se muestran {gruposAdmin.length} de {totalProfesores} profesores con envíos pendientes.
                  </p>
                )}
              </div>
            )}
          </div>

          <button type="button" onClick={onVerTodos} className="block w-full shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs font-black text-violet-700 transition hover:bg-violet-50">
            {rol === "admin" ? "Abrir bandeja de planeaciones" : "Abrir plan de clases"}
          </button>
        </div>
      )}
    </div>
  );
}

function GrupoNotificacionesAdmin({ grupo, onAbrir }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Abrir ${grupo.cantidad} planeación${grupo.cantidad === 1 ? "" : "es"} pendiente${grupo.cantidad === 1 ? "" : "s"} de ${grupo.profesor}`}
      className="block w-full bg-white px-4 py-3.5 text-left transition hover:bg-violet-50/70 focus:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-300"
    >
      <span className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <IconoDocumento />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-900">{grupo.profesor}</span>
              <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                Último envío {formatearMomentoNotificacion(grupo.ultimaFecha)}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-black text-rose-700">
              {grupo.cantidad} {grupo.cantidad === 1 ? "planeación" : "planeaciones"}
            </span>
          </span>
          <span className="mt-2 block text-xs font-black text-violet-700">
            Abrir bandeja del profesor →
          </span>
        </span>
      </span>
    </button>
  );
}

function NotificacionProfesor({ item, onAbrir }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="block w-full px-4 py-3.5 text-left transition hover:bg-violet-50/70 focus:bg-violet-50 focus:outline-none"
    >
      <span className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <IconoComentario />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-slate-900">{item.admin || "Administración"}</span>
          <span className="mt-0.5 block truncate text-xs font-bold text-violet-700">
            {item.tema || "Plan sin tema"} · {item.materia} · {item.curso}
          </span>
          <span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-slate-600">{item.observacion}</span>
          <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">{formatearMomentoNotificacion(item.creada_at)}</span>
        </span>
      </span>
    </button>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}

function IconoCampana() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 8H3c0-1 3-1 3-8Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 21h4" strokeLinecap="round" /></svg>;
}

function IconoDocumento() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" strokeLinejoin="round" /><path d="M14 3v5h4M10 12h5M10 16h5" strokeLinecap="round" /></svg>;
}

function IconoComentario() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5h14v11H9l-4 3V5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 9h8M8 12h5" strokeLinecap="round" /></svg>;
}

function IconoCheck() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default NotificacionesPlaneadoresVista;
