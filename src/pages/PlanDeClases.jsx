import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

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
  const [periodo, setPeriodo] = useState(localStorage.getItem("periodo") || "1");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState(estadoInicial);
  const [imagenes, setImagenes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [planActualId, setPlanActualId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

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

  const actualizarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const cargarClases = async () => {
    if (!profesorId) return;
    try {
      const res = await api.get(`/mis-clases/${profesorId}`);
      const data = res.data || [];
      setClases(data);
      if (!asignacionId && data.length > 0) {
        setAsignacionId(String(data[0].id));
        localStorage.setItem("asignacionId", String(data[0].id));
      }
    } catch (error) {
      console.error("Error cargando clases", error);
      setMensaje("No se pudieron cargar tus clases asignadas.");
    }
  };

  const cargarPlanDelDia = async () => {
    if (!asignacionId || !fecha) return;
    setCargando(true);
    try {
      const res = await api.get(`/plan-de-clases/${asignacionId}`, { params: { fecha } });
      const plan = res.data;
      if (plan) {
        setPlanActualId(plan.id);
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
        setMensaje("Plan cargado para esta fecha.");
      } else {
        setPlanActualId(null);
        setForm(estadoInicial);
        setMensaje("");
      }
    } catch (error) {
      console.error("Error cargando plan del día", error);
      setMensaje("No se pudo cargar el plan de esta fecha.");
    } finally {
      setCargando(false);
    }
  };

  const cargarHistorial = async () => {
    if (!asignacionId) return;
    try {
      const res = await api.get(`/plan-de-clases/${asignacionId}`);
      setHistorial(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
    } catch (error) {
      console.error("Error cargando historial", error);
    }
  };

  useEffect(() => {
    if (!profesor) {
      window.location.href = "/login";
      return;
    }
    cargarClases();
  }, [profesorId]);

  useEffect(() => {
    if (!asignacionId) return;
    localStorage.setItem("asignacionId", String(asignacionId));
    cargarPlanDelDia();
    cargarHistorial();
  }, [asignacionId, fecha]);

  useEffect(() => {
    localStorage.setItem("periodo", String(periodo));
  }, [periodo]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 2) {
      alert("Solo puedes seleccionar hasta 2 imágenes");
      e.target.value = "";
      return;
    }
    setImagenes(files);
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
      setMensaje(res.data.mensaje || "Plan guardado y enviado a administración.");
      await cargarHistorial();
    } catch (error) {
      console.error("Error guardando plan", error);
      alert(error.response?.data?.detail || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Plan de clases</h1>
          <p className="mt-1 text-sm text-gray-600">
            Prepara el plan diario y déjalo disponible para seguimiento administrativo.
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {planActualId ? `Editando plan #${planActualId}` : "Nuevo plan para la fecha seleccionada"}
        </div>
      </div>

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
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={campoBase}>
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
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 text-sm md:grid-cols-3">
            <div>
              <span className="font-medium text-gray-600">Materia</span>
              <p className="text-gray-900">{selectedClase.materia}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Curso</span>
              <p className="text-gray-900">{selectedClase.curso}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Estado</span>
              <p className="text-gray-900">{cargando ? "Cargando..." : planActualId ? "Guardado" : "Sin guardar"}</p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Detalles del plan</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CampoTextarea label="Unidad" value={form.unidad} onChange={(valor) => actualizarCampo("unidad", valor)} />
          <CampoInput label="Tema" value={form.tema} onChange={(valor) => actualizarCampo("tema", valor)} />
          <CampoTextarea label="Logro" value={form.proposito} onChange={(valor) => actualizarCampo("proposito", valor)} />
          <CampoTextarea label="Clase" value={form.clase} onChange={(valor) => actualizarCampo("clase", valor)} />
          <CampoTextarea label="Estándar" value={form.estandar} onChange={(valor) => actualizarCampo("estandar", valor)} />
          <CampoTextarea label="Desarrollo cognitivo" value={form.dba} onChange={(valor) => actualizarCampo("dba", valor)} />
          <CampoTextarea
            label="Actividad en clase"
            value={form.competencias}
            onChange={(valor) => actualizarCampo("competencias", valor)}
          />
          <CampoTextarea
            label="Actividad en casa"
            value={form.actividad_casa}
            onChange={(valor) => actualizarCampo("actividad_casa", valor)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Imágenes</h2>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className={campoBase} />
            {imagenes.length > 0 && (
              <div className="mt-2 text-sm text-gray-700">
                {imagenes.map((img) => (
                  <span key={img.name} className="mr-3 inline-block">
                    {img.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={guardarPlan}
            disabled={guardando || cargando}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 md:w-auto"
          >
            {guardando ? "Guardando..." : "Guardar y enviar"}
          </button>
        </div>
        {mensaje && <p className="mt-3 text-sm text-gray-700">{mensaje}</p>}
      </section>

      {historial.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Planes recientes de esta clase</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {historial.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setFecha(plan.fecha)}
                className="rounded-lg border border-gray-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-900">{plan.tema}</span>
                  <span className="text-xs text-gray-500">{plan.fecha}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{plan.unidad}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CampoInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={campoBase} />
    </div>
  );
}

function CampoTextarea({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className={campoBase} rows="4" />
    </div>
  );
}

export default PlanDeClases;
