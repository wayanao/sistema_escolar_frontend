import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerObservadorMock, usePlanillaMock } = vi.hoisted(() => ({
  obtenerObservadorMock: vi.fn(),
  usePlanillaMock: vi.fn(),
}));

vi.mock("../hooks/estudiantesObservador/usePlanillaObservador", () => ({
  default: usePlanillaMock,
}));

vi.mock("../services/observadorApi", () => ({
  obtenerObservador: obtenerObservadorMock,
}));

import Observador from "./Observador";

const ESTUDIANTES = [
  { estudiante_id: 11, nombre: "Ana", apellido: "Rojas" },
  { estudiante_id: 12, nombre: "Luis", apellido: "Pardo" },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("asignacionId", "44");
  usePlanillaMock.mockReturnValue({
    estudiantes: ESTUDIANTES,
    cargando: false,
    error: null,
  });
  obtenerObservadorMock.mockResolvedValue({
    nivel: "primaria",
    anotaciones: [
      {
        id: 12,
        profesor_id: 7,
        profesor: "Ana Gómez",
        periodo: 1,
        positiva: false,
        conductual: "Se para mucho.",
        cognitivo: "",
        lenguaje: "",
        creada_en: "2026-03-20T12:00:00Z",
        editada_en: null,
        editada_por: null,
      },
    ],
  });
});

describe("página del Observador", () => {
  it("no pide ninguna bitácora hasta que se abre un alumno", () => {
    render(<Observador />);

    expect(screen.getByRole("button", { name: "Ana Rojas" })).toBeInTheDocument();
    // Aquí muere el fallo del usuario: la pantalla vieja montaba un componente
    // por alumno y cada uno pedía lo suyo -12 peticiones, 16-20 s, y el hook se
    // rendía a los 10 s-. Esta lista no pide nada.
    expect(obtenerObservadorMock).not.toHaveBeenCalled();
  });

  it("al abrir un alumno hace una sola petición, del año entero", async () => {
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(screen.getByRole("button", { name: "Ana Rojas" }));

    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(1));
    expect(obtenerObservadorMock.mock.calls[0][0]).toBe(11);
    // "Todos" por defecto: abrir la página nunca esconde historial.
    expect(obtenerObservadorMock.mock.calls[0][1].periodo).toBeNull();

    expect(
      await screen.findByRole("heading", { name: "Observador de Ana Rojas · Primaria" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Se para mucho.")).toBeInTheDocument();
  });

  it("filtra la lista sin volver a consultar al servidor", async () => {
    const user = userEvent.setup();
    render(<Observador />);

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "luis");

    expect(screen.getByRole("button", { name: "Luis Pardo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ana Rojas" })).not.toBeInTheDocument();
    expect(usePlanillaMock).toHaveBeenCalledWith("44");
  });

  it("vuelve a la lista sin perder el buscador", async () => {
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(screen.getByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    await user.click(screen.getByRole("button", { name: "← Volver a la lista" }));

    expect(screen.getByRole("button", { name: "Ana Rojas" })).toBeInTheDocument();
  });

  it("traduce el 404 a «no existe», que no es lo mismo que no tener nada escrito", async () => {
    obtenerObservadorMock.mockRejectedValue({ response: { status: 404 } });
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(screen.getByRole("button", { name: "Ana Rojas" }));

    expect(
      await screen.findByText("No encontramos a ese estudiante."),
    ).toBeInTheDocument();
  });

  it("traduce cualquier otro fallo a un aviso distinto", async () => {
    obtenerObservadorMock.mockRejectedValue({ response: { status: 500 } });
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(screen.getByRole("button", { name: "Ana Rojas" }));

    expect(
      await screen.findByText("No se pudo consultar el observador. Intenta de nuevo."),
    ).toBeInTheDocument();
  });

  it("manda a elegir asignación si no hay ninguna guardada", () => {
    localStorage.removeItem("asignacionId");
    const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});
    usePlanillaMock.mockReturnValue({ estudiantes: [], cargando: false, error: null });

    render(<Observador />);

    expect(alerta).toHaveBeenCalledWith(
      "Selecciona una asignación primero en la página principal",
    );
    alerta.mockRestore();
  });
});
