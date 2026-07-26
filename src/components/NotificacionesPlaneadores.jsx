import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES } from "../utils/notificacionesPlaneadores";

function formatearMomento(value) {
  if (!value) return "";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

function agruparNotificacionesAdmin(items) {
  const grupos = new Map();

  items.forEach((item) => {
    const profesor = item.profesor?.trim() || "Profesor sin nombre";
    const profesorId = item.profesor_id ? String(item.profesor_id) : "";
    const clave = profesorId || profesor.toLocaleLowerCase("es-CO");
    const grupo = grupos.get(clave) || {
      id: `profesor-${clave}`,
      profesor,
      profesorId,
      cantidad: 0,
      ultimaFecha: null,
    };
    grupo.cantidad += Math.max(1, Number(item.cantidad) || 1);
    if (!grupo.ultimaFecha || new Date(item.creada_at) > new Date(grupo.ultimaFecha)) {
      grupo.ultimaFecha = item.creada_at;
    }
    grupos.set(clave, grupo);
  });

  return Array.from(grupos.values());
}

function NotificacionesPlaneadores({ rol, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const contenedorRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalProfesores, setTotalProfesores] = useState(0);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const gruposAdmin = useMemo(
    () => (rol === "admin" ? agruparNotificacionesAdmin(items) : []),
    [items, rol],
  );

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true);
    try {
      const response = await api.get("/notificaciones/planeadores", {
        params: { limit: rol === "admin" ? 20 : 8 },
      });
      setTotal(Number(response.data?.total_no_leidas) || 0);
      setTotalProfesores(Number(response.data?.total_profesores) || 0);
      setItems(Array.isArray(response.data?.items) ? response.data.items : []);
      setError("");
    } catch (requestError) {
      console.error("Error cargando notificaciones de planeadores", requestError);
      if (!silencioso) setError("No pudimos actualizar las notificaciones.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [rol]);

  useEffect(() => {
    cargar();
    const interval = window.setInterval(() => cargar({ silencioso: true }), 60_000);
    const actualizar = () => cargar({ silencioso: true });
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") actualizar();
    };
    window.addEventListener("focus", actualizar);
    window.addEventListener(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES, actualizar);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", actualizar);
      window.removeEventListener(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES, actualizar);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [cargar]);

  useEffect(() => {
    setAbierto(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const cerrarFuera = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };
    const cerrarEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, []);

  const abrirNotificacion = (item, profesor = "") => {
    setAbierto(false);
    onNavigate?.();
    if (rol === "admin") {
      const query = new URLSearchParams({
        vista: "todas",
        estado: "pendiente",
      });
      if (profesor) query.set("busqueda", profesor);
      navigate(`/admin/planeadores-clases/${item.plan_id}?${query.toString()}`);
      return;
    }

    const query = new URLSearchParams({
      asignacion_id: String(item.asignacion_id),
      fecha: String(item.fecha),
      plan_id: String(item.plan_id),
      observaciones: "1",
    });
    navigate(`/plan-de-clases?${query.toString()}`);
  };

  const verPlaneacionesProfesor = (grupo) => {
    setAbierto(false);
    onNavigate?.();
    const query = new URLSearchParams({
      vista: "todas",
      estado: "pendiente",
    });
    if (grupo.profesorId) query.set("profesor_id", grupo.profesorId);
    else query.set("busqueda", grupo.profesor);
    navigate(`/admin/planeadores-clases?${query.toString()}`);
  };

  const verTodos = () => {
    setAbierto(false);
    onNavigate?.();
    navigate(rol === "admin" ? "/admin/planeadores-clases" : "/plan-de-clases");
  };

  return (
    <div ref={contenedorRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
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
        <div className="absolute right-0 top-12 z-[80] w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
            <div>
              <p className="text-sm font-black text-slate-950">Notificaciones</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {rol === "admin" ? "Nuevas planeaciones docentes" : "Comentarios de administración"}
              </p>
            </div>
            {total > 0 && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">{total} nueva{total === 1 ? "" : "s"}</span>}
          </div>

          <div className="max-h-[min(420px,62vh)] overflow-y-auto">
            {cargando ? (
              <div className="flex items-center gap-2 p-5 text-sm font-semibold text-slate-500"><Spinner /> Actualizando...</div>
            ) : error ? (
              <div className="p-5">
                <p className="text-sm font-semibold text-rose-700">{error}</p>
                <button type="button" onClick={() => cargar()} className="mt-3 text-sm font-black text-violet-700">Reintentar</button>
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
                        onAbrir={() => verPlaneacionesProfesor(grupo)}
                      />
                    ))
                  : items.map((item) => (
                      <NotificacionProfesor
                        key={`${item.tipo}-${item.id}`}
                        item={item}
                        onAbrir={() => abrirNotificacion(item)}
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

          <button type="button" onClick={verTodos} className="block w-full border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs font-black text-violet-700 transition hover:bg-violet-50">
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
                Último envío {formatearMomento(grupo.ultimaFecha)}
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
          <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">{formatearMomento(item.creada_at)}</span>
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

export default NotificacionesPlaneadores;
