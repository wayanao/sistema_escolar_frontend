import useComandosIngresoBoletinProfesor from "../hooks/boletines/useComandosIngresoBoletinProfesor";
import useConsultaIngresoBoletinProfesor from "../hooks/boletines/useConsultaIngresoBoletinProfesor";
import useComandosObservacionesDirector from "../hooks/boletines/useComandosObservacionesDirector";
import useConsultaMiCursoDirector from "../hooks/boletines/useConsultaMiCursoDirector";
import useVistaPreviaBoletinProfesor from "../hooks/boletines/useVistaPreviaBoletinProfesor";
import useEditorFirma from "../hooks/firmas/useEditorFirma";
import useFirmaGuardada from "../hooks/firmas/useFirmaGuardada";
import VistaIngresoBoletinProfesor from "../components/boletin/VistaIngresoBoletinProfesor";
import CuadroFirma from "../components/firmas/CuadroFirma";

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
    cantidadPlanillaCambiada,
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
  const observaciones = useComandosObservacionesDirector({ datos: miCurso.datos });

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
      cantidadPlanillaCambiada={cantidadPlanillaCambiada}
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
        cuadroFirma: <MiFirmaPanel />,
        observaciones: {
          estadoDe: observaciones.estadoDe,
          onCambiar: observaciones.cambiarObservacion,
          onGuardar: observaciones.guardarObservacion,
          recuperadas: observaciones.recuperadas,
        },
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

// La firma del director de grupo para el boletín (docs/funcionalidades/
// FIRMAS_BOLETIN.md, paso 3). La pone él mismo: el servidor guarda la del
// profesor de la sesión. Se monta solo con «Mi curso» abierto.
function MiFirmaPanel() {
  const firma = useFirmaGuardada("mia");
  const editor = useEditorFirma();

  const guardar = async () => {
    const resultado = await firma.guardar(editor.imagen);
    if (resultado.estado === "exito") editor.cerrar();
  };

  return (
    <CuadroFirma
      titulo="Tu firma para los boletines"
      descripcion="Sale en los boletines de tu curso, sobre la raya «Director de Grupo». Solo la ven tú y los administradores."
      variante="profesor"
      firma={firma.firma}
      cargando={firma.cargando}
      guardando={firma.guardando}
      mensajeError={firma.mensajeError}
      editor={editor}
      onElegirFoto={editor.elegirFoto}
      onAbrirDibujo={editor.abrirDibujo}
      onCambiarDibujo={editor.cambiarDibujo}
      onGuardar={guardar}
      onCancelar={editor.cerrar}
      onQuitar={firma.quitar}
    />
  );
}
