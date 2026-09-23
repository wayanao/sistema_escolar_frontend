import { useState } from "react";
import DocumentoImprimible from "../impresion/DocumentoImprimible";
import BarraGuardadoSeguimiento from "./BarraGuardadoSeguimiento";
import GestionColumnasSeguimiento from "./GestionColumnasSeguimiento";
import ListaSeguimientoImprimible from "./ListaSeguimientoImprimible";
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

  // Modo vista previa. Es estado **local**: un modo de visualización, no
  // estado de dominio, igual que el texto del campo de nueva columna. Así la
  // página sigue siendo solo cableado.
  const [imprimiendo, setImprimiendo] = useState(false);

  // Sin columnas no hay casillas que marcar, y una hoja con nombres y nada más
  // no sirve para nada. Sin alumnos, menos. Y sin curso elegido no hay lista
  // que imprimir, por mucho que la anterior siga en memoria.
  const sePuedeImprimir =
    hayCurso && columnas.length > 0 && estudiantes.length > 0;

  const nombreDelCurso =
    cursos.find((curso) => Number(curso.id) === Number(cursoId))?.nombre ?? "";

  if (imprimiendo) {
    return (
      <div className="relative min-h-screen bg-gray-100 px-4 py-10 md:px-8">
        <div className="no-print fixed left-4 top-4 z-50 md:left-6 md:top-6">
          <button
            type="button"
            className="rounded-full bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition hover:bg-slate-900"
            onClick={() => setImprimiendo(false)}
          >
            ← Atrás
          </button>
        </div>

        {/* El botón de imprimir lo pone `DocumentoImprimible`, junto con el
            escudo, el nombre del colegio y el pie. No se le pasan `firmas`:
            el usuario pidió el título, el escudo y nada más. Si el pie con los
            datos de contacto tampoco se quiere, se apaga desde Diseño de
            impresos, que es donde vive esa decisión para todos los impresos. */}
        <DocumentoImprimible
          tipo="reporte_estudiante"
          className="di-documento--listas"
          titulo="Listas de control"
          subtitulo={nombreDelCurso ? `Curso: ${nombreDelCurso}` : undefined}
        >
          <ListaSeguimientoImprimible
            columnas={columnas}
            estudiantes={estudiantes}
          />
        </DocumentoImprimible>
      </div>
    );
  }

  return (
    // Sin ancho ni márgenes laterales propios: el `main` de `App.jsx` ya
    // centra todas las pantallas en 1600px y les pone su padding. Ponerlos
    // aquí otra vez estrechaba esta pantalla a 1280 y duplicaba el margen, así
    // que se veía más centrada que el resto sin motivo. Solo queda el aire
    // vertical, que el layout no da.
    <div className="py-6">
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

      {sePuedeImprimir && (
        <div className="mb-6">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => setImprimiendo(true)}
          >
            Imprimir lista en blanco
          </button>
          <p className="mt-1 text-xs text-gray-500">
            Se imprime la rejilla con los nombres y las columnas, sin las marcas,
            para llenarla a mano.
          </p>
        </div>
      )}

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
            // Sin div envoltorio: la barra es `sticky` y solo puede moverse
            // dentro de su contenedor. Metida en un div de su mismo alto se
            // quedaba sin sitio y no se despegaba nunca.
            <BarraGuardadoSeguimiento
              cantidadCambios={cantidadCambios}
              guardando={guardando}
              onGuardar={onGuardar}
              onDescartar={onDescartar}
            />
          )}
        </>
      )}
    </div>
  );
}

export default VistaListasSeguimiento;
