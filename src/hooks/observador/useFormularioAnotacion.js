import { useCallback, useState } from "react";
import { normalizarTextoObservador } from "../../utils/observador/texto";
import {
  crearFormularioAnotacion,
  puedeGuardarAnotacion,
} from "../../utils/observador/formulario";

/**
 * Estado editable de una anotación: los tres textos. La marca de positiva o
 * negativa se quitó el 2026-09-09.
 *
 * `anotacion` en `null` es una anotación nueva; con una anotación dentro, es
 * una corrección de la propia.
 */
export default function useFormularioAnotacion(anotacion = null) {
  const [valores, setValores] = useState(() => crearFormularioAnotacion(anotacion));
  // Qué campos ha tocado la profesora. La corrección de mayúsculas se aplica
  // **solo** a esos: al abrir una anotación vieja para corregirla, pasar por
  // encima de un campo sin escribir nada no debe reescribirle el texto.
  const [tocados, setTocados] = useState(() => new Set());

  const cambiarTexto = useCallback((campo, valor) => {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    setTocados((actual) => {
      if (actual.has(campo)) return actual;
      const siguiente = new Set(actual);
      siguiente.add(campo);
      return siguiente;
    });
  }, []);

  /**
   * La corrección de mayúsculas, **al salir del campo**.
   *
   * Nunca mientras teclea: corregir letra por letra hace saltar el cursor y el
   * usuario siente que la pantalla pelea con él.
   */
  const corregirAlSalir = useCallback((campo) => {
    setValores((actual) => {
      if (!tocados.has(campo)) return actual;

      const corregido = normalizarTextoObservador(actual[campo]);
      if (corregido === actual[campo]) return actual;
      return { ...actual, [campo]: corregido };
    });
  }, [tocados]);

  const reiniciar = useCallback((siguiente = null) => {
    setValores(crearFormularioAnotacion(siguiente));
    setTocados(new Set());
  }, []);

  return {
    valores,
    cambiarTexto,
    corregirAlSalir,
    reiniciar,
    puedeGuardar: puedeGuardarAnotacion(valores),
  };
}
