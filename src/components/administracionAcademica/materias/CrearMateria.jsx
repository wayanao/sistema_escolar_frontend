import useComandosMaterias from "../../../hooks/administracionAcademica/useComandosMaterias";
import useMaterias from "../../../hooks/administracionAcademica/useMaterias";
import DialogoCambioNombreMateria from "./DialogoCambioNombreMateria";
import FormularioMateria from "./FormularioMateria";
import ListaMaterias from "./ListaMaterias";

function CrearMateria() {
  const {
    materias,
    setMaterias,
    estadoFiltro,
    setEstadoFiltro,
    recargar,
  } = useMaterias();
  const {
    editId,
    nombre,
    estado,
    avisoCambioNombre,
    actualizarCampo,
    guardarMateria,
    confirmarCambioNombre,
    crearMateriaNuevaDesdeAviso,
    iniciarEdicion,
    cancelarEdicion,
    cambiarEstado,
  } = useComandosMaterias({ estadoFiltro, recargar, setMaterias });

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <FormularioMateria
        editId={editId}
        nombre={nombre}
        estado={estado}
        onActualizarCampo={actualizarCampo}
        onCancelarEdicion={cancelarEdicion}
        onGuardar={guardarMateria}
      />
      <ListaMaterias
        materias={materias}
        estadoFiltro={estadoFiltro}
        onCambiarEstadoFiltro={setEstadoFiltro}
        onCambiarEstado={cambiarEstado}
        onEditar={iniciarEdicion}
      />
      {avisoCambioNombre && (
        <DialogoCambioNombreMateria
          mensaje={avisoCambioNombre.mensaje}
          onCambiarIgual={confirmarCambioNombre}
          onCrearNueva={crearMateriaNuevaDesdeAviso}
        />
      )}
    </div>
  );
}

export default CrearMateria;
