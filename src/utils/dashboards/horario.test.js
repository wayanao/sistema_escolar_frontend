import { describe, expect, it } from "vitest";
import {
    ESTADO_AHORA,
    ESTADO_SIGUIENTE,
    ESTADO_TERMINADA,
    accionesDeClase,
    agruparClasesPorDia,
    aMinutos,
    diaInicialHorario,
    jornadaEnCurso,
    duracionClase,
    estadosDeClasesDeHoy,
    resumenDelDia,
    separarPorJornada,
} from "./horario";

const clase = (extra) => ({ id: 1, materia: "MATEMÁTICAS", curso: "5A", dia: "Lunes", hora_inicio: "07:00:00", hora_fin: "08:00:00", ...extra });

describe("horario del panel del profesor", () => {
    it("convierte la hora en minutos y rechaza lo que no es hora", () => {
        expect(aMinutos("07:30:00")).toBe(450);
        expect(aMinutos("13:05")).toBe(785);
        expect(aMinutos("")).toBeNull();
        expect(aMinutos(null)).toBeNull();
    });

    it("agrupa por día de la semana escolar y ordena por hora", () => {
        const porDia = agruparClasesPorDia([
            clase({ id: 2, hora_inicio: "09:00", hora_fin: "10:00" }),
            clase({ id: 1, hora_inicio: "07:00", hora_fin: "08:00" }),
            clase({ id: 3, dia: "Miércoles" }),
            clase({ id: 4, dia: "Sábado" }),
        ]);

        expect(Object.keys(porDia)).toEqual(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]);
        expect(porDia.Lunes.map((c) => c.id)).toEqual([1, 2]);
        expect(porDia.Miércoles).toHaveLength(1);
        expect(porDia.Martes).toEqual([]);
    });

    it("al entrar muestra hoy, o el lunes en fin de semana", () => {
        expect(diaInicialHorario("Jueves")).toBe("Jueves");
        expect(diaInicialHorario("Sábado")).toBe("Lunes");
        expect(diaInicialHorario("Domingo")).toBe("Lunes");
    });

    it("marca la clase en curso, las que terminaron y la siguiente", () => {
        const dia = [
            clase({ hora_inicio: "07:00", hora_fin: "08:00" }),
            clase({ hora_inicio: "08:00", hora_fin: "09:00" }),
            clase({ hora_inicio: "10:00", hora_fin: "11:00" }),
            clase({ hora_inicio: "11:00", hora_fin: "12:00" }),
        ];

        // 8:30 a. m.
        expect(estadosDeClasesDeHoy(dia, 510)).toEqual([
            ESTADO_TERMINADA,
            ESTADO_AHORA,
            ESTADO_SIGUIENTE,
            null,
        ]);
        // Antes de empezar: solo la primera es la siguiente.
        expect(estadosDeClasesDeHoy(dia, 360)).toEqual([ESTADO_SIGUIENTE, null, null, null]);
        // Al final del día: todas terminaron.
        expect(estadosDeClasesDeHoy(dia, 800)).toEqual(Array(4).fill(ESTADO_TERMINADA));
    });

    it("decide qué se puede hacer desde cada clase", () => {
        expect(accionesDeClase(clase({ nivel: "primaria" }))).toEqual({
            asistencia: true,
            planilla: true,
            textoAsistencia: "Tomar asistencia",
        });
        // En preescolar la asistencia va por «Asistencia diaria»...
        expect(accionesDeClase(clase({ materia: "ASISTENCIA DIARIA", nivel: "preescolar" }))).toEqual({
            asistencia: true,
            planilla: false,
            textoAsistencia: "Tomar asistencia del día",
        });
        // ...y sus materias solo llevan notas.
        expect(accionesDeClase(clase({ materia: "DIMENSIÓN COMUNICATIVA", nivel: "preescolar" }))).toEqual({
            asistencia: false,
            planilla: true,
            textoAsistencia: "",
        });
    });

    it("resume el día y la duración en palabras", () => {
        const dia = [
            clase({ hora_inicio: "07:00", hora_fin: "07:45" }),
            clase({ hora_inicio: "11:00", hora_fin: "12:30" }),
        ];
        expect(resumenDelDia(dia)).toBe("2 clases · de 7:00 AM a 12:30 PM");
        expect(resumenDelDia([])).toBe("");
        expect(duracionClase(dia[0])).toBe("45 min");
        expect(duracionClase(clase({ hora_inicio: "07:00", hora_fin: "08:00" }))).toBe("1 hora");
        expect(duracionClase(dia[1])).toBe("1 h 30 min");
    });

    it("parte el día por jornada solo si el profesor tiene las dos", () => {
        const dia = [
            clase({ jornada: "Mañana", hora_inicio: "07:00", hora_fin: "08:00" }),
            clase({ jornada: "Tarde", hora_inicio: "13:00", hora_fin: "14:00" }),
        ];
        expect(separarPorJornada(dia, false)).toEqual([{ jornada: "", clases: dia }]);
        expect(separarPorJornada(dia, true).map((g) => g.jornada)).toEqual(["Mañana", "Tarde"]);
    });

    it("pone de primera la jornada que está en curso", () => {
        const dia = [
            clase({ jornada: "Mañana", hora_inicio: "07:00", hora_fin: "08:00" }),
            clase({ jornada: "Tarde", hora_inicio: "13:00", hora_fin: "14:00" }),
        ];
        expect(jornadaEnCurso(450)).toBe("Mañana");
        expect(jornadaEnCurso(750)).toBe("Tarde");
        expect(separarPorJornada(dia, true, "Tarde").map((g) => g.jornada)).toEqual(["Tarde", "Mañana"]);
        expect(separarPorJornada(dia, true, "Mañana").map((g) => g.jornada)).toEqual(["Mañana", "Tarde"]);
    });
});
