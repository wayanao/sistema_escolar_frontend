import { describe, expect, it } from "vitest";
import {
    CONFIG_DEFAULT,
    agregarCursosFaltantes,
    calcularResumenEstados,
    crearAsignacionCurso,
    crearConfiguracionDesdeDetalle,
    crearPayloadConfiguracion,
    crearPayloadCursos,
    crearPayloadTipoPago,
    crearCursosAsignadosDesdeDetalle,
    esRangoMesesValido,
    evaluarEstadoCartera,
    filtrarTiposPagoPorEstado,
    obtenerCursosDisponibles,
    obtenerMensajeConceptosVacios,
    normalizarMesFinal,
    quitarCursoAsignado,
    resumirAsignacionCursos,
    toggleCursoAsignado,
    actualizarValorCursoAsignado,
} from "./tiposPago";

const cursos = [
    { id: 10, nombre: "5A", estado: "activo" },
    { id: 20, nombre: "6B", estado: "activo" },
    { id: 30, nombre: "7A", estado: "inactivo" },
];

const asignados = [
    { curso_id: 10, curso_nombre: "5A", valor: 350000, activo: true },
];

describe("utilidades puras de tipos de pago", () => {
    it("conserva el estado inicial del formulario financiero", () => {
        expect(CONFIG_DEFAULT).toEqual({
            descripcion: "",
            tipo_cobro: "unico",
            fecha_limite: "",
            dia_limite_mes: "",
            dias_gracia: 0,
            mora_tipo: "",
            mora_valor: 0,
            mes_inicial: "",
            mes_final: 12,
            frecuencia_meses: 1,
            generacion_automatica: false,
            activo: true,
        });
    });

    it("explica por qué un concepto está publicado o en borrador", () => {
        expect(
            evaluarEstadoCartera({ activo: true, tipo_cobro: "mensual", cursos: asignados })
        ).toEqual({ publicado: true, razones: [] });
        expect(
            evaluarEstadoCartera({ activo: false, tipo_cobro: "opcional", cursos: [] })
        ).toEqual({
            publicado: false,
            razones: [
                "está inactivo",
                "es opcional (se cobra solo bajo demanda)",
                "no tiene cursos asignados",
            ],
        });
    });

    it("normaliza el detalle remoto para los formularios locales", () => {
        const detalle = {
            descripcion: null,
            tipo_cobro: null,
            fecha_limite: null,
            dia_limite_mes: null,
            dias_gracia: null,
            mora_tipo: null,
            mora_valor: null,
            mes_inicial: null,
            mes_final: null,
            frecuencia_meses: null,
            generacion_automatica: 1,
            activo: false,
            cursos: [
                { curso_id: 10, curso_nombre: "5A", valor: null, activo: false },
            ],
        };

        expect(crearConfiguracionDesdeDetalle(detalle)).toEqual({
            ...CONFIG_DEFAULT,
            generacion_automatica: true,
            activo: false,
        });
        expect(crearCursosAsignadosDesdeDetalle(detalle)).toEqual([
            { curso_id: 10, curso_nombre: "5A", valor: 0, activo: false },
        ]);
    });

    it("guarda el nombre del tipo de pago con la primera letra en mayúscula", () => {
        // Pedido del usuario el 2026-11-05. El resto queda como se escribió.
        expect(crearPayloadTipoPago("  pensión mensual ", "100").nombre).toBe("Pensión mensual");
        expect(crearPayloadTipoPago("derechos ICFES", "100").nombre).toBe("Derechos ICFES");
    });

    it("construye los payloads existentes sin reinterpretar el backend", () => {
        expect(crearPayloadTipoPago("  Transporte  ", "125000.50")).toEqual({
            nombre: "Transporte",
            valor: 125000.5,
        });
        expect(
            crearPayloadConfiguracion({
                ...CONFIG_DEFAULT,
                descripcion: "  Cobro ordinario  ",
                dia_limite_mes: "10",
                dias_gracia: "3",
                mora_tipo: "porcentaje",
                mora_valor: "2.5",
                mes_inicial: "2",
                mes_final: "11",
                frecuencia_meses: "2",
                generacion_automatica: 1,
            })
        ).toEqual({
            descripcion: "Cobro ordinario",
            tipo_cobro: "unico",
            fecha_limite: null,
            dia_limite_mes: 10,
            dias_gracia: 3,
            mora_tipo: "porcentaje",
            mora_valor: 2.5,
            mes_inicial: 2,
            mes_final: 11,
            frecuencia_meses: 2,
            generacion_automatica: true,
            activo: true,
        });
        expect(crearPayloadCursos(asignados)).toEqual({
            cursos: [{ curso_id: 10, valor: 350000, activo: true }],
        });
    });

    it("normaliza diciembre por compatibilidad y evita rangos mensuales invertidos", () => {
        expect(normalizarMesFinal(null)).toBe(12);
        expect(normalizarMesFinal("8")).toBe(8);
        expect(esRangoMesesValido({
            tipo_cobro: "mensual",
            mes_inicial: "10",
            mes_final: "9",
        })).toBe(false);
        expect(esRangoMesesValido({
            tipo_cobro: "mensual",
            mes_inicial: "",
            mes_final: "11",
        })).toBe(true);
        expect(esRangoMesesValido({
            tipo_cobro: "mensual",
            mes_inicial: "13",
            mes_final: "12",
        })).toBe(false);
        expect(esRangoMesesValido({
            tipo_cobro: "anual",
            mes_inicial: "10",
            mes_final: "9",
        })).toBe(true);
    });

    it("filtra conceptos y calcula los contadores de estado", () => {
        const tipos = [
            { id: 1, activo: true },
            { id: 2 },
            { id: 3, activo: false },
        ];

        expect(calcularResumenEstados(tipos)).toEqual({ activo: 2, inactivo: 1, todos: 3 });
        expect(filtrarTiposPagoPorEstado(tipos, "activo")).toEqual([tipos[0], tipos[1]]);
        expect(filtrarTiposPagoPorEstado(tipos, "inactivo")).toEqual([tipos[2]]);
        expect(filtrarTiposPagoPorEstado(tipos, "todos")).toEqual(tipos);
        expect(obtenerMensajeConceptosVacios("inactivo")).toBe("No hay conceptos inactivos.");
    });

    it("transforma asignaciones de cursos sin mutar las colecciones", () => {
        expect(obtenerCursosDisponibles(cursos, asignados)).toEqual([cursos[1], cursos[2]]);
        expect(crearAsignacionCurso(cursos[1], "", 350000)).toEqual({
            curso_id: 20,
            curso_nombre: "6B",
            valor: 350000,
            activo: true,
        });
        expect(agregarCursosFaltantes(asignados, cursos, 350000)).toEqual([
            ...asignados,
            { curso_id: 20, curso_nombre: "6B", valor: 350000, activo: true },
            { curso_id: 30, curso_nombre: "7A", valor: 350000, activo: true },
        ]);
        expect(actualizarValorCursoAsignado(asignados, 10, "420000")[0].valor).toBe(420000);
        expect(toggleCursoAsignado(asignados, 10)[0].activo).toBe(false);
        expect(quitarCursoAsignado(asignados, 10)).toEqual([]);
        expect(asignados[0]).toEqual({
            curso_id: 10,
            curso_nombre: "5A",
            valor: 350000,
            activo: true,
        });
    });

    it("resume únicamente cursos activos para los indicadores", () => {
        expect(resumirAsignacionCursos(cursos, asignados)).toEqual({
            cursosActivos: cursos.slice(0, 2),
            cursosAsignadosActivos: 1,
            totalCursosActivos: 2,
            cursosPendientes: 1,
        });
    });
});
