import SeguimientoMobileCard from "./SeguimientoMobileCard";
import SeguimientoRow from "./SeguimientoRow";

// La grilla: tabla en escritorio, tarjetas en movil.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Las dos formas se pintan siempre y se esconde una con CSS. Es lo que ya hace
// el resto del proyecto, y evita depender de medir la ventana en JavaScript,
// que en la primera pintada todavia no sabe el ancho real.
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

  const comunes = { columnas, valorDeCelda, onAlternarMarca, onEscribirNota };

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md md:block">
        <table className="min-w-full border-collapse">
          <thead className="bg-purple-50">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 w-16 min-w-16 max-w-16 border-b border-r border-purple-200 bg-purple-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-purple-800"
              >
                #
              </th>
              <th
                scope="col"
                className="sticky left-16 z-10 border-b border-r border-purple-100 bg-purple-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-800"
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
                {...comunes}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {estudiantes.map((estudiante, indice) => (
          <SeguimientoMobileCard
            key={estudiante.estudianteId}
            estudiante={estudiante}
            numero={indice + 1}
            {...comunes}
          />
        ))}
      </div>
    </>
  );
}

export default TablaSeguimiento;
