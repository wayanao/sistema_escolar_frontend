import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const mocks = vi.hoisted(() => ({
  useEstadoTenant: vi.fn(),
  listarAniosLectivos: vi.fn(),
}));

vi.mock("./pages/Login", () => ({
  default: () => <div data-testid="pagina-login">Login</div>,
}));
vi.mock("./pages/DashboardProfesor", () => ({
  default: () => <div data-testid="dashboard-profesor">Dashboard profesor</div>,
}));
vi.mock("./pages/AdminDashboard", () => ({
  default: () => <div data-testid="dashboard-admin">Dashboard admin</div>,
}));
vi.mock("./pages/AniosLectivosAdmin", () => ({
  default: () => <div data-testid="anios-lectivos-admin">Años lectivos</div>,
}));
vi.mock("./pages/SuperAdminDashboard", () => ({
  default: () => <div data-testid="dashboard-super-admin">Dashboard super admin</div>,
}));
vi.mock("./pages/CambiarPassword", () => ({
  default: () => <div data-testid="cambiar-password">Cambiar password</div>,
}));
vi.mock("./pages/Planilla", () => ({
  default: () => <div data-testid="pagina-planilla">Planilla</div>,
}));
vi.mock("./pages/Observador", () => ({
  default: () => <div data-testid="pagina-observador">Observador</div>,
}));
vi.mock("./components/autenticacion/NavProfesorView", () => ({
  default: () => <div data-testid="nav-profesor">Nav profesor</div>,
}));
vi.mock("./components/autenticacion/NavAdminView", () => ({
  default: () => <div data-testid="nav-admin">Nav admin</div>,
}));
vi.mock("./components/autenticacion/NavSuperAdminView", () => ({
  default: () => <div data-testid="nav-super-admin">Nav super admin</div>,
}));
vi.mock("./components/autenticacion/TenantStatusBannerView", () => ({
  default: () => <div data-testid="tenant-status">Estado tenant</div>,
}));
vi.mock("./hooks/autenticacion/useEstadoTenant", () => ({
  useEstadoTenant: mocks.useEstadoTenant,
}));
// El layout del admin pide la lista de años al montarse: aquí nunca sale a la
// red.
vi.mock("./services/aniosLectivosApi", () => ({
  listarAniosLectivos: mocks.listarAniosLectivos,
}));

function guardarSesion(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

function renderApp(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  );
}

describe("rutas de autenticacion y sesion", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.useEstadoTenant.mockReset();
    mocks.useEstadoTenant.mockReturnValue(null);
    mocks.listarAniosLectivos.mockReset();
    mocks.listarAniosLectivos.mockResolvedValue([{ id: 1, anio: 2026, estado: "activo" }]);
  });

  it("mantiene /login publica aunque exista una sesion", () => {
    guardarSesion("usuario", { id: 1, rol: "admin" });

    renderApp("/login");

    expect(screen.getByTestId("pagina-login")).toBeInTheDocument();
    expect(mocks.useEstadoTenant).not.toHaveBeenCalled();
  });

  it("mantiene /login aislada aunque una identidad tenga JSON corrupto", () => {
    localStorage.setItem("usuario", "no-es-json");

    renderApp("/login");

    expect(screen.getByTestId("pagina-login")).toBeInTheDocument();
  });

  it("redirige el layout general a /login cuando no hay usuario ni profesor", async () => {
    renderApp("/");

    expect(await screen.findByTestId("pagina-login")).toBeInTheDocument();
    expect(mocks.useEstadoTenant).not.toHaveBeenCalled();
  });

  it("compone el layout de profesor para una sesion profesor", async () => {
    guardarSesion("profesor", { id: 7, rol: "profesor" });

    renderApp("/");

    expect(screen.getByTestId("nav-profesor")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-status")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard-profesor")).toBeInTheDocument();
    expect(mocks.useEstadoTenant).toHaveBeenCalledTimes(1);
  });

  it("manda el observador viejo al nuevo, sin dejar a nadie en blanco", async () => {
    // Se oculto el 2026-09-10. La direccion se conserva a proposito: quien la
    // tuviera guardada llega a donde queria ir. El codigo de la pantalla vieja
    // sigue entero; retirarlo es la fase 4.
    guardarSesion("profesor", { id: 7, rol: "profesor" });

    renderApp("/Formulario");

    expect(await screen.findByTestId("pagina-observador")).toBeInTheDocument();
  });

  it("compone el layout admin solo cuando usuario tiene el rol admin", async () => {
    guardarSesion("usuario", { id: 3, rol: "admin", debe_cambiar_password: false });

    renderApp("/dashboard-admin");

    expect(screen.getByTestId("nav-admin")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard-admin")).toBeInTheDocument();
  });

  it("protege la pantalla de años lectivos como ruta de administrador", async () => {
    guardarSesion("usuario", { id: 3, rol: "admin", debe_cambiar_password: false });

    renderApp("/admin/anios-lectivos");

    expect(await screen.findByTestId("anios-lectivos-admin")).toBeInTheDocument();
  });

  it("redirige una ruta admin a /login para una sesion profesor", async () => {
    guardarSesion("profesor", { id: 7, rol: "profesor" });

    renderApp("/dashboard-admin");

    expect(await screen.findByTestId("pagina-login")).toBeInTheDocument();
  });

  it("prioriza el cambio de password temporal sobre las rutas protegidas", async () => {
    guardarSesion("usuario", { id: 3, rol: "admin", debe_cambiar_password: true });

    renderApp("/dashboard-admin");

    expect(await screen.findByTestId("cambiar-password")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-admin")).not.toBeInTheDocument();
    expect(mocks.useEstadoTenant).toHaveBeenCalledTimes(1);
  });

  it("envia a /dashboard-admin al admin que ya completo el cambio de password", async () => {
    guardarSesion("usuario", { id: 3, rol: "admin", debe_cambiar_password: false });

    renderApp("/cambiar-password");

    expect(await screen.findByTestId("dashboard-admin")).toBeInTheDocument();
  });

  it("rechaza /cambiar-password cuando no existe un admin valido", async () => {
    guardarSesion("profesor", { id: 7, rol: "profesor" });

    renderApp("/cambiar-password");

    expect(await screen.findByTestId("pagina-login")).toBeInTheDocument();
  });

  it("solo permite /super-admin con la clave y el rol exactos", async () => {
    guardarSesion("super_admin", { id: 9, rol: "super_admin" });

    renderApp("/super-admin");

    expect(screen.getByTestId("nav-super-admin")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard-super-admin")).toBeInTheDocument();
    expect(mocks.useEstadoTenant).not.toHaveBeenCalled();
  });

  it("aísla /super-admin de identidades generales corruptas", async () => {
    guardarSesion("super_admin", { id: 9, rol: "super_admin" });
    localStorage.setItem("usuario", "no-es-json");
    localStorage.setItem("profesor", "tampoco-es-json");

    renderApp("/super-admin");

    expect(await screen.findByTestId("dashboard-super-admin")).toBeInTheDocument();
  });

  it("evalua /cambiar-password sin leer profesor ni super admin", async () => {
    guardarSesion("usuario", { id: 3, rol: "admin", debe_cambiar_password: true });
    localStorage.setItem("profesor", "no-es-json");
    localStorage.setItem("super_admin", "tampoco-es-json");

    renderApp("/cambiar-password");

    expect(await screen.findByTestId("cambiar-password")).toBeInTheDocument();
  });

  it("no usa super_admin como sesion del layout general", async () => {
    guardarSesion("super_admin", { id: 9, rol: "super_admin" });

    renderApp("/");

    expect(await screen.findByTestId("pagina-login")).toBeInTheDocument();
  });

  it("prioriza el cambio de password temporal tambien en una ruta general", async () => {
    guardarSesion("usuario", { id: 3, rol: "admin", debe_cambiar_password: true });

    renderApp("/planilla");

    expect(await screen.findByTestId("cambiar-password")).toBeInTheDocument();
    expect(screen.queryByTestId("pagina-planilla")).not.toBeInTheDocument();
  });

  it("rechaza el objeto super_admin cuando el rol no es exacto", async () => {
    guardarSesion("super_admin", { id: 9, rol: "admin" });

    renderApp("/super-admin");

    expect(await screen.findByTestId("pagina-login")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-super-admin")).not.toBeInTheDocument();
  });

  it("conserva navegacion y banner sin contenido para una ruta desconocida", () => {
    guardarSesion("profesor", { id: 7, rol: "profesor" });

    const { container } = renderApp("/ruta-desconocida");

    expect(screen.getByTestId("nav-profesor")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-status")).toBeInTheDocument();
    expect(container.querySelector("main")).toBeEmptyDOMElement();
  });

  it("conserva que un usuario no admin entra al layout con navegacion de profesor", async () => {
    guardarSesion("usuario", { id: 11, rol: "auditor" });

    renderApp("/");

    expect(screen.getByTestId("nav-profesor")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard-profesor")).toBeInTheDocument();
  });
});
