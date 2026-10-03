import { createContext, useContext } from "react";
import { SIN_PARAMETROS_DE_ANIO, permisosAnio } from "../../utils/anioLectivo";

// El año que mira el admin, compartido entre la barra de navegación y la
// página abierta. Es el primer Context del proyecto, y a propósito el único:
// las dos tienen que ver el mismo año y la página tiene que enterarse en el
// momento en que cambia, y `localStorage` no avisa a lo que ya está en
// pantalla. Ver "Por qué un Context" en docs/funcionalidades/ANIO_LECTIVO.md.
export const ContextoAnioLectivo = createContext(null);

// Lo que recibe quien está fuera del proveedor: el profesor y las pruebas de
// página que no lo montan. Es el comportamiento de antes de esta función:
// año activo, sin parámetros y sin selector.
const SIN_PROVEEDOR = Object.freeze({
  anios: Object.freeze([]),
  anioActivo: null,
  anioSeleccionado: null,
  anioSeleccionadoId: null,
  hayVariosAnios: false,
  parametros: SIN_PARAMETROS_DE_ANIO,
  permisos: permisosAnio(null, null),
  seleccionarAnio: () => {},
  volverAlActivo: () => {},
});

export default function useAnioLectivo() {
  return useContext(ContextoAnioLectivo) ?? SIN_PROVEEDOR;
}
