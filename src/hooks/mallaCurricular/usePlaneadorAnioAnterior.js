import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../../constants/colores";
import {
  consultarPlaneadorAnioAnterior,
  traerPlaneadorAnioAnterior,
} from "../../services/mallaCurricularApi";
import { puedeTraerPlaneadorAnterior } from "../../utils/mallaCurricular/planeadorAnual";
import { mostrarExito } from "../ventanaExito";
import { mensajeDeErrorAnio } from "../../utils/anioLectivo";

/**
 * Año lectivo, fase 7 (paso 7.3): el botón "Traer el planeador del año pasado".
 *
 * Pregunta al backend solo cuando el periodo cargado llegó vacío, y una sola
 * vez: con alguna fila guardada el planeador no está vacío, y la respuesta no
 * depende del periodo. El backend decide (`puede_traer`). Al traer, recarga el
 * periodo con la función que recibe, como el guardado.
 */
export function usePlaneadorAnioAnterior({ asignacionId }) {
  const [puedeTraer, setPuedeTraer] = useState(false);
  const [trayendo, setTrayendo] = useState(false);
  const consultadoRef = useRef(false);
  const vigenciaRef = useRef(0);

  useEffect(() => () => {
    vigenciaRef.current += 1;
  }, []);

  const alCargarPeriodo = useCallback(async (conFilas) => {
    if (conFilas) {
      // Una consulta en curso ya no sirve: el planeador tiene contenido.
      vigenciaRef.current += 1;
      consultadoRef.current = true;
      setPuedeTraer(false);
      return;
    }
    if (consultadoRef.current || !asignacionId) return;

    consultadoRef.current = true;
    const vigencia = vigenciaRef.current;
    try {
      const respuesta = await consultarPlaneadorAnioAnterior(asignacionId);
      if (vigencia !== vigenciaRef.current) return;
      setPuedeTraer(puedeTraerPlaneadorAnterior(respuesta));
    } catch (error) {
      if (vigencia !== vigenciaRef.current) return;
      // Sin respuesta no se ofrece; el siguiente periodo vacío vuelve a preguntar.
      consultadoRef.current = false;
      console.error("Error consultando el planeador del año pasado", error);
      setPuedeTraer(false);
    }
  }, [asignacionId]);

  const traer = useCallback(async ({ recargarPlaneadores }) => {
    if (!asignacionId) return;

    setTrayendo(true);
    try {
      const respuesta = await traerPlaneadorAnioAnterior(asignacionId);
      setPuedeTraer(false);
      await recargarPlaneadores();
      await mostrarExito({
        title: "Planeador traído",
        text: respuesta?.message || "Se trajo el planeador del año pasado.",
      });
    } catch (error) {
      console.error("Error trayendo el planeador del año pasado", error);
      // Si el backend respondió (409 ya tiene contenido, 404 nada que traer,
      // 403 o 409 del año), el botón ya no sirve. Sin respuesta, se puede
      // reintentar.
      if (error?.response) setPuedeTraer(false);
      await Swal.fire({
        icon: "error",
        title: "No se pudo traer el planeador",
        text: mensajeDeErrorAnio(
          error,
          error?.response ? "Intenta nuevamente." : "No se pudo conectar. Intenta nuevamente."
        ),
        confirmButtonText: "Entendido",
        confirmButtonColor: MORADO_BOTON,
      });
    } finally {
      setTrayendo(false);
    }
  }, [asignacionId]);

  return { alCargarPeriodo, puedeTraer, traer, trayendo };
}
