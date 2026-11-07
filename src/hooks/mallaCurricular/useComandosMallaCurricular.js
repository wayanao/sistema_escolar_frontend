import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../../constants/colores";
import { guardarPlaneadoresAnuales } from "../../services/mallaCurricularApi";
import { mostrarExito } from "../ventanaExito";
import {
  construirPayloadPlaneadores,
  crearFilasVacias,
  validarFilasPlaneador,
} from "../../utils/mallaCurricular/planeadorAnual";

export function useComandosMallaCurricular({ asignacionId }) {
  const [planeadores, setPlaneadores] = useState(crearFilasVacias);
  const [guardando, setGuardando] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState({
    cargando: true,
    guardado: false,
    modificado: false,
    guardadoEn: null,
  });

  const manejarInicioPlaneadores = useCallback(() => {
    setEstadoGuardado({
      cargando: true,
      guardado: false,
      modificado: false,
      guardadoEn: null,
    });
  }, []);

  const manejarPlaneadoresCargados = useCallback(({ guardado, planeadores: filas }) => {
    setPlaneadores(filas);
    setEstadoGuardado({
      cargando: false,
      guardado,
      modificado: false,
      guardadoEn: null,
    });
  }, []);

  const manejarErrorPlaneadores = useCallback(() => {
    setEstadoGuardado({
      cargando: false,
      guardado: false,
      modificado: false,
      guardadoEn: null,
    });
  }, []);

  const cambiarCampoPlaneador = useCallback((index, field, value) => {
    setPlaneadores((filasActuales) => {
      const filasActualizadas = [...filasActuales];
      filasActualizadas[index] = { ...filasActualizadas[index], [field]: value };
      return filasActualizadas;
    });
    setEstadoGuardado((actual) => ({ ...actual, modificado: true }));
  }, []);

  const guardarPlaneadores = useCallback(async ({ periodo, recargarPlaneadores }) => {
    if (!asignacionId || !periodo) return;

    const payload = construirPayloadPlaneadores(planeadores);
    const { filaSinFecha, filaSoloConFecha, filasDiligenciadas } = validarFilasPlaneador(payload);

    if (filaSinFecha !== -1) {
      await Swal.fire({
        icon: "warning",
        title: `Falta la fecha en la fila ${filaSinFecha + 1}`,
        text: "Cada fila con contenido debe tener una fecha límite antes de guardarse.",
        confirmButtonText: "Entendido",
        confirmButtonColor: MORADO_BOTON,
      });
      return;
    }

    if (filaSoloConFecha !== -1) {
      await Swal.fire({
        icon: "warning",
        title: `Falta contenido en la fila ${filaSoloConFecha + 1}`,
        text: "Escribe al menos un campo de contenido para conservar esa fecha límite.",
        confirmButtonText: "Entendido",
        confirmButtonColor: MORADO_BOTON,
      });
      return;
    }

    setGuardando(true);
    try {
      const res = await guardarPlaneadoresAnuales(asignacionId, periodo, payload);
      if (res.status >= 200 && res.status < 300) {
        await recargarPlaneadores();
        setEstadoGuardado({
          cargando: false,
          guardado: filasDiligenciadas > 0,
          modificado: false,
          guardadoEn: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        await mostrarExito({
          title: "Malla curricular guardada",
          text: `${filasDiligenciadas} fila${filasDiligenciadas === 1 ? "" : "s"} quedaron guardadas con su fecha límite.`,
        });
      } else {
        throw new Error("El servidor no confirmó el guardado.");
      }
    } catch (error) {
      console.error("Error guardando planeadores", error);
      const detalle = error.response?.data?.detail;
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar la malla",
        text: typeof detalle === "string" ? detalle : "Revisa las filas e intenta nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: MORADO_BOTON,
      });
    } finally {
      setGuardando(false);
    }
  }, [asignacionId, planeadores]);

  return {
    cambiarCampoPlaneador,
    estadoGuardado,
    guardando,
    guardarPlaneadores,
    manejarErrorPlaneadores,
    manejarInicioPlaneadores,
    manejarPlaneadoresCargados,
    planeadores,
  };
}
