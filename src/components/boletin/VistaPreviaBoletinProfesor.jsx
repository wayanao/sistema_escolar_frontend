import { usaDesarrolloInfantil } from "../../utils/boletines/generacionBoletin";
import DocumentoImprimible from "../impresion/DocumentoImprimible";
import {
  Escala,
  FichaEstudianteBoletin,
  MateriaBoletin,
} from "./BoletinImprimible";

/**
 * Cómo va quedando el boletín de un estudiante, con el formato real del
 * colegio pero solo con las materias del profesor en ese curso: las de otros
 * profesores, el promedio y el puesto no dependen de él. La que está llenando
 * muestra lo escrito aunque no esté guardado; las otras, lo último guardado.
 * Cerrar con Escape y no desplazar la página de atrás lo hace
 * `useVistaPreviaBoletinProfesor`: los componentes del módulo no tienen hooks.
 */
export default function VistaPreviaBoletinProfesor({
  vistaPrevia,
  estadoVisual,
  onAnterior,
  onSiguiente,
  onCerrar,
}) {
  const {
    nombre,
    curso,
    periodo,
    materia,
    otrasMaterias = [],
    tieneOtrasMaterias = false,
    cargandoOtrasMaterias = false,
    posicion,
    total,
    hayAnterior,
    haySiguiente,
    pendienteDeGuardar,
  } = vistaPrevia;
  const datos = [
    ["Grado", curso],
    ["Fecha", new Date().toLocaleDateString("es-CO")],
  ];
  const otrasCargadas = cargandoOtrasMaterias
    ? []
    : otrasMaterias.filter((otra) => !otra.error);
  const otrasConError = cargandoOtrasMaterias
    ? []
    : otrasMaterias.filter((otra) => otra.error);
  const todasLasMaterias = [materia, ...otrasCargadas.map((otra) => otra.materia)];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Vista previa del boletín de ${nombre}`}
      className="fixed inset-0 z-[70] flex flex-col bg-slate-900/60"
    >
      <div className="no-print shrink-0 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
              {tieneOtrasMaterias
                ? "Vista previa · tus materias de este curso"
                : "Vista previa · solo tu materia"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-gray-900">{nombre}</h2>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${estadoVisual.badgeClass}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`}
                  aria-hidden="true"
                />
                {estadoVisual.label}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {posicion} de {total}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAnterior}
              disabled={!hayAnterior}
              className="flex-1 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={onSiguiente}
              disabled={!haySiguiente}
              className="flex-1 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
            >
              Siguiente →
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-800 md:flex-none"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* La `key` hace que cada estudiante empiece arriba de la hoja. El
          membrete está en caché, así que no vuelve a cargar. */}
      <div key={vistaPrevia.estudianteId} className="flex-1 overflow-y-auto bg-gray-100">
        <p className="no-print mx-auto mt-4 max-w-3xl px-4 text-center text-sm text-gray-600">
          {pendienteDeGuardar
            ? "Así se verá en el boletín. Lo que estás llenando todavía no está guardado: guárdalo para que le llegue al colegio."
            : "Así se verá en el boletín."}{" "}
          Las materias de otros profesores, el promedio y el puesto los completa el colegio.
        </p>

        <DocumentoImprimible
          tipo="boletin"
          className="di-documento--boletin"
          titulo="Boletín Académico Informativo"
          subtitulo={`Periodo ${periodo} · Año Lectivo ${new Date().getFullYear()}`}
          mostrarBarra={false}
        >
          <FichaEstudianteBoletin nombre={nombre} datos={datos} />
          <Escala usaDesarrolloInfantil={usaDesarrolloInfantil(todasLasMaterias)} />
          <div className="space-y-2">
            {tieneOtrasMaterias && (
              <AvisoMateria className="text-purple-700">La que estás llenando</AvisoMateria>
            )}
            <MateriaBoletin materia={materia} />

            {otrasCargadas.map((otra) => (
              <div key={otra.clave} className="space-y-2">
                {!otra.guardada && (
                  <AvisoMateria className="text-amber-700">
                    {otra.nombre}: aún no la guardas para este estudiante
                  </AvisoMateria>
                )}
                <MateriaBoletin materia={otra.materia} />
              </div>
            ))}

            {cargandoOtrasMaterias && (
              <AvisoMateria className="text-gray-500">
                Cargando tus otras materias de este curso…
              </AvisoMateria>
            )}
            {otrasConError.map((otra) => (
              <AvisoMateria key={otra.clave} className="text-red-700">
                No se pudo cargar {otra.nombre}. Cierra y vuelve a abrir para intentarlo de nuevo.
              </AvisoMateria>
            ))}
          </div>
        </DocumentoImprimible>
      </div>
    </div>
  );
}

// Nota para el profesor dentro de la hoja; no sale si se imprime.
function AvisoMateria({ className, children }) {
  return (
    <p className={`no-print px-1 text-[11px] font-semibold ${className}`}>
      {children}
    </p>
  );
}
