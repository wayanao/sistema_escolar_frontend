import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImagenProtegida } from "../components/ImagenProtegida";
import api from "../utils/api";
import { guardarPeriodoProfesor, obtenerPeriodoProfesor } from "../utils/periodoProfesor";

const campoBase =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

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

function PlanDeClases() {
  const profesorStorage = localStorage.getItem("profesor");
  const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
  const profesorId = profesor?.id;

  const [asignacionId, setAsignacionId] = useState(localStorage.getItem("asignacionId") || "");
  const [clases, setClases] = useState([]);
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState(estadoInicial);
  const [imagenes, setImagenes] = useState([]);
  const [imagenesGuardadas, setImagenesGuardadas] = useState({ imagen1: null, imagen2: null });
  const [historial, setHistorial] = useState([]);
  const [planActualId, setPlanActualId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estadoGuardado, setEstadoGuardado] = useState({
    cargando: false,
    guardado: false,
    modificado: false,
    guardadoEn: null,
  });
  const imagenInputRef = useRef(null);

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
    () => imagenes.map((imagen) => ({ nombre: imagen.name, url: URL.createObjectURL(imagen) })),
    [imagenes],
  );

  useEffect(() => {
    return () => {
      imagenesSeleccionadas.forEach((imagen) => URL.revokeObjectURL(imagen.url));
    };
  }, [imagenesSeleccionadas]);

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
    if (!profesorId) return;
    try {
      const res = await api.get(`/mis-clases/${profesorId}`);
      const data = res.data || [];
      setClases(data);
      setAsignacionId((actual) => {
        if (actual || data.length === 0) return actual;
        const primeraAsignacion = String(data[0].id);
        localStorage.setItem("asignacionId", primeraAsignacion);
        return primeraAsignacion;
      });
    } catch (error) {
      console.error("Error cargando clases", error);
      setMensaje("No se pudieron cargar tus clases asignadas.");
    }
  }, [profesorId]);

  const cargarPlanDelDia = useCallback(async () => {
    if (!asignacionId || !fecha) return;
    setCargando(true);
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
        setImagenes([]);
        if (imagenInputRef.current) imagenInputRef.current.value = "";
        setEstadoGuardado({
          cargando: false,
          guardado: true,
          modificado: false,
          guardadoEn: null,
        });
        setMensaje("Plan cargado para esta fecha.");
      } else {
        setPlanActualId(null);
        setImagenesGuardadas({ imagen1: null, imagen2: null });
        setImagenes([]);
        if (imagenInputRef.current) imagenInputRef.current.value = "";
        setForm(estadoInicial);
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
    } finally {
      setCargando(false);
    }
  }, [asignacionId, fecha]);

  const cargarHistorial = useCallback(async () => {
    if (!asignacionId) return;
    try {
      const res = await api.get(`/plan-de-clases/${asignacionId}`);
      setHistorial(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
    } catch (error) {
      console.error("Error cargando historial", error);
    }
  }, [asignacionId]);

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
    cargarHistorial();
  }, [asignacionId, fecha, cargarPlanDelDia, cargarHistorial]);

  useEffect(() => {
    guardarPeriodoProfesor(periodo);
  }, [periodo]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 2) {
      alert("Solo puedes seleccionar hasta 2 imágenes");
      e.target.value = "";
      return;
    }
    setImagenes(files);
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  };

  const guardarPlan = async () => {
    const incompleto =
      !asignacionId ||
      !periodo ||
      !fecha ||
      Object.values(form).some((valor) => !String(valor).trim());

    if (incompleto) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    const formData = new FormData();
    formData.append("asignacion_id", asignacionId);
    formData.append("periodo", periodo);
    formData.append("fecha", fecha);
    Object.entries(form).forEach(([campo, valor]) => formData.append(campo, valor));
    if (imagenes[0]) formData.append("imagen1", imagenes[0]);
    if (imagenes[1]) formData.append("imagen2", imagenes[1]);

    setGuardando(true);
    try {
      const res = await api.post("/plan-de-clases", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPlanActualId(res.data.id);
      setImagenes([]);
      if (imagenInputRef.current) imagenInputRef.current.value = "";
      await cargarPlanDelDia();
      setEstadoGuardado({
        cargando: false,
        guardado: true,
        modificado: false,
        guardadoEn: new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setMensaje(res.data.mensaje || "Plan guardado y enviado a administración.");
      await cargarHistorial();
    } catch (error) {
      console.error("Error guardando plan", error);
      alert(error.response?.data?.detail || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarImagenGuardada = async (slot) => {
    if (!planActualId) return;

    const nombreImagen = slot === "imagen1" ? "imagen 1" : "imagen 2";
    const confirmar = window.confirm(`¿Quieres borrar la ${nombreImagen} de este plan?`);
    if (!confirmar) return;

    try {
      await api.delete(`/plan-de-clases/${planActualId}/imagen`, { params: { slot } });
      setImagenesGuardadas((actual) => ({ ...actual, [slot]: null }));
      setHistorial((actual) =>
        actual.map((plan) => (plan.id === planActualId ? { ...plan, [slot]: null } : plan)),
      );
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

  const usarPlanComoBase = (plan) => {
    setPlanActualId(null);
    setImagenes([]);
    setImagenesGuardadas({ imagen1: null, imagen2: null });
    if (imagenInputRef.current) imagenInputRef.current.value = "";
    setPeriodo(String(plan.periodo || periodo));
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
    setEstadoGuardado({
      cargando: false,
      guardado: false,
      modificado: true,
      guardadoEn: null,
    });
    setMensaje("Plan reciente usado como base. Revisa la fecha antes de guardar.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50/50 p-2 sm:p-6">
      <div className="space-y-6">
        <section className="rounded-lg border border-sky-100 bg-white/90 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Taller docente</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">Plan de clases</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Diseña la clase del día con propósito, actividades y evidencias claras para tu grupo.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm md:items-end">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}>
                <span className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`} aria-hidden="true"></span>
                {estadoVisual.label}
              </span>
              <span className="text-xs font-medium text-gray-600">{estadoVisual.detail}</span>
              <span className="text-xs text-gray-500">
                {planActualId ? `Plan #${planActualId}` : "Nuevo plan para la fecha seleccionada"}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Clase asignada</label>
              <select
                value={asignacionId}
                onChange={(e) => setAsignacionId(e.target.value)}
                className={campoBase}
              >
                <option value="">Selecciona una clase</option>
                {clasesUnicas.map((claseItem) => (
                  <option key={claseItem.id} value={claseItem.id}>
                    {claseItem.materia} - {claseItem.curso}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Periodo</label>
              <select value={periodo} onChange={(e) => actualizarPeriodo(e.target.value)} className={campoBase}>
                <option value="1">Periodo 1</option>
                <option value="2">Periodo 2</option>
                <option value="3">Periodo 3</option>
                <option value="4">Periodo 4</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campoBase} />
            </div>
          </div>

          {selectedClase && (
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-3">
              <DatoClase label="Materia" value={selectedClase.materia} />
              <DatoClase label="Curso" value={selectedClase.curso} />
              <DatoClase label="Estado" value={estadoVisual.label} />
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-950">Guía didáctica</h2>
              <p className="text-sm text-gray-600">Organiza la intención, la ruta de clase y las evidencias de aprendizaje.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CampoTextarea
                label="Unidad"
                value={form.unidad}
                onChange={(valor) => actualizarCampo("unidad", valor)}
                placeholder="Nombre de la unidad o eje de trabajo"
              />
              <CampoInput
                label="Tema"
                value={form.tema}
                onChange={(valor) => actualizarCampo("tema", valor)}
                placeholder="Tema central de la clase"
              />
              <CampoTextarea
                label="Logro"
                value={form.proposito}
                onChange={(valor) => actualizarCampo("proposito", valor)}
                placeholder="Qué se espera que logren los estudiantes"
              />
              <CampoTextarea
                label="Clase"
                value={form.clase}
                onChange={(valor) => actualizarCampo("clase", valor)}
                placeholder="Apertura, desarrollo y cierre"
              />
              <CampoTextarea
                label="Estándar"
                value={form.estandar}
                onChange={(valor) => actualizarCampo("estandar", valor)}
                placeholder="Estándar o referente curricular"
              />
              <CampoTextarea
                label="Desarrollo cognitivo"
                value={form.dba}
                onChange={(valor) => actualizarCampo("dba", valor)}
                placeholder="Proceso, habilidad o DBA relacionado"
              />
              <CampoTextarea
                label="Actividad en clase"
                value={form.competencias}
                onChange={(valor) => actualizarCampo("competencias", valor)}
                placeholder="Trabajo individual, grupal, práctica o evidencia"
              />
              <CampoTextarea
                label="Actividad en casa"
                value={form.actividad_casa}
                onChange={(valor) => actualizarCampo("actividad_casa", valor)}
                placeholder="Refuerzo, consulta o producción para casa"
              />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full">
                <h2 className="mb-2 text-lg font-semibold text-gray-950">Evidencias visuales</h2>
                <input
                  ref={imagenInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className={campoBase}
                />
                <ImagenesSeleccionadas imagenes={imagenesSeleccionadas} />
                <ImagenesGuardadas imagenes={imagenesGuardadas} onEliminarImagen={eliminarImagenGuardada} />
              </div>
              <button
                onClick={guardarPlan}
                disabled={guardando || cargando}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 md:w-auto"
              >
                {guardando ? "Guardando..." : estadoVisual.buttonText}
              </button>
            </div>
            {mensaje && <p className="mt-3 text-sm text-gray-700">{mensaje}</p>}
          </section>
        </div>

        {historial.length > 0 && (
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-950">Planes recientes de esta clase</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {historial.map((plan) => (
                <div key={plan.id} className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                  <button type="button" onClick={() => setFecha(plan.fecha)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-950">{plan.tema}</span>
                      <span className="text-xs text-gray-500">{plan.fecha}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{plan.unidad}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => usarPlanComoBase(plan)}
                    className="mt-3 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-white"
                  >
                    Usar como base
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ImagenesSeleccionadas({ imagenes }) {
  if (imagenes.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700">Imágenes por subir</h3>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {imagenes.map((imagen) => (
          <div key={imagen.url} className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
            <img src={imagen.url} alt={imagen.nombre} className="h-36 w-full object-contain sm:h-40" />
            <div className="border-t border-blue-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">
              {imagen.nombre}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImagenesGuardadas({ imagenes, onEliminarImagen }) {
  const imagenesDisponibles = [
    { slot: "imagen1", path: imagenes.imagen1, label: "Imagen 1" },
    { slot: "imagen2", path: imagenes.imagen2, label: "Imagen 2" },
  ].filter((imagen) => Boolean(imagen.path));

  if (imagenesDisponibles.length === 0) {
    return <p className="mt-3 text-sm text-gray-600">Este plan todavía no tiene imágenes guardadas.</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700">Imágenes guardadas</h3>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {imagenesDisponibles.map((imagen, index) => (
          <ImagenGuardadaCard
            key={imagen.slot}
            imagen={imagen}
            alt={`${imagen.label} del plan de clases ${index + 1}`}
            onEliminarImagen={() => onEliminarImagen(imagen.slot)}
          />
        ))}
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
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
            className="text-xs font-medium text-blue-700 disabled:text-gray-400"
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

function DatoClase({ label, value }) {
  return (
    <div>
      <span className="font-medium text-gray-600">{label}</span>
      <p className="text-gray-950">{value}</p>
    </div>
  );
}

function CampoInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={campoBase} placeholder={placeholder} />
    </div>
  );
}

function CampoTextarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={campoBase}
        rows="4"
        placeholder={placeholder}
      />
    </div>
  );
}

export default PlanDeClases;
