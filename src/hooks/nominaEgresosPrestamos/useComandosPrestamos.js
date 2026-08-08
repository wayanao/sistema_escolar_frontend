import { useState } from "react";
import {
    actualizarEstadoPrestamo,
    crearPrestamo,
} from "../../services/nominaEgresosPrestamosApi";
import {
    construirPayloadPrestamo,
    ESTADO_PRESTAMO_PAGADO,
    fechaPrestamoPorDefecto,
    mensajeConfirmacionEstadoPrestamo,
    mensajeConfirmacionPrestamo,
    mensajeErrorCrearPrestamo,
    obtenerNombreProfesor,
    validarPrestamo,
} from "../../utils/nominaEgresosPrestamos/prestamos";

const FORMULARIO_VACIO = {
    profesorId: "",
    monto: "",
    fecha: "",
    notas: "",
};

const useComandosPrestamos = ({ profesores, mostrarHistorialDe, recargarHistorial }) => {
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

    const cambiarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const crear = async (evento) => {
        evento.preventDefault();

        const montoNumero = Number(formulario.monto);
        const errorValidacion = validarPrestamo({
            profesorId: formulario.profesorId,
            monto: montoNumero,
        });

        if (errorValidacion) {
            alert(errorValidacion);
            return;
        }

        const fechaPrestamo = formulario.fecha || fechaPrestamoPorDefecto(new Date());
        const confirmar = window.confirm(
            mensajeConfirmacionPrestamo({
                nombreProfesor: obtenerNombreProfesor(profesores, formulario.profesorId),
                monto: montoNumero,
                fecha: fechaPrestamo,
            })
        );

        if (!confirmar) {
            return;
        }

        try {
            await crearPrestamo(
                construirPayloadPrestamo({
                    profesorId: formulario.profesorId,
                    monto: montoNumero,
                    fecha: fechaPrestamo,
                    notas: formulario.notas,
                })
            );
            // Limpiar formulario y mostrar el historial del profesor prestado.
            const profesorRegistrado = formulario.profesorId;
            setFormulario(FORMULARIO_VACIO);
            mostrarHistorialDe(profesorRegistrado);
        } catch (err) {
            console.error(err);
            alert(mensajeErrorCrearPrestamo(err));
        }
    };

    // Saldar es el único cambio de estado que existe: el backend rechaza
    // cualquier valor distinto de Pagado.
    const saldarPrestamo = async (prestamoId) => {
        if (!window.confirm(mensajeConfirmacionEstadoPrestamo(ESTADO_PRESTAMO_PAGADO))) return;
        try {
            await actualizarEstadoPrestamo(prestamoId, ESTADO_PRESTAMO_PAGADO);
            recargarHistorial();
        } catch (err) {
            console.error(err);
            alert("Error al actualizar el estado.");
        }
    };

    return { formulario, cambiarCampo, crear, saldarPrestamo };
};

export default useComandosPrestamos;
