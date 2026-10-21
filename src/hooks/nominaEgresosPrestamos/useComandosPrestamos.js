import { useRef, useState } from "react";
import Swal from "sweetalert2";
import {
    actualizarEstadoPrestamo,
    crearPrestamo,
} from "../../services/nominaEgresosPrestamosApi";
import {
    avisoErrorCrearPrestamo,
    avisoErrorSaldar,
    construirPayloadPrestamo,
    ESTADO_PRESTAMO_PAGADO,
    fechaPrestamoPorDefecto,
    mensajeConfirmacionPrestamo,
    mensajeConfirmacionSaldar,
    mensajeExitoPrestamo,
    mensajeExitoSaldar,
    obtenerNombreProfesor,
    validarPrestamo,
} from "../../utils/nominaEgresosPrestamos/prestamos";
import { avisarYEsperarCierre, TEXTO_CON_SALTOS } from "./ventanasAviso";

const FORMULARIO_VACIO = {
    profesorId: "",
    monto: "",
    fecha: "",
    notas: "",
};

// `irAlHistorial()`: lo que hace la página cuando no se sabe si un préstamo
// quedó y el usuario pide revisarlo (bajar al historial).
const useComandosPrestamos = ({
    profesores,
    mostrarHistorialDe,
    recargarHistorial,
    irAlHistorial,
}) => {
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [registrando, setRegistrando] = useState(false);
    const [saldandoId, setSaldandoId] = useState(null);
    // Fila que se pinta en verde después de registrar o saldar.
    const [prestamoResaltadoId, setPrestamoResaltadoId] = useState(null);
    // Pedido de llevar esa fila a la vista: { id, vez }. Llega cuando la fila
    // ya está en la tabla y la ventana de aviso terminó de cerrarse.
    const [prestamoPorMostrar, setPrestamoPorMostrar] = useState(null);
    // Una operación a la vez: un segundo clic llega antes de que el botón se
    // pinte bloqueado, y esta marca lo frena en el acto.
    const enCurso = useRef(false);

    const cambiarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const crear = async (evento) => {
        evento.preventDefault();
        if (enCurso.current) return;

        const montoNumero = Number(formulario.monto);
        const errorValidacion = validarPrestamo({
            profesorId: formulario.profesorId,
            monto: montoNumero,
        });

        if (errorValidacion) {
            Swal.fire({ icon: "warning", title: "Revisa el préstamo", text: errorValidacion });
            return;
        }

        const profesorRegistrado = formulario.profesorId;
        const datosPrestamo = {
            nombreProfesor: obtenerNombreProfesor(profesores, profesorRegistrado),
            monto: montoNumero,
            fecha: formulario.fecha || fechaPrestamoPorDefecto(new Date()),
        };

        enCurso.current = true;
        try {
            const confirmacion = await Swal.fire({
                icon: "question",
                title: "¿Registrar este préstamo?",
                text: mensajeConfirmacionPrestamo(datosPrestamo),
                showCancelButton: true,
                confirmButtonText: "Sí, registrar préstamo",
                cancelButtonText: "Revisar",
                confirmButtonColor: "#16a34a",
                customClass: TEXTO_CON_SALTOS,
            });
            if (!confirmacion?.isConfirmed) return;

            setRegistrando(true);
            const respuesta = await crearPrestamo(
                construirPayloadPrestamo({
                    profesorId: profesorRegistrado,
                    monto: montoNumero,
                    fecha: datosPrestamo.fecha,
                    notas: formulario.notas,
                })
            );
            const prestamoId = respuesta?.id ?? null;

            // Limpiar formulario y mostrar el historial del profesor prestado.
            setFormulario(FORMULARIO_VACIO);
            setPrestamoResaltadoId(prestamoId);
            const historial = mostrarHistorialDe(profesorRegistrado);
            const avisoCerrado = avisarYEsperarCierre({
                icon: "success",
                title: "Préstamo registrado",
                text: mensajeExitoPrestamo(datosPrestamo),
            });
            Promise.all([historial, avisoCerrado]).then(() => {
                if (prestamoId) {
                    setPrestamoPorMostrar((anterior) => ({
                        id: prestamoId,
                        vez: (anterior?.vez ?? 0) + 1,
                    }));
                }
            });
        } catch (err) {
            // Un fallo conserva lo escrito para reintentar.
            console.error(err);
            setRegistrando(false);
            const aviso = avisoErrorCrearPrestamo(err);

            if (!aviso.incierto) {
                Swal.fire({
                    icon: "error",
                    title: aviso.titulo,
                    text: aviso.texto,
                    customClass: TEXTO_CON_SALTOS,
                });
                return;
            }

            // Pudo quedar guardado: se carga el historial de esa persona para
            // revisarlo, y se baja hasta él cuando la ventana termina de cerrarse.
            mostrarHistorialDe(profesorRegistrado);
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
            setRegistrando(false);
        }
    };

    // Saldar es el único cambio de estado que existe: el backend rechaza
    // cualquier valor distinto de Pagado.
    const saldarPrestamo = async (prestamo) => {
        if (enCurso.current) return;

        enCurso.current = true;
        try {
            const confirmacion = await Swal.fire({
                icon: "warning",
                title: "¿Saldar este préstamo?",
                text: mensajeConfirmacionSaldar(prestamo),
                showCancelButton: true,
                confirmButtonText: "Sí, saldar",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#16a34a",
                customClass: TEXTO_CON_SALTOS,
            });
            if (!confirmacion?.isConfirmed) return;

            setSaldandoId(prestamo.id);
            await actualizarEstadoPrestamo(prestamo.id, ESTADO_PRESTAMO_PAGADO);
            setPrestamoResaltadoId(prestamo.id);
            Swal.fire({
                icon: "success",
                title: "Préstamo saldado",
                text: mensajeExitoSaldar(prestamo),
            });
            recargarHistorial();
        } catch (err) {
            console.error(err);
            const aviso = avisoErrorSaldar(err);
            // Pudo quedar saldado: se recarga para que la tabla diga la verdad.
            if (aviso.incierto) recargarHistorial();
            Swal.fire({
                icon: aviso.incierto ? "warning" : "error",
                title: aviso.titulo,
                text: aviso.texto,
                customClass: TEXTO_CON_SALTOS,
            });
        } finally {
            enCurso.current = false;
            setSaldandoId(null);
        }
    };

    return {
        formulario,
        cambiarCampo,
        crear,
        saldarPrestamo,
        registrando,
        saldandoId,
        prestamoResaltadoId,
        prestamoPorMostrar,
    };
};

export default useComandosPrestamos;
