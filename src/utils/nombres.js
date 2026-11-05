// Nombres de personas como se muestran: mayúscula inicial en cada palabra y el
// resto en minúscula («  mARÍA   DEL pILAR » → «María Del Pilar»). Es la misma
// regla de la clase `capitalize` que ya usan las listas, así que todo se ve
// igual. Lo comparten el login, el menú lateral y el alta de colegios.
export function capitalizarNombreVisible(valor) {
  return String(valor || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (palabra) =>
        palabra.charAt(0).toLocaleUpperCase("es-CO") +
        palabra.slice(1).toLocaleLowerCase("es-CO"),
    )
    .join(" ");
}
