import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { normalizarPuntualidad } from "../../../utils/dashboards/puntualidad";
import TarjetaMejoresPagadores from "./TarjetaMejoresPagadores";

const estudiante = (id, nombre, curso, vencidas, aTiempo, dias) => ({
    estudiante_id: id,
    nombre,
    apellido: "Prueba",
    curso_nombre: curso,
    cuotas_vencidas: vencidas,
    cuotas_a_tiempo: aTiempo,
    dias_antes_promedio: dias,
    siempre_a_tiempo: vencidas === aTiempo,
});

const curso = (id, nombre, estudiantes, siempre, mejores = []) => ({
    curso_id: id,
    curso_nombre: nombre,
    estudiantes,
    siempre_a_tiempo: siempre,
    mejores,
});

// Como lo arma el backend: los que pagan siempre a tiempo van primero.
const datos = normalizarPuntualidad({
    total_estudiantes: 30,
    siempre_a_tiempo: 2,
    mejores: [
        estudiante(1, "ana", "SEXTO", 10, 10, 9),
        estudiante(2, "beto", "QUINTO", 10, 10, 2),
        estudiante(3, "carla", "SEXTO", 10, 9, 4),
    ],
    cursos: [
        curso(6, "SEXTO", 4, 3, [
            estudiante(1, "ana", "SEXTO", 10, 10, 9),
            estudiante(4, "dani", "SEXTO", 10, 10, 1),
            estudiante(5, "eva", "SEXTO", 10, 10, 0),
            estudiante(3, "carla", "SEXTO", 10, 9, 4),
        ]),
        curso(5, "QUINTO", 5, 2),
        curso(1, "PRIMERO", 5, 1),
        curso(2, "SEGUNDO", 5, 1),
        curso(3, "TERCERO", 5, 1),
        curso(4, "CUARTO", 6, 0),
    ],
});

const tarjeta = () => screen.getByRole("region", { name: "Los que mejor pagan" });

describe("TarjetaMejoresPagadores", () => {
    it("empieza con los mejores de todo el colegio", () => {
        render(<TarjetaMejoresPagadores puntualidad={datos} />);

        expect(screen.getByRole("button", { name: "Todo el colegio" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: "Por curso" })).toHaveAttribute("aria-pressed", "false");
        const filas = within(tarjeta()).getAllByRole("listitem");
        expect(filas).toHaveLength(3);
        expect(filas[0]).toHaveTextContent("Ana Prueba");
        expect(filas[0]).toHaveTextContent("SEXTO");
        expect(filas[0]).toHaveTextContent("Suele pagar 9 días antes");
        expect(filas[0]).toHaveTextContent("10 de 10 cuotas a tiempo");
        expect(filas[2]).toHaveTextContent("Pagó tarde 1 cuota");
        expect(filas[2]).toHaveTextContent("9 de 10 cuotas a tiempo");
        expect(tarjeta()).toHaveTextContent(
            "Solo 2 pagan siempre a tiempo; los demás de la lista se atrasaron alguna vez.",
        );
    });

    it("si hay más puntuales que los de la lista, dice cuántos más", () => {
        const muchos = { ...datos, siempreATiempo: 9, mejores: datos.mejores.slice(0, 2) };

        render(<TarjetaMejoresPagadores puntualidad={muchos} />);

        expect(tarjeta()).toHaveTextContent("Y 7 más pagan siempre a tiempo.");
    });

    it("«Por curso» ordena los cursos y muestra solo los 5 primeros", () => {
        render(<TarjetaMejoresPagadores puntualidad={datos} />);

        fireEvent.click(screen.getByRole("button", { name: "Por curso" }));

        expect(screen.getByRole("button", { name: "Por curso" })).toHaveAttribute("aria-pressed", "true");
        expect(tarjeta()).toHaveTextContent("Del curso que mejor paga al que menos");
        const cursos = screen.getAllByRole("button", { expanded: false }).filter((boton) => /siempre a tiempo/.test(boton.textContent));
        expect(cursos.map((boton) => boton.textContent)).toEqual([
            expect.stringContaining("SEXTO75 %3 de 4 pagan siempre a tiempo"),
            expect.stringContaining("QUINTO40 %2 de 5 pagan siempre a tiempo"),
            expect.stringContaining("PRIMERO20 %1 de 5 paga siempre a tiempo"),
            expect.stringContaining("SEGUNDO"),
            expect.stringContaining("TERCERO"),
        ]);
        expect(screen.queryByText("CUARTO")).not.toBeInTheDocument();
    });

    it("al tocar un curso se abren ahí mismo sus mejores, con medallas", () => {
        render(<TarjetaMejoresPagadores puntualidad={datos} />);
        fireEvent.click(screen.getByRole("button", { name: "Por curso" }));

        const sexto = screen.getByRole("button", { name: /^1\s*SEXTO/ });
        fireEvent.click(sexto);

        expect(sexto).toHaveAttribute("aria-expanded", "true");
        const panel = document.getElementById(sexto.getAttribute("aria-controls"));
        expect(panel).toHaveTextContent("Los 4 que mejor pagan en SEXTO");
        const filas = within(panel).getAllByRole("listitem");
        expect(filas.map((fila) => within(fila).getByText(/^\d$/).textContent)).toEqual(["1", "2", "3", "4"]);
        expect(filas[1]).toHaveTextContent("Dani Prueba");
        expect(filas[2]).toHaveTextContent("Suele pagar el día límite");
        expect(panel).toHaveTextContent("Solo 3 pagan siempre a tiempo; los demás de la lista se atrasaron alguna vez.");

        fireEvent.click(sexto);
        expect(sexto).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("Los 4 que mejor pagan en SEXTO")).not.toBeInTheDocument();
    });

    it("un curso sin nadie en la lista lo dice", () => {
        render(<TarjetaMejoresPagadores puntualidad={datos} />);
        fireEvent.click(screen.getByRole("button", { name: "Por curso" }));

        fireEvent.click(screen.getByRole("button", { name: /^2\s*QUINTO/ }));

        expect(tarjeta()).toHaveTextContent("En este curso todos deben alguna cuota o nunca han pagado a tiempo.");
    });

    it("«Ver los 6 cursos» muestra el resto y al volver cierra el que quedó escondido", () => {
        render(<TarjetaMejoresPagadores puntualidad={datos} />);
        fireEvent.click(screen.getByRole("button", { name: "Por curso" }));

        fireEvent.click(screen.getByRole("button", { name: "Ver los 6 cursos" }));
        const cuarto = screen.getByRole("button", { name: /^6\s*CUARTO/ });
        expect(cuarto).toHaveTextContent("0 %");
        fireEvent.click(cuarto);
        expect(cuarto).toHaveAttribute("aria-expanded", "true");

        fireEvent.click(screen.getByRole("button", { name: "Ver solo los 5 primeros" }));
        expect(screen.queryByText("CUARTO")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Ver los 6 cursos" }));
        expect(screen.getByRole("button", { name: /^6\s*CUARTO/ })).toHaveAttribute("aria-expanded", "false");
    });

    it("sin nadie en la lista del colegio lo explica", () => {
        render(<TarjetaMejoresPagadores puntualidad={{ ...datos, siempreATiempo: 0, mejores: [] }} />);

        expect(tarjeta()).toHaveTextContent(
            "Por ahora nadie entra en la lista: todos deben alguna cuota o nunca han pagado a tiempo.",
        );
    });

    it("cargando, error y «todavía no vence nada» no muestran los botones", () => {
        const { rerender } = render(<TarjetaMejoresPagadores puntualidad={null} cargando />);
        expect(screen.getByRole("progressbar", { name: "Calculando quién paga a tiempo" })).toBeInTheDocument();
        expect(screen.queryByText(/calculando/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Por curso" })).not.toBeInTheDocument();

        rerender(<TarjetaMejoresPagadores puntualidad={null} error="No se pudo cargar quién paga a tiempo." />);
        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar quién paga a tiempo.");

        rerender(<TarjetaMejoresPagadores puntualidad={normalizarPuntualidad({ total_estudiantes: 0 })} />);
        expect(screen.getByText("Todavía no se ha vencido ninguna mensualidad este año.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Todo el colegio" })).not.toBeInTheDocument();
    });
});
