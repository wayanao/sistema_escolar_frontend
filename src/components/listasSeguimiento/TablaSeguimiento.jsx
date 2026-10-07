import SeguimientoRow from "./SeguimientoRow";

// La grilla: la misma tabla en el celular y en el PC.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Hasta el 2026-10-07, por debajo de 1024 px se mostraban tarjetas, una por
// alumno. El usuario pidio ver en el celular la misma tabla que en el PC. Si
// no cabe, se desliza de lado, y el numero y el nombre se quedan fijos a la
// izquierda para que siempre se sepa de quien es la fila.
//
// Un curso **sin columnas** no es un error: es la pantalla recien estrenada.
// Muestra a los alumnos y espera a que el admin cree la primera.
function TablaSeguimiento({
  columnas = [],
  estudiantes = [],
  valorDeCelda,
  onAlternarMarca,
  onEscribirNota,
}) {
  if (estudiantes.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Este curso no tiene estudiantes.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md">
      <table className="min-w-full border-collapse">
        <thead className="bg-purple-50">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 w-16 min-w-16 max-w-16 border-b border-r border-purple-200 bg-purple-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-purple-800"
            >
              #
            </th>
            {/* Menos relleno en el celular, igual que las celdas del nombre
                en SeguimientoRow. */}
            <th
              scope="col"
              className="sticky left-16 z-10 border-b border-r border-purple-100 bg-purple-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-800 sm:px-6"
            >
              Estudiante
            </th>
            {columnas.map((columna) => (
              <th
                key={columna.id}
                scope="col"
                className="min-w-[180px] border-b border-purple-100 px-2 py-3 text-center text-xs font-semibold text-purple-800"
                translate="no"
              >
                {columna.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((estudiante, indice) => (
            <SeguimientoRow
              key={estudiante.estudianteId}
              estudiante={estudiante}
              numero={indice + 1}
              columnas={columnas}
              valorDeCelda={valorDeCelda}
              onAlternarMarca={onAlternarMarca}
              onEscribirNota={onEscribirNota}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaSeguimiento;
