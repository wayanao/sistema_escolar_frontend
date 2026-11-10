import TarjetaResultadoProfesor from "./TarjetaResultadoProfesor";
import { formatearPromedio } from "../../../utils/dashboards/profesor";

function TarjetaMejorRendimiento({
  notasAltas,
  loading,
  error = "",
  cursoFiltroNombre,
  materiaFiltroNombre,
  onVerRanking,
}) {
  const estado = loading
    ? "Cargando rendimiento..."
    : notasAltas.length > 0
      ? null
      : error || "Todavía no hay promedios altos en este curso.";

  return (
    <TarjetaResultadoProfesor
      tono="verde"
      icono="🏆"
      titulo="Mejores promedios"
      descripcion="Los estudiantes que van mejor. Vale la pena felicitarlos."
      etiquetas={[cursoFiltroNombre, materiaFiltroNombre].filter(Boolean)}
      estado={estado}
      estadoEsError={!loading && !notasAltas.length && Boolean(error)}
      filas={notasAltas.map((estudiante, index) => ({
        clave: `${estudiante.nombre}-${index}`,
        posicion: index + 1,
        nombre: estudiante.nombre,
        detalle: `Curso: ${estudiante.curso} · Materia: ${estudiante.materia || materiaFiltroNombre}`,
        valor: formatearPromedio(estudiante.promedio),
        valorClase: "text-green-600",
        unidad: "promedio",
      }))}
      accion={{ texto: "Ver ranking por clase", onClick: onVerRanking }}
    />
  );
}

export default TarjetaMejorRendimiento;
