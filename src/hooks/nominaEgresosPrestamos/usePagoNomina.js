import { useState } from "react";
import { registrarPagoNomina } from "../../services/nominaEgresosPrestamosApi";
import {
    calcularTotalNomina,
    construirPayloadNomina,
    estadoInicialPagoNomina,
    validarPagoNomina,
} from "../../utils/nominaEgresosPrestamos/nomina";

// Estado de arranque del formulario. No es observable: el modal no se pinta
// hasta que se elige un empleado y entonces se precarga con su sueldo.
const FORMULARIO_VACIO = {
    salarioBase: "",
    bonificaciones: "0",
    abonoPrestamo: "0",
    otrosDescuentos: "0",
    notas: "",
};

const usePagoNomina = ({ cargarDatos }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

    const totalNeto = calcularTotalNomina(formulario);

    const abrirPago = (empleado) => {
        setEmpleadoSeleccionado(empleado);
        setFormulario(estadoInicialPagoNomina(empleado));
        setModalAbierto(true);
    };

    const cerrarPago = () => setModalAbierto(false);

    const cambiarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const registrarPago = async (evento) => {
        evento.preventDefault();

        const errorValidacion = validarPagoNomina({
            empleado: empleadoSeleccionado,
            ...formulario,
        });

        if (errorValidacion) {
            alert(errorValidacion);
            return;
        }

        try {
            await registrarPagoNomina(
                construirPayloadNomina({ empleado: empleadoSeleccionado, ...formulario })
            );

            setModalAbierto(false);
            alert("Pago de nómina registrado exitosamente y préstamos abonados.");
            cargarDatos(); // Recargar tablas
        } catch (err) {
            // Un fallo conserva el modal abierto y lo escrito para reintentar.
            console.error("Error registrando pago:", err);
            alert("Ocurrió un error al procesar el pago de nómina.");
        }
    };

    return {
        modalAbierto,
        empleadoSeleccionado,
        formulario,
        totalNeto,
        abrirPago,
        cerrarPago,
        cambiarCampo,
        registrarPago,
    };
};

export default usePagoNomina;
