import TarjetaResultadoProfesor from "./TarjetaResultadoProfesor";

// El error se pinta distinto del estado vacío: «nadie ha faltado» y «no se
// pudieron cargar» son dos cosas diferentes. No depende del filtro de curso:
// son las fallas de todos los cursos del profesor.
function TarjetaInasistencias({ inasistencias, loading, error = "" }) {
  const estado = loading
    ? "Cargando inasistencias..."
    : inasistencias.length > 0
      ? null
      : error || "Nadie tiene fallas registradas.";

  return (
    <TarjetaResultadoProfesor
      tono="rojo"
      icono="🚩"
      titulo="Los que más faltan"
      descripcion="Fallas de asistencia en todos tus cursos."
      estado={estado}
      estadoEsError={!loading && !inasistencias.length && Boolean(error)}
      filas={inasistencias.map((item) => ({
        clave: `${item.curso_id}-${item.estudiante_id}-${item.posicion}`,
        posicion: `#${item.posicion}`,
        nombre: item.nombre,
        detalle: `Curso: ${item.curso}`,
        valor: item.total_fallas,
        valorClase: "text-rose-600",
        unidad: Number(item.total_fallas) === 1 ? "falla" : "fallas",
      }))}
    />
  );
}

export default TarjetaInasistencias;
