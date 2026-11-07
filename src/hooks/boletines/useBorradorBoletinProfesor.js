import { useCallback, useMemo, useState } from "react";

import { crearClaveBorradorBoletin } from "../../utils/boletines/ingresoBoletin";

const leerSesionProfesor = () => {
  try {
    const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
    return { profesorId: profesor?.id ?? null, tenant: profesor?.tenant ?? "" };
  } catch {
    return { profesorId: null, tenant: "" };
  }
};

// En una ventana privada o con el almacenamiento lleno, el navegador no deja
// guardar: entonces no hay borrador y la pantalla vuelve a preguntar antes de
// perder lo escrito.
const probarAlmacenamiento = () => {
  try {
    const prueba = "__prueba_borrador_boletin__";
    localStorage.setItem(prueba, "1");
    localStorage.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
};

/**
 * Dónde y cómo se guarda el borrador del boletín en el navegador.
 *
 * `cargadoPara` es la clase y el periodo de los estudiantes que están en
 * pantalla (no los del selector, que cambian antes de que llegue la consulta):
 * así un borrador nunca se escribe con la clave de otra clase o periodo.
 */
export default function useBorradorBoletinProfesor({ cargadoPara }) {
  const [sesion] = useState(leerSesionProfesor);
  const [disponible, setDisponible] = useState(probarAlmacenamiento);

  const clave = useMemo(
    () =>
      cargadoPara
        ? crearClaveBorradorBoletin({
            tenant: sesion.tenant,
            profesorId: sesion.profesorId,
            asignacionId: cargadoPara.asignacionId,
            periodo: cargadoPara.periodo,
          })
        : null,
    [cargadoPara, sesion],
  );

  const leerBorrador = useCallback((claveBorrador) => {
    if (!claveBorrador) return null;
    try {
      const borrador = JSON.parse(localStorage.getItem(claveBorrador) || "null");
      return borrador && typeof borrador === "object" ? borrador : null;
    } catch {
      return null;
    }
  }, []);

  /** Guarda el borrador, o lo borra si es `null`. */
  const escribirBorrador = useCallback((claveBorrador, borrador) => {
    if (!claveBorrador) return;
    try {
      if (borrador) localStorage.setItem(claveBorrador, JSON.stringify(borrador));
      else localStorage.removeItem(claveBorrador);
    } catch (error) {
      console.error("No se pudo guardar el borrador del boletín", error);
      setDisponible(false);
    }
  }, []);

  return {
    clave,
    // Solo protege si el navegador guarda y si se sabe de quién y de qué clase es.
    activo: disponible && clave !== null,
    leerBorrador,
    escribirBorrador,
  };
}
