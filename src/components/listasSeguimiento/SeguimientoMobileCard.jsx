import { LIMITE_NOTA_SEGUIMIENTO } from "../../utils/listasSeguimiento/marcas";

// La misma fila, en tarjeta, para pantallas estrechas.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Es una tarjeta y no la tabla con scroll horizontal a proposito: esta
// pantalla es una grilla normal, no un documento A4 como el boletin o la
// cartera, asi que se adapta al ancho en vez de obligar a arrastrar de lado.
function SeguimientoMobileCard({
  estudiante,
  numero,
  columnas = [],
  valorDeCelda,
  onAlternarMarca,
  onEscribirNota,
}) {
  const nombreCompleto = `${estudiante.apellido} ${estudiante.nombre}`.trim();

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-200 text-xs font-semibold tabular-nums text-purple-700">
          {numero}
        </span>
        <h3
          className="text-sm font-semibold capitalize text-gray-900"
          translate="no"
        >
          {nombreCompleto}
        </h3>
      </header>

      {columnas.length === 0 ? (
        <p className="text-sm text-gray-500">Sin columnas todavía.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {columnas.map((columna) => {
            const celda = valorDeCelda(estudiante.estudianteId, columna.id);

            return (
              <li
                key={`${estudiante.estudianteId}-${columna.id}`}
                className="rounded-md border border-gray-100 bg-gray-50 p-3"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <input
                    type="checkbox"
                    className="h-5 w-5 cursor-pointer accent-purple-700"
                    checked={celda.marcado}
                    aria-label={`${columna.nombre}: ${nombreCompleto}`}
                    onChange={() =>
                      onAlternarMarca?.(estudiante.estudianteId, columna.id)
                    }
                  />
                  <span translate="no">{columna.nombre}</span>
                </label>

                <input
                  type="text"
                  value={celda.nota}
                  maxLength={LIMITE_NOTA_SEGUIMIENTO}
                  placeholder="Nota (opcional)"
                  aria-label={`Nota de ${columna.nombre} para ${nombreCompleto}`}
                  className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  onChange={(evento) =>
                    onEscribirNota?.(
                      estudiante.estudianteId,
                      columna.id,
                      evento.target.value,
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export default SeguimientoMobileCard;
