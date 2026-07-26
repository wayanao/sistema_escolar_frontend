import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import guiaDidacticaUtilesBg from "../assets/guia-didactica-utiles-bg.jpg";
import { useImagenProtegida } from "../components/ImagenProtegida";
import { actualizarNotificacionesPlaneadores } from "../utils/notificacionesPlaneadores";
import api from "../utils/api";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../utils/periodoProfesor";

const campoBase =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const PREFIJO_CAMPOS_RECORDADOS = "plan_clases_defaults";
const HISTORIAL_PAGE_SIZE = 3;

const ESTADOS_REVISION = {
  pendiente: {
    label: "Pendiente de revisión",
    title: "Enviado a administración",
    detail: "Tu planeación está disponible para que administración la revise.",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    iconClass: "bg-amber-100 text-amber-700",
  },
  revisado_con_observacion: {
    label: "Revisado con observación",
    title: "Planeación revisada con observación",
    detail: "Administración revisó esta planeación y dejó comentarios para que los tengas en cuenta.",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-800",
    iconClass: "bg-rose-100 text-rose-700",
  },
  revisado: {
    label: "Revisado",
    title: "Planeación revisada",
    detail: "Administración terminó la revisión de esta versión.",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconClass: "bg-emerald-100 text-emerald-700",
  },
};

function obtenerEstadoRevisionVisual(estado, totalObservaciones = 0) {
  if (!["revisado", "con_observaciones"].includes(estado)) return "pendiente";
  return Number(totalObservaciones) > 0 ? "revisado_con_observacion" : "revisado";
}

const estadoInicial = {
  unidad: "",
  proposito: "",
  clase: "",
  estandar: "",
  dba: "",
  competencias: "",
  actividad_casa: "",
  tema: "",
};

function crearClaveCamposRecordados(profesorId, asignacionId) {
  if (!profesorId || !asignacionId) return "";
  return `${PREFIJO_CAMPOS_RECORDADOS}_${profesorId}_${asignacionId}`;
}

function obtenerCamposRecordados(profesorId, asignacionId) {
  const clave = crearClaveCamposRecordados(profesorId, asignacionId);
  if (!clave) return {};

  try {
    const guardado = localStorage.getItem(clave);
    if (!guardado) return {};
    const data = JSON.parse(guardado);

    return {
      unidad: typeof data.unidad === "string" ? data.unidad : "",
      estandar: typeof data.estandar === "string" ? data.estandar : "",
    };
  } catch {
    return {};
  }
}

function guardarCamposRecordados(profesorId, asignacionId, form) {
  const clave = crearClaveCamposRecordados(profesorId, asignacionId);
  if (!clave) return;

  try {
    localStorage.setItem(
      clave,
      JSON.stringify({
        unidad: form.unidad || "",
        estandar: form.estandar || "",
      }),
    );
  } catch {
    // El guardado del plan no debe fallar si el navegador bloquea localStorage.
  }
}

function subirAlInicio() {
  const reducirMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: reducirMovimiento ? "auto" : "smooth" });
  });
}

function formatearFechaSeguimiento(value) {
  if (!value) return "";
  const fechaValue = new Date(value);
  if (Number.isNaN(fechaValue.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fechaValue);
}

function formatearFechaPlan(value) {
  if (!value) return "Sin fecha";
  const fechaValue = new Date(String(value).includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(fechaValue.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fechaValue);
}

function PlanDeClases() {
  const profesorStorage = localStorage.getItem("profesor");
  const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
  const profesorId = profesor?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const asignacionDesdeUrl = searchParams.get("asignacion_id") || "";
  const fechaDesdeUrl = searchParams.get("fecha") || "";

  const [asignacionId, setAsignacionId] = useState(asignacionDesdeUrl || localStorage.getItem("asignacionId") || "");
  const [clases, setClases] = useState([]);
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
  const [fecha, setFecha] = useState(fechaDesdeUrl || new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState(estadoInicial);
  const [imagenes, setImagenes] = useState({ imagen1: null, imagen2: null });
  const [imagenesGuardadas, setImagenesGuardadas] = useState({ imagen1: null, imagen2: null });
  const [historial, setHistorial] = useState([]);
  const [historialPagina, setHistorialPagina] = useState(0);
  const [historialHayMas, setHistorialHayMas] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [planActualId, setPlanActualId] = useState(null);
  const [seguimiento, setSeguimiento] = useState(null);
  const [observaciones, setObservaciones] = useState([]);
  const [observacionesAbiertas, setObservacionesAbiertas] = useState(false);
  const [cargandoObservaciones, setCargandoObservaciones] = useState(false);
  const [errorObservaciones, setErrorObservaciones] = useState("");
  const [cargandoClases, setCargandoClases] = useState(Boolean(profesorId));
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [avisoGuardadoId, setAvisoGuardadoId] = useState(0);
  const [presentacionAbierta, setPresentacionAbierta] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState({
    cargando: false,
    guardado: false,
    modificado: false,
    guardadoEn: null,
  });
  const imagenInputRefs = useRef({ imagen1: null, imagen2: null });
  const enlaceObservacionAbiertoRef = useRef("");
  const presentacionAutomaticaPendienteRef = useRef(searchParams.get("presentacion") === "1");

  const selectedClase = useMemo(
    () => clases.find((claseItem) => String(claseItem.id) === String(asignacionId)),
    [clases, asignacionId],
  );

  const clasesUnicas = useMemo(() => {
    const clasesPorCursoMateria = new Map();

    clases.forEach((claseItem) => {
      const clave = `${claseItem.curso}__${claseItem.materia}`;
      const esAsignacionActual = String(claseItem.id) === String(asignacionId);

      if (!clasesPorCursoMateria.has(clave) || esAsignacionActual) {
        clasesPorCursoMateria.set(clave, claseItem);
      }
    });

    return Array.from(clasesPorCursoMateria.values());
  }, [clases, asignacionId]);

  const imagenesSeleccionadas = useMemo(
    () =>
      Object.entries(imagenes).reduce((acc, [slot, imagen]) => {
        if (imagen) acc[slot] = { nombre: imagen.name, url: URL.createObjectURL(imagen) };
        return acc;
      }, {}),
    [imagenes],
  );

  useEffect(() => {
    return () => {
      Object.values(imagenesSeleccionadas).forEach((imagen) => URL.revokeObjectURL(imagen.url));
    };
  }, [imagenesSeleccionadas]);

  const limpiarInputsImagen = useCallback(() => {
    Object.values(imagenInputRefs.current).forEach((input) => {
      if (input) input.value = "";
    });
  }, []);

  const actualizarSeguimientoDesdePlan = useCallback((plan) => {
    if (!plan?.id) {
      setSeguimiento(null);
      setObservaciones([]);
      setObservacionesAbiertas(false);
      setErrorObservaciones("");
      return;
    }

    setSeguimiento({
      estado_revision: plan.estado_revision || "pendiente",
      version_revision: Number(plan.version_revision) || 1,
      enviado_at: plan.enviado_at || null,
      admin_visto_at: plan.admin_visto_at || null,
      revisado_at: plan.revisado_at || null,
      total_observaciones: Number(plan.total_observaciones) || 0,
      observaciones_no_vistas: Number(plan.observaciones_no_vistas) || 0,
      ultima_observacion_at: plan.ultima_observacion_at || null,
    });
    setObservaciones([]);
    setObservacionesAbiertas(false);
    setErrorObservaciones("");
  }, []);

  const actualizarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  };

  const actualizarPeriodo = (valor) => {
    setPeriodo(valor);
    guardarPeriodoProfesor(valor);
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  };

  const obtenerEstadoVisual = () => {
    if (estadoGuardado.cargando || cargando) {
      return {
        label: "Verificando",
        detail: "Consultando plan de la fecha",
        badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
        dotClass: "bg-slate-400",
        buttonText: "Guardar y enviar",
      };
    }

    if (estadoGuardado.modificado) {
      return {
        label: "Cambios sin guardar",
        detail: "Hay ediciones pendientes",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        dotClass: "bg-amber-500",
        buttonText: "Guardar cambios",
      };
    }

    if (estadoGuardado.guardado) {
      return {
        label: "Guardado",
        detail: estadoGuardado.guardadoEn ? `Actualizado ${estadoGuardado.guardadoEn}` : "Plan registrado",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-500",
        buttonText: "Actualizar plan",
      };
    }

    return {
      label: "Pendiente",
      detail: "Aún no se ha guardado",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
      dotClass: "bg-slate-400",
      buttonText: "Guardar y enviar",
    };
  };

  const cargarClases = useCallback(async () => {
    if (!profesorId) {
      setCargandoClases(false);
      return;
    }
    setCargandoClases(true);
    try {
      const res = await api.get(`/mis-clases/${profesorId}`);
      const data = res.data || [];
      setClases(data);
      setAsignacionId((actual) => {
        const existeAsignacionActual = data.some((claseItem) => String(claseItem.id) === String(actual));
        if (actual && existeAsignacionActual) return actual;
        if (data.length === 0) {
          localStorage.removeItem("asignacionId");
          return "";
        }
        const primeraAsignacion = String(data[0].id);
        localStorage.setItem("asignacionId", primeraAsignacion);
        return primeraAsignacion;
      });
    } catch (error) {
      console.error("Error cargando clases", error);
      setMensaje("No se pudieron cargar tus clases asignadas.");
    } finally {
      setCargandoClases(false);
    }
  }, [profesorId]);

  const cargarPlanDelDia = useCallback(async () => {
    if (!asignacionId || !fecha) return;
    setCargando(true);
    actualizarSeguimientoDesdePlan(null);
    setEstadoGuardado({
      cargando: true,
      guardado: false,
      modificado: false,
      guardadoEn: null,
    });
    try {
      const res = await api.get(`/plan-de-clases/${asignacionId}`, { params: { fecha } });
      const plan = res.data;
      if (plan) {
        setPlanActualId(plan.id);
        actualizarSeguimientoDesdePlan(plan);
        setImagenesGuardadas({ imagen1: plan.imagen1 || null, imagen2: plan.imagen2 || null });
        setPeriodo(String(plan.periodo || "1"));
        setForm({
          unidad: plan.unidad || "",
          proposito: plan.proposito || "",
          clase: plan.clase || "",
          estandar: plan.estandar || "",
          dba: plan.dba || "",
          competencias: plan.competencias || "",
          actividad_casa: plan.actividad_casa || "",
          tema: plan.tema || "",
        });
        setImagenes({ imagen1: null, imagen2: null });
        limpiarInputsImagen();
        setEstadoGuardado({
          cargando: false,
          guardado: true,
          modificado: false,
          guardadoEn: null,
        });
        setMensaje("Plan cargado para esta fecha.");
        if (presentacionAutomaticaPendienteRef.current) {
          presentacionAutomaticaPendienteRef.current = false;
          setPresentacionAbierta(true);
        }
      } else {
        setPlanActualId(null);
        actualizarSeguimientoDesdePlan(null);
        setImagenesGuardadas({ imagen1: null, imagen2: null });
        setImagenes({ imagen1: null, imagen2: null });
        limpiarInputsImagen();
        setForm({ ...estadoInicial, ...obtenerCamposRecordados(profesorId, asignacionId) });
        setEstadoGuardado({
          cargando: false,
          guardado: false,
          modificado: false,
          guardadoEn: null,
        });
        setMensaje("");
      }
    } catch (error) {
      console.error("Error cargando plan del día", error);
      setEstadoGuardado({
        cargando: false,
        guardado: false,
        modificado: false,
        guardadoEn: null,
      });
      setMensaje("No se pudo cargar el plan de esta fecha.");
      actualizarSeguimientoDesdePlan(null);
    } finally {
      setCargando(false);
    }
  }, [actualizarSeguimientoDesdePlan, asignacionId, fecha, limpiarInputsImagen, profesorId]);

  const cargarHistorial = useCallback(async (pagina = 0) => {
    if (!asignacionId) return;
    setCargandoHistorial(true);
    setErrorHistorial("");
    try {
      const res = await api.get(`/plan-de-clases/${asignacionId}`, {
        params: {
          limit: HISTORIAL_PAGE_SIZE + 1,
          offset: pagina * HISTORIAL_PAGE_SIZE,
        },
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setHistorial(items.slice(0, HISTORIAL_PAGE_SIZE));
      setHistorialHayMas(items.length > HISTORIAL_PAGE_SIZE);
      setHistorialPagina(pagina);
    } catch (error) {
      console.error("Error cargando historial", error);
      setErrorHistorial("No se pudo cargar el historial de esta clase.");
    } finally {
      setCargandoHistorial(false);
    }
  }, [asignacionId]);

  const alternarObservaciones = useCallback(async () => {
    if (observacionesAbiertas) {
      setObservacionesAbiertas(false);
      return;
    }
    if (!planActualId || cargandoObservaciones) return;

    setObservacionesAbiertas(true);
    setCargandoObservaciones(true);
    setErrorObservaciones("");
    try {
      const response = await api.get(`/plan-de-clases/${planActualId}/observaciones`);
      const items = Array.isArray(response.data) ? response.data : [];
      const resultados = await Promise.all(
        items.map(async (item) => {
          if (item.vista_por_profesor_at) return { item, confirmada: true };
          try {
            const vistaResponse = await api.patch(
              `/plan-de-clases/${planActualId}/observaciones/${item.id}/vista`,
            );
            return {
              item: {
                ...item,
                vista_por_profesor_at: vistaResponse.data.vista_por_profesor_at,
              },
              confirmada: true,
            };
          } catch (error) {
            console.error("Error confirmando lectura de observacion", error);
            return { item, confirmada: false };
          }
        }),
      );

      setObservaciones(resultados.map((resultado) => resultado.item));
      const pendientes = resultados.filter((resultado) => !resultado.confirmada).length;
      setSeguimiento((actual) => (
        actual ? { ...actual, observaciones_no_vistas: pendientes } : actual
      ));
      setHistorial((actual) => actual.map((plan) => (
        plan.id === planActualId ? { ...plan, observaciones_no_vistas: pendientes } : plan
      )));
      actualizarNotificacionesPlaneadores();
      if (pendientes) {
        setErrorObservaciones("Pudimos mostrar los comentarios, pero alguna lectura no logró confirmarse.");
      }
    } catch (error) {
      console.error("Error cargando observaciones del plan", error);
      setObservaciones([]);
      setErrorObservaciones(error.response?.data?.detail || "No se pudieron cargar los comentarios.");
    } finally {
      setCargandoObservaciones(false);
    }
  }, [cargandoObservaciones, observacionesAbiertas, planActualId]);

  useEffect(() => {
    const asignacionSolicitada = searchParams.get("asignacion_id");
    const fechaSolicitada = searchParams.get("fecha");
    if (asignacionSolicitada) setAsignacionId(asignacionSolicitada);
    if (fechaSolicitada) setFecha(fechaSolicitada);
  }, [searchParams]);

  useEffect(() => {
    const planSolicitado = searchParams.get("plan_id");
    const abrirObservaciones = searchParams.get("observaciones") === "1";
    if (!abrirObservaciones || !planSolicitado || String(planActualId) !== planSolicitado) return;

    const clave = `${planSolicitado}:${seguimiento?.version_revision || ""}`;
    if (enlaceObservacionAbiertoRef.current === clave) return;
    enlaceObservacionAbiertoRef.current = clave;
    if (!observacionesAbiertas) alternarObservaciones();

    const siguientes = new URLSearchParams(searchParams);
    siguientes.delete("observaciones");
    setSearchParams(siguientes, { replace: true });
  }, [
    alternarObservaciones,
    observacionesAbiertas,
    planActualId,
    searchParams,
    seguimiento?.version_revision,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!profesorId) {
      window.location.href = "/login";
      return;
    }
    cargarClases();
  }, [cargarClases, profesorId]);

  useEffect(() => {
    if (!asignacionId) return;
    localStorage.setItem("asignacionId", String(asignacionId));
    cargarPlanDelDia();
  }, [asignacionId, fecha, cargarPlanDelDia]);

  useEffect(() => {
    if (!asignacionId) return;
    setHistorial([]);
    setHistorialPagina(0);
    setHistorialHayMas(false);
    cargarHistorial(0);
  }, [asignacionId, cargarHistorial]);

  useEffect(() => {
    guardarPeriodoProfesor(periodo);
  }, [periodo]);

  const handleImageChange = (slot, e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setImagenes((actual) => ({ ...actual, [slot]: null }));
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Solo se permiten imagenes PNG, JPG, JPEG o WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      alert("La imagen no puede superar 5MB.");
      e.target.value = "";
      return;
    }

    setImagenes((actual) => ({ ...actual, [slot]: file }));
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  };

  const guardarPlan = async () => {
    const incompleto = !asignacionId || !periodo || !fecha;

    if (incompleto) {
      alert("Selecciona la clase, el periodo y la fecha antes de guardar.");
      return;
    }

    const formData = new FormData();
    formData.append("asignacion_id", asignacionId);
    formData.append(
      "version_esperada",
      String(planActualId ? Number(seguimiento?.version_revision) || 1 : 0),
    );
    formData.append("periodo", periodo);
    formData.append("fecha", fecha);
    Object.entries(form).forEach(([campo, valor]) => formData.append(campo, valor));
    if (imagenes.imagen1) formData.append("imagen1", imagenes.imagen1);
    if (imagenes.imagen2) formData.append("imagen2", imagenes.imagen2);

    setGuardando(true);
    try {
      const res = await api.post("/plan-de-clases", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const guardadoEn = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const mensajeExito = res.data.mensaje || "Plan guardado y enviado a administración.";

      guardarCamposRecordados(profesorId, asignacionId, form);
      setPlanActualId(res.data.id);
      setImagenes({ imagen1: null, imagen2: null });
      limpiarInputsImagen();
      setEstadoGuardado({
        cargando: false,
        guardado: true,
        modificado: false,
        guardadoEn,
      });
      setMensaje(mensajeExito);
      subirAlInicio();

      Promise.all([cargarPlanDelDia(), cargarHistorial()])
        .then(() => {
          setEstadoGuardado({
            cargando: false,
            guardado: true,
            modificado: false,
            guardadoEn,
          });
          setMensaje(mensajeExito);
          setAvisoGuardadoId((actual) => actual + 1);
        })
        .catch((reloadError) => {
          console.error("Error recargando plan despues de guardar", reloadError);
        });
    } catch (error) {
      if (error.response?.status === 409) {
        const detail = error.response?.data?.detail;
        const conflicto = await Swal.fire({
          icon: "warning",
          title: "Este plan cambió en otra pestaña",
          text:
            detail?.mensaje ||
            "Otra pestaña o dispositivo guardó una versión más reciente. Tus cambios no se sobrescribieron.",
          confirmButtonText: "Cargar versión reciente",
          confirmButtonColor: "#7c3aed",
          showCancelButton: true,
          cancelButtonText: "Seguir viendo mis cambios",
          reverseButtons: true,
        });

        if (conflicto.isConfirmed) {
          await Promise.all([cargarPlanDelDia(), cargarHistorial()]);
          subirAlInicio();
        } else {
          setMensaje("Tus cambios siguen visibles, pero todavía no se han guardado.");
        }
        return;
      }

      const esFalloDeConexion =
        !error.response && (error.code === "ERR_NETWORK" || Boolean(error.request));

      if (esFalloDeConexion) {
        const sinInternet = navigator.onLine === false;
        const conexion = await Swal.fire({
          icon: "warning",
          title: sinInternet ? "Sin conexión a internet" : "No pudimos conectar con el servidor",
          text: sinInternet
            ? "El plan no pudo guardarse. Tus textos e imágenes continúan en pantalla."
            : "Revisa tu conexión e inténtalo nuevamente. Tus cambios no se han perdido.",
          confirmButtonText: "Intentar de nuevo",
          confirmButtonColor: "#7c3aed",
          showCancelButton: true,
          cancelButtonText: "Seguir editando",
          reverseButtons: true,
          allowOutsideClick: false,
        });

        if (conexion.isConfirmed) {
          setGuardando(false);
          window.setTimeout(() => {
            void guardarPlan();
          }, 0);
        } else {
          setMensaje("El plan sigue sin guardar. Tus cambios continúan en pantalla.");
        }
        return;
      }

      console.error("Error guardando plan", error);
      Swal.fire("Error", error.response?.data?.detail || "Error al guardar", "error");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarImagenGuardada = async (slot) => {
    if (!planActualId) return;

    const nombreImagen = slot === "imagen1" ? "evidencia de desarrollo cognitivo" : "evidencia de actividad en casa";
    const confirmar = window.confirm(`¿Quieres borrar la ${nombreImagen} de este plan?`);
    if (!confirmar) return;

    try {
      await api.delete(`/plan-de-clases/${planActualId}/imagen`, { params: { slot } });
      setImagenesGuardadas((actual) => ({ ...actual, [slot]: null }));
      setHistorial((actual) =>
        actual.map((plan) => (plan.id === planActualId ? { ...plan, [slot]: null } : plan)),
      );
      await Promise.all([cargarPlanDelDia(), cargarHistorial()]);
      setEstadoGuardado({
        cargando: false,
        guardado: true,
        modificado: false,
        guardadoEn: new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setMensaje("Imagen eliminada correctamente.");
    } catch (error) {
      console.error("Error eliminando imagen", error);
      window.alert(error.response?.data?.detail || "No se pudo eliminar la imagen.");
    }
  };

  const estadoVisual = obtenerEstadoVisual();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-amber-50/50 p-2 sm:p-6">
      <div className="space-y-6">
        <section className="rounded-xl border border-purple-100 bg-white/95 px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-10 w-1 shrink-0 rounded-full bg-purple-600" aria-hidden="true"></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <h1 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">Plan de clases</h1>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Taller docente</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-600">
                  Diseña la clase del día con propósito, actividades y evidencias claras.
                </p>
              </div>
            </div>
            <div
              key={`aviso-guardado-${avisoGuardadoId}`}
              className={`flex w-full items-center gap-2.5 rounded-full border px-3.5 py-2 text-xs shadow-sm sm:w-auto ${estadoVisual.badgeClass} ${avisoGuardadoId > 0 ? "estado-guardado-campana" : ""}`}
              role="status"
              aria-live="polite"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${estadoVisual.dotClass}`} aria-hidden="true"></span>
              <span className="shrink-0 font-bold">{estadoVisual.label}</span>
              <span className="h-4 w-px shrink-0 bg-current opacity-20" aria-hidden="true"></span>
              <span className="min-w-0 truncate font-medium opacity-80">{estadoVisual.detail}</span>
              {planActualId && (
                <>
                  <span className="hidden h-4 w-px shrink-0 bg-current opacity-20 sm:block" aria-hidden="true"></span>
                  <span className="hidden shrink-0 font-semibold opacity-70 sm:inline">Plan #{planActualId}</span>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-950">Configura tu clase</h2>
            <p className="mt-0.5 text-xs text-gray-500">Selecciona dónde y cuándo vas a desarrollar la planeación.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-10">
            <div className="md:col-span-5">
              <label htmlFor="plan-clase-asignada" className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                  </svg>
                </span>
                Clase asignada
              </label>
              <select
                id="plan-clase-asignada"
                value={asignacionId}
                onChange={(e) => {
                  const nuevaAsignacionId = e.target.value;
                  setCargando(Boolean(nuevaAsignacionId));
                  setAsignacionId(nuevaAsignacionId);
                }}
                disabled={cargandoClases}
                className={campoBase}
              >
                <option value="">{cargandoClases ? "Cargando clases..." : "Selecciona una clase"}</option>
                {clasesUnicas.map((claseItem) => (
                  <option key={claseItem.id} value={claseItem.id}>
                    {claseItem.materia} - {claseItem.curso}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="plan-periodo" className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 2v4M16 2v4M3 10h18" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                  </svg>
                </span>
                Periodo
              </label>
              <select id="plan-periodo" value={periodo} onChange={(e) => actualizarPeriodo(e.target.value)} className={campoBase}>
                <option value="1">Periodo 1</option>
                <option value="2">Periodo 2</option>
                <option value="3">Periodo 3</option>
                <option value="4">Periodo 4</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="plan-fecha" className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 2v4M16 2v4M3 10h18" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                  </svg>
                </span>
                Fecha
              </label>
              <input
                id="plan-fecha"
                type="date"
                value={fecha}
                onChange={(e) => {
                  const nuevaFecha = e.target.value;
                  setCargando(Boolean(asignacionId && nuevaFecha));
                  setFecha(nuevaFecha);
                }}
                className={campoBase}
              />
            </div>
          </div>

        </section>

        {planActualId && seguimiento && (
          <SeguimientoPlanProfesor
            seguimiento={seguimiento}
            observaciones={observaciones}
            abierto={observacionesAbiertas}
            cargando={cargandoObservaciones}
            error={errorObservaciones}
            onAlternar={alternarObservaciones}
          />
        )}

        <div className="space-y-6">
          <section
            className="rounded-xl border border-purple-200 bg-purple-100 p-4 shadow-sm sm:p-6"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.22)), url(${guiaDidacticaUtilesBg})`,
              backgroundPosition: "top center",
              backgroundRepeat: "repeat-y",
              backgroundSize: "100% auto",
            }}
          >
            <div className="mb-4 rounded-lg border border-white/70 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-950">Guía didáctica</h2>
                  <p className="text-sm text-gray-600">Organiza la intención, la ruta de clase y las evidencias de aprendizaje.</p>
                </div>
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  {selectedClase && (
                    <div
                      className="flex w-fit max-w-full shrink-0 items-center gap-2 overflow-hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm"
                      title={`${selectedClase.materia} · ${selectedClase.curso} · ${selectedClase.jornada || "Sin jornada"}`}
                      aria-label={`Materia ${selectedClase.materia}, curso ${selectedClase.curso}, jornada ${selectedClase.jornada || "sin definir"}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                        </svg>
                      </span>
                      <span className="min-w-0 max-w-52 truncate sm:max-w-64">{selectedClase.materia}</span>
                      <span className="h-4 w-px shrink-0 bg-emerald-200" aria-hidden="true"></span>
                      <span className="shrink-0">{selectedClase.curso}</span>
                      <span className="h-4 w-px shrink-0 bg-emerald-200" aria-hidden="true"></span>
                      <span className="shrink-0">{selectedClase.jornada || "Sin jornada"}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPresentacionAbierta(true)}
                    disabled={!selectedClase || cargandoClases || cargando}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-violet-200 bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="13" rx="2" />
                      <path d="M8 21h8M12 17v4M8 9l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Presentación de clase
                  </button>
                </div>
              </div>
            </div>
            {cargandoClases || cargando ? (
              <CargandoGuiaDidactica />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-9 w-1 shrink-0 rounded-full bg-purple-600" aria-hidden="true"></span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-950 sm:text-base">Contexto pedagógico</h3>
                      <p className="mt-0.5 text-xs text-gray-500">Define el enfoque y el propósito de la clase.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <CampoTextarea
                      label="Unidad"
                      value={form.unidad}
                      onChange={(valor) => actualizarCampo("unidad", valor)}
                      placeholder="Nombre de la unidad o eje de trabajo"
                      rows={2}
                    />
                    <CampoTextarea
                      label="Tema"
                      value={form.tema}
                      onChange={(valor) => actualizarCampo("tema", valor)}
                      placeholder="Tema central de la clase"
                      rows={2}
                    />
                    <CampoTextarea
                      label="Logro"
                      value={form.proposito}
                      onChange={(valor) => actualizarCampo("proposito", valor)}
                      placeholder="Qué se espera que logren los estudiantes"
                      rows={3}
                    />
                    <CampoTextarea
                      label="Estándar / Lineamientos curriculares"
                      value={form.estandar}
                      onChange={(valor) => actualizarCampo("estandar", valor)}
                      placeholder="Estándar, lineamientos curriculares o referente curricular"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-purple-50/50 p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-9 w-1 shrink-0 rounded-full bg-sky-500" aria-hidden="true"></span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-950 sm:text-base">Desarrollo de la clase</h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Describe la secuencia y las actividades que realizarán los estudiantes.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <CampoTextarea
                      label="Clase"
                      value={form.clase}
                      onChange={(valor) => actualizarCampo("clase", valor)}
                      placeholder="Apertura, desarrollo y cierre"
                      rows={6}
                    />
                    <CampoTextarea
                      label="Actividad en clase"
                      value={form.competencias}
                      onChange={(valor) => actualizarCampo("competencias", valor)}
                      placeholder="Trabajo individual, grupal, práctica o evidencia"
                      rows={6}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-9 w-1 shrink-0 rounded-full bg-amber-500" aria-hidden="true"></span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-950 sm:text-base">Evidencias y continuidad</h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Registra el desarrollo cognitivo y el trabajo que continuará en casa.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-4 rounded-xl border border-purple-200 bg-gradient-to-b from-purple-50/90 to-white p-4 shadow-sm sm:p-5">
                      <div>
                        <p className="text-sm font-semibold text-purple-950">Desarrollo cognitivo</p>
                        <p className="mt-0.5 text-xs text-purple-700/80">Proceso principal y evidencia asociada.</p>
                      </div>
                      <CampoTextarea
                        label="Descripción"
                        value={form.dba}
                        onChange={(valor) => actualizarCampo("dba", valor)}
                        placeholder="Proceso, habilidad o DBA relacionado"
                        rows={5}
                      />
                      <EvidenciaCampo
                        id="evidencia-desarrollo-cognitivo"
                        label="Evidencia de desarrollo cognitivo"
                        descripcion="Adjunta una foto relacionada con este desarrollo."
                        inputRef={(el) => {
                          imagenInputRefs.current.imagen1 = el;
                        }}
                        seleccionada={imagenesSeleccionadas.imagen1}
                        guardada={imagenesGuardadas.imagen1}
                        onChange={(e) => handleImageChange("imagen1", e)}
                        onEliminarImagen={() => eliminarImagenGuardada("imagen1")}
                      />
                    </div>
                    <div className="space-y-4 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50/90 to-white p-4 shadow-sm sm:p-5">
                      <div>
                        <p className="text-sm font-semibold text-amber-950">Actividad en casa</p>
                        <p className="mt-0.5 text-xs text-amber-700/80">Continuidad del aprendizaje y evidencia asociada.</p>
                      </div>
                      <CampoTextarea
                        label="Descripción"
                        value={form.actividad_casa}
                        onChange={(valor) => actualizarCampo("actividad_casa", valor)}
                        placeholder="Refuerzo, consulta o producción para casa"
                        rows={5}
                      />
                      <EvidenciaCampo
                        id="evidencia-actividad-casa"
                        label="Evidencia de actividad en casa"
                        descripcion="Adjunta una foto relacionada con la actividad enviada."
                        inputRef={(el) => {
                          imagenInputRefs.current.imagen2 = el;
                        }}
                        seleccionada={imagenesSeleccionadas.imagen2}
                        guardada={imagenesGuardadas.imagen2}
                        onChange={(e) => handleImageChange("imagen2", e)}
                        onEliminarImagen={() => eliminarImagenGuardada("imagen2")}
                        tono="amber"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-100 via-purple-50 to-emerald-50 p-1 shadow-lg shadow-violet-100/80">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-500" aria-hidden="true"></span>
            <div className="relative rounded-[0.8rem] bg-white/90 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-200" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 4h12l2 2v14H5V4Z" strokeLinejoin="round" />
                      <path d="M8 4v6h8V4M8 20v-6h8v6" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">Último paso</p>
                    <h2 className="mt-0.5 text-lg font-bold text-slate-950 sm:text-xl">Guardar plan</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                      Confirma tu planeación cuando esté lista. Los campos pueden guardarse aunque alguno permanezca vacío.
                    </p>
                  </div>
                </div>

                <div className="w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={guardarPlan}
                    disabled={guardando || cargando}
                    aria-busy={guardando}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-violet-300 disabled:to-purple-300 disabled:shadow-none lg:w-auto lg:min-w-48"
                  >
                    {guardando ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
                    ) : (
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                        <path d="M4 3h10l2 2v12H4V3Z" strokeLinejoin="round" />
                        <path d="M7 3v5h6V3M7 17v-5h6v5" strokeLinejoin="round" />
                      </svg>
                    )}
                    {guardando ? "Guardando..." : estadoVisual.buttonText}
                  </button>
                </div>
              </div>

              {mensaje && (
                <div className="mt-4 flex items-start gap-2.5 border-t border-violet-100 pt-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700" aria-hidden="true">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v4M10 14h.01" strokeLinecap="round" />
                      <circle cx="10" cy="10" r="8" />
                    </svg>
                  </span>
                  <p className="leading-5">{mensaje}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {asignacionId && (cargandoHistorial || errorHistorial || historial.length > 0 || historialPagina > 0) && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-emerald-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M8 14h3M8 18h7" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-950 sm:text-lg">Planes guardados de esta clase</h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Consulta las planeaciones desde las más recientes hacia las más antiguas.
                  </p>
                </div>
              </div>
              <span className="w-fit shrink-0 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm">
                3 planes por vista
              </span>
            </div>

            <div className="p-4 sm:p-6">
              {errorHistorial && (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
                  <span className="font-semibold">{errorHistorial}</span>
                  <button
                    type="button"
                    onClick={() => cargarHistorial(historialPagina)}
                    className="w-fit rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {cargandoHistorial ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" role="status" aria-label="Cargando planes guardados">
                  {Array.from({ length: HISTORIAL_PAGE_SIZE }).map((_, index) => (
                    <div key={index} className="flex min-h-56 animate-pulse flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="h-7 w-28 rounded-full bg-slate-200"></div>
                      <div className="mt-5 h-5 w-4/5 rounded bg-slate-200"></div>
                      <div className="mt-3 h-4 w-full rounded bg-slate-200"></div>
                      <div className="mt-2 h-4 w-2/3 rounded bg-slate-200"></div>
                      <div className="mt-auto h-9 w-full rounded-lg bg-slate-200"></div>
                    </div>
                  ))}
                </div>
              ) : historial.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {historial.map((plan) => {
                      const esPlanEnEdicion = String(plan.fecha) === String(fecha);
                      const nuevas = Number(plan.observaciones_no_vistas) || 0;

                      return (
                        <article
                          key={plan.id}
                          className={`group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            esPlanEnEdicion
                              ? "border-emerald-300 ring-2 ring-emerald-100"
                              : "border-slate-200 hover:border-violet-300"
                          }`}
                        >
                          <span
                            className={`absolute inset-x-0 top-0 h-1 ${
                              esPlanEnEdicion
                                ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                : "bg-gradient-to-r from-violet-500 to-purple-400"
                            }`}
                            aria-hidden="true"
                          ></span>

                          <div className="flex items-start justify-between gap-3 pt-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                <path d="M6 2v3M14 2v3M3 8h14" strokeLinecap="round" />
                                <rect x="3" y="4" width="14" height="14" rx="2" />
                              </svg>
                              {formatearFechaPlan(plan.fecha)}
                            </span>
                            <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                              Periodo {plan.periodo || 1}
                            </span>
                          </div>

                          <div className="mt-4 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-violet-600">Tema de la clase</p>
                            <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-slate-950">
                              {plan.tema || "Sin tema registrado"}
                            </h3>
                            <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
                              <span className="font-semibold text-slate-700">Unidad:</span>{" "}
                              {plan.unidad || "Sin unidad registrada"}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                            <EstadoRevisionBadge
                              estado={plan.estado_revision}
                              totalObservaciones={plan.total_observaciones}
                              compact
                            />
                            {esPlanEnEdicion && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                Plan en edición
                              </span>
                            )}
                            {nuevas > 0 && (
                              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                                {nuevas} nueva{nuevas === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              disabled={esPlanEnEdicion}
                              onClick={() => {
                                if (esPlanEnEdicion) return;
                                setCargando(true);
                                setFecha(plan.fecha);
                                subirAlInicio();
                              }}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-default disabled:bg-emerald-600"
                            >
                              {esPlanEnEdicion ? "En edición" : "Abrir plan"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-center text-xs font-semibold text-slate-500 sm:text-left">
                      Mostrando planes {historialPagina * HISTORIAL_PAGE_SIZE + 1}–{historialPagina * HISTORIAL_PAGE_SIZE + historial.length}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <button
                        type="button"
                        disabled={historialPagina === 0 || cargandoHistorial}
                        onClick={() => cargarHistorial(historialPagina - 1)}
                        className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Más recientes
                      </button>
                      <button
                        type="button"
                        disabled={!historialHayMas || cargandoHistorial}
                        onClick={() => cargarHistorial(historialPagina + 1)}
                        className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Cargar 3 más antiguas
                      </button>
                    </div>
                  </div>
                </>
              ) : !errorHistorial ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">No hay planes guardados en esta parte del historial.</p>
                  {historialPagina > 0 && (
                    <button
                      type="button"
                      onClick={() => cargarHistorial(historialPagina - 1)}
                      className="mt-3 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50"
                    >
                      Volver a planes recientes
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        )}

        {presentacionAbierta && selectedClase && (
          <PresentacionClase
            asignacion={selectedClase}
            periodo={periodo}
            fecha={fecha}
            form={form}
            imagenesSeleccionadas={imagenesSeleccionadas}
            imagenesGuardadas={imagenesGuardadas}
            hayCambios={estadoGuardado.modificado}
            onCerrar={() => setPresentacionAbierta(false)}
          />
        )}
      </div>
    </div>
  );
}

function PresentacionClase({
  asignacion,
  periodo,
  fecha,
  form,
  imagenesSeleccionadas,
  imagenesGuardadas,
  hayCambios,
  onCerrar,
}) {
  useEffect(() => {
    const overflowAnteriorBody = document.body.style.overflow;
    const overflowAnteriorHtml = document.documentElement.style.overflow;
    const overscrollAnteriorHtml = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnteriorBody;
      document.documentElement.style.overflow = overflowAnteriorHtml;
      document.documentElement.style.overscrollBehavior = overscrollAnteriorHtml;
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [onCerrar]);

  const tieneTexto = (value) => Boolean(String(value || "").trim());
  const tieneImagen1 = Boolean(imagenesSeleccionadas.imagen1 || imagenesGuardadas.imagen1);
  const tieneImagen2 = Boolean(imagenesSeleccionadas.imagen2 || imagenesGuardadas.imagen2);
  const tieneContexto = tieneTexto(form.unidad) || tieneTexto(form.proposito) || tieneTexto(form.estandar);
  const tieneDesarrollo = tieneTexto(form.clase) || tieneTexto(form.competencias);
  const tieneDesarrolloCognitivo = tieneTexto(form.dba) || tieneImagen1;
  const tieneActividadCasa = tieneTexto(form.actividad_casa) || tieneImagen2;
  const tieneContenido =
    tieneTexto(form.tema) ||
    tieneContexto ||
    tieneDesarrollo ||
    tieneDesarrolloCognitivo ||
    tieneActividadCasa;

  return createPortal(
    <div
      className="fixed inset-0 isolate z-[9999] overflow-y-auto overscroll-contain bg-slate-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-presentacion-clase"
    >
      <header className="sticky top-0 z-20 border-b border-violet-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path d="M8 21h8M12 17v4M8 9l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 id="titulo-presentacion-clase" className="truncate text-base font-black text-slate-950 sm:text-lg">
                Presentación de clase
              </h2>
              <p className="truncate text-xs text-slate-500">Vista organizada para consultar y compartir la planeación.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hayCambios && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                Cambios sin guardar
              </span>
            )}
            <button
              type="button"
              onClick={onCerrar}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m12.5 5-5 5 5 5M8 10h8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver a editar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6 sm:py-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-violet-800 to-indigo-700 px-5 py-8 text-white shadow-xl shadow-violet-200/60 sm:px-9 sm:py-10">
          <span className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[36px] border-white/5" aria-hidden="true"></span>
          <span className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-2xl" aria-hidden="true"></span>
          <div className="relative max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">{asignacion.materia}</p>
            <h1 className="mt-3 whitespace-pre-wrap break-words text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              {tieneTexto(form.tema) ? form.tema : "Clase sin tema registrado"}
            </h1>
            <div className="mt-6 flex flex-wrap gap-2">
              <DatoEncabezadoPresentacion label="Curso" value={asignacion.curso} />
              <DatoEncabezadoPresentacion label="Jornada" value={asignacion.jornada || "Sin definir"} />
              <DatoEncabezadoPresentacion label="Periodo" value={periodo || "Sin definir"} />
              <DatoEncabezadoPresentacion label="Fecha" value={formatearFechaPlan(fecha)} />
            </div>
          </div>
        </section>

        {!tieneContenido && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="mt-4 text-lg font-black text-slate-900">La guía todavía no tiene contenido</h2>
            <p className="mt-1 text-sm text-slate-500">Vuelve a editar y agrega la información que deseas presentar.</p>
          </section>
        )}

        {tieneContexto && (
          <SeccionPresentacion
            titulo="Contexto pedagógico"
            descripcion="El punto de partida y la intención formativa de la clase."
            tono="violet"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {tieneTexto(form.unidad) && <CampoPresentacion label="Unidad" contenido={form.unidad} />}
              {tieneTexto(form.proposito) && <CampoPresentacion label="Logro" contenido={form.proposito} />}
              {tieneTexto(form.estandar) && (
                <CampoPresentacion
                  label="Estándar / Lineamientos curriculares"
                  contenido={form.estandar}
                  className="md:col-span-2"
                />
              )}
            </div>
          </SeccionPresentacion>
        )}

        {tieneDesarrollo && (
          <SeccionPresentacion
            titulo="Desarrollo de la clase"
            descripcion="La ruta de trabajo y las actividades previstas para los estudiantes."
            tono="sky"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {tieneTexto(form.clase) && <CampoPresentacion label="Clase" contenido={form.clase} />}
              {tieneTexto(form.competencias) && (
                <CampoPresentacion label="Actividad en clase" contenido={form.competencias} />
              )}
            </div>
          </SeccionPresentacion>
        )}

        {tieneDesarrolloCognitivo && (
          <SeccionPresentacion
            titulo="Desarrollo cognitivo"
            descripcion="Proceso principal de aprendizaje y su evidencia visual."
            tono="purple"
          >
            <div className={`grid gap-5 ${tieneTexto(form.dba) && tieneImagen1 ? "lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]" : ""}`}>
              {tieneTexto(form.dba) && <CampoPresentacion label="Descripción" contenido={form.dba} />}
              {tieneImagen1 && (
                <ImagenPresentacion
                  seleccionada={imagenesSeleccionadas.imagen1}
                  guardada={imagenesGuardadas.imagen1}
                  alt="Evidencia de desarrollo cognitivo"
                />
              )}
            </div>
          </SeccionPresentacion>
        )}

        {tieneActividadCasa && (
          <SeccionPresentacion
            titulo="Actividad en casa"
            descripcion="Continuidad del aprendizaje y evidencia visual asociada."
            tono="amber"
          >
            <div className={`grid gap-5 ${tieneTexto(form.actividad_casa) && tieneImagen2 ? "lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]" : ""}`}>
              {tieneTexto(form.actividad_casa) && (
                <CampoPresentacion label="Descripción" contenido={form.actividad_casa} />
              )}
              {tieneImagen2 && (
                <ImagenPresentacion
                  seleccionada={imagenesSeleccionadas.imagen2}
                  guardada={imagenesGuardadas.imagen2}
                  alt="Evidencia de actividad en casa"
                />
              )}
            </div>
          </SeccionPresentacion>
        )}
      </main>
    </div>,
    document.body,
  );
}

function DatoEncabezadoPresentacion({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
      <span className="text-violet-200">{label}:</span>
      <span className="text-white">{value}</span>
    </span>
  );
}

function SeccionPresentacion({ titulo, descripcion, tono, children }) {
  const tonos = {
    violet: { borde: "border-violet-200", acento: "bg-violet-600" },
    sky: { borde: "border-sky-200", acento: "bg-sky-500" },
    purple: { borde: "border-purple-200", acento: "bg-purple-600" },
    amber: { borde: "border-amber-200", acento: "bg-amber-500" },
  };
  const tonoActual = tonos[tono] || tonos.violet;

  return (
    <section className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${tonoActual.borde}`}>
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <span className={`mt-0.5 h-10 w-1 shrink-0 rounded-full ${tonoActual.acento}`} aria-hidden="true"></span>
        <div>
          <h2 className="text-lg font-black text-slate-950 sm:text-xl">{titulo}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function CampoPresentacion({ label, contenido, className = "" }) {
  return (
    <article className={`rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 ${className}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-700">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base">{contenido}</p>
    </article>
  );
}

function ImagenPresentacion({ seleccionada, guardada, alt }) {
  const { url: urlGuardada, cargando, error } = useImagenProtegida(seleccionada ? "" : guardada);
  const url = seleccionada?.url || urlGuardada;

  const abrirImagen = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={abrirImagen}
        disabled={!url}
        className="block min-h-64 w-full bg-white transition hover:bg-slate-50 disabled:cursor-default"
        aria-label={`Ver imagen completa: ${alt}`}
      >
        {cargando && (
          <span className="flex min-h-64 items-center justify-center gap-2 text-sm font-semibold text-slate-500">
            <SpinnerSeguimiento /> Cargando imagen...
          </span>
        )}
        {error && !cargando && (
          <span className="flex min-h-64 items-center justify-center px-5 text-sm font-semibold text-rose-700">{error}</span>
        )}
        {url && !cargando && <img src={url} alt={alt} className="max-h-[32rem] min-h-64 w-full object-contain p-2" />}
      </button>
      <div className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">{alt}</p>
          {seleccionada?.nombre && <p className="truncate text-xs text-slate-500">{seleccionada.nombre}</p>}
        </div>
        <button
          type="button"
          onClick={abrirImagen}
          disabled={!url}
          className="w-fit text-xs font-bold text-violet-700 hover:text-violet-900 disabled:text-slate-400"
        >
          Ver imagen completa
        </button>
      </div>
    </article>
  );
}

function SeguimientoPlanProfesor({
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
  const estadoVisual = obtenerEstadoRevisionVisual(estado, totalObservaciones);
  const config = ESTADOS_REVISION[estadoVisual];
  const fechaPrincipal = seguimiento.revisado_at
    ? `Revisado ${formatearFechaSeguimiento(seguimiento.revisado_at)}`
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
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">Seguimiento administrativo</p>
              <EstadoRevisionBadge estado={estado} totalObservaciones={totalObservaciones} compact />
              <span className="text-xs font-semibold text-violet-600">
                Versión {seguimiento.version_revision || 1}
              </span>
            </div>
            <div className="mt-1 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
              <h2 className="shrink-0 text-sm font-bold text-violet-950">{config.title}</h2>
              <p className="min-w-0 truncate text-xs text-slate-600">{config.detail}</p>
              {fechaPrincipal && (
                <span className="shrink-0 text-xs font-semibold text-violet-400">{fechaPrincipal}</span>
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
            <h3 className="text-sm font-bold text-violet-950">Comentarios de administración</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Aquí encontrarás reconocimientos e indicaciones conservados por cada versión de la planeación.
            </p>
          </div>
          {cargando ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600">
              <SpinnerSeguimiento /> Cargando comentarios...
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

function CargandoGuiaDidactica() {
  return (
    <div
      className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/45 px-5 py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
          <SpinnerSeguimiento className="h-7 w-7 border-[3px]" />
        </div>
        <h3 className="mt-4 text-sm font-black text-slate-900">Cargando datos de la guía...</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Estamos consultando tu clase y la planeación de la fecha seleccionada.
        </p>
      </div>
    </div>
  );
}

function HistorialObservacionesProfesor({ observaciones, versionActual, error }) {
  return (
    <div className="space-y-3">
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{error}</div>}
      {!error && observaciones.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600">
          No hay comentarios registrados para este plan.
        </div>
      )}
      {observaciones.map((item) => {
        const esVersionActual = Number(item.plan_version) === Number(versionActual);
        return (
          <article
            key={item.id}
            className={`rounded-xl border p-4 ${
              esVersionActual ? "border-violet-200 bg-white shadow-sm" : "border-slate-200 bg-white/75"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-slate-800">{item.admin || "Administración"}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  esVersionActual ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-600"
                }`}>
                  Versión {item.plan_version}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">{formatearFechaSeguimiento(item.creada_at)}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.observacion}</p>
            {!item.vista_por_profesor_at && (
              <p className="mt-3 text-xs font-bold text-amber-700">No fue posible confirmar la lectura.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function EstadoRevisionBadge({ estado, totalObservaciones = 0, compact = false }) {
  const estadoVisual = obtenerEstadoRevisionVisual(estado, totalObservaciones);
  const config = ESTADOS_REVISION[estadoVisual];
  return (
    <span className={`inline-flex rounded-full border font-black ${config.badgeClass} ${
      compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
    }`}>
      {config.label}
    </span>
  );
}

function IconoSeguimiento({ estado }) {
  if (estado === "revisado") {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (estado === "revisado_con_observacion") return <IconoComentario />;
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 12 16-8-5 16-3-6-8-2Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconoComentario() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5h14v11H9l-4 3V5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 9h8M8 12h5" strokeLinecap="round" /></svg>;
}

function SpinnerSeguimiento({ className = "h-4 w-4 border-2" }) {
  return <span className={`${className} animate-spin rounded-full border-current border-r-transparent`} aria-hidden="true" />;
}

function EvidenciaCampo({
  id,
  label,
  descripcion,
  inputRef,
  seleccionada,
  guardada,
  onChange,
  onEliminarImagen,
  tono = "purple",
}) {
  const inputClass = tono === "amber"
    ? "border-amber-200 bg-amber-50/50 text-gray-600 file:bg-amber-100 file:text-amber-800 hover:border-amber-300 hover:file:bg-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
    : "border-purple-200 bg-purple-50/50 text-gray-600 file:bg-purple-100 file:text-purple-800 hover:border-purple-300 hover:file:bg-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

  return (
    <div className="rounded-lg border border-gray-200 bg-white/90 p-3.5">
      <div className="mb-2">
        <label htmlFor={id} className="text-sm font-semibold text-gray-800">{label}</label>
        <p className="text-xs text-gray-600">{descripcion}</p>
      </div>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={onChange}
        className={`block w-full cursor-pointer rounded-lg border border-dashed px-2 py-2 text-xs shadow-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:text-xs file:font-semibold ${inputClass}`}
      />
      {seleccionada && <ImagenSeleccionadaCard imagen={seleccionada} />}
      {guardada ? (
        <ImagenGuardadaCard
          imagen={{ path: guardada, label }}
          alt={label}
          onEliminarImagen={onEliminarImagen}
        />
      ) : (
        <p className="mt-2 text-xs text-gray-500">Sin evidencia guardada para este campo.</p>
      )}
    </div>
  );
}

function ImagenSeleccionadaCard({ imagen }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-purple-100 bg-white">
      <img src={imagen.url} alt={imagen.nombre} className="h-32 w-full object-contain sm:h-36" />
      <div className="border-t border-purple-100 px-3 py-2 text-xs font-medium text-gray-700">
        Por subir: {imagen.nombre}
      </div>
    </div>
  );
}

function ImagenGuardadaCard({ imagen, alt, onEliminarImagen }) {
  const { url, cargando, error } = useImagenProtegida(imagen.path);

  const abrirImagen = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={abrirImagen}
        disabled={!url}
        className="block h-36 w-full transition hover:opacity-90 disabled:cursor-not-allowed sm:h-40"
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

function CampoTextarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={campoBase}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}

export default PlanDeClases;
