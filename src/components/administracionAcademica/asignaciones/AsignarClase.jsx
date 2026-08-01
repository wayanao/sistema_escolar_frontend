import FormularioAsignacion from "./FormularioAsignacion";
import HorarioCursoAsignacion from "./HorarioCursoAsignacion";
import SelectorCursoAsignacion from "./SelectorCursoAsignacion";
import useComandosAsignaciones from "../../../hooks/administracionAcademica/useComandosAsignaciones";
import useDatosAsignaciones from "../../../hooks/administracionAcademica/useDatosAsignaciones";
import useDisponibilidadAsignacion from "../../../hooks/administracionAcademica/useDisponibilidadAsignacion";

function AsignarClase() {
    const {
        profesores,
        cursos,
        materias,
        listaAsignaciones,
        cargando,
        recargar,
    } = useDatosAsignaciones();
    const {
        cursoId,
        profesorId,
        materiaId,
        dia,
        horaInicio,
        horaFin,
        editandoId,
        guardando,
        mensajeEstado,
        cursoSeleccionado,
        asignacionesCurso,
        seleccionarCurso,
        actualizarCampo,
        iniciarEdicion,
        cancelarEdicion,
        guardarAsignacion,
        desactivarAsignacion,
    } = useComandosAsignaciones({
        cursos,
        listaAsignaciones,
        recargar,
    });

    const { disponibilidad, cargandoDisponibilidad } = useDisponibilidadAsignacion({
        profesorId,
        dia,
        editandoId,
    });

    if (cargando) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-500">
                Cargando asignador de clases...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <SelectorCursoAsignacion
                cursoId={cursoId}
                cursos={cursos}
                cursoSeleccionado={cursoSeleccionado}
                onSeleccionarCurso={seleccionarCurso}
            />

            <FormularioAsignacion
                cursoId={cursoId}
                profesorId={profesorId}
                materiaId={materiaId}
                dia={dia}
                horaInicio={horaInicio}
                horaFin={horaFin}
                editandoId={editandoId}
                guardando={guardando}
                mensajeEstado={mensajeEstado}
                profesores={profesores}
                materias={materias}
                disponibilidad={disponibilidad}
                cargandoDisponibilidad={cargandoDisponibilidad}
                onActualizarCampo={actualizarCampo}
                onCancelarEdicion={cancelarEdicion}
                onGuardar={guardarAsignacion}
            />

            <HorarioCursoAsignacion
                asignaciones={asignacionesCurso}
                cursoSeleccionado={cursoSeleccionado}
                editandoId={editandoId}
                onEditar={iniciarEdicion}
                onDesactivar={desactivarAsignacion}
                guardando={guardando}
            />
        </div>
    );
}

export default AsignarClase;
