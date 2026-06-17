import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImagenProtegida } from "../components/ImagenProtegida";
import api from "../utils/api";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";

const PAGE_SIZE = 20;

function normalizarRespuestaPlanes(data) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = Number(data?.total);

  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
  };
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
  const filtrosRef = useRef(filtros);
  const planesRef = useRef([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);

  const profesorSeleccionado = useMemo(
    () => profesores.find((profesor) => String(profesor.id) === String(filtros.profesor_id)),
    [profesores, filtros.profesor_id],
  );

  const cargarProfesores = useCallback(async () => {
    try {
      const res = await api.get("/profesores");
      setProfesores(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error cargando profesores", error);
    }
  }, []);

  const cargarPlanes = useCallback(async ({ append = false, nextOffset = 0 } = {}) => {
    if (append) {
      setCargandoMas(true);
    } else {
      setCargando(true);
    }

    try {
      const params = { limit: PAGE_SIZE, offset: nextOffset };
      Object.entries(filtrosRef.current).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await api.get("/admin/plan-de-clases", { params });
      const { items, total: totalRespuesta } = normalizarRespuestaPlanes(res.data);
      const listaActual = append ? planesRef.current : [];
      const vistos = new Set(listaActual.map((plan) => plan.id));
      const listaSiguiente = append ? [...listaActual, ...items.filter((plan) => !vistos.has(plan.id))] : items;

      planesRef.current = listaSiguiente;
      setPlanes(listaSiguiente);
      setTotal(totalRespuesta);
      setSeleccionado((actual) => {
        if (actual) {
          const actualizado = listaSiguiente.find((plan) => plan.id === actual.id);
          if (actualizado) return actualizado;
        }
        return listaSiguiente[0] || null;
      });
    } catch (error) {
      console.error("Error cargando planeadores", error);
      if (!append) {
        planesRef.current = [];
        setPlanes([]);
        setTotal(0);
      }
    } finally {
      setCargando(false);
      setCargandoMas(false);
    }
  }, []);

  useEffect(() => {
    cargarProfesores();
  }, [cargarProfesores]);

  useEffect(() => {
    cargarPlanes();
  }, [filtros.profesor_id, filtros.fecha_desde, filtros.fecha_hasta, cargarPlanes]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((actual) => {
      const siguientes = { ...actual, [campo]: valor };
      filtrosRef.current = siguientes;
      return siguientes;
    });
  };

  const buscar = (e) => {
    e.preventDefault();
    cargarPlanes({ append: false, nextOffset: 0 });
  };

  const cargarMas = () => {
    cargarPlanes({ append: true, nextOffset: planes.length });
  };

  const eliminarImagen = async (planId, slot) => {
    const nombreImagen = slot === "imagen1" ? "imagen 1" : "imagen 2";
    const confirmar = window.confirm(`¿Quieres borrar la ${nombreImagen} de este planeador?`);
    if (!confirmar) return;

    try {
      await api.delete(`/admin/plan-de-clases/${planId}/imagen`, { params: { slot } });

      const limpiarImagen = (plan) => (plan.id === planId ? { ...plan, [slot]: null } : plan);
      setPlanes((actual) => {
        const siguientes = actual.map(limpiarImagen);
        planesRef.current = siguientes;
        return siguientes;
      });
      setSeleccionado((actual) => (actual?.id === planId ? limpiarImagen(actual) : actual));
    } catch (error) {
      console.error("Error eliminando imagen", error);
      window.alert(error.response?.data?.detail || "No se pudo eliminar la imagen.");
    }
  };

  const hayMas = planes.length < total;
  const conEvidencia = planes.filter((plan) => plan.imagen1 || plan.imagen2).length;

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-6">
      <div className="space-y-6">
        <section className="rounded-lg border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Bandeja administrativa</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">Planeaciones recibidas</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Consulta los planes enviados por los docentes y acompaña el seguimiento académico de cada curso.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
              <ResumenDato label="Total" value={total} />
              <ResumenDato label="Mostrados" value={planes.length} />
              <ResumenDato label="Con evidencia" value={conEvidencia} />
            </div>
          </div>
        </section>

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,430px)_1fr]">
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-gray-900">{cargando ? "Cargando..." : "Envíos recibidos"}</h2>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800">
                  {planes.length} de {total}
                </span>
              </div>
            </div>
            <div className="max-h-[660px] overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1">
              {planes.length === 0 && (
                <div className="p-6 text-sm text-gray-600">No hay planeadores con esos filtros.</div>
              )}
              {planes.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSeleccionado(plan)}
                  className={`block w-full border-b border-gray-100 p-4 text-left transition ${
                    seleccionado?.id === plan.id ? "bg-purple-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-950">{plan.tema || "Plan sin tema"}</p>
                      <p className="mt-1 text-sm text-gray-600">{plan.profesor}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{plan.fecha}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    {plan.materia} - {plan.curso}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                      Periodo {plan.periodo}
                    </span>
                    {(plan.imagen1 || plan.imagen2) && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        Evidencia
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {hayMas && (
                <div className="p-4">
                  <button
                    type="button"
                    onClick={cargarMas}
                    disabled={cargandoMas}
                    className="w-full rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-800 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cargandoMas ? "Cargando..." : "Cargar más planeaciones"}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            {!seleccionado ? (
              <div className="text-sm text-gray-600">Selecciona un envío para ver el reporte completo.</div>
            ) : (
              <PlanRecibidoDetalle plan={seleccionado} onEliminarImagen={eliminarImagen} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function PlanRecibidoDetalle({ plan, onEliminarImagen }) {
  const fundamentos = [
    { titulo: "Unidad", etiqueta: "Eje de trabajo", texto: plan.unidad },
    { titulo: "Logro", etiqueta: "Intención", texto: plan.proposito },
    { titulo: "Estándar", etiqueta: "Referente", texto: plan.estandar },
    { titulo: "Desarrollo cognitivo", etiqueta: "Proceso", texto: plan.dba },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-sky-50">
        <div className="border-b border-white/80 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Reporte recibido</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-gray-950">{plan.tema || "Plan sin tema"}</h2>
              <p className="mt-2 text-sm font-medium text-gray-700">{plan.profesor}</p>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <ChipPlan label="Materia" value={plan.materia} />
              <ChipPlan label="Curso" value={plan.curso} />
              <ChipPlan label="Periodo" value={plan.periodo} />
              <ChipPlan label="Fecha" value={plan.fecha} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-purple-100/70 sm:grid-cols-3">
          <MiniDato label="Campos revisados" value="7" />
          <MiniDato label="Evidencias" value={plan.imagen1 || plan.imagen2 ? "Sí" : "No"} />
          <MiniDato label="Estado" value="Recibido" />
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fundamentos</p>
            <h3 className="text-base font-bold text-gray-950">Base pedagógica del plan</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {fundamentos.map((item) => (
            <DetallePlanBloque key={item.titulo} {...item} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-sm font-black text-white">
            1
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Ruta de clase</p>
            <h3 className="mt-1 text-lg font-bold text-gray-950">Clase</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-800">{plan.clase || "Sin información"}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Actividades</p>
          <h3 className="text-base font-bold text-gray-950">Trabajo propuesto para estudiantes</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetallePlanBloque
            titulo="Actividad en clase"
            etiqueta="Durante la jornada"
            texto={plan.competencias}
            destacado
          />
          <DetallePlanBloque
            titulo="Actividad en casa"
            etiqueta="Continuidad"
            texto={plan.actividad_casa}
            destacado
          />
        </div>
      </section>

      <section className="border-t border-gray-200 pt-5">
        <Evidencias plan={plan} onEliminarImagen={onEliminarImagen} />
      </section>
    </div>
  );
}

function ChipPlan({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-purple-100">
      <span className="text-purple-700">{label}:</span>
      <span className="text-gray-950">{value || "Sin dato"}</span>
    </span>
  );
}

function MiniDato({ label, value }) {
  return (
    <div className="bg-white/75 px-4 py-3">
      <p className="text-lg font-black text-gray-950">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function DetallePlanBloque({ titulo, etiqueta, texto, destacado = false }) {
  return (
    <article
      className={`rounded-lg border p-4 ${
        destacado ? "border-emerald-100 bg-emerald-50/70" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${destacado ? "text-emerald-700" : "text-purple-700"}`}>
            {etiqueta}
          </p>
          <h4 className="mt-1 text-base font-bold text-gray-950">{titulo}</h4>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{texto || "Sin información"}</p>
    </article>
  );
}

function ResumenDato({ label, value }) {
  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2">
      <p className="text-lg font-black text-purple-950">{value}</p>
      <p className="text-xs font-semibold text-purple-700">{label}</p>
    </div>
  );
}

function Evidencias({ plan, onEliminarImagen }) {
  const imagenes = [
    { slot: "imagen1", path: plan.imagen1, label: "Imagen 1" },
    { slot: "imagen2", path: plan.imagen2, label: "Imagen 2" },
  ].filter((imagen) => Boolean(imagen.path));

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
        {imagenes.map((imagen, index) => (
          <ImagenPlanCard
            key={imagen.slot}
            imagen={imagen}
            alt={`Imagen ${index + 1} del plan de clases`}
            onEliminarImagen={() => onEliminarImagen(plan.id, imagen.slot)}
          />
        ))}
      </div>
    </div>
  );
}

function ImagenPlanCard({ imagen, alt, onEliminarImagen }) {
  const { url, cargando, error } = useImagenProtegida(imagen.path);

  const abrirImagen = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={abrirImagen}
        disabled={!url}
        className="block h-40 w-full transition hover:opacity-90 disabled:cursor-not-allowed sm:h-48"
      >
        {cargando && <div className="flex h-full items-center justify-center text-sm text-gray-500">Cargando imagen...</div>}
        {error && !cargando && <div className="flex h-full items-center justify-center px-3 text-sm text-red-600">{error}</div>}
        {url && !cargando && <img src={url} alt={alt} className="h-full w-full object-contain" />}
      </button>
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{imagen.label}</p>
          <button
            type="button"
            onClick={abrirImagen}
            disabled={!url}
            className="text-xs font-medium text-purple-700 disabled:text-gray-400"
          >
            Ver imagen completa
          </button>
        </div>
        <button
          type="button"
          onClick={onEliminarImagen}
          className="rounded-md border border-red-200 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}

export default PlaneadoresClasesAdmin;
