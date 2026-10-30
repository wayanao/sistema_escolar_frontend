import { useEffect, useState } from "react";
import { obtenerEstadoTenant } from "../../services/autenticacionApi";
import { leerUsoEntrevista } from "../../utils/admisiones/admisiones";

// 2026-10-30: si el colegio usa la entrevista de admisión. Lo dice el backend
// en `GET /tenant/status`; aquí solo se lee para decidir qué mostrar
// (Admisiones o "Crear estudiante" en el año en preparación).
//
// `null` mientras no se sabe o deshabilitado: la pantalla no muestra ninguna
// de las dos cosas. Si la consulta falla, `true`, lo de siempre. Se habilita
// solo donde hace falta (con un año en preparación), para no sumar la
// petición al resto de las pantallas.
export default function useUsoEntrevistaAdmision({ habilitado = true } = {}) {
  const [usaEntrevista, setUsaEntrevista] = useState(null);

  useEffect(() => {
    if (!habilitado) {
      setUsaEntrevista(null);
      return undefined;
    }
    let vigente = true;
    obtenerEstadoTenant()
      .then((estado) => {
        if (vigente) setUsaEntrevista(leerUsoEntrevista(estado));
      })
      .catch(() => {
        if (vigente) setUsaEntrevista(true);
      });
    return () => {
      vigente = false;
    };
  }, [habilitado]);

  return habilitado ? usaEntrevista : null;
}
