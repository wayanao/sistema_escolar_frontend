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
function medirPantalla() {
  const coincide = (consulta) => !hayMedicion() || window.matchMedia(consulta).matches;
  return {
    desdeTablet: coincide(CONSULTAS_MENU.TABLET),
    desdePortatil: coincide(CONSULTAS_MENU.PORTATIL),
    desdePc: coincide(CONSULTAS_MENU.PC),
    conAlto: coincide(CONSULTAS_MENU.ALTO),
  };
}

function leerPreferenciaGuardada() {
  try {
    return leerPreferenciaMenu(localStorage.getItem(CLAVE_PREFERENCIA_MENU));
  } catch {
    return null;
  }
}

export function useMenuLateral() {
  const [pantalla, setPantalla] = useState(medirPantalla);
  const [preferencia, setPreferencia] = useState(leerPreferenciaGuardada);

  useEffect(() => {
    if (!hayMedicion()) return undefined;
    const consultas = Object.values(CONSULTAS_MENU).map((consulta) => window.matchMedia(consulta));
    const actualizar = () => setPantalla(medirPantalla());
    consultas.forEach((consulta) => consulta.addEventListener("change", actualizar));
    return () => consultas.forEach((consulta) => consulta.removeEventListener("change", actualizar));
  }, []);

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
