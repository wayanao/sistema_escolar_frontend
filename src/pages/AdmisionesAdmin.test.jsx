import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  anioLectivo: null,
  actualizarAdmision: vi.fn(),
  borrarAdmision: vi.fn(),
  cambiarResultadoAdmision: vi.fn(),
  listarAdmisiones: vi.fn(),
  listarCursos: vi.fn(),
  matricularAdmision: vi.fn(),
  obtenerEstudiante: vi.fn(),
  obtenerAdmision: vi.fn(),
  obtenerCuestionarioAdmision: vi.fn(),
  obtenerEstadoTenant: vi.fn(),
  registrarAdmision: vi.fn(),
  swalFire: vi.fn(),
}));

vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => mocks.anioLectivo,
}));
vi.mock("../services/admisionesApi", () => ({
  actualizarAdmision: mocks.actualizarAdmision,
  borrarAdmision: mocks.borrarAdmision,
  cambiarResultadoAdmision: mocks.cambiarResultadoAdmision,
  listarAdmisiones: mocks.listarAdmisiones,
  matricularAdmision: mocks.matricularAdmision,
  obtenerAdmision: mocks.obtenerAdmision,
  obtenerCuestionarioAdmision: mocks.obtenerCuestionarioAdmision,
  registrarAdmision: mocks.registrarAdmision,
}));
vi.mock("../services/autenticacionApi", () => ({
  obtenerEstadoTenant: mocks.obtenerEstadoTenant,
}));
vi.mock("../services/cursosApi", () => ({
  listarCursos: mocks.listarCursos,
}));
vi.mock("../services/estudiantesObservadorApi", () => ({
  actualizarEstudiante: vi.fn(),
  crearEstudiante: vi.fn(),
  obtenerEstudiante: mocks.obtenerEstudiante,
}));
vi.mock("sweetalert2", () => ({
  default: { fire: mocks.swalFire },
}));
// Paso E12: el impreso pide la identidad del colegio y la plantilla.
vi.mock("../hooks/certificadosImpresion/usePrintConfig", () => ({
  default: () => ({
    branding: { nombre_institucion: "Colegio de Prueba" },
    plantilla: { config_json: {} },
    loading: false,
    error: null,
  }),
}));

import AdmisionesAdmin from "./AdmisionesAdmin";

const ACTIVO = { id: 2, anio: 2026, estado: "activo" };
const PREPARACION = { id: 3, anio: 2027, estado: "preparacion" };

const LISTA = {
  anio_lectivo: PREPARACION,
  editable: true,
  conteos: { pendiente: 1, aprobado: 1, no_aprobado: 0, matriculado: 1, total: 2 },
  admisiones: [
    { id: 7, nombre: "Lina", apellido: "Díaz", resultado: "pendiente", estudiante_id: null, matriculada: false },
    { id: 8, nombre: "Juan", apellido: "Ríos", resultado: "aprobado", estudiante_id: 55, matriculada: true },
  ],
};

const DETALLE = {
  id: 7,
  anio_lectivo_id: 3,
  nombre: "Lina",
  apellido: "Díaz",
  tipo_documento: "Registro Civil",
  documento_identidad: "2001",
  curso_id: 20,
  autoriza_datos: true,
  autoriza_nombre: "Marta Díaz",
  resultado: "pendiente",
  motivo_resultado: null,
  editable: true,
  matriculada: false,
  aviso_documento: null,
};

// Paso E11: una lista corta, con la forma de `GET /admisiones/cuestionario`.
const CUESTIONARIO = [
  {
    clave: "salud",
    titulo: "Salud",
    preguntas: [
      {
        numero: 18,
        clave: "usa_panal",
        texto: "¿Usa pañal desechable?",
        tipo: "si_no",
        opciones: [
          { valor: "si", etiqueta: "Sí" },
          { valor: "no", etiqueta: "No" },
        ],
      },
    ],
  },
];

function pintar() {
  return render(
    <MemoryRouter>
      <AdmisionesAdmin />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.anioLectivo = { anios: [PREPARACION, ACTIVO], cargando: false };
  mocks.listarAdmisiones.mockResolvedValue(LISTA);
  mocks.listarCursos.mockResolvedValue([{ id: 20, nombre: "PRIMERO A", jornada: "Mañana" }]);
  mocks.obtenerAdmision.mockResolvedValue(DETALLE);
  mocks.obtenerCuestionarioAdmision.mockResolvedValue({ secciones: CUESTIONARIO });
  mocks.swalFire.mockResolvedValue({ isConfirmed: true });
  mocks.obtenerEstadoTenant.mockResolvedValue({
    estado: "activo",
    mostrar_aviso: false,
    mensaje: "",
    usa_entrevista_admision: true,
  });
});

describe("AdmisionesAdmin", () => {
  // 2026-10-30: la entrevista solo en los colegios que la usan.
  it("en un colegio que no usa la entrevista lo dice y lleva a Años lectivos", async () => {
    mocks.obtenerEstadoTenant.mockResolvedValue({
      estado: "activo",
      mostrar_aviso: false,
      mensaje: "",
      usa_entrevista_admision: false,
    });

    pintar();

    expect(
      await screen.findByText(/Este colegio no usa la entrevista de admisión/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Años lectivos" })).toHaveAttribute(
      "href",
      "/admin/anios-lectivos",
    );
    expect(screen.queryByRole("button", { name: /Nuevo aspirante/ })).not.toBeInTheDocument();
  });

  it("sin año en preparación no pregunta si el colegio usa la entrevista", () => {
    mocks.anioLectivo = { anios: [ACTIVO], cargando: false };

    pintar();

    expect(mocks.obtenerEstadoTenant).not.toHaveBeenCalled();
  });

  it("sin año en preparación dice cómo crearlo y no pide admisiones", () => {
    mocks.anioLectivo = { anios: [ACTIVO], cargando: false };

    pintar();

    expect(screen.getByText(/No hay un año en preparación/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Años lectivos" })).toHaveAttribute(
      "href",
      "/admin/anios-lectivos",
    );
    expect(mocks.listarAdmisiones).not.toHaveBeenCalled();
  });

  it("lista los aspirantes del año en preparación con sus conteos", async () => {
    pintar();

    expect(await screen.findByRole("listitem", { name: "Lina Díaz" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Admisiones 2027" })).toBeInTheDocument();
    expect(mocks.listarAdmisiones).toHaveBeenCalledWith(3, { signal: expect.any(AbortSignal) });
    expect(mocks.listarCursos).toHaveBeenCalledWith("activo", {
      signal: expect.any(AbortSignal),
      parametrosAnio: { anio_lectivo_id: 3 },
    });
    expect(screen.getByRole("button", { name: "Todos (2)" })).toBeInTheDocument();
  });

  it("filtrar no vuelve a pedir la lista", async () => {
    const user = userEvent.setup();
    pintar();
    await screen.findByRole("listitem", { name: "Lina Díaz" });

    await user.click(screen.getByRole("button", { name: "Aprobados (1)" }));

    expect(screen.queryByRole("listitem", { name: "Lina Díaz" })).not.toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "Juan Ríos" })).toBeInTheDocument();
    expect(mocks.listarAdmisiones).toHaveBeenCalledTimes(1);
  });

  it("registra un aspirante y abre su ficha para la entrevista", async () => {
    const user = userEvent.setup();
    mocks.registrarAdmision.mockResolvedValue(DETALLE);
    pintar();
    await screen.findByRole("listitem", { name: "Lina Díaz" });

    await user.click(screen.getByRole("button", { name: "Nuevo aspirante" }));
    await user.click(screen.getByRole("button", { name: "Registrar aspirante" }));

    expect(mocks.registrarAdmision).not.toHaveBeenCalled();
    expect(
      screen.getByText("Sin la autorización de datos no se puede registrar al aspirante."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre *"), "Lina");
    await user.type(screen.getByLabelText("Apellidos *"), "Díaz");
    await user.selectOptions(screen.getByLabelText("Curso al que aspira"), "20");
    await user.click(screen.getByLabelText(/La familia autoriza el tratamiento de estos datos/));
    await user.type(screen.getByLabelText("Quién autoriza *"), "Marta Díaz");
    await user.click(screen.getByRole("button", { name: "Registrar aspirante" }));

    expect(mocks.registrarAdmision).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        nombre: "Lina",
        apellido: "Díaz",
        curso_id: 20,
        autoriza_datos: true,
        autoriza_nombre: "Marta Díaz",
      }),
    );
    expect(
      await screen.findByText(
        "Se registró a Lina Díaz como aspirante. Ahora puedes escribir la entrevista.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Quién entrevistó")).toBeInTheDocument();
    expect(mocks.listarAdmisiones).toHaveBeenCalledTimes(2);
  });

  it("escribe la entrevista y la guarda con los datos del aspirante", async () => {
    const user = userEvent.setup();
    mocks.actualizarAdmision.mockResolvedValue({ ...DETALLE, entrevistador: "Psicóloga Ruiz" });
    pintar();

    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
    await user.type(await screen.findByLabelText("Quién entrevistó"), "Psicóloga Ruiz");
    await user.click(screen.getByRole("button", { name: "Guardar datos y entrevista" }));

    expect(mocks.actualizarAdmision).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ nombre: "Lina", entrevistador: "Psicóloga Ruiz" }),
    );
    expect(
      await screen.findByText("Se guardaron los datos y la entrevista de Lina Díaz."),
    ).toBeInTheDocument();
  });

  it("no aprobar pide el motivo antes de enviar", async () => {
    const user = userEvent.setup();
    mocks.cambiarResultadoAdmision.mockResolvedValue({
      ...DETALLE,
      resultado: "no_aprobado",
      motivo_resultado: "Cupo lleno",
    });
    pintar();
    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));

    await user.click(await screen.findByRole("radio", { name: "No aprobado" }));
    await user.click(screen.getByRole("button", { name: "Guardar resultado" }));

    expect(mocks.cambiarResultadoAdmision).not.toHaveBeenCalled();
    expect(screen.getByText('Para marcar "No aprobado" escribe el motivo.')).toBeInTheDocument();

    await user.type(screen.getByLabelText("Motivo de la decisión"), "Cupo lleno");
    await user.click(screen.getByRole("button", { name: "Guardar resultado" }));

    expect(mocks.cambiarResultadoAdmision).toHaveBeenCalledWith(7, {
      resultado: "no_aprobado",
      motivo_resultado: "Cupo lleno",
    });
    expect(await screen.findByText("Resultado de Lina Díaz: No aprobado.")).toBeInTheDocument();
  });

  it("borrar pregunta antes y, si se confirma, borra", async () => {
    const user = userEvent.setup();
    mocks.borrarAdmision.mockResolvedValue({ mensaje: "Admisión borrada", id: 7 });
    pintar();
    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));

    mocks.swalFire.mockResolvedValueOnce({ isConfirmed: false });
    await user.click(await screen.findByRole("button", { name: "Borrar aspirante" }));
    expect(mocks.borrarAdmision).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Borrar aspirante" }));

    expect(mocks.swalFire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "¿Borrar la admisión de Lina Díaz?" }),
    );
    await waitFor(() => expect(mocks.borrarAdmision).toHaveBeenCalledWith(7));
    expect(await screen.findByText("Se borró la admisión de Lina Díaz.")).toBeInTheDocument();
  });

  it("muestra tal cual el mensaje del backend cuando rechaza algo", async () => {
    const user = userEvent.setup();
    mocks.actualizarAdmision.mockRejectedValue({
      response: { data: { detail: "El año lectivo 2027 no está en preparación." } },
    });
    pintar();
    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));

    await user.click(await screen.findByRole("button", { name: "Guardar datos y entrevista" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El año lectivo 2027 no está en preparación.",
    );
  });

  it("si el backend dice que el año no es editable, no ofrece registrar", async () => {
    mocks.listarAdmisiones.mockResolvedValue({ ...LISTA, editable: false });

    pintar();

    const lista = await screen.findByRole("list", { name: "Aspirantes de 2027" });
    expect(within(lista).getByRole("listitem", { name: "Lina Díaz" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nuevo aspirante" })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Matricular desde la admisión (paso E5)
// ---------------------------------------------------------------------------

const APROBADO = {
  ...DETALLE,
  anio: 2027,
  resultado: "aprobado",
  fecha_nacimiento: "2019-03-04",
  colegio_anterior: "Colegio Uno",
};

const controlDe = (contenedor, etiqueta) =>
  within(contenedor)
    .getByText(etiqueta, { selector: "label" })
    .parentElement.querySelector("input, select, textarea");

async function abrirMatricula(user) {
  await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
  await user.click(await screen.findByRole("button", { name: "Matricular" }));
  return screen.findByRole("region", { name: "Matricular a Lina Díaz en 2027" });
}

describe("matricular desde la admisión (paso E5)", () => {
  beforeEach(() => {
    mocks.obtenerAdmision.mockResolvedValue(APROBADO);
  });

  it("abre la ficha del estudiante con los datos del aspirante y matricula", async () => {
    const user = userEvent.setup();
    mocks.matricularAdmision.mockResolvedValue({
      mensaje: "Matrícula creada en 2027 para Lina Díaz.",
      estudiante_id: 55,
      admision: { ...APROBADO, estudiante_id: 55, matriculada: true, editable: false },
    });
    pintar();

    const seccion = await abrirMatricula(user);

    expect(controlDe(seccion, "Nombre *")).toHaveValue("Lina");
    expect(controlDe(seccion, "Documento de Identidad *")).toHaveValue("2001");
    expect(controlDe(seccion, "Curso *")).toHaveValue("20");
    // Lo de la entrevista ya no se ve en la ficha (paso E6), pero viaja: ver abajo.
    expect(within(seccion).queryByText("Nombre Colegio Anterior")).not.toBeInTheDocument();
    expect(mocks.obtenerEstudiante).not.toHaveBeenCalled();

    await user.type(controlDe(seccion, "Dirección (calle o carrera y número)"), "Calle 9");
    await user.click(within(seccion).getByRole("button", { name: "Matricular en 2027" }));

    expect(mocks.matricularAdmision).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        nombre: "Lina",
        documento_identidad: "2001",
        curso_id: "20",
        direccion: "Calle 9",
        colegio_anterior: "Colegio Uno",
      }),
    );
    expect(await screen.findByText("Matrícula creada en 2027 para Lina Díaz.")).toBeInTheDocument();
    expect(screen.getByText("Matriculado. Esta admisión es de solo consulta.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Matricular a Lina Díaz en 2027" })).not.toBeInTheDocument();
    expect(mocks.listarAdmisiones).toHaveBeenCalledTimes(2);
  });

  it("para un exalumno la ficha parte de lo que ya tenía", async () => {
    const user = userEvent.setup();
    mocks.obtenerAdmision.mockResolvedValue({
      ...APROBADO,
      aviso_documento: { estudiante_id: 40, mensaje: "El documento 2001 ya es de un estudiante." },
    });
    mocks.obtenerEstudiante.mockResolvedValue({
      id: 40,
      estado: "retirado",
      nombre: "Lina",
      apellido: "Diaz",
      direccion: "Calle 1",
      curso_id: 4,
    });
    pintar();

    const seccion = await abrirMatricula(user);

    expect(mocks.obtenerEstudiante).toHaveBeenCalledWith(40);
    expect(controlDe(seccion, "Dirección (calle o carrera y número)")).toHaveValue("Calle 1");
    // Lo del aspirante va encima: su nombre y el curso de 2027.
    expect(controlDe(seccion, "Apellidos *")).toHaveValue("Díaz");
    expect(controlDe(seccion, "Curso *")).toHaveValue("20");
    expect(within(seccion).getByText(/se usa su mismo registro/)).toBeInTheDocument();
  });

  it("si el backend rechaza, muestra su mensaje y la ficha sigue abierta", async () => {
    const user = userEvent.setup();
    mocks.matricularAdmision.mockRejectedValue({
      response: { data: { detail: "Lina Díaz estudia en 2026: pásalo a 2027 desde la promoción (Matricular estudiantes)." } },
    });
    pintar();
    const seccion = await abrirMatricula(user);

    await user.click(within(seccion).getByRole("button", { name: "Matricular en 2027" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lina Díaz estudia en 2026: pásalo a 2027 desde la promoción (Matricular estudiantes).",
    );
    expect(screen.getByRole("region", { name: "Matricular a Lina Díaz en 2027" })).toBeInTheDocument();
  });

  it("cancelar vuelve a la ficha del aspirante sin matricular", async () => {
    const user = userEvent.setup();
    pintar();
    const seccion = await abrirMatricula(user);

    await user.click(within(seccion).getByRole("button", { name: "Cancelar" }));

    expect(mocks.matricularAdmision).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Matricular" })).toBeInTheDocument();
  });

});

describe("preguntas del anexo (paso E11)", () => {
  it("pide la lista de preguntas una sola vez al abrir la página", async () => {
    const user = userEvent.setup();
    pintar();

    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
    expect(await screen.findByRole("button", { name: /^Salud/ })).toBeInTheDocument();

    expect(mocks.obtenerCuestionarioAdmision).toHaveBeenCalledTimes(1);
  });

  it("guardar sin tocar las preguntas manda el cuerpo de siempre", async () => {
    const user = userEvent.setup();
    mocks.actualizarAdmision.mockResolvedValue(DETALLE);
    pintar();

    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
    await screen.findByRole("button", { name: /^Salud/ });
    await user.click(screen.getByRole("button", { name: "Guardar datos y entrevista" }));

    const [, cuerpo] = mocks.actualizarAdmision.mock.calls[0];
    expect("cuestionario" in cuerpo).toBe(false);
  });

  it("chulea una respuesta del anexo y la guarda con la entrevista", async () => {
    const user = userEvent.setup();
    mocks.actualizarAdmision.mockResolvedValue({
      ...DETALLE,
      cuestionario: { usa_panal: { respuesta: "no" } },
    });
    pintar();

    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
    await user.click(await screen.findByRole("button", { name: /^Salud/ }));
    const pregunta = screen.getByRole("group", { name: "18. ¿Usa pañal desechable?" });
    await user.click(within(pregunta).getByRole("radio", { name: "No" }));
    expect(within(pregunta).getByRole("radio", { name: "No" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Guardar datos y entrevista" }));

    expect(mocks.actualizarAdmision).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        nombre: "Lina",
        cuestionario: { usa_panal: { respuesta: "no" } },
      }),
    );
    expect(
      await screen.findByText("Se guardaron los datos y la entrevista de Lina Díaz."),
    ).toBeInTheDocument();
  });

  it("si la lista de preguntas no llega, lo demás de la entrevista se puede guardar", async () => {
    const user = userEvent.setup();
    mocks.obtenerCuestionarioAdmision.mockRejectedValue(new Error("red"));
    mocks.actualizarAdmision.mockResolvedValue(DETALLE);
    pintar();

    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
    expect(
      await screen.findByText(/No se pudieron cargar las preguntas del anexo/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar datos y entrevista" }));

    const [, cuerpo] = mocks.actualizarAdmision.mock.calls[0];
    expect("cuestionario" in cuerpo).toBe(false);
  });
});

describe("imprimir la entrevista (paso E12)", () => {
  it("imprime lo guardado, con todas las preguntas, y vuelve", async () => {
    const user = userEvent.setup();
    mocks.obtenerAdmision.mockResolvedValue({
      ...DETALLE,
      anio: 2027,
      cuestionario: { usa_panal: { respuesta: "no" } },
    });
    pintar();

    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
    await screen.findByRole("button", { name: /^Salud/ });
    await user.click(screen.getByRole("button", { name: "Imprimir entrevista" }));

    expect(screen.getByRole("heading", { name: "Entrevista de admisión" })).toBeInTheDocument();
    const panal = screen.getByRole("group", { name: "18. ¿Usa pañal desechable?" });
    expect(within(panal).getByRole("img", { name: "No, marcada" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "← Volver" }));
    expect(screen.queryByRole("heading", { name: "Entrevista de admisión" })).not.toBeInTheDocument();
  });

  it("con cambios sin guardar no imprime: pide guardar primero", async () => {
    const user = userEvent.setup();
    pintar();

    await user.click(await screen.findByRole("button", { name: "Abrir Lina Díaz" }));
    await user.type(await screen.findByLabelText("Quién entrevistó"), "R");
    await user.click(screen.getByRole("button", { name: "Imprimir entrevista" }));

    expect(
      await screen.findByText(
        "Guarda los cambios antes de imprimir: lo que se firma debe ser igual a lo guardado.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Entrevista de admisión" })).not.toBeInTheDocument();
  });
});
