import { useCallback, useEffect, useState } from "react";
import {
  CLAVE_PREFERENCIA_MENU,
  CONSULTAS_MENU,
  MODOS_MENU,
  calcularModoMenu,
  leerPreferenciaMenu,
} from "../../utils/autenticacion/menuLateral";

function hayMedicion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

// Sin matchMedia (las pruebas de JSDOM, navegadores muy viejos) se asume una
// pantalla de PC: el menú abierto de siempre.
function medirPantalla(rielDesplazable) {
  const coincide = (consulta) => !hayMedicion() || window.matchMedia(consulta).matches;
  return {
    desdeTablet: coincide(CONSULTAS_MENU.TABLET),
    desdePortatil: coincide(CONSULTAS_MENU.PORTATIL),
    desdePc: coincide(CONSULTAS_MENU.PC),
    conAlto: coincide(rielDesplazable ? CONSULTAS_MENU.ALTO_DESPLAZABLE : CONSULTAS_MENU.ALTO),
  };
}

function leerPreferenciaGuardada() {
  try {
    return leerPreferenciaMenu(localStorage.getItem(CLAVE_PREFERENCIA_MENU));
  } catch {
    return null;
  }
}

// `rielDesplazable`: el riel de este menú se desplaza si no cabe (no tiene
// grupos que abran un panel al lado), así que pide menos alto de pantalla.
export function useMenuLateral({ rielDesplazable = false } = {}) {
  const [pantalla, setPantalla] = useState(() => medirPantalla(rielDesplazable));
  const [preferencia, setPreferencia] = useState(leerPreferenciaGuardada);

  useEffect(() => {
    if (!hayMedicion()) return undefined;
    const consultas = Object.values(CONSULTAS_MENU).map((consulta) => window.matchMedia(consulta));
    const actualizar = () => setPantalla(medirPantalla(rielDesplazable));
    consultas.forEach((consulta) => consulta.addEventListener("change", actualizar));
    return () => consultas.forEach((consulta) => consulta.removeEventListener("change", actualizar));
  }, [rielDesplazable]);

  const modo = calcularModoMenu({ ...pantalla, preferencia });

  const alternarMenu = useCallback(() => {
    const siguiente = modo === MODOS_MENU.ABIERTO ? MODOS_MENU.RIEL : MODOS_MENU.ABIERTO;
    setPreferencia(siguiente);
    try {
      localStorage.setItem(CLAVE_PREFERENCIA_MENU, siguiente);
    } catch {
      // Sin almacenamiento, la preferencia dura hasta recargar la página.
    }
  }, [modo]);

  // El botón para abrir o encoger solo existe desde portátil: en tablet
  // vertical el menú es siempre el riel.
  return {
    modo,
    puedeAlternar: modo !== MODOS_MENU.CELULAR && pantalla.desdePortatil,
    alternarMenu,
  };
}
