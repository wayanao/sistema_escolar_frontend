import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cambiarEstadoMock } = vi.hoisted(() => ({
  cambiarEstadoMock: vi.fn(),
}));

vi.mock("../../services/estudiantesObservadorApi", () => ({
  cambiarEstadoEstudiante: cambiarEstadoMock,
}));

import useCambioEstadoEstudianteAdmin from "./useCambioEstadoEstudianteAdmin";

beforeEach(() => {
  vi.clearAllMocks();
});

function crearPropiedades(overrides = {}) {
  return {
    estadoFiltro: "activo",
    setEstudiantes: vi.fn(),
    selectedEstudiante: { id: 11, nombre: "Ana" },
    setSelectedEstudiante: vi.fn(),
    confirmar: vi.fn(() => true),
    ...overrides,
  };
}

describe("useCambioEstadoEstudianteAdmin", () => {
  it("confirma, actualiza y retira la fila que deja el filtro", async () => {
    const props = crearPropiedades();
    cambiarEstadoMock.mockResolvedValue({ estado: "retirado" });
    const { result } = renderHook(() =>
      useCambioEstadoEstudianteAdmin(props),
    );
    const estudiante = {
      id: 11,
      nombre: "Ana",
      apellido: "Rojas",
      estado: "activo",
    };

    let respuesta;
    await act(async () => {
      respuesta = await result.current.cambiarEstado(estudiante, "retirado");
    });

    expect(props.confirmar).toHaveBeenCalledWith(
      "¿Deseas marcar como retirado a Ana Rojas?",
    );
    expect(cambiarEstadoMock).toHaveBeenCalledWith(11, "retirado");
    const actualizarLista = props.setEstudiantes.mock.calls[0][0];
    expect(actualizarLista([estudiante])).toEqual([]);
    const actualizarSeleccion = props.setSelectedEstudiante.mock.calls[0][0];
    expect(actualizarSeleccion(props.selectedEstudiante)).toEqual({
      id: 11,
      nombre: "Ana",
      estado: "retirado",
    });
    expect(respuesta).toEqual({
      estado: "exito",
      estadoActualizado: "retirado",
    });
  });

  it("no llama al servicio si no cambia el estado o se cancela", async () => {
    const props = crearPropiedades({ confirmar: vi.fn(() => false) });
    const { result } = renderHook(() =>
      useCambioEstadoEstudianteAdmin(props),
    );
    const estudiante = {
      id: 11,
      nombre: "Ana",
      apellido: "Rojas",
      estado: "activo",
    };

    await expect(
      result.current.cambiarEstado(estudiante, "activo"),
    ).resolves.toEqual({ estado: "sin_cambios" });
    await expect(
      result.current.cambiarEstado(estudiante, "retirado"),
    ).resolves.toEqual({ estado: "cancelado" });
    expect(cambiarEstadoMock).not.toHaveBeenCalled();
  });

  it("devuelve el error original sin alterar la colección", async () => {
    const error = new Error("Estado no disponible");
    const props = crearPropiedades();
    cambiarEstadoMock.mockRejectedValue(error);
    const { result } = renderHook(() =>
      useCambioEstadoEstudianteAdmin(props),
    );

    await expect(
      result.current.cambiarEstado(
        { id: 11, nombre: "Ana", apellido: "Rojas", estado: "activo" },
        "retirado",
      ),
    ).resolves.toEqual({ estado: "error", error });
    expect(props.setEstudiantes).not.toHaveBeenCalled();
  });
});
