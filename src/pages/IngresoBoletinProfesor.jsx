import useComandosIngresoBoletinProfesor from "../hooks/boletines/useComandosIngresoBoletinProfesor";
import useConsultaIngresoBoletinProfesor from "../hooks/boletines/useConsultaIngresoBoletinProfesor";
import useConsultaMiCursoDirector from "../hooks/boletines/useConsultaMiCursoDirector";
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
    primerEstudianteConFormulario,
    progresoGrupo,
    actualizarObservacion,
    confirmarDescartarCambios,
    copiarLogrosYGuardar,
    guardarBoletinEstudiante,
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

  // «Mi curso»: solo para quien dirige un curso; usa el mismo periodo.
  const miCurso = useConsultaMiCursoDirector({ periodo });

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
      idPrimerEstudiante={primerEstudianteConFormulario?.estudiante_id ?? null}
      miCurso={{
        disponible: miCurso.disponible,
        vistaMiCurso: miCurso.vistaMiCurso,
        cursos: miCurso.cursos,
        cursoId: miCurso.cursoId,
        datos: miCurso.datos,
        cargando: miCurso.cargando,
        error: miCurso.error,
        onCambiarCurso: miCurso.cambiarCurso,
        onMostrarMiCurso: miCurso.mostrarMiCurso,
        onMostrarMisMaterias: miCurso.mostrarMisMaterias,
        onReintentar: miCurso.reintentar,
      }}
      periodo={periodo}
      progresoGrupo={progresoGrupo}
      onCopiarLogrosYGuardar={copiarLogrosYGuardar}
      errorAlumnos={errorAlumnos}
      errorClases={errorClases}
      onCambiarAsignacion={cambiarAsignacionConAviso}
      onCambiarPeriodo={cambiarPeriodoConAviso}
      onDescartarBorrador={descartarBorrador}
      onReintentarAlumnos={recargarAlumnos}
      onReintentarClases={recargarClases}
      onGuardarEstudiante={guardarBoletinEstudiante}
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
