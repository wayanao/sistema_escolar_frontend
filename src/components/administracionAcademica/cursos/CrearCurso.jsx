import useAnioLectivo from "../../../hooks/anioLectivo/useAnioLectivo";
import useComandosCursos from "../../../hooks/administracionAcademica/useComandosCursos";
import useCursos from "../../../hooks/administracionAcademica/useCursos";
import { ESTADO_PREPARACION } from "../../../utils/anioLectivo";
import FormularioCurso from "./FormularioCurso";
import ListaCursos from "./ListaCursos";

function CrearCurso() {
    const { anioSeleccionado, parametros, permisos } = useAnioLectivo();
    const esPreparacion = anioSeleccionado?.estado === ESTADO_PREPARACION;
    const anioLectivoIdCreacion = esPreparacion ? anioSeleccionado.id : null;
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
    } = useComandosCursos({
        estadoFiltro,
        recargar,
        setCursos,
        anioLectivoIdCreacion,
    });

    // La API vuelve a validar el destino. Aquí solo se muestra la acción que
    // corresponde: alta normal en el activo o alta explícita en preparación.
    const puedeCrear = permisos.esAnioActivo || esPreparacion;
    const mostrarFormulario = editId ? permisos.puedeEditar : puedeCrear;

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
