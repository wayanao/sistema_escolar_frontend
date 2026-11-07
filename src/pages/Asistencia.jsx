import { useCallback, useEffect, useRef, useState } from "react";
import EncabezadoContextoCurso from "../components/EncabezadoContextoCurso";
import AvisoRegistroAsistencia from "../components/asistencia/AvisoRegistroAsistencia";
import BarraGuardadoAsistencia from "../components/asistencia/BarraGuardadoAsistencia";
import PanelAsistenciaProfesor from "../components/asistencia/PanelAsistenciaProfesor";
import useComandosAsistenciaProfesor from "../hooks/asistencia/useComandosAsistenciaProfesor";
import useConsultasAsistenciaProfesor from "../hooks/asistencia/useConsultasAsistenciaProfesor";
import {
  asistenciaRechazadaPorNivel,
  MENSAJE_ASISTENCIA_REQUIERE_JORNADA,
} from "../utils/nivelAcademico";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";

function Asistencia() {
  const avisoSeleccionRef = useRef(false);
  const avisoNivelRef = useRef(false);
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

  // Detecta temprano -antes de mostrar la lista de estudiantes- que la clase
  // elegida no sirve para tomar asistencia (curso preescolar con una materia
  // que no es "Asistencia diaria"). El servidor sigue siendo quien de verdad
  // garantiza esta regla al guardar; esto solo evita que el profesor marque
  // a todo el curso para enterarse recién al final.
  const manejarAsignacionInvalidaPorNivel = useCallback(() => {
    if (avisoNivelRef.current) return;

    avisoNivelRef.current = true;
    alert(MENSAJE_ASISTENCIA_REQUIERE_JORNADA);
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

  useEffect(() => {
    const clase = clases.find((c) => c.id == asignacionId);
    if (!clase) return;

    if (asistenciaRechazadaPorNivel(clase.nivel, clase.materia)) {
      manejarAsignacionInvalidaPorNivel();
    }
  }, [clases, asignacionId, manejarAsignacionInvalidaPorNivel]);

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
        onGuardar={guardarAsistencia}
      />
    </div>
  );
}

export default Asistencia;
