import useComandosOrdenBoletin from "../hooks/boletines/useComandosOrdenBoletin";
import useConsultaOrdenBoletin from "../hooks/boletines/useConsultaOrdenBoletin";
import VistaOrdenBoletin from "../components/boletin/VistaOrdenBoletin";

export default function OrdenBoletin() {
  const {
    cargandoCursos,
    cargandoOrden,
    cursoId,
    cursos,
    cursoSeleccionado,
    materias: materiasIniciales,
    mensaje: mensajeConsulta,
    cambiarCurso,
  } = useConsultaOrdenBoletin();
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
      onCambiarCurso={cambiarCurso}
      onGuardarOrden={guardarOrden}
      onMoverAPosicion={moverAPosicion}
      onMoverMateria={moverMateria}
      onOrdenarAlfabetico={ordenarAlfabetico}
    />
  );
}
