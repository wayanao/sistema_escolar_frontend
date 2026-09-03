import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, swalFireMock, swalShowLoadingMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
  swalFireMock: vi.fn(),
  swalShowLoadingMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: swalFireMock,
    showLoading: swalShowLoadingMock,
  },
}));

import Asistencia from "./Asistencia";

const ASIGNACION_ID = 44;
const PERIODO = 2;
const FECHA = "2026-07-31";
const ESTUDIANTES = [
  { estudiante_id: 101, nombre: "Ana", apellido: "Ruiz" },
  { estudiante_id: 102, nombre: "Luis", apellido: "Pérez" },
];
const CLASE = {
  id: ASIGNACION_ID,
  materia: "Matemáticas",
  curso: "5A",
};

function prepararApi({ historial = [], historialGet } = {}) {
  apiMock.get.mockImplementation((url) => {
    if (url === `/planilla-excel/${ASIGNACION_ID}/${PERIODO}`) {
      return Promise.resolve({ data: { data: ESTUDIANTES } });
    }

    if (url === `/asistencia/historial/${ASIGNACION_ID}/${PERIODO}`) {
      return historialGet
        ? historialGet()
        : Promise.resolve({ data: historial });
    }

    if (url === "/mis-clases/7") {
      return Promise.resolve({ data: [CLASE] });
    }

    return Promise.reject(new Error(`Consulta no simulada: ${url}`));
  });
  apiMock.post.mockResolvedValue({ data: {} });
}

async function abrirAsistencia() {
  render(<Asistencia />);

  await screen.findByText("Ruiz Ana");
  await screen.findByText("Historial actualizado");
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("profesor", JSON.stringify({ id: 7, nombre: "Docente" }));
  localStorage.setItem("asignacionId", String(ASIGNACION_ID));
  localStorage.setItem("periodo_profesor_7", String(PERIODO));
  localStorage.setItem("fechaAsistencia", FECHA);

  apiMock.get.mockReset();
  apiMock.post.mockReset();
  swalFireMock.mockReset();
  swalShowLoadingMock.mockReset();
  swalFireMock.mockResolvedValue({ isConfirmed: true });
  window.alert = vi.fn();
});

describe("flujo de asistencia del profesor", () => {
  it("carga estudiantes, clase e historial con la asignación y el período seleccionados", async () => {
    prepararApi({
      historial: [
        {
          estudiante_id: 101,
          historial: [{ fecha: "2026-07-29", estado: "ausente" }],
        },
      ],
    });

    await abrirAsistencia();

    expect(apiMock.get).toHaveBeenCalledWith(
      `/planilla-excel/${ASIGNACION_ID}/${PERIODO}`,
      { signal: expect.any(AbortSignal) },
    );
    expect(apiMock.get).toHaveBeenCalledWith(
      `/asistencia/historial/${ASIGNACION_ID}/${PERIODO}`,
      { signal: expect.any(AbortSignal) },
    );
    expect(apiMock.get).toHaveBeenCalledWith(
      "/mis-clases/7",
      { signal: expect.any(AbortSignal) },
    );
    expect(screen.getByText("Matemáticas")).toBeInTheDocument();
    expect(screen.getByText("5A")).toBeInTheDocument();
    expect(screen.getByText("Inasistencias: 1")).toBeInTheDocument();
  });

  it("bloquea el guardado mientras haya pendientes y confirma antes de reemplazar ausencias", async () => {
    prepararApi();
    const user = userEvent.setup();

    await abrirAsistencia();

    const guardar = screen.getByRole("button", { name: "Guardar asistencia" });
    expect(guardar).toBeDisabled();
    expect(screen.getByText("Falta marcar 2 estudiantes.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Marcar ausente a Ruiz Ana" }));
    expect(guardar).toBeDisabled();
    expect(screen.getByText("Falta marcar 1 estudiante.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "✔ Marcar todos presentes" }));

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "¿Marcar todos presentes?",
        confirmButtonText: "Sí, marcar todos",
        cancelButtonText: "Conservar marcación",
      }),
    );
    await waitFor(() => expect(guardar).toBeEnabled());
    expect(within(screen.getByLabelText("Resumen de asistencia")).getByText("2")).toBeInTheDocument();
  });

  it("envía el payload vigente de todos los estudiantes al guardar", async () => {
    prepararApi();
    const user = userEvent.setup();

    await abrirAsistencia();
    await user.click(screen.getByRole("button", { name: "✔ Marcar todos presentes" }));
    await user.click(screen.getByRole("button", { name: "Guardar asistencia" }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith("/asistencia", [
      {
        estudiante_id: 101,
        asignacion_id: ASIGNACION_ID,
        fecha: FECHA,
        estado: "presente",
        periodo: PERIODO,
      },
      {
        estudiante_id: 102,
        asignacion_id: ASIGNACION_ID,
        fecha: FECHA,
        estado: "presente",
        periodo: PERIODO,
      },
    ]);
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Guardar asistencia",
        confirmButtonText: "Sí, guardar asistencia",
      }),
    );
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Asistencia guardada",
        text: "2 presentes y 0 ausentes quedaron registrados correctamente.",
      }),
    );
  });

  it("recupera la marcación del día, permite editarla y restaurarla", async () => {
    prepararApi({
      historial: [
        {
          estudiante_id: 101,
          historial: [{ fecha: `${FECHA}T08:00:00`, estado: "presente" }],
        },
        {
          estudiante_id: 102,
          historial: [{ fecha: FECHA, estado: "ausente" }],
        },
      ],
    });
    const user = userEvent.setup();

    await abrirAsistencia();

    expect(await screen.findByText("Asistencia del día ya tomada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Marcar presente a Ruiz Ana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Marcar ausente a Ruiz Ana" }));
    expect(screen.getByText("Editando asistencia guardada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Restaurar guardado" }));
    expect(screen.getByText("Asistencia del día ya tomada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Marcar presente a Ruiz Ana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("bloquea temprano y avisa si el curso es preescolar y la clase no es la asignación de jornada", async () => {
    const CLASE_PREESCOLAR = {
      id: ASIGNACION_ID,
      materia: "Matemáticas",
      curso: "Transición A",
      nivel: "preescolar",
    };
    apiMock.get.mockImplementation((url) => {
      if (url === `/planilla-excel/${ASIGNACION_ID}/${PERIODO}`) {
        return Promise.resolve({ data: { data: ESTUDIANTES } });
      }
      if (url === `/asistencia/historial/${ASIGNACION_ID}/${PERIODO}`) {
        return Promise.resolve({ data: [] });
      }
      if (url === "/mis-clases/7") {
        return Promise.resolve({ data: [CLASE_PREESCOLAR] });
      }
      return Promise.reject(new Error(`Consulta no simulada: ${url}`));
    });
    apiMock.post.mockResolvedValue({ data: {} });

    render(<Asistencia />);

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        'Este curso es de preescolar. Usa la asignación "Asistencia diaria" para registrar asistencia.',
      ),
    );
  });

  it("no bloquea cuando la clase sí es la asignación de jornada en preescolar", async () => {
    const CLASE_JORNADA = {
      id: ASIGNACION_ID,
      materia: "Asistencia diaria",
      curso: "Transición A",
      nivel: "preescolar",
    };
    apiMock.get.mockImplementation((url) => {
      if (url === `/planilla-excel/${ASIGNACION_ID}/${PERIODO}`) {
        return Promise.resolve({ data: { data: ESTUDIANTES } });
      }
      if (url === `/asistencia/historial/${ASIGNACION_ID}/${PERIODO}`) {
        return Promise.resolve({ data: [] });
      }
      if (url === "/mis-clases/7") {
        return Promise.resolve({ data: [CLASE_JORNADA] });
      }
      return Promise.reject(new Error(`Consulta no simulada: ${url}`));
    });
    apiMock.post.mockResolvedValue({ data: {} });

    await abrirAsistencia();

    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByText("Asistencia diaria")).toBeInTheDocument();
  });

  it("reintenta una vez la carga del historial antes de mostrarlo", async () => {
    let intentosHistorial = 0;
    prepararApi({
      historialGet: () => {
        intentosHistorial += 1;
        if (intentosHistorial === 1) {
          return Promise.reject(new Error("Fallo temporal"));
        }
        return Promise.resolve({ data: [] });
      },
    });

    await abrirAsistencia();

    expect(intentosHistorial).toBe(2);
    expect(screen.queryByText("No se pudo cargar el historial de inasistencias. Intenta recargar.")).not.toBeInTheDocument();
  });
});
