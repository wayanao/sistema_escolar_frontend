import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PanelJornada from "./PanelJornada";
import {
    agruparClasesPorJornada,
    agruparHorarioPorJornada,
    ordenarClasesConHorario,
} from "../../../utils/dashboards/profesor";

const clases = [
    { id: 10, horario_id: 501, materia: "Matemáticas", curso: "5A", jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
    { id: 11, horario_id: 503, materia: "Español", curso: "5A", jornada: "Mañana", dia: "Martes", hora_inicio: "08:00", hora_fin: "09:00" },
];

const porJornada = agruparClasesPorJornada(ordenarClasesConHorario(clases));
const horario = agruparHorarioPorJornada(porJornada);

const montar = (jornada = "Mañana") =>
    render(
        <PanelJornada
            jornada={jornada}
            clasesJornada={porJornada[jornada]}
            horarioJornada={horario[jornada]}
        />,
    );

describe("PanelJornada", () => {
    it("titula la jornada con su horario institucional y su conteo", () => {
        montar();

        expect(screen.getByRole("heading", { name: "Jornada mañana" })).toBeInTheDocument();
        expect(screen.getByText("Horario institucional: 06:30 - 12:30")).toBeInTheDocument();
        expect(screen.getByText("2 clases")).toBeInTheDocument();
    });

    it("usa el singular cuando hay una sola clase", () => {
        render(
            <PanelJornada
                jornada="Tarde"
                clasesJornada={[clases[0]]}
                horarioJornada={horario.Tarde}
            />,
        );

        expect(screen.getByText("1 clase")).toBeInTheDocument();
        expect(screen.getByText("Horario institucional: 12:30 - 18:30")).toBeInTheDocument();
    });

    it("pinta la franja en formato de 12 horas con su materia y curso", () => {
        montar();

        expect(screen.getAllByText("7:00 AM - 8:00 AM")).toHaveLength(2);
        expect(screen.getAllByText("Matemáticas")).toHaveLength(2);
        expect(screen.getAllByText("Curso: 5A")).toHaveLength(4);
    });

    it("marca como vacíos los días sin clases en las dos vistas", () => {
        montar();

        // Miércoles, jueves y viernes en la vista móvil y en la de escritorio.
        expect(screen.getAllByText("Sin clases")).toHaveLength(6);
    });

    it("lista los cinco días de la semana escolar", () => {
        montar();

        ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].forEach((dia) => {
            expect(screen.getAllByText(dia).length).toBeGreaterThan(0);
        });
    });
});
