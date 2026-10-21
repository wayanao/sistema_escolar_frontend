import { describe, expect, it } from "vitest";
import {
    avisoErrorGuardarEgreso,
    CATEGORIAS_EGRESO,
    CATEGORIA_EGRESO_INICIAL,
    construirParametrosEgresos,
    formularioDesdeEgreso,
    mensajeConfirmacionEgreso,
    mensajeExitoEgreso,
    normalizarEgreso,
    normalizarListaEgresos,
    obtenerFechaLocal,
    puedeEditarEgreso,
    rangoDeFechasInvertido,
    totalEgresos,
    validarEgreso,
} from "./egresos";

// Así escribe Colombia los pesos en los mensajes: "80.000,00".
const pesos = (valor) =>
    `$${valor.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

    it("resume el egreso antes de confirmarlo (la pregunta va en el título)", () => {
        const egreso = normalizarEgreso(formulario, "2026-08-07");

        expect(mensajeConfirmacionEgreso(egreso)).toBe(
            `Concepto: Aseo general\nMonto: ${pesos(80000)}\nFecha: 2026-08-01\nCategoría: Mantenimiento`
        );
    });

    it("al registrar dice qué quedó, con qué fecha y qué muestra el historial", () => {
        const egreso = normalizarEgreso(formulario, "2026-08-07");

        expect(mensajeExitoEgreso(egreso, false)).toBe(
            `«Aseo general» por ${pesos(80000)} quedó registrado con fecha 2026-08-01.\nAbajo ves los egresos de ese día.`
        );
    });

    it("al actualizar dice cómo quedó el egreso", () => {
        const egreso = normalizarEgreso(formulario, "2026-08-07");

        expect(mensajeExitoEgreso(egreso, true)).toBe(
            `«Aseo general» quedó con ${pesos(80000)}, fecha 2026-08-01 y categoría Mantenimiento.`
        );
    });

    it("suma los montos listados tratando los ausentes como cero", () => {
        expect(totalEgresos([{ monto: 150.5 }, { monto: 1200 }, { monto: null }, {}])).toBe(
            1350.5
        );
        expect(totalEgresos([])).toBe(0);
    });

    it("sin respuesta al registrar no se sabe si quedó: hay que revisar ese día", () => {
        expect(avisoErrorGuardarEgreso(new Error("Network Error"), false)).toEqual({
            incierto: true,
            titulo: "No sabemos si el egreso quedó registrado",
            texto:
                "Se perdió la comunicación con el servidor antes de recibir su respuesta.\n\n" +
                "Abajo ves los egresos de ese día: revisa si ya aparece antes de intentarlo de nuevo.",
        });
    });

    it("sin respuesta al actualizar no se sabe si el cambio quedó", () => {
        expect(avisoErrorGuardarEgreso(new Error("Network Error"), true)).toEqual({
            incierto: true,
            titulo: "No sabemos si el cambio quedó guardado",
            texto:
                "Se perdió la comunicación con el servidor antes de recibir su respuesta.\n\n" +
                "Recargamos el historial: revisa el egreso antes de intentarlo de nuevo.",
        });
    });

    it("un rechazo muestra la explicación del backend y que no se guardó nada", () => {
        expect(
            avisoErrorGuardarEgreso(
                { response: { status: 400, data: { detail: "Concepto duplicado" } } },
                false
            )
        ).toEqual({
            incierto: false,
            titulo: "No se registró el egreso",
            texto: "Concepto duplicado\n\nNo se guardó nada.",
        });
        expect(
            avisoErrorGuardarEgreso({ response: { status: 500, data: { detail: "boom" } } }, true)
        ).toEqual({
            incierto: false,
            titulo: "No se guardaron los cambios",
            texto: "El servidor no pudo guardar el egreso. No se guardó nada; puedes intentarlo de nuevo.",
        });
    });
});
