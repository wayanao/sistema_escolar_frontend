import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  aplicarBusquedaMock,
  observacionesMock,
  setBusquedaMock,
  usePlanillaMock,
} = vi.hoisted(() => ({
  aplicarBusquedaMock: vi.fn(),
  observacionesMock: vi.fn(),
  setBusquedaMock: vi.fn(),
  usePlanillaMock: vi.fn(),
}));

vi.mock("../hooks/estudiantesObservador/usePlanillaObservador", () => ({
  default: usePlanillaMock,
}));

vi.mock("../utils/periodoProfesor", () => ({
  obtenerPeriodoProfesor: () => "2",
}));

vi.mock("../components/estudiantesObservador/Observaciones", () => ({
  default: (props) => {
    observacionesMock(props);
    return <div>Tarjeta {props.estudiante.nombre}</div>;
  },
}));

import Formulario from "./Formulario";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("asignacionId", "44");
  aplicarBusquedaMock.mockReturnValue(true);
  usePlanillaMock.mockReturnValue({
    busqueda: "",
    setBusqueda: setBusquedaMock,
    filtrados: [
      { estudiante_id: 11, nombre: "Ana", apellido: "Rojas" },
      { estudiante_id: 12, nombre: "Luis", apellido: "Pardo" },
    ],
    error: null,
    buscarEstudiantes: aplicarBusquedaMock,
  });
});

describe("Formulario", () => {
  it("conecta contexto, búsqueda y tarjetas del observador", async () => {
    const user = userEvent.setup();
    render(<Formulario />);

    expect(usePlanillaMock).toHaveBeenCalledWith("44");
    expect(screen.getByText("Tarjeta Ana")).toBeInTheDocument();
    expect(screen.getByText("Tarjeta Luis")).toBeInTheDocument();
    expect(observacionesMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        estudiante: expect.objectContaining({ estudiante_id: 11 }),
        asignacionId: "44",
        periodo: "2",
      }),
    );

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "a");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(setBusquedaMock).toHaveBeenCalledWith("a");
    expect(aplicarBusquedaMock).toHaveBeenCalledTimes(1);
  });
});
