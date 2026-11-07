import { useCallback, useEffect, useRef, useState } from "react";

import { guardarObservacionGeneral } from "../../services/boletinesApi";
import {
  aplicarBorradorObservaciones,
  construirBorradorObservaciones,
  crearClaveBorradorObservaciones,
  LARGO_MAXIMO_OBSERVACION,
  limpiarObservacion,
} from "../../utils/boletines/miCurso";

const leerSesionProfesor = () => {
  try {
    const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
    return { profesorId: profesor?.id ?? null, tenant: profesor?.tenant ?? "" };
  } catch {
    return { profesorId: null, tenant: "" };
  }
};

const leerBorrador = (clave) => {
  if (!clave) return null;
  try {
    const borrador = JSON.parse(localStorage.getItem(clave) || "null");
    return borrador && typeof borrador === "object" ? borrador : null;
  } catch {
    return null;
  }
};

const escribirBorrador = (clave, borrador) => {
  if (!clave) return;
  try {
    if (borrador) localStorage.setItem(clave, JSON.stringify(borrador));
    else localStorage.removeItem(clave);
  } catch (error) {
    // Sin almacenamiento no hay borrador; lo escrito sigue en pantalla.
    console.error("No se pudo guardar el borrador de las observaciones", error);
  }
};

/**
 * La observación general de cada estudiante en «Mi curso» (paso 4 de
 * docs/funcionalidades/MI_CURSO_DIRECTOR.md): lo que se escribe, qué falta
 * guardar, guardar una por una, y el borrador automático para no perder lo
 * escrito si se sale de la pantalla.
 *
 * `datos` es el ranking que ya cargó la consulta; sus `curso.id` y `periodo`
 * son los de lo que está en pantalla, así el borrador nunca se cruza con otro
 * curso o periodo.
 */
export default function useComandosObservacionesDirector({ datos }) {
  const [sesion] = useState(leerSesionProfesor);
  const [textos, setTextos] = useState({});
  const [guardadas, setGuardadas] = useState({});
  const [estados, setEstados] = useState({});
  const [recuperadas, setRecuperadas] = useState(0);
  const cambioDelProfesorRef = useRef(false);

  const clave = datos
    ? crearClaveBorradorObservaciones({
        tenant: sesion.tenant,
        profesorId: sesion.profesorId,
        cursoId: datos.curso?.id,
        periodo: datos.periodo,
      })
    : null;

  // Al llegar el ranking: lo guardado, con el borrador encima.
  useEffect(() => {
    const deServidor = Object.fromEntries(
      (datos?.estudiantes || []).map((estudiante) => [
        String(estudiante.estudianteId),
        estudiante.observacionGeneral || "",
      ]),
    );
    const conBorrador = aplicarBorradorObservaciones(deServidor, leerBorrador(clave));
    cambioDelProfesorRef.current = false;
    setGuardadas(deServidor);
    setTextos(conBorrador.textos);
    setRecuperadas(conBorrador.recuperadas);
    setEstados({});
  }, [clave, datos]);

  // Lo que escribe el profesor va al borrador; lo que llega del servidor no.
  useEffect(() => {
    if (!cambioDelProfesorRef.current) return;
    escribirBorrador(
      clave,
      construirBorradorObservaciones(textos, guardadas, new Date().toISOString()),
    );
  }, [clave, guardadas, textos]);

  const cambiarObservacion = useCallback((estudianteId, texto) => {
    cambioDelProfesorRef.current = true;
    setTextos((actual) => ({
      ...actual,
      [String(estudianteId)]: String(texto ?? "").slice(0, LARGO_MAXIMO_OBSERVACION),
    }));
    setEstados((actual) => ({ ...actual, [String(estudianteId)]: {} }));
  }, []);

  const guardarObservacion = async (estudianteId) => {
    const id = String(estudianteId);
    if (!datos?.curso?.id) return;
    setEstados((actual) => ({ ...actual, [id]: { guardando: true } }));
    try {
      const respuesta = await guardarObservacionGeneral(
        datos.curso.id,
        datos.periodo,
        estudianteId,
        limpiarObservacion(textos[id]),
      );
      const texto = respuesta?.texto ?? "";
      cambioDelProfesorRef.current = true;
      setGuardadas((actual) => ({ ...actual, [id]: texto }));
      setTextos((actual) => ({ ...actual, [id]: texto }));
      setEstados((actual) => ({
        ...actual,
        [id]: {
          guardadaEn: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
        },
      }));
    } catch (error) {
      console.error("No se pudo guardar la observación general", error);
      setEstados((actual) => ({ ...actual, [id]: { error: true } }));
    }
  };

  const estadoDe = (estudianteId) => {
    const id = String(estudianteId);
    const estado = estados[id] || {};
    return {
      texto: textos[id] ?? "",
      sinGuardar: (textos[id] ?? "") !== (guardadas[id] ?? ""),
      guardando: Boolean(estado.guardando),
      error: Boolean(estado.error),
      guardadaEn: estado.guardadaEn || null,
    };
  };

  const pendientes = Object.keys(textos).filter((id) => textos[id] !== (guardadas[id] ?? "")).length;

  return {
    estadoDe,
    cambiarObservacion,
    guardarObservacion,
    // Se avisa mientras quede algo recuperado sin guardar.
    recuperadas: pendientes > 0 ? recuperadas : 0,
  };
}
