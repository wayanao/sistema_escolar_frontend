import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { registrarPagoNomina } from "../../services/nominaEgresosPrestamosApi";
import {
    avisoErrorPagoNomina,
    calcularTotalNomina,
    construirPayloadNomina,
    estadoInicialPagoNomina,
    mensajeConfirmacionPagoNomina,
    mensajeExitoPagoNomina,
    problemasPagoNomina,
    validarPagoNomina,
} from "../../utils/nominaEgresosPrestamos/nomina";
import { TEXTO_CON_SALTOS } from "./ventanasAviso";

// Estado de arranque del formulario. No es observable: el modal no se pinta
// hasta que se elige un empleado y entonces se precarga con su sueldo.
const FORMULARIO_VACIO = {
    salarioBase: "",
    bonificaciones: "0",
    abonoPrestamo: "0",
    otrosDescuentos: "0",
    notas: "",
};

const SIN_PROBLEMAS = Object.freeze({ abono: null, total: null });

// `revisarHistorialDe(empleado)`: lo que hace la página cuando no se sabe si
// el pago quedó y el usuario pide revisarlo (buscarlo y bajar al historial).
const usePagoNomina = ({ cargarDatos, revisarHistorialDe }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [registrando, setRegistrando] = useState(false);
    // Pagos registrados mientras la página sigue abierta: { [empleadoId]: nominaId }.
    const [pagosRegistrados, setPagosRegistrados] = useState({});
    const [ultimoPagadoId, setUltimoPagadoId] = useState(null);
    // Un segundo clic puede llegar antes de que el botón se pinte bloqueado;
    // esta marca lo frena en el acto, desde la confirmación hasta el final.
    const enCurso = useRef(false);

    const totalNeto = calcularTotalNomina(formulario);
    // Lo que impide pagar, para avisarlo mientras se escribe.
    const problemas = empleadoSeleccionado
        ? problemasPagoNomina({ empleado: empleadoSeleccionado, ...formulario })
        : SIN_PROBLEMAS;

    const abrirPago = (empleado) => {
        setEmpleadoSeleccionado(empleado);
        setFormulario(estadoInicialPagoNomina(empleado));
        setModalAbierto(true);
    };

    // Mientras se registra no se cierra: se perdería el resultado de vista.
    const cerrarPago = () => {
        if (enCurso.current) return;
        setModalAbierto(false);
    };

    const cambiarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const registrarPago = async (evento) => {
        evento.preventDefault();
        if (enCurso.current) return;

        const datosPago = { empleado: empleadoSeleccionado, ...formulario };
        const errorValidacion = validarPagoNomina(datosPago);
        if (errorValidacion) {
            Swal.fire({ icon: "warning", title: "Revisa el pago", text: errorValidacion });
            return;
        }

        enCurso.current = true;
        try {
            // Una nómina no se puede anular desde la app: se confirma antes.
            const confirmacion = await Swal.fire({
                icon: "question",
                title: "¿Registrar este pago de nómina?",
                text: mensajeConfirmacionPagoNomina(datosPago),
                showCancelButton: true,
                confirmButtonText: "Sí, registrar pago",
                cancelButtonText: "Revisar",
                confirmButtonColor: "#16a34a",
                customClass: TEXTO_CON_SALTOS,
            });
            if (!confirmacion?.isConfirmed) return;

            setRegistrando(true);
            const respuesta = await registrarPagoNomina(construirPayloadNomina(datosPago));
            const nominaId = respuesta?.nomina_id ?? null;

            setModalAbierto(false);
            setPagosRegistrados((actuales) => ({
                ...actuales,
                [empleadoSeleccionado.id]: nominaId,
            }));
            setUltimoPagadoId(empleadoSeleccionado.id);
            Swal.fire({
                icon: "success",
                title: "Pago registrado",
                text: mensajeExitoPagoNomina({ ...datosPago, nominaId }),
                customClass: TEXTO_CON_SALTOS,
            });
            cargarDatos(); // Recarga las tablas sin esconderlas.
        } catch (err) {
            // Un fallo conserva el modal abierto y lo escrito para reintentar.
            console.error("Error registrando pago:", err);
            setRegistrando(false);
            const aviso = avisoErrorPagoNomina(err);

            if (!aviso.incierto) {
                Swal.fire({
                    icon: "error",
                    title: aviso.titulo,
                    text: aviso.texto,
                    customClass: TEXTO_CON_SALTOS,
                });
                return;
            }

            // El pago pudo quedar guardado: se recarga para que las tablas digan
            // la verdad, y se ofrece revisarlo antes de reintentar.
            cargarDatos();
            // Se baja al historial solo cuando la ventana termina de cerrarse:
            // al cerrar, SweetAlert devuelve la pantalla a donde estaba y
            // cortaría la bajada a medio camino.
            let irAlHistorial = false;
            const decision = await Swal.fire({
                icon: "warning",
                title: aviso.titulo,
                text: aviso.texto,
                showCancelButton: true,
                confirmButtonText: "Revisar el historial",
                cancelButtonText: "Seguir aquí",
                customClass: TEXTO_CON_SALTOS,
                didClose: () => {
                    if (irAlHistorial) revisarHistorialDe?.(empleadoSeleccionado);
                },
            });
            if (decision?.isConfirmed) {
                setModalAbierto(false);
                irAlHistorial = true;
            }
        } finally {
            enCurso.current = false;
            setRegistrando(false);
        }
    };

    return {
        modalAbierto,
        empleadoSeleccionado,
        formulario,
        totalNeto,
        problemas,
        registrando,
        pagosRegistrados,
        ultimoPagadoId,
        abrirPago,
        cerrarPago,
        cambiarCampo,
        registrarPago,
    };
};

export default usePagoNomina;
