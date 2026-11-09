import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../../constants/colores";
import { guardarAsistenciaProfesor } from "../../services/asistenciaApi";
import { mostrarEspera } from "../ventanaExito";
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

  // La fecha se cambia en la misma pantalla. Lo marcado era para la fecha
  // anterior: se descarta y se vuelve a tomar lo guardado de la nueva (el
  // historial ya trae todas las fechas del período, no hace falta pedirlo).
  const [fechaDeLaMarcacion, setFechaDeLaMarcacion] = useState(fecha);
  if (fechaDeLaMarcacion !== fecha) {
    setFechaDeLaMarcacion(fecha);
    setAsistencia({});
  }

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
          text: "Elige la fecha arriba, en «Fecha», y vuelve a guardar.",
          confirmButtonText: "Entendido",
          confirmButtonColor: MORADO_BOTON,
        });
        return;
      }
      if (resumenAsistencia.pendientes > 0) {
        await Swal.fire({
          icon: "warning",
          title: "Asistencia incompleta",
          text: `Falta marcar ${resumenAsistencia.pendientes} estudiante${resumenAsistencia.pendientes === 1 ? "" : "s"}.`,
          confirmButtonText: "Seguir revisando",
          confirmButtonColor: MORADO_BOTON,
        });
        return;
      }
      if (!hayCambiosSinGuardar) return;

      const data = construirPayloadAsistencia({
        estudiantes,
        asistencia,
        asignacionId,
        fecha,
        periodo,
      });

      setGuardando(true);
      // Una sola espera (pedido del usuario el 2026-11-07): sin ventana de
      // confirmar, la tarjeta sale al oprimir y pasa a éxito sin cerrarse. El
      // éxito dice cuántos presentes y ausentes quedaron, y la asistencia se
      // puede corregir y volver a guardar.
      const espera = mostrarEspera({
        title: asistenciaDelDiaTomada ? "Actualizando asistencia…" : "Guardando asistencia…",
      });
      try {
        const respuesta = await guardarAsistenciaProfesor(data);
        if (respuesta?.error) {
          await Swal.fire({
            icon: "warning",
            title: "No se pudo guardar",
            text: respuesta.error,
            confirmButtonText: "Entendido",
            confirmButtonColor: MORADO_BOTON,
          });
          return;
        }

        // El éxito sale enseguida; el historial se recarga mientras tanto.
        espera.exito({
          title: asistenciaDelDiaTomada ? "Asistencia actualizada" : "Asistencia guardada",
          text: `${resumenAsistencia.presentes} presentes y ${resumenAsistencia.ausentes} ausentes quedaron registrados correctamente.`,
        });
        try {
          await recargarHistorial();
        } catch (errorRecarga) {
          // Ya quedó guardada: un fallo al recargar no es un fallo al guardar.
          console.error("Error recargando el historial de asistencia", errorRecarga);
        }
      } catch (error) {
        console.error("Error guardando asistencia", error);
        const detalle = error.response?.data?.detail;
        await Swal.fire({
          icon: "error",
          title: "No se pudo guardar",
          text: typeof detalle === "string" ? detalle : "Revisa la conexión e intenta nuevamente.",
          confirmButtonText: "Entendido",
          confirmButtonColor: MORADO_BOTON,
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
