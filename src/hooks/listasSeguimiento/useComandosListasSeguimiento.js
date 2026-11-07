import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../../constants/colores";
import {
  crearColumnaEnTodosLosCursos,
  crearColumnaSeguimiento,
  eliminarColumnaSeguimiento,
  guardarMarcasSeguimiento,
} from "../../services/listasSeguimientoApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import {
  mensajeAltaMasiva,
  validarNombreColumna,
} from "../../utils/listasSeguimiento/columnas";
import {
  claveCelda,
  construirPayloadMarcas,
  obtenerMarcaCelda,
} from "../../utils/listasSeguimiento/marcas";
import { mostrarExito } from "../ventanaExito";

const COLOR_BOTON = MORADO_BOTON;

const mensajeDeError = (error, porDefecto) => {
  const detalle = error?.response?.data?.detail;
  return typeof detalle === "string" && detalle ? detalle : porDefecto;
};

// Hook de comando: estado editable y escrituras.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Dos ritmos distintos, y es deliberado:
//
// - Las **marcas** se juntan en memoria y se mandan todas juntas con "Guardar
//   cambios". Guardar en cada click o en cada tecla escrita en una nota seria
//   una peticion por pulsacion.
// - El **alta y baja de columnas** si es inmediata, con confirmacion. Cambia
//   la forma de la grilla, no su contenido, y esperar a "Guardar" dejaria la
//   pantalla mintiendo sobre que columnas existen.
//
// `parametrosAnio`: el año que mira el admin. Solo lo necesita "en todos los
// cursos", que sin él crea en los del año activo; lo demás parte del curso.
export default function useComandosListasSeguimiento({
  cursoId,
  lista,
  setLista,
  recargar,
  parametrosAnio,
}) {
  // Indexados por celda, NUNCA en un array. Es lo que hace imposible mandar la
  // misma celda dos veces: el backend escribe el lote en una sola sentencia y
  // PostgreSQL la aborta entera si una celda se repite. Con un mapa, el
  // segundo cambio a una celda pisa al primero.
  const [cambios, setCambios] = useState(() => new Map());
  const [guardando, setGuardando] = useState(false);
  const [creandoColumna, setCreandoColumna] = useState(false);
  const [eliminandoColumnaId, setEliminandoColumnaId] = useState(null);

  const comandoEnCursoRef = useRef(false);

  // Cambiar de curso descarta lo pendiente. Conservarlo aplicaria las marcas
  // de un curso sobre otro, que es peor que perderlas. Avisar antes de
  // cambiar, si hay cambios, es trabajo de la pantalla: para eso expone
  // `hayCambios`.
  useEffect(() => {
    setCambios(new Map());
  }, [cursoId]);

  const hayCambios = cambios.size > 0;

  const estudiantePorId = useMemo(() => {
    const mapa = new Map();
    lista?.estudiantes?.forEach((estudiante) => {
      mapa.set(estudiante.estudianteId, estudiante);
    });
    return mapa;
  }, [lista]);

  /** Lo que la celda muestra ahora: el cambio pendiente si lo hay, y si no, lo guardado. */
  const valorDeCelda = useCallback(
    (estudianteId, columnaId) => {
      const pendiente = cambios.get(claveCelda(estudianteId, columnaId));
      if (pendiente) {
        return { marcado: pendiente.marcado, nota: pendiente.nota };
      }
      return obtenerMarcaCelda(estudiantePorId.get(estudianteId), columnaId);
    },
    [cambios, estudiantePorId],
  );

  // Si el valor nuevo coincide con el guardado, el cambio se retira en vez de
  // apuntarse. Sin esto, marcar y desmarcar la misma casilla dejaria el boton
  // "Guardar cambios" encendido sin nada que guardar.
  const registrarCambio = useCallback(
    (estudianteId, columnaId, siguiente) => {
      const guardado = obtenerMarcaCelda(
        estudiantePorId.get(estudianteId),
        columnaId,
      );

      setCambios((previos) => {
        const mapa = new Map(previos);
        const clave = claveCelda(estudianteId, columnaId);

        if (
          siguiente.marcado === guardado.marcado &&
          siguiente.nota === guardado.nota
        ) {
          mapa.delete(clave);
        } else {
          mapa.set(clave, { columnaId, estudianteId, ...siguiente });
        }

        return mapa;
      });
    },
    [estudiantePorId],
  );

  const alternarMarca = useCallback(
    (estudianteId, columnaId) => {
      const actual = valorDeCelda(estudianteId, columnaId);
      registrarCambio(estudianteId, columnaId, {
        marcado: !actual.marcado,
        nota: actual.nota,
      });
    },
    [registrarCambio, valorDeCelda],
  );

  const escribirNota = useCallback(
    (estudianteId, columnaId, nota) => {
      const actual = valorDeCelda(estudianteId, columnaId);
      registrarCambio(estudianteId, columnaId, {
        marcado: actual.marcado,
        nota: String(nota ?? ""),
      });
    },
    [registrarCambio, valorDeCelda],
  );

  const descartarCambios = useCallback(() => {
    setCambios(new Map());
  }, []);

  const guardarCambios = useCallback(async () => {
    if (comandoEnCursoRef.current || !cursoId) return;

    const payload = construirPayloadMarcas(cambios);
    // El backend responde 422 a un lote vacio. Ni siquiera se intenta: no hay
    // nada que decirle al usuario que no sepa ya.
    if (payload.length === 0) return;

    const confirmacion = await Swal.fire({
      icon: "question",
      title: "¿Guardar los cambios?",
      text: `Se van a guardar ${payload.length} ${payload.length === 1 ? "celda" : "celdas"}.`,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: COLOR_BOTON,
    });
    if (!confirmacion.isConfirmed) return;

    comandoEnCursoRef.current = true;
    setGuardando(true);
    try {
      await guardarMarcasSeguimiento(cursoId, payload);
      // Se limpia antes de recargar: si se limpiara despues y la recarga
      // fallara, los cambios ya guardados seguirian marcados como pendientes y
      // el usuario los mandaria dos veces.
      setCambios(new Map());
      await recargar();
      await mostrarExito({ title: "Cambios guardados" });
    } catch (error) {
      console.error("Error guardando las marcas", error);
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: mensajeDeError(error, "Revisa la conexión e intenta de nuevo."),
        confirmButtonText: "Entendido",
        confirmButtonColor: COLOR_BOTON,
      });
    } finally {
      setGuardando(false);
      comandoEnCursoRef.current = false;
    }
  }, [cambios, cursoId, recargar]);

  const crearColumna = useCallback(
    async (nombre, { enTodosLosCursos = false } = {}) => {
      if (comandoEnCursoRef.current || !cursoId) return false;

      // **Con `enTodosLosCursos`, un nombre repetido deja de ser un error**, y
      // por eso se valida contra una lista vacia: escribir un nombre que el
      // curso actual ya tiene significa justamente "creala en los demas". El
      // backend salta los que ya la tengan, asi que no hay nada que bloquear.
      // Las otras dos reglas -ni vacio ni demasiado largo- se siguen aplicando.
      const validacion = validarNombreColumna(
        nombre,
        enTodosLosCursos ? [] : lista?.columnas,
      );
      if (!validacion.valido) {
        await Swal.fire({
          icon: "warning",
          title: "Atención",
          text: validacion.error,
          confirmButtonText: "Entendido",
          confirmButtonColor: COLOR_BOTON,
        });
        return false;
      }

      comandoEnCursoRef.current = true;
      setCreandoColumna(true);
      try {
        if (enTodosLosCursos) {
          // Mirando otro año, el año viaja (sin él, las columnas irían a los
          // cursos del año activo); mirando el activo, la llamada de siempre.
          const opcionesDelAnio = opcionesConAnio(undefined, parametrosAnio);
          const resumen = opcionesDelAnio
            ? await crearColumnaEnTodosLosCursos(validacion.nombre, opcionesDelAnio)
            : await crearColumnaEnTodosLosCursos(validacion.nombre);
          // Aqui **si** hay que recargar, al contrario que en el alta suelta:
          // la respuesta son conteos, no la columna de este curso, asi que no
          // hay nada que agregar a mano a la grilla.
          await recargar();
          await mostrarExito({ title: "Listo", text: mensajeAltaMasiva(resumen) });
          return true;
        }

        const creada = await crearColumnaSeguimiento(cursoId, validacion.nombre);
        // Se agrega a la grilla en vez de recargar todo: la respuesta ya trae
        // id y nombre, y una columna recien creada no tiene marcas.
        setLista((actual) => ({
          ...actual,
          columnas: [
            ...(actual?.columnas ?? []),
            { id: Number(creada?.id), nombre: String(creada?.nombre ?? validacion.nombre) },
          ],
        }));
        return true;
      } catch (error) {
        console.error("Error creando la columna", error);
        // El 409 llega aunque la comprobacion local haya dicho que el nombre
        // estaba libre: entre una cosa y otra, otra pestaña puede haber creado
        // la misma columna. La regla de verdad es el indice unico del backend.
        await Swal.fire({
          icon: error?.response?.status === 409 ? "warning" : "error",
          title: "No se pudo crear la columna",
          text: mensajeDeError(error, "Revisa la conexión e intenta de nuevo."),
          confirmButtonText: "Entendido",
          confirmButtonColor: COLOR_BOTON,
        });
        return false;
      } finally {
        setCreandoColumna(false);
        comandoEnCursoRef.current = false;
      }
    },
    [cursoId, lista, parametrosAnio, recargar, setLista],
  );

  const eliminarColumna = useCallback(
    async (columna) => {
      if (comandoEnCursoRef.current || !cursoId || !columna?.id) return false;

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: `¿Borrar "${columna.nombre}"?`,
        text: "Se borran también todas sus marcas. Esto no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Borrar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      });
      if (!confirmacion.isConfirmed) return false;

      comandoEnCursoRef.current = true;
      setEliminandoColumnaId(columna.id);
      try {
        await eliminarColumnaSeguimiento(cursoId, columna.id);

        // Los cambios pendientes de esa columna se van con ella. Si se
        // quedaran, el siguiente "Guardar cambios" mandaria celdas de una
        // columna que ya no existe y el backend rechazaria el lote **entero**
        // con 422, incluidas las celdas buenas.
        setCambios((previos) => {
          const mapa = new Map();
          previos.forEach((cambio, clave) => {
            if (cambio.columnaId !== columna.id) mapa.set(clave, cambio);
          });
          return mapa;
        });

        await recargar();
        return true;
      } catch (error) {
        console.error("Error borrando la columna", error);
        await Swal.fire({
          icon: "error",
          title: "No se pudo borrar la columna",
          text: mensajeDeError(error, "Revisa la conexión e intenta de nuevo."),
          confirmButtonText: "Entendido",
          confirmButtonColor: COLOR_BOTON,
        });
        return false;
      } finally {
        setEliminandoColumnaId(null);
        comandoEnCursoRef.current = false;
      }
    },
    [cursoId, recargar],
  );

  return {
    cambios,
    hayCambios,
    valorDeCelda,
    alternarMarca,
    escribirNota,
    descartarCambios,
    guardarCambios,
    guardando,
    crearColumna,
    creandoColumna,
    eliminarColumna,
    eliminandoColumnaId,
  };
}
