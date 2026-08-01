import useComandosProfesores from "../../../hooks/administracionAcademica/useComandosProfesores";
import useProfesores from "../../../hooks/administracionAcademica/useProfesores";
import FormularioProfesor from "./FormularioProfesor";
import ListaProfesores from "./ListaProfesores";

function CrearProfesor() {
    const {
        profesores,
        setProfesores,
        estadoFiltro,
        setEstadoFiltro,
        recargar,
    } = useProfesores();
    const {
        editId,
        nombre,
        apellido,
        documentoIdentidad,
        email,
        telefono,
        password,
        sueldo,
        estado,
        actualizarCampo,
        guardarProfesor,
        iniciarEdicion,
        cancelarEdicion,
        cambiarEstado,
    } = useComandosProfesores({ estadoFiltro, recargar, setProfesores });

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <FormularioProfesor
                editId={editId}
                nombre={nombre}
                apellido={apellido}
                documentoIdentidad={documentoIdentidad}
                email={email}
                telefono={telefono}
                password={password}
                sueldo={sueldo}
                estado={estado}
                onActualizarCampo={actualizarCampo}
                onCancelarEdicion={cancelarEdicion}
                onGuardar={guardarProfesor}
            />
            <ListaProfesores
                profesores={profesores}
                estadoFiltro={estadoFiltro}
                onCambiarEstadoFiltro={setEstadoFiltro}
                onCambiarEstado={cambiarEstado}
                onEditar={iniciarEdicion}
            />
        </div>
    );
}

export default CrearProfesor;
