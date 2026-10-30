import { useCallback, useState } from "react";
import {
  firmarAnotacion,
  firmarAnotacionesDelPeriodo,
} from "../../services/observadorApi";
import {
  construirPayloadFirma,
  construirPayloadFirmaPeriodo,
  esConflictoDeFirma,
  faltaParaFirmar,
  FIRMANTE_VACIO,
  firmanteDesdeSugerido,
  mensajeErrorFirma,
  pendientesDelPeriodo,
  periodosConPendientes,
  siguientePendiente,
} from "../../utils/observador/firma";
import useFirmantesSugeridos from "./useFirmantesSugeridos";

/**
 * La ventana de firma del acudiente: qué se firma, quién firma, el trazo, la
 * casilla de lectura y guardar. Ver `docs/funcionalidades/FIRMA_OBSERVADOR.md`.
 *
 * Dos maneras de firmar (decisión 2, ampliada el 2026-10-27):
 *
 * - **Una anotación** (`abrir`). Después de guardar, "Firmar la siguiente"
 *   conserva los datos de quien firma -no se repiten- pero no el trazo: la
 *   firma se dibuja otra vez.
 * - **Todo un periodo** (`abrirPeriodo`): una sola firma para todas las
 *   anotaciones pendientes de ese periodo. La lista se **congela al abrir**: el
 *   acudiente firma exactamente lo que vio, aunque la bitácora se recargue
 *   mientras tanto. Cambiar de periodo dentro de la ventana borra el trazo y la
 *   casilla, porque lo que se firma ya es otra cosa.
 *
 * Los datos de quien firma solo se recuerdan mientras la ventana sigue
 * abierta; nada se guarda en el navegador.
 *
 * `onFirmada` se llama después de guardar y también ante un 409, que dice que
 * algo ya no está como se mostró: en los dos casos hay que volver a pedir la
 * bitácora.
 *
 * `propsVentana` trae todo lo que necesita `VentanaFirmaAnotacion`, con sus
 * nombres: la pantalla del profesor y la ficha del admin la montan igual, sin
 * repetir la lista.
 */
export default function useFirmaAnotacion({ estudianteId, anotaciones, onFirmada }) {
  const [anotacion, setAnotacion] = useState(null);
  const [lote, setLote] = useState(null);
  const [firmante, setFirmante] = useState(FIRMANTE_VACIO);
  const [imagen, setImagen] = useState(null);
  const [leida, setLeida] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [firmada, setFirmada] = useState(null);

  const abierta = Boolean(anotacion || lote);
  const { sugeridos, cargando: cargandoSugeridos } = useFirmantesSugeridos({
    estudianteId,
    activo: abierta,
  });

  /** Empieza de cero con lo que se va a firmar; los datos de quien firma se
   * quedan como estén. */
  const empezarCon = useCallback(({ una = null, periodo = null }) => {
    setAnotacion(una);
    setLote(periodo);
    setImagen(null);
    setLeida(false);
    setError(null);
    setFirmada(null);
  }, []);

  const abrir = useCallback(
    (nueva) => {
      setFirmante(FIRMANTE_VACIO);
      empezarCon({ una: nueva });
    },
    [empezarCon],
  );

  const congelarPeriodo = useCallback(
    (periodo) => ({ periodo, anotaciones: pendientesDelPeriodo(anotaciones, periodo) }),
    [anotaciones],
  );

  const abrirPeriodo = useCallback(
    (periodo) => {
      setFirmante(FIRMANTE_VACIO);
      empezarCon({ periodo: congelarPeriodo(periodo) });
    },
    [congelarPeriodo, empezarCon],
  );

  const cambiarPeriodo = useCallback(
    (periodo) => empezarCon({ periodo: congelarPeriodo(periodo) }),
    [congelarPeriodo, empezarCon],
  );

  const cerrar = useCallback(() => {
    setFirmante(FIRMANTE_VACIO);
    empezarCon({});
  }, [empezarCon]);

  const cambiarFirmante = useCallback((campo, valor) => {
    setFirmante((actual) => ({ ...actual, [campo]: valor }));
  }, []);

  const elegirSugerido = useCallback((sugerido) => {
    setFirmante(firmanteDesdeSugerido(sugerido));
  }, []);

  const aFirmar = lote ? lote.anotaciones : anotacion ? [anotacion] : [];
  const falta =
    lote && aFirmar.length === 0
      ? "No queda nada por firmar en este periodo."
      : faltaParaFirmar({ firmante, imagen, leida });
  const siguiente =
    firmada && anotacion ? siguientePendiente(anotaciones, firmada.anotacion_id) : null;

  const guardar = useCallback(async () => {
    if (!abierta || guardando || falta) return;

    setGuardando(true);
    setError(null);
    try {
      const respuesta = lote
        ? await firmarAnotacionesDelPeriodo(
          estudianteId,
          construirPayloadFirmaPeriodo({ firmante, imagen, anotaciones: lote.anotaciones }),
        )
        : await firmarAnotacion(
          anotacion.id,
          construirPayloadFirma({ firmante, imagen, version: anotacion.version }),
        );
      setFirmada(respuesta);
      onFirmada?.();
    } catch (fallo) {
      // El trazo y los datos se quedan: un fallo de red se reintenta sin
      // pedirle al acudiente que firme de nuevo.
      setError(mensajeErrorFirma(fallo));
      if (esConflictoDeFirma(fallo)) onFirmada?.();
    } finally {
      setGuardando(false);
    }
  }, [abierta, anotacion, estudianteId, falta, firmante, guardando, imagen, lote, onFirmada]);

  const firmarSiguiente = useCallback(() => {
    if (siguiente) empezarCon({ una: siguiente });
  }, [empezarCon, siguiente]);

  return {
    abierta,
    anotacion,
    lote,
    abrir,
    abrirPeriodo,
    cambiarPeriodo,
    cerrar,
    firmante,
    cambiarFirmante,
    elegirSugerido,
    sugeridos,
    cargandoSugeridos,
    imagen,
    cambiarImagen: setImagen,
    leida,
    cambiarLeida: setLeida,
    falta,
    guardando,
    error,
    firmada,
    siguiente,
    guardar,
    firmarSiguiente,
    propsVentana: {
      anotaciones: aFirmar,
      periodo: lote?.periodo ?? null,
      // Los periodos que se pueden elegir dentro de la ventana; con una sola
      // anotación no hay a cuál cambiar.
      periodos: lote ? periodosConPendientes(anotaciones) : [],
      onCambiarPeriodo: cambiarPeriodo,
      firmante,
      onCambiarFirmante: cambiarFirmante,
      sugeridos,
      cargandoSugeridos,
      onElegirSugerido: elegirSugerido,
      onCambiarImagen: setImagen,
      leida,
      onCambiarLeida: setLeida,
      falta,
      guardando,
      error,
      firmada,
      haySiguiente: Boolean(siguiente),
      onGuardar: guardar,
      onFirmarSiguiente: firmarSiguiente,
      onCerrar: cerrar,
    },
  };
}
