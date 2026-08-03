import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EncabezadoEstudiantesAdmin from "./EncabezadoEstudiantesAdmin";

describe("EncabezadoEstudiantesAdmin", () => {
  it("presenta filtros vigentes y comunica búsqueda, estado y apertura", async () => {
    const user = userEvent.setup();
    const props = {
      searchTerm: "",
      onCambiarBusqueda: vi.fn(),
      estadoFiltro: "activo",
      onCambiarEstadoFiltro: vi.fn(),
      showForm: false,
      onAlternarFormulario: vi.fn(),
    };
    render(<EncabezadoEstudiantesAdmin {...props} />);

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "a");
    await user.selectOptions(screen.getByRole("combobox"), "retirado");
    await user.click(screen.getByRole("button", { name: "Nuevo Estudiante" }));

    expect(props.onCambiarBusqueda).toHaveBeenCalledWith("a");
    expect(props.onCambiarEstadoFiltro).toHaveBeenCalledWith("retirado");
    expect(props.onAlternarFormulario).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("option", { name: "Todos" })).toBeInTheDocument();
  });
});
