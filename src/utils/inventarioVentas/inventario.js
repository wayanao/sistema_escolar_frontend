import { primeraMayuscula } from "../nombres";

export const ESTADO_PRODUCTO_POR_DEFECTO = "activo";

export const ESTADOS_PRODUCTO = [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
];

export const FILTROS_PRODUCTO = [
    ...ESTADOS_PRODUCTO,
    { value: "todos", label: "Todos" },
];

export const FORMULARIO_PRODUCTO_INICIAL = {
    nombre: "",
    costo: "",
    precio_venta: "",
    stock_actual: "",
    estado: "activo",
};

const CLASES_ESTADO_PRODUCTO = {
    activo: "bg-green-100 text-green-800 border-green-200",
    inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

export const estadoDeProducto = (producto) =>
    producto?.estado || ESTADO_PRODUCTO_POR_DEFECTO;

export const estadoLabel = (estado) =>
    ESTADOS_PRODUCTO.find((item) => item.value === estado)?.label || "Activo";

export const claseEstadoProducto = (estado) =>
    CLASES_ESTADO_PRODUCTO[estado] || CLASES_ESTADO_PRODUCTO.activo;

export const STOCK_BAJO = 5;

export const claseStockProducto = (stock) =>
    stock <= STOCK_BAJO
        ? "bg-red-100 text-red-800"
        : "bg-green-100 text-green-800";

export const accionCambioEstado = (nuevoEstado) =>
    nuevoEstado === "activo" ? "reactivar" : "desactivar";

export const formularioProductoCompleto = (formData) =>
    Boolean(formData.nombre) &&
    formData.costo !== "" &&
    formData.precio_venta !== "" &&
    formData.stock_actual !== "";

export const formularioDesdeProducto = (producto) => ({
    nombre: producto.nombre,
    costo: producto.costo,
    precio_venta: producto.precio_venta,
    stock_actual: producto.stock_actual,
    estado: producto.estado || ESTADO_PRODUCTO_POR_DEFECTO,
});

// El nombre se guarda recortado y con la primera letra en mayúscula.
export const construirPayloadProducto = (formData) => ({
    nombre: primeraMayuscula(formData.nombre),
    costo: parseFloat(formData.costo),
    precio_venta: parseFloat(formData.precio_venta),
    stock_actual: parseInt(formData.stock_actual, 10),
    estado: formData.estado,
});

export const esRespuestaExitosa = (status) => status >= 200 && status < 300;

export const coincideConFiltroEstado = (producto, estadoFiltro) =>
    estadoFiltro === "todos" ? true : estadoDeProducto(producto) === estadoFiltro;

export const aplicarEstadoProducto = (
    productos,
    productoId,
    estadoActualizado,
    estadoFiltro
) =>
    productos
        .map((item) =>
            item.id === productoId ? { ...item, estado: estadoActualizado } : item
        )
        .filter((item) => coincideConFiltroEstado(item, estadoFiltro));
