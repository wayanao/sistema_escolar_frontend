import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useImagenProtegida } from "../components/ImagenProtegida";
import { actualizarNotificacionesPlaneadores } from "../utils/notificacionesPlaneadores";
import api from "../utils/api";

const PAGE_SIZE = 12;
const ESTADOS = {
  pendiente: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  visto: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  con_observaciones: {
    label: "Revisado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  revisado: {
    label: "Revisado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

const ESTADOS_FILTRABLES = ["pendiente", "revisado"];

const VISTAS_FECHA = {
  realizadas: {
    label: "Anteriores",
    descripcion: "Clases con fecha anterior a hoy que ya debieron impartirse.",
  },
  programadas: {
    label: "Hoy y próximas",
    descripcion: "Clases de hoy y futuras que todavía están por impartirse.",
  },
  todas: {
    label: "Todas",
    descripcion: "Consulta el historial completo junto con la programación futura.",
  },
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

function normalizarRespuestaPlanes(data) {
  if (Array.isArray(data)) return { items: data, total: data.length };

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = Number(data?.total);
  return { items, total: Number.isFinite(total) ? total : items.length };
}

function fechaLocalISO(fecha = new Date()) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ayerISO() {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return fechaLocalISO(ayer);
}

function subirAlInicio() {
  const reducirMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: reducirMovimiento ? "auto" : "smooth" });
  });
}

function crearParametrosPlanes({ vista, filtros = {}, estado, limit = PAGE_SIZE, offset = 0 }) {
  const params = { limit, offset };

  Object.entries(filtros).forEach(([key, value]) => {
    if (value) params[key] = value;
  });

  if (estado && estado !== "todos") params.estado_revision = estado;
  if (vista === "realizadas") params.fecha_hasta = ayerISO();
  if (vista === "programadas") params.fecha_desde = fechaLocalISO();

  return params;
}

function formatearFecha(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatearTextoVisual(value) {
  const texto = String(value || "").trim();
  if (!texto || texto !== texto.toLocaleUpperCase("es-CO") || !/[A-ZÁÉÍÓÚÑ]{2}/.test(texto)) {
    return texto;
  }

  return texto
    .toLocaleLowerCase("es-CO")
    .replace(/(^|[\s-])(\p{L})/gu, (_, separador, letra) => `${separador}${letra.toLocaleUpperCase("es-CO")}`);
}

function detalleError(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.mensaje) return detail.mensaje;
  return fallback;
}

function PlaneadoresClasesAdmin() {
  const { planId } = useParams();
  return planId ? <DetallePlaneadorAdmin planId={planId} /> : <ListadoPlaneadoresAdmin />;
}

function ListadoPlaneadoresAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const vistaInicial = ["realizadas", "programadas", "todas"].includes(searchParams.get("vista"))
    ? searchParams.get("vista")
    : "programadas";
  const estadoInicial = ESTADOS_FILTRABLES.includes(searchParams.get("estado"))
    ? searchParams.get("estado")
    : "";
  const paginaInicial = Math.max(1, Number(searchParams.get("pagina")) || 1);
  const filtrosIniciales = {
    profesor_id: searchParams.get("profesor_id") || "",
    busqueda: searchParams.get("busqueda") || "",
  };

  const [profesores, setProfesores] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [total, setTotal] = useState(0);
  const [vista, setVista] = useState(vistaInicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [pagina, setPagina] = useState(paginaInicial);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales);
  const [cargando, setCargando] = useState(Boolean(vistaInicial && estadoInicial));
  const [conteoPendientes, setConteoPendientes] = useState(null);
  const [error, setError] = useState("");

  const seleccionCompleta = Boolean(vista && estado);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const desde = total === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, total);

  const queryActual = useMemo(() => {
    const query = new URLSearchParams();
    if (vista) query.set("vista", vista);
    if (estado) query.set("estado", estado);
    if (seleccionCompleta && pagina > 1) query.set("pagina", String(pagina));
    Object.entries(filtrosAplicados).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return query;
  }, [estado, filtrosAplicados, pagina, seleccionCompleta, vista]);

  useEffect(() => {
    setSearchParams(queryActual, { replace: true });
  }, [queryActual, setSearchParams]);

  useEffect(() => {
    const termino = filtros.busqueda.trim();
    const siguienteBusqueda = termino.length >= 2 ? termino : "";

    if (siguienteBusqueda === filtrosAplicados.busqueda) return undefined;

    const timeoutId = window.setTimeout(
      () => {
        setFiltrosAplicados((actual) =>
          actual.busqueda === siguienteBusqueda
            ? actual
            : { ...actual, busqueda: siguienteBusqueda },
        );
        setPagina(1);
      },
      siguienteBusqueda ? 120 : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [filtros.busqueda, filtrosAplicados.busqueda]);

  useEffect(() => {
    let activo = true;
    api
      .get("/profesores")
      .then((res) => {
        if (activo) setProfesores(Array.isArray(res.data) ? res.data : []);
      })
      .catch((requestError) => console.error("Error cargando profesores", requestError));
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!vista || !estado) {
      setPlanes([]);
      setTotal(0);
      setError("");
      setCargando(false);
      return undefined;
    }

    const controller = new AbortController();
    const cargar = async () => {
      setCargando(true);
      setError("");
      try {
        const params = crearParametrosPlanes({
          vista,
          filtros: filtrosAplicados,
          estado,
          limit: PAGE_SIZE,
          offset: (pagina - 1) * PAGE_SIZE,
        });

        const res = await api.get("/admin/plan-de-clases", {
          params,
          signal: controller.signal,
        });
        const respuesta = normalizarRespuestaPlanes(res.data);
        setPlanes(respuesta.items);
        setTotal(respuesta.total);
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          console.error("Error cargando planeadores", requestError);
          setPlanes([]);
          setTotal(0);
          setError("No fue posible cargar las planeaciones. Intenta nuevamente.");
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    cargar();
    return () => controller.abort();
  }, [estado, filtrosAplicados, pagina, vista]);

  useEffect(() => {
    if (!vista) {
      setConteoPendientes(null);
      return undefined;
    }

    const controller = new AbortController();

    const cargarConteos = async () => {
      setConteoPendientes(null);

      try {
        const respuesta = await api.get("/admin/plan-de-clases", {
          params: crearParametrosPlanes({
            vista,
            filtros: filtrosAplicados,
            estado: "pendiente",
            limit: 1,
            offset: 0,
          }),
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setConteoPendientes(normalizarRespuestaPlanes(respuesta.data).total);
        }
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          console.error("Error cargando contadores de planeaciones", requestError);
        }
      }
    };

    cargarConteos();
    return () => controller.abort();
  }, [filtrosAplicados, vista]);

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const cambiarProfesor = (profesorId) => {
    setFiltros((actual) => ({ ...actual, profesor_id: profesorId }));
    setFiltrosAplicados((actual) => ({ ...actual, profesor_id: profesorId }));
    setPagina(1);
  };

  const cambiarBusqueda = (busqueda) => {
    setFiltros((actual) => ({ ...actual, busqueda }));

    if (!busqueda.trim()) {
      setFiltrosAplicados((actual) =>
        actual.busqueda ? { ...actual, busqueda: "" } : actual,
      );
      setPagina(1);
    }
  };

  const limpiarBusqueda = () => {
    setFiltros((actual) => ({ ...actual, busqueda: "" }));
    setFiltrosAplicados((actual) => ({ ...actual, busqueda: "" }));
    setPagina(1);
  };

  const limpiarFiltros = () => {
    const vacios = { profesor_id: "", busqueda: "" };
    setFiltros(vacios);
    setFiltrosAplicados(vacios);
    setVista("");
    setEstado("");
    setPagina(1);
  };

  const abrirPlan = (id) => {
    const query = queryActual.toString();
    navigate(`/admin/planeadores-clases/${id}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-1 sm:py-3">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="relative px-5 py-6 sm:px-7">
            <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-100/70 blur-3xl" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="xl:max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Seguimiento académico</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Planeaciones de clase
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Revisa los envíos docentes desde una sola bandeja y abre cada clase en su propio espacio de trabajo.
                </p>
              </div>
              <div className="w-full rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3 shadow-[0_18px_40px_-26px_rgba(5,150,105,0.8)] xl:max-w-[520px]">
                <div className="flex items-start gap-3 px-1 pb-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100">
                    <IconoCalendario />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Vista por fecha</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                      {vista
                        ? VISTAS_FECHA[vista].descripcion
                        : "Elige el periodo de clases que quieres consultar."}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-emerald-100/80 p-1 ring-1 ring-emerald-200/70">
                  {Object.entries(VISTAS_FECHA).map(([value, config]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setVista(value);
                        setPagina(1);
                      }}
                      aria-pressed={vista === value}
                      className={`min-h-10 rounded-lg px-2 py-2 text-xs font-black leading-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:px-3 sm:text-sm ${
                        vista === value
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-emerald-800 hover:bg-white/75 hover:text-emerald-950"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-end">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Profesor</span>
              <select
                value={filtros.profesor_id}
                onChange={(event) => cambiarProfesor(event.target.value)}
                className={`${inputClass} mt-2 min-h-11`}
              >
                <option value="">Todos los profesores</option>
                {profesores.map((profesor) => (
                  <option key={profesor.id} value={profesor.id}>
                    {profesor.nombre} {profesor.apellido}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="min-w-0">
              <legend className="text-sm font-bold text-slate-700">Estado de revisión</legend>
              <div className="mt-2 flex min-h-11 flex-wrap items-center gap-2 px-1">
                {ESTADOS_FILTRABLES.map((value) => (
                  <FiltroEstado
                    key={value}
                    value={value}
                    actual={estado}
                    onChange={(siguiente) => {
                      setEstado(siguiente);
                      setPagina(1);
                    }}
                    label={ESTADOS[value].label}
                    count={value === "pendiente" ? conteoPendientes : null}
                    countTone="danger"
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-slate-900">
                {!seleccionCompleta
                  ? "Consulta de planeaciones"
                  : vista === "realizadas"
                    ? "Clases anteriores"
                    : vista === "programadas"
                      ? "Clases de hoy y próximas"
                      : "Todas las planeaciones"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {!seleccionCompleta
                  ? "Selecciona una vista por fecha y un estado para cargar las clases."
                  : cargando
                    ? estado === "pendiente"
                      ? "Actualizando planeaciones pendientes..."
                      : "Actualizando planeaciones revisadas..."
                    : total
                    ? `Mostrando ${desde}–${hasta} de ${total}`
                    : "Sin resultados para los filtros seleccionados"}
              </p>
            </div>
            {seleccionCompleta && (
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Página {pagina} de {totalPaginas}
              </span>
            )}
          </div>

          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
            <label htmlFor="buscar-historial-planeaciones" className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Buscar dentro del historial
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                id="buscar-historial-planeaciones"
                value={filtros.busqueda}
                onChange={(event) => cambiarBusqueda(event.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Escribe: mate, fracciones, tercero..."
                autoComplete="off"
                aria-describedby="ayuda-busqueda-planeaciones"
              />
              <button
                type="button"
                onClick={limpiarBusqueda}
                disabled={!filtros.busqueda && !filtrosAplicados.busqueda}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Limpiar
              </button>
            </div>
            <p id="ayuda-busqueda-planeaciones" className="mt-2 text-xs font-semibold text-slate-500">
              {filtros.busqueda.trim().length === 1
                ? "Escribe al menos 2 caracteres para comenzar a filtrar."
                : "Los resultados se actualizan automáticamente mientras escribes."}
            </p>
          </div>

          {!seleccionCompleta ? (
            <SeleccionPendiente vista={vista} estado={estado} />
          ) : error ? (
            <MensajeEstado tono="error" mensaje={error} />
          ) : cargando ? (
            <CargandoListado estado={estado} />
          ) : planes.length === 0 ? (
            <VacioListado
              tieneBusqueda={Boolean(filtrosAplicados.busqueda)}
              onLimpiar={filtrosAplicados.busqueda ? limpiarBusqueda : limpiarFiltros}
            />
          ) : (
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
                      <tr key={plan.id} className="group transition hover:bg-violet-50/45">
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-bold text-slate-800">{formatearFecha(plan.fecha)}</p>
                          <p className="mt-1 text-xs text-slate-500">Periodo {plan.periodo || 1}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <button
                            type="button"
                            onClick={() => abrirPlan(plan.id)}
                            className="w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                          >
                            <p className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-violet-800">
                              {plan.tema || "Plan sin tema"}
                            </p>
                            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-800">
                                <span className="truncate font-semibold">{plan.materia || "Sin materia"}</span>
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
                          <p className="truncate text-sm font-medium text-slate-700">{plan.profesor || "Sin docente"}</p>
                          <span
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-2.5 py-1 text-xs font-semibold text-violet-700"
                            title={`Esta planeación está en su revisión número ${plan.version_revision || 1}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />
                            Revisión {plan.version_revision || 1}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top"><EstadoBadge estado={plan.estado_revision} /></td>
                        <td className="px-5 py-4 text-right align-top">
                          <button
                            type="button"
                            onClick={() => abrirPlan(plan.id)}
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
                  <button key={plan.id} type="button" onClick={() => abrirPlan(plan.id)} className="block w-full p-4 text-left transition hover:bg-violet-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{plan.tema || "Plan sin tema"}</p>
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-800">
                            <span className="truncate font-semibold">{plan.materia || "Sin materia"}</span>
                          </span>
                          <span className="truncate text-xs font-medium text-slate-500">
                            Curso: {plan.curso || "Sin curso"}
                          </span>
                        </div>
                      </div>
                      <span className="mt-1 text-slate-400"><IconoFlecha /></span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <EstadoBadge estado={plan.estado_revision} />
                      <span className="text-xs font-semibold text-slate-500">{formatearFecha(plan.fecha)}</span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-2.5 py-1 text-xs font-semibold text-violet-700"
                        title={`Esta planeación está en su revisión número ${plan.version_revision || 1}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />
                        Revisión {plan.version_revision || 1}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">{plan.profesor || "Sin docente"}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {seleccionCompleta && (
            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} disabled={cargando} />
          )}
        </section>
      </div>
    </div>
  );
}

function DetallePlaneadorAdmin({ planId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [observaciones, setObservaciones] = useState([]);
  const [observacion, setObservacion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [accionRevision, setAccionRevision] = useState("");
  const [eliminandoImagen, setEliminandoImagen] = useState("");
  const [mensaje, setMensaje] = useState(null);

  const volver = useCallback(() => {
    const query = searchParams.toString();
    navigate(`/admin/planeadores-clases${query ? `?${query}` : ""}`);
  }, [navigate, searchParams]);

  const cargarDetalle = useCallback(async () => {
    setCargando(true);
    setMensaje(null);
    try {
      const [planResponse, observacionesResponse] = await Promise.all([
        api.get(`/admin/plan-de-clases/${planId}`),
        api.get(`/plan-de-clases/${planId}/observaciones`),
      ]);
      setObservaciones(Array.isArray(observacionesResponse.data) ? observacionesResponse.data : []);
      setPlan(planResponse.data);
    } catch (requestError) {
      console.error("Error cargando detalle del planeador", requestError);
      setPlan(null);
      setMensaje({ tono: "error", texto: detalleError(requestError, "No fue posible abrir esta planeación.") });
    } finally {
      setCargando(false);
    }
  }, [planId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const manejarConflicto = async (requestError) => {
    if (requestError.response?.status !== 409) return false;
    const texto = detalleError(requestError, "El plan cambió. Recargamos la versión más reciente.");
    await cargarDetalle();
    setMensaje({ tono: "aviso", texto });
    return true;
  };

  const marcarRevisado = async () => {
    const texto = observacion.trim();
    if (!plan || accionRevision) return;
    const yaEstabaRevisada = plan.estado_revision === "revisado";
    setAccionRevision("aprobar");
    setMensaje(null);
    try {
      const response = await api.patch(`/admin/plan-de-clases/${plan.id}/revision`, {
        estado: "revisado",
        version: plan.version_revision,
        comentario: texto || null,
      });
      const { observacion: observacionGuardada, ...revisionActualizada } = response.data;
      const comentarioGuardado = observacionGuardada
        ? { ...observacionGuardada, admin: "Administración" }
        : null;
      if (comentarioGuardado) {
        setObservaciones((actual) => [comentarioGuardado, ...actual]);
      }
      setPlan((actual) => ({
        ...actual,
        ...revisionActualizada,
        total_observaciones: Number(actual.total_observaciones || 0) + (comentarioGuardado ? 1 : 0),
      }));
      setObservacion("");
      actualizarNotificacionesPlaneadores();
      setMensaje({
        tono: "exito",
        texto: yaEstabaRevisada && comentarioGuardado
          ? "El reconocimiento fue enviado al profesor y la planeación continúa revisada."
          : comentarioGuardado
            ? "La planeación quedó revisada y el comentario fue enviado al profesor."
            : "La planeación quedó marcada como revisada.",
      });
      subirAlInicio();
    } catch (requestError) {
      if (!(await manejarConflicto(requestError))) {
        setMensaje({ tono: "error", texto: detalleError(requestError, "No se pudo marcar la planeación como revisada.") });
      }
    } finally {
      setAccionRevision("");
    }
  };

  const guardarObservacion = async (event) => {
    event.preventDefault();
    const texto = observacion.trim();
    if (!plan || !texto || accionRevision) return;
    setAccionRevision("ajuste");
    setMensaje(null);
    try {
      const response = await api.post(`/admin/plan-de-clases/${plan.id}/observaciones`, {
        observacion: texto,
        version: plan.version_revision,
      });
      const nueva = { ...response.data.observacion, admin: "Administración" };
      setObservaciones((actual) => [nueva, ...actual]);
      setPlan((actual) => ({
        ...actual,
        estado_revision: response.data.estado_revision,
        total_observaciones: Number(actual.total_observaciones || 0) + 1,
      }));
      setObservacion("");
      actualizarNotificacionesPlaneadores();
      setMensaje({ tono: "exito", texto: "La solicitud de ajuste fue enviada al profesor." });
      subirAlInicio();
    } catch (requestError) {
      if (!(await manejarConflicto(requestError))) {
        setMensaje({ tono: "error", texto: detalleError(requestError, "No se pudo enviar la solicitud de ajuste.") });
      }
    } finally {
      setAccionRevision("");
    }
  };

  const eliminarImagen = async (id, slot) => {
    const etiqueta = slot === "imagen1" ? "evidencia de desarrollo cognitivo" : "evidencia de actividad en casa";
    if (!window.confirm(`¿Quieres borrar la ${etiqueta} de esta planeación?`)) return;
    setEliminandoImagen(slot);
    setMensaje(null);
    try {
      await api.delete(`/admin/plan-de-clases/${id}/imagen`, { params: { slot } });
      setPlan((actual) => ({ ...actual, [slot]: null }));
      setMensaje({ tono: "exito", texto: "La evidencia fue eliminada." });
    } catch (requestError) {
      setMensaje({ tono: "error", texto: detalleError(requestError, "No se pudo eliminar la imagen.") });
    } finally {
      setEliminandoImagen("");
    }
  };

  if (cargando) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600"><Spinner /> Cargando planeación...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {mensaje && <MensajeEstado tono={mensaje.tono} mensaje={mensaje.texto} />}
        <button type="button" onClick={volver} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white">Volver a planeaciones</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-1 sm:py-3">
      <div className="space-y-5">
        <div>
          <button
            type="button"
            onClick={volver}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-800"
          >
            <IconoAtras /> Volver a la bandeja
          </button>
        </div>

        {mensaje && <MensajeEstado tono={mensaje.tono} mensaje={mensaje.texto} />}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <PlanRecibidoDetalle
            plan={plan}
            onEliminarImagen={eliminarImagen}
            eliminandoImagen={eliminandoImagen}
          />
        </section>

        <form onSubmit={guardarObservacion} className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-emerald-50/60 px-5 py-5 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Decisión administrativa</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Revisión y comentario al profesor</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Usa un solo comentario para reconocer el trabajo o indicar qué debe ajustarse. Elige la acción que corresponda al resultado de tu revisión.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <label htmlFor="comentario-revision" className="text-sm font-black text-slate-800">Comentario para el profesor</label>
            <textarea
              id="comentario-revision"
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              maxLength={3000}
              rows={4}
              className={`${inputClass} mt-2 resize-y`}
              placeholder="Ejemplo: Muy buen trabajo, la secuencia está clara y bien organizada."
            />
            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Obligatorio para solicitar un ajuste. Opcional para aprobar; si ya está revisada, puedes enviar un nuevo reconocimiento.
              </p>
              <span className="shrink-0 text-xs font-semibold text-slate-500">{observacion.length}/3000</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:justify-end lg:flex">
              <button
                type="submit"
                disabled={Boolean(accionRevision) || !observacion.trim()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-black text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {accionRevision === "ajuste" && <Spinner />}
                Solicitar ajuste
              </button>
              <button
                type="button"
                onClick={marcarRevisado}
                disabled={Boolean(accionRevision) || (plan.estado_revision === "revisado" && !observacion.trim())}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {accionRevision === "aprobar" ? <Spinner /> : <IconoCheck />}
                {plan.estado_revision === "revisado"
                  ? observacion.trim() ? "Enviar reconocimiento" : "Ya está revisada"
                  : "Aprobar planeación"}
              </button>
            </div>
          </div>
        </form>

        <HistorialObservaciones observaciones={observaciones} versionActual={plan.version_revision} />
      </div>
    </div>
  );
}

function PlanRecibidoDetalle({ plan, onEliminarImagen, eliminandoImagen }) {
  const tema = String(plan.tema || "").trim();
  const materia = formatearTextoVisual(plan.materia) || "Sin materia";
  const curso = formatearTextoVisual(plan.curso) || "Sin curso";
  const docente = formatearTextoVisual(plan.profesor) || "Docente sin nombre";
  const titulo = tema
    ? formatearTextoVisual(tema)
    : [plan.materia ? materia : "", plan.curso ? curso : ""].filter(Boolean).join(" · ") || "Planeación de clase";
  const inicialesDocente = docente
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toLocaleUpperCase("es-CO");
  const fundamentos = [
    { titulo: "Unidad", texto: plan.unidad },
    { titulo: "Logro", texto: plan.proposito },
    { titulo: "Estándar", texto: plan.estandar },
    { titulo: "Desarrollo cognitivo", texto: plan.dba },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_18px_45px_-34px_rgba(91,33,182,0.65)]">
        <div className="bg-gradient-to-br from-violet-50 via-white to-emerald-50/45 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Detalle del planeador</p>
              <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">{titulo}</h1>
              {!tema && (
                <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  Sin tema registrado
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <EstadoBadge estado={plan.estado_revision} />
                <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-black text-violet-800 shadow-sm">
                  Revisión {plan.version_revision || 1}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:mt-5 lg:max-w-sm lg:justify-end lg:pr-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-black text-white shadow-sm">
                {inicialesDocente || "D"}
              </span>
              <div className="min-w-0 lg:text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Docente</p>
                <p className="break-words text-sm font-bold text-slate-800">{docente}</p>
              </div>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-violet-100/80 sm:grid-cols-3 xl:grid-cols-6">
          <DatoResumen label="Materia" value={materia} />
          <DatoResumen label="Curso" value={curso} />
          <DatoResumen label="Periodo" value={plan.periodo || 1} />
          <DatoResumen label="Fecha" value={formatearFecha(plan.fecha)} />
          <DatoResumen label="Evidencias" value={[plan.imagen1, plan.imagen2].filter(Boolean).length} destacado />
          <DatoResumen label="Comentarios de admin" value={plan.total_observaciones || 0} destacado />
        </dl>
      </div>

      <section>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {fundamentos.map((item) => <DetallePlanBloque key={item.titulo} {...item} />)}
        </div>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-violet-50/55 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-sm font-black text-white">1</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-violet-800">Clase</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">{plan.clase || "Sin información"}</p>
          </div>
        </div>
      </section>

      <section>
        <TituloSeccion eyebrow="Actividades" titulo="Trabajo propuesto para estudiantes" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetallePlanBloque titulo="Actividad en clase" texto={plan.competencias} destacado />
          <DetallePlanBloque titulo="Actividad en casa" texto={plan.actividad_casa} destacado />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-5">
        <Evidencias plan={plan} onEliminarImagen={onEliminarImagen} eliminandoImagen={eliminandoImagen} />
      </section>
    </div>
  );
}

function HistorialObservaciones({ observaciones, versionActual }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Trazabilidad</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Historial de comentarios</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{observaciones.length}</span>
      </div>
      {observaciones.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Esta planeación todavía no tiene comentarios de revisión.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {observaciones.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-800">{item.admin || "Administración"}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.plan_version === versionActual ? "bg-violet-100 text-violet-800" : "bg-slate-200 text-slate-600"}`}>
                    Versión {item.plan_version}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500">{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.creada_at))}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.observacion}</p>
              <p className="mt-3 text-xs font-bold text-slate-500">{item.vista_por_profesor_at ? "Vista por el profesor" : "Pendiente de lectura"}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FiltroEstado({ value, actual, onChange, label, count = null, countTone = "danger" }) {
  const mostrarContador = Number.isFinite(count) && count > 0;
  const contadorClass = countTone === "warning" ? "bg-amber-500" : "bg-rose-600";

  return (
    <button
      type="button"
      onClick={() => onChange(actual === value ? "" : value)}
      aria-pressed={actual === value}
      aria-label={Number.isFinite(count) ? `${label}: ${count} planeaciones` : label}
      className={`relative rounded-full border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
        actual === value
          ? "border-violet-300 bg-violet-100 text-violet-900"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-800"
      }`}
    >
      {label}
      {mostrarContador && (
        <span
          className={`absolute -right-2.5 -top-2.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-black leading-none text-white shadow-sm ${contadorClass}`}
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function EstadoBadge({ estado }) {
  const config = ESTADOS[estado] || ESTADOS.pendiente;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${config.className}`}>{config.label}</span>;
}

function Paginacion({ pagina, totalPaginas, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:justify-end">
      <button type="button" onClick={() => onChange((actual) => Math.max(1, actual - 1))} disabled={disabled || pagina <= 1} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
      <span className="text-sm font-bold text-slate-600">{pagina} / {totalPaginas}</span>
      <button type="button" onClick={() => onChange((actual) => Math.min(totalPaginas, actual + 1))} disabled={disabled || pagina >= totalPaginas} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button>
    </div>
  );
}

function CargandoListado({ estado }) {
  const mensaje = estado === "pendiente"
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
          <Spinner className="h-7 w-7 border-[3px]" />
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
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><IconoDocumento /></div>
      <h3 className="mt-4 font-black text-slate-900">No encontramos planeaciones</h3>
      <p className="mt-2 text-sm text-slate-500">Prueba otra vista, estado, profesor, materia o tema.</p>
      <button type="button" onClick={onLimpiar} className="mt-4 text-sm font-black text-violet-700 hover:text-violet-900">
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
      <h3 className="mt-4 text-base font-black text-slate-900">Elige fecha y estado para comenzar</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        La bandeja permanecerá vacía hasta que definas qué periodo y qué estado deseas revisar.
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
                paso.completo ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
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

function MensajeEstado({ tono, mensaje }) {
  const styles = tono === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : tono === "exito" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800";
  const esExito = tono === "exito";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${styles} ${esExito ? "mensaje-estado-nuevo" : ""}`}
      role={esExito ? "status" : "alert"}
      aria-live={esExito ? "polite" : "assertive"}
    >
      {esExito ? (
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <IconoCheck />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Actualización nueva
            </p>
            <p className="mt-0.5 leading-6">{mensaje}</p>
          </div>
        </div>
      ) : mensaje}
    </div>
  );
}

function DatoResumen({ label, value, destacado = false }) {
  return (
    <div className={`min-w-0 px-4 py-3.5 ${destacado ? "bg-violet-50/90" : "bg-white"}`}>
      <dt className={`text-[11px] font-black uppercase tracking-wide ${destacado ? "text-violet-700" : "text-slate-500"}`}>
        {label}
      </dt>
      <dd className={`mt-1 break-words font-black leading-5 ${destacado ? "text-xl text-violet-950" : "text-sm text-slate-900"}`}>
        {value ?? "Sin dato"}
      </dd>
    </div>
  );
}

function TituloSeccion({ eyebrow, titulo }) {
  return <div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{eyebrow}</p><h3 className="mt-1 text-base font-black text-slate-950">{titulo}</h3></div>;
}

function DetallePlanBloque({ titulo, texto, destacado = false }) {
  return (
    <article className={`rounded-2xl border p-4 ${destacado ? "border-emerald-100 bg-emerald-50/65" : "border-slate-200 bg-white"}`}>
      <h4 className="text-base font-black text-violet-800">{titulo}</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">{texto || "Sin información"}</p>
    </article>
  );
}

function Evidencias({ plan, onEliminarImagen, eliminandoImagen }) {
  const imagenes = [
    { slot: "imagen1", path: plan.imagen1, label: "Evidencia de desarrollo cognitivo" },
    { slot: "imagen2", path: plan.imagen2, label: "Evidencia de actividad en casa" },
  ].filter((imagen) => Boolean(imagen.path));

  if (!imagenes.length) return <div><h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Evidencias</h3><p className="mt-2 text-sm text-slate-600">El profesor no adjuntó imágenes en esta planeación.</p></div>;

  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Evidencias enviadas</h3>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {imagenes.map((imagen) => <ImagenPlanCard key={imagen.slot} imagen={imagen} onEliminarImagen={() => onEliminarImagen(plan.id, imagen.slot)} eliminando={eliminandoImagen === imagen.slot} />)}
      </div>
    </div>
  );
}

function ImagenPlanCard({ imagen, onEliminarImagen, eliminando }) {
  const { url, cargando, error } = useImagenProtegida(imagen.path);
  const abrirImagen = () => { if (url) window.open(url, "_blank", "noopener,noreferrer"); };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <button type="button" onClick={abrirImagen} disabled={!url} className="block h-48 w-full transition hover:opacity-90 disabled:cursor-not-allowed">
        {cargando && <div className="flex h-full items-center justify-center text-sm text-slate-500">Cargando imagen...</div>}
        {error && !cargando && <div className="flex h-full items-center justify-center px-3 text-sm text-rose-600">{error}</div>}
        {url && !cargando && <img src={url} alt={imagen.label} className="h-full w-full object-contain" />}
      </button>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-3">
        <div><p className="text-sm font-bold text-slate-800">{imagen.label}</p><button type="button" onClick={abrirImagen} disabled={!url} className="text-xs font-bold text-violet-700 disabled:text-slate-400">Ver completa</button></div>
        <button type="button" onClick={onEliminarImagen} disabled={eliminando} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{eliminando && <Spinner />} Borrar</button>
      </div>
    </div>
  );
}

function Spinner({ className = "h-4 w-4 border-2" }) {
  return <span className={`${className} animate-spin rounded-full border-current border-r-transparent`} aria-hidden="true" />;
}

function IconoFlecha() {
  return <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconoAtras() {
  return <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M16 10H5M9 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconoCheck() {
  return <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconoEvidencia() {
  return <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2" /><path d="m5.5 13 3-3 2.5 2 2-2 2.5 3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconoDocumento() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" strokeLinejoin="round" /><path d="M14 3v5h4M10 12h5M10 16h5" strokeLinecap="round" /></svg>;
}

function IconoCalendario() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" strokeLinecap="round" /></svg>;
}

export default PlaneadoresClasesAdmin;
