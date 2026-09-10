/**
 * Corrección de mayúsculas del texto del observador.
 *
 * **Espejo de `app/core/texto_observador.py`.** El servidor aplica lo mismo al
 * guardar: esto es la comodidad -la profesora ve el resultado antes de guardar
 * y puede rehacerlo-, y el servidor es la garantía. Que la lógica viva en los
 * dos sitios es deliberado.
 *
 * Reglas, decididas con el usuario:
 *
 * - mayúscula en la primera letra del texto;
 * - mayúscula después de `.`, `?` y `!`;
 * - **no** después de `,`, `;` ni `:` -pondría «Se para, Hace desorden»-;
 * - espacios sobrantes colapsados, y el que falta tras el punto, añadido.
 *
 * **Defecto conocido y aceptado:** con abreviaturas se pasa de listo
 * (`etc. y luego` → `etc. Y luego`). Es raro en una observación, todos los
 * sistemas que hacen esto lo tienen, y la profesora lo ve en pantalla antes de
 * guardar. No se complica por eso.
 *
 * Sin HTTP, sin React y sin DOM.
 */

// `\p{L}` es «una letra», con acentos y ñ incluidos. Se usa en vez de `[a-zA-Z]`
// porque el texto es castellano: sin esto, «esto.Ávila» no se reconocería. Es
// lo que en el espejo de Python se escribe `[^\W\d_]`.
const LETRA = "\\p{L}";

// En castellano la frase puede abrir con `¿` o `¡`, y entonces la letra que hay
// que poner en mayúscula NO es el primer carácter. Sin esto, «¿por qué?» se
// quedaba en minúscula.
const APERTURA = "[¿¡\"'«(\\[]*";

const ESPACIOS = /\s+/gu;

// Espacio que falta tras el punto. Solo si lo que sigue empieza una frase de
// verdad: así «mide 1.75 metros» y los puntos suspensivos se quedan como están.
const FALTA_ESPACIO = new RegExp(`([.?!])(?=${APERTURA}${LETRA})`, "gu");

// La letra que abre frase nueva, ya con su espacio delante.
const TRAS_PUNTO = new RegExp(`([.?!]\\s+${APERTURA})(${LETRA})`, "gu");

// La primera letra del texto, saltando lo que la abra. No usa `texto[0]` porque
// ese puede ser `¿`, una comilla o un paréntesis.
const PRIMERA_LETRA = new RegExp(`^(${APERTURA})(${LETRA})`, "u");

/**
 * El texto tal y como va a quedar guardado.
 *
 * Devuelve cadena vacía para `null` y para el texto en blanco: los tres campos
 * son opcionales por separado, y es el conjunto el que no puede estar vacío.
 */
export function normalizarTextoObservador(valor) {
  const texto = String(valor ?? "").trim().replace(ESPACIOS, " ");
  if (!texto) return "";

  return texto
    .replace(FALTA_ESPACIO, "$1 ")
    .replace(TRAS_PUNTO, (_, apertura, letra) => apertura + letra.toUpperCase())
    .replace(PRIMERA_LETRA, (_, apertura, letra) => apertura + letra.toUpperCase());
}
