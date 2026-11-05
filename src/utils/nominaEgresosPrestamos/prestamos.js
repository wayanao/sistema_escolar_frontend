import { fechaIsoColombia } from "../fechaColombia";
import { primeraMayuscula } from "../nombres";
import { esRespuestaIncierta, explicacionDelRechazo, pesosEnMensaje } from "./avisos";

export const ESTADO_PRESTAMO_PENDIENTE = "Pendiente";

export const ESTADO_PRESTAMO_PAGADO = "Pagado";

export const NOMBRE_PROFESOR_DESCONOCIDO = "Profesor seleccionado";

export const normalizarListaPrestamos = (data) => (Array.isArray(data) ? data : []);

export const construirParametrosPrestamos = (profesorId) => ({
    profesor_id: profesorId,
});

export const obtenerNombreProfesor = (profesores, id) => {
    const profesor = profesores.find((prof) => String(prof.id) === String(id));
    if (!profesor) {
        return NOMBRE_PROFESOR_DESCONOCIDO;
    }
    return `${profesor.apellido} ${profesor.nombre}`;
};

// La fecha de Colombia. Antes era la UTC, que desde las 7 p. m. daba la de
// mañana; se conservo asi durante la modularizacion y se corrigio a proposito
// el 2026-09-30 (ver utils/fechaColombia.js).
export const fechaPrestamoPorDefecto = (ahora) => fechaIsoColombia(ahora);

export const validarPrestamo = ({ profesorId, monto }) => {
    if (!profesorId) {
        return "Por favor, selecciona un profesor o trabajador.";
    }

    if (!Number.isFinite(monto) || monto <= 0) {
        return "El monto del préstamo debe ser mayor que 0.";
    }

    return null;
};

export const construirPayloadPrestamo = ({ profesorId, monto, fecha, notas }) => ({
    profesor_id: parseInt(profesorId),
    monto,
    fecha,
    estado: ESTADO_PRESTAMO_PENDIENTE,
    notas: primeraMayuscula(notas),
});

// La pregunta va en el título de la ventana; este es el cuerpo.
export const mensajeConfirmacionPrestamo = ({ nombreProfesor, monto, fecha }) =>
    `Profesor o trabajador: ${nombreProfesor}\nMonto: ${pesosEnMensaje(monto)}\nFecha: ${fecha}\n\nUna vez creado no se puede eliminar; solo se podrá saldar.`;

export const mensajeExitoPrestamo = ({ nombreProfesor, monto, fecha }) =>
    `Préstamo de ${pesosEnMensaje(monto)} a ${nombreProfesor}, con fecha ${fecha}.\nQuedó como Pendiente en su historial.`;

// Saldar solo cambia el estado: no hay vuelta atrás (el backend solo acepta
// Pagado) y la nómina deja de descontarlo.
export const mensajeConfirmacionSaldar = (prestamo) =>
    `Préstamo de ${pesosEnMensaje(prestamo.monto)} a ${prestamo.profesor_nombre}, del ${prestamo.fecha}.\n\nQuedará como Pagado y ya no se descontará en la nómina. No se puede deshacer.`;

export const mensajeExitoSaldar = (prestamo) =>
    `El préstamo de ${pesosEnMensaje(prestamo.monto)} a ${prestamo.profesor_nombre} quedó como Pagado.`;

const TEXTO_SIN_RESPUESTA =
    "Se perdió la comunicación con el servidor antes de recibir su respuesta.";

export const avisoErrorCrearPrestamo = (error) => {
    if (esRespuestaIncierta(error)) {
        return {
            incierto: true,
            titulo: "No sabemos si el préstamo quedó registrado",
            texto: `${TEXTO_SIN_RESPUESTA}\n\nAbajo ves el historial de esa persona: revisa si el préstamo ya aparece antes de intentarlo de nuevo.`,
        };
    }
    const explicacion = explicacionDelRechazo(error);
    return {
        incierto: false,
        titulo: "No se registró el préstamo",
        texto: explicacion
            ? `${explicacion}\n\nNo se guardó nada.`
            : "El servidor no pudo registrar el préstamo. No se guardó nada; puedes intentarlo de nuevo.",
    };
};

export const avisoErrorSaldar = (error) => {
    if (esRespuestaIncierta(error)) {
        return {
            incierto: true,
            titulo: "No sabemos si el préstamo quedó saldado",
            texto: `${TEXTO_SIN_RESPUESTA}\n\nRecargamos el historial: revisa si ya aparece como Pagado.`,
        };
    }
    const explicacion = explicacionDelRechazo(error);
    return {
        incierto: false,
        titulo: "No se saldó el préstamo",
        texto: explicacion
            ? `${explicacion}\n\nNo cambió nada.`
            : "El servidor no pudo saldar el préstamo. No cambió nada; puedes intentarlo de nuevo.",
    };
};

export const puedeSaldarPrestamo = (prestamo) =>
    prestamo.estado === ESTADO_PRESTAMO_PENDIENTE;

export const claseEstadoPrestamo = (estado) =>
    estado === ESTADO_PRESTAMO_PENDIENTE
        ? "bg-yellow-100 text-yellow-800"
        : "bg-green-100 text-green-800";

export const totalPrestamosPendientes = (prestamos) =>
    prestamos
        .filter((prestamo) => prestamo.estado === ESTADO_PRESTAMO_PENDIENTE)
        .reduce((acc, prestamo) => acc + prestamo.monto, 0);
