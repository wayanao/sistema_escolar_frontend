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
  obtenerAdmision: vi.fn(),
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
  obtenerAdmision: mocks.obtenerAdmision,
  registrarAdmision: mocks.registrarAdmision,
}));
vi.mock("../services/cursosApi", () => ({
  listarCursos: mocks.listarCursos,
}));
vi.mock("sweetalert2", () => ({
  default: { fire: mocks.swalFire },
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
  mocks.swalFire.mockResolvedValue({ isConfirmed: true });
});

describe("AdmisionesAdmin", () => {
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
