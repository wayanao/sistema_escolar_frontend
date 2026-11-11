import { describe, expect, it } from "vitest";
import {
    ACCESOS_ADMIN,
    VALOR_OCULTO,
    capitalizarInicial,
    composicionDeuda,
    detalleDeudor,
    deudaPorCurso,
    esAdmin,
    esTeclaDeActivacion,
    formatearMoneda,
    hayMoraEnCartera,
    inicialesDe,
    mayoresDeudores,
    montoVisible,
    primerNombreAdmin,
    textoEstudiantes,
    textoResumenMora,
} from "./admin";

describe("ACCESOS_ADMIN", () => {
    it("conserva los cuatro accesos con sus rutas y su orden", () => {
        expect(ACCESOS_ADMIN.map((acceso) => [acceso.title, acceso.path])).toEqual([
            ["Gestión de Pagos", "/admin/pagos"],
            ["Gestión de Estudiantes", "/admin/estudiantes"],
            ["Gestión Académica", "/admin"],
            ["Reportes", "/admin/reportes"],
        ]);
    });
});

describe("formatearMoneda", () => {
    it("usa pesos colombianos sin decimales", () => {
        expect(formatearMoneda(1250000)).toContain("1.250.000");
        expect(formatearMoneda(1250000)).not.toContain(",00");
    });

    it("trata los valores ausentes como cero", () => {
        expect(formatearMoneda(null)).toContain("0");
        expect(formatearMoneda(undefined)).toContain("0");
        expect(formatearMoneda("")).toContain("0");
    });
});

describe("capitalizarInicial", () => {
    it("sube la inicial y conserva el resto tal cual", () => {
        expect(capitalizarInicial("carlos")).toBe("Carlos");
        expect(capitalizarInicial("cARLOS")).toBe("CARLOS");
        expect(capitalizarInicial("  ana  ")).toBe("Ana");
    });

    it("devuelve una cadena vacía cuando no hay texto", () => {
        expect(capitalizarInicial("")).toBe("");
        expect(capitalizarInicial(null)).toBe("");
        expect(capitalizarInicial("   ")).toBe("");
    });
});

describe("primerNombreAdmin", () => {
    it("toma solo el primer nombre", () => {
        expect(primerNombreAdmin("carlos andrés gómez")).toBe("Carlos");
    });

    it("usa el respaldo cuando no hay nombre", () => {
        expect(primerNombreAdmin("")).toBe("Admin");
        expect(primerNombreAdmin(null)).toBe("Admin");
    });
});

describe("esAdmin", () => {
    it("solo acepta al usuario con rol admin", () => {
        expect(esAdmin({ rol: "admin" })).toBe(true);
        expect(esAdmin({ rol: "profesor" })).toBe(false);
        expect(esAdmin({})).toBe(false);
        expect(esAdmin(null)).toBe(false);
    });
});

describe("hayMoraEnCartera", () => {
    it("solo hay mora cuando el resumen trae estudiantes", () => {
        expect(hayMoraEnCartera({ total_estudiantes: 3 })).toBe(true);
        expect(hayMoraEnCartera({ total_estudiantes: 0 })).toBe(false);
        expect(hayMoraEnCartera(null)).toBe(false);
    });
});

describe("textoResumenMora", () => {
    it("describe el conteo y el monto en mora", () => {
        const texto = textoResumenMora({ total_estudiantes: 3, total_mora: 80000 });

        expect(texto).toContain("3 estudiantes en mora · Mora:");
        expect(texto).toContain("80.000");
    });
});

describe("esTeclaDeActivacion", () => {
    it("activa la tarjeta con Enter y con espacio", () => {
        expect(esTeclaDeActivacion("Enter")).toBe(true);
        expect(esTeclaDeActivacion(" ")).toBe(true);
    });

    it("ignora cualquier otra tecla", () => {
        expect(esTeclaDeActivacion("Tab")).toBe(false);
        expect(esTeclaDeActivacion("a")).toBe(false);
    });
});

describe("montoVisible", () => {
    it("muestra el monto en pesos o lo tapa", () => {
        expect(montoVisible(1250000, false)).toContain("1.250.000");
        expect(montoVisible(1250000, true)).toBe(VALOR_OCULTO);
        expect(montoVisible(1250000, true)).not.toContain("1.250.000");
    });
});

describe("textoEstudiantes", () => {
    it("usa singular y plural", () => {
        expect(textoEstudiantes(1)).toBe("1 estudiante");
        expect(textoEstudiantes(3)).toBe("3 estudiantes");
        expect(textoEstudiantes(0)).toBe("0 estudiantes");
    });
});

describe("composicionDeuda", () => {
    it("separa la mora de lo académico para no contarla dos veces", () => {
        // En el backend la deuda académica ya incluye la mora.
        const partes = composicionDeuda({
            total_deuda: 1250000,
            total_academico: 1170000,
            total_inventario: 80000,
            total_mora: 70000,
            total_anios_anteriores: 300000,
            total_estudiantes: 3,
        });

        expect(partes).toEqual({
            total: 1250000,
            academico: 1100000,
            ventas: 80000,
            mora: 70000,
            aniosAnteriores: 300000,
            estudiantes: 3,
        });
        expect(partes.academico + partes.ventas + partes.mora).toBe(partes.total);
    });

    it("trata el resumen ausente o incompleto como ceros", () => {
        expect(composicionDeuda(null)).toEqual({
            total: 0,
            academico: 0,
            ventas: 0,
            mora: 0,
            aniosAnteriores: 0,
            estudiantes: 0,
        });
        expect(composicionDeuda({ total_academico: "abc", total_mora: 50 }).academico).toBe(0);
    });
});

describe("inicialesDe", () => {
    it("toma la inicial del nombre y del apellido en mayúscula", () => {
        expect(inicialesDe("samuel", "ortiz pardo")).toBe("SO");
        expect(inicialesDe("Ana", "")).toBe("A");
        expect(inicialesDe("", null)).toBe("?");
    });
});

describe("detalleDeudor", () => {
    it("cuenta las cuotas vencidas, las ventas y los años anteriores", () => {
        expect(
            detalleDeudor({
                cuotas_vencidas: 5,
                ventas_pendientes: [{ venta_id: 1 }],
                deuda_anios_anteriores: [{ anio: 2025 }],
            }),
        ).toBe("5 cuotas vencidas · 1 venta sin pagar · también de años anteriores");
        expect(detalleDeudor({ cuotas_vencidas: 1, ventas_pendientes: [{}, {}] })).toBe(
            "1 cuota vencida · 2 ventas sin pagar",
        );
    });

    it("sin cuotas vencidas nombra el concepto que debe", () => {
        expect(detalleDeudor({ cuotas_vencidas: 0, conceptos: [{ concepto: "matrícula" }] })).toBe(
            "Matrícula",
        );
        expect(
            detalleDeudor({
                cuotas_vencidas: 0,
                conceptos: [{ concepto: "derechos de grado" }, { concepto: "carné" }],
            }),
        ).toBe("Derechos de grado y 1 más");
    });

    it("devuelve vacío cuando no hay datos", () => {
        expect(detalleDeudor({})).toBe("");
        expect(detalleDeudor(null)).toBe("");
    });
});

describe("mayoresDeudores", () => {
    const resumen = {
        top_5: [
            { estudiante_id: 7, nombre: "SAMUEL", apellido: "ortiz", curso_nombre: "NOVENO", total: 800000, cuotas_vencidas: 4 },
            { estudiante_id: 9, nombre: "valeria", apellido: "gómez", curso_nombre: "QUINTO", total: 400000, cuotas_vencidas: 2 },
            { estudiante_id: 3, nombre: "solo", apellido: "anterior", curso_nombre: "ONCE", total: 0, deuda_anios_anteriores: [{ anio: 2025 }] },
        ],
    };

    it("conserva el orden del backend y arma cada fila", () => {
        const filas = mayoresDeudores(resumen);

        expect(filas.map((fila) => fila.estudianteId)).toEqual([7, 9]);
        expect(filas[0]).toEqual({
            estudianteId: 7,
            puesto: 1,
            nombre: "Samuel Ortiz",
            iniciales: "SO",
            curso: "NOVENO",
            detalle: "4 cuotas vencidas",
            total: 800000,
            porcentaje: 100,
        });
        expect(filas[1].porcentaje).toBe(50);
    });

    it("deja fuera a quien solo debe de años anteriores", () => {
        expect(mayoresDeudores(resumen).some((fila) => fila.estudianteId === 3)).toBe(false);
    });

    it("no pasa de cinco y tolera un resumen sin lista", () => {
        const muchos = {
            top_5: Array.from({ length: 7 }, (_, indice) => ({ estudiante_id: indice + 1, total: 100 - indice })),
        };
        expect(mayoresDeudores(muchos)).toHaveLength(5);
        expect(mayoresDeudores(null)).toEqual([]);
        expect(mayoresDeudores({ top_5: "x" })).toEqual([]);
    });
});

describe("deudaPorCurso", () => {
    const resumen = {
        distribucion_cursos: [
            { curso_id: 9, curso_nombre: "NOVENO", total: 3150000, estudiantes: 6 },
            { curso_id: 5, curso_nombre: "QUINTO", total: 1575000, estudiantes: 5 },
            { curso_id: 11, curso_nombre: "ONCE", total: 0, estudiantes: 1 },
        ],
    };

    it("arma cada curso con su barrita frente al que más debe", () => {
        expect(deudaPorCurso(resumen)).toEqual([
            { cursoId: 9, nombre: "NOVENO", estudiantes: 6, total: 3150000, porcentaje: 100 },
            { cursoId: 5, nombre: "QUINTO", estudiantes: 5, total: 1575000, porcentaje: 50 },
        ]);
    });

    it("respeta el límite y tolera un resumen sin lista", () => {
        expect(deudaPorCurso(resumen, 1)).toHaveLength(1);
        expect(deudaPorCurso(null)).toEqual([]);
    });
});
