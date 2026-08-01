import useComandosCursos from "../../../hooks/administracionAcademica/useComandosCursos";
import useCursos from "../../../hooks/administracionAcademica/useCursos";
import FormularioCurso from "./FormularioCurso";
import ListaCursos from "./ListaCursos";

function CrearCurso() {
    const {
        cursos,
        setCursos,
        estadoFiltro,
        setEstadoFiltro,
        recargar,
    } = useCursos();
    const {
        editId,
        nombre,
        jornada,
        estado,
        actualizarCampo,
        guardarCurso,
        iniciarEdicion,
        cancelarEdicion,
        cambiarEstado,
    } = useComandosCursos({ estadoFiltro, recargar, setCursos });

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <FormularioCurso
                editId={editId}
                nombre={nombre}
                jornada={jornada}
                estado={estado}
                onActualizarCampo={actualizarCampo}
                onCancelarEdicion={cancelarEdicion}
                onGuardar={guardarCurso}
            />
            <ListaCursos
                cursos={cursos}
                estadoFiltro={estadoFiltro}
                onCambiarEstadoFiltro={setEstadoFiltro}
                onCambiarEstado={cambiarEstado}
                onEditar={iniciarEdicion}
            />
        </div>
    );
}

export default CrearCurso;
