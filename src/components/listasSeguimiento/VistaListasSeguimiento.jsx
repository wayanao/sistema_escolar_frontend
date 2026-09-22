import BarraGuardadoSeguimiento from "./BarraGuardadoSeguimiento";
import GestionColumnasSeguimiento from "./GestionColumnasSeguimiento";
import TablaSeguimiento from "./TablaSeguimiento";

// La pantalla entera, sin saber de dónde salen los datos.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Presentacional: recibe todo por props y no importa nada de `services/`. El
// cableado con los hooks vive en `src/pages/ListasSeguimientoAdmin.jsx`.
//
// Este módulo arma su propio selector de curso, como ya hacen Boletín y Tipos
// de Pago. No se extrae un componente común hasta que haga falta.
function VistaListasSeguimiento({
  cursos = [],
  cursoId = null,
  onSeleccionarCurso,
  lista,
  cargando = false,
  error = null,
  onCrearColumna,
  creandoColumna = false,
  onEliminarColumna,
  eliminandoColumnaId = null,
  valorDeCelda,
  onAlternarMarca,
  onEscribirNota,
  cantidadCambios = 0,
  guardando = false,
  onGuardar,
  onDescartar,
}) {
  const columnas = lista?.columnas ?? [];
  const estudiantes = lista?.estudiantes ?? [];
  const hayCurso = Boolean(cursoId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Listas de Seguimiento
      </h1>

      <div className="mb-6 max-w-sm">
        <label
          className="mb-1 block text-sm font-medium text-gray-700"
          htmlFor="curso-listas-seguimiento"
        >
          Curso
        </label>
        <select
          id="curso-listas-seguimiento"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
          value={cursoId ?? ""}
          onChange={(evento) => onSeleccionarCurso?.(evento.target.value)}
        >
          <option value="">Selecciona un curso</option>
          {cursos.map((curso) => (
            <option key={curso.id} value={curso.id} translate="no">
              {curso.nombre}
            </option>
          ))}
        </select>
      </div>

      {!hayCurso && (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Elige un curso para ver su lista de seguimiento.
        </p>
      )}

      {hayCurso && error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {hayCurso && !error && cargando && (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Cargando la lista...
        </p>
      )}

      {hayCurso && !error && !cargando && (
        <>
          <GestionColumnasSeguimiento
            columnas={columnas}
            onCrear={onCrearColumna}
            creando={creandoColumna}
            onEliminar={onEliminarColumna}
            eliminandoColumnaId={eliminandoColumnaId}
          />

          <TablaSeguimiento
            columnas={columnas}
            estudiantes={estudiantes}
            valorDeCelda={valorDeCelda}
            onAlternarMarca={onAlternarMarca}
            onEscribirNota={onEscribirNota}
          />

          {/* La barra solo aparece si hay algo que marcar. Sin columnas no hay
              celdas, y una barra que nunca se puede usar solo estorba. */}
          {columnas.length > 0 && estudiantes.length > 0 && (
            <div className="mt-4">
              <BarraGuardadoSeguimiento
                cantidadCambios={cantidadCambios}
                guardando={guardando}
                onGuardar={onGuardar}
                onDescartar={onDescartar}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VistaListasSeguimiento;
