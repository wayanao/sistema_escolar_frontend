// Nombres de personas como se muestran: mayúscula inicial en cada palabra y el
// resto en minúscula («  mARÍA   DEL pILAR » → «María Del Pilar»). Es la misma
// regla de la clase `capitalize` que ya usan las listas, así que todo se ve
// igual. La usan el login, el menú lateral, el alta de colegios y los nombres
// que se guardan de estudiantes y admisiones.
export function capitalizarNombreVisible(valor) {
  return String(valor || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra) =>
      palabra
        .toLocaleLowerCase("es-CO")
        // Mayúscula al inicio y después de guion o apóstrofo: «María-José», «O'Neil».
        .replace(/(^|[-'’])(\p{L})/gu, (_, antes, letra) => antes + letra.toLocaleUpperCase("es-CO")),
    )
    .join(" ");
}
