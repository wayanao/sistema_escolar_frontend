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

// Conserva la fecha UTC que usa hoy el formulario de préstamos.
export const fechaPrestamoPorDefecto = (ahora) => ahora.toISOString().split("T")[0];

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
    notas: notas.trim(),
});

export const mensajeConfirmacionPrestamo = ({ nombreProfesor, monto, fecha }) => {
    const montoFormateado = monto.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `¿Seguro que deseas registrar este préstamo?\n\nProfesor o trabajador: ${nombreProfesor}\nMonto: $${montoFormateado}\nFecha: ${fecha}\n\nUna vez creado no se puede eliminar; solo se podrá saldar.`;
};

export const mensajeConfirmacionEstadoPrestamo = (estado) =>
    `¿Marcar este préstamo como ${estado}?`;

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

export const mensajeErrorCrearPrestamo = (error) =>
    error.response?.data?.detail || "No se pudo registrar el préstamo.";
