import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAltaTenant from "./useAltaTenant";
import { opcionesVentanaExito } from "../ventanaExito";

const { serviceMock, swalFireMock, showValidationMessageMock } = vi.hoisted(() => ({
    serviceMock: { crearTenant: vi.fn() },
    swalFireMock: vi.fn(),
    showValidationMessageMock: vi.fn(),
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);
vi.mock("sweetalert2", () => ({
    default: { fire: swalFireMock, showValidationMessage: showValidationMessageMock },
}));

const CAMPOS = [
    ["tenant-nombre", "input"],
    ["tenant-codigo", "input"],
    ["tenant-admin-nombre", "input"],
    ["tenant-admin-email", "input"],
    ["tenant-admin-password", "input"],
    ["tenant-dias-gracia", "input"],
    ["tenant-fecha-inicio", "input"],
    ["tenant-fecha-pago", "input"],
    ["tenant-notas", "textarea"],
];

const VALORES_VALIDOS = {
    "tenant-nombre": "  Colegio Demo  ",
    "tenant-codigo": "  COLEGIO_DEMO  ",
    "tenant-admin-nombre": "  Administrador  ",
    "tenant-admin-email": "  ADMIN@Colegio.com  ",
    "tenant-admin-password": "Password123",
    "tenant-dias-gracia": "5",
    "tenant-fecha-inicio": "2026-08-07",
    "tenant-fecha-pago": "2026-09-07",
    "tenant-notas": "  Plan anual  ",
};

// El diálogo está simulado, así que la prueba monta los mismos campos que
// SweetAlert pintaría y ejecuta el `preConfirm` capturado.
const ejecutarPreConfirm = (valores) => {
    const configuracion = swalFireMock.mock.calls.at(-1)[0];
    const creados = CAMPOS.map(([id, etiqueta]) => {
        const campo = document.createElement(etiqueta);
        campo.id = id;
        campo.value = valores[id] ?? "";
        document.body.appendChild(campo);
        return campo;
    });

    try {
        return configuracion.preConfirm();
    } finally {
        creados.forEach((campo) => campo.remove());
    }
};

const agregarTenant = vi.fn();

describe("useAltaTenant", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        agregarTenant.mockClear();
        swalFireMock.mockResolvedValue({ isConfirmed: false });
        serviceMock.crearTenant.mockResolvedValue({ id: 4, nombre: "Colegio Demo" });
    });

    it("abre el formulario con las fechas del día", async () => {
        const { result } = renderHook(() => useAltaTenant(agregarTenant));

        await result.current.crearColegio();

        const configuracion = swalFireMock.mock.calls[0][0];
        expect(configuracion.title).toBe("Crear colegio");
        expect(configuracion.confirmButtonText).toBe("Crear colegio");
        expect(configuracion.html).toContain('id="tenant-nombre"');
        expect(configuracion.html).toContain('id="tenant-notas"');
        expect(configuracion.html).toMatch(/id="tenant-fecha-inicio"[^>]*value="\d{4}-\d{2}-\d{2}"/);
    });

    it("no registra nada cuando se cancela", async () => {
        const { result } = renderHook(() => useAltaTenant(agregarTenant));

        await result.current.crearColegio();

        expect(serviceMock.crearTenant).not.toHaveBeenCalled();
        expect(agregarTenant).not.toHaveBeenCalled();
    });

    it("normaliza el payload en el preConfirm", async () => {
        const { result } = renderHook(() => useAltaTenant(agregarTenant));

        await result.current.crearColegio();

        expect(ejecutarPreConfirm(VALORES_VALIDOS)).toEqual({
            nombre: "Colegio Demo",
            codigo: "colegio_demo",
            admin_nombre: "Administrador",
            admin_email: "admin@colegio.com",
            admin_password: "Password123",
            fecha_inicio: "2026-08-07",
            fecha_proximo_pago: "2026-09-07",
            dias_gracia: 5,
            notas: "Plan anual",
        });
        expect(showValidationMessageMock).not.toHaveBeenCalled();
    });

    it("bloquea el envío y avisa cuando el formulario es inválido", async () => {
        const { result } = renderHook(() => useAltaTenant(agregarTenant));

        await result.current.crearColegio();

        expect(ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-nombre": "  " })).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "Completa colegio, codigo y admin inicial.",
        );
    });

    it("registra el colegio confirmado y lo agrega a la lista", async () => {
        const payload = { nombre: "Colegio Demo", codigo: "colegio_demo" };
        const creado = { id: 4, nombre: "Colegio Demo" };
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: payload });
        serviceMock.crearTenant.mockResolvedValue(creado);

        const { result } = renderHook(() => useAltaTenant(agregarTenant));

        await result.current.crearColegio();

        expect(serviceMock.crearTenant).toHaveBeenCalledWith(payload);
        expect(agregarTenant).toHaveBeenCalledWith(creado);
        expect(swalFireMock).toHaveBeenLastCalledWith(opcionesVentanaExito({ title: "Colegio creado", text: "Colegio Demo ya puede iniciar sesion." }));
    });

    it("muestra el detalle del backend y no toca la lista cuando falla", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: { nombre: "X" } });
        serviceMock.crearTenant.mockRejectedValue({
            response: { data: { detail: "El codigo ya existe." } },
        });

        const { result } = renderHook(() => useAltaTenant(agregarTenant));

        await result.current.crearColegio();

        expect(agregarTenant).not.toHaveBeenCalled();
        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "error",
            title: "No se pudo crear",
            text: "El codigo ya existe.",
        });
    });
});
