import useAnioLectivo from "../../../hooks/anioLectivo/useAnioLectivo";
import useComandosCursos from "../../../hooks/administracionAcademica/useComandosCursos";
import useCursos from "../../../hooks/administracionAcademica/useCursos";
import FormularioCurso from "./FormularioCurso";
import ListaCursos from "./ListaCursos";

function CrearCurso() {
    const { parametros, permisos } = useAnioLectivo();
    const {
        cursos,
        setCursos,
        estadoFiltro,
        setEstadoFiltro,
        profesores,
        recargar,
    } = useCursos({ parametrosAnio: parametros });
    const {
        editId,
        nombre,
        jornada,
        estado,
        nivel,
        director_grupo_id: directorGrupoId,
        actualizarCampo,
        guardarCurso,
        iniciarEdicion,
        cancelarEdicion,
        cambiarEstado,
    } = useComandosCursos({ estadoFiltro, recargar, setCursos });

    // Un curso nuevo siempre nace en el año activo, así que mirando otro año
    // el formulario solo aparece para editar uno de ese año, si se puede
    // (en preparación, sí; en un año cerrado, no).
    const mostrarFormulario = editId ? permisos.puedeEditar : permisos.esAnioActivo;

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {mostrarFormulario && (
                <FormularioCurso
                    editId={editId}
                    nombre={nombre}
                    jornada={jornada}
                    estado={estado}
                    nivel={nivel}
                    director_grupo_id={directorGrupoId}
                    profesores={profesores}
                    onActualizarCampo={actualizarCampo}
                    onCancelarEdicion={cancelarEdicion}
                    onGuardar={guardarCurso}
                />
            )}
            <ListaCursos
                cursos={cursos}
                estadoFiltro={estadoFiltro}
                puedeEditar={permisos.puedeEditar}
                onCambiarEstadoFiltro={setEstadoFiltro}
                onCambiarEstado={cambiarEstado}
                onEditar={iniciarEdicion}
            />
        </div>
    );
}

export default CrearCurso;
