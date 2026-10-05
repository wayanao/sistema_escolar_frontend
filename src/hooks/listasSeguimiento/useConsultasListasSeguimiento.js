import { useCallback, useEffect, useRef, useState } from "react";
import {
  obtenerCursosListasSeguimiento,
  obtenerListaSeguimiento,
} from "../../services/listasSeguimientoApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import { normalizarListaSeguimiento } from "../../utils/listasSeguimiento/marcas";

const LISTA_VACIA = normalizarListaSeguimiento(null);

// Hook de consulta: cargar y recargar. Las escrituras viven en
// useComandosListasSeguimiento.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Este módulo pide su propio GET /cursos y arma su propio selector, como ya
// hacen Boletín y Tipos de Pago. No se extrae un componente común hasta que
// haga falta: es política establecida del proyecto.
//
// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// Los cursos son los de ese año; la lista de un curso parte de su id.
export default function useConsultasListasSeguimiento({ parametrosAnio } = {}) {
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState(null);
  const [lista, setLista] = useState(LISTA_VACIA);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // La petición en curso. Sirve para descartar la respuesta de un curso que el
  // usuario ya dejó atrás: sin esto, elegir 1A y enseguida 2B puede terminar
  // pintando los alumnos de 1A sobre el título de 2B, y no hay nada en
  // pantalla que delate el cambiazo.
  const solicitudRef = useRef(null);

  const cancelar = useCallback(() => {
    solicitudRef.current?.abort();
    solicitudRef.current = null;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    obtenerCursosListasSeguimiento(
      opcionesConAnio({ signal: controller.signal }, parametrosAnio),
    )
      .then((data) => {
        if (!controller.signal.aborted) setCursos(Array.isArray(data) ? data : []);
      })
      .catch((fallo) => {
        if (!controller.signal.aborted) console.error("Error cargando cursos", fallo);
      });

    return () => controller.abort();
  }, [parametrosAnio]);

  const recargar = useCallback(async () => {
    if (!cursoId) {
      cancelar();
      setLista(LISTA_VACIA);
      setError(null);
      return;
    }

    solicitudRef.current?.abort();
    const controller = new AbortController();
    solicitudRef.current = controller;
    setCargando(true);
    setError(null);

    try {
      const data = await obtenerListaSeguimiento(cursoId, {
        signal: controller.signal,
      });

      if (solicitudRef.current !== controller || controller.signal.aborted) return;
      setLista(normalizarListaSeguimiento(data));
    } catch (fallo) {
      if (solicitudRef.current !== controller || controller.signal.aborted) return;
      console.error("Error cargando la lista de seguimiento", fallo);
      setLista(LISTA_VACIA);
      setError(
        fallo?.response?.data?.detail ||
          "No se pudo cargar la lista. Revisa la conexión e intenta de nuevo.",
      );
    } finally {
      if (solicitudRef.current === controller) {
        solicitudRef.current = null;
        setCargando(false);
      }
    }
  }, [cancelar, cursoId]);

  useEffect(() => {
    void recargar();
    return cancelar;
  }, [cancelar, recargar]);

  // Al cambiar de curso se limpia la grilla antes de pedir la nueva. Dejar la
  // del curso anterior mientras carga es lo que hace creer al usuario que ya
  // está viendo el curso que acaba de elegir.
  const seleccionarCurso = useCallback((valor) => {
    const numero = Number(valor);
    setLista(LISTA_VACIA);
    setError(null);
    setCursoId(Number.isFinite(numero) && numero > 0 ? numero : null);
  }, []);

  return {
    cursos,
    cursoId,
    seleccionarCurso,
    lista,
    setLista,
    cargando,
    error,
    recargar,
  };
}
