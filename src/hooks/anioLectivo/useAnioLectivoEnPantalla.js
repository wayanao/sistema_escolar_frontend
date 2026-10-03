import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  RUTAS_POR_ANIO,
  construirAvisoAnio,
  esRutaPorAnio,
  etiquetaAnioLectivo,
} from "../../utils/anioLectivo";
import useAnioLectivo from "./useAnioLectivo";

// Une el año elegido con la pantalla abierta, para la barra y el aviso.
//
// El selector solo aparece en las pantallas que siguen el año y cuando el
// colegio tiene más de un año; el aviso, en esas mismas pantallas y solo
// mirando un año que no es el activo. En las demás (Pagos, Nómina,
// Inventario...) no aparece ninguno de los dos, aunque haya otro año elegido:
// al volver a una pantalla del año, el selector sigue donde quedó.
export default function useAnioLectivoEnPantalla() {
  const { pathname } = useLocation();
  const {
    anioActivo,
    anioSeleccionado,
    anios,
    hayVariosAnios,
    seleccionarAnio,
    volverAlActivo,
  } = useAnioLectivo();

  const enPantallaDelAnio = esRutaPorAnio(pathname, RUTAS_POR_ANIO);

  const opciones = useMemo(
    () => anios.map((anio) => ({ valor: anio.id, etiqueta: etiquetaAnioLectivo(anio) })),
    [anios],
  );

  return {
    mostrarSelector: enPantallaDelAnio && hayVariosAnios,
    opciones,
    anioSeleccionadoId: anioSeleccionado?.id ?? null,
    aviso: enPantallaDelAnio ? construirAvisoAnio(anioSeleccionado, anioActivo) : null,
    seleccionarAnio,
    volverAlActivo,
  };
}
