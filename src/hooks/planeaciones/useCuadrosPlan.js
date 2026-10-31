import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { obtenerCuadrosPlan } from "../../services/planeacionesApi";
import { detalleError } from "../../utils/planeaciones/admin";
import {
  nombresCuadrosPlan,
  normalizarCuadrosPersonalizados,
} from "../../utils/planeaciones/cuadros";

/**
 * Los nombres de los cuadros del plan que usa el colegio. Ver
 * docs/funcionalidades/NOMBRES_CUADROS_PLAN.md.
 *
 * Una sola petición al montar: no se repite al cambiar de fecha, de clase o
 * de plan. Mientras carga, o si falla, `cuadros` trae los originales, así que
 * el formulario nunca se queda sin títulos; `error` solo lo muestra la ventana
 * del admin, que no deja guardar sin haber leído.
 *
 * `reemplazar` recibe la respuesta de guardar, para que la página use los
 * nombres nuevos sin volver a pedirlos.
 */
export default function useCuadrosPlan() {
  const [personalizados, setPersonalizados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const cargaActualRef = useRef(0);

  const recargar = useCallback(async () => {
    const cargaId = cargaActualRef.current + 1;
    cargaActualRef.current = cargaId;
    setCargando(true);
    setError("");

    try {
      const data = await obtenerCuadrosPlan();
      if (cargaActualRef.current !== cargaId) return;
      setPersonalizados(normalizarCuadrosPersonalizados(data));
    } catch (requestError) {
      if (cargaActualRef.current !== cargaId) return;
      console.error("Error cargando los nombres de los cuadros del plan", requestError);
      setError(
        detalleError(requestError, "No se pudieron leer los nombres de los cuadros."),
      );
    } finally {
      if (cargaActualRef.current === cargaId) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
    return () => {
      cargaActualRef.current += 1;
    };
  }, [recargar]);

  const reemplazar = useCallback((respuesta) => {
    cargaActualRef.current += 1;
    setPersonalizados(normalizarCuadrosPersonalizados(respuesta));
    setCargando(false);
    setError("");
  }, []);

  const cuadros = useMemo(() => nombresCuadrosPlan(personalizados), [personalizados]);

  return { cuadros, cargando, error, recargar, reemplazar };
}
