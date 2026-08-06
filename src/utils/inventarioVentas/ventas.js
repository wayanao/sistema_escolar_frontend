export const TIPO_VENTA_CREDITO = "Credito";

export const CONDICION_VOLANTE = "Cargo Pendiente";

export const ESTADO_VENTA_ANULADA = "Anulada";

export const MOTIVO_ANULACION_MAX = 300;

export const filtrarCatalogoVendible = (inventario) =>
    inventario.filter((item) => item.stock_actual > 0);

export const subtotalItemCarrito = (item) => item.precio_venta * item.cantidad;

export const calcularTotalVenta = (carrito) =>
    carrito.reduce((acc, curr) => acc + curr.precio_venta * curr.cantidad, 0);

export const agregarProductoAlCarrito = (carrito, producto) => {
    const existente = carrito.find((item) => item.id === producto.id);

    if (!existente) {
        return {
            carrito: [...carrito, { ...producto, cantidad: 1 }],
            sinStock: false,
        };
    }

    if (existente.cantidad < producto.stock_actual) {
        return {
            carrito: carrito.map((item) =>
                item.id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ),
            sinStock: false,
        };
    }

    return { carrito, sinStock: true };
};

export const cambiarCantidadEnCarrito = (carrito, id, delta) =>
    carrito.map((item) => {
        if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad > 0 && nuevaCantidad <= item.stock_actual) {
                return { ...item, cantidad: nuevaCantidad };
            }
        }
        return item;
    });

export const removerDelCarrito = (carrito, id) =>
    carrito.filter((item) => item.id !== id);

export const construirPayloadVenta = ({ estudianteId, carrito, notas }) => ({
    estudiante_id: parseInt(estudianteId),
    tipo_venta: TIPO_VENTA_CREDITO,
    total: calcularTotalVenta(carrito),
    notas,
    detalles: carrito.map((item) => ({
        inventario_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_venta,
        subtotal: item.precio_venta * item.cantidad,
    })),
});

export const nombreCompletoEstudiante = (estudiante) =>
    `${estudiante.apellido} ${estudiante.nombre}`;

export const nombreClienteVolante = (estudiante) =>
    estudiante ? nombreCompletoEstudiante(estudiante) : "Desconocido";

export const construirVolanteVenta = ({ ventaId, cliente, carrito, fecha }) => ({
    id: ventaId,
    cliente,
    tipo_venta: CONDICION_VOLANTE,
    total: calcularTotalVenta(carrito),
    detalles: [...carrito],
    fecha,
});

export const filtrarEstudiantesPorBusqueda = (estudiantes, busqueda) =>
    estudiantes.filter((estudiante) =>
        nombreCompletoEstudiante(estudiante)
            .toLowerCase()
            .includes(busqueda.toLowerCase())
    );

export const estudianteHistorialId = (estudianteId, estudianteFiltroId) =>
    estudianteId ? parseInt(estudianteId) : estudianteFiltroId;

export const filtrarVentasPorEstudiante = (ventas, estudianteId) =>
    ventas.filter((venta) => venta.estudiante_id === estudianteId);

export const esVentaAnulada = (venta) => venta?.estado === ESTADO_VENTA_ANULADA;

export const puedeAnularVenta = (venta) => Boolean(venta) && !esVentaAnulada(venta);

export const claseFilaVenta = (estado) =>
    estado === ESTADO_VENTA_ANULADA ? "bg-red-50" : "hover:bg-gray-50";

export const claseEstadoVenta = (estado) => {
    if (estado === ESTADO_VENTA_ANULADA) return "bg-red-100 text-red-800";
    if (estado === "Pendiente") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
};

export const claseTotalVenta = (estado) =>
    estado === ESTADO_VENTA_ANULADA
        ? "text-red-600 line-through"
        : "text-red-600";

export const validarMotivoAnulacion = (valor) => {
    if (!valor || valor.trim().length < 5) {
        return "Escribe un motivo de al menos 5 caracteres.";
    }
    return null;
};

export const construirPayloadAnulacion = (motivo) => ({ motivo: motivo.trim() });

export const mensajeErrorAnulacion = (error) =>
    error?.response?.data?.detail || "No se pudo anular la venta.";
