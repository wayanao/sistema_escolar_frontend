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
import { ESTADO_PREPARACION } from "../utils/anioLectivo";

function EstudiantesAdmin() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const { anioSeleccionado, parametros, permisos } = useAnioLectivo();
  const esPreparacion = anioSeleccionado?.estado === ESTADO_PREPARACION;
  // Crear, editar o cambiar el estado global es solo del año activo. Desde el
  // paso E5 de la entrevista de admisión, un estudiante nuevo del año en
  // preparación entra solo desde una admisión aprobada (antes había aquí un
  // alta directa); quien sigue, por la promoción de Años lectivos.
  const puedeCrear = permisos.esAnioActivo;
  const puedeEditar = permisos.esAnioActivo;
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
    datosAdmision,
    cargandoDatosAdmision,
    errorDatosAdmision,
    respuestasAdmision,
    errorRespuestasAdmision,
    verDatosAdmision,
  } = useDetalleEstudianteAdmin({ parametrosAnio: parametros });
  const {
    showForm,
    editingId,
    estudianteData,
    setEstudianteData,
    guardando,
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
        puedeCrear={puedeCrear}
      />
      {esPreparacion && (
        <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
          <p>
            Un estudiante nuevo de {anioSeleccionado.anio} se matricula desde Admisiones,
            después de su entrevista aprobada. Quien ya estudia pasa con Matricular
            estudiantes, en Años lectivos.
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin/anios-lectivos/admisiones")}
            className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 sm:w-auto"
          >
            Ir a admisiones
          </button>
        </div>
      )}
      <FormularioEstudianteAdmin
        visible={showForm}
        editingId={editingId}
        estudianteData={estudianteData}
        setEstudianteData={setEstudianteData}
        cursos={cursos}
        onSubmit={handleSubmit}
        onCancelar={cancelarFormulario}
        guardando={guardando}
      />
      <ListaEstudiantesAdmin
        estudiantes={estudiantesFiltrados}
        cursos={cursos}
        onVerDetalles={verDetalles}
        onCambiarEstado={cambiarEstadoEstudiante}
        onEditar={cargarEstudianteAEditar}
        puedeEditar={puedeEditar}
      />
      <DetalleEstudianteAdmin
        estudiante={selectedEstudiante}
        cursos={cursos}
        detalles={detallesEstudiante}
        cargando={loadingDetalles}
        onCerrar={cerrarModal}
        datosAdmision={datosAdmision}
        cargandoDatosAdmision={cargandoDatosAdmision}
        errorDatosAdmision={errorDatosAdmision}
        onVerDatosAdmision={verDatosAdmision}
        respuestasAdmision={respuestasAdmision}
        errorRespuestasAdmision={errorRespuestasAdmision}
      />
    </div>
  );
}

export default EstudiantesAdmin;
