import { describe, expect, it } from "vitest";
import {
    CATEGORIAS_EGRESO,
    CATEGORIA_EGRESO_INICIAL,
    construirParametrosEgresos,
    formularioDesdeEgreso,
    mensajeConfirmacionEgreso,
    mensajeErrorGuardarEgreso,
    normalizarEgreso,
    normalizarListaEgresos,
    obtenerFechaLocal,
    puedeEditarEgreso,
    rangoDeFechasInvertido,
    totalEgresos,
    validarEgreso,
} from "./egresos";

const formulario = {
    concepto: "  Aseo general  ",
    monto: "80000",
    fecha: "2026-08-01",
    categoria: "Mantenimiento",
    notas: "  Factura 12  ",
};

describe("utilidades de egresos", () => {
    it("conserva las cuatro categorías y la inicial del formulario", () => {
        expect(CATEGORIAS_EGRESO).toEqual([
            "Compras Institucionales",
            "Pago de Servicios",
            "Mantenimiento",
            "Otros",
        ]);
        expect(CATEGORIA_EGRESO_INICIAL).toBe("Compras Institucionales");
    });

    it("obtiene la fecha local compensando el desfase horario", () => {
        const fecha = {
            getTime: () => Date.parse("2026-08-05T02:30:00.000Z"),
            getTimezoneOffset: () => 300,
        };

        expect(obtenerFechaLocal(fecha)).toBe("2026-08-04");
    });

    it("protege la lista contra respuestas que no son arreglos", () => {
        expect(normalizarListaEgresos([{ id: 1 }])).toEqual([{ id: 1 }]);
        expect(normalizarListaEgresos(null)).toEqual([]);
        expect(normalizarListaEgresos({ detail: "error" })).toEqual([]);
    });

    it("construye los parámetros del rango consultado", () => {
        expect(construirParametrosEgresos("2026-08-01", "2026-08-10")).toEqual({
            fecha_desde: "2026-08-01",
            fecha_hasta: "2026-08-10",
        });
    });

    it("solo considera invertido un rango con las dos fechas presentes", () => {
        expect(rangoDeFechasInvertido("2026-08-10", "2026-08-01")).toBe(true);
        expect(rangoDeFechasInvertido("2026-08-01", "2026-08-10")).toBe(false);
        expect(rangoDeFechasInvertido("2026-08-01", "2026-08-01")).toBe(false);
        expect(rangoDeFechasInvertido("", "2026-08-01")).toBe(false);
        expect(rangoDeFechasInvertido("2026-08-10", "")).toBe(false);
    });

    it("solo permite editar egresos manuales y editables", () => {
        expect(puedeEditarEgreso({ origen: "manual", editable: true })).toBe(true);
        expect(puedeEditarEgreso({ origen: "manual" })).toBe(true);
        expect(puedeEditarEgreso({ origen: "manual", editable: false })).toBe(false);
        expect(puedeEditarEgreso({ origen: "nomina", editable: true })).toBe(false);
    });

    it("carga el formulario desde un egreso recortando la parte horaria", () => {
        expect(
            formularioDesdeEgreso({
                concepto: "Papelería",
                monto: 150.5,
                fecha: "2026-08-05T00:00:00",
                categoria: "Compras Institucionales",
                notas: "Factura 12",
            })
        ).toEqual({
            concepto: "Papelería",
            monto: "150.5",
            fecha: "2026-08-05",
            categoria: "Compras Institucionales",
            notas: "Factura 12",
        });
    });

    it("respalda con Otros y con cadenas vacías los campos ausentes del egreso", () => {
        expect(formularioDesdeEgreso({})).toEqual({
            concepto: "",
            monto: "",
            fecha: "",
            categoria: "Otros",
            notas: "",
        });
    });

    it("normaliza el formulario recortando textos y convirtiendo el monto", () => {
        expect(normalizarEgreso(formulario, "2026-08-07")).toEqual({
            concepto: "Aseo general",
            monto: 80000,
            fecha: "2026-08-01",
            categoria: "Mantenimiento",
            notas: "Factura 12",
        });
    });

    it("sustituye una fecha vacía por la fecha por defecto", () => {
        expect(normalizarEgreso({ ...formulario, fecha: "" }, "2026-08-07").fecha).toBe(
            "2026-08-07"
        );
    });

    it("valida concepto, monto y categoría en ese orden", () => {
        const valido = normalizarEgreso(formulario, "2026-08-07");

        expect(validarEgreso({ ...valido, concepto: "", monto: 0 })).toBe(
            "Debes escribir el concepto del egreso."
        );
        expect(validarEgreso({ ...valido, monto: 0 })).toBe(
            "El monto del egreso debe ser mayor que 0."
        );
        expect(validarEgreso({ ...valido, monto: Number("abc") })).toBe(
            "El monto del egreso debe ser mayor que 0."
        );
        expect(validarEgreso({ ...valido, categoria: "" })).toBe(
            "Debes seleccionar una categoría."
        );
        expect(validarEgreso(valido)).toBeNull();
    });

    it("cambia solo el verbo entre registrar y actualizar en la confirmación", () => {
        const egreso = normalizarEgreso(formulario, "2026-08-07");
        const montoEsperado = (80000).toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        expect(mensajeConfirmacionEgreso(egreso, false)).toBe(
            `¿Seguro que deseas registrar este egreso?\n\nConcepto: Aseo general\nMonto: $${montoEsperado}\nFecha: 2026-08-01\nCategoría: Mantenimiento`
        );
        expect(mensajeConfirmacionEgreso(egreso, true)).toContain(
            "¿Seguro que deseas actualizar este egreso?"
        );
    });

    it("suma los montos listados tratando los ausentes como cero", () => {
        expect(totalEgresos([{ monto: 150.5 }, { monto: 1200 }, { monto: null }, {}])).toBe(
            1350.5
        );
        expect(totalEgresos([])).toBe(0);
    });

    it("prefiere el detalle del backend al mensaje genérico", () => {
        expect(
            mensajeErrorGuardarEgreso({ response: { data: { detail: "Concepto duplicado" } } })
        ).toBe("Concepto duplicado");
        expect(mensajeErrorGuardarEgreso(new Error("timeout"))).toBe(
            "No se pudo guardar el egreso."
        );
    });
});
