import { useEffect, useRef, useState } from "react";
import {
  DURACION_SOLTARSE,
  duracionPaseo,
  puntosDePaseo,
  rutaCerrada,
  rutaDeSoltar,
} from "../../utils/dashboards/globos";

// Por debajo de este ancho la app muestra el encabezado del celular arriba y
// la barra de abajo (`MenuLateralView`): el globo no pasea por esas franjas.
export const ANCHO_CON_BARRA_INFERIOR = 1024;
const ALTO_ENCABEZADO_CELULAR = 72;
const ALTO_BARRA_INFERIOR = 88;
const MARGEN_PANTALLA = 16;
const ESPERA_REDIMENSION = 400;

const FOTOGRAMAS = [{ offsetDistance: "0%" }, { offsetDistance: "100%" }];

// Solo se suelta si el navegador sabe mover algo por un camino y si el equipo
// no pidió «reducir movimiento». Si no, el globo se queda en el muro.
export const puedeSoltarGlobos = () => {
  if (typeof window === "undefined") return false;
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }
  if (typeof window.CSS?.supports !== "function") return false;
  if (!window.CSS.supports("offset-path", "path('M 0 0 L 1 1')")) return false;
  return typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
};

// Por dónde pasea: el ancho del contenido (el del muro) y el alto de lo que se
// ve, sin el encabezado ni la barra de abajo del celular.
const zonaDePaseo = (rectArea) => {
  const conBarra = window.innerWidth < ANCHO_CON_BARRA_INFERIOR;
  return {
    izquierda: Math.max(0, rectArea.left),
    derecha: Math.min(window.innerWidth, rectArea.right),
    arriba: conBarra ? ALTO_ENCABEZADO_CELULAR : MARGEN_PANTALLA,
    abajo: window.innerHeight - (conBarra ? ALTO_BARRA_INFERIOR : MARGEN_PANTALLA),
  };
};

/**
 * El globo de quien cumple hoy se suelta del muro y pasea por la pantalla.
 *
 * Pasado `retraso`, mide dónde está el globo en el muro (`origenRef`) y arma
 * su camino; entonces devuelve `true` y quien lo usa pinta el globo suelto
 * (`globoRef`, en una capa fija a la pantalla). El globo sube hasta el primer
 * punto y luego da vueltas sin parar por una curva al azar dentro de lo que se
 * ve, así que acompaña a quien baja o sube por el panel. Si cambia el tamaño
 * de la pantalla, arma otro paseo que quepa.
 */
export default function useGloboSuelto({ globoRef, origenRef, areaRef, activo = true, retraso = 1400 }) {
  const [suelto, setSuelto] = useState(false);
  const planRef = useRef(null);

  useEffect(() => {
    if (!activo || !puedeSoltarGlobos()) return undefined;
    const reloj = window.setTimeout(() => {
      const origen = origenRef.current;
      const area = areaRef.current;
      if (!origen || !area) return;
      const rect = origen.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const tamano = { ancho: rect.width, alto: rect.height };
      const puntos = puntosDePaseo(zonaDePaseo(area.getBoundingClientRect()), tamano);
      // Si el muro está más abajo de lo que se ve, entra por el borde de abajo.
      const desde = [
        rect.left + rect.width / 2,
        Math.min(rect.top + rect.height / 2, window.innerHeight + rect.height),
      ];
      planRef.current = {
        tamano,
        soltar: rutaDeSoltar(desde, puntos[0]),
        paseo: rutaCerrada(puntos),
        duracion: duracionPaseo(puntos),
      };
      setSuelto(true);
    }, retraso);
    return () => window.clearTimeout(reloj);
  }, [activo, retraso, origenRef, areaRef]);

  useEffect(() => {
    const globo = globoRef.current;
    const plan = planRef.current;
    if (!suelto || !globo || !plan) return undefined;

    let paseo = null;
    let espera = null;
    const pasear = (ruta, duracion) => {
      paseo?.cancel();
      globo.style.offsetPath = `path('${ruta}')`;
      paseo = globo.animate(FOTOGRAMAS, { duration: duracion, iterations: Infinity, easing: "linear" });
    };

    globo.style.width = `${plan.tamano.ancho}px`;
    globo.style.offsetPath = `path('${plan.soltar}')`;
    const soltarse = globo.animate(FOTOGRAMAS, {
      duration: DURACION_SOLTARSE,
      easing: "cubic-bezier(0.45, 0, 0.55, 1)",
      fill: "forwards",
    });
    // El paseo empieza justo donde terminó de subir: no hay salto.
    soltarse.onfinish = () => {
      globo.style.offsetPath = `path('${plan.paseo}')`;
      soltarse.cancel();
      pasear(plan.paseo, plan.duracion);
    };

    const alRedimensionar = () => {
      window.clearTimeout(espera);
      espera = window.setTimeout(() => {
        const area = areaRef.current;
        if (!area || !paseo) return;
        const puntos = puntosDePaseo(zonaDePaseo(area.getBoundingClientRect()), plan.tamano);
        pasear(rutaCerrada(puntos), duracionPaseo(puntos));
      }, ESPERA_REDIMENSION);
    };
    window.addEventListener("resize", alRedimensionar);

    return () => {
      window.removeEventListener("resize", alRedimensionar);
      window.clearTimeout(espera);
      soltarse.cancel();
      paseo?.cancel();
    };
  }, [suelto, globoRef, areaRef]);

  return suelto;
}
