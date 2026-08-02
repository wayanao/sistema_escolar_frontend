import useComandosIngresoBoletinProfesor from "../hooks/boletines/useComandosIngresoBoletinProfesor";
import useConsultaIngresoBoletinProfesor from "../hooks/boletines/useConsultaIngresoBoletinProfesor";
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
    cambiarAsignacion,
    cambiarPeriodo,
  } = useConsultaIngresoBoletinProfesor();
  const {
    datosBoletin,
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
    />
  );
}
