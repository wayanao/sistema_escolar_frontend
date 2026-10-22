import { describe, expect, it } from "vitest";
import {
    calcularPromedioEstudiante,
    calcularPromedioValoraciones,
    calcularPromedioNotas,
    claveNota,
    construirPayloadNota,
    esColumnaInterna,
    formatearEtiquetaColumna,
    hayCambioDeNota,
    normalizarEstudiantesPlanilla,
    normalizarNumeroNota,
    obtenerColumnasVisibles,
    obtenerNotasVisibles,
    redondearNota,
} from "./notas";

describe("contratos puros de la planilla de notas", () => {
    it("reconoce la columna interna reservada sin importar mayúsculas o espacios", () => {
        expect(esColumnaInterna("mas_alto")).toBe(true);
        expect(esColumnaInterna(" Mas_Alto ")).toBe(true);
        expect(esColumnaInterna("quiz")).toBe(false);
        expect(esColumnaInterna("")).toBe(false);
    });

    it("filtra la columna interna conservando el orden de las demás", () => {
        expect(obtenerColumnasVisibles(["quiz", "mas_alto", "trabajo grupal"])).toEqual([
            "quiz",
            "trabajo grupal",
        ]);
        expect(obtenerColumnasVisibles(null)).toEqual([]);
        expect(obtenerColumnasVisibles(undefined)).toEqual([]);
    });

    it("formatea etiquetas de columna: vacío, reservada, separadores y espacios múltiples", () => {
        expect(formatearEtiquetaColumna("")).toBe("");
        expect(formatearEtiquetaColumna(null)).toBe("");
        expect(formatearEtiquetaColumna("MAS_ALTO")).toBe("Más alto");
        expect(formatearEtiquetaColumna("trabajo_en-equipo")).toBe("Trabajo En Equipo");
        expect(formatearEtiquetaColumna("  quiz   final  ")).toBe("Quiz Final");
        expect(formatearEtiquetaColumna("quiz")).toBe("Quiz");
    });

    it("conserva únicamente las notas de las columnas visibles presentes en el objeto", () => {
        expect(obtenerNotasVisibles({ quiz: 4, mas_alto: 4.5 }, ["quiz", "trabajo grupal"])).toEqual({
            quiz: 4,
        });
        expect(obtenerNotasVisibles({ quiz: 4 }, [])).toEqual({});
        expect(obtenerNotasVisibles(null, ["quiz"])).toEqual({});
    });

    it("calcula el promedio ignorando valores vacíos, nulos o no numéricos", () => {
        expect(calcularPromedioNotas({ quiz: 4, taller: 3 }, ["quiz", "taller"])).toBe("3.50");
        expect(calcularPromedioNotas({ quiz: 2 }, ["quiz", "taller"])).toBe("2.00");
        expect(calcularPromedioNotas({ quiz: "", taller: null }, ["quiz", "taller"])).toBe("");
        expect(calcularPromedioNotas({ quiz: "abc" }, ["quiz"])).toBe("");
        expect(calcularPromedioNotas({ a: 4, b: 2 })).toBe("3.00");
    });

    it("normaliza números con coma decimal y conserva el comportamiento de valores inválidos", () => {
        expect(normalizarNumeroNota("4,5")).toBe(4.5);
        expect(normalizarNumeroNota("5")).toBe(5);
        expect(Number.isNaN(normalizarNumeroNota("abc"))).toBe(true);
    });

    it("normaliza la lista de estudiantes calculando notas visibles y promedio sin mutar la entrada", () => {
        const estudiantes = [
            { estudiante_id: 1, nombre: "Ana", notas: { quiz: 4, taller: 3, mas_alto: 4.5 } },
            { estudiante_id: 2, nombre: "Luis", notas: { quiz: 2 } },
        ];
        const copia = estudiantes.map((est) => ({ ...est, notas: { ...est.notas } }));

        expect(normalizarEstudiantesPlanilla(estudiantes, ["quiz", "taller"])).toEqual([
            {
                estudiante_id: 1,
                nombre: "Ana",
                notas: { quiz: 4, taller: 3 },
                promedio: "3.50",
            },
            {
                estudiante_id: 2,
                nombre: "Luis",
                notas: { quiz: 2 },
                promedio: "2.00",
            },
        ]);
        expect(estudiantes).toEqual(copia);
        expect(normalizarEstudiantesPlanilla(null, ["quiz"])).toEqual([]);
    });

    it("construye el payload de nota con las conversiones numéricas y los valores por defecto del backend", () => {
        expect(construirPayloadNota({
            estudianteId: 501,
            asignacionId: "88",
            periodo: "3",
            descripcion: "quiz",
            tipoEvaluacion: "numerica",
            nota: 5,
        })).toEqual({
            estudiante_id: 501,
            asignacion_id: 88,
            nota: 5,
            descripcion: "quiz",
            periodo: 3,
            tipo_evaluacion: "numerica",
            valoracion: null,
        });

        expect(construirPayloadNota({
            estudianteId: 501,
            asignacionId: "88",
            periodo: "3",
            descripcion: "quiz",
            tipoEvaluacion: "desarrollo",
            valoracion: "logrado",
        })).toEqual({
            estudiante_id: 501,
            asignacion_id: 88,
            nota: null,
            descripcion: "quiz",
            periodo: 3,
            tipo_evaluacion: "desarrollo",
            valoracion: "logrado",
        });
    });
});

describe("promedio de la planilla en modo carita", () => {
    const columnas = ["quiz", "taller"];

    it("promedia las caritas visibles por su equivalencia numerica", () => {
        expect(
            calcularPromedioValoraciones(
                { quiz: "destacado", taller: "logrado" },
                columnas,
            ),
        ).toBe("4.50");
    });

    it("ignora columnas que no estan visibles", () => {
        expect(
            calcularPromedioValoraciones(
                { quiz: "destacado", oculta: "apoyo" },
                columnas,
            ),
        ).toBe("5.00");
    });

    it("devuelve cadena vacia cuando no hay ninguna carita puesta", () => {
        expect(calcularPromedioValoraciones({}, columnas)).toBe("");
        expect(calcularPromedioValoraciones({ quiz: "" }, columnas)).toBe("");
        expect(calcularPromedioValoraciones(undefined, columnas)).toBe("");
    });

    it("prefiere las caritas cuando el estudiante las tiene", () => {
        expect(
            calcularPromedioEstudiante(
                { valoraciones: { quiz: "logrado" }, notas: {} },
                columnas,
            ),
        ).toBe("4.00");
    });

    it("cae al promedio numerico cuando no hay caritas", () => {
        expect(
            calcularPromedioEstudiante(
                { valoraciones: {}, notas: { quiz: 3, taller: 4 } },
                columnas,
            ),
        ).toBe("3.50");
    });

    it("no rompe con un estudiante sin ninguno de los dos", () => {
        expect(calcularPromedioEstudiante({}, columnas)).toBe("");
    });
});

describe("hayCambioDeNota", () => {
    it("no ve cambio cuando es la misma nota escrita de otra forma", () => {
        expect(hayCambioDeNota("4", 4)).toBe(false);
        expect(hayCambioDeNota("4.0", 4)).toBe(false);
        expect(hayCambioDeNota("4.00", 4)).toBe(false);
        expect(hayCambioDeNota("4,0", 4)).toBe(false);
        expect(hayCambioDeNota("  4  ", 4)).toBe(false);
    });

    it("no ve cambio mas alla de los dos decimales que guarda la base", () => {
        expect(hayCambioDeNota("4.567", 4.57)).toBe(false);
    });

    it("ve cambio cuando la nota es otra", () => {
        expect(hayCambioDeNota("5", 4)).toBe(true);
        expect(hayCambioDeNota("4.5", 4)).toBe(true);
    });

    it("trata la celda vacia y la celda sin nota como lo mismo", () => {
        expect(hayCambioDeNota("", null)).toBe(false);
        expect(hayCambioDeNota("", undefined)).toBe(false);
        expect(hayCambioDeNota("   ", null)).toBe(false);
    });

    it("ve cambio al borrar una nota y al escribir la primera", () => {
        expect(hayCambioDeNota("", 4)).toBe(true);
        expect(hayCambioDeNota("4", null)).toBe(true);
    });

    it("deja pasar lo que no es un numero para que lo rechace la validacion", () => {
        expect(hayCambioDeNota("nueve", 4)).toBe(true);
    });

    it("compara las caritas por su valor exacto", () => {
        expect(hayCambioDeNota("logrado", "logrado", "desarrollo")).toBe(false);
        expect(hayCambioDeNota("destacado", "logrado", "desarrollo")).toBe(true);
        expect(hayCambioDeNota("logrado", undefined, "desarrollo")).toBe(true);
    });
});

describe("redondearNota y claveNota", () => {
    it("recorta la nota a los dos decimales de la base", () => {
        expect(redondearNota("4.567")).toBe(4.57);
        expect(redondearNota("4,5")).toBe(4.5);
        expect(redondearNota(3)).toBe(3);
    });

    it("da una clave distinta por estudiante y por columna", () => {
        expect(claveNota(501, "quiz")).toBe(claveNota("501", "quiz"));
        expect(claveNota(501, "quiz")).not.toBe(claveNota(502, "quiz"));
        expect(claveNota(501, "quiz")).not.toBe(claveNota(501, "taller"));
    });
});

// Porcentajes por tipo de nota, paso B1: el promedio que ve hoy el profesor.
// Sin porcentajes activos tiene que seguir dando esto (QB4 en
// docs/funcionalidades/SUBNOTAS_PLANILLA.md del backend). `toFixed` sube los
// empates exactos: 3.625 se ve 3.63, aunque el promedio que calcula el
// servidor para la planilla (y que esta pantalla no usa) diga 3.62.
describe("promedio de la planilla sin porcentajes (caracterización de B1)", () => {
    const columnas = ["Cognitivo", "Procedimental"];

    it("sube los empates exactos al mostrar dos decimales", () => {
        expect(
            calcularPromedioEstudiante({ notas: { Cognitivo: 3.25, Procedimental: 4 } }, columnas),
        ).toBe("3.63");
        expect(
            calcularPromedioEstudiante({ notas: { Cognitivo: 4, Procedimental: 4.25 } }, columnas),
        ).toBe("4.13");
    });

    it("no cuenta la columna interna mas_alto", () => {
        const visibles = obtenerColumnasVisibles(["Cognitivo", "mas_alto"]);
        const [estudiante] = normalizarEstudiantesPlanilla(
            [{ notas: { Cognitivo: 3, mas_alto: 5 } }],
            visibles,
        );

        expect(estudiante.promedio).toBe("3.00");
    });
});
