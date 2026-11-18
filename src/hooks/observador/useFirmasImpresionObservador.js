import { useEffect, useState } from "react";
import { obtenerFirmaDirectorGrupo } from "../../services/firmasApi";
import { obtenerFirmasParaImprimir } from "../../services/observadorApi";
import { periodoParaConsulta } from "../../utils/observador/anotaciones";
import { firmasPorAnotacion } from "../../utils/observador/impresion";

/**
 * Las firmas que van en el observador impreso (2026-11-18): las del acudiente,
 * de cada anotación firmada en pantalla, y -solo en el impreso del admin
 * (`conDirector`)- la guardada del director de grupo.
 *
 * Lo usa `ImpresionObservador`, que solo existe mientras se imprime: cada vez
 * que se abre el impreso se vuelven a pedir, así que una firma tomada hace un
 * momento ya sale. Son las únicas lecturas con imágenes y no se piden al
 * pintar la bitácora (invariante 7 de `FIRMA_OBSERVADOR.md`).
 *
 * Las dos consultas van en paralelo y cada una cae por su lado: si falla la
 * del director, las del acudiente salen igual, y al revés. Cualquier fallo
 * pone `error` y deja esa raya vacía, para firmar a mano como antes.
 */

const SIN_FIRMAS = { clave: null, firmasAcudiente: {}, firmaDirector: null, error: false };

export default function useFirmasImpresionObservador({
  estudianteId,
  periodo,
  parametrosAnio,
  conDirector = false,
}) {
  const [cargado, setCargado] = useState(SIN_FIRMAS);
  const anioLectivoId = parametrosAnio?.anio_lectivo_id ?? null;
  const clave = estudianteId
    ? [estudianteId, periodoParaConsulta(periodo), anioLectivoId, conDirector].join("|")
    : null;
  const listo = clave !== null && cargado.clave === clave;

  useEffect(() => {
    if (!clave || listo) return undefined;

    const controller = new AbortController();
    const anio = anioLectivoId ? { anio_lectivo_id: anioLectivoId } : undefined;

    Promise.allSettled([
      obtenerFirmasParaImprimir(estudianteId, {
        periodo: periodoParaConsulta(periodo),
        parametrosAnio: anio,
        signal: controller.signal,
      }),
      conDirector
        ? obtenerFirmaDirectorGrupo(estudianteId, { parametrosAnio: anio, signal: controller.signal })
        : Promise.resolve(null),
    ]).then(([acudiente, director]) => {
      if (controller.signal.aborted) return;
      setCargado({
        clave,
        firmasAcudiente: acudiente.status === "fulfilled" ? firmasPorAnotacion(acudiente.value) : {},
        firmaDirector: director.status === "fulfilled" ? director.value : null,
        error: acudiente.status === "rejected" || director.status === "rejected",
      });
    });

    return () => controller.abort();
  }, [clave, listo, estudianteId, periodo, anioLectivoId, conDirector]);

  return {
    firmasAcudiente: listo ? cargado.firmasAcudiente : SIN_FIRMAS.firmasAcudiente,
    firmaDirector: listo ? cargado.firmaDirector : null,
    cargandoFirmas: clave !== null && !listo,
    errorFirmas: listo && cargado.error,
  };
}
