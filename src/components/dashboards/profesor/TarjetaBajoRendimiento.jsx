import TarjetaResultadoProfesor from "./TarjetaResultadoProfesor";
import { claseNotaBaja, formatearPromedio } from "../../../utils/dashboards/profesor";

// Hermana de TarjetaMejorRendimiento: el color del promedio lo decide el campo
// `color` del backend, mientras que en la otra tarjeta es fijo.
function TarjetaBajoRendimiento({
  notasBajas,
  loading,
  error = "",
  cursoFiltroNombre,
  materiaFiltroNombre,
  onVerRanking,
}) {
  const estado = loading
    ? "Cargando rendimiento..."
    : notasBajas.length > 0
      ? null
      : error || "Nadie está por debajo de 3.0 en este curso.";

  return (
    <TarjetaResultadoProfesor
      tono="ambar"
      icono="📉"
      titulo="Necesitan refuerzo"
      descripcion="Estudiantes con promedio por debajo de 3.0."
      etiquetas={[cursoFiltroNombre, materiaFiltroNombre].filter(Boolean)}
      estado={estado}
      estadoEsError={!loading && !notasBajas.length && Boolean(error)}
      filas={notasBajas.map((estudiante, index) => ({
        clave: `${estudiante.nombre}-${index}`,
        posicion: index + 1,
        nombre: estudiante.nombre,
        detalle: `Curso: ${estudiante.curso} · Materia: ${estudiante.materia || materiaFiltroNombre}`,
        valor: formatearPromedio(estudiante.promedio),
        valorClase: claseNotaBaja(estudiante.color),
        unidad: "promedio",
      }))}
      accion={{ texto: "Ver ranking por clase", onClick: onVerRanking }}
    />
  );
}

export default TarjetaBajoRendimiento;
