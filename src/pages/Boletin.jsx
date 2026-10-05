import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useConsultaBoletinesAdministrativos from "../hooks/boletines/useConsultaBoletinesAdministrativos";
import BoletinImprimible from "../components/boletin/BoletinImprimible";
import SeleccionBoletinAdministrativo from "../components/boletin/SeleccionBoletinAdministrativo";

export default function Boletin() {
  // Solo consulta e imprime: el año elegido cambia qué se ve, no hay botones
  // que esconder.
  const { parametros } = useAnioLectivo();
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
  } = useConsultaBoletinesAdministrativos({ parametrosAnio: parametros });

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
