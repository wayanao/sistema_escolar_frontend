import useComandosIngresoBoletinProfesor from "../hooks/boletines/useComandosIngresoBoletinProfesor";
import useConsultaIngresoBoletinProfesor from "../hooks/boletines/useConsultaIngresoBoletinProfesor";
import useVistaPreviaBoletinProfesor from "../hooks/boletines/useVistaPreviaBoletinProfesor";
import VistaIngresoBoletinProfesor from "../components/boletin/VistaIngresoBoletinProfesor";

export default function IngresoBoletinProfesor() {
  const {
    asignacionId,
    cargadoPara,
    cargando,
    clasesUnicas,
    datosIniciales,
    errorAlumnos,
    errorClases,
    estadoGuardadoInicial,
    estudiantes,
    periodo,
    porcentajesIncompletos,
    cambiarAsignacion,
    cambiarPeriodo,
    recargarAlumnos,
    recargarClases,
  } = useConsultaIngresoBoletinProfesor();
  const {
    borradorRecuperado,
    datosBoletin,
    descartarBorrador,
    estadoGuardado,
    guardandoTodos,
    aplicarLogrosDelPrimerEstudiante,
    actualizarObservacion,
    confirmarDescartarCambios,
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
    cargadoPara,
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

  // Cambiar de clase o de periodo: si el navegador no puede guardar el
  // borrador, lo no guardado se pierde y antes se pregunta.
  const cambiarAsignacionConAviso = async (valor) => {
    if (await confirmarDescartarCambios()) cambiarAsignacion(valor);
  };
  const cambiarPeriodoConAviso = async (valor) => {
    if (await confirmarDescartarCambios()) cambiarPeriodo(valor);
  };

  return (
    <VistaIngresoBoletinProfesor
      asignacionId={asignacionId}
      borradorRecuperado={borradorRecuperado}
      cargando={cargando}
      clases={clasesUnicas}
      datosBoletin={datosBoletin}
      estudiantes={estudiantes}
      guardandoTodos={guardandoTodos}
      periodo={periodo}
      onAplicarLogros={aplicarLogrosDelPrimerEstudiante}
      errorAlumnos={errorAlumnos}
      errorClases={errorClases}
      onCambiarAsignacion={cambiarAsignacionConAviso}
      onCambiarPeriodo={cambiarPeriodoConAviso}
      onDescartarBorrador={descartarBorrador}
      onReintentarAlumnos={recargarAlumnos}
      onReintentarClases={recargarClases}
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
