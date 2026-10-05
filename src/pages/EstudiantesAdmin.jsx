import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DetalleEstudianteAdmin from "../components/estudiantesObservador/admin/DetalleEstudianteAdmin";
import EncabezadoEstudiantesAdmin from "../components/estudiantesObservador/admin/EncabezadoEstudiantesAdmin";
import FormularioEstudianteAdmin from "../components/estudiantesObservador/admin/FormularioEstudianteAdmin";
import ListaEstudiantesAdmin from "../components/estudiantesObservador/admin/ListaEstudiantesAdmin";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useCambioEstadoEstudianteAdmin from "../hooks/estudiantesObservador/useCambioEstadoEstudianteAdmin";
import useDetalleEstudianteAdmin from "../hooks/estudiantesObservador/useDetalleEstudianteAdmin";
import useFormularioEstudianteAdmin from "../hooks/estudiantesObservador/useFormularioEstudianteAdmin";
import useListadoEstudiantesAdmin from "../hooks/estudiantesObservador/useListadoEstudiantesAdmin";

function EstudiantesAdmin() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const { parametros, permisos } = useAnioLectivo();
  // Mirando otro año, aunque esté en preparación, solo consulta: un estudiante
  // no es de un año, así que crearlo, editarlo o cambiarle el estado desde
  // otro año cambiaría también el de hoy (y el backend todavía no valida de
  // qué año es el curso que se le pone).
  const sePuedeModificar = permisos.esAnioActivo;
  const {
    setEstudiantes,
    estudiantesFiltrados,
    cursos,
    loading,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    error: errorListado,
    recargar: cargarDatos,
  } = useListadoEstudiantesAdmin({
    habilitado: usuario?.rol === "admin",
    parametrosAnio: parametros,
  });
  const {
    selectedEstudiante,
    setSelectedEstudiante,
    detallesEstudiante,
    loadingDetalles,
    verDetalles,
    cerrarModal,
  } = useDetalleEstudianteAdmin({ parametrosAnio: parametros });
  const {
    showForm,
    editingId,
    estudianteData,
    setEstudianteData,
    alternarFormulario,
    cancelarFormulario,
    cargarEstudianteAEditar: cargarEdicion,
    guardarEstudiante,
  } = useFormularioEstudianteAdmin({ recargar: cargarDatos });
  const { cambiarEstado: ejecutarCambioEstado } =
    useCambioEstadoEstudianteAdmin({
      estadoFiltro,
      setEstudiantes,
      selectedEstudiante,
      setSelectedEstudiante,
    });

  useEffect(() => {
    if (!errorListado) return;
    console.error("Error cargando datos:", errorListado);
    alert("Error al cargar datos");
  }, [errorListado]);

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const resultado = await guardarEstudiante();

    if (resultado.estado === "validacion") {
      alert("Completa los campos obligatorios");
      return;
    }
    if (resultado.estado === "exito") {
      alert(
        resultado.modo === "edicion"
          ? "Estudiante actualizado correctamente"
          : "Estudiante creado correctamente",
      );
      return;
    }
    console.error("Error:", resultado.error);
    alert("Error en la operación del estudiante");
  };

  const cargarEstudianteAEditar = async (estudianteId) => {
    const resultado = await cargarEdicion(estudianteId);
    if (resultado.estado === "error") {
      console.error("Error:", resultado.error);
      alert("Error de conexión");
    }
  };

  const cambiarEstadoEstudiante = async (estudiante, nuevoEstado) => {
    const resultado = await ejecutarCambioEstado(estudiante, nuevoEstado);
    if (resultado.estado === "error") {
      console.error("Error cambiando estado:", resultado.error);
      alert("No se pudo cambiar el estado del estudiante");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <EncabezadoEstudiantesAdmin
        searchTerm={searchTerm}
        onCambiarBusqueda={setSearchTerm}
        estadoFiltro={estadoFiltro}
        onCambiarEstadoFiltro={setEstadoFiltro}
        showForm={showForm}
        onAlternarFormulario={alternarFormulario}
        puedeCrear={sePuedeModificar}
      />
      <FormularioEstudianteAdmin
        visible={showForm}
        editingId={editingId}
        estudianteData={estudianteData}
        setEstudianteData={setEstudianteData}
        cursos={cursos}
        onSubmit={handleSubmit}
        onCancelar={cancelarFormulario}
      />
      <ListaEstudiantesAdmin
        estudiantes={estudiantesFiltrados}
        cursos={cursos}
        onVerDetalles={verDetalles}
        onCambiarEstado={cambiarEstadoEstudiante}
        onEditar={cargarEstudianteAEditar}
        puedeEditar={sePuedeModificar}
      />
      <DetalleEstudianteAdmin
        estudiante={selectedEstudiante}
        cursos={cursos}
        detalles={detallesEstudiante}
        cargando={loadingDetalles}
        onCerrar={cerrarModal}
      />
    </div>
  );
}

export default EstudiantesAdmin;
