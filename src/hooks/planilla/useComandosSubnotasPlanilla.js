import { useCallback, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
    crearSubnotaPlanilla,
    eliminarSubnotaPlanilla,
    guardarCalificacionesSubnotas,
    renombrarSubnotaPlanilla,
} from "../../services/planillaApi";
import {
    MENSAJE_LIMITE_SUBNOTAS,
    MENSAJE_NOTA_INVALIDA,
    agregarSubnota,
    alcanzoElLimite,
    aplicarCalificacionesGuardadas,
    aplicarSubnotaBorrada,
    borradorInicial,
    casillasInvalidas,
    construirPayloadCalificaciones,
    construirPayloadRenombrarSubnota,
    construirPayloadSubnota,
    contarCalificacionesDeSubnota,
    mensajeDelServidor,
    quedaraSinSubnotas,
    quitarSubnota,
    renombrarSubnota,
    subnotasCambiadas,
    subnotasDelTipo,
    tieneNotaAMano,
    validarNombreSubnota,
    vistaPreviaDeCelda,
} from "../../utils/planilla/subnotas";

const MENSAJE_SIN_CONEXION = "Revisa la conexión e intenta nuevamente.";

const mismoEstudiante = (a, b) => Number(a) === Number(b);

/** Lo que dice la confirmación de borrar una subnota (P5). */
const textoDeBorrado = (cuantas) => {
    if (cuantas === 0) return "Nadie la ha calificado todavía.";
    const calificaciones = cuantas === 1 ? "Se borrará 1 calificación" : `Se borrarán ${cuantas} calificaciones`;
    return `${calificaciones} del curso en esta subnota, y la nota de esos estudiantes se recalculará.`;
};

const sinClave = (objeto, clave) => {
    const siguiente = { ...objeto };
    delete siguiente[clave];
    return siguiente;
};

/**
 * Comandos del modal de subnotas de la planilla.
 *
 * Ver docs/funcionalidades/SUBNOTAS_PLANILLA.md. El modal muestra las
 * subnotas de un tipo de nota (las mismas para todo el curso) con lo que tiene
 * calificado **un** estudiante. Este gancho guarda lo escrito, la vista previa
 * del promedio y los movimientos entre estudiantes, y escribe en el servidor.
 *
 * Después de cada escritura actualiza la planilla con lo que respondió el
 * servidor -la celda y las subnotas que quedaron guardadas-, sin volver a
 * pedirla entera. La planilla y las subnotas por tipo son del gancho de
 * consulta; aquí solo se reciben sus `set...`.
 */
export default function useComandosSubnotasPlanilla({
    asignacionId,
    periodo,
    tipoEvaluacion,
    estudiantes,
    columnas,
    subnotasPorTipo,
    setEstudiantes,
    setSubnotasPorTipo,
}) {
    const [abierta, setAbierta] = useState(null);
    const [original, setOriginal] = useState({});
    const [borrador, setBorrador] = useState({});
    const [accionEnCurso, setAccionEnCurso] = useState(null);
    // Una sola escritura a la vez: dos guardados cruzados del mismo estudiante
    // podrian dejar en pantalla el mas viejo.
    const enCursoRef = useRef(false);

    const tipo = abierta?.tipo ?? null;
    const subnotas = useMemo(
        () => (tipo ? subnotasDelTipo(subnotasPorTipo, tipo) : []),
        [subnotasPorTipo, tipo],
    );
    const lista = useMemo(() => (Array.isArray(estudiantes) ? estudiantes : []), [estudiantes]);
    const indice = abierta
        ? lista.findIndex((est) => mismoEstudiante(est.estudiante_id, abierta.estudianteId))
        : -1;
    const estudiante = indice >= 0 ? lista[indice] : null;
    const cambiadas = useMemo(
        () => (abierta ? subnotasCambiadas(original, borrador, tipoEvaluacion) : []),
        [abierta, borrador, original, tipoEvaluacion],
    );
    const invalidas = useMemo(
        () => casillasInvalidas(borrador, tipoEvaluacion),
        [borrador, tipoEvaluacion],
    );

    const empezar = useCallback((accion) => {
        enCursoRef.current = true;
        setAccionEnCurso(accion);
    }, []);

    const terminar = useCallback(() => {
        enCursoRef.current = false;
        setAccionEnCurso(null);
    }, []);

    const abrir = useCallback((estudianteId, tipoNota) => {
        const elegido = lista.find((est) => mismoEstudiante(est.estudiante_id, estudianteId));
        if (!elegido) return;

        const inicial = borradorInicial(elegido, subnotasDelTipo(subnotasPorTipo, tipoNota));
        setAbierta({ estudianteId: elegido.estudiante_id, tipo: tipoNota });
        setOriginal(inicial);
        setBorrador(inicial);
    }, [lista, subnotasPorTipo]);

    const cambiarCalificacion = useCallback((subnotaId, valor) => {
        setBorrador((actual) => ({ ...actual, [String(subnotaId)]: valor }));
    }, []);

    /**
     * Guarda lo que cambió. `true` si quedó guardado o no había nada que
     * guardar; `false` si hay una nota mal escrita o el servidor no lo aceptó,
     * y en ese caso lo escrito se queda en el modal.
     */
    const guardar = useCallback(async () => {
        if (!abierta || enCursoRef.current) return false;

        if (invalidas.length > 0) {
            await Swal.fire({ icon: "warning", title: "Nota inválida", text: MENSAJE_NOTA_INVALIDA });
            return false;
        }
        if (cambiadas.length === 0) return true;

        const payload = construirPayloadCalificaciones({
            asignacionId,
            periodo,
            tipoNota: abierta.tipo,
            estudianteId: abierta.estudianteId,
            tipoEvaluacion,
            borrador,
            cambiadas,
        });

        empezar("guardar");
        try {
            const respuesta = await guardarCalificacionesSubnotas(payload);
            setEstudiantes((actuales) => actuales.map((est) => (
                mismoEstudiante(est.estudiante_id, abierta.estudianteId)
                    ? aplicarCalificacionesGuardadas(est, abierta.tipo, subnotas, respuesta, columnas)
                    : est
            )));
            const guardado = borradorInicial({ subnotas: respuesta?.subnotas }, subnotas);
            setOriginal(guardado);
            setBorrador(guardado);
            return true;
        } catch (error) {
            console.error("Error guardando las subnotas", error);
            await Swal.fire({
                icon: "error",
                title: "No se guardó",
                text: mensajeDelServidor(error, MENSAJE_SIN_CONEXION),
            });
            return false;
        } finally {
            terminar();
        }
    }, [abierta, asignacionId, borrador, cambiadas, columnas, empezar, invalidas.length, periodo, setEstudiantes, subnotas, terminar, tipoEvaluacion]);

    const moverA = useCallback(async (paso) => {
        const destino = lista[indice + paso];
        if (!abierta || !destino) return false;

        const guardado = await guardar();
        if (!guardado) return false;

        // `destino` es otro estudiante: lo que se acaba de guardar no lo toca.
        abrir(destino.estudiante_id, abierta.tipo);
        return true;
    }, [abierta, abrir, guardar, indice, lista]);

    const irAlSiguiente = useCallback(() => moverA(1), [moverA]);
    const irAlAnterior = useCallback(() => moverA(-1), [moverA]);

    /** Cierra el modal. Con cambios sin guardar, pregunta antes (`false` si se arrepiente). */
    const cerrar = useCallback(async () => {
        if (cambiadas.length > 0) {
            const respuesta = await Swal.fire({
                icon: "warning",
                title: "Cambios sin guardar",
                text: "Si cierras ahora, se pierden las subnotas que escribiste para este estudiante.",
                showCancelButton: true,
                confirmButtonText: "Cerrar sin guardar",
                cancelButtonText: "Seguir editando",
            });
            if (!respuesta.isConfirmed) return false;
        }
        setAbierta(null);
        setOriginal({});
        setBorrador({});
        return true;
    }, [cambiadas.length]);

    /** Crea una subnota para todo el curso (decisión 5). Aparece vacía para todos. */
    const crearSubnota = useCallback(async (nombre) => {
        if (!abierta || enCursoRef.current) return false;

        const problema = alcanzoElLimite(subnotas)
            ? MENSAJE_LIMITE_SUBNOTAS
            : validarNombreSubnota(nombre, subnotas);
        if (problema) {
            await Swal.fire({ icon: "warning", title: "Atención", text: problema });
            return false;
        }

        const tipoNota = abierta.tipo;
        empezar("crear");
        try {
            const creada = await crearSubnotaPlanilla(
                construirPayloadSubnota({ asignacionId, periodo, tipoNota, nombre }),
            );
            const clave = String(creada.id);
            setSubnotasPorTipo((actual) => agregarSubnota(actual, tipoNota, creada));
            setOriginal((actual) => ({ ...actual, [clave]: "" }));
            setBorrador((actual) => ({ ...actual, [clave]: "" }));
            return true;
        } catch (error) {
            console.error("Error creando la subnota", error);
            await Swal.fire({
                icon: "error",
                title: "No se pudo agregar",
                text: mensajeDelServidor(error, MENSAJE_SIN_CONEXION),
            });
            return false;
        } finally {
            terminar();
        }
    }, [abierta, asignacionId, empezar, periodo, setSubnotasPorTipo, subnotas, terminar]);

    /** P5: cambia el nombre sin tocar ninguna nota. */
    const cambiarNombreSubnota = useCallback(async (subnotaId, nombre) => {
        if (!abierta || enCursoRef.current) return false;

        const actual = subnotas.find((subnota) => String(subnota.id) === String(subnotaId));
        if (!actual) return false;
        if (String(nombre ?? "").trim() === actual.nombre) return true;

        const problema = validarNombreSubnota(nombre, subnotas, { excluirId: subnotaId });
        if (problema) {
            await Swal.fire({ icon: "warning", title: "Atención", text: problema });
            return false;
        }

        const tipoNota = abierta.tipo;
        empezar("renombrar");
        try {
            const renombrada = await renombrarSubnotaPlanilla(
                subnotaId,
                construirPayloadRenombrarSubnota({ asignacionId, nombre }),
            );
            setSubnotasPorTipo((todas) =>
                renombrarSubnota(todas, tipoNota, subnotaId, renombrada.nombre),
            );
            return true;
        } catch (error) {
            console.error("Error renombrando la subnota", error);
            await Swal.fire({
                icon: "error",
                title: "No se pudo cambiar el nombre",
                text: mensajeDelServidor(error, MENSAJE_SIN_CONEXION),
            });
            return false;
        } finally {
            terminar();
        }
    }, [abierta, asignacionId, empezar, setSubnotasPorTipo, subnotas, terminar]);

    /**
     * P5: borra la subnota en todo el curso, tras confirmar cuántas
     * calificaciones se pierden. Las celdas afectadas llegan recalculadas.
     */
    const borrarSubnota = useCallback(async (subnotaId) => {
        if (!abierta || enCursoRef.current) return false;

        const subnota = subnotas.find((s) => String(s.id) === String(subnotaId));
        if (!subnota) return false;

        const cuantas = contarCalificacionesDeSubnota(lista, subnotaId);
        const confirmacion = await Swal.fire({
            icon: "warning",
            title: `¿Borrar "${subnota.nombre}"?`,
            text: textoDeBorrado(cuantas),
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Sí, borrar",
            cancelButtonText: "Cancelar",
        });
        if (!confirmacion.isConfirmed) return false;

        const tipoNota = abierta.tipo;
        const clave = String(subnotaId);
        empezar("borrar");
        try {
            const respuesta = await eliminarSubnotaPlanilla({ subnotaId, asignacionId });
            setEstudiantes((actuales) =>
                aplicarSubnotaBorrada(actuales, tipoNota, subnotaId, respuesta?.celdas, columnas),
            );
            setSubnotasPorTipo((todas) => quitarSubnota(todas, tipoNota, subnotaId));
            setOriginal((actual) => sinClave(actual, clave));
            setBorrador((actual) => sinClave(actual, clave));
            return true;
        } catch (error) {
            console.error("Error borrando la subnota", error);
            await Swal.fire({
                icon: "error",
                title: "No se pudo borrar",
                text: mensajeDelServidor(error, MENSAJE_SIN_CONEXION),
            });
            return false;
        } finally {
            terminar();
        }
    }, [abierta, asignacionId, columnas, empezar, lista, setEstudiantes, setSubnotasPorTipo, subnotas, terminar]);

    return {
        abierta: Boolean(abierta && estudiante),
        tipo,
        estudiante,
        subnotas,
        borrador,
        invalidas,
        vistaPrevia: abierta ? vistaPreviaDeCelda(borrador, tipoEvaluacion) : null,
        hayCambios: cambiadas.length > 0,
        // P3 y P4: los avisos que el modal muestra arriba.
        notaAMano: Boolean(estudiante && tieneNotaAMano(estudiante, tipo, subnotas)),
        quedaraVacia: abierta ? quedaraSinSubnotas(original, borrador) : false,
        limiteAlcanzado: alcanzoElLimite(subnotas),
        posicion: indice + 1,
        total: lista.length,
        hayAnterior: indice > 0,
        haySiguiente: indice >= 0 && indice < lista.length - 1,
        accionEnCurso,
        abrir,
        cerrar,
        cambiarCalificacion,
        guardar,
        irAlSiguiente,
        irAlAnterior,
        crearSubnota,
        cambiarNombreSubnota,
        borrarSubnota,
    };
}
