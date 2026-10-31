import { useCallback, useState } from "react";
import { guardarCuadrosPlan } from "../../services/planeacionesApi";
import { detalleError } from "../../utils/planeaciones/admin";
import {
  armarEnvioCuadros,
  crearBorradorCuadros,
  validarBorradorCuadros,
} from "../../utils/planeaciones/cuadros";

/**
 * La ventana del admin para renombrar los cuadros del plan. Ver
 * docs/funcionalidades/NOMBRES_CUADROS_PLAN.md.
 *
 * `cuadros` y `disponible` vienen de `useCuadrosPlan`. Mientras el admin no
 * escriba, los valores salen de `cuadros`: si la ventana se abrió antes de que
 * terminara la lectura, muestra lo leído en cuanto llega. **Sin `disponible`
 * no se guarda**: guardar reemplaza la lista entera y borraría los nombres del
 * colegio que no se alcanzaron a leer.
 *
 * "Volver a los originales" solo cambia el borrador; se guarda con "Guardar",
 * como cualquier otro cambio, y "Cancelar" lo descarta.
 */
export default function useEdicionCuadrosPlanAdmin({ cuadros, disponible, onGuardados }) {
  const [abierta, setAbierta] = useState(false);
  const [borrador, setBorrador] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");

  const valores = borrador ?? crearBorradorCuadros(cuadros);

  const abrir = useCallback(() => {
    setBorrador(null);
    setErrores({});
    setError("");
    setAviso("");
    setAbierta(true);
  }, []);

  const cerrar = useCallback(() => {
    if (!guardando) setAbierta(false);
  }, [guardando]);

  const cambiar = useCallback(
    (clave, campo, valor) => {
      setBorrador((anterior) => {
        const base = anterior ?? crearBorradorCuadros(cuadros);
        return { ...base, [clave]: { ...base[clave], [campo]: valor } };
      });
      setErrores((anteriores) => {
        if (!anteriores[clave]?.[campo]) return anteriores;
        const restantes = { ...anteriores[clave] };
        delete restantes[campo];
        const siguientes = { ...anteriores, [clave]: restantes };
        if (!Object.keys(restantes).length) delete siguientes[clave];
        return siguientes;
      });
    },
    [cuadros],
  );

  const volverAOriginales = useCallback(() => {
    setBorrador(crearBorradorCuadros());
    setErrores({});
    setError("");
  }, []);

  const guardar = useCallback(async () => {
    if (!disponible || guardando) return;
    const encontrados = validarBorradorCuadros(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      setError("Revisa los cuadros marcados.");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      const data = await guardarCuadrosPlan(armarEnvioCuadros(valores));
      onGuardados(data);
      setAbierta(false);
      setAviso("Nombres guardados.");
    } catch (requestError) {
      console.error("Error guardando los nombres de los cuadros del plan", requestError);
      setError(
        detalleError(requestError, "No se pudieron guardar los nombres. Intenta de nuevo."),
      );
    } finally {
      setGuardando(false);
    }
  }, [disponible, guardando, onGuardados, valores]);

  return {
    abierta,
    valores,
    errores,
    error,
    guardando,
    aviso,
    abrir,
    cerrar,
    cambiar,
    volverAOriginales,
    guardar,
  };
}
