import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  crearAnotacionMock,
  editarAnotacionMock,
  firmarAnotacionMock,
  firmarAnotacionesDelPeriodoMock,
  guardarPeriodoProfesorMock,
  listarMisEstudiantesMock,
  obtenerFirmantesSugeridosMock,
  obtenerObservadorMock,
} = vi.hoisted(() => ({
  crearAnotacionMock: vi.fn(),
  editarAnotacionMock: vi.fn(),
  firmarAnotacionMock: vi.fn(),
  firmarAnotacionesDelPeriodoMock: vi.fn(),
  guardarPeriodoProfesorMock: vi.fn(),
  listarMisEstudiantesMock: vi.fn(),
  obtenerFirmantesSugeridosMock: vi.fn(),
  obtenerObservadorMock: vi.fn(),
}));

vi.mock("../services/observadorApi", () => ({
  crearAnotacion: crearAnotacionMock,
  editarAnotacion: editarAnotacionMock,
  firmarAnotacion: firmarAnotacionMock,
  firmarAnotacionesDelPeriodo: firmarAnotacionesDelPeriodoMock,
  listarMisEstudiantes: listarMisEstudiantesMock,
  obtenerFirmantesSugeridos: obtenerFirmantesSugeridosMock,
  obtenerObservador: obtenerObservadorMock,
}));

// El profesor eligio el periodo 3 en el Dashboard.
vi.mock("../utils/periodoProfesor", () => ({
  obtenerPeriodoProfesor: () => "3",
  guardarPeriodoProfesor: (valor) => {
    guardarPeriodoProfesorMock(valor);
    return String(valor);
  },
}));

// Guardar una anotación abre la tarjeta de espera y la pasa a éxito
// (ventanaExito.js): aquí no se pinta, solo se simula.
vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
    update: vi.fn(),
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
}));

import Observador from "./Observador";
import { IMAGEN_FALSA, instalarLienzoFalso } from "../test/lienzoFalso";

const ESTUDIANTES = [
  { estudiante_id: 11, nombre: "Ana", apellido: "Rojas", curso: "PRIMERO-A" },
  { estudiante_id: 12, nombre: "Luis", apellido: "Pardo", curso: "SEGUNDO" },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
  crearAnotacionMock.mockResolvedValue({ id: 31 });
  editarAnotacionMock.mockResolvedValue({ id: 12 });
  listarMisEstudiantesMock.mockResolvedValue(ESTUDIANTES);
  obtenerObservadorMock.mockResolvedValue({
    nivel: "primaria",
    anotaciones: [
      {
        id: 12,
        profesor_id: 7,
        profesor: "Ana Gómez",
        periodo: 1,
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
  it("abre sin ninguna clase elegida, con una sola petición", async () => {
    // Ni siquiera hay `asignacionId` en el navegador: el observador es del niño
    // y no de la materia.
    expect(localStorage.getItem("asignacionId")).toBeNull();
    render(<Observador />);

    expect(await screen.findByRole("button", { name: "Ana Rojas" })).toBeInTheDocument();
    expect(listarMisEstudiantesMock).toHaveBeenCalledTimes(1);
  });

  it("agrupa la lista por curso", async () => {
    render(<Observador />);
    await screen.findByRole("button", { name: "Ana Rojas" });

    expect(screen.getByRole("heading", { name: /PRIMERO-A/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /SEGUNDO/ })).toBeInTheDocument();
  });

  it("no pide ninguna bitácora hasta que se abre un alumno", async () => {
    render(<Observador />);
    await screen.findByRole("button", { name: "Ana Rojas" });

    // Aquí muere el fallo del usuario: la pantalla vieja montaba un componente
    // por alumno y cada uno pedía lo suyo -12 peticiones, 16-20 s, y el hook se
    // rendía a los 10 s-. Esta lista no pide ninguna bitácora.
    expect(obtenerObservadorMock).not.toHaveBeenCalled();
  });

  it("al abrir un alumno hace una sola petición, del año entero", async () => {
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));

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
    await screen.findByRole("button", { name: "Ana Rojas" });

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "luis");

    expect(screen.getByRole("button", { name: "Luis Pardo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ana Rojas" })).not.toBeInTheDocument();
    expect(listarMisEstudiantesMock).toHaveBeenCalledTimes(1);
  });

  it("vuelve a la lista sin perder el buscador", async () => {
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    await user.click(screen.getByRole("button", { name: "← Volver a la lista" }));

    expect(screen.getByRole("button", { name: "Ana Rojas" })).toBeInTheDocument();
  });

  it("traduce el 404 a «no existe», que no es lo mismo que no tener nada escrito", async () => {
    obtenerObservadorMock.mockRejectedValue({ response: { status: 404 } });
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));

    expect(
      await screen.findByText("No encontramos a ese estudiante."),
    ).toBeInTheDocument();
  });

  it("traduce cualquier otro fallo a un aviso distinto", async () => {
    obtenerObservadorMock.mockRejectedValue({ response: { status: 500 } });
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));

    expect(
      await screen.findByText("No se pudo consultar el observador. Intenta de nuevo."),
    ).toBeInTheDocument();
  });

  async function abrirAnaYAnotar(user) {
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });
    await user.click(screen.getByRole("button", { name: "Nueva anotación" }));
  }

  it("guarda una anotación nueva con el período de trabajo y el texto corregido", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await abrirAnaYAnotar(user);

    // El periodo se le queda pegado para siempre, así que se ve y se elige
    // antes de guardar; arranca en el de trabajo.
    expect(screen.getByLabelText("Período de esta anotación")).toHaveValue("3");

    await user.type(screen.getByLabelText("Conductual"), "se para mucho.hace desorden");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(crearAnotacionMock).toHaveBeenCalledTimes(1));
    expect(crearAnotacionMock).toHaveBeenCalledWith({
      estudiante_id: 11,
      // El 3 es el período de trabajo, no el del selector de la pantalla, que
      // está en "Todos".
      periodo: 3,
      conductual: "Se para mucho. Hace desorden",
      cognitivo: "",
      lenguaje: "",
    });
  });

  it("si cambia el período en el formulario, la anotación se guarda en ese y queda como período de trabajo", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await abrirAnaYAnotar(user);

    await user.selectOptions(screen.getByLabelText("Período de esta anotación"), "4");
    expect(guardarPeriodoProfesorMock).toHaveBeenCalledWith("4");

    await user.type(screen.getByLabelText("Cognitivo"), "Mejoró en las tablas.");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(crearAnotacionMock).toHaveBeenCalledTimes(1));
    expect(crearAnotacionMock.mock.calls[0][0].periodo).toBe(4);
  });

  it("después de guardar cierra el formulario y refresca la bitácora una vez", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await abrirAnaYAnotar(user);

    await user.type(screen.getByLabelText("Cognitivo"), "Mejoró en las tablas.");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    // Una sola recarga: la de abrir el alumno más la de después de guardar.
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByLabelText("Cognitivo")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva anotación" })).toBeInTheDocument();
  });

  it("si el selector filtra otro periodo, pasa a «Todos» para que lo escrito se vea", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    await user.selectOptions(screen.getByRole("combobox", { name: /Periodo/ }), "2");
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));

    await user.click(screen.getByRole("button", { name: "Nueva anotación" }));
    await user.type(screen.getByLabelText("Conductual"), "Algo nuevo.");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    // La anotación nace en el periodo 3 y el selector estaba en el 2: sin esto
    // no aparecería y la profesora creería que no se guardó.
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(3));
    expect(obtenerObservadorMock.mock.calls[2][1].periodo).toBeNull();
    expect(screen.getByRole("combobox", { name: /Periodo/ })).toHaveValue("todos");
  });

  it("corrige una anotación propia sin tocar su periodo", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    await user.click(screen.getByRole("button", { name: "Editar" }));

    // Llega precargada con lo que ya decía.
    expect(screen.getByLabelText("Conductual")).toHaveValue("Se para mucho.");
    expect(
      screen.getByText("Al corregir no cambia el periodo ni el estudiante."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Conductual"));
    await user.type(screen.getByLabelText("Conductual"), "ya no se para.");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(editarAnotacionMock).toHaveBeenCalledTimes(1));
    expect(editarAnotacionMock).toHaveBeenCalledWith(12, {
      conductual: "Ya no se para.",
      cognitivo: "",
      lenguaje: "",
    });
    expect(crearAnotacionMock).not.toHaveBeenCalled();
  });

  it("no ofrece editar la anotación de otro profesor", async () => {
    obtenerObservadorMock.mockResolvedValue({
      nivel: "primaria",
      anotaciones: [{
        id: 13,
        profesor_id: 8,
        profesor: "Luis Díaz",
        periodo: 1,
        conductual: "De otro profesor.",
        cognitivo: "",
        lenguaje: "",
        creada_en: "2026-03-18T12:00:00Z",
        editada_en: null,
        editada_por: null,
      }],
    });
    const user = userEvent.setup();
    render(<Observador />);

    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    expect(await screen.findByText("De otro profesor.")).toBeInTheDocument();

    // Es cosmético: el servidor responde 403 si alguien lo intenta igual.
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("enseña el mensaje del servidor si el guardado falla, sin cerrar el formulario", async () => {
    crearAnotacionMock.mockRejectedValue({
      response: {
        status: 403,
        data: { detail: "Solo un profesor del estudiante puede escribir en el observador." },
      },
    });
    const user = userEvent.setup();
    render(<Observador />);
    await abrirAnaYAnotar(user);

    await user.type(screen.getByLabelText("Conductual"), "Algo.");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Solo un profesor del estudiante puede escribir en el observador."),
    ).toBeInTheDocument();
    // No se cierra: lo escrito no se pierde por un fallo del servidor.
    expect(screen.getByLabelText("Conductual")).toHaveValue("Algo.");
  });

  it("deja guardar en cuanto hay algo escrito, sin pedir nada más", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await abrirAnaYAnotar(user);

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();

    await user.type(screen.getByLabelText("Conductual"), "Algo escrito.");

    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
    // Ya no hay ningun paso de elegir si es buena o mala.
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("cambia a la vista por fecha sin volver a consultar al servidor", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    expect(obtenerObservadorMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Por fecha" }));

    expect(screen.getByText("Conductual:")).toBeInTheDocument();
    // Invariante 1: cambiar de vista es presentacion, no otra peticion.
    expect(obtenerObservadorMock).toHaveBeenCalledTimes(1);
  });

  it("imprime todo el observador, con lo que está en pantalla", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    await user.selectOptions(screen.getByRole("combobox", { name: /Imprimir/ }), "todo");

    expect(
      await screen.findByRole("heading", { name: "Observador del Estudiante" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Estudiante: Ana Rojas · Primaria · Año completo"),
    ).toBeInTheDocument();
    expect(screen.getByText("Director de grupo")).toBeInTheDocument();
    // Imprimir tampoco vuelve a preguntarle nada al servidor.
    expect(obtenerObservadorMock).toHaveBeenCalledTimes(1);
  });

  it("«Solo mis anotaciones» deja fuera las de otros profesores", async () => {
    obtenerObservadorMock.mockResolvedValue({
      nivel: "primaria",
      anotaciones: [
        {
          id: 12, profesor_id: 7, profesor: "Ana Gómez", periodo: 1,
          conductual: "Mía.", cognitivo: "", lenguaje: "",
          creada_en: "2026-03-20T12:00:00Z", editada_en: null, editada_por: null,
        },
        {
          id: 13, profesor_id: 8, profesor: "Luis Díaz", periodo: 1,
          conductual: "De otro profesor.", cognitivo: "", lenguaje: "",
          creada_en: "2026-03-18T12:00:00Z", editada_en: null, editada_por: null,
        },
      ],
    });
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByText("De otro profesor.");

    await user.selectOptions(screen.getByRole("combobox", { name: /Imprimir/ }), "mias");

    expect(await screen.findByText("Mía.")).toBeInTheDocument();
    expect(screen.queryByText("De otro profesor.")).not.toBeInTheDocument();
    expect(screen.getByText("Firma del Profesor")).toBeInTheDocument();
  });

  it("el impreso respeta el periodo que marque el selector", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    await user.selectOptions(screen.getByRole("combobox", { name: /Periodo/ }), "2");
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));

    await user.selectOptions(screen.getByRole("combobox", { name: /Imprimir/ }), "todo");

    expect(
      await screen.findByText("Estudiante: Ana Rojas · Primaria · Periodo 2"),
    ).toBeInTheDocument();
  });

  it("se puede volver del impreso a la pantalla", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await screen.findByRole("heading", { name: /Observador de Ana Rojas/ });

    await user.selectOptions(screen.getByRole("combobox", { name: /Imprimir/ }), "todo");
    await screen.findByRole("button", { name: "← Volver" });

    await user.click(screen.getByRole("button", { name: "← Volver" }));

    expect(
      await screen.findByRole("heading", { name: /Observador de Ana Rojas/ }),
    ).toBeInTheDocument();
  });

  it("ya no manda a elegir asignación, ni aunque haya una guardada", async () => {
    // Antes, sin `asignacionId`, la pantalla soltaba un alert y te echaba al
    // inicio. Esa dependencia se quito el 2026-09-09.
    localStorage.setItem("asignacionId", "44");
    const alerta = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<Observador />);
    await screen.findByRole("button", { name: "Ana Rojas" });

    expect(alerta).not.toHaveBeenCalled();
    // Y la clase guardada no llega al servidor: no pinta nada en esta pantalla.
    expect(listarMisEstudiantesMock.mock.calls[0][0]).not.toHaveProperty("asignacionId");
    alerta.mockRestore();
  });

  it("dice que esta pantalla es de profesores si el servidor responde 403", async () => {
    listarMisEstudiantesMock.mockRejectedValue({ response: { status: 403 } });
    render(<Observador />);

    expect(
      await screen.findByText(
        "Esta pantalla es para profesores. Abre el observador desde la ficha del estudiante.",
      ),
    ).toBeInTheDocument();
  });
});

describe("página del Observador: firma del acudiente", () => {
  const PENDIENTE = {
    id: 12,
    profesor_id: 7,
    profesor: "Ana Gómez",
    periodo: 1,
    conductual: "Se para mucho.",
    cognitivo: "",
    lenguaje: "",
    creada_en: "2026-03-20T12:00:00Z",
    editada_en: null,
    editada_por: null,
    version: "v12",
    puede_firmar: true,
    firma: null,
  };
  const MADRE = {
    parentesco: "Madre",
    nombre: "Maria Lopez",
    tipo_documento: "Cédula",
    documento: "52123456",
  };
  const FIRMA = {
    firmante_nombre: "Maria Lopez",
    firmante_parentesco: "Madre",
    firmante_tipo_documento: "Cédula",
    firmante_documento_enmascarado: "****3456",
    firmada_en: "2026-10-27T15:00:00Z",
    tomada_por_nombre: "Ana Gómez",
    integra: true,
  };

  beforeEach(() => {
    instalarLienzoFalso();
    obtenerObservadorMock.mockResolvedValue({ nivel: "primaria", anotaciones: [PENDIENTE] });
    obtenerFirmantesSugeridosMock.mockResolvedValue([MADRE]);
    firmarAnotacionMock.mockResolvedValue({ id: 99, anotacion_id: 12, ...FIRMA });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("firma una anotación con la madre de la ficha y vuelve a pedir la bitácora", async () => {
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await user.click(await screen.findByRole("button", { name: "Firmar con el acudiente" }));

    const ventana = screen.getByRole("dialog", { name: "Firma del acudiente" });
    expect(within(ventana).getByText("Se para mucho.")).toBeInTheDocument();

    await user.click(await within(ventana).findByRole("button", { name: "Madre: Maria Lopez" }));
    const lienzo = within(ventana).getByRole("img", { name: "Recuadro para la firma del acudiente" });
    fireEvent.pointerDown(lienzo, { pointerId: 1 });
    fireEvent.pointerUp(lienzo, { pointerId: 1 });
    await user.click(within(ventana).getByLabelText("El acudiente leyó esta anotación."));
    await user.click(within(ventana).getByRole("button", { name: "Guardar firma" }));

    await waitFor(() => expect(firmarAnotacionMock).toHaveBeenCalledTimes(1));
    // Quién la toma y la hora no viajan: los pone el servidor.
    expect(firmarAnotacionMock).toHaveBeenCalledWith(12, {
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: IMAGEN_FALSA,
      version: "v12",
    });
    expect(await within(ventana).findByRole("status")).toHaveTextContent("Firma guardada.");
    // La de abrir el alumno y la de después de firmar: así aparece el sello.
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));
  });

  it("una anotación propia ya firmada lleva su sello y no ofrece editar ni firmar", async () => {
    obtenerObservadorMock.mockResolvedValue({
      nivel: "primaria",
      anotaciones: [{ ...PENDIENTE, puede_firmar: false, firma: FIRMA }],
    });
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));

    expect(await screen.findByText(/Firmada por Maria Lopez \(Madre\)/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Firmar con el acudiente" })).not.toBeInTheDocument();
  });

  it("firma todas las pendientes de un periodo con una sola firma", async () => {
    const OTRA = { ...PENDIENTE, id: 13, conductual: "Tampoco trae tareas.", version: "v13" };
    obtenerObservadorMock.mockResolvedValue({ nivel: "primaria", anotaciones: [PENDIENTE, OTRA] });
    firmarAnotacionesDelPeriodoMock.mockResolvedValue([
      { id: 99, anotacion_id: 12, ...FIRMA },
      { id: 100, anotacion_id: 13, ...FIRMA },
    ]);
    const user = userEvent.setup();
    render(<Observador />);
    await user.click(await screen.findByRole("button", { name: "Ana Rojas" }));
    await user.click(await screen.findByRole("button", { name: "Firmar un periodo" }));

    const ventana = screen.getByRole("dialog", { name: "Firma del acudiente" });
    // El acudiente ve las dos antes de firmar.
    expect(within(ventana).getByText("Se para mucho.")).toBeInTheDocument();
    expect(within(ventana).getByText("Tampoco trae tareas.")).toBeInTheDocument();

    await user.click(await within(ventana).findByRole("button", { name: "Madre: Maria Lopez" }));
    const lienzo = within(ventana).getByRole("img", { name: "Recuadro para la firma del acudiente" });
    fireEvent.pointerDown(lienzo, { pointerId: 1 });
    fireEvent.pointerUp(lienzo, { pointerId: 1 });
    await user.click(within(ventana).getByLabelText("El acudiente leyó estas 2 anotaciones."));
    await user.click(within(ventana).getByRole("button", { name: "Guardar firma (2)" }));

    await waitFor(() => expect(firmarAnotacionesDelPeriodoMock).toHaveBeenCalledTimes(1));
    expect(firmarAnotacionesDelPeriodoMock).toHaveBeenCalledWith(11, {
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: IMAGEN_FALSA,
      anotaciones: [{ id: 12, version: "v12" }, { id: 13, version: "v13" }],
    });
    expect(await within(ventana).findByRole("status")).toHaveTextContent(
      "Firma guardada en 2 anotaciones.",
    );
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));
  });
});
