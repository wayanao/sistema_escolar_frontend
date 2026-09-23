// La lista en papel, para rellenar a mano.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md, "Ampliación: imprimir".
//
// **Las celdas van vacías a propósito**, aunque en pantalla haya marcas. Esto
// no es un informe de lo registrado: es la plantilla en blanco que el usuario
// pidió para llevarse e ir marcando. Por eso tampoco imprime las notas, y por
// eso no recibe `valorDeCelda` ni nada parecido: no tiene con qué pintarlas
// aunque alguien quisiera.
//
// El título "Listas de control", el escudo y el curso no están aquí: los pone
// `DocumentoImprimible`, que es quien sabe de identidad institucional. Este
// componente es solo la rejilla.
function ListaSeguimientoImprimible({ columnas = [], estudiantes = [] }) {
  if (estudiantes.length === 0) {
    return (
      <p className="text-center text-sm text-slate-600">
        Este curso no tiene estudiantes.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-[11px] text-slate-800">
      {/* El `thead` se repite solo en cada página al imprimir: es lo que hacen
          los navegadores con las cabeceras de tabla, y aquí conviene. */}
      <thead>
        <tr>
          <th className="w-8 border border-slate-400 bg-slate-100 px-1 py-2 text-center font-semibold">
            #
          </th>
          <th className="border border-slate-400 bg-slate-100 px-2 py-2 text-left font-semibold">
            Estudiante
          </th>
          {columnas.map((columna) => (
            <th
              key={columna.id}
              className="border border-slate-400 bg-slate-100 px-1 py-2 text-center font-semibold"
              translate="no"
            >
              {columna.nombre}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {estudiantes.map((estudiante, indice) => (
          <tr key={estudiante.estudianteId} className="h-8">
            <td className="border border-slate-400 px-1 text-center tabular-nums">
              {indice + 1}
            </td>
            <td className="border border-slate-400 px-2 capitalize" translate="no">
              {`${estudiante.apellido} ${estudiante.nombre}`.trim()}
            </td>
            {columnas.map((columna) => (
              // Vacía. El alto de la fila es lo único que importa aquí: tiene
              // que caber una marca hecha a mano.
              <td
                key={`${estudiante.estudianteId}-${columna.id}`}
                className="border border-slate-400"
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ListaSeguimientoImprimible;
