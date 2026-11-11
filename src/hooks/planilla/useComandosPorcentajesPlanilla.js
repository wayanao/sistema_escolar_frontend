import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { guardarPorcentajeTipo } from "../../services/planillaApi";
import { formatearEtiquetaColumna } from "../../utils/planilla/notas";
import {
    aplicarPorcentajeGuardado,
    construirPayloadPorcentaje,
    validarPorcentajeNuevo,
} from "../../utils/planilla/porcentajes";
import { mensajeDelServidor } from "../../utils/planilla/subnotas";
import { mostrarEspera } from "../ventanaExito";

/**
 * Comandos de los porcentajes por tipo de nota de la planilla.
 *
 * Ver la parte B de `docs/funcionalidades/SUBNOTAS_PLANILLA.md` (PB2, PB3 y
 * PB8). Guarda, cambia o quita el porcentaje de una columna. Valida antes de
 * enviar (entero de 1 a 100 y suma de hasta 100) y, al guardar, aplica lo que
 * respondió el servidor: el promedio de la planilla se actualiza sin
 * recargarla, porque lo deriva `useConsultasPlanillaProfesor` de los
 * porcentajes.
 *
 * Crear un tipo con su porcentaje lo hace `useComandosPlanillaProfesor`, que
 * es quien crea el tipo.
 */
export default function useComandosPorcentajesPlanilla({
    asignacionId,
    periodo,
    columnas,
    porcentajesPorTipo = {},
    setPorcentajesPorTipo,
}) {
    const [tipoGuardando, setTipoGuardando] = useState(null);

    /**
     * Guarda lo escrito para `tipo`. Vacío quita el porcentaje. Devuelve
     * `true` si quedó guardado (o no había nada que cambiar) y `false` si no.
     */
    const guardarPorcentaje = useCallback(async (tipo, texto) => {
        if (tipoGuardando) return false;

        const validado = validarPorcentajeNuevo({
            columnas,
            porcentajes: porcentajesPorTipo,
            tipo,
            texto,
        });
        if (validado.error) {
            await Swal.fire({ icon: "warning", title: "Porcentaje", text: validado.error });
            return false;
        }
        if ((porcentajesPorTipo[tipo] ?? null) === validado.porcentaje) return true;

        setTipoGuardando(tipo);
        // La misma tarjeta de espera del resto de la app (ventanaExito): antes
        // la cápsula solo se bloqueaba un momento y no decía que había
        // guardado (pedido del usuario el 2026-11-11).
        const quitar = validado.porcentaje === null;
        const etiqueta = formatearEtiquetaColumna(tipo);
        const espera = mostrarEspera({
            title: quitar ? "Quitando el porcentaje…" : "Guardando el porcentaje…",
        });
        try {
            const respuesta = await guardarPorcentajeTipo(construirPayloadPorcentaje({
                asignacionId,
                periodo,
                tipoNota: tipo,
                porcentaje: validado.porcentaje,
            }));
            setPorcentajesPorTipo((actuales) => aplicarPorcentajeGuardado(actuales, respuesta));
            espera.exito(quitar
                ? { title: "Porcentaje quitado", text: `${etiqueta} quedó sin porcentaje.` }
                : { title: "Porcentaje guardado", text: `${etiqueta} quedó en ${validado.porcentaje} %.` });
            return true;
        } catch (error) {
            console.error("Error guardando el porcentaje", error);
            Swal.fire({
                icon: "error",
                title: "No se guardó el porcentaje",
                text: mensajeDelServidor(error, "Intenta nuevamente en un momento."),
            });
            return false;
        } finally {
            setTipoGuardando(null);
        }
    }, [asignacionId, columnas, periodo, porcentajesPorTipo, setPorcentajesPorTipo, tipoGuardando]);

    return { tipoGuardando, guardarPorcentaje };
}
