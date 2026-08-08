import { useState } from "react";
import { actualizarEgreso, crearEgreso } from "../../services/nominaEgresosPrestamosApi";
import {
    CATEGORIA_EGRESO_INICIAL,
    formularioDesdeEgreso,
    mensajeConfirmacionEgreso,
    mensajeErrorGuardarEgreso,
    normalizarEgreso,
    obtenerFechaLocal,
    puedeEditarEgreso,
    validarEgreso,
} from "../../utils/nominaEgresosPrestamos/egresos";

const FORMULARIO_VACIO = {
    concepto: "",
    monto: "",
    fecha: "",
    categoria: CATEGORIA_EGRESO_INICIAL,
    notas: "",
};

const useFormularioEgreso = ({ recargarRangoVigente, mostrarRangoDeUnDia }) => {
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
    const [egresoEditando, setEgresoEditando] = useState(null);

    const cambiarCampo = (campo, valor) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const limpiarFormulario = () => {
        setFormulario(FORMULARIO_VACIO);
        setEgresoEditando(null);
    };

    const editarEgreso = (egreso) => {
        if (!puedeEditarEgreso(egreso)) {
            alert("Solo puedes editar egresos creados manualmente en esta pantalla.");
            return;
        }

        setEgresoEditando(egreso);
        setFormulario(formularioDesdeEgreso(egreso));
    };

    const guardarEgreso = async (evento) => {
        evento.preventDefault();
        try {
            const egreso = normalizarEgreso(formulario, obtenerFechaLocal(new Date()));

            const errorValidacion = validarEgreso(egreso);
            if (errorValidacion) {
                alert(errorValidacion);
                return;
            }

            const confirmar = window.confirm(
                mensajeConfirmacionEgreso(egreso, Boolean(egresoEditando))
            );

            if (!confirmar) {
                return;
            }

            if (egresoEditando) {
                await actualizarEgreso(egresoEditando.id, egreso);
                await recargarRangoVigente();
            } else {
                await crearEgreso(egreso);
                // Registrar mueve el filtro al día del egreso creado.
                await mostrarRangoDeUnDia(egreso.fecha);
            }

            limpiarFormulario();
        } catch (err) {
            console.error(err);
            alert(mensajeErrorGuardarEgreso(err));
        }
    };

    return {
        formulario,
        egresoEditando,
        cambiarCampo,
        limpiarFormulario,
        editarEgreso,
        guardarEgreso,
    };
};

export default useFormularioEgreso;
