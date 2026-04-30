import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function obtenerUrlImagen(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${apiBaseUrl}/${path.replaceAll("\\", "/").replace(/^\/+/, "")}`;
}

function PlaneadoresClasesAdmin() {
  const [profesores, setProfesores] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    profesor_id: "",
    fecha_desde: "",
    fecha_hasta: "",
    busqueda: "",
  });
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const profesorSeleccionado = useMemo(
    () => profesores.find((profesor) => String(profesor.id) === String(filtros.profesor_id)),
    [profesores, filtros.profesor_id],
  );

  const cargarProfesores = async () => {
    try {
      const res = await api.get("/profesores");
      setProfesores(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando profesores", error);
    }
  };

  const cargarPlanes = async () => {
    setCargando(true);
    try {
      const params = { limit: 50, offset: 0 };
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await api.get("/admin/plan-de-clases", { params });
      setPlanes(res.data.items || []);
      setTotal(res.data.total || 0);
      setSeleccionado((actual) => {
        if (actual && res.data.items?.some((plan) => plan.id === actual.id)) return actual;
        return res.data.items?.[0] || null;
      });
    } catch (error) {
      console.error("Error cargando planeadores", error);
      setPlanes([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProfesores();
  }, []);

  useEffect(() => {
    cargarPlanes();
  }, [filtros.profesor_id, filtros.fecha_desde, filtros.fecha_hasta]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
  };

  const buscar = (e) => {
    e.preventDefault();
    cargarPlanes();
  };

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Planeadores de clases</h1>
          <p className="mt-1 text-sm text-gray-600">
            Revisa los planes enviados por los profesores y filtra por responsable.
          </p>
        </div>
        <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-800">
          {total} envío{total === 1 ? "" : "s"}
        </div>
      </div>

      <form onSubmit={buscar} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Profesor</label>
            <select
              value={filtros.profesor_id}
              onChange={(e) => actualizarFiltro("profesor_id", e.target.value)}
              className={inputClass}
            >
              <option value="">Todos los profesores</option>
              {profesores.map((profesor) => (
                <option key={profesor.id} value={profesor.id}>
                  {profesor.nombre} {profesor.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => actualizarFiltro("fecha_desde", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => actualizarFiltro("fecha_hasta", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Buscar</label>
            <div className="flex gap-2">
              <input
                value={filtros.busqueda}
                onChange={(e) => actualizarFiltro("busqueda", e.target.value)}
                className={inputClass}
                placeholder="Tema, curso..."
              />
              <button className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800">
                Buscar
              </button>
            </div>
          </div>
        </div>
        {profesorSeleccionado && (
          <p className="mt-3 text-sm text-gray-600">
            Mostrando envíos de {profesorSeleccionado.nombre} {profesorSeleccionado.apellido}.
          </p>
        )}
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-900">{cargando ? "Cargando..." : "Envíos recibidos"}</h2>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {planes.length === 0 && (
              <div className="p-6 text-sm text-gray-600">No hay planeadores con esos filtros.</div>
            )}
            {planes.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSeleccionado(plan)}
                className={`block w-full border-b border-gray-100 p-4 text-left transition ${
                  seleccionado?.id === plan.id ? "bg-purple-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{plan.tema}</p>
                    <p className="mt-1 text-sm text-gray-600">{plan.profesor}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{plan.fecha}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {plan.materia} - {plan.curso}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          {!seleccionado ? (
            <div className="text-sm text-gray-600">Selecciona un envío para ver el reporte completo.</div>
          ) : (
            <div className="space-y-5">
              <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{seleccionado.tema}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {seleccionado.profesor} - {seleccionado.materia} - {seleccionado.curso}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 md:text-right">
                    <p>Fecha: {seleccionado.fecha}</p>
                    <p>Periodo: {seleccionado.periodo}</p>
                  </div>
                </div>
              </div>

              <Detalle titulo="Unidad" texto={seleccionado.unidad} />
              <Detalle titulo="Logro" texto={seleccionado.proposito} />
              <Detalle titulo="Clase" texto={seleccionado.clase} />
              <Detalle titulo="Estándar" texto={seleccionado.estandar} />
              <Detalle titulo="Desarrollo cognitivo" texto={seleccionado.dba} />
              <Detalle titulo="Actividad en clase" texto={seleccionado.competencias} />
              <Detalle titulo="Actividad en casa" texto={seleccionado.actividad_casa} />
              <Evidencias plan={seleccionado} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Evidencias({ plan }) {
  const imagenes = [plan.imagen1, plan.imagen2].filter(Boolean);

  if (imagenes.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Imágenes enviadas</h3>
        <p className="mt-1 text-sm text-gray-600">El profesor no adjuntó imágenes en este plan.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Imágenes enviadas</h3>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {imagenes.map((imagen, index) => {
          const url = obtenerUrlImagen(imagen);
          return (
            <a
              key={imagen}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition hover:border-purple-300"
            >
              <img
                src={url}
                alt={`Imagen ${index + 1} del plan de clases`}
                className="h-56 w-full object-contain"
              />
              <div className="border-t border-gray-200 bg-white px-3 py-2 text-sm font-medium text-purple-700">
                Ver imagen completa
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Detalle({ titulo, texto }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{titulo}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-900">{texto || "Sin información"}</p>
    </div>
  );
}

export default PlaneadoresClasesAdmin;
