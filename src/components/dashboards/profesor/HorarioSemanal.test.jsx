import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HorarioSemanal from "./HorarioSemanal";
import {
    agruparClasesPorJornada,
    agruparHorarioPorJornada,
    obtenerJornadasVisibles,
    ordenarClasesConHorario,
    tieneDosJornadas,
} from "../../../utils/dashboards/profesor";

const clases = [
    { id: 10, horario_id: 501, materia: "Matemáticas", curso: "5A", jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
    { id: 11, horario_id: 503, materia: "Español", curso: "5A", jornada: "Mañana", dia: "Martes", hora_inicio: "08:00", hora_fin: "09:00" },
    { id: 12, horario_id: 504, materia: "Sociales", curso: "6B", jornada: "Tarde", dia: "Jueves", hora_inicio: "13:00", hora_fin: "14:00" },
];

const propiedades = (listaClases = clases, extra = {}) => {
    const conHorario = ordenarClasesConHorario(listaClases);
    const porJornada = agruparClasesPorJornada(conHorario);
    const filtroJornada = extra.filtroJornada ?? "Ambas";

    return {
        loadingClases: false,
        clasesConHorario: conHorario,
        clasesPorJornada: porJornada,
        horarioPorJornada: agruparHorarioPorJornada(porJornada),
        hayDosJornadas: tieneDosJornadas(porJornada),
        filtroJornada,
        onCambiarJornada: vi.fn(),
        jornadasVisibles: obtenerJornadasVisibles(filtroJornada, porJornada),
        ...extra,
    };
};

describe("HorarioSemanal", () => {
    it("resume el conteo por jornada y el total", () => {
        render(<HorarioSemanal {...propiedades()} />);

        expect(screen.getByText("3 clases")).toBeInTheDocument();
        expect(screen.getByText("2 en la mañana · 1 en la tarde")).toBeInTheDocument();
    });

    it("ofrece el filtro y pinta las dos jornadas", () => {
        render(<HorarioSemanal {...propiedades()} />);

        expect(
            screen.getByRole("group", { name: "Filtrar horario por jornada" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Jornada mañana" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Jornada tarde" })).toBeInTheDocument();
    });

    it("informa la jornada elegida y marca el botón activo", () => {
        const onCambiarJornada = vi.fn();
        render(<HorarioSemanal {...propiedades(clases, { onCambiarJornada })} />);

        expect(screen.getByRole("button", { name: "Ambas" })).toHaveAttribute(
            "aria-pressed",
            "true",
        );

        fireEvent.click(screen.getByRole("button", { name: "Tarde" }));
        expect(onCambiarJornada).toHaveBeenCalledWith("Tarde");
    });

    it("muestra solo la jornada filtrada", () => {
        render(<HorarioSemanal {...propiedades(clases, { filtroJornada: "Tarde" })} />);

        expect(screen.queryByRole("heading", { name: "Jornada mañana" })).not.toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Jornada tarde" })).toBeInTheDocument();
    });

    it("sustituye el filtro por una insignia cuando hay una sola jornada", () => {
        const soloManana = clases.filter((clase) => clase.jornada === "Mañana");
        render(<HorarioSemanal {...propiedades(soloManana)} />);

        expect(
            screen.queryByRole("group", { name: "Filtrar horario por jornada" }),
        ).not.toBeInTheDocument();
        // La insignia del encabezado más el título del único panel.
        expect(screen.getAllByText("Jornada mañana")).toHaveLength(2);
    });

    it("muestra el indicador de carga sin paneles", () => {
        render(<HorarioSemanal {...propiedades(clases, { loadingClases: true })} />);

        expect(screen.getByText("Cargando horario asignado...")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Jornada mañana" })).not.toBeInTheDocument();
        expect(
            screen.queryByRole("group", { name: "Filtrar horario por jornada" }),
        ).not.toBeInTheDocument();
    });

    it("distingue el fallo de carga del estado vacío", () => {
        render(
            <HorarioSemanal
                {...propiedades([], { errorClases: "No se pudieron cargar tus clases." })}
            />,
        );

        expect(screen.getByText("No se pudieron cargar tus clases.")).toBeInTheDocument();
        expect(
            screen.queryByText("No tienes clases con horario asignado todavía."),
        ).not.toBeInTheDocument();
    });

    it("muestra el estado vacío sin clases con horario", () => {
        render(<HorarioSemanal {...propiedades([])} />);

        expect(
            screen.getByText("No tienes clases con horario asignado todavía."),
        ).toBeInTheDocument();
        expect(screen.getByText("0 clases")).toBeInTheDocument();
    });
});
