import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import TarjetaAdmisionesView from "./TarjetaAdmisionesView";

const CONTEOS = { pendiente: 4, aprobado: 2, no_aprobado: 1, matriculado: 1, total: 7 };

function pintar(props = {}) {
  return render(
    <MemoryRouter>
      <TarjetaAdmisionesView anio={2027} conteos={CONTEOS} cargando={false} error="" {...props} />
    </MemoryRouter>,
  );
}

describe("TarjetaAdmisionesView", () => {
  it("muestra los conteos del año y lleva a la página de admisiones", () => {
    pintar();

    expect(screen.getByRole("heading", { name: "Admisiones 2027" })).toBeInTheDocument();
    expect(screen.getByText("Pendientes: 4")).toBeInTheDocument();
    expect(screen.getByText("Aprobados: 2")).toBeInTheDocument();
    expect(screen.getByText("No aprobados: 1")).toBeInTheDocument();
    expect(screen.getByText("Matriculados: 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a admisiones" })).toHaveAttribute(
      "href",
      "/admin/anios-lectivos/admisiones",
    );
  });

  it("mientras carga no muestra conteos en cero", () => {
    pintar({ cargando: true });

    expect(screen.getByText("Cargando admisiones...")).toBeInTheDocument();
    expect(screen.queryByText("Pendientes: 4")).not.toBeInTheDocument();
  });

  it("si los conteos no llegan, lo dice y deja entrar igual", () => {
    pintar({ error: "No se pudieron cargar las admisiones." });

    expect(screen.getByText("No se pudieron cargar las admisiones.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a admisiones" })).toBeInTheDocument();
  });
});
