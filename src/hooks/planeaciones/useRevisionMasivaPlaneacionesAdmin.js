import { useCallback, useEffect, useMemo, useState } from "react";
import { actualizarRevisionPlaneacionAdmin } from "../../services/planeacionesApi";

// Marcamos en tandas pequeñas para no lanzar una ráfaga de peticiones al servidor.
const TAMANO_TANDA = 4;

export default function useRevisionMasivaPlaneacionesAdmin({
  planes,
  onMarcados,
}) {
  const [seleccionados, setSeleccionados] = useState([]);
  const [marcando, setMarcando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resumen, setResumen] = useState(null);

  // Solo los pendientes pueden pasar a visto: los revisados no se tocan.
  const marcables = useMemo(
    () => planes.filter((plan) => plan.estado_revision === "pendiente"),
    [planes],
  );
  const idsMarcables = useMemo(
    () => marcables.map((plan) => String(plan.id)),
    [marcables],
  );
  const claveMarcables = idsMarcables.join(",");

  // Al cambiar de página o de filtro la selección anterior ya no corresponde.
  useEffect(() => {
    setSeleccionados([]);
    setProgreso(0);
    setResumen(null);
  }, [claveMarcables]);

  const alternar = useCallback((planId) => {
    const id = String(planId);
    setSeleccionados((actual) =>
      actual.includes(id)
        ? actual.filter((item) => item !== id)
        : [...actual, id],
    );
  }, []);

  const alternarTodos = useCallback(() => {
    setSeleccionados((actual) =>
      actual.length === idsMarcables.length ? [] : idsMarcables,
    );
  }, [idsMarcables]);

  const marcarComoVistos = useCallback(async () => {
    const porMarcar = marcables.filter((plan) =>
      seleccionados.includes(String(plan.id)),
    );
    if (porMarcar.length === 0 || marcando) return;

    setMarcando(true);
    setProgreso(0);
    setResumen(null);

    const fallidos = [];
    let exitosos = 0;

    for (let inicio = 0; inicio < porMarcar.length; inicio += TAMANO_TANDA) {
      const tanda = porMarcar.slice(inicio, inicio + TAMANO_TANDA);
      const resultados = await Promise.all(
        tanda.map(async (plan) => {
          try {
            await actualizarRevisionPlaneacionAdmin(plan.id, {
              estado: "visto",
              version: Number(plan.version_revision) || 1,
            });
            return { id: String(plan.id), ok: true };
          } catch (requestError) {
            console.error("Error marcando plan como visto", requestError);
            return { id: String(plan.id), ok: false };
          }
        }),
      );

      resultados.forEach((resultado) => {
        if (resultado.ok) exitosos += 1;
        else fallidos.push(resultado.id);
      });
      setProgreso((actual) => actual + tanda.length);
    }

    // Los que fallaron quedan marcados para poder reintentarlos.
    setSeleccionados(fallidos);
    setResumen({ exitosos, fallidos: fallidos.length });
    setMarcando(false);

    if (exitosos > 0) await onMarcados?.();
  }, [marcables, marcando, onMarcados, seleccionados]);

  return {
    seleccionados,
    idsMarcables,
    marcando,
    progreso,
    resumen,
    alternar,
    alternarTodos,
    marcarComoVistos,
  };
}
