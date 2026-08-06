import { describe, expect, it } from "vitest";
import {
    accionCambioEstado,
    aplicarEstadoProducto,
    claseEstadoProducto,
    claseStockProducto,
    coincideConFiltroEstado,
    construirPayloadProducto,
    ESTADOS_PRODUCTO,
    esRespuestaExitosa,
    estadoDeProducto,
    estadoLabel,
    FILTROS_PRODUCTO,
    formularioDesdeProducto,
    formularioProductoCompleto,
    FORMULARIO_PRODUCTO_INICIAL,
} from "./inventario";

describe("constantes de inventario", () => {
    it("conserva los estados editables y agrega 'todos' solo como filtro", () => {
        expect(ESTADOS_PRODUCTO.map((item) => item.value)).toEqual([
            "activo",
            "inactivo",
        ]);
        expect(FILTROS_PRODUCTO.map((item) => item.value)).toEqual([
            "activo",
            "inactivo",
            "todos",
        ]);
        expect(FILTROS_PRODUCTO.map((item) => item.label)).toEqual([
            "Activo",
            "Inactivo",
            "Todos",
        ]);
    });

    it("mantiene el formulario inicial vacío y activo", () => {
        expect(FORMULARIO_PRODUCTO_INICIAL).toEqual({
            nombre: "",
            costo: "",
            precio_venta: "",
            stock_actual: "",
            estado: "activo",
        });
    });
});

describe("estado del producto", () => {
    it("trata la ausencia de estado como activo", () => {
        expect(estadoDeProducto({ estado: "inactivo" })).toBe("inactivo");
        expect(estadoDeProducto({})).toBe("activo");
        expect(estadoDeProducto({ estado: "" })).toBe("activo");
    });

    it("etiqueta estados conocidos y cae en Activo ante uno desconocido", () => {
        expect(estadoLabel("activo")).toBe("Activo");
        expect(estadoLabel("inactivo")).toBe("Inactivo");
        expect(estadoLabel("archivado")).toBe("Activo");
    });

    it("resuelve las clases del estado con respaldo en activo", () => {
        expect(claseEstadoProducto("inactivo")).toBe(
            "bg-gray-100 text-gray-700 border-gray-200"
        );
        expect(claseEstadoProducto("desconocido")).toBe(
            "bg-green-100 text-green-800 border-green-200"
        );
    });

    it("marca en rojo el stock igual o menor a cinco unidades", () => {
        expect(claseStockProducto(5)).toBe("bg-red-100 text-red-800");
        expect(claseStockProducto(0)).toBe("bg-red-100 text-red-800");
        expect(claseStockProducto(6)).toBe("bg-green-100 text-green-800");
    });

    it("nombra la acción de confirmación según el estado destino", () => {
        expect(accionCambioEstado("activo")).toBe("reactivar");
        expect(accionCambioEstado("inactivo")).toBe("desactivar");
    });
});

describe("formulario de producto", () => {
    it("exige los cuatro campos y admite el valor cero", () => {
        const completo = {
            nombre: "Sudadera",
            costo: "0",
            precio_venta: "0",
            stock_actual: "0",
            estado: "activo",
        };
        expect(formularioProductoCompleto(completo)).toBe(true);
        expect(formularioProductoCompleto({ ...completo, nombre: "" })).toBe(false);
        expect(formularioProductoCompleto({ ...completo, costo: "" })).toBe(false);
        expect(formularioProductoCompleto({ ...completo, precio_venta: "" })).toBe(false);
        expect(formularioProductoCompleto({ ...completo, stock_actual: "" })).toBe(false);
    });

    it("carga un producto existente conservando su estado", () => {
        expect(
            formularioDesdeProducto({
                id: 1,
                nombre: "Sudadera",
                costo: 30000,
                precio_venta: 50000,
                stock_actual: 12,
                utilidad_unitaria: 20000,
            })
        ).toEqual({
            nombre: "Sudadera",
            costo: 30000,
            precio_venta: 50000,
            stock_actual: 12,
            estado: "activo",
        });
    });

    it("convierte costo y precio a decimal y el stock a entero", () => {
        expect(
            construirPayloadProducto({
                nombre: "Kit de útiles",
                costo: "15000.50",
                precio_venta: "25000.75",
                stock_actual: "20",
                estado: "inactivo",
            })
        ).toEqual({
            nombre: "Kit de útiles",
            costo: 15000.5,
            precio_venta: 25000.75,
            stock_actual: 20,
            estado: "inactivo",
        });
    });
});

describe("respuesta HTTP", () => {
    it("acepta únicamente el rango 2xx", () => {
        expect(esRespuestaExitosa(200)).toBe(true);
        expect(esRespuestaExitosa(299)).toBe(true);
        expect(esRespuestaExitosa(199)).toBe(false);
        expect(esRespuestaExitosa(300)).toBe(false);
        expect(esRespuestaExitosa(404)).toBe(false);
    });
});

describe("filtro y actualización local del listado", () => {
    const productos = [
        { id: 1, nombre: "Sudadera", estado: "activo" },
        { id: 2, nombre: "Cuaderno", estado: "activo" },
        { id: 3, nombre: "Camiseta" },
    ];

    it("acepta todo con el filtro 'todos' y compara el estado en los demás", () => {
        expect(coincideConFiltroEstado({ estado: "inactivo" }, "todos")).toBe(true);
        expect(coincideConFiltroEstado({ estado: "inactivo" }, "activo")).toBe(false);
        expect(coincideConFiltroEstado({}, "activo")).toBe(true);
    });

    it("retira el producto de la lista cuando deja de cumplir el filtro", () => {
        const resultado = aplicarEstadoProducto(productos, 1, "inactivo", "activo");

        expect(resultado.map((item) => item.id)).toEqual([2, 3]);
        expect(productos[0].estado).toBe("activo");
    });

    it("conserva el producto actualizado cuando el filtro es 'todos'", () => {
        const resultado = aplicarEstadoProducto(productos, 1, "inactivo", "todos");

        expect(resultado).toHaveLength(3);
        expect(resultado[0]).toEqual({
            id: 1,
            nombre: "Sudadera",
            estado: "inactivo",
        });
    });
});
