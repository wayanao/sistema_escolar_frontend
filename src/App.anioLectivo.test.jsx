import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const mocks = vi.hoisted(() => ({
  listarAniosLectivos: vi.fn(),
  montajesPagina: vi.fn(),
}));

// En el paso 4.1 ninguna pantalla real sigue el año todavía. Aquí
// "/admin/estudiantes" hace de pantalla del año para probar el mecanismo
// completo: proveedor, selector, aviso y reinicio de la página.
vi.mock("./utils/anioLectivo", async (importOriginal) => ({
  ...(await importOriginal()),
  RUTAS_POR_ANIO: [{ ruta: "/admin/estudiantes" }],
}));

vi.mock("./pages/EstudiantesAdmin", async () => {
  const { useEffect } = await import("react");
  const { Link } = await import("react-router-dom");
  const { default: useAnioLectivo } = await import("./hooks/anioLectivo/useAnioLectivo");

  return {
    default: function PantallaDelAnio() {
      const { parametros } = useAnioLectivo();

      useEffect(() => {
        mocks.montajesPagina();
      }, []);

      return (
        <div>
          <p data-testid="parametros">{JSON.stringify(parametros)}</p>
          <Link to="/dashboard-admin">Ir al inicio</Link>
        </div>
      );
    },
  };
});
vi.mock("./pages/AdminDashboard", async () => {
  const { Link } = await import("react-router-dom");

  return {
    default: () => (
      <div data-testid="dashboard-admin">
        <Link to="/admin/estudiantes">Ir a estudiantes</Link>
      </div>
    ),
  };
});
vi.mock("./pages/Login", () => ({
  default: () => <div data-testid="pagina-login">Login</div>,
}));
// El admin trabaja dentro del menú lateral: el doble pinta también la página.
vi.mock("./components/autenticacion/MenuLateralView", () => ({
  default: ({ renderSelectorAnio, children }) => (
    <>
      <div data-testid="nav-admin">{renderSelectorAnio?.()}</div>
      {children}
    </>
  ),
}));
vi.mock("./components/autenticacion/TenantStatusBannerView", () => ({
  default: () => null,
}));
vi.mock("./hooks/autenticacion/useEstadoTenant", () => ({
  useEstadoTenant: () => null,
}));
vi.mock("./hooks/autenticacion/useCerrarSesion", () => ({
  useCerrarSesion: () => () => {},
}));
vi.mock("./services/aniosLectivosApi", () => ({
  listarAniosLectivos: mocks.listarAniosLectivos,
}));

const ANIO_2027 = { id: 2, anio: 2027, estado: "preparacion" };
const ANIO_2026 = { id: 1, anio: 2026, estado: "activo" };

function renderApp(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  );
}

describe("año lectivo en el layout del admin", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "usuario",
      JSON.stringify({ id: 3, rol: "admin", debe_cambiar_password: false }),
    );
    mocks.listarAniosLectivos.mockReset();
    mocks.montajesPagina.mockReset();
  });

  it("con un solo año no se ve nada y la pantalla pide lo de siempre", async () => {
    mocks.listarAniosLectivos.mockResolvedValue([ANIO_2026]);

    renderApp("/admin/estudiantes");

    expect(await screen.findByTestId("parametros")).toHaveTextContent("{}");
    await waitFor(() => expect(mocks.listarAniosLectivos).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(screen.queryByRole("combobox", { name: "Año lectivo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(mocks.montajesPagina).toHaveBeenCalledTimes(1);
  });

  it("al elegir otro año la pantalla empieza de cero con ese año, y al volver otra vez", async () => {
    const user = userEvent.setup();
    mocks.listarAniosLectivos.mockResolvedValue([ANIO_2027, ANIO_2026]);

    renderApp("/admin/estudiantes");

    const selector = await screen.findByRole("combobox", { name: "Año lectivo" });
    expect(selector).toHaveValue("1");
    expect(screen.getByTestId("parametros")).toHaveTextContent("{}");
    // Cargar la lista de años no reinicia la pantalla.
    expect(mocks.montajesPagina).toHaveBeenCalledTimes(1);

    await user.selectOptions(selector, "2");

    expect(screen.getByRole("status")).toHaveTextContent("Estás preparando el año 2027.");
    expect(screen.getByTestId("parametros")).toHaveTextContent('{"anio_lectivo_id":2}');
    expect(mocks.montajesPagina).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "Volver a 2026" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTestId("parametros")).toHaveTextContent("{}");
    expect(screen.getByRole("combobox", { name: "Año lectivo" })).toHaveValue("1");
    expect(mocks.montajesPagina).toHaveBeenCalledTimes(3);
    expect(mocks.listarAniosLectivos).toHaveBeenCalledTimes(1);
  });

  it("en una pantalla que no sigue el año no hay selector ni aviso, y al volver el año sigue elegido", async () => {
    const user = userEvent.setup();
    mocks.listarAniosLectivos.mockResolvedValue([ANIO_2027, ANIO_2026]);

    renderApp("/admin/estudiantes");
    await user.selectOptions(await screen.findByRole("combobox", { name: "Año lectivo" }), "2");

    await user.click(screen.getByRole("link", { name: "Ir al inicio" }));

    expect(await screen.findByTestId("dashboard-admin")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Año lectivo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Ir a estudiantes" }));

    expect(await screen.findByTestId("parametros")).toHaveTextContent('{"anio_lectivo_id":2}');
    expect(screen.getByRole("combobox", { name: "Año lectivo" })).toHaveValue("2");
    expect(screen.getByRole("status")).toHaveTextContent("Estás preparando el año 2027.");
  });
});
