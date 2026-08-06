import { describe, expect, it } from "vitest";
import {
    agregarProductoAlCarrito,
    calcularTotalVenta,
    cambiarCantidadEnCarrito,
    claseEstadoVenta,
    claseFilaVenta,
    claseTotalVenta,
    construirPayloadAnulacion,
    construirPayloadVenta,
    construirVolanteVenta,
    esVentaAnulada,
    estudianteHistorialId,
    filtrarCatalogoVendible,
    filtrarEstudiantesPorBusqueda,
    filtrarVentasPorEstudiante,
    mensajeErrorAnulacion,
    MOTIVO_ANULACION_MAX,
    nombreClienteVolante,
    nombreCompletoEstudiante,
    puedeAnularVenta,
    removerDelCarrito,
    subtotalItemCarrito,
    validarMotivoAnulacion,
} from "./ventas";

const sudadera = { id: 1, nombre: "Sudadera", stock_actual: 3, precio_venta: 25000 };
const cuaderno = { id: 2, nombre: "Cuaderno", stock_actual: 10, precio_venta: 5000 };

describe("catálogo vendible", () => {
    it("descarta los productos sin existencias", () => {
        const catalogo = filtrarCatalogoVendible([
            sudadera,
            { ...cuaderno, stock_actual: 0 },
            { id: 3, nombre: "Negativo", stock_actual: -2, precio_venta: 100 },
        ]);

        expect(catalogo.map((item) => item.id)).toEqual([1]);
    });
});

describe("carrito", () => {
    it("agrega un producto nuevo con cantidad uno sin mutar el carrito", () => {
        const carrito = [];
        const resultado = agregarProductoAlCarrito(carrito, sudadera);

        expect(resultado.sinStock).toBe(false);
        expect(resultado.carrito).toEqual([{ ...sudadera, cantidad: 1 }]);
        expect(carrito).toHaveLength(0);
    });

    it("incrementa la cantidad mientras haya stock disponible", () => {
        const resultado = agregarProductoAlCarrito(
            [{ ...sudadera, cantidad: 2 }],
            sudadera
        );

        expect(resultado.sinStock).toBe(false);
        expect(resultado.carrito[0].cantidad).toBe(3);
    });

    it("avisa y no modifica el carrito al alcanzar el stock", () => {
        const carrito = [{ ...sudadera, cantidad: 3 }];
        const resultado = agregarProductoAlCarrito(carrito, sudadera);

        expect(resultado.sinStock).toBe(true);
        expect(resultado.carrito).toBe(carrito);
    });

    it("cambia la cantidad solo dentro del rango permitido", () => {
        const carrito = [{ ...sudadera, cantidad: 1 }, { ...cuaderno, cantidad: 4 }];

        expect(cambiarCantidadEnCarrito(carrito, 1, 1)[0].cantidad).toBe(2);
        expect(cambiarCantidadEnCarrito(carrito, 1, -1)[0].cantidad).toBe(1);
        expect(cambiarCantidadEnCarrito(carrito, 2, -1)[1].cantidad).toBe(3);
        expect(cambiarCantidadEnCarrito(carrito, 99, 1)).toEqual(carrito);
    });

    it("no permite superar el stock al incrementar desde el carrito", () => {
        const carrito = [{ ...sudadera, cantidad: 3 }];

        expect(cambiarCantidadEnCarrito(carrito, 1, 1)[0].cantidad).toBe(3);
    });

    it("remueve un producto por identificador", () => {
        const carrito = [{ ...sudadera, cantidad: 1 }, { ...cuaderno, cantidad: 1 }];

        expect(removerDelCarrito(carrito, 1).map((item) => item.id)).toEqual([2]);
    });

    it("calcula subtotales y total", () => {
        const carrito = [{ ...sudadera, cantidad: 2 }, { ...cuaderno, cantidad: 3 }];

        expect(subtotalItemCarrito(carrito[0])).toBe(50000);
        expect(calcularTotalVenta(carrito)).toBe(65000);
        expect(calcularTotalVenta([])).toBe(0);
    });
});

describe("payload de venta", () => {
    it("registra siempre un cargo a crédito con el detalle del carrito", () => {
        const carrito = [{ ...sudadera, cantidad: 2 }, { ...cuaderno, cantidad: 1 }];

        expect(
            construirPayloadVenta({ estudianteId: "7", carrito, notas: "" })
        ).toEqual({
            estudiante_id: 7,
            tipo_venta: "Credito",
            total: 55000,
            notas: "",
            detalles: [
                { inventario_id: 1, cantidad: 2, precio_unitario: 25000, subtotal: 50000 },
                { inventario_id: 2, cantidad: 1, precio_unitario: 5000, subtotal: 5000 },
            ],
        });
    });
});

describe("volante de la última venta", () => {
    it("usa el nombre del estudiante o Desconocido", () => {
        expect(nombreCompletoEstudiante({ nombre: "Ana", apellido: "Pérez" })).toBe(
            "Pérez Ana"
        );
        expect(nombreClienteVolante({ nombre: "Ana", apellido: "Pérez" })).toBe(
            "Pérez Ana"
        );
        expect(nombreClienteVolante(undefined)).toBe("Desconocido");
    });

    it("copia el carrito y marca la condición como cargo pendiente", () => {
        const carrito = [{ ...sudadera, cantidad: 2 }];
        const volante = construirVolanteVenta({
            ventaId: 901,
            cliente: "Pérez Ana",
            carrito,
            fecha: "20/07/2026",
        });

        expect(volante).toEqual({
            id: 901,
            cliente: "Pérez Ana",
            tipo_venta: "Cargo Pendiente",
            total: 50000,
            detalles: [{ ...sudadera, cantidad: 2 }],
            fecha: "20/07/2026",
        });
        expect(volante.detalles).not.toBe(carrito);
    });
});

describe("búsqueda e historial", () => {
    const estudiantes = [
        { id: 7, nombre: "Ana", apellido: "Pérez" },
        { id: 8, nombre: "Luis", apellido: "Gómez" },
    ];

    it("filtra estudiantes por apellido y nombre sin distinguir mayúsculas", () => {
        expect(filtrarEstudiantesPorBusqueda(estudiantes, "pér").map((e) => e.id)).toEqual([7]);
        expect(filtrarEstudiantesPorBusqueda(estudiantes, "LUIS").map((e) => e.id)).toEqual([8]);
        expect(filtrarEstudiantesPorBusqueda(estudiantes, "")).toHaveLength(2);
    });

    it("prefiere el estudiante escrito sobre el último cargado", () => {
        expect(estudianteHistorialId("8", 7)).toBe(8);
        expect(estudianteHistorialId("", 7)).toBe(7);
        expect(estudianteHistorialId("", null)).toBeNull();
    });

    it("filtra las ventas del estudiante seleccionado", () => {
        const ventas = [
            { id: 501, estudiante_id: 7 },
            { id: 502, estudiante_id: 8 },
        ];

        expect(filtrarVentasPorEstudiante(ventas, 7).map((v) => v.id)).toEqual([501]);
        expect(filtrarVentasPorEstudiante(ventas, null)).toEqual([]);
    });
});

describe("anulación", () => {
    it("solo permite anular ventas vigentes", () => {
        expect(puedeAnularVenta({ id: 1, estado: "Pendiente" })).toBe(true);
        expect(puedeAnularVenta({ id: 1, estado: "Anulada" })).toBe(false);
        expect(puedeAnularVenta(null)).toBe(false);
        expect(esVentaAnulada({ estado: "Anulada" })).toBe(true);
    });

    it("distingue visualmente una venta anulada en fila, estado y total", () => {
        expect(claseFilaVenta("Anulada")).toBe("bg-red-50");
        expect(claseFilaVenta("Pendiente")).toBe("hover:bg-gray-50");
        expect(claseEstadoVenta("Anulada")).toBe("bg-red-100 text-red-800");
        expect(claseEstadoVenta("Pendiente")).toBe("bg-yellow-100 text-yellow-800");
        expect(claseEstadoVenta("Pagada")).toBe("bg-green-100 text-green-800");
        expect(claseTotalVenta("Anulada")).toBe("text-red-600 line-through");
        expect(claseTotalVenta("Pendiente")).toBe("text-red-600");
    });

    it("exige un motivo de al menos cinco caracteres y limita a 300", () => {
        expect(validarMotivoAnulacion("")).toBe(
            "Escribe un motivo de al menos 5 caracteres."
        );
        expect(validarMotivoAnulacion("   abc   ")).toBe(
            "Escribe un motivo de al menos 5 caracteres."
        );
        expect(validarMotivoAnulacion("Error en el cargo")).toBeNull();
        expect(MOTIVO_ANULACION_MAX).toBe(300);
    });

    it("recorta el motivo antes de enviarlo", () => {
        expect(construirPayloadAnulacion("  Cargo equivocado  ")).toEqual({
            motivo: "Cargo equivocado",
        });
    });

    it("prefiere el detalle del backend y si no usa el mensaje genérico", () => {
        expect(
            mensajeErrorAnulacion({ response: { data: { detail: "Ya está anulada" } } })
        ).toBe("Ya está anulada");
        expect(mensajeErrorAnulacion(new Error("network"))).toBe(
            "No se pudo anular la venta."
        );
    });
});
