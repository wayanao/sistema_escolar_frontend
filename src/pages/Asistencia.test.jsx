import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, swalFireMock, swalUpdateMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
  swalFireMock: vi.fn(),
  swalUpdateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

// La espera pasa a éxito en la misma ventana y la cierra un reloj
// (ventanaExito.js).
vi.mock("sweetalert2", () => ({
  default: {
    fire: swalFireMock,
    update: swalUpdateMock,
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
}));

import Asistencia from "./Asistencia";
import { opcionesExitoTrasEspera, opcionesVentanaEspera } from "../hooks/ventanaExito";
import { fechaIsoColombia } from "../utils/fechaColombia";

const ASIGNACION_ID = 44;
const PERIODO = 2;
// La asistencia arranca siempre en la fecha de hoy.
const FECHA = fechaIsoColombia();
const AYER = fechaIsoColombia(new Date(Date.now() - 24 * 60 * 60 * 1000));
// Lo que dejaba guardado el panel antes: ya no se usa.
const FECHA_VIEJA_DEL_PANEL = "2026-07-31";
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
  localStorage.setItem("fechaAsistencia", FECHA_VIEJA_DEL_PANEL);

  apiMock.get.mockReset();
  apiMock.post.mockReset();
  swalFireMock.mockReset();
  swalUpdateMock.mockReset();
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
    expect(screen.getByLabelText("Clase / grupo")).toHaveDisplayValue("Matemáticas - 5A");
    expect(screen.getByLabelText("Período")).toHaveValue(String(PERIODO));
    expect(screen.getByLabelText("Fecha")).toHaveValue(FECHA);
    expect(screen.getByText("Es la fecha de hoy.")).toBeInTheDocument();
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
    // Guarda enseguida: sin ventana de confirmar, solo la tarjeta de espera,
    // que pasa a éxito sin cerrarse.
    expect(swalFireMock).toHaveBeenCalledTimes(1);
    expect(swalFireMock).toHaveBeenCalledWith(
      opcionesVentanaEspera({ title: "Guardando asistencia…" }),
    );
    await waitFor(() =>
      expect(swalUpdateMock).toHaveBeenCalledWith(
        opcionesExitoTrasEspera({
          title: "Asistencia guardada",
          text: "2 presentes y 0 ausentes quedaron registrados correctamente.",
        }),
      ),
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

  it("en preescolar toma la asistencia con la «Asistencia diaria» del mismo curso, sin alerta y sin cambiar la clase guardada", async () => {
    const MATERIA_PREESCOLAR = {
      id: ASIGNACION_ID,
      materia: "DIMENSIÓN COMUNICATIVA",
      curso: "Transición A",
      curso_id: 5,
      nivel: "preescolar",
    };
    const JORNADA = {
      id: 45,
      materia: "ASISTENCIA DIARIA",
      curso: "Transición A",
      curso_id: 5,
      nivel: "preescolar",
    };
    apiMock.get.mockImplementation((url) => {
      if (url.startsWith("/planilla-excel/")) {
        return Promise.resolve({ data: { data: ESTUDIANTES } });
      }
      if (url.startsWith("/asistencia/historial/")) {
        return Promise.resolve({ data: [] });
      }
      if (url === "/mis-clases/7") {
        return Promise.resolve({ data: [MATERIA_PREESCOLAR, JORNADA] });
      }
      return Promise.reject(new Error(`Consulta no simulada: ${url}`));
    });
    apiMock.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();

    render(<Asistencia />);

    await waitFor(() =>
      expect(screen.getByLabelText("Clase / grupo")).toHaveDisplayValue(
        "Transición A - ASISTENCIA DIARIA",
      ),
    );
    await screen.findByText("Ruiz Ana");
    await screen.findByText("Historial actualizado");
    expect(
      screen.getByText("En preescolar la asistencia se toma una vez al día, con «Asistencia diaria»."),
    ).toBeInTheDocument();
    // La materia no se ofrece para asistencia: solo la de jornada.
    const opciones = within(screen.getByLabelText("Clase / grupo"))
      .getAllByRole("option")
      .map((opcion) => opcion.textContent);
    expect(opciones).toEqual(["Elige una clase", "Transición A - ASISTENCIA DIARIA"]);

    await user.click(screen.getByRole("button", { name: "✔ Marcar todos presentes" }));
    await user.click(screen.getByRole("button", { name: "Guardar asistencia" }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post.mock.calls[0][1].every((fila) => fila.asignacion_id === 45)).toBe(true);
    expect(window.alert).not.toHaveBeenCalled();
    // Al volver a la planilla sigue su materia.
    expect(localStorage.getItem("asignacionId")).toBe(String(ASIGNACION_ID));
  });

  it("en preescolar sin «Asistencia diaria» a nombre del profesor lo explica en vez de mostrar la lista", async () => {
    const MATERIA_PREESCOLAR = {
      id: ASIGNACION_ID,
      materia: "DIMENSIÓN COMUNICATIVA",
      curso: "Transición A",
      curso_id: 5,
      nivel: "preescolar",
    };
    apiMock.get.mockImplementation((url) => {
      if (url.startsWith("/planilla-excel/")) {
        return Promise.resolve({ data: { data: ESTUDIANTES } });
      }
      if (url.startsWith("/asistencia/historial/")) {
        return Promise.resolve({ data: [] });
      }
      if (url === "/mis-clases/7") {
        return Promise.resolve({ data: [MATERIA_PREESCOLAR] });
      }
      return Promise.reject(new Error(`Consulta no simulada: ${url}`));
    });

    render(<Asistencia />);

    expect(
      await screen.findByText("Este curso toma asistencia con «Asistencia diaria»"),
    ).toBeInTheDocument();
    expect(screen.getByText(/la asistencia de Transición A se toma una vez al día/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar asistencia" })).not.toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("muestra la lista cuando la clase guardada ya es la «Asistencia diaria» de preescolar", async () => {
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
    await waitFor(() =>
      expect(screen.getByLabelText("Clase / grupo")).toHaveDisplayValue(
        "Transición A - Asistencia diaria",
      ),
    );
  });

  it("sin clase guardada pide elegirla en la misma pantalla y al elegirla carga la lista", async () => {
    localStorage.removeItem("asignacionId");
    prepararApi();
    const user = userEvent.setup();

    render(<Asistencia />);

    expect(await screen.findByText("Elige arriba la clase")).toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText("Clase / grupo"), String(ASIGNACION_ID));

    await screen.findByText("Ruiz Ana");
    expect(localStorage.getItem("asignacionId")).toBe(String(ASIGNACION_ID));
  });

  it("cambiar la fecha guarda con esa fecha, avisa que no es hoy y deja volver a hoy", async () => {
    prepararApi();
    const user = userEvent.setup();

    await abrirAsistencia();

    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: AYER } });

    expect(await screen.findByText("No es hoy.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "✔ Marcar todos presentes" }));
    await user.click(screen.getByRole("button", { name: "Guardar asistencia" }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post.mock.calls[0][1].every((fila) => fila.fecha === AYER)).toBe(true);
    // La fecha no se recuerda: el panel ya no la usa.
    expect(localStorage.getItem("fechaAsistencia")).toBe(FECHA_VIEJA_DEL_PANEL);

    await user.click(screen.getByRole("button", { name: "Volver a hoy" }));
    await waitFor(() => expect(screen.getByLabelText("Fecha")).toHaveValue(FECHA));
    expect(screen.getByText("Es la fecha de hoy.")).toBeInTheDocument();
  });

  it("con asistencia sin guardar pregunta antes de cambiar la fecha y respeta «Seguir aquí»", async () => {
    prepararApi();
    const user = userEvent.setup();

    await abrirAsistencia();
    await user.click(screen.getByRole("button", { name: "Marcar ausente a Ruiz Ana" }));

    swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: AYER } });

    await waitFor(() =>
      expect(swalFireMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Tienes asistencia sin guardar",
          confirmButtonText: "Cambiar sin guardar",
          cancelButtonText: "Seguir aquí",
        }),
      ),
    );
    fireEvent.blur(screen.getByLabelText("Fecha"));
    expect(screen.getByLabelText("Fecha")).toHaveValue(FECHA);
    expect(screen.getByRole("button", { name: "Marcar ausente a Ruiz Ana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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
