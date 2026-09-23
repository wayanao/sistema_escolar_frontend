import { useState } from "react";
import { LIMITE_NOMBRE_COLUMNA } from "../../utils/listasSeguimiento/columnas";

// Alta y baja de columnas. Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Es una accion **inmediata**, no entra en el lote de "Guardar cambios":
// cambia la forma de la grilla, no su contenido, y esperar al guardado dejaria
// la pantalla mintiendo sobre que columnas existen.
//
// El borrado se pide por columna, con su propio boton, y no con un desplegable
// como en la Planilla del profesor: aqui las columnas ya estan a la vista en
// la cabecera de la tabla, y elegir en una lista aparte la que ya estas
// mirando es un paso de mas.
//
// El texto del campo es estado **local** a proposito. Es un borrador de la
// interfaz, no estado de dominio: nadie mas lo necesita, y sacarlo al hook
// obligaria a la pagina a acarrearlo. Se limpia solo cuando la creacion sale
// bien, que es lo que informa `onCrear` al devolver `true`.
function GestionColumnasSeguimiento({
  columnas = [],
  onCrear,
  creando = false,
  onEliminar,
  eliminandoColumnaId = null,
  deshabilitado = false,
}) {
  const [nombre, setNombre] = useState("");
  // La casilla **no se desmarca** al crear: si estas dando de alta varias
  // columnas para todo el colegio, desmarcarla cada vez seria una molestia. A
  // cambio, el texto del boton dice siempre en que modo estas, para que nadie
  // cree en 25 cursos creyendo que crea en uno.
  const [enTodosLosCursos, setEnTodosLosCursos] = useState(false);

  const crear = async () => {
    const creada = await onCrear?.(nombre, { enTodosLosCursos });
    if (creada) setNombre("");
  };

  const bloqueado = deshabilitado || creando;

  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-md sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 sm:text-xl">
        Columnas de este curso
      </h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            className="mb-1 block text-sm font-medium text-gray-700"
            htmlFor="nombre-columna-seguimiento"
          >
            Nueva columna
          </label>
          <input
            id="nombre-columna-seguimiento"
            type="text"
            placeholder="Ej: Asistió a la cumbre, Compró el libro..."
            maxLength={LIMITE_NOMBRE_COLUMNA}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
            value={nombre}
            disabled={bloqueado}
            onChange={(evento) => setNombre(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter") {
                evento.preventDefault();
                void crear();
              }
            }}
          />
        </div>

        <button
          type="button"
          disabled={bloqueado}
          aria-busy={creando}
          className="rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={crear}
        >
          {creando
            ? "Agregando..."
            : enTodosLosCursos
              ? "Agregar en todos los cursos"
              : "Agregar columna"}
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-purple-700"
          checked={enTodosLosCursos}
          disabled={bloqueado}
          onChange={(evento) => setEnTodosLosCursos(evento.target.checked)}
        />
        Crear en todos los cursos
      </label>

      {enTodosLosCursos && (
        // Explica de antemano por qué el aviso puede decir "0 creadas": los
        // cursos que ya la tienen se saltan, y eso es lo que hace repetible
        // el botón cuando aparece un curso nuevo.
        <p className="mt-1 text-xs text-gray-500">
          Se creará en los cursos que aún no la tengan. Los que ya la tienen se
          quedan como están.
        </p>
      )}

      {columnas.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Este curso todavía no tiene columnas. Crea la primera para empezar a
          marcar.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {columnas.map((columna) => (
            <li
              key={columna.id}
              className="flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 py-1 pl-3 pr-1 text-sm text-purple-800"
            >
              <span translate="no">{columna.nombre}</span>
              <button
                type="button"
                aria-label={`Borrar columna ${columna.nombre}`}
                disabled={deshabilitado || eliminandoColumnaId === columna.id}
                aria-busy={eliminandoColumnaId === columna.id}
                className="rounded-full px-2 py-0.5 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onEliminar?.(columna)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default GestionColumnasSeguimiento;
