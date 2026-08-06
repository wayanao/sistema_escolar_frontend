import VistaInventario from "../components/inventarioVentas/VistaInventario";
import useFormularioProducto from "../hooks/inventarioVentas/useFormularioProducto";
import useInventario from "../hooks/inventarioVentas/useInventario";

function InventarioAdmin() {
  const {
    productos,
    loading,
    estadoFiltro,
    setEstadoFiltro,
    cargarInventario,
    aplicarEstadoLocal,
  } = useInventario();

  const {
    showForm,
    editingId,
    formData,
    cambiarCampoFormulario,
    alternarFormulario,
    editarProducto,
    handleSubmit,
    cambiarEstadoProducto,
  } = useFormularioProducto({ cargarInventario, aplicarEstadoLocal });

  return (
    <VistaInventario
      productos={productos}
      loading={loading}
      estadoFiltro={estadoFiltro}
      onCambiarFiltro={setEstadoFiltro}
      showForm={showForm}
      editingId={editingId}
      formData={formData}
      onCambiarCampo={cambiarCampoFormulario}
      onAlternarFormulario={alternarFormulario}
      onSubmit={handleSubmit}
      onEditarProducto={editarProducto}
      onCambiarEstadoProducto={cambiarEstadoProducto}
    />
  );
}

export default InventarioAdmin;
