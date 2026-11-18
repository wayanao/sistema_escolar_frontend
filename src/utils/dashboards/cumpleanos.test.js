import { describe, expect, it } from "vitest";
import {
    DIAS_RANGO_CUMPLEANOS,
    PALETAS_GLOBO,
    construirParametrosCumpleanos,
    etiquetaDiaGlobo,
    globoVuela,
    globosDeCumpleanos,
    nombreCompletoEstudiante,
    normalizarCumpleanos,
    obtenerInfoCumpleanos,
    ordenarCumpleanos,
    textoDatosGlobo,
} from "./cumpleanos";

const AHORA = new Date(2026, 7, 7, 9, 30, 0);

describe("construirParametrosCumpleanos", () => {
    it("envía el rango de días tal como lo espera el backend", () => {
        expect(construirParametrosCumpleanos(DIAS_RANGO_CUMPLEANOS)).toEqual({ dias: 7 });
    });
});

describe("normalizarCumpleanos", () => {
    it("conserva los arreglos y descarta cualquier otra forma", () => {
        expect(normalizarCumpleanos([{ id: 1 }])).toEqual([{ id: 1 }]);
        expect(normalizarCumpleanos(null)).toEqual([]);
        expect(normalizarCumpleanos({ id: 1 })).toEqual([]);
        expect(normalizarCumpleanos(undefined)).toEqual([]);
    });
});

describe("nombreCompletoEstudiante", () => {
    it("une nombre y apellido y recorta los faltantes", () => {
        expect(nombreCompletoEstudiante({ nombre: "Ana", apellido: "Arias" })).toBe("Ana Arias");
        expect(nombreCompletoEstudiante({ nombre: "Ana" })).toBe("Ana");
        expect(nombreCompletoEstudiante({ apellido: "Arias" })).toBe("Arias");
    });

    it("usa el respaldo cuando no hay datos", () => {
        expect(nombreCompletoEstudiante({})).toBe("Estudiante");
        expect(nombreCompletoEstudiante(null)).toBe("Estudiante");
    });
});

describe("obtenerInfoCumpleanos", () => {
    it("etiqueta el cumpleaños de hoy con la edad que cumple", () => {
        expect(obtenerInfoCumpleanos("2010-08-07", AHORA)).toEqual({
            dias: 0,
            edad: 16,
            etiqueta: "Hoy",
        });
    });

    it("etiqueta mañana y los días siguientes", () => {
        expect(obtenerInfoCumpleanos("2012-08-08", AHORA).etiqueta).toBe("Mañana");
        expect(obtenerInfoCumpleanos("2015-08-10", AHORA).etiqueta).toBe("En 3 días");
    });

    it("empuja al año siguiente el cumpleaños ya pasado", () => {
        const info = obtenerInfoCumpleanos("2000-08-06", AHORA);

        expect(info.dias).toBe(364);
        expect(info.edad).toBe(27);
    });

    it("acepta la marca de tiempo completa que envía el backend", () => {
        expect(obtenerInfoCumpleanos("2010-08-07T00:00:00", AHORA).dias).toBe(0);
    });

    it("descarta las fechas ausentes o con formato distinto", () => {
        expect(obtenerInfoCumpleanos("", AHORA)).toBeNull();
        expect(obtenerInfoCumpleanos(null, AHORA)).toBeNull();
        expect(obtenerInfoCumpleanos("07/08/2010", AHORA)).toBeNull();
        expect(obtenerInfoCumpleanos("0000-08-07", AHORA)).toBeNull();
    });

    it("omite la edad cuando el año de nacimiento no es anterior", () => {
        expect(obtenerInfoCumpleanos("2026-08-07", AHORA).edad).toBeNull();
    });
});

describe("ordenarCumpleanos", () => {
    it("ordena por días restantes y desempata por nombre completo", () => {
        const estudiantes = [
            { id: 1, nombre: "Zoe", apellido: "Zapata", fecha_nacimiento: "2015-08-10" },
            { id: 2, nombre: "Ana", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
            { id: 3, nombre: "Aldo", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
        ];

        expect(ordenarCumpleanos(estudiantes, AHORA).map((item) => item.id)).toEqual([3, 2, 1]);
    });

    it("coloca al final a quien no tiene fecha utilizable", () => {
        const estudiantes = [
            { id: 1, nombre: "Sin", apellido: "Fecha" },
            { id: 2, nombre: "Ana", apellido: "Arias", fecha_nacimiento: "2000-08-06" },
        ];

        expect(ordenarCumpleanos(estudiantes, AHORA).map((item) => item.id)).toEqual([2, 1]);
    });

    it("no modifica el arreglo recibido", () => {
        const estudiantes = [
            { id: 1, fecha_nacimiento: "2015-08-10" },
            { id: 2, fecha_nacimiento: "2010-08-07" },
        ];

        ordenarCumpleanos(estudiantes, AHORA);

        expect(estudiantes.map((item) => item.id)).toEqual([1, 2]);
    });
});

describe("etiquetaDiaGlobo", () => {
    // AHORA es el viernes 7 de agosto de 2026.
    it("dice Hoy, Mañana o el día con su número", () => {
        expect(etiquetaDiaGlobo({ dias: 0 }, AHORA)).toBe("Hoy");
        expect(etiquetaDiaGlobo({ dias: 1 }, AHORA)).toBe("Mañana");
        expect(etiquetaDiaGlobo({ dias: 3 }, AHORA)).toBe("Lunes 10");
    });

    it("no inventa una etiqueta sin datos", () => {
        expect(etiquetaDiaGlobo(null, AHORA)).toBe("");
    });
});

describe("globoVuela", () => {
    const MIERCOLES = new Date(2026, 10, 11, 9, 0);
    const JUEVES = new Date(2026, 10, 12, 9, 0);
    const VIERNES = new Date(2026, 10, 13, 9, 0);
    const SABADO = new Date(2026, 10, 14, 9, 0);

    it("vuela el día del cumpleaños y el día anterior, para avisar", () => {
        expect(globoVuela({ dias: 0 }, MIERCOLES)).toBe(true);
        expect(globoVuela({ dias: 1 }, MIERCOLES)).toBe(true);
        expect(globoVuela({ dias: 2 }, MIERCOLES)).toBe(false);
        // El jueves todavía no avisa del sábado.
        expect(globoVuela({ dias: 2 }, JUEVES)).toBe(false);
    });

    it("el viernes también vuelan los del sábado, el domingo y el lunes", () => {
        expect(globoVuela({ dias: 1 }, VIERNES)).toBe(true);
        expect(globoVuela({ dias: 2 }, VIERNES)).toBe(true);
        expect(globoVuela({ dias: 3 }, VIERNES)).toBe(true);
        expect(globoVuela({ dias: 4 }, VIERNES)).toBe(false);
    });

    it("el fin de semana sigue la regla del día anterior", () => {
        expect(globoVuela({ dias: 1 }, SABADO)).toBe(true);
        expect(globoVuela({ dias: 2 }, SABADO)).toBe(false);
    });

    it("sin datos no vuela", () => {
        expect(globoVuela(null, MIERCOLES)).toBe(false);
    });
});

describe("globosDeCumpleanos", () => {
    it("arma un globo por estudiante, primero el de hoy, con colores que se turnan", () => {
        const globos = globosDeCumpleanos(
            [
                { id: 1, nombre: "ZOE", apellido: "zapata", curso: "5A", fecha_nacimiento: "2015-08-10" },
                { estudiante_id: 2, nombre: "ana", apellido: "arias", curso: "3B", fecha_nacimiento: "2017-08-07" },
            ],
            AHORA,
        );

        expect(globos).toEqual([
            {
                id: 2,
                nombre: "Ana Arias",
                curso: "3B",
                edad: 9,
                esHoy: true,
                vuela: true,
                etiqueta: "Hoy",
                paleta: PALETAS_GLOBO[0],
            },
            {
                id: 1,
                nombre: "Zoe Zapata",
                curso: "5A",
                edad: 11,
                esHoy: false,
                // AHORA es viernes: el del lunes ya sale a volar para avisar.
                vuela: true,
                etiqueta: "Lunes 10",
                paleta: PALETAS_GLOBO[1],
            },
        ]);
    });

    it("deja fuera a quien no tiene una fecha utilizable y tolera lo que no es lista", () => {
        expect(globosDeCumpleanos([{ id: 3, nombre: "Sin", apellido: "Fecha" }], AHORA)).toEqual([]);
        expect(globosDeCumpleanos(null, AHORA)).toEqual([]);
    });

    it("no usa rosado ni azul: la ficha no dice si es niña o niño", () => {
        PALETAS_GLOBO.forEach((paleta) => {
            expect(["#ec4899", "#f472b6", "#2563eb", "#3b82f6"]).not.toContain(paleta.base);
        });
    });
});

describe("textoDatosGlobo", () => {
    it("une el curso y los años que cumple, lo que haya", () => {
        // «9 años» lleva un espacio que no se parte.
        expect(textoDatosGlobo({ curso: "3B", edad: 9 })).toBe("3B · 9\u00a0años");
        expect(textoDatosGlobo({ curso: "", edad: 9 })).toBe("9\u00a0años");
        expect(textoDatosGlobo({ curso: "3B", edad: null })).toBe("3B");
        expect(textoDatosGlobo(null)).toBe("");
    });
});
