import { useCallback, useEffect, useRef, useState } from "react";
import EncabezadoContextoCurso from "../components/EncabezadoContextoCurso";
import AvisoRegistroAsistencia from "../components/asistencia/AvisoRegistroAsistencia";
import BarraGuardadoAsistencia from "../components/asistencia/BarraGuardadoAsistencia";
import PanelAsistenciaProfesor from "../components/asistencia/PanelAsistenciaProfesor";
import useComandosAsistenciaProfesor from "../hooks/asistencia/useComandosAsistenciaProfesor";
import useConsultasAsistenciaProfesor from "../hooks/asistencia/useConsultasAsistenciaProfesor";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

function Asistencia() {
  const avisoSeleccionRef = useRef(false);
  const [fecha] = useState(localStorage.getItem("fechaAsistencia") || "");
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

  const manejarClaseNoDisponible = useCallback(() => {
    localStorage.removeItem("asignacionId");
    alert("La clase seleccionada ya no está disponible. Selecciónala nuevamente.");
    window.location.href = "/";
  }, []);

  const consultasHabilitadas = Boolean(profesorId && asignacionId && periodo);
  const {
    estudiantes,
    clases,
    historial,
    cargandoHistorial,
    historialListo,
    errorHistorial,
    cargarHistorial,
  } = useConsultasAsistenciaProfesor({
    asignacionId,
    periodo,
    profesorId,
    habilitado: consultasHabilitadas,
    onClaseNoDisponible: manejarClaseNoDisponible,
  });

  const {
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
  } = useComandosAsistenciaProfesor({
    asignacionId,
    periodo,
    fecha,
    estudiantes,
    historial,
    historialListo,
    errorHistorial,
    recargarHistorial: cargarHistorial,
  });

  useEffect(() => {
    if (!profesorId) {
      window.location.href = "/login";
      return;
    }

    if (!asignacionId || !periodo) {
      pedirSeleccionClase();
    }
  }, [asignacionId, periodo, profesorId, pedirSeleccionClase]);

  const claseSeleccionada = clases.find((clase) => clase.id == asignacionId);

  return (
    <div className="w-full p-4 sm:p-6 md:p-8">
      <EncabezadoContextoCurso
        titulo="Gestión de asistencia"
        etiqueta="Control diario"
        descripcion="Registra la asistencia y acompaña el seguimiento de tus estudiantes."
        materia={claseSeleccionada?.materia}
        curso={claseSeleccionada?.curso}
        periodo={periodo}
        fecha={fecha}
      />

      <AvisoRegistroAsistencia
        visible={asistenciaDelDiaTomada}
        hayCambiosSinGuardar={hayCambiosSinGuardar}
        cantidadGuardada={asistenciaGuardadaHoy.size}
        totalEstudiantes={estudiantes.length}
      />

      <PanelAsistenciaProfesor
        estudiantes={estudiantes}
        historialPorEstudiante={historialPorEstudiante}
        asistencia={asistencia}
        cargandoHistorial={cargandoHistorial}
        historialListo={historialListo}
        errorHistorial={errorHistorial}
        puedeInteractuar={puedeInteractuar}
        hayCambiosSinGuardar={hayCambiosSinGuardar}
        asistenciaDelDiaTomada={asistenciaDelDiaTomada}
        resumenAsistencia={resumenAsistencia}
        onReintentarHistorial={cargarHistorial}
        onMarcarTodosPresentes={marcarTodosPresentes}
        onRestaurarSeleccion={restaurarSeleccion}
        onMarcar={marcar}
      />

      <BarraGuardadoAsistencia
        resumenAsistencia={resumenAsistencia}
        hayCambiosSinGuardar={hayCambiosSinGuardar}
        asistenciaDelDiaTomada={asistenciaDelDiaTomada}
        puedeGuardar={puedeGuardar}
        guardando={guardando}
        onGuardar={guardarAsistencia}
      />
    </div>
  );
}

export default Asistencia;
