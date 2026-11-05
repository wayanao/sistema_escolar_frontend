// Cómo se ve el menú lateral según el ancho de la pantalla. Puro: quien mide
// la pantalla y guarda la preferencia es `useMenuLateral`.
export const MODOS_MENU = Object.freeze({
  // Barra arriba y menú que se desliza desde la izquierda.
  CELULAR: "celular",
  // Barra angosta con cada ícono y su nombre debajo.
  RIEL: "riel",
  ABIERTO: "abierto",
});

// Tablet desde 600 px de ancho, el corte de Android y Material Design: muchas
// tablets Android de 11" miden de 600 a 800 px en vertical, menos que un iPad,
// y con 768 se veían como un celular (lo vio el usuario en una Tab 11 el
// 2026-11-05). Portátil y PC usan los cortes lg y xl de Tailwind.
//
// Alto mínimo para el riel: el del admin no se desplaza (sus grupos abren un
// panel al lado) y ocupa unos 560 px con su tarjeta de usuario; el del
// profesor se desplaza, así que le basta con no ser un celular acostado.
export const CONSULTAS_MENU = Object.freeze({
  TABLET: "(min-width: 600px)",
  PORTATIL: "(min-width: 1024px)",
  PC: "(min-width: 1280px)",
  ALTO: "(min-height: 560px)",
  ALTO_DESPLAZABLE: "(min-height: 480px)",
});

// Preferencia de la pantalla, no dato de sesión: sobrevive al logout, como
// recordar el colegio en el login.
export const CLAVE_PREFERENCIA_MENU = "menuLateral";

export function leerPreferenciaMenu(valorGuardado) {
  return valorGuardado === MODOS_MENU.RIEL || valorGuardado === MODOS_MENU.ABIERTO
    ? valorGuardado
    : null;
}

export function calcularModoMenu({ desdeTablet, desdePortatil, desdePc, conAlto, preferencia }) {
  if (!desdeTablet || !conAlto) return MODOS_MENU.CELULAR;
  // En tablet vertical siempre va el riel: abierto se comería casi un tercio
  // del ancho de la pantalla.
  if (!desdePortatil) return MODOS_MENU.RIEL;
  const elegido = leerPreferenciaMenu(preferencia);
  if (elegido) return elegido;
  return desdePc ? MODOS_MENU.ABIERTO : MODOS_MENU.RIEL;
}

export function obtenerIniciales(nombre) {
  const palabras = String(nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "";
  const primera = palabras[0][0];
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1][0] : "";
  return `${primera}${ultima}`.toLocaleUpperCase("es");
}
