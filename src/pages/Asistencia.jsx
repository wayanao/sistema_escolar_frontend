import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import AsistenciaRow from "../components/AsistenciaRow";
import EncabezadoContextoCurso from "../components/EncabezadoContextoCurso";
import api from "../utils/api";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

const normalizarFecha = (valor) => {
  if (!valor) return "";
  const texto = String(valor);
  const formatoIso = texto.match(/^\d{4}-\d{2}-\d{2}/);
  if (formatoIso) return formatoIso[0];

  const fechaParseada = new Date(texto);
  if (Number.isNaN(fechaParseada.getTime())) return texto.slice(0, 10);

  return fechaParseada.toISOString().slice(0, 10);
};

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


function Asistencia() {

const avisoSeleccionRef = useRef(false);
const [fecha] = useState(localStorage.getItem("fechaAsistencia") || "");
const [asistencia, setAsistencia] = useState({});
const [historial, setHistorial] = useState([]);
const [cargandoHistorial, setCargandoHistorial] = useState(false);
const [historialListo, setHistorialListo] = useState(false);
const [errorHistorial, setErrorHistorial] = useState("");
const [estudiantes, setEstudiantes] = useState([]);
const [clases, setClases] = useState([]);
const [guardando, setGuardando] = useState(false);
const asignacionId = localStorage.getItem("asignacionId");
const periodo = obtenerPeriodoProfesor();

const profesorStorage = localStorage.getItem("profesor");
const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
const profesorId = profesor?.id;


const pedirSeleccionClase = useCallback(() => {
  if (avisoSeleccionRef.current) return;

  avisoSeleccionRef.current = true;
  alert("Selecciona una asignación primero en la página principal");
  window.location.href = "/";
}, []);


const cargarEstudiantes = useCallback(async () => {
  if (!asignacionId) {
    pedirSeleccionClase();
    return;
  }
  try {
    const res = await api.get(`/planilla-excel/${asignacionId}/${periodo}`);
    const data = res.data;
    

    setEstudiantes(data.data || []);
  } catch (error) {
    console.error("Error cargando estudiantes", error);
    if (error.response?.status === 403) {
      localStorage.removeItem("asignacionId");
      alert("La clase seleccionada ya no está disponible. Selecciónala nuevamente.");
      window.location.href = "/";
    }
  }
}, [asignacionId, periodo, pedirSeleccionClase]);

const cargarClases = useCallback(async () => {
  if (!profesorId) return;
  try {
    const res = await api.get(`/mis-clases/${profesorId}`);
    const data = res.data;
    setClases(data);
  } catch (error) {
    console.error("Error cargando clases", error);
  } 
}, [profesorId]);

const cargarHistorial = useCallback(async () => {
    if (!asignacionId || !periodo) return;

    setCargandoHistorial(true);
    setHistorialListo(false);
    setErrorHistorial("");

    try {
      let data = [];
      let ultimoError = null;

      for (let intento = 0; intento < 2; intento += 1) {
        try {
          const res = await api.get(`/asistencia/historial/${asignacionId}/${periodo}`);
          data = res.data;
          ultimoError = null;
          break;
        } catch (error) {
          ultimoError = error;
          if (intento === 0) await esperar(700);
        }
      }

      if (ultimoError) throw ultimoError;

      setHistorial(Array.isArray(data) ? data : []);
      setHistorialListo(true);
    } catch (error) {
      console.error("Error cargando historial de asistencia", error);
      if (error.response?.status === 403) {
        localStorage.removeItem("asignacionId");
        alert("La clase seleccionada ya no está disponible. Selecciónala nuevamente.");
        window.location.href = "/";
        return;
      }
      setHistorial([]);
      setErrorHistorial("No se pudo cargar el historial de inasistencias. Intenta recargar.");
    } finally {
      setCargandoHistorial(false);
    }
    }, [asignacionId, periodo]);


      useEffect(() => {
    if (!profesorId) {
      window.location.href = "/login";
      return;
    }

    if (!asignacionId || !periodo) {
      pedirSeleccionClase();
      return;
    }
  
    if (asignacionId && periodo) {
      cargarEstudiantes();
      cargarHistorial();
    }
  
    cargarClases();
  
  }, [asignacionId, periodo, profesorId, cargarEstudiantes, cargarHistorial, cargarClases, pedirSeleccionClase]);




    // Contar asistencias e inasistencias
    const selectedClase = clases.find(c => c.id == asignacionId);
    const historialPorEstudiante = useMemo(() => {
      const mapa = new Map();

      historial.forEach((item) => {
        mapa.set(Number(item.estudiante_id), Array.isArray(item.historial) ? item.historial : []);
      });

      return mapa;
    }, [historial]);

    const asistenciaGuardadaHoy = useMemo(() => {
      const registros = new Map();
      const fechaNormalizada = normalizarFecha(fecha);

      if (!fechaNormalizada) return registros;

      historialPorEstudiante.forEach((items, estudianteId) => {
        const registroHoy = items.find((item) => normalizarFecha(item.fecha) === fechaNormalizada);

        if (registroHoy?.estado) {
          registros.set(estudianteId, registroHoy.estado);
        }
      });

      return registros;
    }, [fecha, historialPorEstudiante]);

    const asistenciaDelDiaTomada = asistenciaGuardadaHoy.size > 0;
    const asistenciaGuardada = useMemo(
      () => Object.fromEntries(asistenciaGuardadaHoy),
      [asistenciaGuardadaHoy]
    );

    useEffect(() => {
      if (!historialListo) return;

      setAsistencia((actual) => {
        if (Object.keys(actual).length > 0) return actual;
        return asistenciaGuardada;
      });
    }, [asistenciaGuardada, historialListo]);

    const resumenAsistencia = useMemo(() => {
      return estudiantes.reduce((resumen, estudiante) => {
        const estado = asistencia[estudiante.estudiante_id];
        if (estado === "presente") resumen.presentes += 1;
        else if (estado === "ausente") resumen.ausentes += 1;
        else resumen.pendientes += 1;
        return resumen;
      }, { presentes: 0, ausentes: 0, pendientes: 0 });
    }, [asistencia, estudiantes]);

    const hayCambiosSinGuardar = useMemo(
      () => estudiantes.some((estudiante) => {
        const estudianteId = estudiante.estudiante_id;
        return (asistencia[estudianteId] || "") !== (asistenciaGuardada[estudianteId] || "");
      }),
      [asistencia, asistenciaGuardada, estudiantes]
    );

    const puedeInteractuar = historialListo && !errorHistorial && estudiantes.length > 0 && !guardando;
    const puedeGuardar = puedeInteractuar
      && Boolean(fecha)
      && resumenAsistencia.pendientes === 0
      && hayCambiosSinGuardar;

    const marcar = (id, estado) => {
      setAsistencia((actual) => ({
        ...actual,
        [id]: estado,
      }));
    };

    const marcarTodosPresentes = async () => {
      if (!puedeInteractuar) return;

      const reemplazaAusencias = estudiantes.some(
        (estudiante) => asistencia[estudiante.estudiante_id] === "ausente"
      );
      if (reemplazaAusencias) {
        const resultado = await Swal.fire({
          icon: "warning",
          title: "¿Marcar todos presentes?",
          text: "Las ausencias que ya marcaste cambiarán a presente.",
          showCancelButton: true,
          confirmButtonText: "Sí, marcar todos",
          cancelButtonText: "Conservar marcación",
          confirmButtonColor: "#059669",
          cancelButtonColor: "#64748b",
          reverseButtons: true,
          focusCancel: true,
        });
        if (!resultado.isConfirmed) return;
      }

      setAsistencia(Object.fromEntries(
        estudiantes.map((estudiante) => [estudiante.estudiante_id, "presente"])
      ));
    };

    const restaurarSeleccion = () => {
      if (!puedeInteractuar || !hayCambiosSinGuardar) return;
      setAsistencia(asistenciaDelDiaTomada ? asistenciaGuardada : {});
    };

    const guardarAsistencia = async () => {
      if (!fecha) {
        await Swal.fire({
          icon: "warning",
          title: "Falta seleccionar la fecha",
          text: "Regresa al dashboard, selecciona la fecha y vuelve a Asistencia.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#6d28d9",
        });
        return;
      }
      if (resumenAsistencia.pendientes > 0) {
        await Swal.fire({
          icon: "warning",
          title: "Asistencia incompleta",
          text: `Falta marcar ${resumenAsistencia.pendientes} estudiante${resumenAsistencia.pendientes === 1 ? "" : "s"}.`,
          confirmButtonText: "Seguir revisando",
          confirmButtonColor: "#6d28d9",
        });
        return;
      }
      if (!hayCambiosSinGuardar) return;

      const confirmacion = await Swal.fire({
        icon: "question",
        title: asistenciaDelDiaTomada ? "Guardar cambios de asistencia" : "Guardar asistencia",
        html: `
          <p class="mb-4 text-sm text-slate-600">Revisa el resumen antes de confirmar.</p>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <strong class="block text-2xl text-emerald-700">${resumenAsistencia.presentes}</strong>
              <span class="text-xs font-bold uppercase tracking-wide text-emerald-700">Presentes</span>
            </div>
            <div class="rounded-lg border border-red-200 bg-red-50 p-3">
              <strong class="block text-2xl text-red-700">${resumenAsistencia.ausentes}</strong>
              <span class="text-xs font-bold uppercase tracking-wide text-red-700">Ausentes</span>
            </div>
          </div>
          <p class="mt-4 text-sm text-slate-600">
            ${asistenciaDelDiaTomada
              ? "Se reemplazará la marcación guardada de los estudiantes modificados."
              : "La asistencia quedará registrada para la fecha seleccionada en el dashboard."}
          </p>
        `,
        showCancelButton: true,
        confirmButtonText: asistenciaDelDiaTomada ? "Sí, guardar cambios" : "Sí, guardar asistencia",
        cancelButtonText: "Seguir revisando",
        confirmButtonColor: "#6d28d9",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!confirmacion.isConfirmed) return;

      const data = estudiantes.map((estudiante) => ({
        estudiante_id: estudiante.estudiante_id,
        asignacion_id: Number(asignacionId),
        fecha,
        estado: asistencia[estudiante.estudiante_id],
        periodo: Number(periodo),
      }));

      setGuardando(true);
      try {
        Swal.fire({
          title: asistenciaDelDiaTomada ? "Actualizando asistencia" : "Guardando asistencia",
          text: "Espera un momento mientras confirmamos el registro.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading(),
        });
        await api.post("/asistencia", data);
        await cargarHistorial();
        await Swal.fire({
          icon: "success",
          title: asistenciaDelDiaTomada ? "Asistencia actualizada" : "Asistencia guardada",
          text: `${resumenAsistencia.presentes} presentes y ${resumenAsistencia.ausentes} ausentes quedaron registrados correctamente.`,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#6d28d9",
        });
      } catch (error) {
        console.error("Error guardando asistencia", error);
        const detalle = error.response?.data?.detail;
        await Swal.fire({
          icon: "error",
          title: "No se pudo guardar",
          text: typeof detalle === "string" ? detalle : "Revisa la conexión e intenta nuevamente.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#6d28d9",
        });
      } finally {
        setGuardando(false);
      }
    };

    return (
      <div className="w-full p-4 sm:p-6 md:p-8">
        <EncabezadoContextoCurso
          titulo="Gestión de asistencia"
          etiqueta="Control diario"
          descripcion="Registra la asistencia y acompaña el seguimiento de tus estudiantes."
          materia={selectedClase?.materia}
          curso={selectedClase?.curso}
          periodo={periodo}
          fecha={fecha}
        />

        {asistenciaDelDiaTomada && (
          <div className={`mb-6 rounded-lg border px-4 py-3 shadow-sm ${
            hayCambiosSinGuardar
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold">
                  {hayCambiosSinGuardar ? "Editando asistencia guardada" : "Asistencia del día ya tomada"}
                </p>
                <p className="text-sm">
                  {hayCambiosSinGuardar
                    ? "Tienes cambios pendientes. Guárdalos para actualizar el registro del día."
                    : `Hay registro para ${asistenciaGuardadaHoy.size} de ${estudiantes.length} estudiantes en la fecha seleccionada.`}
                </p>
              </div>
              <span className={`inline-flex w-fit rounded-full border bg-white px-3 py-1 text-xs font-bold ${
                hayCambiosSinGuardar ? "border-amber-300" : "border-emerald-300"
              }`}>
                {hayCambiosSinGuardar ? "Cambios sin guardar" : "Guardado"}
              </span>
            </div>
          </div>
        )}

        {/* Lista de Estudiantes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Lista de Estudiantes</h2>
              {cargandoHistorial && (
                <p className="mt-1 text-sm font-medium text-gray-500">Cargando historial de inasistencias...</p>
              )}
              {errorHistorial && (
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <p className="text-sm font-semibold text-red-600">{errorHistorial}</p>
                  <button
                    type="button"
                    onClick={cargarHistorial}
                    className="w-fit rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
            {historialListo && !errorHistorial && (
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Historial actualizado
              </span>
            )}
          </div>

          <div className="mb-5 rounded-lg border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Marcación rápida</p>
                <p className="mt-1 text-sm text-gray-600">
                  Marca a todos como presentes y cambia únicamente a quienes no asistieron.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!puedeInteractuar}
                  onClick={marcarTodosPresentes}
                  className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  ✔ Marcar todos presentes
                </button>
                <button
                  type="button"
                  disabled={!puedeInteractuar || !hayCambiosSinGuardar}
                  onClick={restaurarSeleccion}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {asistenciaDelDiaTomada ? "Restaurar guardado" : "Limpiar selección"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Resumen de asistencia">
              <div className="rounded-md border border-emerald-200 bg-white px-2 py-2 text-center">
                <p className="text-lg font-bold text-emerald-700">{resumenAsistencia.presentes}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 sm:text-xs">Presentes</p>
              </div>
              <div className="rounded-md border border-red-200 bg-white px-2 py-2 text-center">
                <p className="text-lg font-bold text-red-700">{resumenAsistencia.ausentes}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 sm:text-xs">Ausentes</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-white px-2 py-2 text-center">
                <p className="text-lg font-bold text-amber-700">{resumenAsistencia.pendientes}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 sm:text-xs">Pendientes</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {estudiantes.map(est => {
              const hist = historialPorEstudiante.get(Number(est.estudiante_id)) || [];
              const estConHistorial = { ...est, historial: hist };
              return (
              <AsistenciaRow
                key={est.estudiante_id}
                est={estConHistorial}
                estado={asistencia[est.estudiante_id]}
                marcar={marcar}
                cargandoHistorial={cargandoHistorial}
                disabled={!puedeInteractuar}
              />
              );
            })}
            {historialListo && estudiantes.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                No hay estudiantes activos en esta clase.
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="text-sm text-gray-600">
            {resumenAsistencia.pendientes > 0
              ? `Falta marcar ${resumenAsistencia.pendientes} estudiante${resumenAsistencia.pendientes === 1 ? "" : "s"}.`
              : hayCambiosSinGuardar
                ? `${resumenAsistencia.presentes} presentes · ${resumenAsistencia.ausentes} ausentes`
                : asistenciaDelDiaTomada
                  ? "La asistencia está guardada y no tiene cambios."
                  : "Usa la marcación rápida o selecciona cada estudiante."}
          </div>
          <button
            type="button"
            disabled={!puedeGuardar}
            className="rounded-lg bg-purple-700 px-5 py-3 text-base font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:min-w-52"
            onClick={guardarAsistencia}
          >
            {guardando
              ? "Guardando..."
              : asistenciaDelDiaTomada
                ? "Guardar cambios"
                : "Guardar asistencia"}
          </button>
        </div>
      </div>
    );
}

  export default Asistencia;
