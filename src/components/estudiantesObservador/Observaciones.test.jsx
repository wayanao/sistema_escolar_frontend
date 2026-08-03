import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiGetMock, apiPostMock, swalFireMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
  swalFireMock: vi.fn(),
}));

vi.mock("../../utils/api", () => ({
  default: {
    get: apiGetMock,
    post: apiPostMock,
  },
}));

vi.mock("sweetalert2", () => ({
  default: { fire: swalFireMock },
}));

vi.mock("../impresion/DocumentoImprimible", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

import Observaciones from "./Observaciones";

const estudianteAna = {
  estudiante_id: 11,
  nombre: "Ana",
  apellido: "Rojas",
};

const estudianteLuis = {
  estudiante_id: 12,
  nombre: "Luis",
  apellido: "Pardo",
};

function crearPendiente() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

function campoConductual() {
  return screen.getByPlaceholderText(
    "Observaciones sobre el comportamiento del estudiante...",
  );
}

function instalarIntersectionObserver() {
  let callback;
  const observe = vi.fn();
  const disconnect = vi.fn();

  class IntersectionObserverMock {
    constructor(observerCallback) {
      callback = observerCallback;
    }

    observe = observe;
    disconnect = disconnect;
    unobserve = vi.fn();
  }

  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

  return {
    observe,
    disconnect,
    activar: async () => {
      await act(async () => {
        callback([{ isIntersecting: true }]);
      });
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(
    "profesor",
    JSON.stringify({ id: 7, nombre: "Sara", apellido: "Díaz" }),
  );
  swalFireMock.mockResolvedValue({ isConfirmed: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Observaciones", () => {
  it("consulta y presenta el registro del estudiante, asignación y periodo vigentes", async () => {
    apiGetMock.mockResolvedValue({
      status: 200,
      data: {
        conductual: "Participa con respeto",
        cognitivo: "Resuelve los ejercicios",
        lenguaje: "Expone con claridad",
      },
    });

    render(
      <Observaciones
        estudiante={estudianteAna}
        asignacionId="44"
        periodo="2"
      />,
    );

    await waitFor(() =>
      expect(apiGetMock).toHaveBeenCalledWith(
        "/observaciones/11/44/2",
        { signal: expect.any(AbortSignal) },
      ),
    );
    expect(await screen.findByDisplayValue("Participa con respeto")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Resuelve los ejercicios")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Expone con claridad")).toBeInTheDocument();
    expect(screen.getByText("Guardado")).toBeInTheDocument();
  });

  it("descarta la respuesta tardía del estudiante anterior al cambiar de tarjeta", async () => {
    const respuestaAna = crearPendiente();
    const respuestaLuis = crearPendiente();
    apiGetMock
      .mockImplementationOnce(() => respuestaAna.promise)
      .mockImplementationOnce(() => respuestaLuis.promise);

    const { rerender } = render(
      <Observaciones
        estudiante={estudianteAna}
        asignacionId="44"
        periodo="2"
      />,
    );

    await waitFor(() => expect(apiGetMock).toHaveBeenCalledTimes(1));

    rerender(
      <Observaciones
        estudiante={estudianteLuis}
        asignacionId="44"
        periodo="2"
      />,
    );

    await waitFor(() => expect(apiGetMock).toHaveBeenCalledTimes(2));
    await act(async () => {
      respuestaLuis.resolve({
        status: 200,
        data: {
          conductual: "Registro de Luis",
          cognitivo: "",
          lenguaje: "",
        },
      });
      await respuestaLuis.promise;
    });
    expect(await screen.findByDisplayValue("Registro de Luis")).toBeInTheDocument();

    await act(async () => {
      respuestaAna.resolve({
        status: 200,
        data: {
          conductual: "Registro tardío de Ana",
          cognitivo: "No debe aparecer",
          lenguaje: "No debe aparecer",
        },
      });
      await respuestaAna.promise;
    });

    expect(campoConductual()).toHaveValue("Registro de Luis");
    expect(screen.queryByDisplayValue("Registro tardío de Ana")).not.toBeInTheDocument();
  });

  it("conserva el contrato de guardado parcial y asocia el payload al estudiante visible", async () => {
    const user = userEvent.setup();
    apiGetMock.mockResolvedValue({ status: 200, data: null });
    apiPostMock.mockResolvedValue({ status: 201, data: { id: 91 } });

    render(
      <Observaciones
        estudiante={estudianteLuis}
        asignacionId="44"
        periodo="3"
      />,
    );

    expect(await screen.findByText("Pendiente")).toBeInTheDocument();
    await user.type(campoConductual(), "  Avance conductual  ");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(apiPostMock).toHaveBeenCalledWith("/observaciones", {
        estudiante_id: 12,
        asignacion_id: 44,
        periodo: 3,
        conductual: "Avance conductual",
        cognitivo: "",
        lenguaje: "",
      }),
    );
    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        text: "Se guardaron 1 de 3 dimensiones para Luis Pardo.",
      }),
    );
  });

  it("espera a que la tarjeta sea visible antes de consultar", async () => {
    const observer = instalarIntersectionObserver();
    apiGetMock.mockResolvedValue({ status: 200, data: null });

    render(
      <Observaciones
        estudiante={estudianteAna}
        asignacionId="44"
        periodo="2"
      />,
    );

    expect(observer.observe).toHaveBeenCalledTimes(1);
    expect(apiGetMock).not.toHaveBeenCalled();

    await observer.activar();

    await waitFor(() => expect(apiGetMock).toHaveBeenCalledTimes(1));
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it("distingue un fallo de carga y permite reintentar", async () => {
    const user = userEvent.setup();
    apiGetMock
      .mockRejectedValueOnce(new Error("Conexión agotada"))
      .mockResolvedValueOnce({
        status: 200,
        data: {
          conductual: "Registro recuperado",
          cognitivo: "",
          lenguaje: "",
        },
      });

    render(
      <Observaciones
        estudiante={estudianteAna}
        asignacionId="44"
        periodo="2"
      />,
    );

    expect(await screen.findByText("No se pudo cargar")).toBeInTheDocument();
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
    expect(campoConductual()).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findByDisplayValue("Registro recuperado"),
    ).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledTimes(2);
  });

  it("recupera la observación al salir y volver a montar la tarjeta", async () => {
    const user = userEvent.setup();
    let observacionGuardada = null;
    apiGetMock.mockImplementation(() =>
      Promise.resolve({ status: 200, data: observacionGuardada }),
    );
    apiPostMock.mockImplementation((_url, payload) => {
      observacionGuardada = payload;
      return Promise.resolve({ status: 201, data: { id: 91 } });
    });

    const vista = render(
      <Observaciones
        estudiante={estudianteLuis}
        asignacionId="44"
        periodo="3"
      />,
    );

    expect(await screen.findByText("Pendiente")).toBeInTheDocument();
    await user.type(campoConductual(), "Avance persistente");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(apiPostMock).toHaveBeenCalledTimes(1));

    vista.unmount();
    render(
      <Observaciones
        estudiante={estudianteLuis}
        asignacionId="44"
        periodo="3"
      />,
    );

    expect(
      await screen.findByDisplayValue("Avance persistente"),
    ).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledTimes(2);
  });
});
