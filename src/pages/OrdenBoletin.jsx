import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useComandosOrdenBoletin from "../hooks/boletines/useComandosOrdenBoletin";
import useConsultaOrdenBoletin from "../hooks/boletines/useConsultaOrdenBoletin";
import VistaOrdenBoletin from "../components/boletin/VistaOrdenBoletin";

export default function OrdenBoletin() {
  const { parametros, permisos } = useAnioLectivo();
  const {
    cargandoCursos,
    cargandoOrden,
    cursoId,
    cursos,
    cursoSeleccionado,
    materias: materiasIniciales,
    mensaje: mensajeConsulta,
    cambiarCurso,
  } = useConsultaOrdenBoletin({ parametrosAnio: parametros });
  const {
    guardando,
    materias,
    mensaje,
    guardarOrden,
    moverAPosicion,
    moverMateria,
    ordenarAlfabetico,
  } = useComandosOrdenBoletin({
    cursoId,
    materiasIniciales,
    mensajeConsulta,
  });

  return (
    <VistaOrdenBoletin
      cargandoCursos={cargandoCursos}
      cargandoOrden={cargandoOrden}
      cursoId={cursoId}
      cursos={cursos}
      cursoSeleccionado={cursoSeleccionado}
      guardando={guardando}
      materias={materias}
      mensaje={mensaje}
      puedeEditar={permisos.puedeEditar}
      onCambiarCurso={cambiarCurso}
      onGuardarOrden={guardarOrden}
      onMoverAPosicion={moverAPosicion}
      onMoverMateria={moverMateria}
      onOrdenarAlfabetico={ordenarAlfabetico}
    />
  );
}
