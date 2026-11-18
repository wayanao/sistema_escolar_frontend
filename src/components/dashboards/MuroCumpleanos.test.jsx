import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ID_FUENTE_GOTICA } from "../../hooks/dashboards/useFuenteGotica";
import MuroCumpleanos from "./MuroCumpleanos";

// Miércoles 11 de noviembre de 2026.
const AHORA = new Date(2026, 10, 11, 9, 0);

const estudiantes = [
    { id: 2, nombre: "pedro", apellido: "ruiz", curso: "QUINTO", fecha_nacimiento: "2015-11-13" },
    { id: 1, nombre: "ana sofía", apellido: "mejía", curso: "TERCERO", fecha_nacimiento: "2017-11-11" },
];

const pintar = (props = {}) =>
    render(
        <MuroCumpleanos
            estudiantes={estudiantes}
            ahora={AHORA}
            emptyText="Esta semana no hay cumpleaños en tus cursos."
            {...props}
        />,
    );

describe("MuroCumpleanos", () => {
    afterEach(() => {
        document.getElementById(ID_FUENTE_GOTICA)?.remove();
    });

    it("es la sección «Cumpleaños de la semana»", () => {
        pintar();

        expect(screen.getByRole("region", { name: "Cumpleaños de la semana" })).toBeInTheDocument();
    });

    it("pinta un globo por estudiante, primero el de hoy, con todo adentro", () => {
        pintar();

        const globos = screen.getAllByRole("listitem");
        expect(globos).toHaveLength(2);
        expect(globos[0]).toHaveTextContent("Hoy");
        expect(globos[0]).toHaveTextContent("Ana Sofía Mejía");
        expect(globos[0]).toHaveTextContent("TERCERO · 9 años");
        expect(globos[1]).toHaveTextContent("Viernes 13");
        expect(globos[1]).toHaveTextContent("Pedro Ruiz");
        expect(globos[1]).toHaveTextContent("QUINTO · 11 años");
    });

    it("sin soporte de animación el globo de hoy se queda en el muro", () => {
        pintar();

        expect(screen.queryByText("¡Salió a volar!")).not.toBeInTheDocument();
        expect(screen.getAllByText("Ana Sofía Mejía")).toHaveLength(1);
    });

    it("el globo de mañana también sale a volar; el de pasado mañana se queda quieto", () => {
        const { container } = pintar({
            estudiantes: [
                ...estudiantes,
                { id: 3, nombre: "luis", apellido: "gómez", curso: "CUARTO", fecha_nacimiento: "2016-11-12" },
            ],
        });

        const globos = [...container.querySelectorAll("li")];
        expect(globos.map((globo) => globo.textContent.includes("Luis Gómez"))).toEqual([false, true, false]);
        // Los que van a volar se mecen en el muro (`globo-flotar`) hasta soltarse.
        expect(globos[0].querySelector(".globo-flotar")).not.toBeNull();
        expect(globos[1]).toHaveTextContent("Mañana");
        expect(globos[1].querySelector(".globo-flotar")).not.toBeNull();
        expect(globos[2]).toHaveTextContent("Viernes 13");
        expect(globos[2].querySelector(".globo-flotar")).toBeNull();
    });

    it("pide la letra gótica una sola vez", () => {
        const { unmount } = pintar();
        unmount();
        pintar();

        expect(document.querySelectorAll(`#${ID_FUENTE_GOTICA}`)).toHaveLength(1);
    });

    it("dice cuando busca, cuando falla y cuando no hay cumpleaños", () => {
        const { rerender } = pintar({ loading: true });
        // Mientras busca, el caminito que se llena, sin letras.
        expect(screen.getByRole("progressbar", { name: "Buscando cumpleaños de la semana" })).toBeInTheDocument();
        expect(screen.queryByText(/buscando/i)).not.toBeInTheDocument();

        rerender(
            <MuroCumpleanos
                estudiantes={[]}
                error="No se pudieron cargar los cumpleaños de la semana."
                ahora={AHORA}
                emptyText="Vacío"
            />,
        );
        expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar los cumpleaños de la semana.");

        rerender(
            <MuroCumpleanos
                estudiantes={[]}
                ahora={AHORA}
                emptyText="Esta semana no hay cumpleaños en tus cursos."
            />,
        );
        expect(screen.getByText("Esta semana no hay cumpleaños en tus cursos.")).toBeInTheDocument();
        expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
});
