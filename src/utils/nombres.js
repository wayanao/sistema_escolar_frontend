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

const subirInicial = (texto) =>
  texto.replace(/^\p{L}/u, (letra) => letra.toLocaleUpperCase("es-CO"));

// Nombres de cosas (un tipo de pago, un producto, el concepto de un egreso, una
// columna): primera letra en mayúscula y el resto como se escribió, para no
// dañar siglas («uniforme ICFES» → «Uniforme ICFES»). Pedido del usuario el
// 2026-11-05.
export function primeraMayuscula(valor) {
  return subirInicial(String(valor ?? "").trim());
}

// Lugares (barrio, municipio, lugar de expedición): mayúscula al inicio de cada
// palabra y el resto como se escribió («villa del rosario» → «Villa Del
// Rosario», «bogotá D.C.» → «Bogotá D.C.»).
export function capitalizarPalabras(valor) {
  return String(valor ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(subirInicial)
    .join(" ");
}
