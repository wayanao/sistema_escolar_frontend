import { useCallback, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
    eliminarTipoEvaluacionPlanilla,
    guardarNotaPlanilla,
    guardarPorcentajeTipo,
} from "../../services/planillaApi";
import {
    calcularPromedioNotas,
    calcularPromedioValoraciones,
    claveNota,
    construirPayloadNota,
    esColumnaInterna,
    formatearEtiquetaColumna,
    hayCambioDeNota,
    normalizarNumeroNota,
    redondearNota,
} from "../../utils/planilla/notas";
import {
    construirPayloadPorcentaje,
    validarPorcentajeNuevo,
} from "../../utils/planilla/porcentajes";
import {
    MENSAJE_NOTA_CALCULADA,
    esErrorDeNotaCalculada,
    mensajeDelServidor,
    subnotasDelTipo,
} from "../../utils/planilla/subnotas";

export default function useComandosPlanillaProfesor({
    asignacionId,
    periodo,
    tipoEvaluacion,
    estudiantes,
    columnas,
    subnotasPorTipo = {},
    porcentajesPorTipo = {},
    setEstudiantes,
    setColumnas,
    cargarPlanilla,
}) {
    const [nuevoTipo, setNuevoTipo] = useState("");
    // Porcentajes, paso B4a (PB8): opcional, se envía después de crear el tipo.
    const [nuevoPorcentaje, setNuevoPorcentaje] = useState("");
    const [tipoEliminar, setTipoEliminar] = useState("");
    const [accionTipoEnCurso, setAccionTipoEnCurso] = useState(null);
    const [notasSinGuardar, setNotasSinGuardar] = useState({});
    const guardadosEnCursoRef = useRef(new Map());

    const marcarSinGuardar = useCallback((clave, sinGuardar) => {
        setNotasSinGuardar((actuales) => {
            if (Boolean(actuales[clave]) === sinGuardar) return actuales;

            const siguiente = { ...actuales };
            if (sinGuardar) siguiente[clave] = true;
            else delete siguiente[clave];
            return siguiente;
        });
    }, []);

    const guardarNota = useCallback(async (estudiante_id, descripcion, valor) => {

        const valorLimpio = String(valor ?? "").trim();
        if (!valorLimpio && tipoEvaluacion !== "numerica") return;

        const clave = claveNota(estudiante_id, descripcion);
        const estudiante = estudiantes.find(
            (est) => Number(est.estudiante_id) === Number(estudiante_id),
        );
        const valorGuardado = tipoEvaluacion === "desarrollo"
            ? estudiante?.valoraciones?.[descripcion]
            : estudiante?.notas?.[descripcion];

        // Salir de una celda sin calificarla no gasta una peticion. Una celda
        // pendiente sí reintenta aunque el valor coincida: en pantalla ya se ve
        // el valor nuevo, pero el servidor todavia no lo tiene.
        if (!notasSinGuardar[clave] && !hayCambioDeNota(valor, valorGuardado, tipoEvaluacion)) {
            return true;
        }

        const numero = normalizarNumeroNota(valorLimpio);
        const actualizarNotaLocal = (notaActualizada) => {
            setEstudiantes((actuales) =>
                actuales.map((est) => {
                    if (Number(est.estudiante_id) !== Number(estudiante_id)) return est;

                    if (tipoEvaluacion === "desarrollo") {
                        const valoracionesActualizadas = {
                            ...(est.valoraciones || {}),
                            [descripcion]: valor,
                        };

                        return {
                            ...est,
                            valoraciones: valoracionesActualizadas,
                            // El promedio de caritas se recalcula igual que el
                            // numerico; sin esto la columna no reaccionaba al
                            // calificar y solo cambiaba al recargar.
                            promedio: calcularPromedioValoraciones(
                                valoracionesActualizadas,
                                columnas,
                            ),
                        };
                    }

                    const notasActualizadas = {
                        ...(est.notas || {}),
                    };

                    if (notaActualizada === null) {
                        delete notasActualizadas[descripcion];
                    } else {
                        notasActualizadas[descripcion] = notaActualizada;
                    }

                    return {
                        ...est,
                        notas: notasActualizadas,
                        promedio: calcularPromedioNotas(notasActualizadas, columnas),
                    };
                })
            );
        };

        const borrandoNota = tipoEvaluacion === "numerica" && !valorLimpio;

        if (tipoEvaluacion === "numerica" && !borrandoNota) {
            if (Number.isNaN(numero) || numero < 1 || numero > 5) {
                await Swal.fire({ icon: 'warning', title: 'Nota inválida', text: 'La nota debe estar entre 1 y 5' });
                return false;
            }
        }

        if (borrandoNota) actualizarNotaLocal(null);
        else actualizarNotaLocal(tipoEvaluacion === "numerica" ? redondearNota(numero) : valorLimpio);

        const payload = construirPayloadNota({
            estudianteId: estudiante_id,
            asignacionId,
            periodo,
            descripcion,
            tipoEvaluacion,
            nota: borrandoNota || tipoEvaluacion !== "numerica" ? null : numero,
            valoracion: tipoEvaluacion === "desarrollo" ? valor : null,
        });

        // Dos guardados de la misma celda van en fila, nunca a la vez: cruzados,
        // podria ganar el valor viejo.
        const guardadoAnterior = guardadosEnCursoRef.current.get(clave);
        if (guardadoAnterior) await guardadoAnterior.catch(() => {});

        const guardado = guardarNotaPlanilla(payload);
        guardadosEnCursoRef.current.set(clave, guardado);

        try {
            await guardado;
            marcarSinGuardar(clave, false);
        } catch (error) {
            console.error("Error guardando la nota", error);
            if (esErrorDeNotaCalculada(error)) {
                // Subnotas, paso A3 (P1): la celda ya es el promedio de sus
                // subnotas; pasa con una pestaña abierta antes de que las
                // tuviera. Reintentar daria lo mismo, asi que no queda
                // pendiente: se avisa y se recarga para mostrar el promedio.
                marcarSinGuardar(clave, false);
                Swal.fire({
                    icon: 'info',
                    title: 'Nota calculada',
                    text: MENSAJE_NOTA_CALCULADA,
                });
                await cargarPlanilla();
                return false;
            }
            marcarSinGuardar(clave, true);
            Swal.fire({
                icon: 'error',
                title: 'No se guardó',
                text: 'La nota quedó pendiente. Vuelve a salir de la celda para reintentar.',
                toast: true,
                position: 'top-end',
                timer: 4000,
                showConfirmButton: false,
            });
        } finally {
            if (guardadosEnCursoRef.current.get(clave) === guardado) {
                guardadosEnCursoRef.current.delete(clave);
            }
        }

        // `true` deja en pantalla lo que escribio el profesor, se haya guardado
        // o haya quedado pendiente. Solo una nota invalida devuelve `false`, que
        // es lo que restaura el valor anterior en la celda.
        return true;
    }, [asignacionId, cargarPlanilla, columnas, estudiantes, marcarSinGuardar, notasSinGuardar, periodo, setEstudiantes, tipoEvaluacion]);

    const agregarTipoEvaluacion = useCallback(async () => {
        if (accionTipoEnCurso) return;

        const tipoLimpio = nuevoTipo.trim();
        if (!tipoLimpio) return;
        if (esColumnaInterna(tipoLimpio)) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Ese nombre está reservado por el sistema.' });
            return;
        }

        const existe = columnas.some(col => col.trim().toLowerCase() === tipoLimpio.toLowerCase());
        if (existe) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'El tipo de evaluación ya existe' });
            return;
        }

        // Porcentajes, paso B4a (PB8): si se escribió un porcentaje, se valida
        // antes de crear nada. Sin porcentaje, todo sigue como siempre.
        const porcentaje = String(nuevoPorcentaje ?? "").trim()
            ? validarPorcentajeNuevo({
                columnas,
                porcentajes: porcentajesPorTipo,
                tipo: tipoLimpio,
                texto: nuevoPorcentaje,
            })
            : { porcentaje: null };
        if (porcentaje.error) {
            Swal.fire({ icon: 'warning', title: 'Porcentaje', text: porcentaje.error });
            return;
        }

        setAccionTipoEnCurso("agregar");
        try {
            await guardarNotaPlanilla(construirPayloadNota({
                estudianteId: estudiantes[0]?.estudiante_id,
                asignacionId,
                periodo,
                descripcion: tipoLimpio,
                tipoEvaluacion,
            }));

            // El tipo ya existe. Si su porcentaje no se guarda, el tipo se
            // queda (sin porcentaje, la planilla usa el promedio simple) y se
            // avisa para ponerlo desde su columna.
            let porcentajeFallido = null;
            if (porcentaje.porcentaje !== null) {
                try {
                    await guardarPorcentajeTipo(construirPayloadPorcentaje({
                        asignacionId,
                        periodo,
                        tipoNota: tipoLimpio,
                        porcentaje: porcentaje.porcentaje,
                    }));
                } catch (error) {
                    console.error("Error guardando el porcentaje del tipo nuevo", error);
                    porcentajeFallido = mensajeDelServidor(error, "Intenta nuevamente en un momento.");
                }
            }

            setNuevoTipo("");
            setNuevoPorcentaje("");
            await cargarPlanilla();
            if (porcentajeFallido) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Tipo agregado sin porcentaje',
                    text: `El tipo de evaluación "${formatearEtiquetaColumna(tipoLimpio)}" se agregó, pero su porcentaje no se guardó: ${porcentajeFallido} Puedes ponerlo desde su columna.`,
                });
                return;
            }
            await Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: `El tipo de evaluación "${formatearEtiquetaColumna(tipoLimpio)}" fue agregado correctamente.`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error agregando tipo de evaluación", error);
            Swal.fire({
                icon: 'error',
                title: 'No se pudo agregar',
                text: 'Intenta nuevamente en un momento.'
            });
        } finally {
            setAccionTipoEnCurso(null);
        }
    }, [accionTipoEnCurso, nuevoTipo, nuevoPorcentaje, porcentajesPorTipo, columnas, estudiantes, asignacionId, periodo, tipoEvaluacion, cargarPlanilla]);

    const eliminarTipoEvaluacion = useCallback(async () => {
        if (accionTipoEnCurso) return;
        if (!tipoEliminar) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Selecciona un tipo a eliminar' });
            return;
        }

        // Subnotas, paso A3 (P6): el tipo se lleva sus subnotas; el aviso lo dice.
        const tieneSubnotas = subnotasDelTipo(subnotasPorTipo, tipoEliminar).length > 0;
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: tieneSubnotas
                ? "Esta acción eliminará el tipo de evaluación y sus subnotas para todos los estudiantes"
                : "Esta acción eliminará el tipo de evaluación para todos los estudiantes",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        const tipoAEliminar = tipoEliminar;
        setAccionTipoEnCurso("eliminar");
        try {
            await eliminarTipoEvaluacionPlanilla({ asignacionId, descripcion: tipoAEliminar, periodo });
            const columnasActualizadas = columnas.filter((col) => col !== tipoAEliminar);
            setColumnas(columnasActualizadas);
            setEstudiantes((actuales) =>
                actuales.map((est) => {
                    const notasActualizadas = { ...(est.notas || {}) };
                    delete notasActualizadas[tipoAEliminar];

                    return {
                        ...est,
                        notas: notasActualizadas,
                        promedio: calcularPromedioNotas(notasActualizadas, columnasActualizadas),
                    };
                })
            );
            setTipoEliminar("");
            await cargarPlanilla();
            await Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El tipo de evaluación fue eliminado',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error eliminando tipo de evaluación", error);
            Swal.fire({
                icon: 'error',
                title: 'No se pudo eliminar',
                text: 'Intenta nuevamente en un momento.'
            });
        } finally {
            setAccionTipoEnCurso(null);
        }
    }, [accionTipoEnCurso, tipoEliminar, subnotasPorTipo, asignacionId, periodo, columnas, setColumnas, setEstudiantes, cargarPlanilla]);

    return {
        nuevoTipo,
        setNuevoTipo,
        nuevoPorcentaje,
        setNuevoPorcentaje,
        tipoEliminar,
        setTipoEliminar,
        accionTipoEnCurso,
        notasSinGuardar,
        guardarNota,
        agregarTipoEvaluacion,
        eliminarTipoEvaluacion,
    };
}
