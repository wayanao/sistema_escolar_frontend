import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../utils/api";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import OrdenBoletin from "./OrdenBoletin";

const materias = [
  {
    curso_id: 4,
    materia_id: 20,
    materia_nombre: "Matemáticas",
    profesor_nombre: "Marta",
    horarios: 4,
    orden_boletin: 2,
  },
  {
    curso_id: 4,
    materia_id: 10,
    materia_nombre: "Biología",
    profesor_nombre: "Carlos",
    horarios: 3,
    orden_boletin: 1,
  },
  {
    curso_id: 4,
    materia_id: 30,
    materia_nombre: "Arte",
    profesor_nombre: "Laura",
    horarios: 2,
    orden_boletin: null,
  },
];

describe("OrdenBoletin", () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === "/cursos") {
        return Promise.resolve({
          data: [{ id: 4, nombre: "Sexto", jornada: "Tarde" }],
        });
      }
      if (url === "/cursos/4/orden-boletin") {
        return Promise.resolve({ data: { items: materias } });
      }
      return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
    api.put.mockImplementation((_url, payload) => {
      const items = payload.materias.map(({ materia_id }, index) => ({
        ...materias.find((materia) => materia.materia_id === materia_id),
        orden_boletin: index + 1,
      }));
      return Promise.resolve({ data: { items } });
    });
  });

  it("respeta el orden recibido, permite mover y conserva el contrato al guardar", async () => {
    const user = userEvent.setup();
    render(<OrdenBoletin />);

    expect(await screen.findByText("Biología")).toHaveAttribute(
      "translate",
      "no",
    );
    expect(screen.getByLabelText("Posición de Biología")).toHaveValue(1);
    expect(screen.getByLabelText("Posición de Matemáticas")).toHaveValue(2);
    expect(screen.getByLabelText("Posición de Arte")).toHaveValue(3);

    await user.click(screen.getByRole("button", { name: "Bajar Biología" }));

    expect(screen.getByLabelText("Posición de Matemáticas")).toHaveValue(1);
    expect(screen.getByLabelText("Posición de Biología")).toHaveValue(2);

    await user.click(
      screen.getByRole("button", { name: "Guardar orden" }),
    );

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/cursos/4/orden-boletin", {
        materias: [
          { materia_id: 20 },
          { materia_id: 10 },
          { materia_id: 30 },
        ],
      });
    });
    expect(
      await screen.findByText("Orden guardado correctamente."),
    ).toBeInTheDocument();
  });
});
