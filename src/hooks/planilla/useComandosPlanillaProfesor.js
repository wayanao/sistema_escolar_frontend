import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { eliminarTipoEvaluacionPlanilla, guardarNotaPlanilla } from "../../services/planillaApi";
import {
    calcularPromedioNotas,
    construirPayloadNota,
    esColumnaInterna,
    formatearEtiquetaColumna,
    normalizarNumeroNota,
} from "../../utils/planilla/notas";

export default function useComandosPlanillaProfesor({
    asignacionId,
    periodo,
    tipoEvaluacion,
    estudiantes,
    columnas,
    setEstudiantes,
    setColumnas,
    cargarPlanilla,
}) {
    const [nuevoTipo, setNuevoTipo] = useState("");
    const [tipoEliminar, setTipoEliminar] = useState("");
    const [accionTipoEnCurso, setAccionTipoEnCurso] = useState(null);

    const guardarNota = useCallback(async (estudiante_id, descripcion, valor) => {

        const valorLimpio = String(valor ?? "").trim();
        if (!valorLimpio && tipoEvaluacion !== "numerica") return;

        const numero = normalizarNumeroNota(valorLimpio);
        const actualizarNotaLocal = (notaActualizada) => {
            setEstudiantes((actuales) =>
                actuales.map((est) => {
                    if (Number(est.estudiante_id) !== Number(estudiante_id)) return est;

                    if (tipoEvaluacion === "desarrollo") {
                        return {
                            ...est,
                            valoraciones: {
                                ...(est.valoraciones || {}),
                                [descripcion]: valor,
                            },
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

        if (tipoEvaluacion === "numerica" && !valorLimpio) {
            actualizarNotaLocal(null);

            await guardarNotaPlanilla(construirPayloadNota({
                estudianteId: estudiante_id,
                asignacionId,
                periodo,
                descripcion,
                tipoEvaluacion,
            }));

            await cargarPlanilla();
            return true;
        }

        if (tipoEvaluacion === "numerica") {
            if (Number.isNaN(numero) || numero < 1 || numero > 5) {
                await Swal.fire({ icon: 'warning', title: 'Nota inválida', text: 'La nota debe estar entre 1 y 5' });
                return false;
            }
        }

        actualizarNotaLocal(tipoEvaluacion === "numerica" ? numero : valorLimpio);

        await guardarNotaPlanilla(construirPayloadNota({
                estudianteId: estudiante_id,
                asignacionId,
                periodo,
                descripcion,
                tipoEvaluacion,
                nota: tipoEvaluacion === "numerica" ? numero : null,
                valoracion: tipoEvaluacion === "desarrollo" ? valor : null,
        }));

          // 🔄 recargar datos
        await cargarPlanilla();
        return true;
    }, [asignacionId, cargarPlanilla, columnas, periodo, setEstudiantes, tipoEvaluacion]);

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

        setAccionTipoEnCurso("agregar");
        try {
            await guardarNotaPlanilla(construirPayloadNota({
                estudianteId: estudiantes[0]?.estudiante_id,
                asignacionId,
                periodo,
                descripcion: tipoLimpio,
                tipoEvaluacion,
            }));
            setNuevoTipo("");
            await cargarPlanilla();
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
    }, [accionTipoEnCurso, nuevoTipo, columnas, estudiantes, asignacionId, periodo, tipoEvaluacion, cargarPlanilla]);

    const eliminarTipoEvaluacion = useCallback(async () => {
        if (accionTipoEnCurso) return;
        if (!tipoEliminar) {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Selecciona un tipo a eliminar' });
            return;
        }

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará el tipo de evaluación para todos los estudiantes",
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
    }, [accionTipoEnCurso, tipoEliminar, asignacionId, periodo, columnas, setColumnas, setEstudiantes, cargarPlanilla]);

    return {
        nuevoTipo,
        setNuevoTipo,
        tipoEliminar,
        setTipoEliminar,
        accionTipoEnCurso,
        guardarNota,
        agregarTipoEvaluacion,
        eliminarTipoEvaluacion,
    };
}
