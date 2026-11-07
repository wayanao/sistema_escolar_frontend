import useComandosIngresoBoletinProfesor from "../hooks/boletines/useComandosIngresoBoletinProfesor";
import useConsultaIngresoBoletinProfesor from "../hooks/boletines/useConsultaIngresoBoletinProfesor";
import useVistaPreviaBoletinProfesor from "../hooks/boletines/useVistaPreviaBoletinProfesor";
import VistaIngresoBoletinProfesor from "../components/boletin/VistaIngresoBoletinProfesor";

export default function IngresoBoletinProfesor() {
  const {
    asignacionId,
    cargando,
    clasesUnicas,
    datosIniciales,
    estadoGuardadoInicial,
    estudiantes,
    periodo,
    porcentajesIncompletos,
    cambiarAsignacion,
    cambiarPeriodo,
  } = useConsultaIngresoBoletinProfesor();
  const {
    datosBoletin,
    estadoGuardado,
    guardandoTodos,
    aplicarLogrosDelPrimerEstudiante,
    actualizarObservacion,
    guardarBoletinEstudiante,
    guardarTodosBoletines,
    obtenerEstadoVisual,
  } = useComandosIngresoBoletinProfesor({
    asignacionId,
    periodo,
    estudiantes,
    datosIniciales,
    estadoGuardadoInicial,
    porcentajesIncompletos,
  });
  const {
    vistaPrevia,
    abrirVistaPrevia,
    cerrarVistaPrevia,
    verAnterior,
    verSiguiente,
  } = useVistaPreviaBoletinProfesor({
    asignacionId,
    periodo,
    clases: clasesUnicas,
    estudiantes,
    datosBoletin,
    estadoGuardado,
  });

  return (
    <VistaIngresoBoletinProfesor
      asignacionId={asignacionId}
      cargando={cargando}
      clases={clasesUnicas}
      datosBoletin={datosBoletin}
      estudiantes={estudiantes}
      guardandoTodos={guardandoTodos}
      periodo={periodo}
      onAplicarLogros={aplicarLogrosDelPrimerEstudiante}
      onCambiarAsignacion={cambiarAsignacion}
      onCambiarPeriodo={cambiarPeriodo}
      onGuardarEstudiante={guardarBoletinEstudiante}
      onGuardarTodos={guardarTodosBoletines}
      onObservacionChange={actualizarObservacion}
      obtenerEstadoVisual={obtenerEstadoVisual}
      vistaPrevia={vistaPrevia}
      onVerVistaPrevia={abrirVistaPrevia}
      onCerrarVistaPrevia={cerrarVistaPrevia}
      onVistaPreviaAnterior={verAnterior}
      onVistaPreviaSiguiente={verSiguiente}
    />
  );
}
