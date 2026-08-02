import { useEffect, useState } from "react";

import { guardarOrdenBoletin } from "../../services/boletinesApi";
import {
  construirPayloadOrden,
  moverMateriaAPosicion,
  moverMateriaPorDelta,
  ordenarMateriasAlfabeticamente,
  ordenarPorBoletin,
} from "../../utils/boletines/ordenBoletin";

export default function useComandosOrdenBoletin({
  cursoId,
  materiasIniciales,
  mensajeConsulta,
}) {
  const [materias, setMaterias] = useState(materiasIniciales);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(mensajeConsulta);

  useEffect(() => {
    setMaterias(materiasIniciales);
    setMensaje(mensajeConsulta);
  }, [materiasIniciales, mensajeConsulta]);

  const moverMateria = (index, delta) => {
    const destino = index + delta;
    if (destino < 0 || destino >= materias.length) return;

    setMaterias((actuales) => moverMateriaPorDelta(actuales, index, delta));
    setMensaje("");
  };

  const moverAPosicion = (index, posicion) => {
    const destino = Number(posicion) - 1;
    if (
      Number.isNaN(destino) ||
      destino < 0 ||
      destino >= materias.length ||
      destino === index
    ) {
      return;
    }

    setMaterias((actuales) =>
      moverMateriaAPosicion(actuales, index, posicion),
    );
    setMensaje("");
  };

  const ordenarAlfabetico = () => {
    setMaterias((actuales) => ordenarMateriasAlfabeticamente(actuales));
    setMensaje("");
  };

  const guardarOrden = async () => {
    if (!cursoId || materias.length === 0) return;

    setGuardando(true);
    setMensaje("");

    try {
      const payload = construirPayloadOrden(materias);
      const respuesta = await guardarOrdenBoletin(cursoId, payload);
      const data = Array.isArray(respuesta?.items) ? respuesta.items : materias;
      setMaterias(ordenarPorBoletin(data));
      setMensaje("Orden guardado correctamente.");
    } catch (error) {
      console.error("Error guardando orden del boletín", error);
      setMensaje(error?.response?.data?.detail || "No se pudo guardar el orden.");
    } finally {
      setGuardando(false);
    }
  };

  return {
    guardando,
    materias,
    mensaje,
    guardarOrden,
    moverAPosicion,
    moverMateria,
    ordenarAlfabetico,
  };
}
