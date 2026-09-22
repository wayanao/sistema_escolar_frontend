import { LIMITE_NOTA_SEGUIMIENTO } from "../../utils/listasSeguimiento/marcas";

// Una fila de la grilla de escritorio.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Cada celda es un check mas una nota corta. Lo que muestra sale de
// `valorDeCelda`, que ya mezcla el cambio pendiente sobre lo guardado: esta
// fila no sabe cual es cual, ni le hace falta.
//
// El `maxLength` de la nota es el limite real de la tabla. Cortar el texto al
// enviarlo seria peor -se perderia sin avisar-, asi que se corta al escribir,
// que es donde el usuario lo ve.
function SeguimientoRow({
  estudiante,
  numero,
  columnas = [],
  valorDeCelda,
  onAlternarMarca,
  onEscribirNota,
}) {
  const nombreCompleto = `${estudiante.apellido} ${estudiante.nombre}`.trim();

  return (
    <tr className="hover:bg-gray-50">
      <td className="sticky left-0 z-20 w-16 min-w-16 max-w-16 border-b border-r border-b-gray-100/70 border-r-purple-300 bg-purple-200 px-3 py-4 text-center">
        <span className="text-sm font-semibold tabular-nums text-purple-700">
          {numero}
        </span>
      </td>

      <td className="sticky left-16 z-10 truncate border-b border-r border-b-gray-100/70 border-r-violet-100/50 bg-white px-6 py-4">
        <div
          className="text-sm font-medium capitalize text-gray-900"
          title={nombreCompleto}
          translate="no"
        >
          {nombreCompleto}
        </div>
      </td>

      {columnas.map((columna, indice) => {
        const celda = valorDeCelda(estudiante.estudianteId, columna.id);

        return (
          <td
            key={`${estudiante.estudianteId}-${columna.id}`}
            className={`min-w-[180px] border-b border-b-gray-100/70 px-2 py-4 align-top ${
              indice < columnas.length - 1 ? "border-r border-violet-100/50" : ""
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <input
                type="checkbox"
                className="h-5 w-5 cursor-pointer accent-purple-700"
                checked={celda.marcado}
                aria-label={`${columna.nombre}: ${nombreCompleto}`}
                onChange={() =>
                  onAlternarMarca?.(estudiante.estudianteId, columna.id)
                }
              />
              <input
                type="text"
                value={celda.nota}
                maxLength={LIMITE_NOTA_SEGUIMIENTO}
                placeholder="Nota (opcional)"
                aria-label={`Nota de ${columna.nombre} para ${nombreCompleto}`}
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-transparent focus:ring-2 focus:ring-purple-500"
                onChange={(evento) =>
                  onEscribirNota?.(
                    estudiante.estudianteId,
                    columna.id,
                    evento.target.value,
                  )
                }
              />
            </div>
          </td>
        );
      })}
    </tr>
  );
}

export default SeguimientoRow;
