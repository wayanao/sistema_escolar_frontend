import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const mocks = vi.hoisted(() => ({
  cerrarSesion: vi.fn(),
  onNavigate: vi.fn(),
  useCerrarSesion: vi.fn(),
  useEstadoTenant: vi.fn(),
  navAdmin: vi.fn(),
  navProfesor: vi.fn(),
  navSuperAdmin: vi.fn(),
  tenantView: vi.fn(),
  notificaciones: vi.fn(),
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
vi.mock("./pages/SuperAdminDashboard", () => ({
  default: () => <div data-testid="dashboard-super-admin">Dashboard super admin</div>,
}));
vi.mock("./pages/CambiarPassword", () => ({
  default: () => <div data-testid="cambiar-password">Cambiar password</div>,
}));

vi.mock("./hooks/autenticacion/useCerrarSesion", () => ({
  useCerrarSesion: mocks.useCerrarSesion,
}));
vi.mock("./hooks/autenticacion/useEstadoTenant", () => ({
  useEstadoTenant: mocks.useEstadoTenant,
}));

vi.mock("./components/autenticacion/NavAdminView", () => ({
  default: (props) => {
    mocks.navAdmin(props);
    return (
      <div data-testid="nav-admin">
        <button type="button" onClick={props.onCerrarSesion}>Cerrar sesión admin</button>
        {props.renderNotificaciones(mocks.onNavigate)}
      </div>
    );
  },
}));
vi.mock("./components/autenticacion/NavProfesorView", () => ({
  default: (props) => {
    mocks.navProfesor(props);
    return (
      <div data-testid="nav-profesor">
        <button type="button" onClick={props.onCerrarSesion}>Cerrar sesión profesor</button>
        {props.renderNotificaciones(mocks.onNavigate)}
      </div>
    );
  },
}));
vi.mock("./components/autenticacion/NavSuperAdminView", () => ({
  default: (props) => {
    mocks.navSuperAdmin(props);
    return (
      <div data-testid="nav-super-admin">
        <span>{props.nombre}</span>
        <button type="button" onClick={props.onCerrarSesion}>Cerrar sesión super admin</button>
      </div>
    );
  },
}));
vi.mock("./components/autenticacion/TenantStatusBannerView", () => ({
  default: ({ aviso }) => {
    mocks.tenantView(aviso);
    return aviso ? <div data-testid="tenant-status">{aviso.mensaje}</div> : null;
  },
}));
vi.mock("./components/planeaciones/NotificacionesPlaneadores", () => ({
  default: (props) => {
    mocks.notificaciones(props);
    return <div data-testid={`notificaciones-${props.rol}`} />;
  },
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

describe("composicion de autenticacion y navegacion", () => {
  const aviso = {
    mostrar_aviso: true,
    mensaje: "El pago vence hoy.",
    estado: "en_mora",
  };

  beforeEach(() => {
    localStorage.clear();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.useCerrarSesion.mockReturnValue(mocks.cerrarSesion);
    mocks.useEstadoTenant.mockReturnValue(aviso);
  });

  it("conecta la sesion admin con su vista, notificaciones, tenant y logout", async () => {
    const user = userEvent.setup();
    guardarSesion("usuario", { id: 3, rol: "admin", debe_cambiar_password: false });

    const { container } = renderApp("/dashboard-admin");

    expect(await screen.findByTestId("dashboard-admin")).toBeInTheDocument();
    const propsNavegacion = mocks.navAdmin.mock.calls.at(-1)[0];
    expect(propsNavegacion.onCerrarSesion).toBe(mocks.cerrarSesion);
    expect(propsNavegacion.renderNotificaciones).toEqual(expect.any(Function));
    expect(mocks.navProfesor).not.toHaveBeenCalled();
    expect(mocks.notificaciones).toHaveBeenCalledWith({
      rol: "admin",
      onNavigate: mocks.onNavigate,
    });
    expect(mocks.tenantView).toHaveBeenCalledWith(aviso);

    const nav = screen.getByTestId("nav-admin");
    const banner = screen.getByTestId("tenant-status");
    const main = container.querySelector("main");
    expect(nav.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión admin" }));
    expect(mocks.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("conecta la sesion profesor con su vista y el rol externo exacto", async () => {
    const user = userEvent.setup();
    guardarSesion("profesor", { id: 7, rol: "profesor" });

    renderApp("/");

    expect(await screen.findByTestId("dashboard-profesor")).toBeInTheDocument();
    const propsNavegacion = mocks.navProfesor.mock.calls.at(-1)[0];
    expect(propsNavegacion.onCerrarSesion).toBe(mocks.cerrarSesion);
    expect(propsNavegacion.renderNotificaciones).toEqual(expect.any(Function));
    expect(mocks.navAdmin).not.toHaveBeenCalled();
    expect(mocks.notificaciones).toHaveBeenCalledWith({
      rol: "profesor",
      onNavigate: mocks.onNavigate,
    });

    await user.click(screen.getByRole("button", { name: "Cerrar sesión profesor" }));
    expect(mocks.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("conecta identidad y logout solo dentro del layout super admin autorizado", async () => {
    const user = userEvent.setup();
    guardarSesion("super_admin", {
      id: 9,
      rol: "super_admin",
      nombre: "Soporte Auligo",
    });

    renderApp("/super-admin");

    expect(await screen.findByTestId("dashboard-super-admin")).toBeInTheDocument();
    expect(mocks.navSuperAdmin).toHaveBeenCalledWith({
      nombre: "Soporte Auligo",
      onCerrarSesion: mocks.cerrarSesion,
    });
    expect(mocks.useEstadoTenant).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión super admin" }));
    expect(mocks.cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("no monta comandos ni tenant cuando el layout general rechaza la sesion", async () => {
    renderApp("/");

    expect(await screen.findByTestId("pagina-login")).toBeInTheDocument();
    expect(mocks.useCerrarSesion).not.toHaveBeenCalled();
    expect(mocks.useEstadoTenant).not.toHaveBeenCalled();
    expect(mocks.navAdmin).not.toHaveBeenCalled();
    expect(mocks.navProfesor).not.toHaveBeenCalled();
  });
});
