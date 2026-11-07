import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { actualizarEgreso, crearEgreso } from "../../services/nominaEgresosPrestamosApi";
import {
    avisoErrorGuardarEgreso,
    CATEGORIA_EGRESO_INICIAL,
    formularioDesdeEgreso,
    mensajeConfirmacionEgreso,
    mensajeExitoEgreso,
    normalizarEgreso,
    obtenerFechaLocal,
    puedeEditarEgreso,
    validarEgreso,
} from "../../utils/nominaEgresosPrestamos/egresos";
import { avisarExitoYEsperarCierre, TEXTO_CON_SALTOS } from "./ventanasAviso";

const FORMULARIO_VACIO = {
    concepto: "",
    monto: "",
    fecha: "",
    categoria: CATEGORIA_EGRESO_INICIAL,
    notas: "",
};

// `irAlHistorial()`: lo que hace la página cuando no se sabe si un egreso
// quedó y el usuario pide revisarlo (bajar al historial).
const useFormularioEgreso = ({ recargarRangoVigente, mostrarRangoDeUnDia, irAlHistorial }) => {
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [egresoEditando, setEgresoEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    // Fila que se pinta en verde después de guardar.
    const [egresoResaltadoId, setEgresoResaltadoId] = useState(null);
    // Pedido de llevar esa fila a la vista: { id, vez }. Llega cuando la fila
    // ya está en la tabla y la ventana de aviso terminó de cerrarse.
    const [egresoPorMostrar, setEgresoPorMostrar] = useState(null);
    // Un segundo clic llega antes de que el botón se pinte bloqueado; esta
    // marca lo frena en el acto, desde la confirmación hasta el final.
    const enCurso = useRef(false);

    const cambiarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const limpiarFormulario = () => {
        setFormulario(FORMULARIO_VACIO);
        setEgresoEditando(null);
    };

    // Devuelve si empezó la edición, para que la página suba al formulario.
    const editarEgreso = (egreso) => {
        if (enCurso.current) return false;
        if (!puedeEditarEgreso(egreso)) {
            Swal.fire({
                icon: "info",
                title: "Egreso automático",
                text: "Solo puedes editar egresos creados manualmente en esta pantalla.",
            });
            return false;
        }

        setEgresoEditando(egreso);
        setFormulario(formularioDesdeEgreso(egreso));
        setEgresoResaltadoId(null);
        return true;
    };

    const guardarEgreso = async (evento) => {
        evento.preventDefault();
        if (enCurso.current) return;

        const egreso = normalizarEgreso(formulario, obtenerFechaLocal(new Date()));
        const errorValidacion = validarEgreso(egreso);
        if (errorValidacion) {
            Swal.fire({ icon: "warning", title: "Revisa el egreso", text: errorValidacion });
            return;
        }

        const editando = Boolean(egresoEditando);
        enCurso.current = true;
        try {
            const confirmacion = await Swal.fire({
                icon: "question",
                title: editando ? "¿Actualizar este egreso?" : "¿Registrar este egreso?",
                text: mensajeConfirmacionEgreso(egreso),
                showCancelButton: true,
                confirmButtonText: editando ? "Sí, actualizar" : "Sí, registrar egreso",
                cancelButtonText: "Revisar",
                confirmButtonColor: "#16a34a",
                customClass: TEXTO_CON_SALTOS,
            });
            if (!confirmacion?.isConfirmed) return;

            setGuardando(true);
            let egresoId;
            let recarga;
            if (editando) {
                await actualizarEgreso(egresoEditando.id, egreso);
                egresoId = egresoEditando.id;
                recarga = recargarRangoVigente();
            } else {
                const respuesta = await crearEgreso(egreso);
                egresoId = respuesta?.id ?? null;
                // Registrar mueve el filtro al día del egreso creado.
                recarga = mostrarRangoDeUnDia(egreso.fecha);
            }

            limpiarFormulario();
            setEgresoResaltadoId(egresoId);
            const avisoCerrado = avisarExitoYEsperarCierre({
                title: editando ? "Egreso actualizado" : "Egreso registrado",
                text: mensajeExitoEgreso(egreso, editando),
            });
            Promise.all([recarga, avisoCerrado]).then(() => {
                if (egresoId) {
                    setEgresoPorMostrar((anterior) => ({
                        id: egresoId,
                        vez: (anterior?.vez ?? 0) + 1,
                    }));
                }
            });
        } catch (err) {
            // Un fallo conserva lo escrito para reintentar.
            console.error(err);
            setGuardando(false);
            const aviso = avisoErrorGuardarEgreso(err, editando);

            if (!aviso.incierto) {
                Swal.fire({
                    icon: "error",
                    title: aviso.titulo,
                    text: aviso.texto,
                    customClass: TEXTO_CON_SALTOS,
                });
                return;
            }

            // Pudo quedar guardado: se muestra la lista donde aparecería para
            // revisarla, y se baja a ella cuando la ventana termina de cerrarse.
            if (editando) {
                recargarRangoVigente();
            } else {
                mostrarRangoDeUnDia(egreso.fecha);
            }
            let bajar = false;
            const decision = await Swal.fire({
                icon: "warning",
                title: aviso.titulo,
                text: aviso.texto,
                showCancelButton: true,
                confirmButtonText: "Revisar el historial",
                cancelButtonText: "Seguir aquí",
                customClass: TEXTO_CON_SALTOS,
                didClose: () => {
                    if (bajar) irAlHistorial?.();
                },
            });
            bajar = Boolean(decision?.isConfirmed);
        } finally {
            enCurso.current = false;
            setGuardando(false);
        }
    };

    return {
        formulario,
        egresoEditando,
        guardando,
        egresoResaltadoId,
        egresoPorMostrar,
        cambiarCampo,
        limpiarFormulario,
        editarEgreso,
        guardarEgreso,
    };
};

export default useFormularioEgreso;
