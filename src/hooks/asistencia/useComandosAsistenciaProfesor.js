import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { guardarAsistenciaProfesor } from "../../services/asistenciaApi";
import {
  construirPayloadAsistencia,
  crearMarcacionTodosPresentes,
  ESTADO_AUSENTE,
  indexarHistorialPorEstudiante,
  obtenerAsistenciaGuardadaEnFecha,
  resumirAsistencia,
  tieneCambiosDeAsistencia,
} from "../../utils/asistencia/profesor";

export default function useComandosAsistenciaProfesor({
  asignacionId,
  periodo,
  fecha,
  estudiantes,
  historial,
  historialListo,
  errorHistorial,
  recargarHistorial,
}) {
  const [asistencia, setAsistencia] = useState({});
  const [guardando, setGuardando] = useState(false);
  const comandoEnCursoRef = useRef(false);

  const historialPorEstudiante = useMemo(
    () => indexarHistorialPorEstudiante(historial),
    [historial],
  );

  const asistenciaGuardadaHoy = useMemo(
    () => obtenerAsistenciaGuardadaEnFecha(historialPorEstudiante, fecha),
    [fecha, historialPorEstudiante],
  );

  const asistenciaDelDiaTomada = asistenciaGuardadaHoy.size > 0;
  const asistenciaGuardada = useMemo(
    () => Object.fromEntries(asistenciaGuardadaHoy),
    [asistenciaGuardadaHoy],
  );

  useEffect(() => {
    if (!historialListo) return;

    setAsistencia((actual) => {
      if (Object.keys(actual).length > 0) return actual;
      return asistenciaGuardada;
    });
  }, [asistenciaGuardada, historialListo]);

  const resumenAsistencia = useMemo(
    () => resumirAsistencia(estudiantes, asistencia),
    [asistencia, estudiantes],
  );

  const hayCambiosSinGuardar = useMemo(
    () => tieneCambiosDeAsistencia(estudiantes, asistencia, asistenciaGuardada),
    [asistencia, asistenciaGuardada, estudiantes],
  );

  const puedeInteractuar =
    historialListo && !errorHistorial && estudiantes.length > 0 && !guardando;
  const puedeGuardar =
    puedeInteractuar
    && Boolean(fecha)
    && resumenAsistencia.pendientes === 0
    && hayCambiosSinGuardar;

  const marcar = useCallback((id, estado) => {
    setAsistencia((actual) => ({
      ...actual,
      [id]: estado,
    }));
  }, []);

  const marcarTodosPresentes = useCallback(async () => {
    if (!puedeInteractuar) return;

    const reemplazaAusencias = estudiantes.some(
      (estudiante) => asistencia[estudiante.estudiante_id] === ESTADO_AUSENTE,
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

    setAsistencia(crearMarcacionTodosPresentes(estudiantes));
  }, [asistencia, estudiantes, puedeInteractuar]);

  const restaurarSeleccion = useCallback(() => {
    if (!puedeInteractuar || !hayCambiosSinGuardar) return;
    setAsistencia(asistenciaDelDiaTomada ? asistenciaGuardada : {});
  }, [
    asistenciaDelDiaTomada,
    asistenciaGuardada,
    hayCambiosSinGuardar,
    puedeInteractuar,
  ]);

  const guardarAsistencia = useCallback(async () => {
    if (comandoEnCursoRef.current) return;
    comandoEnCursoRef.current = true;

    try {
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

      const data = construirPayloadAsistencia({
        estudiantes,
        asistencia,
        asignacionId,
        fecha,
        periodo,
      });

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
        await guardarAsistenciaProfesor(data);
        await recargarHistorial();
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
    } finally {
      comandoEnCursoRef.current = false;
    }
  }, [
    asignacionId,
    asistencia,
    asistenciaDelDiaTomada,
    estudiantes,
    fecha,
    hayCambiosSinGuardar,
    periodo,
    recargarHistorial,
    resumenAsistencia,
  ]);

  return {
    asistencia,
    historialPorEstudiante,
    asistenciaGuardadaHoy,
    asistenciaDelDiaTomada,
    resumenAsistencia,
    hayCambiosSinGuardar,
    puedeInteractuar,
    puedeGuardar,
    guardando,
    marcar,
    marcarTodosPresentes,
    restaurarSeleccion,
    guardarAsistencia,
  };
}
