import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../utils/api";
import Swal from "sweetalert2";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

import IngresoBoletinProfesor from "./IngresoBoletinProfesor";

const notasDe = (primeraObservacion, segundaObservacion) => [
  {
    tipo_nota: "logro_expresion_oral",
    tipo_evaluacion: "numerica",
    valor: 4,
    observacion_guardada: primeraObservacion,
  },
  {
    tipo_nota: "logro_lectura",
    tipo_evaluacion: "numerica",
    valor: 3,
    observacion_guardada: segundaObservacion,
  },
  {
    tipo_nota: "mas_alto",
    tipo_evaluacion: "numerica",
    valor: 5,
    observacion_guardada: "Dato técnico",
  },
];

describe("IngresoBoletinProfesor", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
    localStorage.setItem("asignacionId", "55");
    localStorage.setItem("periodo_profesor_7", "1");

    api.get.mockImplementation((url) => {
      if (url === "/mis-clases/7") {
        return Promise.resolve({
          data: [
            { id: 55, curso: "Quinto", materia: "Lengua Castellana" },
          ],
        });
      }

      if (url === "/boletines/referencia/55/1") {
        return Promise.resolve({
          data: [
            {
              estudiante_id: 101,
              nombre: "Ana",
              notas: notasDe("Logro común", ""),
            },
            {
              estudiante_id: 102,
              nombre: "Bruno",
              notas: notasDe("", "Caso individual"),
            },
          ],
        });
      }

      return Promise.reject(new Error(`GET inesperado: ${url}`));
    });
    api.post.mockResolvedValue({ data: {} });
    Swal.fire.mockImplementation((opciones) => {
      if (opciones?.title === "Aplicar logros al grupo") {
        return Promise.resolve({ isConfirmed: true, isDenied: false });
      }
      if (opciones?.title === "Guardar todo el grupo") {
        return Promise.resolve({ isConfirmed: true });
      }
      return Promise.resolve({});
    });
  });

  it("oculta campos técnicos, copia solo vacíos y conserva payloads individuales al guardar todo", async () => {
    const user = userEvent.setup();
    render(<IngresoBoletinProfesor />);

    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.queryByText("Mas Alto")).not.toBeInTheDocument();

    const etiquetaHumana = screen.getAllByText("Logro Expresion Oral")[0];
    expect(etiquetaHumana).toHaveAttribute("translate", "no");

    let observaciones = screen.getAllByRole("textbox");
    expect(observaciones).toHaveLength(4);
    expect(observaciones[2]).toHaveValue("");
    expect(observaciones[3]).toHaveValue("Caso individual");

    await user.click(
      screen.getByRole("button", {
        name: "Aplicar logros del primer estudiante",
      }),
    );

    await waitFor(() => {
      observaciones = screen.getAllByRole("textbox");
      expect(observaciones[2]).toHaveValue("Logro común");
      expect(observaciones[3]).toHaveValue("Caso individual");
    });

    await user.click(screen.getByRole("button", { name: "Guardar todo" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    expect(api.post).toHaveBeenNthCalledWith(1, "/boletines/guardar", {
      estudiante_id: 101,
      asignacion_id: 55,
      periodo: 1,
      definitiva: 3.5,
      detalles: [
        {
          nota: 4,
          observacion: "Logro común",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
        {
          nota: 3,
          observacion: "",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
      ],
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/boletines/guardar", {
      estudiante_id: 102,
      asignacion_id: 55,
      periodo: 1,
      definitiva: 3.5,
      detalles: [
        {
          nota: 4,
          observacion: "Logro común",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
        {
          nota: 3,
          observacion: "Caso individual",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
      ],
    });
  });

  it("permite salir y volver a una clase con más notas sin dejar la pantalla en blanco", async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((url) => {
      if (url === "/mis-clases/7") {
        return Promise.resolve({
          data: [
            { id: 55, curso: "Primero A", materia: "Matemáticas" },
            { id: 56, curso: "Primero A", materia: "Ciencias" },
          ],
        });
      }
      if (url === "/boletines/referencia/55/1") {
        return Promise.resolve({
          data: [
            {
              estudiante_id: 101,
              nombre: "Ana",
              notas: notasDe("Suma correctamente", "Resta correctamente"),
            },
          ],
        });
      }
      if (url === "/boletines/referencia/56/1") {
        return Promise.resolve({
          data: [
            {
              estudiante_id: 101,
              nombre: "Ana",
              notas: [
                {
                  tipo_nota: "entorno_natural",
                  tipo_evaluacion: "numerica",
                  valor: 4,
                  observacion_guardada: "Reconoce su entorno",
                },
              ],
            },
          ],
        });
      }
      return Promise.reject(new Error(`GET inesperado: ${url}`));
    });

    render(<IngresoBoletinProfesor />);

    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);

    const selectorClase = screen.getAllByRole("combobox")[0];
    await user.selectOptions(selectorClase, "56");
    await waitFor(() => {
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
      expect(screen.getByDisplayValue("Reconoce su entorno")).toBeInTheDocument();
    });

    await user.selectOptions(selectorClase, "55");
    await waitFor(() => {
      expect(screen.getAllByRole("textbox")).toHaveLength(2);
      expect(screen.getByDisplayValue("Suma correctamente")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Resta correctamente")).toBeInTheDocument();
    });
  });
});
