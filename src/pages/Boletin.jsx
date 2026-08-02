import useConsultaBoletinesAdministrativos from "../hooks/boletines/useConsultaBoletinesAdministrativos";
import BoletinImprimible from "../components/boletin/BoletinImprimible";
import SeleccionBoletinAdministrativo from "../components/boletin/SeleccionBoletinAdministrativo";

export default function Boletin() {
  const {
    boletinData,
    busqueda,
    cargando,
    cargandoBoletin,
    cursoSeleccionado,
    cursos,
    estudiantesFiltrados,
    periodo,
    cambiarBusqueda,
    cambiarCurso,
    cambiarPeriodo,
    consultarBoletin,
    limpiarBoletin,
  } = useConsultaBoletinesAdministrativos();

  const generarBoletin = async (estudianteId) => {
    const { error } = await consultarBoletin(estudianteId);
    if (error) {
      alert(
        "Error al cargar el boletín. " +
          (error.response?.data?.detail || error.message),
      );
    }
  };

  if (boletinData) {
    return (
      <BoletinImprimible
        boletinData={boletinData}
        onVolver={limpiarBoletin}
      />
    );
  }

  return (
    <SeleccionBoletinAdministrativo
      busqueda={busqueda}
      cargando={cargando}
      cargandoBoletin={cargandoBoletin}
      cursoSeleccionado={cursoSeleccionado}
      cursos={cursos}
      estudiantes={estudiantesFiltrados}
      periodo={periodo}
      onCambiarBusqueda={cambiarBusqueda}
      onCambiarCurso={cambiarCurso}
      onCambiarPeriodo={cambiarPeriodo}
      onGenerarBoletin={generarBoletin}
    />
  );
}
