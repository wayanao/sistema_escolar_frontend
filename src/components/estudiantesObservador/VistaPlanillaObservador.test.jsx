import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import VistaPlanillaObservador from "./VistaPlanillaObservador";

describe("VistaPlanillaObservador", () => {
  it("conserva búsqueda, título y contenedores de tarjetas", async () => {
    const user = userEvent.setup();
    const onCambiarBusqueda = vi.fn();
    const onBuscar = vi.fn();
    const { container } = render(
      <VistaPlanillaObservador
        busqueda=""
        onCambiarBusqueda={onCambiarBusqueda}
        onBuscar={onBuscar}
      >
        <div>Tarjeta Ana</div>
        <div>Tarjeta Luis</div>
      </VistaPlanillaObservador>,
    );

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "a");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onCambiarBusqueda).toHaveBeenCalledWith("a");
    expect(onBuscar).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Tarjeta Ana")).toBeInTheDocument();
    expect(screen.getByText("Tarjeta Luis")).toBeInTheDocument();
    expect(container.querySelectorAll(".border.p-3.mb-3")).toHaveLength(2);
  });
});
